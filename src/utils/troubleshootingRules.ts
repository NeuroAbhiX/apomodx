/**
 * APOMODX - Industrial Rule-Based Smart Troubleshooting & Diagnostic Expert
 * Operates 100% offline with zero cloud dependency
 */

import { TroubleshootingRule } from '../types/modbus';

export const TROUBLESHOOTING_RULES: TroubleshootingRule[] = [
  {
    id: 'rule_crc_mismatch',
    title: 'High CRC16 Checksum Error Rate',
    errorCategory: 'CRC',
    category: 'crc',
    severity: 'critical',
    symptom: 'Frequent CRC error warnings in console, health dropping below 85%, corrupted hex payload received.',
    rootCause: 'Electrical noise induced by nearby VFDs/contactors, mismatched parity (None vs Even), or missing 120Ω termination resistors.',
    actions: [
      'Verify and align Baud Rate, Parity, and Stop Bits on both master and slave.',
      'Measure RS-485 bus differential voltage with multimeter (Idle state should be V_A - V_B > +200mV with bias).',
      'Ensure 120Ω termination resistors are installed only at the two extreme physical ends of the daisy chain.',
      'Verify RS-485 cable shield is grounded at ONE single end only (to prevent ground loops).',
      'Lower the baud rate temporarily to 9600 to test if noise susceptibility improves.',
    ],
    symptoms: [
      'Frequent CRC error warnings in console',
      'Communication health dropping below 85%',
      'Garbled hex payload received from device',
    ],
    possibleCauses: [
      'Electrical noise induced by nearby VFDs, contactors, or unshielded motor leads',
      'Mismatched parity setting (e.g. Master configured as None parity, Slave expects Even)',
      'Incorrect baud rate (e.g. 9600 bps vs 19200 bps)',
      'Missing or improperly placed 120Ω termination resistors at the physical ends of RS-485 line',
      'Floating ground / Common-mode voltage offset between isolated RS-485 nodes',
      'Damaged RS485 transceiver chip (SN75176 / MAX485)',
    ],
    recommendedActions: [
      '1. Verify and align Baud Rate, Parity, and Stop Bits on both master and slave.',
      '2. Measure RS-485 bus differential voltage with multimeter (Idle state should be V_A - V_B > +200mV with bias).',
      '3. Ensure 120Ω termination resistors are installed only at the two extreme physical ends of the daisy chain.',
      '4. Verify RS-485 cable shield is grounded at ONE single end only (to prevent ground loops).',
      '5. Lower the baud rate temporarily to 9600 to test if noise susceptibility improves.',
    ],
    quickAction: {
      label: 'Run Auto Parameter Detection',
      actionType: 'check_config',
    },
  },
  {
    id: 'rule_timeout',
    title: 'Response Timeout / No Frame Received',
    errorCategory: 'TIMEOUT',
    category: 'timeout',
    severity: 'critical',
    symptom: 'Target slave does not reply within configured timeout threshold (default 1000ms). TX frame sent with zero RX response.',
    rootCause: 'Reversed RS-485 A/B polarity, wrong Slave ID, unpowered device, or defective USB-to-RS485 adapter.',
    actions: [
      'Swap RS-485 wire pair A and B terminals at the adapter (Safe to test; inverted polarity does not damage RS-485).',
      'Run Slave Discovery Scan (range 1-247) to find the actual hardware address of the device.',
      'Check device front panel LED for TX/RX optical feedback or error blinks.',
      'Increase poll timeout to 1500ms in Communication Settings.',
      'Confirm 24VDC / 230VAC supply voltage at slave power terminals.',
    ],
    symptoms: [
      'Slave does not respond within timeout deadline (default 1000ms)',
      'TX packet sent with no corresponding RX reply',
      'Target slave appears offline in network view',
    ],
    possibleCauses: [
      'Wrong Slave ID configured in poll group or request',
      'Inverted RS-485 Polarity: RS-485 Data+ (A/+) and Data- (B/-) lines reversed (most common RS-485 commissioning fault!)',
      'Slave device is unpowered, in bootloader mode, or DIP switches set differently than documented',
      'USB-to-RS485 adapter driver issues or physical loose terminal block connection',
      'Master timeout is too aggressive for a slow PLC/controller cycle time (e.g. < 200ms)',
    ],
    recommendedActions: [
      '1. Swap RS-485 wire pair A and B terminals at the adapter (Safe to test; inverted polarity does not damage RS-485).',
      '2. Run Slave Discovery Scan (range 1-247) to find the actual hardware address of the device.',
      '3. Check device front panel LED for TX/RX optical feedback or error blinks.',
      '4. Increase poll timeout to 1500ms in Communication Settings.',
      '5. Confirm 24VDC / 230VAC supply voltage at slave power terminals.',
    ],
    quickAction: {
      label: 'Scan Slaves 1-247',
      actionType: 'run_test',
    },
  },
  {
    id: 'rule_exception_02',
    title: 'Modbus Exception 02: Illegal Data Address',
    errorCategory: 'EXCEPTION',
    category: 'exception',
    severity: 'high',
    symptom: 'Slave returns Exception Response 0x83 02 or 0x84 02 when attempting to read registers.',
    rootCause: 'Off-by-one address offset mismatch (0-based protocol offset vs 1-based / 40001 notation), or requesting non-existent address block.',
    actions: [
      'Try shifting address by -1 or +1 in the Address Helper / Request Builder.',
      'Switch between 0-based Protocol Address and 1-based / Modicon 40001 notation in the UI.',
      'Reduce register read Quantity to 1 to locate the exact valid register boundaries.',
      'Run Active Register Discovery on range 0-100 to map available address blocks.',
    ],
    symptoms: [
      'Slave returns Exception Response 0x83 02 or 0x84 02',
      'Cannot read register ranges specified in manual',
    ],
    possibleCauses: [
      '0-based vs 1-based offset confusion: Device document lists register 40001 (offset 0), but request sent address 1 (register 40002)',
      'Requesting a block of registers that crosses a non-existent or reserved register gap in the device memory',
      'Device requires reading in pairs (e.g. 32-bit Float32 requires reading exactly 2 registers at an even address boundary)',
      'Firmware version mismatch: Feature or register block is only present on higher firmware editions',
    ],
    recommendedActions: [
      '1. Try shifting address by -1 or +1 in the Address Helper / Request Builder.',
      '2. Switch between 0-based Protocol Address and 1-based / Modicon 40001 notation in the UI.',
      '3. Reduce register read Quantity to 1 to locate the exact valid register boundaries.',
      '4. Run Active Register Discovery on range 0-100 to map available address blocks.',
    ],
    quickAction: {
      label: 'Open Address Converter Helper',
      actionType: 'check_config',
    },
  },
  {
    id: 'rule_exception_01',
    title: 'Modbus Exception 01: Illegal Function Code',
    errorCategory: 'EXCEPTION',
    category: 'exception',
    severity: 'high',
    symptom: 'Slave returns Exception Response 0x80 + FC (e.g. 0x83 01) indicating command is unsupported.',
    rootCause: 'Target slave does not implement the requested function code (e.g. slave only supports FC04 Input Registers, not FC03 Holding Registers).',
    actions: [
      'Check device manual for supported Function Codes table.',
      'If reading measurements, test FC04 (Read Input Registers) instead of FC03 (Read Holding Registers).',
      'Verify write-protect DIP switch on the device body.',
    ],
    symptoms: [
      'Slave returns Exception Response 0x80 + FC (e.g. 0x83 01)',
    ],
    possibleCauses: [
      'Device does not support this Function Code (e.g., Device only supports FC04 Input Registers, but Master sent FC03 Holding Registers)',
      'Device write operations are hardware-locked via physical DIP switch or software parameter lock',
      'Attempting FC16 (Write Multiple) on a legacy slave that only supports FC06 (Write Single)',
    ],
    recommendedActions: [
      '1. Check device manual for supported Function Codes table.',
      '2. If reading measurements, test FC04 (Read Input Registers) instead of FC03 (Read Holding Registers).',
      '3. Verify write-protect DIP switch on the device body.',
    ],
    quickAction: {
      label: 'Test All Function Codes',
      actionType: 'run_test',
    },
  },
  {
    id: 'rule_duplicate_slave',
    title: 'Suspected Duplicate / Conflicting Slave IDs',
    errorCategory: 'NETWORK',
    category: 'electrical',
    severity: 'critical',
    symptom: 'Intermittent CRC errors that only occur when a specific slave is addressed, or simultaneous responses on RS-485.',
    rootCause: 'Two physical devices programmed with the same Slave Address on the same RS-485 loop (e.g. both set to default ID 1).',
    actions: [
      'Disconnect slaves one-by-one to isolate which devices share the conflicting address.',
      'Reassign individual unique Slave IDs (1 to 247) on each field device.',
      'Ensure master turnaround delay is configured to at least 10-20ms to allow line tristate.',
    ],
    symptoms: [
      'Intermittent CRC errors that only occur when a specific slave is addressed',
      'Corrupted, overlapping waveforms on oscilloscope or garbled mixed byte lengths',
      'Two devices responding simultaneously on the same RS-485 2-wire bus',
    ],
    possibleCauses: [
      'Two field devices programmed with identical Slave Address on the same COM port loop',
      'Default factory address (often Address 1) was not changed during commissioning',
    ],
    recommendedActions: [
      '1. Disconnect slaves one-by-one to isolate which devices share the conflicting address.',
      '2. Reassign individual unique Slave IDs (1 to 247) on each field device.',
      '3. Ensure master turnaround delay is configured to at least 10-20ms to allow line tristate.',
    ],
    quickAction: {
      label: 'Run Network Diagnostics',
      actionType: 'run_test',
    },
  },
];

