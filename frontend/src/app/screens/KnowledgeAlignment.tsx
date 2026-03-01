import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FileText,
  Tag,
  Search,
  HardDrive,
  RefreshCw,
  TestTube,
  FolderTree,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Database,
} from "lucide-react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { ScrollArea } from "../components/ui/scroll-area";
import { Card } from "../components/ui/card";

interface Document {
  id: string;
  name: string;
  path: string;
  modified: string;
  labels: string[];
  source: "drive" | "local";
  status: "synced" | "syncing" | "error" | "pending";
  size: string;
  lastSynced?: string;
}

const mockDocuments: Document[] = [
  {
    id: "1",
    name: "Returns Policy.pdf",
    path: "/Knowledge Base/Retail/Returns",
    modified: "2026-02-28",
    labels: ["Retail", "Returns", "Policy"],
    source: "drive",
    status: "synced",
    size: "2.4 MB",
    lastSynced: "2026-03-01 09:15",
  },
  {
    id: "2",
    name: "Order Processing Guide.docx",
    path: "/Knowledge Base/Retail/Orders",
    modified: "2026-02-27",
    labels: ["Retail", "Orders"],
    source: "drive",
    status: "synced",
    size: "1.8 MB",
    lastSynced: "2026-03-01 09:15",
  },
  {
    id: "3",
    name: "Technical Troubleshooting.pdf",
    path: "/Knowledge Base/Support/Technical",
    modified: "2026-02-26",
    labels: ["Support", "Technical"],
    source: "drive",
    status: "syncing",
    size: "3.2 MB",
  },
  {
    id: "4",
    name: "Billing FAQ.md",
    path: "/Knowledge Base/Support/Billing",
    modified: "2026-02-25",
    labels: ["Support", "Billing"],
    source: "drive",
    status: "synced",
    size: "456 KB",
    lastSynced: "2026-03-01 09:15",
  },
  {
    id: "5",
    name: "Product Catalog.xlsx",
    path: "/Knowledge Base/Retail",
    modified: "2026-02-24",
    labels: [],
    source: "drive",
    status: "pending",
    size: "5.1 MB",
  },
  {
    id: "6",
    name: "Customer Service Scripts.pdf",
    path: "/Knowledge Base/Support",
    modified: "2026-02-23",
    labels: ["Support"],
    source: "drive",
    status: "error",
    size: "890 KB",
  },
];

const schemaAlignment: Record<string, string[]> = {
  Department: ["Retail", "Support"],
  Category: ["Returns", "Orders", "Technical", "Billing"],
  Priority: [],
};

function StatusIcon({ status }: { status: Document["status"] }) {
  switch (status) {
    case "synced":
      return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    case "syncing":
      return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
    case "error":
      return <AlertCircle className="w-4 h-4 text-red-600" />;
    case "pending":
      return <Clock className="w-4 h-4 text-amber-600" />;
  }
}

