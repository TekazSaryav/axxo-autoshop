import fs from 'fs';
import path from 'path';
const dataDir = path.resolve(process.cwd(), 'data');
const ordersFilePath = path.resolve(dataDir, 'stars_orders.json');
function ensureDataFile() {
    try {
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
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
