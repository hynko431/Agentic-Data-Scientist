import React, { useState, useRef, useEffect } from 'react';
import { Send, Play, Settings, Activity, RotateCcw, Download, FileCode, BookOpen } from 'lucide-react';
import Terminal from './components/Terminal';
import AgentStatusPanel from './components/AgentStatus';
import FilePanel from './components/FilePanel';
import { LogMessage, AgentRole, AgentStatus, AnalysisPlanStep, FileData, Artifact } from './types';
import { generatePlan, generateCode, generateSummary } from './services/geminiService';
import { ML_PIPELINE_GUIDE } from './templates';

function App() {
  // State
  const [query, setQuery] = useState('');
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeAgent, setActiveAgent] = useState<AgentRole | null>(null);
  const [agentStatus, setAgentStatus] = useState<AgentStatus>(AgentStatus.IDLE);
  const [files, setFiles] = useState<FileData[]>([]);
  const [plan, setPlan] = useState<AnalysisPlanStep[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [mode, setMode] = useState<'simple' | 'orchestrated'>('orchestrated');

  // Helper to add logs
  const addLog = (role: AgentRole, content: string, type: LogMessage['type'] = 'info') => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      role,
      content,
      timestamp: new Date(),
      type
    }]);
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles: FileData[] = Array.from(e.target.files).map((f: File) => ({
        name: f.name,
        size: (f.size / 1024).toFixed(1) + ' KB',
        type: f.name.split('.').pop()?.toUpperCase() || 'FILE'
      }));
      setFiles(prev => [...prev, ...newFiles]);
      addLog(AgentRole.SYSTEM, `Loaded ${newFiles.length} file(s).`, 'info');
    }
  };

  // Load Template Function
  const loadTemplate = () => {
    setArtifacts(prev => [...prev, {
      id: 'template-pipeline',
      title: 'ML Pipeline Template',
      type: 'code',
      content: ML_PIPELINE_GUIDE,
      language: 'python'
    }]);
    addLog(AgentRole.SYSTEM, 'Loaded "End-to-End ML Pipeline with Automatic Retraining" template into Artifacts.', 'success');
    setQuery("I have loaded the End-to-End ML Pipeline template. Please explain how I can adapt this for my specific dataset.");
  };

  // Main Orchestration Logic
  const runOrchestration = async () => {
    if (!query.trim()) return;
    
    setIsProcessing(true);
    setPlan([]); // Reset plan
    setArtifacts([]);
    addLog(AgentRole.USER, query, 'info');

    // 1. Planning Phase
    setActiveAgent(AgentRole.PLANNER);
    setAgentStatus(AgentStatus.THINKING);
    addLog(AgentRole.SYSTEM, 'Initializing Planning Phase...', 'info');
    
    const fileContext = files.map(f => f.name).join(', ');
    const rawPlan = await generatePlan(query, fileContext);
    
    const structuredPlan: AnalysisPlanStep[] = rawPlan.map((desc, idx) => ({
      id: idx + 1,
      description: desc,
      status: 'pending'
    }));
    
    setPlan(structuredPlan);
    addLog(AgentRole.PLANNER, `Plan Created:\n${rawPlan.map((s, i) => `${i+1}. ${s}`).join('\n')}`, 'plan');

    // 2. Execution Phase
    setActiveAgent(AgentRole.CODER);
    setAgentStatus(AgentStatus.WORKING);

    // Create a context string that grows as we execute steps
    let executionContext = "";

    for (let i = 0; i < structuredPlan.length; i++) {
      const step = structuredPlan[i];
      
      // Update plan UI to show active
      setPlan(prev => prev.map(p => p.id === step.id ? { ...p, status: 'active' } : p));
      addLog(AgentRole.SYSTEM, `Starting Step ${step.id}: ${step.description}`, 'info');

      // Call Coder Agent
      const { code, explanation } = await generateCode(step.description, executionContext);
      
      // "Simulate" execution time
      await new Promise(r => setTimeout(r, 1000));
      
      addLog(AgentRole.CODER, explanation, 'info');
      addLog(AgentRole.CODER, code, 'code');
      
      // Update Context
      executionContext += `\nStep ${step.id} Code:\n${code}\n`;

      // Store Artifact
      setArtifacts(prev => [...prev, {
        id: `step-${step.id}`,
        title: `Step ${step.id} Code`,
        type: 'code',
        content: code,
        language: 'python'
      }]);

      // Update plan UI to completed
      setPlan(prev => prev.map(p => p.id === step.id ? { ...p, status: 'completed', code } : p));
      
      // Small pause for effect
      await new Promise(r => setTimeout(r, 500));
    }

    // 3. Summary Phase
    setActiveAgent(AgentRole.SUMMARY);
    setAgentStatus(AgentStatus.THINKING);
    
    const summary = await generateSummary(executionContext);
    addLog(AgentRole.SUMMARY, summary, 'success');
    
    setArtifacts(prev => [...prev, {
      id: 'final-report',
      title: 'Final Report',
      type: 'markdown',
      content: summary
    }]);

    setActiveAgent(null);
    setAgentStatus(AgentStatus.COMPLETED);
    setIsProcessing(false);
    addLog(AgentRole.SYSTEM, 'Workflow Completed Successfully.', 'success');
  };

  return (
    <div className="flex flex-col h-screen bg-background text-text overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-surfaceHighlight bg-surface/50 backdrop-blur flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-primary to-accent p-2 rounded-lg shadow-lg shadow-primary/20">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              Agentic Data Scientist
            </h1>
            <p className="text-[10px] text-muted font-mono uppercase tracking-widest">
              ADK Orchestrator • Gemini 2.5
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex bg-surfaceHighlight p-1 rounded-lg">
             <button 
               onClick={() => setMode('simple')}
               className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${mode === 'simple' ? 'bg-surface shadow text-white' : 'text-muted hover:text-white'}`}
             >
               Simple
             </button>
             <button 
               onClick={() => setMode('orchestrated')}
               className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${mode === 'orchestrated' ? 'bg-surface shadow text-white' : 'text-muted hover:text-white'}`}
             >
               Orchestrated
             </button>
          </div>
          <button className="p-2 text-muted hover:text-white transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar: Input & Files */}
        <div className="w-80 flex flex-col border-r border-surfaceHighlight bg-surface/20">
           <div className="p-4 shrink-0">
             <FilePanel 
               files={files} 
               onUpload={handleFileUpload} 
               onDelete={(name) => setFiles(prev => prev.filter(f => f.name !== name))} 
             />
           </div>
           
           <div className="flex-1 p-4 overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-muted uppercase">Goal / Query</h3>
                <button 
                  onClick={loadTemplate} 
                  className="text-[10px] flex items-center gap-1 text-accent hover:text-white transition-colors border border-accent/30 hover:bg-accent/10 px-2 py-0.5 rounded"
                  title="Load full ML pipeline code template"
                >
                  <BookOpen className="w-3 h-3" />
                  Load Template
                </button>
              </div>
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. Analyze sales.csv and forecast next month's revenue..."
                className="w-full h-40 bg-black/40 border border-surfaceHighlight rounded-lg p-3 text-sm focus:outline-none focus:border-primary/50 resize-none placeholder-muted/30"
                disabled={isProcessing}
              />
              <button
                onClick={runOrchestration}
                disabled={isProcessing || !query.trim()}
                className={`mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm transition-all shadow-lg
                  ${isProcessing || !query.trim()
                    ? 'bg-surfaceHighlight text-muted cursor-not-allowed' 
                    : 'bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white shadow-primary/25'
                  }`}
              >
                {isProcessing ? (
                  <>Processing...</>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    Start Analysis
                  </>
                )}
              </button>
           </div>
        </div>

        {/* Center: Terminal / Workspace */}
        <div className="flex-1 flex flex-col min-w-0 bg-black/20 relative">
          
          {/* Top Panel: Agent Status */}
          <div className="p-6 pb-0">
            <AgentStatusPanel activeAgent={activeAgent} status={agentStatus} />
          </div>

          {/* Bottom Panel: Logs */}
          <div className="flex-1 p-6 pt-2 min-h-0">
            <Terminal logs={logs} />
          </div>
        </div>

        {/* Right Sidebar: Plan & Artifacts */}
        <div className="w-96 flex flex-col border-l border-surfaceHighlight bg-surface/20">
          <div className="flex-1 flex flex-col min-h-0">
             
             {/* Plan View */}
             <div className="flex-1 p-4 border-b border-surfaceHighlight overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-muted uppercase tracking-wider">Analysis Plan</h3>
                  {plan.length > 0 && (
                    <span className="text-[10px] text-primary">{plan.filter(p => p.status === 'completed').length}/{plan.length} Completed</span>
                  )}
                </div>
                
                <div className="space-y-3">
                   {plan.length === 0 ? (
                     <div className="text-center text-muted/30 py-10 text-xs border border-dashed border-surfaceHighlight rounded">
                       Plan will appear here...
                     </div>
                   ) : (
                     plan.map((step, idx) => (
                       <div key={step.id} className={`relative pl-6 pb-2 ${idx !== plan.length - 1 ? 'border-l border-surfaceHighlight' : ''}`}>
                          <div className={`absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full border-2 
                            ${step.status === 'completed' ? 'bg-secondary border-secondary' 
                            : step.status === 'active' ? 'bg-background border-primary animate-pulse' 
                            : 'bg-background border-surfaceHighlight'}`} 
                          />
                          <h4 className={`text-sm font-medium ${step.status === 'completed' ? 'text-text' : step.status === 'active' ? 'text-primary' : 'text-muted'}`}>
                            {step.description}
                          </h4>
                          {step.status === 'active' && <span className="text-[10px] text-primary mt-1 inline-block">Executing...</span>}
                       </div>
                     ))
                   )}
                </div>
             </div>

             {/* Artifacts/Preview */}
             <div className="h-1/3 border-t border-surfaceHighlight bg-black/20 flex flex-col">
                <div className="p-3 border-b border-surfaceHighlight bg-surface/30 flex items-center justify-between">
                   <h3 className="text-xs font-bold text-muted uppercase tracking-wider">Outputs</h3>
                   <div className="flex gap-2">
                      <button className="text-muted hover:text-white" title="Download">
                         <Download className="w-3.5 h-3.5" />
                      </button>
                   </div>
                </div>
                <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                   {artifacts.length > 0 ? (
                     <div className="space-y-2">
                       {artifacts.map(art => (
                         <div key={art.id} className="bg-surface/50 border border-surfaceHighlight rounded p-3 hover:border-primary/30 transition-colors cursor-pointer group">
                           <div className="flex items-center gap-2 mb-1">
                             <FileCode className="w-4 h-4 text-accent" />
                             <span className="text-xs font-medium text-text group-hover:text-primary transition-colors">{art.title}</span>
                           </div>
                           <p className="text-[10px] text-muted line-clamp-2 font-mono opacity-70">
                             {art.content.substring(0, 100).replace(/\n/g, ' ')}...
                           </p>
                         </div>
                       ))}
                     </div>
                   ) : (
                     <div className="text-center text-muted/30 text-xs mt-4">
                       No artifacts generated yet.
                     </div>
                   )}
                </div>
             </div>

          </div>
        </div>

      </main>
    </div>
  );
}

export default App;