# Multi-Tenant Model

All runs must include:

- tenant_id
- environment (dev/staging/prod)

No global shared state.

Memory, retrieval, evaluation are tenant-scoped.

Future deployment must support:
- Per-tenant config
- Per-tenant adapter credentials
- Isolation guarantees