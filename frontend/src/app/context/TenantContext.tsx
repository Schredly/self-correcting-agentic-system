import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { fetchTenants, type Tenant } from "../../lib/api";

interface TenantContextValue {
  tenants: Tenant[];
  selectedTenant: Tenant | null;
  setSelectedTenant: (tenant: Tenant) => void;
  loading: boolean;
  error: string | null;
}

const TenantContext = createContext<TenantContextValue | null>(null);

const DEFAULT_TENANT_ID = "demo-tenant";

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchTenants()
      .then((data) => {
        if (cancelled) return;
        setTenants(data);
        const defaultTenant =
          data.find((t) => t.id === DEFAULT_TENANT_ID) ?? data[0] ?? null;
        setSelectedTenant(defaultTenant);
      })
      .catch((err) => {
        if (!cancelled) setError(String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <TenantContext.Provider
      value={{ tenants, selectedTenant, setSelectedTenant, loading, error }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant(): TenantContextValue {
  const ctx = useContext(TenantContext);
  if (!ctx) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return ctx;
}
