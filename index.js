// 1. Імпортуємо необхідні бібліотеки
require('dotenv').config(); // Для завантаження змінних з .env файлу
const express = require('express');
const session = require('express-session');
const crypto = require('crypto');

// 2. Створюємо додаток Express
const app = express();
const PORT = process.env.PORT || 3001; // Порт, на якому буде працювати сервер

// 3. Налаштовуємо middleware (проміжне ПЗ)
app.use(express.json()); // Дозволяє серверу читати JSON з тіла запиту

// Налаштування сесій
app.use(session({
  secret: 'a_very_strong_secret_key_for_sessions', // Секретний ключ для підпису сесій
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // В продакшені кукі мають передаватись тільки через HTTPS
    maxAge: 24 * 60 * 60 * 1000 // Час життя сесії (тут - 24 години)
  }
}));

// 4. Створюємо головний маршрут (endpoint) для логіну
app.post('/api/auth/telegram', (req, res) => {
  const userData = req.body;
  
  // Цей console.log допоможе побачити, що саме приходить від бота
  console.log('Received data on backend:', JSON.stringify(userData, null, 2));

  // Тепер ця перевірка має проходити успішно!
  if (!checkTelegramAuth(userData)) {
    return res.status(403).json({ message: 'Authentication failed: Invalid hash' });
  }

  // Створюємо сесію з правильними полями
  req.session.user = {
    id: userData.id,
    firstName: userData.first_name,
    lastName: userData.last_name || null,
    username: userData.username || null,
    photoUrl: userData.photo_url || null
  };
  // Ми не зберігаємо токен в сесії, бо він потрібен тільки для фронтенду

  console.log('User session created successfully:', req.session.user);
  
  res.status(200).json({ message: 'Login successful', user: req.session.user });
});

// 5. Додатковий маршрут для перевірки статусу логіну
app.get('/api/profile', (req, res) => {
  if (req.session.user) {
    // Якщо користувач є в сесії, повертаємо його дані
    res.status(200).json({ loggedIn: true, user: req.session.user });
  } else {
    // Якщо користувача в сесії немає
    res.status(401).json({ loggedIn: false, message: 'You are not logged in' });
  }
});

// Функція для перевірки хешу, який надсилає Telegram
function checkTelegramAuth(data) {
  const secretKey = crypto.createHash('sha256').update(process.env.TELEGRAM_BOT_TOKEN).digest();
  
  const checkString = Object.keys(data)
    .filter(key => key !== 'hash')
    .sort()
    .map(key => (`${key}=${data[key]}`))
    .join('\n');

  const hmac = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex');

  return hmac === data.hash;
}

// 6. Запускаємо сервер
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});