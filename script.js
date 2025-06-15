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
let currentScore = 0;
const playerSpeed = 25;

// Видимые размеры для объектов
const PEPE_VISIBLE_WIDTH = 30;
const PEPE_VISIBLE_HEIGHT = 30;
const COLLECTIBLE_LOGO_VISIBLE_WIDTH = 35; 
const COLLECTIBLE_LOGO_VISIBLE_HEIGHT = 35;

// Отступы для хитбоксов падающих объектов
const PEPE_HITBOX_PADDING_X = 5; 
const PEPE_HITBOX_PADDING_Y = 5; 
const COLLECTIBLE_LOGO_HITBOX_PADDING_X = 0; 
const COLLECTIBLE_LOGO_HITBOX_PADDING_Y = 0; 

const POINTS_FOR_DODGED_PEPE = 1;
const POINTS_FOR_COLLECTED_LOGO = 5;
const SPAWN_COLLECTIBLE_LOGO_PROBABILITY = 0.25;

const logoFallSpeedStart = 1.5; 
let logoFallSpeed = logoFallSpeedStart;
const fallSpeedIncreaseInterval = 9000;
const fallSpeedIncreaseAmount = 0.25;

const objectSpawnIntervalStart = 700; 
let currentObjectSpawnInterval = objectSpawnIntervalStart;
const spawnRateIncreaseInterval = 12000;
const spawnIntervalDecreaseAmount = 50;
const minObjectSpawnInterval = 250;

let gameAreaWidth = 0;
let gameAreaHeight = 0;
let playerCloudWidth = 0; 

const pepeImages = ['pepe1.png', 'pepe2.png', 'pepe3.png']; 
const collectibleLogoImage = 'logo.png'; 

let objectSpawnTimer; 
let fallSpeedUpTimer;
let spawnRateUpTimer;
let isGameOver = false;

const SKINS_DATA = [
    { id: 'default_cloud', name: 'Comfy', price: 0, image: 'cloud.png' },
    { id: 'skin1_cloud', name: 'Good-natured', price: 200, image: 'cloud_skin1.png' },
    { id: 'skin2_cloud', name: 'Terminator', price: 500, image: 'cloud_skin2.png' },
    { id: 'skin3_cloud', name: 'Swordsman', price: 700, image: 'cloud_skin3.png' },
    { id: 'skin4_cloud', name: 'Magician', price: 1000, image: 'cloud_skin4.png' },
    { id: 'skin5_cloud', name: 'Mad Scientist', price: 1200, image: 'cloud_skin5.png' },
    { id: 'skin6_tyson', name: 'Tyson', price: 1500, image: 'cloud_skin6.png' }
];

let playerData = {
    totalPoints: 0,
    unlockedSkins: ['default_cloud'],
    selectedSkinId: 'default_cloud'
};

// Отступы для хитбокса облака игрока
const CLOUD_HITBOX_PADDING_X = 25; // <<< ИЗМЕНЕНО: Уменьшен отступ (хитбокс облака стал шире)
const CLOUD_HITBOX_PADDING_Y = 15; // <<< ИЗМЕНЕНО: Уменьшен отступ (хитбокс облака стал выше)

// === АУДИО ===
const bgMusic = document.getElementById('bgMusic');
let musicEnabled = true;
const musicToggleButton = document.getElementById('musicToggleButton');
const musicToggleButtonGame = document.getElementById('musicToggleButtonGame');

// Звуки событий
const startSound = new Audio('sounds/start.mp3');
const pickupSound = new Audio('sounds/pickup.mp3');
const loseSound = new Audio('sounds/lose.mp3');

function updateMusicButtonUI() {
    if (musicToggleButton) musicToggleButton.textContent = 'Music: ' + (musicEnabled ? 'On' : 'Off');
    if (musicToggleButtonGame) musicToggleButtonGame.textContent = 'Music: ' + (musicEnabled ? 'On' : 'Off');
}

function playBgMusic() {
    if (musicEnabled && bgMusic) {
        bgMusic.volume = 0.5;
        bgMusic.play();
    }
}
function stopBgMusic() {
    if (bgMusic) bgMusic.pause();
}

function playSound(sound) {
    if (musicEnabled && sound) {
        sound.currentTime = 0;
        sound.play();
    }
}

