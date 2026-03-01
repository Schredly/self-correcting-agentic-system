import { useState } from "react";
import { FileText, Tag, Search, Filter, TrendingUp } from "lucide-react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { ScrollArea } from "../components/ui/scroll-area";

interface Document {
  id: string;
  name: string;
  type: string;
  path: string;
  tags: string[];
  lastModified: string;
}

const mockDocuments: Document[] = [
  {
    id: "doc-1",
    name: "Return Policy - Defective Items",
    type: "pdf",
    path: "/policies/returns/",
    tags: ["Retail", "Returns", "Defective Item"],
    lastModified: "2026-02-28",
  },
  {
    id: "doc-2",
    name: "Acme Vendor Agreement",
    type: "pdf",
    path: "/vendors/acme/",
    tags: ["Retail", "Vendor: Acme"],
    lastModified: "2026-02-25",
  },
  {
    id: "doc-3",
    name: "Customer Support Guidelines",
    type: "docx",
    path: "/support/",
    tags: ["Support", "Technical"],
    lastModified: "2026-02-20",
  },
  {
    id: "doc-4",
    name: "Standard Operating Procedures",
    type: "pdf",
    path: "/general/",
    tags: [],
    lastModified: "2026-02-15",
  },
  {
    id: "doc-5",
    name: "Billing Resolution Playbook",
    type: "docx",
    path: "/support/billing/",
    tags: ["Support", "Billing"],
    lastModified: "2026-02-10",
  },
  {
    id: "doc-6",
    name: "Inventory Management Best Practices",
    type: "pdf",
    path: "/operations/",
    tags: ["Retail", "Inventory"],
    lastModified: "2026-02-05",
  },
];

const availableTags = [
  "Retail",
  "Returns",
  "Defective Item",
  "Vendor: Acme",
  "Support",
  "Technical",
  "Billing",
  "Inventory",
  "Sales",
];

// Calculate coverage heatmap
const tagCoverage = {
  "Retail": 3,
  "Returns": 1,
  "Defective Item": 1,
  "Vendor: Acme": 1,
  "Support": 2,
  "Technical": 1,
  "Billing": 1,
  "Inventory": 1,
  "Sales": 0,
};

export default function KnowledgeAlignment() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const filteredDocs = mockDocuments.filter(
    (doc) =>
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleTag = (docId: string, tag: string) => {
    // In a real app, this would update the document's tags
    console.log(`Toggle tag ${tag} for doc ${docId}`);
  };

  const maxCoverage = Math.max(...Object.values(tagCoverage));

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="h-16 border-b border-zinc-200 flex items-center justify-between px-8 bg-white">
        <div>
          <h2 className="font-semibold text-zinc-900">Knowledge Alignment</h2>
          <p className="text-xs text-zinc-500">Tag documents with classification keys</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left - Document List */}
        <div className="flex-1 border-r border-zinc-200 bg-white">
          <ScrollArea className="h-full">
            <div className="p-6">
              <div className="space-y-2">
                {filteredDocs.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDoc(doc)}
                    className={`
                      p-4 rounded-lg border cursor-pointer transition-all
                      ${
                        selectedDoc?.id === doc.id
                          ? "border-blue-300 bg-blue-50"
                          : "border-zinc-200 hover:border-zinc-300 bg-white"
                      }
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-zinc-900 truncate">{doc.name}</h4>
                        <p className="text-xs text-zinc-500 mt-1">
                          {doc.path} • Modified {doc.lastModified}
                        </p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {doc.tags.length > 0 ? (
                            doc.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-zinc-400 italic">No tags</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Middle - Tag Editor */}
        <div className="w-[400px] border-r border-zinc-200 bg-white">
          <div className="p-6">
            {selectedDoc ? (
              <>
                <div className="mb-6">
                  <h3 className="font-medium text-zinc-900 mb-1">{selectedDoc.name}</h3>
                  <p className="text-sm text-zinc-500">{selectedDoc.path}</p>
                </div>

                <div className="mb-4">
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-3 block">
                    Apply Classification Tags
                  </label>
                  <div className="space-y-2">
                    {availableTags.map((tag) => {
                      const isSelected = selectedDoc.tags.includes(tag);
                      return (
                        <button
                          key={tag}
                          onClick={() => toggleTag(selectedDoc.id, tag)}
                          className={`
                            w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition-all
                            ${
                              isSelected
                                ? "border-blue-300 bg-blue-50 text-blue-700"
                                : "border-zinc-200 hover:border-zinc-300 text-zinc-700"
                            }
                          `}
                        >
                          <span>{tag}</span>
                          {isSelected && <Tag className="w-4 h-4" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-center">
                <div>
                  <FileText className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
                  <p className="text-sm text-zinc-500">Select a document to manage tags</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right - Coverage Heatmap */}
        <div className="w-[360px] bg-zinc-50">
          <div className="p-6">
            <div className="mb-6">
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1 block">
                Tag Coverage Heatmap
              </label>
              <p className="text-sm text-zinc-600">Documents per classification tag</p>
            </div>

            <div className="space-y-3">
              {Object.entries(tagCoverage).map(([tag, count]) => {
                const percentage = maxCoverage > 0 ? (count / maxCoverage) * 100 : 0;
                const color =
                  count === 0
                    ? "bg-zinc-100"
                    : count === 1
                    ? "bg-amber-200"
                    : count === 2
                    ? "bg-emerald-300"
                    : "bg-emerald-500";

                return (
                  <div key={tag}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-zinc-700">{tag}</span>
                      <span className="text-sm font-medium text-zinc-900">{count}</span>
                    </div>
                    <div className="h-2 bg-zinc-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${color} transition-all duration-300`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 p-4 bg-white rounded-lg border border-zinc-200">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <h4 className="font-medium text-zinc-900">Coverage Stats</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-600">Total Documents</span>
                  <span className="font-medium text-zinc-900">{mockDocuments.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600">Tagged</span>
                  <span className="font-medium text-zinc-900">
                    {mockDocuments.filter((d) => d.tags.length > 0).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600">Untagged</span>
                  <span className="font-medium text-zinc-900">
                    {mockDocuments.filter((d) => d.tags.length === 0).length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
