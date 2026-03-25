/**
 * 红色警戒：共和国之辉 - 输入处理 v2.0
 * 支持触屏操作、双指缩放、长按拖动建造
 */

class InputHandler {
    constructor(game) {
        this.game = game;
        this.canvas = game.canvas;
        
        // 输入状态
        this.isDragging = false;
        this.isSelecting = false;
        this.dragStart = { x: 0, y: 0 };
        this.dragCurrent = { x: 0, y: 0 };
        
        // 双指缩放
        this.isPinching = false;
        this.pinchStartDistance = 0;
        this.pinchCurrentDistance = 0;
        this.lastPinchCenter = { x: 0, y: 0 };
        
        // 长按建造
        this.isLongPress = false;
        this.longPressTimer = null;
        this.longPressStart = { x: 0, y: 0 };
        this.dragBuilding = null;
        this.dragBuildingElement = null;
        
        // 模式
        this.mode = 'select'; // select, build, attack, repair, sell
        this.selectedBuildingType = null;
        
        // 缩放
        this.zoom = CONFIG.ZOOM.DEFAULT;
        
        this.initialize();
    }
    
    /**
     * 初始化输入事件
     */
    initialize() {
        // 触摸事件
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        this.canvas.addEventListener('touchcancel', this.handleTouchEnd.bind(this), { passive: false });
        
        // 鼠标事件
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('wheel', this.handleWheel.bind(this));
        
        // 防止默认触摸行为
        document.addEventListener('touchmove', (e) => {
            if (e.target === this.canvas) {
                e.preventDefault();
            }
        }, { passive: false });
    }
    
    /**
     * 处理触摸开始
     */
    handleTouchStart(e) {
        e.preventDefault();
        
        if (e.touches.length === 1) {
            // 单指触摸
            const touch = e.touches[0];
            const canvasPos = this.getCanvasCoordinates(touch.clientX, touch.clientY);
            this.handleInputStart(canvasPos.x, canvasPos.y);
            
            // 开始长按检测
            this.startLongPress(canvasPos.x, canvasPos.y);
        } else if (e.touches.length === 2) {
            // 双指缩放
            this.cancelLongPress();
            this.startPinch(e.touches);
        }
    }
    
    /**
     * 处理触摸移动
     */
    handleTouchMove(e) {
        e.preventDefault();
        
        if (e.touches.length === 1 && !this.isPinching) {
            // 单指移动
            const touch = e.touches[0];
            const canvasPos = this.getCanvasCoordinates(touch.clientX, touch.clientY);
            
            // 如果是长按拖动建造
            if (this.isLongPress && this.dragBuilding) {
                this.updateDragBuilding(canvasPos.x, canvasPos.y);
            } else {
                this.handleInputMove(canvasPos.x, canvasPos.y);
            }
            
            // 如果移动距离过大，取消长按
            const dist = Utils.distance(
                canvasPos.x, canvasPos.y,
                this.longPressStart.x, this.longPressStart.y
            );
            if (dist > CONFIG.INPUT.DRAG_THRESHOLD) {
                this.cancelLongPress();
            }
        } else if (e.touches.length === 2) {
            // 双指缩放
            this.updatePinch(e.touches);
        }
    }
    
    /**
     * 处理触摸结束
     */
    handleTouchEnd(e) {
        e.preventDefault();
        
        if (this.isPinching) {
            this.endPinch();
        }
        
        this.cancelLongPress();
        this.handleInputEnd();
    }
    
    /**
     * 开始双指缩放
     */
    startPinch(touches) {
        this.isPinching = true;
        this.pinchStartDistance = this.getTouchDistance(touches);
        this.pinchCurrentDistance = this.pinchStartDistance;
        
        const center = this.getTouchCenter(touches);
        this.lastPinchCenter = this.getCanvasCoordinates(center.x, center.y);
    }
    
