// 1. Імпортуємо необхідні бібліотеки
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const FileStore = require('session-file-store')(session); // Додано для файлового сховища
const crypto = require('crypto');
const cors = require('cors');
const path = require('path');

// 2. Створюємо додаток Express
const app = express();
const PORT = process.env.PORT || 3001;

// --- ІМІТАЦІЯ БАЗИ ДАНИХ ---
const ITEMS_DB = {
    'item_durovs_cap': { name: "Durov's Cap Dipper", rarity: 'legendary', image: 'https://placehold.co/128x128/00BFFF/ffffff?text=Cap' },
    'item_vintage_cigar': { name: 'Vintage Cigar The Gentleman', rarity: 'legendary', image: 'https://placehold.co/128x128/8B4513/ffffff?text=Cigar' },
    'item_record_player': { name: 'Record Player Emocore', rarity: 'epic', image: 'https://placehold.co/128x128/8A2BE2/ffffff?text=Player' },
    'item_diamond_ring': { name: 'Diamond Ring Nocturne', rarity: 'epic', image: 'https://placehold.co/128x128/B9F2FF/000000?text=Ring' },
    'item_jester_hat': { name: 'Jester Hat Hellscape', rarity: 'rare', image: 'https://placehold.co/128x128/DC143C/ffffff?text=Hat' },
    'item_sakura_flower': { name: 'Sakura Flower Snowdrop', rarity: 'rare', image: 'https://placehold.co/128x128/FFC0CB/000000?text=Sakura' },
    'item_easter_egg': { name: 'Easter Egg Boiled Pepe', rarity: 'rare', image: 'https://placehold.co/128x128/32CD32/ffffff?text=Pepe' },
    'item_swag_bag': { name: 'Swag Bag Choco Kush', rarity: 'common', image: 'https://placehold.co/128x128/D2691E/ffffff?text=Swag' },
    'item_snoop_dogg': { name: 'Snoop Dogg Backspin', rarity: 'common', image: 'https://placehold.co/128x128/696969/ffffff?text=Snoop' },
    'item_diamond': { name: 'Diamond', rarity: 'common', image: 'https://placehold.co/128x128/AFEEEE/000000?text=Diamond' },
    'item_rocket': { name: 'Rocket', rarity: 'common', image: 'https://placehold.co/128x128/FF4500/ffffff?text=Rocket' }
};
const CASES_DB = {
    'gift_case_1': { id: 'gift_case_1', name: 'Подарунковий кейс', price: 150, loot: [ { itemId: 'item_rocket', chance: 25 }, { itemId: 'item_diamond', chance: 20 }, { itemId: 'item_snoop_dogg', chance: 15 }, { itemId: 'item_swag_bag', chance: 15 }, { itemId: 'item_easter_egg', chance: 10 }, { itemId: 'item_sakura_flower', chance: 7 }, { itemId: 'item_jester_hat', chance: 5 }, { itemId: 'item_diamond_ring', chance: 2 }, { itemId: 'item_record_player', chance: 0.9 }, { itemId: 'item_vintage_cigar', chance: 0.09 }, { itemId: 'item_durovs_cap', chance: 0.01 } ] }
};

// 3. Налаштовуємо middleware
app.set('trust proxy', 1); // Довіряти проксі (критично для Render)
app.use(express.json());

const allowedOrigins = [ 'https://nft-case-battle.vercel.app', 'http://localhost:5174', 'http://localhost:5173', 'http://localhost:3000' ];
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));

// --- ФІНАЛЬНА КОНФІГУРАЦІЯ СЕСІЇ ---
const fileStoreOptions = {
    path: path.join(__dirname, '/sessions'),
    logFn: function() {},
    reapInterval: 86400 
};

app.use(session({
    store: new FileStore(fileStoreOptions),
    name: 'casebattle.sid', // Явно задаємо ім'я cookie для кращого контролю
    secret: process.env.SESSION_SECRET || 'a_very_strong_secret_key_for_sessions_12345',
    resave: false,
    saveUninitialized: false, 
    cookie: {
        secure: true,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 години
        sameSite: 'none',
    }
}));


