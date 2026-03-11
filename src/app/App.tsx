import { RouterProvider } from "react-router";
import { router } from "./routes";
import { WorkspaceProvider } from "./context/WorkspaceContext";

export default function App() {
  return (
    <WorkspaceProvider>
      <RouterProvider router={router} />
    </WorkspaceProvider>
  );
}
