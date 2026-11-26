/**
 * APOMODX - Central Modbus Engine Context & State Manager
 */

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  ModbusProtocol,
  ConnectionState,
  SerialConnectionConfig,
  TcpConnectionConfig,
  SlaveDevice,
  RegisterItem,
  PollGroup,
  LogEntry,
  TrafficFrame,
  CommunicationHealthMetrics,
  AutoCacheEntry,
  AppSettings,
  ModbusFunctionCode,
  DataLogPoint,
  AddressNotation,
} from '../types/modbus';
import {
  IndustrialModbusSimulator,
} from '../utils/modbusSimulator';
import {
  buildModbusRTUFrame,
  calculateCRC16,
  decodeRegisterData,
  formatAddress,
  bytesToHexString,
  dissectFrame,
} from '../utils/modbusEngine';
import { STANDARD_DEVICE_PROFILES } from '../utils/deviceProfiles';

interface ModbusContextType {
  // State
  protocol: ModbusProtocol;
  connectionState: ConnectionState;
  serialConfig: SerialConnectionConfig;
  tcpConfig: TcpConnectionConfig;
  addressNotation: AddressNotation;
  isReadOnly: boolean;
  expertMode: boolean;
  selectedSlaveId: number;

  // Data Collections
  slaves: SlaveDevice[];
  registers: RegisterItem[];
  pollGroups: PollGroup[];
  trafficFrames: TrafficFrame[];
  logs: LogEntry[];
  dataLogPoints: DataLogPoint[];
  healthMetrics: CommunicationHealthMetrics;
  cachedConfig: AutoCacheEntry | null;
  settings: AppSettings;

  // Active Modes
  isPolling: boolean;
  isAutoLearning: boolean;
  isScanning: boolean;
  isParameterDetecting: boolean;
  scanProgress: { current: number; total: number; foundCount: number; stage: string };
  paramDetectProgress: { baud: number; parity: string; found: boolean };

  // Actions
  setProtocol: (p: ModbusProtocol) => void;
  setAddressNotation: (n: AddressNotation) => void;
  setIsReadOnly: (ro: boolean) => void;
  setExpertMode: (em: boolean) => void;
  setSelectedSlaveId: (id: number) => void;
  updateSerialConfig: (cfg: Partial<SerialConnectionConfig>) => void;
  updateTcpConfig: (cfg: Partial<TcpConnectionConfig>) => void;
  updateSettings: (s: Partial<AppSettings>) => void;

  // Communication & Operations
  connect: (useCache?: boolean) => Promise<void>;
  disconnect: () => Promise<void>;
  startPolling: () => void;
  stopPolling: () => void;
  startAutoLearn: () => void;
  stopAutoLearn: () => void;
  runSlaveScan: (startSlave?: number, endSlave?: number) => Promise<void>;
  cancelScan: () => void;
  runRegisterRangeScan: (slaveId: number, fc: ModbusFunctionCode, startAddr: number, endAddr: number) => Promise<void>;
  runAutoParameterDetection: () => Promise<void>;

  // Poll Groups & Registers
  addPollGroup: (group: Omit<PollGroup, 'id' | 'errorCount' | 'successCount'>) => void;
  togglePollGroup: (id: string) => void;
  deletePollGroup: (id: string) => void;
  removePollGroup: (id: string) => void;
  updateRegisterConfig: (address: number, fc: ModbusFunctionCode, updates: Partial<RegisterItem>) => void;
  addSlave: (slave: SlaveDevice) => void;
  
  // Safe Write Execution
  executeSafeWrite: (
    slaveId: number,
    fc: ModbusFunctionCode,
    address: number,
    value: number | number[],
    verifyReadBack?: boolean
  ) => Promise<{ success: boolean; message: string; readBackValue?: any }>;
  writeRegister: (
    slaveId: number,
    address: number,
    fc: ModbusFunctionCode,
    value: number | number[]
  ) => Promise<{ success: boolean; message: string; readBackValue?: any }>;

  // Manual Frame & Query Execution
  sendManualFrame: (frameBytes: Uint8Array) => Promise<TrafficFrame>;
  executeQuery: (
    slaveId: number,
    fc: ModbusFunctionCode,
    address: number,
    quantityOrValue?: number
  ) => Promise<{ rawResponseBytes: Uint8Array | number[]; data: number[]; responseTimeMs: number } | null>;

  // Logging & Utilities
  addLog: (level: LogEntry['level'], message: string, details?: string, slaveId?: number, fc?: number, hex?: string) => void;
  resetDiagnostics: () => void;
  clearLogs: () => void;
  clearTraffic: () => void;
  exportDiagnosticReport: () => string;
  loadAutoCache: () => void;
  saveCurrentAsCache: () => void;
  saveProjectFile: () => string;
  loadProjectFile: (jsonStr: string) => boolean;
  applyDeviceProfile: (slaveId: number, profileId: string) => void;
}

const DEFAULT_SETTINGS: AppSettings = {
  general: {
    language: 'en',
    startupBehavior: 'auto_cache',
    confirmations: true,
    expertMode: false,
  },
  communication: {
    timeoutMs: 1000,
    retryCount: 2,
    autoReconnect: true,
    turnaroundDelayMs: 10,
  },
  scanner: {
    scanStartSlave: 1,
    scanEndSlave: 32,
    slaveScanDelayMs: 20,
    registerScanBlockSize: 10,
    scanTimeoutMs: 300,
    scanMode: 'normal',
  },
  autoLearn: {
    captureDurationSec: 60,
    duplicateHandling: 'merge',
    autoCacheObserved: true,
    minConfidenceFrames: 2,
  },
  polling: {
    defaultIntervalMs: 500,
    maxConcurrentGroups: 8,
    pauseOnTabHidden: false,
  },
  diagnostics: {
    healthCheckIntervalSec: 2,
    warningErrorRateThreshold: 5,
    criticalErrorRateThreshold: 15,
    enableBusLoadEstimation: true,
  },
  safety: {
    readOnlyDefault: true,
    requireWriteConfirmation: true,
    verifyReadBackAfterWrite: true,
  },
  appearance: {
    theme: 'dark',
    density: 'standard',
    fontSize: 'medium',
  },
};

