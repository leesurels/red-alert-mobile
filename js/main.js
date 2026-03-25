/**
 * 红色警戒：共和国之辉 - 主入口 v2.0
 */

// 游戏实例
let game = null;

// 游戏设置
const gameSettings = {
    soundVolume: 50,
    musicVolume: 50,
    language: 'zh'
};

/**
 * 初始化
 */
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    initUI();
});

/**
 * 加载设置
 */
function loadSettings() {
    const saved = localStorage.getItem('redAlertSettings');
    if (saved) {
        Object.assign(gameSettings, JSON.parse(saved));
        
        // 应用设置
        document.getElementById('sound-volume').value = gameSettings.soundVolume;
        document.getElementById('music-volume').value = gameSettings.musicVolume;
        document.getElementById('language').value = gameSettings.language;
    }
}

/**
 * 保存设置
 */
function saveSettings() {
    gameSettings.soundVolume = document.getElementById('sound-volume').value;
    gameSettings.musicVolume = document.getElementById('music-volume').value;
    gameSettings.language = document.getElementById('language').value;
    
    localStorage.setItem('redAlertSettings', JSON.stringify(gameSettings));
}

/**
 * 初始化UI
 */
function initUI() {
    // 阵营选择
    const factionCards = document.querySelectorAll('.faction-card');
    factionCards.forEach(card => {
        card.addEventListener('click', () => {
            factionCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
        });
    });
    
    // 新游戏按钮
    document.getElementById('btn-new-game').addEventListener('click', () => startNewGame(1));
    document.getElementById('btn-load-game').addEventListener('click', loadGame);
    
    // 遭遇战按钮
    document.getElementById('btn-skirmish').addEventListener('click', showSkirmishSettings);
    document.getElementById('btn-back-skirmish').addEventListener('click', hideSkirmishSettings);
    document.getElementById('btn-start-skirmish').addEventListener('click', startSkirmish);
    
    // 敌人数量滑块
    document.getElementById('enemy-count').addEventListener('input', (e) => {
        document.getElementById('enemy-count-display').textContent = e.target.value;
    });
    
    // 战役按钮
    document.getElementById('btn-campaign').addEventListener('click', () => {
        alert('战役模式即将推出！');
    });
    
    // 重新开始按钮
    document.getElementById('btn-restart').addEventListener('click', () => {
        location.reload();
    });
    
    // 返回主菜单
    document.getElementById('btn-to-menu').addEventListener('click', () => {
        document.getElementById('game-over').classList.add('hidden');
        document.getElementById('start-menu').classList.remove('hidden');
        if (game) {
            game.isRunning = false;
        }
    });
    
    // 设置菜单
    document.getElementById('settings-btn').addEventListener('click', showSettings);
    document.getElementById('btn-close-settings').addEventListener('click', hideSettings);
    document.getElementById('btn-save-game').addEventListener('click', saveGame);
    document.getElementById('btn-exit-game').addEventListener('click', exitGame);
    
    // 控制按钮
    document.getElementById('btn-select').addEventListener('click', () => {
        if (game) game.input.setMode('select');
    });
    
    document.getElementById('btn-build').addEventListener('click', toggleBuildMenu);
    document.getElementById('btn-units').addEventListener('click', toggleUnitMenu);
    document.getElementById('btn-attack').addEventListener('click', () => {
        if (game) game.input.setMode('attack');
    });
    document.getElementById('btn-repair').addEventListener('click', () => {
        if (game) game.input.setMode('repair');
        toggleBuildMenu(true);
        toggleUnitMenu(true);
    });
    document.getElementById('btn-sell').addEventListener('click', () => {
        if (game) game.input.setMode('sell');
        toggleBuildMenu(true);
        toggleUnitMenu(true);
    });
    
    // 设置变化监听
    document.getElementById('sound-volume').addEventListener('change', saveSettings);
    document.getElementById('music-volume').addEventListener('change', saveSettings);
    document.getElementById('language').addEventListener('change', saveSettings);
}

/**
 * 显示遭遇战设置
 */