export function diagnoseProblemText(query: string): TroubleshootingRule[] {
  const q = query.toLowerCase();
  const matched: TroubleshootingRule[] = [];

  for (const rule of TROUBLESHOOTING_RULES) {
    let score = 0;
    if (q.includes('crc') && rule.errorCategory === 'CRC') score += 5;
    if ((q.includes('timeout') || q.includes('not respond') || q.includes('offline') || q.includes('no response')) && rule.errorCategory === 'TIMEOUT') score += 5;
    if ((q.includes('address') || q.includes('40001') || q.includes('offset') || q.includes('02') || q.includes('illegal')) && rule.id === 'rule_exception_02') score += 5;
    if ((q.includes('function') || q.includes('fc03') || q.includes('fc04') || q.includes('01')) && rule.id === 'rule_exception_01') score += 5;
    if ((q.includes('duplicate') || q.includes('conflict') || q.includes('two device')) && rule.id === 'rule_duplicate_slave') score += 5;

    for (const s of rule.symptoms) {
      if (q.includes(s.toLowerCase())) score += 2;
    }
    for (const c of rule.possibleCauses) {
      if (q.includes(c.toLowerCase())) score += 2;
    }

    if (score > 0) {
      matched.push(rule);
    }
  }

  return matched.length > 0 ? matched : TROUBLESHOOTING_RULES.slice(0, 3);
}
