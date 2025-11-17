/**
 * AI Task Dashboard - WebSocket Handler
 * 
 * Provides real-time updates for the dashboard using WebSocket connections.
 * Handles live task status changes, agent updates, and performance metrics.
 */

import { FreshContext } from "fresh";
import { AITaskDashboardService } from '@/services/ai-task-dashboard.service.ts';

const dashboardService = new AITaskDashboardService();

// Store active WebSocket connections
const activeConnections = new Map<string, WebSocket>();

// Connection metadata
interface ConnectionMeta {
  id: string;
  userId?: string;
  subscribedEvents: string[];
  lastPing: number;
}

const connectionMetas = new Map<string, ConnectionMeta>();

// Generate unique connection ID
function generateConnectionId(): string {
  return crypto.randomUUID();
}

// Clean up inactive connections
function cleanupConnections() {
  const now = Date.now();
  const timeout = 60000; // 1 minute timeout

  for (const [connectionId, meta] of connectionMetas.entries()) {
    if (now - meta.lastPing > timeout) {
      const ws = activeConnections.get(connectionId);
      if (ws) {
        try {
          ws.close();
        } catch (e) {
          console.error("Error closing WebSocket:", e);
        }
      }
      activeConnections.delete(connectionId);
      connectionMetas.delete(connectionId);
      console.log(`Cleaned up inactive connection: ${connectionId}`);
    }
  }
}

// Cleanup interval
setInterval(cleanupConnections, 30000); // Every 30 seconds

// Broadcast to all connected clients
export function broadcastDashboardUpdate(eventType: string, data: any) {
  const message = JSON.stringify({
    type: eventType,
    timestamp: new Date().toISOString(),
    data
  });

  for (const [connectionId, ws] of activeConnections.entries()) {
    const meta = connectionMetas.get(connectionId);
    if (meta && meta.subscribedEvents.includes(eventType)) {
      try {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        } else {
          // Remove closed connections
          activeConnections.delete(connectionId);
          connectionMetas.delete(connectionId);
        }
      } catch (error) {
        console.error(`Error sending to WebSocket ${connectionId}:`, error);
        activeConnections.delete(connectionId);
        connectionMetas.delete(connectionId);
      }
    }
  }
}

