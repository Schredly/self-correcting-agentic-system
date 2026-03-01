import { useState } from "react";
import { motion } from "motion/react";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Play,
  List,
  Save,
  TestTube,
  Circle,
  Clock,
} from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { ScrollArea } from "../components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

interface LogEntry {
  timestamp: string;
  level: "info" | "success" | "error";
  message: string;
}

export default function ServiceNowConnector() {
  const [instanceUrl, setInstanceUrl] = useState("https://dev12345.service-now.com");
  const [authType, setAuthType] = useState("basic");
  const [username, setUsername] = useState("admin@acme.com");
  const [password, setPassword] = useState("\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022");
  const [basePath, setBasePath] = useState("/api/now/table");
  const [sysId, setSysId] = useState("");

  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isFetchingIncident, setIsFetchingIncident] = useState(false);
  const [isListingFields, setIsListingFields] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [connectionStatus, setConnectionStatus] = useState<{
    status: "connected" | "error" | "untested";
    lastTested?: string;
    message?: string;
  }>({
    status: "untested",
  });

  const [logs, setLogs] = useState<LogEntry[]>([
    {
      timestamp: "09:30:15",
      level: "info",
      message: "ServiceNow connector initialized",
    },
  ]);

  const addLog = (level: LogEntry["level"], message: string) => {
    const now = new Date();
    const timestamp = now.toTimeString().slice(0, 8);
    setLogs((prev) => [...prev, { timestamp, level, message }]);
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    addLog("info", "Testing connection to ServiceNow instance...");

    setTimeout(() => {
      const success = Math.random() > 0.3;
      if (success) {
        addLog("success", "\u2713 Connection successful");
        addLog("success", "\u2713 Authentication validated");
        addLog("success", "\u2713 API endpoint accessible");
        setConnectionStatus({
          status: "connected",
          lastTested: new Date().toLocaleString(),
          message: "Connection verified successfully",
        });
      } else {
        addLog("error", "\u2717 Connection failed: Authentication error");
        addLog("error", "\u2717 Invalid credentials or instance URL");
        setConnectionStatus({
          status: "error",
          lastTested: new Date().toLocaleString(),
          message: "Authentication failed - check credentials",
        });
      }
      setIsTestingConnection(false);
    }, 2000);
  };

  const handleFetchIncident = async () => {
    if (!sysId.trim()) {
      addLog("error", "\u2717 sys_id is required");
      return;
    }

    setIsFetchingIncident(true);
    addLog("info", `Fetching incident with sys_id: ${sysId}...`);

    setTimeout(() => {
      const success = Math.random() > 0.2;
      if (success) {
        addLog("success", "\u2713 Incident retrieved successfully");
        addLog("info", "  Number: INC0010001");
        addLog("info", "  Short Description: Unable to access email");
        addLog("info", "  Priority: 2 - High");
        addLog("info", "  State: In Progress");
        addLog("info", "  Assigned To: John Smith");
      } else {
        addLog("error", "\u2717 Incident not found");
        addLog("error", "  Record does not exist or access denied");
      }
      setIsFetchingIncident(false);
    }, 1500);
  };

  const handleListFields = async () => {
    setIsListingFields(true);
    addLog("info", "Fetching field definitions from incident table...");

    setTimeout(() => {
      addLog("success", "\u2713 Field list retrieved (15 fields)");
      addLog("info", "  - number (string)");
      addLog("info", "  - short_description (string)");
      addLog("info", "  - priority (integer)");
      addLog("info", "  - state (integer)");
      addLog("info", "  - category (string)");
      addLog("info", "  - assigned_to (reference)");
      addLog("info", "  - opened_at (datetime)");
      addLog("info", "  - resolved_at (datetime)");
      addLog("info", "  - caller_id (reference)");
      addLog("info", "  - urgency (integer)");
      addLog("info", "  - impact (integer)");
      addLog("info", "  - sys_id (sys_id)");
      addLog("info", "  - sys_created_on (datetime)");
      addLog("info", "  - sys_updated_on (datetime)");
      addLog("info", "  - work_notes (journal_input)");
      setIsListingFields(false);
    }, 1800);
  };

  const handleSave = async () => {
    setIsSaving(true);
    addLog("info", "Saving connector configuration...");

    setTimeout(() => {
      addLog("success", "\u2713 Configuration saved successfully");
      addLog("info", "  Connector is now available for use");
      setIsSaving(false);
    }, 1000);
  };

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="ServiceNow Connector"
        description="Configure connection to ServiceNow instance"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Admin" },
          { label: "Connectors" },
          { label: "ServiceNow" },
        ]}
      />

      <ScrollArea className="flex-1 bg-zinc-50">
        <div className="p-8 space-y-6 max-w-6xl">
          {/* Connection Status Card */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    connectionStatus.status === "connected"
                      ? "bg-emerald-100"
                      : connectionStatus.status === "error"
                      ? "bg-red-100"
                      : "bg-zinc-100"
                  }`}
                >
                  {connectionStatus.status === "connected" ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : connectionStatus.status === "error" ? (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  ) : (
                    <Circle className="w-5 h-5 text-zinc-400" />
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-zinc-900">Connection Status</h3>
                  <p className="text-sm text-zinc-500 mt-1">
                    {connectionStatus.message || "Not tested yet"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                {connectionStatus.status === "connected" ? (
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                    Connected
                  </Badge>
                ) : connectionStatus.status === "error" ? (
                  <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Error</Badge>
                ) : (
                  <Badge variant="outline">Not Tested</Badge>
                )}
                {connectionStatus.lastTested && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-zinc-500">
                    <Clock className="w-3 h-3" />
                    <span>Last tested: {connectionStatus.lastTested}</span>
                  </div>
                )}
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-6">
            {/* Left Column - Configuration Form */}
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="font-medium text-zinc-900 mb-6">Connection Settings</h3>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="instance-url">Instance URL</Label>
                    <Input
                      id="instance-url"
                      value={instanceUrl}
                      onChange={(e) => setInstanceUrl(e.target.value)}
                      placeholder="https://your-instance.service-now.com"
                      className="mt-2"
                    />
                    <p className="text-xs text-zinc-500 mt-1">
                      Your ServiceNow instance domain
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="auth-type">Authentication Type</Label>
                    <Select value={authType} onValueChange={setAuthType}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic Authentication</SelectItem>
                        <SelectItem value="oauth" disabled>
                          OAuth 2.0 (Coming Soon)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="admin@example.com"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="base-path">Table API Base Path</Label>
                    <Input
                      id="base-path"
                      value={basePath}
                      onChange={(e) => setBasePath(e.target.value)}
                      placeholder="/api/now/table"
                      className="mt-2 font-mono"
                    />
                    <p className="text-xs text-zinc-500 mt-1">
                      Default ServiceNow Table API endpoint
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-zinc-200">
                  <Button
                    className="w-full"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Configuration
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            </div>

            {/* Right Column - Test Operations */}
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="font-medium text-zinc-900 mb-6">Test Operations</h3>

                <div className="space-y-4">
                  {/* Test Connection */}
                  <div>
                    <Label className="mb-2 block">Connection Test</Label>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleTestConnection}
                      disabled={isTestingConnection}
                    >
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
                    <p className="text-xs text-zinc-500 mt-2">
                      Verify credentials and instance accessibility
                    </p>
                  </div>

                  {/* Fetch Sample Incident */}
                  <div className="pt-4 border-t border-zinc-200">
                    <Label htmlFor="sys-id" className="mb-2 block">
                      Fetch Sample Incident
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="sys-id"
                        value={sysId}
                        onChange={(e) => setSysId(e.target.value)}
                        placeholder="Enter sys_id"
                        className="font-mono"
                      />
                      <Button
                        variant="outline"
                        onClick={handleFetchIncident}
                        disabled={isFetchingIncident || !sysId.trim()}
                      >
                        {isFetchingIncident ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-zinc-500 mt-2">
                      Retrieve a specific incident record for testing
                    </p>
                  </div>

                  {/* List Fields */}
                  <div className="pt-4 border-t border-zinc-200">
                    <Label className="mb-2 block">Field Discovery</Label>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleListFields}
                      disabled={isListingFields}
                    >
                      {isListingFields ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Fetching...
                        </>
                      ) : (
                        <>
                          <List className="w-4 h-4 mr-2" />
                          List Incident Fields
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-zinc-500 mt-2">
                      Discover available fields in incident table
                    </p>
                  </div>
                </div>
              </Card>

              {/* Quick Tips */}
              <Card className="p-6 bg-blue-50 border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Quick Tips</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>- Test connection before saving configuration</li>
                  <li>- Use a service account with read access</li>
                  <li>- Verify API endpoints are accessible</li>
                  <li>- Check logs panel for detailed diagnostics</li>
                </ul>
              </Card>
            </div>
          </div>

          {/* Test Results Console */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-zinc-900">Test Results</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLogs([])}
                className="text-xs"
              >
                Clear Logs
              </Button>
            </div>

            <div className="bg-zinc-900 rounded-lg p-4 font-mono text-sm h-80 overflow-auto">
              {logs.length === 0 ? (
                <div className="text-zinc-500 italic">No logs yet...</div>
              ) : (
                <div className="space-y-1">
                  {logs.map((log, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-3"
                    >
                      <span className="text-zinc-500">[{log.timestamp}]</span>
                      <span
                        className={
                          log.level === "success"
                            ? "text-emerald-400"
                            : log.level === "error"
                            ? "text-red-400"
                            : "text-zinc-300"
                        }
                      >
                        {log.message}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
