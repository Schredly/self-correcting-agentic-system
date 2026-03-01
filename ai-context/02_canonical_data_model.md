# Canonical Data Model

## WorkObject

Represents any work task from any system.

Fields:
- work_id
- source_system
- record_type
- title
- description
- classification: ClassificationLevel[]
- metadata

## ClassificationLevel

- name
- value

Supports unlimited depth.

## AgentRun

- run_id
- tenant_id
- status
- started_at
- completed_at
- work_object
- skills[]

## SkillExecution

- skill_id
- name
- state
- summary
- confidence
- details

## AgentEvent

- run_id
- skill_id
- event_type
- summary
- confidence
- timestamp
- metadata

These contracts must not change without updating frontend types.