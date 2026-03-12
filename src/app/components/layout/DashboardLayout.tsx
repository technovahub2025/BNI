import { Outlet } from "react-router";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

export function DashboardLayout() {
  return (
    <div className="flex h-screen bg-[linear-gradient(180deg,#f8fdff_0%,#f4fbff_46%,#eef8ff_100%)]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
