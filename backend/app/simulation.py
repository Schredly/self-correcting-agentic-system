"""Async generator that yields a scripted demo run as WebSocket messages.

The demo simulates a ServiceNow defective-item return case processed by four
agent skills. Each skill progresses through realistic phases with metadata
keys that the frontend reducer's mergeDetails() expects:

  thinking   -> metadata.inputs
  retrieval  -> metadata.sources  (list[str])
  planning   -> metadata.steps    (list[str])
  tool_call  -> metadata.tool     (str)
  complete   -> metadata.outputs  (str)

Total simulated wall time: ~25 seconds.
"""

from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from typing import AsyncGenerator

from .models import (
    AgentEvent,
    AgentRun,
    ClassificationLevel,
    RunCompletedMessage,
    RunStartedMessage,
    SkillUpdateMessage,
    WebSocketMessage,
    WorkObject,
)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _build_work_object() -> WorkObject:
    return WorkObject(
        work_id="INC-2024-08172",
        source_system="servicenow",
        record_type="incident",
        title="Defective Item Return — Order ORD-98234",
        description=(
            "Customer Sarah Johnson reports that item SKU ACM-2847-BLK "
            "(Acme Wireless Headphones, Black) arrived with a non-functional "
            "left ear cup. Customer is requesting a full refund. Order was "
            "placed 12 days ago and is within the 30-day return window."
        ),
        classification=[
            ClassificationLevel(name="category", value="Product"),
            ClassificationLevel(name="subcategory", value="Returns"),
            ClassificationLevel(name="type", value="Defective Item"),
        ],
        metadata={
            "priority": "P3",
            "assignedTo": "Agent Smith",
            "customerName": "Sarah Johnson",
            "orderNumber": "ORD-98234",
            "sku": "ACM-2847-BLK",
            "productName": "Acme Wireless Headphones (Black)",
            "purchaseDate": "2024-08-05",
            "returnWindow": "30 days",
        },
    )


# ── Per-skill event scripts ──────────────────────────────────────────────────
# Each entry: (event_type, summary, confidence, metadata, delay_before_sec)

_CLASSIFICATION_VALIDATOR_EVENTS: list[tuple[str, str, float | None, dict | None, float]] = [
    (
        "thinking",
        "Analyzing incident classification and customer context...",
        None,
        {
            "inputs": {
                "work_id": "INC-2024-08172",
                "customer": "Sarah Johnson",
                "order": "ORD-98234",
                "sku": "ACM-2847-BLK",
                "issue": "Defective left ear cup",
            }
        },
        0.5,
    ),
    (
        "retrieval",
        "Pulling classification taxonomy and historical patterns...",
        None,
        {"sources": ["classification_taxonomy_v3.json", "incident_patterns_2024_q3.parquet"]},
        1.5,
    ),
    (
        "planning",
        "Building classification validation plan...",
        None,
        {
            "steps": [
                "Validate category/subcategory against taxonomy",
                "Check defect-type keywords in description",
                "Cross-reference SKU against known-defect database",
                "Assign confidence score",
            ]
        },
        1.0,
    ),
    (
        "tool_call",
        "Querying defect database for SKU ACM-2847-BLK...",
        None,
        {"tool": "defect_db.query(sku='ACM-2847-BLK')"},
        1.5,
    ),
    (
        "tool_result",
        "Found 3 similar defect reports for this SKU in the last 90 days.",
        None,
        None,
        0.8,
    ),
    (
        "verification",
        "Classification validated — Defective Item matches taxonomy and defect history.",
        0.94,
        None,
        1.0,
    ),
    (
        "complete",
        "Classification confirmed: Product > Returns > Defective Item (94% confidence).",
        0.94,
        {"outputs": "Classification validated. Category: Product > Returns > Defective Item. "
         "3 prior defect reports found for SKU ACM-2847-BLK in the last 90 days."},
        0.5,
    ),
]

_VENDOR_ATTRIBUTION_EVENTS: list[tuple[str, str, float | None, dict | None, float]] = [
    (
        "thinking",
        "Identifying vendor and supply chain details for SKU ACM-2847-BLK...",
        None,
        {
            "inputs": {
                "sku": "ACM-2847-BLK",
                "productName": "Acme Wireless Headphones (Black)",
                "defectType": "non-functional left ear cup",
            }
        },
        0.5,
    ),
    (
        "retrieval",
        "Fetching vendor contracts and quality SLA data...",
        None,
        {"sources": ["vendor_contracts.db", "quality_sla_matrix.xlsx", "supplier_scorecard_acme.json"]},
        1.2,
    ),
    (
        "planning",
        "Determining attribution and chargeback eligibility...",
        None,
        {
            "steps": [
                "Look up vendor for SKU ACM-2847-BLK",
                "Check batch/lot for known quality holds",
                "Evaluate SLA breach threshold (>2% defect rate)",
                "Determine chargeback eligibility",
            ]
        },
        1.0,
    ),
    (
        "tool_call",
        "Checking vendor quality metrics API...",
        None,
        {"tool": "vendor_api.get_quality_metrics(vendor_id='ACME-001', sku='ACM-2847-BLK')"},
        1.5,
    ),
    (
        "tool_result",
        "Vendor ACME-001 defect rate: 3.2% (SLA threshold: 2%). Batch BLK-2024-07 flagged.",
        None,
        None,
        0.8,
    ),
    (
        "verification",
        "Vendor attribution confirmed — ACME-001 exceeds defect SLA, chargeback eligible.",
        0.98,
        None,
        0.8,
    ),
    (
        "complete",
        "Vendor: ACME-001 (Acme Electronics). Defect rate 3.2% exceeds 2% SLA. Chargeback eligible.",
        0.98,
        {"outputs": "Vendor ACME-001 (Acme Electronics) attributed. Defect rate 3.2% exceeds "
         "2% SLA threshold. Batch BLK-2024-07 flagged for quality hold. Chargeback eligible "
         "under contract clause 7.3."},
        0.5,
    ),
]

