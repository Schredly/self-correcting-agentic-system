import { useState, useEffect, useCallback, useRef } from "react";
import {
  CheckCircle2,
  Circle,
  AlertCircle,
  ChevronRight,
  Database,
  HardDrive,
  Plug,
  Play,
  FolderTree,
  Loader2,
  Building2,
  Trash2,
  Plus,
  Power,
  Eye,
} from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { ScrollArea } from "../components/ui/scroll-area";
import { Checkbox } from "../components/ui/checkbox";
import { useTenant } from "../context/TenantContext";
import {
  fetchTenantHealth,
  fetchTenant,
  fetchClassificationSchema,
  putClassificationSchema,
  fetchAdapterMapping,
  putAdapterMapping,
  fetchGoogleDriveConfig,
  putGoogleDriveConfig,
  fetchScaffoldPlan,
  applyScaffoldPlan,
  type TenantHealth,
  type TenantDetail,
  type ClassificationLevelConfig,
  type ClassificationSchema,
  type AdapterFieldMapping,
  type AdapterMapping,
  type GoogleDriveConfig,
  type DriveNode,
} from "../../lib/api";

// ── Types ───────────────────────────────────────────────────────────────────

type StepStatus = "completed" | "in-progress" | "pending";

interface StepDef {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
}

interface LogEntry {
  ts: string;
  level: "info" | "success" | "error" | "warn";
  message: string;
}

// ── Constants ───────────────────────────────────────────────────────────────

const STEPS: StepDef[] = [
  {
    id: "configure-adapter",
    title: "Configure Adapter",
    description: "Connect source system and map fields",
    icon: Plug,
  },
  {
    id: "discover-classification",
    title: "Discover Classification",
    description: "Define classification schema levels",
    icon: FolderTree,
  },
  {
    id: "connect-drive",
    title: "Connect Google Drive",
    description: "Set root folder for knowledge base",
    icon: HardDrive,
  },
  {
    id: "apply-scaffold",
    title: "Apply Scaffold",
    description: "Create Drive folder structure",
    icon: FolderTree,
  },
  {
    id: "sync-knowledge",
    title: "Sync Knowledge",
    description: "Import and index documents",
    icon: Database,
  },
  {
    id: "activate-tenant",
    title: "Activate Tenant",
    description: "Enable tenant for agent operations",
    icon: Power,
  },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

function deriveStepStatuses(
  health: TenantHealth,
  tenantStatus: string
): Record<string, StepStatus> {
  const keys: { id: string; done: boolean }[] = [
    { id: "configure-adapter", done: health.adapter_mapping_defined },
    { id: "discover-classification", done: health.schema_defined },
    { id: "connect-drive", done: health.drive_configured },
    { id: "apply-scaffold", done: health.drive_scaffold_applied },
    { id: "sync-knowledge", done: health.knowledge_synced },
    { id: "activate-tenant", done: tenantStatus === "active" },
  ];

  const result: Record<string, StepStatus> = {};
  let foundIncomplete = false;

  for (const { id, done } of keys) {
    if (done) {
      result[id] = "completed";
    } else if (!foundIncomplete) {
      result[id] = "in-progress";
      foundIncomplete = true;
    } else {
      result[id] = "pending";
    }
  }

  return result;
}

function timestamp(): string {
  return new Date().toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// ── StatusIcon ──────────────────────────────────────────────────────────────

function StatusIcon({ status }: { status: StepStatus }) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
    case "in-progress":
      return <Circle className="w-5 h-5 text-blue-600 fill-blue-600" />;
    default:
      return <Circle className="w-5 h-5 text-zinc-300" />;
  }
}

// ── Step Panels ─────────────────────────────────────────────────────────────

