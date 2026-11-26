/**
 * APOMODX - Poll Monitor & Telemetry Suite
 * Multi-group continuous polling engine with real-time Recharts latency visualizer and modular multi-view workspace
 */

import React, { useState } from 'react';
import {
  ListTree,
  Play,
  Pause,
  Plus,
  Trash2,
  Edit2,
  Clock,
  Activity,
  Layers,
  CheckCircle2,
  Sliders,
  Sparkles,
  TrendingUp,
  BarChart3,
  Search,
  Filter,
  RefreshCw,
  Server,
  Zap,
  Eye,
  EyeOff,
  CheckSquare,
  Square,
  X,
  LayoutGrid,
  Columns,
} from 'lucide-react';
import { useModbus } from '../../context/ModbusContext';
import { PollGroup, ModbusFunctionCode } from '../../types/modbus';
import { PollLatencyChart } from './poll-monitor/PollLatencyChart';
import { PollFunctionComparison } from './poll-monitor/PollFunctionComparison';
import { PollTimingDiagnostics } from './poll-monitor/PollTimingDiagnostics';

interface PollMonitorViewProps {
  openModal: (name: 'about' | 'welcome' | 'report' | 'reference' | 'safewrite' | 'addpoll') => void;
}

export type ViewOptionId = 'chart' | 'matrix' | 'comparison' | 'timing';

interface ViewOption {
  id: ViewOptionId;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  description: string;
}

const VIEW_OPTIONS: ViewOption[] = [
  {
    id: 'chart',
    label: 'Live Latency & Response Chart',
    shortLabel: 'Latency Chart',
    icon: <TrendingUp className="w-3.5 h-3.5" />,
    description: 'Real-time response time, polling latency drift, and jitter telemetry',
  },
  {
    id: 'matrix',
    label: 'Poll Groups Matrix',
    shortLabel: 'Groups Matrix',
    icon: <ListTree className="w-3.5 h-3.5" />,
    description: 'Configure and monitor active Modbus polling blocks & priorities',
  },
  {
    id: 'comparison',
    label: 'Function & Node Comparison',
    shortLabel: 'FC & Node Comparison',
    icon: <BarChart3 className="w-3.5 h-3.5" />,
    description: 'Comparative turnaround benchmarks across function codes & slave nodes',
  },
  {
    id: 'timing',
    label: 'Timing & Scheduler Diagnostics',
    shortLabel: 'Timing Diagnostics',
    icon: <Clock className="w-3.5 h-3.5" />,
    description: 'Microsecond physical timing, t3.5 frame silence, and bus utilization',
  },
];

