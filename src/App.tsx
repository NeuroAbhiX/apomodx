/**
 * APOMODX - Modbus Engineering & Diagnostic Tool
 * Single-Page Industrial Engineering Workspace
 */

import React, { useState, useEffect } from 'react';
import { ModbusProvider, useModbus } from './context/ModbusContext';
import { TopMenuBar } from './components/layout/TopMenuBar';
import { ToolBar } from './components/layout/ToolBar';
import { LeftNavigation } from './components/layout/LeftNavigation';
import { BottomTerminal } from './components/layout/BottomTerminal';
import { StatusBar } from './components/layout/StatusBar';

// Views
import { DashboardView } from './components/views/DashboardView';
import { ConnectView } from './components/views/ConnectView';
import { AutoLearnView } from './components/views/AutoLearnView';
import { ScannerView } from './components/views/ScannerView';
import { PollMonitorView } from './components/views/PollMonitorView';
import { RegistersView } from './components/views/RegistersView';
import { DiagnosticsView } from './components/views/DiagnosticsView';
import { EngineerHelperView } from './components/views/EngineerHelperView';
import { DataLoggerView } from './components/views/DataLoggerView';
import { NetworkView } from './components/views/NetworkView';
import { CompareView } from './components/views/CompareView';
import { TrafficReplayView } from './components/views/TrafficReplayView';
import { RequestBuilderView } from './components/views/RequestBuilderView';
import { DeviceProfilesView } from './components/views/DeviceProfilesView';
import { ProjectsView } from './components/views/ProjectsView';
import { SettingsView } from './components/views/SettingsView';

// Modals
import { SafeWriteModal } from './components/modals/SafeWriteModal';
import { DiagnosticReportModal } from './components/modals/DiagnosticReportModal';
import { FirstRunWelcomeModal } from './components/modals/FirstRunWelcomeModal';
import { AboutModal } from './components/modals/AboutModal';
import { ModbusReferenceModal } from './components/modals/ModbusReferenceModal';
import { AddPollGroupModal } from './components/modals/AddPollGroupModal';

import { ModbusRegister } from './types/modbus';

const MainLayout: React.FC = () => {
  const { isPolling, startPolling, stopPolling, saveProjectFile, addLog } = useModbus();

  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  // Modals state
  const [activeModal, setActiveModal] = useState<
    'about' | 'welcome' | 'report' | 'reference' | 'safewrite' | 'addpoll' | null
  >(null);
  const [safeWriteRegister, setSafeWriteRegister] = useState<ModbusRegister | null>(null);

  // Check first run welcome modal
  useEffect(() => {
    const hasVisited = localStorage.getItem('apomodx_visited');
    if (!hasVisited) {
      setActiveModal('welcome');
      localStorage.setItem('apomodx_visited', 'true');
    }
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S -> Save project
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        const json = saveProjectFile();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `APOMODX_Project_${new Date().toISOString().slice(0, 10)}.apx`;
        a.click();
        URL.revokeObjectURL(url);
        addLog('SUCCESS', 'Project saved via Ctrl+S');
      }

      // F1 -> Modbus Reference
      if (e.key === 'F1') {
        e.preventDefault();
        setActiveModal('reference');
      }

      // F5 -> Toggle polling
      if (e.key === 'F5') {
        e.preventDefault();
        if (isPolling) stopPolling();
        else startPolling();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPolling, startPolling, stopPolling, saveProjectFile, addLog]);

  const handleOpenSafeWrite = (reg: ModbusRegister) => {
    setSafeWriteRegister(reg);
    setActiveModal('safewrite');
  };

  const renderCurrentView = () => {
    switch (currentTab) {
      case 'dashboard':
        return (
          <DashboardView
            setCurrentTab={setCurrentTab}
            openModal={(name) => setActiveModal(name)}
          />
        );
      case 'connect':
        return <ConnectView />;
      case 'autolearn':
        return <AutoLearnView />;
      case 'scanner':
        return <ScannerView />;
      case 'pollmonitor':
        return <PollMonitorView openModal={(name) => setActiveModal(name)} />;
      case 'registers':
        return <RegistersView openSafeWrite={handleOpenSafeWrite} />;
      case 'diagnostics':
        return (
          <DiagnosticsView
            openReportModal={() => setActiveModal('report')}
            setCurrentTab={setCurrentTab}
          />
        );
      case 'helper':
        return <EngineerHelperView />;
      case 'logger':
        return <DataLoggerView />;
      case 'network':
        return <NetworkView />;
      case 'compare':
        return <CompareView />;
      case 'replay':
        return <TrafficReplayView />;
      case 'requestbuilder':
        return <RequestBuilderView />;
      case 'profiles':
        return <DeviceProfilesView />;
      case 'projects':
        return <ProjectsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return (
          <DashboardView
            setCurrentTab={setCurrentTab}
            openModal={(name) => setActiveModal(name)}
          />
        );
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden select-none font-sans">
      {/* 1. Classical Desktop Top Menu Bar */}
      <TopMenuBar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        openModal={(name) => setActiveModal(name)}
      />

      {/* 2. Fast Industrial Engineering Toolbar */}
      <ToolBar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        openModal={(name) => setActiveModal(name)}
      />

      {/* 3. Main Center Split: Left Navigation + Active Module View */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        <LeftNavigation
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
        />

        <main className="flex-1 bg-[#0f172a] overflow-y-auto flex flex-col min-h-0">
          {renderCurrentView()}
        </main>
      </div>

      {/* 4. Docked / Collapsible Bottom Command & Error Terminal */}
      <BottomTerminal />

      {/* 5. Industrial Diagnostic Status Bar */}
      <StatusBar />

      {/* Modals */}
      {activeModal === 'safewrite' && (
        <SafeWriteModal
          register={safeWriteRegister}
          onClose={() => {
            setActiveModal(null);
            setSafeWriteRegister(null);
          }}
        />
      )}

      {activeModal === 'report' && (
        <DiagnosticReportModal onClose={() => setActiveModal(null)} />
      )}

      {activeModal === 'welcome' && (
        <FirstRunWelcomeModal
          onClose={() => setActiveModal(null)}
          onSelectAction={(action) => setCurrentTab(action)}
        />
      )}

      {activeModal === 'about' && (
        <AboutModal onClose={() => setActiveModal(null)} />
      )}

      {activeModal === 'reference' && (
        <ModbusReferenceModal onClose={() => setActiveModal(null)} />
      )}

      {activeModal === 'addpoll' && (
        <AddPollGroupModal onClose={() => setActiveModal(null)} />
      )}
    </div>
  );
};

export default function App() {
  return (
    <ModbusProvider>
      <MainLayout />
    </ModbusProvider>
  );
}