_POLICY_RETRIEVAL_EVENTS: list[tuple[str, str, float | None, dict | None, float]] = [
    (
        "thinking",
        "Determining applicable return and refund policies...",
        None,
        {
            "inputs": {
                "returnReason": "defective",
                "daysSincePurchase": 12,
                "returnWindow": 30,
                "orderTotal": "$89.99",
            }
        },
        0.5,
    ),
    (
        "retrieval",
        "Searching policy knowledge base for defective-item return procedures...",
        None,
        {"sources": ["return_policy_v4.2.md", "defective_item_procedures.md", "refund_approval_matrix.json"]},
        1.5,
    ),
    (
        "planning",
        "Evaluating policy conditions against case facts...",
        None,
        {
            "steps": [
                "Verify purchase is within return window",
                "Check defective-item exception rules",
                "Determine refund method (original payment vs store credit)",
                "Check if manager approval is required",
            ]
        },
        1.0,
    ),
    (
        "tool_call",
        "Looking up refund approval thresholds...",
        None,
        {"tool": "policy_engine.check_approval(amount=89.99, reason='defective')"},
        1.0,
    ),
    (
        "tool_result",
        "Auto-approval: defective items under $100 do not require manager sign-off.",
        None,
        None,
        0.5,
    ),
    (
        "memory_write",
        "Caching policy lookup result for session reuse.",
        None,
        None,
        0.5,
    ),
    (
        "verification",
        "Policy conditions met — full refund to original payment method authorized.",
        0.87,
        None,
        0.8,
    ),
    (
        "complete",
        "Policy validated: full refund eligible, auto-approved (defective item < $100).",
        0.87,
        {"outputs": "Applicable policy: Return Policy v4.2, Section 3.1 (Defective Items). "
         "Full refund to original payment method. Auto-approved — no manager sign-off required "
         "for defective items under $100. Customer does not need to return the item."},
        0.5,
    ),
]

_RESOLUTION_RECOMMENDER_EVENTS: list[tuple[str, str, float | None, dict | None, float]] = [
    (
        "thinking",
        "Synthesizing findings to determine optimal resolution...",
        None,
        {
            "inputs": {
                "classification": "Defective Item (94%)",
                "vendor": "ACME-001 — chargeback eligible",
                "policy": "Full refund auto-approved",
                "customerSentiment": "frustrated but polite",
            }
        },
        0.5,
    ),
    (
        "retrieval",
        "Pulling resolution templates and customer satisfaction benchmarks...",
        None,
        {"sources": ["resolution_templates.json", "csat_benchmarks_2024.csv"]},
        1.0,
    ),
    (
        "planning",
        "Drafting resolution recommendation...",
        None,
        {
            "steps": [
                "Select resolution type (refund / replacement / credit)",
                "Draft customer-facing response",
                "Prepare internal chargeback request",
                "Set follow-up reminder for CSAT survey",
            ]
        },
        1.0,
    ),
    (
        "tool_call",
        "Generating customer response from template...",
        None,
        {"tool": "template_engine.render('defective_refund', context)"},
        1.0,
    ),
    (
        "tool_result",
        "Customer response generated and ready for agent review.",
        None,
        None,
        0.5,
    ),
    (
        "verification",
        "Resolution package complete — refund + chargeback + follow-up.",
        0.91,
        None,
        0.8,
    ),
    (
        "complete",
        "Recommended: full refund of $89.99, vendor chargeback initiated, CSAT follow-up in 48h.",
        0.91,
        {"outputs": "Resolution: Issue full refund of $89.99 to original payment method. "
         "Initiate vendor chargeback against ACME-001 (contract clause 7.3). "
         "No item return required. Send templated apology email. "
         "Schedule CSAT follow-up survey in 48 hours."},
        0.5,
    ),
]


# Ordered list of (skill_id, events)
_SKILL_SCRIPTS: list[tuple[str, list[tuple[str, str, float | None, dict | None, float]]]] = [
    ("Classification Validator", _CLASSIFICATION_VALIDATOR_EVENTS),
    ("Vendor Attribution", _VENDOR_ATTRIBUTION_EVENTS),
    ("Policy Retrieval", _POLICY_RETRIEVAL_EVENTS),
    ("Resolution Recommender", _RESOLUTION_RECOMMENDER_EVENTS),
]


async def simulate_demo_run(run_id: str) -> AsyncGenerator[WebSocketMessage, None]:
    """Yield a scripted sequence of WebSocket messages for a demo run."""

    # 1. run_started
    agent_run = AgentRun(
        run_id=run_id,
        tenant_id="tenant-acme-corp",
        status="running",
        started_at=_now(),
        work_object=_build_work_object(),
        skills=[],
    )
    yield RunStartedMessage(payload=agent_run)

    await asyncio.sleep(0.8)

    # 2. Skill events
    for skill_id, events in _SKILL_SCRIPTS:
        for event_type, summary, confidence, metadata, delay in events:
            await asyncio.sleep(delay)
            event = AgentEvent(
                run_id=run_id,
                skill_id=skill_id,
                event_type=event_type,  # type: ignore[arg-type]
                summary=summary,
                confidence=confidence,
                timestamp=_now(),
                metadata=metadata,
            )
            yield SkillUpdateMessage(payload=event)

        # Small pause between skills
        await asyncio.sleep(0.3)

    # 3. run_completed
    await asyncio.sleep(0.5)
    yield RunCompletedMessage()
