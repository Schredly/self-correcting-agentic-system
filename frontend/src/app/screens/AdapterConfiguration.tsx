import { useState } from "react";
import { motion } from "motion/react";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronRight,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { ScrollArea } from "../components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

interface Adapter {
  id: string;
  name: string;
  status: "connected" | "error" | "syncing";
  lastSync: string;
  recordsSynced: number;
  fieldMappings: { external: string; internal: string }[];
}

const adapters: Adapter[] = [
  {
    id: "servicenow",
    name: "ServiceNow",
    status: "connected",
    lastSync: "2026-03-01T09:15:00Z",
    recordsSynced: 1247,
    fieldMappings: [
      { external: "category", internal: "classification.department" },
      { external: "priority", internal: "classification.priority" },
      { external: "short_description", internal: "fields.description" },
      { external: "assignment_group", internal: "fields.assignedTeam" },
      { external: "sys_created_on", internal: "metadata.createdAt" },
    ],
  },
  {
    id: "jira",
    name: "Jira",
    status: "connected",
    lastSync: "2026-03-01T09:10:00Z",
    recordsSynced: 892,
    fieldMappings: [
      { external: "issuetype", internal: "classification.department" },
      { external: "priority", internal: "classification.priority" },
      { external: "summary", internal: "fields.title" },
      { external: "description", internal: "fields.description" },
      { external: "assignee", internal: "fields.assignedTo" },
      { external: "created", internal: "metadata.createdAt" },
    ],
  },
  {
    id: "salesforce",
    name: "Salesforce",
    status: "syncing",
    lastSync: "2026-03-01T09:00:00Z",
    recordsSynced: 2156,
    fieldMappings: [
      { external: "Type", internal: "classification.department" },
      { external: "Priority", internal: "classification.priority" },
      { external: "Subject", internal: "fields.title" },
      { external: "Description", internal: "fields.description" },
      { external: "OwnerId", internal: "fields.assignedTo" },
      { external: "CreatedDate", internal: "metadata.createdAt" },
    ],
  },
];

function StatusBadge({ status }: { status: Adapter["status"] }) {
  switch (status) {
    case "connected":
      return (
        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Connected
        </Badge>
      );
    case "error":
      return (
        <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
          <AlertCircle className="w-3 h-3 mr-1" />
          Error
        </Badge>
      );
    case "syncing":
      return (
        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="inline-block mr-1"
          >
            <Loader2 className="w-3 h-3" />
          </motion.div>
          Syncing
        </Badge>
      );
  }
}

function AdapterCard({ adapter }: { adapter: Adapter }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg border border-zinc-200 overflow-hidden"
    >
      {/* Header */}
      <div className="p-6 border-b border-zinc-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-zinc-900">{adapter.name}</h3>
          <StatusBadge status={adapter.status} />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-zinc-500 mb-1">Last Sync</p>
            <p className="text-sm text-zinc-900">
              {new Date(adapter.lastSync).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-1">Records Synced</p>
            <p className="text-sm text-zinc-900">{adapter.recordsSynced.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-1">Field Mappings</p>
            <p className="text-sm text-zinc-900">{adapter.fieldMappings.length}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4">
          <Button size="sm" variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Sync Now
          </Button>
          <Button size="sm" variant="outline">
            <ExternalLink className="w-4 h-4 mr-2" />
            Configure OAuth
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setExpanded(!expanded)}
            className="ml-auto"
          >
            {expanded ? "Hide" : "View"} Field Mappings
            <ChevronRight
              className={`w-4 h-4 ml-1 transition-transform ${expanded ? "rotate-90" : ""}`}
            />
          </Button>
        </div>
      </div>

      {/* Field Mappings */}
      {expanded && (
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: "auto" }}
          exit={{ height: 0 }}
          className="bg-zinc-50"
        >
          <div className="p-6">
            <table className="w-full">
              <thead>
                <tr className="text-left">
                  <th className="text-xs font-medium text-zinc-500 uppercase tracking-wide pb-3">
                    External Field
                  </th>
                  <th className="w-12"></th>
                  <th className="text-xs font-medium text-zinc-500 uppercase tracking-wide pb-3">
                    Internal Field
                  </th>
                </tr>
              </thead>
              <tbody className="space-y-2">
                {adapter.fieldMappings.map((mapping, idx) => (
                  <tr key={idx} className="border-t border-zinc-200">
                    <td className="py-2">
                      <code className="text-sm text-zinc-900 bg-white px-2 py-1 rounded border border-zinc-200">
                        {mapping.external}
                      </code>
                    </td>
                    <td className="py-2 text-center">
                      <ChevronRight className="w-4 h-4 text-zinc-400 mx-auto" />
                    </td>
                    <td className="py-2">
                      <code className="text-sm text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-200">
                        {mapping.internal}
                      </code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

export default function AdapterConfiguration() {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <PageHeader
        title="Adapter Configuration"
        description="Connect and configure external systems"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Admin" },
          { label: "Adapters" },
        ]}
        actions={
          <Button>
            <ExternalLink className="w-4 h-4 mr-2" />
            Add Adapter
          </Button>
        }
      />

      {/* Content */}
      <ScrollArea className="flex-1 bg-zinc-50">
        <div className="p-8">
          <Tabs defaultValue="all" className="space-y-6">
            <TabsList>
              <TabsTrigger value="all">All Adapters</TabsTrigger>
              <TabsTrigger value="connected">Connected</TabsTrigger>
              <TabsTrigger value="issues">Issues</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-6">
              {adapters.map((adapter) => (
                <AdapterCard key={adapter.id} adapter={adapter} />
              ))}
            </TabsContent>

            <TabsContent value="connected" className="space-y-6">
              {adapters
                .filter((a) => a.status === "connected")
                .map((adapter) => (
                  <AdapterCard key={adapter.id} adapter={adapter} />
                ))}
            </TabsContent>

            <TabsContent value="issues" className="space-y-6">
              {adapters
                .filter((a) => a.status === "error")
                .map((adapter) => (
                  <AdapterCard key={adapter.id} adapter={adapter} />
                ))}
              {adapters.filter((a) => a.status === "error").length === 0 && (
                <div className="text-center py-12">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                  <p className="text-sm text-zinc-600">No issues detected</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
}
