import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, Building2 } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import { ScrollArea } from "../components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { useTenant } from "../context/TenantContext";
import { fetchTenant, type TenantDetail } from "../../lib/api";

const AVAILABLE_ADAPTERS = ["ServiceNow", "Jira", "Salesforce"];

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ── Add Tenant Modal ────────────────────────────────────────────────────────

interface AddTenantModalProps {
  open: boolean;
  onClose: () => void;
}

function AddTenantModal({ open, onClose }: AddTenantModalProps) {
  const { createTenant, setSelectedTenant } = useTenant();
  const [name, setName] = useState("");
  const [id, setId] = useState("");
  const [idTouched, setIdTouched] = useState(false);
  const [adapters, setAdapters] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!idTouched) {
      setId(slugify(value));
    }
  };

  const toggleAdapter = (adapter: string) => {
    setAdapters((prev) =>
      prev.includes(adapter)
        ? prev.filter((a) => a !== adapter)
        : [...prev, adapter]
    );
  };

  const handleSubmit = async () => {
    if (!name.trim() || !id.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const detail = await createTenant({
        id: id.trim(),
        name: name.trim(),
        enabled_adapters: adapters,
      });
      setSelectedTenant({ id: detail.id, name: detail.name, status: "needs-setup" });
      onClose();
    } catch (err) {
      const msg = String(err);
      if (msg.includes("409")) {
        setError("A tenant with this ID already exists.");
      } else {
        setError(msg);
      }
    } finally {
      setCreating(false);
    }
  };

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setName("");
      setId("");
      setIdTouched(false);
      setAdapters([]);
      setError(null);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Tenant</DialogTitle>
          <DialogDescription>
            Create a new tenant for agent operations.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="tenant-name">Tenant Name</Label>
            <Input
              id="tenant-name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Acme Corp"
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="tenant-id">Tenant ID</Label>
            <Input
              id="tenant-id"
              value={id}
              onChange={(e) => {
                setId(e.target.value);
                setIdTouched(true);
              }}
              placeholder="acme-corp"
              className="mt-2 font-mono text-sm"
            />
            <p className="text-xs text-zinc-500 mt-1">
              Auto-generated from name. Edit to customize.
            </p>
          </div>

          <div>
            <Label>Enabled Adapters</Label>
            <div className="mt-2 space-y-2">
              {AVAILABLE_ADAPTERS.map((adapter) => (
                <div key={adapter} className="flex items-center gap-2">
                  <Checkbox
                    id={`adapter-${adapter}`}
                    checked={adapters.includes(adapter)}
                    onCheckedChange={() => toggleAdapter(adapter)}
                  />
                  <Label
                    htmlFor={`adapter-${adapter}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {adapter}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={creating}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={creating || !name.trim() || !id.trim()}
          >
            {creating ? "Creating..." : "Create Tenant"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Tenant Management Screen ────────────────────────────────────────────────

export default function TenantManagement() {
  const { tenants, deleteTenant } = useTenant();
  const [tenantDetails, setTenantDetails] = useState<Map<string, TenantDetail>>(
    new Map()
  );
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadDetails = useCallback(async () => {
    if (tenants.length === 0) {
      setTenantDetails(new Map());
      return;
    }
    setLoadingDetails(true);
    try {
      const results = await Promise.allSettled(
        tenants.map((t) => fetchTenant(t.id))
      );
      const map = new Map<string, TenantDetail>();
      results.forEach((r) => {
        if (r.status === "fulfilled") {
          map.set(r.value.id, r.value);
        }
      });
      setTenantDetails(map);
    } finally {
      setLoadingDetails(false);
    }
  }, [tenants]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  const handleDelete = async () => {
    if (!deletingId) return;
    await deleteTenant(deletingId);
    setDeletingId(null);
  };

  const deletingTenant = deletingId
    ? tenantDetails.get(deletingId) ?? tenants.find((t) => t.id === deletingId)
    : null;

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Tenants"
        description="Manage tenants for agent operations"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Admin" },
          { label: "Tenants" },
        ]}
        actions={
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Tenant
          </Button>
        }
      />

      <ScrollArea className="flex-1 bg-zinc-50">
        <div className="p-8">
          {tenants.length === 0 && !loadingDetails ? (
            <Card className="p-12 flex flex-col items-center justify-center text-center">
              <Building2 className="w-12 h-12 text-zinc-300 mb-4" />
              <h3 className="font-medium text-zinc-900 mb-1">No tenants yet</h3>
              <p className="text-sm text-zinc-500 mb-4">
                Create your first tenant to get started with agent operations.
              </p>
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Tenant
              </Button>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Name</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Adapters</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right pr-4">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenants.map((t) => {
                    const detail = tenantDetails.get(t.id);
                    return (
                      <TableRow key={t.id}>
                        <TableCell className="pl-4 font-medium text-zinc-900">
                          {detail?.name ?? t.name}
                        </TableCell>
                        <TableCell className="font-mono text-sm text-zinc-500">
                          {t.id}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={
                                t.status === "configured"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                              }
                            >
                              {t.status}
                            </Badge>
                            {detail && (
                              <Badge
                                variant="outline"
                                className={
                                  detail.status === "active"
                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                    : "bg-zinc-50 text-zinc-600 border-zinc-200"
                                }
                              >
                                {detail.status}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-zinc-600">
                          {detail?.enabled_adapters.length
                            ? detail.enabled_adapters.join(", ")
                            : "\u2014"}
                        </TableCell>
                        <TableCell className="text-sm text-zinc-500">
                          {detail ? formatDate(detail.created_at) : "\u2014"}
                        </TableCell>
                        <TableCell className="text-right pr-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingId(t.id)}
                            className="text-zinc-500 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </div>
      </ScrollArea>

      {/* Add Tenant Modal */}
      <AddTenantModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingId}
        onOpenChange={(v) => !v && setDeletingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete tenant?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-medium text-zinc-900">
                {deletingTenant?.name ?? deletingId}
              </span>{" "}
              and remove all its configuration. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
