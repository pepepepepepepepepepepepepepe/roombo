const fs        = require('fs');
const express   = require('express');
const https     = require('https');
const http = require('http');
const WebSocket = require('ws');
const path      = require('path');
const cors = require('cors');

const app = express();

app.use(cors());
// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// Load SSL certificate and key
const sslOptions = {
  key:  fs.readFileSync(path.join(__dirname, 'certs', 'server.key')),
  cert: fs.readFileSync(path.join(__dirname, 'certs', 'server.crt'))
};

// Create HTTPS server
//const server = https.createServer(sslOptions, app);

// Create HTTP Server
const server = http.createServer(app);
server.listen(8080);

// Create WebSocket server on top of HTTPS
const wss = new WebSocket.Server({ server });

// Let Express parse JSON bodies
app.use(express.json());

// Store latest metrics
let latestMetrics = null;

// Unified POST handler for RoomOS macro
app.post('/metrics', (req, res) => {
  const payload = req.body;
  console.log('HTTP /metrics got →', payload);

  // Save latest metrics
  latestMetrics = payload;

  // Broadcast to all WebSocket clients
  wss.clients.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    }
  });

  // Reply 200 OK
  res.sendStatus(200);
});

// GET endpoint for polling clients
app.get('/latest-metrics', (req, res) => {
  res.json(latestMetrics || {});
});

// Log WebSocket connections
wss.on('connection', ws => {
  console.log('⚡️ signage client connected via WebSocket');
  ws.on('close', () => console.log('signage client disconnected'));
});

// Start HTTPS+WS on port 8443
//server.listen(8443, () => {
//  console.log('Listening on https://0.0.0.0:8443 (and WS on same port)');
//});