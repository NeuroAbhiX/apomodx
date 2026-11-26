/**
 * APOMODX - Modbus Function Code & Exception Reference Modal
 */

import React, { useState } from 'react';
import { BookOpen, X, Layers, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface ModbusReferenceModalProps {
  onClose: () => void;
}

export const ModbusReferenceModal: React.FC<ModbusReferenceModalProps> = ({ onClose }) => {
  const [tab, setTab] = useState<'functions' | 'exceptions'>('functions');

  const functions = [
    { code: '01 (0x01)', name: 'Read Coils', type: 'Bit (0x)', desc: 'Reads 1 to 2000 contiguous status of coils (discrete outputs ON/OFF).' },
    { code: '02 (0x02)', name: 'Read Discrete Inputs', type: 'Bit (1x)', desc: 'Reads 1 to 2000 contiguous status of digital input channels.' },
    { code: '03 (0x03)', name: 'Read Holding Registers', type: 'Word (4x)', desc: 'Reads contents of contiguous block of 16-bit holding registers (R/W).' },
    { code: '04 (0x04)', name: 'Read Input Registers', type: 'Word (3x)', desc: 'Reads contents of contiguous block of 16-bit input registers (Read-Only).' },
    { code: '05 (0x05)', name: 'Write Single Coil', type: 'Bit (0x)', desc: 'Forces a single coil to either ON (0xFF00) or OFF (0x0000).' },
    { code: '06 (0x06)', name: 'Write Single Register', type: 'Word (4x)', desc: 'Writes a single 16-bit holding register value.' },
    { code: '15 (0x0F)', name: 'Write Multiple Coils', type: 'Bit (0x)', desc: 'Forces a sequence of coils to ON or OFF.' },
    { code: '16 (0x10)', name: 'Write Multiple Registers', type: 'Word (4x)', desc: 'Writes values into a contiguous block of 16-bit holding registers.' },
  ];

  const exceptions = [
    { code: '01 (0x01)', name: 'Illegal Function', desc: 'Function code received in query is not an allowable action for the slave (or unsupported).' },
    { code: '02 (0x02)', name: 'Illegal Data Address', desc: 'Data address received is not an allowable address for the slave. Often caused by 0-based vs 1-based offset confusion.' },
    { code: '03 (0x03)', name: 'Illegal Data Value', desc: 'Value contained in query data field is outside allowable limits or requested quantity is too large (max 125 regs).' },
    { code: '04 (0x04)', name: 'Slave Device Failure', desc: 'An unrecoverable error occurred while the slave was attempting to perform requested action.' },
    { code: '05 (0x05)', name: 'Acknowledge', desc: 'Slave accepted invocation and is processing it, but long duration is required.' },
    { code: '06 (0x06)', name: 'Slave Device Busy', desc: 'Slave is engaged in long-duration program command. Master should retransmit later.' },
    { code: '08 (0x08)', name: 'Memory Parity Error', desc: 'Slave attempted to read record but detected parity error in target memory.' },
    { code: '10 (0x0A)', name: 'Gateway Path Unavailable', desc: 'Modbus TCP/RTU gateway path is misconfigured or overloaded.' },
    { code: '11 (0x0B)', name: 'Gateway Target Failed', desc: 'Modbus TCP gateway reached target IP, but serial slave behind gateway did not respond.' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none font-mono">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-3xl w-full p-5 space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <BookOpen className="w-5 h-5" />
            <span>Modbus Protocol Standard Reference</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-950 border border-slate-800 p-0.5 rounded text-xs">
              <button
                onClick={() => setTab('functions')}
                className={`px-3 py-1 rounded transition-colors ${
                  tab === 'functions'
                    ? 'bg-amber-500/20 text-amber-300 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Function Codes
              </button>
              <button
                onClick={() => setTab('exceptions')}
                className={`px-3 py-1 rounded transition-colors ${
                  tab === 'exceptions'
                    ? 'bg-amber-500/20 text-amber-300 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Exception Codes
              </button>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Table */}
        <div className="flex-1 overflow-y-auto border border-slate-800 rounded">
          {tab === 'functions' ? (
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase border-b border-slate-800 sticky top-0">
                <tr>
                  <th className="p-2.5">Code</th>
                  <th className="p-2.5">Function Name</th>
                  <th className="p-2.5">Table Type</th>
                  <th className="p-2.5">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {functions.map((f) => (
                  <tr key={f.code} className="eng-table-row">
                    <td className="p-2.5 font-bold text-amber-400">{f.code}</td>
                    <td className="p-2.5 font-bold text-slate-200">{f.name}</td>
                    <td className="p-2.5 text-cyan-300">{f.type}</td>
                    <td className="p-2.5 text-slate-400 leading-relaxed">{f.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase border-b border-slate-800 sticky top-0">
                <tr>
                  <th className="p-2.5">Code</th>
                  <th className="p-2.5">Exception Name</th>
                  <th className="p-2.5">Engineering Diagnosis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {exceptions.map((e) => (
                  <tr key={e.code} className="eng-table-row">
                    <td className="p-2.5 font-bold text-red-400">{e.code}</td>
                    <td className="p-2.5 font-bold text-slate-200">{e.name}</td>
                    <td className="p-2.5 text-slate-400 leading-relaxed">{e.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
