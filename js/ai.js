/**
 * 红色警戒：共和国之辉 - AI系统
 */

class GameAI {
    constructor(id, faction, game) {
        this.id = id;
        this.faction = faction;
        this.game = game;
        
        this.buildings = [];
        this.units = [];
        this.economy = new Economy(id);
        
        this.thinkTimer = 0;
        this.thinkInterval = 2; // 每2秒思考一次
        
        this.state = 'expanding'; // expanding, attacking, defending
    }
    
    /**
     * 初始化AI
     */
    init(x, y) {
        // 创建初始建筑
        this.createStartingBuildings(x, y);
    }
    
    /**
     * 创建初始建筑
     */
    createStartingBuildings(x, y) {
        // 建造厂
        const constructionYard = new Building('construction_yard', x, y, this.faction, this.id);
        this.game.buildings.push(constructionYard);
        this.buildings.push(constructionYard);
        
        // 发电厂
        const powerPlant = new Building('power_plant', x + 4, y, this.faction, this.id);
        powerPlant.isComplete = true;
        powerPlant.isBuilding = false;
        this.game.buildings.push(powerPlant);
        this.buildings.push(powerPlant);
        
        // 矿厂
        const refinery = new Building('ore_refinery', x, y + 4, this.faction, this.id);
        refinery.isComplete = true;
        refinery.isBuilding = false;
        this.game.buildings.push(refinery);
        this.buildings.push(refinery);
        
        // 兵营
        const barracks = new Building('barracks', x + 4, y + 3, this.faction, this.id);
        barracks.isComplete = true;
        barracks.isBuilding = false;
        this.game.buildings.push(barracks);
        this.buildings.push(barracks);
        
        // 初始单位
        const infantryType = this.faction === 'soviet' ? 'conscript' : 'gi';
        for (let i = 0; i < 4; i++) {
            const soldier = new Unit(infantryType, x + 1 + i, y + 7, this.faction, this.id);
            this.game.units.push(soldier);
            this.units.push(soldier);
        }
        
        // 采矿车
        const harvester = new Unit('harvester', x - 2, y + 5, this.faction, this.id);
        harvester.isHarvesting = true;
        this.game.units.push(harvester);
        this.units.push(harvester);
    }
    
    /**
     * 更新AI
     */
    update(deltaTime) {
        this.thinkTimer += deltaTime;
        
        if (this.thinkTimer >= this.thinkInterval) {
            this.thinkTimer = 0;
            this.think();
        }
        
        // 更新建筑引用
        this.buildings = this.game.buildings.filter(b => b.playerId === this.id);
        this.units = this.game.units.filter(u => u.playerId === this.id);
        
        // 更新经济
        this.economy.update(this.buildings);
    }
    
    /**
     * AI思考
     */
    think() {
        // 检查是否需要建造
        this.checkBuildings();
        
        // 检查是否需要生产单位
        this.checkProduction();
        
        // 控制单位
        this.controlUnits();
    }
    
    /**
     * 检查建筑需求
     */
    checkBuildings() {
        const hasPower = this.buildings.some(b => b.type === 'power_plant' && b.isComplete);
        const hasRefinery = this.buildings.some(b => b.type === 'ore_refinery' && b.isComplete);
        const hasBarracks = this.buildings.some(b => b.type === 'barracks' && b.isComplete);
        const hasWarFactory = this.buildings.some(b => b.type === 'war_factory' && b.isComplete);
        
        // 优先建造电力
        if (!hasPower && this.economy.canAfford(CONFIG.BUILDINGS.power_plant.cost)) {
            this.tryBuild('power_plant');
            return;
        }
        
        // 建造矿厂
        if (!hasRefinery && this.economy.canAfford(CONFIG.BUILDINGS.ore_refinery.cost)) {
            this.tryBuild('ore_refinery');
            return;
        }
        
        // 建造兵营
        if (!hasBarracks && this.economy.canAfford(CONFIG.BUILDINGS.barracks.cost)) {
            this.tryBuild('barracks');
            return;
        }
        
        // 建造战车工厂
        if (!hasWarFactory && this.economy.canAfford(CONFIG.BUILDINGS.war_factory.cost)) {
            this.tryBuild('war_factory');
            return;
        }
        
        // 随机建造其他建筑
        if (Math.random() < 0.3) {
            const buildOptions = ['power_plant', 'ore_refinery'];
            const choice = Utils.randomChoice(buildOptions);
            if (this.economy.canAfford(CONFIG.BUILDINGS[choice].cost)) {
                this.tryBuild(choice);
            }
        }
    }
    
