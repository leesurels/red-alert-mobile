/**
 * 红色警戒：共和国之辉 - 渲染器 v2.0
 */

class Renderer {
    constructor(canvas, game) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.game = game;
        
        this.minimapCanvas = document.getElementById('minimap');
        this.minimapCtx = this.minimapCanvas.getContext('2d');
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }
    
    resize() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        
        this.minimapCanvas.width = 120;
        this.minimapCanvas.height = 120;
    }
    
    render() {
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.save();
        this.ctx.translate(-this.game.camera.x * this.game.zoom, -this.game.camera.y * this.game.zoom);
        this.ctx.scale(this.game.zoom, this.game.zoom);
        
        this.renderMap();
        this.renderBuildings();
        this.renderUnits();
        this.renderSelectionBox();
        this.renderBuildPreview();
        
        this.ctx.restore();
        
        if (CONFIG.FOG.ENABLED) {
            this.game.fog.render(this.ctx, this.game.camera, CONFIG.MAP.TILE_SIZE);
        }
        
        this.renderMinimap();
    }
    
    renderMap() {
        const viewport = Utils.getViewport(this.game.camera, this.canvas.width, this.canvas.height, CONFIG.MAP.TILE_SIZE);
        
        for (let y = viewport.startY; y < viewport.endY; y++) {
            for (let x = viewport.startX; x < viewport.endX; x++) {
                if (!this.game.map.isValidPosition(x, y)) continue;
                
                const tile = this.game.map.getTile(x, y);
                const screenX = x * CONFIG.MAP.TILE_SIZE;
                const screenY = y * CONFIG.MAP.TILE_SIZE;
                const size = CONFIG.MAP.TILE_SIZE;
                
                switch (tile.type) {
                    case 'grass': this.ctx.fillStyle = '#2d5016'; break;
                    case 'water': this.ctx.fillStyle = '#1e3a5f'; break;
                    case 'trees': this.ctx.fillStyle = '#1a4010'; break;
                    case 'rocks': this.ctx.fillStyle = '#4a4a4a'; break;
                    case 'ore': this.ctx.fillStyle = '#8B4513'; break;
                    default: this.ctx.fillStyle = '#2d5016';
                }
                
                this.ctx.fillRect(screenX, screenY, size, size);
                this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
                this.ctx.strokeRect(screenX, screenY, size, size);
            }
        }
    }
    
    renderBuildings() {
        for (const building of this.game.buildings) {
            if (CONFIG.FOG.ENABLED && !this.game.fog.isVisible(building.x, building.y)) continue;
            
            const x = building.x * CONFIG.MAP.TILE_SIZE;
            const y = building.y * CONFIG.MAP.TILE_SIZE;
            const w = building.width * CONFIG.MAP.TILE_SIZE;
            const h = building.height * CONFIG.MAP.TILE_SIZE;
            
            const factionColor = CONFIG.FACTIONS[building.faction.toUpperCase()].color;
            
            // 维修指示器
            if (building.isRepairing) {
                this.ctx.fillStyle = 'rgba(0, 170, 255, 0.3)';
            } else {
                this.ctx.fillStyle = factionColor;
            }
            this.ctx.fillRect(x, y, w, h);
            
            // 图标
            this.ctx.font = `${Math.min(w, h) * 0.5}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(building.icon, x + w / 2, y + h / 2);
            
            // 边框
            this.ctx.strokeStyle = building.selected ? '#0f0' : 'rgba(0, 0, 0, 0.5)';
            this.ctx.lineWidth = building.selected ? 3 : 2;
            this.ctx.strokeRect(x, y, w, h);
            
            // 建造进度
            if (building.isBuilding) {
                this.renderProgressBar(x, y - 10, w, 6, building.getBuildPercent(), '#0af');
            }
            
            // 生产进度
            if (building.productionQueue.length > 0) {
                this.renderProgressBar(x, y + h + 4, w, 4, building.getProductionPercent(), '#ffd700');
            }
            
            // 血条
            this.renderHealthBar(x, y - 20, w, 6, building.health, building.maxHealth);
        }
    }
    
    renderUnits() {
        for (const unit of this.game.units) {
            if (CONFIG.FOG.ENABLED && !this.game.fog.isVisible(unit.x, unit.y)) continue;
            
            const x = unit.x * CONFIG.MAP.TILE_SIZE;
            const y = unit.y * CONFIG.MAP.TILE_SIZE;
            const size = CONFIG.MAP.TILE_SIZE * 0.8;
            
            const factionColor = CONFIG.FACTIONS[unit.faction.toUpperCase()].color;
            this.ctx.fillStyle = factionColor;
            this.ctx.beginPath();
            this.ctx.arc(x, y, size / 2, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 图标
            this.ctx.font = `${size * 0.6}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(unit.icon, x, y);
            
            // 选中
            if (unit.selected) {
                this.ctx.strokeStyle = '#0f0';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(x, y, size / 2 + 2, 0, Math.PI * 2);
                this.ctx.stroke();
            }
            
            // 等级
            if (unit.battleLevel > 0 || unit.spyLevel > 0) {
                this.ctx.fillStyle = '#ffd700';
                this.ctx.beginPath();
                this.ctx.arc(x + size / 2, y - size / 2, 6, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.fillStyle = '#000';
                this.ctx.font = '8px Arial';
                this.ctx.fillText(unit.getTotalLevel().toString(), x + size / 2, y - size / 2);
            }
            
            // 血条
            this.renderHealthBar(x - size / 2, y - size / 2 - 10, size, 4, unit.health, unit.maxHealth);
            
            // 路径
            if (unit.selected && unit.path.length > 0) {
                this.ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
                this.ctx.lineWidth = 2;
                this.ctx.setLineDash([5, 5]);
                this.ctx.beginPath();
                this.ctx.moveTo(unit.x * CONFIG.MAP.TILE_SIZE, unit.y * CONFIG.MAP.TILE_SIZE);
                for (const node of unit.path) {
                    this.ctx.lineTo(node.x * CONFIG.MAP.TILE_SIZE, node.y * CONFIG.MAP.TILE_SIZE);
                }
                this.ctx.stroke();
                this.ctx.setLineDash([]);
            }
        }
    }
    
    renderSelectionBox() {
        const rect = this.game.input.getSelectionRect();
        if (!rect) return;
        
        this.ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
        this.ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
        this.ctx.strokeStyle = '#0f0';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    }
    
    renderBuildPreview() {
        if (this.game.input.mode !== 'build' || !this.game.input.selectedBuildingType) return;
        
        const config = CONFIG.BUILDINGS[this.game.input.selectedBuildingType];
        const mousePos = this.game.input.dragCurrent;
        const worldPos = this.game.input.getWorldCoordinates(mousePos.x, mousePos.y);
        const gridPos = this.game.input.getGridCoordinates(worldPos.x, worldPos.y);
        
        const x = gridPos.x * CONFIG.MAP.TILE_SIZE;
        const y = gridPos.y * CONFIG.MAP.TILE_SIZE;
        const w = config.size.w * CONFIG.MAP.TILE_SIZE;
        const h = config.size.h * CONFIG.MAP.TILE_SIZE;
        
        const canBuild = this.game.canBuildAt(this.game.input.selectedBuildingType, gridPos.x, gridPos.y);
        
        this.ctx.fillStyle = canBuild ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 0, 0, 0.3)';
        this.ctx.fillRect(x, y, w, h);
        this.ctx.strokeStyle = canBuild ? '#0f0' : '#f00';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, w, h);
    }
    
    renderHealthBar(x, y, w, h, health, maxHealth) {
        const percent = health / maxHealth;
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(x, y, w, h);
        this.ctx.fillStyle = percent < 0.3 ? '#f00' : percent < 0.6 ? '#ff0' : '#0f0';
        this.ctx.fillRect(x, y, w * percent, h);
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, w, h);
    }
    
    renderProgressBar(x, y, w, h, percent, color) {
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(x, y, w, h);
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, w * (percent / 100), h);
        this.ctx.strokeStyle = '#000';
        this.ctx.strokeRect(x, y, w, h);
    }
    
    renderMinimap() {
        const ctx = this.minimapCtx;
        const w = this.minimapCanvas.width;
        const h = this.minimapCanvas.height;
        
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, w, h);
        
        const scaleX = w / this.game.map.width;
        const scaleY = h / this.game.map.height;
        
        // 地形
        for (let y = 0; y < this.game.map.height; y += 2) {
            for (let x = 0; x < this.game.map.width; x += 2) {
                const tile = this.game.map.getTile(x, y);
                switch (tile.type) {
                    case 'water': ctx.fillStyle = '#1e3a5f'; break;
                    case 'trees': ctx.fillStyle = '#1a4010'; break;
                    case 'rocks': ctx.fillStyle = '#4a4a4a'; break;
                    case 'ore': ctx.fillStyle = '#8B4513'; break;
                    default: ctx.fillStyle = '#2d5016';
                }
                ctx.fillRect(x * scaleX, y * scaleY, scaleX * 2, scaleY * 2);
            }
        }
        
        // 建筑
        for (const building of this.game.buildings) {
            if (CONFIG.FOG.ENABLED && !this.game.fog.isRevealed(building.x, building.y)) continue;
            ctx.fillStyle = CONFIG.FACTIONS[building.faction.toUpperCase()].color;
            ctx.fillRect(building.x * scaleX, building.y * scaleY, building.width * scaleX, building.height * scaleY);
        }
        
        // 单位
        for (const unit of this.game.units) {
            if (CONFIG.FOG.ENABLED && !this.game.fog.isRevealed(unit.x, unit.y)) continue;
            ctx.fillStyle = CONFIG.FACTIONS[unit.faction.toUpperCase()].color;
            ctx.beginPath();
            ctx.arc(unit.x * scaleX, unit.y * scaleY, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // 迷雾
        if (CONFIG.FOG.ENABLED) {
            this.game.fog.renderMinimap(ctx, scaleX, scaleY);
        }
        
        // 视野框
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(
            this.game.camera.x / CONFIG.MAP.TILE_SIZE * scaleX,
            this.game.camera.y / CONFIG.MAP.TILE_SIZE * scaleY,
            this.canvas.width / CONFIG.MAP.TILE_SIZE * scaleX,
            this.canvas.height / CONFIG.MAP.TILE_SIZE * scaleY
        );
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Renderer;
}
