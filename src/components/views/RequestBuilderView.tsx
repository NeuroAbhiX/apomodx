/**
 * APOMODX - Manual Request Builder & Hex Frame Constructor
 * Interactive packet crafter with real-time CRC16 generation and direct bus dispatch
 */

import React, { useState } from 'react';
import {
  Cpu,
  Send,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Copy,
  Terminal,
  Zap,
} from 'lucide-react';
import { useModbus } from '../../context/ModbusContext';
import { ModbusFunctionCode } from '../../types/modbus';
import { calculateCRC16, buildModbusRTUFrame, formatHex } from '../../utils/modbusEngine';

export const RequestBuilderView: React.FC = () => {
  const { executeQuery, isReadOnly, addLog } = useModbus();

  const [slaveId, setSlaveId] = useState<number>(1);
  const [functionCode, setFunctionCode] = useState<ModbusFunctionCode>(
    ModbusFunctionCode.ReadHoldingRegisters
  );
  const [startAddress, setStartAddress] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(10);
  const [writeDataValue, setWriteDataValue] = useState<number>(1);
  const [responseOutput, setResponseOutput] = useState<{
    hex: string;
    decoded: string;
    latencyMs: number;
  } | null>(null);
  const [isSending, setIsSending] = useState<boolean>(false);

  // Build live frame
  let pduData: number[] = [];
  if (
    functionCode === ModbusFunctionCode.ReadHoldingRegisters ||
    functionCode === ModbusFunctionCode.ReadInputRegisters ||
    functionCode === ModbusFunctionCode.ReadCoils ||
    functionCode === ModbusFunctionCode.ReadDiscreteInputs
  ) {
    pduData = [
      (startAddress >> 8) & 0xff,
      startAddress & 0xff,
      (quantity >> 8) & 0xff,
      quantity & 0xff,
    ];
  } else if (functionCode === ModbusFunctionCode.WriteSingleCoil) {
    pduData = [
      (startAddress >> 8) & 0xff,
      startAddress & 0xff,
      writeDataValue ? 0xff : 0x00,
      0x00,
    ];
  } else if (functionCode === ModbusFunctionCode.WriteSingleRegister) {
    pduData = [
      (startAddress >> 8) & 0xff,
      startAddress & 0xff,
      (writeDataValue >> 8) & 0xff,
      writeDataValue & 0xff,
    ];
  }

  const fullFrame = buildModbusRTUFrame(slaveId, functionCode, pduData);
  const fullHex = formatHex(fullFrame);
  const crcVal = calculateCRC16(fullFrame.slice(0, -2));
  const crcLo = fullFrame[fullFrame.length - 2];
  const crcHi = fullFrame[fullFrame.length - 1];

  const handleSend = async () => {
    setIsSending(true);
    setResponseOutput(null);
    try {
      const resp = await executeQuery(slaveId, functionCode, startAddress, quantity);
      if (resp) {
        setResponseOutput({
          hex: formatHex(resp.rawResponseBytes),
          decoded: `Success. Received ${resp.data.length} registers.`,
          latencyMs: resp.responseTimeMs,
        });
      } else {
        setResponseOutput({
          hex: 'NO_RESPONSE / TIMEOUT',
          decoded: 'Slave did not reply within configured timeout threshold.',
          latencyMs: 1000,
        });
      }
    } catch (err: any) {
      setResponseOutput({
        hex: 'ERROR',
        decoded: err.message,
        latencyMs: 0,
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-6xl mx-auto overflow-y-auto select-none font-mono">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-400" />
            <span>Manual Request Builder & CRC-16 Constructor</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Construct custom Modbus ADU telegrams with mathematical CRC polynomial breakdown
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-4 text-xs">
          <h3 className="text-xs font-semibold text-slate-200 uppercase">
            Frame Parameters
          </h3>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-400">Slave Address (1-247)</label>
                <input
                  type="number"
                  min={1}
                  max={247}
                  value={slaveId}
                  onChange={(e) => setSlaveId(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">Function Code</label>
                <select
                  value={functionCode}
                  onChange={(e) => setFunctionCode(Number(e.target.value) as ModbusFunctionCode)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100"
                >
                  <option value={ModbusFunctionCode.ReadHoldingRegisters}>FC03 Read Holding Registers</option>
                  <option value={ModbusFunctionCode.ReadInputRegisters}>FC04 Read Input Registers</option>
                  <option value={ModbusFunctionCode.ReadCoils}>FC01 Read Coils</option>
                  <option value={ModbusFunctionCode.ReadDiscreteInputs}>FC02 Read Discrete Inputs</option>
                  <option value={ModbusFunctionCode.WriteSingleRegister}>FC06 Write Single Register</option>
                  <option value={ModbusFunctionCode.WriteSingleCoil}>FC05 Write Single Coil</option>
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
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-bold"
                />
              </div>

              {functionCode === ModbusFunctionCode.WriteSingleRegister ||
              functionCode === ModbusFunctionCode.WriteSingleCoil ? (
                <div className="space-y-1">
                  <label className="text-slate-400">Write Value</label>
                  <input
                    type="number"
                    value={writeDataValue}
                    onChange={(e) => setWriteDataValue(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-amber-300 font-bold"
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-slate-400">Quantity of Registers</label>
                  <input
                    type="number"
                    min={1}
                    max={125}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-bold"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Direct Send Action */}
          <div className="pt-2">
            <button
              onClick={handleSend}
              disabled={isSending}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs shadow-lg transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSending ? 'Transmitting Request...' : 'Transmit Frame to Bus'}</span>
            </button>
          </div>
        </div>

        {/* Right Hex Dissector & Response Output */}
        <div className="space-y-4 text-xs">
          {/* Constructed Frame Breakdown */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 uppercase font-semibold">Constructed Modbus RTU ADU</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(fullHex);
                  addLog('INFO', 'Hex frame copied to clipboard');
                }}
                className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1"
              >
                <Copy className="w-3 h-3" /> Copy Hex
              </button>
            </div>

            <div className="bg-slate-950 p-3 rounded border border-slate-800 text-amber-300 font-bold text-sm tracking-wider break-all">
              {fullHex}
            </div>

            {/* Visual Segments */}
            <div className="grid grid-cols-4 gap-2 pt-1 text-center text-[10px]">
              <div className="bg-slate-950 p-2 rounded border border-slate-850">
                <span className="text-slate-500 block">Slave ID</span>
                <span className="text-amber-400 font-bold text-xs mt-0.5 block">
                  0x{slaveId.toString(16).padStart(2, '0').toUpperCase()}
                </span>
              </div>

              <div className="bg-slate-950 p-2 rounded border border-slate-850">
                <span className="text-slate-500 block">Function</span>
                <span className="text-cyan-300 font-bold text-xs mt-0.5 block">
                  0x0{functionCode}
                </span>
              </div>

              <div className="bg-slate-950 p-2 rounded border border-slate-850">
                <span className="text-slate-500 block">Address/Qty</span>
                <span className="text-slate-200 font-bold text-xs mt-0.5 block">
                  {quantity} Regs
                </span>
              </div>

              <div className="bg-slate-950 p-2 rounded border border-slate-850">
                <span className="text-slate-500 block">CRC-16</span>
                <span className="text-emerald-400 font-bold text-xs mt-0.5 block">
                  0x{crcHi.toString(16).padStart(2, '0').toUpperCase()}{crcLo.toString(16).padStart(2, '0').toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Response Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-2">
            <span className="text-slate-400 uppercase font-semibold block">Bus Response</span>
            {responseOutput ? (
              <div className="space-y-2">
                <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-emerald-300 font-bold break-all">
                  {responseOutput.hex}
                </div>
                <div className="text-[11px] text-slate-400 flex justify-between">
                  <span>{responseOutput.decoded}</span>
                  <span className="text-emerald-400 font-bold">{responseOutput.latencyMs} ms</span>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-slate-500 italic bg-slate-950 rounded border border-slate-850">
                Transmit a frame to view real-time wire response.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
