
// require('dotenv').config();
// const express = require('express');
// const jwt = require('jsonwebtoken'); // Використовуємо JWT замість сесій
// const crypto = require('crypto');
// const cors = require('cors');

// // 2. Створюємо додаток Express
// const app = express();
// const PORT = process.env.PORT || 3001;

// // --- ІМІТАЦІЯ БАЗИ ДАНИХ ТА СХОВИЩА КОРИСТУВАЧІВ ---
// // Оскільки сесій більше немає, нам потрібно десь зберігати дані користувачів.
// // Для простоти, будемо зберігати їх у пам'яті сервера.
// // УВАГА: При перезапуску сервера ці дані будуть втрачені. Для реального проєкту потрібна база даних.
// const userStore = new Map();

// const ITEMS_DB = {
//     'item_durovs_cap': { name: "Durov's Cap Dipper", rarity: 'legendary', image: 'https://placehold.co/128x128/00BFFF/ffffff?text=Cap' },
//     'item_vintage_cigar': { name: 'Vintage Cigar The Gentleman', rarity: 'legendary', image: 'https://placehold.co/128x128/8B4513/ffffff?text=Cigar' },
//     'item_record_player': { name: 'Record Player Emocore', rarity: 'epic', image: 'https://placehold.co/128x128/8A2BE2/ffffff?text=Player' },
//     'item_diamond_ring': { name: 'Diamond Ring Nocturne', rarity: 'epic', image: 'https://placehold.co/128x128/B9F2FF/000000?text=Ring' },
//     'item_jester_hat': { name: 'Jester Hat Hellscape', rarity: 'rare', image: 'https://placehold.co/128x128/DC143C/ffffff?text=Hat' },
//     'item_sakura_flower': { name: 'Sakura Flower Snowdrop', rarity: 'rare', image: 'https://placehold.co/128x128/FFC0CB/000000?text=Sakura' },
//     'item_easter_egg': { name: 'Easter Egg Boiled Pepe', rarity: 'rare', image: 'https://placehold.co/128x128/32CD32/ffffff?text=Pepe' },
//     'item_swag_bag': { name: 'Swag Bag Choco Kush', rarity: 'common', image: 'https://placehold.co/128x128/D2691E/ffffff?text=Swag' },
//     'item_snoop_dogg': { name: 'Snoop Dogg Backspin', rarity: 'common', image: 'https://placehold.co/128x128/696969/ffffff?text=Snoop' },
//     'item_diamond': { name: 'Diamond', rarity: 'common', image: 'https://placehold.co/128x128/AFEEEE/000000?text=Diamond' },
//     'item_rocket': { name: 'Rocket', rarity: 'common', image: 'https://placehold.co/128x128/FF4500/ffffff?text=Rocket' }
// };
// const CASES_DB = {
//     'gift_case_1': { id: 'gift_case_1', name: 'Подарунковий кейс', price: 150, loot: [ { itemId: 'item_rocket', chance: 25 }, { itemId: 'item_diamond', chance: 20 }, { itemId: 'item_snoop_dogg', chance: 15 }, { itemId: 'item_swag_bag', chance: 15 }, { itemId: 'item_easter_egg', chance: 10 }, { itemId: 'item_sakura_flower', chance: 7 }, { itemId: 'item_jester_hat', chance: 5 }, { itemId: 'item_diamond_ring', chance: 2 }, { itemId: 'item_record_player', chance: 0.9 }, { itemId: 'item_vintage_cigar', chance: 0.09 }, { itemId: 'item_durovs_cap', chance: 0.01 } ] }
// };

// // 3. Налаштовуємо middleware
// app.use(express.json());
// const allowedOrigins = [ 'https://nft-case-battle.vercel.app', 'http://localhost:5174', 'http://localhost:5173' ];
// app.use(cors({ origin: allowedOrigins }));


// // --- АВТЕНТИФІКАЦІЯ НА JWT ---

// // Middleware для перевірки токену
// function authenticateToken(req, res, next) {
//     const authHeader = req.headers['authorization'];
//     const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

//     if (token == null) {
//         return res.sendStatus(401); // Немає токену
//     }

