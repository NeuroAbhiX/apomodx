/**
 * APOMODX - First Run Commissioning Quick-Start Wizard
 */

import React from 'react';
import {
  Sparkles,
  X,
  Zap,
  Radio,
  Search,
  Activity,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { ApomodxLogo } from '../brand/ApomodxLogo';

interface FirstRunWelcomeModalProps {
  onClose: () => void;
  onSelectAction: (action: string) => void;
}

export const FirstRunWelcomeModal: React.FC<FirstRunWelcomeModalProps> = ({
  onClose,
  onSelectAction,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none font-mono">
      <div className="bg-slate-900 border border-amber-500/70 rounded-xl max-w-xl w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in duration-150">
        {/* Header with Logo */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <ApomodxLogo size="lg" showSubtitle={true} />
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Industrial Modbus RS-485 / TCP Diagnostics, Passive Traffic Learning, and Health Architecture.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Main Commissioning Paths */}
        <div className="space-y-2.5 text-xs">
          <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">
            Choose your workflow:
          </span>

          {/* Path 1: Passive Traffic Sniffing */}
          <div
            onClick={() => {
              onSelectAction('autolearn');
              onClose();
            }}
            className="p-3.5 rounded-lg border border-cyan-500/40 bg-cyan-950/20 hover:bg-cyan-950/40 cursor-pointer transition-all flex items-start gap-3 hover:border-cyan-400"
          >
            <Radio className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-bold text-cyan-300">
                1. Passive Auto-Traffic Learn (Recommended)
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                If an HMI or PLC is already polling on RS-485, APOMODX listens passively, maps all active
                slaves & registers with zero disruption.
              </p>
            </div>
          </div>

          {/* Path 2: Auto Detect Port & Baud */}
          <div
            onClick={() => {
              onSelectAction('connect');
              onClose();
            }}
            className="p-3.5 rounded-lg border border-amber-500/40 bg-amber-950/20 hover:bg-amber-950/40 cursor-pointer transition-all flex items-start gap-3 hover:border-amber-400"
          >
            <Zap className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-bold text-amber-300">
                2. Auto-Detect Serial Parameters
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Automatically test baud rates (9600 to 115200) and parity modes to locate unconfigured slaves.
              </p>
            </div>
          </div>

          {/* Path 3: Bus Scanner */}
          <div
            onClick={() => {
              onSelectAction('scanner');
              onClose();
            }}
            className="p-3.5 rounded-lg border border-indigo-500/40 bg-indigo-950/20 hover:bg-indigo-950/40 cursor-pointer transition-all flex items-start gap-3 hover:border-indigo-400"
          >
            <Search className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-bold text-indigo-300">
                3. Active Modbus Bus Scanner (1-247)
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Sweep all slave addresses (1-247) and discover register blocks across FC01, FC02, FC03, and FC04.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-500">
          <span>Simulation active with 4 multi-slave nodes</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
          >
            Explore Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
