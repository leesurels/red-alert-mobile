/**
 * 红色警戒：共和国之辉 - 地图系统
 */

class GameMap {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.tiles = [];
        this.oreDeposits = [];
        this.obstacles = [];
        
        this.initialize();
    }
    
    /**
     * 初始化地图
     */
    initialize() {
        // 创建基础地形
        for (let y = 0; y < this.height; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.tiles[y][x] = {
                    x,
                    y,
                    type: this.generateTerrain(x, y),
                    elevation: 0,
                    walkable: true,
                    buildable: true
                };
            }
        }
        
        // 生成矿石资源点
        this.generateOreDeposits();
        
        // 生成障碍物（树木、岩石等）
        this.generateObstacles();
    }
    
    /**
     * 生成地形
     */
    generateTerrain(x, y) {
        // 简单的随机地形生成
        const rand = Math.random();
        
        // 边缘生成水域
        if (x < 3 || x >= this.width - 3 || y < 3 || y >= this.height - 3) {
            return 'water';
        }
        
        if (rand < 0.05) return 'water';
        if (rand < 0.15) return 'trees';
        if (rand < 0.20) return 'rocks';
        return 'grass';
    }
    
    /**
     * 生成矿石资源点
     */
    generateOreDeposits() {
        const numDeposits = Math.floor((this.width * this.height) / 200);
        
        for (let i = 0; i < numDeposits; i++) {
            const x = Utils.randomInt(5, this.width - 6);
            const y = Utils.randomInt(5, this.height - 6);
            
            // 创建矿石区域
            const size = Utils.randomInt(3, 6);
            const deposit = {
                x,
                y,
                size,
                amount: size * size * CONFIG.ECONOMY.ORE_CAPACITY,
                maxAmount: size * size * CONFIG.ECONOMY.ORE_CAPACITY
            };
            
            this.oreDeposits.push(deposit);
            
            // 标记矿石格子
            for (let dy = 0; dy < size; dy++) {
                for (let dx = 0; dx < size; dx++) {
                    const tx = x + dx;
                    const ty = y + dy;
                    if (this.isValidPosition(tx, ty)) {
                        this.tiles[ty][tx].type = 'ore';
                        this.tiles[ty][tx].oreAmount = CONFIG.ECONOMY.ORE_CAPACITY;
                        this.tiles[ty][tx].buildable = false;
                    }
                }
            }
        }
    }
    
    /**
     * 生成障碍物
     */
    generateObstacles() {
        const numObstacles = Math.floor((this.width * this.height) / 100);
        
        for (let i = 0; i < numObstacles; i++) {
            const x = Utils.randomInt(3, this.width - 4);
            const y = Utils.randomInt(3, this.height - 4);
            
            if (this.tiles[y][x].type === 'grass') {
                const type = Math.random() < 0.7 ? 'trees' : 'rocks';
                this.tiles[y][x].type = type;
                this.tiles[y][x].walkable = false;
                this.tiles[y][x].buildable = false;
                
                this.obstacles.push({ x, y, type });
            }
        }
    }
    
    /**
     * 检查位置是否有效
     */
    isValidPosition(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }
    
    /**
     * 检查位置是否被阻挡
     */
    isBlocked(x, y) {
        if (!this.isValidPosition(x, y)) return true;
        const tile = this.tiles[y][x];
        return !tile.walkable || tile.type === 'water';
    }
    
    /**
     * 检查是否可以建造
     */
    canBuild(x, y, width, height, existingBuildings) {
        // 检查建筑范围是否有效
        for (let dy = 0; dy < height; dy++) {
            for (let dx = 0; dx < width; dx++) {
                const tx = x + dx;
                const ty = y + dy;
                
                if (!this.isValidPosition(tx, ty)) return false;
                
                const tile = this.tiles[ty][tx];
                if (!tile.buildable) return false;
            }
        }
        
        // 检查是否靠近已有建筑
        if (existingBuildings && existingBuildings.length > 0) {
            let nearBuilding = false;
            
            for (const building of existingBuildings) {
                const dist = Utils.manhattanDistance(
                    x + width / 2, 
                    y + height / 2,
                    building.x + building.width / 2,
                    building.y + building.height / 2
                );
                
                if (dist <= CONFIG.BUILD.POWER_RANGE) {
                    nearBuilding = true;
                    break;
                }
            }
            
            if (!nearBuilding) return false;
        }
        
        return true;
    }
    
    /**
     * 获取格子
     */
    getTile(x, y) {
        if (!this.isValidPosition(x, y)) return null;
        return this.tiles[y][x];
    }
    
    /**
     * 设置格子类型
     */
    setTileType(x, y, type) {
        if (!this.isValidPosition(x, y)) return;
        this.tiles[y][x].type = type;
    }
    
    /**
     * 采集矿石
     */
    harvestOre(x, y, amount) {
        if (!this.isValidPosition(x, y)) return 0;
        
        const tile = this.tiles[y][x];
        if (tile.type !== 'ore' || tile.oreAmount <= 0) return 0;
        
        const harvested = Math.min(amount, tile.oreAmount);
        tile.oreAmount -= harvested;
        
        if (tile.oreAmount <= 0) {
            tile.type = 'grass';
            tile.buildable = true;
        }
        
        return harvested;
    }
    
    /**
     * 获取最近的矿石
     */
    getNearestOre(x, y, maxDistance = 50) {
        let nearest = null;
        let minDist = Infinity;
        
        for (const deposit of this.oreDeposits) {
            const centerX = deposit.x + deposit.size / 2;
            const centerY = deposit.y + deposit.size / 2;
            const dist = Utils.distance(x, y, centerX, centerY);
            
            if (dist < minDist && dist <= maxDistance && deposit.amount > 0) {
                minDist = dist;
                nearest = deposit;
            }
        }
        
        return nearest;
    }
    
    /**
     * 获取随机出生点
     */
    getRandomSpawnPoint(minDistanceFromEdge = 10) {
        let attempts = 0;
        let x, y;
        
        do {
            x = Utils.randomInt(minDistanceFromEdge, this.width - minDistanceFromEdge);
            y = Utils.randomInt(minDistanceFromEdge, this.height - minDistanceFromEdge);
            attempts++;
        } while ((!this.tiles[y][x].buildable || this.tiles[y][x].type !== 'grass') && attempts < 100);
        
        return { x, y };
    }
    
    /**
     * 序列化地图
     */
    serialize() {
        return {
            width: this.width,
            height: this.height,
            tiles: this.tiles,
            oreDeposits: this.oreDeposits
        };
    }
    
    /**
     * 反序列化地图
     */
    static deserialize(data) {
        const map = new GameMap(data.width, data.height);
        map.tiles = data.tiles;
        map.oreDeposits = data.oreDeposits;
        return map;
    }
}

// 导出地图类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameMap;
}
