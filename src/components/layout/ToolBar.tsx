/**
 * APOMODX - Industrial Engineering Toolbar
 * Professional Polish Design Aesthetic
 */

import React from 'react';
import {
  Play,
  Square,
  Zap,
  Activity,
  Search,
  RefreshCw,
  FilePlus,
  FolderOpen,
  Save,
  Download,
  FileText,
  Radio,
  Sliders,
  Shield,
  Layers,
} from 'lucide-react';
import { useModbus } from '../../context/ModbusContext';
import { ApomodxLogo } from '../brand/ApomodxLogo';
import { AddressNotation } from '../../types/modbus';

interface ToolBarProps {
  currentTab?: string;
  setCurrentTab: (tab: string) => void;
  openModal: (name: 'about' | 'welcome' | 'report' | 'reference' | 'safewrite' | 'addpoll') => void;
}

export const ToolBar: React.FC<ToolBarProps> = ({ currentTab = 'dashboard', setCurrentTab, openModal }) => {
  const {
    connectionState,
    connect,
    disconnect,
    isPolling,
    startPolling,
    stopPolling,
    isAutoLearning,
    startAutoLearn,
    stopAutoLearn,
    runSlaveScan,
    isScanning,
    addressNotation,
    setAddressNotation,
    saveCurrentAsCache,
    saveProjectFile,
    expertMode,
    setExpertMode,
  } = useModbus();

  const handleSave = () => {
    const json = saveProjectFile();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `APOMODX_Project_${new Date().toISOString().slice(0, 10)}.apx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const quickNavs = [
    { id: 'dashboard', label: 'DASHBOARD' },
    { id: 'registers', label: 'REGISTERS' },
    { id: 'diagnostics', label: 'DIAGNOSTICS' },
    { id: 'helper', label: 'ASSISTANT' },
  ];

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-slate-700 bg-slate-900/50 select-none shrink-0 z-30">
      {/* Left: Brand Logo & Title */}
      <div
        className="cursor-pointer hover:opacity-95 transition-opacity"
        onClick={() => openModal('about')}
        title="APOMODX Modbus Engineering & Diagnostic Tool"
      >
        <ApomodxLogo size="md" showSubtitle={true} />
      </div>

      {/* Center: Primary Quick Navigation Segmented Controls */}
      <div className="flex items-center gap-4">
        <nav className="hidden md:flex border border-slate-700 rounded overflow-hidden shadow-inner">
          {quickNavs.map((tab, idx) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                } ${idx < quickNavs.length - 1 ? 'border-r border-slate-700' : ''}`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Secondary Action Toolset */}
        <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700 rounded p-0.5">
          {/* Auto Learn Toggle */}
          <button
            onClick={() => {
              if (isAutoLearning) {
                stopAutoLearn();
              } else {
                startAutoLearn();
                setCurrentTab('autolearn');
              }
            }}
            className={`px-2.5 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              isAutoLearning
                ? 'bg-cyan-600 text-white shadow-[0_0_8px_rgba(6,182,212,0.5)] animate-pulse'
                : 'text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
            title="Sniff active traffic & extract register definitions"
          >
            <Radio className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">{isAutoLearning ? 'Learning...' : 'Auto Learn'}</span>
          </button>

          {/* Scanner */}
          <button
            onClick={() => {
              setCurrentTab('scanner');
              if (!isScanning) runSlaveScan(1, 32);
            }}
            className={`px-2.5 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              isScanning
                ? 'bg-indigo-600 text-white animate-pulse'
                : 'text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
            title="Scan RS-485 Slave Bus"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">{isScanning ? 'Scanning...' : 'Scan'}</span>
          </button>

          {/* Polling */}
          <button
            onClick={() => {
              if (isPolling) stopPolling();
              else startPolling();
            }}
            className={`px-2.5 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              isPolling
                ? 'bg-emerald-600/90 text-white'
                : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'
            }`}
            title={isPolling ? 'Pause background cyclic polling' : 'Start polling active groups'}
          >
            <Activity className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">{isPolling ? 'Polling' : 'Paused'}</span>
          </button>
        </div>

        {/* Address Notation Selector */}
        <div className="hidden lg:flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Addr:</span>
          <select
            value={addressNotation}
            onChange={(e) => setAddressNotation(e.target.value as AddressNotation)}
            className="bg-transparent text-blue-300 font-mono text-xs focus:outline-none cursor-pointer"
            title="Address Representation Notation"
          >
            <option value="0-based" className="bg-slate-900 text-slate-200">0-based (0..65535)</option>
            <option value="1-based" className="bg-slate-900 text-slate-200">1-based (1..65536)</option>
            <option value="modicon-40001" className="bg-slate-900 text-slate-200">Modicon (40001/30001)</option>
            <option value="protocol" className="bg-slate-900 text-slate-200">Hex Protocol (0x0000)</option>
          </select>
        </div>
      </div>

      {/* Right Controls: Advanced Mode switch & Big Connect Button */}
      <div className="flex items-center gap-4">
        {/* Advanced / Expert Mode Switch */}
        <label
          onClick={() => setExpertMode(!expertMode)}
          className="flex items-center gap-2.5 cursor-pointer group select-none"
          title="Toggle Expert industrial fields & low-level timing registers"
        >
          <span className="text-[10px] text-slate-400 group-hover:text-slate-200 uppercase font-bold tracking-wider">
            Advanced Mode
          </span>
          <div
            className={`relative inline-flex items-center h-5 w-10 rounded-full transition-colors ${
              expertMode ? 'bg-blue-600' : 'bg-slate-700'
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                expertMode ? 'translate-x-5' : 'translate-x-1'
              }`}
            />
          </div>
        </label>

        {/* Primary Connect / Disconnect Action Button */}
        {connectionState === 'connected' ? (
          <button
            onClick={() => disconnect()}
            className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded text-xs font-bold transition-all shadow-lg shadow-red-900/30 flex items-center gap-1.5"
            title="Disconnect active COM / TCP interface"
          >
            <Square className="w-3.5 h-3.5 fill-white" />
            <span>DISCONNECT</span>
          </button>
        ) : (
          <button
            onClick={() => connect()}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded text-xs font-bold transition-all shadow-lg shadow-emerald-900/30 flex items-center gap-1.5"
            title="Open Hardware Port / Simulator"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>CONNECT</span>
          </button>
        )}
      </div>
    </header>
  );
};