    /**
     * 更新双指缩放
     */
    updatePinch(touches) {
        if (!this.isPinching) return;
        
        const newDistance = this.getTouchDistance(touches);
        const center = this.getTouchCenter(touches);
        const canvasCenter = this.getCanvasCoordinates(center.x, center.y);
        
        // 计算缩放比例
        const scale = newDistance / this.pinchCurrentDistance;
        this.zoom = Utils.clamp(this.zoom * scale, CONFIG.ZOOM.MIN, CONFIG.ZOOM.MAX);
        
        // 更新相机位置（以双指中心为缩放中心）
        const worldCenter = this.getWorldCoordinates(canvasCenter.x, canvasCenter.y);
        const oldWorldCenter = this.getWorldCoordinates(this.lastPinchCenter.x, this.lastPinchCenter.y);
        
        this.game.camera.x += (oldWorldCenter.x - worldCenter.x);
        this.game.camera.y += (oldWorldCenter.y - worldCenter.y);
        
        this.pinchCurrentDistance = newDistance;
        this.lastPinchCenter = canvasCenter;
        
        // 显示缩放指示器
        this.showZoomIndicator();
    }
    
    /**
     * 结束双指缩放
     */
    endPinch() {
        this.isPinching = false;
        this.game.setZoom(this.zoom);
    }
    
    /**
     * 获取双指距离
     */
    getTouchDistance(touches) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * 获取双指中心
     */
    getTouchCenter(touches) {
        return {
            x: (touches[0].clientX + touches[1].clientX) / 2,
            y: (touches[0].clientY + touches[1].clientY) / 2
        };
    }
    
    /**
     * 开始长按检测
     */
    startLongPress(x, y) {
        this.longPressStart = { x, y };
        
        this.longPressTimer = setTimeout(() => {
            this.isLongPress = true;
            this.onLongPress(x, y);
        }, CONFIG.INPUT.LONG_PRESS_DELAY);
    }
    
    /**
     * 取消长按
     */
    cancelLongPress() {
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
        this.isLongPress = false;
        this.endDragBuilding();
    }
    
    /**
     * 长按触发
     */
    onLongPress(x, y) {
        const worldPos = this.getWorldCoordinates(x, y);
        const gridPos = this.getGridCoordinates(worldPos.x, worldPos.y);
        
        // 检查是否点击了建筑菜单中的建筑
        const buildItem = document.querySelector('.build-item[data-longpress="true"]');
        if (buildItem) {
            const buildingType = buildItem.dataset.type;
            this.startDragBuilding(buildingType, x, y);
        }
    }
    
    /**
     * 开始拖动建筑
     */
    startDragBuilding(buildingType, x, y) {
        const config = CONFIG.BUILDINGS[buildingType];
        if (!config) return;
        
        this.dragBuilding = {
            type: buildingType,
            config: config
        };
        
        // 创建拖动预览元素
        this.dragBuildingElement = document.createElement('div');
        this.dragBuildingElement.className = 'build-drag-preview';
        this.dragBuildingElement.style.width = (config.size.w * CONFIG.MAP.TILE_SIZE * this.zoom) + 'px';
        this.dragBuildingElement.style.height = (config.size.h * CONFIG.MAP.TILE_SIZE * this.zoom) + 'px';
        this.dragBuildingElement.innerHTML = `<span style="font-size:${30 * this.zoom}px">${config.icon}</span>`;
        document.getElementById('ui-layer').appendChild(this.dragBuildingElement);
        
        this.updateDragBuilding(x, y);
    }
    
