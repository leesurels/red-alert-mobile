/**
 * 红色警戒：共和国之辉 - 游戏配置
 */

const CONFIG = {
    // 游戏版本
    VERSION: '1.0.0',
    
    // 地图配置
    MAP: {
        WIDTH: 80,
        HEIGHT: 80,
        TILE_SIZE: 32,
        CHUNK_SIZE: 16
    },
    
    // 迷雾配置
    FOG: {
        ENABLED: true,
        REVEAL_RADIUS: 8,
        RADAR_RADIUS: 15
    },
    
    // 经济配置
    ECONOMY: {
        STARTING_MONEY: 10000,
        ORE_VALUE: 100,
        ORE_CAPACITY: 1000,
        HARVESTER_CAPACITY: 500
    },
    
    // 建造配置
    BUILD: {
        POWER_RANGE: 10,  // 建筑必须在已有建筑附近10格内
        BUILD_SPEED_MULTIPLIER: 1
    },
    
    // 单位升级配置
    UPGRADE: {
        MAX_BATTLE_LEVEL: 3,
        MAX_SPY_LEVEL: 1,
        XP_PER_KILL: 50,
        LEVEL_THRESHOLDS: [0, 100, 250, 500]
    },
    
    // 阵营配置
    FACTIONS: {
        SOVIET: {
            name: '苏联',
            color: '#e94560',
            buildings: ['construction_yard', 'power_plant', 'ore_refinery', 'barracks', 'war_factory', 'radar', 'service_depot', 'battle_lab'],
            units: ['engineer', 'spy', 'conscript', 'flak_trooper', 'attack_dog', 'rhino_tank', 'flak_track', 'v3_launcher', 'apocalypse_tank'],
            special: ['iron_curtain', 'nuclear_missile']
        },
        ALLIED: {
            name: '盟军',
            color: '#4a90e2',
            buildings: ['construction_yard', 'power_plant', 'ore_refinery', 'barracks', 'war_factory', 'radar', 'service_depot', 'battle_lab'],
            units: ['engineer', 'spy', 'gi', 'guardian_gi', 'attack_dog', 'grizzly_tank', 'ifv', 'prism_tank', 'mirage_tank'],
            special: ['chronosphere', 'lightning_storm']
        }
    },
    
    // 建筑配置
    BUILDINGS: {
        construction_yard: {
            name: '建造厂',
            cost: 0,
            power: 0,
            health: 2000,
            buildTime: 0,
            size: { w: 3, h: 3 },
            icon: '🏭',
            description: '基地核心建筑'
        },
        power_plant: {
            name: '发电厂',
            cost: 800,
            power: 200,
            health: 800,
            buildTime: 8,
            size: { w: 2, h: 2 },
            icon: '⚡',
            description: '提供电力'
        },
        ore_refinery: {
            name: '矿厂',
            cost: 2000,
            power: -50,
            health: 1200,
            buildTime: 15,
            size: { w: 3, h: 3 },
            icon: '💎',
            description: '采集矿石资源'
        },
        barracks: {
            name: '兵营',
            cost: 500,
            power: -20,
            health: 600,
            buildTime: 6,
            size: { w: 2, h: 2 },
            icon: '🏠',
            description: '训练步兵单位'
        },
        war_factory: {
            name: '战车工厂',
            cost: 2000,
            power: -50,
            health: 1500,
            buildTime: 15,
            size: { w: 3, h: 3 },
            icon: '🔧',
            description: '生产载具单位'
        },
        radar: {
            name: '雷达',
            cost: 1000,
            power: -50,
            health: 800,
            buildTime: 10,
            size: { w: 2, h: 2 },
            icon: '📡',
            description: '驱散战争迷雾',
            revealsFog: true
        },
        service_depot: {
            name: '维修厂',
            cost: 800,
            power: -25,
            health: 1000,
            buildTime: 8,
            size: { w: 3, h: 2 },
            icon: '🔨',
            description: '维修载具'
        },
        battle_lab: {
            name: '作战实验室',
            cost: 2000,
            power: -100,
            health: 1000,
            buildTime: 15,
            size: { w: 2, h: 2 },
            icon: '🔬',
            description: '解锁高级科技'
        }
    },
    
    // 单位配置
    UNITS: {
        // 工程师
        engineer: {
            name: '工程师',
            cost: 500,
            buildTime: 5,
            health: 100,
            speed: 1.5,
            icon: '👷',
            type: 'infantry',
            canCapture: true,
            description: '占领敌方建筑'
        },
        // 间谍
        spy: {
            name: '间谍',
            cost: 1000,
            buildTime: 8,
            health: 80,
            speed: 1.8,
            icon: '🕵️',
            type: 'infantry',
            canDisguise: true,
            canSteal: true,
            description: '伪装窃取科技'
        },
        // 苏联步兵
        conscript: {
            name: '动员兵',
            cost: 100,
            buildTime: 3,
            health: 150,
            speed: 1.2,
            damage: 15,
            range: 4,
            icon: '👤',
            type: 'infantry',
            faction: 'soviet'
        },
        flak_trooper: {
            name: '防空步兵',
            cost: 200,
            buildTime: 4,
            health: 120,
            speed: 1.0,
            damage: 20,
            range: 6,
            icon: '🎯',
            type: 'infantry',
            faction: 'soviet',
            antiAir: true
        },
        // 盟军步兵
        gi: {
            name: '美国大兵',
            cost: 200,
            buildTime: 4,
            health: 150,
            speed: 1.2,
            damage: 20,
            range: 5,
            icon: '👤',
            type: 'infantry',
            faction: 'allied'
        },
        guardian_gi: {
            name: '重装大兵',
            cost: 400,
            buildTime: 6,
            health: 200,
            speed: 0.8,
            damage: 30,
            range: 6,
            icon: '🛡️',
            type: 'infantry',
            faction: 'allied'
        },
        // 军犬
        attack_dog: {
            name: '军犬',
            cost: 200,
            buildTime: 3,
            health: 80,
            speed: 2.5,
            damage: 50,
            range: 1,
            icon: '🐕',
            type: 'infantry',
            canDetectSpy: true,
            description: '可发现间谍'
        },
        // 苏联载具
        rhino_tank: {
            name: '犀牛坦克',
            cost: 900,
            buildTime: 10,
            health: 500,
            speed: 0.8,
            damage: 60,
            range: 6,
            icon: '🚛',
            type: 'vehicle',
            faction: 'soviet'
        },
        flak_track: {
            name: '防空履带车',
            cost: 500,
            buildTime: 7,
            health: 300,
            speed: 1.2,
            damage: 25,
            range: 7,
            icon: '🚙',
            type: 'vehicle',
            faction: 'soviet',
            antiAir: true
        },
        v3_launcher: {
            name: 'V3火箭车',
            cost: 800,
            buildTime: 12,
            health: 250,
            speed: 0.6,
            damage: 150,
            range: 15,
            icon: '🚀',
            type: 'vehicle',
            faction: 'soviet'
        },
        apocalypse_tank: {
            name: '天启坦克',
            cost: 1750,
            buildTime: 18,
            health: 1000,
            speed: 0.5,
            damage: 100,
            range: 8,
            icon: '🦾',
            type: 'vehicle',
            faction: 'soviet'
        },
        // 盟军载具
        grizzly_tank: {
            name: '灰熊坦克',
            cost: 700,
            buildTime: 9,
            health: 400,
            speed: 1.0,
            damage: 50,
            range: 6,
            icon: '🚛',
            type: 'vehicle',
            faction: 'allied'
        },
        ifv: {
            name: '多功能步兵车',
            cost: 600,
            buildTime: 8,
            health: 250,
            speed: 1.5,
            damage: 30,
            range: 6,
            icon: '🚐',
            type: 'vehicle',
            faction: 'allied'
        },
        prism_tank: {
            name: '光棱坦克',
            cost: 1200,
            buildTime: 14,
            health: 300,
            speed: 0.7,
            damage: 100,
            range: 10,
            icon: '✨',
            type: 'vehicle',
            faction: 'allied'
        },
        mirage_tank: {
            name: '幻影坦克',
            cost: 1000,
            buildTime: 12,
            health: 350,
            speed: 0.8,
            damage: 80,
            range: 8,
            icon: '🌳',
            type: 'vehicle',
            faction: 'allied',
            canCamouflage: true
        },
        // 矿车
        harvester: {
            name: '采矿车',
            cost: 1400,
            buildTime: 12,
            health: 800,
            speed: 0.6,
            icon: '⛏️',
            type: 'vehicle',
            canHarvest: true,
            description: '采集矿石'
        }
    },
    
    // 游戏速度
    GAME_SPEED: 60, // FPS
    
    // 输入配置
    INPUT: {
        DRAG_THRESHOLD: 10,
        DOUBLE_TAP_DELAY: 300,
        LONG_PRESS_DELAY: 500
    }
};

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
