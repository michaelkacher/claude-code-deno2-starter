/**
 * WebSocket Connection Debugger
 * 
 * Run this script to diagnose WebSocket connection issues:
 * deno run --allow-net --allow-env scripts/debug-websocket.ts
 */

const BASE_URL = Deno.env.get('FRONTEND_URL') || 'http://localhost:3000';
const WS_URL = BASE_URL.replace('http://', 'ws://').replace('https://', 'wss://');

console.log('🔍 WebSocket Connection Debugger\n');
console.log('Configuration:');
console.log('  BASE_URL:', BASE_URL);
console.log('  WS_URL:', WS_URL);
console.log('  Endpoint:', `${WS_URL}/api/notifications/ws`);
console.log('\n');

// Test 1: Login and get token
console.log('📝 Step 1: Logging in to get access token...');

const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'test123',
  }),
});

if (!loginResponse.ok) {
  console.error('❌ Login failed:', loginResponse.status);
  console.log('\nMake sure you have a test user created:');
  console.log('  deno task seed:user');
  Deno.exit(1);
}

const { accessToken } = await loginResponse.json();
console.log('✅ Login successful');
console.log('   Token length:', accessToken?.length || 0);
console.log('   Token preview:', accessToken?.substring(0, 30) + '...');
console.log('\n');

// Test 2: Attempt WebSocket connection
console.log('📡 Step 2: Attempting WebSocket connection...');

const ws = new WebSocket(`${WS_URL}/api/notifications/ws?token=${encodeURIComponent(accessToken)}`);

// Track connection state
let authRequested = false;
let authSent = false;
let connected = false;
let timeout: number;

// Set timeout for connection
timeout = setTimeout(() => {
  console.log('\n⏱️  Connection timeout (10 seconds)');
  console.log('\nConnection State Summary:');
  console.log('  Auth Requested:', authRequested);
  console.log('  Auth Sent:', authSent);
  console.log('  Connected:', connected);
  console.log('  WebSocket State:', ws.readyState);
  console.log('    0 = CONNECTING');
  console.log('    1 = OPEN');
  console.log('    2 = CLOSING');
  console.log('    3 = CLOSED');
  ws.close();
  Deno.exit(1);
}, 10000);

ws.onopen = () => {
  console.log('✅ WebSocket connection opened');
  console.log('   ReadyState:', ws.readyState);
  console.log('   URL:', ws.url);
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('\n📨 Message received:', {
    type: data.type,
    message: data.message,
    keys: Object.keys(data),
  });

  switch (data.type) {
    case 'auth_required':
      authRequested = true;
      console.log('   Server requested authentication');
      console.log('   Sending auth token...');
      
      ws.send(JSON.stringify({
        type: 'auth',
        token: accessToken,
      }));
      authSent = true;
      console.log('   Auth token sent');
      break;

    case 'connected':
      connected = true;
      console.log('✅ Authentication successful!');
      console.log('   Connection ID:', data.connectionId);
      clearTimeout(timeout);
      
      // Close gracefully after success
      setTimeout(() => {
        console.log('\n✅ Test completed successfully!');
        ws.close();
        Deno.exit(0);
      }, 1000);
      break;

    case 'auth_failed':
      console.log('❌ Authentication failed');
      console.log('   Reason:', data.message);
      clearTimeout(timeout);
      ws.close();
      Deno.exit(1);
      break;

    case 'error':
      console.log('❌ Error from server');
      console.log('   Message:', data.message);
      break;

    case 'unread_count':
      console.log('   Unread count:', data.unreadCount);
      break;

    default:
      console.log('   (Unknown message type)');
  }
};

ws.onerror = (error) => {
  console.error('\n❌ WebSocket error:', error);
  console.log('   Type:', error.type);
  console.log('   Target:', error.target);
  clearTimeout(timeout);
};

ws.onclose = (event) => {
  console.log('\n🔌 WebSocket closed');
  console.log('   Code:', event.code);
  console.log('   Reason:', event.reason || '(none)');
  console.log('   Clean:', event.wasClean);
  
  console.log('\nCommon close codes:');
  console.log('   1000 = Normal closure');
  console.log('   1001 = Going away');
  console.log('   1002 = Protocol error');
  console.log('   1003 = Unsupported data');
  console.log('   1006 = Abnormal closure (no close frame)');
  console.log('   1011 = Server error');
  
  clearTimeout(timeout);
  
  if (!connected) {
    console.log('\n❌ Failed to establish authenticated connection');
    Deno.exit(1);
  }
};
