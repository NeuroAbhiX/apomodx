/**
 * APOMODX - Industrial Modbus Multi-Slave Hardware & Simulator Layer
 * Supports both Real Web Serial API (Chrome/Edge USB-to-RS485) and High-Fidelity Multi-Device Simulation
 */

import {
  ModbusFunctionCode,
  ModbusExceptionCode,
  TrafficFrame,
  ModbusProtocol,
} from '../types/modbus';
import {
  calculateCRC16,
  getCRC16Bytes,
  bytesToHexString,
} from './modbusEngine';

export interface SimulationFaultConfig {
  injectCrcErrors: boolean;
  crcErrorProbability: number; // 0.0 to 1.0
  injectTimeouts: boolean;
  timeoutProbability: number;
  simulatedLatencyMs: number;
  passiveTrafficEnabled: boolean;
  passiveTrafficIntervalMs: number;
}

export class IndustrialModbusSimulator {
  // Device Memory State
  private memory = {
    // Slave 1: Eastron SDM630 Multi-Function Power & Energy Meter
    slave1: {
      holding: new Map<number, number>(), // 0-based
      input: new Map<number, number>(),
      coils: new Map<number, boolean>(),
      discrete: new Map<number, boolean>(),
    },
    // Slave 2: Industrial PID Temperature & Humidity Controller
    slave2: {
      holding: new Map<number, number>(),
      input: new Map<number, number>(),
      coils: new Map<number, boolean>(),
      discrete: new Map<number, boolean>(),
    },
    // Slave 5: VFD / AC Drive (Inverter)
    slave5: {
      holding: new Map<number, number>(),
      input: new Map<number, number>(),
      coils: new Map<number, boolean>(),
      discrete: new Map<number, boolean>(),
    },
    // Slave 7: Remote Digital & Analog PLC I/O Block
    slave7: {
      holding: new Map<number, number>(),
      input: new Map<number, number>(),
      coils: new Map<number, boolean>(),
      discrete: new Map<number, boolean>(),
    },
  };

  public faults: SimulationFaultConfig = {
    injectCrcErrors: false,
    crcErrorProbability: 0.2,
    injectTimeouts: false,
    timeoutProbability: 0.15,
    simulatedLatencyMs: 15,
    passiveTrafficEnabled: true,
    passiveTrafficIntervalMs: 1200,
  };

  private passiveIntervalHandle: any = null;
  private passiveCallback: ((frame: TrafficFrame) => void) | null = null;
  private simulationTickHandle: any = null;
  private startTime = Date.now();

  constructor() {
    this.initDefaultMemory();
    this.startDynamicSimulationLoop();
  }

