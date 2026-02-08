import React, { useEffect, useRef } from 'react';
import { LogMessage, AgentRole } from '../types';
import { Terminal as TerminalIcon, Cpu, User, CheckCircle, AlertCircle, FileCode } from 'lucide-react';

interface TerminalProps {
  logs: LogMessage[];
}

const Terminal: React.FC<TerminalProps> = ({ logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getIcon = (role: AgentRole) => {
    switch (role) {
      case AgentRole.SYSTEM: return <TerminalIcon className="w-4 h-4 text-muted" />;
      case AgentRole.USER: return <User className="w-4 h-4 text-primary" />;
      case AgentRole.PLANNER: return <Cpu className="w-4 h-4 text-accent" />;
      case AgentRole.CODER: return <FileCode className="w-4 h-4 text-secondary" />;
      case AgentRole.REVIEWER: return <CheckCircle className="w-4 h-4 text-yellow-500" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getColor = (type: LogMessage['type']) => {
    switch (type) {
      case 'error': return 'text-red-400 bg-red-900/20 border-l-2 border-red-500';
      case 'success': return 'text-green-400 bg-green-900/10';
      case 'code': return 'text-blue-300 font-mono text-sm bg-surfaceHighlight/50 border border-surfaceHighlight rounded my-2 p-2';
      case 'plan': return 'text-accent font-medium bg-accent/10 border-l-2 border-accent';
      default: return 'text-gray-300';
    }
  };

  return (
    <div className="flex flex-col h-full bg-black rounded-lg border border-surfaceHighlight overflow-hidden font-mono text-sm shadow-inner">
      <div className="flex items-center justify-between px-4 py-2 bg-surfaceHighlight border-b border-black">
        <div className="flex items-center gap-2 text-muted">
          <TerminalIcon className="w-4 h-4" />
          <span className="font-semibold text-xs tracking-wider">AGENT ORCHESTRATOR LOGS</span>
        </div>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {logs.length === 0 && (
          <div className="text-muted/50 italic text-center mt-10">
            Waiting for input...
          </div>
        )}
        {logs.map((log) => (
          <div key={log.id} className={`flex gap-3 group animate-fadeIn`}>
             <div className="mt-1 opacity-70 shrink-0 select-none" title={log.role}>
               {getIcon(log.role)}
             </div>
             <div className="flex-1 overflow-hidden">
               <div className="flex items-baseline gap-2 mb-0.5">
                 <span className={`text-xs font-bold uppercase tracking-wider opacity-60 ${
                   log.role === AgentRole.USER ? 'text-primary' : 'text-muted'
                 }`}>
                   {log.role}
                 </span>
                 <span className="text-[10px] text-muted/40">
                   {log.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}
                 </span>
               </div>
               <div className={`break-words whitespace-pre-wrap leading-relaxed ${getColor(log.type)} ${log.type === 'plan' || log.type === 'error' ? 'p-2 rounded-r-md' : ''}`}>
                 {log.content}
               </div>
             </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default Terminal;
