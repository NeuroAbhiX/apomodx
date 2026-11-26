/**
 * APOMODX - Add Poll Group Modal
 */

import React, { useState } from 'react';
import { ListTree, X, Plus } from 'lucide-react';
import { useModbus } from '../../context/ModbusContext';
import { ModbusFunctionCode } from '../../types/modbus';

interface AddPollGroupModalProps {
  onClose: () => void;
}

export const AddPollGroupModal: React.FC<AddPollGroupModalProps> = ({ onClose }) => {
  const { slaves, addPollGroup, selectedSlaveId, addLog } = useModbus();

  const [name, setName] = useState<string>('Custom Poll Block');
  const [slaveId, setSlaveId] = useState<number>(selectedSlaveId || 1);
  const [functionCode, setFunctionCode] = useState<ModbusFunctionCode>(
    ModbusFunctionCode.ReadHoldingRegisters
  );
  const [startAddress, setStartAddress] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(10);
  const [intervalMs, setIntervalMs] = useState<number>(1000);
  const [priority, setPriority] = useState<'high' | 'normal' | 'low'>('normal');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addPollGroup({
      name,
      slaveId,
      functionCode,
      startAddress,
      quantity,
      intervalMs,
      priority,
      enabled: true,
    });
    addLog('SUCCESS', `Added new poll group: "${name}" for Slave #${slaveId}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none font-mono">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <ListTree className="w-5 h-5" />
            <span>Add Continuous Poll Group</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div className="space-y-1">
            <label className="text-slate-400">Group Name Description</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-400">Target Slave</label>
              <select
                value={slaveId}
                onChange={(e) => setSlaveId(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-amber-300 font-bold"
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
                value={functionCode}
                onChange={(e) => setFunctionCode(Number(e.target.value) as ModbusFunctionCode)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100"
              >
                <option value={ModbusFunctionCode.ReadHoldingRegisters}>FC03 Holding (4x)</option>
                <option value={ModbusFunctionCode.ReadInputRegisters}>FC04 Input (3x)</option>
                <option value={ModbusFunctionCode.ReadCoils}>FC01 Coils (0x)</option>
                <option value={ModbusFunctionCode.ReadDiscreteInputs}>FC02 Discrete (1x)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-400">Start Address (Offset)</label>
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
              <label className="text-slate-400">Quantity (Max 125)</label>
              <input
                type="number"
                min={1}
                max={125}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-400">Scan Interval (ms)</label>
              <input
                type="number"
                min={100}
                max={60000}
                step={100}
                value={intervalMs}
                onChange={(e) => setIntervalMs(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-400">Priority Class</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100"
              >
                <option value="high">High (Alarms / Critical)</option>
                <option value="normal">Normal (Process / Power)</option>
                <option value="low">Low (Diagnostics / Stats)</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold shadow"
            >
              Create Poll Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
