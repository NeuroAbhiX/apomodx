/**
 * APOMODX - Dashboard View
 * Immediate answers to: Connection State, Slaves Detected, Health Score, Current Polling, Recent Errors & Quick Actions
 */

import React from 'react';
import {
  Activity,
  Server,
  Zap,
  Radio,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Cpu,
  Layers,
  ShieldCheck,
  Play,
  RotateCcw,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import { useModbus } from '../../context/ModbusContext';
import { ApomodxLogo } from '../brand/ApomodxLogo';

interface DashboardViewProps {
  setCurrentTab: (tab: string) => void;
  openModal: (name: 'about' | 'welcome' | 'report' | 'reference' | 'safewrite' | 'addpoll') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  setCurrentTab,
  openModal,
}) => {
  const {
    protocol,
    connectionState,
    serialConfig,
    tcpConfig,
    slaves,
    registers,
    pollGroups,
    healthMetrics,
    trafficFrames,
    isPolling,
    startPolling,
    stopPolling,
    isAutoLearning,
    startAutoLearn,
    stopAutoLearn,
    runSlaveScan,
    isScanning,
    selectedSlaveId,
    setSelectedSlaveId,
    cachedConfig,
    saveCurrentAsCache,
  } = useModbus();

  const onlineSlaves = slaves.filter((s) => s.status === 'online');
  const offlineSlaves = slaves.filter((s) => s.status === 'offline');
  const activePollGroups = pollGroups.filter((g) => g.enabled);

  return (
    <div className="p-4 space-y-4 overflow-y-auto max-w-7xl mx-auto select-none">
      {/* Top Banner / System Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* 1. Connection Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Connection Interface
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase ${
                connectionState === 'connected'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}
            >
              {connectionState}
            </span>
          </div>

          <div className="my-2">
            <div className="text-base font-bold text-slate-100 font-mono truncate">
              {protocol === 'RTU' ? serialConfig.port : `${tcpConfig.host}:${tcpConfig.port}`}
            </div>
            <div className="text-xs text-slate-400 font-mono mt-0.5">
              {protocol === 'RTU'
                ? `${serialConfig.baudRate || 9600} bps • 8-${(serialConfig.parity?.[0] || 'N').toUpperCase()}-${serialConfig.stopBits || 1} • RS485`
                : `Modbus TCP • Port ${tcpConfig.port}`}
            </div>
          </div>

          <button
            onClick={() => setCurrentTab('connect')}
            className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium mt-1"
          >
            <span>Configure Interface</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 2. Devices / Slaves Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Bus Topology
            </span>
            <span className="text-xs text-emerald-400 font-mono font-bold">
              {onlineSlaves.length} Online / {slaves.length} Total
            </span>
          </div>

          <div className="my-2">
            <div className="text-2xl font-bold text-slate-100 font-mono flex items-center gap-2">
              <span>{onlineSlaves.length}</span>
              <span className="text-xs font-normal text-slate-400">Slaves Active</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              {slaves.slice(0, 6).map((slave) => (
                <span
                  key={slave.slaveId}
                  onClick={() => {
                    setSelectedSlaveId(slave.slaveId);
                    setCurrentTab('registers');
                  }}
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold cursor-pointer transition-colors ${
                    slave.status === 'online'
                      ? 'bg-emerald-950/70 border border-emerald-700/60 text-emerald-300 hover:bg-emerald-900'
                      : 'bg-slate-800 text-slate-500 border border-slate-700'
                  }`}
                  title={`Slave #${slave.slaveId}: ${slave.name}`}
                >
                  #{slave.slaveId}
                </span>
              ))}
              {slaves.length > 6 && (
                <span className="text-[10px] text-slate-500 font-mono">+{slaves.length - 6} more</span>
              )}
            </div>
          </div>

          <button
            onClick={() => setCurrentTab('network')}
            className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium mt-1"
          >
            <span>Network Tree View</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 3. Communication Health Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Diagnostic Health
            </span>
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
          </div>

          <div className="my-2">
            <div className="flex items-baseline gap-2">
              <span
                className={`text-2xl font-extrabold font-mono ${
                  healthMetrics.healthScorePercent > 90
                    ? 'text-emerald-400'
                    : healthMetrics.healthScorePercent > 75
                    ? 'text-amber-400'
                    : 'text-red-400'
                }`}
              >
                {healthMetrics.healthScorePercent}%
              </span>
              <span className="text-xs text-slate-400 font-mono">
                ({healthMetrics.avgResponseTimeMs} ms avg)
              </span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${healthMetrics.healthScorePercent}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>Req: {healthMetrics.totalRequests}</span>
            <span className="text-red-400">CRC Err: {healthMetrics.crcErrorCount}</span>
            <span className="text-amber-400">Timeouts: {healthMetrics.timeoutCount}</span>
          </div>
        </div>

        {/* 4. Active Registers Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Mapped Registers
            </span>
            <Cpu className="w-3.5 h-3.5 text-amber-400" />
          </div>

          <div className="my-2">
            <div className="text-2xl font-bold text-slate-100 font-mono flex items-center gap-2">
              <span>{registers.length}</span>
              <span className="text-xs font-normal text-slate-400">Registers Polled</span>
            </div>
            <div className="text-xs text-slate-400 font-mono mt-0.5">
              {registers.filter((r) => r.isObserved).length} Learned • {registers.filter((r) => r.isConfigured).length} Configured
            </div>
          </div>

          <button
            onClick={() => setCurrentTab('registers')}
            className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium mt-1"
          >
            <span>Open Register Monitor</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Quick Action Bar for Automation Engineers */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide font-mono">
            Fast Commissioning Actions:
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Auto Detect */}
          <button
            onClick={() => setCurrentTab('connect')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-semibold shadow-sm transition-colors"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Auto Detect Interface</span>
          </button>

          {/* Auto Learn */}
          <button
            onClick={() => {
              if (isAutoLearning) stopAutoLearn();
              else {
                startAutoLearn();
                setCurrentTab('autolearn');
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-semibold transition-all ${
              isAutoLearning
                ? 'bg-cyan-950 border-cyan-500 text-cyan-300 animate-pulse'
                : 'bg-cyan-500/15 hover:bg-cyan-500/25 border-cyan-500/40 text-cyan-300'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isAutoLearning ? 'Stop Traffic Learn' : 'Start Auto Traffic Learn'}</span>
          </button>

          {/* Scan */}
          <button
            onClick={() => {
              setCurrentTab('scanner');
              if (!isScanning) runSlaveScan(1, 32);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/40 text-indigo-300 text-xs font-semibold transition-colors"
          >
            <Search className="w-3.5 h-3.5 text-indigo-400" />
            <span>Scan Bus (1-247)</span>
          </button>

          {/* Diagnostics Helper */}
          <button
            onClick={() => setCurrentTab('helper')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Troubleshoot Bus</span>
          </button>

          {/* Generate Report */}
          <button
            onClick={() => openModal('report')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            <span>Commissioning Report</span>
          </button>
        </div>
      </div>

      {/* Main Split: Live Slave Overview & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Online Slave Device Cards */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wide font-mono flex items-center gap-2">
              <Server className="w-4 h-4 text-amber-400" />
              <span>Active Field Devices ({onlineSlaves.length})</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Click device to inspect registers
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {slaves.map((slave) => {
              const slaveRegs = registers.filter((r) => r.slaveId === slave.slaveId);

              return (
                <div
                  key={slave.slaveId}
                  onClick={() => {
                    setSelectedSlaveId(slave.slaveId);
                    setCurrentTab('registers');
                  }}
                  className={`bg-slate-900 border rounded-lg p-3.5 cursor-pointer transition-all hover:border-amber-500/50 hover:shadow-md ${
                    selectedSlaveId === slave.slaveId
                      ? 'border-amber-500/60 bg-slate-900/95 ring-1 ring-amber-500/30'
                      : 'border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-amber-400 font-mono bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                          Slave #{slave.slaveId}
                        </span>
                        <h4 className="text-xs font-semibold text-slate-200 truncate max-w-[160px]">
                          {slave.name}
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 font-mono">
                        {slave.profileId ? `Profile: ${slave.profileId}` : 'Generic Modbus Node'}
                      </p>
                    </div>

                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                        slave.status === 'online'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-700/60'
                          : 'bg-red-950 text-red-400 border border-red-700/60'
                      }`}
                    >
                      {slave.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Mini Register Preview */}
                  <div className="my-2.5 bg-slate-950/70 rounded p-2 border border-slate-800/80 space-y-1 text-xs font-mono">
                    {slaveRegs.slice(0, 3).map((r) => (
                      <div key={`${r.functionCode}_${r.address}`} className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 truncate max-w-[140px]">{r.description || `Addr ${r.address}`}:</span>
                        <span className="text-slate-100 font-bold">
                          {r.decodedValue ?? r.rawHex} {r.engineeringUnits || ''}
                        </span>
                      </div>
                    ))}
                    {slaveRegs.length === 0 && (
                      <div className="text-slate-500 italic text-[11px]">No active registers mapped</div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-800">
                    <span>Resp: {slave.avgResponseTimeMs} ms</span>
                    <span>OK: {slave.successfulRequests}</span>
                    <span className="text-amber-400">Err: {slave.failedRequests}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Live Poll Groups & Recent Traffic Activity */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wide font-mono flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Poll Groups ({activePollGroups.length})</span>
            </h3>
            <button
              onClick={() => openModal('addpoll')}
              className="text-xs text-amber-400 hover:text-amber-300 font-mono"
            >
              + Add Group
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 divide-y divide-slate-800/80 space-y-2">
            {pollGroups.map((grp) => (
              <div key={grp.id} className="pt-2 first:pt-0 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-200">{grp.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Slave #{grp.slaveId} • Addr {grp.startAddress} • Qty {grp.quantity} • {grp.intervalMs}ms
                  </div>
                </div>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                    grp.enabled
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {grp.enabled ? 'ACTIVE' : 'PAUSED'}
                </span>
              </div>
            ))}
          </div>

          {/* Quick Recent Frames */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200 font-mono uppercase">
                Recent Bus Frames
              </span>
              <button
                onClick={() => setCurrentTab('replay')}
                className="text-[11px] text-amber-400 hover:text-amber-300 font-mono"
              >
                View All ({trafficFrames.length})
              </button>
            </div>

            <div className="space-y-1 font-mono text-[10px] max-h-44 overflow-y-auto">
              {trafficFrames.slice(0, 5).map((f) => (
                <div
                  key={f.id}
                  className="bg-slate-950 p-1.5 rounded border border-slate-850 flex items-center justify-between text-slate-300"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span
                      className={`font-bold ${
                        f.direction === 'TX' ? 'text-cyan-400' : 'text-emerald-400'
                      }`}
                    >
                      {f.direction}
                    </span>
                    <span className="text-slate-400">S#{f.slaveId}</span>
                    <span className="text-amber-300/90 truncate">{f.hexPayload}</span>
                  </div>
                  {f.responseTimeMs !== undefined && (
                    <span className="text-slate-500 shrink-0">{f.responseTimeMs}ms</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