//     jwt.verify(token, process.env.JWT_SECRET, (err, userPayload) => {
//         if (err) {
//             console.log('JWT verification error:', err.message);
//             return res.sendStatus(403); // Невалідний токен
//         }
//         // Знаходимо повні дані користувача в нашому сховищі
//         const fullUser = userStore.get(userPayload.id);
//         if (!fullUser) {
//             return res.sendStatus(401); // Користувача немає в системі
//         }
//         req.user = fullUser; // Додаємо дані користувача до запиту
//         next();
//     });
// }


// // --- МАРШРУТИ API ---

// // Маршрут для логіну через Telegram
// app.post('/api/auth/telegram', (req, res) => {
//     const userData = req.body;
//     if (!checkTelegramAuth(userData)) {
//         return res.status(403).json({ message: 'Authentication failed: Invalid hash' });
//     }
    
//     // Створюємо або оновлюємо користувача в нашому сховищі
//     const userProfile = {
//         id: userData.id,
//         firstName: userData.first_name,
//         lastName: userData.last_name || null,
//         username: userData.username || null,
//         photoUrl: userData.photo_url || null,
//         balance: userStore.has(userData.id) ? userStore.get(userData.id).balance : 1000, // Зберігаємо баланс, якщо користувач вже є
//         inventory: userStore.has(userData.id) ? userStore.get(userData.id).inventory : []
//     };
//     userStore.set(userData.id, userProfile);

//     // Створюємо JWT токен, який містить тільки ID користувача
//     const accessToken = jwt.sign({ id: userProfile.id }, process.env.JWT_SECRET, { expiresIn: '1d' });

//     console.log(`[AUTH SUCCESS] Token created for user: ${userData.id}`);
//     res.json({ accessToken: accessToken, user: userProfile });
// });

// // Маршрут для перевірки статусу логіну та отримання профілю
// app.get('/api/profile', authenticateToken, (req, res) => {
//     console.log(`[PROFILE SUCCESS] Profile requested for user: ${req.user.id}`);
//     res.status(200).json({ loggedIn: true, user: req.user });
// });

// // Маршрут для відкриття кейсу
// app.post('/api/case/open', authenticateToken, (req, res) => {
//     const { caseId } = req.body;
//     const caseToOpen = CASES_DB[caseId];
//     const user = req.user;

//     if (!caseToOpen) return res.status(404).json({ message: 'Такого кейсу не існує.' });
//     if (user.balance < caseToOpen.price) return res.status(403).json({ message: 'Недостатньо коштів на балансі.' });
    
//     user.balance -= caseToOpen.price;

//     const totalChance = caseToOpen.loot.reduce((sum, item) => sum + item.chance, 0);
//     let randomPoint = Math.random() * totalChance;
//     let wonItemInfo = null;
//     for (const lootItem of caseToOpen.loot) {
//         randomPoint -= lootItem.chance;
//         if (randomPoint <= 0) { wonItemInfo = lootItem; break; }
//     }
//     const wonItem = ITEMS_DB[wonItemInfo.itemId];
//     user.inventory.push(wonItem);
    
//     userStore.set(user.id, user);

//     res.status(200).json({ message: 'Кейс успішно відкрито!', wonItem: wonItem, newBalance: user.balance });
// });

// // Маршрут для отримання інвентаря
// app.get('/api/inventory', authenticateToken, (req, res) => {
//     res.status(200).json({ inventory: req.user.inventory });
// });

// // --- ДОПОМІЖНІ ФУНКЦІЇ ---
// function checkTelegramAuth(data) {
//     const botToken = process.env.TELEGRAM_BOT_TOKEN;
//     if (!botToken) { console.error("!!! TELEGRAM_BOT_TOKEN is not defined!"); return false; }
//     const secretKey = crypto.createHash('sha256').update(botToken).digest();
//     const checkString = Object.keys(data).filter(key => key !== 'hash').sort().map(key => (`${key}=${data[key]}`)).join('\n');
//     const hmac = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex');
//     return hmac === data.hash;
// }
// function checkTelegramAuth(data) {
//     const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
//     if (!botToken) { 
//         console.error("!!! TELEGRAM_BOT_TOKEN is not defined!"); 
//         return false; 
//     }

