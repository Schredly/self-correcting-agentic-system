import { useState } from "react";
import {
  CheckCircle2,
  Circle,
  AlertCircle,
  ChevronRight,
  Database,
  HardDrive,
  Plug,
  Play,
  TestTube,
  FolderTree,
  FileText,
  MapPin,
  Zap,
} from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { ScrollArea } from "../components/ui/scroll-area";

interface SetupStep {
  id: string;
  title: string;
  description: string;
  status: "completed" | "in-progress" | "pending" | "error";
  icon: any;
}

const setupSteps: SetupStep[] = [
  {
    id: "schema",
    title: "Define classification schema",
    description: "Create your taxonomy structure",
    status: "completed",
    icon: FolderTree,
  },
  {
    id: "drive-connect",
    title: "Connect Google Drive",
    description: "Authenticate with Google Drive",
    status: "completed",
    icon: HardDrive,
  },
  {
    id: "drive-scaffold",
    title: "Apply Drive scaffolding",
    description: "Set up folder structure",
    status: "in-progress",
    icon: FileText,
  },
  {
    id: "knowledge-sync",
    title: "Sync knowledge",
    description: "Import and index documents",
    status: "pending",
    icon: Database,
  },
  {
    id: "servicenow-connect",
    title: "Connect ServiceNow",
    description: "Authenticate with ServiceNow",
    status: "pending",
    icon: Plug,
  },
  {
    id: "field-mapping",
    title: "Map fields to schema",
    description: "Configure field mappings",
    status: "pending",
    icon: MapPin,
  },
  {
    id: "e2e-test",
    title: "Test end-to-end run",
    description: "Validate complete workflow",
    status: "pending",
    icon: Zap,
  },
];

function StatusIcon({ status }: { status: SetupStep["status"] }) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
    case "in-progress":
      return <Circle className="w-5 h-5 text-blue-600 fill-blue-600" />;
    case "error":
      return <AlertCircle className="w-5 h-5 text-red-600" />;
    default:
      return <Circle className="w-5 h-5 text-zinc-300" />;
  }
}

function SchemaStepPanel() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium text-zinc-900 mb-1">Classification Schema</h3>
        <p className="text-sm text-zinc-500">
          Your classification schema has been successfully configured with 2 dimensions and 12 categories.
        </p>
      </div>

      <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-emerald-900">Schema configured</p>
            <p className="text-xs text-emerald-700 mt-1">Last updated: Mar 1, 2026 at 9:15 AM</p>
          </div>
        </div>
      </div>

      <div>
        <Button variant="outline" className="w-full">
          <FolderTree className="w-4 h-4 mr-2" />
          Edit Classification Schema
        </Button>
      </div>
    </div>
  );
}

