/**
 * APOMODX - Project Management & Workspace Backups View
 */

import React, { useRef } from 'react';
import {
  FolderOpen,
  Save,
  Download,
  Upload,
  FilePlus,
  Layers,
  FileText,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { useModbus } from '../../context/ModbusContext';

export const ProjectsView: React.FC = () => {
  const {
    saveProjectFile,
    loadProjectFile,
    saveCurrentAsCache,
    loadAutoCache,
    cachedConfig,
    slaves,
    registers,
    pollGroups,
    addLog,
  } = useModbus();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const json = saveProjectFile();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `APOMODX_Project_${new Date().toISOString().slice(0, 10)}.apx`;
    a.click();
    URL.revokeObjectURL(url);
    addLog('SUCCESS', 'Project file exported successfully (.apx)');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        loadProjectFile(text);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-6xl mx-auto overflow-y-auto select-none font-mono">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportFile}
        accept=".apx,.json"
        className="hidden"
      />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-amber-400" />
            <span>Project Management & Workspace Backups (.apx)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Export complete plant configurations, register maps, poll groups, and offline cache
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Export / Save Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4 text-xs">
          <div className="flex items-center gap-2 text-slate-200 font-bold text-sm">
            <Save className="w-4 h-4 text-emerald-400" />
            <span>Save & Export Project Workspace</span>
          </div>

          <p className="text-slate-400 leading-relaxed">
            Saves your entire commissioning workspace including all {slaves.length} field slaves, {registers.length} mapped
            registers, {pollGroups.length} continuous poll schedules, and device definitions into a single portable `.apx` file.
          </p>

          <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-1 text-slate-300">
            <div>Active Slaves: {slaves.length} Nodes</div>
            <div>Mapped Registers: {registers.length} Addresses</div>
            <div>Poll Groups: {pollGroups.length} Continuous Groups</div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow"
            >
              <Download className="w-4 h-4" />
              <span>Download Project File (.apx)</span>
            </button>
          </div>
        </div>

        {/* Import Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4 text-xs">
          <div className="flex items-center gap-2 text-slate-200 font-bold text-sm">
            <Upload className="w-4 h-4 text-cyan-400" />
            <span>Open & Restore Existing Project</span>
          </div>

          <p className="text-slate-400 leading-relaxed">
            Load previously saved project files (.apx or .json) to instantly restore COM port configurations,
            slave addresses, custom register descriptions, and scaling factors.
          </p>

          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs"
            >
              <FolderOpen className="w-4 h-4" />
              <span>Select File from Disk...</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