if (musicToggleButton) {
    musicToggleButton.onclick = () => {
        musicEnabled = !musicEnabled;
        updateMusicButtonUI();
        if (musicEnabled) playBgMusic(); else stopBgMusic();
    };
}
if (musicToggleButtonGame) {
    musicToggleButtonGame.onclick = () => {
        musicEnabled = !musicEnabled;
        updateMusicButtonUI();
        if (musicEnabled) playBgMusic(); else stopBgMusic();
    };
}

// ... (остальные функции: savePlayerData, loadPlayerData, showScreen, renderShop, buySkin, selectSkin, updatePlayerCloudSkin, управление облаком, createFallingObject, moveFallingObject, checkCollision, updateCurrentScore, increaseFallSpeed, increaseSpawnRate, initGameScreen, gameOver, window.onload остаются такими же, как в предыдущем полном файле) ...

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
            playerData = { ...playerData, ...parsedData }; 
            
            if (!playerData.unlockedSkins || !Array.isArray(playerData.unlockedSkins)) {
                playerData.unlockedSkins = ['default_cloud'];
            } else if (!playerData.unlockedSkins.includes('default_cloud')) {
                playerData.unlockedSkins.push('default_cloud');
            }

            if (!playerData.selectedSkinId || !SKINS_DATA.find(s => s.id === playerData.selectedSkinId)) {
                playerData.selectedSkinId = 'default_cloud';
            }
        }
    } catch (e) {
        console.error("Failed to load player data from localStorage:", e);
        playerData = {
            totalPoints: 0,
            unlockedSkins: ['default_cloud'],
            selectedSkinId: 'default_cloud'
        };
    }
    updatePlayerCloudSkin();
}

function showScreen(screenElement) {
    if (mainMenuScreen) mainMenuScreen.style.display = 'none';
    if (shopScreen) shopScreen.style.display = 'none';
    if (gameContainer) gameContainer.style.display = 'none';
    
    if (screenElement) {
        screenElement.style.display = 'flex';
    } else {
        if (mainMenuScreen) mainMenuScreen.style.display = 'flex';
    }
}

