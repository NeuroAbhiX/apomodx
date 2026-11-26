/**
 * APOMODX - Modbus Engineering Protocol Engine
 * Standard Modbus RTU / TCP packet calculations, CRC-16, Frame Encoding & Decoding
 */

import {
  ModbusFunctionCode,
  ModbusExceptionCode,
  RegisterDataType,
  EndianFormat,
  AddressNotation,
} from '../types/modbus';

/**
 * Calculates standard CRC-16 (Modbus polynomial 0xA001)
 * Table-driven or bitwise computation ensuring 100% industrial compatibility.
 */
export function calculateCRC16(buffer: Uint8Array | number[]): number {
  let crc = 0xffff;
  for (let pos = 0; pos < buffer.length; pos++) {
    crc ^= buffer[pos];
    for (let i = 8; i !== 0; i--) {
      if ((crc & 0x0001) !== 0) {
        crc >>= 1;
        crc ^= 0xa001;
      } else {
        crc >>= 1;
      }
    }
  }
  return crc & 0xffff;
}

/**
 * Returns CRC16 as little-endian bytes [LowByte, HighByte] standard for Modbus RTU
 */
export function getCRC16Bytes(buffer: Uint8Array | number[]): [number, number] {
  const crc = calculateCRC16(buffer);
  return [crc & 0xff, (crc >> 8) & 0xff];
}

/**
 * Validates whether the last 2 bytes of a Modbus RTU frame match its calculated CRC
 */
export function verifyCRC(frame: Uint8Array | number[]): boolean {
  if (frame.length < 3) return false;
  const payload = frame.slice(0, frame.length - 2);
  const expectedCRC = calculateCRC16(payload);
  const receivedLow = frame[frame.length - 2];
  const receivedHigh = frame[frame.length - 1];
  const receivedCRC = receivedLow | (receivedHigh << 8);
  return expectedCRC === receivedCRC;
}

/**
 * Convert byte array to formatted Hex string (e.g., "05 03 00 00 00 0A C5 8E")
 */
export function bytesToHexString(bytes: Uint8Array | number[]): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
    .join(' ');
}

export const formatHex = bytesToHexString;

/**
 * Convert Hex string (e.g. "05 03 00 00" or "05030000") to number array
 */
export function hexStringToBytes(hex: string): number[] {
  const cleaned = hex.replace(/[^0-9a-fA-F]/g, '');
  const bytes: number[] = [];
  for (let i = 0; i < cleaned.length; i += 2) {
    bytes.push(parseInt(cleaned.substr(i, 2), 16));
  }
  return bytes;
}

/**
 * Modbus Function Code display name
 */
export function getFunctionName(fc: number): string {
  switch (fc) {
    case ModbusFunctionCode.ReadCoils:
      return 'FC01 Read Coils (0x)';
    case ModbusFunctionCode.ReadDiscreteInputs:
      return 'FC02 Read Discrete Inputs (1x)';
    case ModbusFunctionCode.ReadHoldingRegisters:
      return 'FC03 Read Holding Registers (4x)';
    case ModbusFunctionCode.ReadInputRegisters:
      return 'FC04 Read Input Registers (3x)';
    case ModbusFunctionCode.WriteSingleCoil:
      return 'FC05 Write Single Coil';
    case ModbusFunctionCode.WriteSingleRegister:
      return 'FC06 Write Single Register';
    case ModbusFunctionCode.WriteMultipleCoils:
      return 'FC15 Write Multiple Coils (0x0F)';
    case ModbusFunctionCode.WriteMultipleRegisters:
      return 'FC16 Write Multiple Registers (0x10)';
    case ModbusFunctionCode.ReadWriteMultipleRegisters:
      return 'FC23 Read/Write Multiple Registers';
    default:
      if (fc > 0x80) {
        return `Exception Response (0x${fc.toString(16).toUpperCase()})`;
      }
      return `FC${fc.toString().padStart(2, '0')} (Custom)`;
  }
}

/**
 * Modbus Exception Code display name & engineering explanation
 */
