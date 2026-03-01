import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { ScrollArea } from "../components/ui/scroll-area";

// Mock data for accuracy by classification level
const classificationAccuracy = [
  { level: "Department", accuracy: 94, total: 1247 },
  { level: "Category", accuracy: 89, total: 1247 },
  { level: "Subcategory", accuracy: 82, total: 1143 },
  { level: "Detail", accuracy: 76, total: 892 },
];

// Mock data for accuracy by source system
const systemAccuracy = [
  { system: "ServiceNow", accuracy: 91, total: 1247, trend: 2.3 },
  { system: "Jira", accuracy: 87, total: 892, trend: -1.2 },
  { system: "Salesforce", accuracy: 93, total: 2156, trend: 4.1 },
];

// Mock data for drift by route
const driftData = [
  { route: "Retail > Returns > Defective", drift: 0.03, count: 234 },
  { route: "Retail > Orders > Tracking", drift: 0.12, count: 156 },
  { route: "Support > Technical > Login", drift: 0.08, count: 189 },
  { route: "Support > Billing > Refund", drift: 0.05, count: 145 },
  { route: "Sales > Quote > Pricing", drift: 0.18, count: 98 },
];

// Mock time series data
const accuracyTrend = [
  { date: "Feb 22", accuracy: 84 },
  { date: "Feb 23", accuracy: 85 },
  { date: "Feb 24", accuracy: 87 },
  { date: "Feb 25", accuracy: 86 },
  { date: "Feb 26", accuracy: 88 },
  { date: "Feb 27", accuracy: 89 },
  { date: "Feb 28", accuracy: 91 },
  { date: "Mar 1", accuracy: 90 },
];

// Distribution data
const confidenceDistribution = [
  { range: "90-100%", count: 2847, color: "#10b981" },
  { range: "80-89%", count: 1234, color: "#3b82f6" },
  { range: "70-79%", count: 456, color: "#f59e0b" },
  { range: "<70%", count: 158, color: "#ef4444" },
];

function MetricCard({
  title,
  value,
  subtitle,
  trend,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  trend?: number;
}) {
  const trendColor = trend && trend > 0 ? "text-emerald-600" : trend && trend < 0 ? "text-red-600" : "text-zinc-600";
  const TrendIcon = trend && trend > 0 ? TrendingUp : trend && trend < 0 ? TrendingDown : Minus;

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-sm font-medium text-zinc-500">{title}</h3>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 ${trendColor}`}>
            <TrendIcon className="w-4 h-4" />
            <span className="text-sm font-medium">{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <div className="text-3xl font-semibold text-zinc-900 mb-1">{value}</div>
      <p className="text-sm text-zinc-600">{subtitle}</p>
    </Card>
  );
}