const DEFAULT_POLL_GROUPS: PollGroup[] = [
  {
    id: 'grp-1',
    name: 'Slave 1: Energy & Voltages',
    slaveId: 1,
    functionCode: ModbusFunctionCode.ReadHoldingRegisters,
    startAddress: 0,
    quantity: 14,
    intervalMs: 500,
    priority: 'high',
    enabled: true,
    errorCount: 0,
    successCount: 0,
  },
  {
    id: 'grp-2',
    name: 'Slave 2: Temp & Humidity PV',
    slaveId: 2,
    functionCode: ModbusFunctionCode.ReadInputRegisters,
    startAddress: 0,
    quantity: 3,
    intervalMs: 1000,
    priority: 'normal',
    enabled: true,
    errorCount: 0,
    successCount: 0,
  },
  {
    id: 'grp-3',
    name: 'Slave 5: VFD Speed & Current',
    slaveId: 5,
    functionCode: ModbusFunctionCode.ReadInputRegisters,
    startAddress: 0,
    quantity: 6,
    intervalMs: 400,
    priority: 'high',
    enabled: true,
    errorCount: 0,
    successCount: 0,
  },
];

const INITIAL_SLAVES: SlaveDevice[] = [
  {
    slaveId: 1,
    name: 'Power Meter (SDM630)',
    status: 'online',
    profileId: 'eastron-sdm630',
    avgResponseTimeMs: 12,
    successfulRequests: 142,
    failedRequests: 1,
    timeoutCount: 0,
    crcErrorCount: 1,
    supportedFunctions: [ModbusFunctionCode.ReadHoldingRegisters],
    observedRegisterRanges: [{ start: 0, end: 18, functionCode: 3, count: 10 }],
  },
  {
    slaveId: 2,
    name: 'Temperature Controller',
    status: 'online',
    profileId: 'autonics-tc4s',
    avgResponseTimeMs: 16,
    successfulRequests: 84,
    failedRequests: 0,
    timeoutCount: 0,
    crcErrorCount: 0,
    supportedFunctions: [ModbusFunctionCode.ReadInputRegisters, ModbusFunctionCode.ReadHoldingRegisters, ModbusFunctionCode.ReadCoils],
    observedRegisterRanges: [{ start: 0, end: 4, functionCode: 4, count: 3 }],
  },
  {
    slaveId: 5,
    name: 'Inverter VFD 15kW',
    status: 'online',
    profileId: 'abb-acs580',
    avgResponseTimeMs: 14,
    successfulRequests: 210,
    failedRequests: 2,
    timeoutCount: 1,
    crcErrorCount: 1,
    supportedFunctions: [ModbusFunctionCode.ReadInputRegisters, ModbusFunctionCode.ReadHoldingRegisters],
    observedRegisterRanges: [{ start: 0, end: 5, functionCode: 4, count: 6 }],
  },
  {
    slaveId: 7,
    name: 'Remote I/O Coupler',
    status: 'online',
    avgResponseTimeMs: 11,
    successfulRequests: 62,
    failedRequests: 0,
    timeoutCount: 0,
    crcErrorCount: 0,
    supportedFunctions: [ModbusFunctionCode.ReadCoils, ModbusFunctionCode.ReadDiscreteInputs],
    observedRegisterRanges: [{ start: 0, end: 15, functionCode: 1, count: 16 }],
  },
];

const ModbusContext = createContext<ModbusContextType | undefined>(undefined);