//     const secretKey = crypto.createHash('sha256').update(botToken).digest();
//     const checkString = Object.keys(data)
//         .filter(key => key !== 'hash')
//         .sort()
//         .map(key => `${key}=${data[key]}`) // усі значення перетворюються у рядки
//         .join('\n');

//     const hmac = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex');

//     console.log("=== BACKEND DEBUG ===");
//     console.log("Check string:\n", checkString);
//     console.log("Computed hash:", hmac);
//     console.log("User hash:", data.hash);

//     return hmac === data.hash;
// }

// // --- ЗАПУСК СЕРВЕРА ---
// app.listen(PORT, () => {
//     console.log(`✅ Server is running on port ${PORT}`);
// });

// require('dotenv').config();
// const express = require('express');
// const jwt = require('jsonwebtoken');
// const crypto = require('crypto');
// const cors = require('cors');

// // === 1. Ініціалізація Express ===
// const app = express();
// const PORT = process.env.PORT || 3001;

// // === 2. "Імітація" бази користувачів і предметів ===
// const userStore = new Map();

// const ITEMS_DB = {
//     'item_durovs_cap': { name: "Durov's Cap Dipper", rarity: 'legendary', image: 'https://placehold.co/128x128/00BFFF/ffffff?text=Cap' },
//     'item_vintage_cigar': { name: 'Vintage Cigar The Gentleman', rarity: 'legendary', image: 'https://placehold.co/128x128/8B4513/ffffff?text=Cigar' },
//     'item_record_player': { name: 'Record Player Emocore', rarity: 'epic', image: 'https://placehold.co/128x128/8A2BE2/ffffff?text=Player' },
//     'item_diamond_ring': { name: 'Diamond Ring Nocturne', rarity: 'epic', image: 'https://placehold.co/128x128/B9F2FF/000000?text=Ring' },
//     'item_jester_hat': { name: 'Jester Hat Hellscape', rarity: 'rare', image: 'https://placehold.co/128x128/DC143C/ffffff?text=Hat' },
//     'item_sakura_flower': { name: 'Sakura Flower Snowdrop', rarity: 'rare', image: 'https://placehold.co/128x128/FFC0CB/000000?text=Sakura' },
//     'item_easter_egg': { name: 'Easter Egg Boiled Pepe', rarity: 'rare', image: 'https://placehold.co/128x128/32CD32/ffffff?text=Pepe' },
//     'item_swag_bag': { name: 'Swag Bag Choco Kush', rarity: 'common', image: 'https://placehold.co/128x128/D2691E/ffffff?text=Swag' },
//     'item_snoop_dogg': { name: 'Snoop Dogg Backspin', rarity: 'common', image: 'https://placehold.co/128x128/696969/ffffff?text=Snoop' },
//     'item_diamond': { name: 'Diamond', rarity: 'common', image: 'https://placehold.co/128x128/AFEEEE/000000?text=Diamond' },
//     'item_rocket': { name: 'Rocket', rarity: 'common', image: 'https://placehold.co/128x128/FF4500/ffffff?text=Rocket' }
// };

// const CASES_DB = {
//     'gift_case_1': {
//         id: 'gift_case_1',
//         name: 'Подарунковий кейс',
//         price: 150,
//         loot: [
//             { itemId: 'item_rocket', chance: 25 },
//             { itemId: 'item_diamond', chance: 20 },
//             { itemId: 'item_snoop_dogg', chance: 15 },
//             { itemId: 'item_swag_bag', chance: 15 },
//             { itemId: 'item_easter_egg', chance: 10 },
//             { itemId: 'item_sakura_flower', chance: 7 },
//             { itemId: 'item_jester_hat', chance: 5 },
//             { itemId: 'item_diamond_ring', chance: 2 },
//             { itemId: 'item_record_player', chance: 0.9 },
//             { itemId: 'item_vintage_cigar', chance: 0.09 },
//             { itemId: 'item_durovs_cap', chance: 0.01 }
//         ]
//     }
// };

