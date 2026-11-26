/**
 * APOMODX - Modbus Engineering & Diagnostic Tool
 * Core Type Definitions
 */

export type ModbusProtocol = 'RTU' | 'TCP' | 'ASCII';

export type Parity = 'none' | 'even' | 'odd' | 'mark' | 'space';
export type StopBits = 1 | 1.5 | 2;
export type DataBits = 5 | 6 | 7 | 8;

export interface SerialConnectionConfig {
  port: string;
  baudRate: number;
  dataBits: DataBits;
  parity: Parity;
  stopBits: StopBits;
  flowControl?: 'none' | 'hardware';
  timeoutMs: number;
  retryCount: number;
  turnaroundDelayMs?: number;
}

export interface TcpConnectionConfig {
  host: string;
  port: number;
  slaveId: number;
  timeoutMs: number;
  retryCount: number;
  keepAlive?: boolean;
}

export type ConnectionState = 
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'scanning'
  | 'learning'
  | 'polling'
  | 'paused'
  | 'warning'
  | 'error'
  | 'recovering';

export enum ModbusFunctionCode {
  ReadCoils = 1,                 // FC01
  ReadDiscreteInputs = 2,        // FC02
  ReadHoldingRegisters = 3,      // FC03
  ReadInputRegisters = 4,        // FC04
  WriteSingleCoil = 5,           // FC05
  WriteSingleRegister = 6,       // FC06
  WriteMultipleCoils = 15,       // FC0F
  WriteMultipleRegisters = 16,   // FC10
  ReadWriteMultipleRegisters = 23// FC17
}

export enum ModbusExceptionCode {
  IllegalFunction = 1,
  IllegalDataAddress = 2,
  IllegalDataValue = 3,
  SlaveDeviceFailure = 4,
  Acknowledge = 5,
  SlaveDeviceBusy = 6,
  MemoryParityError = 8,
  GatewayPathUnavailable = 10,
  GatewayTargetDeviceFailed = 11,
}

export type RegisterDataType =
  | 'INT16'
  | 'UINT16'
  | 'INT32'
  | 'UINT32'
  | 'FLOAT32'
  | 'FLOAT64'
  | 'HEX'
  | 'BINARY'
  | 'ASCII'
  | 'BOOLEAN';

export type EndianFormat =
  | 'ABCD' // Big Endian (Default)
  | 'DCBA' // Little Endian
  | 'BADC' // Byte Swap (Mid-Little)
  | 'CDAB'; // Word Swap (Mid-Big)

export type AddressNotation = '0-based' | '1-based' | 'modicon-40001' | 'protocol';

export type ModbusRegister = RegisterItem;
export type ModbusDataType = RegisterDataType;
export type ByteOrder = EndianFormat;
export type ModbusTrafficFrame = TrafficFrame;

export interface RegisterItem {
  address: number;             // Protocol address (0-based)
  displayAddress: string;      // Formatted address (e.g., "40001" or "0x0000")
  type: 'holding' | 'input' | 'coil' | 'discrete';
  functionCode: ModbusFunctionCode;
  slaveId: number;
  rawValue: number;            // 16-bit word or 1-bit boolean
  rawHex: string;
  decodedValue?: string | number;
  dataType: RegisterDataType;
  endian: EndianFormat;
  byteOrder?: EndianFormat;
  scalingMultiplier?: number;
  scalingOffset?: number;
  engineeringUnits?: string;
  description?: string;
  status: 'ok' | 'timeout' | 'error' | 'stale';
  lastUpdated: number;
  changeCount: number;
  isObserved?: boolean;        // Learned passively
  isDiscovered?: boolean;      // Scanned actively
  isConfigured?: boolean;      // User configured
}

export interface PollGroup {
  id: string;
  name: string;
  slaveId: number;
  functionCode: ModbusFunctionCode;
  startAddress: number;
  quantity: number;
  intervalMs: number;
  priority: 'low' | 'normal' | 'high';
  enabled: boolean;
  lastPollTimestamp?: number;
  lastResponseTimeMs?: number;
  errorCount: number;
  successCount: number;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  timeFormatted: string;
  level: 'ALL' | 'INFO' | 'TX' | 'RX' | 'WARNING' | 'ERROR' | 'SUCCESS';
  category: 'system' | 'comm' | 'poll' | 'scan' | 'learn' | 'diagnostic' | 'safety';
  slaveId?: number;
  functionCode?: number;
  rawHex?: string;
  message: string;
  details?: string;
  responseTimeMs?: number;
}

export interface TrafficFrame {
  id: string;
  timestamp: number;
  timeFormatted: string;
  timestampFormatted?: string;
  direction: 'TX' | 'RX';
  protocol: ModbusProtocol;
  slaveId: number;
  functionCode: number;
  functionName: string;
  startAddress?: number;
  quantity?: number;
  byteCount?: number;
  hexPayload: string;
  rawBytes?: number[];
  crc?: string;
  crcValid?: boolean;
  crcStatus?: string;
  computedCrc?: number;
  responseTimeMs?: number;
  isException?: boolean;
  exceptionCode?: number;
  exceptionName?: string;
  notes?: string;
  isReplay?: boolean;
}

