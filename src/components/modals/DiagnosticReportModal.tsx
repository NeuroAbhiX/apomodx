/**
 * APOMODX - Diagnostic Report Generation Modal
 * Generates print-ready commissioning reports with full system parameters, slave health, and active registers
 */

import React, { useState, useRef } from 'react';
import {
  FileText,
  X,
  Printer,
  Download,
  Copy,
  CheckCircle2,
  Activity,
  Layers,
} from 'lucide-react';
import { useModbus } from '../../context/ModbusContext';

interface DiagnosticReportModalProps {
  onClose: () => void;
}

export const DiagnosticReportModal: React.FC<DiagnosticReportModalProps> = ({ onClose }) => {
  const {
    protocol,
    serialConfig,
    tcpConfig,
    slaves,
    registers,
    healthMetrics,
    pollGroups,
    addLog,
  } = useModbus();

  const [copied, setCopied] = useState<boolean>(false);
  const printRef = useRef<HTMLDivElement>(null);

  const reportDate = new Date().toLocaleString();

  const reportMarkdown = `
# APOMODX Modbus Commissioning & Diagnostic Report
Generated: ${reportDate}
Tool: APOMODX Engineering Core (v2.4.0)

## 1. Connection Interface
- Protocol: Modbus ${protocol}
- Interface: ${protocol === 'RTU' ? serialConfig.port : `${tcpConfig.host}:${tcpConfig.port}`}
- Parameters: ${protocol === 'RTU' ? `${serialConfig.baudRate || 9600} bps, 8 Data bits, Parity: ${(serialConfig.parity || 'none').toUpperCase()}, Stop bits: ${serialConfig.stopBits || 1}` : `TCP Port ${tcpConfig.port}`}
- Timeout: ${serialConfig.timeoutMs} ms | Retries: ${serialConfig.retryCount}

## 2. Bus Communication Health Summary
- Overall Health Score: ${healthMetrics.healthScorePercent}%
- Total Packets Transmitted: ${healthMetrics.totalRequests}
- Successful Responses: ${healthMetrics.successfulResponses}
- CRC-16 Errors: ${healthMetrics.crcErrorCount}
- Timeouts: ${healthMetrics.timeoutCount}
- Modbus Protocol Exceptions: ${healthMetrics.exceptionCount}
- Average Response Latency: ${healthMetrics.avgResponseTimeMs} ms

## 3. Discovered Field Slave Nodes (${slaves.length})
${slaves.map((s) => `- Slave #${s.slaveId}: ${s.name} | Status: ${(s.status || 'offline').toUpperCase()} | Latency: ${s.avgResponseTimeMs} ms | Packets OK: ${s.successfulRequests}`).join('\n')}

## 4. Active Register Memory Map (${registers.length} addresses)
${registers.slice(0, 30).map((r) => `- Slave #${r.slaveId} | ${r.displayAddress} (FC0${r.functionCode}) | ${r.description || 'Unassigned'} | Live: ${r.decodedValue ?? r.rawHex} ${r.engineeringUnits || ''}`).join('\n')}
`;

  const handlePrint = () => {
    window.print();
    addLog('SUCCESS', 'Diagnostic report opened in print manager');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(reportMarkdown.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    addLog('INFO', 'Diagnostic report copied to clipboard');
  };

  const handleDownload = () => {
    const blob = new Blob([reportMarkdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `APOMODX_Diagnostic_Report_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 select-none font-mono">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-3xl w-full p-5 space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <FileText className="w-5 h-5 text-amber-400" />
            <span>Commissioning & Diagnostic Report</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Report Content Preview Box */}
        <div
          ref={printRef}
          className="flex-1 overflow-y-auto bg-slate-950 p-4 rounded-lg border border-slate-800 text-xs text-slate-300 font-mono space-y-4 select-text"
        >
          <div className="border-b border-slate-800 pb-2">
            <h1 className="text-sm font-bold text-amber-300">
              APOMODX - Modbus Engineering Diagnostic Report
            </h1>
            <div className="text-[11px] text-slate-400">Timestamp: {reportDate}</div>
          </div>

          <div className="space-y-1">
            <h2 className="font-bold text-slate-200 uppercase text-[11px]">1. Connection Profile</h2>
            <div>• Interface: {protocol === 'RTU' ? `${serialConfig.port} (RS-485)` : 'Modbus TCP'}</div>
            <div>• Parameters: {serialConfig.baudRate || 9600} bps, 8-{(serialConfig.parity?.[0] || 'N').toUpperCase()}-{serialConfig.stopBits || 1}</div>
            <div>• Health Score: <strong className="text-emerald-400">{healthMetrics.healthScorePercent}%</strong></div>
          </div>

          <div className="space-y-1">
            <h2 className="font-bold text-slate-200 uppercase text-[11px]">2. Error Distribution</h2>
            <div>• CRC Framing Failures: {healthMetrics.crcErrorCount}</div>
            <div>• Timeouts / No Response: {healthMetrics.timeoutCount}</div>
            <div>• Modbus Exception Codes: {healthMetrics.exceptionCount}</div>
          </div>

          <div className="space-y-1">
            <h2 className="font-bold text-slate-200 uppercase text-[11px]">3. Field Slaves & Status</h2>
            {slaves.map((s) => (
              <div key={s.slaveId} className="text-slate-300">
                • Slave #{s.slaveId}: {s.name} - <span className="text-emerald-400">{(s.status || 'offline').toUpperCase()}</span> ({s.avgResponseTimeMs} ms)
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-3 shrink-0">
          <span className="text-[11px] text-slate-500">
            Professional audit documentation for site acceptance tests (SAT/FAT)
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download (.md)</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print to PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
