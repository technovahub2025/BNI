import { useEffect, useMemo, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { apiGet, apiPost, formatDate } from "../lib/api";

type Template = {
  id?: string;
  _id?: string;
  name: string;
  category: string;
  body: string;
  status?: string;
  variables: string[];
  updatedAt?: string | null;
};

export function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("marketing");
  const [variables, setVariables] = useState("");
  const [body, setBody] = useState("");
  const [phone, setPhone] = useState("");

  const loadTemplates = (controller?: AbortController) => {
    return apiGet<Template[]>("/templates", controller?.signal)
      .then((items) => {
        setTemplates(items);
        if (items[0]) {
          const selected =
            items.find((template) => (template.id || template._id || template.name) === selectedTemplateId) ||
            items[0];
          selectTemplate(selected, setSelectedTemplateId, setName, setCategory, setVariables, setBody);
        }
      })
      .catch(() => undefined);
  };

  useEffect(() => {
    const controller = new AbortController();

    void loadTemplates(controller);

    return () => controller.abort();
  }, []);

  const selectedTemplate = useMemo(
    () =>
      templates.find((template) => (template.id || template._id || template.name) === selectedTemplateId) || null,
    [templates, selectedTemplateId]
  );

  const handleSave = async () => {
    await loadTemplates();
  };

  const handleTestSend = async () => {
    if (!name || !phone) return;
    await apiPost("/send", {
      phone,
      templateName: name,
      bodyFallback: body,
      templateParams: variables.split(",").map((item) => item.trim()).filter(Boolean),
    });
  };

  const previewBody = body || selectedTemplate?.body || "";

  return (
    <div className="p-8">
      <div className="mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">WhatsApp Template Manager</h1>
          <p className="text-slate-500 mt-1">Create and manage message templates</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">All Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id || template._id || template.name} className="cursor-pointer hover:bg-slate-50" onClick={() => selectTemplate(template, setSelectedTemplateId, setName, setCategory, setVariables, setBody)}>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell className="text-slate-600">{template.category}</TableCell>
                    <TableCell>
                      <Badge variant={normalizeTemplateStatus(template.status) === "Approved" ? "default" : "secondary"} className={normalizeTemplateStatus(template.status) === "Approved" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}>
                        {normalizeTemplateStatus(template.status)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Template Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Template Name</Label>
                <Input placeholder="e.g., welcome_message" value={name} readOnly />
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Input value={category} readOnly />
              </div>

              <div className="space-y-2">
                <Label>Variables</Label>
                <Input placeholder="e.g., name, company" value={variables} readOnly />
                <p className="text-xs text-slate-500">Use comma-separated placeholders</p>
              </div>

              <div className="space-y-2">
                <Label>Message Body</Label>
                <div className="min-h-[148px] rounded-md border border-input bg-transparent px-3 py-2 text-sm whitespace-pre-line text-slate-900">
                  {body || "Select a template to view its message body."}
                </div>
                <p className="text-xs text-slate-500">Maximum 1024 characters</p>
              </div>

              <Button className="w-full bg-indigo-600 hover:bg-indigo-700" onClick={handleSave}>
                Refresh Templates
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Live WhatsApp Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-[#e5ddd5] p-4 rounded-lg min-h-[200px]">
                <div className="bg-white rounded-lg p-3 shadow-sm max-w-[280px]">
                  <p className="text-sm text-slate-900 whitespace-pre-line">{previewBody || "Select or create a template to preview its content."}</p>
                  <p className="text-xs text-slate-400 mt-2 text-right">{selectedTemplate?.updatedAt ? formatDate(selectedTemplate.updatedAt) : "10:30 AM"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Test Send</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input placeholder="+1 (555) 123-4567" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} />
              </div>
              <Button className="w-full gap-2" onClick={handleTestSend} disabled={!name || !phone}>
                <Send className="w-4 h-4" />
                Send Test Message
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function selectTemplate(
  template: Template,
  setSelectedTemplateId: (value: string | null) => void,
  setName: (value: string) => void,
  setCategory: (value: string) => void,
  setVariables: (value: string) => void,
  setBody: (value: string) => void
) {
  setSelectedTemplateId(template.id || template._id || template.name);
  setName(template.name);
  setCategory(template.category);
  setVariables((template.variables || []).join(", "));
  setBody(template.body);
}

function normalizeTemplateStatus(status?: string) {
  if (!status) return "Pending";
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}
