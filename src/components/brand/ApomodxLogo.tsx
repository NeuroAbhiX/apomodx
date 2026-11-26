/**
 * APOMODX Official Brand Identity & Vector Emblem
 * "Modbus Engineering & Diagnostic Tool"
 */

import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'icon';
  showSubtitle?: boolean;
  showText?: boolean;
  className?: string;
}

export const ApomodxLogo: React.FC<LogoProps> = ({
  size = 'md',
  showSubtitle = true,
  showText = true,
  className = '',
}) => {
  const iconSizes = {
    icon: 24,
    sm: 28,
    md: 36,
    lg: 44,
    xl: 56,
  };

  const px = iconSizes[size] || 36;

  return (
    <div className={`flex items-center gap-3.5 select-none ${className}`}>
      {/* Signature Blue Metallic Emblem */}
      <div
        className="flex items-center justify-center bg-blue-600 rounded text-lg font-extrabold text-white shadow-lg shadow-blue-500/25 shrink-0 border border-blue-400/30"
        style={{ width: px, height: px }}
      >
        <span className="font-mono tracking-tighter">A</span>
      </div>

      {showText && (
        <div className="flex flex-col justify-center leading-none">
          <div className="flex items-center gap-2 font-bold tracking-tight">
            <span className="text-white text-base font-extrabold tracking-tight uppercase">
              APOMODX
            </span>
            <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-600/20 border border-blue-500/40 text-blue-300 font-mono">
              PRO
            </span>
          </div>
          {showSubtitle && (
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-[0.1em] mt-1 whitespace-nowrap">
              Modbus Engineering & Diagnostic Tool
            </span>
          )}
        </div>
      )}
    </div>
  );
};

