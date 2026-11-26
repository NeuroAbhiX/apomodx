/**
 * APOMODX - Product About & Version Modal
 */

import React from 'react';
import { X, ShieldCheck, Cpu, Code2, Globe, Sparkles } from 'lucide-react';
import { ApomodxLogo } from '../brand/ApomodxLogo';

interface AboutModalProps {
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none font-mono">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in duration-150">
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <ApomodxLogo size="lg" showSubtitle={true} />
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs text-slate-300">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Engine Version:</span>
              <span className="text-amber-400 font-bold">APOMODX v2.4.0 (Enterprise)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Protocol Spec:</span>
              <span className="text-slate-200">Modbus Application Protocol v1.1b3</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">CRC Polynomial:</span>
              <span className="text-slate-200">CRC-16-IBM (0xA001 / 0x8005)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Physical Layers:</span>
              <span className="text-slate-200">RS-485, RS-232, Modbus TCP/IP</span>
            </div>
          </div>

          <p className="text-slate-400 leading-relaxed text-[11px]">
            Designed for industrial automation engineers, SCADA integrators, and commissioning technicians.
            Built with zero fluff, mathematical framing precision, passive traffic learning, and deep root-cause diagnostics.
          </p>
        </div>

        <div className="pt-2 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
