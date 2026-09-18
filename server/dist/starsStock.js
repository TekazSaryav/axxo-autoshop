import fs from 'fs';
import path from 'path';
import { resolveDataDir } from './dataPath.js';
function getStockFilePath() {
    const dir = resolveDataDir();
    return path.resolve(dir, 'stars_stock.json');
}
function ensureDataFile() {
    try {
        const dir = resolveDataDir();
        const stockFilePath = getStockFilePath();
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        if (!fs.existsSync(stockFilePath)) {
            const initial = {
                stock: {}
            };
            fs.writeFileSync(stockFilePath, JSON.stringify(initial, null, 2), 'utf8');
        }
    }
    catch (err) {
        console.error('Failed to initialize stock file:', err);
    }
}
function loadStockData() {
    ensureDataFile();
    try {
        const stockFilePath = getStockFilePath();
        const raw = fs.readFileSync(stockFilePath, 'utf8');
        return JSON.parse(raw);
    }
    catch (err) {
        console.error('Error reading stock data:', err);
        return { stock: {} };
    }
}
function saveStockData(data) {
    ensureDataFile();
    try {
        const stockFilePath = getStockFilePath();
        fs.writeFileSync(stockFilePath, JSON.stringify(data, null, 2), 'utf8');
    }
    catch (err) {
        console.error('Error saving stock data:', err);
    }
}
export function getStockKey(productId, variantId) {
    if (variantId) {
        return `${productId}_${variantId}`;
    }
    return `${productId}`;
}
export function setAdminChatId(chatId) {
    const data = loadStockData();
    data.adminChatId = chatId;
    saveStockData(data);
}
export function getAdminChatId() {
    const data = loadStockData();
    return data.adminChatId;
}
export function addStock(productId, productName, variantId, variantName, lines) {
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
    }
    else {
        data.stock[key].productName = productName;
        if (variantName)
            data.stock[key].variantName = variantName;
    }
    data.stock[key].serials.push(...cleanLines);
    saveStockData(data);
    return {
        added: cleanLines.length,
        total: data.stock[key].serials.length
    };
}
export function popStock(productId, variantId, count = 1) {
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
export function getStockCount(productId, variantId) {
    const data = loadStockData();
    let key = getStockKey(productId, variantId);
    if (data.stock[key]) {
        return data.stock[key].serials.length;
    }
    key = getStockKey(productId);
    return data.stock[key]?.serials.length || 0;
}
export function getAllStock() {
    const data = loadStockData();
    return Object.values(data.stock);
}
export function clearStock(productId, variantId) {
    const data = loadStockData();
    const key = getStockKey(productId, variantId);
    if (data.stock[key]) {
        delete data.stock[key];
        saveStockData(data);
        return true;
    }
    return false;
}
