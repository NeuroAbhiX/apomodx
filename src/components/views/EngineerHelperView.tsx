/**
 * APOMODX - Smart Troubleshooting & Engineer Helper View
 * Rule-based expert system for diagnosing Modbus field failures, off-by-one offsets, and wiring issues
 */

import React, { useState } from 'react';
import {
  Zap,
  HelpCircle,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Sliders,
  Sparkles,
  BookOpen,
  Layers,
} from 'lucide-react';
import { useModbus } from '../../context/ModbusContext';
import {
  TROUBLESHOOTING_RULES,
  diagnoseProblemText,
} from '../../utils/troubleshootingRules';
import { TroubleshootingRule } from '../../types/modbus';

export const EngineerHelperView: React.FC = () => {
  const { slaves, healthMetrics, serialConfig } = useModbus();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [activeRule, setActiveRule] = useState<TroubleshootingRule | null>(
    TROUBLESHOOTING_RULES[0]
  );

  const categories = [
    { id: 'ALL', label: 'All Issues' },
    { id: 'timeout', label: 'Timeouts & Offline' },
    { id: 'crc', label: 'CRC & Framing' },
    { id: 'exception', label: 'Exceptions (0x01/02)' },
    { id: 'data_decoding', label: 'Garbled / Endianness' },
    { id: 'electrical', label: 'RS-485 Electrical & Noise' },
  ];

  const filteredRules = searchQuery.trim()
    ? diagnoseProblemText(searchQuery)
    : selectedCategory === 'ALL'
    ? TROUBLESHOOTING_RULES
    : TROUBLESHOOTING_RULES.filter((r) => r.category === selectedCategory);

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto overflow-y-auto select-none">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-slate-100 font-mono">
              Smart Troubleshooting & Commissioning Assistant
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Instant rule-based diagnostic engine for field engineers: wiring, off-by-one offsets, endianness, and noise
          </p>
        </div>

        {/* Live Context Card */}
        <div className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded font-mono text-xs text-slate-300 flex items-center gap-3">
          <span>Bus Health: <strong className="text-emerald-400">{healthMetrics.healthScorePercent}%</strong></span>
          <span>CRC Errors: <strong className="text-red-400">{healthMetrics.crcErrorCount}</strong></span>
          <span>Timeouts: <strong className="text-amber-400">{healthMetrics.timeoutCount}</strong></span>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-md text-xs font-mono">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setSelectedCategory(c.id);
                setSearchQuery('');
              }}
              className={`px-2.5 py-1 rounded transition-colors ${
                selectedCategory === c.id && !searchQuery
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Describe symptom (e.g. 'Slave 5 timeout' or 'CRC error')..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 w-80 focus:w-96 transition-all focus:outline-none focus:border-amber-500/60 font-mono"
          />
        </div>
      </div>

      {/* Main Troubleshooting Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: List of Matched Issues */}
        <div className="space-y-2">
          <div className="text-xs font-mono text-slate-400 uppercase font-semibold px-1">
            Identified Issue Patterns ({filteredRules.length})
          </div>

          <div className="space-y-2">
            {filteredRules.map((rule) => (
              <div
                key={rule.id}
                onClick={() => setActiveRule(rule)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  activeRule?.id === rule.id
                    ? 'bg-amber-500/10 border-amber-500/60 text-slate-100 ring-1 ring-amber-500/20'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <h4 className="text-xs font-bold font-mono">{rule.title}</h4>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-mono uppercase font-bold ${
                      rule.severity === 'critical'
                        ? 'bg-red-950 text-red-400 border border-red-800'
                        : rule.severity === 'high'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {rule.severity}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                  {rule.symptom}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right 2 Columns: Detailed Step-by-Step Diagnostic Resolution */}
        <div className="lg:col-span-2">
          {activeRule ? (
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4 font-mono">
              <div className="border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-bold uppercase ${
                      activeRule.severity === 'critical'
                        ? 'bg-red-950 text-red-400 border border-red-800'
                        : 'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}
                  >
                    {activeRule.severity} Priority
                  </span>
                  <span className="text-xs text-slate-500 uppercase">Category: {activeRule.category}</span>
                </div>
                <h3 className="text-base font-bold text-slate-100 mt-2">
                  {activeRule.title}
                </h3>
              </div>

              {/* Symptom & Cause */}
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 uppercase font-semibold block mb-1">
                    Observed Symptom:
                  </span>
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-amber-300">
                    {activeRule.symptom}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 uppercase font-semibold block mb-1">
                    Root Cause Analysis:
                  </span>
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-slate-300 leading-relaxed">
                    {activeRule.rootCause}
                  </div>
                </div>
              </div>

              {/* Prioritized Action Checklist */}
              <div className="space-y-2 pt-2">
                <span className="text-xs text-emerald-400 uppercase font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Recommended Step-by-Step Resolution:</span>
                </span>

                <div className="space-y-2">
                  {activeRule.actions.map((action, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-950 border border-slate-850 p-3 rounded-lg flex items-start gap-3 text-xs text-slate-200"
                    >
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-amber-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                        {idx + 1}
                      </span>
                      <div className="leading-relaxed">{action}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pro Tip */}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-xs text-amber-300 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Industrial Commissioning Rule:</strong> Always ensure a single master on RS-485 loops,
                  verify 120Ω termination resistors only at the two extreme physical ends of the cable run, and double-check
                  whether the manufacturer documentation uses 0-based protocol offset vs 1-based (40001) notation.
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 text-center text-slate-500 font-mono">
              Select an issue from the list to view diagnostic steps.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
