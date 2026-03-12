import { Search, Bell, ChevronDown, Plus } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useWorkspace } from "../../context/WorkspaceContext";

export function TopBar() {
  const { settings } = useWorkspace();
  const workspaces = settings?.workspaces?.length ? settings.workspaces : ["Main Workspace"];

  return (
    <header className="h-16 bg-white/90 backdrop-blur border-b border-sky-100 flex items-center justify-between px-6">
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-400" />
          <Input
            placeholder="Search leads, automations, templates..."
            className="pl-10 border-sky-100 bg-sky-50/70 focus-visible:border-sky-300"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 border-sky-100 bg-white text-slate-700 hover:bg-sky-50 hover:text-sky-700">
              {settings?.workspaceName || "Main Workspace"}
              <ChevronDown className="w-4 h-4 text-sky-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {workspaces.map((workspace) => (
              <DropdownMenuItem key={workspace}>{workspace}</DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button className="gap-2 bg-sky-500 text-white hover:bg-sky-600 shadow-[0_10px_24px_rgba(14,165,233,0.24)]">
          <Plus className="w-4 h-4" />
          Create
        </Button>

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {(settings?.notificationsCount || 0) > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
          )}
        </Button>

        <Avatar className="w-9 h-9 cursor-pointer">
          <AvatarFallback className="bg-sky-500 text-white text-sm">
            {settings?.operator?.initials || "AD"}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