function DocumentDetailPanel({ document, onClose }: { document: Document; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="w-[400px] border-l border-zinc-200 bg-white flex flex-col"
    >
      {/* Header */}
      <div className="h-16 border-b border-zinc-200 flex items-center justify-between px-6">
        <h3 className="font-medium text-zinc-900">Document Details</h3>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-zinc-100 transition-colors"
        >
          <X className="w-5 h-5 text-zinc-500" />
        </button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Document Info */}
          <div>
            <div className="flex items-start gap-3 mb-4">
              <FileText className="w-10 h-10 text-blue-600" />
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-zinc-900 break-words">{document.name}</h4>
                <p className="text-sm text-zinc-500 mt-1">{document.size}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <StatusIcon status={document.status} />
              <span className="text-sm text-zinc-700 capitalize">{document.status}</span>
            </div>
          </div>

          {/* Metadata */}
          <div className="pt-4 border-t border-zinc-200">
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-3 block">
              Metadata
            </label>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Source</span>
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-zinc-400" />
                  <span className="text-zinc-900 capitalize">{document.source}</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Path</span>
                <span className="text-zinc-900 text-right font-mono text-xs">{document.path}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Modified</span>
                <span className="text-zinc-900">{document.modified}</span>
              </div>
              {document.lastSynced && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Last Synced</span>
                  <span className="text-zinc-900">{document.lastSynced}</span>
                </div>
              )}
            </div>
          </div>

          {/* Labels */}
          <div className="pt-4 border-t border-zinc-200">
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-3 block">
              Applied Labels
            </label>
            {document.labels.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {document.labels.map((label) => (
                  <Badge key={label} variant="secondary">
                    {label}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-400 italic">No labels applied</p>
            )}
          </div>

          {/* Schema Alignment */}
          <div className="pt-4 border-t border-zinc-200">
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-3 block">
              Schema Alignment
            </label>
            <div className="space-y-3">
              {Object.entries(schemaAlignment).map(([dimension, values]) => {
                const matchedLabels = document.labels.filter((label) =>
                  values.includes(label)
                );
                const hasMatch = matchedLabels.length > 0;

                return (
                  <div key={dimension} className="p-3 bg-zinc-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-zinc-900">{dimension}</span>
                      {hasMatch ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-zinc-300" />
                      )}
                    </div>
                    {hasMatch ? (
                      <div className="flex flex-wrap gap-1">
                        {matchedLabels.map((label) => (
                          <span
                            key={label}
                            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded"
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-400">No mapping</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-zinc-200">
            <div className="space-y-2">
              <Button variant="outline" className="w-full">
                <Tag className="w-4 h-4 mr-2" />
                Edit Labels
              </Button>
              <Button variant="outline" className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Re-sync Document
              </Button>
            </div>
          </div>
        </div>
      </ScrollArea>
    </motion.div>
  );
}

export default function KnowledgeAlignment() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const filteredDocs = mockDocuments.filter(
    (doc) =>
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalDocs = mockDocuments.length;
  const syncedDocs = mockDocuments.filter((d) => d.status === "synced").length;
  const lastSync = "Mar 1, 2026 at 9:15 AM";
  const isDriveConfigured = true;

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 3000);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-zinc-200 bg-white">
        <div className="px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-zinc-900">Knowledge</h2>
              <p className="text-sm text-zinc-500 mt-1">
                Manage knowledge documents and schema alignment
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <TestTube className="w-4 h-4 mr-2" />
                Test Drive
              </Button>
              <Button variant="outline" size="sm">
                <FolderTree className="w-4 h-4 mr-2" />
                Apply Scaffold
              </Button>
              <Button size="sm" onClick={handleSync} disabled={isSyncing}>
                {isSyncing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Sync Now
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Status Chips */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-50 rounded-lg border border-zinc-200">
              <HardDrive className="w-4 h-4 text-zinc-500" />
              <span className="text-sm text-zinc-600">Drive:</span>
              {isDriveConfigured ? (
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                  Configured
                </Badge>
              ) : (
                <Badge variant="outline" className="text-zinc-500">
                  Not Configured
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-50 rounded-lg border border-zinc-200">
              <Clock className="w-4 h-4 text-zinc-500" />
              <span className="text-sm text-zinc-600">Last Sync:</span>
              <span className="text-sm font-medium text-zinc-900">{lastSync}</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-50 rounded-lg border border-zinc-200">
              <Database className="w-4 h-4 text-zinc-500" />
              <span className="text-sm text-zinc-600">Documents:</span>
              <span className="text-sm font-medium text-zinc-900">
                {syncedDocs}/{totalDocs} synced
              </span>
            </div>

            {isSyncing && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-200"
              >
                <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                <span className="text-sm font-medium text-blue-700">Syncing in progress...</span>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content - Document Table */}
        <div className="flex-1 flex flex-col bg-zinc-50">
          {/* Search Bar */}
          <div className="p-6 bg-white border-b border-zinc-200">
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Search documents by name or path..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Table */}
          <ScrollArea className="flex-1">
            <div className="p-6">
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-200">
                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">
                          Path
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">
                          Modified
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">
                          Labels
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">
                          Source
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200">
                      <AnimatePresence mode="popLayout">
                        {filteredDocs.map((doc) => (
                          <motion.tr
                            key={doc.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className={`
                              cursor-pointer transition-colors hover:bg-zinc-50
                              ${selectedDoc?.id === doc.id ? "bg-blue-50" : ""}
                            `}
                            onClick={() => setSelectedDoc(doc)}
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                <span className="text-sm font-medium text-zinc-900">{doc.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-zinc-600 font-mono">{doc.path}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-zinc-600">{doc.modified}</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-wrap gap-1">
                                {doc.labels.length > 0 ? (
                                  doc.labels.slice(0, 2).map((label) => (
                                    <Badge key={label} variant="secondary" className="text-xs">
                                      {label}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-xs text-zinc-400 italic">No labels</span>
                                )}
                                {doc.labels.length > 2 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{doc.labels.length - 2}
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <HardDrive className="w-4 h-4 text-zinc-400" />
                                <span className="text-sm text-zinc-600 capitalize">{doc.source}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <StatusIcon status={doc.status} />
                                <span className="text-sm text-zinc-700 capitalize">{doc.status}</span>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>

                  {filteredDocs.length === 0 && (
                    <div className="text-center py-12">
                      <FileText className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
                      <p className="text-sm text-zinc-500">No documents found</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </ScrollArea>
        </div>

        {/* Right Panel - Document Details */}
        <AnimatePresence>
          {selectedDoc && (
            <DocumentDetailPanel document={selectedDoc} onClose={() => setSelectedDoc(null)} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
