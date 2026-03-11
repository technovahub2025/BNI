import { useEffect, useMemo, useState } from "react";
import { CheckCircle, Circle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Checkbox } from "../components/ui/checkbox";
import { Progress } from "../components/ui/progress";
import { apiGet, formatDate } from "../lib/api";

type Lead = {
  _id: string;
  name: string;
  stage: string | null;
  createdAt: string;
};

const onboardingSteps = [
  { step: 1, label: "Application Submitted", completed: true },
  { step: 2, label: "Conversation Completed", completed: true },
  { step: 3, label: "KYC Documents Received", completed: true },
  { step: 4, label: "Welcome Packet Sent", completed: false },
  { step: 5, label: "Onboarding Completed", completed: false },
];

export function OnboardingPage() {
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    const controller = new AbortController();

    apiGet<Lead[]>("/leads", controller.signal)
      .then(setLeads)
      .catch(() => undefined);

    return () => controller.abort();
  }, []);

  const activeOnboarding = useMemo(
    () => leads.filter((lead) => lead.stage === "onboarding"),
    [leads]
  );

  const recentOnboarding = activeOnboarding.slice(0, 3).map((lead, index) => ({
    name: lead.name,
    currentStep: onboardingSteps[Math.min(index + 2, onboardingSteps.length - 1)].label,
    progress: [80, 60, 40][index] || 40,
    startedAt: formatDate(lead.createdAt),
  }));

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-slate-900">Onboarding</h1>
        <p className="text-slate-500 mt-1">Track member onboarding progress</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Onboarding Checklist</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {onboardingSteps.map((item) => (
                <div key={item.step} className="flex items-center gap-4 p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                  <Checkbox checked={item.completed} />
                  <div className="flex items-center gap-3 flex-1">
                    {item.completed ? <CheckCircle className="w-5 h-5 text-green-600" /> : <Circle className="w-5 h-5 text-slate-300" />}
                    <div className="flex-1">
                      <p className={`font-medium ${item.completed ? "text-slate-900" : "text-slate-500"}`}>{item.label}</p>
                    </div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${item.completed ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}>
                      {item.step}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Onboarding Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-slate-500">Active Onboarding</p>
                  <p className="text-2xl font-semibold text-slate-900">{activeOnboarding.length}</p>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-slate-500">Completed This Week</p>
                  <p className="text-2xl font-semibold text-green-600">{activeOnboarding.length}</p>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-slate-500">Average Completion Time</p>
                  <p className="text-2xl font-semibold text-indigo-600">{activeOnboarding.length ? "4.5 days" : "0 days"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Onboarding</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {recentOnboarding.map((item) => (
                  <div key={item.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-slate-900">{item.name}</p>
                      <span className="text-sm text-slate-500">{item.progress}%</span>
                    </div>
                    <Progress value={item.progress} className="h-2" />
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-slate-500">{item.currentStep}</p>
                      <p className="text-xs text-slate-400">Started {item.startedAt}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
