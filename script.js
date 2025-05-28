// --- DOM Элементы ---
const mainMenuScreen = document.getElementById('mainMenu');
const shopScreen = document.getElementById('shopScreen');
const gameContainer = document.getElementById('gameContainer');

const startButton = document.getElementById('startButton');
const shopButton = document.getElementById('shopButton');
const backToMenuButton = document.getElementById('backToMenuButton');

const playerTotalPointsDisplay = document.getElementById('playerTotalPoints');
const skinsContainer = document.getElementById('skinsContainer');

const gameArea = document.getElementById('gameArea');
const playerCloud = document.getElementById('playerCloud');
const scoreDisplay = document.getElementById('score');

// --- Настройки игры (основные) ---
let currentScore = 0; // Счет текущей игры
const playerSpeed = 25;
const LOGO_WIDTH = 30;
const LOGO_HEIGHT = 30;

const logoFallSpeedStart = 1.5;
let logoFallSpeed = logoFallSpeedStart;
const fallSpeedIncreaseInterval = 9000;
const fallSpeedIncreaseAmount = 0.25;

const logoSpawnIntervalStart = 700;
let currentLogoSpawnInterval = logoSpawnIntervalStart;
const spawnRateIncreaseInterval = 12000;
const spawnIntervalDecreaseAmount = 50;
const minLogoSpawnInterval = 250;

let gameAreaWidth = 0;
let gameAreaHeight = 0;
let playerCloudWidth = 0;

// !!! ЗАМЕНИТЕ НА ИМЕНА ВАШИХ ФАЙЛОВ ЛОГОТИПОВ ПАДАЮЩИХ !!!
const fallingLogoImages = ['logo1.png', 'logo2.png', 'logo3.png']; // Например: ['apple_logo.png', 'android_logo.png']

let logoSpawnTimer;
let fallSpeedUpTimer;
let spawnRateUpTimer;
let isGameOver = false;

// --- Данные игрока и скины ---
const SKINS_DATA = [
    { id: 'default_cloud', name: 'Default Cloud', price: 0, image: 'cloud.png' }, // Убедитесь, что 'cloud.png' - ваш базовый скин
    { id: 'skin1_cloud', name: 'Aqua Burst', price: 1000, image: 'cloud_skin1.png' }, // Замените на ваши имена файлов скинов
    { id: 'skin2_cloud', name: 'Golden Haze', price: 2000, image: 'cloud_skin2.png' },
    { id: 'skin3_cloud', name: 'Shadow Puff', price: 3000, image: 'cloud_skin3.png' }
];

let playerData = {
    totalPoints: 0,
    unlockedSkins: ['default_cloud'], // 'default_cloud' всегда разблокирован
    selectedSkinId: 'default_cloud'
};

// --- Функции localStorage ---
function savePlayerData() {
    try {
        localStorage.setItem('incogamePlayerData', JSON.stringify(playerData));
    } catch (e) {
        console.error("Failed to save player data to localStorage:", e);
    }
}

function loadPlayerData() {
    try {
        const savedData = localStorage.getItem('incogamePlayerData');
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            playerData = { ...playerData, ...parsedData }; // Слияние для сохранения новых полей, если данные старые
            
            // Гарантируем наличие и корректность ключевых полей
            if (!playerData.unlockedSkins || !Array.isArray(playerData.unlockedSkins)) {
                playerData.unlockedSkins = ['default_cloud'];
            } else if (!playerData.unlockedSkins.includes('default_cloud')) {
                playerData.unlockedSkins.push('default_cloud');
            }

            if (!playerData.selectedSkinId || !SKINS_DATA.find(s => s.id === playerData.selectedSkinId)) {
                playerData.selectedSkinId = 'default_cloud'; // Если выбранный скин некорректен, сброс на дефолтный
            }
        }
    } catch (e) {
        console.error("Failed to load player data from localStorage:", e);
        // В случае ошибки используем значения по умолчанию
        playerData = {
            totalPoints: 0,
            unlockedSkins: ['default_cloud'],
            selectedSkinId: 'default_cloud'
        };
    }
    updatePlayerCloudSkin(); // Обновить скин облака при загрузке
}

