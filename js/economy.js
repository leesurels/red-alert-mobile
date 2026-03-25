/**
 * 红色警戒：共和国之辉 - 经济系统
 */

class Economy {
    constructor(playerId) {
        this.playerId = playerId;
        this.money = CONFIG.ECONOMY.STARTING_MONEY;
        this.power = 0;
        this.powerMax = 0;
        this.powerOutput = 0;
        this.powerConsumption = 0;
        
        this.incomeHistory = [];
        this.expenseHistory = [];
    }
    
    /**
     * 更新经济
     */
    update(buildings) {
        // 计算电力
        this.calculatePower(buildings);
    }
    
    /**
     * 计算电力
     */
    calculatePower(buildings) {
        this.powerOutput = 0;
        this.powerConsumption = 0;
        
        for (const building of buildings) {
            if (building.playerId === this.playerId && building.isComplete) {
                if (building.power > 0) {
                    this.powerOutput += building.power;
                } else {
                    this.powerConsumption += Math.abs(building.power);
                }
            }
        }
        
        this.powerMax = this.powerOutput;
        this.power = this.powerOutput - this.powerConsumption;
    }
    
    /**
     * 是否有足够资金
     */
    canAfford(amount) {
        return this.money >= amount;
    }
    
    /**
     * 支出
     */
    spend(amount) {
        if (this.canAfford(amount)) {
            this.money -= amount;
            this.expenseHistory.push({ amount, time: Date.now() });
            return true;
        }
        return false;
    }
    
    /**
     * 收入
     */
    earn(amount) {
        this.money += amount;
        this.incomeHistory.push({ amount, time: Date.now() });
    }
    
    /**
     * 添加资金（作弊/任务奖励）
     */
    addMoney(amount) {
        this.money += amount;
    }
    
    /**
     * 获取电力状态
     */
    getPowerStatus() {
        if (this.power < 0) return 'low'; // 电力不足
        if (this.power < this.powerConsumption * 0.2) return 'critical'; // 电力临界
        return 'normal';
    }
    
    /**
     * 获取收入统计
     */
    getIncomeStats(duration = 60000) {
        const now = Date.now();
        const recent = this.incomeHistory.filter(i => now - i.time < duration);
        return recent.reduce((sum, i) => sum + i.amount, 0);
    }
    
    /**
     * 序列化
     */
    serialize() {
        return {
            playerId: this.playerId,
            money: this.money,
            power: this.power,
            powerMax: this.powerMax
        };
    }
    
    /**
     * 反序列化
     */
    static deserialize(data) {
        const economy = new Economy(data.playerId);
        economy.money = data.money;
        economy.power = data.power;
        economy.powerMax = data.powerMax;
        return economy;
    }
}

// 导出经济类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Economy;
}