// // === 3. Middleware ===
// app.use(express.json());
// const allowedOrigins = [
//     'https://nft-case-battle.vercel.app',
//     'http://localhost:5173',
//     'http://localhost:5174'
// ];
// app.use(cors({ origin: allowedOrigins }));

// // === 4. JWT Middleware ===
// function authenticateToken(req, res, next) {
//     const authHeader = req.headers['authorization'];
//     const token = authHeader && authHeader.split(' ')[1];

//     if (!token) return res.sendStatus(401);

//     jwt.verify(token, process.env.JWT_SECRET, (err, userPayload) => {
//         if (err) return res.sendStatus(403);

//         const fullUser = userStore.get(userPayload.id);
//         if (!fullUser) return res.sendStatus(401);

//         req.user = fullUser;
//         next();
//     });
// }

// // === 5. Telegram OAuth Login Widget (як у Gifts Battle) ===
// app.post('/api/auth/telegram', (req, res) => {
//     const userData = req.body;
//     if (!checkTelegramAuth(userData)) {
//         return res.status(403).json({ message: 'Authentication failed: Invalid hash' });
//     }
    
//     // Створюємо або оновлюємо користувача в нашому сховищі
//     const userProfile = {
//         id: userData.id,
//         firstName: userData.first_name,
//         lastName: userData.last_name || null,
//         username: userData.username || null,
//         photoUrl: userData.photo_url || null,
//         balance: userStore.has(userData.id) ? userStore.get(userData.id).balance : 1000, // Зберігаємо баланс, якщо користувач вже є
//         inventory: userStore.has(userData.id) ? userStore.get(userData.id).inventory : []
//     };
//     userStore.set(userData.id, userProfile);

//     // Створюємо JWT токен, який містить тільки ID користувача
//     const accessToken = jwt.sign({ id: userProfile.id }, process.env.JWT_SECRET, { expiresIn: '1d' });

//     console.log(`[AUTH SUCCESS] Token created for user: ${userData.id}`);
//     res.json({ accessToken: accessToken, user: userProfile });
// });

// // === 6. Профіль ===
// app.get('/api/profile', authenticateToken, (req, res) => {
//     res.status(200).json({ loggedIn: true, user: req.user });
// });

// // === 7. Відкриття кейсу ===
// app.post('/api/case/open', authenticateToken, (req, res) => {
//     const { caseId } = req.body;
//     const caseToOpen = CASES_DB[caseId];
//     const user = req.user;

//     if (!caseToOpen) return res.status(404).json({ message: 'Такого кейсу не існує.' });
//     if (user.balance < caseToOpen.price) return res.status(403).json({ message: 'Недостатньо коштів на балансі.' });

//     user.balance -= caseToOpen.price;

//     const totalChance = caseToOpen.loot.reduce((sum, item) => sum + item.chance, 0);
//     let randomPoint = Math.random() * totalChance;
//     let wonItemInfo = null;

//     for (const lootItem of caseToOpen.loot) {
//         randomPoint -= lootItem.chance;
//         if (randomPoint <= 0) {
//             wonItemInfo = lootItem;
//             break;
//         }
//     }

//     const wonItem = ITEMS_DB[wonItemInfo.itemId];
//     user.inventory.push(wonItem);
//     userStore.set(user.id, user);

//     res.status(200).json({
//         message: 'Кейс успішно відкрито!',
//         wonItem,
//         newBalance: user.balance
//     });
// });

// // === 8. Інвентар ===
// app.get('/api/inventory', authenticateToken, (req, res) => {
//     res.status(200).json({ inventory: req.user.inventory });
// });

// // === 9. Перевірка Telegram hash ===
// function checkTelegramAuth(data) {
//     const botToken = process.env.TELEGRAM_BOT_TOKEN;
//     if (!botToken) {
//         console.error("❌ TELEGRAM_BOT_TOKEN is not defined!");
//         return false;
//     }

//     const secretKey = crypto.createHash('sha256').update(botToken).digest();
//     const checkString = Object.keys(data)
//         .filter(key => key !== 'hash')
//         .sort()
//         .map(key => `${key}=${data[key]}`)
//         .join('\n');
//     const hmac = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex');

//     return hmac === data.hash;
// }