  /**
   * Populate initial register values with realistic industrial equipment data
   */
  private initDefaultMemory() {
    // Slave 1: Energy Meter (3-Phase)
    // Voltages (Float32 in holding 0-1 = 230.4V, 2-3 = 231.1V, 4-5 = 229.8V)
    this.setFloat32(this.memory.slave1.holding, 0, 230.45);
    this.setFloat32(this.memory.slave1.holding, 2, 231.10);
    this.setFloat32(this.memory.slave1.holding, 4, 229.80);
    // Currents (Float32 in holding 6-7 = 14.85A, 8-9 = 15.20A, 10-11 = 14.10A)
    this.setFloat32(this.memory.slave1.holding, 6, 14.85);
    this.setFloat32(this.memory.slave1.holding, 8, 15.20);
    this.setFloat32(this.memory.slave1.holding, 10, 14.10);
    // Active Power, Freq, PF, kWh
    this.setFloat32(this.memory.slave1.holding, 12, 10245.5); // 10.2 kW
    this.setFloat32(this.memory.slave1.holding, 14, 50.02);   // 50.02 Hz
    this.setFloat32(this.memory.slave1.holding, 16, 0.985);   // Power Factor
    this.setFloat32(this.memory.slave1.holding, 18, 145892.4);// Total kWh

    // Slave 2: Temperature & Humidity Controller
    this.memory.slave2.holding.set(0, 250); // Set Value SV = 25.0 °C
    this.memory.slave2.holding.set(1, 35);  // P Proportional Band
    this.memory.slave2.holding.set(2, 120); // I Integral Time (s)
    this.memory.slave2.holding.set(3, 30);  // D Derivative Time (s)
    this.memory.slave2.holding.set(4, 45);  // Output Power % = 45%

    this.memory.slave2.input.set(0, 248);   // Process Value PV = 24.8 °C
    this.memory.slave2.input.set(1, 562);   // Relative Humidity = 56.2 %
    this.memory.slave2.input.set(2, 1);     // Controller Status (1=Auto, 2=Manual)

    this.memory.slave2.coils.set(0, false); // Alarm 1 High
    this.memory.slave2.coils.set(1, false); // Alarm 2 Low
    this.memory.slave2.coils.set(2, true);  // Heater SSR Output Active
    this.memory.slave2.coils.set(3, false); // Fan Cooling Relay

    // Slave 5: VFD / Inverter
    this.memory.slave5.holding.set(0, 0x047f); // Control Word: Ready/Running
    this.memory.slave5.holding.set(1, 1450);   // Speed Reference: 1450 RPM
    this.memory.slave5.holding.set(2, 5000);   // Acceleration Time: 5.00s
    this.memory.slave5.holding.set(3, 3000);   // Deceleration Time: 3.00s

    this.memory.slave5.input.set(0, 0x0237);   // Status Word: Tripped=0, Enabled=1
    this.memory.slave5.input.set(1, 4833);     // Output Frequency: 48.33 Hz
    this.memory.slave5.input.set(2, 185);      // Motor Current: 18.5 A
    this.memory.slave5.input.set(3, 76);       // Motor Torque %: 76%
    this.memory.slave5.input.set(4, 565);      // DC Bus Voltage: 565 V
    this.memory.slave5.input.set(5, 42);       // Inverter HeatSink Temp: 42 °C

    this.memory.slave5.coils.set(0, true);     // Run Permissive
    this.memory.slave5.coils.set(1, false);    // Emergency Stop
    this.memory.slave5.coils.set(2, false);    // Direction (0=FWD, 1=REV)

    // Slave 7: Remote I/O Box (Coils & Inputs)
    for (let i = 0; i < 16; i++) {
      this.memory.slave7.coils.set(i, i % 3 === 0);
      this.memory.slave7.discrete.set(i, (i + 1) % 2 === 0);
      this.memory.slave7.input.set(i, 2048 + Math.floor(Math.random() * 50)); // 12-bit ADC values
    }
  }

  /**
   * Continuously varies analog values slightly to simulate dynamic industrial plant behavior
   */
  private startDynamicSimulationLoop() {
    this.simulationTickHandle = setInterval(() => {
      const elapsed = (Date.now() - this.startTime) / 1000;
      
      // VFD oscillation
      const vfdFreq = 48.0 + Math.sin(elapsed * 0.5) * 1.5;
      const vfdCurrent = 18.0 + Math.sin(elapsed * 0.3) * 1.2;
      this.memory.slave5.input.set(1, Math.round(vfdFreq * 100));
      this.memory.slave5.input.set(2, Math.round(vfdCurrent * 10));

      // Temp Controller PV dynamic drift
      const pv = 24.8 + Math.sin(elapsed * 0.2) * 0.4;
      const rh = 56.0 + Math.cos(elapsed * 0.1) * 1.2;
      this.memory.slave2.input.set(0, Math.round(pv * 10));
      this.memory.slave2.input.set(1, Math.round(rh * 10));

      // Energy Meter voltage & current small ripples
      const v1 = 230.0 + Math.sin(elapsed * 0.8) * 1.2;
      const i1 = 14.5 + Math.cos(elapsed * 0.7) * 0.8;
      const p1 = (v1 * i1 * 3 * 0.985);
      this.setFloat32(this.memory.slave1.holding, 0, v1);
      this.setFloat32(this.memory.slave1.holding, 6, i1);
      this.setFloat32(this.memory.slave1.holding, 12, p1);
    }, 500);
  }

