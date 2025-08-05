// server.js
const express   = require('express');
const http      = require('http');
const WebSocket = require('ws');

const app    = express();
const server = http.createServer(app);
const wss    = new WebSocket.Server({ server });

// Let Express parse JSON bodies
app.use(express.json());

// 1) HTTP endpoint for your RoomOS macro
app.post('/metrics', (req, res) => {
  const payload = req.body;              // { roomAnalytics:…, timestamp:… }
  console.log('HTTP /metrics got →', payload);

  // 2) Broadcast it to all open WebSocket clients
  wss.clients.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    }
  });

  // 3) Reply 200 OK so the macro sees “POST successful”
  res.sendStatus(200);
});

// 4) Log new WS connections
wss.on('connection', ws => {
  console.log('⚡️ signage client connected via WebSocket');
  ws.on('close', () => console.log('signage client disconnected'));
});

// 5) Start HTTP+WS on port 8080
server.listen(8080, () => {
  console.log('Listening on http://0.0.0.0:8080 (and WS on same port)');
});
