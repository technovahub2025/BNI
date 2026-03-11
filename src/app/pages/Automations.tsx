import { useEffect, useMemo, useState } from "react";
import { Plus, Play, Pause, ArrowRight, MessageSquare } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Switch } from "../components/ui/switch";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Separator } from "../components/ui/separator";
import { apiGet, apiPatch } from "../lib/api";

type Workflow = {
  _id: string;
  name: string;
  active: boolean;
  settings: {
    template1: string;
    template2: string;
    template3: string;
    template2DelayValue: number;
    template2DelayUnit: "minutes" | "hours" | "days";
    template3DelayValue: number;
    template3DelayUnit: "minutes" | "hours" | "days";
    membershipTemplate: string;
    applicationSubmittedTemplate: string;
    replyKeywords: string[];
    keywordReplyScore: number;
  };
};

type ActiveRun = {
  _id: string;
  workflowId: string;
};

type WorkflowsResponse = {
  workflows: Workflow[];
  activeRuns: ActiveRun[];
};

type Template = {
  _id: string;
  name: string;
};

export function AutomationsPage() {
  const [data, setData] = useState<WorkflowsResponse | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [form, setForm] = useState<Workflow["settings"] | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    void Promise.all([
      apiGet<WorkflowsResponse>("/workflows", controller.signal),
      apiGet<Template[]>("/templates", controller.signal),
    ])
      .then(([workflowData, templateData]) => {
        setData(workflowData);
        setTemplates(templateData);

        const initialWorkflow = workflowData.workflows[0];
        if (initialWorkflow) {
          setSelectedWorkflowId(initialWorkflow._id);
          setForm(initialWorkflow.settings);
        }
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, []);

  const selectedWorkflow = useMemo(
    () => data?.workflows.find((workflow) => workflow._id === selectedWorkflowId) || null,
    [data, selectedWorkflowId]
  );

  const activeRunCounts = useMemo(() => {
    const counts = new Map<string, number>();
    (data?.activeRuns || []).forEach((run) => {
      counts.set(run.workflowId, (counts.get(run.workflowId) || 0) + 1);
    });
    return counts;
  }, [data]);

  useEffect(() => {
    if (selectedWorkflow) {
      setForm(selectedWorkflow.settings);
    }
  }, [selectedWorkflow]);

  const handleToggleWorkflow = async (workflow: Workflow, active: boolean) => {
    await apiPatch(`/workflows/${workflow._id}`, { active });
    setData((current) =>
      current
        ? {
            ...current,
            workflows: current.workflows.map((item) =>
              item._id === workflow._id ? { ...item, active } : item
            ),
          }
        : current
    );
  };

  const handleSave = async () => {
    if (!selectedWorkflowId || !form) return;
    const response = await apiPatch<{ workflow: Workflow }>(`/workflows/${selectedWorkflowId}`, {
      settings: form,
    });

    setData((current) =>
      current
        ? {
            ...current,
            workflows: current.workflows.map((item) =>
              item._id === selectedWorkflowId ? { ...item, settings: response.workflow.settings } : item
            ),
          }
        : current
    );
  };

  const templateOptions = templates.length
    ? templates
    : [
        { _id: "template_1", name: "template_1" },
        { _id: "template_2", name: "template_2" },
        { _id: "template_3", name: "template_3" },
      ];

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Automations</h1>
          <p className="text-slate-500 mt-1">Build and manage WhatsApp workflows</p>
        </div>
        <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4" />
          Create Workflow
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Workflows</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(data?.workflows || []).map((automation) => {
                const leads = activeRunCounts.get(automation._id) || 0;

                return (
                  <div key={automation._id} className="p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors" onClick={() => setSelectedWorkflowId(automation._id)}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 mb-1">{automation.name}</p>
                        <p className="text-xs text-slate-500">{leads} leads enrolled</p>
                      </div>
                      <Switch checked={automation.active} onCheckedChange={(value) => handleToggleWorkflow(automation, value)} />
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={automation.active ? "default" : "secondary"} className={automation.active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-700"}>
                        {automation.active ? <Play className="w-3 h-3 mr-1" /> : <Pause className="w-3 h-3 mr-1" />}
                        {automation.active ? "Running" : "Paused"}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Nurture Workflow Builder</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-medium">1</div>
                  <h3 className="font-medium text-slate-900">Template 1 (Initial Contact)</h3>
                </div>
                <div className="ml-11 space-y-4">
                  <div className="space-y-2">
                    <Label>Template</Label>
                    <Select value={form?.template1 || ""} onValueChange={(value) => setForm((current) => current ? { ...current, template1: value } : current)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {templateOptions.map((template) => (
                          <SelectItem key={template._id} value={template.name}>{template.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-start gap-3 mb-3">
                      <MessageSquare className="w-4 h-4 text-indigo-600 mt-0.5" />
                      <p className="text-sm text-slate-600">
                        Send initial template message immediately upon lead enrollment
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="ml-11 flex items-center gap-3 text-slate-400">
                <ArrowRight className="w-5 h-5" />
                <span className="text-sm">If no reply, wait...</span>
              </div>

                <div className="ml-11 space-y-2">
                  <Label>Delay Period</Label>
                  <div className="flex gap-3">
                    <Input
                      type="number"
                      min="1"
                      value={String(form?.template2DelayValue || 24)}
                      className="w-24"
                      onChange={(event) =>
                        setForm((current) =>
                          current
                            ? {
                                ...current,
                                template2DelayValue: Math.max(1, Number(event.target.value) || 1),
                              }
                            : current
                        )
                      }
                    />
                    <Select
                      value={form?.template2DelayUnit || "hours"}
                      onValueChange={(value: "minutes" | "hours" | "days") =>
                        setForm((current) =>
                          current ? { ...current, template2DelayUnit: value } : current
                        )
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minutes">Minutes</SelectItem>
                        <SelectItem value="hours">Hours</SelectItem>
                        <SelectItem value="days">Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

              <div className="ml-11 flex items-center gap-3 text-slate-400">
                <ArrowRight className="w-5 h-5" />
                <span className="text-sm">Then continue...</span>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-medium">2</div>
                  <h3 className="font-medium text-slate-900">Template 2 (Follow-up)</h3>
                </div>
                <div className="ml-11 space-y-2">
                  <Label>Template</Label>
                  <Select value={form?.template2 || ""} onValueChange={(value) => setForm((current) => current ? { ...current, template2: value } : current)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {templateOptions.map((template) => (
                        <SelectItem key={template._id} value={template.name}>{template.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="ml-11 flex items-center gap-3 text-slate-400">
                <ArrowRight className="w-5 h-5" />
                <span className="text-sm">If no reply, wait...</span>
              </div>

              <div className="ml-11 space-y-2">
                <Label>Delay Period</Label>
                <div className="flex gap-3">
                  <Input
                    type="number"
                    min="1"
                    value={String(form?.template3DelayValue || 48)}
                    className="w-24"
                    onChange={(event) =>
                      setForm((current) =>
                        current
                          ? {
                              ...current,
                              template3DelayValue: Math.max(1, Number(event.target.value) || 1),
                            }
                          : current
                      )
                    }
                  />
                  <Select
                    value={form?.template3DelayUnit || "hours"}
                    onValueChange={(value: "minutes" | "hours" | "days") =>
                      setForm((current) =>
                        current ? { ...current, template3DelayUnit: value } : current
                      )
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minutes">Minutes</SelectItem>
                      <SelectItem value="hours">Hours</SelectItem>
                      <SelectItem value="days">Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="ml-11 flex items-center gap-3 text-slate-400">
                <ArrowRight className="w-5 h-5" />
                <span className="text-sm">Then send final...</span>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-medium">3</div>
                  <h3 className="font-medium text-slate-900">Template 3 (Final Touch)</h3>
                </div>
                <div className="ml-11 space-y-2">
                  <Label>Template</Label>
                  <Select value={form?.template3 || ""} onValueChange={(value) => setForm((current) => current ? { ...current, template3: value } : current)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {templateOptions.map((template) => (
                        <SelectItem key={template._id} value={template.name}>{template.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-medium">4</div>
                  <h3 className="font-medium text-slate-900">Membership Link Template</h3>
                </div>
                <div className="ml-11 space-y-2">
                  <Label>Template</Label>
                  <Select value={form?.membershipTemplate || ""} onValueChange={(value) => setForm((current) => current ? { ...current, membershipTemplate: value } : current)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {templateOptions.map((template) => (
                        <SelectItem key={template._id} value={template.name}>{template.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">
                    This template is sent automatically when a lead replies and gets qualified.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-medium">5</div>
                  <h3 className="font-medium text-slate-900">Application Received Template</h3>
                </div>
                <div className="ml-11 space-y-2">
                  <Label>Template</Label>
                  <Select value={form?.applicationSubmittedTemplate || ""} onValueChange={(value) => setForm((current) => current ? { ...current, applicationSubmittedTemplate: value } : current)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {templateOptions.map((template) => (
                        <SelectItem key={template._id} value={template.name}>{template.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">
                    This template is sent automatically after a user submits the application form.
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>High Intent Keywords</Label>
                <Input placeholder="e.g., interested, yes, pricing, demo (comma separated)" value={(form?.replyKeywords || []).join(", ")} onChange={(event) => setForm((current) => current ? { ...current, replyKeywords: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) } : current)} />
                <p className="text-xs text-slate-500">
                  Leads who reply with these keywords will be automatically qualified
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline">Cancel</Button>
                <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleSave}>Save Workflow</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
