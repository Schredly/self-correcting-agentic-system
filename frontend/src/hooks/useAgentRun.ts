import { useEffect, useReducer, useState, useRef } from "react";
import type { AgentRun } from "../types/agents";
import { agentReducer, type AgentAction } from "../state/agentReducer";

export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

const WS_BASE = "ws://localhost:8000";
const MAX_RECONNECT_DELAY = 30_000;
const INITIAL_RECONNECT_DELAY = 1_000;

export function useAgentRun(runId: string): {
  run: AgentRun | null;
  status: ConnectionStatus;
} {
  const [run, dispatch] = useReducer(agentReducer, null);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempt = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    function connect() {
      if (!mountedRef.current) return;

      setStatus("connecting");
      const ws = new WebSocket(`${WS_BASE}/runs/${runId}/events`);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) {
          ws.close();
          return;
        }
        setStatus("connected");
        reconnectAttempt.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as AgentAction;
          dispatch(message);
        } catch {
          // Ignore malformed messages
        }
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        setStatus("disconnected");
        const delay = Math.min(
          INITIAL_RECONNECT_DELAY * 2 ** reconnectAttempt.current,
          MAX_RECONNECT_DELAY
        );
        reconnectAttempt.current += 1;
        reconnectTimer.current = setTimeout(connect, delay);
      };

      ws.onerror = () => {
        setStatus("error");
        ws.close();
      };
    }

    connect();

    return () => {
      mountedRef.current = false;
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [runId]);

  return { run, status };
}