export interface SlaveDevice {
  slaveId: number;
  name: string;
  status: 'online' | 'offline' | 'unstable' | 'unknown';
  profileId?: string;
  detectedAt?: number;
  lastSeen?: number;
  avgResponseTimeMs: number;
  successfulRequests: number;
  failedRequests: number;
  timeoutCount: number;
  crcErrorCount: number;
  supportedFunctions: ModbusFunctionCode[];
  observedRegisterRanges: Array<{ start: number; end: number; functionCode: number; count: number }>;
}

export interface CommunicationHealthMetrics {
  totalRequests: number;
  successfulResponses: number;
  timeoutCount: number;
  crcErrorCount: number;
  exceptionCount: number;
  retryCount: number;
  errorRatePercent: number;
  avgResponseTimeMs: number;
  minResponseTimeMs: number;
  maxResponseTimeMs: number;
  healthScorePercent: number; // 0 - 100%
  busLoadPercent: number;
  lastErrorTimestamp?: number;
  lastErrorReason?: string;
  recoveryCount: number;
}

export interface AutoCacheEntry {
  id: string;
  name: string;
  savedAt: number;
  protocol: ModbusProtocol;
  serialConfig?: SerialConnectionConfig;
  tcpConfig?: TcpConnectionConfig;
  detectedSlaves: number[];
  observedRegistersCount: number;
  pollGroupsCount: number;
  registerSnapshots: RegisterItem[];
}

export interface DeviceProfile {
  id: string;
  name: string;
  manufacturer: string;
  model: string;
  protocol: ModbusProtocol;
  defaultBaudRate?: number;
  defaultParity?: Parity;
  defaultSlaveId?: number;
  description: string;
  category?: string;
  registers?: any[];
  registerMap: Array<{
    address: number;
    name: string;
    type: 'holding' | 'input' | 'coil' | 'discrete';
    functionCode: ModbusFunctionCode;
    dataType: RegisterDataType;
    endian: EndianFormat;
    scalingMultiplier?: number;
    scalingOffset?: number;
    units?: string;
    scale?: number;
    access: 'RO' | 'RW' | 'WO';
    notes?: string;
  }>;
}

export interface TroubleshootingRule {
  id: string;
  title: string;
  category?: string;
  severity?: 'critical' | 'high' | 'normal';
  symptom?: string;
  rootCause?: string;
  actions?: string[];
  errorCategory: 'CRC' | 'TIMEOUT' | 'EXCEPTION' | 'PORT' | 'SERIAL' | 'NETWORK';
  symptoms: string[];
  possibleCauses: string[];
  recommendedActions: string[];
  quickAction?: {
    label: string;
    actionType: 'check_config' | 'run_test' | 'view_frames' | 'lower_baud' | 'reset_bus';
  };
}

export interface DataLogPoint {
  timestamp: number;
  slaveId: number;
  address: number;
  displayAddress: string;
  value: number;
  status: 'ok' | 'error';
}

export interface ProjectState {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  description: string;
  protocol: ModbusProtocol;
  serialConfig: SerialConnectionConfig;
  tcpConfig: TcpConnectionConfig;
  pollGroups: PollGroup[];
  registers: RegisterItem[];
  slaves: SlaveDevice[];
  settings: AppSettings;
}

export interface AppSettings {
  general: {
    language: string;
    startupBehavior: 'show_welcome' | 'auto_cache' | 'empty';
    confirmations: boolean;
    expertMode: boolean;
  };
  communication: {
    timeoutMs: number;
    retryCount: number;
    autoReconnect: boolean;
    turnaroundDelayMs: number;
  };
  scanner: {
    scanStartSlave: number;
    scanEndSlave: number;
    slaveScanDelayMs: number;
    registerScanBlockSize: number;
    scanTimeoutMs: number;
    scanMode: 'fast' | 'normal' | 'full';
  };
  autoLearn: {
    captureDurationSec: number;
    duplicateHandling: 'merge' | 'record_all';
    autoCacheObserved: boolean;
    minConfidenceFrames: number;
  };
  polling: {
    defaultIntervalMs: number;
    maxConcurrentGroups: number;
    pauseOnTabHidden: boolean;
  };
  diagnostics: {
    healthCheckIntervalSec: number;
    warningErrorRateThreshold: number; // e.g. 5%
    criticalErrorRateThreshold: number; // e.g. 15%
    enableBusLoadEstimation: boolean;
  };
  safety: {
    readOnlyDefault: boolean;
    requireWriteConfirmation: boolean;
    verifyReadBackAfterWrite: boolean;
  };
  appearance: {
    theme: 'dark' | 'light' | 'slate';
    density: 'compact' | 'standard' | 'spacious';
    fontSize: 'small' | 'medium' | 'large';
  };
}
