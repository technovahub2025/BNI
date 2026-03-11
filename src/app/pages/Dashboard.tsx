import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { TrendingUp, MessageCircle, CheckCircle, AlertCircle, Activity, XCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { apiGet, formatRelativeTime, getInitials } from "../lib/api";

type DashboardResponse = {
  kpis: {
    activeNurturingLeads: number;
    repliesToday: number;
    qualifiedThisWeek: number;
    noResponseLast7Days: number;
  };
  automationHealth: {
    runningWorkflows: number;
    failedSends: number;
    stuckWaitingOver48h: number;
  };
  recentReplies: Array<{
    _id: string;
    body: string;
    createdAt: string;
    leadId?: {
      _id: string;
      name: string;
      phone: string;
      status: string;
    };
  }>;
  pipeline: Array<{
    name: string;
    value: number;
  }>;
};

export function DashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardResponse | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    apiGet<DashboardResponse>("/dashboard", controller.signal)
      .then(setData)
      .catch(() => undefined);

    return () => controller.abort();
  }, []);

  const stats = [
    {
      title: "Active Nurturing Leads",
      value: String(data?.kpis.activeNurturingLeads ?? 0),
      description: "Across active workflows",
      icon: TrendingUp,
      iconColor: "text-indigo-600",
      iconBg: "bg-indigo-100",
    },
    {
      title: "Replies Today",
      value: String(data?.kpis.repliesToday ?? 0),
      description: "Inbound messages received today",
      icon: MessageCircle,
      iconColor: "text-green-600",
      iconBg: "bg-green-100",
    },
    {
      title: "Qualified This Week",
      value: String(data?.kpis.qualifiedThisWeek ?? 0),
      description: "Leads qualified in the last 7 days",
      icon: CheckCircle,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-100",
    },
    {
      title: "No Response (7D)",
      value: String(data?.kpis.noResponseLast7Days ?? 0),
      description: "Needs re-engagement",
      icon: AlertCircle,
      iconColor: "text-amber-600",
      iconBg: "bg-amber-100",
    },
  ];

  const automationHealth = [
    { label: "Running Workflows", value: String(data?.automationHealth.runningWorkflows ?? 0), status: "healthy" },
    { label: "Failed Sends", value: String(data?.automationHealth.failedSends ?? 0), status: "warning" },
    { label: "Stuck Over 48H", value: String(data?.automationHealth.stuckWaitingOver48h ?? 0), status: "critical" },
  ];

  const pipelineData = (data?.pipeline || []).map((item) => ({
    stage: item.name,
    count: item.value,
  }));

  const recentReplies = (data?.recentReplies || []).slice(0, 5).map((reply) => ({
    id: reply._id,
    leadId: reply.leadId?._id || reply._id,
    name: reply.leadId?.name || "Unknown Lead",
    avatar: getInitials(reply.leadId?.name),
    message: reply.body || "No message preview available",
    time: formatRelativeTime(reply.createdAt),
  }));

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-slate-900">Lead Operations Dashboard</h1>
        <p className="text-slate-500 mt-1">Monitor pipeline movement, workflow health, and replies.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-slate-500 mb-1">{stat.title}</p>
                  <p className="text-3xl font-semibold text-slate-900 mb-1">{stat.value}</p>
                  <p className="text-xs text-slate-400">{stat.description}</p>
                </div>
                <div className={`${stat.iconBg} p-3 rounded-lg`}>
                  <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Automation Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {automationHealth.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {item.status === "healthy" && <Activity className="w-4 h-4 text-green-500" />}
                  {item.status === "warning" && <XCircle className="w-4 h-4 text-amber-500" />}
                  {item.status === "critical" && <Clock className="w-4 h-4 text-red-500" />}
                  <span className="text-sm text-slate-600">{item.label}</span>
                </div>
                <span className="text-lg font-semibold text-slate-900">{item.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Pipeline Visualization</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={pipelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="stage" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip />
                <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent Replies</CardTitle>
          <Button variant="outline" size="sm" onClick={() => navigate("/inbox")}>View All</Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentReplies.map((reply) => (
              <div key={reply.id} className="flex items-start gap-4 p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-indigo-100 text-indigo-600 text-sm">
                    {reply.avatar}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-slate-900">{reply.name}</p>
                    <span className="text-xs text-slate-400">{reply.time}</span>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-1">{reply.message}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate(`/inbox?leadId=${reply.leadId}`)}>Open Lead</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
