import fs from 'fs';
import path from 'path';
import { resolveDataDir } from './dataPath.js';
function getOrdersFilePath() {
    const dir = resolveDataDir();
    return path.resolve(dir, 'stars_orders.json');
}
function ensureDataFile() {
    try {
        const dir = resolveDataDir();
        const ordersFilePath = getOrdersFilePath();
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        if (!fs.existsSync(ordersFilePath)) {
            fs.writeFileSync(ordersFilePath, JSON.stringify({}, null, 2), 'utf8');
        }
    }
    catch (err) {
        console.error('Failed to initialize stars orders file:', err);
    }
}
function loadOrdersData() {
    ensureDataFile();
    try {
        const ordersFilePath = getOrdersFilePath();
        const raw = fs.readFileSync(ordersFilePath, 'utf8');
        return JSON.parse(raw);
    }
    catch (err) {
        console.error('Error reading stars orders data:', err);
        return {};
    }
}
function saveOrdersData(data) {
    ensureDataFile();
    try {
        const ordersFilePath = getOrdersFilePath();
        fs.writeFileSync(ordersFilePath, JSON.stringify(data, null, 2), 'utf8');
    }
    catch (err) {
        console.error('Error saving stars orders data:', err);
    }
}
export function saveStarsOrder(order) {
    const data = loadOrdersData();
    data[order.orderId] = order;
    saveOrdersData(data);
}
export function getStarsOrder(orderId) {
    const data = loadOrdersData();
    return data[orderId];
}
export function getAllStarsOrders() {
    const data = loadOrdersData();
    return Object.values(data).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
