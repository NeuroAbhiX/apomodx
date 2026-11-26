/**
 * APOMODX - Standard Industrial Device Profiles & Register Maps
 */

import { DeviceProfile, ModbusFunctionCode } from '../types/modbus';

export const STANDARD_DEVICE_PROFILES: DeviceProfile[] = [
  {
    id: 'eastron-sdm630',
    name: 'Eastron SDM630 Modbus',
    manufacturer: 'Eastron',
    model: 'SDM630-V2',
    protocol: 'RTU',
    category: 'Energy & Power Meters',
    defaultBaudRate: 9600,
    defaultParity: 'none',
    defaultSlaveId: 1,
    description: 'Three-Phase 100A Direct Connected DIN Rail Multi-Function Smart Energy Meter',
    get registers() {
      return this.registerMap;
    },
    registerMap: [
      { address: 0, name: 'Phase 1 Line-to-Neutral Voltage', type: 'holding', functionCode: ModbusFunctionCode.ReadHoldingRegisters, dataType: 'FLOAT32', endian: 'ABCD', units: 'V', access: 'RO' },
      { address: 2, name: 'Phase 2 Line-to-Neutral Voltage', type: 'holding', functionCode: ModbusFunctionCode.ReadHoldingRegisters, dataType: 'FLOAT32', endian: 'ABCD', units: 'V', access: 'RO' },
      { address: 4, name: 'Phase 3 Line-to-Neutral Voltage', type: 'holding', functionCode: ModbusFunctionCode.ReadHoldingRegisters, dataType: 'FLOAT32', endian: 'ABCD', units: 'V', access: 'RO' },
      { address: 6, name: 'Phase 1 Current', type: 'holding', functionCode: ModbusFunctionCode.ReadHoldingRegisters, dataType: 'FLOAT32', endian: 'ABCD', units: 'A', access: 'RO' },
      { address: 8, name: 'Phase 2 Current', type: 'holding', functionCode: ModbusFunctionCode.ReadHoldingRegisters, dataType: 'FLOAT32', endian: 'ABCD', units: 'A', access: 'RO' },
      { address: 10, name: 'Phase 3 Current', type: 'holding', functionCode: ModbusFunctionCode.ReadHoldingRegisters, dataType: 'FLOAT32', endian: 'ABCD', units: 'A', access: 'RO' },
      { address: 12, name: 'Total System Active Power', type: 'holding', functionCode: ModbusFunctionCode.ReadHoldingRegisters, dataType: 'FLOAT32', endian: 'ABCD', units: 'W', access: 'RO' },
      { address: 14, name: 'Frequency of Supply', type: 'holding', functionCode: ModbusFunctionCode.ReadHoldingRegisters, dataType: 'FLOAT32', endian: 'ABCD', units: 'Hz', access: 'RO' },
      { address: 16, name: 'Total Power Factor', type: 'holding', functionCode: ModbusFunctionCode.ReadHoldingRegisters, dataType: 'FLOAT32', endian: 'ABCD', units: 'PF', access: 'RO' },
      { address: 18, name: 'Total Active Energy', type: 'holding', functionCode: ModbusFunctionCode.ReadHoldingRegisters, dataType: 'FLOAT32', endian: 'ABCD', units: 'kWh', access: 'RO' },
    ],
  },
  {
    id: 'autonics-tc4s',
    name: 'Autonics TC4S Temperature Controller',
    manufacturer: 'Autonics',
    model: 'TC4S-14R',
    protocol: 'RTU',
    category: 'Process Controllers',
    defaultBaudRate: 9600,
    defaultParity: 'none',
    defaultSlaveId: 2,
    description: 'Digital PID Temperature Controller with Thermocouple & RTD Inputs',
    get registers() {
      return this.registerMap;
    },
    registerMap: [
      { address: 0, name: 'Process Value (PV)', type: 'input', functionCode: ModbusFunctionCode.ReadInputRegisters, dataType: 'INT16', endian: 'ABCD', scalingMultiplier: 0.1, units: '°C', access: 'RO' },
      { address: 1, name: 'Relative Humidity', type: 'input', functionCode: ModbusFunctionCode.ReadInputRegisters, dataType: 'INT16', endian: 'ABCD', scalingMultiplier: 0.1, units: '%RH', access: 'RO' },
      { address: 2, name: 'Operating Status', type: 'input', functionCode: ModbusFunctionCode.ReadInputRegisters, dataType: 'HEX', endian: 'ABCD', access: 'RO' },
      { address: 0, name: 'Set Value (SV)', type: 'holding', functionCode: ModbusFunctionCode.ReadHoldingRegisters, dataType: 'INT16', endian: 'ABCD', scalingMultiplier: 0.1, units: '°C', access: 'RW' },
      { address: 1, name: 'Proportional Band (P)', type: 'holding', functionCode: ModbusFunctionCode.ReadHoldingRegisters, dataType: 'UINT16', endian: 'ABCD', units: '%', access: 'RW' },
      { address: 2, name: 'Integral Time (I)', type: 'holding', functionCode: ModbusFunctionCode.ReadHoldingRegisters, dataType: 'UINT16', endian: 'ABCD', units: 's', access: 'RW' },
      { address: 3, name: 'Derivative Time (D)', type: 'holding', functionCode: ModbusFunctionCode.ReadHoldingRegisters, dataType: 'UINT16', endian: 'ABCD', units: 's', access: 'RW' },
      { address: 4, name: 'Manual Output %', type: 'holding', functionCode: ModbusFunctionCode.ReadHoldingRegisters, dataType: 'UINT16', endian: 'ABCD', units: '%', access: 'RW' },
    ],
  },
  {
    id: 'abb-acs580',
    name: 'ABB ACS580 Variable Frequency Drive',
    manufacturer: 'ABB',
    model: 'ACS580-01',
    protocol: 'RTU',
    category: 'VFD & Motor Drives',
    defaultBaudRate: 19200,
    defaultParity: 'even',
    defaultSlaveId: 5,
    description: 'General Purpose Variable Frequency AC Drive with Embedded Modbus RTU (EFB)',
    get registers() {
      return this.registerMap;
    },
    registerMap: [
      { address: 0, name: 'Control Word (CW)', type: 'holding', functionCode: ModbusFunctionCode.ReadHoldingRegisters, dataType: 'HEX', endian: 'ABCD', access: 'RW', notes: 'Bit 0=Run, Bit 1=OFF2, Bit 3=Enable' },
      { address: 1, name: 'Speed Reference', type: 'holding', functionCode: ModbusFunctionCode.ReadHoldingRegisters, dataType: 'INT16', endian: 'ABCD', units: 'RPM', access: 'RW' },
      { address: 2, name: 'Acceleration Ramp Time', type: 'holding', functionCode: ModbusFunctionCode.ReadHoldingRegisters, dataType: 'UINT16', endian: 'ABCD', scalingMultiplier: 0.01, units: 's', access: 'RW' },
      { address: 3, name: 'Deceleration Ramp Time', type: 'holding', functionCode: ModbusFunctionCode.ReadHoldingRegisters, dataType: 'UINT16', endian: 'ABCD', scalingMultiplier: 0.01, units: 's', access: 'RW' },
      { address: 0, name: 'Status Word (SW)', type: 'input', functionCode: ModbusFunctionCode.ReadInputRegisters, dataType: 'HEX', endian: 'ABCD', access: 'RO' },
      { address: 1, name: 'Actual Output Frequency', type: 'input', functionCode: ModbusFunctionCode.ReadInputRegisters, dataType: 'INT16', endian: 'ABCD', scalingMultiplier: 0.01, units: 'Hz', access: 'RO' },
      { address: 2, name: 'Motor Actual Current', type: 'input', functionCode: ModbusFunctionCode.ReadInputRegisters, dataType: 'INT16', endian: 'ABCD', scalingMultiplier: 0.1, units: 'A', access: 'RO' },
      { address: 3, name: 'Motor Shaft Torque', type: 'input', functionCode: ModbusFunctionCode.ReadInputRegisters, dataType: 'INT16', endian: 'ABCD', units: '%', access: 'RO' },
      { address: 4, name: 'DC Bus Voltage', type: 'input', functionCode: ModbusFunctionCode.ReadInputRegisters, dataType: 'UINT16', endian: 'ABCD', units: 'V', access: 'RO' },
      { address: 5, name: 'Heatsink Temperature', type: 'input', functionCode: ModbusFunctionCode.ReadInputRegisters, dataType: 'INT16', endian: 'ABCD', units: '°C', access: 'RO' },
    ],
  },
  {
    id: 'schneider-pm5350',
    name: 'Schneider PowerLogic PM5350',
    manufacturer: 'Schneider Electric',
    model: 'PM5350',
    protocol: 'RTU',
    category: 'Energy & Power Meters',
    defaultBaudRate: 19200,
    defaultParity: 'even',
    defaultSlaveId: 10,
    description: 'Compact Modular Power and Energy Meter with Modbus RTU / RS-485 Communication',
    get registers() {
      return this.registerMap;
    },
    registerMap: [
      { address: 3000, name: 'RMS Current Phase A', type: 'holding', functionCode: ModbusFunctionCode.ReadHoldingRegisters, dataType: 'FLOAT32', endian: 'ABCD', units: 'A', access: 'RO' },
      { address: 3002, name: 'RMS Current Phase B', type: 'holding', functionCode: ModbusFunctionCode.ReadHoldingRegisters, dataType: 'FLOAT32', endian: 'ABCD', units: 'A', access: 'RO' },
      { address: 3004, name: 'RMS Current Phase C', type: 'holding', functionCode: ModbusFunctionCode.ReadHoldingRegisters, dataType: 'FLOAT32', endian: 'ABCD', units: 'A', access: 'RO' },
      { address: 3028, name: 'Voltage L1-L2', type: 'holding', functionCode: ModbusFunctionCode.ReadHoldingRegisters, dataType: 'FLOAT32', endian: 'ABCD', units: 'V', access: 'RO' },
      { address: 3060, name: 'Total Active Power', type: 'holding', functionCode: ModbusFunctionCode.ReadHoldingRegisters, dataType: 'FLOAT32', endian: 'ABCD', units: 'kW', access: 'RO' },
      { address: 3110, name: 'Grid Frequency', type: 'holding', functionCode: ModbusFunctionCode.ReadHoldingRegisters, dataType: 'FLOAT32', endian: 'ABCD', units: 'Hz', access: 'RO' },
    ],
  },
];

export const DEVICE_PROFILES = STANDARD_DEVICE_PROFILES;
