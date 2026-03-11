import { ChangeEvent, useEffect, useState } from "react";
import { MessageSquare, Workflow, Database, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Switch } from "../components/ui/switch";
import { apiPatch, formatDate } from "../lib/api";
import { useWorkspace } from "../context/WorkspaceContext";

type SettingsForm = {
  workspaceName: string;
  messaging: {
    whatsappBusinessAccountId: string;
    phoneNumberId: string;
    accessToken: string;
    webhookVerificationToken: string;
    templateSyncEnabled: boolean;
  };
  automation: {
    defaultWorkflowDelayHours: number;
    template2DelayMinutes: number;
    template3DelayMinutes: number;
    noResponseDelayHours: number;
    highIntentKeywords: string[];
    qualificationThresholdScore: number;
    autoQualifyLeads: boolean;
    sendNotifications: boolean;
  };
  infrastructure: {
    mongoUri: string;
    redisUrl: string;
    environment: string;
  };
  workspaceInfo: {
    workspaceId: string;
    createdAt?: string;
    plan: string;
    teamMembers: number;
  };
};

export function SettingsPage() {
  const { settings, refreshSettings } = useWorkspace();
  const [form, setForm] = useState<SettingsForm | null>(null);
  const [showAccessToken, setShowAccessToken] = useState(false);

  useEffect(() => {
    if (!settings) return;

    setForm({
      workspaceName: settings.workspaceName,
      messaging: {
        whatsappBusinessAccountId: String(settings.messaging.whatsappBusinessAccountId || ""),
        phoneNumberId: String(settings.messaging.phoneNumberId || ""),
        accessToken: String(settings.messaging.accessToken || ""),
        webhookVerificationToken: String(settings.messaging.webhookVerificationToken || ""),
        templateSyncEnabled: Boolean(settings.messaging.templateSyncEnabled),
      },
      automation: {
        defaultWorkflowDelayHours: Number(settings.automation.defaultWorkflowDelayHours || 24),
        template2DelayMinutes: Number(settings.automation.template2DelayMinutes || 2),
        template3DelayMinutes: Number(settings.automation.template3DelayMinutes || 1),
        noResponseDelayHours: Number(settings.automation.noResponseDelayHours || 24),
        highIntentKeywords: Array.isArray(settings.automation.highIntentKeywords) ? settings.automation.highIntentKeywords.map(String) : [],
        qualificationThresholdScore: Number(settings.automation.qualificationThresholdScore || 75),
        autoQualifyLeads: Boolean(settings.automation.autoQualifyLeads),
        sendNotifications: Boolean(settings.automation.sendNotifications),
      },
      infrastructure: {
        mongoUri: String(settings.infrastructure.mongoUri || ""),
        redisUrl: String(settings.infrastructure.redisUrl || ""),
        environment: String(settings.infrastructure.environment || "production"),
      },
      workspaceInfo: settings.workspaceInfo,
    });
  }, [settings]);

  const updateMessaging = (field: keyof SettingsForm["messaging"], value: string | boolean) => {
    setForm((current) => current ? { ...current, messaging: { ...current.messaging, [field]: value } } : current);
  };

  const updateAutomation = (field: keyof SettingsForm["automation"], value: string | number | boolean | string[]) => {
    setForm((current) => current ? { ...current, automation: { ...current.automation, [field]: value } } : current);
  };

  const updateInfrastructure = (field: keyof SettingsForm["infrastructure"], value: string) => {
    setForm((current) => current ? { ...current, infrastructure: { ...current.infrastructure, [field]: value } } : current);
  };

  const saveMessaging = async () => {
    if (!form) return;
    await apiPatch("/settings", { messaging: form.messaging });
    await refreshSettings();
  };

  const saveAutomation = async () => {
    if (!form) return;
    await apiPatch("/settings", { automation: form.automation });
    await refreshSettings();
  };

  const saveInfrastructure = async () => {
    if (!form) return;
    await apiPatch("/settings", { infrastructure: form.infrastructure });
    await refreshSettings();
  };

  if (!form) {
    return <div className="p-8" />;
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-slate-900">Workspace Settings</h1>
        <p className="text-slate-500 mt-1">Configure your LeadOS workspace</p>
      </div>

      <div className="space-y-6 max-w-4xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Messaging Configuration</CardTitle>
                <p className="text-sm text-slate-500">WhatsApp API and template settings</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>WhatsApp Business Account ID</Label>
              <Input placeholder="Enter your WhatsApp Business Account ID" value={form.messaging.whatsappBusinessAccountId} onChange={(event) => updateMessaging("whatsappBusinessAccountId", event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Phone Number ID</Label>
              <Input placeholder="Enter your Phone Number ID" value={form.messaging.phoneNumberId} onChange={(event) => updateMessaging("phoneNumberId", event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Access Token</Label>
              <div className="relative">
                <Input type={showAccessToken ? "text" : "password"} placeholder="Enter your WhatsApp API access token" value={form.messaging.accessToken} onChange={(event) => updateMessaging("accessToken", event.target.value)} className="pr-12" />
                <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" onClick={() => setShowAccessToken((current) => !current)}>
                  {showAccessToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Webhook Verification Token</Label>
              <Input placeholder="Enter webhook verification token" value={form.messaging.webhookVerificationToken} onChange={(event) => updateMessaging("webhookVerificationToken", event.target.value)} />
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <p className="font-medium text-slate-900">Template Sync Enabled</p>
                <p className="text-sm text-slate-500">Auto-sync templates from Meta</p>
              </div>
              <Switch checked={form.messaging.templateSyncEnabled} onCheckedChange={(value) => updateMessaging("templateSyncEnabled", value)} />
            </div>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={saveMessaging}>Save Messaging Settings</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Workflow className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Automation Configuration</CardTitle>
                <p className="text-sm text-slate-500">Workflow behavior and lead scoring</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Default Workflow Delay (hours)</Label>
              <Input type="number" value={form.automation.defaultWorkflowDelayHours} onChange={(event) => updateAutomation("defaultWorkflowDelayHours", Number(event.target.value || 0))} />
              <p className="text-xs text-slate-500">Default delay between automated messages</p>
            </div>
            <div className="space-y-2">
              <Label>Template 2 Delay (minutes)</Label>
              <Input type="number" value={form.automation.template2DelayMinutes} onChange={(event) => updateAutomation("template2DelayMinutes", Number(event.target.value || 0))} />
              <p className="text-xs text-slate-500">Wait time after template 1 before sending template 2</p>
            </div>
            <div className="space-y-2">
              <Label>Template 3 Delay (minutes)</Label>
              <Input type="number" value={form.automation.template3DelayMinutes} onChange={(event) => updateAutomation("template3DelayMinutes", Number(event.target.value || 0))} />
              <p className="text-xs text-slate-500">Wait time after template 2 before sending template 3</p>
            </div>
            <div className="space-y-2">
              <Label>No Response Timeout (hours)</Label>
              <Input type="number" value={form.automation.noResponseDelayHours} onChange={(event) => updateAutomation("noResponseDelayHours", Number(event.target.value || 0))} />
              <p className="text-xs text-slate-500">Wait time after template 3 before marking a lead as no response</p>
            </div>
            <div className="space-y-2">
              <Label>High Intent Keywords</Label>
              <Textarea rows={3} placeholder="Enter keywords separated by commas..." value={form.automation.highIntentKeywords.join(", ")} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => updateAutomation("highIntentKeywords", event.target.value.split(",").map((item) => item.trim()).filter(Boolean))} />
              <p className="text-xs text-slate-500">Keywords that trigger high lead scores</p>
            </div>
            <div className="space-y-2">
              <Label>Qualification Threshold Score</Label>
              <Input type="number" value={form.automation.qualificationThresholdScore} onChange={(event) => updateAutomation("qualificationThresholdScore", Number(event.target.value || 0))} />
              <p className="text-xs text-slate-500">Minimum score required for auto-qualification</p>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <p className="font-medium text-slate-900">Auto-Qualify Leads</p>
                <p className="text-sm text-slate-500">Automatically qualify high-scoring leads</p>
              </div>
              <Switch checked={form.automation.autoQualifyLeads} onCheckedChange={(value) => updateAutomation("autoQualifyLeads", value)} />
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <p className="font-medium text-slate-900">Send Notifications</p>
                <p className="text-sm text-slate-500">Notify team on new replies</p>
              </div>
              <Switch checked={form.automation.sendNotifications} onCheckedChange={(value) => updateAutomation("sendNotifications", value)} />
            </div>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={saveAutomation}>Save Automation Settings</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Database className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Infrastructure</CardTitle>
                <p className="text-sm text-slate-500">Database and environment configuration</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>MongoDB Connection String</Label>
              <Input type="password" placeholder="mongodb://..." value={form.infrastructure.mongoUri} onChange={(event) => updateInfrastructure("mongoUri", event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Redis URL</Label>
              <Input placeholder="redis://..." value={form.infrastructure.redisUrl} onChange={(event) => updateInfrastructure("redisUrl", event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Environment</Label>
              <Input value={form.infrastructure.environment} disabled className="bg-slate-50" />
            </div>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Warning:</strong> Changing infrastructure settings may affect system
                stability. Contact support if you need assistance.
              </p>
            </div>
            <Button variant="outline" onClick={saveInfrastructure}>Update Infrastructure</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Workspace Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500 mb-1">Workspace ID</p>
                <p className="font-mono text-sm text-slate-900">{form.workspaceInfo.workspaceId}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Created</p>
                <p className="text-sm text-slate-900">{formatDate(form.workspaceInfo.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Plan</p>
                <p className="text-sm text-slate-900">{form.workspaceInfo.plan}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Team Members</p>
                <p className="text-sm text-slate-900">{form.workspaceInfo.teamMembers} members</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
