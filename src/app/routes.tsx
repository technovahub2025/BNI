import { createBrowserRouter } from "react-router";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { DashboardPage } from "./pages/Dashboard";
import { LeadsPage } from "./pages/Leads";
import { AutomationsPage } from "./pages/Automations";
import { TemplatesPage } from "./pages/Templates";
import { InboxPage } from "./pages/Inbox";
import { MembershipPage } from "./pages/Membership";
import { OnboardingPage } from "./pages/Onboarding";
import { ReportsPage } from "./pages/Reports";
import { SettingsPage } from "./pages/Settings";
import { PublicApplicationPage } from "./pages/PublicApplication";

export const router = createBrowserRouter(
  [
    {
      path: "/",
      Component: DashboardLayout,
      children: [
        { index: true, Component: DashboardPage },
        { path: "leads", Component: LeadsPage },
        { path: "automations", Component: AutomationsPage },
        { path: "templates", Component: TemplatesPage },
        { path: "inbox", Component: InboxPage },
        { path: "membership", Component: MembershipPage },
        { path: "onboarding", Component: OnboardingPage },
        { path: "reports", Component: ReportsPage },
        { path: "settings", Component: SettingsPage },
      ],
    },
    {
      path: "/apply",
      Component: PublicApplicationPage,
    },
  ],
  {
    basename: "/bni",
  }
);