export function getExceptionDetails(code: number): { name: string; description: string; advice: string } {
  switch (code) {
    case ModbusExceptionCode.IllegalFunction:
      return {
        name: '01: Illegal Function',
        description: 'The function code received in the query is not an allowable action for the server/slave.',
        advice: 'Check device manual. Device may not support this FC or requires firmware unlock.',
      };
    case ModbusExceptionCode.IllegalDataAddress:
      return {
        name: '02: Illegal Data Address',
        description: 'The data address received in the query is not an allowable address for the server/slave.',
        advice: 'Verify address offset (0-based vs 1-based) or check if requested register range exceeds device memory.',
      };
    case ModbusExceptionCode.IllegalDataValue:
      return {
        name: '03: Illegal Data Value',
        description: 'A value contained in the query data field is not an allowable value for the server/slave.',
        advice: 'Check number of registers requested (max 125 for FC03/04, max 2000 for FC01/02) or write range limits.',
      };
    case ModbusExceptionCode.SlaveDeviceFailure:
      return {
        name: '04: Slave Device Failure',
        description: 'An unrecoverable error occurred while the server/slave was attempting to perform the requested action.',
        advice: 'Internal device hardware failure or unhandled internal state. Power cycle device or check error codes.',
      };
    case ModbusExceptionCode.Acknowledge:
      return {
        name: '05: Acknowledge',
        description: 'Server accepted invocation but will require long time to process (used to prevent timeout error).',
        advice: 'Device is processing a lengthy operation. Increase response timeout.',
      };
    case ModbusExceptionCode.SlaveDeviceBusy:
      return {
        name: '06: Slave Device Busy',
        description: 'Server is engaged in processing a long-duration command. Client should retransmit later.',
        advice: 'Slow down poll rate or retry after delay.',
      };
    case ModbusExceptionCode.GatewayPathUnavailable:
      return {
        name: '10: Gateway Path Unavailable',
        description: 'Gateway was unable to allocate an internal communication path from input port to target port.',
        advice: 'Check Modbus Gateway routing table and serial port binding.',
      };
    case ModbusExceptionCode.GatewayTargetDeviceFailed:
      return {
        name: '11: Gateway Target Device Failed',
        description: 'No response was obtained from the target device behind the gateway.',
        advice: 'Target RS485 slave behind gateway is powered down, disconnected, or set to wrong baud rate.',
      };
    default:
      return {
        name: `Exception Code ${code}`,
        description: 'Non-standard or manufacturer-specific exception response code.',
        advice: 'Refer to specific manufacturer diagnostic documentation.',
      };
  }
}

/**
 * Convert protocol address (0-based) to various display formats
 */
export function formatAddress(address: number, fc: ModbusFunctionCode, notation: AddressNotation = '0-based'): string {
  switch (notation) {
    case '1-based':
      return (address + 1).toString();
    case 'modicon-40001':
      if (fc === ModbusFunctionCode.ReadHoldingRegisters || fc === ModbusFunctionCode.WriteSingleRegister || fc === ModbusFunctionCode.WriteMultipleRegisters) {
        return (40001 + address).toString();
      }
      if (fc === ModbusFunctionCode.ReadInputRegisters) {
        return (30001 + address).toString();
      }
      if (fc === ModbusFunctionCode.ReadDiscreteInputs) {
        return (10001 + address).toString();
      }
      if (fc === ModbusFunctionCode.ReadCoils || fc === ModbusFunctionCode.WriteSingleCoil || fc === ModbusFunctionCode.WriteMultipleCoils) {
        return (1 + address).toString().padStart(5, '0');
      }
      return address.toString();
    case 'protocol':
      return `0x${address.toString(16).padStart(4, '0').toUpperCase()}`;
    case '0-based':
    default:
      return address.toString();
  }
}

/**
 * Decode binary words into INT16, UINT16, INT32, FLOAT32, FLOAT64, HEX, etc.
 */
