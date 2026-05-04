/**
 * Web Bluetooth + ESC/POS for Peripage-style 58mm thermal printers.
 * Tested against common BLE UART profiles; Peripage may use FFE0 or Nordic NUS.
 */

const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

const OPTIONAL_SERVICES = [
  "6e400001-b5a3-f393-e0a9-e50e24dcca9e", // Nordic UART
  "0000ffe0-0000-1000-8000-00805f9b34fb", // Serial / Peripage common
  "0000ff00-0000-1000-8000-00805f9b34fb", // Some thermal BLE
] as const;

const KNOWN_WRITE_PAIRS: { service: string; characteristic: string }[] = [
  {
    service: "6e400001-b5a3-f393-e0a9-e50e24dcca9e",
    characteristic: "6e400002-b5a3-f393-e0a9-e50e24dcca9e",
  },
  {
    service: "0000ffe0-0000-1000-8000-00805f9b34fb",
    characteristic: "0000ffe1-0000-1000-8000-00805f9b34fb",
  },
  {
    service: "0000ff00-0000-1000-8000-00805f9b34fb",
    characteristic: "0000ff02-0000-1000-8000-00805f9b34fb",
  },
  {
    service: "0000ff00-0000-1000-8000-00805f9b34fb",
    characteristic: "0000ff01-0000-1000-8000-00805f9b34fb",
  },
];

let cachedWrite: BluetoothRemoteGATTCharacteristic | null = null;
let cachedDevice: BluetoothDevice | null = null;

function u8(...bytes: number[]): Uint8Array {
  return new Uint8Array(bytes);
}

function concatU8(chunks: Uint8Array[]): Uint8Array {
  const len = chunks.reduce((n, a) => n + a.length, 0);
  const out = new Uint8Array(len);
  let o = 0;
  for (const a of chunks) {
    out.set(a, o);
    o += a.length;
  }
  return out;
}

function toArrayBuffer(data: Uint8Array): ArrayBuffer {
  return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
}

