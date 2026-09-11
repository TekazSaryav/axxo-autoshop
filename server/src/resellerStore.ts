import fs from 'fs';
import path from 'path';

export interface Reseller {
  telegramId: string;
  name?: string;
  discountPercentage: number; // e.g. 20 for 20% off
  createdAt: string;
  note?: string;
}

export interface ResellerData {
  defaultDiscountPercentage: number;
  resellers: Record<string, Reseller>; // key: telegramId
}

const dataDir = path.resolve(process.cwd(), 'data');
const resellersFilePath = path.resolve(dataDir, 'resellers.json');

function ensureDataFile(): void {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(resellersFilePath)) {
      const initial: ResellerData = {
        defaultDiscountPercentage: 20,
        resellers: {}
      };
      fs.writeFileSync(resellersFilePath, JSON.stringify(initial, null, 2), 'utf8');
    }
  } catch (err) {
    console.error('Failed to initialize resellers file:', err);
  }
}

function loadResellerData(): ResellerData {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(resellersFilePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading reseller data:', err);
    return { defaultDiscountPercentage: 20, resellers: {} };
  }
}

function saveResellerData(data: ResellerData): void {
  ensureDataFile();
  try {
    fs.writeFileSync(resellersFilePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving reseller data:', err);
  }
}

export function getAllResellers(): Reseller[] {
  const data = loadResellerData();
  return Object.values(data.resellers);
}

export function getReseller(telegramId: string | number): Reseller | undefined {
  if (!telegramId) return undefined;
  const data = loadResellerData();
  return data.resellers[String(telegramId).trim()];
}

export function isReseller(telegramId: string | number): boolean {
  return !!getReseller(telegramId);
}

export function addReseller(
  telegramId: string | number,
  name?: string,
  discountPercentage?: number,
  note?: string
): Reseller {
  const data = loadResellerData();
  const idStr = String(telegramId).trim();
  const discount = typeof discountPercentage === 'number' && discountPercentage > 0
    ? discountPercentage
    : (data.defaultDiscountPercentage || 20);

  const reseller: Reseller = {
    telegramId: idStr,
    name: name?.trim() || undefined,
    discountPercentage: discount,
    createdAt: new Date().toISOString(),
    note: note?.trim() || undefined
  };

  data.resellers[idStr] = reseller;
  saveResellerData(data);
  return reseller;
}

export function removeReseller(telegramId: string | number): boolean {
  const data = loadResellerData();
  const idStr = String(telegramId).trim();
  if (data.resellers[idStr]) {
    delete data.resellers[idStr];
    saveResellerData(data);
    return true;
  }
  return false;
}

export function setDefaultDiscount(percentage: number): void {
  const data = loadResellerData();
  data.defaultDiscountPercentage = percentage;
  saveResellerData(data);
}

export function getDefaultDiscount(): number {
  const data = loadResellerData();
  return data.defaultDiscountPercentage || 20;
}
