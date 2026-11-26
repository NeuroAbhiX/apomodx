/**
 * APOMODX - Left Navigation & Device Explorer Panel
 * Professional Polish Theme
 */

import React from 'react';
import {
  LayoutDashboard,
  Plug,
  Radio,
  Search,
  ListTree,
  Binary,
  Activity,
  Zap,
  TrendingUp,
  Network,
  GitCompare,
  History,
  Cpu,
  Layers,
  FolderOpen,
  Settings,
  Server,
} from 'lucide-react';
import { useModbus } from '../../context/ModbusContext';

interface LeftNavigationProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const LeftNavigation: React.FC<LeftNavigationProps> = ({
  currentTab,
  setCurrentTab,
}) => {
  const {
    connectionState,
    serialConfig,
    protocol,
    isAutoLearning,
    isScanning,
    isPolling,
    slaves,
    selectedSlaveId,
    setSelectedSlaveId,
    registers,
    pollGroups,
    healthMetrics,
    trafficFrames,
  } = useModbus();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: undefined,
    },
    {
      id: 'connect',
      label: 'Connect & COM',
      icon: Plug,
      badge: connectionState === 'connected' ? 'ON' : undefined,
      badgeColor: connectionState === 'connected' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : undefined,
    },
    {
      id: 'autolearn',
      label: 'Auto Learn',
      icon: Radio,
      badge: isAutoLearning ? 'ACTIVE' : undefined,
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 animate-pulse',
    },
    {
      id: 'scanner',
      label: 'Scanner',
      icon: Search,
      badge: isScanning ? 'SCAN' : undefined,
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    },
    {
      id: 'pollmonitor',
      label: 'Poll Monitor',
      icon: ListTree,
      badge: `${pollGroups.filter((g) => g.enabled).length}`,
      badgeColor: isPolling ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400',
    },
    {
      id: 'registers',
      label: 'Live Registers',
      icon: Binary,
      badge: `${registers.length}`,
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    },
    {
      id: 'diagnostics',
      label: 'Diagnostics',
      icon: Activity,
      badge: `${healthMetrics.healthScorePercent}%`,
      badgeColor: healthMetrics.healthScorePercent > 90 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-300',
    },
    {
      id: 'helper',
      label: 'Engineer Helper',
      icon: Zap,
      badge: 'PRO',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40 font-mono',
    },
    {
      id: 'logger',
      label: 'Data Logger',
      icon: TrendingUp,
      badge: undefined,
    },
    {
      id: 'network',
      label: 'Network View',
      icon: Network,
      badge: `${slaves.filter((s) => s.status === 'online').length} Nodes`,
      badgeColor: 'bg-slate-800 text-slate-300',
    },
    {
      id: 'compare',
      label: 'Compare / Diff',
      icon: GitCompare,
      badge: undefined,
    },
    {
      id: 'replay',
      label: 'Traffic Replay',
      icon: History,
      badge: `${trafficFrames.length}`,
      badgeColor: 'bg-slate-800 text-slate-400',
    },
    {
      id: 'requestbuilder',
      label: 'Request Builder',
      icon: Cpu,
      badge: undefined,
    },
    {
      id: 'profiles',
      label: 'Device Profiles',
      icon: Layers,
      badge: undefined,
    },
    {
      id: 'projects',
      label: 'Projects',
      icon: FolderOpen,
      badge: undefined,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      badge: undefined,
    },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-[#1e293b]/50 flex flex-col justify-between shrink-0 overflow-y-auto select-none">
      {/* 1. Device Explorer Header & Active Slaves */}
      <div className="p-4 border-b border-slate-800">
        <h2 className="text-[10px] text-slate-500 uppercase font-bold tracking-[0.2em] mb-3 flex items-center justify-between">
          <span>Device Explorer</span>
          <span className="text-[9px] text-blue-400 font-mono">
            {slaves.filter((s) => s.status === 'online').length} ONLINE
          </span>
        </h2>
        <div className="space-y-1">
          {slaves.slice(0, 4).map((slave) => {
            const isSelected = selectedSlaveId === slave.slaveId;
            const isOnline = slave.status === 'online';
            return (
              <div
                key={slave.slaveId}
                onClick={() => {
                  setSelectedSlaveId(slave.slaveId);
                  if (currentTab !== 'registers' && currentTab !== 'pollmonitor' && currentTab !== 'diagnostics') {
                    setCurrentTab('registers');
                  }
                }}
                className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-blue-600/10 border-l-2 border-blue-500 rounded-r'
                    : 'hover:bg-slate-800/50 text-slate-400'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    isOnline
                      ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                      : 'bg-slate-600'
                  }`}
                />
                <span
                  className={`text-xs font-medium truncate ${
                    isSelected ? 'text-blue-100' : 'text-slate-400'
                  }`}
                >
                  Node {slave.slaveId.toString().padStart(2, '0')}: {slave.name.split('(')[0].trim()}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Engineering Modules List */}
      <div className="p-3 space-y-0.5 flex-1 overflow-y-auto">
        <div className="px-2 py-1 text-[10px] uppercase font-bold tracking-[0.2em] text-slate-500">
          Navigation Modules
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-medium transition-all ${
                isActive
                  ? 'bg-blue-600/15 text-blue-100 border-l-2 border-blue-500 rounded-r font-semibold'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-blue-400' : 'text-slate-500'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    item.badgeColor || 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Docked Port & Protocol Metadata card */}
      <div className="mt-auto p-4 bg-slate-900/40 border-t border-slate-800">
        <div className="space-y-2.5">
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-slate-500 uppercase font-bold text-[10px] tracking-wider">COM Port</span>
            <span className="text-slate-300 font-mono text-xs">
              {protocol === 'RTU' ? `${serialConfig.port || 'COM4'} (RTU)` : 'TCP: 127.0.0.1'}
            </span>
          </div>
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-slate-500 uppercase font-bold text-[10px] tracking-wider">Baud Rate</span>
            <span className="text-slate-300 font-mono text-xs">
              {serialConfig.baudRate || 9600}, 8, {(serialConfig.parity?.[0] || 'N').toUpperCase()}, {serialConfig.stopBits || 1}
            </span>
          </div>
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-slate-500 uppercase font-bold text-[10px] tracking-wider">Protocol</span>
            <span className="text-slate-300 font-mono text-xs">
              {protocol === 'RTU' ? 'Modbus RTU' : 'Modbus TCP (MBAP)'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};