// --- Управление экранами ---
function showScreen(screenElement) {
    if (mainMenuScreen) mainMenuScreen.style.display = 'none';
    if (shopScreen) shopScreen.style.display = 'none';
    if (gameContainer) gameContainer.style.display = 'none';
    
    if (screenElement) {
        screenElement.style.display = 'flex'; // Используем flex для центрирования содержимого экрана
    } else {
        console.error("Attempted to show a null or undefined screen element. Defaulting to main menu.");
        if (mainMenuScreen) mainMenuScreen.style.display = 'flex'; // Fallback
    }
}

// --- Логика магазина ---
function renderShop() {
    if (!skinsContainer || !playerTotalPointsDisplay) {
        console.error("Shop UI elements (skinsContainer or playerTotalPointsDisplay) not found.");
        return;
    }
    skinsContainer.innerHTML = ''; // Очищаем предыдущие скины
    playerTotalPointsDisplay.textContent = playerData.totalPoints;

    SKINS_DATA.forEach(skin => {
        const skinItem = document.createElement('div');
        skinItem.classList.add('skin-item');

        const skinImage = document.createElement('img');
        skinImage.src = skin.image;
        skinImage.alt = skin.name;

        const skinName = document.createElement('p');
        skinName.textContent = skin.name;

        const skinPrice = document.createElement('p');
        if (playerData.unlockedSkins.includes(skin.id)) {
            skinPrice.textContent = 'Unlocked';
        } else {
            skinPrice.textContent = `Price: ${skin.price} pts`;
        }
        
        skinItem.appendChild(skinImage);
        skinItem.appendChild(skinName);
        skinItem.appendChild(skinPrice);

        const actionButton = document.createElement('button');
        if (playerData.unlockedSkins.includes(skin.id)) {
            if (playerData.selectedSkinId === skin.id) {
                actionButton.textContent = 'Equipped';
                actionButton.classList.add('equipped-button');
                actionButton.disabled = true;
            } else {
                actionButton.textContent = 'Select';
                actionButton.classList.add('select-button');
                actionButton.onclick = () => selectSkin(skin.id);
            }
        } else {
            actionButton.textContent = 'Buy';
            actionButton.classList.add('buy-button');
            if (playerData.totalPoints < skin.price) {
                actionButton.disabled = true;
            }
            actionButton.onclick = () => buySkin(skin.id);
        }
        skinItem.appendChild(actionButton);
        skinsContainer.appendChild(skinItem);
    });
}

function buySkin(skinId) {
    const skinToBuy = SKINS_DATA.find(s => s.id === skinId);
    if (!skinToBuy) {
        console.error(`Skin with id ${skinId} not found.`);
        return;
    }

    if (playerData.totalPoints >= skinToBuy.price && !playerData.unlockedSkins.includes(skinId)) {
        playerData.totalPoints -= skinToBuy.price;
        playerData.unlockedSkins.push(skinId);
        playerData.selectedSkinId = skinId; // Автоматически выбираем купленный скин
        savePlayerData();
        updatePlayerCloudSkin(); // Обновляем скин игрока сразу
        renderShop(); // Перерисовать магазин для обновления статуса кнопок
    } else if (playerData.unlockedSkins.includes(skinId)) {
        alert("Skin already unlocked!");
    } else {
        alert("Not enough points!");
    }
}

function selectSkin(skinId) {
    if (playerData.unlockedSkins.includes(skinId)) {
        playerData.selectedSkinId = skinId;
        savePlayerData();
        updatePlayerCloudSkin();
        renderShop(); // Перерисовать магазин
    } else {
        alert("You need to unlock this skin first!");
    }
}

function updatePlayerCloudSkin() {
    if (!playerCloud) {
        // console.warn("playerCloud element not found during skin update, skipping.");
        return;
    }
    const selectedSkinData = SKINS_DATA.find(s => s.id === playerData.selectedSkinId);
    if (selectedSkinData) {
        playerCloud.style.backgroundImage = `url('${selectedSkinData.image}')`;
    } else {
        // Если выбранный скин не найден (например, удален из SKINS_DATA), используем дефолтный
        const defaultSkin = SKINS_DATA[0];
        playerCloud.style.backgroundImage = `url('${defaultSkin.image}')`;
        console.warn(`Selected skin ID '${playerData.selectedSkinId}' not found. Reverted to default skin '${defaultSkin.id}'.`);
        playerData.selectedSkinId = defaultSkin.id; // Исправляем данные игрока
        savePlayerData();
    }
}


