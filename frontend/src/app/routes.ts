import { createBrowserRouter } from "react-router";
import Layout from "./components/Layout";
import AgentConsole from "./screens/AgentConsole";
import ClassificationManager from "./screens/ClassificationManager";
import KnowledgeAlignment from "./screens/KnowledgeAlignment";
import AdapterConfiguration from "./screens/AdapterConfiguration";
import EvaluationDashboard from "./screens/EvaluationDashboard";
import TenantSetup from "./screens/TenantSetup";
import ServiceNowConnector from "./screens/ServiceNowConnector";
import TenantOnboarding from "./screens/TenantOnboarding";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: AgentConsole },
      { path: "classification", Component: ClassificationManager },
      { path: "knowledge", Component: KnowledgeAlignment },
      { path: "adapters", Component: AdapterConfiguration },
      { path: "evaluation", Component: EvaluationDashboard },
      { path: "tenant-setup", Component: TenantSetup },
      { path: "connectors/servicenow", Component: ServiceNowConnector },
      { path: "tenant-onboarding", Component: TenantOnboarding },
    ],
  },
]);