function ConfigureAdapterPanel({
  tenantId,
  tenantDetail,
  adapterMapping,
  stepLoading,
  addLog,
  onRefresh,
}: {
  tenantId: string;
  tenantDetail: TenantDetail | null;
  adapterMapping: AdapterMapping | null;
  stepLoading: boolean;
  addLog: (level: LogEntry["level"], message: string) => void;
  onRefresh: () => Promise<void>;
}) {
  const [selectedAdapter, setSelectedAdapter] = useState<string>(
    tenantDetail?.enabled_adapters?.[0] ?? ""
  );
  const [connectionUrl, setConnectionUrl] = useState("");
  const [connectionUser, setConnectionUser] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  const [connectionTested, setConnectionTested] = useState(false);
  const [mappings, setMappings] = useState<AdapterFieldMapping[]>(
    adapterMapping?.mappings ?? [{ source_field: "", classification_key: "" }]
  );
  const [saving, setSaving] = useState(false);

  const adapters = ["servicenow", "jira", "salesforce"];

  const handleTestConnection = () => {
    setIsTesting(true);
    addLog("info", `Testing connection to ${selectedAdapter}...`);

    setTimeout(() => {
      addLog("success", `Connection to ${selectedAdapter} successful (Simulated)`);
      setConnectionTested(true);
      setIsTesting(false);
    }, 2000);
  };

  const addMappingRow = () => {
    setMappings([...mappings, { source_field: "", classification_key: "" }]);
  };

  const removeMappingRow = (index: number) => {
    setMappings(mappings.filter((_, i) => i !== index));
  };

  const updateMapping = (
    index: number,
    field: keyof AdapterFieldMapping,
    value: string
  ) => {
    const updated = [...mappings];
    const current = updated[index];
    if (current) {
      updated[index] = { ...current, [field]: value } as AdapterFieldMapping;
    }
    setMappings(updated);
  };

  const handleSaveMappings = async () => {
    const validMappings = mappings.filter(
      (m) => m.source_field && m.classification_key
    );
    if (validMappings.length === 0) {
      addLog("error", "At least one complete field mapping is required");
      return;
    }

    setSaving(true);
    addLog("info", "Saving adapter field mappings...");

    try {
      await putAdapterMapping(tenantId, {
        source_system: selectedAdapter,
        record_type: "incident",
        mappings: validMappings,
      });
      addLog("success", "Adapter mappings saved successfully");
      await onRefresh();
    } catch (err) {
      addLog("error", `Failed to save mappings: ${err}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium text-zinc-900 mb-1">Configure Adapter</h3>
        <p className="text-sm text-zinc-500">
          Select a source system, test the connection, and map fields to your
          classification schema.
        </p>
      </div>

      {/* Adapter selection */}
      <div>
        <Label className="mb-2 block">Source System</Label>
        <div className="flex gap-4">
          {adapters.map((a) => (
            <label key={a} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={selectedAdapter === a}
                onCheckedChange={() => setSelectedAdapter(a)}
              />
              <span className="text-sm capitalize">{a}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Connection form */}
      {selectedAdapter && (
        <div className="space-y-4 p-4 bg-zinc-50 rounded-lg border border-zinc-200">
          <div>
            <Label htmlFor="conn-url">Instance URL</Label>
            <Input
              id="conn-url"
              value={connectionUrl}
              onChange={(e) => setConnectionUrl(e.target.value)}
              placeholder={`https://your-instance.${selectedAdapter}.com`}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="conn-user">Username</Label>
            <Input
              id="conn-user"
              value={connectionUser}
              onChange={(e) => setConnectionUser(e.target.value)}
              placeholder="admin@acme.com"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="conn-key">API Key</Label>
            <Input
              id="conn-key"
              type="password"
              placeholder="••••••••••••"
              className="mt-1"
            />
          </div>
          <Button
            variant="outline"
            onClick={handleTestConnection}
            disabled={isTesting || !selectedAdapter}
          >
            {isTesting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plug className="w-4 h-4 mr-2" />
            )}
            {isTesting ? "Testing..." : "Test Connection"}
          </Button>
          {connectionTested && (
            <div className="flex items-center gap-2 text-sm text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
              Connection verified (Simulated)
            </div>
          )}
        </div>
      )}

      {/* Field mapping */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Field Mappings</Label>
          <Button variant="ghost" size="sm" onClick={addMappingRow}>
            <Plus className="w-3 h-3 mr-1" />
            Add Row
          </Button>
        </div>
        <div className="space-y-2">
          {mappings.map((m, i) => (
            <div key={i} className="flex gap-2 items-center">
              <Input
                placeholder="source_field"
                value={m.source_field}
                onChange={(e) => updateMapping(i, "source_field", e.target.value)}
                className="flex-1"
              />
              <span className="text-zinc-400 text-sm">&rarr;</span>
              <Input
                placeholder="classification_key"
                value={m.classification_key}
                onChange={(e) =>
                  updateMapping(i, "classification_key", e.target.value)
                }
                className="flex-1"
              />
              {mappings.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeMappingRow(i)}
                >
                  <Trash2 className="w-3 h-3 text-zinc-400" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      <Button
        className="w-full"
        onClick={handleSaveMappings}
        disabled={saving || stepLoading}
      >
        {saving ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <CheckCircle2 className="w-4 h-4 mr-2" />
        )}
        {saving ? "Saving..." : "Save Mappings"}
      </Button>
    </div>
  );
}

function DiscoverClassificationPanel({
  tenantId,
  classificationSchema,
  stepLoading,
  addLog,
  onRefresh,
}: {
  tenantId: string;
  classificationSchema: ClassificationSchema | null;
  stepLoading: boolean;
  addLog: (level: LogEntry["level"], message: string) => void;
  onRefresh: () => Promise<void>;
}) {
  const [discovering, setDiscovering] = useState(false);
  const [levels, setLevels] = useState<ClassificationLevelConfig[]>(
    classificationSchema?.levels ?? []
  );
  const [saving, setSaving] = useState(false);

  const handleDiscover = () => {
    setDiscovering(true);
    addLog("info", "Discovering classification levels from ServiceNow...");

    // TODO: replace with real GET /admin/{tenantId}/servicenow/discover-classification
    setTimeout(() => {
      const discovered: ClassificationLevelConfig[] = [
        { key: "category", display_name: "Category", required: true },
        { key: "subcategory", display_name: "Subcategory", required: true },
        { key: "business_service", display_name: "Business Service", required: false },
        { key: "priority", display_name: "Priority", required: true },
      ];
      setLevels(discovered);
      addLog(
        "success",
        `Discovered ${discovered.length} classification levels (Simulated)`
      );
      setDiscovering(false);
    }, 2500);
  };

  const updateLevel = (
    index: number,
    field: keyof ClassificationLevelConfig,
    value: string | boolean
  ) => {
    const updated = [...levels];
    const current = updated[index];
    if (current) {
      updated[index] = { ...current, [field]: value } as ClassificationLevelConfig;
    }
    setLevels(updated);
  };

  const handleSave = async () => {
    if (levels.length === 0) {
      addLog("error", "At least one classification level is required");
      return;
    }

    setSaving(true);
    addLog("info", "Saving classification schema...");

    try {
      await putClassificationSchema(tenantId, {
        levels,
        version: "1.0",
      });
      addLog("success", "Classification schema saved successfully");
      await onRefresh();
    } catch (err) {
      addLog("error", `Failed to save schema: ${err}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium text-zinc-900 mb-1">
          Discover Classification
        </h3>
        <p className="text-sm text-zinc-500">
          Discover classification levels from your source system or define them
          manually.
        </p>
      </div>

      <Button
        variant="outline"
        className="w-full"
        onClick={handleDiscover}
        disabled={discovering || stepLoading}
      >
        {discovering ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <FolderTree className="w-4 h-4 mr-2" />
        )}
        {discovering
          ? "Discovering..."
          : "Discover from ServiceNow"}
      </Button>

      {levels.length > 0 && (
        <>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Label>Classification Levels</Label>
              <Badge variant="outline" className="text-xs">
                {levels.length} levels
              </Badge>
            </div>
            <div className="space-y-2">
              {levels.map((level, i) => (
                <div
                  key={i}
                  className="flex gap-2 items-center p-2 bg-zinc-50 rounded border border-zinc-200"
                >
                  <Input
                    value={level.key}
                    onChange={(e) => updateLevel(i, "key", e.target.value)}
                    placeholder="key"
                    className="flex-1"
                  />
                  <Input
                    value={level.display_name}
                    onChange={(e) =>
                      updateLevel(i, "display_name", e.target.value)
                    }
                    placeholder="Display Name"
                    className="flex-1"
                  />
                  <label className="flex items-center gap-1 text-xs whitespace-nowrap">
                    <Checkbox
                      checked={level.required}
                      onCheckedChange={(v) => updateLevel(i, "required", !!v)}
                    />
                    Required
                  </label>
                </div>
              ))}
            </div>
          </div>

          <Button
            className="w-full"
            onClick={handleSave}
            disabled={saving || stepLoading}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4 mr-2" />
            )}
            {saving ? "Saving..." : "Save as Classification Schema"}
          </Button>
        </>
      )}
    </div>
  );
}

function ConnectDrivePanel({
  tenantId,
  driveConfig,
  stepLoading,
  addLog,
  onRefresh,
  onDriveConfigLoaded,
}: {
  tenantId: string;
  driveConfig: GoogleDriveConfig | null;
  stepLoading: boolean;
  addLog: (level: LogEntry["level"], message: string) => void;
  onRefresh: () => Promise<void>;
  onDriveConfigLoaded: (config: GoogleDriveConfig | null) => void;
}) {
  const [rootFolderId, setRootFolderId] = useState("");
  const [saving, setSaving] = useState(false);
  const [reconfiguring, setReconfiguring] = useState(false);
  const [loading, setLoading] = useState(false);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    setLoading(true);
    fetchGoogleDriveConfig(tenantId)
      .then((config) => onDriveConfigLoaded(config))
      .catch(() => onDriveConfigLoaded(null))
      .finally(() => setLoading(false));
  }, [tenantId, onDriveConfigLoaded]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  const isConfigured = driveConfig?.status === "configured" && !reconfiguring;

  const handleSave = async () => {
    if (!rootFolderId.trim()) {
      addLog("error", "Root Folder ID is required");
      return;
    }

    setSaving(true);
    addLog("info", "Configuring Google Drive...");

    try {
      await putGoogleDriveConfig(tenantId, rootFolderId.trim());
      addLog("success", "Google Drive configured successfully");
      setReconfiguring(false);
      await onRefresh();
    } catch (err) {
      addLog("error", `Failed to configure Drive: ${err}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium text-zinc-900 mb-1">Connect Google Drive</h3>
        <p className="text-sm text-zinc-500">
          Configure the Google Drive root folder for your tenant's knowledge
          base.
        </p>
      </div>

      {isConfigured ? (
        <>
          <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-emerald-900">
                  Drive Configured
                </p>
                <p className="text-xs text-emerald-700 mt-1">
                  Root Folder ID: {driveConfig?.root_folder_id}
                </p>
                <p className="text-xs text-emerald-700">
                  Updated: {driveConfig?.updated_at}
                </p>
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setReconfiguring(true)}
          >
            Reconfigure
          </Button>
        </>
      ) : (
        <>
          <div>
            <Label htmlFor="root-folder-id">Root Folder ID</Label>
            <Input
              id="root-folder-id"
              value={rootFolderId}
              onChange={(e) => setRootFolderId(e.target.value)}
              placeholder="e.g. 1aBcDeFgHiJkLmNoPqRsT"
              className="mt-2"
            />
            <p className="text-xs text-zinc-500 mt-2">
              The Google Drive folder ID where the knowledge base will be stored
            </p>
          </div>

          <Button
            className="w-full"
            onClick={handleSave}
            disabled={saving || stepLoading}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <HardDrive className="w-4 h-4 mr-2" />
            )}
            {saving ? "Configuring..." : "Configure Drive"}
          </Button>
        </>
      )}
    </div>
  );
}

function ApplyScaffoldPanel({
  tenantId,
  health,
  scaffoldPlan,
  stepLoading,
  addLog,
  onRefresh,
  onScaffoldPlanLoaded,
}: {
  tenantId: string;
  health: TenantHealth;
  scaffoldPlan: DriveNode[] | null;
  stepLoading: boolean;
  addLog: (level: LogEntry["level"], message: string) => void;
  onRefresh: () => Promise<void>;
  onScaffoldPlanLoaded: (plan: DriveNode[]) => void;
}) {
  const [previewing, setPreviewing] = useState(false);
  const [applying, setApplying] = useState(false);

  const handlePreview = async () => {
    setPreviewing(true);
    addLog("info", "Fetching scaffold plan...");

    try {
      const plan = await fetchScaffoldPlan(tenantId);
      onScaffoldPlanLoaded(plan);
      addLog("success", `Scaffold plan loaded: ${plan.length} nodes`);
    } catch (err) {
      addLog("error", `Failed to fetch scaffold plan: ${err}`);
    } finally {
      setPreviewing(false);
    }
  };

  const handleApply = async () => {
    setApplying(true);
    addLog("info", "Applying scaffold to Google Drive...");

    try {
      const result = await applyScaffoldPlan(tenantId);
      const count = Object.keys(result.created).length;
      addLog("success", `Scaffold applied — ${count} items created`);
      await onRefresh();
    } catch (err) {
      const msg = String(err);
      if (msg.includes("GOOGLE_SERVICE_ACCOUNT_FILE")) {
        addLog(
          "warn",
          "GOOGLE_SERVICE_ACCOUNT_FILE not set — scaffold-apply requires a service account"
        );
      } else {
        addLog("error", `Failed to apply scaffold: ${err}`);
      }
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium text-zinc-900 mb-1">Apply Scaffold</h3>
        <p className="text-sm text-zinc-500">
          Preview and create the folder structure in Google Drive based on your
          classification schema.
        </p>
      </div>

      {!health.drive_configured && (
        <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-900">
                Drive not configured
              </p>
              <p className="text-xs text-amber-700 mt-1">
                Connect Google Drive before applying scaffold
              </p>
            </div>
          </div>
        </div>
      )}

      <Button
        variant="outline"
        className="w-full"
        onClick={handlePreview}
        disabled={previewing || stepLoading}
      >
        {previewing ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Eye className="w-4 h-4 mr-2" />
        )}
        {previewing ? "Loading..." : "Preview Scaffold"}
      </Button>

      {scaffoldPlan && scaffoldPlan.length > 0 && (
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs font-medium text-blue-900 mb-2">
            Scaffold Plan ({scaffoldPlan.length} nodes):
          </p>
          <div className="space-y-0.5 text-xs text-blue-700 font-mono max-h-48 overflow-auto">
            {scaffoldPlan.map((node, i) => (
              <div key={i}>
                {node.parent_path}/{node.name}
                {node.kind === "folder" ? "/" : ""}
              </div>
            ))}
          </div>
        </div>
      )}

      <Button
        className="w-full"
        onClick={handleApply}
        disabled={applying || stepLoading || !health.drive_configured}
      >
        {applying ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Play className="w-4 h-4 mr-2" />
        )}
        {applying ? "Applying..." : "Apply Scaffold"}
      </Button>
    </div>
  );
}

