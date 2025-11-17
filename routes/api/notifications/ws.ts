/**
 * GET /api/notifications/ws
 * WebSocket endpoint for real-time notifications
 * 
 * This endpoint upgrades HTTP connections to WebSocket.
 * Authentication is done via query parameter: ?token=<jwt>
 */

import { Handlers } from 'fresh';
import { setupWebSocketConnection } from '@/lib/notification-websocket.ts';

export const handler: Handlers = {
  GET(ctx) {
    // Check for WebSocket upgrade header
    if (ctx.req.headers.get("upgrade") !== "websocket") {
      return new Response(null, { status: 426 });
    }

    // Use the existing setupWebSocketConnection which handles auth internally
    const wsHandlers = setupWebSocketConnection();
    
    // Upgrade to WebSocket using Fresh's Deno.upgradeWebSocket
    const { socket, response } = Deno.upgradeWebSocket(ctx.req);
    
    // Attach the handlers from setupWebSocketConnection
    socket.onopen = (evt) => wsHandlers.onOpen?.(evt, socket);
    socket.onmessage = (evt) => wsHandlers.onMessage?.(evt, socket);
    socket.onclose = () => wsHandlers.onClose?.();
    socket.onerror = (evt) => wsHandlers.onError?.(evt);
    
    return response;
  },
};

