import { useState } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import {
  GripVertical,
  Plus,
  Trash2,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Switch } from "../components/ui/switch";
import { ScrollArea } from "../components/ui/scroll-area";

interface DimensionNode {
  id: string;
  name: string;
  required: boolean;
  children?: DimensionNode[];
  expanded?: boolean;
  systemField?: string;
}

const initialDimensions: DimensionNode[] = [
  {
    id: "d1",
    name: "Department",
    required: true,
    systemField: "category",
    expanded: true,
    children: [
      {
        id: "d1-1",
        name: "Retail",
        required: false,
        expanded: true,
        children: [
          { id: "d1-1-1", name: "Returns", required: false, children: [
            { id: "d1-1-1-1", name: "Defective Item", required: false },
            { id: "d1-1-1-2", name: "Wrong Item", required: false },
            { id: "d1-1-1-3", name: "Changed Mind", required: false },
          ]},
          { id: "d1-1-2", name: "Orders", required: false },
          { id: "d1-1-3", name: "Inventory", required: false },
        ],
      },
      {
        id: "d1-2",
        name: "Support",
        required: false,
        children: [
          { id: "d1-2-1", name: "Technical", required: false },
          { id: "d1-2-2", name: "Billing", required: false },
        ],
      },
      { id: "d1-3", name: "Sales", required: false },
    ],
  },
  {
    id: "d2",
    name: "Priority",
    required: true,
    systemField: "priority",
    expanded: true,
    children: [
      { id: "d2-1", name: "Critical", required: false },
      { id: "d2-2", name: "High", required: false },
      { id: "d2-3", name: "Medium", required: false },
      { id: "d2-4", name: "Low", required: false },
    ],
  },
];

interface DragItem {
  id: string;
  type: string;
  index: number;
}