function showSkirmishSettings() {
    document.getElementById('start-menu').classList.add('hidden');
    document.getElementById('skirmish-settings').classList.remove('hidden');
}

/**
 * 隐藏遭遇战设置
 */
function hideSkirmishSettings() {
    document.getElementById('skirmish-settings').classList.add('hidden');
    document.getElementById('start-menu').classList.remove('hidden');
}

/**
 * 开始遭遇战
 */
function startSkirmish() {
    const enemyCount = parseInt(document.getElementById('enemy-count').value);
    startNewGame(enemyCount);
}

/**
 * 开始新游戏
 */
function startNewGame(enemyCount = 1) {
    // 获取选中的阵营
    const selectedFaction = document.querySelector('.faction-card.selected');
    const faction = selectedFaction ? selectedFaction.dataset.faction : 'soviet';
    
    // 隐藏开始菜单
    document.getElementById('start-menu').classList.add('hidden');
    document.getElementById('skirmish-settings').classList.add('hidden');
    
    // 创建游戏
    game = new Game();
    game.init(faction, enemyCount);
    
    // 初始化建筑菜单
    initBuildMenu(faction);
    
    // 初始化单位菜单
    initUnitMenu(faction);
}

/**
 * 初始化建筑菜单
 */
function initBuildMenu(faction) {
    const buildGrid = document.getElementById('build-grid');
    buildGrid.innerHTML = '';
    
    const buildingTypes = CONFIG.FACTIONS[faction.toUpperCase()].buildings;
    
    for (const type of buildingTypes) {
        const config = CONFIG.BUILDINGS[type];
        if (!config || config.cost === 0) continue;
        
        const item = document.createElement('div');
        item.className = 'build-item';
        item.dataset.type = type;
        item.innerHTML = `
            <span class="icon">${config.icon}</span>
            <span class="name">${config.name}</span>
            <span class="cost">$${config.cost}</span>
        `;
        
        // 长按检测
        let pressTimer;
        item.addEventListener('touchstart', (e) => {
            pressTimer = setTimeout(() => {
                // 触发拖动建造
                item.dataset.longpress = 'true';
                if (game) {
                    game.input.startDragBuilding(type, e.touches[0].clientX, e.touches[0].clientY);
                }
            }, CONFIG.INPUT.LONG_PRESS_DELAY);
        });
        
        item.addEventListener('touchend', () => {
            clearTimeout(pressTimer);
            delete item.dataset.longpress;
        });
        
        item.addEventListener('touchmove', () => {
            clearTimeout(pressTimer);
            delete item.dataset.longpress;
        });
        
        // 点击建造
        item.addEventListener('click', () => {
            if (game && !game.input.dragBuilding) {
                game.input.setBuildType(type);
                toggleBuildMenu();
            }
        });
        
        buildGrid.appendChild(item);
    }
}

/**
 * 初始化单位菜单
 */
function initUnitMenu(faction) {
    const unitGrid = document.getElementById('unit-grid');
    unitGrid.innerHTML = '';
    
    const unitTypes = CONFIG.FACTIONS[faction.toUpperCase()].units;
    
    for (const type of unitTypes) {
        const config = CONFIG.UNITS[type];
        if (!config) continue;
        
        const item = document.createElement('div');
        item.className = 'unit-item';
        item.dataset.type = type;
        item.innerHTML = `
            <span class="icon">${config.icon}</span>
            <span class="name">${config.name}</span>
            <span class="cost">$${config.cost}</span>
        `;
        
        item.addEventListener('click', () => {
            if (!game) return;
            
            // 检查是否有兵营或战车工厂
            const barracks = game.buildings.find(b => b.type === 'barracks' && b.playerId === game.playerId && b.isComplete);
            const warFactory = game.buildings.find(b => b.type === 'war_factory' && b.playerId === game.playerId && b.isComplete);
            
            const isInfantry = config.type === 'infantry';
            const producer = isInfantry ? barracks : warFactory;
            
            if (!producer) {
                game.showToast(`需要${isInfantry ? '兵营' : '战车工厂'}！`);
                return;
            }
            
            if (game.economy.canAfford(config.cost)) {
                game.economy.spend(config.cost);
                producer.startProduction(type);
                toggleUnitMenu();
                game.showToast(`开始训练 ${config.name}`);
            } else {
                game.showToast('资金不足！');
            }
        });
        
        unitGrid.appendChild(item);
    }
}

