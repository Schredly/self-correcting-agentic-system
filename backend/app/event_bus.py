"""In-memory per-run event bus for broadcasting WebSocket messages.

Subscribers receive a pre-filled queue with any events published before they
joined, so late-connecting WebSocket clients still get the full run history.
"""

from __future__ import annotations

import asyncio
import logging

logger = logging.getLogger(__name__)


class EventBus:
    def __init__(self) -> None:
        self.subscribers: dict[str, set[asyncio.Queue[dict | None]]] = {}
        self._history: dict[str, list[dict]] = {}

    def subscribe(self, run_id: str) -> asyncio.Queue[dict | None]:
        """Return a queue that will receive all past and future events for this run."""
        queue: asyncio.Queue[dict | None] = asyncio.Queue()
        for event in self._history.get(run_id, []):
            queue.put_nowait(event)
        self.subscribers.setdefault(run_id, set()).add(queue)
        logger.info("Subscriber added — run_id=%s (total=%d)", run_id, len(self.subscribers[run_id]))
        return queue

    def unsubscribe(self, run_id: str, queue: asyncio.Queue[dict | None]) -> None:
        subs = self.subscribers.get(run_id)
        if subs:
            subs.discard(queue)
            logger.info("Subscriber removed — run_id=%s (total=%d)", run_id, len(subs))

    def publish(self, run_id: str, message: dict) -> None:
        """Broadcast a message envelope dict to all current subscribers and store in history."""
        self._history.setdefault(run_id, []).append(message)
        for queue in self.subscribers.get(run_id, set()).copy():
            queue.put_nowait(message)
