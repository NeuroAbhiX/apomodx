/**
 * APOMODX - Bottom Status Bar
 * Industrial diagnostic status line with live LED heartbeat, TX/RX activity, and health indicators
 */

import React, { useState, useEffect } from 'react';
import {
  Activity,
  Cpu,
  ShieldCheck,
  Zap,
  AlertTriangle,
  Clock,
  Radio,
  Server,
  Layers,
} from 'lucide-react';
import { useModbus } from '../../context/ModbusContext';

export const StatusBar: React.FC = () => {
  const {
    connectionState,
    serialConfig,
    protocol,
    selectedSlaveId,
    slaves,
    healthMetrics,
    trafficFrames,
    isPolling,
    isReadOnly,
    expertMode,
  } = useModbus();

  const [txActive, setTxActive] = useState<boolean>(false);
  const [rxActive, setRxActive] = useState<boolean>(false);

  // Trigger optical flash on new frame
  useEffect(() => {
    if (trafficFrames.length > 0) {
      const latest = trafficFrames[0];
      if (latest.direction === 'TX') {
        setTxActive(true);
        const timer = setTimeout(() => setTxActive(false), 120);
        return () => clearTimeout(timer);
      } else if (latest.direction === 'RX') {
        setRxActive(true);
        const timer = setTimeout(() => setRxActive(false), 120);
        return () => clearTimeout(timer);
      }
    }
  }, [trafficFrames]);

  const selectedSlave = slaves.find((s) => s.slaveId === selectedSlaveId) || slaves[0];
  const onlineCount = slaves.filter((s) => s.status === 'online').length;

  return (
    <div className="bg-slate-900 border-t border-slate-800 text-slate-300 text-xs px-4 py-1 flex items-center justify-between font-mono select-none shrink-0 h-6">
      {/* Left: Connection State & Port */}
      <div className="flex items-center gap-3">
        {/* Port Status */}
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              connectionState === 'connected'
                ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                : connectionState === 'connecting'
                ? 'bg-blue-400 animate-pulse'
                : 'bg-red-500'
            }`}
          />
          <span className="font-bold text-slate-100">
            {protocol === 'RTU' ? serialConfig.port : 'Modbus TCP'}
          </span>
          <span className="text-slate-400 text-[11px]">
            {connectionState === 'connected'
              ? `● CONNECTED (${serialConfig.baudRate || 9600}-8-${(serialConfig.parity?.[0] || 'N').toUpperCase()}-${serialConfig.stopBits || 1})`
              : `● ${(connectionState || 'offline').toUpperCase()}`}
          </span>
        </div>

        <div className="h-3 w-[1px] bg-slate-700" />

        {/* Selected Slave Status */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400">Slave {selectedSlave?.slaveId || 1}:</span>
          <span className="text-emerald-400 font-bold">
            {selectedSlave?.status === 'online' ? '● ONLINE' : '○ OFFLINE'}
          </span>
          <span className="text-slate-400 text-[11px]">
            ({selectedSlave?.avgResponseTimeMs || 12}ms)
          </span>
        </div>

        <div className="h-3 w-[1px] bg-slate-700" />

        {/* Online Slaves count */}
        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <Server className="w-3 h-3 text-slate-400" />
          <span>{onlineCount} Slaves Active</span>
        </div>
      </div>

      {/* Right: Health, TX/RX LEDs, Mode */}
      <div className="flex items-center gap-3.5">
        {/* Polling State */}
        <div className="flex items-center gap-1 text-[11px]">
          <span className="text-slate-400">Poll:</span>
          <span className={isPolling ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
            {isPolling ? '500ms' : 'PAUSED'}
          </span>
        </div>

        <div className="h-3 w-[1px] bg-slate-700" />

        {/* Health Score */}
        <div className="flex items-center gap-1.5">
          <Activity className="w-3 h-3 text-blue-400" />
          <span className="text-slate-400">Health:</span>
          <span
            className={`font-bold ${
              healthMetrics.healthScorePercent > 90
                ? 'text-emerald-400'
                : healthMetrics.healthScorePercent > 70
                ? 'text-amber-400'
                : 'text-red-400'
            }`}
          >
            {healthMetrics.healthScorePercent}%
          </span>
        </div>

        <div className="h-3 w-[1px] bg-slate-700" />

        {/* TX LED */}
        <div className="flex items-center gap-1">
          <span
            className={`w-2 h-2 rounded-sm transition-all duration-75 ${
              txActive
                ? 'bg-blue-400 shadow-[0_0_8px_#60a5fa] scale-125'
                : 'bg-slate-800 border border-slate-700 opacity-60'
            }`}
          />
          <span className={`text-[10px] ${txActive ? 'text-blue-300 font-bold' : 'text-slate-400'}`}>
            TX
          </span>
        </div>

        {/* RX LED */}
        <div className="flex items-center gap-1">
          <span
            className={`w-2 h-2 rounded-sm transition-all duration-75 ${
              rxActive
                ? 'bg-emerald-400 shadow-[0_0_8px_#34d399] scale-125'
                : 'bg-slate-800 border border-slate-700 opacity-60'
            }`}
          />
          <span className={`text-[10px] ${rxActive ? 'text-emerald-300 font-bold' : 'text-slate-400'}`}>
            RX
          </span>
        </div>

        <div className="h-3 w-[1px] bg-slate-700" />

        {/* APOMODX Product tag */}
        <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
          <span className="text-blue-400 font-bold">APOMODX</span>
          <span>PRO</span>
        </div>
      </div>
    </div>
  );
};
