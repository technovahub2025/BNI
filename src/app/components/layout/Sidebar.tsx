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
    <aside className="w-64 bg-slate-900 flex flex-col">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-xl font-semibold text-white">LeadOS</h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                isActive
                  ? "bg-indigo-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4">
        <Card className="bg-slate-800 border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <Avatar className="w-9 h-9">
              <AvatarFallback className="bg-indigo-600 text-white text-sm">
                <User className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{settings?.operator?.name || "Operator View"}</p>
              <p className="text-xs text-slate-400 truncate">{settings?.operator?.email || "admin@leadops.io"}</p>
            </div>
          </div>
        </Card>
      </div>
    </aside>
  );
}
