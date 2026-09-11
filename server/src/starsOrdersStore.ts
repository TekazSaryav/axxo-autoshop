import fs from 'fs';
import path from 'path';

export interface StarsOrderItem {
  productId: number;
  variantId?: number;
  name: string;
  variantName?: string;
  priceEur: number;
  quantity: number;
}

export interface StarsOrder {
  orderId: string;
  chatId: number | string;
  telegramUsername?: string;
  email: string;
  items: StarsOrderItem[];
  eurTotal: number;
  starsAmount: number;
  status: 'pending' | 'paid';
  delivered?: string;
  instructions?: string;
  createdAt: string;
  paidAt?: string;
  telegramPaymentChargeId?: string;
  isReseller?: boolean;
  discountApplied?: number;
}

const dataDir = path.resolve(process.cwd(), 'data');
const ordersFilePath = path.resolve(dataDir, 'stars_orders.json');

function ensureDataFile(): void {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(ordersFilePath)) {
      fs.writeFileSync(ordersFilePath, JSON.stringify({}, null, 2), 'utf8');
    }
  } catch (err) {
    console.error('Failed to initialize stars orders file:', err);
  }
}

function loadOrdersData(): Record<string, StarsOrder> {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(ordersFilePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading stars orders data:', err);
    return {};
  }
}

function saveOrdersData(data: Record<string, StarsOrder>): void {
  ensureDataFile();
  try {
    fs.writeFileSync(ordersFilePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving stars orders data:', err);
  }
}

export function saveStarsOrder(order: StarsOrder): void {
  const data = loadOrdersData();
  data[order.orderId] = order;
  saveOrdersData(data);
}

export function getStarsOrder(orderId: string): StarsOrder | undefined {
  const data = loadOrdersData();
  return data[orderId];
}

export function getAllStarsOrders(): StarsOrder[] {
  const data = loadOrdersData();
  return Object.values(data).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
