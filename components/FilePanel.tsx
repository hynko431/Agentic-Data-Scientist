import React from 'react';
import { FileData } from '../types';
import { FileSpreadsheet, Upload, FolderOpen, Trash2 } from 'lucide-react';

interface FilePanelProps {
  files: FileData[];
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDelete: (fileName: string) => void;
}

const FilePanel: React.FC<FilePanelProps> = ({ files, onUpload, onDelete }) => {
  return (
    <div className="bg-surface rounded-lg border border-surfaceHighlight h-full flex flex-col">
      <div className="p-3 border-b border-surfaceHighlight flex items-center justify-between">
        <h2 className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-2">
          <FolderOpen className="w-4 h-4" />
          Workspace
        </h2>
        <span className="text-[10px] bg-surfaceHighlight px-2 py-0.5 rounded-full text-muted">
          {files.length} files
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {files.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted/40 p-4 text-center">
             <FileSpreadsheet className="w-8 h-8 mb-2 opacity-50" />
             <p className="text-xs">No files loaded.</p>
             <p className="text-[10px] mt-1">Upload CSV or Excel files to begin analysis.</p>
          </div>
        ) : (
          files.map((file) => (
            <div key={file.name} className="group flex items-center justify-between p-2 rounded hover:bg-surfaceHighlight/50 transition-colors cursor-pointer border border-transparent hover:border-surfaceHighlight">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="bg-green-900/30 p-1.5 rounded text-green-400">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm text-text truncate font-medium">{file.name}</span>
                  <span className="text-[10px] text-muted">{file.size} • {file.type}</span>
                </div>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(file.name); }}
                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 text-red-400 rounded transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="p-3 border-t border-surfaceHighlight">
        <label className="flex items-center justify-center gap-2 w-full py-2 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold rounded border border-primary/20 border-dashed hover:border-primary/50 cursor-pointer transition-all">
          <Upload className="w-4 h-4" />
          Upload Dataset
          <input type="file" className="hidden" onChange={onUpload} accept=".csv,.xlsx,.json,.txt" multiple />
        </label>
      </div>
    </div>
  );
};

export default FilePanel;
