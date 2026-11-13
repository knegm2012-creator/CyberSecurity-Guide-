'use client';

import React, { useState, useMemo } from 'react';
import {
  Binary,
  Cpu,
  Calculator,
  Zap,
  CheckCircle2,
  Circle,
  Sparkles,
  ArrowRight,
  RotateCcw,
  ShieldAlert,
  Flame,
  Award,
  Terminal,
  Layers,
  ArrowLeftRight,
  Sliders,
  Copy,
  Check,
  HelpCircle,
  KeyRound,
  Network
} from 'lucide-react';
import { SoapBubbleButton, SoapBubbleSlider, SoapBubbleToggle } from '@/components/soap-bubble';

interface FoundationsStudioProps {
  onOpenAiMentor: (prompt?: string) => void;
  onAwardXp?: (amount: number) => void;
}

type GateType = 'AND' | 'OR' | 'NOT' | 'XOR' | 'NAND' | 'NOR' | 'XNOR';
type BitWidth = 8 | 16;

type FoundationsTab =
  | 'converter'
  | 'bitwise'
  | 'shifts'
  | 'applications'
  | 'twoscomp'
  | 'powers'
  | 'logic'
  | 'hardware'
  | 'checklist';

export function FoundationsStudio({ onOpenAiMentor, onAwardXp }: FoundationsStudioProps) {
  const [activeTab, setActiveTab] = useState<FoundationsTab>('converter');

  // =========================================================================
  // 1. BASE CONVERTER & MULTI-RADIX WIDGET STATE
  // =========================================================================
  const [bitWidth, setBitWidth] = useState<BitWidth>(8);
  const [registerBits, setRegisterBits] = useState<number[]>([0, 0, 1, 0, 1, 0, 1, 0]); // 42 in 8-bit
  const [convInputDec, setConvInputDec] = useState('42');
  const [convInputHex, setConvInputHex] = useState('2A');
  const [convInputBin, setConvInputBin] = useState('00101010');
  const [convInputOct, setConvInputOct] = useState('52');
  const [overflowTriggered, setOverflowTriggered] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Synchronize representations from bits
  const unsignedDec = useMemo(() => {
    return registerBits.reduce((acc, bit, idx) => acc + bit * Math.pow(2, registerBits.length - 1 - idx), 0);
  }, [registerBits]);

  const signedDec = useMemo(() => {
    const maxVal = Math.pow(2, registerBits.length);
    const msbWeight = Math.pow(2, registerBits.length - 1);
    if (registerBits[0] === 1) {
      return unsignedDec - maxVal;
    }
    return unsignedDec;
  }, [registerBits, unsignedDec]);

  const hexString = useMemo(() => {
    const hexDigits = bitWidth / 4;
    return unsignedDec.toString(16).toUpperCase().padStart(hexDigits, '0');
  }, [unsignedDec, bitWidth]);

  const octalString = useMemo(() => {
    return unsignedDec.toString(8);
  }, [unsignedDec]);

  const asciiChar = useMemo(() => {
    if (bitWidth === 8 && unsignedDec >= 32 && unsignedDec <= 126) {
      return String.fromCharCode(unsignedDec);
    }
    return null;
  }, [unsignedDec, bitWidth]);

  // Update bits array when bit width changes
  const handleBitWidthChange = (newWidth: BitWidth) => {
    setBitWidth(newWidth);
    setOverflowTriggered(false);
    if (newWidth === 16 && registerBits.length === 8) {
      setRegisterBits([...Array(8).fill(0), ...registerBits]);
    } else if (newWidth === 8 && registerBits.length === 16) {
      setRegisterBits(registerBits.slice(8));
    }
  };

  const syncAllFromNumber = (num: number, targetWidth: BitWidth = bitWidth) => {
    const maxVal = Math.pow(2, targetWidth);
    let normalized = num;
    if (normalized < 0) {
      normalized = (maxVal + (normalized % maxVal)) % maxVal;
    } else if (normalized >= maxVal) {
      setOverflowTriggered(true);
      normalized = normalized % maxVal;
    } else {
      setOverflowTriggered(false);
    }

    const binStr = normalized.toString(2).padStart(targetWidth, '0').slice(-targetWidth);
    const newBits = binStr.split('').map(Number);
    setRegisterBits(newBits);
    setConvInputDec(normalized.toString());
    setConvInputHex(normalized.toString(16).toUpperCase().padStart(targetWidth / 4, '0'));
    setConvInputBin(binStr);
    setConvInputOct(normalized.toString(8));
  };

  const toggleSingleBit = (idx: number) => {
    setOverflowTriggered(false);
    const next = [...registerBits];
    next[idx] = next[idx] === 1 ? 0 : 1;
    setRegisterBits(next);

    const newDec = next.reduce((acc, bit, i) => acc + bit * Math.pow(2, next.length - 1 - i), 0);
    setConvInputDec(newDec.toString());
    setConvInputHex(newDec.toString(16).toUpperCase().padStart(bitWidth / 4, '0'));
    setConvInputBin(next.join(''));
    setConvInputOct(newDec.toString(8));
  };

  const handleDecChange = (val: string) => {
    setConvInputDec(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed)) {
      syncAllFromNumber(parsed);
    }
  };

  const handleHexChange = (val: string) => {
    setConvInputHex(val);
    const cleaned = val.replace(/^0x/i, '').trim();
    const parsed = parseInt(cleaned, 16);
    if (!isNaN(parsed)) {
      syncAllFromNumber(parsed);
    }
  };

  const handleBinChange = (val: string) => {
    setConvInputBin(val);
    const cleaned = val.replace(/\s+/g, '').replace(/^0b/i, '').trim();
    if (/^[01]+$/.test(cleaned)) {
      const parsed = parseInt(cleaned, 2);
      if (!isNaN(parsed)) {
        syncAllFromNumber(parsed);
      }
    }
  };

  const handleOctChange = (val: string) => {
    setConvInputOct(val);
    const cleaned = val.replace(/^0o/i, '').trim();
    const parsed = parseInt(cleaned, 8);
    if (!isNaN(parsed)) {
      syncAllFromNumber(parsed);
    }
  };

  // =========================================================================
  // 2. BITWISE OPERATIONS & MASKING ENGINE
  // =========================================================================
  const [bitwiseOp, setBitwiseOp] = useState<'AND' | 'OR' | 'XOR' | 'NOT' | 'NAND' | 'NOR' | 'XNOR'>('AND');
  const [opBitsA, setOpBitsA] = useState<number[]>([1, 1, 0, 0, 1, 0, 1, 0]); // 202 (0xCA)
  const [opBitsB, setOpBitsB] = useState<number[]>([1, 1, 1, 1, 0, 0, 0, 0]); // 240 (0xF0 mask)

  const toggleBitA = (idx: number) => {
    const next = [...opBitsA];
    next[idx] = next[idx] === 1 ? 0 : 1;
    setOpBitsA(next);
  };

  const toggleBitB = (idx: number) => {
    const next = [...opBitsB];
    next[idx] = next[idx] === 1 ? 0 : 1;
    setOpBitsB(next);
  };

  const bitwiseResult = useMemo(() => {
    return opBitsA.map((bitA, idx) => {
      const bitB = opBitsB[idx];
      switch (bitwiseOp) {
        case 'AND':
          return bitA & bitB;
        case 'OR':
          return bitA | bitB;
        case 'XOR':
          return bitA ^ bitB;
        case 'NOT':
          return bitA === 1 ? 0 : 1;
        case 'NAND':
          return (bitA & bitB) === 1 ? 0 : 1;
        case 'NOR':
          return (bitA | bitB) === 1 ? 0 : 1;
        case 'XNOR':
          return bitA === bitB ? 1 : 0;
        default:
          return 0;
      }
    });
  }, [opBitsA, opBitsB, bitwiseOp]);

  const decA = useMemo(() => opBitsA.reduce((a, b, i) => a + b * Math.pow(2, 7 - i), 0), [opBitsA]);
  const decB = useMemo(() => opBitsB.reduce((a, b, i) => a + b * Math.pow(2, 7 - i), 0), [opBitsB]);
  const decRes = useMemo(() => bitwiseResult.reduce((a, b, i) => a + b * Math.pow(2, 7 - i), 0), [bitwiseResult]);

  const applyBitmaskPreset = (presetName: string) => {
    if (presetName === 'clear_low') {
      setOpBitsB([1, 1, 1, 1, 0, 0, 0, 0]); // 0xF0
    } else if (presetName === 'clear_high') {
      setOpBitsB([0, 0, 0, 0, 1, 1, 1, 1]); // 0x0F
    } else if (presetName === 'toggle_even') {
      setOpBitsB([1, 0, 1, 0, 1, 0, 1, 0]); // 0xAA
    } else if (presetName === 'toggle_odd') {
      setOpBitsB([0, 1, 0, 1, 0, 1, 0, 1]); // 0x55
    } else if (presetName === 'invert_all') {
      setOpBitsB([1, 1, 1, 1, 1, 1, 1, 1]); // 0xFF
    } else if (presetName === 'syn_mask') {
      setOpBitsB([0, 0, 0, 0, 0, 0, 1, 0]); // 0x02 SYN flag
    }
  };

  // =========================================================================
  // 3. REAL-TIME BIT SHIFTS & ROTATION ENGINE
  // =========================================================================
  const [shiftRegister, setShiftRegister] = useState<number[]>([0, 0, 1, 0, 1, 0, 1, 0]); // 42
  const [shiftAmount, setShiftAmount] = useState<number>(1);
  const [lastShiftLog, setLastShiftLog] = useState<{
    op: string;
    origDec: number;
    newDec: number;
    carryOut: number | string;
    formula: string;
  }>({
    op: 'Ready',
    origDec: 42,
    newDec: 42,
    carryOut: 'None',
    formula: 'Initial state: 42 (00101010)'
  });

  const shiftDec = useMemo(() => {
    return shiftRegister.reduce((acc, b, i) => acc + b * Math.pow(2, 7 - i), 0);
  }, [shiftRegister]);

  const performShift = (type: 'shl' | 'shr_log' | 'shr_arith' | 'rol' | 'ror') => {
    const origDec = shiftDec;
    let nextBits = [...shiftRegister];
    let carryOut: number | string = 0;
    let formula = '';

    for (let step = 0; step < shiftAmount; step++) {
      if (type === 'shl') {
        carryOut = nextBits[0];
        nextBits = [...nextBits.slice(1), 0];
        formula = `${origDec} << ${shiftAmount} = (${origDec} × ${Math.pow(2, shiftAmount)})`;
      } else if (type === 'shr_log') {
        carryOut = nextBits[7];
        nextBits = [0, ...nextBits.slice(0, 7)];
        formula = `${origDec} >>> ${shiftAmount} = floor(${origDec} / ${Math.pow(2, shiftAmount)})`;
      } else if (type === 'shr_arith') {
        carryOut = nextBits[7];
        const msb = nextBits[0]; // preserve sign bit
        nextBits = [msb, ...nextBits.slice(0, 7)];
        formula = `${origDec} >> ${shiftAmount} (Preserves sign bit ${msb})`;
      } else if (type === 'rol') {
        const msb = nextBits[0];
        carryOut = msb;
        nextBits = [...nextBits.slice(1), msb];
        formula = `Rotate Left ${shiftAmount}: Bit 7 wrapped to Bit 0`;
      } else if (type === 'ror') {
        const lsb = nextBits[7];
        carryOut = lsb;
        nextBits = [lsb, ...nextBits.slice(0, 7)];
        formula = `Rotate Right ${shiftAmount}: Bit 0 wrapped to Bit 7`;
      }
    }

    setShiftRegister(nextBits);
    const newDec = nextBits.reduce((acc, b, i) => acc + b * Math.pow(2, 7 - i), 0);
    setLastShiftLog({
      op: type.toUpperCase(),
      origDec,
      newDec,
      carryOut,
      formula
    });
  };

  const resetShiftRegister = (val: number = 42) => {
    const binStr = (val >>> 0).toString(2).padStart(8, '0').slice(-8);
    const bits = binStr.split('').map(Number);
    setShiftRegister(bits);
    setLastShiftLog({
      op: 'RESET',
      origDec: val,
      newDec: val,
      carryOut: 'None',
      formula: `Reset register to ${val} (${binStr})`
    });
  };

  // =========================================================================
  // 4. REAL-WORLD SYSTEMS: LINUX CHMOD & TCP PACKET FLAGS
  // =========================================================================
  // Linux Chmod (9 bits: User rwx, Group rwx, Others rwx)
  const [chmodBits, setChmodBits] = useState<number[]>([1, 1, 1, 1, 0, 1, 1, 0, 1]); // 755 (rwxr-xr-x)

  const toggleChmodBit = (idx: number) => {
    const next = [...chmodBits];
    next[idx] = next[idx] === 1 ? 0 : 1;
    setChmodBits(next);
  };

  const userOctal = chmodBits[0] * 4 + chmodBits[1] * 2 + chmodBits[2] * 1;
  const groupOctal = chmodBits[3] * 4 + chmodBits[4] * 2 + chmodBits[5] * 1;
  const otherOctal = chmodBits[6] * 4 + chmodBits[7] * 2 + chmodBits[8] * 1;
  const chmodOctal = `0${userOctal}${groupOctal}${otherOctal}`;

  const chmodSymbolic = [
    chmodBits[0] ? 'r' : '-',
    chmodBits[1] ? 'w' : '-',
    chmodBits[2] ? 'x' : '-',
    chmodBits[3] ? 'r' : '-',
    chmodBits[4] ? 'w' : '-',
    chmodBits[5] ? 'x' : '-',
    chmodBits[6] ? 'r' : '-',
    chmodBits[7] ? 'w' : '-',
    chmodBits[8] ? 'x' : '-'
  ].join('');

  // TCP Header Flags (6 bits)
  const [tcpFlags, setTcpFlags] = useState<{ [key: string]: boolean }>({
    URG: false,
    ACK: true,
    PSH: false,
    RST: false,
    SYN: true,
    FIN: false
  });

  const toggleTcpFlag = (flagName: string) => {
    setTcpFlags((prev) => ({ ...prev, [flagName]: !prev[flagName] }));
  };

  const tcpHexVal = useMemo(() => {
    let val = 0;
    if (tcpFlags.URG) val += 32;
    if (tcpFlags.ACK) val += 16;
    if (tcpFlags.PSH) val += 8;
    if (tcpFlags.RST) val += 4;
    if (tcpFlags.SYN) val += 2;
    if (tcpFlags.FIN) val += 1;
    return '0x' + val.toString(16).toUpperCase().padStart(2, '0');
  }, [tcpFlags]);

  // =========================================================================
  // 5. TWO'S COMPLEMENT STEP-BY-STEP PROOF STATE
  // =========================================================================
  const [twosCompNum, setTwosCompNum] = useState<number>(42);
  const positiveBits = useMemo(() => {
    const clamped = Math.max(0, Math.min(127, Math.abs(twosCompNum)));
    return (clamped >>> 0).toString(2).padStart(8, '0').split('').map(Number);
  }, [twosCompNum]);

  const invertedBits = useMemo(() => {
    return positiveBits.map((b) => (b === 1 ? 0 : 1));
  }, [positiveBits]);

  const negativeBits = useMemo(() => {
    // Add 1 to invertedBits in 8-bit
    let carry = 1;
    const res: number[] = [...invertedBits];
    for (let i = 7; i >= 0; i--) {
      const sum = res[i] + carry;
      res[i] = sum % 2;
      carry = Math.floor(sum / 2);
    }
    return res;
  }, [invertedBits]);

  const twosCompVerificationSum = useMemo(() => {
    // Adding positiveBits and negativeBits
    let carry = 0;
    const sumBits: number[] = [];
    for (let i = 7; i >= 0; i--) {
      const sum = positiveBits[i] + negativeBits[i] + carry;
      sumBits.unshift(sum % 2);
      carry = Math.floor(sum / 2);
    }
    return { sumBits, finalCarry: carry };
  }, [positiveBits, negativeBits]);

  // =========================================================================
  // 6. POWERS OF TWO FLASH DRILL & TABLE
  // =========================================================================
  const POWERS_OF_TWO = [
    { exp: 0, val: 1, name: 'Single Bit', meaning: 'The atomic binary state (0 or 1)' },
    { exp: 1, val: 2, name: '2 States', meaning: 'True or False, High or Low voltage' },
    { exp: 2, val: 4, name: '4 States', meaning: '2-bit representation (00, 01, 10, 11)' },
    { exp: 3, val: 8, name: 'Nibble (4 bits)', meaning: 'Exact size of 1 Hexadecimal digit (0-F)' },
    { exp: 4, val: 16, name: 'Base-16', meaning: 'Hexadecimal numbering base' },
    { exp: 5, val: 32, name: '32 States', meaning: '5-bit encoding, classic IPv4 header fields' },
    { exp: 6, val: 64, name: 'Base64 chunk', meaning: 'Base64 index range, 64-bit architecture words' },
    { exp: 7, val: 128, name: 'ASCII Table Size', meaning: 'Standard 7-bit ASCII character set' },
    { exp: 8, val: 256, name: '1 Byte (8 bits)', meaning: 'Max IPv4 octet (0-255), 2 hex digits' },
    { exp: 9, val: 512, name: 'Classic Disk Sector', meaning: 'Standard physical disk sector size in bytes' },
    { exp: 10, val: 1024, name: '1 KiB (Kibibyte)', meaning: '1024 bytes in binary systems (not 1000!)' },
    { exp: 11, val: 2048, name: '2 KiB', meaning: 'Standard RSA key minimum recommended size' },
    { exp: 12, val: 4096, name: '4 KiB Memory Page', meaning: 'Default virtual memory page size on x86-64 OS' },
    { exp: 13, val: 8192, name: '8 KiB', meaning: 'Common web server HTTP header buffer limit' },
    { exp: 14, val: 16384, name: '16 KiB', meaning: 'Standard L1 cache size per core' },
    { exp: 15, val: 32768, name: '32 KiB', meaning: 'Max value of signed 16-bit integer (+32,767)' },
    { exp: 16, val: 65536, name: '64 KiB / Port Limit', meaning: 'Total number of TCP and UDP ports (0 to 65,535)!' }
  ];

  const [drillScore, setDrillScore] = useState(0);
  const [drillStreak, setDrillStreak] = useState(0);
  const [drillFeedback, setDrillFeedback] = useState<string | null>(null);
  const [drillQuestion, setDrillQuestion] = useState<{
    prompt: string;
    options: number[];
    correct: number;
    explanation: string;
  }>({
    prompt: 'What is 2^8 (the total unique values in 1 Byte)?',
    options: [128, 256, 512, 1024],
    correct: 256,
    explanation: '2^8 = 256. An 8-bit register can store values from 0 to 255 (256 total states).'
  });

  const generateNextDrill = () => {
    setDrillFeedback(null);
    const randomIndex = Math.floor(Math.random() * (POWERS_OF_TWO.length - 1)) + 1;
    const item = POWERS_OF_TWO[randomIndex];
    const correctVal = item.val;

    const distractors = new Set<number>();
    while (distractors.size < 3) {
      const offset = (Math.floor(Math.random() * 5) - 2) || 1;
      const fakeExp = Math.max(0, Math.min(16, item.exp + offset));
      const fakeVal = POWERS_OF_TWO[fakeExp].val;
      if (fakeVal !== correctVal) {
        distractors.add(fakeVal);
      }
    }

    const options = Array.from(distractors);
    options.splice(Math.floor(Math.random() * 4), 0, correctVal);

    setDrillQuestion({
      prompt: `What is 2^${item.exp} (${item.name})?`,
      options,
      correct: correctVal,
      explanation: `2^${item.exp} equals ${correctVal.toLocaleString()}. ${item.meaning}`
    });
  };

  const handleDrillAnswer = (chosen: number) => {
    if (chosen === drillQuestion.correct) {
      const newScore = drillScore + 10;
      const newStreak = drillStreak + 1;
      setDrillScore(newScore);
      setDrillStreak(newStreak);
      setDrillFeedback(`CORRECT! +10 XP. ${drillQuestion.explanation}`);
      if (onAwardXp) onAwardXp(10);
    } else {
      setDrillStreak(0);
      setDrillFeedback(`INCORRECT. The correct answer was ${drillQuestion.correct.toLocaleString()}.`);
    }
  };

  // =========================================================================
  // 7. BOOLEAN LOGIC GATES STATE
  // =========================================================================
  const [selectedGate, setSelectedGate] = useState<GateType>('AND');
  const [inputA, setInputA] = useState<0 | 1>(1);
  const [inputB, setInputB] = useState<0 | 1>(0);

  const GATE_SPECS: Record<
    GateType,
    { formula: string; rule: string; securityRole: string; compute: (a: number, b: number) => number }
  > = {
    AND: {
      formula: 'Q = A · B',
      rule: 'Output is 1 ONLY IF both A and B are 1.',
      securityRole: 'Used for IP subnet masking (IP & Subnet Mask = Network ID) and clearing specific bits.',
      compute: (a, b) => (a === 1 && b === 1 ? 1 : 0)
    },
    OR: {
      formula: 'Q = A + B',
      rule: 'Output is 1 IF either A or B (or both) are 1.',
      securityRole: 'Used to combine configuration flags (e.g. O_RDWR | O_CREAT in Linux open system call).',
      compute: (a, b) => (a === 1 || b === 1 ? 1 : 0)
    },
    NOT: {
      formula: 'Q = ¬A',
      rule: 'Inverts the signal (0 becomes 1, 1 becomes 0).',
      securityRole: 'Used to calculate One\'s Complement and invert firewall rule criteria.',
      compute: (a) => (a === 1 ? 0 : 1)
    },
    XOR: {
      formula: 'Q = A ⊕ B',
      rule: 'Output is 1 IF inputs are DIFFERENT. Output is 0 if inputs are identical.',
      securityRole: 'The holy grail of cryptography: One-Time Pad, AES encryption rounds, parity checksums, and zeroing CPU registers (xor eax, eax).',
      compute: (a, b) => (a !== b ? 1 : 0)
    },
    NAND: {
      formula: 'Q = ¬(A · B)',
      rule: 'Output is 0 ONLY IF both inputs are 1. (Universal Gate)',
      securityRole: 'A universal logic gate! Any digital computer circuit in the world can be built purely from NAND gates (Nand2Tetris foundations).',
      compute: (a, b) => (a === 1 && b === 1 ? 0 : 1)
    },
    NOR: {
      formula: 'Q = ¬(A + B)',
      rule: 'Output is 1 ONLY IF both inputs are 0. (Universal Gate)',
      securityRole: 'Another universal gate, used in hardware SR flip-flops for atomic memory latches and SRAM.',
      compute: (a, b) => (a === 0 && b === 0 ? 1 : 0)
    },
    XNOR: {
      formula: 'Q = ¬(A ⊕ B)',
      rule: 'Output is 1 IF inputs are IDENTICAL (equality comparator).',
      securityRole: 'Used in hardware comparators to verify cryptographic hashes and CPU branch condition matching.',
      compute: (a, b) => (a === b ? 1 : 0)
    }
  };

  const currentGateOutput = GATE_SPECS[selectedGate].compute(inputA, inputB);

  // =========================================================================
  // 8. MINIMUM MATH CHECKLIST STATE
  // =========================================================================
  const MATH_CHECKLIST = [
    {
      id: 'powers_of_two',
      title: 'Powers of 2 (2^0 to 2^16)',
      desc: 'Can recite 1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536 from memory instantly.'
    },
    {
      id: 'hex_nibbles',
      title: 'Hexadecimal to 4-bit Binary Nibbles',
      desc: 'Can instantly convert any single hex digit (0-F) into 4 bits (e.g. A = 1010, F = 1111, C = 1100).'
    },
    {
      id: 'bitwise_truth',
      title: 'Bitwise Logic Operations (AND, OR, XOR, NOT)',
      desc: 'Understand truth tables and know that A ^ A = 0, A ^ 0 = A, and how XOR functions in ciphers.'
    },
    {
      id: 'twos_complement',
      title: "Two's Complement Signed Integers",
      desc: 'Know how negative numbers are stored (invert bits + add 1) and why 8-bit signed range is -128 to +127.'
    },
    {
      id: 'bit_shifts',
      title: 'Bit Shifts (<<, >>, >>>)',
      desc: 'Understand that x << 1 multiplies by 2, x >> 1 divides by 2, and arithmetic shift preserves the sign bit.'
    },
    {
      id: 'linux_octal_chmod',
      title: 'Octal Numbers for Linux File Permissions',
      desc: 'Understand why chmod 755 is 111 101 101 in binary, corresponding to rwxr-xr-x.'
    },
    {
      id: 'modulo_arithmetic',
      title: 'Modulo Arithmetic (%) & Ring Buffers',
      desc: 'Understand remainder arithmetic used in hash tables, Caesar ciphers, and circular buffers.'
    },
    {
      id: 'algebra_substitution',
      title: 'Basic Algebra & Variable Substitution',
      desc: 'Comfortable solving for x in expressions like 2^x = 65536 or finding netmasks for subnet sizing.'
    }
  ];

  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({
    powers_of_two: true,
    hex_nibbles: true,
    bitwise_truth: true
  });

  const toggleCheck = (id: string) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="optical-panel rounded-2xl p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-white/[0.08] pb-5">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-sky-400 mb-1">
              Bedrock Foundations · Binary, Hex, Algebra &amp; Logic Gates
            </div>
            <h3 className="font-display text-xl font-bold text-white tracking-tight [text-wrap:balance]">
              Foundations Studio
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl">
              Master electrical switches, binary bits, hex nibbles, bitwise shifts, and Boolean logic interactively.
            </p>
          </div>

          <SoapBubbleButton
            onClick={() =>
              onOpenAiMentor(
                'ELI9: Explain how electricity in silicon creates 0s and 1s, how bitwise shifts work in computer hardware, and why hexadecimal matters for systems programming.'
              )
            }
            tint="rgb(14 165 233)"
            opacity={0.9}
            style={{ fontSize: 12 }}
            className="!min-h-[34px] !px-4 font-medium text-white shrink-0"
          >
            <Sparkles className="h-4 w-4 text-sky-100" />
            <span>Ask AI Tutor: Fundamentals</span>
          </SoapBubbleButton>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="optical-subnav rounded-xl p-1 flex gap-1 text-xs font-medium overflow-x-auto no-scrollbar">
          {(
            [
              { id: 'converter', label: '1. Base Converter', icon: ArrowLeftRight },
              { id: 'bitwise', label: '2. Bitwise Ops', icon: Sliders },
              { id: 'shifts', label: '3. Bit Shifts', icon: RotateCcw },
              { id: 'applications', label: '4. chmod & TCP Masks', icon: KeyRound },
              { id: 'twoscomp', label: "5. Two's Complement", icon: Layers },
              { id: 'powers', label: '6. Powers of 2 Drill', icon: Calculator },
              { id: 'logic', label: '7. Logic Gates', icon: Zap },
              { id: 'hardware', label: '8. CPU & Cache', icon: Cpu },
              { id: 'checklist', label: '9. Math Checklist', icon: CheckCircle2 }
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-mono transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-sky-500/20 text-sky-200 border border-sky-400/40 font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]'
                    : 'text-slate-400 hover:text-slate-100 border border-transparent hover:bg-white/[0.04]'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODULE 1: INTERACTIVE BASE CONVERSION & MULTI-RADIX WIDGET */}
      {/* ======================================================== */}
      {activeTab === 'converter' && (
        <div className="space-y-6">
          {/* Main Interactive Register Card */}
          <div className="optical-panel rounded-2xl p-5 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-cyan-400 font-bold">
                    {bitWidth}-BIT INTERACTIVE HARDWARE REGISTER
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-400/30 text-cyan-200">
                    Live Digital Circuit
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Click any bit to toggle voltage (0 = 0V OFF, 1 = 5V ON). Type in any box below for instant bidirectional conversion.
                </p>
              </div>

              {/* Bit Width Selector & Presets */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="optical-subnav flex items-center p-1 rounded-xl text-xs font-mono">
                  <button
                    onClick={() => handleBitWidthChange(8)}
                    className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
                      bitWidth === 8 ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/40 font-bold' : 'text-slate-400 hover:text-white border border-transparent'
                    }`}
                  >
                    8-Bit (Byte)
                  </button>
                  <button
                    onClick={() => handleBitWidthChange(16)}
                    className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
                      bitWidth === 16 ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/40 font-bold' : 'text-slate-400 hover:text-white border border-transparent'
                    }`}
                  >
                    16-Bit (Word)
                  </button>
                </div>

                {/* Presets */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { label: '0', val: 0 },
                    { label: '42', val: 42 },
                    { label: "65 ('A')", val: 65 },
                    { label: '127 (Max 8-bit)', val: 127 },
                    { label: '128 (MSB)', val: 128 },
                    { label: '255 (0xFF)', val: 255 },
                    { label: '256 (Overflow!)', val: 256 },
                    ...(bitWidth === 16 ? [{ label: '65535 (0xFFFF)', val: 65535 }] : [])
                  ].map((p) => (
                    <button
                      key={p.label}
                      onClick={() => syncAllFromNumber(p.val)}
                      className="optical-inset hover:border-cyan-400/40 px-2 py-1 rounded-lg text-[11px] font-mono text-slate-300 hover:text-white transition-colors cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Overflow warning banner if triggered */}
            {overflowTriggered && (
              <div className="rounded-xl border border-rose-400/40 bg-rose-950/35 p-4 text-xs text-rose-200 flex items-start gap-3">
                <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-sm text-rose-200">
                    Integer Overflow Simulated! ({Math.pow(2, bitWidth) - 1} + 1 = 0 in {bitWidth}-bit)
                  </div>
                  <p className="mt-1 leading-relaxed">
                    A {bitWidth}-bit register only has room for {bitWidth} binary digits. When the maximum value adds 1,
                    the extra carry bit falls off into the CPU Carry Flag ($CF), and the register resets to 0!
                    In cybersecurity, integer overflows allow attackers to bypass e-commerce carts and buffer limits.
                  </p>
                </div>
              </div>
            )}

            {/* Visual Clickable Register Bits */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1">
                <span>MSB (Most Significant Bit {bitWidth - 1})</span>
                <span className="text-cyan-400 font-bold">CLICK BITS TO FLIP (0 ⇄ 1)</span>
                <span>LSB (Least Significant Bit 0)</span>
              </div>

              <div
                className={`grid gap-2 ${
                  bitWidth === 8 ? 'grid-cols-8' : 'grid-cols-8 sm:grid-cols-16'
                }`}
              >
                {registerBits.map((bit, idx) => {
                  const bitIndex = registerBits.length - 1 - idx;
                  const weight = Math.pow(2, bitIndex);

                  return (
                    <button
                      key={idx}
                      onClick={() => toggleSingleBit(idx)}
                      className={`group flex flex-col items-center justify-center p-2.5 sm:p-3.5 rounded-xl border text-center transition-all cursor-pointer relative ${
                        bit === 1
                          ? 'border-cyan-400/60 bg-cyan-500/15 text-cyan-200 shadow-[0_0_20px_-6px_rgba(34,211,238,0.5),inset_0_1px_0_rgba(255,255,255,0.18)] scale-[1.02]'
                          : 'optical-inset text-slate-400 hover:border-white/[0.15]'
                      }`}
                    >
                      <span className="text-[10px] font-mono text-slate-400 mb-0.5">
                        2^{bitIndex}
                      </span>
                      <span
                        className={`text-xl sm:text-2xl font-black font-mono tracking-wider tabular-nums ${
                          bit === 1 ? 'text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.65)]' : 'text-slate-500'
                        }`}
                      >
                        {bit}
                      </span>
                      <span className="text-[10px] font-mono font-bold mt-0.5 text-slate-300 truncate max-w-full tabular-nums">
                        {weight.toLocaleString()}
                      </span>
                      <span className="text-[9px] font-mono text-slate-400">
                        b{bitIndex}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Nibble Breakdown Guide */}
            <div className="optical-inset rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">4-Bit Nibbles to Hex:</span>
                <span className="text-amber-400 font-bold">
                  [{registerBits.slice(0, 4).join('')} = {parseInt(registerBits.slice(0, 4).join(''), 2).toString(16).toUpperCase()}]
                </span>
                <span className="text-cyan-400 font-bold">
                  [{registerBits.slice(4, 8).join('')} = {parseInt(registerBits.slice(4, 8).join(''), 2).toString(16).toUpperCase()}]
                </span>
                {bitWidth === 16 && (
                  <>
                    <span className="text-emerald-400 font-bold">
                      [{registerBits.slice(8, 12).join('')} = {parseInt(registerBits.slice(8, 12).join(''), 2).toString(16).toUpperCase()}]
                    </span>
                    <span className="text-purple-400 font-bold">
                      [{registerBits.slice(12, 16).join('')} = {parseInt(registerBits.slice(12, 16).join(''), 2).toString(16).toUpperCase()}]
                    </span>
                  </>
                )}
              </div>
              <div className="text-[11px] text-slate-400">
                1 Hex digit = exactly 4 bits (1 Nibble). 2 Hex digits = 1 full Byte (8 bits).
              </div>
            </div>

            {/* Live Synchronized Inputs in All Bases */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              {/* Decimal Input */}
              <div className="optical-card rounded-xl p-4 space-y-1.5 focus-within:border-cyan-400/60 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-slate-300">DECIMAL (BASE-10)</span>
                  <button
                    onClick={() => copyToClipboard(convInputDec, 'dec')}
                    className="text-slate-400 hover:text-white cursor-pointer"
                  >
                    {copiedKey === 'dec' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <input
                  type="text"
                  value={convInputDec}
                  onChange={(e) => handleDecChange(e.target.value)}
                  placeholder="e.g. 42"
                  className="w-full bg-black/45 border border-white/[0.1] rounded-lg px-3 py-2 text-lg font-mono font-bold text-white tabular-nums focus:outline-none focus:border-cyan-400/60"
                />
                <div className="text-[11px] font-mono text-slate-400 flex justify-between">
                  <span>Signed 2&apos;s Comp:</span>
                  <span className="text-indigo-300 font-bold tabular-nums">{signedDec}</span>
                </div>
              </div>

              {/* Hexadecimal Input */}
              <div className="optical-card rounded-xl p-4 space-y-1.5 focus-within:border-cyan-400/60 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-cyan-400">HEXADECIMAL (BASE-16)</span>
                  <button
                    onClick={() => copyToClipboard(`0x${hexString}`, 'hex')}
                    className="text-slate-400 hover:text-white cursor-pointer"
                  >
                    {copiedKey === 'hex' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500 font-mono text-sm font-bold">0x</span>
                  <input
                    type="text"
                    value={convInputHex}
                    onChange={(e) => handleHexChange(e.target.value)}
                    placeholder="2A"
                    className="w-full bg-black/45 border border-white/[0.1] rounded-lg pl-8 pr-3 py-2 text-lg font-mono font-bold text-cyan-300 focus:outline-none focus:border-cyan-400/60 uppercase"
                  />
                </div>
                <div className="text-[11px] font-mono text-slate-400 flex justify-between">
                  <span>Hex Prefix:</span>
                  <span className="text-slate-300">0x{hexString}</span>
                </div>
              </div>

              {/* Binary Input */}
              <div className="optical-card rounded-xl p-4 space-y-1.5 focus-within:border-cyan-400/60 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-emerald-400">BINARY (BASE-2)</span>
                  <button
                    onClick={() => copyToClipboard(registerBits.join(''), 'bin')}
                    className="text-slate-400 hover:text-white cursor-pointer"
                  >
                    {copiedKey === 'bin' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <input
                  type="text"
                  value={convInputBin}
                  onChange={(e) => handleBinChange(e.target.value)}
                  placeholder="00101010"
                  className="w-full bg-black/45 border border-white/[0.1] rounded-lg px-3 py-2 text-lg font-mono font-bold text-emerald-300 focus:outline-none focus:border-cyan-400/60"
                />
                <div className="text-[11px] font-mono text-slate-400 flex justify-between">
                  <span>Total Bits:</span>
                  <span className="text-slate-300">{bitWidth} bits</span>
                </div>
              </div>

              {/* Octal & ASCII Input */}
              <div className="optical-card rounded-xl p-4 space-y-1.5 focus-within:border-cyan-400/60 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-amber-400">OCTAL (BASE-8) &amp; ASCII</span>
                  <button
                    onClick={() => copyToClipboard(`0o${octalString}`, 'oct')}
                    className="text-slate-400 hover:text-white cursor-pointer"
                  >
                    {copiedKey === 'oct' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500 font-mono text-sm font-bold">0o</span>
                  <input
                    type="text"
                    value={convInputOct}
                    onChange={(e) => handleOctChange(e.target.value)}
                    placeholder="52"
                    className="w-full bg-black/45 border border-white/[0.1] rounded-lg pl-8 pr-3 py-2 text-lg font-mono font-bold text-amber-300 focus:outline-none focus:border-cyan-400/60"
                  />
                </div>
                <div className="text-[11px] font-mono text-slate-400 flex justify-between">
                  <span>ASCII Char:</span>
                  <span className="text-emerald-300 font-bold">
                    {asciiChar ? `'${asciiChar}' (code ${unsignedDec})` : 'Non-printable / none'}
                  </span>
                </div>
              </div>
            </div>

            {/* Mathematical Place Value Breakdown Formula */}
            <div className="optical-inset rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-cyan-400">
                  Mathematical Place-Value Expansion Formula:
                </span>
                <span className="text-[11px] font-mono text-slate-400">Sum of (Bit × 2^i)</span>
              </div>
              <div className="font-mono text-xs text-slate-300 overflow-x-auto pb-1 leading-relaxed">
                {registerBits
                  .map((b, i) => {
                    const power = registerBits.length - 1 - i;
                    const weight = Math.pow(2, power);
                    return (
                      <span key={i} className={b === 1 ? 'text-cyan-300 font-bold' : 'text-slate-500'}>
                        ({b} × {weight}){i < registerBits.length - 1 ? ' + ' : ''}
                      </span>
                    );
                  })}{' '}
                ={' '}
                <span className="text-white font-extrabold text-sm ml-1 underline decoration-cyan-400 tabular-nums">
                  {unsignedDec}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODULE 2: BITWISE OPERATIONS & BITMASK STUDIO */}
      {/* ======================================================== */}
      {activeTab === 'bitwise' && (
        <div className="space-y-6">
          <div className="optical-panel rounded-2xl p-5 sm:p-6 space-y-5">
            <div>
              <span className="text-xs font-mono text-cyan-400 font-bold">
                DUAL-REGISTER BITWISE COMPUTATION ENGINE
              </span>
              <p className="text-xs text-slate-400 mt-1">
                Toggle bits in Register A and Register B. Choose an operation to see real-time bit-by-bit Boolean algebra and systems masking.
              </p>
            </div>

            {/* Operation Selector Buttons */}
            <div className="flex flex-wrap gap-2">
              {(['AND', 'OR', 'XOR', 'NOT', 'NAND', 'NOR', 'XNOR'] as const).map((op) => (
                <button
                  key={op}
                  onClick={() => setBitwiseOp(op)}
                  className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border ${
                    bitwiseOp === op
                      ? 'border-cyan-400/60 bg-cyan-500/20 text-cyan-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]'
                      : 'optical-inset text-slate-400 hover:text-white hover:border-white/[0.14]'
                  }`}
                >
                  {op} ({op === 'AND' ? '&' : op === 'OR' ? '|' : op === 'XOR' ? '^' : op === 'NOT' ? '~' : op})
                </button>
              ))}
            </div>

            {/* Register A */}
            <div className="optical-inset rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-cyan-400">REGISTER A (Operand 1):</span>
                <span className="text-slate-400 tabular-nums">
                  Decimal: <strong className="text-white">{decA}</strong> · Hex:{' '}
                  <strong className="text-cyan-300">0x{decA.toString(16).toUpperCase().padStart(2, '0')}</strong>
                </span>
              </div>
              <div className="grid grid-cols-8 gap-2">
                {opBitsA.map((bit, idx) => (
                  <button
                    key={idx}
                    onClick={() => toggleBitA(idx)}
                    className={`py-2 rounded-xl font-mono font-bold text-sm cursor-pointer border transition-all tabular-nums ${
                      bit === 1
                        ? 'border-cyan-400/60 bg-cyan-500/20 text-cyan-200 shadow-[0_0_16px_rgba(34,211,238,0.18)]'
                        : 'border-white/[0.06] bg-black/40 text-slate-500 hover:border-white/[0.16] hover:text-slate-300'
                    }`}
                  >
                    {bit}
                  </button>
                ))}
              </div>
            </div>

            {/* Register B (or Mask) */}
            {bitwiseOp !== 'NOT' && (
              <div className="optical-inset rounded-xl p-4 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-400">REGISTER B (Operand 2 / Bitmask):</span>
                    <span className="text-slate-400 tabular-nums">
                      Decimal: <strong className="text-white">{decB}</strong> · Hex:{' '}
                      <strong className="text-amber-300">0x{decB.toString(16).toUpperCase().padStart(2, '0')}</strong>
                    </span>
                  </div>

                  {/* Quick Preset Masks */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400">Masks:</span>
                    <button
                      onClick={() => applyBitmaskPreset('clear_low')}
                      className="px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.08] text-[10px] text-slate-300 hover:text-white cursor-pointer"
                    >
                      0xF0
                    </button>
                    <button
                      onClick={() => applyBitmaskPreset('clear_high')}
                      className="px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.08] text-[10px] text-slate-300 hover:text-white cursor-pointer"
                    >
                      0x0F
                    </button>
                    <button
                      onClick={() => applyBitmaskPreset('invert_all')}
                      className="px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.08] text-[10px] text-slate-300 hover:text-white cursor-pointer"
                    >
                      0xFF
                    </button>
                    <button
                      onClick={() => applyBitmaskPreset('syn_mask')}
                      className="px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.08] text-[10px] text-slate-300 hover:text-white cursor-pointer"
                    >
                      SYN (0x02)
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-8 gap-2">
                  {opBitsB.map((bit, idx) => (
                    <button
                      key={idx}
                      onClick={() => toggleBitB(idx)}
                      className={`py-2 rounded-xl font-mono font-bold text-sm cursor-pointer border transition-all tabular-nums ${
                        bit === 1
                          ? 'border-amber-400/60 bg-amber-500/20 text-amber-200 shadow-[0_0_16px_rgba(245,158,11,0.18)]'
                          : 'border-white/[0.06] bg-black/40 text-slate-500 hover:border-white/[0.16] hover:text-slate-300'
                      }`}
                    >
                      {bit}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Result Register */}
            <div className="rounded-xl border border-emerald-400/35 bg-emerald-500/[0.08] p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-emerald-300">
                  RESULT = A {bitwiseOp} {bitwiseOp !== 'NOT' ? 'B' : ''}:
                </span>
                <span className="text-slate-300 tabular-nums">
                  Decimal: <strong className="text-emerald-300">{decRes}</strong> · Hex:{' '}
                  <strong className="text-emerald-300">0x{decRes.toString(16).toUpperCase().padStart(2, '0')}</strong>
                </span>
              </div>
              <div className="grid grid-cols-8 gap-2">
                {bitwiseResult.map((bit, idx) => (
                  <div
                    key={idx}
                    className={`py-2.5 rounded-xl font-mono font-black text-center text-base border transition-all tabular-nums ${
                      bit === 1
                        ? 'border-emerald-400/60 bg-emerald-500/20 text-emerald-200 shadow-[0_0_16px_rgba(52,211,153,0.22)]'
                        : 'border-white/[0.06] bg-black/40 text-slate-600'
                    }`}
                  >
                    {bit}
                  </div>
                ))}
              </div>
            </div>

            {/* Bit-by-bit column breakdown */}
            <div className="optical-inset rounded-xl p-4 space-y-2">
              <span className="text-xs font-mono font-bold text-slate-300 block">
                Bit-by-Bit Position Verification (Positions 7 down to 0):
              </span>
              <div className="grid grid-cols-8 gap-2 text-center text-xs font-mono text-slate-400 pt-1">
                {bitwiseResult.map((res, i) => (
                  <div key={i} className="p-2 rounded-xl bg-black/35 border border-white/[0.06] space-y-1 tabular-nums">
                    <div className="text-[10px] text-slate-400">b{7 - i}</div>
                    <div className="text-cyan-400 font-bold">{opBitsA[i]}</div>
                    <div className="text-slate-400 text-[10px]">{bitwiseOp}</div>
                    {bitwiseOp !== 'NOT' && <div className="text-amber-400 font-bold">{opBitsB[i]}</div>}
                    <div className="border-t border-white/[0.08] pt-0.5 text-emerald-400 font-black">{res}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Real World Security & Engineering Insight */}
            <div className="rounded-xl border border-cyan-400/25 bg-cyan-500/[0.07] p-4 text-xs space-y-1.5 text-slate-300 leading-relaxed">
              <div className="font-bold font-mono text-cyan-300 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4" />
                <span>Computer Science &amp; Security Applications:</span>
              </div>
              {bitwiseOp === 'AND' && (
                <p>
                  <strong>IPv4 Subnet Masking:</strong> When a router determines if a packet is local or external, it calculates{' '}
                  <code>IP_Address &amp; Subnet_Mask</code>. Example: <code>192.168.1.42 &amp; 255.255.255.0 = 192.168.1.0</code>.
                  It is also used to extract specific hardware bits and clear register flags.
                </p>
              )}
              {bitwiseOp === 'OR' && (
                <p>
                  <strong>Setting System Flags:</strong> Used in Linux system calls (e.g., <code>open(&quot;log.txt&quot;, O_WRONLY | O_CREAT)</code>).
                  Since each flag is a single power-of-two bit (0x01, 0x02, 0x04), bitwise OR combines multiple options into a single integer without conflict.
                </p>
              )}
              {bitwiseOp === 'XOR' && (
                <p>
                  <strong>Cryptography &amp; Fast CPU Zeroing:</strong> The XOR operation has the unique property that{' '}
                  <code>(A ^ B) ^ B = A</code>. It forms the mathematical backbone of One-Time Pad encryption, AES ciphers,
                  and RAID 5 parity. Compilers also use <code>xor eax, eax</code> in x86 assembly to zero registers faster than <code>mov eax, 0</code>.
                </p>
              )}
              {bitwiseOp === 'NOT' && (
                <p>
                  <strong>One&apos;s Complement &amp; Negative Inversion:</strong> Flips every 0 to 1 and every 1 to 0. It is the first step in creating
                  negative numbers in two&apos;s complement binary arithmetic.
                </p>
              )}
              {bitwiseOp === 'NAND' && (
                <p>
                  <strong>Universal Logic Gate:</strong> Computer hardware engineers can synthesize ANY digital circuit (ALU, RAM, CPU registers) using
                  exclusively NAND gates.
                </p>
              )}
              {(bitwiseOp === 'NOR' || bitwiseOp === 'XNOR') && (
                <p>
                  <strong>Hardware Comparators &amp; Latches:</strong> XNOR checks equality bit-for-bit (outputting 1 when bits match). NOR gates are used in
                  SR-latch memory cells to store 1 bit of physical state.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODULE 3: REAL-TIME BIT SHIFTS & ROTATION */}
      {/* ======================================================== */}
      {activeTab === 'shifts' && (
        <div className="space-y-6">
          <div className="optical-panel rounded-2xl p-5 sm:p-6 space-y-5">
            <div>
              <span className="text-xs font-mono text-cyan-400 font-bold">
                REAL-TIME HARDWARE SHIFTER &amp; ROTATION ENGINE
              </span>
              <p className="text-xs text-slate-400 mt-1">
                Perform hardware bit shifts. Watch bits move left or right, observe zero-fills, arithmetic sign extensions, and circular rotations.
              </p>
            </div>

            {/* Current Register Status */}
            <div className="optical-inset rounded-xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="text-xs font-mono tabular-nums">
                  <span className="text-slate-400">Current Value: </span>
                  <span className="text-lg font-bold text-white font-mono">{shiftDec}</span>
                  <span className="text-xs text-cyan-400 font-mono ml-2">
                    (0x{shiftDec.toString(16).toUpperCase().padStart(2, '0')})
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-mono text-slate-400">Shift By:</span>
                  {[1, 2, 3, 4].map((n) => (
                    <button
                      key={n}
                      onClick={() => setShiftAmount(n)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold cursor-pointer border transition-colors ${
                        shiftAmount === n
                          ? 'border-cyan-400/60 bg-cyan-500/20 text-cyan-200'
                          : 'border-white/[0.08] bg-white/[0.04] text-slate-400 hover:text-white'
                      }`}
                    >
                      {n} bit{n > 1 ? 's' : ''}
                    </button>
                  ))}
                  <button
                    onClick={() => resetShiftRegister(42)}
                    className="ml-1 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] text-xs text-slate-300 cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Reset</span>
                  </button>
                </div>
              </div>

              {/* 8-Bit Visual Display */}
              <div className="grid grid-cols-8 gap-2">
                {shiftRegister.map((bit, idx) => (
                  <div
                    key={idx}
                    className={`py-3 rounded-xl border text-center font-mono transition-all tabular-nums ${
                      bit === 1
                        ? 'border-cyan-400/60 bg-cyan-500/20 text-cyan-200 shadow-[0_0_16px_rgba(34,211,238,0.2)]'
                        : 'border-white/[0.06] bg-black/40 text-slate-500'
                    }`}
                  >
                    <div className="text-xl font-black">{bit}</div>
                    <div className="text-[10px] text-slate-400 mt-1">b{7 - idx}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shift Controls Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <button
                onClick={() => performShift('shl')}
                className="optical-card p-3.5 rounded-xl text-left cursor-pointer space-y-1 hover:border-cyan-400/40"
              >
                <div className="font-mono font-bold text-cyan-300 text-sm">
                  &lt;&lt; {shiftAmount} (Logical Left Shift)
                </div>
                <div className="text-[11px] text-slate-400 leading-snug">
                  Multiplies by {Math.pow(2, shiftAmount)}. Pushes 0 in on the right.
                </div>
              </button>

              <button
                onClick={() => performShift('shr_log')}
                className="optical-card p-3.5 rounded-xl text-left cursor-pointer space-y-1 hover:border-amber-400/40"
              >
                <div className="font-mono font-bold text-amber-300 text-sm">
                  &gt;&gt;&gt; {shiftAmount} (Logical Right Shift)
                </div>
                <div className="text-[11px] text-slate-400 leading-snug">
                  Unsigned divide by {Math.pow(2, shiftAmount)}. Fills 0 on the left.
                </div>
              </button>

              <button
                onClick={() => performShift('shr_arith')}
                className="optical-card p-3.5 rounded-xl text-left cursor-pointer space-y-1 hover:border-indigo-400/40"
              >
                <div className="font-mono font-bold text-indigo-300 text-sm">
                  &gt;&gt; {shiftAmount} (Arithmetic Right Shift)
                </div>
                <div className="text-[11px] text-slate-400 leading-snug">
                  Signed division. Copies sign bit (MSB) to preserve negative numbers.
                </div>
              </button>

              <button
                onClick={() => performShift('rol')}
                className="optical-card p-3.5 rounded-xl text-left cursor-pointer space-y-1 hover:border-emerald-400/40"
              >
                <div className="font-mono font-bold text-emerald-300 text-sm">
                  ROL {shiftAmount} (Rotate Left)
                </div>
                <div className="text-[11px] text-slate-400 leading-snug">
                  Circular shift. Bit 7 wraps around directly to Bit 0.
                </div>
              </button>

              <button
                onClick={() => performShift('ror')}
                className="optical-card p-3.5 rounded-xl text-left cursor-pointer space-y-1 hover:border-purple-400/40"
              >
                <div className="font-mono font-bold text-purple-300 text-sm">
                  ROR {shiftAmount} (Rotate Right)
                </div>
                <div className="text-[11px] text-slate-400 leading-snug">
                  Circular shift. Bit 0 wraps around directly to Bit 7.
                </div>
              </button>
            </div>

            {/* Last Shift Mathematical Log */}
            <div className="optical-inset rounded-xl p-4 space-y-2">
              <span className="text-xs font-mono font-bold text-slate-300 block">Last Shift Execution Details:</span>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono tabular-nums">
                <div>
                  <span className="text-slate-400">Operation: </span>
                  <span className="text-cyan-400 font-bold">{lastShiftLog.op}</span>
                  <span className="text-slate-400 ml-3">Carry Bit Out: </span>
                  <span className="text-amber-400 font-bold">{lastShiftLog.carryOut}</span>
                </div>
                <div className="text-slate-300">
                  Formula:{' '}
                  <span className="text-emerald-400 font-semibold">{lastShiftLog.formula}</span>
                </div>
              </div>
            </div>

            {/* Practical Compiler Optimization Insight */}
            <div className="rounded-xl border border-indigo-400/25 bg-indigo-500/[0.07] p-4 text-xs text-slate-300 space-y-2">
              <div className="font-bold text-indigo-300 font-mono flex items-center gap-1.5">
                <Sparkles className="h-4 w-4" />
                <span>Compiler Optimization &amp; Cryptography Secret:</span>
              </div>
              <p className="leading-relaxed">
                Why do CPUs love bit shifts? In physical hardware, standard multiplication (<code>MUL</code>) takes several clock cycles
                to complete on an ALU. In contrast, a bit shift (<code>SHL</code> / <code>SHR</code>) takes a <strong>single clock cycle</strong>!
                Whenever a C/C++ compiler sees code like <code>x * 8</code>, it automatically optimizes it to <code>x &lt;&lt; 3</code>.
                Furthermore, circular rotations (<code>ROL</code> and <code>ROR</code>) are used heavily in hash algorithms like SHA-256 and MD5
                to thoroughly diffuse bits across state words.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODULE 4: REAL-WORLD SYSTEMS BITMASKS (CHMOD & TCP) */}
      {/* ======================================================== */}
      {activeTab === 'applications' && (
        <div className="space-y-6">
          {/* 1. Linux chmod Octal Simulator */}
          <div className="optical-panel rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <span className="text-xs font-mono text-cyan-400 font-bold">
                  LINUX CHMOD OCTAL &amp; BINARY TRANSLATOR
                </span>
                <p className="text-xs text-slate-400 mt-0.5">
                  Understand why Linux file permissions use octal digits (0 to 7) based on 3-bit binary groups (r=4, w=2, x=1).
                </p>
              </div>

              {/* Command Generator */}
              <div className="flex items-center gap-2">
                <div className="optical-inset rounded-xl px-3 py-1.5 font-mono text-xs text-emerald-300 flex items-center gap-2 tabular-nums">
                  <span>chmod {userOctal}{groupOctal}{otherOctal} script.sh</span>
                  <button
                    onClick={() => copyToClipboard(`chmod ${userOctal}${groupOctal}${otherOctal} script.sh`, 'chmod')}
                    className="text-slate-400 hover:text-white cursor-pointer"
                  >
                    {copiedKey === 'chmod' ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* 3 Categories: User, Group, Other */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* User / Owner */}
              <div className="optical-inset rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-cyan-400">1. OWNER (USER)</span>
                  <span className="text-sm font-bold font-mono text-white tabular-nums">Octal: {userOctal}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Read (r=4)', idx: 0 },
                    { label: 'Write (w=2)', idx: 1 },
                    { label: 'Exec (x=1)', idx: 2 }
                  ].map((p) => (
                    <button
                      key={p.label}
                      onClick={() => toggleChmodBit(p.idx)}
                      className={`p-2.5 rounded-xl border text-center font-mono text-xs font-bold transition-all cursor-pointer tabular-nums ${
                        chmodBits[p.idx] === 1
                          ? 'border-cyan-400/60 bg-cyan-500/20 text-cyan-200'
                          : 'border-white/[0.06] bg-black/40 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <div>{chmodBits[p.idx]}</div>
                      <div className="text-[10px] mt-0.5">{p.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Group */}
              <div className="optical-inset rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-amber-400">2. GROUP</span>
                  <span className="text-sm font-bold font-mono text-white tabular-nums">Octal: {groupOctal}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Read (r=4)', idx: 3 },
                    { label: 'Write (w=2)', idx: 4 },
                    { label: 'Exec (x=1)', idx: 5 }
                  ].map((p) => (
                    <button
                      key={p.label}
                      onClick={() => toggleChmodBit(p.idx)}
                      className={`p-2.5 rounded-xl border text-center font-mono text-xs font-bold transition-all cursor-pointer tabular-nums ${
                        chmodBits[p.idx] === 1
                          ? 'border-amber-400/60 bg-amber-500/20 text-amber-200'
                          : 'border-white/[0.06] bg-black/40 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <div>{chmodBits[p.idx]}</div>
                      <div className="text-[10px] mt-0.5">{p.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Others */}
              <div className="optical-inset rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-emerald-400">3. OTHERS (WORLD)</span>
                  <span className="text-sm font-bold font-mono text-white tabular-nums">Octal: {otherOctal}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Read (r=4)', idx: 6 },
                    { label: 'Write (w=2)', idx: 7 },
                    { label: 'Exec (x=1)', idx: 8 }
                  ].map((p) => (
                    <button
                      key={p.label}
                      onClick={() => toggleChmodBit(p.idx)}
                      className={`p-2.5 rounded-xl border text-center font-mono text-xs font-bold transition-all cursor-pointer tabular-nums ${
                        chmodBits[p.idx] === 1
                          ? 'border-emerald-400/60 bg-emerald-500/20 text-emerald-200'
                          : 'border-white/[0.06] bg-black/40 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <div>{chmodBits[p.idx]}</div>
                      <div className="text-[10px] mt-0.5">{p.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Real-Time Permission String */}
            <div className="optical-inset rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs font-mono tabular-nums">
              <div>
                <span className="text-slate-400">Symbolic Permission: </span>
                <span className="text-emerald-300 font-extrabold text-sm tracking-widest">
                  -{chmodSymbolic}
                </span>
              </div>
              <div>
                <span className="text-slate-400">9-Bit Binary: </span>
                <span className="text-cyan-300 font-bold">
                  {chmodBits.slice(0, 3).join('')} {chmodBits.slice(3, 6).join('')} {chmodBits.slice(6, 9).join('')}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Octal Code: </span>
                <span className="text-amber-300 font-extrabold text-sm">{chmodOctal}</span>
              </div>
            </div>
          </div>

          {/* 2. TCP Header Flags Bitmask */}
          <div className="optical-panel rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <span className="text-xs font-mono text-cyan-400 font-bold">
                  TCP PACKET HEADER FLAGS BITMASK (NETWORKING BEDROCK)
                </span>
                <p className="text-xs text-slate-400 mt-0.5">
                  Every TCP packet on the internet encodes connection state (3-way handshake) into single bits of a flags byte.
                </p>
              </div>

              <div className="optical-inset text-xs font-mono px-3 py-1.5 rounded-xl tabular-nums">
                <span className="text-slate-400">TCP Flags Byte: </span>
                <span className="text-cyan-300 font-bold">{tcpHexVal}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { name: 'URG', bit: 32, desc: 'Urgent pointer active' },
                { name: 'ACK', bit: 16, desc: 'Acknowledgment field valid' },
                { name: 'PSH', bit: 8, desc: 'Push data to app immediately' },
                { name: 'RST', bit: 4, desc: 'Reset/abort connection' },
                { name: 'SYN', bit: 2, desc: 'Synchronize sequence (Start)' },
                { name: 'FIN', bit: 1, desc: 'Finish/close connection' }
              ].map((flag) => {
                const isActive = tcpFlags[flag.name];
                return (
                  <button
                    key={flag.name}
                    onClick={() => toggleTcpFlag(flag.name)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isActive
                        ? 'border-cyan-400/60 bg-cyan-500/20 text-white shadow-[0_0_16px_rgba(34,211,238,0.16)]'
                        : 'optical-card text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono font-bold text-sm tabular-nums">
                      <span className={isActive ? 'text-cyan-200' : 'text-slate-300'}>{flag.name}</span>
                      <span className="text-[10px] text-slate-400">{flag.bit}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 leading-tight">{flag.desc}</div>
                  </button>
                );
              })}
            </div>

            {/* Handshake Analysis */}
            <div className="optical-inset rounded-xl p-3.5 text-xs text-slate-300 space-y-1">
              <span className="font-mono font-bold text-cyan-400">3-Way Handshake Connection State:</span>
              <p className="leading-relaxed text-[11px] text-slate-400">
                {tcpFlags.SYN && !tcpFlags.ACK && 'SYN Packet (Step 1): Client requests new TCP connection.'}
                {tcpFlags.SYN && tcpFlags.ACK && 'SYN-ACK Packet (Step 2, 0x12): Server acknowledges and synchronizes.'}
                {!tcpFlags.SYN && tcpFlags.ACK && !tcpFlags.FIN && 'ACK Packet (Step 3, 0x10): Connection established! Ready for data.'}
                {tcpFlags.FIN && tcpFlags.ACK && 'FIN-ACK Packet (0x11): Graceful connection termination.'}
                {tcpFlags.RST && 'RST Packet (0x04): Connection refused or hard reset by firewall.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODULE 5: TWO'S COMPLEMENT & NEGATIVE PROOF */}
      {/* ======================================================== */}
      {activeTab === 'twoscomp' && (
        <div className="space-y-6">
          <div className="optical-panel rounded-2xl p-5 sm:p-6 space-y-5">
            <div>
              <span className="text-xs font-mono text-cyan-400 font-bold">
                TWO&apos;S COMPLEMENT MATHEMATICAL PROOF (HOW NEGATIVE NUMBERS EXIST)
              </span>
              <p className="text-xs text-slate-400 mt-1">
                Computers do not have a &quot;minus sign&quot; wire. Negative numbers are stored by inverting all bits and adding 1.
              </p>
            </div>

            {/* Input Slider */}
            <div className="optical-inset rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300">Choose Positive Value X:</span>
                <span className="text-base font-bold text-cyan-300 font-mono tabular-nums">+{twosCompNum}</span>
              </div>
              <div className="py-1">
                <SoapBubbleSlider
                  value={twosCompNum}
                  min={1}
                  max={127}
                  step={1}
                  onValueChange={setTwosCompNum}
                  label="Choose Positive Value X"
                  from="#22d3ee"
                  to="#6366f1"
                  scale={0.75}
                />
              </div>
            </div>

            {/* Step-by-Step Proof */}
            <div className="space-y-3">
              {/* Step 1 */}
              <div className="optical-inset p-4 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-cyan-400 font-bold">STEP 1: Original Positive Number (+{twosCompNum})</span>
                  <span className="text-slate-400">MSB is 0 (Positive)</span>
                </div>
                <div className="grid grid-cols-8 gap-2">
                  {positiveBits.map((b, i) => (
                    <div
                      key={i}
                      className={`p-2.5 rounded-xl border text-center font-mono font-bold text-base tabular-nums ${
                        b === 1 ? 'border-cyan-400/50 bg-cyan-500/15 text-cyan-200' : 'border-white/[0.06] bg-black/40 text-slate-500'
                      }`}
                    >
                      {b}
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 2 */}
              <div className="optical-inset p-4 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-amber-400 font-bold">STEP 2: Invert All Bits (One&apos;s Complement, ~X)</span>
                  <span className="text-slate-400">Every 0 becomes 1, every 1 becomes 0</span>
                </div>
                <div className="grid grid-cols-8 gap-2">
                  {invertedBits.map((b, i) => (
                    <div
                      key={i}
                      className={`p-2.5 rounded-xl border text-center font-mono font-bold text-base tabular-nums ${
                        b === 1 ? 'border-amber-400/50 bg-amber-500/15 text-amber-200' : 'border-white/[0.06] bg-black/40 text-slate-500'
                      }`}
                    >
                      {b}
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-xl border border-indigo-400/35 bg-indigo-500/10 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-indigo-200 font-bold">
                    STEP 3: Add 1 to Result = Two&apos;s Complement (-{twosCompNum})
                  </span>
                  <span className="text-indigo-300 font-bold tabular-nums">Signed Value: -{twosCompNum}</span>
                </div>
                <div className="grid grid-cols-8 gap-2">
                  {negativeBits.map((b, i) => (
                    <div
                      key={i}
                      className={`p-2.5 rounded-xl border text-center font-mono font-bold text-base tabular-nums ${
                        b === 1 ? 'border-indigo-400/60 bg-indigo-500/20 text-indigo-200' : 'border-white/[0.06] bg-black/40 text-slate-500'
                      }`}
                    >
                      {b}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Arithmetic Verification Proof */}
            <div className="rounded-xl border border-emerald-400/35 bg-emerald-500/10 p-4 space-y-2">
              <span className="text-xs font-mono font-bold text-emerald-300">
                Mathematical Verification: (+{twosCompNum}) + (-{twosCompNum}) = 0
              </span>
              <div className="font-mono text-xs text-slate-300 space-y-1">
                <div>&nbsp;&nbsp;{positiveBits.join('')} &nbsp;(+{twosCompNum})</div>
                <div>+ {negativeBits.join('')} &nbsp;(-{twosCompNum})</div>
                <div className="border-t border-white/[0.1] pt-1 text-emerald-300 font-bold">
                  = {twosCompVerificationSum.sumBits.join('')} &nbsp;(Carry bit {twosCompVerificationSum.finalCarry} drops off register!)
                </div>
              </div>
              <p className="text-[11px] text-slate-400 pt-1">
                The result is exactly 0! Because the 9th carry bit falls off into the carry flag, modern computer ALUs don&apos;t need separate subtraction circuits; they just add the two&apos;s complement!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODULE 6: POWERS OF 2 MATRIX & SPEED TRAINER */}
      {/* ======================================================== */}
      {activeTab === 'powers' && (
        <div className="space-y-6">
          {/* Interactive Speed Drill */}
          <div className="optical-panel rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
                  <Calculator className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-display text-sm font-bold text-white">Powers of 2 Speed Drill (Flash Trainer)</h4>
                  <p className="text-xs text-slate-400">Train your brain to recognize powers of 2 without hesitation.</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono">
                <div className="optical-inset flex items-center gap-1.5 px-3 py-1.5 rounded-xl">
                  <Flame className="h-4 w-4 text-amber-400" />
                  <span className="text-slate-400">Streak:</span>
                  <span className="text-amber-300 font-bold tabular-nums">{drillStreak}</span>
                </div>
                <div className="optical-inset flex items-center gap-1.5 px-3 py-1.5 rounded-xl">
                  <Award className="h-4 w-4 text-cyan-400" />
                  <span className="text-slate-400">Score:</span>
                  <span className="text-cyan-300 font-bold tabular-nums">{drillScore}</span>
                </div>
              </div>
            </div>

            {/* Drill Card */}
            <div className="optical-inset rounded-xl p-5 space-y-4">
              <div className="text-sm font-bold text-white font-mono">{drillQuestion.prompt}</div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {drillQuestion.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleDrillAnswer(opt)}
                    className="optical-card p-3 rounded-xl text-sm font-mono font-bold text-white cursor-pointer tabular-nums"
                  >
                    {opt.toLocaleString()}
                  </button>
                ))}
              </div>

              {drillFeedback && (
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                  <span
                    className={`font-semibold ${
                      drillFeedback.startsWith('CORRECT') ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {drillFeedback}
                  </span>
                  <SoapBubbleButton
                    onClick={generateNextDrill}
                    tint="rgb(14 165 233)"
                    opacity={0.9}
                    style={{ fontSize: 12 }}
                    className="!min-h-[32px] !px-3.5 font-mono font-bold text-white"
                  >
                    <span>Next Drill Question</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </SoapBubbleButton>
                </div>
              )}
            </div>
          </div>

          {/* Reference Table 2^0 to 2^16 */}
          <div className="optical-panel rounded-2xl p-5 sm:p-6 space-y-4">
            <div>
              <h4 className="font-display text-sm font-bold text-white">Powers of 2 Master Table (2^0 to 2^16)</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Required memory table from Page 10 of the Student Handbook. Every Computer Science concept is anchored here.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {POWERS_OF_TWO.map((item) => (
                <div
                  key={item.exp}
                  className="optical-card rounded-xl p-3.5 flex items-start justify-between gap-2"
                >
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-mono text-cyan-400 font-bold">2^{item.exp}</span>
                      <span className="text-base font-mono font-extrabold text-white tabular-nums">
                        = {item.val.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-[11px] font-semibold text-slate-300 mt-0.5">{item.name}</div>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">{item.meaning}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODULE 7: BOOLEAN LOGIC GATES & CIRCUITS */}
      {/* ======================================================== */}
      {activeTab === 'logic' && (
        <div className="space-y-6">
          <div className="optical-panel rounded-2xl p-5 sm:p-6 space-y-5">
            <div>
              <span className="text-xs font-mono text-cyan-400 font-bold">INTERACTIVE LOGIC GATE SIMULATOR</span>
              <p className="text-xs text-slate-400 mt-0.5">
                Select a logic gate and toggle inputs A and B. Watch the electrical signal flow through the truth table.
              </p>
            </div>

            {/* Gate Buttons */}
            <div className="flex flex-wrap gap-2">
              {(['AND', 'OR', 'NOT', 'XOR', 'NAND', 'NOR', 'XNOR'] as GateType[]).map((gate) => (
                <button
                  key={gate}
                  onClick={() => setSelectedGate(gate)}
                  className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border ${
                    selectedGate === gate
                      ? 'border-cyan-400/60 bg-cyan-500/20 text-cyan-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]'
                      : 'optical-inset text-slate-400 hover:text-white hover:border-white/[0.14]'
                  }`}
                >
                  {gate} GATE
                </button>
              ))}
            </div>

            {/* Circuit Workbench */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
              {/* Left: Input Switches */}
              <div className="optical-inset rounded-xl p-4 space-y-4">
                <span className="text-xs font-mono font-bold text-slate-300 block">1. Toggle Digital Inputs</span>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl border border-white/[0.08] bg-black/45">
                    <div>
                      <span className="text-xs font-mono font-bold text-white block">INPUT A · Bit {inputA}</span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {inputA === 1 ? 'High (5 Volts)' : 'Low (0 Volts)'}
                      </span>
                    </div>
                    <SoapBubbleToggle
                      checked={inputA === 1}
                      onCheckedChange={(checked) => setInputA(checked ? 1 : 0)}
                      aria-label="Toggle Digital Input A"
                      color="#22d3ee"
                      scale={0.75}
                    />
                  </div>

                  {selectedGate !== 'NOT' && (
                    <div className="flex items-center justify-between p-3 rounded-xl border border-white/[0.08] bg-black/45">
                      <div>
                        <span className="text-xs font-mono font-bold text-white block">INPUT B · Bit {inputB}</span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {inputB === 1 ? 'High (5 Volts)' : 'Low (0 Volts)'}
                        </span>
                      </div>
                      <SoapBubbleToggle
                        checked={inputB === 1}
                        onCheckedChange={(checked) => setInputB(checked ? 1 : 0)}
                        aria-label="Toggle Digital Input B"
                        color="#22d3ee"
                        scale={0.75}
                      />
                    </div>
                  )}
                </div>

                {/* Gate Rule & Security Role */}
                <div className="rounded-xl bg-black/45 p-3 text-xs text-slate-300 border border-white/[0.08] space-y-1.5">
                  <div className="font-bold font-mono text-cyan-400">{GATE_SPECS[selectedGate].formula}</div>
                  <p className="text-[11px] leading-relaxed text-slate-300">{GATE_SPECS[selectedGate].rule}</p>
                  <div className="text-[11px] text-amber-300/90 pt-1 border-t border-white/[0.08]">
                    <strong>Cybersecurity &amp; Systems: </strong>
                    {GATE_SPECS[selectedGate].securityRole}
                  </div>
                </div>
              </div>

              {/* Middle: Visual Wire Circuit */}
              <div className="optical-inset rounded-xl flex flex-col items-center justify-center p-6 text-center space-y-4">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  Live Digital Circuit Signal
                </span>

                <div className="flex items-center gap-4">
                  {/* Wire Inputs */}
                  <div className="flex flex-col gap-4">
                    <div
                      className={`h-4 w-12 rounded-md transition-colors ${
                        inputA === 1 ? 'bg-cyan-400 shadow-[0_0_12px_#22d3ee]' : 'bg-white/[0.08]'
                      }`}
                    />
                    {selectedGate !== 'NOT' && (
                      <div
                        className={`h-4 w-12 rounded-md transition-colors ${
                          inputB === 1 ? 'bg-cyan-400 shadow-[0_0_12px_#22d3ee]' : 'bg-white/[0.08]'
                        }`}
                      />
                    )}
                  </div>

                  {/* Gate Box */}
                  <div className="h-20 w-24 rounded-2xl border-2 border-cyan-400/70 bg-cyan-500/15 flex flex-col items-center justify-center shadow-[0_0_24px_-6px_rgba(34,211,238,0.45)]">
                    <span className="text-base font-extrabold font-mono text-white">{selectedGate}</span>
                    <span className="text-[10px] font-mono text-cyan-300">GATE</span>
                  </div>

                  {/* Output Wire */}
                  <div
                    className={`h-4 w-12 rounded-md transition-colors ${
                      currentGateOutput === 1 ? 'bg-emerald-400 shadow-[0_0_12px_#34d399]' : 'bg-white/[0.08]'
                    }`}
                  />

                  {/* Output Indicator Bulb */}
                  <div
                    className={`h-16 w-16 rounded-full border-2 flex flex-col items-center justify-center font-mono font-extrabold text-lg transition-all ${
                      currentGateOutput === 1
                        ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200 shadow-[0_0_22px_rgba(52,211,153,0.55)] scale-105'
                        : 'border-white/[0.1] bg-black/45 text-slate-600'
                    }`}
                  >
                    <span>{currentGateOutput}</span>
                    <span className="text-[8px] uppercase tracking-wider font-sans font-bold">
                      {currentGateOutput === 1 ? 'TRUE' : 'FALSE'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Dynamic Truth Table */}
              <div className="optical-inset rounded-xl p-4 space-y-3">
                <span className="text-xs font-mono font-bold text-slate-300 block">
                  3. Truth Table for {selectedGate} Gate
                </span>

                <div className="overflow-hidden rounded-xl border border-white/[0.08]">
                  <table className="w-full text-xs font-mono text-left">
                    <thead className="bg-white/[0.03] text-slate-400 border-b border-white/[0.08]">
                      <tr>
                        <th className="p-2 text-center">A</th>
                        {selectedGate !== 'NOT' && <th className="p-2 text-center">B</th>}
                        <th className="p-2 text-center text-cyan-400 font-bold">OUTPUT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.06]">
                      {(selectedGate === 'NOT'
                        ? [
                            { a: 0, b: 0, out: GATE_SPECS['NOT'].compute(0, 0) },
                            { a: 1, b: 0, out: GATE_SPECS['NOT'].compute(1, 0) }
                          ]
                        : [
                            { a: 0, b: 0, out: GATE_SPECS[selectedGate].compute(0, 0) },
                            { a: 0, b: 1, out: GATE_SPECS[selectedGate].compute(0, 1) },
                            { a: 1, b: 0, out: GATE_SPECS[selectedGate].compute(1, 0) },
                            { a: 1, b: 1, out: GATE_SPECS[selectedGate].compute(1, 1) }
                          ]
                      ).map((row, idx) => {
                        const isCurrentState =
                          selectedGate === 'NOT'
                            ? inputA === row.a
                            : inputA === row.a && inputB === row.b;

                        return (
                          <tr
                            key={idx}
                            className={`transition-colors ${
                              isCurrentState
                                ? 'bg-cyan-500/20 text-cyan-200 font-bold'
                                : 'text-slate-400 hover:bg-white/[0.03]'
                            }`}
                          >
                            <td className="p-2 text-center">{row.a}</td>
                            {selectedGate !== 'NOT' && <td className="p-2 text-center">{row.b}</td>}
                            <td className="p-2 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-md ${
                                  row.out === 1
                                    ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                                    : 'bg-white/[0.04] text-slate-500'
                                }`}
                              >
                                {row.out}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODULE 8: CPU & MEMORY ARCHITECTURE */}
      {/* ======================================================== */}
      {activeTab === 'hardware' && (
        <div className="space-y-6">
          <div className="optical-panel rounded-2xl p-5 sm:p-6 space-y-6">
            <div>
              <span className="text-xs font-mono text-cyan-400 font-bold">THE VON NEUMANN ARCHITECTURE</span>
              <p className="text-xs text-slate-400 mt-0.5">
                How electricity and memory actually execute C and Linux machine instructions.
              </p>
            </div>

            {/* Pipeline Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="optical-card p-4 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold">
                  <span className="h-6 w-6 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-400/35">
                    1
                  </span>
                  <span>FETCH CYCLE</span>
                </div>
                <h5 className="text-sm font-bold text-white">Instruction Pointer (RIP / PC)</h5>
                <p className="text-xs text-slate-400 leading-relaxed">
                  The CPU fetches the 64-bit opcode from the RAM address pointed to by the <code>RIP</code> register.
                  It moves this machine code into the Instruction Register.
                </p>
              </div>

              <div className="optical-card p-4 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold">
                  <span className="h-6 w-6 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-400/35">
                    2
                  </span>
                  <span>DECODE CYCLE</span>
                </div>
                <h5 className="text-sm font-bold text-white">Control Unit &amp; Microcode</h5>
                <p className="text-xs text-slate-400 leading-relaxed">
                  The Control Unit decodes the opcode bits (e.g. <code>0x48 0x31 0xC0</code> = <code>xor rax, rax</code>).
                  It activates electrical signal lines to route data between registers and the ALU.
                </p>
              </div>

              <div className="optical-card p-4 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold">
                  <span className="h-6 w-6 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-400/35">
                    3
                  </span>
                  <span>EXECUTE CYCLE</span>
                </div>
                <h5 className="text-sm font-bold text-white">Arithmetic Logic Unit (ALU)</h5>
                <p className="text-xs text-slate-400 leading-relaxed">
                  The ALU performs the arithmetic or logic operation using logic gates. Flags ($ZF, $CF, $SF)
                  are updated, and the result is written back to registers or cache memory.
                </p>
              </div>
            </div>

            {/* Memory Latency Hierarchy Pyramid */}
            <div className="optical-inset rounded-xl p-4 space-y-3">
              <span className="text-xs font-mono font-bold text-cyan-400">
                Memory Latency Hierarchy (Why Data Locality Matters)
              </span>

              <div className="space-y-2">
                {[
                  { level: 'CPU Registers (RAX, RBX, RCX...)', speed: '~0.5 nanoseconds', size: 'Bytes (~1 KB)', color: 'bg-cyan-500' },
                  { level: 'L1 Cache (On-die fast SRAM)', speed: '~1 nanosecond', size: '32 - 64 KB per core', color: 'bg-indigo-500' },
                  { level: 'L2 Cache (Shared SRAM)', speed: '~3 - 4 nanoseconds', size: '512 KB - 1 MB', color: 'bg-purple-500' },
                  { level: 'L3 Cache (Big LLC SRAM)', speed: '~10 - 20 nanoseconds', size: '16 - 64 MB', color: 'bg-amber-500' },
                  { level: 'Main Memory (DDR4 / DDR5 DRAM)', speed: '~60 - 80 nanoseconds', size: '16 - 64 GB', color: 'bg-rose-500' },
                  { level: 'NVMe SSD / Disk Storage', speed: '~10,000 - 100,000 ns', size: '1 - 4 TB', color: 'bg-slate-600' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl border border-white/[0.06] bg-black/45 text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <div className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                      <span className="text-white font-semibold">{item.level}</span>
                    </div>
                    <div className="flex items-center gap-4 text-slate-400 tabular-nums">
                      <span>Size: {item.size}</span>
                      <span className="text-cyan-400 font-bold">{item.speed}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODULE 9: MINIMUM MATH CHECKLIST */}
      {/* ======================================================== */}
      {activeTab === 'checklist' && (
        <div className="space-y-6">
          <div className="optical-panel rounded-2xl p-5 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <span className="text-xs font-mono text-cyan-400 font-bold">MINIMUM MATHEMATICS CHECKLIST</span>
                <p className="text-xs text-slate-400 mt-0.5">
                  Extracted directly from Section 3 (Pages 10 &amp; 11) of the Student Handbook.
                </p>
              </div>
              <div className="text-xs font-mono text-cyan-400 font-bold tabular-nums">
                {Object.values(checkedItems).filter(Boolean).length} of {MATH_CHECKLIST.length} Mastered
              </div>
            </div>

            <div className="space-y-3">
              {MATH_CHECKLIST.map((item) => {
                const isChecked = Boolean(checkedItems[item.id]);

                return (
                  <div
                    key={item.id}
                    onClick={() => toggleCheck(item.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                      isChecked
                        ? 'border-emerald-400/40 bg-emerald-500/10 text-slate-100'
                        : 'optical-card text-slate-300'
                    }`}
                  >
                    <button className="mt-0.5 text-slate-400 hover:text-white shrink-0">
                      {isChecked ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      ) : (
                        <Circle className="h-5 w-5 text-slate-600" />
                      )}
                    </button>
                    <div className="flex-1">
                      <div className={`text-xs font-bold ${isChecked ? 'text-emerald-300 font-mono' : 'text-white'}`}>
                        {item.title}
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 flex justify-end">
              <SoapBubbleButton
                onClick={() =>
                  onOpenAiMentor(
                    'ELI9: Give me a short 3-question math quiz on powers of 2, binary conversions, and Boolean XOR to test my readiness for Stage 0 & 1!'
                  )
                }
                tint="rgb(14 165 233)"
                opacity={0.92}
                style={{ fontSize: 12 }}
                className="!min-h-[34px] !px-4 font-mono font-bold text-white"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Test My Math Readiness with AI Tutor</span>
              </SoapBubbleButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
