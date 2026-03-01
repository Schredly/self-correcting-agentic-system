import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  ChevronRight,
  Play,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Zap,
} from "lucide-react";
import SkillDetailDrawer from "../components/SkillDetailDrawer";
import { Badge } from "../components/ui/badge";
import { ScrollArea } from "../components/ui/scroll-area";
import { useAgentRun } from "../../hooks/useAgentRun";
import { createRun } from "../../lib/api";
import type { SkillExecution, WorkObject } from "../../types/agents";

const TENANT_ID = "demo-tenant";

const DEMO_WORK_OBJECT: WorkObject = {
  work_id: "INC-2024-08172",
  source_system: "servicenow",
  record_type: "incident",
  title: "Defective Item Return — Order ORD-98234",
  description:
    "Customer Sarah Johnson reports that item SKU ACM-2847-BLK " +
    "(Acme Wireless Headphones, Black) arrived with a non-functional " +
    "left ear cup. Customer is requesting a full refund. Order was " +
    "placed 12 days ago and is within the 30-day return window.",
  classification: [
    { name: "category", value: "Product" },
    { name: "subcategory", value: "Returns" },
    { name: "type", value: "Defective Item" },
  ],
  metadata: {
    priority: "P3",
    assignedTo: "Agent Smith",
    customerName: "Sarah Johnson",
    orderNumber: "ORD-98234",
    sku: "ACM-2847-BLK",
    productName: "Acme Wireless Headphones (Black)",
    purchaseDate: "2024-08-05",
    returnWindow: "30 days",
  },
};

function StatusIcon({ state }: { state: SkillExecution["state"] }) {
  switch (state) {
    case "complete":
      return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
    case "thinking":
    case "retrieving":
    case "planning":
    case "executing":
    case "verifying":
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

function ConfidenceBadge({ confidence }: { confidence?: number }) {
  if (confidence == null) return null;
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

function SkillCard({ skill, onClick }: { skill: SkillExecution; onClick: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const planSteps = skill.details?.plan_steps;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg border border-zinc-200 p-4 hover:border-zinc-300 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <StatusIcon state={skill.state} />
          <div>
            <h4 className="font-medium text-zinc-900">{skill.name}</h4>
            <p className="text-xs text-zinc-500 mt-1">Skill ID: {skill.skill_id}</p>
          </div>
        </div>
        <ConfidenceBadge confidence={skill.confidence} />
      </div>

      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <Zap className="w-4 h-4 text-zinc-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-zinc-600">{skill.summary}</p>
        </div>

        {planSteps && planSteps.length > 0 && (
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

        {expanded && planSteps && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className="mt-2 ml-6 space-y-1"
          >
            {planSteps.map((step, idx) => (
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
  const [runId, setRunId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { run, status } = useAgentRun(runId, TENANT_ID);
  const [selectedSkill, setSelectedSkill] = useState<SkillExecution | null>(null);

  useEffect(() => {
    let cancelled = false;

    createRun({ tenant_id: TENANT_ID, work_object: DEMO_WORK_OBJECT })
      .then((res) => {
        if (!cancelled) setRunId(res.run_id);
      })
      .catch((err) => {
        if (!cancelled) setError(String(err));
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <AlertCircle className="w-8 h-8 text-red-600" />
          <p className="text-sm text-zinc-500">Failed to create run — {error}</p>
        </div>
      </div>
    );
  }

  if (!run) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="w-8 h-8 text-blue-600" />
          </motion.div>
          <p className="text-sm text-zinc-500">
            {status === "error"
              ? "Connection error — retrying…"
              : "Connecting to agent run…"}
          </p>
        </div>
      </div>
    );
  }

  const workObject = run.work_object;

  return (
    <div className="h-full flex">
      {/* Left Panel - Work Object Summary */}
      <div className="w-[400px] border-r border-zinc-200 bg-white flex flex-col">
        <div className="p-6 border-b border-zinc-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-zinc-900">Work Object</h2>
            <Badge variant="outline" className="text-xs">
              {workObject.source_system}
            </Badge>
          </div>
          <div className="text-2xl font-semibold text-zinc-900 mb-2">{workObject.work_id}</div>
          <div className="flex items-center gap-2">
            {workObject.metadata?.priority && (
              <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
                {workObject.metadata.priority}
              </Badge>
            )}
            {workObject.metadata?.assignedTo && (
              <span className="text-sm text-zinc-500">
                Assigned to {workObject.metadata.assignedTo}
              </span>
            )}
          </div>
        </div>

        {/* Classification Breadcrumb */}
        <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-50">
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2 block">
            Classification
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            {workObject.classification.map((level, idx) => (
              <div key={idx} className="flex items-center gap-2">
                {idx > 0 && <ChevronRight className="w-4 h-4 text-zinc-400" />}
                <span
                  className={`text-sm px-2 py-1 rounded ${
                    idx === workObject.classification.length - 1
                      ? "bg-blue-100 text-blue-700 font-medium"
                      : "bg-white text-zinc-700"
                  }`}
                >
                  {level.value}
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
                <div>
                  <div className="text-xs text-zinc-500 mb-1">Title</div>
                  <div className="text-sm text-zinc-900">{workObject.title}</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500 mb-1">Description</div>
                  <div className="text-sm text-zinc-900">{workObject.description}</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500 mb-1">Record Type</div>
                  <div className="text-sm text-zinc-900">{workObject.record_type}</div>
                </div>
                {workObject.metadata &&
                  Object.entries(workObject.metadata)
                    .filter(([key]) => key !== "priority" && key !== "assignedTo")
                    .map(([key, value]) => (
                      <div key={key}>
                        <div className="text-xs text-zinc-500 mb-1">
                          {key.replace(/([A-Z])/g, " $1").trim()}
                        </div>
                        <div className="text-sm text-zinc-900">
                          {typeof value === "string" ? value : JSON.stringify(value)}
                        </div>
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
                  <span className="text-zinc-500">Started</span>
                  <span className="text-zinc-900">
                    {new Date(run.started_at).toLocaleString()}
                  </span>
                </div>
                {run.completed_at && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Completed</span>
                    <span className="text-zinc-900">
                      {new Date(run.completed_at).toLocaleString()}
                    </span>
                  </div>
                )}
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
            <div
              className={`w-2 h-2 rounded-full ${
                run.status === "running"
                  ? "bg-emerald-500 animate-pulse"
                  : run.status === "completed"
                  ? "bg-emerald-500"
                  : run.status === "failed"
                  ? "bg-red-500"
                  : "bg-zinc-400"
              }`}
            ></div>
            <span className="text-sm text-zinc-600">
              {run.status === "running"
                ? "Active"
                : run.status === "completed"
                ? "Completed"
                : run.status === "failed"
                ? "Failed"
                : "Queued"}
            </span>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-8">
            <div className="max-w-3xl space-y-4 relative">
              {/* Timeline connector */}
              <div className="absolute left-[18px] top-[24px] bottom-[24px] w-[2px] bg-zinc-200"></div>

              {run.skills.map((skill) => (
                <div key={skill.skill_id} className="relative pl-12">
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
