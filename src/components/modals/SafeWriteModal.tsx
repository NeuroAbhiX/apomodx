/**
 * APOMODX - Safe-Write Confirmation Modal
 * Strict safety protocol for live PLC register write execution
 */

import React, { useState } from 'react';
import {
  ShieldAlert,
  X,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Zap,
} from 'lucide-react';
import { ModbusRegister } from '../../types/modbus';
import { useModbus } from '../../context/ModbusContext';

interface SafeWriteModalProps {
  register: ModbusRegister | null;
  onClose: () => void;
}

export const SafeWriteModal: React.FC<SafeWriteModalProps> = ({
  register,
  onClose,
}) => {
  const { writeRegister, isReadOnly, addLog } = useModbus();

  const [newValue, setNewValue] = useState<string>(
    register?.decodedValue !== undefined ? String(register.decodedValue) : '0'
  );
  const [confirmed, setConfirmed] = useState<boolean>(false);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);

  if (!register) return null;

  const handleExecuteWrite = async () => {
    if (!confirmed || isReadOnly) return;
    setIsExecuting(true);
    try {
      const numVal = parseFloat(newValue) || 0;
      await writeRegister(register.slaveId, register.address, register.functionCode, numVal);
      addLog(
        'SUCCESS',
        `Safe-Write executed: Slave #${register.slaveId} Addr ${register.displayAddress} = ${numVal}`
      );
      onClose();
    } catch (err: any) {
      addLog('ERROR', `Safe-Write failed: ${err.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 select-none font-mono">
      <div className="bg-slate-900 border border-amber-500/80 rounded-xl max-w-lg w-full p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <ShieldAlert className="w-5 h-5 text-amber-400 animate-pulse" />
            <span>Industrial Safe-Write Authorization</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Safety Warning */}
        <div className="bg-amber-950/40 border border-amber-500/50 rounded-lg p-3 text-xs text-amber-200 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong>CAUTION:</strong> Writing to registers directly alters active PLC memory,
            VFD drive parameters, or physical relay coils on the plant floor.
          </div>
        </div>

        {/* Register Details */}
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">Target Slave Node:</span>
            <span className="text-amber-400 font-bold">Slave #{register.slaveId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Register Address:</span>
            <span className="text-slate-100 font-bold">{register.displayAddress} (Offset {register.address})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Tag Description:</span>
            <span className="text-slate-200">{register.description || 'Unassigned Tag'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Current Live Value:</span>
            <span className="text-emerald-400 font-bold">
              {register.decodedValue ?? 0} {register.engineeringUnits || ''} ({register.rawHex || '0x0000'})
            </span>
          </div>
        </div>

        {/* Input Value */}
        <div className="space-y-1.5 text-xs">
          <label className="text-slate-300 font-bold">New Write Value ({register.dataType}):</label>
          <input
            type="text"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            className="w-full bg-slate-950 border border-amber-500/70 rounded-lg px-3 py-2 text-sm text-amber-300 font-bold focus:outline-none focus:ring-1 focus:ring-amber-400"
          />
        </div>

        {/* Confirmation Checkbox */}
        <div className="flex items-center gap-2 pt-2 text-xs">
          <input
            type="checkbox"
            id="confirmWrite"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-0 cursor-pointer"
          />
          <label htmlFor="confirmWrite" className="text-slate-300 cursor-pointer">
            I confirm this write is verified safe for active machinery
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
          >
            Cancel
          </button>
          <button
            onClick={handleExecuteWrite}
            disabled={!confirmed || isReadOnly || isExecuting}
            className="px-5 py-2 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg disabled:opacity-50 transition-colors"
          >
            {isExecuting ? 'Transmitting Write...' : 'Execute Write to Bus'}
          </button>
        </div>
      </div>
    </div>
  );
};
