import { useEffect, useMemo, useState } from "react";
import { Copy, ExternalLink, MoreVertical, Eye, CheckCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../components/ui/dropdown-menu";
import { apiGet, apiPatch, formatDateTime } from "../lib/api";

type Lead = {
  _id: string;
  name: string;
  phone: string;
  stage: string | null;
  customFields?: {
    application?: {
      email?: string;
      city?: string;
      submittedAt?: string;
    };
  };
};

export function MembershipPage() {
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    const controller = new AbortController();

    apiGet<Lead[]>("/leads", controller.signal)
      .then(setLeads)
      .catch(() => undefined);

    return () => controller.abort();
  }, []);

  const applicationLink = `${window.location.origin}/bni/apply`;
  const applications = useMemo(
    () =>
      leads
        .filter((lead) => lead.customFields?.application)
        .map((lead) => ({
          id: lead._id,
          name: lead.name,
          phone: lead.phone,
          email: lead.customFields?.application?.email || "-",
          city: lead.customFields?.application?.city || "-",
          submittedAt: formatDateTime(lead.customFields?.application?.submittedAt),
          status:
            lead.stage === "onboarding"
              ? "Approved"
              : lead.stage === "conversation"
              ? "In Review"
              : "Pending Review",
        })),
    [leads]
  );

  const pendingCount = applications.filter((item) => item.status === "Pending Review").length;
  const inReviewCount = applications.filter((item) => item.status === "In Review").length;
  const approvedCount = applications.filter((item) => item.status === "Approved").length;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(applicationLink);
  };

  const handleViewDetails = (applicationId: string) => {
    const lead = leads.find((item) => item._id === applicationId);
    if (!lead?.customFields?.application) return;

    const application = lead.customFields.application;
    window.alert(
      [
        `Name: ${lead.name}`,
        `Phone: ${lead.phone}`,
        `Email: ${application.email || "-"}`,
        `City: ${application.city || "-"}`,
        `Submitted: ${formatDateTime(application.submittedAt)}`,
      ].join("\n")
    );
  };

  const handleApprove = async (applicationId: string) => {
    await apiPatch(`/leads/${applicationId}`, {
      stage: "onboarding",
      status: "qualified",
    });

    setLeads((current) =>
      current.map((lead) =>
        lead._id === applicationId
          ? {
              ...lead,
              stage: "onboarding",
            }
          : lead
      )
    );
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-slate-900">Membership Applications</h1>
        <p className="text-slate-500 mt-1">Review and manage membership applications</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Public Application Form</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Input value={applicationLink} readOnly className="flex-1 bg-slate-50" />
            <Button variant="outline" className="gap-2" onClick={handleCopyLink}>
              <Copy className="w-4 h-4" />
              Copy
            </Button>
            <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700" onClick={() => window.open(applicationLink, "_blank", "noopener,noreferrer")}>
              <ExternalLink className="w-4 h-4" />
              Open Form
            </Button>
          </div>
          <p className="text-sm text-slate-500">
            Share this link with qualified leads to collect membership applications
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-slate-500 mb-1">Total Applications</p>
            <p className="text-3xl font-semibold text-slate-900">{applications.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-slate-500 mb-1">Pending Review</p>
            <p className="text-3xl font-semibold text-amber-600">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-slate-500 mb-1">In Review</p>
            <p className="text-3xl font-semibold text-blue-600">{inReviewCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-slate-500 mb-1">Approved</p>
            <p className="text-3xl font-semibold text-green-600">{approvedCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Submitted At</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((application) => (
                <TableRow key={application.id}>
                  <TableCell className="font-medium">{application.name}</TableCell>
                  <TableCell className="text-slate-600">{application.phone}</TableCell>
                  <TableCell className="text-slate-600">{application.email}</TableCell>
                  <TableCell className="text-slate-600">{application.city}</TableCell>
                  <TableCell className="text-slate-600 text-sm">{application.submittedAt}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={application.status === "Approved" ? "bg-green-100 text-green-700" : application.status === "In Review" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}>
                      {application.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetails(application.id)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleApprove(application.id)}>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
