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
  
  // Ключовий крок: Перевірка автентичності даних від Telegram
  if (!checkTelegramAuth(userData)) {
    return res.status(403).json({ message: 'Authentication failed: Invalid hash' });
  }

  // Якщо перевірка успішна, зберігаємо дані користувача в сесію
  req.session.user = {
    id: userData.id,
    firstName: userData.first_name,
    username: userData.username,
    photoUrl: userData.photo_url
  };

  console.log('User logged in successfully:', req.session.user);
  
  // Відправляємо успішну відповідь
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