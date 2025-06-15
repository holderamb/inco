const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Хранение данных в памяти (данные сбросятся при перезапуске сервера)
let data = { users: [] };

// Регистрация ника
app.post('/register', (req, res) => {
    const { nickname } = req.body;
    if (!nickname || typeof nickname !== 'string' || nickname.length < 3) {
        return res.status(400).json({ error: 'Invalid nickname' });
    }
    if (data.users.find(u => u.nickname.toLowerCase() === nickname.toLowerCase())) {
        return res.status(409).json({ error: 'Nickname already taken' });
    }
    data.users.push({ nickname, score: 0 });
    res.json({ success: true });
});

// Отправка результата
app.post('/score', (req, res) => {
    const { nickname, score } = req.body;
    if (!nickname || (typeof score !== 'number' && typeof score !== 'string')) {
        return res.status(400).json({ error: 'Invalid data' });
    }
    const user = data.users.find(u => u.nickname === nickname);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const numericScore = typeof score === 'string' ? parseInt(score, 10) : score;
    if (numericScore > user.score) user.score = numericScore;
    res.json({ success: true });
});

// Получение топа
app.get('/leaderboard', (req, res) => {
    const top = data.users
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
    res.json(top);
});

// Для проверки работоспособности сервера
app.get('/', (req, res) => {
    res.send('Leaderboard API is running!');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
