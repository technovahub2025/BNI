import { useEffect, useState } from "react";
import { TrendingUp, MessageCircle, UserCheck, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { apiGet } from "../lib/api";

type ReportsResponse = {
  summary: {
    conversionRate: number;
    replyRate: number;
    qualifiedLeads: number;
    onboardingCompleted: number;
  };
  replyTrend: Array<{ date: string; replies: number }>;
  funnel: Array<{ stage: string; count: number }>;
  messagePerformance: {
    messagesSent: number;
    deliveryRate: number;
    readRate: number;
  };
  automationEfficiency: {
    totalWorkflows: number;
    avgResponseTimeHours: number;
    successRate: number;
  };
  leadQuality: {
    avgLeadScore: number;
    highQualityRate: number;
    qualificationRate: number;
  };
};

const funnelColors = ["#0891b2", "#06b6d4", "#38bdf8", "#7dd3fc", "#bae6fd"];

export function ReportsPage() {
  const [data, setData] = useState<ReportsResponse | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    apiGet<ReportsResponse>("/reports", controller.signal)
      .then(setData)
      .catch(() => undefined);

    return () => controller.abort();
  }, []);

  const stats = [
    {
      title: "Conversion Rate",
      value: `${data?.summary.conversionRate ?? 0}%`,
      change: "Qualified vs total leads",
      icon: TrendingUp,
      iconColor: "text-green-600",
      iconBg: "bg-green-100",
    },
    {
      title: "Reply Rate",
      value: `${data?.summary.replyRate ?? 0}%`,
      change: "Replying vs contacted leads",
      icon: MessageCircle,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-100",
    },
    {
      title: "Qualified Leads",
      value: String(data?.summary.qualifiedLeads ?? 0),
      change: "This month",
      icon: UserCheck,
      iconColor: "text-indigo-600",
      iconBg: "bg-indigo-100",
    },
    {
      title: "Onboarding Completed",
      value: String(data?.summary.onboardingCompleted ?? 0),
      change: "Current total",
      icon: CheckCircle,
      iconColor: "text-purple-600",
      iconBg: "bg-purple-100",
    },
  ];

  const replyTrendData = data?.replyTrend || [];
  const funnelData = (data?.funnel || []).map((item, index) => ({
    ...item,
    color: funnelColors[index] || funnelColors[funnelColors.length - 1],
  }));

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-slate-900">Reports and Trends</h1>
        <p className="text-slate-500 mt-1">Analyze performance metrics and conversions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-slate-500 mb-1">{stat.title}</p>
                  <p className="text-3xl font-semibold text-slate-900 mb-1">{stat.value}</p>
                  <p className="text-xs text-slate-400">{stat.change}</p>
                </div>
                <div className={`${stat.iconBg} p-3 rounded-lg`}>
                  <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Reply Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={replyTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#c7e9f8" />
                <XAxis dataKey="date" stroke="#46687b" fontSize={12} />
                <YAxis stroke="#46687b" fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="replies" stroke="#0891b2" strokeWidth={2} dot={{ fill: "#0891b2", r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Lead Pipeline Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={funnelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#c7e9f8" />
                <XAxis type="number" stroke="#46687b" fontSize={12} />
                <YAxis dataKey="stage" type="category" stroke="#46687b" fontSize={12} width={100} />
                <Tooltip />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Message Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Messages Sent</span>
              <span className="text-lg font-semibold text-slate-900">{data?.messagePerformance.messagesSent ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Delivery Rate</span>
              <span className="text-lg font-semibold text-green-600">{data?.messagePerformance.deliveryRate ?? 0}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Read Rate</span>
              <span className="text-lg font-semibold text-blue-600">{data?.messagePerformance.readRate ?? 0}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Automation Efficiency</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Total Workflows</span>
              <span className="text-lg font-semibold text-slate-900">{data?.automationEfficiency.totalWorkflows ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Avg Response Time</span>
              <span className="text-lg font-semibold text-indigo-600">{data?.automationEfficiency.avgResponseTimeHours ?? 0}h</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Success Rate</span>
              <span className="text-lg font-semibold text-green-600">{data?.automationEfficiency.successRate ?? 0}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Lead Quality</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Avg Lead Score</span>
              <span className="text-lg font-semibold text-slate-900">{data?.leadQuality.avgLeadScore ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">High Quality (80+)</span>
              <span className="text-lg font-semibold text-green-600">{data?.leadQuality.highQualityRate ?? 0}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Qualification Rate</span>
              <span className="text-lg font-semibold text-blue-600">{data?.leadQuality.qualificationRate ?? 0}%</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