export const handler = {
  GET: (ctx: FreshContext) => {
    const req = ctx.req;
    const upgrade = req.headers.get("upgrade") || "";
    
    if (upgrade.toLowerCase() !== "websocket") {
      return new Response("Expected WebSocket upgrade", { status: 426 });
    }

    const { socket: ws, response } = Deno.upgradeWebSocket(req);
    const connectionId = generateConnectionId();

    ws.addEventListener("open", () => {
      console.log(`WebSocket connected: ${connectionId}`);
      
      // Store connection
      activeConnections.set(connectionId, ws);
      connectionMetas.set(connectionId, {
        id: connectionId,
        subscribedEvents: [], // Will be set by client
        lastPing: Date.now(),
      });

      // Send welcome message
      ws.send(JSON.stringify({
        type: "connected",
        connectionId,
        timestamp: new Date().toISOString(),
        message: "Connected to AI Task Dashboard"
      }));
    });

    ws.addEventListener("message", async (event) => {
      try {
        const message = JSON.parse(event.data);
        const meta = connectionMetas.get(connectionId);
        
        if (!meta) {
          console.error(`No metadata found for connection ${connectionId}`);
          return;
        }

        // Update last ping
        meta.lastPing = Date.now();

        switch (message.type) {
          case "subscribe":
            // Subscribe to specific events
            meta.subscribedEvents = message.events || [
              "task_updated",
              "task_created",
              "agent_status_changed",
              "performance_updated"
            ];
            
            ws.send(JSON.stringify({
              type: "subscription_confirmed",
              subscribedEvents: meta.subscribedEvents,
              timestamp: new Date().toISOString()
            }));
            break;

          case "ping":
            // Respond to ping
            ws.send(JSON.stringify({
              type: "pong",
              timestamp: new Date().toISOString()
            }));
            break;

          case "get_overview":
            // Send current dashboard overview
            try {
              const overview = await dashboardService.getDashboardOverview(
                message.timeframe || "24h"
              );
              ws.send(JSON.stringify({
                type: "overview_update",
                data: overview,
                timestamp: new Date().toISOString()
              }));
            } catch (error) {
              ws.send(JSON.stringify({
                type: "error",
                message: "Failed to fetch overview",
                error: error.message,
                timestamp: new Date().toISOString()
              }));
            }
            break;

          case "get_tasks":
            // Send current filtered tasks
            try {
              const tasks = await dashboardService.getFilteredTasks(
                message.params || {}
              );
              ws.send(JSON.stringify({
                type: "tasks_update",
                data: tasks,
                timestamp: new Date().toISOString()
              }));
            } catch (error) {
              ws.send(JSON.stringify({
                type: "error",
                message: "Failed to fetch tasks",
                error: error.message,
                timestamp: new Date().toISOString()
              }));
            }
            break;

          case "get_agent_status":
            // Send current AI agent status
            try {
              const agentStatus = await dashboardService.getAIAgentStatus();
              ws.send(JSON.stringify({
                type: "agents_update",
                data: agentStatus,
                timestamp: new Date().toISOString()
              }));
            } catch (error) {
              ws.send(JSON.stringify({
                type: "error",
                message: "Failed to fetch agent status",
                error: error.message,
                timestamp: new Date().toISOString()
              }));
            }
            break;

          case "identify":
            // Set user ID for connection
            meta.userId = message.userId;
            console.log(`Connection ${connectionId} identified as user ${message.userId}`);
            break;

          default:
            console.log(`Unknown message type: ${message.type}`);
            ws.send(JSON.stringify({
              type: "error",
              message: `Unknown message type: ${message.type}`,
              timestamp: new Date().toISOString()
            }));
        }
      } catch (error) {
        console.error(`Error processing WebSocket message:`, error);
        ws.send(JSON.stringify({
          type: "error",
          message: "Invalid message format",
          timestamp: new Date().toISOString()
        }));
      }
    });

    ws.addEventListener("close", () => {
      console.log(`WebSocket disconnected: ${connectionId}`);
      activeConnections.delete(connectionId);
      connectionMetas.delete(connectionId);
    });

    ws.addEventListener("error", (error) => {
      console.error(`WebSocket error for ${connectionId}:`, error);
      activeConnections.delete(connectionId);
      connectionMetas.delete(connectionId);
    });

    return response;
  }
};

// Helper functions for triggering real-time updates

export async function notifyTaskUpdate(taskId: string) {
  try {
    // This would typically be called by the task service when a task changes
    const task = await dashboardService.getTaskById(taskId);
    if (task) {
      broadcastDashboardUpdate("task_updated", { task });
    }
  } catch (error) {
    console.error("Error notifying task update:", error);
  }
}

export async function notifyAgentStatusChange(agentId: string) {
  try {
    const agentStatus = await dashboardService.getAIAgentStatus();
    const agent = agentStatus.agents.find(a => a.id === agentId);
    if (agent) {
      broadcastDashboardUpdate("agent_status_changed", { agent });
    }
  } catch (error) {
    console.error("Error notifying agent status change:", error);
  }
}

export async function notifyPerformanceUpdate() {
  try {
    const analytics = await dashboardService.getPerformanceAnalytics("24h", "hour");
    broadcastDashboardUpdate("performance_updated", { analytics });
  } catch (error) {
    console.error("Error notifying performance update:", error);
  }
}

// Export connection stats for monitoring
export function getConnectionStats() {
  return {
    activeConnections: activeConnections.size,
    connectionDetails: Array.from(connectionMetas.values()).map(meta => ({
      id: meta.id,
      userId: meta.userId,
      subscribedEvents: meta.subscribedEvents,
      lastPing: meta.lastPing,
      uptime: Date.now() - meta.lastPing
    }))
  };
}