  private setFloat32(map: Map<number, number>, startAddr: number, value: number) {
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    view.setFloat32(0, value, false); // Big-Endian
    const word0 = view.getUint16(0, false);
    const word1 = view.getUint16(2, false);
    map.set(startAddr, word0);
    map.set(startAddr + 1, word1);
  }

  /**
   * Process a Modbus RTU Query and return the simulated Response Frame (with realistic latency & errors)
   */
  public async executeQuery(requestFrame: Uint8Array): Promise<{
    responseFrame?: Uint8Array;
    responseTimeMs: number;
    error?: string;
    isTimeout?: boolean;
    isCrcError?: boolean;
  }> {
    const startTime = performance.now();

    // Check fault injection: Timeout
    if (this.faults.injectTimeouts && Math.random() < this.faults.timeoutProbability) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      return {
        responseTimeMs: 800,
        error: 'Response Timeout (No frame received from slave within deadline)',
        isTimeout: true,
      };
    }

    // Simulated latency jitter (e.g., 10-25ms typical for RS-485 at 9600-115200 baud)
    const latency = this.faults.simulatedLatencyMs + Math.floor(Math.random() * 8);
    await new Promise((resolve) => setTimeout(resolve, latency));

    if (requestFrame.length < 4) {
      return { responseTimeMs: Math.round(performance.now() - startTime), error: 'Malformed Request Frame (<4 bytes)' };
    }

    const slaveId = requestFrame[0];
    const functionCode = requestFrame[1];

    // Check if slave exists in our bus
    const slaveMemory = this.getSlaveMemory(slaveId);
    if (!slaveMemory) {
      // Offline / Unresponsive slave (e.g. Slave 12) -> triggers timeout
      await new Promise((resolve) => setTimeout(resolve, 300));
      return {
        responseTimeMs: 300,
        error: `Slave #${slaveId} did not respond (Device Offline or Address Unassigned)`,
        isTimeout: true,
      };
    }

    let responsePayload: number[] = [slaveId, functionCode];