function SyncKnowledgePanel({
  health,
  stepLoading,
  addLog,
}: {
  health: TenantHealth;
  stepLoading: boolean;
  addLog: (level: LogEntry["level"], message: string) => void;
}) {
  const [syncing, setSyncing] = useState(false);

  const handleSync = () => {
    setSyncing(true);
    addLog("info", "Starting knowledge sync...");

    // TODO: replace with POST /admin/{tenantId}/knowledge/sync
    setTimeout(() => {
      addLog("info", "Scanning Drive folders for documents...");
    }, 1000);

    setTimeout(() => {
      addLog("info", "Indexing 24 documents...");
    }, 2000);

    setTimeout(() => {
      addLog("success", "Knowledge sync complete — 24 documents indexed (Simulated)");
      setSyncing(false);
    }, 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium text-zinc-900 mb-1">Sync Knowledge</h3>
        <p className="text-sm text-zinc-500">
          Import and index documents from Google Drive for agent knowledge
          retrieval.
        </p>
      </div>

      {!health.drive_scaffold_applied && (
        <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-900">
                Prerequisites required
              </p>
              <p className="text-xs text-amber-700 mt-1">
                Drive scaffold must be applied first
              </p>
            </div>
          </div>
        </div>
      )}

      <Button
        className="w-full"
        onClick={handleSync}
        disabled={syncing || stepLoading || !health.drive_scaffold_applied}
      >
        {syncing ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Database className="w-4 h-4 mr-2" />
        )}
        {syncing ? "Syncing..." : "Start Sync"}
      </Button>
    </div>
  );
}