// // === 10. Запуск сервера ===
// app.listen(PORT, () => {
//     console.log(`✅ Server is running on port ${PORT}`);
// });

// 1. Імпортуємо необхідні бібліотеки
// 1. Імпортуємо необхідні бібліотеки
// 1. Імпортуємо необхідні бібліотеки
require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const cors = require('cors');

// 2. Створюємо додаток Express
const app = express();
const PORT = process.env.PORT || 3001;

// --- ІМІТАЦІЯ БАЗИ ДАНИХ ---
const userStore = new Map();
const ITEMS_DB = { 'item_durovs_cap': { name: "Durov's Cap Dipper", rarity: 'legendary' } };
const CASES_DB = { 'gift_case_1': { id: 'gift_case_1', name: 'Подарунковий кейс', price: 150, loot: [ { itemId: 'item_durovs_cap', chance: 100 } ] } };

// 3. Налаштовуємо middleware
app.use(express.json());
const allowedOrigins = [ 'https://nft-case-battle.vercel.app', 'http://localhost:5174', 'http://localhost:5173' ];
app.use(cors({ origin: allowedOrigins }));

// Middleware для перевірки JWT
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);
    jwt.verify(token, process.env.JWT_SECRET, (err, userPayload) => {
        if (err) return res.sendStatus(403);
        const fullUser = userStore.get(userPayload.id);
        if (!fullUser) return res.sendStatus(401);
        req.user = fullUser;
        next();
    });
}

// --- ФУНКЦІЯ ПЕРЕВІРКИ З ДІАГНОСТИКОЮ ---
function checkWebAppAuth(initData) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
        console.error("!!! TELEGRAM_BOT_TOKEN is not defined!");
        return false;
    }
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    params.delete('hash');
    const dataCheckArr = [];
    for (const [key, value] of params.entries()) {
        dataCheckArr.push(`${key}=${value}`);
    }
    dataCheckArr.sort();
    const dataCheckString = dataCheckArr.join('\n');
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    const hmac = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    // --- ДІАГНОСТИЧНИЙ БЛОК ---
    console.log('\n--- [WEB APP AUTH CHECK] ---');
    console.log('Data string for hash generation:\n---');
    console.log(dataCheckString);
    console.log('---\nReceived Hash:', hash);
    console.log('Computed Hash:', hmac);
    console.log('Are hashes identical? --->', hmac === hash);
    console.log('----------------------------\n');

    return hmac === hash;
}

// --- МАРШРУТИ API ---
app.post('/api/auth/webapp', (req, res) => {
    const { initData } = req.body;
    if (!initData || !checkWebAppAuth(initData)) {
        return res.status(403).json({ message: 'Authentication failed: Invalid data' });
    }
    const params = new URLSearchParams(initData);
    const userData = JSON.parse(params.get('user'));
    const userProfile = { id: userData.id, firstName: userData.first_name, lastName: userData.last_name || null, username: userData.username || null, balance: userStore.has(userData.id) ? userStore.get(userData.id).balance : 1000, inventory: userStore.has(userData.id) ? userStore.get(userData.id).inventory : [] };
    userStore.set(userData.id, userProfile);
    const accessToken = jwt.sign({ id: userProfile.id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ accessToken: accessToken, user: userProfile });
});

app.get('/api/profile', authenticateToken, (req, res) => {
    res.status(200).json({ loggedIn: true, user: req.user });
});

app.post('/api/case/open', authenticateToken, (req, res) => {
    const { caseId } = req.body;
    const caseToOpen = CASES_DB[caseId];
    const user = req.user;
    if (!caseToOpen) return res.status(404).json({ message: 'Такого кейсу не існує.' });
    if (user.balance < caseToOpen.price) return res.status(403).json({ message: 'Недостатньо коштів на балансі.' });
    user.balance -= caseToOpen.price;
    const wonItem = ITEMS_DB[caseToOpen.loot[0].itemId];
    user.inventory.push(wonItem);
    userStore.set(user.id, user);
    res.status(200).json({ message: 'Кейс успішно відкрито!', wonItem: wonItem, newBalance: user.balance });
});

// --- ЗАПУСК СЕРВЕРА ---
app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
});