    /**
     * 更新拖动建筑位置
     */
    updateDragBuilding(x, y) {
        if (!this.dragBuildingElement) return;
        
        const worldPos = this.getWorldCoordinates(x, y);
        const gridPos = this.getGridCoordinates(worldPos.x, worldPos.y);
        
        const screenX = gridPos.x * CONFIG.MAP.TILE_SIZE * this.zoom - this.game.camera.x * this.zoom;
        const screenY = gridPos.y * CONFIG.MAP.TILE_SIZE * this.zoom - this.game.camera.y * this.zoom;
        
        this.dragBuildingElement.style.left = screenX + 'px';
        this.dragBuildingElement.style.top = screenY + 'px';
        
        // 检查是否可以建造
        const canBuild = this.game.canBuildAt(
            this.dragBuilding.type,
            gridPos.x,
            gridPos.y
        );
        
        this.dragBuildingElement.classList.toggle('valid', canBuild);
        this.dragBuildingElement.classList.toggle('invalid', !canBuild);
    }
    
    /**
     * 结束拖动建筑
     */
    endDragBuilding() {
        if (this.dragBuildingElement) {
            this.dragBuildingElement.remove();
            this.dragBuildingElement = null;
        }
        
        if (this.dragBuilding) {
            const worldPos = this.getWorldCoordinates(this.dragCurrent.x, this.dragCurrent.y);
            const gridPos = this.getGridCoordinates(worldPos.x, worldPos.y);
            
            this.game.tryBuild(this.dragBuilding.type, gridPos.x, gridPos.y);
            this.dragBuilding = null;
        }
    }
    
    /**
     * 显示缩放指示器
     */
    showZoomIndicator() {
        const indicator = document.getElementById('zoom-indicator');
        if (indicator) {
            indicator.textContent = `${Math.round(this.zoom * 100)}%`;
            indicator.classList.add('visible');
            
            clearTimeout(this.zoomTimeout);
            this.zoomTimeout = setTimeout(() => {
                indicator.classList.remove('visible');
            }, 1500);
        }
    }
    
    /**
     * 获取画布坐标
     */
    getCanvasCoordinates(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }
    
    /**
     * 获取游戏世界坐标（考虑缩放）
     */
    getWorldCoordinates(canvasX, canvasY) {
        return {
            x: canvasX / this.zoom + this.game.camera.x,
            y: canvasY / this.zoom + this.game.camera.y
        };
    }
    
    /**
     * 获取网格坐标
     */
    getGridCoordinates(worldX, worldY) {
        return {
            x: Math.floor(worldX / CONFIG.MAP.TILE_SIZE),
            y: Math.floor(worldY / CONFIG.MAP.TILE_SIZE)
        };
    }
    
    /**
     * 处理输入开始
     */
    handleInputStart(x, y) {
        this.isDragging = true;
        this.dragStart = { x, y };
        this.dragCurrent = { x, y };
        
        // 检查是否点击了UI
        if (this.isClickOnUI(x, y)) {
            return;
        }
        
        // 建造模式（非拖动）
        if (this.mode === 'build' && this.selectedBuildingType && !this.dragBuilding) {
            const worldPos = this.getWorldCoordinates(x, y);
            const gridPos = this.getGridCoordinates(worldPos.x, worldPos.y);
            this.game.tryBuild(this.selectedBuildingType, gridPos.x, gridPos.y);
            return;
        }
        
        // 维修模式
        if (this.mode === 'repair') {
            const worldPos = this.getWorldCoordinates(x, y);
            this.game.orderRepair(worldPos.x, worldPos.y);
            return;
        }
        
        // 售卖模式
        if (this.mode === 'sell') {
            const worldPos = this.getWorldCoordinates(x, y);
            this.game.orderSell(worldPos.x, worldPos.y);
            return;
        }
        
        // 攻击模式
        if (this.mode === 'attack') {
            const worldPos = this.getWorldCoordinates(x, y);
            const gridPos = this.getGridCoordinates(worldPos.x, worldPos.y);
            this.game.orderAttack(gridPos.x, gridPos.y);
            this.setMode('select');
            return;
        }
    }
    
