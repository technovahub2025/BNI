import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { MessageSquare, Send, ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { ScrollArea } from "../components/ui/scroll-area";
import { apiGet, apiPatch, apiPost, formatRelativeTime, getInitials } from "../lib/api";

type InboxThread = {
  _id: string;
  body: string;
  createdAt: string;
  leadId?: {
    _id: string;
    name: string;
    phone: string;
    status: string;
    score: number;
    stage: string | null;
  };
};

type ThreadResponse = {
  lead: {
    _id: string;
    name: string;
    phone: string;
    status: string;
    score: number;
    stage: string | null;
  };
  messages: Array<{
    _id: string;
    direction: "inbound" | "outbound";
    body: string;
    createdAt: string;
  }>;
};

type Template = {
  _id: string;
  name: string;
  active: boolean;
};

export function InboxPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [threads, setThreads] = useState<InboxThread[]>([]);
  const [threadData, setThreadData] = useState<ThreadResponse | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [draft, setDraft] = useState("");
  const [notes, setNotes] = useState("");

  const selectedLeadId = searchParams.get("leadId");

  useEffect(() => {
    const controller = new AbortController();

    void Promise.all([
      apiGet<InboxThread[]>("/inbox", controller.signal),
      apiGet<Template[]>("/templates", controller.signal),
    ])
      .then(([inboxThreads, allTemplates]) => {
        setThreads(inboxThreads);
        setTemplates(allTemplates);

        if (!selectedLeadId && inboxThreads[0]?.leadId?._id) {
          setSearchParams({ leadId: inboxThreads[0].leadId._id }, { replace: true });
        }
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, [selectedLeadId, setSearchParams]);

  useEffect(() => {
    if (!selectedLeadId) return;

    const controller = new AbortController();

    apiGet<ThreadResponse>(`/inbox/${selectedLeadId}`, controller.signal)
      .then(setThreadData)
      .catch(() => undefined);

    return () => controller.abort();
  }, [selectedLeadId]);

  const unreadCount = threads.length;
  const selectedLead = threadData?.lead;
  const selectedTemplateName = useMemo(
    () => templates.find((template) => template.active)?.name || "template_1",
    [templates]
  );

  const handleSend = async () => {
    if (!selectedLead || !draft.trim()) return;

    await apiPost("/send", {
      leadId: selectedLead._id,
      templateName: selectedTemplateName,
      bodyFallback: draft.trim(),
    });

    setDraft("");
    const refreshed = await apiGet<ThreadResponse>(`/inbox/${selectedLead._id}`);
    setThreadData(refreshed);
  };

  const handleStatusChange = async (status: "qualified" | "unqualified") => {
    if (!selectedLead) return;
    await apiPatch(`/leads/${selectedLead._id}`, { status });
    const refreshed = await apiGet<ThreadResponse>(`/inbox/${selectedLead._id}`);
    setThreadData(refreshed);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-slate-900">Reply Operations</h1>
        <p className="text-slate-500 mt-1">Manage and respond to lead replies</p>
      </div>

      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-220px)]">
        <div className="col-span-3">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">Unread Replies ({unreadCount})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-320px)]">
                {threads.map((reply, index) => {
                  const leadId = reply.leadId?._id || reply._id;
                  const isSelected = leadId === selectedLeadId;

                  return (
                    <div key={reply._id} className={`p-4 border-b border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors ${isSelected || (!selectedLeadId && index === 0) ? "bg-indigo-50 border-l-4 border-l-indigo-600" : ""}`} onClick={() => setSearchParams({ leadId })}>
                      <div className="flex items-start gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-indigo-100 text-indigo-600 text-sm">
                            {getInitials(reply.leadId?.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-medium text-slate-900 truncate">{reply.leadId?.name || "Unknown Lead"}</p>
                            <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
                          </div>
                          <p className="text-sm text-slate-600 line-clamp-2 mb-1">{reply.body || "No preview available"}</p>
                          <p className="text-xs text-slate-400">{formatRelativeTime(reply.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-6">
          <Card className="h-full flex flex-col">
            <CardHeader className="border-b border-slate-200">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-indigo-100 text-indigo-600 text-sm">
                    {getInitials(selectedLead?.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium text-slate-900">{selectedLead?.name || "Select a lead"}</h3>
                  <p className="text-sm text-slate-500">{selectedLead?.phone || "-"}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 flex flex-col">
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-4">
                  {(threadData?.messages || []).map((message) => (
                    <div key={message._id} className={`flex ${message.direction === "inbound" ? "justify-start" : "justify-end"}`}>
                      <div className={`max-w-[70%] rounded-lg p-3 ${message.direction === "inbound" ? "bg-white border border-slate-200" : "bg-indigo-600 text-white"}`}>
                        <p className="text-sm whitespace-pre-line">{message.body || "Template message sent"}</p>
                        <p className={`text-xs mt-2 ${message.direction === "inbound" ? "text-slate-400" : "text-indigo-200"}`}>
                          {new Date(message.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="border-t border-slate-200 p-4">
                <div className="flex gap-2">
                  <Input placeholder="Type your message..." className="flex-1" value={draft} onChange={(event) => setDraft(event.target.value)} />
                  <Button size="icon" className="bg-indigo-600 hover:bg-indigo-700" onClick={handleSend} disabled={!selectedLead}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-3">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Lead Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Name</p>
                  <p className="font-medium text-slate-900">{selectedLead?.name || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Phone</p>
                  <p className="font-medium text-slate-900">{selectedLead?.phone || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Status</p>
                  <Badge className="bg-green-100 text-green-700">{formatStatus(selectedLead?.status)}</Badge>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Score</p>
                  <p className="text-2xl font-semibold text-green-600">{selectedLead?.score ?? 0}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Stage</p>
                  <p className="font-medium text-slate-900">{formatStage(selectedLead?.stage)}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full gap-2" onClick={handleSend} disabled={!selectedLead || !draft.trim()}>
                  <MessageSquare className="w-4 h-4" />
                  Send Template
                </Button>
                <Button className="w-full gap-2 bg-green-600 hover:bg-green-700" onClick={() => handleStatusChange("qualified")} disabled={!selectedLead}>
                  <ThumbsUp className="w-4 h-4" />
                  Qualify Lead
                </Button>
                <Button variant="outline" className="w-full gap-2 text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleStatusChange("unqualified")} disabled={!selectedLead}>
                  <ThumbsDown className="w-4 h-4" />
                  Unqualify
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Internal Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea rows={4} placeholder="Add notes about this lead..." className="mb-3" value={notes} onChange={(event) => setNotes(event.target.value)} />
                <Button variant="outline" className="w-full">Save Note</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatStatus(status?: string | null) {
  if (!status) return "New";
  return status.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatStage(stage?: string | null) {
  if (!stage) return "-";
  return stage.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}