function utf8(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

/** ESC @ init */
function init(): Uint8Array {
  return u8(ESC, 0x40);
}

function alignCenter(): Uint8Array {
  return u8(ESC, 0x61, 0x01);
}
function alignLeft(): Uint8Array {
  return u8(ESC, 0x61, 0x00);
}
function boldOn(): Uint8Array {
  return u8(ESC, 0x45, 0x01);
}
function boldOff(): Uint8Array {
  return u8(ESC, 0x45, 0x00);
}
/** GS ! n — 0x11 = 2x2 text */
function sizeLarge(): Uint8Array {
  return u8(GS, 0x21, 0x11);
}
function sizeNormal(): Uint8Array {
  return u8(GS, 0x21, 0x00);
}
function lineFeeds(n: number): Uint8Array {
  const a = new Uint8Array(n);
  a.fill(LF);
  return a;
}

function partialCut(): Uint8Array {
  return u8(GS, 0x56, 0x00);
}

export function isWebBluetoothPrintingSupported(): boolean {
  if (typeof navigator === "undefined" || !navigator.bluetooth) return false;
  if (typeof window === "undefined") return false;
  if (!window.isSecureContext) return false;
  return true;
}

export function bluetoothUnsupportedUserMessage(): string {
  return "Your browser does not support Bluetooth printing. Please use Chrome on Android.";
}

export function isPrinterConnected(): boolean {
  if (!cachedWrite) return false;
  try {
    return cachedWrite.service.device.gatt?.connected === true;
  } catch {
    return false;
  }
}

function clearCache(): void {
  cachedWrite = null;
  cachedDevice = null;
}

async function pickWritableCharacteristic(
  server: BluetoothRemoteGATTServer
): Promise<BluetoothRemoteGATTCharacteristic> {
  for (const { service: su, characteristic: cu } of KNOWN_WRITE_PAIRS) {
    try {
      const svc = await server.getPrimaryService(su);
      const ch = await svc.getCharacteristic(cu);
      if (ch.properties.write || ch.properties.writeWithoutResponse) {
        return ch;
      }
    } catch {
      /* try next */
    }
  }
  const services = await server.getPrimaryServices();
  for (const svc of services) {
    const chars = await svc.getCharacteristics();
    for (const ch of chars) {
      if (ch.properties.writeWithoutResponse || ch.properties.write) {
        return ch;
      }
    }
  }
  throw new Error("No writable GATT characteristic found for this device.");
}

/**
 * Open BLE chooser, connect, cache write characteristic. Call from user gesture.
 */
export async function connectPeripagePrinter(): Promise<void> {
  if (!isWebBluetoothPrintingSupported()) {
    throw new Error(bluetoothUnsupportedUserMessage());
  }
  if (typeof navigator.bluetooth === "undefined" || !navigator.bluetooth) {
    throw new Error("Web Bluetooth is not available");
  }
  const device = await navigator.bluetooth.requestDevice({
    acceptAllDevices: true,
    optionalServices: [...OPTIONAL_SERVICES],
  });
  const server = device.gatt;
  if (!server) throw new Error("GATT not available on this device");
  const s = await server.connect();
  const ch = await pickWritableCharacteristic(s);
  device.addEventListener("gattserverdisconnected", () => {
    clearCache();
  });
  cachedDevice = device;
  cachedWrite = ch;
}

export function disconnectPeripagePrinter(): void {
  try {
    cachedDevice?.gatt?.disconnect();
  } catch {
    /* ignore */
  }
  clearCache();
}

const CHUNK = 100;

async function writeAll(ch: BluetoothRemoteGATTCharacteristic, data: Uint8Array): Promise<void> {
  const wn = (ch as BluetoothRemoteGATTCharacteristic & {
    writeValueWithoutResponse?: (v: BufferSource) => Promise<void>;
  }).writeValueWithoutResponse;
  for (let i = 0; i < data.length; i += CHUNK) {
    const slice = data.subarray(i, i + CHUNK);
    const payload = toArrayBuffer(slice);
    if (ch.properties.writeWithoutResponse && typeof wn === "function") {
      await wn.call(ch, payload);
    } else {
      await ch.writeValue(payload);
    }
  }
}

export type LabelPrintPayload = {
  storeName?: string;
  customerName: string;
  customerPhone: string;
  address: string;
  orderId: string;
  /** ISO or display string from API */
  orderDate: string;
  /** e.g. tracking when SHIPPED */
  trackingNumber?: string | null;
  status: string;
};

/**
 * Build ESC/POS label as UTF-8. Many 58mm units render Thai with UTF-8; if garbled, firmware may need CP874.
 */
export function buildLabelEscPos(payload: LabelPrintPayload): Uint8Array {
  const store = payload.storeName ?? "Smile Seed Bank";
  const name = (payload.customerName || "—").trim();
  const phone = (payload.customerPhone || "—").trim();
  const addr = (payload.address || "—").trim();
  const orderNo = (payload.orderId || "—").trim();
  const dateLine = (() => {
    try {
      const d = new Date(payload.orderDate);
      if (Number.isNaN(d.getTime())) return payload.orderDate;
      return d.toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" });
    } catch {
      return payload.orderDate;
    }
  })();
  const status = (payload.status || "").trim();
  const track = (payload.trackingNumber || "").trim();

  const parts: Uint8Array[] = [
    init(),
    alignCenter(),
    boldOn(),
    utf8(`${store}\n`),
    boldOff(),
    lineFeeds(1),
    alignLeft(),
    sizeLarge(),
    utf8(`${name}\n`),
    utf8(`${phone}\n`),
    sizeNormal(),
    lineFeeds(1),
    utf8(addr.split(/\r?\n/).join("\n") + "\n"),
    lineFeeds(1),
    alignLeft(),
    boldOn(),
    utf8("Order: "),
    boldOff(),
    utf8(`#${orderNo}\n`),
    utf8(`${dateLine}\n`),
    utf8(`Status: ${status}\n`),
  ];
  if (track) {
    parts.push(utf8(`Tracking: ${track}\n`));
  }
  parts.push(lineFeeds(3), partialCut());
  return concatU8(parts);
}

export async function printLabelToCachedPrinter(data: Uint8Array): Promise<void> {
  if (!isWebBluetoothPrintingSupported()) {
    throw new Error(bluetoothUnsupportedUserMessage());
  }
  if (!cachedWrite || !isPrinterConnected()) {
    throw new Error("Printer not connected. Connect first.");
  }
  await writeAll(cachedWrite, data);
}

export async function buildAndPrintLabel(payload: LabelPrintPayload): Promise<void> {
  const bytes = buildLabelEscPos(payload);
  await printLabelToCachedPrinter(bytes);
}
