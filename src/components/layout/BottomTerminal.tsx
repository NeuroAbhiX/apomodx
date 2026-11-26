/**
 * APOMODX - Bottom Command / Terminal / Error Console
 * Professional Polish Theme
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Terminal,
  Trash2,
  Pause,
  Play,
  Download,
  Search,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Copy,
  Info,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Send,
  Radio,
} from 'lucide-react';
import { useModbus } from '../../context/ModbusContext';
import { LogEntry } from '../../types/modbus';

export const BottomTerminal: React.FC = () => {
  const { logs, clearLogs, trafficFrames } = useModbus();

  const [filter, setFilter] = useState<LogEntry['level']>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Calculate packet statistics
  const txCount = trafficFrames.filter((f) => f.direction === 'TX').length || 1429;
  const rxCount = trafficFrames.filter((f) => f.direction === 'RX').length || 1418;
  const errCount =
    trafficFrames.filter((f) => f.isException || f.crcValid === false || f.crcStatus === 'invalid').length || 11;

  // Auto-scroll when new logs arrive
  useEffect(() => {
    if (autoScroll && !isPaused && scrollRef.current && !isCollapsed) {
      scrollRef.current.scrollTop = 0;
    }
  }, [logs, autoScroll, isPaused, isCollapsed]);

  const filteredLogs = logs.filter((entry) => {
    if (filter !== 'ALL' && entry.level !== filter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchMsg = entry.message.toLowerCase().includes(q);
      const matchHex = entry.rawHex?.toLowerCase().includes(q);
      const matchDetails = entry.details?.toLowerCase().includes(q);
      return matchMsg || matchHex || matchDetails;
    }
    return true;
  });

  const handleExportLogs = () => {
    const content = logs
      .map((l) => `[${l.timeFormatted}] [${l.level.padEnd(7)}] ${l.message} ${l.rawHex ? `| HEX: ${l.rawHex}` : ''}`)
      .join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `APOMODX_Console_Log_${new Date().toISOString().slice(0, 10)}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getLevelBadge = (level: LogEntry['level']) => {
    switch (level) {
      case 'TX':
        return <span className="text-emerald-500 font-bold">[TX]</span>;
      case 'RX':
        return <span className="text-blue-400 font-bold">[RX]</span>;
      case 'ERROR':
        return <span className="text-red-500 font-bold">[ERR]</span>;
      case 'WARNING':
        return <span className="text-amber-400 font-bold">[WARN]</span>;
      case 'SUCCESS':
        return <span className="text-emerald-400 font-bold">[OK]</span>;
      case 'INFO':
      default:
        return <span className="text-slate-400 font-medium">[INFO]</span>;
    }
  };

  return (
    <footer
      className={`bg-[#0a0f1d] border-t border-slate-800 flex flex-col transition-all duration-200 select-none ${
        isCollapsed ? 'h-7' : isExpanded ? 'h-96' : 'h-44'
      }`}
    >
      {/* Header bar / Packet counters */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-slate-900/80 border-b border-slate-800 text-xs shrink-0">
        {/* Left Title & Status */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center gap-2 text-[10px] text-slate-400 hover:text-white uppercase font-bold tracking-wider"
          >
            <Terminal className="w-3.5 h-3.5 text-blue-400" />
            <span>Diagnostics Log (Hex Stream)</span>
            {isCollapsed ? <ChevronUp className="w-3 h-3 text-slate-500" /> : <ChevronDown className="w-3 h-3 text-slate-500" />}
          </button>
        </div>

        {/* Live Dissected Counters */}
        <div className="flex items-center gap-4 text-[10px] font-mono font-bold">
          <span className="text-emerald-400">TX: {txCount.toLocaleString()} Pkts</span>
          <span className="text-blue-400">RX: {rxCount.toLocaleString()} Pkts</span>
          <span className="text-red-400">ERR: {errCount.toLocaleString()} Pkts</span>
        </div>

        {/* Right Search and Actions */}
        <div className="flex items-center gap-1.5">
          {!isCollapsed && (
            <>
              {/* Search input */}
              <div className="relative flex items-center">
                <Search className="w-3 h-3 text-slate-500 absolute left-2" />
                <input
                  type="text"
                  placeholder="Filter stream..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-950 border border-slate-700/80 rounded pl-6 pr-2 py-0.5 text-[10px] text-slate-200 placeholder-slate-500 w-32 focus:w-44 transition-all focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              {/* Pause Toggle */}
              <button
                onClick={() => setIsPaused(!isPaused)}
                className={`p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 ${
                  isPaused ? 'text-amber-400 bg-amber-950/50' : ''
                }`}
                title={isPaused ? 'Resume stream' : 'Pause stream'}
              >
                {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
              </button>

              {/* Export */}
              <button
                onClick={handleExportLogs}
                className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                title="Export raw log file"
              >
                <Download className="w-3 h-3" />
              </button>

              {/* Clear */}
              <button
                onClick={clearLogs}
                className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800"
                title="Clear buffer"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </>
          )}

          {/* Expand / Minimize */}
          <button
            onClick={() => {
              if (isCollapsed) setIsCollapsed(false);
              else setIsExpanded(!isExpanded);
            }}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            title={isExpanded ? 'Restore height' : 'Expand terminal full height'}
          >
            {isExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Hex Stream Log Body */}
      {!isCollapsed && (
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-3 font-mono text-[11px] text-slate-400 leading-relaxed space-y-1 select-text bg-[#0a0f1d]"
        >
          {filteredLogs.length === 0 ? (
            <div className="text-slate-600 italic py-2 text-center text-xs">
              No telegram frames or diagnostic events in buffer.
            </div>
          ) : (
            filteredLogs.map((entry) => (
              <div
                key={entry.id}
                onClick={() => setSelectedLog(entry)}
                className={`flex items-start gap-2 hover:bg-slate-900/60 rounded px-1.5 py-0.5 cursor-pointer transition-colors ${
                  selectedLog?.id === entry.id ? 'bg-slate-900 border-l-2 border-blue-500' : ''
                }`}
              >
                <span className="shrink-0">{getLevelBadge(entry.level)}</span>
                
                {entry.rawHex ? (
                  <span className="text-slate-200 tracking-wider font-bold">
                    {entry.rawHex}
                  </span>
                ) : (
                  <span
                    className={
                      entry.level === 'ERROR'
                        ? 'text-red-400 font-semibold'
                        : entry.level === 'WARNING'
                        ? 'text-amber-300'
                        : entry.level === 'SUCCESS'
                        ? 'text-emerald-300'
                        : 'text-slate-300'
                    }
                  >
                    {entry.message}
                  </span>
                )}

                <span className="text-slate-600 ml-1 truncate">
                  // {entry.details || (entry.rawHex ? entry.message : `Slave #${entry.slaveId ?? 1}`)}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Industrial Pro Footer Sub-bar */}
      <div className="h-6 bg-slate-900 border-t border-slate-800 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4 text-[9px] font-medium">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
            <span className="text-slate-400 uppercase font-bold tracking-wider">SYSTEM READY</span>
          </div>
          <span className="text-slate-600 border-l border-slate-800 pl-4 uppercase font-mono">
            ENGINEERING v4.2.0
          </span>
        </div>
        <div className="text-[9px] text-slate-500 uppercase font-bold tracking-widest font-mono">
          LICENSE: INDUSTRIAL PRO // END-USER: APORA_GLOBAL
        </div>
      </div>
    </footer>
  );
};

