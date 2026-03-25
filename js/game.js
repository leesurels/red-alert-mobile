/**
 * 红色警戒：共和国之辉 - 游戏主逻辑 v2.0
 */

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 游戏状态
        this.isRunning = false;
        this.isPaused = false;
        this.gameSpeed = 1;
        
        // 玩家
        this.playerId = 'player1';
        this.playerFaction = 'soviet';
        
        // 游戏对象
        this.map = null;
        this.fog = null;
        this.buildings = [];
        this.units = [];
        this.economy = null;
        
        // 相机
        this.camera = { x: 0, y: 0 };
        this.zoom = 1;
        
        // 选中
        this.selectedUnits = [];
        this.selectedBuilding = null;
        
        // 子系统
        this.input = null;
        this.renderer = null;
        
        // 时间
        this.lastTime = 0;
        this.deltaTime = 0;
        
        // AI
        this.aiPlayers = [];
        
        // 设置
        this.settings = {
            soundVolume: 50,
            musicVolume: 50,
            language: 'zh'
        };
        
        // 遭遇战配置
        this.skirmishConfig = {
            mapType: 'GRASSLAND',
            enemyCount: 1,
            difficulty: 'normal'
        };
    }
    
    /**
     * 初始化游戏
     */
    init(faction = 'soviet', isSkirmish = false) {
        this.playerFaction = faction;
        
        // 创建地图
        this.map = new GameMap(CONFIG.MAP.WIDTH, CONFIG.MAP.HEIGHT);
        this.fog = new FogOfWar(CONFIG.MAP.WIDTH, CONFIG.MAP.HEIGHT);
        
        // 创建经济系统
        this.economy = new Economy(this.playerId);
        
        // 获取出生点
        const spawnPoint = this.map.getRandomSpawnPoint();
        
        // 创建初始建筑
        this.createStartingBuildings(spawnPoint.x, spawnPoint.y);
        
        // 初始化输入和渲染
        this.input = new InputHandler(this);
        this.renderer = new Renderer(this.canvas, this);
        
        // 设置相机位置
        this.camera.x = spawnPoint.x * CONFIG.MAP.TILE_SIZE - this.canvas.width / 2;
        this.camera.y = spawnPoint.y * CONFIG.MAP.TILE_SIZE - this.canvas.height / 2;
        
        // 创建AI
        if (isSkirmish) {
            this.createMultipleAI();
        } else {
            this.createAI();
        }
        
        // 更新UI
        this.updateUI();
        
        // 开始游戏循环
        this.isRunning = true;
        this.lastTime = performance.now();
        requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    /**
     * 创建多个AI敌人（遭遇战模式）
     */
    createMultipleAI() {
        const count = this.skirmishConfig.enemyCount;
        const factions = ['soviet', 'allied'];
        
        for (let i = 0; i < count; i++) {
            const aiFaction = factions[i % 2];
            const ai = new GameAI(`ai${i + 1}`, aiFaction, this);
            this.aiPlayers.push(ai);
            
            // AI出生点
            const aiSpawn = this.map.getRandomSpawnPoint();
            ai.init(aiSpawn.x, aiSpawn.y);
        }
    }
    
    /**
     * 创建初始建筑
     */
    createStartingBuildings(x, y) {
        // 建造厂
        const constructionYard = new Building('construction_yard', x, y, this.playerFaction, this.playerId);
        this.buildings.push(constructionYard);
        
        // 发电厂
        const powerPlant = new Building('power_plant', x + 4, y, this.playerFaction, this.playerId);
        powerPlant.isComplete = true;
        powerPlant.isBuilding = false;
        powerPlant.buildProgress = powerPlant.buildTime;
        this.buildings.push(powerPlant);
        
        // 矿厂
        const refinery = new Building('ore_refinery', x, y + 4, this.playerFaction, this.playerId);
        refinery.isComplete = true;
        refinery.isBuilding = false;
        refinery.buildProgress = refinery.buildTime;
        this.buildings.push(refinery);
        
        // 兵营
        const barracks = new Building('barracks', x + 4, y + 3, this.playerFaction, this.playerId);
        barracks.isComplete = true;
        barracks.isBuilding = false;
        barracks.buildProgress = barracks.buildTime;
        this.buildings.push(barracks);
        
        // 初始单位
        // 工程师
        for (let i = 0; i < 2; i++) {
            const engineer = new Unit('engineer', x + 2 + i, y + 8, this.playerFaction, this.playerId);
            this.units.push(engineer);
        }
        
        // 动员兵/美国大兵
        const infantryType = this.playerFaction === 'soviet' ? 'conscript' : 'gi';
        for (let i = 0; i < 4; i++) {
            const soldier = new Unit(infantryType, x + 1 + i, y + 7, this.playerFaction, this.playerId);
            this.units.push(soldier);
        }
        
        // 采矿车（自动寻矿）
        const harvester = new Unit('harvester', x - 2, y + 5, this.playerFaction, this.playerId);
        harvester.isHarvesting = true;
        harvester.autoSearchOre = true;
        this.units.push(harvester);
    }
    
    /**
     * 游戏主循环
     */
    gameLoop(currentTime) {
        if (!this.isRunning) return;
        
        // 计算时间差
        this.deltaTime = (currentTime - this.lastTime) / 1000 * this.gameSpeed;
        this.lastTime = currentTime;
        
        if (!this.isPaused) {
            this.update(this.deltaTime);
        }
        
        this.render();
        
        requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    /**
     * 更新游戏逻辑
     */
    update(deltaTime) {
        // 限制deltaTime防止卡顿
        deltaTime = Math.min(deltaTime, 0.1);
        
        // 更新经济
        this.economy.update(this.buildings);
        
        // 更新建筑
        for (const building of this.buildings) {
            const result = building.update(deltaTime);
            
            // 生产完成
            if (result && result.type === 'productionComplete') {
                this.spawnUnit(result.unitType, building);
            }
        }
        
        // 更新单位
        for (const unit of this.units) {
            const enemyUnits = this.units.filter(u => u.playerId !== unit.playerId);
            const enemyBuildings = this.buildings.filter(b => b.playerId !== unit.playerId);
            const allyBuildings = this.buildings.filter(b => b.playerId === unit.playerId);
            
            const result = unit.update(deltaTime, this.map, enemyUnits, enemyBuildings, allyBuildings);
            
            // 处理采矿结果
            if (result && result.type === 'oreDeposited') {
                this.economy.earn(result.amount * CONFIG.ECONOMY.ORE_VALUE);
            }
            
            // 采矿车自动寻矿
            if (unit.config.canHarvest && unit.autoSearchOre && !unit.isHarvesting && unit.oreCarried === 0) {
                this.autoSearchOreForHarvester(unit);
            }
        }
        
        // 移除死亡单位
        this.units = this.units.filter(u => u.health > 0);
        
        // 移除被摧毁建筑
        this.buildings = this.buildings.filter(b => b.health > 0);
        
        // 更新迷雾
        const playerBuildings = this.buildings.filter(b => b.playerId === this.playerId);
        const playerUnits = this.units.filter(u => u.playerId === this.playerId);
        this.fog.updateFromEntities(playerBuildings, playerUnits);
        
        // 更新AI
        for (const ai of this.aiPlayers) {
            ai.update(deltaTime);
        }
        
        // 检查游戏结束
        this.checkGameOver();
        
        // 更新UI
        this.updateUI();
    }
    
    /**
     * 采矿车自动寻矿
     */
    autoSearchOreForHarvester(harvester) {
        const ore = this.map.getNearestOre(harvester.x, harvester.y, 50);
        if (ore) {
            const centerX = ore.x + ore.size / 2;
            const centerY = ore.y + ore.size / 2;
            harvester.moveTo(centerX, centerY, this.map);
            harvester.isHarvesting = true;
        }
    }
    
    /**
     * 渲染
     */
    render() {
        this.renderer.render();
    }
    
    /**
     * 检查是否可以建造
     */
    canBuildAt(buildingType, x, y) {
        const config = CONFIG.BUILDINGS[buildingType];
        if (!config) return false;
        
        // 检查是否与现有建筑重叠
        for (const building of this.buildings) {
            if (this.buildingsOverlap(x, y, config.size.w, config.size.h, building)) {
                return false;
            }
        }
        
        // 检查建造条件
        return this.map.canBuild(x, y, config.size.w, config.size.h, 
            this.buildings.filter(b => b.playerId === this.playerId));
    }
    
    /**
     * 检查建筑是否重叠
     */
    buildingsOverlap(x1, y1, w1, h1, building) {
        return !(x1 + w1 <= building.x || 
                 x1 >= building.x + building.width || 
                 y1 + h1 <= building.y || 
                 y1 >= building.y + building.height);
    }
    
    /**
     * 尝试建造建筑
     */
    tryBuild(buildingType, x, y) {
        const config = CONFIG.BUILDINGS[buildingType];
        
        // 检查资金
        if (!this.economy.canAfford(config.cost)) {
            this.showToast('资金不足！');
            return false;
        }
        
        // 检查电力
        if (config.power < 0 && this.economy.power + config.power < 0) {
            this.showToast('电力不足！');
            return false;
        }
        
        // 检查建造位置（包括重叠检查）
        if (!this.canBuildAt(buildingType, x, y)) {
            this.showToast('无法在此位置建造！');
            return false;
        }
        
        // 扣除资金
        this.economy.spend(config.cost);
        
        // 创建建筑
        const building = new Building(buildingType, x, y, this.playerFaction, this.playerId);
        this.buildings.push(building);
        
        this.showToast(`开始建造 ${config.name}`);
        return true;
    }
    
    /**
     * 生产单位
     */
    spawnUnit(unitType, building) {
        const center = building.getCenter();
        const unit = new Unit(unitType, center.x, center.y + 2, this.playerFaction, this.playerId);
        
        // 如果有集结点，移动到集结点
        if (building.rallyPoint) {
            unit.moveTo(building.rallyPoint.x, building.rallyPoint.y, this.map);
        }
        
        this.units.push(unit);
    }
    
    /**
     * 处理点击
     */
    handleClick(worldX, worldY) {
        const gridX = Math.floor(worldX / CONFIG.MAP.TILE_SIZE);
        const gridY = Math.floor(worldY / CONFIG.MAP.TILE_SIZE);
        
        // 如果有选中的可移动单位，点击地面移动
        if (this.selectedUnits.length > 0 && this.selectedUnits.every(u => u.config.type === 'infantry' || u.config.type === 'vehicle')) {
            // 检查是否点击了敌人
            let clickedEnemy = false;
            
            for (const unit of this.units) {
                if (unit.containsPoint(gridX, gridY) && unit.playerId !== this.playerId) {
                    this.orderAttack(gridX, gridY);
                    clickedEnemy = true;
                    break;
                }
            }
            
            for (const building of this.buildings) {
                if (building.containsPoint(gridX, gridY) && building.playerId !== this.playerId) {
                    this.orderAttack(gridX, gridY);
                    clickedEnemy = true;
                    break;
                }
            }
            
            if (!clickedEnemy) {
                // 移动到点击位置
                this.orderMove(gridX, gridY);
                this.showMoveIndicator(worldX, worldY);
            }
            return;
        }
        
        // 清除选中
        this.clearSelection();
        
        // 检查是否点击了建筑
        for (const building of this.buildings) {
            if (building.containsPoint(gridX, gridY)) {
                this.selectBuilding(building);
                return;
            }
        }
        
        // 检查是否点击了单位
        for (const unit of this.units) {
            if (unit.containsPoint(gridX, gridY) && unit.playerId === this.playerId) {
                this.selectUnit(unit);
                return;
            }
        }
    }
    
    /**
     * 显示移动指示器
     */
    showMoveIndicator(worldX, worldY) {
        const indicator = document.createElement('div');
        indicator.className = 'move-command-indicator';
        indicator.style.left = (worldX * this.zoom - this.camera.x * this.zoom) + 'px';
        indicator.style.top = (worldY * this.zoom - this.camera.y * this.zoom) + 'px';
        document.getElementById('ui-layer').appendChild(indicator);
        
        setTimeout(() => indicator.remove(), 500);
    }
    
    /**
     * 命令移动
     */
    orderMove(targetX, targetY) {
        for (const unit of this.selectedUnits) {
            unit.moveTo(targetX, targetY, this.map);
        }
    }
    
    /**
     * 命令攻击
     */
    orderAttack(gridX, gridY) {
        // 寻找目标
        let target = null;
        
        // 检查建筑
        for (const building of this.buildings) {
            if (building.containsPoint(gridX, gridY) && building.playerId !== this.playerId) {
                target = building;
                break;
            }
        }
        
        // 检查单位
        if (!target) {
            for (const unit of this.units) {
                if (unit.containsPoint(gridX, gridY) && unit.playerId !== this.playerId) {
                    target = unit;
                    break;
                }
            }
        }
        
        // 命令攻击
        if (target) {
            for (const unit of this.selectedUnits) {
                if (unit.damage > 0) {
                    unit.attackTarget(target);
                }
            }
        } else {
            // 如果没有目标，移动
            this.orderMove(gridX, gridY);
        }
    }
    
    /**
     * 命令维修
     */
    orderRepair(worldX, worldY) {
        const gridX = Math.floor(worldX / CONFIG.MAP.TILE_SIZE);
        const gridY = Math.floor(worldY / CONFIG.MAP.TILE_SIZE);
        
        for (const building of this.buildings) {
            if (building.containsPoint(gridX, gridY) && 
                building.playerId === this.playerId && 
                building.config.canRepair &&
                building.health < building.maxHealth) {
                building.isRepairing = true;
                this.showToast(`正在维修 ${building.name}`);
                break;
            }
        }
    }
    
    /**
     * 命令售卖
     */
    orderSell(worldX, worldY) {
        const gridX = Math.floor(worldX / CONFIG.MAP.TILE_SIZE);
        const gridY = Math.floor(worldY / CONFIG.MAP.TILE_SIZE);
        
        for (let i = this.buildings.length - 1; i >= 0; i--) {
            const building = this.buildings[i];
            if (building.containsPoint(gridX, gridY) && 
                building.playerId === this.playerId && 
                building.config.canSell) {
                // 返还部分资金
                const refund = Math.floor(building.config.cost * CONFIG.ECONOMY.SELL_RATIO);
                this.economy.earn(refund);
                
                // 移除建筑
                this.buildings.splice(i, 1);
                this.showToast(`售卖 ${building.name} 获得 $${refund}`);
                break;
            }
        }
    }
    
    /**
     * 设置缩放
     */
    setZoom(zoom) {
        this.zoom = zoom;
    }
    
    /**
     * 选择单位
     */
    selectUnit(unit, clear = true) {
        if (clear) {
            this.clearSelection();
        }
        
        unit.selected = true;
        this.selectedUnits.push(unit);
        this.updateSelectionPanel();
    }
    
    /**
     * 选择建筑
     */
    selectBuilding(building) {
        this.clearSelection();
        
        building.selected = true;
        this.selectedBuilding = building;
        this.updateSelectionPanel();
    }
    
    /**
     * 框选单位
     */
    selectUnitsInRect(x1, y1, x2, y2) {
        this.clearSelection();
        
        const minX = Math.min(x1, x2) / CONFIG.MAP.TILE_SIZE;
        const maxX = Math.max(x1, x2) / CONFIG.MAP.TILE_SIZE;
        const minY = Math.min(y1, y2) / CONFIG.MAP.TILE_SIZE;
        const maxY = Math.max(y1, y2) / CONFIG.MAP.TILE_SIZE;
        
        for (const unit of this.units) {
            if (unit.playerId === this.playerId &&
                unit.x >= minX && unit.x <= maxX &&
                unit.y >= minY && unit.y <= maxY) {
                this.selectUnit(unit, false);
            }
        }
    }
    
    /**
     * 清除选择
     */
    clearSelection() {
        for (const unit of this.selectedUnits) {
            unit.selected = false;
        }
        this.selectedUnits = [];
        
        if (this.selectedBuilding) {
            this.selectedBuilding.selected = false;
            this.selectedBuilding = null;
        }
        
        this.updateSelectionPanel();
    }
    
    /**
     * 更新选中面板
     */
    updateSelectionPanel() {
        const panel = document.getElementById('selection-panel');
        const info = document.getElementById('selection-info');
        const actions = document.getElementById('action-buttons');
        
        if (this.selectedUnits.length === 0 && !this.selectedBuilding) {
            panel.classList.add('hidden');
            return;
        }
        
        panel.classList.remove('hidden');
        
        if (this.selectedBuilding) {
            // 显示建筑信息
            info.innerHTML = `
                <div style="display:flex;align-items:center;gap:10px;">
                    <span style="font-size:30px;">${this.selectedBuilding.icon}</span>
                    <div>
                        <div style="font-weight:bold;">${this.selectedBuilding.name}</div>
                        <div style="font-size:12px;color:#aaa;">
                            生命值: ${Math.floor(this.selectedBuilding.health)}/${this.selectedBuilding.maxHealth}
                            ${this.selectedBuilding.isRepairing ? ' <span style="color:#0af;">维修中...</span>' : ''}
                        </div>
                    </div>
                </div>
            `;
            
            // 显示建筑操作按钮
            actions.innerHTML = '';
            
            // 维修按钮
            if (this.selectedBuilding.config.canRepair && 
                this.selectedBuilding.health < this.selectedBuilding.maxHealth) {
                const repairBtn = document.createElement('button');
                repairBtn.className = 'action-btn repair';
                repairBtn.textContent = '🔧 维修';
                repairBtn.onclick = () => {
                    this.selectedBuilding.isRepairing = true;
                    this.showToast('开始维修');
                };
                actions.appendChild(repairBtn);
            }
            
            // 售卖按钮
            if (this.selectedBuilding.config.canSell) {
                const sellBtn = document.createElement('button');
                sellBtn.className = 'action-btn sell';
                const refund = Math.floor(this.selectedBuilding.config.cost * CONFIG.ECONOMY.SELL_RATIO);
                sellBtn.textContent = `💰 售卖 ($${refund})`;
                sellBtn.onclick = () => {
                    this.orderSell(
                        this.selectedBuilding.x * CONFIG.MAP.TILE_SIZE,
                        this.selectedBuilding.y * CONFIG.MAP.TILE_SIZE
                    );
                    this.clearSelection();
                };
                actions.appendChild(sellBtn);
            }
            
            // 如果是兵营或战车工厂，显示生产按钮
            if (this.selectedBuilding.type === 'barracks' || this.selectedBuilding.type === 'war_factory') {
                const unitTypes = this.selectedBuilding.type === 'barracks' 
                    ? ['engineer', 'spy', this.playerFaction === 'soviet' ? 'conscript' : 'gi', 'attack_dog']
                    : ['rhino_tank', 'flak_track'];
                
                for (const unitType of unitTypes) {
                    const unitConfig = CONFIG.UNITS[unitType];
                    if (unitConfig) {
                        const btn = document.createElement('button');
                        btn.className = 'action-btn';
                        btn.innerHTML = `${unitConfig.icon} ${unitConfig.name}<br/>$${unitConfig.cost}`;
                        btn.onclick = () => {
                            if (this.economy.canAfford(unitConfig.cost)) {
                                this.economy.spend(unitConfig.cost);
                                this.selectedBuilding.startProduction(unitType);
                            } else {
                                this.showToast('资金不足！');
                            }
                        };
                        actions.appendChild(btn);
                    }
                }
            }
        } else if (this.selectedUnits.length > 0) {
            // 显示单位信息
            const unit = this.selectedUnits[0];
            info.innerHTML = `
                <div style="display:flex;align-items:center;gap:10px;">
                    <span style="font-size:30px;">${unit.icon}</span>
                    <div>
                        <div style="font-weight:bold;">${unit.name} ${this.selectedUnits.length > 1 ? `x${this.selectedUnits.length}` : ''}</div>
                        <div style="font-size:12px;color:#aaa;">
                            等级: ${unit.getTotalLevel()} | 生命: ${Math.floor(unit.health)}/${unit.maxHealth}
                        </div>
                    </div>
                </div>
            `;
            
            actions.innerHTML = '';
            
            // 停止按钮
            const stopBtn = document.createElement('button');
            stopBtn.className = 'action-btn';
            stopBtn.textContent = '⏹️ 停止';
            stopBtn.onclick = () => {
                for (const u of this.selectedUnits) {
                    u.stop();
                }
            };
            actions.appendChild(stopBtn);
            
            // 工程师占领按钮
            if (unit.config.canCapture) {
                const btn = document.createElement('button');
                btn.className = 'action-btn';
                btn.textContent = '🏁 占领';
                actions.appendChild(btn);
            }
            
            // 间谍伪装按钮
            if (unit.config.canDisguise) {
                const btn = document.createElement('button');
                btn.className = 'action-btn';
                btn.textContent = '🎭 伪装';
                btn.onclick = () => {
                    const enemyFaction = this.playerFaction === 'soviet' ? 'allied' : 'soviet';
                    unit.disguise(enemyFaction);
                    this.showToast('已伪装成敌方单位');
                };
                actions.appendChild(btn);
            }
        }
    }
    
    /**
     * 显示Toast提示
     */
    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.remove(), 2000);
    }
    
    /**
     * 更新UI
     */
    updateUI() {
        // 更新资源显示
        document.getElementById('money').textContent = this.economy.money;
        document.getElementById('power').textContent = this.economy.power;
        document.getElementById('power-max').textContent = this.economy.powerMax;
        
        // 更新电力颜色
        const powerElement = document.getElementById('power');
        if (this.economy.power < 0) {
            powerElement.style.color = '#f00';
        } else {
            powerElement.style.color = '#ffd700';
        }
    }
    
    /**
     * 检查游戏结束
     */
    checkGameOver() {
        const playerBuildings = this.buildings.filter(b => b.playerId === this.playerId);
        const playerConstructionYard = playerBuildings.find(b => b.type === 'construction_yard');
        
        if (!playerConstructionYard) {
            this.gameOver(false);
        }
        
        // 检查AI是否被击败
        let allAIDefeated = true;
        for (const ai of this.aiPlayers) {
            const aiBuildings = this.buildings.filter(b => b.playerId === ai.id);
            const aiConstructionYard = aiBuildings.find(b => b.type === 'construction_yard');
            
            if (aiConstructionYard) {
                allAIDefeated = false;
                break;
            }
        }
        
        if (allAIDefeated && this.aiPlayers.length > 0) {
            this.gameOver(true);
        }
    }
    
    /**
     * 游戏结束
     */
    gameOver(victory) {
        this.isRunning = false;
        
        const gameOverDiv = document.getElementById('game-over');
        const title = document.getElementById('game-over-title');
        const message = document.getElementById('game-over-message');
        
        gameOverDiv.classList.remove('hidden');
        
        if (victory) {
            title.textContent = '胜利！';
            title.style.color = '#0f0';
            message.textContent = '你成功击败了敌人！';
        } else {
            title.textContent = '失败';
            title.style.color = '#f00';
            message.textContent = '你的基地被摧毁了。';
        }
    }
    
    /**
     * 保存游戏
     */
    saveGame() {
        const saveData = {
            playerId: this.playerId,
            playerFaction: this.playerFaction,
            map: this.map.serialize(),
            fog: this.fog.serialize(),
            buildings: this.buildings.map(b => b.serialize()),
            units: this.units.map(u => u.serialize()),
            economy: this.economy.serialize(),
            camera: this.camera,
            zoom: this.zoom,
            settings: this.settings,
            timestamp: Date.now()
        };
        
        localStorage.setItem('redAlertSave', JSON.stringify(saveData));
        this.showToast('游戏已保存！');
    }
    
    /**
     * 加载游戏
     */
    loadGame() {
        const saveData = JSON.parse(localStorage.getItem('redAlertSave'));
        if (!saveData) {
            this.showToast('没有找到存档！');
            return false;
        }
        
        this.playerId = saveData.playerId;
        this.playerFaction = saveData.playerFaction;
        this.map = GameMap.deserialize(saveData.map);
        this.fog = FogOfWar.deserialize(saveData.fog);
        this.buildings = saveData.buildings.map(b => Building.deserialize(b));
        this.units = saveData.units.map(u => Unit.deserialize(u));
        this.economy = Economy.deserialize(saveData.economy);
        this.camera = saveData.camera;
        this.zoom = saveData.zoom || 1;
        this.settings = saveData.settings || this.settings;
        
        this.input = new InputHandler(this);
        this.renderer = new Renderer(this.canvas, this);
        
        this.isRunning = true;
        this.lastTime = performance.now();
        requestAnimationFrame(this.gameLoop.bind(this));
        
        this.showToast('游戏已加载！');
        return true;
    }
    
    /**
     * 退出游戏
     */
    exitGame() {
        this.isRunning = false;
        document.getElementById('start-menu').classList.remove('hidden');
        document.getElementById('game-over').classList.add('hidden');
    }
    
    /**
     * 暂停/继续
     */
    togglePause() {
        this.isPaused = !this.isPaused;
    }
}

// 导出游戏类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Game;
}
