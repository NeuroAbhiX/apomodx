/**
 * APOMODX - Live Register Monitor & Industrial Multi-Format Decoder
 * High-density engineering table with live values, byte-order swap, bit-level inspection, and safe write
 */

import React, { useState } from 'react';
import {
  Binary,
  Edit3,
  Search,
  Filter,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  Eye,
  ShieldCheck,
  ShieldAlert,
  ArrowUpDown,
} from 'lucide-react';
import { useModbus } from '../../context/ModbusContext';
import {
  ModbusRegister,
  ModbusDataType,
  ByteOrder,
  ModbusFunctionCode,
} from '../../types/modbus';

interface RegistersViewProps {
  openSafeWrite: (reg: ModbusRegister) => void;
}

export const RegistersView: React.FC<RegistersViewProps> = ({ openSafeWrite }) => {
  const {
    registers,
    slaves,
    selectedSlaveId,
    setSelectedSlaveId,
    addressNotation,
    isReadOnly,
    expertMode,
    updateRegisterConfig,
  } = useModbus();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedFc, setSelectedFc] = useState<string>('ALL');
  const [inspectingRegister, setInspectingRegister] = useState<ModbusRegister | null>(null);

  const filteredRegisters = registers.filter((r) => {
    if (selectedSlaveId !== undefined && r.slaveId !== selectedSlaveId) return false;
    if (selectedFc !== 'ALL' && r.functionCode.toString() !== selectedFc) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchDesc = r.description?.toLowerCase().includes(q);
      const matchAddr = r.displayAddress.toLowerCase().includes(q) || r.address.toString().includes(q);
      const matchHex = r.rawHex?.toLowerCase().includes(q);
      return matchDesc || matchAddr || matchHex;
    }
    return true;
  });

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto overflow-y-auto select-none">
      {/* Header Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 flex items-center justify-between gap-4 flex-wrap">
        {/* Left: Slave Filter & Title */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Binary className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-bold text-slate-100 font-mono uppercase">
              Live Register Monitor & Decoder
            </h2>
          </div>

          <div className="h-4 w-[1px] bg-slate-800" />

          {/* Slave Device Selector */}
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <span className="text-slate-400">Slave:</span>
            <select
              value={selectedSlaveId ?? ''}
              onChange={(e) => setSelectedSlaveId(e.target.value ? Number(e.target.value) : undefined)}
              className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-amber-300 font-bold focus:outline-none"
            >
              <option value="">All Slaves ({registers.length} Regs)</option>
              {slaves.map((s) => (
                <option key={s.slaveId} value={s.slaveId}>
                  Slave #{s.slaveId} - {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Function Code Filter */}
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <span className="text-slate-400">Function:</span>
            <select
              value={selectedFc}
              onChange={(e) => setSelectedFc(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none"
            >
              <option value="ALL">All Functions</option>
              <option value="3">FC03 Holding (4x)</option>
              <option value="4">FC04 Input (3x)</option>
              <option value="1">FC01 Coils (0x)</option>
              <option value="2">FC02 Discrete (1x)</option>
            </select>
          </div>
        </div>

        {/* Right: Search & Notation Info */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder="Search description, address, hex..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 w-60 focus:outline-none focus:border-amber-500/50 font-mono"
            />
          </div>

          <div className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2 py-1 rounded border border-slate-800">
            Notation: <span className="text-amber-400">{addressNotation}</span>
          </div>
        </div>
      </div>

      {/* Main Register Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden space-y-3 p-3">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
          <span>Displaying {filteredRegisters.length} live registers</span>
          {isReadOnly && (
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Read-Only Mode (Bus Write Protected)
            </span>
          )}
        </div>

        <div className="border border-slate-800 rounded overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-2.5">Slave</th>
                <th className="p-2.5">Address ({addressNotation})</th>
                <th className="p-2.5">Description / Tag</th>
                <th className="p-2.5">Function</th>
                <th className="p-2.5">Raw Hex</th>
                <th className="p-2.5">Raw Dec</th>
                <th className="p-2.5 text-amber-300">Decoded Engineering Value</th>
                <th className="p-2.5">Data Type</th>
                <th className="p-2.5">Byte Order</th>
                <th className="p-2.5 text-center">Bits</th>
                <th className="p-2.5 text-right">Write</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-850">
              {filteredRegisters.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-500 italic">
                    No registers found matching criteria. Start Auto-Learn or run a Scanner scan to populate registers.
                  </td>
                </tr>
              ) : (
                filteredRegisters.map((reg) => (
                  <tr
                    key={`${reg.slaveId}_${reg.functionCode}_${reg.address}`}
                    className="eng-table-row hover:bg-slate-850"
                  >
                    <td className="p-2.5 font-bold text-amber-400">#{reg.slaveId}</td>

                    <td className="p-2.5 font-bold text-slate-200">
                      {reg.displayAddress}
                      <span className="text-[10px] text-slate-500 ml-1">({reg.address})</span>
                    </td>

                    <td className="p-2.5 text-slate-300 max-w-[200px] truncate">
                      {reg.description || <span className="text-slate-600 italic">Unassigned Tag</span>}
                    </td>

                    <td className="p-2.5 text-cyan-300 text-[11px]">
                      {reg.functionCode === 3
                        ? 'FC03 (Holding)'
                        : reg.functionCode === 4
                        ? 'FC04 (Input)'
                        : reg.functionCode === 1
                        ? 'FC01 (Coil)'
                        : 'FC02 (Disc)'}
                    </td>

                    <td className="p-2.5 text-amber-200 bg-slate-950/40 px-2 rounded font-bold">
                      {reg.rawHex || '0x0000'}
                    </td>

                    <td className="p-2.5 text-slate-400">{reg.rawValue ?? 0}</td>

                    <td className="p-2.5 text-emerald-300 font-bold text-sm bg-emerald-950/20 px-2 rounded border border-emerald-900/40">
                      {reg.decodedValue !== undefined ? reg.decodedValue : '-'} {reg.engineeringUnits || ''}
                    </td>

                    {/* Data Type Selector */}
                    <td className="p-2.5">
                      <select
                        value={reg.dataType}
                        onChange={(e) =>
                          updateRegisterConfig(reg.address, reg.functionCode, {
                            dataType: e.target.value as ModbusDataType,
                          })
                        }
                        className="bg-slate-950 border border-slate-700/80 rounded px-1.5 py-0.5 text-[11px] text-slate-200 focus:outline-none"
                      >
                        <option value="INT16">INT16 (Signed)</option>
                        <option value="UINT16">UINT16 (Unsigned)</option>
                        <option value="INT32">INT32 (2 Words)</option>
                        <option value="UINT32">UINT32 (2 Words)</option>
                        <option value="FLOAT32">FLOAT32 (IEEE-754)</option>
                        <option value="FLOAT64">FLOAT64 (4 Words)</option>
                        <option value="HEX">HEX</option>
                        <option value="BINARY">BINARY</option>
                        <option value="ASCII">ASCII</option>
                      </select>
                    </td>

                    {/* Endianness / Byte Order Selector */}
                    <td className="p-2.5">
                      <select
                        value={reg.byteOrder || reg.endian || 'ABCD'}
                        onChange={(e) =>
                          updateRegisterConfig(reg.address, reg.functionCode, {
                            byteOrder: e.target.value as ByteOrder,
                            endian: e.target.value as ByteOrder,
                          })
                        }
                        className="bg-slate-950 border border-slate-700/80 rounded px-1 py-0.5 text-[10px] text-slate-400 focus:outline-none"
                      >
                        <option value="ABCD">ABCD (Big-Endian)</option>
                        <option value="CDAB">CDAB (Word-Swap)</option>
                        <option value="BADC">BADC (Byte-Swap)</option>
                        <option value="DCBA">DCBA (Little-Endian)</option>
                      </select>
                    </td>

                    {/* Bit-Level Inspector button */}
                    <td className="p-2.5 text-center">
                      <button
                        onClick={() => setInspectingRegister(reg)}
                        className="p-1 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-800"
                        title="Open 16-Bit Binary Inspector"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>

                    {/* Safe Write action */}
                    <td className="p-2.5 text-right">
                      {reg.functionCode === ModbusFunctionCode.ReadHoldingRegisters ||
                      reg.functionCode === ModbusFunctionCode.ReadCoils ? (
                        <button
                          onClick={() => openSafeWrite(reg)}
                          disabled={isReadOnly}
                          className={`px-2 py-1 rounded text-[11px] font-bold transition-colors ${
                            isReadOnly
                              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500 hover:text-slate-950'
                          }`}
                          title={isReadOnly ? 'Disabled in Read-Only Safe Mode' : 'Write Register'}
                        >
                          Write
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-600 font-mono">Read-Only</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bit-Level Inspector Drawer / Modal */}
      {inspectingRegister && (
        <div className="bg-slate-900 border border-cyan-500/40 rounded-lg p-4 font-mono text-xs space-y-3 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-slate-100">
                16-Bit Word Inspector: Slave #{inspectingRegister.slaveId} • Addr {inspectingRegister.displayAddress} (
                {inspectingRegister.rawHex || '0x0000'})
              </span>
            </div>
            <button
              onClick={() => setInspectingRegister(null)}
              className="text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-8 sm:grid-cols-16 gap-1 pt-1">
            {Array.from({ length: 16 }).map((_, bitIdx) => {
              const bitNum = 15 - bitIdx;
              const val = inspectingRegister.rawValue ?? 0;
              const isBitSet = ((val >> bitNum) & 1) === 1;

              return (
                <div
                  key={bitNum}
                  className={`p-2 rounded border text-center font-mono ${
                    isBitSet
                      ? 'bg-cyan-950 border-cyan-500 text-cyan-300 font-bold shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                      : 'bg-slate-950 border-slate-800 text-slate-600'
                  }`}
                >
                  <div className="text-[9px] text-slate-400">b{bitNum}</div>
                  <div className="text-sm font-bold mt-0.5">{isBitSet ? '1' : '0'}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
