/**
 * APOMODX - Device Profiles & Register Map Library View
 * Built-in industrial templates (Schneider, Eurotherm, Danfoss, ADAM) & custom profile creation
 */

import React, { useState } from 'react';
import {
  Layers,
  Cpu,
  Plus,
  Download,
  Upload,
  CheckCircle2,
  BookOpen,
  Search,
} from 'lucide-react';
import { useModbus } from '../../context/ModbusContext';
import { DEVICE_PROFILES } from '../../utils/deviceProfiles';
import { DeviceProfile } from '../../types/modbus';

export const DeviceProfilesView: React.FC = () => {
  const { slaves, addSlave, applyDeviceProfile, addLog } = useModbus();

  const [selectedProfile, setSelectedProfile] = useState<DeviceProfile>(
    DEVICE_PROFILES[0]
  );
  const [targetSlaveId, setTargetSlaveId] = useState<number>(5);

  const handleApplyProfile = () => {
    applyDeviceProfile(targetSlaveId, selectedProfile.id);
  };

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto overflow-y-auto select-none font-mono">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" />
            <span>Device Profiles & Register Map Library</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Pre-defined manufacturer register templates for instant one-click field commissioning
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: List of Profiles */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-2">
          <span className="text-xs text-slate-400 font-bold uppercase block px-1">
            Industrial Device Library ({DEVICE_PROFILES.length})
          </span>

          <div className="space-y-1.5">
            {DEVICE_PROFILES.map((prof) => (
              <div
                key={prof.id}
                onClick={() => setSelectedProfile(prof)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedProfile.id === prof.id
                    ? 'bg-amber-500/10 border-amber-500/60 text-slate-100 ring-1 ring-amber-500/30'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">{prof.name}</span>
                  <span className="text-[10px] text-amber-400 font-bold uppercase">{prof.category}</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">{prof.manufacturer} • {prof.model}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{prof.registers.length} mapped registers</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 2 Columns: Profile Details & Register Map */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-100">{selectedProfile.name}</h3>
              <p className="text-xs text-slate-400">{selectedProfile.description}</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Target Slave ID:</span>
              <input
                type="number"
                min={1}
                max={247}
                value={targetSlaveId}
                onChange={(e) => setTargetSlaveId(Number(e.target.value))}
                className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-amber-300 font-bold"
              />
              <button
                onClick={handleApplyProfile}
                className="px-3 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow"
              >
                Apply to Bus
              </button>
            </div>
          </div>

          {/* Profile Register Map Table */}
          <div className="border border-slate-800 rounded overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase border-b border-slate-800">
                <tr>
                  <th className="p-2.5">Address</th>
                  <th className="p-2.5">Tag Name</th>
                  <th className="p-2.5">Function</th>
                  <th className="p-2.5">Data Type</th>
                  <th className="p-2.5">Scale / Units</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {selectedProfile.registers.map((r, i) => (
                  <tr key={i} className="eng-table-row">
                    <td className="p-2.5 font-bold text-amber-400">{r.address}</td>
                    <td className="p-2.5 text-slate-200">{r.name}</td>
                    <td className="p-2.5 text-cyan-300">FC0{r.functionCode}</td>
                    <td className="p-2.5 text-slate-400">{r.dataType}</td>
                    <td className="p-2.5 text-emerald-300">
                      {r.scale ? `x${r.scale}` : ''} {r.units || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
