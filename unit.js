/**
 * 红色警戒：共和国之辉 - 单位系统 v2.0
 */

class Unit {
    constructor(type, x, y, faction, playerId) {
        this.id = Utils.generateId();
        this.type = type;
        this.x = x;
        this.y = y;
        this.faction = faction;
        this.playerId = playerId;
        
        const config = CONFIG.UNITS[type];
        this.config = config;
        this.name = config.name;
        this.maxHealth = config.health;
        this.health = config.health;
        
        // 采矿车速度提升
        this.speed = config.canHarvest ? CONFIG.HARVESTER.SPEED : config.speed;
        
        this.damage = config.damage || 0;
        this.range = config.range || 0;
        this.icon = config.icon;
        this.unitType = config.type;
        
        // 移动
        this.targetX = x;
        this.targetY = y;
        this.path = [];
        this.isMoving = false;
        this.moveProgress = 0;
        
        // 攻击
        this.targetUnit = null;
        this.targetBuilding = null;
        this.attackCooldown = 0;
        this.attackCooldownMax = 1;
        
        // 升级系统
        this.battleLevel = 0;
        this.spyLevel = 0;
        this.xp = 0;
        
        // 特殊能力
        this.isDisguised = false;
        this.disguisedAs = null;
        this.isCamouflaged = false;
        
        // 采矿
        this.isHarvesting = false;
        this.oreCarried = 0;
        this.harvestTarget = null;
        this.autoSearchOre = config.canHarvest && CONFIG.HARVESTER.AUTO_SEARCH;
        
        // 状态
        this.selected = false;
        
        // 动画
        this.facing = 0;
        this.animFrame = 0;
    }
    
    /**
     * 更新单位
     */
    update(deltaTime, gameMap, enemyUnits, enemyBuildings, allyBuildings) {
        // 更新攻击冷却
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }
        
        // 移动
        if (this.isMoving && this.path.length > 0) {
            this.updateMovement(deltaTime, gameMap);
        }
        
        // 攻击
        if (this.targetUnit || this.targetBuilding) {
            this.updateAttack(deltaTime);
        }
        
        // 采矿
        if (this.config.canHarvest && this.isHarvesting) {
            return this.updateHarvesting(deltaTime, gameMap, allyBuildings);
        }
        
        // 动画
        this.animFrame += deltaTime * 10;
        