// --- МАРШРУТИ API З РОЗШИРЕНИМ ЛОГУВАННЯМ ---

// Маршрут для логіну через Telegram
app.post('/api/auth/telegram', (req, res) => {
    const userData = req.body;
    if (!checkTelegramAuth(userData)) {
        return res.status(403).json({ message: 'Authentication failed: Invalid hash' });
    }
    
    req.session.user = {
        id: userData.id,
        firstName: userData.first_name,
        lastName: userData.last_name || null,
        username: userData.username || null,
        photoUrl: userData.photo_url || null,
        balance: 1000,
        inventory: []
    };
    
    req.session.save(err => {
        if (err) {
            console.error('[AUTH ERROR] Session save error:', err);
            return res.status(500).json({ message: 'Could not save session.' });
        }
        console.log(`[AUTH SUCCESS] Session created for user: ${userData.id}. Session ID: ${req.sessionID}`);
        res.status(200).json({ message: 'Login successful', user: req.session.user });
    });
});

// Маршрут для перевірки статусу логіну та отримання профілю
app.get('/api/profile', (req, res) => {
    console.log('--- Profile Request Received ---');
    console.log('Session ID from request cookie:', req.sessionID);
    console.log('Session object hydrated by store:', req.session);
    
    if (req.session && req.session.user) {
        console.log(`[PROFILE SUCCESS] User: ${req.session.user.id}. Session found.`);
        res.status(200).json({ loggedIn: true, user: req.session.user });
    } else {
        console.log('[PROFILE FAIL] No session user found.');
        res.status(401).json({ loggedIn: false, message: 'You are not logged in' });
    }
});

// Маршрут для виходу (додатково, корисно для тестування)
app.post('/api/auth/logout', (req, res) => {
    const userId = req.session.user ? req.session.user.id : 'Unknown';
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: 'Could not log out.' });
        }
        res.clearCookie('casebattle.sid'); 
        console.log(`[LOGOUT] Session destroyed for user: ${userId}`);
        res.status(200).json({ message: 'Logout successful' });
    });
});

// Інші ваші маршрути...
app.post('/api/case/open', (req, res) => {
    if (!req.session.user) return res.status(401).json({ message: 'Будь ласка, увійдіть, щоб відкрити кейс.' });
    const { caseId } = req.body;
    const caseToOpen = CASES_DB[caseId];
    if (!caseToOpen) return res.status(404).json({ message: 'Такого кейсу не існує.' });
    if (req.session.user.balance < caseToOpen.price) return res.status(403).json({ message: 'Недостатньо коштів на балансі.' });
    
    req.session.user.balance -= caseToOpen.price;
    const totalChance = caseToOpen.loot.reduce((sum, item) => sum + item.chance, 0);
    let randomPoint = Math.random() * totalChance;
    let wonItemInfo = null;
    for (const lootItem of caseToOpen.loot) {
        randomPoint -= lootItem.chance;
        if (randomPoint <= 0) { wonItemInfo = lootItem; break; }
    }
    const wonItem = ITEMS_DB[wonItemInfo.itemId];
    req.session.user.inventory.push(wonItem);

    req.session.save(() => { // Зберігаємо сесію після змін
        res.status(200).json({ message: 'Кейс успішно відкрито!', wonItem: wonItem, newBalance: req.session.user.balance });
    });
});
app.get('/api/inventory', (req, res) => {
    if (!req.session.user) return res.status(401).json({ message: 'Будь ласка, увійдіть, щоб переглянути інвентар.' });
    res.status(200).json({ inventory: req.session.user.inventory });
});

// --- ДОПОМІЖНІ ФУНКЦІЇ ---
function checkTelegramAuth(data) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) { console.error("!!! TELEGRAM_BOT_TOKEN is not defined!"); return false; }
    const secretKey = crypto.createHash('sha256').update(botToken).digest();
    const checkString = Object.keys(data).filter(key => key !== 'hash').sort().map(key => (`${key}=${data[key]}`)).join('\n');
    const hmac = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex');
    return hmac === data.hash;
}

// --- ЗАПУСК СЕРВЕРА ---
app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
});