// --- Управление облаком (игровое) ---
document.addEventListener('keydown', (event) => {
    if (isGameOver || !gameContainer || gameContainer.style.display === 'none') return; // Не двигать если не в игре
    if (!playerCloud) return;
    
    let playerLeftStyle = window.getComputedStyle(playerCloud).getPropertyValue('left');
    let playerLeft = parseInt(playerLeftStyle, 10);

    // Если left не установлен (например, при первой загрузке до startGame),
    // или если значение некорректно
    if (isNaN(playerLeft)) {
        if (typeof gameAreaWidth === 'number' && typeof playerCloudWidth === 'number' && gameAreaWidth > 0) {
             playerLeft = (gameAreaWidth / 2) - (playerCloudWidth / 2);
             playerCloud.style.left = playerLeft + 'px';
        } else { 
            // console.warn("Cannot determine playerLeft, dimensions unavailable.");
            return; 
        }
    }
    const key = event.key.toLowerCase();
    const code = event.code;

    if (key === 'a' || key === 'ф' || code === 'KeyA') {
        if (playerLeft > 0) {
            let newLeft = Math.max(0, playerLeft - playerSpeed);
            playerCloud.style.left = newLeft + 'px';
        }
    } else if (key === 'd' || key === 'в' || code === 'KeyD') {
        const rightBoundary = gameAreaWidth - playerCloudWidth;
        if (playerLeft < rightBoundary) {
            let newLeft = Math.min(playerLeft + playerSpeed, rightBoundary);
            playerCloud.style.left = newLeft + 'px';
        }
    }
});

// --- Логика падающих логотипов ---
function createFallingLogo() {
    if (isGameOver || !gameArea) return;
    const logo = document.createElement('div');
    logo.classList.add('fallingLogo');
    if (fallingLogoImages.length === 0) {
        console.warn("No falling logo images defined in fallingLogoImages array.");
        return; // Не создаем лого, если нет изображений
    }
    const randomLogoImage = fallingLogoImages[Math.floor(Math.random() * fallingLogoImages.length)];
    logo.style.backgroundImage = `url('${randomLogoImage}')`;
    const randomX = Math.floor(Math.random() * (gameAreaWidth - LOGO_WIDTH));
    logo.style.left = randomX + 'px';
    logo.style.top = `-${LOGO_HEIGHT + 10}px`;
    gameArea.appendChild(logo);
    moveLogo(logo);
}

function moveLogo(logo) {
    let logoTop = parseInt(logo.style.top);
    const moveInterval = setInterval(() => {
        if (isGameOver) {
            clearInterval(moveInterval);
            if (logo.parentElement) logo.remove();
            return;
        }
        if (logoTop < gameAreaHeight) {
            logoTop += logoFallSpeed;
            logo.style.top = logoTop + 'px';
            if (checkCollision(playerCloud, logo)) {
                if (!isGameOver) gameOver();
                clearInterval(moveInterval);
                if (logo.parentElement) logo.remove();
                return;
            }
        } else { // Логотип упал ниже экрана
            if (logo.parentElement) logo.remove();
            clearInterval(moveInterval);
            if (!isGameOver) updateCurrentScore(1);
        }
    }, 20); // Интервал анимации падения
}

function checkCollision(cloud, logo) {
    if (!cloud || !logo) return false; // Проверка на существование элементов
    const cloudRect = cloud.getBoundingClientRect();
    const logoRect = logo.getBoundingClientRect();
    return !(
        cloudRect.top > logoRect.bottom ||
        cloudRect.right < logoRect.left ||
        cloudRect.bottom < logoRect.top ||
        cloudRect.left > logoRect.right
    );
}

function updateCurrentScore(points) {
    currentScore += points;
    if (scoreDisplay) scoreDisplay.textContent = currentScore;
}

function increaseFallSpeed() {
    if (isGameOver) return;
    logoFallSpeed += fallSpeedIncreaseAmount;
}

function increaseSpawnRate() {
    if (isGameOver) return;
    currentLogoSpawnInterval = Math.max(minLogoSpawnInterval, currentLogoSpawnInterval - spawnIntervalDecreaseAmount);
    // Перезапускаем таймер создания логотипов с новым, уменьшенным интервалом
    clearInterval(logoSpawnTimer);
    logoSpawnTimer = setInterval(createFallingLogo, currentLogoSpawnInterval);
}

