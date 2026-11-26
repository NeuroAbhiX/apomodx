/**
 * APOMODX - Data Logger & Real-Time Trend View
 * Live time-series charts, continuous logging buffer, and CSV/Excel export
 */

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Download,
  Trash2,
  Play,
  Pause,
  Clock,
  Layers,
  Filter,
} from 'lucide-react';
import { useModbus } from '../../context/ModbusContext';

export const DataLoggerView: React.FC = () => {
  const { registers, selectedSlaveId, setSelectedSlaveId, slaves } = useModbus();

  const [selectedRegAddress, setSelectedRegAddress] = useState<number>(0);
  const [history, setHistory] = useState<{ time: string; val: number }[]>([]);
  const [isLogging, setIsLogging] = useState<boolean>(true);
  const [logIntervalSec, setLogIntervalSec] = useState<number>(1);

  const activeSlaveId = selectedSlaveId || 1;
  const currentReg = registers.find((r) => r.slaveId === activeSlaveId && r.address === selectedRegAddress) || registers[0];

  // Capture history data point
  useEffect(() => {
    if (!isLogging || !currentReg || currentReg.decodedValue === undefined) return;

    const interval = setInterval(() => {
      const numVal = typeof currentReg.decodedValue === 'number'
        ? currentReg.decodedValue
        : parseFloat(String(currentReg.decodedValue)) || 0;

      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

      setHistory((prev) => {
        const next = [...prev, { time: timeStr, val: numVal }];
        return next.slice(-40); // keep last 40 points
      });
    }, logIntervalSec * 1000);

    return () => clearInterval(interval);
  }, [isLogging, currentReg, logIntervalSec]);

  const handleExportCsv = () => {
    if (history.length === 0) return;
    const header = 'Timestamp,SlaveId,RegisterAddress,DecodedValue,EngineeringUnits\n';
    const rows = history
      .map(
        (h) =>
          `"${h.time}",${activeSlaveId},${currentReg?.displayAddress || selectedRegAddress},${h.val},"${currentReg?.engineeringUnits || ''}"`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `APOMODX_Log_Slave${activeSlaveId}_Addr${currentReg?.displayAddress || 0}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // SVG Chart calculation
  const values = history.map((h) => h.val);
  const minVal = values.length ? Math.min(...values) : 0;
  const maxVal = values.length ? Math.max(...values) : 100;
  const range = maxVal - minVal || 1;
  const chartHeight = 180;
  const chartWidth = 700;

  const points = history
    .map((h, i) => {
      const x = (i / Math.max(1, history.length - 1)) * chartWidth;
      const y = chartHeight - ((h.val - minVal) / range) * (chartHeight - 30) - 15;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto overflow-y-auto select-none">
      {/* Header Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-slate-100 font-mono">
              Live Data Logger & Real-Time Trend Visualizer
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Log engineering register telemetry, inspect continuous trend curves, and export CSV data
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Pause / Resume */}
          <button
            onClick={() => setIsLogging(!isLogging)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-mono text-xs font-bold transition-colors ${
              isLogging
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                : 'bg-amber-950 text-amber-300 border border-amber-700'
            }`}
          >
            {isLogging ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isLogging ? 'Logging Active' : 'Logging Paused'}</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCsv}
            disabled={history.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-mono text-xs font-semibold disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          {/* Clear Buffer */}
          <button
            onClick={() => setHistory([])}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-red-400 border border-slate-700"
            title="Clear buffer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Target Selector & Live Reading */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Slave:</span>
            <select
              value={activeSlaveId}
              onChange={(e) => setSelectedSlaveId(Number(e.target.value))}
              className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-amber-300 font-bold"
            >
              {slaves.map((s) => (
                <option key={s.slaveId} value={s.slaveId}>
                  #{s.slaveId} - {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Register:</span>
            <select
              value={selectedRegAddress}
              onChange={(e) => {
                setSelectedRegAddress(Number(e.target.value));
                setHistory([]);
              }}
              className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 font-bold"
            >
              {registers
                .filter((r) => r.slaveId === activeSlaveId)
                .map((r) => (
                  <option key={r.address} value={r.address}>
                    {r.displayAddress} - {r.description || `Register ${r.address}`}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Interval:</span>
            <select
              value={logIntervalSec}
              onChange={(e) => setLogIntervalSec(Number(e.target.value))}
              className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200"
            >
              <option value={0.5}>500 ms</option>
              <option value={1}>1.0 sec</option>
              <option value={2}>2.0 sec</option>
              <option value={5}>5.0 sec</option>
            </select>
          </div>
        </div>

        {/* Live Value Card */}
        <div className="flex items-center gap-3 font-mono">
          <div className="text-right">
            <div className="text-[10px] text-slate-500 uppercase">Live Reading</div>
            <div className="text-xl font-bold text-emerald-400">
              {currentReg?.decodedValue ?? 0} {currentReg?.engineeringUnits || ''}
            </div>
          </div>
        </div>
      </div>

      {/* SVG Trend Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-2">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
          <span>
            Telemetry Trend: <strong>{currentReg?.description || `Addr ${currentReg?.displayAddress}`}</strong>
          </span>
          <span>
            Min: <strong className="text-slate-200">{minVal.toFixed(1)}</strong> | Max:{' '}
            <strong className="text-slate-200">{maxVal.toFixed(1)}</strong>
          </span>
        </div>

        <div className="bg-slate-950 border border-slate-850 rounded-lg p-3 overflow-hidden">
          {history.length < 2 ? (
            <div className="h-44 flex items-center justify-center text-slate-600 font-mono text-xs italic">
              Collecting time-series data points...
            </div>
          ) : (
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-44 overflow-visible"
            >
              {/* Grid lines */}
              <line x1="0" y1="20" x2={chartWidth} y2="20" stroke="#1e293b" strokeDasharray="3 3" />
              <line x1="0" y1={chartHeight / 2} x2={chartWidth} y2={chartHeight / 2} stroke="#1e293b" strokeDasharray="3 3" />
              <line x1="0" y1={chartHeight - 20} x2={chartWidth} y2={chartHeight - 20} stroke="#1e293b" strokeDasharray="3 3" />

              {/* Area gradient */}
              <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              <polygon
                points={`0,${chartHeight} ${points} ${chartWidth},${chartHeight}`}
                fill="url(#grad)"
              />

              {/* Trend Polyline */}
              <polyline
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
              />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
};
