# UI Contract Rules

The frontend UI is authoritative for:

- Skill card layout
- Event display structure
- Timeline visualization
- Drawer detail rendering

Backend must conform to UI data contracts.

Claude must:
- Never redesign layout unless explicitly instructed
- Never rename components without instruction
- Only modify data layer when wiring backend