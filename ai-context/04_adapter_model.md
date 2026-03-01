# Adapter Model

Adapters translate external systems into WorkObject.

Adapters must:
- Normalize classification
- Preserve metadata
- Handle authentication internally
- Never leak vendor schema into agents

Examples:
- ServiceNowAdapter
- JiraAdapter
- SalesforceAdapter

Agents consume only WorkObject.