export const PollMonitorView: React.FC<PollMonitorViewProps> = ({ openModal }) => {
  const {
    pollGroups,
    togglePollGroup,
    removePollGroup,
    isPolling,
    startPolling,
    stopPolling,
    slaves,
    trafficFrames,
    healthMetrics,
    serialConfig,
  } = useModbus();

  // Multi-select state: User can select ANY combination of views (or none to close all)
  const [selectedViews, setSelectedViews] = useState<ViewOptionId[]>(['chart', 'matrix']);

  // Filters
  const [selectedSlaveFilter, setSelectedSlaveFilter] = useState<number | 'all'>('all');
  const [selectedFcFilter, setSelectedFcFilter] = useState<number | 'all'>('all');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const activeGroups = pollGroups.filter((g) => g.enabled);

  // Toggle single view in multi-selection
  const handleToggleView = (viewId: ViewOptionId) => {
    setSelectedViews((prev) =>
      prev.includes(viewId) ? prev.filter((id) => id !== viewId) : [...prev, viewId]
    );
  };

  // Select all views
  const handleSelectAllViews = () => {
    setSelectedViews(['chart', 'matrix', 'comparison', 'timing']);
  };

  // Close all views
  const handleCloseAllViews = () => {
    setSelectedViews([]);
  };

  // Filtered poll groups for table view
  const filteredGroups = pollGroups.filter((grp) => {
    if (selectedSlaveFilter !== 'all' && grp.slaveId !== selectedSlaveFilter) return false;
    if (selectedFcFilter !== 'all' && grp.functionCode !== selectedFcFilter) return false;
    if (selectedGroupFilter !== 'all' && grp.id !== selectedGroupFilter) return false;
    if (
      searchQuery &&
      !grp.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !grp.startAddress.toString().includes(searchQuery)
    ) {
      return false;
    }
    return true;
  });

  const isViewVisible = (viewId: ViewOptionId) => selectedViews.includes(viewId);

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto overflow-y-auto select-none">
      {/* 1. Master Header & Global Poll Controls */}
      <div className="bg-[#1e293b] border border-slate-800 rounded-lg p-4 flex items-center justify-between gap-4 flex-wrap shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400">
            <ListTree className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-100 font-mono tracking-tight">
                Continuous Polling & Schedule Manager
              </h2>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-600/20 text-blue-300 border border-blue-500/30 font-mono">
                TELEMETRY SUITE
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Continuous multi-block scheduling engine with real-time latency & response turnaround analysis
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Global Master Switch */}
          {isPolling ? (
            <button
              onClick={() => stopPolling()}
              className="flex items-center gap-1.5 px-4 py-2 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold font-mono transition-colors shadow-lg shadow-amber-950/40"
            >
              <Pause className="w-3.5 h-3.5 fill-white" />
              <span>PAUSE MASTER POLLING</span>
            </button>
          ) : (
            <button
              onClick={() => startPolling()}
              className="flex items-center gap-1.5 px-5 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-mono transition-colors shadow-lg shadow-emerald-950/40"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>RESUME MASTER POLLING</span>
            </button>
          )}

          <button
            onClick={() => openModal('addpoll')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-blue-300 hover:text-white text-xs font-bold font-mono transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Poll Group</span>
          </button>
        </div>
      </div>

      {/* 2. Multi-Select View Selector & Controls */}
      <div className="bg-[#1e293b] border border-slate-800 rounded-lg p-3 space-y-2.5 shadow-sm">
        <div className="flex items-center justify-between gap-3 flex-wrap border-b border-slate-800/80 pb-2.5">
          {/* Multi-Select Label & Quick Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <LayoutGrid className="w-3.5 h-3.5 text-blue-400" />
              <span>Active View Options ({selectedViews.length} of {VIEW_OPTIONS.length} visible):</span>
            </span>

            <div className="flex items-center gap-1 ml-1">
              <button
                onClick={handleSelectAllViews}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-[10px] font-mono font-semibold transition-colors"
                title="Open and show all 4 views simultaneously"
              >
                Select All
              </button>
              <button
                onClick={handleCloseAllViews}
                className="px-2 py-0.5 rounded bg-slate-900 hover:bg-red-950/60 border border-slate-800 hover:border-red-800 text-slate-400 hover:text-red-300 text-[10px] font-mono font-semibold transition-colors"
                title="Close and hide all views"
              >
                Close All
              </button>
            </div>
          </div>

          {/* Right: Global Filter Controls */}
          <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
            {/* Slave Device Filter */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded px-2 py-1">
              <Server className="w-3 h-3 text-slate-500" />
              <span className="text-[10px] text-slate-400 uppercase font-bold">Node:</span>
              <select
                value={selectedSlaveFilter}
                onChange={(e) =>
                  setSelectedSlaveFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))
                }
                className="bg-transparent text-blue-300 text-xs font-mono focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900 text-slate-200">All Slaves</option>
                {slaves.map((s) => (
                  <option key={s.slaveId} value={s.slaveId} className="bg-slate-900 text-slate-200">
                    Slave #{s.slaveId} ({s.name.split('(')[0].trim()})
                  </option>
                ))}
              </select>
            </div>

            {/* Function Code Filter */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded px-2 py-1">
              <Layers className="w-3 h-3 text-slate-500" />
              <span className="text-[10px] text-slate-400 uppercase font-bold">FC:</span>
              <select
                value={selectedFcFilter}
                onChange={(e) =>
                  setSelectedFcFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))
                }
                className="bg-transparent text-blue-300 text-xs font-mono focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900 text-slate-200">All Functions</option>
                <option value={3} className="bg-slate-900 text-slate-200">FC03 Read Holding (4x)</option>
                <option value={4} className="bg-slate-900 text-slate-200">FC04 Read Input (3x)</option>
                <option value={1} className="bg-slate-900 text-slate-200">FC01 Read Coils (0x)</option>
                <option value={2} className="bg-slate-900 text-slate-200">FC02 Discrete Inputs (1x)</option>
              </select>
            </div>

            {/* Quick Search */}
            <div className="relative">
              <Search className="w-3 h-3 text-slate-500 absolute left-2 top-2" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded pl-6 pr-2 py-1 text-xs text-slate-200 placeholder-slate-500 w-24 focus:w-32 transition-all focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Multi-Selection Options Checkbox Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {VIEW_OPTIONS.map((opt) => {
            const isSelected = isViewVisible(opt.id);
            return (
              <button
                key={opt.id}
                onClick={() => handleToggleView(opt.id)}
                className={`p-2.5 rounded-lg border text-left transition-all flex items-start justify-between gap-2 group ${
                  isSelected
                    ? 'bg-blue-950/40 border-blue-500 text-blue-100 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="space-y-0.5 overflow-hidden">
                  <div className="flex items-center gap-1.5 font-mono text-xs font-bold truncate">
                    <span className={isSelected ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-400'}>
                      {opt.icon}
                    </span>
                    <span className={isSelected ? 'text-slate-100' : 'text-slate-300'}>
                      {opt.shortLabel}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 truncate">{opt.description}</p>
                </div>

                <div className="pt-0.5 flex-shrink-0">
                  {isSelected ? (
                    <span className="w-4 h-4 rounded bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold shadow">
                      ✓
                    </span>
                  ) : (
                    <span className="w-4 h-4 rounded border border-slate-700 bg-slate-950 flex items-center justify-center" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Empty State When No Views Are Selected ("close all view / not show without selected any option") */}
      {selectedViews.length === 0 && (
        <div className="bg-[#1e293b] border border-slate-800 rounded-lg p-10 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
            <EyeOff className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-sm font-bold text-slate-200 font-mono uppercase tracking-wide">
              No View Options Selected
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-mono">
              All views are currently closed. Select one or more options above to display live latency charts, group matrices, comparative benchmarks, or timing diagnostics in this workspace.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
            <button
              onClick={() => setSelectedViews(['chart'])}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold transition-colors shadow"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Open Latency Chart</span>
            </button>
            <button
              onClick={() => setSelectedViews(['matrix'])}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-mono font-bold transition-colors"
            >
              <ListTree className="w-3.5 h-3.5" />
              <span>Open Groups Matrix</span>
            </button>
            <button
              onClick={handleSelectAllViews}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-blue-300 text-xs font-mono font-bold transition-colors"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Open All Views</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. Render Active Views in Fixed, Modular Panel Positions */}
      <div className="space-y-4">
        {/* VIEW 1: Live Latency & Response Chart */}
        {isViewVisible('chart') && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-mono font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>Panel: Live Latency & Turnaround Monitor</span>
              </span>
              <button
                onClick={() => handleToggleView('chart')}
                className="flex items-center gap-1 text-[10px] font-mono text-slate-500 hover:text-slate-300 px-2 py-0.5 rounded hover:bg-slate-800 transition-colors"
                title="Close this view panel"
              >
                <X className="w-3 h-3" />
                <span>Hide View</span>
              </button>
            </div>
            <PollLatencyChart
              trafficFrames={trafficFrames}
              pollGroups={pollGroups}
              slaves={slaves}
              isPolling={isPolling}
              selectedSlaveFilter={selectedSlaveFilter}
              selectedFcFilter={selectedFcFilter}
              selectedGroupFilter={selectedGroupFilter}
            />
          </div>
        )}

        {/* VIEW 2: Poll Groups Matrix */}
        {isViewVisible('matrix') && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-mono font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <ListTree className="w-3.5 h-3.5 text-blue-400" />
                <span>Panel: Configured Poll Groups Matrix</span>
              </span>
              <button
                onClick={() => handleToggleView('matrix')}
                className="flex items-center gap-1 text-[10px] font-mono text-slate-500 hover:text-slate-300 px-2 py-0.5 rounded hover:bg-slate-800 transition-colors"
                title="Close this view panel"
              >
                <X className="w-3 h-3" />
                <span>Hide View</span>
              </button>
            </div>

            <div className="bg-[#1e293b] border border-slate-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <h3 className="text-xs font-semibold text-slate-200 font-mono uppercase flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>Configured Poll Groups ({filteredGroups.length} shown)</span>
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  Priority Engine: Round-Robin with Interval Throttling
                </span>
              </div>

              <div className="border border-slate-800 rounded overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-[#0a0f1d] text-slate-400 text-[10px] uppercase border-b border-slate-800">
                    <tr>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">Group Name</th>
                      <th className="p-2.5">Target Slave</th>
                      <th className="p-2.5">Function</th>
                      <th className="p-2.5">Start Addr</th>
                      <th className="p-2.5">Qty</th>
                      <th className="p-2.5">Interval</th>
                      <th className="p-2.5">Priority</th>
                      <th className="p-2.5">Last Resp</th>
                      <th className="p-2.5">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredGroups.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="p-4 text-center text-slate-500 italic">
                          No poll groups matching current filter.
                        </td>
                      </tr>
                    ) : (
                      filteredGroups.map((grp) => {
                        const targetSlave = slaves.find((s) => s.slaveId === grp.slaveId);

                        return (
                          <tr key={grp.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="p-2.5">
                              <button
                                onClick={() => togglePollGroup(grp.id)}
                                className={`text-[10px] px-2 py-0.5 rounded font-bold transition-colors ${
                                  grp.enabled
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                                    : 'bg-slate-800 text-slate-500 border border-slate-700'
                                }`}
                              >
                                {grp.enabled ? 'ACTIVE' : 'MUTED'}
                              </button>
                            </td>

                            <td className="p-2.5 font-bold text-slate-200">{grp.name}</td>

                            <td className="p-2.5 text-blue-400 font-bold">
                              Slave #{grp.slaveId} {targetSlave ? `(${targetSlave.name.split('(')[0].trim()})` : ''}
                            </td>

                            <td className="p-2.5 text-cyan-300">
                              {grp.functionCode === 3
                                ? 'FC03 Holding (4x)'
                                : grp.functionCode === 4
                                ? 'FC04 Input (3x)'
                                : grp.functionCode === 1
                                ? 'FC01 Coils (0x)'
                                : `FC0${grp.functionCode}`}
                            </td>

                            <td className="p-2.5 text-slate-300">{grp.startAddress}</td>
                            <td className="p-2.5 text-slate-300">{grp.quantity} Regs</td>
                            <td className="p-2.5 text-slate-300">{grp.intervalMs} ms</td>

                            <td className="p-2.5">
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                  grp.priority === 'high'
                                    ? 'bg-red-950 text-red-400 border border-red-800'
                                    : grp.priority === 'normal'
                                    ? 'bg-slate-800 text-slate-300'
                                    : 'bg-slate-800 text-slate-500'
                                }`}
                              >
                                {(grp.priority || 'normal').toUpperCase()}
                              </span>
                            </td>

                            <td className="p-2.5 text-emerald-400 font-bold">
                              {grp.lastResponseTimeMs ? `${grp.lastResponseTimeMs} ms` : '14 ms'}
                            </td>

                            <td className="p-2.5">
                              <button
                                onClick={() => removePollGroup(grp.id)}
                                className="p-1 text-slate-400 hover:text-red-400 rounded hover:bg-slate-800"
                                title="Delete Poll Group"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: Function & Node Comparison */}
        {isViewVisible('comparison') && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-mono font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Panel: Function & Node Comparative Benchmarks</span>
              </span>
              <button
                onClick={() => handleToggleView('comparison')}
                className="flex items-center gap-1 text-[10px] font-mono text-slate-500 hover:text-slate-300 px-2 py-0.5 rounded hover:bg-slate-800 transition-colors"
                title="Close this view panel"
              >
                <X className="w-3 h-3" />
                <span>Hide View</span>
              </button>
            </div>
            <PollFunctionComparison
              pollGroups={pollGroups}
              slaves={slaves}
              trafficFrames={trafficFrames}
            />
          </div>
        )}

        {/* VIEW 4: Timing & Scheduler Diagnostics */}
        {isViewVisible('timing') && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-mono font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                <span>Panel: Physical Serial Timing & Priority Scheduler Diagnostics</span>
              </span>
              <button
                onClick={() => handleToggleView('timing')}
                className="flex items-center gap-1 text-[10px] font-mono text-slate-500 hover:text-slate-300 px-2 py-0.5 rounded hover:bg-slate-800 transition-colors"
                title="Close this view panel"
              >
                <X className="w-3 h-3" />
                <span>Hide View</span>
              </button>
            </div>
            <PollTimingDiagnostics
              pollGroups={pollGroups}
              healthMetrics={healthMetrics}
              baudRate={serialConfig.baudRate}
            />
          </div>
        )}
      </div>
    </div>
  );
};

