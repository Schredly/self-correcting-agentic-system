# Event Stream Contract

Transport: WebSocket

Endpoint:
ws://localhost:8000/runs/{run_id}/events

Event Types:
- run_started
- thinking
- retrieval
- planning
- tool_call
- tool_result
- memory_write
- verification
- complete
- error
- run_completed
- run_failed

Each event must be:

{
  run_id,
  skill_id,
  event_type,
  summary,
  confidence?,
  timestamp,
  metadata?
}

Events are append-only.
No mutation of past events.
Frontend reducer derives state.