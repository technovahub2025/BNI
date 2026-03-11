import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Upload, Workflow, Download, History, Search, MoreVertical, Play, Trash2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../components/ui/dropdown-menu";
import { apiDelete, apiGet, apiPost, toQuery, formatDateTime } from "../lib/api";

type Lead = {
  _id: string;
  name: string;
  phone: string;
  status: string;
  score: number;
  stage: string | null;
  lastOutbound?: { createdAt?: string };
  lastInbound?: { createdAt?: string };
  activeRun?: { _id: string } | null;
};

export function LeadsPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [minScore, setMinScore] = useState("");
  const [maxScore, setMaxScore] = useState("");
  const [activity, setActivity] = useState("all");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      void apiGet<Lead[]>(
        `/leads${toQuery({
          search,
          status: status === "all" ? undefined : status,
          minScore,
          maxScore,
          lastActivity: activity === "all" ? undefined : activity,
        })}`,
        controller.signal
      )
        .then(setLeads)
        .catch(() => undefined);
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [search, status, minScore, maxScore, activity, refreshKey]);

  const refreshLeads = () => setRefreshKey((value) => value + 1);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    await apiPost("/leads/upload", formData, true);
    event.target.value = "";
    refreshLeads();
  };

  const handleStartAutomation = async (leadId: string) => {
    await apiPost(`/workflows/start/${leadId}`);
    refreshLeads();
  };

  const handleDelete = async (leadId: string) => {
    if (!window.confirm("Delete this lead?")) return;
    await apiDelete(`/leads/${leadId}`);
    refreshLeads();
  };

  const handleExport = () => {
    const header = ["Lead Name", "Phone", "Status", "Score", "Stage", "Last Message", "Last Reply"];
    const rows = leads.map((lead) => [
      lead.name,
      lead.phone,
      formatLeadStatus(lead.status),
      String(lead.score ?? 0),
      formatStage(lead.stage),
      formatDateTime(lead.lastOutbound?.createdAt),
      formatDateTime(lead.lastInbound?.createdAt),
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "leads.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Lead Workspace</h1>
          <p className="text-slate-500 mt-1">Manage and track all your leads in one place</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <History className="w-4 h-4" />
            Import History
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleExport}>
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button variant="outline" className="gap-2 bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100" onClick={() => leads[0] && handleStartAutomation(leads[0]._id)} disabled={!leads.length}>
            <Workflow className="w-4 h-4" />
            Start Automation
          </Button>
          <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700" onClick={handleUploadClick}>
            <Upload className="w-4 h-4" />
            Upload CSV
          </Button>
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input placeholder="Search leads..." className="pl-10" value={search} onChange={(event) => setSearch(event.target.value)} />
              </div>
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="nurturing">Nurturing</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="unqualified">Unqualified</SelectItem>
                <SelectItem value="no_response">No Response</SelectItem>
              </SelectContent>
            </Select>
            <Input type="number" placeholder="Min Score" value={minScore} onChange={(event) => setMinScore(event.target.value)} />
            <Input type="number" placeholder="Max Score" value={maxScore} onChange={(event) => setMaxScore(event.target.value)} />
            <Select value={activity} onValueChange={setActivity}>
              <SelectTrigger>
                <SelectValue placeholder="Activity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activity</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Leads ({leads.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Last Message</TableHead>
                <TableHead>Last Reply</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => {
                const statusLabel = formatLeadStatus(lead.status);

                return (
                  <TableRow key={lead._id}>
                    <TableCell className="font-medium">{lead.name}</TableCell>
                    <TableCell className="text-slate-600">{lead.phone}</TableCell>
                    <TableCell>
                      <Badge variant={statusLabel === "Qualified" ? "default" : statusLabel === "Nurturing" ? "secondary" : "outline"} className={statusLabel === "Qualified" ? "bg-green-100 text-green-700 hover:bg-green-100" : statusLabel === "Nurturing" ? "bg-blue-100 text-blue-700 hover:bg-blue-100" : "bg-slate-100 text-slate-700 hover:bg-slate-100"}>
                        {statusLabel}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={`font-medium ${lead.score >= 80 ? "text-green-600" : lead.score >= 60 ? "text-blue-600" : "text-slate-600"}`}>
                        {lead.score}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-600">{formatStage(lead.stage)}</TableCell>
                    <TableCell className="text-slate-600 text-sm">{formatDateTime(lead.lastOutbound?.createdAt)}</TableCell>
                    <TableCell className="text-slate-600 text-sm">{formatDateTime(lead.lastInbound?.createdAt)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/inbox?leadId=${lead._id}`)}>
                            <Search className="w-4 h-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStartAutomation(lead._id)}>
                            <Play className="w-4 h-4 mr-2" />
                            Start Automation
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(lead._id)}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function formatLeadStatus(status?: string | null) {
  switch (status) {
    case "qualified":
      return "Qualified";
    case "nurturing":
      return "Nurturing";
    case "unqualified":
      return "Unqualified";
    case "no_response":
      return "No Response";
    case "new":
    default:
      return "New";
  }
}

function formatStage(stage?: string | null) {
  if (!stage) return "-";
  return stage.charAt(0).toUpperCase() + stage.slice(1);
}
