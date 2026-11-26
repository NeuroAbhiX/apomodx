/**
 * APOMODX - Modbus Active Scanner View
 * Slave Scanner (IDs 1-247) and Register Range Discovery (FC01-FC04)
 */

import React, { useState } from 'react';
import {
  Search,
  Play,
  Square,
  Server,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Download,
  Filter,
} from 'lucide-react';
import { useModbus } from '../../context/ModbusContext';
import { ModbusFunctionCode } from '../../types/modbus';

export const ScannerView: React.FC = () => {
  const {
    isScanning,
    scanProgress,
    runSlaveScan,
    cancelScan,
    runRegisterRangeScan,
    slaves,
    registers,
    setSelectedSlaveId,
    selectedSlaveId,
  } = useModbus();

  const [activeTab, setActiveTab] = useState<'slaves' | 'registers'>('slaves');

  // Slave Scan Form
  const [startSlaveId, setStartSlaveId] = useState<number>(1);
  const [endSlaveId, setEndSlaveId] = useState<number>(32);
  const [slaveScanMode, setSlaveScanMode] = useState<'fast' | 'normal' | 'full'>('normal');

  // Register Scan Form
  const [targetSlaveId, setTargetSlaveId] = useState<number>(selectedSlaveId || 1);
  const [targetFc, setTargetFc] = useState<ModbusFunctionCode>(ModbusFunctionCode.ReadHoldingRegisters);
  const [startAddress, setStartAddress] = useState<number>(0);
  const [endAddress, setEndAddress] = useState<number>(30);

  const discoveredRegs = registers.filter((r) => r.isDiscovered && r.slaveId === targetSlaveId);

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto overflow-y-auto select-none">
      {/* Tab Switcher & Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-base font-bold text-slate-100 font-mono flex items-center gap-2">
            <Search className="w-5 h-5 text-indigo-400" />
            <span>Industrial Modbus Active Scanner</span>
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Active bus discovery for slave nodes (1-247) and register memory range mapping
          </p>
        </div>

        <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-md text-xs font-mono">
          <button
            onClick={() => setActiveTab('slaves')}
            className={`px-3 py-1 rounded transition-colors ${
              activeTab === 'slaves'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Slave ID Scanner (1-247)
          </button>
          <button
            onClick={() => setActiveTab('registers')}
            className={`px-3 py-1 rounded transition-colors ${
              activeTab === 'registers'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Register Address Range Scanner
          </button>
        </div>
      </div>

      {/* Active Scan Progress Overlay (if scanning) */}
      {isScanning && (
        <div className="bg-indigo-950/40 border border-indigo-500/50 rounded-lg p-4 font-mono text-xs space-y-2">
          <div className="flex items-center justify-between text-indigo-300 font-bold">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping" />
              <span>{scanProgress.stage}</span>
            </span>
            <span>
              {scanProgress.current} / {scanProgress.total} ({scanProgress.foundCount} Discovered)
            </span>
          </div>

          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
            <div
              className="bg-indigo-500 h-full transition-all duration-150"
              style={{
                width: `${Math.min(100, (scanProgress.current / Math.max(1, scanProgress.total)) * 100)}%`,
              }}
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              onClick={() => cancelScan()}
              className="px-3 py-1 rounded bg-red-950 border border-red-700 text-red-300 text-xs font-bold hover:bg-red-900"
            >
              Cancel Scan
            </button>
          </div>
        </div>
      )}

      {activeTab === 'slaves' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Form: Slave Scan Parameters */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-4">
            <h3 className="text-xs font-semibold text-slate-200 font-mono uppercase">
              Slave Scan Configuration
            </h3>

            <div className="space-y-3 font-mono text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-slate-400">Start Slave ID</label>
                  <input
                    type="number"
                    min={1}
                    max={247}
                    value={startSlaveId}
                    onChange={(e) => setStartSlaveId(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400">End Slave ID</label>
                  <input
                    type="number"
                    min={1}
                    max={247}
                    value={endSlaveId}
                    onChange={(e) => setEndSlaveId(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">Scan Mode</label>
                <select
                  value={slaveScanMode}
                  onChange={(e) => setSlaveScanMode(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100"
                >
                  <option value="fast">Fast Scan (10ms delay, probe FC03 Addr 0)</option>
                  <option value="normal">Normal Scan (25ms delay, standard retry)</option>
                  <option value="full">Full Thorough Scan (Probes FC01, 02, 03, 04)</option>
                </select>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => runSlaveScan(startSlaveId, endSlaveId)}
                disabled={isScanning}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded bg-indigo-600 hover:bg-indigo-500 text-slate-100 font-bold text-xs font-mono transition-colors shadow disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isScanning ? 'Scan in Progress...' : 'Start Slave ID Discovery'}</span>
              </button>
            </div>

            <div className="border-t border-slate-800 pt-3 text-[11px] text-slate-400 space-y-1">
              <div className="font-semibold text-slate-300">Tips for Commissioning:</div>
              <p>• Standard Modbus address range is 1 to 247. Address 0 is reserved for broadcast.</p>
              <p>• Most devices come factory set to Address 1 or 2.</p>
            </div>
          </div>

          {/* Right 2 Columns: Discovered Slaves Matrix */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-200 font-mono uppercase flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-400" />
                <span>Discovered Nodes on Bus ({slaves.length})</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                {slaves.filter((s) => s.status === 'online').length} Responding
              </span>
            </div>

            <div className="border border-slate-800 rounded overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">Slave ID</th>
                    <th className="p-2.5">Device Name</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5">Response Time</th>
                    <th className="p-2.5">OK Req</th>
                    <th className="p-2.5">Errors</th>
                    <th className="p-2.5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {slaves.map((s) => (
                    <tr key={s.slaveId} className="eng-table-row">
                      <td className="p-2.5 font-bold text-amber-400">Slave #{s.slaveId}</td>
                      <td className="p-2.5 text-slate-200">{s.name}</td>
                      <td className="p-2.5">
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                            s.status === 'online'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : 'bg-red-950 text-red-400 border border-red-800'
                          }`}
                        >
                          {s.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-300">{s.avgResponseTimeMs} ms</td>
                      <td className="p-2.5 text-emerald-400">{s.successfulRequests}</td>
                      <td className="p-2.5 text-amber-400">{s.failedRequests}</td>
                      <td className="p-2.5">
                        <button
                          onClick={() => {
                            setSelectedSlaveId(s.slaveId);
                            setTargetSlaveId(s.slaveId);
                            setActiveTab('registers');
                          }}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] border border-slate-700"
                        >
                          Scan Registers
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Register Address Range Scanner */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-4">
            <h3 className="text-xs font-semibold text-slate-200 font-mono uppercase">
              Register Range Scanner Form
            </h3>

            <div className="space-y-3 font-mono text-xs">
              <div className="space-y-1">
                <label className="text-slate-400">Target Slave Device</label>
                <select
                  value={targetSlaveId}
                  onChange={(e) => setTargetSlaveId(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100"
                >
                  {slaves.map((s) => (
                    <option key={s.slaveId} value={s.slaveId}>
                      Slave #{s.slaveId} - {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">Function Code</label>
                <select
                  value={targetFc}
                  onChange={(e) => setTargetFc(Number(e.target.value) as ModbusFunctionCode)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100"
                >
                  <option value={ModbusFunctionCode.ReadHoldingRegisters}>FC03 Read Holding Registers (4x)</option>
                  <option value={ModbusFunctionCode.ReadInputRegisters}>FC04 Read Input Registers (3x)</option>
                  <option value={ModbusFunctionCode.ReadCoils}>FC01 Read Coils (0x)</option>
                  <option value={ModbusFunctionCode.ReadDiscreteInputs}>FC02 Read Discrete Inputs (1x)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-slate-400">Start Address</label>
                  <input
                    type="number"
                    min={0}
                    max={65535}
                    value={startAddress}
                    onChange={(e) => setStartAddress(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400">End Address</label>
                  <input
                    type="number"
                    min={0}
                    max={65535}
                    value={endAddress}
                    onChange={(e) => setEndAddress(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={() => runRegisterRangeScan(targetSlaveId, targetFc, startAddress, endAddress)}
              disabled={isScanning}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded bg-indigo-600 hover:bg-indigo-500 text-slate-100 font-bold text-xs font-mono transition-colors shadow disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isScanning ? 'Scanning Registers...' : 'Scan Memory Range'}</span>
            </button>
          </div>

          {/* Discovered Registers */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-200 font-mono uppercase flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>Discovered Active Registers for Slave #{targetSlaveId}</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                {discoveredRegs.length} Addresses Responding
              </span>
            </div>

            <div className="border border-slate-800 rounded overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">Offset (0-based)</th>
                    <th className="p-2.5">Modicon (40001)</th>
                    <th className="p-2.5">Hex Addr</th>
                    <th className="p-2.5">Function</th>
                    <th className="p-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {discoveredRegs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-500 italic">
                        Run an address range scan to discover active registers for this slave.
                      </td>
                    </tr>
                  ) : (
                    discoveredRegs.map((r) => (
                      <tr key={r.address} className="eng-table-row">
                        <td className="p-2.5 font-bold text-amber-400">{r.address}</td>
                        <td className="p-2.5 text-slate-200">{r.displayAddress}</td>
                        <td className="p-2.5 text-cyan-300">0x{r.address.toString(16).padStart(4, '0').toUpperCase()}</td>
                        <td className="p-2.5 text-slate-400">FC0{r.functionCode}</td>
                        <td className="p-2.5">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                            OK (RESPONDED)
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
      )}
    </div>
  );
};
