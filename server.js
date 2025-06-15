const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const DATA_FILE = 'leaderboard.json';

// Загрузка данных
function loadData() {
    if (!fs.existsSync(DATA_FILE)) return { users: [] };
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

// Сохранение данных
function saveData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Регистрация ника
app.post('/register', (req, res) => {
    const { nickname } = req.body;
    if (!nickname || typeof nickname !== 'string' || nickname.length < 3) {
        return res.status(400).json({ error: 'Invalid nickname' });
    }
    const data = loadData();
    if (data.users.find(u => u.nickname.toLowerCase() === nickname.toLowerCase())) {
        return res.status(409).json({ error: 'Nickname already taken' });
    }
    data.users.push({ nickname, score: 0 });
    saveData(data);
    res.json({ success: true });
});

// Отправка результата
app.post('/score', (req, res) => {
    const { nickname, score } = req.body;
    if (!nickname || typeof score !== 'number') {
        return res.status(400).json({ error: 'Invalid data' });
    }
    const data = loadData();
    const user = data.users.find(u => u.nickname === nickname);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (score > user.score) user.score = score;
    saveData(data);
    res.json({ success: true });
});

// Получение топа
app.get('/leaderboard', (req, res) => {
    const data = loadData();
    const top = data.users
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
    res.json(top);
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