export default function EvaluationDashboard() {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <PageHeader
        title="Evaluation Dashboard"
        description="Monitor agent performance and accuracy metrics"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Evaluation" },
        ]}
        actions={
          <select className="h-9 px-3 rounded-lg border border-zinc-200 text-sm text-zinc-700 bg-white">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 90 days</option>
          </select>
        }
      />

      {/* Content */}
      <ScrollArea className="flex-1 bg-zinc-50">
        <div className="p-8 space-y-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-4 gap-6">
            <MetricCard
              title="Overall Accuracy"
              value="90%"
              subtitle="Across all systems"
              trend={2.3}
            />
            <MetricCard
              title="Avg Confidence"
              value="87%"
              subtitle="Agent confidence score"
              trend={1.8}
            />
            <MetricCard
              title="Total Evaluations"
              value="4,695"
              subtitle="In selected period"
            />
            <MetricCard
              title="Avg Drift"
              value="0.09"
              subtitle="Classification drift rate"
              trend={-0.5}
            />
          </div>

          {/* Accuracy Trend */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-medium text-zinc-900">Accuracy Trend</h3>
                <p className="text-sm text-zinc-500 mt-1">Daily accuracy over time</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={accuracyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                <XAxis dataKey="date" tick={{ fill: "#71717a", fontSize: 12 }} />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: "#71717a", fontSize: 12 }}
                  label={{ value: "Accuracy %", angle: -90, position: "insideLeft" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e4e4e7",
                    borderRadius: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="accuracy"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: "#3b82f6", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <div className="grid grid-cols-2 gap-6">
            {/* Accuracy by Classification Level */}
            <Card className="p-6">
              <div className="mb-6">
                <h3 className="font-medium text-zinc-900">Accuracy by Classification Level</h3>
                <p className="text-sm text-zinc-500 mt-1">Performance across taxonomy depth</p>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={classificationAccuracy} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: "#71717a", fontSize: 12 }} />
                  <YAxis
                    type="category"
                    dataKey="level"
                    tick={{ fill: "#71717a", fontSize: 12 }}
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e4e4e7",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="accuracy" radius={[0, 4, 4, 0]}>
                    {classificationAccuracy.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.accuracy >= 90
                            ? "#10b981"
                            : entry.accuracy >= 80
                            ? "#3b82f6"
                            : "#f59e0b"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Confidence Distribution */}
            <Card className="p-6">
              <div className="mb-6">
                <h3 className="font-medium text-zinc-900">Confidence Distribution</h3>
                <p className="text-sm text-zinc-500 mt-1">Classification confidence ranges</p>
              </div>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={confidenceDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      fill="#8884d8"
                      dataKey="count"
                      label={(entry) => entry.range}
                    >
                      {confidenceDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e4e4e7",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* System Performance */}
          <Card className="p-6">
            <div className="mb-6">
              <h3 className="font-medium text-zinc-900">Accuracy by Source System</h3>
              <p className="text-sm text-zinc-500 mt-1">Performance breakdown by integration</p>
            </div>
            <div className="space-y-4">
              {systemAccuracy.map((system) => (
                <div key={system.system} className="flex items-center gap-4">
                  <div className="w-32">
                    <span className="text-sm font-medium text-zinc-900">{system.system}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-8 bg-zinc-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full flex items-center justify-end px-3 text-sm font-medium text-white transition-all ${
                            system.accuracy >= 90
                              ? "bg-emerald-500"
                              : system.accuracy >= 80
                              ? "bg-blue-500"
                              : "bg-amber-500"
                          }`}
                          style={{ width: `${system.accuracy}%` }}
                        >
                          {system.accuracy}%
                        </div>
                      </div>
                      <div className="w-20 text-right">
                        <span className="text-sm text-zinc-500">{system.total} records</span>
                      </div>
                      <div className="w-16">
                        {system.trend > 0 ? (
                          <Badge className="bg-emerald-100 text-emerald-700">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            {system.trend}%
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-700">
                            <TrendingDown className="w-3 h-3 mr-1" />
                            {Math.abs(system.trend)}%
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Drift Analysis */}
          <Card className="p-6">
            <div className="mb-6">
              <h3 className="font-medium text-zinc-900">Classification Drift by Route</h3>
              <p className="text-sm text-zinc-500 mt-1">
                Tracks classification stability over time
              </p>
            </div>
            <div className="space-y-3">
              {driftData.map((item) => (
                <div
                  key={item.route}
                  className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-zinc-900">{item.route}</p>
                    <p className="text-xs text-zinc-500 mt-1">{item.count} classifications</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span
                        className={`text-sm font-medium ${
                          item.drift < 0.05
                            ? "text-emerald-600"
                            : item.drift < 0.1
                            ? "text-amber-600"
                            : "text-red-600"
                        }`}
                      >
                        {(item.drift * 100).toFixed(1)}%
                      </span>
                      <p className="text-xs text-zinc-500">drift rate</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        item.drift < 0.05
                          ? "border-emerald-300 text-emerald-700"
                          : item.drift < 0.1
                          ? "border-amber-300 text-amber-700"
                          : "border-red-300 text-red-700"
                      }
                    >
                      {item.drift < 0.05 ? "Stable" : item.drift < 0.1 ? "Monitor" : "Alert"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
