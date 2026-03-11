import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { apiGet } from "../lib/api";

type WorkspaceSettings = {
  workspaceName: string;
  workspaces: string[];
  notificationsCount: number;
  operator: {
    name: string;
    email: string;
    initials: string;
  };
  messaging: Record<string, unknown>;
  automation: Record<string, unknown>;
  infrastructure: Record<string, unknown>;
  workspaceInfo: {
    workspaceId: string;
    plan: string;
    teamMembers: number;
    createdAt?: string;
  };
};

type WorkspaceContextValue = {
  settings: WorkspaceSettings | null;
  loading: boolean;
  refreshSettings: () => Promise<void>;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<WorkspaceSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSettings = async () => {
    try {
      const nextSettings = await apiGet<WorkspaceSettings>("/settings");
      setSettings(nextSettings);
    } catch {
      setSettings(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshSettings();
  }, []);

  return (
    <WorkspaceContext.Provider value={{ settings, loading, refreshSettings }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);

  if (!context) {
    throw new Error("useWorkspace must be used inside WorkspaceProvider");
  }

  return context;
}
