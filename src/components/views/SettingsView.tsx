/**
 * APOMODX - Application Settings View
 */

import React from 'react';
import {
  Settings,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Sliders,
  Layers,
  Database,
  Trash2,
} from 'lucide-react';
import { useModbus } from '../../context/ModbusContext';
import { AddressNotation } from '../../types/modbus';

export const SettingsView: React.FC = () => {
  const {
    expertMode,
    setExpertMode,
    isReadOnly,
    setIsReadOnly,
    addressNotation,
    setAddressNotation,
    serialConfig,
    updateSerialConfig,
    clearLogs,
    addLog,
  } = useModbus();

  return (
    <div className="p-4 space-y-4 max-w-5xl mx-auto overflow-y-auto select-none font-mono text-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-400" />
            <span>Industrial Tool Settings & Preferences</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure safety locks, notation standards, polling limits, and expert diagnostic toggles
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Safety & Read-Only Settings */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-200 font-bold text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Plant Safe-Write Lockout</span>
            </div>
            <button
              onClick={() => setIsReadOnly(!isReadOnly)}
              className={`px-3 py-1 rounded font-bold transition-colors ${
                isReadOnly
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                  : 'bg-amber-950 text-amber-300 border border-amber-700'
              }`}
            >
              {isReadOnly ? 'READ-ONLY (LOCKED)' : 'WRITE ENABLED'}
            </button>
          </div>
          <p className="text-slate-400 leading-relaxed">
            When enabled, blocks all FC05, FC06, FC15, and FC16 write telegrams from being dispatched to the live bus,
            protecting physical machinery, actuators, and PLC coils from accidental commands.
          </p>
        </div>

        {/* Expert Mode */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-200 font-bold text-sm">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Expert / Advanced Mode</span>
            </div>
            <button
              onClick={() => setExpertMode(!expertMode)}
              className={`px-3 py-1 rounded font-bold transition-colors ${
                expertMode
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {expertMode ? '★ EXPERT ACTIVE' : 'STANDARD MODE'}
            </button>
          </div>
          <p className="text-slate-400 leading-relaxed">
            Exposes low-level RS-485 inter-frame timing intervals, byte-swapping matrices, raw protocol dissectors,
            and custom polynomial overrides without cluttering standard commissioning views.
          </p>
        </div>

        {/* Address Notation Standard */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
          <div className="text-slate-200 font-bold text-sm">
            Default Address Display Notation
          </div>
          <p className="text-slate-400 leading-relaxed">
            Select the standard representation matching your PLC/HMI engineering documentation:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {[
              { id: '0-based', label: '0-Based Offset (0..65535)', sub: 'Standard Modbus Protocol' },
              { id: '1-based', label: '1-Based Offset (1..65536)', sub: 'Industrial PLC default' },
              { id: 'modicon-40001', label: 'Modicon 40001 / 30001', sub: 'Traditional PLC 5-digit' },
              { id: 'protocol', label: 'Hex Protocol (0x0000)', sub: 'Wire Octet Hex format' },
            ].map((n) => (
              <div
                key={n.id}
                onClick={() => setAddressNotation(n.id as AddressNotation)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  addressNotation === n.id
                    ? 'bg-amber-500/10 border-amber-500/60 text-slate-100 ring-1 ring-amber-500/30'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-xs text-amber-300">{n.label}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{n.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Clear Data & Reset */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex items-center justify-between">
          <div>
            <div className="text-slate-200 font-bold text-sm">Clear Application Buffer Logs</div>
            <p className="text-slate-400 text-xs mt-0.5">Clears terminal output and traffic capture stream.</p>
          </div>
          <button
            onClick={() => {
              clearLogs();
              addLog('INFO', 'Session log buffer reset.');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-red-950 text-slate-300 hover:text-red-300 border border-slate-700 text-xs font-bold"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Logs</span>
          </button>
        </div>
      </div>
    </div>
  );
};
