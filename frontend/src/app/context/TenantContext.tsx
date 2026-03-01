import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  fetchTenants,
  createTenant as apiCreateTenant,
  deleteTenant as apiDeleteTenant,
  type Tenant,
  type CreateTenantParams,
  type TenantDetail,
} from "../../lib/api";

interface TenantContextValue {
  tenants: Tenant[];
  selectedTenant: Tenant | null;
  setSelectedTenant: (tenant: Tenant | null) => void;
  loading: boolean;
  error: string | null;
  createTenant: (params: CreateTenantParams) => Promise<TenantDetail>;
  deleteTenant: (id: string) => Promise<void>;
  refreshTenants: () => Promise<void>;
}

const TenantContext = createContext<TenantContextValue | null>(null);

const DEFAULT_TENANT_ID = "demo-tenant";

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTenants = useCallback(async () => {
    const data = await fetchTenants();
    setTenants(data);
    return data;
  }, []);

  useEffect(() => {
    let cancelled = false;

    loadTenants()
      .then((data) => {
        if (cancelled) return;
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
  }, [loadTenants]);

  const refreshTenants = useCallback(async () => {
    await loadTenants();
  }, [loadTenants]);

  const createTenant = useCallback(
    async (params: CreateTenantParams): Promise<TenantDetail> => {
      const detail = await apiCreateTenant(params);
      await refreshTenants();
      return detail;
    },
    [refreshTenants]
  );

  const deleteTenant = useCallback(
    async (id: string): Promise<void> => {
      await apiDeleteTenant(id);
      setSelectedTenant((prev) => (prev?.id === id ? null : prev));
      await refreshTenants();
    },
    [refreshTenants]
  );

  return (
    <TenantContext.Provider
      value={{
        tenants,
        selectedTenant,
        setSelectedTenant,
        loading,
        error,
        createTenant,
        deleteTenant,
        refreshTenants,
      }}
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