function ActivateTenantPanel({
  health,
  tenantStatus,
  stepLoading,
  addLog,
}: {
  health: TenantHealth;
  tenantStatus: string;
  stepLoading: boolean;
  addLog: (level: LogEntry["level"], message: string) => void;
}) {
  const [activating, setActivating] = useState(false);

  const priorSteps = [
    { label: "Adapter Configured", done: health.adapter_mapping_defined },
    { label: "Classification Defined", done: health.schema_defined },
    { label: "Drive Connected", done: health.drive_configured },
    { label: "Scaffold Applied", done: health.drive_scaffold_applied },
    { label: "Knowledge Synced", done: health.knowledge_synced },
  ];

  const allPriorDone = priorSteps.every((s) => s.done);

  const handleActivate = () => {
    setActivating(true);
    addLog("info", "Activating tenant...");

    // TODO: replace with PUT /tenants/{tenantId} { status: "active" }
    setTimeout(() => {
      addLog("info", "Running final validation checks...");
    }, 1000);

    setTimeout(() => {
      addLog("success", "Tenant activated successfully (Simulated)");
      setActivating(false);
    }, 2000);
  };

  if (tenantStatus === "active") {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="font-medium text-zinc-900 mb-1">Activate Tenant</h3>
        </div>
        <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-emerald-900">
                Tenant is active
              </p>
              <p className="text-xs text-emerald-700 mt-1">
                All setup steps are complete. The tenant is ready for agent
                operations.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium text-zinc-900 mb-1">Activate Tenant</h3>
        <p className="text-sm text-zinc-500">
          Review setup status and activate the tenant for agent operations.
        </p>
      </div>

      <div className="space-y-2">
        {priorSteps.map((s, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-2 rounded border border-zinc-100"
          >
            {s.done ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-zinc-300" />
            )}
            <span
              className={`text-sm ${s.done ? "text-zinc-900" : "text-zinc-400"}`}
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <Button
        className="w-full"
        onClick={handleActivate}
        disabled={activating || stepLoading || !allPriorDone}
      >
        {activating ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Power className="w-4 h-4 mr-2" />
        )}
        {activating ? "Activating..." : "Activate Tenant"}
      </Button>
    </div>
  );
}

// ── DiagnosticLogCard ───────────────────────────────────────────────────────

function DiagnosticLogCard({ logs }: { logs: LogEntry[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const levelIcon = (level: LogEntry["level"]) => {
    switch (level) {
      case "success":
        return <span className="text-emerald-600">&#10003;</span>;
      case "error":
        return <span className="text-red-600">&#10007;</span>;
      case "warn":
        return <span className="text-amber-600">&#9888;</span>;
      default:
        return <span className="text-blue-600">&rarr;</span>;
    }
  };

  return (
    <Card className="p-4">
      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">
        Diagnostic Log
      </p>
      <div
        ref={scrollRef}
        className="max-h-40 overflow-auto space-y-1 font-mono text-xs text-zinc-700"
      >
        {logs.length === 0 ? (
          <div className="text-zinc-400 italic">No log entries yet</div>
        ) : (
          logs.map((entry, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-zinc-400">[{entry.ts}]</span>
              {levelIcon(entry.level)}
              <span>{entry.message}</span>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function TenantSetup() {
  const { selectedTenant } = useTenant();

  // Core state
  const [health, setHealth] = useState<TenantHealth | null>(null);
  const [tenantDetail, setTenantDetail] = useState<TenantDetail | null>(null);
  const [selectedStep, setSelectedStep] = useState<string>(STEPS[0]!.id);
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthError, setHealthError] = useState<string | null>(null);

  // Lazy-loaded per-step data
  const [adapterMapping, setAdapterMapping] = useState<AdapterMapping | null>(null);
  const [classificationSchema, setClassificationSchema] =
    useState<ClassificationSchema | null>(null);
  const [driveConfig, setDriveConfig] = useState<GoogleDriveConfig | null>(null);
  const [scaffoldPlan, setScaffoldPlan] = useState<DriveNode[] | null>(null);

  // Shared
  const [stepLoading, setStepLoading] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = useCallback((level: LogEntry["level"], message: string) => {
    setLogs((prev) => [...prev, { ts: timestamp(), level, message }]);
  }, []);

  const tenantId = selectedTenant?.id ?? null;

  // Load health + tenant detail
  const loadHealth = useCallback(async () => {
    if (!tenantId) return;

    setHealthLoading(true);
    setHealthError(null);

    try {
      const [h, td] = await Promise.all([
        fetchTenantHealth(tenantId),
        fetchTenant(tenantId),
      ]);
      setHealth(h);
      setTenantDetail(td);

      // Auto-select first in-progress step
      const statuses = deriveStepStatuses(h, td.status);
      const firstInProgress = STEPS.find(
        (s) => statuses[s.id] === "in-progress"
      );
      if (firstInProgress) {
        setSelectedStep(firstInProgress.id);
      }
    } catch (err) {
      setHealthError(String(err));
    } finally {
      setHealthLoading(false);
    }
  }, [tenantId]);

  // Reset and reload when tenant changes
  useEffect(() => {
    setHealth(null);
    setTenantDetail(null);
    setAdapterMapping(null);
    setClassificationSchema(null);
    setDriveConfig(null);
    setScaffoldPlan(null);
    setLogs([]);
    setSelectedStep(STEPS[0]!.id);

    if (tenantId) {
      loadHealth();
    }
  }, [tenantId, loadHealth]);

  // Lazy-load step data when step changes
  useEffect(() => {
    if (!tenantId || !health) return;

    const loadStepData = async () => {
      setStepLoading(true);
      try {
        switch (selectedStep) {
          case "configure-adapter": {
            const mapping = await fetchAdapterMapping(
              tenantId,
              tenantDetail?.enabled_adapters?.[0] ?? "servicenow",
              "incident"
            );
            setAdapterMapping(mapping);
            break;
          }
          case "discover-classification": {
            const schema = await fetchClassificationSchema(tenantId);
            setClassificationSchema(schema);
            break;
          }
          // connect-drive loads inside its own panel
          // apply-scaffold loads on button click
          // sync-knowledge and activate-tenant don't need extra data
        }
      } catch {
        // 404s are handled by returning null from fetchers
      } finally {
        setStepLoading(false);
      }
    };

    loadStepData();
  }, [selectedStep, tenantId, health, tenantDetail]);

  // Refresh handler passed to step panels
  const handleRefresh = useCallback(async () => {
    await loadHealth();
  }, [loadHealth]);

  // ── No tenant selected ──────────────────────────────────────────────────

  if (!selectedTenant) {
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
        <div className="flex-1 flex items-center justify-center bg-zinc-50">
          <div className="text-center">
            <Building2 className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
            <p className="text-lg font-medium text-zinc-600">
              Select a tenant to begin setup
            </p>
            <p className="text-sm text-zinc-400 mt-1">
              Use the tenant selector in the sidebar
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Derive step statuses ────────────────────────────────────────────────

  const stepStatuses: Record<string, StepStatus> =
    health && tenantDetail
      ? deriveStepStatuses(health, tenantDetail.status)
      : Object.fromEntries(
          STEPS.map((s, i) => [s.id, i === 0 ? "in-progress" : "pending"] as const)
        );

  const completedCount = Object.values(stepStatuses).filter(
    (s) => s === "completed"
  ).length;
  const progressPercentage = (completedCount / STEPS.length) * 100;

  // ── Render step panel ───────────────────────────────────────────────────

  const renderStepPanel = () => {
    if (!health || !tenantId) return null;

    if (stepLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
        </div>
      );
    }

    switch (selectedStep) {
      case "configure-adapter":
        return (
          <ConfigureAdapterPanel
            tenantId={tenantId}
            tenantDetail={tenantDetail}
            adapterMapping={adapterMapping}
            stepLoading={stepLoading}
            addLog={addLog}
            onRefresh={handleRefresh}
          />
        );
      case "discover-classification":
        return (
          <DiscoverClassificationPanel
            tenantId={tenantId}
            classificationSchema={classificationSchema}
            stepLoading={stepLoading}
            addLog={addLog}
            onRefresh={handleRefresh}
          />
        );
      case "connect-drive":
        return (
          <ConnectDrivePanel
            tenantId={tenantId}
            driveConfig={driveConfig}
            stepLoading={stepLoading}
            addLog={addLog}
            onRefresh={handleRefresh}
            onDriveConfigLoaded={setDriveConfig}
          />
        );
      case "apply-scaffold":
        return (
          <ApplyScaffoldPanel
            tenantId={tenantId}
            health={health}
            scaffoldPlan={scaffoldPlan}
            stepLoading={stepLoading}
            addLog={addLog}
            onRefresh={handleRefresh}
            onScaffoldPlanLoaded={setScaffoldPlan}
          />
        );
      case "sync-knowledge":
        return (
          <SyncKnowledgePanel
            health={health}
            stepLoading={stepLoading}
            addLog={addLog}
          />
        );
      case "activate-tenant":
        return (
          <ActivateTenantPanel
            health={health}
            tenantStatus={tenantDetail?.status ?? "draft"}
            stepLoading={stepLoading}
            addLog={addLog}
          />
        );
      default:
        return null;
    }
  };

  // ── Main render ─────────────────────────────────────────────────────────

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title={`Tenant Setup — ${selectedTenant.name}`}
        description="Configure your tenant for agent operations"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Admin" },
          { label: "Tenant Setup" },
        ]}
      />

      <ScrollArea className="flex-1 bg-zinc-50">
        <div className="p-8 space-y-6">
          {/* Health Summary Card */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-zinc-900">Tenant Health</h3>
                <p className="text-sm text-zinc-500 mt-1">
                  {selectedTenant.name} configuration status
                </p>
              </div>
              {healthLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
              ) : (
                <Badge variant="outline" className="text-xs">
                  {completedCount} of {STEPS.length} complete
                </Badge>
              )}
            </div>

            {healthError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-red-700">
                  <AlertCircle className="w-4 h-4" />
                  Failed to load health data
                </div>
                <Button variant="outline" size="sm" onClick={loadHealth}>
                  Retry
                </Button>
              </div>
            )}

            <div className="mb-4">
              <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            {health && (
              <div className="grid grid-cols-4 gap-6">
                <div>
                  <p className="text-xs text-zinc-500 mb-2">Schema</p>
                  <div className="flex items-center gap-2">
                    {health.schema_defined ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Circle className="w-4 h-4 text-zinc-300" />
                    )}
                    <span className="text-sm font-medium text-zinc-900">
                      {health.schema_defined ? "Defined" : "Not Set"}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 mb-2">Drive</p>
                  <div className="flex items-center gap-2">
                    {health.drive_configured ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Circle className="w-4 h-4 text-zinc-300" />
                    )}
                    <span className="text-sm font-medium text-zinc-900">
                      {health.drive_configured ? "Configured" : "Not Set"}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 mb-2">Adapter</p>
                  <div className="flex items-center gap-2">
                    {health.adapter_mapping_defined ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Circle className="w-4 h-4 text-zinc-300" />
                    )}
                    <span className="text-sm font-medium text-zinc-900">
                      {health.adapter_mapping_defined ? "Mapped" : "Not Set"}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 mb-2">Last Run</p>
                  <div className="flex items-center gap-2">
                    {health.last_run_status ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Circle className="w-4 h-4 text-zinc-300" />
                    )}
                    <span className="text-sm font-medium text-zinc-900">
                      {health.last_run_status ?? "Never"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Two Column Layout */}
          <div className="grid grid-cols-3 gap-6">
            {/* Left Column - Setup Checklist */}
            <div className="col-span-1">
              <Card className="p-6">
                <h3 className="font-medium text-zinc-900 mb-4">
                  Setup Checklist
                </h3>
                <div className="space-y-2">
                  {STEPS.map((step, index) => {
                    const status = stepStatuses[step.id];
                    const isClickable =
                      status === "completed" || status === "in-progress";

                    return (
                      <button
                        key={step.id}
                        onClick={() => isClickable && setSelectedStep(step.id)}
                        disabled={!isClickable}
                        className={`
                          w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors
                          ${
                            selectedStep === step.id
                              ? "bg-blue-50 border border-blue-200"
                              : isClickable
                                ? "hover:bg-zinc-50 border border-transparent"
                                : "opacity-50 cursor-not-allowed border border-transparent"
                          }
                        `}
                      >
                        <StatusIcon status={status ?? "pending"} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-zinc-400 font-medium">
                              {index + 1}
                            </span>
                            <p className="text-sm font-medium text-zinc-900 truncate">
                              {step.title}
                            </p>
                          </div>
                          <p className="text-xs text-zinc-500 truncate">
                            {step.description}
                          </p>
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
              <Card className="p-6">{renderStepPanel()}</Card>
            </div>
          </div>

          {/* Diagnostic Log */}
          <DiagnosticLogCard logs={logs} />
        </div>
      </ScrollArea>
    </div>
  );
}