export function decodeRegisterData(
  words: number[],
  dataType: RegisterDataType,
  endian: EndianFormat = 'ABCD',
  multiplier: number = 1,
  offset: number = 0
): { rawDisplay: string; decodedDisplay: string; numericValue?: number } {
  if (!words || words.length === 0) {
    return { rawDisplay: '0x0000', decodedDisplay: '-' };
  }

  const word0 = words[0] & 0xffff;
  const rawDisplay = `0x${word0.toString(16).padStart(4, '0').toUpperCase()}`;

  try {
    switch (dataType) {
      case 'UINT16': {
        const val = word0 * multiplier + offset;
        return { rawDisplay, decodedDisplay: val.toFixed(decimalsFor(multiplier)), numericValue: val };
      }
      case 'INT16': {
        let signedVal = word0;
        if (signedVal > 0x7fff) signedVal -= 0x10000;
        const val = signedVal * multiplier + offset;
        return { rawDisplay, decodedDisplay: val.toFixed(decimalsFor(multiplier)), numericValue: val };
      }
      case 'HEX': {
        return { rawDisplay, decodedDisplay: rawDisplay, numericValue: word0 };
      }
      case 'BINARY': {
        const bin = word0.toString(2).padStart(16, '0');
        const formatted = `${bin.slice(0, 4)} ${bin.slice(4, 8)} ${bin.slice(8, 12)} ${bin.slice(12, 16)}`;
        return { rawDisplay, decodedDisplay: formatted, numericValue: word0 };
      }
      case 'BOOLEAN': {
        return { rawDisplay, decodedDisplay: word0 ? 'TRUE (1)' : 'FALSE (0)', numericValue: word0 ? 1 : 0 };
      }
      case 'INT32': {
        if (words.length < 2) return { rawDisplay, decodedDisplay: `${word0} (Need 2 words)` };
        const bytes = arrange32BitBytes(words[0], words[1], endian);
        const dataView = new DataView(bytes.buffer);
        const int32Val = dataView.getInt32(0, false);
        const val = int32Val * multiplier + offset;
        return { rawDisplay: `0x${words[0].toString(16).padStart(4, '0')}${words[1].toString(16).padStart(4, '0')}`.toUpperCase(), decodedDisplay: val.toFixed(decimalsFor(multiplier)), numericValue: val };
      }
      case 'UINT32': {
        if (words.length < 2) return { rawDisplay, decodedDisplay: `${word0} (Need 2 words)` };
        const bytes = arrange32BitBytes(words[0], words[1], endian);
        const dataView = new DataView(bytes.buffer);
        const uint32Val = dataView.getUint32(0, false);
        const val = uint32Val * multiplier + offset;
        return { rawDisplay: `0x${words[0].toString(16).padStart(4, '0')}${words[1].toString(16).padStart(4, '0')}`.toUpperCase(), decodedDisplay: val.toFixed(decimalsFor(multiplier)), numericValue: val };
      }
      case 'FLOAT32': {
        if (words.length < 2) return { rawDisplay, decodedDisplay: `Float (Need 2 words)` };
        const bytes = arrange32BitBytes(words[0], words[1], endian);
        const dataView = new DataView(bytes.buffer);
        const floatVal = dataView.getFloat32(0, false);
        const val = floatVal * multiplier + offset;
        return { 
          rawDisplay: `0x${words[0].toString(16).padStart(4, '0')}${words[1].toString(16).padStart(4, '0')}`.toUpperCase(), 
          decodedDisplay: isNaN(val) ? 'NaN' : val.toFixed(3), 
          numericValue: val 
        };
      }
      case 'ASCII': {
        let text = '';
        for (const w of words) {
          const char1 = String.fromCharCode((w >> 8) & 0xff);
          const char2 = String.fromCharCode(w & 0xff);
          text += (char1.charCodeAt(0) >= 32 ? char1 : '.') + (char2.charCodeAt(0) >= 32 ? char2 : '.');
        }
        return { rawDisplay, decodedDisplay: text };
      }
      default:
        return { rawDisplay, decodedDisplay: word0.toString() };
    }
  } catch (err) {
    return { rawDisplay, decodedDisplay: 'Decode Err' };
  }
}

/**
 * Arranges 4 bytes of 2 16-bit words according to Endianness format
 */
function arrange32BitBytes(w0: number, w1: number, endian: EndianFormat): Uint8Array {
  const b0 = (w0 >> 8) & 0xff; // High byte of word 0
  const b1 = w0 & 0xff;        // Low byte of word 0
  const b2 = (w1 >> 8) & 0xff; // High byte of word 1
  const b3 = w1 & 0xff;        // Low byte of word 1

  switch (endian) {
    case 'ABCD': // Big-endian (standard)
      return new Uint8Array([b0, b1, b2, b3]);
    case 'DCBA': // Little-endian
      return new Uint8Array([b3, b2, b1, b0]);
    case 'BADC': // Byte-swap (Mid-Little)
      return new Uint8Array([b1, b0, b3, b2]);
    case 'CDAB': // Word-swap (Mid-Big)
      return new Uint8Array([b2, b3, b0, b1]);
  }
}

function decimalsFor(multiplier: number): number {
  if (multiplier < 0.001) return 4;
  if (multiplier < 0.01) return 3;
  if (multiplier < 0.1) return 2;
  if (multiplier < 1) return 1;
  return 0;
}

/**
 * Build standard Modbus RTU Frame with CRC appended.
 * Supports both standard parameters (slaveId, fc, address, quantity/value, writeValues)
 * and raw PDU data array (slaveId, fc, pduData: number[]).
 */