    try {
      switch (functionCode) {
        case ModbusFunctionCode.ReadHoldingRegisters:
        case ModbusFunctionCode.ReadInputRegisters: {
          const address = (requestFrame[2] << 8) | requestFrame[3];
          const quantity = (requestFrame[4] << 8) | requestFrame[5];

          if (quantity < 1 || quantity > 125) {
            responsePayload = [slaveId, functionCode | 0x80, ModbusExceptionCode.IllegalDataValue];
            break;
          }

          const targetMap = functionCode === ModbusFunctionCode.ReadHoldingRegisters ? slaveMemory.holding : slaveMemory.input;
          
          // Check if address is valid in device
          const values: number[] = [];
          for (let i = 0; i < quantity; i++) {
            const addr = address + i;
            if (!targetMap.has(addr)) {
              // If outside supported range, return 0 or Exception 02 depending on device
              if (addr > 100) {
                responsePayload = [slaveId, functionCode | 0x80, ModbusExceptionCode.IllegalDataAddress];
                values.length = 0;
                break;
              }
              values.push(0);
            } else {
              values.push(targetMap.get(addr)!);
            }
          }

          if (values.length > 0) {
            const byteCount = quantity * 2;
            responsePayload.push(byteCount);
            for (const val of values) {
              responsePayload.push((val >> 8) & 0xff, val & 0xff);
            }
          }
          break;
        }

        case ModbusFunctionCode.ReadCoils:
        case ModbusFunctionCode.ReadDiscreteInputs: {
          const address = (requestFrame[2] << 8) | requestFrame[3];
          const quantity = (requestFrame[4] << 8) | requestFrame[5];

          if (quantity < 1 || quantity > 2000) {
            responsePayload = [slaveId, functionCode | 0x80, ModbusExceptionCode.IllegalDataValue];
            break;
          }

          const targetMap = functionCode === ModbusFunctionCode.ReadCoils ? slaveMemory.coils : slaveMemory.discrete;
          const byteCount = Math.ceil(quantity / 8);
          responsePayload.push(byteCount);

          for (let b = 0; b < byteCount; b++) {
            let byteVal = 0;
            for (let bit = 0; bit < 8; bit++) {
              const bitIndex = b * 8 + bit;
              if (bitIndex < quantity) {
                const isSet = targetMap.get(address + bitIndex) || false;
                if (isSet) byteVal |= (1 << bit);
              }
            }
            responsePayload.push(byteVal);
          }
          break;
        }

        case ModbusFunctionCode.WriteSingleRegister: {
          const address = (requestFrame[2] << 8) | requestFrame[3];
          const value = (requestFrame[4] << 8) | requestFrame[5];
          slaveMemory.holding.set(address, value);
          // Echo request frame for FC06
          responsePayload = [slaveId, functionCode, requestFrame[2], requestFrame[3], requestFrame[4], requestFrame[5]];
          break;
        }

        case ModbusFunctionCode.WriteSingleCoil: {
          const address = (requestFrame[2] << 8) | requestFrame[3];
          const coilValue = (requestFrame[4] << 8) | requestFrame[5];
          const isTrue = coilValue === 0xff00;
          slaveMemory.coils.set(address, isTrue);
          // Echo request frame for FC05
          responsePayload = [slaveId, functionCode, requestFrame[2], requestFrame[3], requestFrame[4], requestFrame[5]];
          break;
        }

        case ModbusFunctionCode.WriteMultipleRegisters: {
          const address = (requestFrame[2] << 8) | requestFrame[3];
          const quantity = (requestFrame[4] << 8) | requestFrame[5];
          const byteCount = requestFrame[6];
          for (let i = 0; i < quantity; i++) {
            const val = (requestFrame[7 + i * 2] << 8) | requestFrame[8 + i * 2];
            slaveMemory.holding.set(address + i, val);
          }
          // Response echo: slaveId, FC, addressHi, addressLo, qtyHi, qtyLo
          responsePayload = [slaveId, functionCode, requestFrame[2], requestFrame[3], requestFrame[4], requestFrame[5]];
          break;
        }

        default:
          responsePayload = [slaveId, functionCode | 0x80, ModbusExceptionCode.IllegalFunction];
      }
    } catch (err: any) {
      responsePayload = [slaveId, functionCode | 0x80, ModbusExceptionCode.SlaveDeviceFailure];
    }

    // Check fault injection: CRC Error
    let isCrcCorrupted = false;
    let [crcLo, crcHi] = getCRC16Bytes(responsePayload);

    if (this.faults.injectCrcErrors && Math.random() < this.faults.crcErrorProbability) {
      isCrcCorrupted = true;
      crcLo = (crcLo ^ 0x5a) & 0xff; // Invert bits to simulate electrical RS-485 noise
    }

    responsePayload.push(crcLo, crcHi);
    const responseFrame = new Uint8Array(responsePayload);
    const responseTimeMs = Math.round(performance.now() - startTime);