function renderShop() {
    if (!skinsContainer || !playerTotalPointsDisplay) return;
    skinsContainer.innerHTML = '';
    playerTotalPointsDisplay.textContent = playerData.totalPoints;

    SKINS_DATA.forEach(skin => {
        const skinItem = document.createElement('div');
        skinItem.classList.add('skin-item');

        const skinImage = document.createElement('img');
        skinImage.src = skin.image;
        skinImage.alt = skin.name;

        const skinName = document.createElement('p');
        skinName.textContent = skin.name;

        const skinPriceDisplay = document.createElement('p');
        if (playerData.unlockedSkins.includes(skin.id)) {
            skinPriceDisplay.textContent = 'Unlocked';
        } else {
            skinPriceDisplay.textContent = `Price: ${skin.price} pts`;
        }
        
        skinItem.appendChild(skinImage);
        skinItem.appendChild(skinName);
        skinItem.appendChild(skinPriceDisplay);

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
    if (!skinToBuy) return;

    if (playerData.totalPoints >= skinToBuy.price && !playerData.unlockedSkins.includes(skinId)) {
        playerData.totalPoints -= skinToBuy.price;
        playerData.unlockedSkins.push(skinId);
        playerData.selectedSkinId = skinId; 
        savePlayerData();
        updatePlayerCloudSkin();
        renderShop();
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
        renderShop();
    } else {
        alert("You need to unlock this skin first!");
    }
}

function updatePlayerCloudSkin() {
    if (!playerCloud) return;
    const selectedSkinData = SKINS_DATA.find(s => s.id === playerData.selectedSkinId);
    if (selectedSkinData) {
        playerCloud.style.backgroundImage = `url('${selectedSkinData.image}')`;
    } else {
        const defaultSkin = SKINS_DATA[0];
        playerCloud.style.backgroundImage = `url('${defaultSkin.image}')`;
        if (playerData.selectedSkinId !== defaultSkin.id) {
            playerData.selectedSkinId = defaultSkin.id;
            savePlayerData();
        }
    }
}

document.addEventListener('keydown', (event) => {
    if (isGameOver || !gameContainer || gameContainer.style.display === 'none') return;
    if (!playerCloud) return;
    
    let playerLeftStyle = window.getComputedStyle(playerCloud).getPropertyValue('left');
    let playerLeft = parseInt(playerLeftStyle, 10);

    if (isNaN(playerLeft)) {
        if(playerCloud) playerCloudWidth = playerCloud.offsetWidth; 
        if (typeof gameAreaWidth === 'number' && typeof playerCloudWidth === 'number' && gameAreaWidth > 0) {
             playerLeft = (gameAreaWidth / 2) - (playerCloudWidth / 2);
             playerCloud.style.left = playerLeft + 'px';
        } else { return; }
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

function createFallingObject() {
    if (isGameOver || !gameArea) return;

    const objectElement = document.createElement('div');
    objectElement.classList.add('fallingObject'); 

    let objectType;
    let imageUrl;
    let visibleWidth;
    let visibleHeight;
    let hitboxPaddingX;
    let hitboxPaddingY;

    if (Math.random() < SPAWN_COLLECTIBLE_LOGO_PROBABILITY) {
        objectType = 'collectible';
        imageUrl = collectibleLogoImage;
        visibleWidth = COLLECTIBLE_LOGO_VISIBLE_WIDTH;
        visibleHeight = COLLECTIBLE_LOGO_VISIBLE_HEIGHT;
        hitboxPaddingX = COLLECTIBLE_LOGO_HITBOX_PADDING_X;
        hitboxPaddingY = COLLECTIBLE_LOGO_HITBOX_PADDING_Y;
    } else {
        objectType = 'pepe';
        if (pepeImages.length > 0) {
            imageUrl = pepeImages[Math.floor(Math.random() * pepeImages.length)];
        } else {
            return; 
        }
        visibleWidth = PEPE_VISIBLE_WIDTH;
        visibleHeight = PEPE_VISIBLE_HEIGHT;
        hitboxPaddingX = PEPE_HITBOX_PADDING_X;
        hitboxPaddingY = PEPE_HITBOX_PADDING_Y;
    }

    objectElement.dataset.type = objectType; 
    objectElement.dataset.hitboxPaddingX = hitboxPaddingX;
    objectElement.dataset.hitboxPaddingY = hitboxPaddingY;
    objectElement.style.backgroundImage = `url('${imageUrl}')`;
    objectElement.style.width = `${visibleWidth}px`;
    objectElement.style.height = `${visibleHeight}px`;
    
    const randomX = Math.floor(Math.random() * (gameAreaWidth - visibleWidth));
    objectElement.style.left = randomX + 'px';
    objectElement.style.top = `-${visibleHeight + 10}px`;
    
    gameArea.appendChild(objectElement);
    moveFallingObject(objectElement); 
}

function moveFallingObject(objectElement) { 
    let objectTop = parseInt(objectElement.style.top);
    const objectType = objectElement.dataset.type;

    const moveInterval = setInterval(() => {
        if (isGameOver) {
            clearInterval(moveInterval);
            if (objectElement.parentElement) objectElement.remove();
            return;
        }

        if (objectTop < gameAreaHeight) {
            objectTop += logoFallSpeed; 
            objectElement.style.top = objectTop + 'px';

            if (checkCollision(playerCloud, objectElement)) { 
                if (objectType === 'pepe') {
                    if (!isGameOver) gameOver();
                } else if (objectType === 'collectible') {
                    updateCurrentScore(POINTS_FOR_COLLECTED_LOGO);
                    playSound(pickupSound);
                }
                clearInterval(moveInterval);
                if (objectElement.parentElement) objectElement.remove();
                return; 
            }
        } else { 
            if (objectType === 'pepe') {
                if (!isGameOver) updateCurrentScore(POINTS_FOR_DODGED_PEPE);
            }
            clearInterval(moveInterval);
            if (objectElement.parentElement) objectElement.remove();
        }
    }, 20);
}

function checkCollision(cloud, fallingObject) { 
    if (!cloud || !fallingObject) return false;
    
    // Получаем точные координаты через getBoundingClientRect
    const cloudRect = cloud.getBoundingClientRect();
    const objectRect = fallingObject.getBoundingClientRect();
    
    // Применяем отступы для хитбоксов
    const cloudHitbox = {
        left: cloudRect.left + CLOUD_HITBOX_PADDING_X,
        right: cloudRect.right - CLOUD_HITBOX_PADDING_X,
        top: cloudRect.top + CLOUD_HITBOX_PADDING_Y,
        bottom: cloudRect.bottom - CLOUD_HITBOX_PADDING_Y
    };

    const objectPaddingX = parseFloat(fallingObject.dataset.hitboxPaddingX) || 0;
    const objectPaddingY = parseFloat(fallingObject.dataset.hitboxPaddingY) || 0;

    const objectHitbox = {
        left: objectRect.left + objectPaddingX,
        right: objectRect.right - objectPaddingX,
        top: objectRect.top + objectPaddingY,
        bottom: objectRect.bottom - objectPaddingY
    };
    
    // Проверка на некорректные хитбоксы
    if (cloudHitbox.left >= cloudHitbox.right || cloudHitbox.top >= cloudHitbox.bottom) {
        cloudHitbox.left = cloudRect.left;
        cloudHitbox.right = cloudRect.right;
        cloudHitbox.top = cloudRect.top;
        cloudHitbox.bottom = cloudRect.bottom;
    }
    
    if (objectHitbox.left >= objectHitbox.right || objectHitbox.top >= objectHitbox.bottom) {
        objectHitbox.left = objectRect.left;
        objectHitbox.right = objectRect.right;
        objectHitbox.top = objectRect.top;
        objectHitbox.bottom = objectRect.bottom;
    }
    
    // AABB (Axis-Aligned Bounding Box) коллизия - самый надежный метод
    const isColliding = (
        cloudHitbox.left < objectHitbox.right &&
        cloudHitbox.right > objectHitbox.left &&
        cloudHitbox.top < objectHitbox.bottom &&
        cloudHitbox.bottom > objectHitbox.top
    );
    
    // Отладочный вывод (временно)
    if (Math.abs(cloudHitbox.left - objectHitbox.right) < 50 || Math.abs(cloudHitbox.right - objectHitbox.left) < 50) {
        console.log('=== COLLISION DEBUG ===');
        console.log('Cloud hitbox:', cloudHitbox);
        console.log('Object hitbox:', objectHitbox);
        console.log('Collision result:', isColliding);
        console.log('Object type:', fallingObject.dataset.type);
    }
    
    return isColliding;
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
    currentObjectSpawnInterval = Math.max(minObjectSpawnInterval, currentObjectSpawnInterval - spawnIntervalDecreaseAmount);
    clearInterval(objectSpawnTimer); 
    objectSpawnTimer = setInterval(createFallingObject, currentObjectSpawnInterval); 
}

function initGameScreen() {
    if (!gameContainer || !playerCloud || !gameArea || !scoreDisplay) {
        showScreen(mainMenuScreen);
        return;
    }
    showScreen(gameContainer);
    isGameOver = false;
    currentScore = 0; 
    scoreDisplay.textContent = currentScore;

    logoFallSpeed = logoFallSpeedStart;
    currentObjectSpawnInterval = objectSpawnIntervalStart; 

    gameAreaWidth = gameArea.offsetWidth;
    gameAreaHeight = gameArea.offsetHeight;
    
    if (playerCloud) {
        playerCloudWidth = playerCloud.offsetWidth;
    } else {
        playerCloudWidth = 120; 
        console.warn("playerCloud not found during initGameScreen, using default width 120px.");
    }
    
    updatePlayerCloudSkin();

    if (typeof gameAreaWidth === 'number' && typeof playerCloudWidth === 'number' && gameAreaWidth > 0) {
        const initialPlayerLeft = (gameAreaWidth / 2) - (playerCloudWidth / 2);
        playerCloud.style.left = initialPlayerLeft + 'px';
    }

    const existingObjects = document.querySelectorAll('.fallingObject'); 
    existingObjects.forEach(obj => obj.remove());

    if (objectSpawnTimer) clearInterval(objectSpawnTimer); 
    if (fallSpeedUpTimer) clearInterval(fallSpeedUpTimer);
    if (spawnRateUpTimer) clearInterval(spawnRateUpTimer);

    objectSpawnTimer = setInterval(createFallingObject, currentObjectSpawnInterval); 
    fallSpeedUpTimer = setInterval(increaseFallSpeed, fallSpeedIncreaseInterval);
    spawnRateUpTimer = setInterval(increaseSpawnRate, spawnRateIncreaseInterval);

    playBgMusic();
    playSound(startSound);
}

function gameOver() {
    if (isGameOver) return;
    isGameOver = true;

    playerData.totalPoints += currentScore;
    savePlayerData();

    clearInterval(objectSpawnTimer); 
    clearInterval(fallSpeedUpTimer);
    clearInterval(spawnRateUpTimer);

    alert(`Your score for this game: ${currentScore}`);

    const allFallingObjects = document.querySelectorAll('.fallingObject'); 
    allFallingObjects.forEach(obj => {
        if (obj.parentElement) obj.remove();
    });
    
    stopBgMusic();
    playSound(loseSound);

    setTimeout(() => {
        showScreen(mainMenuScreen);
    }, 500); 

    if (playerNickname) {
        sendScoreToServer(playerNickname, currentScore);
    }
}

const SERVER_URL = 'https://incoserver1.onrender.com'; 

let playerNickname = localStorage.getItem('incogameNickname') || null;

async function showNicknameModal() {
    return new Promise((resolve) => {
        const modal = document.getElementById('nicknameModal');
        const input = document.getElementById('nicknameInput');
        const error = document.getElementById('nicknameError');
        const submit = document.getElementById('nicknameSubmit');
        modal.style.display = 'flex';
        input.value = '';
        error.textContent = '';
        input.focus();

        submit.onclick = async () => {
            const nickname = input.value.trim();
            if (nickname.length < 3) {
                error.textContent = 'Nickname too short!';
                return;
            }
            // Проверка уникальности на сервере
            try {
                const res = await fetch(SERVER_URL + '/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nickname })
                });
                if (res.status === 409) {
                    error.textContent = 'Nickname already taken!';
                    return;
                }
                if (!res.ok) {
                    error.textContent = 'Error. Try another nickname.';
                    return;
                }
                localStorage.setItem('incogameNickname', nickname);
                playerNickname = nickname;
                modal.style.display = 'none';
                resolve(nickname);
            } catch (e) {
                error.textContent = 'Server error!';
            }
        };
    });
}

async function sendScoreToServer(nickname, score) {
    try {
        await fetch(SERVER_URL + '/score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nickname, score })
        });
    } catch (e) {
        console.error('Failed to send score:', e);
    }
}

async function showLeaderboard() {
    const res = await fetch(SERVER_URL + '/leaderboard');
    const top = await res.json();
    let html = '<h2>Leaderboard</h2><ul class="leaderboard-list">';
    top.forEach((user, i) => {
        let rankClass = '';
        if (i === 0) rankClass = 'rank-1';
        else if (i === 1) rankClass = 'rank-2';
        else if (i === 2) rankClass = 'rank-3';
        html += `<li class="leaderboard-item">
            <span class="leaderboard-rank ${rankClass}">${i + 1}</span>
            <span class="leaderboard-nick">${user.nickname}</span>
            <span class="leaderboard-score">${user.score}</span>
        </li>`;
    });
    html += '</ul><button onclick="document.getElementById(\'leaderboardModal\').style.display=\'none\'" class="leaderboard-btn" style="position:static; margin-top:20px;">Close</button>';
    document.getElementById('leaderboardContent').innerHTML = html;
    document.getElementById('leaderboardModal').style.display = 'flex';
}

window.onload = async () => {
    if (!mainMenuScreen || !shopScreen || !gameContainer || !startButton || !shopButton || !backToMenuButton) {
        document.body.innerHTML = "<p style='color:red; font-size:20px; text-align:center; padding-top: 50px;'>Error: Game interface elements are missing.<br>Please check the HTML structure and element IDs.</p>";
        return;
    }

    loadPlayerData(); 

    startButton.onclick = () => {
        initGameScreen();
    };
    
    shopButton.onclick = () => {
        renderShop();
        showScreen(shopScreen);
    };
    
    backToMenuButton.onclick = () => {
        showScreen(mainMenuScreen);
    };
    
    if (playerCloud && playerCloud.offsetWidth > 0) {
        playerCloudWidth = playerCloud.offsetWidth;
    }

    showScreen(mainMenuScreen);

    updateMusicButtonUI();
    playBgMusic();

    if (!playerNickname) {
        await showNicknameModal();
    }

    document.getElementById('leaderboardButton').onclick = showLeaderboard;
};