export function buildModbusRTUFrame(
  slaveId: number,
  functionCode: ModbusFunctionCode,
  addressOrPduData: number | number[],
  quantityOrValue?: number,
  writeValues?: number[]
): Uint8Array {
  const frame: number[] = [slaveId & 0xff, functionCode & 0xff];

  if (Array.isArray(addressOrPduData)) {
    frame.push(...addressOrPduData);
  } else {
    const address = addressOrPduData;
    const qtyVal = quantityOrValue ?? 1;

    if (functionCode === ModbusFunctionCode.ReadCoils ||
        functionCode === ModbusFunctionCode.ReadDiscreteInputs ||
        functionCode === ModbusFunctionCode.ReadHoldingRegisters ||
        functionCode === ModbusFunctionCode.ReadInputRegisters) {
      // Address High, Address Low, Quantity High, Quantity Low
      frame.push((address >> 8) & 0xff, address & 0xff);
      frame.push((qtyVal >> 8) & 0xff, qtyVal & 0xff);
    } else if (functionCode === ModbusFunctionCode.WriteSingleCoil) {
      // Value: 0xFF00 for ON, 0x0000 for OFF
      frame.push((address >> 8) & 0xff, address & 0xff);
      const coilVal = qtyVal ? 0xff00 : 0x0000;
      frame.push((coilVal >> 8) & 0xff, coilVal & 0xff);
    } else if (functionCode === ModbusFunctionCode.WriteSingleRegister) {
      // Value: 16-bit register value
      frame.push((address >> 8) & 0xff, address & 0xff);
      frame.push((qtyVal >> 8) & 0xff, qtyVal & 0xff);
    } else if (functionCode === ModbusFunctionCode.WriteMultipleRegisters && writeValues) {
      const qty = writeValues.length;
      const byteCount = qty * 2;
      frame.push((address >> 8) & 0xff, address & 0xff);
      frame.push((qty >> 8) & 0xff, qty & 0xff);
      frame.push(byteCount & 0xff);
      for (const val of writeValues) {
        frame.push((val >> 8) & 0xff, val & 0xff);
      }
    } else {
      frame.push((address >> 8) & 0xff, address & 0xff);
      frame.push((qtyVal >> 8) & 0xff, qtyVal & 0xff);
    }
  }

  const [crcLo, crcHi] = getCRC16Bytes(frame);
  frame.push(crcLo, crcHi);

  return new Uint8Array(frame);
}

/**
 * Dissect a raw frame into detailed visual components
 */
export function dissectFrame(bytes: Uint8Array | number[]): {
  slaveId: number;
  functionCode: number;
  isException: boolean;
  exceptionCode?: number;
  address?: number;
  quantity?: number;
  byteCount?: number;
  dataBytes: number[];
  crcHex?: string;
  crcCalculatedHex?: string;
  crcValid?: boolean;
} {
  const arr = Array.from(bytes);
  if (arr.length < 2) {
    return { slaveId: arr[0] || 0, functionCode: 0, isException: false, dataBytes: [] };
  }

  const slaveId = arr[0];
  const functionCode = arr[1];
  const isException = functionCode > 0x80;

  if (isException) {
    const exceptionCode = arr[2];
    return {
      slaveId,
      functionCode,
      isException: true,
      exceptionCode,
      dataBytes: [exceptionCode],
    };
  }

  // Check CRC if at least 4 bytes
  let crcHex: string | undefined;
  let crcCalculatedHex: string | undefined;
  let crcValid: boolean | undefined;

  if (arr.length >= 4) {
    const payload = arr.slice(0, arr.length - 2);
    const expectedCrc = calculateCRC16(payload);
    const recvLo = arr[arr.length - 2];
    const recvHi = arr[arr.length - 1];
    const recvCrc = recvLo | (recvHi << 8);

    crcHex = `${recvLo.toString(16).padStart(2, '0')} ${recvHi.toString(16).padStart(2, '0')}`.toUpperCase();
    crcCalculatedHex = `${(expectedCrc & 0xff).toString(16).padStart(2, '0')} ${((expectedCrc >> 8) & 0xff).toString(16).padStart(2, '0')}`.toUpperCase();
    crcValid = expectedCrc === recvCrc;
  }

  return {
    slaveId,
    functionCode,
    isException: false,
    dataBytes: arr.slice(2, arr.length - 2),
    crcHex,
    crcCalculatedHex,
    crcValid,
  };
}
