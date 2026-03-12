import { NavLink } from "react-router";
import { 
  LayoutDashboard, 
  Users, 
  Workflow, 
  MessageSquare, 
  Inbox, 
  UserCheck, 
  CheckSquare, 
  BarChart3, 
  Settings,
  User
} from "lucide-react";
import { Card } from "../ui/card";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { useWorkspace } from "../../context/WorkspaceContext";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/leads", label: "Leads", icon: Users },
  { to: "/automations", label: "Automations", icon: Workflow },
  { to: "/templates", label: "Templates", icon: MessageSquare },
  { to: "/inbox", label: "Inbox", icon: Inbox },
  { to: "/membership", label: "Membership", icon: UserCheck },
  { to: "/onboarding", label: "Onboarding", icon: CheckSquare },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const { settings } = useWorkspace();

  return (
    <aside className="w-64 border-r border-sky-100 bg-white/95 backdrop-blur flex flex-col shadow-[0_12px_40px_rgba(8,145,178,0.08)]">
      <div className="p-6 border-b border-sky-100 bg-gradient-to-r from-cyan-50 via-sky-50 to-white">
        <h1 className="text-xl font-semibold text-slate-900">LeadOS</h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors ${
                isActive
                  ? "bg-sky-500 text-white shadow-[0_10px_24px_rgba(14,165,233,0.24)]"
                  : "text-slate-600 hover:bg-sky-50 hover:text-sky-700"
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4">
        <Card className="border-sky-100 bg-gradient-to-br from-cyan-50 to-white p-4 shadow-none">
          <div className="flex items-center gap-3">
            <Avatar className="w-9 h-9">
              <AvatarFallback className="bg-sky-500 text-white text-sm">
                <User className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{settings?.operator?.name || "Operator View"}</p>
              <p className="text-xs text-slate-500 truncate">{settings?.operator?.email || "admin@leadops.io"}</p>
            </div>
          </div>
        </Card>
      </div>
    </aside>
  );
}