// --- Логика игры (старт/конец) ---
function initGameScreen() {
    if (!gameContainer || !playerCloud || !gameArea || !scoreDisplay) {
        console.error("Cannot initialize game screen, one or more core game elements are missing.");
        showScreen(mainMenuScreen); // Вернуться в меню, если что-то не так
        return;
    }
    showScreen(gameContainer);
    isGameOver = false;
    currentScore = 0; 
    scoreDisplay.textContent = currentScore;

    logoFallSpeed = logoFallSpeedStart;
    currentLogoSpawnInterval = logoSpawnIntervalStart;

    // Обновляем размеры, если они не были заданы или изменились (например, при первом запуске)
    gameAreaWidth = gameArea.offsetWidth;
    gameAreaHeight = gameArea.offsetHeight;
    playerCloudWidth = playerCloud.offsetWidth;
    
    updatePlayerCloudSkin(); // Устанавливаем выбранный скин перед началом игры

    // Установка начальной позиции облака
    if (typeof gameAreaWidth === 'number' && typeof playerCloudWidth === 'number' && gameAreaWidth > 0) {
        const initialPlayerLeft = (gameAreaWidth / 2) - (playerCloudWidth / 2);
        playerCloud.style.left = initialPlayerLeft + 'px';
    } else {
         console.warn("Could not set initial player position due to invalid/zero dimensions for gameArea or playerCloud.");
    }

    // Убираем все старые логотипы, если они есть с прошлой игры
    const existingLogos = document.querySelectorAll('.fallingLogo');
    existingLogos.forEach(logo => logo.remove());

    // Очищаем старые таймеры перед запуском новых
    if (logoSpawnTimer) clearInterval(logoSpawnTimer);
    if (fallSpeedUpTimer) clearInterval(fallSpeedUpTimer);
    if (spawnRateUpTimer) clearInterval(spawnRateUpTimer);

    // Запускаем игровые таймеры
    logoSpawnTimer = setInterval(createFallingLogo, currentLogoSpawnInterval);
    fallSpeedUpTimer = setInterval(increaseFallSpeed, fallSpeedIncreaseInterval);
    spawnRateUpTimer = setInterval(increaseSpawnRate, spawnRateIncreaseInterval);
}

function gameOver() {
    if (isGameOver) return;
    isGameOver = true;

    playerData.totalPoints += currentScore; // Добавляем очки текущей игры к общим
    savePlayerData(); // Сохраняем обновленные данные игрока

    // Останавливаем все игровые таймеры
    clearInterval(logoSpawnTimer);
    clearInterval(fallSpeedUpTimer);
    clearInterval(spawnRateUpTimer);

    alert(`Your score for this game: ${currentScore}`); // Показываем очки за текущую игру

    // Очищаем оставшиеся логотипы (если есть)
    const allLogos = document.querySelectorAll('.fallingLogo');
    allLogos.forEach(logoEl => {
        if (logoEl.parentElement) logoEl.remove();
    });
    
    // Возвращаемся в главное меню после игры
    setTimeout(() => {
        showScreen(mainMenuScreen);
    }, 500); // Небольшая задержка перед переходом в меню
}

// --- Инициализация и обработчики событий меню ---
window.onload = () => {
    // Проверка наличия всех основных элементов перед настройкой
    if (!mainMenuScreen || !shopScreen || !gameContainer || !startButton || !shopButton || !backToMenuButton) {
        console.error("CRITICAL: One or more main screen/button elements are missing from the DOM. Check HTML IDs.");
        // Можно вывести сообщение пользователю, если критические элементы отсутствуют
        document.body.innerHTML = "<p style='color:red; font-size:20px; text-align:center; padding-top: 50px;'>Error: Game interface elements are missing.<br>Please check the HTML structure and element IDs.</p>";
        return; // Прерываем выполнение, если нет основных элементов интерфейса
    }

    loadPlayerData(); // Загружаем данные игрока при старте

    startButton.onclick = () => {
        initGameScreen(); // Инициализируем и показываем игровой экран
    };
    
    shopButton.onclick = () => {
        renderShop(); // Отрисовываем магазин перед показом
        showScreen(shopScreen); // Показываем экран магазина
    };
    
    backToMenuButton.onclick = () => {
        showScreen(mainMenuScreen);
    };
    
    showScreen(mainMenuScreen); // Показываем главное меню при загрузке
};