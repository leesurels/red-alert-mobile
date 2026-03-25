/**
 * 红色警戒：共和国之辉 - 战争迷雾系统
 */

class FogOfWar {
    constructor(mapWidth, mapHeight) {
        this.width = mapWidth;
        this.height = mapHeight;
        this.grid = [];
        this.revealedGrid = []; // 已探索区域（灰色）
        
        this.initialize();
    }
    
    /**
     * 初始化迷雾
     */
    initialize() {
        for (let y = 0; y < this.height; y++) {
            this.grid[y] = [];
            this.revealedGrid[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.grid[y][x] = 1; // 1 = 迷雾, 0 = 可见
                this.revealedGrid[y][x] = 0; // 0 = 未探索, 1 = 已探索
            }
        }
    }
    
    /**
     * 从建筑/单位位置更新迷雾
     */
    updateFromEntities(buildings, units) {
        // 重置当前视野
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.grid[y][x] === 0) {
                    this.grid[y][x] = 1;
                }
            }
        }
        
        // 从建筑驱散迷雾
        for (const building of buildings) {
            if (building.config && building.config.revealsFog) {
                this.revealArea(building.x, building.y, CONFIG.FOG.RADAR_RADIUS);
            }
        }
        
        // 从单位驱散迷雾
        for (const unit of units) {
            const revealRadius = unit.type === 'infantry' ? 
                CONFIG.FOG.REVEAL_RADIUS : 
                CONFIG.FOG.REVEAL_RADIUS + 2;
            this.revealArea(unit.x, unit.y, revealRadius);
        }
    }
    
    /**
     * 驱散一片区域的迷雾
     */
    revealArea(centerX, centerY, radius) {
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const x = Math.floor(centerX) + dx;
                const y = Math.floor(centerY) + dy;
                
                if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist <= radius) {
                        this.grid[y][x] = 0; // 当前可见
                        this.revealedGrid[y][x] = 1; // 已探索
                    }
                }
            }
        }
    }
    
    /**
     * 检查位置是否可见
     */
    isVisible(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return false;
        return this.grid[Math.floor(y)][Math.floor(x)] === 0;
    }
    
    /**
     * 检查位置是否已探索
     */
    isRevealed(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return false;
        return this.revealedGrid[Math.floor(y)][Math.floor(x)] === 1;
    }
    
    /**
     * 获取迷雾值
     */
    getFogValue(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return 1;
        return this.grid[Math.floor(y)][Math.floor(x)];
    }
    
    /**
     * 获取探索值
     */
    getRevealedValue(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return 0;
        return this.revealedGrid[Math.floor(y)][Math.floor(x)];
    }
    
    /**
     * 渲染迷雾到画布
     */
    render(ctx, camera, tileSize) {
        const viewport = Utils.getViewport(camera, ctx.canvas.width, ctx.canvas.height, tileSize);
        
        ctx.save();
        
        for (let y = viewport.startY; y < viewport.endY; y++) {
            for (let x = viewport.startX; x < viewport.endX; x++) {
                if (y < 0 || y >= this.height || x < 0 || x >= this.width) continue;
                
                const screenX = x * tileSize - camera.x;
                const screenY = y * tileSize - camera.y;
                
                const isVisible = this.grid[y][x] === 0;
                const isRevealed = this.revealedGrid[y][x] === 1;
                
                if (!isVisible) {
                    if (isRevealed) {
                        // 已探索但当前不可见 - 灰色迷雾
                        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                    } else {
                        // 未探索 - 黑色迷雾
                        ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
                    }
                    ctx.fillRect(screenX, screenY, tileSize, tileSize);
                }
            }
        }
        
        ctx.restore();
    }
    
    /**
     * 渲染小地图迷雾
     */
    renderMinimap(ctx, scaleX, scaleY) {
        ctx.save();
        
        for (let y = 0; y < this.height; y += 2) {
            for (let x = 0; x < this.width; x += 2) {
                const isVisible = this.grid[y][x] === 0;
                const isRevealed = this.revealedGrid[y][x] === 1;
                
                if (!isVisible) {
                    if (isRevealed) {
                        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                    } else {
                        ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
                    }
                    ctx.fillRect(x * scaleX, y * scaleY, scaleX * 2, scaleY * 2);
                }
            }
        }
        
        ctx.restore();
    }
    
    /**
     * 序列化
     */
    serialize() {
        return {
            width: this.width,
            height: this.height,
            grid: this.grid,
            revealedGrid: this.revealedGrid
        };
    }
    
    /**
     * 反序列化
     */
    static deserialize(data) {
        const fog = new FogOfWar(data.width, data.height);
        fog.grid = data.grid;
        fog.revealedGrid = data.revealedGrid;
        return fog;
    }
}

// 导出迷雾类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FogOfWar;
}