    return {
      responseFrame,
      responseTimeMs,
      isCrcError: isCrcCorrupted,
      error: isCrcCorrupted ? 'CRC16 Mismatch (Corrupted packet from electrical noise or baud mismatch)' : undefined,
    };
  }

  private getSlaveMemory(slaveId: number) {
    if (slaveId === 1) return this.memory.slave1;
    if (slaveId === 2) return this.memory.slave2;
    if (slaveId === 5) return this.memory.slave5;
    if (slaveId === 7) return this.memory.slave7;
    return null;
  }

  /**
   * Start passive HMI background traffic generation (for Auto-Learn demonstration)
   */
  public startPassiveTraffic(callback: (frame: TrafficFrame) => void) {
    this.passiveCallback = callback;
    if (this.passiveIntervalHandle) clearInterval(this.passiveIntervalHandle);

    const trafficPatterns = [
      { slave: 1, fc: ModbusFunctionCode.ReadHoldingRegisters, addr: 0, qty: 10 },
      { slave: 2, fc: ModbusFunctionCode.ReadInputRegisters, addr: 0, qty: 4 },
      { slave: 5, fc: ModbusFunctionCode.ReadInputRegisters, addr: 0, qty: 6 },
      { slave: 5, fc: ModbusFunctionCode.ReadHoldingRegisters, addr: 0, qty: 2 },
      { slave: 7, fc: ModbusFunctionCode.ReadCoils, addr: 0, qty: 8 },
      { slave: 2, fc: ModbusFunctionCode.ReadHoldingRegisters, addr: 0, qty: 3 },
    ];

    let patternIndex = 0;

    this.passiveIntervalHandle = setInterval(async () => {
      if (!this.faults.passiveTrafficEnabled || !this.passiveCallback) return;

      const pattern = trafficPatterns[patternIndex % trafficPatterns.length];
      patternIndex++;

      const txPayload = [
        pattern.slave,
        pattern.fc,
        (pattern.addr >> 8) & 0xff,
        pattern.addr & 0xff,
        (pattern.qty >> 8) & 0xff,
        pattern.qty & 0xff,
      ];
      const [txCrcLo, txCrcHi] = getCRC16Bytes(txPayload);
      txPayload.push(txCrcLo, txCrcHi);

      const txFrame: TrafficFrame = {
        id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        timestamp: Date.now(),
        timeFormatted: new Date().toLocaleTimeString(),
        direction: 'TX',
        protocol: 'RTU',
        slaveId: pattern.slave,
        functionCode: pattern.fc,
        functionName: pattern.fc === 3 ? 'FC03 Read Holding Registers' : pattern.fc === 4 ? 'FC04 Read Input Registers' : 'FC01 Read Coils',
        startAddress: pattern.addr,
        quantity: pattern.qty,
        hexPayload: bytesToHexString(txPayload),
        crc: `${txCrcLo.toString(16).padStart(2, '0')} ${txCrcHi.toString(16).padStart(2, '0')}`.toUpperCase(),
        crcValid: true,
      };

      this.passiveCallback(txFrame);

      // Execute simulated slave response
      const result = await this.executeQuery(new Uint8Array(txPayload));
      if (result.responseFrame) {
        const rxFrame: TrafficFrame = {
          id: `rx_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          timestamp: Date.now(),
          timeFormatted: new Date().toLocaleTimeString(),
          direction: 'RX',
          protocol: 'RTU',
          slaveId: pattern.slave,
          functionCode: pattern.fc,
          functionName: pattern.fc === 3 ? 'FC03 Response' : pattern.fc === 4 ? 'FC04 Response' : 'FC01 Response',
          startAddress: pattern.addr,
          quantity: pattern.qty,
          byteCount: result.responseFrame[2],
          hexPayload: bytesToHexString(result.responseFrame),
          responseTimeMs: result.responseTimeMs,
          crcValid: !result.isCrcError,
        };
        this.passiveCallback(rxFrame);
      }
    }, this.faults.passiveTrafficIntervalMs);
  }

  public stopPassiveTraffic() {
    if (this.passiveIntervalHandle) {
      clearInterval(this.passiveIntervalHandle);
      this.passiveIntervalHandle = null;
    }
  }

  public dispose() {
    this.stopPassiveTraffic();
    if (this.simulationTickHandle) clearInterval(this.simulationTickHandle);
  }
}
