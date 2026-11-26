/**
 * APOMODX - Classical Desktop Top Menu Bar
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  FolderOpen,
  Save,
  FilePlus,
  Download,
  Upload,
  FileText,
  Copy,
  Scissors,
  CheckSquare,
  Search,
  Activity,
  Play,
  Square,
  RefreshCw,
  Cpu,
  HelpCircle,
  Info,
  Layers,
  BookOpen,
  Keyboard,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useModbus } from '../../context/ModbusContext';

interface TopMenuBarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  openModal: (name: 'about' | 'welcome' | 'report' | 'reference' | 'safewrite' | 'addpoll') => void;
}

export const TopMenuBar: React.FC<TopMenuBarProps> = ({
  currentTab,
  setCurrentTab,
  openModal,
}) => {
  const {
    connectionState,
    connect,
    disconnect,
    isPolling,
    startPolling,
    stopPolling,
    startAutoLearn,
    stopAutoLearn,
    isAutoLearning,
    isReadOnly,
    setIsReadOnly,
    expertMode,
    setExpertMode,
    saveProjectFile,
    loadProjectFile,
    saveCurrentAsCache,
    loadAutoCache,
    addLog,
  } = useModbus();

  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuClick = (menu: string) => {
    setActiveMenu(activeMenu === menu ? null : menu);
  };

  const handleExportProject = () => {
    const json = saveProjectFile();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `APOMODX_Project_${new Date().toISOString().slice(0, 10)}.apx`;
    a.click();
    URL.revokeObjectURL(url);
    setActiveMenu(null);
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
    setActiveMenu(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        loadProjectFile(text);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div
      ref={menuRef}
      className="bg-slate-900 border-b border-slate-800 text-xs text-slate-300 flex items-center justify-between px-2 h-7 select-none z-40"
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".apx,.json"
        className="hidden"
      />

      {/* Menu items */}
      <div className="flex items-center space-x-0.5">
        {/* FILE */}
        <div className="relative">
          <button
            onClick={() => handleMenuClick('file')}
            className={`px-2.5 py-1 rounded hover:bg-slate-800 hover:text-white transition-colors ${
              activeMenu === 'file' ? 'bg-slate-800 text-white' : ''
            }`}
          >
            File
          </button>
          {activeMenu === 'file' && (
            <div className="absolute left-0 top-full mt-0.5 w-56 bg-slate-900/95 backdrop-blur border border-slate-700 shadow-2xl rounded py-1 z-50">
              <button
                onClick={() => {
                  setCurrentTab('projects');
                  setActiveMenu(null);
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-blue-600/20 hover:text-blue-300 flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <FilePlus className="w-3.5 h-3.5 text-slate-400" /> New Project
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Ctrl+N</span>
              </button>
              <button
                onClick={handleImportClick}
                className="w-full px-3 py-1.5 text-left hover:bg-blue-600/20 hover:text-blue-300 flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <FolderOpen className="w-3.5 h-3.5 text-slate-400" /> Open Project (.apx)...
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Ctrl+O</span>
              </button>
              <button
                onClick={handleExportProject}
                className="w-full px-3 py-1.5 text-left hover:bg-blue-600/20 hover:text-blue-300 flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <Save className="w-3.5 h-3.5 text-slate-400" /> Save Project
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Ctrl+S</span>
              </button>
              <div className="my-1 border-t border-slate-800" />
              <button
                onClick={() => {
                  saveCurrentAsCache();
                  setActiveMenu(null);
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-blue-600/20 hover:text-blue-300 flex items-center gap-2"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" /> Cache Current Configuration
              </button>
              <button
                onClick={() => {
                  loadAutoCache();
                  setActiveMenu(null);
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-blue-600/20 hover:text-blue-300 flex items-center gap-2"
              >
                <Upload className="w-3.5 h-3.5 text-slate-400" /> Restore Cached Configuration
              </button>
              <div className="my-1 border-t border-slate-800" />
              <button
                onClick={() => {
                  openModal('report');
                  setActiveMenu(null);
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-blue-600/20 hover:text-blue-300 flex items-center gap-2 text-blue-300 font-medium"
              >
                <FileText className="w-3.5 h-3.5 text-blue-400" /> Export Diagnostic Report...
              </button>
            </div>
          )}
        </div>

        {/* EDIT */}
        <div className="relative">
          <button
            onClick={() => handleMenuClick('edit')}
            className={`px-2.5 py-1 rounded hover:bg-slate-800 hover:text-white transition-colors ${
              activeMenu === 'edit' ? 'bg-slate-800 text-white' : ''
            }`}
          >
            Edit
          </button>
          {activeMenu === 'edit' && (
            <div className="absolute left-0 top-full mt-0.5 w-48 bg-slate-900 border border-slate-700 shadow-2xl rounded py-1 z-50">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(saveProjectFile()));
                  addLog('INFO', 'Workspace copied to clipboard');
                  setActiveMenu(null);
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-amber-500/20 hover:text-amber-300 flex items-center gap-2"
              >
                <Copy className="w-3.5 h-3.5 text-slate-400" /> Copy Configuration
              </button>
              <button
                onClick={() => {
                  setCurrentTab('registers');
                  setActiveMenu(null);
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-amber-500/20 hover:text-amber-300 flex items-center gap-2"
              >
                <Search className="w-3.5 h-3.5 text-slate-400" /> Find Register...
              </button>
            </div>
          )}
        </div>

        {/* VIEW */}
        <div className="relative">
          <button
            onClick={() => handleMenuClick('view')}
            className={`px-2.5 py-1 rounded hover:bg-slate-800 hover:text-white transition-colors ${
              activeMenu === 'view' ? 'bg-slate-800 text-white' : ''
            }`}
          >
            View
          </button>
          {activeMenu === 'view' && (
            <div className="absolute left-0 top-full mt-0.5 w-52 bg-slate-900 border border-slate-700 shadow-2xl rounded py-1 z-50">
              {[
                { id: 'dashboard', label: 'Dashboard' },
                { id: 'connect', label: 'Connection & COM Setup' },
                { id: 'autolearn', label: 'Auto Learn (Passive Traffic)' },
                { id: 'scanner', label: 'Modbus Scanner (Slaves & Addrs)' },
                { id: 'pollmonitor', label: 'Poll Monitor Groups' },
                { id: 'registers', label: 'Live Register Monitor & Decoder' },
                { id: 'diagnostics', label: 'Communication Health & CRC' },
                { id: 'helper', label: 'Smart Troubleshooting Helper' },
                { id: 'logger', label: 'Data Logger & Trends' },
                { id: 'network', label: 'Network Topology View' },
                { id: 'compare', label: 'Compare & What Changed?' },
                { id: 'replay', label: 'Traffic Capture & Offline Replay' },
                { id: 'requestbuilder', label: 'Request Builder & Frame Gen' },
                { id: 'profiles', label: 'Device Profiles & Mapping' },
                { id: 'projects', label: 'Project Workspaces' },
                { id: 'settings', label: 'Preferences & Settings' },
              ].map((v) => (
                <button
                  key={v.id}
                  onClick={() => {
                    setCurrentTab(v.id);
                    setActiveMenu(null);
                  }}
                  className={`w-full px-3 py-1.5 text-left flex items-center justify-between text-xs transition-colors hover:bg-amber-500/20 hover:text-amber-300 ${
                    currentTab === v.id ? 'text-amber-400 font-semibold bg-slate-800' : 'text-slate-300'
                  }`}
                >
                  <span className="truncate">{v.label}</span>
                  {currentTab === v.id ? (
                    <span className="text-amber-400 font-bold ml-2">✓</span>
                  ) : (
                    <span className="text-slate-600 text-[10px] ml-2">Open</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* TOOLS */}
        <div className="relative">
          <button
            onClick={() => handleMenuClick('tools')}
            className={`px-2.5 py-1 rounded hover:bg-slate-800 hover:text-white transition-colors ${
              activeMenu === 'tools' ? 'bg-slate-800 text-white' : ''
            }`}
          >
            Tools
          </button>
          {activeMenu === 'tools' && (
            <div className="absolute left-0 top-full mt-0.5 w-60 bg-slate-900 border border-slate-700 shadow-2xl rounded py-1 z-50">
              <button
                onClick={() => {
                  setCurrentTab('connect');
                  setActiveMenu(null);
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-amber-500/20 hover:text-amber-300 flex items-center gap-2"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" /> Auto-Detect Parameters (Baud/Parity)
              </button>
              <button
                onClick={() => {
                  setCurrentTab('autolearn');
                  setActiveMenu(null);
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-amber-500/20 hover:text-amber-300 flex items-center gap-2"
              >
                <Activity className="w-3.5 h-3.5 text-cyan-400" /> Auto Traffic Learn (Passive)
              </button>
              <button
                onClick={() => {
                  setCurrentTab('scanner');
                  setActiveMenu(null);
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-amber-500/20 hover:text-amber-300 flex items-center gap-2"
              >
                <Search className="w-3.5 h-3.5 text-indigo-400" /> Slave & Register Scanner
              </button>
              <button
                onClick={() => {
                  setCurrentTab('requestbuilder');
                  setActiveMenu(null);
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-amber-500/20 hover:text-amber-300 flex items-center gap-2"
              >
                <Cpu className="w-3.5 h-3.5 text-emerald-400" /> Manual Request Builder & CRC Calc
              </button>
              <button
                onClick={() => {
                  setCurrentTab('profiles');
                  setActiveMenu(null);
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-amber-500/20 hover:text-amber-300 flex items-center gap-2"
              >
                <Layers className="w-3.5 h-3.5 text-amber-400" /> Device Profiles & Register Maps
              </button>
            </div>
          )}
        </div>

        {/* CONNECTION */}
        <div className="relative">
          <button
            onClick={() => handleMenuClick('connection')}
            className={`px-2.5 py-1 rounded hover:bg-slate-800 hover:text-white transition-colors ${
              activeMenu === 'connection' ? 'bg-slate-800 text-white' : ''
            }`}
          >
            Connection
          </button>
          {activeMenu === 'connection' && (
            <div className="absolute left-0 top-full mt-0.5 w-52 bg-slate-900 border border-slate-700 shadow-2xl rounded py-1 z-50">
              {connectionState === 'connected' ? (
                <button
                  onClick={() => {
                    disconnect();
                    setActiveMenu(null);
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-red-500/20 text-red-400 flex items-center gap-2"
                >
                  <Square className="w-3.5 h-3.5" /> Disconnect Port
                </button>
              ) : (
                <button
                  onClick={() => {
                    connect();
                    setActiveMenu(null);
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-emerald-500/20 text-emerald-400 flex items-center gap-2"
                >
                  <Play className="w-3.5 h-3.5" /> Connect Hardware / Simulator
                </button>
              )}
              <button
                onClick={() => {
                  disconnect();
                  setTimeout(() => connect(), 300);
                  setActiveMenu(null);
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-amber-500/20 hover:text-amber-300 flex items-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-400" /> Reconnect Port
              </button>
              <div className="my-1 border-t border-slate-800" />
              <button
                onClick={() => {
                  setCurrentTab('connect');
                  setActiveMenu(null);
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-amber-500/20 hover:text-amber-300 flex items-center gap-2"
              >
                Serial / RS485 Settings...
              </button>
            </div>
          )}
        </div>

        {/* DIAGNOSTICS */}
        <div className="relative">
          <button
            onClick={() => handleMenuClick('diagnostics')}
            className={`px-2.5 py-1 rounded hover:bg-slate-800 hover:text-white transition-colors ${
              activeMenu === 'diagnostics' ? 'bg-slate-800 text-white' : ''
            }`}
          >
            Diagnostics
          </button>
          {activeMenu === 'diagnostics' && (
            <div className="absolute left-0 top-full mt-0.5 w-56 bg-slate-900 border border-slate-700 shadow-2xl rounded py-1 z-50">
              <button
                onClick={() => {
                  setCurrentTab('diagnostics');
                  setActiveMenu(null);
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-amber-500/20 hover:text-amber-300 flex items-center gap-2"
              >
                <Activity className="w-3.5 h-3.5 text-cyan-400" /> Communication Health & Metrics
              </button>
              <button
                onClick={() => {
                  setCurrentTab('helper');
                  setActiveMenu(null);
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-amber-500/20 hover:text-amber-300 flex items-center gap-2"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" /> Smart Troubleshooting Assistant
              </button>
              <button
                onClick={() => {
                  openModal('report');
                  setActiveMenu(null);
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-amber-500/20 hover:text-amber-300 flex items-center gap-2 text-amber-300 font-medium"
              >
                <FileText className="w-3.5 h-3.5 text-amber-400" /> Generate Diagnostic Report...
              </button>
            </div>
          )}
        </div>

        {/* HELP */}
        <div className="relative">
          <button
            onClick={() => handleMenuClick('help')}
            className={`px-2.5 py-1 rounded hover:bg-slate-800 hover:text-white transition-colors ${
              activeMenu === 'help' ? 'bg-slate-800 text-white' : ''
            }`}
          >
            Help
          </button>
          {activeMenu === 'help' && (
            <div className="absolute left-0 top-full mt-0.5 w-60 bg-slate-900 border border-slate-700 shadow-2xl rounded py-1 z-50">
              <button
                onClick={() => {
                  openModal('reference');
                  setActiveMenu(null);
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-amber-500/20 hover:text-amber-300 flex items-center gap-2"
              >
                <BookOpen className="w-3.5 h-3.5 text-slate-400" /> Modbus Function & Exception Reference
              </button>
              <button
                onClick={() => {
                  openModal('welcome');
                  setActiveMenu(null);
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-amber-500/20 hover:text-amber-300 flex items-center gap-2"
              >
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" /> Commissioning Quick Start Wizard
              </button>
              <div className="my-1 border-t border-slate-800" />
              <button
                onClick={() => {
                  openModal('about');
                  setActiveMenu(null);
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-amber-500/20 hover:text-amber-300 flex items-center gap-2 text-amber-400 font-medium"
              >
                <Info className="w-3.5 h-3.5 text-amber-400" /> About APOMODX...
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right controls: Safe-Write status & Expert Mode Toggle */}
      <div className="flex items-center gap-3">
        {/* Safe Write Protection Indicator */}
        <div
          onClick={() => setIsReadOnly(!isReadOnly)}
          className={`flex items-center gap-1 px-2 py-0.5 rounded cursor-pointer border text-[11px] font-mono transition-colors ${
            isReadOnly
              ? 'bg-emerald-950/60 border-emerald-700/50 text-emerald-400'
              : 'bg-amber-950/70 border-amber-600/70 text-amber-300 font-bold animate-pulse'
          }`}
          title="Click to toggle Read-Only / Safe Write mode"
        >
          <ShieldCheck className="w-3 h-3" />
          <span>{isReadOnly ? 'READ-ONLY (SAFE)' : 'WRITE ENABLED'}</span>
        </div>

        {/* Expert Mode */}
        <button
          onClick={() => setExpertMode(!expertMode)}
          className={`px-2 py-0.5 rounded border text-[11px] font-mono transition-colors ${
            expertMode
              ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
              : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
          }`}
          title="Toggle Expert / Advanced Engineering fields"
        >
          {expertMode ? '★ EXPERT MODE' : 'STANDARD MODE'}
        </button>
      </div>
    </div>
  );
};
