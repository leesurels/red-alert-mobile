/**
 * 红色警戒：共和国之辉 - 游戏主逻辑
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
    }
    
    /**
     * 初始化游戏
     */
    init(faction = 'soviet') {
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
        this.createAI();
        
        // 更新UI
        this.updateUI();
        
        // 开始游戏循环
        this.isRunning = true;
        this.lastTime = performance.now();
        requestAnimationFrame(this.gameLoop.bind(this));
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
        
        // 采矿车
        const harvester = new Unit('harvester', x - 2, y + 5, this.playerFaction, this.playerId);
        harvester.isHarvesting = true;
        this.units.push(harvester);
    }
    
    /**
     * 创建AI
     */
    createAI() {
        const aiFaction = this.playerFaction === 'soviet' ? 'allied' : 'soviet';
        const ai = new GameAI('ai1', aiFaction, this);
        this.aiPlayers.push(ai);
        
        // AI出生点
        const aiSpawn = this.map.getRandomSpawnPoint();
        ai.init(aiSpawn.x, aiSpawn.y);
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
     * 渲染
     */
    render() {
        this.renderer.render();
    }
    
    /**
     * 尝试建造建筑
     */
    tryBuild(buildingType, x, y) {
        const config = CONFIG.BUILDINGS[buildingType];
        
        // 检查资金
        if (!this.economy.canAfford(config.cost)) {
            alert('资金不足！');
            return false;
        }
        
        // 检查电力
        if (config.power < 0 && this.economy.power + config.power < 0) {
            alert('电力不足！');
            return false;
        }
        
        // 检查建造位置
        const playerBuildings = this.buildings.filter(b => b.playerId === this.playerId);
        if (!this.map.canBuild(x, y, config.size.w, config.size.h, playerBuildings)) {
            alert('无法在此位置建造！');
            return false;
        }
        
        // 扣除资金
        this.economy.spend(config.cost);
        
        // 创建建筑
        const building = new Building(buildingType, x, y, this.playerFaction, this.playerId);
        this.buildings.push(building);
        
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
     * 处理双击
     */
    handleDoubleClick(worldX, worldY) {
        const gridX = Math.floor(worldX / CONFIG.MAP.TILE_SIZE);
        const gridY = Math.floor(worldY / CONFIG.MAP.TILE_SIZE);
        
        // 选中同类型的所有单位
        const clickedUnit = this.units.find(u => u.containsPoint(gridX, gridY));
        if (clickedUnit && clickedUnit.playerId === this.playerId) {
            const sameType = this.units.filter(u => 
                u.type === clickedUnit.type && 
                u.playerId === this.playerId &&
                Utils.distance(u.x, u.y, clickedUnit.x, clickedUnit.y) < 10
            );
            
            this.clearSelection();
            for (const unit of sameType) {
                this.selectUnit(unit, false);
            }
        }
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
                        </div>
                    </div>
                </div>
            `;
            
            // 显示建筑操作按钮
            actions.innerHTML = '';
            
            // 如果是兵营或战车工厂，显示生产按钮
            if (this.selectedBuilding.type === 'barracks' || this.selectedBuilding.type === 'war_factory') {
                const unitTypes = this.selectedBuilding.type === 'barracks' 
                    ? ['engineer', 'spy', this.playerFaction === 'soviet' ? 'conscript' : 'gi', 'attack_dog']
                    : ['rhino_tank', 'flak_track'];
                
                for (const unitType of unitTypes) {
                    const config = CONFIG.UNITS[unitType];
                    if (config) {
                        const btn = document.createElement('button');
                        btn.className = 'action-btn';
                        btn.innerHTML = `${config.icon} ${config.name}<br/>$${config.cost}`;
                        btn.onclick = () => {
                            if (this.economy.canAfford(config.cost)) {
                                this.economy.spend(config.cost);
                                this.selectedBuilding.startProduction(unitType);
                            } else {
                                alert('资金不足！');
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
            
            // 工程师占领按钮
            if (unit.config.canCapture) {
                const btn = document.createElement('button');
                btn.className = 'action-btn';
                btn.textContent = '🏁 占领';
                btn.onclick = () => {
                    // 工程师自动寻找附近敌方建筑
                    for (const building of this.buildings) {
                        if (building.playerId !== this.playerId) {
                            const center = building.getCenter();
                            if (Utils.distance(unit.x, unit.y, center.x, center.y) < 2) {
                                building.capture(this.playerFaction, this.playerId);
                                break;
                            }
                        }
                    }
                };
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
                };
                actions.appendChild(btn);
            }
        }
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
        for (const ai of this.aiPlayers) {
            const aiBuildings = this.buildings.filter(b => b.playerId === ai.id);
            const aiConstructionYard = aiBuildings.find(b => b.type === 'construction_yard');
            
            if (!aiConstructionYard) {
                this.gameOver(true);
            }
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
     * 暂停/继续
     */
    togglePause() {
        this.isPaused = !this.isPaused;
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
            camera: this.camera
        };
        
        localStorage.setItem('redAlertSave', JSON.stringify(saveData));
        alert('游戏已保存！');
    }
    
    /**
     * 加载游戏
     */
    loadGame() {
        const saveData = JSON.parse(localStorage.getItem('redAlertSave'));
        if (!saveData) {
            alert('没有找到存档！');
            return;
        }
        
        this.playerId = saveData.playerId;
        this.playerFaction = saveData.playerFaction;
        this.map = GameMap.deserialize(saveData.map);
        this.fog = FogOfWar.deserialize(saveData.fog);
        this.buildings = saveData.buildings.map(b => Building.deserialize(b));
        this.units = saveData.units.map(u => Unit.deserialize(u));
        this.economy = Economy.deserialize(saveData.economy);
        this.camera = saveData.camera;
        
        this.input = new InputHandler(this);
        this.renderer = new Renderer(this.canvas, this);
        
        this.isRunning = true;
        this.lastTime = performance.now();
        requestAnimationFrame(this.gameLoop.bind(this));
    }
}

// 导出游戏类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Game;
}