function DriveConnectStepPanel() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium text-zinc-900 mb-1">Google Drive Connection</h3>
        <p className="text-sm text-zinc-500">
          Connect to your organization's Google Drive to access knowledge documents.
        </p>
      </div>

      <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-emerald-900">Connected</p>
            <p className="text-xs text-emerald-700 mt-1">acme-corp@example.com</p>
            <p className="text-xs text-emerald-700">Connected on Mar 1, 2026 at 8:45 AM</p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1">
          <TestTube className="w-4 h-4 mr-2" />
          Test Connection
        </Button>
        <Button variant="outline" className="flex-1">
          Reconnect
        </Button>
      </div>

      <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">
          Diagnostic Log
        </p>
        <div className="space-y-1 font-mono text-xs text-zinc-700">
          <div className="flex gap-2">
            <span className="text-zinc-400">[09:15:23]</span>
            <span className="text-emerald-600">&#10003;</span>
            <span>OAuth token valid</span>
          </div>
          <div className="flex gap-2">
            <span className="text-zinc-400">[09:15:24]</span>
            <span className="text-emerald-600">&#10003;</span>
            <span>Drive API accessible</span>
          </div>
          <div className="flex gap-2">
            <span className="text-zinc-400">[09:15:24]</span>
            <span className="text-emerald-600">&#10003;</span>
            <span>Permissions verified</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function DriveScaffoldStepPanel() {
  const [folderPath, setFolderPath] = useState("/Knowledge Base");
  const [isLoading] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium text-zinc-900 mb-1">Apply Drive Scaffolding</h3>
        <p className="text-sm text-zinc-500">
          Create a folder structure in Google Drive that mirrors your classification schema.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="folder-path">Root Folder Path</Label>
          <Input
            id="folder-path"
            value={folderPath}
            onChange={(e) => setFolderPath(e.target.value)}
            placeholder="/Knowledge Base"
            className="mt-2"
          />
          <p className="text-xs text-zinc-500 mt-2">
            Folder will be created if it doesn't exist
          </p>
        </div>

        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs font-medium text-blue-900 mb-2">Preview Structure:</p>
          <div className="space-y-1 text-xs text-blue-700 font-mono">
            <div>/Knowledge Base/</div>
            <div className="ml-3">{"\u251C\u2500\u2500"} Retail/</div>
            <div className="ml-6">{"\u251C\u2500\u2500"} Returns/</div>
            <div className="ml-6">{"\u251C\u2500\u2500"} Orders/</div>
            <div className="ml-3">{"\u251C\u2500\u2500"} Support/</div>
            <div className="ml-6">{"\u251C\u2500\u2500"} Technical/</div>
            <div className="ml-6">{"\u2514\u2500\u2500"} Billing/</div>
          </div>
        </div>
      </div>

      <Button className="w-full" disabled={isLoading}>
        <Play className="w-4 h-4 mr-2" />
        {isLoading ? "Creating Folders..." : "Apply Scaffolding"}
      </Button>

      <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">
          Diagnostic Log
        </p>
        <div className="space-y-1 font-mono text-xs text-zinc-700">
          <div className="flex gap-2">
            <span className="text-zinc-400">[09:20:15]</span>
            <span className="text-blue-600">{"\u2192"}</span>
            <span>Starting scaffold process...</span>
          </div>
          <div className="flex gap-2">
            <span className="text-zinc-400">[09:20:16]</span>
            <span className="text-emerald-600">&#10003;</span>
            <span>Root folder verified</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function KnowledgeSyncStepPanel() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium text-zinc-900 mb-1">Sync Knowledge</h3>
        <p className="text-sm text-zinc-500">
          Import and index documents from Google Drive for agent knowledge retrieval.
        </p>
      </div>

      <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-900">Prerequisites required</p>
            <p className="text-xs text-amber-700 mt-1">
              Complete Drive scaffolding before syncing knowledge
            </p>
          </div>
        </div>
      </div>

      <Button className="w-full" disabled>
        <Database className="w-4 h-4 mr-2" />
        Start Knowledge Sync
      </Button>
    </div>
  );
}

function ServiceNowConnectStepPanel() {
  const [instanceUrl, setInstanceUrl] = useState("");
  const [username, setUsername] = useState("");

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium text-zinc-900 mb-1">Connect ServiceNow</h3>
        <p className="text-sm text-zinc-500">
          Authenticate with your ServiceNow instance to enable work object synchronization.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="instance-url">ServiceNow Instance URL</Label>
          <Input
            id="instance-url"
            value={instanceUrl}
            onChange={(e) => setInstanceUrl(e.target.value)}
            placeholder="https://your-instance.service-now.com"
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="admin@acme.com"
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="api-key">API Key</Label>
          <Input
            id="api-key"
            type="password"
            placeholder="••••••••••••••••"
            className="mt-2"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button className="flex-1">
          <Plug className="w-4 h-4 mr-2" />
          Connect
        </Button>
        <Button variant="outline" className="flex-1">
          <TestTube className="w-4 h-4 mr-2" />
          Test Connection
        </Button>
      </div>

      <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">
          Diagnostic Log
        </p>
        <div className="text-xs text-zinc-400 italic">No connection attempts yet</div>
      </div>
    </div>
  );
}

function FieldMappingStepPanel() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium text-zinc-900 mb-1">Map Fields to Schema</h3>
        <p className="text-sm text-zinc-500">
          Configure how ServiceNow fields map to your classification schema.
        </p>
      </div>

      <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-900">Prerequisites required</p>
            <p className="text-xs text-amber-700 mt-1">
              Connect ServiceNow before configuring field mappings
            </p>
          </div>
        </div>
      </div>

      <Button className="w-full" disabled>
        <MapPin className="w-4 h-4 mr-2" />
        Configure Mappings
      </Button>
    </div>
  );
}