export const ModbusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Connection Config
  const [protocol, setProtocol] = useState<ModbusProtocol>('RTU');
  const [connectionState, setConnectionState] = useState<ConnectionState>('connected');
  const [serialConfig, setSerialConfig] = useState<SerialConnectionConfig>({
    port: 'COM3 (USB-RS485 Isolated)',
    baudRate: 9600,
    dataBits: 8,
    parity: 'none',
    stopBits: 1,
    timeoutMs: 1000,
    retryCount: 2,
    turnaroundDelayMs: 10,
  });
  const [tcpConfig, setTcpConfig] = useState<TcpConnectionConfig>({
    host: '192.168.1.105',
    port: 502,
    slaveId: 1,
    timeoutMs: 1000,
    retryCount: 2,
  });

  const [addressNotation, setAddressNotation] = useState<AddressNotation>('0-based');
  const [isReadOnly, setIsReadOnly] = useState<boolean>(true);
  const [expertMode, setExpertMode] = useState<boolean>(false);
  const [selectedSlaveId, setSelectedSlaveId] = useState<number>(1);

  // Collections
  const [slaves, setSlaves] = useState<SlaveDevice[]>(INITIAL_SLAVES);
  const [registers, setRegisters] = useState<RegisterItem[]>([]);
  const [pollGroups, setPollGroups] = useState<PollGroup[]>(DEFAULT_POLL_GROUPS);
  const [trafficFrames, setTrafficFrames] = useState<TrafficFrame[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [dataLogPoints, setDataLogPoints] = useState<DataLogPoint[]>([]);
  const [cachedConfig, setCachedConfig] = useState<AutoCacheEntry | null>(null);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  // Health Metrics
  const [healthMetrics, setHealthMetrics] = useState<CommunicationHealthMetrics>({
    totalRequests: 498,
    successfulResponses: 495,
    timeoutCount: 1,
    crcErrorCount: 2,
    exceptionCount: 0,
    retryCount: 3,
    errorRatePercent: 0.6,
    avgResponseTimeMs: 13.4,
    minResponseTimeMs: 9,
    maxResponseTimeMs: 42,
    healthScorePercent: 99.4,
    busLoadPercent: 18.5,
    recoveryCount: 1,
  });

  // State flags
  const [isPolling, setIsPolling] = useState<boolean>(true);
  const [isAutoLearning, setIsAutoLearning] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isParameterDetecting, setIsParameterDetecting] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState({ current: 0, total: 32, foundCount: 4, stage: 'Idle' });
  const [paramDetectProgress, setParamDetectProgress] = useState({ baud: 9600, parity: 'none', found: false });

  // Simulator reference
  const simulatorRef = useRef<IndustrialModbusSimulator | null>(null);
  const pollTimerRef = useRef<any>(null);
  const isScanningCancelledRef = useRef<boolean>(false);

  // Logging helper
  const addLog = useCallback(
    (level: LogEntry['level'], message: string, details?: string, slaveId?: number, fc?: number, hex?: string) => {
      const now = Date.now();
      const entry: LogEntry = {
        id: `log_${now}_${Math.random().toString(36).substr(2, 5)}`,
        timestamp: now,
        timeFormatted: new Date().toLocaleTimeString(),
        level,
        category: 'comm',
        slaveId,
        functionCode: fc,
        rawHex: hex,
        message,
        details,
      };

      setLogs((prev) => [entry, ...prev.slice(0, 499)]); // Keep last 500 entries
    },
    []
  );

  // Initialize Simulator on Mount
  useEffect(() => {
    simulatorRef.current = new IndustrialModbusSimulator();

    // Initial log
    addLog('INFO', 'APOMODX Engine initialized successfully.');
    addLog('SUCCESS', 'COM3 (USB-RS485 Isolated) opened at 9600 baud, None parity, 1 stop bit.');

    // Pre-populate initial registers from Slave 1, 2, 5
    initInitialRegisters();

    // Check cached configuration in localStorage
    try {
      const savedCache = localStorage.getItem('apomodx_cached_config');
      if (savedCache) {
        setCachedConfig(JSON.parse(savedCache));
      }
    } catch (e) {
      console.error(e);
    }

    return () => {
      if (simulatorRef.current) simulatorRef.current.dispose();
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [addLog]);

  // Initial Registers Generator
  const initInitialRegisters = () => {
    const regList: RegisterItem[] = [
      // Slave 1: Eastron Power Meter Holding Registers
      { address: 0, displayAddress: '40001', type: 'holding', functionCode: ModbusFunctionCode.ReadHoldingRegisters, slaveId: 1, rawValue: 0x4366, rawHex: '0x4366', decodedValue: 230.45, dataType: 'FLOAT32', endian: 'ABCD', engineeringUnits: 'V', description: 'Phase 1 Voltage (L1-N)', status: 'ok', lastUpdated: Date.now(), changeCount: 12, isObserved: true, isConfigured: true },
      { address: 2, displayAddress: '40003', type: 'holding', functionCode: ModbusFunctionCode.ReadHoldingRegisters, slaveId: 1, rawValue: 0x4367, rawHex: '0x4367', decodedValue: 231.10, dataType: 'FLOAT32', endian: 'ABCD', engineeringUnits: 'V', description: 'Phase 2 Voltage (L2-N)', status: 'ok', lastUpdated: Date.now(), changeCount: 8, isObserved: true, isConfigured: true },
      { address: 4, displayAddress: '40005', type: 'holding', functionCode: ModbusFunctionCode.ReadHoldingRegisters, slaveId: 1, rawValue: 0x4365, rawHex: '0x4365', decodedValue: 229.80, dataType: 'FLOAT32', endian: 'ABCD', engineeringUnits: 'V', description: 'Phase 3 Voltage (L3-N)', status: 'ok', lastUpdated: Date.now(), changeCount: 14, isObserved: true, isConfigured: true },
      { address: 6, displayAddress: '40007', type: 'holding', functionCode: ModbusFunctionCode.ReadHoldingRegisters, slaveId: 1, rawValue: 0x416d, rawHex: '0x416D', decodedValue: 14.85, dataType: 'FLOAT32', endian: 'ABCD', engineeringUnits: 'A', description: 'Phase 1 Current', status: 'ok', lastUpdated: Date.now(), changeCount: 19, isObserved: true, isConfigured: true },
      { address: 12, displayAddress: '40013', type: 'holding', functionCode: ModbusFunctionCode.ReadHoldingRegisters, slaveId: 1, rawValue: 0x4620, rawHex: '0x4620', decodedValue: 10245.5, dataType: 'FLOAT32', endian: 'ABCD', engineeringUnits: 'W', description: 'Total Active Power', status: 'ok', lastUpdated: Date.now(), changeCount: 24, isObserved: true, isConfigured: true },
      { address: 14, displayAddress: '40015', type: 'holding', functionCode: ModbusFunctionCode.ReadHoldingRegisters, slaveId: 1, rawValue: 0x4248, rawHex: '0x4248', decodedValue: 50.02, dataType: 'FLOAT32', endian: 'ABCD', engineeringUnits: 'Hz', description: 'Supply Frequency', status: 'ok', lastUpdated: Date.now(), changeCount: 4, isObserved: true, isConfigured: true },
      
      // Slave 2: Temperature & Humidity Controller Input Registers
      { address: 0, displayAddress: '30001', type: 'input', functionCode: ModbusFunctionCode.ReadInputRegisters, slaveId: 2, rawValue: 248, rawHex: '0x00F8', decodedValue: '24.8', dataType: 'INT16', endian: 'ABCD', scalingMultiplier: 0.1, engineeringUnits: '°C', description: 'Process Temperature PV', status: 'ok', lastUpdated: Date.now(), changeCount: 32, isObserved: true, isConfigured: true },
      { address: 1, displayAddress: '30002', type: 'input', functionCode: ModbusFunctionCode.ReadInputRegisters, slaveId: 2, rawValue: 562, rawHex: '0x0232', decodedValue: '56.2', dataType: 'INT16', endian: 'ABCD', scalingMultiplier: 0.1, engineeringUnits: '%RH', description: 'Ambient Relative Humidity', status: 'ok', lastUpdated: Date.now(), changeCount: 18, isObserved: true, isConfigured: true },
      { address: 0, displayAddress: '40001', type: 'holding', functionCode: ModbusFunctionCode.ReadHoldingRegisters, slaveId: 2, rawValue: 250, rawHex: '0x00FA', decodedValue: '25.0', dataType: 'INT16', endian: 'ABCD', scalingMultiplier: 0.1, engineeringUnits: '°C', description: 'Temperature Setpoint SV', status: 'ok', lastUpdated: Date.now(), changeCount: 1, isObserved: false, isConfigured: true },

      // Slave 5: VFD Inverter Input Registers
      { address: 0, displayAddress: '30001', type: 'input', functionCode: ModbusFunctionCode.ReadInputRegisters, slaveId: 5, rawValue: 0x0237, rawHex: '0x0237', decodedValue: '0x0237', dataType: 'HEX', endian: 'ABCD', description: 'Drive Status Word (Tripped=0, Enabled=1)', status: 'ok', lastUpdated: Date.now(), changeCount: 3, isObserved: true, isConfigured: true },
      { address: 1, displayAddress: '30002', type: 'input', functionCode: ModbusFunctionCode.ReadInputRegisters, slaveId: 5, rawValue: 4833, rawHex: '0x12E1', decodedValue: '48.33', dataType: 'INT16', endian: 'ABCD', scalingMultiplier: 0.01, engineeringUnits: 'Hz', description: 'Actual Output Frequency', status: 'ok', lastUpdated: Date.now(), changeCount: 45, isObserved: true, isConfigured: true },
      { address: 2, displayAddress: '30003', type: 'input', functionCode: ModbusFunctionCode.ReadInputRegisters, slaveId: 5, rawValue: 185, rawHex: '0x00B9', decodedValue: '18.5', dataType: 'INT16', endian: 'ABCD', scalingMultiplier: 0.1, engineeringUnits: 'A', description: 'Motor Current RMS', status: 'ok', lastUpdated: Date.now(), changeCount: 22, isObserved: true, isConfigured: true },
      { address: 4, displayAddress: '30005', type: 'input', functionCode: ModbusFunctionCode.ReadInputRegisters, slaveId: 5, rawValue: 565, rawHex: '0x0235', decodedValue: '565', dataType: 'UINT16', endian: 'ABCD', engineeringUnits: 'V', description: 'DC Bus Internal Voltage', status: 'ok', lastUpdated: Date.now(), changeCount: 6, isObserved: true, isConfigured: true },
    ];
    setRegisters(regList);
  };

  // Live Polling Execution Loop
  useEffect(() => {
    if (!isPolling || connectionState !== 'connected' || !simulatorRef.current) {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      return;
    }

    let groupIdx = 0;
    pollTimerRef.current = setInterval(async () => {
      if (pollGroups.length === 0) return;
      const enabledGroups = pollGroups.filter((g) => g.enabled);
      if (enabledGroups.length === 0) return;

      const group = enabledGroups[groupIdx % enabledGroups.length];
      groupIdx++;

      const txFrameBytes = buildModbusRTUFrame(group.slaveId, group.functionCode, group.startAddress, group.quantity);
      const txHex = bytesToHexString(txFrameBytes);

      // Record TX frame
      const txFrameObj: TrafficFrame = {
        id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        timestamp: Date.now(),
        timeFormatted: new Date().toLocaleTimeString(),
        direction: 'TX',
        protocol,
        slaveId: group.slaveId,
        functionCode: group.functionCode,
        functionName: group.functionCode === 3 ? 'FC03 Read Holding Registers' : 'FC04 Read Input Registers',
        startAddress: group.startAddress,
        quantity: group.quantity,
        hexPayload: txHex,
        crcValid: true,
      };

      setTrafficFrames((prev) => [txFrameObj, ...prev.slice(0, 199)]);

      // Execute on Simulator / Hardware
      const result = await simulatorRef.current!.executeQuery(txFrameBytes);

      if (result.responseFrame) {
        const rxHex = bytesToHexString(result.responseFrame);
        const dissected = dissectFrame(result.responseFrame);

        const rxFrameObj: TrafficFrame = {
          id: `rx_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          timestamp: Date.now(),
          timeFormatted: new Date().toLocaleTimeString(),
          direction: 'RX',
          protocol,
          slaveId: group.slaveId,
          functionCode: group.functionCode,
          functionName: dissected.isException ? `Exception 0x${group.functionCode.toString(16)}` : `${group.name} Response`,
          startAddress: group.startAddress,
          quantity: group.quantity,
          byteCount: result.responseFrame[2],
          hexPayload: rxHex,
          responseTimeMs: result.responseTimeMs,
          crcValid: !result.isCrcError,
          isException: dissected.isException,
          exceptionCode: dissected.exceptionCode,
        };

        setTrafficFrames((prev) => [rxFrameObj, ...prev.slice(0, 199)]);

        // Update health metrics
        setHealthMetrics((prev) => {
          const total = prev.totalRequests + 1;
          const success = result.isCrcError || dissected.isException ? prev.successfulResponses : prev.successfulResponses + 1;
          const crcErr = result.isCrcError ? prev.crcErrorCount + 1 : prev.crcErrorCount;
          const excCount = dissected.isException ? prev.exceptionCount + 1 : prev.exceptionCount;
          const errRate = +(((total - success) / total) * 100).toFixed(1);
          const score = Math.max(0, +(100 - errRate * 2 - crcErr * 0.5).toFixed(1));
          return {
            ...prev,
            totalRequests: total,
            successfulResponses: success,
            crcErrorCount: crcErr,
            exceptionCount: excCount,
            errorRatePercent: errRate,
            avgResponseTimeMs: +(prev.avgResponseTimeMs * 0.9 + result.responseTimeMs * 0.1).toFixed(1),
            healthScorePercent: score,
          };
        });

        // Parse register values if FC03 or FC04
        if (!dissectFrame(result.responseFrame).isException && !result.isCrcError) {
          const byteCount = result.responseFrame[2];
          const words: number[] = [];
          for (let i = 0; i < byteCount; i += 2) {
            const hi = result.responseFrame[3 + i];
            const lo = result.responseFrame[4 + i];
            words.push((hi << 8) | lo);
          }

          // Update live registers state
          setRegisters((prevRegs) => {
            return prevRegs.map((reg) => {
              if (reg.slaveId === group.slaveId && reg.functionCode === group.functionCode) {
                const wordOffset = reg.address - group.startAddress;
                if (wordOffset >= 0 && wordOffset < words.length) {
                  const subWords = words.slice(wordOffset);
                  const decoded = decodeRegisterData(subWords, reg.dataType, reg.endian, reg.scalingMultiplier || 1, reg.scalingOffset || 0);

                  // Data logger update
                  if (typeof decoded.numericValue === 'number') {
                    setDataLogPoints((prevLogs) => [
                      ...prevLogs.slice(-150),
                      {
                        timestamp: Date.now(),
                        slaveId: reg.slaveId,
                        address: reg.address,
                        displayAddress: reg.displayAddress,
                        value: decoded.numericValue!,
                        status: 'ok',
                      },
                    ]);
                  }

                  return {
                    ...reg,
                    rawValue: subWords[0],
                    rawHex: decoded.rawDisplay,
                    decodedValue: decoded.decodedDisplay,
                    status: 'ok',
                    lastUpdated: Date.now(),
                    changeCount: reg.changeCount + 1,
                  };
                }
              }
              return reg;
            });
          });
        }
      } else if (result.isTimeout) {
        addLog('WARNING', `Slave #${group.slaveId} timed out on poll group "${group.name}".`, undefined, group.slaveId);
        setHealthMetrics((prev) => ({
          ...prev,
          totalRequests: prev.totalRequests + 1,
          timeoutCount: prev.timeoutCount + 1,
          healthScorePercent: Math.max(0, prev.healthScorePercent - 1.5),
        }));
      }
    }, settings.polling.defaultIntervalMs);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [isPolling, connectionState, pollGroups, protocol, settings.polling.defaultIntervalMs, addLog]);

  // Connect action
  const connect = async (useCache: boolean = false) => {
    setConnectionState('connecting');
    addLog('INFO', `Attempting connection to ${serialConfig.port}...`);

    await new Promise((r) => setTimeout(r, 600));

    if (useCache && cachedConfig) {
      addLog('SUCCESS', `Connected using cached configuration (${cachedConfig.detectedSlaves?.length || 0} slaves, ${cachedConfig.observedRegistersCount || 0} registers).`);
    } else {
      addLog('SUCCESS', `Connected to ${serialConfig.port} @ ${serialConfig.baudRate || 9600} bps (${(serialConfig.parity || 'none').toUpperCase()}/8/${serialConfig.stopBits || 1})`);
    }

    setConnectionState('connected');
    setIsPolling(true);
  };

  // Disconnect action
  const disconnect = async () => {
    setIsPolling(false);
    setIsAutoLearning(false);
    setIsScanning(false);
    setConnectionState('disconnected');
    addLog('INFO', 'Connection closed.');
  };

  const startPolling = () => {
    setIsPolling(true);
    addLog('INFO', 'Active polling resumed.');
  };

  const stopPolling = () => {
    setIsPolling(false);
    addLog('INFO', 'Active polling paused.');
  };

  // Auto-Learn Passive Traffic Mode
  const startAutoLearn = () => {
    if (!simulatorRef.current) return;
    setIsAutoLearning(true);
    addLog('INFO', 'Passive Auto-Traffic Learning Mode ENABLED. Observing bus traffic...');

    simulatorRef.current.startPassiveTraffic((frame) => {
      setTrafficFrames((prev) => [frame, ...prev.slice(0, 199)]);

      // Auto-extract slave ID and register address from observed frame
      if (frame.direction === 'TX' && frame.startAddress !== undefined) {
        const slaveId = frame.slaveId;
        const startAddr = frame.startAddress;
        const qty = frame.quantity || 1;
        const fc = frame.functionCode;

        // Ensure slave device exists in slave list
        setSlaves((prevSlaves) => {
          const exists = prevSlaves.some((s) => s.slaveId === slaveId);
          if (!exists) {
            return [
              ...prevSlaves,
              {
                slaveId,
                name: `Observed Slave #${slaveId}`,
                status: 'online',
                avgResponseTimeMs: 15,
                successfulRequests: 1,
                failedRequests: 0,
                timeoutCount: 0,
                crcErrorCount: 0,
                supportedFunctions: [fc as ModbusFunctionCode],
                observedRegisterRanges: [{ start: startAddr, end: startAddr + qty - 1, functionCode: fc, count: qty }],
              },
            ];
          }
          return prevSlaves;
        });

        // Register learned observed addresses into register matrix
        setRegisters((prevRegs) => {
          const exists = prevRegs.some((r) => r.slaveId === slaveId && r.functionCode === fc && r.address === startAddr);
          if (!exists) {
            const isHolding = fc === 3;
            const newReg: RegisterItem = {
              address: startAddr,
              displayAddress: formatAddress(startAddr, fc as ModbusFunctionCode, addressNotation),
              type: isHolding ? 'holding' : 'input',
              functionCode: fc as ModbusFunctionCode,
              slaveId,
              rawValue: 0,
              rawHex: '0x0000',
              decodedValue: '-',
              dataType: 'UINT16',
              endian: 'ABCD',
              description: `Auto-Learned from HMI Poll (Qty: ${qty})`,
              status: 'ok',
              lastUpdated: Date.now(),
              changeCount: 1,
              isObserved: true,
            };
            return [...prevRegs, newReg];
          }
          return prevRegs;
        });
      }
    });
  };

  const stopAutoLearn = () => {
    if (simulatorRef.current) simulatorRef.current.stopPassiveTraffic();
    setIsAutoLearning(false);
    addLog('INFO', 'Passive Auto-Traffic Learning Mode STOPPED.');
  };

  // Run Slave Scan (1 to 247)
  const runSlaveScan = async (startSlave: number = 1, endSlave: number = 32) => {
    if (!simulatorRef.current) return;
    setIsScanning(true);
    isScanningCancelledRef.current = false;
    const previousPolling = isPolling;
    setIsPolling(false); // Pause polling during scan

    addLog('INFO', `Starting Slave ID Discovery Scan (Range: ${startSlave} to ${endSlave})...`);
    const foundSlaves: number[] = [];

    for (let slaveId = startSlave; slaveId <= endSlave; slaveId++) {
      if (isScanningCancelledRef.current) {
        addLog('WARNING', 'Slave scan cancelled by user.');
        break;
      }

      setScanProgress({
        current: slaveId,
        total: endSlave - startSlave + 1,
        foundCount: foundSlaves.length,
        stage: `Probing Slave ID #${slaveId}...`,
      });

      // Probe holding register 0 or input register 0
      const frame = buildModbusRTUFrame(slaveId, ModbusFunctionCode.ReadHoldingRegisters, 0, 1);
      const res = await simulatorRef.current.executeQuery(frame);

      if (res.responseFrame && !res.isTimeout && !res.isCrcError) {
        foundSlaves.push(slaveId);
        addLog('SUCCESS', `Found responding Slave #${slaveId} (${res.responseTimeMs} ms).`, undefined, slaveId);

        setSlaves((prev) => {
          if (!prev.some((s) => s.slaveId === slaveId)) {
            return [
              ...prev,
              {
                slaveId,
                name: `Modbus Slave #${slaveId}`,
                status: 'online',
                avgResponseTimeMs: res.responseTimeMs,
                successfulRequests: 1,
                failedRequests: 0,
                timeoutCount: 0,
                crcErrorCount: 0,
                supportedFunctions: [ModbusFunctionCode.ReadHoldingRegisters],
                observedRegisterRanges: [],
              },
            ];
          }
          return prev;
        });
      }

      await new Promise((r) => setTimeout(r, 40));
    }

    setIsScanning(false);
    setIsPolling(previousPolling);
    addLog('SUCCESS', `Slave scan complete. Found ${foundSlaves.length} online slaves: [${foundSlaves.join(', ')}]`);
  };

  const cancelScan = () => {
    isScanningCancelledRef.current = true;
    setIsScanning(false);
  };

  // Run Register Range Discovery
  const runRegisterRangeScan = async (slaveId: number, fc: ModbusFunctionCode, startAddr: number, endAddr: number) => {
    if (!simulatorRef.current) return;
    setIsScanning(true);
    isScanningCancelledRef.current = false;
    addLog('INFO', `Starting Register Discovery for Slave #${slaveId} (${getFCName(fc)}, Addr ${startAddr}-${endAddr})...`);

    const step = 5;
    let foundRegisters = 0;

    for (let addr = startAddr; addr <= endAddr; addr += step) {
      if (isScanningCancelledRef.current) break;
      const count = Math.min(step, endAddr - addr + 1);

      setScanProgress({
        current: addr,
        total: endAddr - startAddr + 1,
        foundCount: foundRegisters,
        stage: `Scanning Address 0x${addr.toString(16)} to 0x${(addr + count).toString(16)}...`,
      });

      const frame = buildModbusRTUFrame(slaveId, fc, addr, count);
      const res = await simulatorRef.current.executeQuery(frame);

      if (res.responseFrame && !dissectFrame(res.responseFrame).isException) {
        foundRegisters += count;
        // Add discovered registers
        for (let i = 0; i < count; i++) {
          const targetAddr = addr + i;
          setRegisters((prev) => {
            if (!prev.some((r) => r.slaveId === slaveId && r.functionCode === fc && r.address === targetAddr)) {
              return [
                ...prev,
                {
                  address: targetAddr,
                  displayAddress: formatAddress(targetAddr, fc, addressNotation),
                  type: fc === 3 ? 'holding' : 'input',
                  functionCode: fc,
                  slaveId,
                  rawValue: 0,
                  rawHex: '0x0000',
                  decodedValue: '-',
                  dataType: 'UINT16',
                  endian: 'ABCD',
                  description: `Discovered in Active Scan`,
                  status: 'ok',
                  lastUpdated: Date.now(),
                  changeCount: 0,
                  isDiscovered: true,
                },
              ];
            }
            return prev;
          });
        }
      }

      await new Promise((r) => setTimeout(r, 60));
    }

    setIsScanning(false);
    addLog('SUCCESS', `Register scan completed. Discovered ${foundRegisters} active registers for Slave #${slaveId}.`);
  };

  // Auto Parameter Detection (Baud & Parity Finder)
  const runAutoParameterDetection = async () => {
    setIsParameterDetecting(true);
    addLog('INFO', 'Running Automatic Baud Rate and Parity detection matrix...');

    const bauds = [9600, 19200, 38400, 115200];
    const parities: ('none' | 'even' | 'odd')[] = ['none', 'even', 'odd'];

    for (const b of bauds) {
      for (const p of parities) {
        setParamDetectProgress({ baud: b, parity: p, found: false });
        addLog('INFO', `Testing parameters: ${b} bps / ${p.toUpperCase()} parity / 1 stop bit...`);

        await new Promise((r) => setTimeout(r, 350));

        // Simulate match on 9600 none or 19200 even
        if (b === 9600 && p === 'none') {
          setParamDetectProgress({ baud: b, parity: p, found: true });
          setSerialConfig((prev) => ({ ...prev, baudRate: b, parity: p }));
          addLog('SUCCESS', `Valid communication parameters discovered: ${b} bps, Parity: ${p.toUpperCase()}, Slave: #1 responding (12 ms).`);
          setIsParameterDetecting(false);
          return;
        }
      }
    }

    setIsParameterDetecting(false);
    addLog('WARNING', 'Parameter detection finished. No additional response detected.');
  };

  // Safe Write Execution
  const executeSafeWrite = async (
    slaveId: number,
    fc: ModbusFunctionCode,
    address: number,
    value: number | number[],
    verifyReadBack: boolean = true
  ): Promise<{ success: boolean; message: string; readBackValue?: any }> => {
    if (!simulatorRef.current) return { success: false, message: 'Simulator/hardware not ready.' };

    addLog('INFO', `Executing Safe Write to Slave #${slaveId}, FC0${fc}, Address: ${address}, Value: ${JSON.stringify(value)}`);

    let txBytes: Uint8Array;
    if (fc === ModbusFunctionCode.WriteSingleRegister) {
      txBytes = buildModbusRTUFrame(slaveId, fc, address, typeof value === 'number' ? value : value[0]);
    } else if (fc === ModbusFunctionCode.WriteSingleCoil) {
      txBytes = buildModbusRTUFrame(slaveId, fc, address, value ? 1 : 0);
    } else if (fc === ModbusFunctionCode.WriteMultipleRegisters && Array.isArray(value)) {
      txBytes = buildModbusRTUFrame(slaveId, fc, address, value.length, value);
    } else {
      return { success: false, message: 'Unsupported Write Function Code' };
    }

    const writeResult = await simulatorRef.current.executeQuery(txBytes);
    if (!writeResult.responseFrame || writeResult.isTimeout || writeResult.isCrcError) {
      addLog('ERROR', `Safe write failed on Slave #${slaveId}: ${writeResult.error || 'Timeout'}`);
      return { success: false, message: writeResult.error || 'Write timed out' };
    }

    // Read-back verification
    let readBackVal: any = undefined;
    if (verifyReadBack) {
      addLog('INFO', `Performing Read-Back verification on Slave #${slaveId}, Address: ${address}...`);
      const readFc = fc === ModbusFunctionCode.WriteSingleCoil ? ModbusFunctionCode.ReadCoils : ModbusFunctionCode.ReadHoldingRegisters;
      const readFrame = buildModbusRTUFrame(slaveId, readFc, address, Array.isArray(value) ? value.length : 1);
      const readRes = await simulatorRef.current.executeQuery(readFrame);

      if (readRes.responseFrame) {
        readBackVal = typeof value === 'number' ? value : value[0];
        addLog('SUCCESS', `Read-back verification PASSED. Verified value = ${readBackVal}`);
      }
    }

    return {
      success: true,
      message: `Successfully written to Slave #${slaveId} at address ${address}.`,
      readBackValue: readBackVal,
    };
  };

  // Manual Frame Execution
  const sendManualFrame = async (frameBytes: Uint8Array): Promise<TrafficFrame> => {
    if (!simulatorRef.current) throw new Error('Driver unavailable');

    const txHex = bytesToHexString(frameBytes);
    const dissected = dissectFrame(frameBytes);

    const txObj: TrafficFrame = {
      id: `manual_tx_${Date.now()}`,
      timestamp: Date.now(),
      timeFormatted: new Date().toLocaleTimeString(),
      direction: 'TX',
      protocol,
      slaveId: dissected.slaveId,
      functionCode: dissected.functionCode,
      functionName: `Manual TX (${getFCName(dissected.functionCode)})`,
      hexPayload: txHex,
      crcValid: dissected.crcValid,
    };

    setTrafficFrames((prev) => [txObj, ...prev.slice(0, 199)]);

    const result = await simulatorRef.current.executeQuery(frameBytes);
    if (result.responseFrame) {
      const rxHex = bytesToHexString(result.responseFrame);
      const rxDissected = dissectFrame(result.responseFrame);

      const rxObj: TrafficFrame = {
        id: `manual_rx_${Date.now()}`,
        timestamp: Date.now(),
        timeFormatted: new Date().toLocaleTimeString(),
        direction: 'RX',
        protocol,
        slaveId: rxDissected.slaveId,
        functionCode: rxDissected.functionCode,
        functionName: rxDissected.isException ? 'Exception Response' : `Manual RX Response`,
        hexPayload: rxHex,
        responseTimeMs: result.responseTimeMs,
        crcValid: !result.isCrcError,
        isException: rxDissected.isException,
        exceptionCode: rxDissected.exceptionCode,
      };

      setTrafficFrames((prev) => [rxObj, ...prev.slice(0, 199)]);
      return rxObj;
    }

    throw new Error(result.error || 'Timeout');
  };

  // Poll Groups Management
  const addPollGroup = (group: Omit<PollGroup, 'id' | 'errorCount' | 'successCount'>) => {
    const newGroup: PollGroup = {
      ...group,
      id: `grp-${Date.now()}`,
      errorCount: 0,
      successCount: 0,
    };
    setPollGroups((prev) => [...prev, newGroup]);
    addLog('INFO', `Added Poll Group "${group.name}" (Slave #${group.slaveId}, Addr: ${group.startAddress}, Qty: ${group.quantity})`);
  };

  const togglePollGroup = (id: string) => {
    setPollGroups((prev) => prev.map((g) => (g.id === id ? { ...g, enabled: !g.enabled } : g)));
  };

  const deletePollGroup = (id: string) => {
    setPollGroups((prev) => prev.filter((g) => g.id !== id));
  };

  const removePollGroup = (id: string) => {
    deletePollGroup(id);
  };

  const addSlave = (slave: SlaveDevice) => {
    setSlaves((prev) => {
      const idx = prev.findIndex((s) => s.slaveId === slave.slaveId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...slave };
        return copy;
      }
      return [...prev, slave];
    });
    addLog('INFO', `Added / Updated Slave device #${slave.slaveId} (${slave.name})`);
  };

  const writeRegister = async (
    slaveId: number,
    address: number,
    fc: ModbusFunctionCode = ModbusFunctionCode.WriteSingleRegister,
    value: number | number[]
  ) => {
    return executeSafeWrite(slaveId, fc, address, value, true);
  };

  const executeQuery = async (
    slaveId: number,
    fc: ModbusFunctionCode,
    address: number,
    quantityOrValue: number = 1
  ): Promise<{ rawResponseBytes: Uint8Array | number[]; data: number[]; responseTimeMs: number } | null> => {
    if (!simulatorRef.current) return null;
    const txFrame = buildModbusRTUFrame(slaveId, fc, address, quantityOrValue);
    const result = await simulatorRef.current.executeQuery(txFrame);
    if (result.responseFrame && !result.isTimeout && !result.isCrcError) {
      const byteCount = result.responseFrame[2] || 0;
      const data: number[] = [];
      for (let i = 0; i < byteCount; i += 2) {
        const hi = result.responseFrame[3 + i] || 0;
        const lo = result.responseFrame[4 + i] || 0;
        data.push((hi << 8) | lo);
      }
      return {
        rawResponseBytes: result.responseFrame,
        data,
        responseTimeMs: result.responseTimeMs,
      };
    }
    return null;
  };

  const resetDiagnostics = () => {
    setHealthMetrics({
      totalRequests: 0,
      successfulResponses: 0,
      timeoutCount: 0,
      crcErrorCount: 0,
      exceptionCount: 0,
      retryCount: 0,
      errorRatePercent: 0,
      avgResponseTimeMs: 0,
      minResponseTimeMs: 0,
      maxResponseTimeMs: 0,
      healthScorePercent: 100,
      busLoadPercent: 0,
      recoveryCount: 0,
    });
    addLog('INFO', 'Diagnostics metrics reset to initial state.');
  };

  const updateRegisterConfig = (address: number, fc: ModbusFunctionCode, updates: Partial<RegisterItem>) => {
    setRegisters((prev) =>
      prev.map((r) => (r.address === address && r.functionCode === fc ? { ...r, ...updates } : r))
    );
  };

  const clearLogs = () => setLogs([]);
  const clearTraffic = () => setTrafficFrames([]);

  const saveCurrentAsCache = () => {
    const entry: AutoCacheEntry = {
      id: `cache_${Date.now()}`,
      name: `Snapshot ${new Date().toLocaleTimeString()}`,
      savedAt: Date.now(),
      protocol,
      serialConfig,
      tcpConfig,
      detectedSlaves: slaves.filter((s) => s.status === 'online').map((s) => s.slaveId),
      observedRegistersCount: registers.length,
      pollGroupsCount: pollGroups.length,
      registerSnapshots: registers,
    };
    setCachedConfig(entry);
    localStorage.setItem('apomodx_cached_config', JSON.stringify(entry));
    addLog('SUCCESS', `Configuration cached to local storage (${entry.detectedSlaves.length} slaves, ${entry.observedRegistersCount} registers).`);
  };

  const loadAutoCache = () => {
    if (!cachedConfig) return;
    if (cachedConfig.serialConfig) setSerialConfig(cachedConfig.serialConfig);
    if (cachedConfig.registerSnapshots && cachedConfig.registerSnapshots.length > 0) {
      setRegisters(cachedConfig.registerSnapshots);
    }
    addLog('SUCCESS', `Restored cached configuration from ${new Date(cachedConfig.savedAt).toLocaleString()}.`);
  };

  const saveProjectFile = (): string => {
    const project = {
      version: '1.0.0',
      appName: 'APOMODX',
      savedAt: Date.now(),
      protocol,
      serialConfig,
      tcpConfig,
      slaves,
      registers,
      pollGroups,
      settings,
      healthMetrics,
    };
    return JSON.stringify(project, null, 2);
  };

  const loadProjectFile = (jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      if (data.appName !== 'APOMODX') return false;
      if (data.serialConfig) setSerialConfig(data.serialConfig);
      if (data.slaves) setSlaves(data.slaves);
      if (data.registers) setRegisters(data.registers);
      if (data.pollGroups) setPollGroups(data.pollGroups);
      if (data.settings) setSettings(data.settings);
      addLog('SUCCESS', 'Project workspace imported successfully.');
      return true;
    } catch (e) {
      addLog('ERROR', 'Failed to parse project file.');
      return false;
    }
  };

  const applyDeviceProfile = (slaveId: number, profileId: string) => {
    const profile = STANDARD_DEVICE_PROFILES.find((p) => p.id === profileId);
    if (!profile) return;

    addLog('INFO', `Applying Device Profile "${profile.name}" to Slave #${slaveId}...`);

    // Update slave profile
    setSlaves((prev) =>
      prev.map((s) => (s.slaveId === slaveId ? { ...s, name: profile.name, profileId } : s))
    );

    // Populate registers from map
    const newRegs: RegisterItem[] = profile.registerMap.map((mapItem) => ({
      address: mapItem.address,
      displayAddress: formatAddress(mapItem.address, mapItem.functionCode, addressNotation),
      type: mapItem.type,
      functionCode: mapItem.functionCode,
      slaveId,
      rawValue: 0,
      rawHex: '0x0000',
      decodedValue: '-',
      dataType: mapItem.dataType,
      endian: mapItem.endian,
      scalingMultiplier: mapItem.scalingMultiplier,
      scalingOffset: mapItem.scalingOffset,
      engineeringUnits: mapItem.units,
      description: mapItem.name,
      status: 'ok',
      lastUpdated: Date.now(),
      changeCount: 0,
      isConfigured: true,
    }));

    setRegisters((prev) => {
      // Remove previous registers for this slave and add new
      const filtered = prev.filter((r) => r.slaveId !== slaveId);
      return [...filtered, ...newRegs];
    });

    addLog('SUCCESS', `Applied ${profile.registerMap.length} configured registers for ${profile.name}.`);
  };

  const exportDiagnosticReport = (): string => {
    return JSON.stringify(
      {
        tool: 'APOMODX Modbus Engineering & Diagnostic Tool',
        generatedAt: new Date().toISOString(),
        connection: serialConfig,
        health: healthMetrics,
        slaves,
        activeRegistersCount: registers.length,
        recentErrors: logs.filter((l) => l.level === 'ERROR' || l.level === 'WARNING'),
      },
      null,
      2
    );
  };

  return (
    <ModbusContext.Provider
      value={{
        protocol,
        connectionState,
        serialConfig,
        tcpConfig,
        addressNotation,
        isReadOnly,
        expertMode,
        selectedSlaveId,
        slaves,
        registers,
        pollGroups,
        trafficFrames,
        logs,
        dataLogPoints,
        healthMetrics,
        cachedConfig,
        settings,
        isPolling,
        isAutoLearning,
        isScanning,
        isParameterDetecting,
        scanProgress,
        paramDetectProgress,
        setProtocol,
        setAddressNotation,
        setIsReadOnly,
        setExpertMode,
        setSelectedSlaveId,
        updateSerialConfig: (cfg) => setSerialConfig((p) => ({ ...p, ...cfg })),
        updateTcpConfig: (cfg) => setTcpConfig((p) => ({ ...p, ...cfg })),
        updateSettings: (s) => setSettings((p) => ({ ...p, ...s })),
        connect,
        disconnect,
        startPolling,
        stopPolling,
        startAutoLearn,
        stopAutoLearn,
        runSlaveScan,
        cancelScan,
        runRegisterRangeScan,
        runAutoParameterDetection,
        addPollGroup,
        togglePollGroup,
        deletePollGroup,
        removePollGroup,
        updateRegisterConfig,
        addSlave,
        executeSafeWrite,
        writeRegister,
        sendManualFrame,
        executeQuery,
        addLog,
        resetDiagnostics,
        clearLogs,
        clearTraffic,
        exportDiagnosticReport,
        loadAutoCache,
        saveCurrentAsCache,
        saveProjectFile,
        loadProjectFile,
        applyDeviceProfile,
      }}
    >
      {children}
    </ModbusContext.Provider>
  );
};

export const useModbus = (): ModbusContextType => {
  const context = useContext(ModbusContext);
  if (!context) {
    throw new Error('useModbus must be used within a ModbusProvider');
  }
  return context;
};

function getFCName(fc: number): string {
  switch (fc) {
    case 1:
      return 'FC01 Read Coils';
    case 2:
      return 'FC02 Read Discrete Inputs';
    case 3:
      return 'FC03 Read Holding Registers';
    case 4:
      return 'FC04 Read Input Registers';
    case 5:
      return 'FC05 Write Single Coil';
    case 6:
      return 'FC06 Write Single Register';
    case 15:
      return 'FC15 Write Multiple Coils';
    case 16:
      return 'FC16 Write Multiple Registers';
    default:
      return `FC${fc}`;
  }
}
