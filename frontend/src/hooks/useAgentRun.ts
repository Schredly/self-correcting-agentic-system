import { useEffect, useReducer, useState, useRef } from "react";
import type { AgentRun } from "../types/agents";
import { agentReducer, type AgentAction } from "../state/agentReducer";

export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

const MAX_RECONNECT_DELAY = 30_000;
const INITIAL_RECONNECT_DELAY = 1_000;

export function useAgentRun(
  runId: string | null,
  tenantId: string
): {
  run: AgentRun | null;
  status: ConnectionStatus;
} {
  const [run, dispatch] = useReducer(agentReducer, null);
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempt = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const mountedRef = useRef(true);

  useEffect(() => {
    if (runId === null) {
      setStatus("disconnected");
      return;
    }

    mountedRef.current = true;

    function connect() {
      if (!mountedRef.current) return;

      setStatus("connecting");
      const wsProtocol = location.protocol === "https:" ? "wss:" : "ws:";
      const ws = new WebSocket(
        `${wsProtocol}//${location.host}/runs/${runId}/events?tenant_id=${encodeURIComponent(tenantId)}`
      );
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
  }, [runId, tenantId]);

  return { run, status };
}
