/**
 * APOMODX - Connection & Parameter Detection View
 * Supports Web Serial API, RS485 Transceivers, Auto-Baud Detection, and Modbus TCP
 */

import React, { useState } from 'react';
import {
  Plug,
  Zap,
  Play,
  Square,
  RefreshCw,
  Server,
  Usb,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Clock,
  Shield,
  Download,
} from 'lucide-react';
import { useModbus } from '../../context/ModbusContext';
import { Parity, StopBits, DataBits, ModbusProtocol } from '../../types/modbus';

export const ConnectView: React.FC = () => {
  const {
    protocol,
    setProtocol,
    connectionState,
    serialConfig,
    updateSerialConfig,
    tcpConfig,
    updateTcpConfig,
    connect,
    disconnect,
    runAutoParameterDetection,
    isParameterDetecting,
    paramDetectProgress,
    cachedConfig,
    loadAutoCache,
    saveCurrentAsCache,
    addLog,
  } = useModbus();

  const [availablePorts] = useState<string[]>([
    'COM3 (FTDI USB-to-RS485 Converter)',
    'COM4 (Silicon Labs CP210x USB to UART Bridge)',
    'COM1 (Standard Communications Port)',
    'COM7 (Virtual Serial Port Pair)',
  ]);

  const [isWebSerialSupported] = useState<boolean>(typeof navigator !== 'undefined' && 'serial' in navigator);

  const handleWebSerialConnect = async () => {
    try {
      if ('serial' in navigator) {
        // @ts-ignore
        const port = await (navigator as any).serial.requestPort();
        await port.open({ baudRate: serialConfig.baudRate });
        updateSerialConfig({ port: 'WebSerial (Physical USB-RS485 Dongle)' });
        addLog('SUCCESS', 'Web Serial API connected to physical USB-to-RS485 adapter.');
        connect();
      }
    } catch (err: any) {
      addLog('WARNING', `Web Serial selection cancelled or unavailable: ${err.message}`);
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-6xl mx-auto overflow-y-auto select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-base font-bold text-slate-100 font-mono flex items-center gap-2">
            <Plug className="w-5 h-5 text-amber-400" />
            <span>Connection & Interface Manager</span>
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Configure Serial RS-485 / COM Ports, Modbus TCP sockets, or run Auto Parameter Detection
          </p>
        </div>

        {/* Protocol Selector Tabs */}
        <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-md text-xs font-mono">
          <button
            onClick={() => setProtocol('RTU')}
            className={`px-3 py-1 rounded transition-colors ${
              protocol === 'RTU'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Modbus RTU (Serial / RS-485)
          </button>
          <button
            onClick={() => setProtocol('TCP')}
            className={`px-3 py-1 rounded transition-colors ${
              protocol === 'TCP'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Modbus TCP (Ethernet / IP)
          </button>
        </div>
      </div>

      {/* Auto-Cache Notice (if cache exists) */}
      {cachedConfig && (
        <div className="bg-amber-950/30 border border-amber-500/40 rounded-lg p-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Download className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-amber-300 font-mono">
                Cached Configuration Found from {new Date(cachedConfig.savedAt).toLocaleDateString()}
              </div>
              <div className="text-[11px] text-slate-300 font-mono">
                {cachedConfig.serialConfig?.port || 'COM3'} • {cachedConfig.serialConfig?.baudRate || 9600} bps /{' '}
                {cachedConfig.serialConfig?.parity ? cachedConfig.serialConfig.parity.toUpperCase() : 'NONE'} • {cachedConfig.detectedSlaves?.length || 0} Slaves •{' '}
                {cachedConfig.observedRegistersCount || 0} Registers
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                loadAutoCache();
                connect(true);
              }}
              className="px-3 py-1.5 rounded bg-amber-500 text-slate-950 text-xs font-bold font-mono hover:bg-amber-400 transition-colors shadow"
            >
              [Use Cache & Connect]
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Parameter Auto-Detector & Manual Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column: Auto-Detection & Port Discovery */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200 font-mono uppercase flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Auto Parameter Detection</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Fast Serial Brute-Finder</span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Automatically cycles through standard baud rates (9600, 19200, 38400, 115200) and parity modes
            (None, Even, Odd) to locate active responding slaves on the RS-485 bus.
          </p>

          {/* Test State Feedback */}
          {isParameterDetecting ? (
            <div className="bg-slate-950 border border-amber-500/40 rounded p-3 space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between text-amber-300 font-bold">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  Testing Communication Matrix...
                </span>
                <span>
                  {paramDetectProgress.baud} bps / {(paramDetectProgress.parity || 'none').toUpperCase()} / 1
                </span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-amber-400 h-full w-2/3 animate-pulse" />
              </div>
              <div className="text-[11px] text-slate-400">
                Probing Slave Address #1 with FC03...
              </div>
            </div>
          ) : paramDetectProgress.found ? (
            <div className="bg-emerald-950/40 border border-emerald-500/50 rounded p-3 font-mono text-xs text-emerald-300 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Valid Configuration Discovered!</span>
              </div>
              <div className="text-[11px] text-slate-300">
                Baud: {paramDetectProgress.baud} | Parity: {(paramDetectProgress.parity || 'none').toUpperCase()} | Stop: 1 | Slave: #1 (14 ms)
              </div>
            </div>
          ) : null}

          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={() => runAutoParameterDetection()}
              disabled={isParameterDetecting}
              className="flex items-center gap-1.5 px-4 py-2 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs font-mono transition-colors shadow disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              <span>{isParameterDetecting ? 'Detecting...' : 'Run Auto Parameter Detection'}</span>
            </button>

            {isWebSerialSupported && (
              <button
                onClick={handleWebSerialConnect}
                className="flex items-center gap-1.5 px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-mono"
                title="Connect physical USB serial dongle via Chromium Web Serial API"
              >
                <Usb className="w-3.5 h-3.5 text-cyan-400" />
                <span>Connect Physical USB Port</span>
              </button>
            )}
          </div>

          <div className="border-t border-slate-800 pt-3">
            <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold block mb-1.5">
              Detected COM Ports on Machine:
            </span>
            <div className="space-y-1.5">
              {availablePorts.map((p) => (
                <div
                  key={p}
                  onClick={() => updateSerialConfig({ port: p })}
                  className={`p-2 rounded border text-xs font-mono cursor-pointer flex items-center justify-between transition-colors ${
                    serialConfig.port === p
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 font-bold'
                      : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Usb className="w-3.5 h-3.5 text-slate-500" />
                    <span>{p}</span>
                  </div>
                  {serialConfig.port === p && <span className="text-amber-400 text-[10px]">SELECTED</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Manual Parameter Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200 font-mono uppercase flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span>{protocol === 'RTU' ? 'Serial / RS-485 Parameters' : 'Modbus TCP IP Settings'}</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Manual Expert Setup</span>
          </div>

          {protocol === 'RTU' ? (
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              {/* COM Port */}
              <div className="col-span-2 space-y-1">
                <label className="text-slate-400">COM Port Interface</label>
                <input
                  type="text"
                  value={serialConfig.port}
                  onChange={(e) => updateSerialConfig({ port: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-amber-500/60 font-mono"
                />
              </div>

              {/* Baud Rate */}
              <div className="space-y-1">
                <label className="text-slate-400">Baud Rate (bps)</label>
                <select
                  value={serialConfig.baudRate}
                  onChange={(e) => updateSerialConfig({ baudRate: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-amber-500/60 font-mono"
                >
                  {[1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200, 230400].map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              {/* Parity */}
              <div className="space-y-1">
                <label className="text-slate-400">Parity</label>
                <select
                  value={serialConfig.parity}
                  onChange={(e) => updateSerialConfig({ parity: e.target.value as Parity })}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-amber-500/60 font-mono"
                >
                  <option value="none">None (N)</option>
                  <option value="even">Even (E)</option>
                  <option value="odd">Odd (O)</option>
                  <option value="mark">Mark (M)</option>
                  <option value="space">Space (S)</option>
                </select>
              </div>

              {/* Data Bits */}
              <div className="space-y-1">
                <label className="text-slate-400">Data Bits</label>
                <select
                  value={serialConfig.dataBits}
                  onChange={(e) => updateSerialConfig({ dataBits: Number(e.target.value) as DataBits })}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-amber-500/60 font-mono"
                >
                  <option value={8}>8 Bits (Standard)</option>
                  <option value={7}>7 Bits (ASCII)</option>
                </select>
              </div>

              {/* Stop Bits */}
              <div className="space-y-1">
                <label className="text-slate-400">Stop Bits</label>
                <select
                  value={serialConfig.stopBits}
                  onChange={(e) => updateSerialConfig({ stopBits: Number(e.target.value) as StopBits })}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-amber-500/60 font-mono"
                >
                  <option value={1}>1 Stop Bit</option>
                  <option value={2}>2 Stop Bits</option>
                </select>
              </div>

              {/* Response Timeout */}
              <div className="space-y-1">
                <label className="text-slate-400">Response Timeout (ms)</label>
                <input
                  type="number"
                  value={serialConfig.timeoutMs}
                  onChange={(e) => updateSerialConfig({ timeoutMs: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-amber-500/60 font-mono"
                />
              </div>

              {/* Retry Count */}
              <div className="space-y-1">
                <label className="text-slate-400">Retry Attempts</label>
                <input
                  type="number"
                  value={serialConfig.retryCount}
                  onChange={(e) => updateSerialConfig({ retryCount: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-amber-500/60 font-mono"
                />
              </div>

              {/* Expert Mode Advanced Timing Parameters */}
              <div className="col-span-2 mt-2 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-amber-400/90 uppercase tracking-wider flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" />
                    Advanced RS-485 Bus Timing & Framing
                  </span>
                  <span className="text-[10px] text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                    Modbus Over-the-Wire Standard
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <div className="space-y-1">
                    <label className="text-slate-400">t3.5 Silent (ms)</label>
                    <input
                      type="number"
                      defaultValue={Math.max(2, Math.round((38500 / (serialConfig.baudRate || 9600))))}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400">Turnaround (ms)</label>
                    <input
                      type="number"
                      defaultValue={10}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400">Max Block Qty</label>
                    <input
                      type="number"
                      defaultValue={125}
                      max={125}
                      min={1}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="col-span-2 space-y-1">
                <label className="text-slate-400">Server Host IP / Hostname</label>
                <input
                  type="text"
                  value={tcpConfig.host}
                  onChange={(e) => updateTcpConfig({ host: e.target.value })}
                  placeholder="192.168.1.100"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-amber-500/60 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">TCP Port</label>
                <input
                  type="number"
                  value={tcpConfig.port}
                  onChange={(e) => updateTcpConfig({ port: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-amber-500/60 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">Default Slave Unit ID</label>
                <input
                  type="number"
                  value={tcpConfig.slaveId}
                  onChange={(e) => updateTcpConfig({ slaveId: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-amber-500/60 font-mono"
                />
              </div>

              {/* Expert Mode TCP Parameters */}
              <div className="col-span-2 mt-2 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-amber-400/90 uppercase tracking-wider flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" />
                    TCP MBAP Header & Socket Tuning
                  </span>
                  <span className="text-[10px] text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                    Port 502 MBAP Standard
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="space-y-1">
                    <label className="text-slate-400">Keep-Alive Interval (ms)</label>
                    <input
                      type="number"
                      defaultValue={5000}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400">Transaction ID Rollover</label>
                    <select
                      defaultValue="sequential"
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none"
                    >
                      <option value="sequential">0x0001 - 0xFFFF (Sequential)</option>
                      <option value="random">Randomized Hash</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Connect / Disconnect Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {connectionState === 'connected' ? (
                <button
                  onClick={() => disconnect()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded bg-red-950 border border-red-700 text-red-300 font-bold text-xs font-mono hover:bg-red-900 transition-colors"
                >
                  <Square className="w-3.5 h-3.5 fill-red-400" />
                  <span>Close Connection</span>
                </button>
              ) : (
                <button
                  onClick={() => connect()}
                  className="flex items-center gap-1.5 px-5 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs font-mono transition-colors shadow-lg"
                >
                  <Play className="w-3.5 h-3.5 fill-slate-950" />
                  <span>Open Port & Connect</span>
                </button>
              )}

              <button
                onClick={saveCurrentAsCache}
                className="px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-mono"
                title="Save this configuration into permanent local cache"
              >
                Cache Config
              </button>
            </div>

            <span className="text-[11px] font-mono text-slate-500">
              Turnaround Delay: 10ms
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
