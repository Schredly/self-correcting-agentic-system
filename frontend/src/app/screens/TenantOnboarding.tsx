import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  CheckCircle2,
  Circle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Database,
  Plug,
  FolderTree,
  HardDrive,
  FileText,
  Zap,
  TestTube,
  Play,
  Check,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { ScrollArea } from "../components/ui/scroll-area";
import { Checkbox } from "../components/ui/checkbox";

type StepStatus = "not-started" | "in-progress" | "complete";

interface Step {
  id: number;
  title: string;
  icon: any;
  status: StepStatus;
}

interface ClassificationNode {
  id: string;
  name: string;
  enabled: boolean;
  editable: boolean;
  children?: ClassificationNode[];
}

const initialSteps: Step[] = [
  { id: 1, title: "Choose Source System", icon: Database, status: "complete" },
  { id: 2, title: "Connect System", icon: Plug, status: "complete" },
  { id: 3, title: "Discover Classification", icon: FolderTree, status: "in-progress" },
  { id: 4, title: "Connect Google Drive", icon: HardDrive, status: "not-started" },
  { id: 5, title: "Apply Folder Structure", icon: FileText, status: "not-started" },
  { id: 6, title: "Sync Knowledge", icon: Database, status: "not-started" },
  { id: 7, title: "Activate", icon: Zap, status: "not-started" },
];

