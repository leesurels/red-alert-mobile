/**
 * 红色警戒：共和国之辉 - 输入处理
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
        this.lastTouch = { x: 0, y: 0 };
        this.lastTouchTime = 0;
        
        // 模式
        this.mode = 'select'; // select, build, attack
        this.selectedBuildingType = null;
        
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
     * 获取游戏世界坐标
     */
    getWorldCoordinates(canvasX, canvasY) {
        return {
            x: canvasX + this.game.camera.x,
            y: canvasY + this.game.camera.y
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
     * 处理触摸开始
     */
    handleTouchStart(e) {
        e.preventDefault();
        
        const touch = e.touches[0];
        const canvasPos = this.getCanvasCoordinates(touch.clientX, touch.clientY);
        
        this.handleInputStart(canvasPos.x, canvasPos.y);
        
        // 检测双击
        const now = Date.now();
        const dist = Utils.distance(canvasPos.x, canvasPos.y, this.lastTouch.x, this.lastTouch.y);
        
        if (now - this.lastTouchTime < CONFIG.INPUT.DOUBLE_TAP_DELAY && dist < 20) {
            this.handleDoubleTap(canvasPos.x, canvasPos.y);
        }
        
        this.lastTouch = { x: canvasPos.x, y: canvasPos.y };
        this.lastTouchTime = now;
    }
    
    /**
     * 处理触摸移动
     */
    handleTouchMove(e) {
        e.preventDefault();
        
        const touch = e.touches[0];
        const canvasPos = this.getCanvasCoordinates(touch.clientX, touch.clientY);
        
        this.handleInputMove(canvasPos.x, canvasPos.y);
    }
    
    /**
     * 处理触摸结束
     */
    handleTouchEnd(e) {
        e.preventDefault();
        
        this.handleInputEnd();
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
     * 处理滚轮
     */
    handleWheel(e) {
        e.preventDefault();
        // 可以添加缩放功能
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
        
        // 建造模式
        if (this.mode === 'build' && this.selectedBuildingType) {
            const worldPos = this.getWorldCoordinates(x, y);
            const gridPos = this.getGridCoordinates(worldPos.x, worldPos.y);
            this.game.tryBuild(this.selectedBuildingType, gridPos.x, gridPos.y);
            this.setMode('select');
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
                this.game.camera.x -= dx * 0.5;
                this.game.camera.y -= dy * 0.5;
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
            // 单击选择
            const worldPos = this.getWorldCoordinates(this.dragStart.x, this.dragStart.y);
            this.game.handleClick(worldPos.x, worldPos.y);
        }
        
        this.isDragging = false;
        this.isSelecting = false;
    }
    
    /**
     * 处理双击
     */
    handleDoubleTap(x, y) {
        const worldPos = this.getWorldCoordinates(x, y);
        this.game.handleDoubleClick(worldPos.x, worldPos.y);
    }
    
    /**
     * 检查是否点击在UI上
     */
    isClickOnUI(x, y) {
        // 检查是否点击在底部控制栏
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
        
        const btnId = mode === 'select' ? 'btn-select' : 
                      mode === 'build' ? 'btn-build' : 
                      mode === 'attack' ? 'btn-attack' : null;
        
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
