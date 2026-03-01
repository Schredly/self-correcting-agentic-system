import { useState } from "react";
import {
  Search,
  Check,
  ChevronDown,
  Plus,
  ExternalLink,
  CircleDot,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { useTenant } from "../context/TenantContext";

export function TenantSelector() {
  const { tenants, selectedTenant, setSelectedTenant, loading } = useTenant();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTenants = tenants.filter((tenant) =>
    tenant.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectTenant = (tenant: typeof selectedTenant & {}) => {
    setSelectedTenant(tenant);
    setOpen(false);
    setSearchQuery("");
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-200 bg-white">
        <Loader2 className="w-4 h-4 text-zinc-400 animate-spin" />
        <span className="text-sm text-zinc-500">Loading...</span>
      </div>
    );
  }

  if (!selectedTenant) return null;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors">
          <span className="text-sm font-medium text-zinc-900">{selectedTenant.name}</span>
          <ChevronDown className="w-4 h-4 text-zinc-500" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="p-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input
              placeholder="Search tenants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>
        <ScrollArea className="max-h-64">
          <div className="px-1 py-1">
            {filteredTenants.map((tenant) => (
              <button
                key={tenant.id}
                onClick={() => handleSelectTenant(tenant)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-zinc-100 transition-colors text-left"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-zinc-900 truncate">
                      {tenant.name}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {tenant.status === "configured" ? (
                        <>
                          <CircleDot className="w-3 h-3 text-emerald-600" />
                          <span className="text-xs text-emerald-600">Configured</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                          <span className="text-xs text-amber-600">Needs Setup</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                {selectedTenant.id === tenant.id && (
                  <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </ScrollArea>
        <DropdownMenuSeparator />
        <div className="p-1">
          <DropdownMenuItem className="cursor-pointer">
            <ExternalLink className="w-4 h-4 mr-2" />
            Manage tenants...
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer">
            <Plus className="w-4 h-4 mr-2" />
            Create tenant...
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
