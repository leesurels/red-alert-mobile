/**
 * 红色警戒：共和国之辉 - 主入口
 */

// 游戏实例
let game = null;

/**
 * 初始化
 */
document.addEventListener('DOMContentLoaded', () => {
    initUI();
});

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
    document.getElementById('btn-new-game').addEventListener('click', startNewGame);
    document.getElementById('btn-skirmish').addEventListener('click', startNewGame);
    
    // 战役按钮
    document.getElementById('btn-campaign').addEventListener('click', () => {
        alert('战役模式即将推出！');
    });
    
    // 重新开始按钮
    document.getElementById('btn-restart').addEventListener('click', () => {
        location.reload();
    });
    
    // 控制按钮
    document.getElementById('btn-select').addEventListener('click', () => {
        if (game) game.input.setMode('select');
    });
    
    document.getElementById('btn-build').addEventListener('click', toggleBuildMenu);
    document.getElementById('btn-units').addEventListener('click', toggleUnitMenu);
    document.getElementById('btn-attack').addEventListener('click', () => {
        if (game) game.input.setMode('attack');
    });
}

/**
 * 开始新游戏
 */
function startNewGame() {
    // 获取选中的阵营
    const selectedFaction = document.querySelector('.faction-card.selected');
    const faction = selectedFaction ? selectedFaction.dataset.faction : 'soviet';
    
    // 隐藏开始菜单
    document.getElementById('start-menu').classList.add('hidden');
    
    // 创建游戏
    game = new Game();
    game.init(faction);
    
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
        
        item.addEventListener('click', () => {
            game.input.setBuildType(type);
            toggleBuildMenu();
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
            // 检查是否有兵营或战车工厂
            const barracks = game.buildings.find(b => b.type === 'barracks' && b.playerId === game.playerId && b.isComplete);
            const warFactory = game.buildings.find(b => b.type === 'war_factory' && b.playerId === game.playerId && b.isComplete);
            
            const isInfantry = config.type === 'infantry';
            const producer = isInfantry ? barracks : warFactory;
            
            if (!producer) {
                alert(`需要${isInfantry ? '兵营' : '战车工厂'}！`);
                return;
            }
            
            if (game.economy.canAfford(config.cost)) {
                game.economy.spend(config.cost);
                producer.startProduction(type);
                toggleUnitMenu();
            } else {
                alert('资金不足！');
            }
        });
        
        unitGrid.appendChild(item);
    }
}

/**
 * 切换建筑菜单
 */
function toggleBuildMenu() {
    const menu = document.getElementById('build-menu');
    const unitMenu = document.getElementById('unit-menu');
    
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
            break;
        case ' ':
            // 暂停
            game.togglePause();
            break;
        case 's':
            // 保存
            if (e.ctrlKey) {
                e.preventDefault();
                game.saveGame();
            }
            break;
        case 'l':
            // 加载
            if (e.ctrlKey) {
                e.preventDefault();
                game.loadGame();
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