        return null;
    }
    
    /**
     * 更新移动
     */
    updateMovement(deltaTime, gameMap) {
        if (this.path.length === 0) {
            this.isMoving = false;
            return;
        }
        
        const nextNode = this.path[0];
        const dx = nextNode.x - this.x;
        const dy = nextNode.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 0.1) {
            this.x = nextNode.x;
            this.y = nextNode.y;
            this.path.shift();
            
            if (this.path.length === 0) {
                this.isMoving = false;
            }
            return;
        }
        
        // 计算移动速度
        const levelMultiplier = 1 + this.battleLevel * 0.1;
        const moveSpeed = this.speed * levelMultiplier * deltaTime;
        
        this.x += (dx / dist) * moveSpeed;
        this.y += (dy / dist) * moveSpeed;
        
        this.facing = Math.atan2(dy, dx);
    }
    
    /**
     * 更新攻击
     */
    updateAttack(deltaTime) {
        let targetX, targetY;
        let target = null;
        
        if (this.targetUnit) {
            targetX = this.targetUnit.x;
            targetY = this.targetUnit.y;
            target = this.targetUnit;
        } else if (this.targetBuilding) {
            const center = this.targetBuilding.getCenter();
            targetX = center.x;
            targetY = center.y;
            target = this.targetBuilding;
        } else {
            return;
        }
        
        const dist = Utils.distance(this.x, this.y, targetX, targetY);
        
        // 检查目标是否死亡/被摧毁
        if (target.health <= 0) {
            this.targetUnit = null;
            this.targetBuilding = null;
            return;
        }
        
        // 如果在攻击范围内
        if (dist <= this.range) {
            this.isMoving = false;
            this.path = [];
            
            if (this.attackCooldown <= 0) {
                this.attack(target);
                this.attackCooldown = this.attackCooldownMax;
            }
        } else {
            // 追击目标
            if (!this.isMoving || this.path.length === 0) {
                this.moveTo(targetX, targetY);
            }
        }
    }
    
    /**
     * 执行攻击
     */
    attack(target) {
        const levelMultiplier = 1 + this.battleLevel * 0.2;
        const totalDamage = this.damage * levelMultiplier;
        
        const destroyed = target.takeDamage(totalDamage);
        
        // 获得经验
        if (destroyed) {
            this.gainXP(CONFIG.UPGRADE.XP_PER_KILL);
            this.targetUnit = null;
            this.targetBuilding = null;
        }
    }
    
    /**
     * 更新采矿
     */
    updateHarvesting(deltaTime, gameMap, allyBuildings) {
        // 如果满载，返回矿厂
        if (this.oreCarried >= CONFIG.ECONOMY.HARVESTER_CAPACITY) {
            const refinery = this.findNearestRefinery(allyBuildings);
            if (refinery) {
                const center = refinery.getCenter();
                if (Utils.distance(this.x, this.y, center.x, center.y) < 2) {
                    // 卸载矿石
                    const deposit = this.oreCarried;
                    this.oreCarried = 0;
                    
                    // 自动寻找下一个矿点
                    this.autoSearchOre = true;
                    
                    return { type: 'oreDeposited', amount: deposit };
                } else {
                    this.moveTo(center.x, center.y);
                }
            }
        } else {
            // 寻找矿石
            const ore = gameMap.getNearestOre(this.x, this.y);
            if (ore) {
                const centerX = ore.x + ore.size / 2;
                const centerY = ore.y + ore.size / 2;
                
                if (Utils.distance(this.x, this.y, centerX, centerY) < 2) {
                    // 采集矿石
                    const harvested = gameMap.harvestOre(Math.floor(this.x), Math.floor(this.y), 10);
                    this.oreCarried += harvested;
                } else {
                    this.moveTo(centerX, centerY);
                }
            }
        }
        
        return null;
    }
    
    /**
     * 移动到指定位置
     */
    moveTo(x, y, gameMap = null) {
        this.targetX = x;
        this.targetY = y;
        this.targetUnit = null;
        this.targetBuilding = null;
        
        if (gameMap) {
            this.path = Utils.findPath(
                Math.floor(this.x), 
                Math.floor(this.y), 
                Math.floor(x), 
                Math.floor(y), 
                gameMap
            );
        }
        
        this.isMoving = this.path && this.path.length > 0;
    }
    
    /**
     * 攻击目标
     */
    attackTarget(target) {
        if (target instanceof Unit) {
            this.targetUnit = target;
            this.targetBuilding = null;
        } else {
            this.targetUnit = null;
            this.targetBuilding = target;
        }
        
        this.isHarvesting = false;
    }
    
    /**
     * 停止
     */
    stop() {
        this.isMoving = false;
        this.path = [];
        this.targetUnit = null;
        this.targetBuilding = null;
        this.isHarvesting = false;
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
     * 治疗
     */
    heal(amount) {
        this.health = Math.min(this.health + amount, this.maxHealth);
    }
    
    /**
     * 获得经验
     */
    gainXP(amount) {
        this.xp += amount;
        
        // 检查升级
        for (let i = this.battleLevel + 1; i < CONFIG.UPGRADE.LEVEL_THRESHOLDS.length; i++) {
            if (this.xp >= CONFIG.UPGRADE.LEVEL_THRESHOLDS[i]) {
                this.battleLevel = i;
            }
        }
    }
    
    /**
     * 间谍窃取升级
     */
    spyInfiltrate(buildingType) {
        if (this.spyLevel < CONFIG.UPGRADE.MAX_SPY_LEVEL) {
            this.spyLevel++;
            return true;
        }
        return false;
    }
    
    /**
     * 伪装
     */
    disguise(enemyFaction) {
        if (this.config.canDisguise) {
            this.isDisguised = true;
            this.disguisedAs = enemyFaction;
            return true;
        }
        return false;
    }
    
    /**
     * 检查是否被狗发现
     */
    canBeDetectedByDog(dog) {
        if (!this.isDisguised) return false;
        const dist = Utils.distance(this.x, this.y, dog.x, dog.y);
        return dist <= 3;
    }
    
    /**
     * 寻找最近的矿厂
     */
    findNearestRefinery(buildings) {
        let nearest = null;
        let minDist = Infinity;
        
        for (const building of buildings) {
            if (building.type === 'ore_refinery' && building.playerId === this.playerId) {
                const center = building.getCenter();
                const dist = Utils.distance(this.x, this.y, center.x, center.y);
                if (dist < minDist) {
                    minDist = dist;
                    nearest = building;
                }
            }
        }
        
        return nearest;
    }
    
    /**
     * 获取总等级
     */
    getTotalLevel() {
        return this.battleLevel + this.spyLevel;
    }
    
    /**
     * 检查点是否在单位附近
     */
    containsPoint(x, y) {
        const dist = Utils.distance(this.x, this.y, x, y);
        return dist < 1;
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
            battleLevel: this.battleLevel,
            spyLevel: this.spyLevel,
            xp: this.xp,
            isDisguised: this.isDisguised,
            oreCarried: this.oreCarried,
            autoSearchOre: this.autoSearchOre
        };
    }
    
    /**
     * 反序列化
     */
    static deserialize(data) {
        const unit = new Unit(data.type, data.x, data.y, data.faction, data.playerId);
        unit.id = data.id;
        unit.health = data.health;
        unit.battleLevel = data.battleLevel || 0;
        unit.spyLevel = data.spyLevel || 0;
        unit.xp = data.xp || 0;
        unit.isDisguised = data.isDisguised || false;
        unit.oreCarried = data.oreCarried || 0;
        unit.autoSearchOre = data.autoSearchOre !== false;
        return unit;
    }
}

// 导出单位类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Unit;
}
