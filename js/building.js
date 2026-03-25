/**
 * 红色警戒：共和国之辉 - 建筑系统
 */

class Building {
    constructor(type, x, y, faction, playerId) {
        this.id = Utils.generateId();
        this.type = type;
        this.x = x;
        this.y = y;
        this.faction = faction;
        this.playerId = playerId;
        
        const config = CONFIG.BUILDINGS[type];
        this.config = config;
        this.name = config.name;
        this.width = config.size.w;
        this.height = config.size.h;
        this.maxHealth = config.health;
        this.health = config.health;
        this.power = config.power;
        this.icon = config.icon;
        
        this.buildProgress = 0;
        this.buildTime = config.buildTime;
        this.isComplete = config.buildTime === 0;
        this.isBuilding = !this.isComplete;
        
        this.selected = false;
        this.productionQueue = [];
        this.rallyPoint = null;
    }
    
    /**
     * 更新建筑
     */
    update(deltaTime) {
        // 建造进度
        if (this.isBuilding) {
            this.buildProgress += deltaTime;
            if (this.buildProgress >= this.buildTime) {
                this.isBuilding = false;
                this.isComplete = true;
                this.buildProgress = this.buildTime;
            }
        }
        
        // 生产队列
        if (this.productionQueue.length > 0 && this.isComplete) {
            const item = this.productionQueue[0];
            item.progress += deltaTime;
            
            if (item.progress >= item.buildTime) {
                this.productionQueue.shift();
                return { type: 'productionComplete', unitType: item.unitType };
            }
        }
        
        return null;
    }
    
    /**
     * 开始生产单位
     */
    startProduction(unitType) {
        const unitConfig = CONFIG.UNITS[unitType];
        if (!unitConfig) return false;
        
        this.productionQueue.push({
            unitType,
            progress: 0,
            buildTime: unitConfig.buildTime
        });
        
        return true;
    }
    
    /**
     * 取消生产
     */
    cancelProduction(index) {
        if (index >= 0 && index < this.productionQueue.length) {
            this.productionQueue.splice(index, 1);
            return true;
        }
        return false;
    }
    
    /**
     * 受到伤害
     */
    takeDamage(damage) {
        this.health -= damage;
        if (this.health < 0) this.health = 0;
        return this.health <= 0;
    }
    
    /**
     * 修复
     */
    repair(amount) {
        this.health = Math.min(this.health + amount, this.maxHealth);
    }
    
    /**
     * 占领
     */
    capture(newFaction, newPlayerId) {
        this.faction = newFaction;
        this.playerId = newPlayerId;
        this.health = this.maxHealth * 0.5; // 占领后半血
    }
    
    /**
     * 检查点是否在建筑内
     */
    containsPoint(x, y) {
        return x >= this.x && x < this.x + this.width &&
               y >= this.y && y < this.y + this.height;
    }
    
    /**
     * 获取中心点
     */
    getCenter() {
        return {
            x: this.x + this.width / 2,
            y: this.y + this.height / 2
        };
    }
    
    /**
     * 获取建造进度百分比
     */
    getBuildPercent() {
        if (this.buildTime === 0) return 100;
        return Math.floor((this.buildProgress / this.buildTime) * 100);
    }
    
    /**
     * 获取生产进度百分比
     */
    getProductionPercent() {
        if (this.productionQueue.length === 0) return 0;
        const item = this.productionQueue[0];
        return Math.floor((item.progress / item.buildTime) * 100);
    }
    
    /**
     * 序列化
     */
    serialize() {
        return {
            id: this.id,
            type: this.type,
            x: this.x,
            y: this.y,
            faction: this.faction,
            playerId: this.playerId,
            health: this.health,
            buildProgress: this.buildProgress,
            isComplete: this.isComplete,
            productionQueue: this.productionQueue,
            rallyPoint: this.rallyPoint
        };
    }
    
    /**
     * 反序列化
     */
    static deserialize(data) {
        const building = new Building(data.type, data.x, data.y, data.faction, data.playerId);
        building.id = data.id;
        building.health = data.health;
        building.buildProgress = data.buildProgress;
        building.isComplete = data.isComplete;
        building.isBuilding = !data.isComplete;
        building.productionQueue = data.productionQueue || [];
        building.rallyPoint = data.rallyPoint;
        return building;
    }
}

// 导出建筑类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Building;
}
