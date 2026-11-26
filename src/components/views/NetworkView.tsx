/**
 * APOMODX - Network Topology View
 * Visual RS-485 Daisy-Chain / Modbus TCP topology with node latency, health, and 120Ω termination markers
 */

import React from 'react';
import {
  Network,
  Server,
  Usb,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useModbus } from '../../context/ModbusContext';

export const NetworkView: React.FC = () => {
  const {
    protocol,
    serialConfig,
    tcpConfig,
    slaves,
    registers,
    setSelectedSlaveId,
    selectedSlaveId,
  } = useModbus();

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto overflow-y-auto select-none">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <Network className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-slate-100 font-mono">
              RS-485 Bus Topology & Network Architecture
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Physical daisy-chain diagram, node response latencies, and 120Ω termination resistor placement
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-slate-300 bg-slate-950 px-3 py-1.5 rounded border border-slate-800">
          <span>Topology Type:</span>
          <strong className="text-amber-400">{protocol === 'RTU' ? 'RS-485 2-Wire Daisy Chain' : 'Modbus TCP Star'}</strong>
        </div>
      </div>

      {/* Bus Diagram Canvas */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-6">
        {/* Master Node */}
        <div className="flex items-center justify-center">
          <div className="bg-slate-950 border-2 border-amber-500/80 rounded-xl p-4 w-72 text-center shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <div className="flex items-center justify-center gap-2 text-amber-400 font-mono font-bold text-xs">
              <Usb className="w-4 h-4" />
              <span>APOMODX MASTER CONTROLLER</span>
            </div>
            <div className="text-sm font-bold text-slate-100 font-mono mt-1">
              {protocol === 'RTU' ? serialConfig.port : `${tcpConfig.host}:${tcpConfig.port}`}
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              {protocol === 'RTU'
                ? `${serialConfig.baudRate || 9600} bps • 8-${(serialConfig.parity?.[0] || 'N').toUpperCase()}-${serialConfig.stopBits || 1}`
                : `Modbus TCP Gateway`}
            </div>
          </div>
        </div>

        {/* Bus Backbone Cable Visual */}
        <div className="relative py-4">
          <div className="h-1 bg-amber-500/40 rounded-full w-full relative">
            {/* Start 120 Ohm Terminator */}
            <div className="absolute -left-2 -top-3.5 bg-slate-950 border border-amber-500 px-2 py-0.5 rounded text-[10px] font-mono text-amber-400 font-bold">
              120Ω Term
            </div>

            {/* End 120 Ohm Terminator */}
            <div className="absolute -right-2 -top-3.5 bg-slate-950 border border-amber-500 px-2 py-0.5 rounded text-[10px] font-mono text-amber-400 font-bold">
              120Ω Term
            </div>
          </div>
        </div>

        {/* Slaves Grid attached to the bus */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {slaves.map((slave, index) => {
            const slaveRegs = registers.filter((r) => r.slaveId === slave.slaveId);

            return (
              <div
                key={slave.slaveId}
                onClick={() => setSelectedSlaveId(slave.slaveId)}
                className={`bg-slate-950 border rounded-lg p-4 cursor-pointer transition-all hover:border-amber-500/60 ${
                  selectedSlaveId === slave.slaveId
                    ? 'border-amber-500 bg-slate-900/90 shadow-lg ring-1 ring-amber-500/30'
                    : 'border-slate-800'
                }`}
              >
                {/* Connection Stub */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/30">
                      Slave #{slave.slaveId}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                      slave.status === 'online'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-red-950 text-red-400 border border-red-800'
                    }`}
                  >
                    {slave.status.toUpperCase()}
                  </span>
                </div>

                <div className="my-2.5">
                  <h4 className="text-xs font-bold text-slate-200 truncate">{slave.name}</h4>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    Profile: {slave.profileId || 'Generic RS485'}
                  </p>
                </div>

                <div className="space-y-1 text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-850">
                  <div className="flex justify-between">
                    <span>Turnaround Latency:</span>
                    <span className="text-slate-200 font-bold">{slave.avgResponseTimeMs} ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mapped Registers:</span>
                    <span className="text-cyan-300 font-bold">{slaveRegs.length} Regs</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Packets Received:</span>
                    <span className="text-emerald-400 font-bold">{slave.successfulRequests}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
