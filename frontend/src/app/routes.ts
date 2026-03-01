import { createBrowserRouter } from "react-router";
import Layout from "./components/Layout";
import AgentConsole from "./screens/AgentConsole";
import ClassificationManager from "./screens/ClassificationManager";
import KnowledgeAlignment from "./screens/KnowledgeAlignment";
import AdapterConfiguration from "./screens/AdapterConfiguration";
import EvaluationDashboard from "./screens/EvaluationDashboard";

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
    ],
  },
]);
