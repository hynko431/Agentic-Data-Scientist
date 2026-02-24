import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import AgentWorkspace from './components/AgentWorkspace';
import ChatBot from './components/ChatBot';
import { DashboardMetrics } from './types';

function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard' | 'workspace'>('landing');
  
  // Initial Dashboard Data (Mock)
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics>({
    accuracy: "94.8%",
    accuracyChange: "+1.2%",
    f1Score: "0.912",
    driftScore: "0.24",
    driftStatus: "Critical",
    avgLatency: "42ms",
    modelStatus: "Retraining Required",
    driftChartLabels: ['09:00', '09:15', '09:30', '09:45', '10:00', '10:15', '10:30', '10:45'],
    driftChartValues: [0.02, 0.03, 0.025, 0.04, 0.12, 0.18, 0.24, 0.22],
    recentBatches: [
      {id: "#b-9821", timestamp: "Oct 25, 10:40:12", version: "v2.4", quality: "100% Valid", drift: "Low", driftLevel: "Low"},
      {id: "#b-9820", timestamp: "Oct 25, 10:35:05", version: "v2.4", quality: "98% Valid", drift: "High", driftLevel: "High"},
      {id: "#b-9819", timestamp: "Oct 25, 10:30:22", version: "v2.4", quality: "100% Valid", drift: "Low", driftLevel: "Low"}
    ]
  });

  // WebSocket Connection for Real-Time Updates
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('Connected to monitoring server');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'metrics_update') {
          setDashboardMetrics(prevMetrics => ({
            ...prevMetrics,
            ...data.metrics
          }));
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  const navigateTo = (view: string) => {
    if (view === 'landing' || view === 'dashboard' || view === 'workspace') {
      setCurrentView(view as any);
    }
  };

  return (
    <>
      {currentView === 'landing' && <LandingPage onNavigate={navigateTo} />}
      {currentView === 'dashboard' && <Dashboard onNavigate={navigateTo} metrics={dashboardMetrics} />}
      {currentView === 'workspace' && <AgentWorkspace onBack={() => navigateTo('dashboard')} onUpdateDashboard={setDashboardMetrics} />}
      <ChatBot />
    </>
  );
}

export default App;