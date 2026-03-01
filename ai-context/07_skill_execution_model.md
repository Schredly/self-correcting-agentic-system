# Skill Execution Model

Each skill transitions through states:

- idle
- thinking
- retrieving
- planning
- executing
- verifying
- complete
- error

Skills must:
- Emit structured events
- Provide summary-level reasoning
- Never expose raw chain-of-thought

Details view shows structured explanation only.