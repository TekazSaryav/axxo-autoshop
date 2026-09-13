import fs from 'fs';
import path from 'path';
const dataDir = path.resolve(process.cwd(), 'data');
const usersFilePath = path.resolve(dataDir, 'users.json');
function ensureDataFile() {
    try {
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        if (!fs.existsSync(usersFilePath)) {
            fs.writeFileSync(usersFilePath, JSON.stringify({}, null, 2), 'utf8');
        }
    }
    catch (err) {
        console.error('Failed to initialize users file:', err);
    }
}
function loadUsersData() {
    ensureDataFile();
    try {
        const raw = fs.readFileSync(usersFilePath, 'utf8');
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
        fs.writeFileSync(usersFilePath, JSON.stringify(data, null, 2), 'utf8');
    }
    catch (err) {
        console.error('Error saving users data:', err);
    }
}
export function recordTelegramUser(id, username, firstName, lastName, languageCode) {
    if (!id)
        return;
    const strId = String(id).trim();
    const users = loadUsersData();
    const now = new Date().toISOString();
    if (users[strId]) {
        users[strId].lastSeen = now;
        if (username)
            users[strId].username = username;
        if (firstName)
            users[strId].firstName = firstName;
        if (lastName)
            users[strId].lastName = lastName;
        if (languageCode)
            users[strId].languageCode = languageCode;
    }
    else {
        users[strId] = {
            id: strId,
            username,
            firstName,
            lastName,
            languageCode,
            firstSeen: now,
            lastSeen: now
        };
    }
    saveUsersData(users);
}
export function getAllTelegramUsers() {
    const users = loadUsersData();
    return Object.values(users);
}
export function getTelegramUsersCount() {
    const users = loadUsersData();
    return Object.keys(users).length;
}
