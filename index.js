// 1. Імпортуємо необхідні бібліотеки
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const crypto = require('crypto');
const cors = require('cors');

// 2. Створюємо додаток Express
const app = express();
const PORT = process.env.PORT || 3001;

// --- ІМІТАЦІЯ БАЗИ ДАНИХ (оновлено з NFT-подарунками) ---
// ... (Ваша база даних предметів і кейсів залишається без змін) ...
const ITEMS_DB = {
    // Легендарні (дуже рідкісні)
    'item_durovs_cap': { name: "Durov's Cap Dipper", rarity: 'legendary', image: 'https://placehold.co/128x128/00BFFF/ffffff?text=Cap' },
    'item_vintage_cigar': { name: 'Vintage Cigar The Gentleman', rarity: 'legendary', image: 'https://placehold.co/128x128/8B4513/ffffff?text=Cigar' },
    
    // Епічні (рідкісні)
    'item_record_player': { name: 'Record Player Emocore', rarity: 'epic', image: 'https://placehold.co/128x128/8A2BE2/ffffff?text=Player' },
    'item_diamond_ring': { name: 'Diamond Ring Nocturne', rarity: 'epic', image: 'https://placehold.co/128x128/B9F2FF/000000?text=Ring' },

    // Рідкісні
    'item_jester_hat': { name: 'Jester Hat Hellscape', rarity: 'rare', image: 'https://placehold.co/128x128/DC143C/ffffff?text=Hat' },
    'item_sakura_flower': { name: 'Sakura Flower Snowdrop', rarity: 'rare', image: 'https://placehold.co/128x128/FFC0CB/000000?text=Sakura' },
    'item_easter_egg': { name: 'Easter Egg Boiled Pepe', rarity: 'rare', image: 'https://placehold.co/128x128/32CD32/ffffff?text=Pepe' },

    // Звичайні (часті)
    'item_swag_bag': { name: 'Swag Bag Choco Kush', rarity: 'common', image: 'https://placehold.co/128x128/D2691E/ffffff?text=Swag' },
    'item_snoop_dogg': { name: 'Snoop Dogg Backspin', rarity: 'common', image: 'https://placehold.co/128x128/696969/ffffff?text=Snoop' },
    'item_diamond': { name: 'Diamond', rarity: 'common', image: 'https://placehold.co/128x128/AFEEEE/000000?text=Diamond' },
    'item_rocket': { name: 'Rocket', rarity: 'common', image: 'https://placehold.co/128x128/FF4500/ffffff?text=Rocket' }
};

const CASES_DB = {
    'gift_case_1': {
        id: 'gift_case_1',
        name: 'Подарунковий кейс',
        price: 150, // Змінив ціну для балансу
        loot: [
            // Звичайні (великий шанс)
            { itemId: 'item_rocket', chance: 25 },
            { itemId: 'item_diamond', chance: 20 },
            { itemId: 'item_snoop_dogg', chance: 15 },
            { itemId: 'item_swag_bag', chance: 15 },
            // Рідкісні (середній шанс)
            { itemId: 'item_easter_egg', chance: 10 },
            { itemId: 'item_sakura_flower', chance: 7 },
            { itemId: 'item_jester_hat', chance: 5 },
            // Епічні (малий шанс)
            { itemId: 'item_diamond_ring', chance: 2 },
            { itemId: 'item_record_player', chance: 0.9 },
            // Легендарні (дуже малий шанс)
            { itemId: 'item_vintage_cigar', chance: 0.09 },
            { itemId: 'item_durovs_cap', chance: 0.01 }
        ]
    }
};

// 3. Налаштовуємо middleware
app.use(express.json());

// --- ВАЖЛИВЕ ВИПРАВЛЕННЯ ---
// Це налаштування змушує Express довіряти заголовкам, які надсилає проксі-сервер Render,
// що необхідно для коректної роботи `secure: true` cookies.
app.set('trust proxy', 1);

// Список доменів, яким дозволено робити запити до вашого бекенду
const allowedOrigins = [
    'https://nft-case-battle.vercel.app',
    'http://localhost:5174',
    'http://localhost:5173',
    'http://localhost:3000',
    'null'
];
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));
app.use(session({
    secret: process.env.SESSION_SECRET || 'a_very_strong_secret_key_for_sessions',
    resave: false,
    saveUninitialized: true,
    proxy: true,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    }
}));


// --- МАРШРУТИ API ---

// ... (Ваші маршрути /api/auth/telegram, /api/profile і т.д. залишаються без змін) ...
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
    res.status(200).json({ message: 'Login successful', user: req.session.user });
});

// Маршрут для перевірки статусу логіну та отримання профілю
app.get('/api/profile', (req, res) => {
    if (req.session.user) {
        res.status(200).json({ loggedIn: true, user: req.session.user });
    } else {
        res.status(401).json({ loggedIn: false, message: 'You are not logged in' });
    }
});

// Маршрут для відкриття кейсу
app.post('/api/case/open', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Будь ласка, увійдіть, щоб відкрити кейс.' });
    }

    const { caseId } = req.body;
    const caseToOpen = CASES_DB[caseId];

    if (!caseToOpen) {
        return res.status(404).json({ message: 'Такого кейсу не існує.' });
    }

    if (req.session.user.balance < caseToOpen.price) {
        return res.status(403).json({ message: 'Недостатньо коштів на балансі.' });
    }

    req.session.user.balance -= caseToOpen.price;

    const totalChance = caseToOpen.loot.reduce((sum, item) => sum + item.chance, 0);
    let randomPoint = Math.random() * totalChance;
    
    let wonItemInfo = null;
    for (const lootItem of caseToOpen.loot) {
        randomPoint -= lootItem.chance;
        if (randomPoint <= 0) {
            wonItemInfo = lootItem;
            break;
        }
    }
    
    const wonItem = ITEMS_DB[wonItemInfo.itemId];
    req.session.user.inventory.push(wonItem);

    res.status(200).json({
        message: 'Кейс успішно відкрито!',
        wonItem: wonItem,
        newBalance: req.session.user.balance
    });
});

// Маршрут для отримання інвентаря
app.get('/api/inventory', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Будь ласка, увійдіть, щоб переглянути інвентар.' });
    }
    res.status(200).json({ inventory: req.session.user.inventory });
});


// Функція для перевірки хешу
function checkTelegramAuth(data) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
        console.error("!!! TELEGRAM_BOT_TOKEN is not defined in environment variables!");
        return false;
    }
    const secretKey = crypto.createHash('sha256').update(botToken).digest();
    const checkString = Object.keys(data)
        .filter(key => key !== 'hash')
        .sort()
        .map(key => (`${key}=${data[key]}`))
        .join('\n');
    const hmac = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex');
    return hmac === data.hash;
}

// Запускаємо сервер
app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
});