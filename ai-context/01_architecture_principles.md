# Architecture Principles

1. Contract First
Frontend and backend share strict typed contracts.
No implicit assumptions.

2. Vendor Neutral
Agents NEVER depend on ServiceNow, Jira, Salesforce schemas.
Adapters normalize upstream systems.

3. Dynamic Classification
Classification supports unlimited depth.
No hardcoded category/subcategory logic.

4. Event-Driven Execution
Agent reasoning is emitted as structured events.
Frontend subscribes via WebSocket.

5. Skill Isolation
Each skill:
- Has defined inputs
- Emits structured outputs
- Has explicit lifecycle states

6. Multi-Tenant From Day One
All runs must include tenant_id.
No global state.

7. Observable System
All actions produce logs and structured events.

8. No UI Refactoring Unless Explicitly Requested
Claude must not redesign UI layout when modifying logic.