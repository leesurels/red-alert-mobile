/**
 * 红色警戒：共和国之辉 - 工具函数
 */

const Utils = {
    /**
     * 生成唯一ID
     */
    generateId() {
        return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    },
    
    /**
     * 计算两点之间的距离
     */
    distance(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    },
    
    /**
     * 计算曼哈顿距离
     */
    manhattanDistance(x1, y1, x2, y2) {
        return Math.abs(x2 - x1) + Math.abs(y2 - y1);
    },
    
    /**
     * 检查点是否在矩形内
     */
    pointInRect(x, y, rx, ry, rw, rh) {
        return x >= rx && x <= rx + rw && y >= ry && y <= ry + rh;
    },
    
    /**
     * 检查两个矩形是否碰撞
     */
    rectIntersect(r1, r2) {
        return !(r2.x > r1.x + r1.w || 
                 r2.x + r2.w < r1.x || 
                 r2.y > r1.y + r1.h || 
                 r2.y + r2.h < r1.y);
    },
    
    /**
     * 网格坐标转世界坐标
     */
    gridToWorld(gx, gy, tileSize) {
        return {
            x: gx * tileSize,
            y: gy * tileSize
        };
    },
    
    /**
     * 世界坐标转网格坐标
     */
    worldToGrid(wx, wy, tileSize) {
        return {
            x: Math.floor(wx / tileSize),
            y: Math.floor(wy / tileSize)
        };
    },
    
    /**
     * 限制值在范围内
     */
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },
    
    /**
     * 线性插值
     */
    lerp(start, end, t) {
        return start + (end - start) * t;
    },
    
    /**
     * 角度转弧度
     */
    toRadians(degrees) {
        return degrees * Math.PI / 180;
    },
    
    /**
     * 弧度转角度
     */
    toDegrees(radians) {
        return radians * 180 / Math.PI;
    },
    
    /**
     * 获取朝向角度
     */
    getAngle(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    },
    
    /**
     * 深度克隆对象
     */
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },
    
    /**
     * 格式化数字
     */
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    },
    
    /**
     * 格式化时间
     */
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    },
    
    /**
     * 防抖函数
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    /**
     * 节流函数
     */
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    /**
     * A*寻路算法
     */
    findPath(startX, startY, endX, endY, map, maxSteps = 100) {
        const openSet = [];
        const closedSet = new Set();
        const cameFrom = new Map();
        const gScore = new Map();
        const fScore = new Map();
        
        const startKey = `${startX},${startY}`;
        const endKey = `${endX},${endY}`;
        
        openSet.push({ x: startX, y: startY });
        gScore.set(startKey, 0);
        fScore.set(startKey, this.manhattanDistance(startX, startY, endX, endY));
        
        let steps = 0;
        
        while (openSet.length > 0 && steps < maxSteps) {
            steps++;
            
            // 找到fScore最小的节点
            let current = openSet[0];
            let currentIndex = 0;
            let lowestF = fScore.get(`${current.x},${current.y}`) || Infinity;
            
            for (let i = 1; i < openSet.length; i++) {
                const node = openSet[i];
                const f = fScore.get(`${node.x},${node.y}`) || Infinity;
                if (f < lowestF) {
                    lowestF = f;
                    current = node;
                    currentIndex = i;
                }
            }
            
            const currentKey = `${current.x},${current.y}`;
            
            if (current.x === endX && current.y === endY) {
                // 重建路径
                const path = [];
                let curr = currentKey;
                while (cameFrom.has(curr)) {
                    const [x, y] = curr.split(',').map(Number);
                    path.unshift({ x, y });
                    curr = cameFrom.get(curr);
                }
                path.unshift({ x: startX, y: startY });
                return path;
            }
            
            openSet.splice(currentIndex, 1);
            closedSet.add(currentKey);
            
            // 检查邻居
            const neighbors = [
                { x: current.x + 1, y: current.y },
                { x: current.x - 1, y: current.y },
                { x: current.x, y: current.y + 1 },
                { x: current.x, y: current.y - 1 }
            ];
            
            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.x},${neighbor.y}`;
                
                if (closedSet.has(neighborKey)) continue;
                if (!map.isValidPosition(neighbor.x, neighbor.y)) continue;
                if (map.isBlocked(neighbor.x, neighbor.y)) continue;
                
                const tentativeG = (gScore.get(currentKey) || 0) + 1;
                
                const existingG = gScore.get(neighborKey);
                if (existingG === undefined || tentativeG < existingG) {
                    cameFrom.set(neighborKey, currentKey);
                    gScore.set(neighborKey, tentativeG);
                    fScore.set(neighborKey, tentativeG + this.manhattanDistance(neighbor.x, neighbor.y, endX, endY));
                    
                    if (!openSet.some(n => n.x === neighbor.x && n.y === neighbor.y)) {
                        openSet.push(neighbor);
                    }
                }
            }
        }
        
        return null; // 未找到路径
    },
    
    /**
     * 随机整数
     */
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    
    /**
     * 从数组中随机选择
     */
    randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    },
    
    /**
     * 打乱数组
     */
    shuffle(array) {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    },
    
    /**
     * 检查点是否在多边形内
     */
    pointInPolygon(point, polygon) {
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i].x, yi = polygon[i].y;
            const xj = polygon[j].x, yj = polygon[j].y;
            
            if (((yi > point.y) !== (yj > point.y)) &&
                (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi)) {
                inside = !inside;
            }
        }
        return inside;
    },
    
    /**
     * 获取视口范围
     */
    getViewport(camera, canvasWidth, canvasHeight, tileSize) {
        const startX = Math.floor(camera.x / tileSize);
        const startY = Math.floor(camera.y / tileSize);
        const endX = startX + Math.ceil(canvasWidth / tileSize) + 1;
        const endY = startY + Math.ceil(canvasHeight / tileSize) + 1;
        
        return { startX, startY, endX, endY };
    },
    
    /**
     * 颜色混合
     */
    blendColors(color1, color2, ratio) {
        const hex2rgb = (hex) => ({
            r: parseInt(hex.slice(1, 3), 16),
            g: parseInt(hex.slice(3, 5), 16),
            b: parseInt(hex.slice(5, 7), 16)
        });
        
        const rgb2hex = (r, g, b) => `#${[r, g, b].map(x => Math.round(x).toString(16).padStart(2, '0')).join('')}`;
        
        const c1 = hex2rgb(color1);
        const c2 = hex2rgb(color2);
        
        return rgb2hex(
            c1.r * (1 - ratio) + c2.r * ratio,
            c1.g * (1 - ratio) + c2.g * ratio,
            c1.b * (1 - ratio) + c2.b * ratio
        );
    }
};

// 导出工具函数
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}
