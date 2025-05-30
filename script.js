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

const fallingLogoImages = ['logo1.png', 'logo2.png', 'logo3.png'];

let logoSpawnTimer;
let fallSpeedUpTimer;
let spawnRateUpTimer;
let isGameOver = false;

// --- Данные игрока и скины ---
// <<< ИЗМЕНЯЕМ НАЗВАНИЯ СКИНОВ ЗДЕСЬ >>>
const SKINS_DATA = [
    { id: 'default_cloud', name: 'Comfy', price: 0, image: 'cloud.png' },
    { id: 'skin1_cloud', name: 'Good-natured', price: 1000, image: 'cloud_skin1.png' },
    { id: 'skin2_cloud', name: 'Terminator', price: 2000, image: 'cloud_skin2.png' },
    { id: 'skin3_cloud', name: 'Swordsman', price: 3000, image: 'cloud_skin3.png' },
    { id: 'skin4_cloud', name: 'Magician', price: 4000, image: 'cloud_skin4.png' },
    { id: 'skin5_cloud', name: 'Mad Scientist', price: 5000, image: 'cloud_skin5.png' }
];
// <<< КОНЕЦ ИЗМЕНЕНИЙ НАЗВАНИЙ СКИНОВ >>>

let playerData = {
    totalPoints: 0,
    unlockedSkins: ['default_cloud'],
    selectedSkinId: 'default_cloud'
};

// Настройки для "внутреннего" хитбокса облака
const CLOUD_HITBOX_PADDING_X = 35; 
const CLOUD_HITBOX_PADDING_Y = 20; 


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
        skinImage.alt = skin.name; // alt текст тоже обновится

        const skinName = document.createElement('p');
        skinName.textContent = skin.name; // Здесь будет новое название

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

function createFallingLogo() {
    if (isGameOver || !gameArea) return;
    const logo = document.createElement('div');
    logo.classList.add('fallingLogo');
    if (fallingLogoImages.length === 0) return;
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
        } else {
            if (logo.parentElement) logo.remove();
            clearInterval(moveInterval);
            if (!isGameOver) updateCurrentScore(1);
        }
    }, 20);
}

function checkCollision(cloud, logo) {
    if (!cloud || !logo) return false;
    
    const cloudRect = cloud.getBoundingClientRect();
    const logoRect = logo.getBoundingClientRect();

    const cloudHitbox = {
        top: cloudRect.top + CLOUD_HITBOX_PADDING_Y,
        bottom: cloudRect.bottom - CLOUD_HITBOX_PADDING_Y,
        left: cloudRect.left + CLOUD_HITBOX_PADDING_X,
        right: cloudRect.right - CLOUD_HITBOX_PADDING_X
    };

    if (cloudHitbox.left >= cloudHitbox.right || cloudHitbox.top >= cloudHitbox.bottom) {
        const isCollidingFull = !(
            cloudRect.top > logoRect.bottom ||
            cloudRect.right < logoRect.left ||
            cloudRect.bottom < logoRect.top ||
            cloudRect.left > logoRect.right
        );
        // if (isCollidingFull) { // Закомментируем отладочные логи, если не нужны
        //     console.log("--- COLLISION (Full Rect Fallback) ---");
        //     console.log("Cloud Full Rect:", JSON.stringify(cloudRect));
        //     console.log("Logo Rect:", JSON.stringify(logoRect));
        // }
        return isCollidingFull;
    }
    
    const isCollidingPadded = !(
        cloudHitbox.top > logoRect.bottom ||
        cloudHitbox.right < logoRect.left ||
        cloudHitbox.bottom < logoRect.top ||
        cloudHitbox.left > logoRect.right
    );

    // if (isCollidingPadded) { // Закомментируем отладочные логи, если не нужны
    //     console.log("--- COLLISION DETECTED (Padded Hitbox) ---");
    //     console.log("Cloud Full Rect:", JSON.stringify(cloudRect));
    //     console.log("Cloud Padded Hitbox:", JSON.stringify(cloudHitbox));
    //     console.log("Logo Rect:", JSON.stringify(logoRect));
    //     console.log("Current Score:", currentScore);
    // }
    
    return isCollidingPadded;
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
    clearInterval(logoSpawnTimer);
    logoSpawnTimer = setInterval(createFallingLogo, currentLogoSpawnInterval);
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
    currentLogoSpawnInterval = logoSpawnIntervalStart;

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

    const existingLogos = document.querySelectorAll('.fallingLogo');
    existingLogos.forEach(logo => logo.remove());

    if (logoSpawnTimer) clearInterval(logoSpawnTimer);
    if (fallSpeedUpTimer) clearInterval(fallSpeedUpTimer);
    if (spawnRateUpTimer) clearInterval(spawnRateUpTimer);

    logoSpawnTimer = setInterval(createFallingLogo, currentLogoSpawnInterval);
    fallSpeedUpTimer = setInterval(increaseFallSpeed, fallSpeedIncreaseInterval);
    spawnRateUpTimer = setInterval(increaseSpawnRate, spawnRateIncreaseInterval);
}

function gameOver() {
    if (isGameOver) return;
    isGameOver = true;

    playerData.totalPoints += currentScore;
    savePlayerData();

    clearInterval(logoSpawnTimer);
    clearInterval(fallSpeedUpTimer);
    clearInterval(spawnRateUpTimer);

    alert(`Your score for this game: ${currentScore}`);

    const allLogos = document.querySelectorAll('.fallingLogo');
    allLogos.forEach(logoEl => {
        if (logoEl.parentElement) logoEl.remove();
    });
    
    setTimeout(() => {
        showScreen(mainMenuScreen);
    }, 500); 
}

window.onload = () => {
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
};