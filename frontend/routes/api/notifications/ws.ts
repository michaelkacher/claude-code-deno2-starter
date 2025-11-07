/**
 * GET /api/notifications/ws
 * WebSocket endpoint for real-time notifications
 * 
 * This endpoint upgrades HTTP connections to WebSocket.
 * Authentication is done via query parameter: ?token=<jwt>
 */

import { Handlers } from "$fresh/server.ts";
import { setupWebSocketConnection } from "../../../../shared/lib/notification-websocket.ts";

export const handler: Handlers = {
  GET(req) {
    // Use the existing setupWebSocketConnection which handles auth internally
    const wsHandlers = setupWebSocketConnection();
    
    // Upgrade to WebSocket using Fresh's Deno.upgradeWebSocket
    const { socket, response } = Deno.upgradeWebSocket(req);
    
    // Attach the handlers from setupWebSocketConnection
    socket.onopen = (evt) => wsHandlers.onOpen?.(evt, socket as any);
    socket.onmessage = (evt) => wsHandlers.onMessage?.(evt, socket as any);
    socket.onclose = (evt) => wsHandlers.onClose?.(evt, socket as any);
    socket.onerror = (evt) => wsHandlers.onError?.(evt, socket as any);
    
    return response;
  },
};