function StepIcon({ status }: { status: StepStatus }) {
  if (status === "complete") {
    return (
      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
      </div>
    );
  }
  if (status === "in-progress") {
    return (
      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
        <Circle className="w-5 h-5 text-blue-600 fill-blue-600" />
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center">
      <Circle className="w-5 h-5 text-zinc-400" />
    </div>
  );
}

function HorizontalStepper({
  steps,
  activeStep,
  onStepClick,
}: {
  steps: Step[];
  activeStep: number;
  onStepClick: (stepId: number) => void;
}) {
  return (
    <div className="relative">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isActive = activeStep === step.id;
          const isClickable = step.status !== "not-started" || index === 0;

          return (
            <div key={step.id} className="flex-1 flex items-center">
              <button
                onClick={() => isClickable && onStepClick(step.id)}
                disabled={!isClickable}
                className={`
                  flex flex-col items-center gap-2 transition-opacity
                  ${isClickable ? "cursor-pointer" : "cursor-not-allowed opacity-50"}
                `}
              >
                <StepIcon status={step.status} />
                <div className="text-center">
                  <p
                    className={`text-sm font-medium ${
                      isActive ? "text-zinc-900" : "text-zinc-600"
                    }`}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">Step {step.id}</p>
                </div>
              </button>
              {index < steps.length - 1 && (
                <div className="flex-1 h-[2px] bg-zinc-200 mx-4 mt-[-32px]">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{
                      width: step.status === "complete" ? "100%" : "0%",
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Step1ChooseSourceSystem({
  selectedSystem,
  onSelect,
}: {
  selectedSystem: string;
  onSelect: (system: string) => void;
}) {
  const systems = [
    { id: "servicenow", name: "ServiceNow", description: "Incident and change management" },
    { id: "jira", name: "Jira", description: "Issue and project tracking" },
    { id: "salesforce", name: "Salesforce", description: "Customer relationship management" },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-600">
        Select the primary source system for your work objects
      </p>
      <div className="grid grid-cols-3 gap-4">
        {systems.map((system) => (
          <button
            key={system.id}
            onClick={() => onSelect(system.id)}
            className={`
              p-4 rounded-lg border-2 text-left transition-all
              ${
                selectedSystem === system.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-zinc-200 hover:border-zinc-300 bg-white"
              }
            `}
          >
            <div className="flex items-center gap-3 mb-2">
              <Database className="w-5 h-5 text-blue-600" />
              <h4 className="font-medium text-zinc-900">{system.name}</h4>
            </div>
            <p className="text-sm text-zinc-500">{system.description}</p>
            {selectedSystem === system.id && (
              <div className="mt-3 flex items-center gap-2 text-sm text-blue-600">
                <Check className="w-4 h-4" />
                <span>Selected</span>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function Step2ConnectSystem() {
  const [instanceUrl, setInstanceUrl] = useState("https://demo.service-now.com");
  const [username, setUsername] = useState("admin@acme.com");
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);

  const handleTest = () => {
    setIsTestingConnection(true);
    setTestResult(null);
    setTimeout(() => {
      setTestResult("success");
      setIsTestingConnection(false);
    }, 2000);
  };

  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="instance-url">Instance URL</Label>
          <Input
            id="instance-url"
            value={instanceUrl}
            onChange={(e) => setInstanceUrl(e.target.value)}
            className="mt-2"
          />
        </div>
        <div>
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-2"
          />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" placeholder="••••••••••••" className="mt-2" />
        </div>
        <Button onClick={handleTest} disabled={isTestingConnection} className="w-full">
          {isTestingConnection ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <TestTube className="w-4 h-4 mr-2" />
              Test Connection
            </>
          )}
        </Button>
      </div>

      <div className="bg-zinc-50 rounded-lg border border-zinc-200 p-4">
        <h4 className="text-sm font-medium text-zinc-900 mb-3">Test Results</h4>
        {!testResult && !isTestingConnection && (
          <p className="text-sm text-zinc-400 italic">Click "Test Connection" to validate</p>
        )}
        {testResult === "success" && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
              <span>Connection successful</span>
            </div>
            <div className="text-xs text-zinc-600 space-y-1 ml-6">
              <div>✓ Authentication validated</div>
              <div>✓ API endpoint accessible</div>
              <div>✓ Permissions verified</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Step3DiscoverClassification() {
  const [classification, setClassification] = useState<ClassificationNode[]>([
    {
      id: "1",
      name: "Department",
      enabled: true,
      editable: false,
      children: [
        { id: "1-1", name: "IT", enabled: true, editable: true },
        { id: "1-2", name: "HR", enabled: true, editable: true },
        { id: "1-3", name: "Finance", enabled: false, editable: true },
      ],
    },
    {
      id: "2",
      name: "Priority",
      enabled: true,
      editable: false,
      children: [
        { id: "2-1", name: "Critical", enabled: true, editable: true },
        { id: "2-2", name: "High", enabled: true, editable: true },
        { id: "2-3", name: "Medium", enabled: true, editable: true },
        { id: "2-4", name: "Low", enabled: false, editable: true },
      ],
    },
    {
      id: "3",
      name: "Category",
      enabled: false,
      editable: false,
      children: [
        { id: "3-1", name: "Hardware", enabled: false, editable: true },
        { id: "3-2", name: "Software", enabled: false, editable: true },
        { id: "3-3", name: "Network", enabled: false, editable: true },
      ],
    },
  ]);

  const toggleDimension = (id: string) => {
    setClassification((prev) =>
      prev.map((dim) => (dim.id === id ? { ...dim, enabled: !dim.enabled } : dim))
    );
  };

  const toggleCategory = (dimId: string, catId: string) => {
    setClassification((prev) =>
      prev.map((dim) =>
        dim.id === dimId
          ? {
              ...dim,
              children: dim.children?.map((cat) =>
                cat.id === catId ? { ...cat, enabled: !cat.enabled } : cat
              ),
            }
          : dim
      )
    );
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-600">
        Discovered classification from ServiceNow. Select dimensions and categories to import.
      </p>
      <div className="space-y-3">
        {classification.map((dimension) => (
          <Card key={dimension.id} className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <Checkbox
                checked={dimension.enabled}
                onCheckedChange={() => toggleDimension(dimension.id)}
              />
              <Input
                value={dimension.name}
                className="flex-1 font-medium"
                disabled={!dimension.editable}
              />
              <Badge variant="outline" className="text-xs">
                {dimension.children?.length || 0} categories
              </Badge>
            </div>
            {dimension.enabled && dimension.children && (
              <div className="ml-8 space-y-2">
                {dimension.children.map((category) => (
                  <div key={category.id} className="flex items-center gap-3">
                    <Checkbox
                      checked={category.enabled}
                      onCheckedChange={() => toggleCategory(dimension.id, category.id)}
                    />
                    <Input
                      value={category.name}
                      className="flex-1 text-sm"
                      disabled={!category.editable}
                    />
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

function Step4ConnectDrive() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const handleConnect = () => {
    setIsConnecting(true);
    setTimeout(() => {
      setIsConnected(true);
      setIsConnecting(false);
    }, 2000);
  };

  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="space-y-4">
        <p className="text-sm text-zinc-600">
          Connect to Google Drive to store and organize knowledge documents.
        </p>
        {!isConnected ? (
          <>
            <div>
              <Label htmlFor="drive-email">Google Account</Label>
              <Input
                id="drive-email"
                type="email"
                placeholder="workspace@acme.com"
                className="mt-2"
              />
            </div>
            <Button onClick={handleConnect} disabled={isConnecting} className="w-full">
              {isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <HardDrive className="w-4 h-4 mr-2" />
                  Connect Google Drive
                </>
              )}
            </Button>
          </>
        ) : (
          <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-sm font-medium text-emerald-900">Connected</p>
                <p className="text-xs text-emerald-700 mt-1">workspace@acme.com</p>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="bg-zinc-50 rounded-lg border border-zinc-200 p-4">
        <h4 className="text-sm font-medium text-zinc-900 mb-2">Permissions Required</h4>
        <ul className="text-sm text-zinc-600 space-y-2">
          <li className="flex items-start gap-2">
            <Check className="w-4 h-4 text-emerald-600 mt-0.5" />
            <span>Read and write files</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="w-4 h-4 text-emerald-600 mt-0.5" />
            <span>Create folders</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="w-4 h-4 text-emerald-600 mt-0.5" />
            <span>Manage metadata</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

function Step5ApplyFolderStructure() {
  const [isApplying, setIsApplying] = useState(false);
  const [isApplied, setIsApplied] = useState(false);

  const folderStructure = [
    { name: "Department", children: ["IT", "HR"] },
    { name: "Priority", children: ["Critical", "High", "Medium"] },
  ];

  const handleApply = () => {
    setIsApplying(true);
    setTimeout(() => {
      setIsApplied(true);
      setIsApplying(false);
    }, 2000);
  };

  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="space-y-4">
        <p className="text-sm text-zinc-600">
          Create folder structure in Google Drive based on your classification schema.
        </p>
        <Card className="p-4 bg-zinc-50">
          <h4 className="text-sm font-medium text-zinc-900 mb-3">Folder Preview</h4>
          <div className="space-y-2 text-sm">
            <div className="font-mono text-zinc-700">/Knowledge Base/</div>
            {folderStructure.map((folder) => (
              <div key={folder.name}>
                <div className="font-mono text-zinc-700 ml-4">├── {folder.name}/</div>
                {folder.children.map((child, idx) => (
                  <div key={child} className="font-mono text-zinc-600 ml-8">
                    {idx === folder.children.length - 1 ? "└──" : "├──"} {child}/
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Card>
        <Button onClick={handleApply} disabled={isApplying || isApplied} className="w-full">
          {isApplying ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating Folders...
            </>
          ) : isApplied ? (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Folders Created
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Apply Structure
            </>
          )}
        </Button>
      </div>
      <div className="bg-zinc-50 rounded-lg border border-zinc-200 p-4">
        <h4 className="text-sm font-medium text-zinc-900 mb-2">What happens next?</h4>
        <ul className="text-sm text-zinc-600 space-y-2">
          <li>• Folders created in Google Drive</li>
          <li>• Metadata tags applied</li>
          <li>• Permissions configured</li>
          <li>• Ready for document sync</li>
        </ul>
      </div>
    </div>
  );
}

function Step6SyncKnowledge() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncComplete, setSyncComplete] = useState(false);

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setSyncComplete(true);
      setIsSyncing(false);
    }, 3000);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-600">
        Sync documents from Google Drive to the knowledge base.
      </p>
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-zinc-500 mb-2">Documents Found</p>
          <p className="text-2xl font-semibold text-zinc-900">147</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-zinc-500 mb-2">Ready to Sync</p>
          <p className="text-2xl font-semibold text-zinc-900">142</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-zinc-500 mb-2">Errors</p>
          <p className="text-2xl font-semibold text-red-600">5</p>
        </Card>
      </div>
      <Button onClick={handleSync} disabled={isSyncing || syncComplete} className="w-full">
        {isSyncing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Syncing Knowledge...
          </>
        ) : syncComplete ? (
          <>
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Sync Complete
          </>
        ) : (
          <>
            <Database className="w-4 h-4 mr-2" />
            Start Sync
          </>
        )}
      </Button>
    </div>
  );
}

function Step7Activate() {
  const [isActivating, setIsActivating] = useState(false);

  const handleActivate = () => {
    setIsActivating(true);
    setTimeout(() => {
      setIsActivating(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Zap className="w-8 h-8 text-emerald-600" />
        </div>
        <h3 className="text-lg font-semibold text-zinc-900 mb-2">Ready to Activate</h3>
        <p className="text-sm text-zinc-600 max-w-md mx-auto">
          All configuration steps are complete. Activate your tenant to begin processing work
          objects with AI agents.
        </p>
      </div>

      <Card className="p-6">
        <h4 className="text-sm font-medium text-zinc-900 mb-4">Configuration Summary</h4>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-600">Source System</span>
            <span className="text-zinc-900 font-medium">ServiceNow</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-600">Classification Dimensions</span>
            <span className="text-zinc-900 font-medium">2 active</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-600">Knowledge Documents</span>
            <span className="text-zinc-900 font-medium">142 synced</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-600">Google Drive</span>
            <span className="text-zinc-900 font-medium">Connected</span>
          </div>
        </div>
      </Card>

      <Button onClick={handleActivate} disabled={isActivating} className="w-full" size="lg">
        {isActivating ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Activating Tenant...
          </>
        ) : (
          <>
            <Zap className="w-4 h-4 mr-2" />
            Activate Tenant
          </>
        )}
      </Button>
    </div>
  );
}

export default function TenantOnboarding() {
  const [steps] = useState<Step[]>(initialSteps);
  const [activeStep, setActiveStep] = useState(3);
  const [expandedStep, setExpandedStep] = useState<number | null>(3);
  const [selectedSystem, setSelectedSystem] = useState("servicenow");
  const [tenantStatus] = useState<"draft" | "active">("draft");

  const handleStepClick = (stepId: number) => {
    setActiveStep(stepId);
    setExpandedStep(expandedStep === stepId ? null : stepId);
  };

  const renderStepContent = (stepId: number) => {
    switch (stepId) {
      case 1:
        return (
          <Step1ChooseSourceSystem
            selectedSystem={selectedSystem}
            onSelect={setSelectedSystem}
          />
        );
      case 2:
        return <Step2ConnectSystem />;
      case 3:
        return <Step3DiscoverClassification />;
      case 4:
        return <Step4ConnectDrive />;
      case 5:
        return <Step5ApplyFolderStructure />;
      case 6:
        return <Step6SyncKnowledge />;
      case 7:
        return <Step7Activate />;
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-zinc-200 bg-white px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-zinc-900 text-lg">Acme Corporation</h2>
            <p className="text-sm text-zinc-500 mt-1">Tenant onboarding wizard</p>
          </div>
          <Badge
            variant="outline"
            className={
              tenantStatus === "active"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-zinc-50 text-zinc-700 border-zinc-200"
            }
          >
            {tenantStatus === "draft" ? "Draft" : "Active"}
          </Badge>
        </div>
      </div>

      <ScrollArea className="flex-1 bg-zinc-50">
        <div className="p-8 space-y-8 max-w-6xl mx-auto">
          {/* Horizontal Stepper */}
          <Card className="p-8">
            <HorizontalStepper steps={steps} activeStep={activeStep} onStepClick={handleStepClick} />
          </Card>

          {/* Accordion Steps */}
          <div className="space-y-4">
            {steps.map((step) => {
              const isExpanded = expandedStep === step.id;

              return (
                <Card key={step.id} className="overflow-hidden">
                  <button
                    onClick={() => handleStepClick(step.id)}
                    className="w-full flex items-center justify-between p-6 text-left hover:bg-zinc-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <StepIcon status={step.status} />
                      <div>
                        <h3 className="font-medium text-zinc-900">{step.title}</h3>
                        <p className="text-sm text-zinc-500 mt-1">Step {step.id} of {steps.length}</p>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-zinc-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-zinc-400" />
                    )}
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="px-6 pb-6 border-t border-zinc-200">
                          <div className="pt-6">{renderStepContent(step.id)}</div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              );
            })}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
