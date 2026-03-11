import { useEffect, useMemo, useState } from "react";
import { Plus, Play, Pause, ArrowRight, MessageSquare, Trash2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Switch } from "../components/ui/switch";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Separator } from "../components/ui/separator";
import { apiDelete, apiGet, apiPatch, apiPost } from "../lib/api";

type TemplateVariableBinding = {
  variable: string;
  source:
    | "lead_name"
    | "application_form_link"
    | "zoom_meeting_link"
    | "lead_phone"
    | "selected_meeting_time";
};

type ReplyWorkflowStep = {
  id: string;
  triggerType: "user_reply" | "button_click";
  triggerValue: string;
  nextTemplate: string;
  nextTemplateVariables: TemplateVariableBinding[];
};

type Workflow = {
  _id: string;
  name: string;
  type: "nurture" | "reply_flow";
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
  replyFlow: {
    initialTemplate: string;
    initialTemplateVariables: TemplateVariableBinding[];
    steps: ReplyWorkflowStep[];
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
  id?: string;
  _id?: string;
  name: string;
  body?: string;
  variables?: string[];
};

const templateVariableSourceOptions: Array<{
  value: TemplateVariableBinding["source"];
  label: string;
}> = [
  { value: "lead_name", label: "User Name" },
  { value: "application_form_link", label: "Application Form Link" },
  { value: "selected_meeting_time", label: "Selected Meeting Time" },
  { value: "zoom_meeting_link", label: "Zoom Meeting Link" },
  { value: "lead_phone", label: "User Phone" },
];

export function AutomationsPage() {
  const [data, setData] = useState<WorkflowsResponse | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [form, setForm] = useState<Workflow["settings"] | null>(null);
  const [replyFlowForm, setReplyFlowForm] = useState<Workflow["replyFlow"] | null>(null);
  const [workflowName, setWorkflowName] = useState("");

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

  const orderedWorkflows = useMemo(() => {
    const workflows = data?.workflows || [];
    const pinned = workflows.find((workflow) => workflow.name === "default_nurture_workflow");
    const others = workflows.filter((workflow) => workflow.name !== "default_nurture_workflow");

    return pinned ? [pinned, ...others] : others;
  }, [data]);

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
      setReplyFlowForm(selectedWorkflow.replyFlow);
      setWorkflowName(selectedWorkflow.name);
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
    if (!selectedWorkflowId || !selectedWorkflow) return;
    const response = await apiPatch<{ workflow: Workflow }>(`/workflows/${selectedWorkflowId}`, {
      name: workflowName,
      settings: selectedWorkflow.type === "nurture" ? form : undefined,
      replyFlow: selectedWorkflow.type === "reply_flow" ? replyFlowForm : undefined,
    });

    setData((current) =>
      current
        ? {
            ...current,
            workflows: current.workflows.map((item) => (item._id === selectedWorkflowId ? response.workflow : item)),
          }
        : current
    );
  };

  const handleCreateWorkflow = async () => {
    const response = await apiPost<{ workflow: Workflow }>("/workflows", {
      name: `reply_flow_${Date.now()}`,
    });

    setData((current) =>
      current
        ? {
            ...current,
            workflows: current.workflows.find((workflow) => workflow.name === "default_nurture_workflow")
              ? [
                  ...current.workflows.filter((workflow) => workflow.name === "default_nurture_workflow"),
                  ...current.workflows.filter((workflow) => workflow.name !== "default_nurture_workflow"),
                  response.workflow,
                ]
              : [...current.workflows, response.workflow],
          }
        : {
            workflows: [response.workflow],
            activeRuns: [],
          }
    );
    setSelectedWorkflowId(response.workflow._id);
    setWorkflowName(response.workflow.name);
    setReplyFlowForm(response.workflow.replyFlow);
  };

  const handleDeleteWorkflow = async (workflow: Workflow) => {
    if (!window.confirm(`Delete workflow "${workflow.name}"?`)) return;

    await apiDelete(`/workflows/${workflow._id}`);
    if (!data) return;

    const workflows = data.workflows.filter((item) => item._id !== workflow._id);
    const activeRuns = data.activeRuns.filter((run) => run.workflowId !== workflow._id);
    const nextSelectedWorkflowId =
      selectedWorkflowId === workflow._id ? workflows[0]?._id || null : selectedWorkflowId;
    const nextSelectedWorkflow =
      workflows.find((item) => item._id === nextSelectedWorkflowId) || null;

    setData({ workflows, activeRuns });
    setSelectedWorkflowId(nextSelectedWorkflowId);
    setForm(nextSelectedWorkflow?.settings || null);
    setReplyFlowForm(nextSelectedWorkflow?.replyFlow || null);
    setWorkflowName(nextSelectedWorkflow?.name || "");
  };

  const handleAddReplyFlowStep = () => {
    const defaultTemplateName = templateOptions[0]?.name || "";
    setReplyFlowForm((current) =>
      current
        ? {
            ...current,
            steps: [
              ...current.steps,
              {
                id: `step_${Date.now()}`,
                triggerType: "user_reply",
                triggerValue: "",
                nextTemplate: defaultTemplateName,
                nextTemplateVariables: buildTemplateVariableBindings(
                  defaultTemplateName,
                  templateOptions[0]?.variables || []
                ),
              },
            ],
          }
        : current
    );
  };

  const handleReplyFlowStepChange = (
    stepId: string,
    key: keyof ReplyWorkflowStep,
    value: string | TemplateVariableBinding[]
  ) => {
    setReplyFlowForm((current) =>
      current
        ? {
            ...current,
            steps: current.steps.map((step) => (step.id === stepId ? { ...step, [key]: value } : step)),
          }
        : current
    );
  };

  const handleInitialTemplateChange = (templateName: string) => {
    const selectedTemplateDefinition = getTemplateDefinition(templateOptions, templateName);
    setReplyFlowForm((current) =>
      current
        ? {
            ...current,
            initialTemplate: templateName,
            initialTemplateVariables: buildTemplateVariableBindings(
              templateName,
              selectedTemplateDefinition?.variables || [],
              current.initialTemplateVariables
            ),
          }
        : current
    );
  };

  const handleInitialTemplateVariableSourceChange = (
    variable: string,
    source: TemplateVariableBinding["source"]
  ) => {
    setReplyFlowForm((current) =>
      current
        ? {
            ...current,
            initialTemplateVariables: current.initialTemplateVariables.map((item) =>
              item.variable === variable ? { ...item, source } : item
            ),
          }
        : current
    );
  };

  const handleStepTemplateChange = (stepId: string, templateName: string) => {
    const selectedTemplateDefinition = getTemplateDefinition(templateOptions, templateName);
    setReplyFlowForm((current) =>
      current
        ? {
            ...current,
            steps: current.steps.map((step) =>
              step.id === stepId
                ? {
                    ...step,
                    nextTemplate: templateName,
                    nextTemplateVariables: buildTemplateVariableBindings(
                      templateName,
                      selectedTemplateDefinition?.variables || [],
                      step.nextTemplateVariables
                    ),
                  }
                : step
            ),
          }
        : current
    );
  };

  const handleStepTemplateVariableSourceChange = (
    stepId: string,
    variable: string,
    source: TemplateVariableBinding["source"]
  ) => {
    setReplyFlowForm((current) =>
      current
        ? {
            ...current,
            steps: current.steps.map((step) =>
              step.id === stepId
                ? {
                    ...step,
                    nextTemplateVariables: step.nextTemplateVariables.map((item) =>
                      item.variable === variable ? { ...item, source } : item
                    ),
                  }
                : step
            ),
          }
        : current
    );
  };

  const handleRemoveReplyFlowStep = (stepId: string) => {
    setReplyFlowForm((current) =>
      current
        ? {
            ...current,
            steps: current.steps.filter((step) => step.id !== stepId),
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
        <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700" onClick={handleCreateWorkflow}>
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
              {orderedWorkflows.map((automation) => {
                const leads = activeRunCounts.get(automation._id) || 0;
                const canDelete = automation.name !== "default_nurture_workflow";

                return (
                  <div key={automation._id} className="p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors" onClick={() => setSelectedWorkflowId(automation._id)}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 mb-1">{automation.name}</p>
                        <p className="text-xs text-slate-500">{leads} leads enrolled</p>
                        <p className="text-xs text-slate-400 mt-1">
                          {automation.type === "reply_flow" ? "Reply flow" : "Nurture flow"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {canDelete ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-slate-400 hover:text-red-600"
                            onClick={(event) => {
                              event.stopPropagation();
                              void handleDeleteWorkflow(automation);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        ) : null}
                        <Switch
                          checked={automation.active}
                          onCheckedChange={(value) => handleToggleWorkflow(automation, value)}
                        />
                      </div>
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
              <CardTitle className="text-lg">
                {selectedWorkflow?.type === "reply_flow" ? "Reply Workflow Builder" : "Nurture Workflow Builder"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {!selectedWorkflow ? (
                <p className="text-sm text-slate-500">Select a workflow to configure it.</p>
              ) : selectedWorkflow.type === "reply_flow" ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>Workflow Name</Label>
                    <Input value={workflowName} onChange={(event) => setWorkflowName(event.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <Label>Initial Template</Label>
                    <Select
                      value={replyFlowForm?.initialTemplate || ""}
                      onValueChange={handleInitialTemplateChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select initial template" />
                      </SelectTrigger>
                      <SelectContent>
                        {templateOptions.map((template) => (
                          <SelectItem key={template.id || template._id || template.name} value={template.name}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-500">
                      This template is sent immediately when any inbound message is received from the lead.
                    </p>
                  </div>

                  {replyFlowForm?.initialTemplateVariables.length ? (
                    <div className="rounded-lg border border-slate-200 p-4 space-y-3">
                      <h4 className="text-sm font-medium text-slate-900">Initial Template Variables</h4>
                      {replyFlowForm.initialTemplateVariables.map((binding) => (
                        <div key={binding.variable} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Variable</Label>
                            <Input value={binding.variable} readOnly />
                          </div>
                          <div className="space-y-2">
                            <Label>Use Value</Label>
                            <Select
                              value={binding.source}
                              onValueChange={(value: TemplateVariableBinding["source"]) =>
                                handleInitialTemplateVariableSourceChange(binding.variable, value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {templateVariableSourceOptions.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-slate-900">Workflow Steps</h3>
                      <p className="text-sm text-slate-500">
                        Each matching reply or button click sends the next selected template.
                      </p>
                    </div>
                    <Button variant="outline" onClick={handleAddReplyFlowStep}>
                      Add Workflow Step
                    </Button>
                  </div>

                  {(replyFlowForm?.steps || []).length ? (
                    <div className="space-y-4">
                      {(replyFlowForm?.steps || []).map((step, index) => (
                        <div key={step.id} className="rounded-lg border border-slate-200 p-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-medium">
                                {index + 1}
                              </div>
                              <h4 className="font-medium text-slate-900">Step {index + 1}</h4>
                            </div>
                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-600" onClick={() => handleRemoveReplyFlowStep(step.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Trigger</Label>
                              <Select
                                value={step.triggerType}
                                onValueChange={(value: "user_reply" | "button_click") =>
                                  handleReplyFlowStepChange(step.id, "triggerType", value)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="user_reply">User Reply</SelectItem>
                                  <SelectItem value="button_click">Button Click</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label>Trigger Match</Label>
                              <Input
                                placeholder={step.triggerType === "button_click" ? "e.g. YES_BUTTON" : "e.g. yes"}
                                value={step.triggerValue}
                                onChange={(event) =>
                                  handleReplyFlowStepChange(step.id, "triggerValue", event.target.value)
                                }
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Next Template to Send</Label>
                            <Select
                              value={step.nextTemplate}
                              onValueChange={(value) => handleStepTemplateChange(step.id, value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select next template" />
                              </SelectTrigger>
                              <SelectContent>
                                {templateOptions.map((template) => (
                                  <SelectItem key={template.id || template._id || template.name} value={template.name}>
                                    {template.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {step.nextTemplateVariables.length ? (
                            <div className="rounded-lg border border-slate-200 p-4 space-y-3">
                              <h5 className="text-sm font-medium text-slate-900">Template Variables</h5>
                              {step.nextTemplateVariables.map((binding) => (
                                <div key={binding.variable} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label>Variable</Label>
                                    <Input value={binding.variable} readOnly />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Use Value</Label>
                                    <Select
                                      value={binding.source}
                                      onValueChange={(value: TemplateVariableBinding["source"]) =>
                                        handleStepTemplateVariableSourceChange(step.id, binding.variable, value)
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {templateVariableSourceOptions.map((option) => (
                                          <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-500">
                      No reply steps yet. Add a workflow step to define the next template for each reply.
                    </div>
                  )}

                  <div className="flex justify-end gap-3">
                    <Button variant="outline">Cancel</Button>
                    <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleSave}>
                      Save Workflow
                    </Button>
                  </div>
                </div>
              ) : (
              <>
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
                          <SelectItem key={template.id || template._id || template.name} value={template.name}>{template.name}</SelectItem>
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
                        <SelectItem key={template.id || template._id || template.name} value={template.name}>{template.name}</SelectItem>
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
                        <SelectItem key={template.id || template._id || template.name} value={template.name}>{template.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
              </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function getTemplateDefinition(templates: Template[], templateName: string) {
  return templates.find((template) => template.name === templateName) || null;
}

function buildTemplateVariableBindings(
  templateName: string,
  variables: string[],
  existingBindings: TemplateVariableBinding[] = []
): TemplateVariableBinding[] {
  return (variables || []).map((variable, index) => ({
    variable,
    source:
      existingBindings.find((binding) => binding.variable === variable)?.source ||
      inferTemplateVariableSource(templateName, variable, index),
  }));
}

function inferTemplateVariableSource(
  templateName: string,
  variable: string,
  index: number
): TemplateVariableBinding["source"] {
  const normalizedTemplateName = templateName.toLowerCase();
  const normalizedVariable = variable.toLowerCase();

  if (
    normalizedVariable.includes("application") ||
    normalizedVariable.includes("form") ||
    normalizedVariable.includes("link") ||
    normalizedVariable.includes("url") ||
    normalizedTemplateName.includes("membership") ||
    normalizedTemplateName.includes("application") ||
    normalizedTemplateName.includes("form")
  ) {
    return "application_form_link";
  }

  if (
    normalizedVariable.includes("time") ||
    normalizedVariable.includes("slot") ||
    normalizedTemplateName.includes("slot")
  ) {
    return "selected_meeting_time";
  }

  if (
    normalizedVariable.includes("zoom") ||
    normalizedVariable.includes("meeting") ||
    normalizedTemplateName.includes("zoom") ||
    normalizedTemplateName.includes("meeting")
  ) {
    return "zoom_meeting_link";
  }

  if (
    normalizedVariable.includes("phone") ||
    normalizedVariable.includes("mobile") ||
    normalizedVariable.includes("number") ||
    normalizedTemplateName.includes("phone")
  ) {
    return "lead_phone";
  }

  return index === 0 ? "lead_name" : "application_form_link";
}