function DimensionTreeNode({
  node,
  level = 0,
  onToggle,
  onUpdate,
  onDelete,
  onAddChild,
}: {
  node: DimensionNode;
  level?: number;
  onToggle: (id: string) => void;
  onUpdate: (id: string, updates: Partial<DimensionNode>) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(node.name);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: "dimension",
    item: { id: node.id, type: "dimension" },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const [{ isOver }, drop] = useDrop(() => ({
    accept: "dimension",
    drop: (item: DragItem) => {
      // Handle reordering logic here
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  const hasChildren = node.children && node.children.length > 0;

  return (
    <div
      ref={(node) => drag(drop(node))}
      className={`${isDragging ? "opacity-50" : ""} ${isOver ? "border-l-4 border-blue-500" : ""}`}
    >
      <div
        className="group flex items-center gap-2 py-2 px-3 hover:bg-zinc-50 rounded-lg transition-colors"
        style={{ paddingLeft: `${level * 24 + 12}px` }}
      >
        <GripVertical className="w-4 h-4 text-zinc-400 cursor-grab" />

        {hasChildren && (
          <button
            onClick={() => onToggle(node.id)}
            className="p-0.5 hover:bg-zinc-200 rounded transition-colors"
          >
            {node.expanded ? (
              <ChevronDown className="w-4 h-4 text-zinc-600" />
            ) : (
              <ChevronRight className="w-4 h-4 text-zinc-600" />
            )}
          </button>
        )}

        {!hasChildren && <div className="w-5" />}

        {isEditing ? (
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={() => {
              onUpdate(node.id, { name: editName });
              setIsEditing(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onUpdate(node.id, { name: editName });
                setIsEditing(false);
              }
            }}
            className="h-7 text-sm flex-1"
            autoFocus
          />
        ) : (
          <span
            className="text-sm text-zinc-900 flex-1 cursor-text"
            onDoubleClick={() => setIsEditing(true)}
          >
            {node.name}
          </span>
        )}

        {node.systemField && (
          <Badge variant="outline" className="text-xs">
            {node.systemField}
          </Badge>
        )}

        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-1">
            <span className="text-xs text-zinc-500">Required</span>
            <Switch
              checked={node.required}
              onCheckedChange={(checked) => onUpdate(node.id, { required: checked })}
            />
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAddChild(node.id)}
            className="h-7 px-2"
          >
            <Plus className="w-3 h-3" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(node.id)}
            className="h-7 px-2 hover:text-red-600"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {hasChildren && node.expanded && (
        <div>
          {node.children!.map((child) => (
            <DimensionTreeNode
              key={child.id}
              node={child}
              level={level + 1}
              onToggle={onToggle}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onAddChild={onAddChild}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ClassificationManagerContent() {
  const [dimensions, setDimensions] = useState(initialDimensions);
  const [fieldMapping, setFieldMapping] = useState({
    servicenow: { category: "Department", priority: "Priority" },
    jira: { issueType: "Department", priority: "Priority" },
    salesforce: { caseType: "Department", priority: "Priority" },
  });

  const toggleNode = (id: string) => {
    const updateNode = (nodes: DimensionNode[]): DimensionNode[] => {
      return nodes.map((node) => {
        if (node.id === id) {
          return { ...node, expanded: !node.expanded };
        }
        if (node.children) {
          return { ...node, children: updateNode(node.children) };
        }
        return node;
      });
    };
    setDimensions(updateNode(dimensions));
  };

  const updateNode = (id: string, updates: Partial<DimensionNode>) => {
    const update = (nodes: DimensionNode[]): DimensionNode[] => {
      return nodes.map((node) => {
        if (node.id === id) {
          return { ...node, ...updates };
        }
        if (node.children) {
          return { ...node, children: update(node.children) };
        }
        return node;
      });
    };
    setDimensions(update(dimensions));
  };

  const deleteNode = (id: string) => {
    const remove = (nodes: DimensionNode[]): DimensionNode[] => {
      return nodes.filter((node) => {
        if (node.id === id) return false;
        if (node.children) {
          node.children = remove(node.children);
        }
        return true;
      });
    };
    setDimensions(remove(dimensions));
  };

  const addChild = (parentId: string) => {
    const add = (nodes: DimensionNode[]): DimensionNode[] => {
      return nodes.map((node) => {
        if (node.id === parentId) {
          const newChild: DimensionNode = {
            id: `${parentId}-${Date.now()}`,
            name: "New Item",
            required: false,
          };
          return {
            ...node,
            expanded: true,
            children: [...(node.children || []), newChild],
          };
        }
        if (node.children) {
          return { ...node, children: add(node.children) };
        }
        return node;
      });
    };
    setDimensions(add(dimensions));
  };

  const addTopLevel = () => {
    const newDimension: DimensionNode = {
      id: `d${Date.now()}`,
      name: "New Dimension",
      required: false,
      expanded: true,
      children: [],
    };
    setDimensions([...dimensions, newDimension]);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <PageHeader
        title="Classification Schema Manager"
        description="Define dynamic multi-level taxonomy"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Admin" },
          { label: "Classification" },
        ]}
        actions={
          <Button onClick={addTopLevel}>
            <Plus className="w-4 h-4 mr-2" />
            Add Dimension
          </Button>
        }
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left - Tree Editor */}
        <div className="flex-1 border-r border-zinc-200 bg-white">
          <ScrollArea className="h-full">
            <div className="p-6">
              <div className="mb-4">
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                  Classification Dimensions
                </label>
                <p className="text-sm text-zinc-600 mt-1">
                  Drag to reorder, double-click to rename
                </p>
              </div>
              <div className="space-y-1">
                {dimensions.map((dimension) => (
                  <DimensionTreeNode
                    key={dimension.id}
                    node={dimension}
                    onToggle={toggleNode}
                    onUpdate={updateNode}
                    onDelete={deleteNode}
                    onAddChild={addChild}
                  />
                ))}
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Right - Field Mapping */}
        <div className="w-[400px] bg-zinc-50">
          <div className="p-6">
            <div className="mb-4">
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                External System Mapping
              </label>
              <p className="text-sm text-zinc-600 mt-1">
                Map external fields to internal dimensions
              </p>
            </div>

            <div className="space-y-4">
              {Object.entries(fieldMapping).map(([system, mapping]) => (
                <div key={system} className="bg-white rounded-lg border border-zinc-200 p-4">
                  <h4 className="font-medium text-zinc-900 mb-3 capitalize">{system}</h4>
                  <div className="space-y-3">
                    {Object.entries(mapping).map(([field, dimension]) => (
                      <div key={field} className="flex items-center gap-2 text-sm">
                        <span className="text-zinc-600 font-mono">{field}</span>
                        <ChevronRight className="w-4 h-4 text-zinc-400" />
                        <span className="text-zinc-900">{dimension}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ClassificationManager() {
  return (
    <DndProvider backend={HTML5Backend}>
      <ClassificationManagerContent />
    </DndProvider>
  );
}
