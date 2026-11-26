/**
 * APOMODX - Auto Traffic Learn View (Key Product Differentiator)
 * Passive bus-sniffing engine that identifies active HMI requests, slave responses, and auto-compiles register maps
 */

import React, { useState } from 'react';
import {
  Radio,
  Play,
  Square,
  Search,
  Download,
  ListTree,
  Cpu,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Activity,
} from 'lucide-react';
import { useModbus } from '../../context/ModbusContext';
import { ModbusFunctionCode } from '../../types/modbus';

export const AutoLearnView: React.FC = () => {
  const {
    isAutoLearning,
    startAutoLearn,
    stopAutoLearn,
    trafficFrames,
    registers,
    slaves,
    addPollGroup,
    saveCurrentAsCache,
    setCurrentTab,
  } = useModbus() as any;

  const [searchTerm, setSearchTerm] = useState<string>('');

  // Extract observed registers
  const observedRegs = registers.filter((r: any) => r.isObserved);
  const learnedSlaves = slaves.filter((s: any) => s.status === 'online');

  // Filter observed list
  const filteredRegs = observedRegs.filter((r: any) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      r.slaveId.toString().includes(q) ||
      r.displayAddress.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q)
    );
  });

  const handleConvertAllToPollGroup = () => {
    // Group by slave and function code
    const grouped: { [key: string]: typeof observedRegs } = {};
    observedRegs.forEach((r: any) => {
      const key = `${r.slaveId}_${r.functionCode}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(r);
    });

    Object.entries(grouped).forEach(([key, items]) => {
      const [slaveStr, fcStr] = key.split('_');
      const slaveId = Number(slaveStr);
      const fc = Number(fcStr) as ModbusFunctionCode;
      const minAddr = Math.min(...items.map((i: any) => i.address));
      const maxAddr = Math.max(...items.map((i: any) => i.address));
      const qty = maxAddr - minAddr + 1;

      addPollGroup({
        name: `Auto-Learned Slave #${slaveId} (${items.length} Regs)`,
        slaveId,
        functionCode: fc,
        startAddress: minAddr,
        quantity: Math.min(qty, 20),
        intervalMs: 1000,
        priority: 'normal',
        enabled: true,
      });
    });

    saveCurrentAsCache();
  };

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto overflow-y-auto select-none">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Radio className={`w-5 h-5 ${isAutoLearning ? 'text-cyan-400 animate-pulse' : 'text-slate-400'}`} />
            <h2 className="text-base font-bold text-slate-100 font-mono">
              Passive Auto-Traffic Learn Mode
            </h2>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
              Core Differentiator
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
            When an HMI, SCADA, or PLC master is actively polling on the RS-485 bus, APOMODX passively listens
            to the wire without interfering. It decodes request and response frames, automatically extracts active Slave IDs,
            Function Codes, and register ranges, compiling a live register map with zero manual entry.
          </p>
        </div>

        {/* Start / Stop Toggle */}
        <div className="flex items-center gap-2">
          {isAutoLearning ? (
            <button
              onClick={() => stopAutoLearn()}
              className="flex items-center gap-1.5 px-4 py-2 rounded bg-red-950 border border-red-700 text-red-300 text-xs font-bold font-mono hover:bg-red-900 transition-colors shadow"
            >
              <Square className="w-3.5 h-3.5 fill-red-400" />
              <span>Stop Passive Learn</span>
            </button>
          ) : (
            <button
              onClick={() => startAutoLearn()}
              className="flex items-center gap-1.5 px-5 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold font-mono transition-colors shadow-lg"
            >
              <Play className="w-3.5 h-3.5 fill-slate-950" />
              <span>Start Passive Traffic Sniffer</span>
            </button>
          )}

          <button
            onClick={handleConvertAllToPollGroup}
            disabled={observedRegs.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 text-xs font-semibold font-mono disabled:opacity-50"
            title="Convert all discovered addresses into active poll groups"
          >
            <ListTree className="w-3.5 h-3.5 text-amber-400" />
            <span>Create Poll Groups from Learned</span>
          </button>
        </div>
      </div>

      {/* Discovery Stats Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
          <div className="text-[11px] font-mono text-slate-400 uppercase">Learned Slaves</div>
          <div className="text-xl font-bold font-mono text-slate-100 mt-1">
            {learnedSlaves.length} Active Nodes
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            Slaves: {learnedSlaves.map((s: any) => `#${s.slaveId}`).join(', ')}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
          <div className="text-[11px] font-mono text-slate-400 uppercase">Observed Registers</div>
          <div className="text-xl font-bold font-mono text-cyan-300 mt-1">
            {observedRegs.length} Addresses Mapped
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            Across FC01, FC02, FC03, FC04
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
          <div className="text-[11px] font-mono text-slate-400 uppercase">Frames Sniffed</div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
            {trafficFrames.length} Frames
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            100% CRC verified
          </div>
        </div>
      </div>

      {/* Table of Observed / Learned Registers */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden space-y-3 p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-semibold text-slate-200 font-mono uppercase">
              Observed & Learned Register Matrix ({filteredRegs.length})
            </h3>
            <span className="text-[10px] text-slate-500 font-mono italic">
              (Addresses actually seen transmitted by HMI on RS-485 bus)
            </span>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Search observed addresses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-950 border border-slate-700/80 rounded pl-3 pr-2 py-1 text-xs text-slate-200 placeholder-slate-500 w-52 focus:outline-none focus:border-cyan-500/50 font-mono"
            />
          </div>
        </div>

        {/* High-Density Engineering Table */}
        <div className="border border-slate-800 rounded overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-2.5">Slave ID</th>
                <th className="p-2.5">Function</th>
                <th className="p-2.5">Protocol Addr</th>
                <th className="p-2.5">Display Addr</th>
                <th className="p-2.5">Live Raw Hex</th>
                <th className="p-2.5">Decoded Value</th>
                <th className="p-2.5">Engineering Units</th>
                <th className="p-2.5">Activity Count</th>
                <th className="p-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {filteredRegs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-slate-500 italic">
                    {isAutoLearning
                      ? 'Listening for incoming HMI poll requests on serial bus...'
                      : 'Click "Start Passive Traffic Sniffer" above to observe active bus traffic.'}
                  </td>
                </tr>
              ) : (
                filteredRegs.map((reg: any) => (
                  <tr key={`${reg.slaveId}_${reg.functionCode}_${reg.address}`} className="eng-table-row">
                    <td className="p-2.5 font-bold text-amber-400">Slave #{reg.slaveId}</td>
                    <td className="p-2.5 text-cyan-300">
                      {reg.functionCode === 3 ? 'FC03 (Holding)' : reg.functionCode === 4 ? 'FC04 (Input)' : `FC0${reg.functionCode}`}
                    </td>
                    <td className="p-2.5 text-slate-400 font-bold">{reg.address}</td>
                    <td className="p-2.5 text-slate-200">{reg.displayAddress}</td>
                    <td className="p-2.5 text-amber-200">{reg.rawHex || '0x0000'}</td>
                    <td className="p-2.5 text-emerald-300 font-bold">
                      {reg.decodedValue !== undefined ? reg.decodedValue : '-'}
                    </td>
                    <td className="p-2.5 text-slate-400">{reg.engineeringUnits || '-'}</td>
                    <td className="p-2.5 text-slate-400">{reg.changeCount} hits</td>
                    <td className="p-2.5">
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                        LEARNED
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
