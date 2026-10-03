import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ExternalLink, FileText, Table, Maximize2, Minimize2 } from 'lucide-react';

interface FilePreviewProps {
  fileId: string;
  fileName: string;
  mimeType: string;
  isOpen: boolean;
  onClose: () => void;
}

export function FilePreview({ fileId, fileName, mimeType, isOpen, onClose }: FilePreviewProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  if (!isOpen) return null;

  const isDoc = mimeType.includes('document');
  const isSheet = mimeType.includes('spreadsheet');
  
  const embedUrl = isDoc 
    ? `https://docs.google.com/document/d/${fileId}/edit?usp=sharing`
    : isSheet 
      ? `https://docs.google.com/spreadsheets/d/${fileId}/edit?usp=sharing`
      : null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`fixed z-[100] bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${
          isExpanded 
            ? 'top-4 left-4 right-4 bottom-4' 
            : 'bottom-4 right-4 w-[400px] h-[500px]'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
          <div className="flex items-center gap-2 overflow-hidden">
            {isDoc ? <FileText className="w-4 h-4 text-blue-400" /> : <Table className="w-4 h-4 text-emerald-400" />}
            <span className="text-[11px] font-bold text-white truncate max-w-[200px]">{fileName}</span>
          </div>
          <div className="flex items-center gap-1">
            <a 
              href={embedUrl || '#'} 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition"
              title="Open in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition"
              title={isExpanded ? "Minimize" : "Maximize"}
            >
              {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white relative">
          {embedUrl ? (
            <iframe 
              src={embedUrl}
              className="w-full h-full border-none"
              title={fileName}
              allow="autoplay"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-black/40 text-xs font-mono">
              Preview not available for this file type.
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
