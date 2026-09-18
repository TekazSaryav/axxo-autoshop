import fs from 'fs';
import path from 'path';
import { resolveDataDir } from './dataPath.js';
function getUsersFilePath() {
    const dir = resolveDataDir();
    return path.resolve(dir, 'users.json');
}
function ensureDataFile() {
    try {
        const dir = resolveDataDir();
        const filePath = getUsersFilePath();
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, JSON.stringify({}, null, 2), 'utf8');
        }
    }
    catch (err) {
        console.error('Failed to initialize users file:', err);
    }
}
function loadUsersData() {
    ensureDataFile();
    try {
        const filePath = getUsersFilePath();
        const raw = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(raw);
    }
    catch (err) {
        console.error('Error reading users data:', err);
        return {};
    }
}
function saveUsersData(data) {
    ensureDataFile();
    try {
        const filePath = getUsersFilePath();
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    }
    catch (err) {
        console.error('Error saving users data:', err);
    }
}
export function recordTelegramUser(id, username, firstName, lastName, languageCode, source) {
    if (!id)
        return;
    const strId = String(id).trim();
    const users = loadUsersData();
    const now = new Date().toISOString();
    const cleanUsername = username ? username.replace(/^@/, '').trim() : undefined;
    if (users[strId]) {
        users[strId].lastSeen = now;
        if (cleanUsername)
            users[strId].username = cleanUsername;
        if (firstName)
            users[strId].firstName = firstName;
        if (lastName)
            users[strId].lastName = lastName;
        if (languageCode)
            users[strId].languageCode = languageCode;
        if (source && !users[strId].source)
            users[strId].source = source;
    }
    else {
        users[strId] = {
            id: strId,
            username: cleanUsername,
            firstName,
            lastName,
            languageCode,
            firstSeen: now,
            lastSeen: now,
            source: source || 'interaction'
        };
    }
    saveUsersData(users);
}
export function addManualUser(id, username) {
    const strId = String(id).trim();
    const cleanUsername = username ? username.replace(/^@/, '').trim() : undefined;
    recordTelegramUser(strId, cleanUsername, undefined, undefined, undefined, 'manual_admin');
    const users = loadUsersData();
    return users[strId];
}
export function getAllTelegramUsers() {
    const users = loadUsersData();
    return Object.values(users).sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime());
}
export function getTelegramUsersCount() {
    const users = loadUsersData();
    return Object.keys(users).length;
}
/**
 * Automatically backfills and seeds users from existing stars orders, resellers, and admins
 */
export function seedUsersFromExistingData() {
    try {
        const dir = resolveDataDir();
        let countSeeded = 0;
        // 1. From stars_orders.json
        const ordersFilePath = path.resolve(dir, 'stars_orders.json');
        if (fs.existsSync(ordersFilePath)) {
            try {
                const raw = fs.readFileSync(ordersFilePath, 'utf8');
                const orders = JSON.parse(raw);
                for (const ord of Object.values(orders)) {
                    if (ord.chatId) {
                        recordTelegramUser(ord.chatId, ord.telegramUsername, undefined, undefined, undefined, 'stars_order');
                        countSeeded++;
                    }
                }
            }
            catch (err) {
                console.warn('Could not parse stars_orders.json during user seed:', err);
            }
        }
        // 2. From resellers.json
        const resellersFilePath = path.resolve(dir, 'resellers.json');
        if (fs.existsSync(resellersFilePath)) {
            try {
                const raw = fs.readFileSync(resellersFilePath, 'utf8');
                const resData = JSON.parse(raw);
                if (resData && resData.resellers) {
                    for (const r of Object.values(resData.resellers)) {
                        if (r.telegramId) {
                            recordTelegramUser(r.telegramId, undefined, r.name, undefined, undefined, 'reseller');
                            countSeeded++;
                        }
                    }
                }
            }
            catch (err) {
                console.warn('Could not parse resellers.json during user seed:', err);
            }
        }
        // 3. Admin user
        if (process.env.ADMIN_TELEGRAM_ID) {
            recordTelegramUser(process.env.ADMIN_TELEGRAM_ID, 'notthatid', 'Admin', undefined, undefined, 'admin_config');
        }
        console.log(`👥 Users store initialized. Total registered users: ${getTelegramUsersCount()} (seeded ${countSeeded})`);
    }
    catch (err) {
        console.warn('User seed error:', err.message);
    }
}
