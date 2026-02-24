import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const server = createServer(app);
  const PORT = 3000;

  // WebSocket Server for Real-Time Monitoring
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    console.log('Client connected to monitoring stream');

    // Send initial data immediately
    sendMonitoringData(ws);

    ws.on('close', () => {
      console.log('Client disconnected');
    });
  });

  // Simulation State
  let currentAccuracy = 94.8;
  let currentF1 = 0.912;
  let currentDrift = 0.24;
  let currentLatency = 42;
  let driftHistory = [0.02, 0.03, 0.025, 0.04, 0.12, 0.18, 0.24, 0.22];

  function sendMonitoringData(ws: WebSocket) {
    if (ws.readyState === WebSocket.OPEN) {
      const data = {
        type: 'metrics_update',
        timestamp: new Date().toISOString(),
        metrics: {
          accuracy: `${currentAccuracy.toFixed(1)}%`,
          accuracyChange: `${(Math.random() * 2 - 1).toFixed(1)}%`,
          f1Score: currentF1.toFixed(3),
          driftScore: currentDrift.toFixed(2),
          driftStatus: currentDrift > 0.20 ? 'Critical' : 'Normal',
          avgLatency: `${Math.floor(currentLatency)}ms`,
          modelStatus: currentDrift > 0.20 ? 'Retraining Required' : 'System Operational',
          driftChartLabels: generateTimeLabels(8),
          driftChartValues: [...driftHistory],
          recentBatches: generateRecentBatches()
        }
      };
      ws.send(JSON.stringify(data));
    }
  }

  // Simulation Loop
  setInterval(() => {
    // Simulate random fluctuations
    currentAccuracy += (Math.random() - 0.5) * 0.5;
    if (currentAccuracy > 99) currentAccuracy = 99;
    if (currentAccuracy < 85) currentAccuracy = 85;

    currentF1 += (Math.random() - 0.5) * 0.01;
    if (currentF1 > 0.99) currentF1 = 0.99;
    if (currentF1 < 0.80) currentF1 = 0.80;

    // Simulate drift trend
    if (Math.random() > 0.7) {
        currentDrift += 0.02; // Slow drift up
    } else {
        currentDrift -= 0.01; // Correction
    }
    if (currentDrift < 0) currentDrift = 0;
    
    // Update history
    driftHistory.shift();
    driftHistory.push(currentDrift);

    currentLatency += (Math.random() - 0.5) * 5;
    if (currentLatency < 10) currentLatency = 10;

    // Broadcast to all clients
    wss.clients.forEach((client) => {
      sendMonitoringData(client);
    });
  }, 2000); // Update every 2 seconds

  // Helper functions
  function generateTimeLabels(count: number) {
    const labels = [];
    const now = new Date();
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 15 * 60000);
      labels.push(`${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`);
    }
    return labels;
  }

  function generateRecentBatches() {
    const batches = [];
    const now = new Date();
    for (let i = 0; i < 3; i++) {
        const timestamp = new Date(now.getTime() - i * 5 * 60000).toLocaleTimeString();
        const id = Math.floor(Math.random() * 10000);
        const isDriftHigh = Math.random() > 0.8;
        batches.push({
            id: `#b-${9821 - i}`,
            timestamp: `Today, ${timestamp}`,
            version: "v2.4",
            quality: Math.random() > 0.1 ? "100% Valid" : "98% Valid",
            drift: isDriftHigh ? "High" : "Low",
            driftLevel: isDriftHigh ? "High" : "Low"
        });
    }
    return batches;
  }

  // Vite Middleware Setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving (if needed later)
    app.use(express.static('dist'));
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