function E2ETestStepPanel() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium text-zinc-900 mb-1">Test End-to-End Run</h3>
        <p className="text-sm text-zinc-500">
          Validate the complete workflow from work object ingestion to agent processing.
        </p>
      </div>

      <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-900">Prerequisites required</p>
            <p className="text-xs text-amber-700 mt-1">
              Complete all previous steps before running end-to-end test
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Button className="w-full" disabled>
          <Play className="w-4 h-4 mr-2" />
          Run Test
        </Button>

        <Button variant="outline" className="w-full" disabled>
          View Test Report
        </Button>
      </div>
    </div>
  );
}

export default function TenantSetup() {
  const [selectedStep, setSelectedStep] = useState<string>("drive-scaffold");

  const renderStepPanel = () => {
    switch (selectedStep) {
      case "schema":
        return <SchemaStepPanel />;
      case "drive-connect":
        return <DriveConnectStepPanel />;
      case "drive-scaffold":
        return <DriveScaffoldStepPanel />;
      case "knowledge-sync":
        return <KnowledgeSyncStepPanel />;
      case "servicenow-connect":
        return <ServiceNowConnectStepPanel />;
      case "field-mapping":
        return <FieldMappingStepPanel />;
      case "e2e-test":
        return <E2ETestStepPanel />;
      default:
        return null;
    }
  };

  const completedSteps = setupSteps.filter((s) => s.status === "completed").length;
  const totalSteps = setupSteps.length;
  const progressPercentage = (completedSteps / totalSteps) * 100;

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Tenant Setup"
        description="Configure your tenant for agent operations"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Admin" },
          { label: "Tenant Setup" },
        ]}
      />

      <ScrollArea className="flex-1 bg-zinc-50">
        <div className="p-8 space-y-6">
          {/* Tenant Health Summary */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-zinc-900">Tenant Health</h3>
                <p className="text-sm text-zinc-500 mt-1">Demo Tenant configuration status</p>
              </div>
              <Badge variant="outline" className="text-xs">
                {completedSteps} of {totalSteps} complete
              </Badge>
            </div>

            <div className="mb-4">
              <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-6">
              <div>
                <p className="text-xs text-zinc-500 mb-2">Schema</p>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-medium text-zinc-900">OK</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-zinc-500 mb-2">Drive</p>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-medium text-zinc-900">Configured</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-zinc-500 mb-2">ServiceNow</p>
                <div className="flex items-center gap-2">
                  <Circle className="w-4 h-4 text-zinc-300" />
                  <span className="text-sm font-medium text-zinc-500">Not Connected</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-zinc-500 mb-2">Last Run</p>
                <div className="flex items-center gap-2">
                  <Circle className="w-4 h-4 text-zinc-300" />
                  <span className="text-sm font-medium text-zinc-500">Never</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Two Column Layout */}
          <div className="grid grid-cols-3 gap-6">
            {/* Left Column - Setup Checklist */}
            <div className="col-span-1">
              <Card className="p-6">
                <h3 className="font-medium text-zinc-900 mb-4">Setup Checklist</h3>
                <div className="space-y-2">
                  {setupSteps.map((step, index) => {
                    return (
                      <button
                        key={step.id}
                        onClick={() => setSelectedStep(step.id)}
                        className={`
                          w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors
                          ${
                            selectedStep === step.id
                              ? "bg-blue-50 border border-blue-200"
                              : "hover:bg-zinc-50 border border-transparent"
                          }
                        `}
                      >
                        <StatusIcon status={step.status} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-zinc-400 font-medium">
                              {index + 1}
                            </span>
                            <p className="text-sm font-medium text-zinc-900 truncate">
                              {step.title}
                            </p>
                          </div>
                          <p className="text-xs text-zinc-500 truncate">{step.description}</p>
                        </div>
                        {selectedStep === step.id && (
                          <ChevronRight className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </Card>
            </div>

            {/* Right Column - Step Detail Panel */}
            <div className="col-span-2">
              <Card className="p-6">
                {renderStepPanel()}
              </Card>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