    /**
     * 尝试建造
     */
    tryBuild(buildingType) {
        const config = CONFIG.BUILDINGS[buildingType];
        
        // 找到建造厂
        const constructionYard = this.buildings.find(b => b.type === 'construction_yard');
        if (!constructionYard) return false;
        
        const center = constructionYard.getCenter();
        
        // 随机选择建造位置
        for (let i = 0; i < 10; i++) {
            const offsetX = Utils.randomInt(-10, 10);
            const offsetY = Utils.randomInt(-10, 10);
            const x = Math.floor(center.x + offsetX);
            const y = Math.floor(center.y + offsetY);
            
            if (this.game.map.canBuild(x, y, config.size.w, config.size.h, this.buildings)) {
                this.economy.spend(config.cost);
                const building = new Building(buildingType, x, y, this.faction, this.id);
                this.game.buildings.push(building);
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * 检查生产需求
     */
    checkProduction() {
        // 生产步兵
        const barracks = this.buildings.find(b => b.type === 'barracks' && b.isComplete);
        if (barracks && barracks.productionQueue.length === 0) {
            const infantryType = this.faction === 'soviet' ? 'conscript' : 'gi';
            if (this.economy.canAfford(CONFIG.UNITS[infantryType].cost)) {
                this.economy.spend(CONFIG.UNITS[infantryType].cost);
                barracks.startProduction(infantryType);
            }
        }
        
        // 生产载具
        const warFactory = this.buildings.find(b => b.type === 'war_factory' && b.isComplete);
        if (warFactory && warFactory.productionQueue.length === 0) {
            const vehicleType = this.faction === 'soviet' ? 'rhino_tank' : 'grizzly_tank';
            if (this.economy.canAfford(CONFIG.UNITS[vehicleType].cost)) {
                this.economy.spend(CONFIG.UNITS[vehicleType].cost);
                warFactory.startProduction(vehicleType);
            }
        }
    }
    
    /**
     * 控制单位
     */
    controlUnits() {
        // 寻找玩家单位
        const playerUnits = this.game.units.filter(u => u.playerId !== this.id);
        const playerBuildings = this.game.buildings.filter(b => b.playerId !== this.id);
        
        if (playerUnits.length === 0 && playerBuildings.length === 0) return;
        
        // 控制战斗单位
        for (const unit of this.units) {
            if (unit.damage > 0 && !unit.isMoving && !unit.targetUnit && !unit.targetBuilding) {
                // 寻找最近的目标
                let nearestTarget = null;
                let minDist = Infinity;
                
                // 优先攻击单位
                for (const target of playerUnits) {
                    const dist = Utils.distance(unit.x, unit.y, target.x, target.y);
                    if (dist < minDist && dist < 30) {
                        minDist = dist;
                        nearestTarget = target;
                    }
                }
                
                // 如果没有找到单位，攻击建筑
                if (!nearestTarget) {
                    for (const target of playerBuildings) {
                        const center = target.getCenter();
                        const dist = Utils.distance(unit.x, unit.y, center.x, center.y);
                        if (dist < minDist && dist < 30) {
                            minDist = dist;
                            nearestTarget = target;
                        }
                    }
                }
                
                // 攻击或移动
                if (nearestTarget) {
                    if (minDist <= unit.range) {
                        unit.attackTarget(nearestTarget);
                    } else {
                        const targetX = nearestTarget.x || nearestTarget.getCenter().x;
                        const targetY = nearestTarget.y || nearestTarget.getCenter().y;
                        unit.moveTo(targetX, targetY, this.game.map);
                    }
                }
            }
        }
    }
}

// 导出AI类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameAI;
}
