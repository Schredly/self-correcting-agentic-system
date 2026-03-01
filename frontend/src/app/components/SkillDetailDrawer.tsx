import { motion } from "motion/react";
import { X, ArrowRight, Database, FileText, Wrench, TrendingUp } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import type { SkillExecution } from "../../types/agents";

interface SkillDetailDrawerProps {
  skill: SkillExecution;
  onClose: () => void;
}

export default function SkillDetailDrawer({ skill, onClose }: SkillDetailDrawerProps) {
  const details = skill.details;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 bottom-0 w-[600px] bg-white border-l border-zinc-200 shadow-2xl z-50 flex flex-col"
      >
        {/* Header */}
        <div className="h-16 border-b border-zinc-200 flex items-center justify-between px-6">
          <div>
            <h3 className="font-semibold text-zinc-900">{skill.name}</h3>
            <p className="text-xs text-zinc-500">Skill Details</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {/* Inputs */}
            {details?.inputs && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Database className="w-4 h-4 text-zinc-500" />
                  <h4 className="font-medium text-zinc-900">Inputs</h4>
                </div>
                <div className="bg-zinc-50 rounded-lg p-4 border border-zinc-200">
                  <pre className="text-xs text-zinc-700 font-mono overflow-x-auto">
                    {JSON.stringify(details.inputs, null, 2)}
                  </pre>
                </div>
              </section>
            )}

            {/* Context Sources */}
            {details?.context_sources && details.context_sources.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-zinc-500" />
                  <h4 className="font-medium text-zinc-900">Retrieved Knowledge</h4>
                </div>
                <div className="space-y-2">
                  {details.context_sources.map((source, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-lg p-3 border border-zinc-200 flex items-center gap-3"
                    >
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-zinc-900">{source}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Plan Steps */}
            {details?.plan_steps && details.plan_steps.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-zinc-500" />
                  <h4 className="font-medium text-zinc-900">Execution Plan</h4>
                </div>
                <div className="space-y-3">
                  {details.plan_steps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 text-xs font-medium">
                        {idx + 1}
                      </div>
                      <div className="flex-1 pt-0.5">
                        <p className="text-sm text-zinc-900">{step}</p>
                      </div>
                      {idx < details.plan_steps!.length - 1 && (
                        <ArrowRight className="w-4 h-4 text-zinc-300 mt-1" />
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Tool Actions */}
            {details?.tool_calls && details.tool_calls.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Wrench className="w-4 h-4 text-zinc-500" />
                  <h4 className="font-medium text-zinc-900">Tool Actions</h4>
                </div>
                <div className="space-y-2">
                  {details.tool_calls.map((tool, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-lg p-3 border border-zinc-200 flex items-center gap-3"
                    >
                      <Wrench className="w-4 h-4 text-purple-600" />
                      <span className="text-sm text-zinc-900">{tool}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Outputs */}
            {details?.outputs && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Database className="w-4 h-4 text-zinc-500" />
                  <h4 className="font-medium text-zinc-900">Outputs</h4>
                </div>
                <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                  <pre className="text-xs text-emerald-900 font-mono overflow-x-auto">
                    {details.outputs}
                  </pre>
                </div>
              </section>
            )}
          </div>
        </ScrollArea>
      </motion.div>
    </>
  );
}