/**
 * 切换建筑菜单
 */
function toggleBuildMenu(forceClose = false) {
    const menu = document.getElementById('build-menu');
    const unitMenu = document.getElementById('unit-menu');
    
    if (forceClose) {
        menu.classList.add('hidden');
        return;
    }
    
    unitMenu.classList.add('hidden');
    menu.classList.toggle('hidden');
    
    // 更新建筑可用状态
    if (!menu.classList.contains('hidden')) {
        updateBuildMenuAvailability();
    }
}

/**
 * 切换单位菜单
 */
function toggleUnitMenu() {
    const menu = document.getElementById('unit-menu');
    const buildMenu = document.getElementById('build-menu');
    
    buildMenu.classList.add('hidden');
    menu.classList.toggle('hidden');
}

/**
 * 更新建筑菜单可用状态
 */
function updateBuildMenuAvailability() {
    if (!game) return;
    
    const items = document.querySelectorAll('.build-item');
    
    items.forEach(item => {
        const type = item.dataset.type;
        const config = CONFIG.BUILDINGS[type];
        
        const canAfford = game.economy.canAfford(config.cost);
        const powerOk = config.power >= 0 || game.economy.power + config.power >= 0;
        
        if (canAfford && powerOk) {
            item.classList.add('available');
            item.classList.remove('unavailable');
        } else {
            item.classList.add('unavailable');
            item.classList.remove('available');
        }
    });
}

/**
 * 显示设置菜单
 */
function showSettings() {
    document.getElementById('settings-menu').classList.remove('hidden');
}

/**
 * 隐藏设置菜单
 */
function hideSettings() {
    document.getElementById('settings-menu').classList.add('hidden');
}

/**
 * 保存游戏
 */
function saveGame() {
    if (!game) {
        alert('没有正在进行的游戏！');
        return;
    }
    
    game.saveGame();
    game.showToast('游戏已保存！');
    hideSettings();
}

/**
 * 加载游戏
 */
function loadGame() {
    const saveData = localStorage.getItem('redAlertSave');
    if (!saveData) {
        alert('没有找到存档！');
        return;
    }
    
    document.getElementById('start-menu').classList.add('hidden');
    
    game = new Game();
    game.loadGame();
    
    hideSettings();
}

/**
 * 退出游戏
 */
function exitGame() {
    if (confirm('确定要退出游戏吗？')) {
        if (game) {
            game.isRunning = false;
        }
        document.getElementById('settings-menu').classList.add('hidden');
        document.getElementById('game-over').classList.add('hidden');
        document.getElementById('start-menu').classList.remove('hidden');
        game = null;
    }
}

/**
 * 键盘快捷键
 */
document.addEventListener('keydown', (e) => {
    if (!game) return;
    
    switch (e.key) {
        case 'Escape':
            // 取消建造/选择
            game.input.setMode('select');
            game.clearSelection();
            document.getElementById('build-menu').classList.add('hidden');
            document.getElementById('unit-menu').classList.add('hidden');
            hideSettings();
            break;
        case ' ':
            // 暂停
            game.togglePause();
            break;
        case 's':
            // 保存
            if (e.ctrlKey) {
                e.preventDefault();
                saveGame();
            }
            break;
        case 'l':
            // 加载
            if (e.ctrlKey) {
                e.preventDefault();
                loadGame();
            }
            break;
    }
});

// 定期更新建筑菜单可用状态
setInterval(() => {
    const buildMenu = document.getElementById('build-menu');
    if (game && !buildMenu.classList.contains('hidden')) {
        updateBuildMenuAvailability();
    }
}, 500);
