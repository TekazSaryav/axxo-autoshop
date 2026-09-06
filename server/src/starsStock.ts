import fs from 'fs';
import path from 'path';

export interface StockEntry {
  productId: number;
  variantId?: number;
  productName: string;
  variantName?: string;
  serials: string[];
}

export interface StarsStockData {
  adminChatId?: number | string;
  stock: Record<string, StockEntry>;
}

const dataDir = path.resolve(process.cwd(), 'data');
const stockFilePath = path.resolve(dataDir, 'stars_stock.json');

function ensureDataFile(): void {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(stockFilePath)) {
      const initial: StarsStockData = {
        stock: {}
      };
      fs.writeFileSync(stockFilePath, JSON.stringify(initial, null, 2), 'utf8');
    }
  } catch (err) {
    console.error('Failed to initialize stock file:', err);
  }
}

function loadStockData(): StarsStockData {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(stockFilePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading stock data:', err);
    return { stock: {} };
  }
}

function saveStockData(data: StarsStockData): void {
  ensureDataFile();
  try {
    fs.writeFileSync(stockFilePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving stock data:', err);
  }
}

export function getStockKey(productId: number, variantId?: number): string {
  if (variantId) {
    return `${productId}_${variantId}`;
  }
  return `${productId}`;
}

export function setAdminChatId(chatId: number | string): void {
  const data = loadStockData();
  data.adminChatId = chatId;
  saveStockData(data);
}

export function getAdminChatId(): number | string | undefined {
  const data = loadStockData();
  return data.adminChatId;
}

export function addStock(
  productId: number,
  productName: string,
  variantId: number | undefined,
  variantName: string | undefined,
  lines: string[]
): { added: number; total: number } {
  const data = loadStockData();
  const key = getStockKey(productId, variantId);

  const cleanLines = lines
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (!data.stock[key]) {
    data.stock[key] = {
      productId,
      variantId,
      productName,
      variantName,
      serials: []
    };
  } else {
    data.stock[key].productName = productName;
    if (variantName) data.stock[key].variantName = variantName;
  }

  data.stock[key].serials.push(...cleanLines);
  saveStockData(data);

  return {
    added: cleanLines.length,
    total: data.stock[key].serials.length
  };
}

export function popStock(productId: number, variantId: number | undefined, count = 1): string[] {
  const data = loadStockData();
  let key = getStockKey(productId, variantId);
  if (!data.stock[key] || data.stock[key].serials.length === 0) {
    key = getStockKey(productId);
  }

  if (!data.stock[key] || data.stock[key].serials.length === 0) {
    return [];
  }

  const popped = data.stock[key].serials.splice(0, count);
  saveStockData(data);
  return popped;
}

export function getStockCount(productId: number, variantId?: number): number {
  const data = loadStockData();
  let key = getStockKey(productId, variantId);
  if (data.stock[key]) {
    return data.stock[key].serials.length;
  }
  key = getStockKey(productId);
  return data.stock[key]?.serials.length || 0;
}

export function getAllStock(): StockEntry[] {
  const data = loadStockData();
  return Object.values(data.stock);
}

export function clearStock(productId: number, variantId?: number): boolean {
  const data = loadStockData();
  const key = getStockKey(productId, variantId);
  if (data.stock[key]) {
    delete data.stock[key];
    saveStockData(data);
    return true;
  }
  return false;
}
