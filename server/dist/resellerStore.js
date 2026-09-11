import fs from 'fs';
import path from 'path';
const dataDir = path.resolve(process.cwd(), 'data');
const resellersFilePath = path.resolve(dataDir, 'resellers.json');
function ensureDataFile() {
    try {
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        if (!fs.existsSync(resellersFilePath)) {
            const initial = {
                defaultDiscountPercentage: 20,
                resellers: {}
            };
            fs.writeFileSync(resellersFilePath, JSON.stringify(initial, null, 2), 'utf8');
        }
    }
    catch (err) {
        console.error('Failed to initialize resellers file:', err);
    }
}
function loadResellerData() {
    ensureDataFile();
    try {
        const raw = fs.readFileSync(resellersFilePath, 'utf8');
        return JSON.parse(raw);
    }
    catch (err) {
        console.error('Error reading reseller data:', err);
        return { defaultDiscountPercentage: 20, resellers: {} };
    }
}
function saveResellerData(data) {
    ensureDataFile();
    try {
        fs.writeFileSync(resellersFilePath, JSON.stringify(data, null, 2), 'utf8');
    }
    catch (err) {
        console.error('Error saving reseller data:', err);
    }
}
export function getAllResellers() {
    const data = loadResellerData();
    return Object.values(data.resellers);
}
export function getReseller(telegramId) {
    if (!telegramId)
        return undefined;
    const data = loadResellerData();
    return data.resellers[String(telegramId).trim()];
}
export function isReseller(telegramId) {
    return !!getReseller(telegramId);
}
export function addReseller(telegramId, name, discountPercentage, note) {
    const data = loadResellerData();
    const idStr = String(telegramId).trim();
    const discount = typeof discountPercentage === 'number' && discountPercentage > 0
        ? discountPercentage
        : (data.defaultDiscountPercentage || 20);
    const reseller = {
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
export function removeReseller(telegramId) {
    const data = loadResellerData();
    const idStr = String(telegramId).trim();
    if (data.resellers[idStr]) {
        delete data.resellers[idStr];
        saveResellerData(data);
        return true;
    }
    return false;
}
export function setDefaultDiscount(percentage) {
    const data = loadResellerData();
    data.defaultDiscountPercentage = percentage;
    saveResellerData(data);
}
export function getDefaultDiscount() {
    const data = loadResellerData();
    return data.defaultDiscountPercentage || 20;
}