    /**
     * 处理输入移动
     */
    handleInputMove(x, y) {
        if (!this.isDragging) return;
        
        this.dragCurrent = { x, y };
        
        const dx = x - this.dragStart.x;
        const dy = y - this.dragStart.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // 如果移动距离超过阈值，开始选择或拖动
        if (dist > CONFIG.INPUT.DRAG_THRESHOLD) {
            if (this.mode === 'select') {
                this.isSelecting = true;
            }
            
            // 移动相机
            if (!this.isSelecting) {
                this.game.camera.x -= dx * 0.5 / this.zoom;
                this.game.camera.y -= dy * 0.5 / this.zoom;
                this.dragStart = { x, y };
            }
        }
    }
    
    /**
     * 处理输入结束
     */
    handleInputEnd() {
        if (!this.isDragging) return;
        
        // 如果是选择模式且有选择框
        if (this.isSelecting) {
            const worldStart = this.getWorldCoordinates(this.dragStart.x, this.dragStart.y);
            const worldEnd = this.getWorldCoordinates(this.dragCurrent.x, this.dragCurrent.y);
            
            this.game.selectUnitsInRect(worldStart.x, worldStart.y, worldEnd.x, worldEnd.y);
        } else {
            // 单击选择或移动
            const worldPos = this.getWorldCoordinates(this.dragStart.x, this.dragStart.y);
            this.game.handleClick(worldPos.x, worldPos.y);
        }
        
        this.isDragging = false;
        this.isSelecting = false;
    }
    
    /**
     * 处理鼠标按下
     */
    handleMouseDown(e) {
        const canvasPos = this.getCanvasCoordinates(e.clientX, e.clientY);
        this.handleInputStart(canvasPos.x, canvasPos.y);
    }
    
    /**
     * 处理鼠标移动
     */
    handleMouseMove(e) {
        const canvasPos = this.getCanvasCoordinates(e.clientX, e.clientY);
        this.handleInputMove(canvasPos.x, canvasPos.y);
    }
    
    /**
     * 处理鼠标释放
     */
    handleMouseUp(e) {
        this.handleInputEnd();
    }
    
    /**
     * 处理滚轮缩放
     */
    handleWheel(e) {
        e.preventDefault();
        
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        this.zoom = Utils.clamp(this.zoom * delta, CONFIG.ZOOM.MIN, CONFIG.ZOOM.MAX);
        this.game.setZoom(this.zoom);
        this.showZoomIndicator();
    }
    
    /**
     * 检查是否点击在UI上
     */
    isClickOnUI(x, y) {
        const controlBar = document.getElementById('control-bar');
        if (controlBar) {
            const rect = controlBar.getBoundingClientRect();
            if (y >= rect.top && y <= rect.bottom) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * 设置输入模式
     */
    setMode(mode) {
        this.mode = mode;
        this.selectedBuildingType = null;
        
        // 更新UI按钮状态
        document.querySelectorAll('.control-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const btnMap = {
            'select': 'btn-select',
            'build': 'btn-build',
            'attack': 'btn-attack',
            'repair': 'btn-repair',
            'sell': 'btn-sell'
        };
        
        const btnId = btnMap[mode];
        if (btnId) {
            const btn = document.getElementById(btnId);
            if (btn) btn.classList.add('active');
        }
    }
    
    /**
     * 设置建造类型
     */
    setBuildType(buildingType) {
        this.selectedBuildingType = buildingType;
        this.setMode('build');
    }
    
    /**
     * 获取选择框
     */
    getSelectionRect() {
        if (!this.isSelecting) return null;
        
        const worldStart = this.getWorldCoordinates(this.dragStart.x, this.dragStart.y);
        const worldEnd = this.getWorldCoordinates(this.dragCurrent.x, this.dragCurrent.y);
        
        return {
            x: Math.min(worldStart.x, worldEnd.x),
            y: Math.min(worldStart.y, worldEnd.y),
            w: Math.abs(worldEnd.x - worldStart.x),
            h: Math.abs(worldEnd.y - worldStart.y)
        };
    }
}

// 导出输入处理器
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InputHandler;
}
