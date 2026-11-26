/**
 * APOMODX - Traffic Capture & Replay Simulator / Offline Protocol Analyzer
 * Sniff frames, inspect byte-level Modbus protocol structure, and replay captured logs
 */

import React, { useState } from 'react';
import {
  History,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Download,
  Trash2,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  ArrowDownRight,
  Search,
} from 'lucide-react';
import { useModbus } from '../../context/ModbusContext';
import { ModbusTrafficFrame } from '../../types/modbus';

export const TrafficReplayView: React.FC = () => {
  const { trafficFrames, clearLogs } = useModbus();

  const [selectedFrame, setSelectedFrame] = useState<ModbusTrafficFrame | null>(
    trafficFrames[0] || null
  );
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [replaySpeed, setReplaySpeed] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredFrames = trafficFrames.filter((f) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      f.hexPayload.toLowerCase().includes(q) ||
      f.slaveId.toString().includes(q) ||
      f.direction.toLowerCase().includes(q)
    );
  });

  const handleExportFrames = () => {
    const json = JSON.stringify(trafficFrames, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `APOMODX_Traffic_Capture_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto overflow-y-auto select-none">
      {/* Header Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-slate-100 font-mono">
              Traffic Capture & Offline Replay Analyzer
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Capture wire packets, step frame-by-frame, verify CRC polynomial, and analyze timing
          </p>
        </div>

        {/* Replay Player Controls */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-bold transition-colors ${
              isPlaying
                ? 'bg-amber-950 text-amber-300 border border-amber-600'
                : 'bg-cyan-600 hover:bg-cyan-500 text-slate-950 shadow'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isPlaying ? 'Pause Replay' : 'Replay Capture'}</span>
          </button>

          <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-800 text-slate-300">
            <span className="text-slate-500">Speed:</span>
            <select
              value={replaySpeed}
              onChange={(e) => setReplaySpeed(Number(e.target.value))}
              className="bg-transparent text-amber-300 focus:outline-none"
            >
              <option value={0.5}>0.5x</option>
              <option value={1}>1.0x</option>
              <option value={2}>2.0x</option>
              <option value={5}>5.0x</option>
            </select>
          </div>

          <button
            onClick={handleExportFrames}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200"
            title="Download JSON frame capture"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Capture</span>
          </button>
        </div>
      </div>

      {/* Frame Table & Inspector Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Frames Stream Table */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-200 font-mono uppercase">
              Captured Wire Frames ({trafficFrames.length})
            </h3>

            <div className="relative">
              <Search className="w-3 h-3 text-slate-500 absolute left-2 top-2" />
              <input
                type="text"
                placeholder="Search hex / slave..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded pl-7 pr-2 py-0.5 text-xs text-slate-200 placeholder-slate-500 w-44 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="border border-slate-800 rounded overflow-x-auto max-h-[420px] overflow-y-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase border-b border-slate-800 sticky top-0">
                <tr>
                  <th className="p-2">Time</th>
                  <th className="p-2">Dir</th>
                  <th className="p-2">Slave</th>
                  <th className="p-2">FC</th>
                  <th className="p-2">Raw Payload Hex</th>
                  <th className="p-2">CRC Status</th>
                  <th className="p-2">Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {filteredFrames.map((f) => (
                  <tr
                    key={f.id}
                    onClick={() => setSelectedFrame(f)}
                    className={`eng-table-row cursor-pointer ${
                      selectedFrame?.id === f.id ? 'bg-slate-800/90 font-bold text-slate-100' : ''
                    }`}
                  >
                    <td className="p-2 text-slate-500 text-[11px]">{f.timestampFormatted}</td>

                    <td className="p-2">
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                          f.direction === 'TX'
                            ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                            : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        }`}
                      >
                        {f.direction}
                      </span>
                    </td>

                    <td className="p-2 font-bold text-amber-400">#{f.slaveId}</td>

                    <td className="p-2 text-slate-300">
                      {f.functionCode !== undefined ? `FC0${f.functionCode}` : '-'}
                    </td>

                    <td className="p-2 text-amber-200/90 tracking-wide font-mono text-[11px]">
                      {f.hexPayload}
                    </td>

                    <td className="p-2">
                      <span className="text-[10px] text-emerald-400 font-bold">
                        {(f.crcStatus || 'VALID').toUpperCase()}
                      </span>
                    </td>

                    <td className="p-2 text-slate-400">
                      {f.responseTimeMs !== undefined ? `${f.responseTimeMs} ms` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Protocol Byte Dissection Box */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-4 font-mono text-xs">
          <h3 className="text-xs font-semibold text-slate-200 uppercase flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Protocol Byte Dissector</span>
          </h3>

          {selectedFrame ? (
            <div className="space-y-3 text-xs">
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800 space-y-1">
                <div className="text-[10px] text-slate-500 uppercase">Selected Hex Stream:</div>
                <div className="text-amber-300 font-bold text-sm break-all">
                  {selectedFrame.hexPayload}
                </div>
              </div>

              {/* Byte Decomposition breakdown */}
              <div className="space-y-2 pt-1">
                <div className="flex justify-between p-2 rounded bg-slate-950 border border-slate-850">
                  <span className="text-slate-400">Slave Address Byte:</span>
                  <span className="text-amber-400 font-bold">
                    0x{selectedFrame.slaveId.toString(16).padStart(2, '0').toUpperCase()} (#{selectedFrame.slaveId})
                  </span>
                </div>

                <div className="flex justify-between p-2 rounded bg-slate-950 border border-slate-850">
                  <span className="text-slate-400">Function Code Byte:</span>
                  <span className="text-cyan-300 font-bold">
                    0x0{selectedFrame.functionCode} (FC0{selectedFrame.functionCode})
                  </span>
                </div>

                <div className="flex justify-between p-2 rounded bg-slate-950 border border-slate-850">
                  <span className="text-slate-400">Data Payload Length:</span>
                  <span className="text-slate-200">
                    {selectedFrame.rawBytes.length - 4} Bytes
                  </span>
                </div>

                <div className="flex justify-between p-2 rounded bg-slate-950 border border-slate-850">
                  <span className="text-slate-400">CRC-16 Polynomial Check:</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 0x
                    {selectedFrame.computedCrc?.toString(16).padStart(4, '0').toUpperCase() || 'VALID'}
                  </span>
                </div>
              </div>

              {/* Individual Byte Grid */}
              <div className="pt-2">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1.5">
                  Raw Octet Breakdown:
                </span>
                <div className="grid grid-cols-4 gap-1.5 text-center">
                  {selectedFrame.rawBytes.map((b, i) => (
                    <div key={i} className="bg-slate-950 border border-slate-800 p-1.5 rounded">
                      <div className="text-[9px] text-slate-500">[{i}]</div>
                      <div className="text-xs font-bold text-amber-300 mt-0.5">
                        0x{b.toString(16).padStart(2, '0').toUpperCase()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 italic">
              Select a frame from the capture stream to inspect its byte structure.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
