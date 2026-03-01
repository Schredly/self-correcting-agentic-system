import { useState } from "react";
import { motion } from "motion/react";
import {
  ChevronRight,
  Play,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Database,
  FileText,
  Zap,
  TrendingUp,
} from "lucide-react";
import SkillDetailDrawer from "../components/SkillDetailDrawer";
import { Badge } from "../components/ui/badge";
import { ScrollArea } from "../components/ui/scroll-area";

interface Skill {
  id: string;
  name: string;
  status: "running" | "completed" | "pending" | "error";
  reasoning: string;
  confidence: number;
  inputs?: any;
  outputs?: any;
  plan?: string[];
  tools?: any[];
  knowledge?: any[];
}

const mockWorkObject = {
  id: "WO-2847",
  sourceSystem: "ServiceNow",
  classification: ["Retail", "Returns", "Defective Item", "Vendor: Acme"],
  priority: "High",
  assignedTo: "Agent-07",
  createdAt: "2026-03-01T08:32:00Z",
  fields: {
    customerName: "Sarah Johnson",
    orderNumber: "ORD-98234",
    productSKU: "ACM-2847-BLK",
    issueDescription: "Product arrived damaged, box showed signs of shipping mishandling",
    requestedResolution: "Refund",
  },
};

const mockSkills: Skill[] = [
  {
    id: "skill-1",
    name: "Classification Validator",
    status: "completed",
    reasoning: "Analyzed description and matched to Returns > Defective Item based on keywords 'damaged' and 'shipping mishandling'",
    confidence: 0.94,
    inputs: { description: mockWorkObject.fields.issueDescription },
    outputs: { classification: ["Returns", "Defective Item"], confidence: 0.94 },
    plan: ["Extract keywords", "Match to taxonomy", "Validate against rules"],
    tools: [{ name: "ClassificationEngine", result: "success" }],
    knowledge: [{ source: "Returns Policy Doc", relevance: 0.89 }],
  },
  {
    id: "skill-2",
    name: "Vendor Attribution",
    status: "completed",
    reasoning: "Matched product SKU ACM-2847-BLK to vendor Acme Corporation using product catalog",
    confidence: 0.98,
    inputs: { sku: "ACM-2847-BLK" },
    outputs: { vendor: "Acme", vendorId: "VND-1029" },
    plan: ["Lookup SKU", "Match to vendor", "Verify contract"],
    tools: [{ name: "ProductCatalog", result: "success" }],
    knowledge: [{ source: "Vendor Database", relevance: 0.98 }],
  },
  {
    id: "skill-3",
    name: "Policy Retrieval",
    status: "running",
    reasoning: "Fetching applicable return policies for defective items from vendor Acme",
    confidence: 0.87,
    plan: ["Query policy database", "Filter by vendor", "Rank by relevance"],
    knowledge: [{ source: "Acme Return Policy", relevance: 0.92 }],
  },
  {
    id: "skill-4",
    name: "Resolution Recommender",
    status: "pending",
    reasoning: "Awaiting policy data to recommend optimal resolution",
    confidence: 0.0,
  },
];

function StatusIcon({ status }: { status: Skill["status"] }) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
    case "running":
      return (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="w-5 h-5 text-blue-600" />
        </motion.div>
      );
    case "error":
      return <AlertCircle className="w-5 h-5 text-red-600" />;
    default:
      return <Play className="w-5 h-5 text-zinc-400" />;
  }
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const percentage = Math.round(confidence * 100);
  const color =
    percentage >= 90
      ? "bg-emerald-100 text-emerald-700"
      : percentage >= 70
      ? "bg-blue-100 text-blue-700"
      : "bg-amber-100 text-amber-700";

  return (
    <Badge variant="secondary" className={`${color} font-mono text-xs`}>
      {percentage}%
    </Badge>
  );
}

function SkillCard({ skill, onClick }: { skill: Skill; onClick: () => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg border border-zinc-200 p-4 hover:border-zinc-300 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <StatusIcon status={skill.status} />
          <div>
            <h4 className="font-medium text-zinc-900">{skill.name}</h4>
            <p className="text-xs text-zinc-500 mt-1">Skill ID: {skill.id}</p>
          </div>
        </div>
        <ConfidenceBadge confidence={skill.confidence} />
      </div>

      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <Zap className="w-4 h-4 text-zinc-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-zinc-600">{skill.reasoning}</p>
        </div>

        {skill.plan && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700 transition-colors mt-2"
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {expanded ? "Hide" : "Show"} execution plan
          </button>
        )}

        {expanded && skill.plan && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className="mt-2 ml-6 space-y-1"
          >
            {skill.plan.map((step, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs text-zinc-600">
                <div className="w-1 h-1 bg-zinc-400 rounded-full"></div>
                {step}
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

export default function AgentConsole() {
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

  return (
    <div className="h-full flex">
      {/* Left Panel - Work Object Summary */}
      <div className="w-[400px] border-r border-zinc-200 bg-white flex flex-col">
        <div className="p-6 border-b border-zinc-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-zinc-900">Work Object</h2>
            <Badge variant="outline" className="text-xs">
              {mockWorkObject.sourceSystem}
            </Badge>
          </div>
          <div className="text-2xl font-semibold text-zinc-900 mb-2">{mockWorkObject.id}</div>
          <div className="flex items-center gap-2">
            <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
              {mockWorkObject.priority}
            </Badge>
            <span className="text-sm text-zinc-500">Assigned to {mockWorkObject.assignedTo}</span>
          </div>
        </div>

        {/* Classification Breadcrumb */}
        <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-50">
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2 block">
            Classification
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            {mockWorkObject.classification.map((level, idx) => (
              <div key={idx} className="flex items-center gap-2">
                {idx > 0 && <ChevronRight className="w-4 h-4 text-zinc-400" />}
                <span
                  className={`text-sm px-2 py-1 rounded ${
                    idx === mockWorkObject.classification.length - 1
                      ? "bg-blue-100 text-blue-700 font-medium"
                      : "bg-white text-zinc-700"
                  }`}
                >
                  {level}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Fields */}
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-4">
            <div>
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2 block">
                Object Details
              </label>
              <div className="space-y-3">
                {Object.entries(mockWorkObject.fields).map(([key, value]) => (
                  <div key={key}>
                    <div className="text-xs text-zinc-500 mb-1">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </div>
                    <div className="text-sm text-zinc-900">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-200">
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2 block">
                Metadata
              </label>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Created</span>
                  <span className="text-zinc-900">
                    {new Date(mockWorkObject.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Right Panel - Live Agent Activity Stream */}
      <div className="flex-1 flex flex-col bg-zinc-50">
        <div className="h-16 border-b border-zinc-200 flex items-center justify-between px-8 bg-white">
          <div>
            <h2 className="font-semibold text-zinc-900">Live Agent Activity</h2>
            <p className="text-xs text-zinc-500">Real-time skill execution monitoring</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-zinc-600">Active</span>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-8">
            <div className="max-w-3xl space-y-4 relative">
              {/* Timeline connector */}
              <div className="absolute left-[18px] top-[24px] bottom-[24px] w-[2px] bg-zinc-200"></div>

              {mockSkills.map((skill) => (
                <div key={skill.id} className="relative pl-12">
                  <SkillCard skill={skill} onClick={() => setSelectedSkill(skill)} />
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Skill Detail Drawer */}
      {selectedSkill && (
        <SkillDetailDrawer skill={selectedSkill} onClose={() => setSelectedSkill(null)} />
      )}
    </div>
  );
}
