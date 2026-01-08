/**
 * 魔法少女的魔女审判 - 游戏主逻辑
 */

// ========== 图片数字字体系统 ==========
const CLOCK_FONT = {
    src: 'Font/TrialsClockFont_1.png',
    cols: 4,        // 每行4个字符
    rows: 4,        // 共4行（实际只用3行）
    charWidth: 128,  // 每个字符的宽度
    charHeight: 128, // 每个字符的高度
    chars: '0123456789:' // 字符顺序（第1行:0123, 第2行:4567, 第3行:89:）
};

// 将数字/文本转换为图片字体HTML
function renderClockFont(text, scale = 1) {
    const str = String(text);
    let html = '<span class="clock-font-text" style="display: inline-flex; align-items: center;">';
    
    const width = CLOCK_FONT.charWidth * scale;
    const height = CLOCK_FONT.charHeight * scale;
    const imgWidth = CLOCK_FONT.cols * CLOCK_FONT.charWidth * scale;
    const imgHeight = CLOCK_FONT.rows * CLOCK_FONT.charHeight * scale;
    
    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        const charIndex = CLOCK_FONT.chars.indexOf(char);
        
        if (charIndex !== -1) {
            // 计算在网格中的行列位置
            const col = charIndex % CLOCK_FONT.cols;
            const row = Math.floor(charIndex / CLOCK_FONT.cols);
            const offsetX = col * CLOCK_FONT.charWidth * scale;
            const offsetY = row * CLOCK_FONT.charHeight * scale;
            
            html += `<span class="clock-font-char" style="
                display: inline-block;
                width: ${width}px;
                height: ${height}px;
                background: url('${CLOCK_FONT.src}') no-repeat;
                background-position: -${offsetX}px -${offsetY}px;
                background-size: ${imgWidth}px ${imgHeight}px;
            "></span>`;
        } else if (char === '.' || char === '%') {
            // 特殊字符用普通文字显示
            html += `<span class="clock-font-special" style="
                font-size: ${height * 0.6}px;
                color: var(--gold-light);
                margin: 0 2px;
            ">${char}</span>`;
        } else if (char === ' ') {
            html += `<span style="width: ${width * 0.5}px;"></span>`;
        }
    }
    
    html += '</span>';
    return html;
}

// 渲染整数（不带小数点）
function renderClockNumber(num, scale = 1) {
    return renderClockFont(String(Math.floor(num)), scale);
}

// 渲染带一位小数的数字
function renderClockDecimal(num, scale = 1) {
    return renderClockFont(num.toFixed(1), scale);
}

// ========== 角色数据（13个角色） ==========
const CHARACTERS = [
    {
        id: 'emma',
        name: '樱羽艾玛',
        icon: 'icon/Profile_Ema.png',
        magicType: 'active',
        magicName: '杀死魔女的魔法',
        magicDescription: '所有玩家在艾玛胜利或死亡前无法宣告胜利',
        magicCost: 95,
        magicLimit: '整局游戏只可使用一次',
        barColors: ['#ffb6c1', '#fff'],
        multiplayerReady: false
    },
    {
        id: 'hiro',
        name: '二阶堂希罗',
        icon: 'icon/Profile_Hiro.png',
        magicType: 'passive',
        magicName: '死亡回溯',
        magicDescription: '其他玩家打出点数牌后，禁止其移动并结束小轮',
        magicCost: 10,
        magicLimit: null,
        magicEnhanced: '获得4张额外点数牌，连续行动4次',
        magicEnhancedCost: 0,
        barColors: ['#e94560', '#000'],
        multiplayerReady: true
    },
    {
        id: 'coco',
        name: '泽渡可可',
        icon: 'icon/Profile_Coco.png',
        magicType: 'passive',
        magicName: '千里眼',
        magicDescription: '其他玩家经过可可驻足过的格子时，可触发地下室效果',
        magicCost: 20,
        magicLimit: null,
        magicEnhanced: '证物、证词、人心各+1',
        magicEnhancedCost: 0,
        barColors: ['#f39c12', '#000'],
        multiplayerReady: true
    },
    {
        id: 'sherry',
        name: '橘雪莉',
        icon: 'icon/Profile_Sherry.png',
        magicType: 'passive',
        magicName: '巨力化',
        magicDescription: '可以在交锋中直接宣告胜利',
        magicCost: 20,
        magicLimit: null,
        magicEnhanced: '每3小轮选择一名玩家进行直接胜利的交锋，自身不可再移动',
        magicEnhancedCost: 0,
        barColors: ['#3498db', '#e94560'],
        multiplayerReady: true
    },
    {
        id: 'hanna',
        name: '远野汉娜',
        icon: 'icon/Profile_Hanna.png',
        magicType: 'active',
        magicName: '浮空',
        magicDescription: '不打出点数牌自选移动最多X格（X=魔女化/10），移动期间不触发交锋',
        magicCost: 15,
        magicLimit: null,
        magicEnhanced: '获得两次自选最高10步的移动，初始可指定任意方向，移动期间正常触发交锋',
        magicEnhancedCost: 0,
        barColors: ['#27ae60', '#000'],
        multiplayerReady: true
    },
    {
        id: 'anan',
        name: '夏目安安',
        icon: 'icon/Profile_AnAn.png',
        magicType: 'passive',
        magicName: '洗脑',
        magicDescription: '其他玩家出牌前，可指定其打出的点数',
        magicCost: 10,
        magicLimit: null,
        magicEnhanced: '获得四次机会，将玩家本小轮获得的线索交给安安',
        magicEnhancedCost: 0,
        barColors: ['#9b59b6', '#fff'],
        multiplayerReady: true
    },
    {
        id: 'noah',
        name: '城崎诺亚',
        icon: 'icon/Profile_Noah.png',
        magicType: 'active',
        magicName: '液体操控',
        magicDescription: '将所有格子重新随机',
        magicCost: 10,
        magicLimit: '每回合限一次',
        magicEnhanced: '随机所有格子，且只有诺亚可以看见格子效果',
        magicEnhancedCost: 0,
        barColors: ['linear-gradient(90deg,#e94560,#f39c12,#27ae60,#3498db)', '#000'],
        multiplayerReady: false
    },
    {
        id: 'leiya',
        name: '莲见蕾雅',
        icon: 'icon/Profile_Leia.png',
        magicType: 'passive',
        magicName: '视线诱导',
        magicDescription: '当对手到达分叉路口时，可指定其方向',
        magicCost: 7,
        magicLimit: null,
        magicEnhanced: '指定接下来三小轮所有玩家的分叉方向，期间不可被其他魔法控制',
        magicEnhancedCost: 0,
        barColors: ['#ffd700', '#000'],
        multiplayerReady: true
    },
    {
        id: 'milia',
        name: '佐伯米莉亚',
        icon: 'icon/Profile_Miria.png',
        magicType: 'passive',
        magicName: '互换',
        magicDescription: '交锋后可互换两人的方向、顺位和所有线索',
        magicCost: 30,
        magicLimit: null,
        magicEnhanced: '立即互换所有人的位置，自身每种线索等于场上最多的那位',
        magicEnhancedCost: 0,
        barColors: ['#f1c40f', '#000'],
        multiplayerReady: true
    },
    {
        id: 'nayeka',
        name: '黑部奈叶香',
        icon: 'icon/Profile_Nanoka.png',
        magicType: 'innate',
        magicName: '幻视',
        magicDescription: '一直都可以看到所有格子的“里世界”。魔法可以使格子变成里世界的格子效果。（限6次）',
        magicCost: 15,
        magicEnhanced: '持续为里世界效果，一无所有格子不再产生',
        magicEnhancedCost: 0,
        barColors: ['#2c3e50', '#7f8c8d'],
        multiplayerReady: false
    },
    {
        id: 'marg',
        name: '宝生玛格',
        icon: 'icon/Profile_Margo.png',
        magicType: 'passive',
        magicName: '模仿',
        magicDescription: '其他玩家使用魔法后，使其魔法失效',
        magicCost: 20,
        magicEnhanced: '静谧所有人的魔法，持续到自身宣告失败或胜利（不可静谧艾玛）',
        magicEnhancedCost: 0,
        barColors: ['#9b59b6', '#000'],
        multiplayerReady: true
    },
    {
        id: 'arisa',
        name: '紫藤亚里沙',
        icon: 'icon/Profile_Alisa.png',
        magicType: 'active',
        magicName: '点火',
        magicDescription: '删除自身周围3格内的所有格子效果',
        magicCost: 10,
        magicEnhanced: '每一小轮都删除自身4格内的所有格子效果',
        magicEnhancedCost: 0,
        barColors: ['#c0392b', '#000'],
        multiplayerReady: false
    },
    {
        id: 'meruru',
        name: '冰上梅露露',
        icon: 'icon/Profile_Meruru.png',
        magicType: 'innate',
        magicName: '治愈',
        magicDescription: '驻留地下室或娱乐室后，将5点魔女化传递给指定角色（每回合魔女化+10）',
        magicCost: 0,
        magicEnhanced: '所有玩家魔女化每小轮+5，持续到梅露露胜利或失败',
        magicEnhancedCost: 0,
        barColors: ['#ffb6c1', '#e94560'],
        multiplayerReady: false
    }
];

// ========== 角色图片资源映射 ==========
const CHARACTER_IMAGES = {
    emma: {
        cover: 'icon/character_cover/Ema.png',
        pin: 'icon/pin/Pin_Ema.png',
        victory: 'icon/battle/victory/Victory_Ema.png',
        normal: 'character_image/normal/Ema.png',
        stress: 'character_image/stress/Ema.png',
        witch: 'character_image/witch/Ema.png'
    },
    hiro: {
        cover: 'icon/character_cover/Hiro.png',
        pin: 'icon/pin/Pin_Hiro.png',
        victory: 'icon/battle/victory/Victory_Hiro.png',
        normal: 'character_image/normal/Hiro.png',
        stress: 'character_image/stress/Hiro.png',
        witch: 'character_image/witch/Hiro.png'
    },
    coco: {
        cover: 'icon/character_cover/Coco.png',
        pin: 'icon/pin/Pin_Coco.png',
        victory: 'icon/battle/victory/Victory_Coco.png',
        normal: 'character_image/normal/Coco.png',
        stress: 'character_image/stress/Coco.png',
        witch: 'character_image/witch/Coco.png'
    },
    sherry: {
        cover: 'icon/character_cover/Sherry.png',
        pin: 'icon/pin/Pin_Sherry.png',
        victory: 'icon/battle/victory/Victory_Sherry.png',
        normal: 'character_image/normal/Sherry.png',
        stress: 'character_image/stress/Sherry.png',
        witch: 'character_image/witch/Sherry.png'
    },
    hanna: {
        cover: 'icon/character_cover/Hanna.png',
        pin: 'icon/pin/Pin_Hanna.png',
        victory: 'icon/battle/victory/Victory_Hanna.png',
        normal: 'character_image/normal/Hanna.png',
        stress: 'character_image/stress/Hanna.png',
        witch: 'character_image/witch/Hanna.png'
    },
    anan: {
        cover: 'icon/character_cover/Anan.png',
        pin: 'icon/pin/Pin_AnAn.png',
        victory: 'icon/battle/victory/Victory_Anan.png',
        normal: 'character_image/normal/Anan.png',
        stress: 'character_image/stress/Anan.png',
        witch: 'character_image/witch/Anan.png'
    },
    noah: {
        cover: 'icon/character_cover/Noah.png',
        pin: 'icon/pin/Pin_Noah.png',
        victory: 'icon/battle/victory/Victory_Noah.png',
        normal: 'character_image/normal/Noah.png',
        stress: 'character_image/stress/Noah.png',
        witch: 'character_image/witch/Noah.png'
    },
    leiya: {
        cover: 'icon/character_cover/Leia.png',
        pin: 'icon/pin/Pin_Leia.png',
        victory: 'icon/battle/victory/Victory_Leia.png',
        normal: 'character_image/normal/Leia.png',
        stress: 'character_image/stress/Leia.png',
        witch: 'character_image/witch/Leia.png'
    },
    milia: {
        cover: 'icon/character_cover/Miria.png',
        pin: 'icon/pin/Pin_Miria.png',
        victory: 'icon/battle/victory/Victory_Miria.png',
        normal: 'character_image/normal/Miria.png',
        stress: 'character_image/stress/Miria.png',
        witch: 'character_image/witch/Miria.png'
    },
    nayeka: {
        cover: 'icon/character_cover/Nanoka.png',
        pin: 'icon/pin/Pin_Nanoka.png',
        victory: 'icon/battle/victory/Victory_Nanoka.png',
        normal: 'character_image/normal/Nanoka.png',
        stress: 'character_image/stress/Nanoka.png',
        witch: 'character_image/witch/Nanoka.png'
    },
    marg: {
        cover: 'icon/character_cover/Margo.png',
        pin: 'icon/pin/Pin_Margo.png',
        victory: 'icon/battle/victory/Victory_Margo.png',
        normal: 'character_image/normal/Margo.png',
        stress: 'character_image/stress/Margo.png',
        witch: 'character_image/witch/Margo.png'
    },
    arisa: {
        cover: 'icon/character_cover/Alisa.png',
        pin: 'icon/pin/Pin_Alisa.png',
        victory: 'icon/battle/victory/Victory_Alisa.png',
        normal: 'character_image/normal/Alisa.png',
        stress: 'character_image/stress/Alisa.png',
        witch: 'character_image/witch/Alisa.png'
    },
    meruru: {
        cover: 'icon/character_cover/Meruru.png',
        pin: 'icon/pin/Pin_Meruru.png',
        victory: 'icon/battle/victory/Victory_Meruru.png',
        normal: 'character_image/normal/Meruru.png',
        stress: 'character_image/stress/Meruru.png',
        witch: 'character_image/witch/Meruru.png'
    }
};

// ========== 辅助函数：获取角色头像HTML ==========
function getCharIcon(char, size = 'normal') {
    const sizeClass = size === 'small' ? 'char-icon-small' : size === 'tiny' ? 'char-icon-tiny' : 'char-icon';
    return `<img src="${char.icon}" alt="${char.name}" class="${sizeClass}">`;
}

// ========== 辅助函数：获取角色魔女化进度条渐变色 ==========
function getWitchBarGradient(char) {
    if (!char || !char.barColors) {
        return 'linear-gradient(90deg, #9b59b6, #e94560, #9b59b6, #e94560)';
    }
    const [color1, color2] = char.barColors;
    // 如果第一个颜色已经是渐变，直接使用（但需要重复以支持流动）
    if (color1.startsWith('linear-gradient')) {
        return color1;
    }
    // 重复颜色以实现流动效果
    return `linear-gradient(90deg, ${color1}, ${color2}, ${color1}, ${color2})`;
}

// ========== 游戏状态 ==========
let gameState = {
    status: 'menu', // menu, modeSelect, playerCount, characterSelect, playing, paused, ended
    gameMode: 'single', // single, multi
    playerCount: 3,
    currentSelectingPlayer: 0, // 当前正在选择角色的玩家索引
    selectedCharacters: [], // 已选择的角色ID数组
    players: [],
    board: null,
    currentRound: 1,
    currentSubRound: 1,
    totalSubRounds: 3,
    currentPlayerIndex: 0,
    pendingEvents: [],
    // 魔法状态
    magicStates: {
        emmaActive: false,  // 艾玛的魔法是否已发动
        emmaPlayerId: null  // 艾玛的玩家ID
    },
    // 被动技能锁（关闭后不再弹出被动技能提示）
    passiveMagicLock: false
};

// ========== 界面切换 ==========
let isTransitioning = false;

// 各界面需要预加载的资源
const SCREEN_RESOURCES = {
    'menu-screen': [],
    'mode-screen': [],
    'playercount-screen': [],
    'character-screen': [
        // 角色头像
        ...CHARACTERS.map(c => c.icon),
        // 角色封面图
        ...Object.values(CHARACTER_IMAGES).map(img => img.cover)
    ],
    'game-screen': [
        // 所有角色图片
        ...Object.values(CHARACTER_IMAGES).flatMap(img => [
            img.cover, img.pin, img.victory, img.normal, img.stress, img.witch
        ]),
        // 背景
        'Background/Hub.png'
    ],
    'settings-screen': ['Background/Setting.png'],
    'rules-screen': ['Background/Library.png'],
    'credits-screen': []
};

// 预加载图片
function preloadImages(urls) {
    const validUrls = urls.filter(url => url); // 过滤空值
    if (validUrls.length === 0) return Promise.resolve();
    
    return Promise.all(validUrls.map(url => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = resolve;
            img.onerror = resolve; // 加载失败也继续
            img.src = url;
        });
    }));
}

function showScreen(screenId, skipTransition = false) {
    // 如果正在转场中，忽略
    if (isTransitioning) return;
    
    // 获取当前显示的界面
    const currentScreen = document.querySelector('[id$="-screen"]:not(.hidden)');
    const targetScreen = document.getElementById(screenId);
    
    // 如果目标就是当前界面，不做任何事
    if (currentScreen && currentScreen.id === screenId) return;
    
    // 跳过转场（用于初始化）
    if (skipTransition || !currentScreen) {
        executeScreenChange(screenId);
        return;
    }
    
    // 执行转场动画
    isTransitioning = true;
    const transition = document.getElementById('screen-transition');
    
    // 更新加载提示
    const tipEl = transition.querySelector('.loading-tip');
    if (tipEl && typeof getRandomTip === 'function') {
        tipEl.textContent = getRandomTip();
    }
    
    // 淡入黑幕
    transition.classList.add('active', 'fade-in');
    transition.classList.remove('fade-out');
    
    // 等待黑幕完全显示后开始加载资源
    setTimeout(async () => {
        // 预加载目标界面的资源
        const resources = SCREEN_RESOURCES[screenId] || [];
        if (resources.length > 0) {
            await preloadImages(resources);
        }
        
        // 切换界面
        executeScreenChange(screenId);
        
        // 淡出黑幕
        transition.classList.remove('fade-in');
        transition.classList.add('fade-out');
        
        // 1秒后完成转场
        setTimeout(() => {
            transition.classList.remove('active', 'fade-out');
            isTransitioning = false;
        }, 1000);
    }, 1000);
}

// 实际执行界面切换
function executeScreenChange(screenId) {
    // 隐藏所有界面
    document.querySelectorAll('[id$="-screen"]').forEach(screen => {
        screen.classList.add('hidden');
    });
    // 显示目标界面
    document.getElementById(screenId).classList.remove('hidden');
    
    // 根据界面切换音乐
    if (screenId === 'menu-screen' || screenId === 'mode-screen' || 
        screenId === 'playercount-screen' || screenId === 'character-screen' ||
        screenId === 'online-screen' || screenId === 'room-screen') {
        if (typeof playHubMusic === 'function' && audioState && audioState.currentCategory !== 'Hub') {
            playHubMusic();
        }
    }
    
    // 进入设置界面时更新滑块状态
    if (screenId === 'settings-screen') {
        updateSettingsSliders();
    }
}

// 快速切换（无转场）
function showScreenFast(screenId) {
    showScreen(screenId, true);
}

// ========== 规则翻页功能 ==========
let currentRulesPage = 1;
const totalRulesPages = 8;

function changeRulesPage(delta) {
    const newPage = currentRulesPage + delta;
    if (newPage >= 1 && newPage <= totalRulesPages) {
        goToRulesPage(newPage);
    }
}

function goToRulesPage(pageNum) {
    if (pageNum < 1 || pageNum > totalRulesPages) return;
    
    currentRulesPage = pageNum;
    
    // 更新页面显示
    document.querySelectorAll('.rules-page').forEach(page => {
        page.classList.remove('active');
    });
    const targetPage = document.querySelector(`.rules-page[data-page="${pageNum}"]`);
    if (targetPage) {
        targetPage.classList.add('active');
    }
    
    // 更新页码指示器
    document.querySelectorAll('.rules-page-dot').forEach((dot, index) => {
        dot.classList.toggle('active', index + 1 === pageNum);
    });
}

// ========== 设置界面辅助函数 ==========
function updateSettingsSliders() {
    // 更新BGM滑块
    const bgmSlider = document.getElementById('settings-bgm-slider');
    const bgmValue = document.getElementById('settings-bgm-value');
    if (bgmSlider && audioState) {
        bgmSlider.value = audioState.bgmVolume * 100;
        if (bgmValue) bgmValue.textContent = Math.round(audioState.bgmVolume * 100) + '%';
    }
    
    // 更新SFX滑块
    const sfxSlider = document.getElementById('settings-sfx-slider');
    const sfxValue = document.getElementById('settings-sfx-value');
    if (sfxSlider && audioState) {
        sfxSlider.value = audioState.sfxVolume * 100;
        if (sfxValue) sfxValue.textContent = Math.round(audioState.sfxVolume * 100) + '%';
    }
    
    // 更新静音按钮
    const muteBtn = document.getElementById('settings-mute-btn');
    if (muteBtn && audioState) {
        if (audioState.isMuted) {
            muteBtn.textContent = '🔇 关闭';
            muteBtn.classList.add('off');
        } else {
            muteBtn.textContent = '🔊 开启';
            muteBtn.classList.remove('off');
        }
    }
    
    // 更新粒子效果按钮
    const particlesBtn = document.getElementById('settings-particles-btn');
    if (particlesBtn) {
        if (particleSystem && particleSystem.isRunning) {
            particlesBtn.textContent = '✨ 开启';
            particlesBtn.classList.remove('off');
        } else {
            particlesBtn.textContent = '✨ 关闭';
            particlesBtn.classList.add('off');
        }
    }
}

// 切换粒子效果
let particlesEnabled = true;
function toggleParticlesEffect() {
    particlesEnabled = !particlesEnabled;
    if (particlesEnabled) {
        if (typeof resumeParticles === 'function') {
            resumeParticles();
        }
    } else {
        if (typeof stopParticles === 'function') {
            stopParticles();
        }
    }
    updateSettingsSliders();
}

// ========== 玩家名称 ==========
let playerName = localStorage.getItem('playerName') || '';
let playerNameColor = localStorage.getItem('playerNameColor') || '#4ade80';

// 可用的名字颜色列表
const NAME_COLORS = ['#4ade80', '#a855f7', '#ec4899', '#f97316', '#eab308', '#3b82f6', '#ef4444', '#ffffff'];

// AI玩家的固定随机颜色（每个AI一个固定颜色，避免每次渲染变化）
const aiColors = {};

function savePlayerName(name) {
    playerName = name.trim();
    localStorage.setItem('playerName', playerName);
}

function getPlayerName() {
    return playerName || '玩家';
}

function getPlayerNameColor() {
    return playerNameColor;
}

// 获取AI的颜色（固定随机，同一个AI始终同色）
function getAIColor(aiIndex) {
    if (!aiColors[aiIndex]) {
        aiColors[aiIndex] = NAME_COLORS[Math.floor(Math.random() * NAME_COLORS.length)];
    }
    return aiColors[aiIndex];
}

// 格式化玩家名字（第一个字放大并着色）
function formatPlayerName(name, color) {
    if (!name) return '玩家';
    const firstChar = name.charAt(0);
    const rest = name.slice(1);
    return `<span style="color:${color || playerNameColor}; font-size:1.2em; font-weight:700; text-shadow:0 0 8px ${color || playerNameColor};">${firstChar}</span>${rest}`;
}

// 切换颜色选择器显示
function toggleColorPicker() {
    const picker = document.getElementById('name-color-picker');
    if (picker) {
        picker.classList.toggle('hidden');
        if (typeof playHoverSFX === 'function') playHoverSFX();
    }
}

// 选择名字颜色
function selectNameColor(color) {
    playerNameColor = color;
    localStorage.setItem('playerNameColor', color);
    
    // 更新预览
    const preview = document.getElementById('color-preview');
    if (preview) {
        preview.style.background = color;
    }
    
    // 更新所有颜色选项的选中状态
    document.querySelectorAll('.color-option').forEach(opt => {
        opt.classList.toggle('selected', opt.dataset.color === color);
    });
    
    // 隐藏选择器
    const picker = document.getElementById('name-color-picker');
    if (picker) {
        picker.classList.add('hidden');
    }
    
    if (typeof playSelectSFX === 'function') playSelectSFX();
}

// 更新名字预览（输入时）
function updateNamePreview() {
    // 可以在这里添加实时预览逻辑
}

// 初始化玩家名称输入框
function initPlayerNameInput() {
    const input = document.getElementById('player-name-input');
    if (input && playerName) {
        input.value = playerName;
    }
    
    // 初始化颜色预览
    const preview = document.getElementById('color-preview');
    if (preview) {
        preview.style.background = playerNameColor;
    }
    
    // 初始化颜色选项选中状态
    document.querySelectorAll('.color-option').forEach(opt => {
        opt.classList.toggle('selected', opt.dataset.color === playerNameColor);
    });
}

// ========== 日夜切换 ==========
let isNightMode = false;

function toggleDayNight() {
    isNightMode = !isNightMode;
    const menuScreen = document.getElementById('menu-screen');
    const toggleBtn = document.getElementById('day-night-toggle');
    
    if (isNightMode) {
        menuScreen.classList.add('night-mode');
        toggleBtn.textContent = '黑夜';
        toggleBtn.title = '切换到白天';
    } else {
        menuScreen.classList.remove('night-mode');
        toggleBtn.textContent = '白昼';
        toggleBtn.title = '切换到夜晚';
    }
}

// 根据实际时间自动设置日夜模式
function autoSetDayNight() {
    const hour = new Date().getHours();
    // 6:00 - 18:00 为白天
    if (hour < 6 || hour >= 18) {
        if (!isNightMode) {
            toggleDayNight();
        }
    }
}

// ========== 模式选择 ==========
function selectGameMode(mode) {
    gameState.gameMode = mode;
    showScreen('playercount-screen');
}

// ========== 人数选择 ==========
function selectPlayerCount(count) {
    gameState.playerCount = count;
    gameState.currentSelectingPlayer = 0;
    gameState.selectedCharacters = [];
    
    // 更新按钮状态
    document.querySelectorAll('#playercount-screen .btn-circle').forEach(btn => {
        btn.classList.toggle('selected', parseInt(btn.dataset.count) === count);
    });
}

function confirmPlayerCount() {
    // 重置角色选择状态
    gameState.currentSelectingPlayer = 0;
    gameState.selectedCharacters = [];
    gameState.tempSelectedChar = null;
    
    // 进入角色选择
    showScreen('character-screen');
    renderCharacterSelectScreen();
}

// ========== 角色选择（新版） ==========
function renderCharacterSelectScreen() {
    const playerNum = gameState.currentSelectingPlayer + 1;
    const isAI = gameState.gameMode === 'single' && playerNum > 1;
    
    // 更新标题 - 所有玩家名字都带颜色格式
    const titleEl = document.getElementById('char-select-title');
    if (isAI) {
        const aiName = `AI ${playerNum - 1}`;
        titleEl.innerHTML = `${formatPlayerName(aiName, getAIColor(playerNum - 1))} 选择角色`;
    } else if (playerNum === 1) {
        titleEl.innerHTML = `${formatPlayerName(getPlayerName(), getPlayerNameColor())} 选择角色`;
    } else {
        titleEl.innerHTML = `${formatPlayerName(`玩家 ${playerNum}`, getAIColor(playerNum + 10))} 选择角色`;
    }
    
    // 更新进度指示器（菱形样式）
    const progressEl = document.getElementById('char-select-progress');
    progressEl.innerHTML = '';
    for (let i = 0; i < gameState.playerCount; i++) {
        // 添加菱形
        const diamond = document.createElement('span');
        diamond.className = 'progress-diamond';
        if (i < gameState.currentSelectingPlayer) {
            diamond.classList.add('done');
        } else if (i === gameState.currentSelectingPlayer) {
            diamond.classList.add('current');
        } else {
            diamond.classList.add('waiting');
        }
        progressEl.appendChild(diamond);
        
        // 添加连接线（除了最后一个）
        if (i < gameState.playerCount - 1) {
            const line = document.createElement('span');
            line.className = 'progress-line';
            if (i < gameState.currentSelectingPlayer) {
                line.classList.add('done');
            }
            progressEl.appendChild(line);
        }
    }
    
    // 渲染角色列表（新版右侧滑出式卡片）
    const listEl = document.getElementById('character-list');
    listEl.className = 'char-card-list';
    listEl.innerHTML = CHARACTERS.map(char => {
        const selectedIndex = gameState.selectedCharacters.indexOf(char.id);
        const isSelected = selectedIndex !== -1;
        const isCurrentSelected = gameState.tempSelectedChar === char.id;
        // 获取角色主题色
        const charColor = char.barColors[0];
        
        // 检查多人模式下是否可用
        const isMultiplayerDisabled = gameState.gameMode === 'multi' && !char.multiplayerReady;
        const isDisabled = isSelected || isMultiplayerDisabled;
        
        // 获取选择者名字
        let takenByName = '';
        if (isSelected) {
            const playerNum = selectedIndex + 1;
            const isAIPlayer = gameState.gameMode === 'single' && playerNum > 1;
            takenByName = isAIPlayer ? `AI ${playerNum - 1}` : `玩家 ${playerNum}`;
        }
        
        return `
            <div class="char-card ${isDisabled ? 'disabled' : ''} ${isCurrentSelected ? 'selected' : ''} ${isMultiplayerDisabled ? 'multiplayer-disabled' : ''}" 
                 style="--char-color: ${charColor};"
                 data-id="${char.id}"
                 onclick="${isDisabled ? '' : `playFlipSFX(); selectCharacterItem('${char.id}')`}"
                 onmouseenter="${isDisabled ? '' : 'playHoverSFX()'}">
                <div class="char-card-avatar">
                    <img src="${char.icon}" alt="${char.name}">
                </div>
                <span class="char-card-name">${char.name}</span>
                ${isSelected ? `<span class="char-card-taken">${takenByName}</span>` : ''}
                ${isMultiplayerDisabled ? `<span class="char-card-taken">多人模式暂不可用</span>` : ''}
            </div>
        `;
    }).join('');
    
    // 更新详情面板
    updateCharacterDetail(gameState.tempSelectedChar);
    
    // AI自动选择（放慢两倍让动画看清）
    if (isAI) {
        setTimeout(() => {
            aiSelectCharacter();
        }, 1600);
    }
}

function selectCharacterItem(charId) {
    gameState.tempSelectedChar = charId;
    
    // 更新选中状态
    document.querySelectorAll('.char-card').forEach(item => {
        item.classList.toggle('selected', item.dataset.id === charId);
    });
    
    // 更新详情
    updateCharacterDetail(charId);
}

// 判断是否是当前玩家的角色选择回合
function isMySelectTurn() {
    // 单人模式：当前选择的是玩家1时显示按钮
    if (gameState.gameMode === 'single') {
        return gameState.currentSelectingPlayer === 0;
    }
    // 多人模式：当前选择的玩家ID等于本地玩家ID时显示按钮
    if (gameState.gameMode === 'multi') {
        const playerNum = gameState.currentSelectingPlayer + 1;
        return playerNum === networkState.localPlayerId;
    }
    return true;
}

function updateCharacterDetail(charId) {
    const detailEl = document.getElementById('character-detail');
    
    if (!charId) {
        detailEl.innerHTML = `
            <div class="char-showcase">
                <div class="char-showcase-placeholder">
                    <p>选择一位预备魔女</p>
                </div>
            </div>
        `;
        return;
    }
    
    const char = CHARACTERS.find(c => c.id === charId);
    if (!char) return;
    
    const images = CHARACTER_IMAGES[charId];
    if (!images) return;
    
    // 播放角色介绍语音（如果有）
    if (typeof playCharacterVoice === 'function') {
        playCharacterVoice(charId);
    }
    
    const typeLabel = char.magicType === 'active' ? '主动' : 
                      char.magicType === 'passive' ? '被动' : '固有';
    
    // 获取魔女化进度条渐变色
    const barGradient = getWitchBarGradient(char);
    
    // 获取角色主题色
    const charColor = char.barColors[0];
    
    // 角色名拆分（第一个字和其余）
    const nameFirst = char.name.charAt(0);
    const nameRest = char.name.slice(1);
    
    // 魔女化上限（梅露露特殊：150）
    const witchLimit = charId === 'meruru' ? 150 : 100;
    
    // 构建状态图HTML（只显示存在的图片，带注解）
    let statesHtml = '';
    if (images.normal) {
        statesHtml += `<div class="char-showcase-state"><div class="char-showcase-state-img"><img src="${images.normal}" alt="正常"></div><span class="char-showcase-state-label">正常状态</span></div>`;
    }
    if (images.stress) {
        statesHtml += `<div class="char-showcase-state"><div class="char-showcase-state-img"><img src="${images.stress}" alt="受击"></div><span class="char-showcase-state-label">受击状态</span></div>`;
    }
    if (images.witch) {
        statesHtml += `<div class="char-showcase-state"><div class="char-showcase-state-img"><img src="${images.witch}" alt="魔女化"></div><span class="char-showcase-state-label">魔女化</span></div>`;
    }
    
    detailEl.innerHTML = `
        <div class="char-showcase" style="--char-color: ${charColor};">
            <!-- 图片层 - 背景封面 -->
            <div class="char-showcase-bg" id="showcase-bg">
                <img src="${images.cover}" alt="${char.name}">
            </div>
            
            <!-- 文字层 -->
            <div class="char-showcase-content" id="showcase-content">
                <!-- 左上角 - 魔法信息 -->
                <div class="char-showcase-magic">
                    <div class="char-showcase-magic-header">
                        <span class="char-showcase-magic-type ${char.magicType}">${typeLabel}</span>
                        <span class="char-showcase-magic-name">${char.magicName}</span>
                    </div>
                    <div class="char-showcase-magic-desc">${char.magicDescription}</div>
                    
                    <!-- 魔女化惩罚 -->
                    <div class="char-showcase-cost">
                        <span>💀</span>
                        <span class="char-showcase-cost-label">魔女化惩罚</span>
                        <span class="char-showcase-cost-value">+${char.magicCost}</span>
                    </div>
                    
                    ${char.magicLimit ? `
                    <div class="char-showcase-limit">
                        <span>⚠️</span>
                        <span>${char.magicLimit}</span>
                    </div>
                    ` : ''}
                    
                    ${char.magicEnhanced ? `
                    <div class="char-showcase-enhanced">
                        <div class="char-showcase-enhanced-title">
                            <span>🌙</span>
                            <span>魔女化后强化</span>
                        </div>
                        <div class="char-showcase-enhanced-desc">${char.magicEnhanced}</div>
                    </div>
                    ` : ''}
                    
                    <div class="char-showcase-witch-limit">
                        <span>🔮</span>
                        <span class="char-showcase-witch-limit-label">魔女化上限</span>
                        <span class="char-showcase-witch-limit-value">${witchLimit}%</span>
                    </div>
                </div>
                
                <!-- 左下角 - 角色名 -->
                <div class="char-showcase-name-area">
                    <div class="char-showcase-name">
                        <span class="char-showcase-name-first">${nameFirst}</span><span class="char-showcase-name-rest">${nameRest}</span>
                    </div>
                </div>
                
                <!-- 左侧底部 - 棋子和头像（带注解） -->
                <div class="char-showcase-left-icons">
                    <div class="char-showcase-icon-wrapper">
                        <img class="char-showcase-pin" src="${images.pin}" alt="棋子">
                        <span class="char-showcase-icon-label">棋子</span>
                    </div>
                    <div class="char-showcase-icon-wrapper">
                        <img class="char-showcase-profile" src="${char.icon}" alt="${char.name}">
                        <span class="char-showcase-icon-label">头像</span>
                    </div>
                </div>
                
                <!-- 右下角上方 - 胜利特效（带注解） -->
                ${images.victory ? `
                <div class="char-showcase-victory-wrapper">
                    <img class="char-showcase-victory" src="${images.victory}" alt="胜利">
                    <span class="char-showcase-victory-label">交锋胜利</span>
                </div>
                ` : ''}
                
                <!-- 右下角 - 角色状态图 -->
                ${statesHtml ? `<div class="char-showcase-states">${statesHtml}</div>` : ''}
                
                <!-- 右上角 - 确认按钮（只在自己回合显示） -->
                ${isMySelectTurn() ? `
                <button class="char-showcase-confirm" onclick="playConfirmSFX(); confirmCharacterSelect()" onmouseenter="playHoverSFX()">
                    确认选择
                </button>
                ` : ''}
            </div>
            
            <!-- 底部 - 魔女化进度条 -->
            <div class="char-showcase-bar">
                <div class="char-showcase-bar-fill" style="background-image: ${barGradient};"></div>
            </div>
        </div>
    `;
    
    // 触发滑入动画
    setTimeout(() => {
        document.getElementById('showcase-bg')?.classList.add('active');
    }, 50);
    setTimeout(() => {
        document.getElementById('showcase-content')?.classList.add('active');
    }, 350); // 0.3s后文字层滑入
}

function confirmCharacterSelect() {
    // 多人模式使用专用函数
    if (gameState.gameMode === 'multi') {
        confirmOnlineCharacterSelect();
        return;
    }
    
    if (!gameState.tempSelectedChar) {
        alert('请先选择一个角色！');
        return;
    }
    
    // 触发滑出动画（先文字层，后图片层，和滑入相反）
    const showcaseContent = document.getElementById('showcase-content');
    const showcaseBg = document.getElementById('showcase-bg');
    
    if (showcaseContent) {
        showcaseContent.classList.remove('active');
        showcaseContent.classList.add('slide-out');
    }
    
    setTimeout(() => {
        if (showcaseBg) {
            showcaseBg.classList.remove('active');
            showcaseBg.classList.add('slide-out');
        }
    }, 300); // 0.3s后图片层滑出
    
    // 等待滑出动画完成后再进行下一步
    setTimeout(() => {
        // 记录选择
        gameState.selectedCharacters.push(gameState.tempSelectedChar);
        gameState.tempSelectedChar = null;
        gameState.currentSelectingPlayer++;
        
        // 检查是否所有人都选完了
        if (gameState.currentSelectingPlayer >= gameState.playerCount) {
            // 初始化游戏数据
            initGame();
            // 显示角色出场转场动画
            showCharacterIntroTransition(() => {
                showScreen('game-screen');
            });
        } else {
            // 下一个玩家选择
            renderCharacterSelectScreen();
        }
    }, 800); // 等待滑出动画完成
}

// 角色出场转场动画
function showCharacterIntroTransition(callback) {
    const overlay = document.createElement('div');
    overlay.className = 'character-intro-overlay';
    
    // 构建每个玩家的展示卡片
    const cardsHtml = gameState.players.map((player, index) => {
        const char = player.character;
        const charColor = char.barColors ? char.barColors[0] : '#9b59b6';
        const images = CHARACTER_IMAGES[char.id];
        const coverImg = images?.cover || char.icon;
        const firstName = char.name.charAt(0);
        const restName = char.name.slice(1);
        
        return `
            <div class="character-intro-card" style="--char-color: ${charColor}; --delay: ${index * 0.4}s;">
                <div class="character-intro-card-inner">
                    <!-- 四角菱形装饰 -->
                    <span class="intro-card-corner top-left">◆</span>
                    <span class="intro-card-corner top-right">◆</span>
                    <span class="intro-card-corner bottom-left">◆</span>
                    <span class="intro-card-corner bottom-right">◆</span>
                    
                    <!-- 封面图 -->
                    <div class="character-intro-cover">
                        <img src="${coverImg}" alt="${char.name}">
                        <div class="intro-cover-overlay"></div>
                    </div>
                    
                    <!-- 信息区 -->
                    <div class="character-intro-info">
                        <div class="character-intro-name">
                            <span class="character-intro-first" style="color: ${charColor};">${firstName}</span><span class="character-intro-rest">${restName}</span>
                        </div>
                        <div class="intro-name-underline" style="background: linear-gradient(90deg, transparent, ${charColor}, transparent);"></div>
                        <div class="character-intro-player">
                            <span class="intro-player-label">操控者</span>
                            <span class="intro-player-name">${player.name}</span>
                        </div>
                    </div>
                    
                    <!-- 底部颜色条 -->
                    <div class="intro-card-bar" style="background: ${charColor};"></div>
                </div>
            </div>
        `;
    }).join('');
    
    overlay.innerHTML = `
        <div class="character-intro-container">
            <!-- 上方装饰 -->
            <div class="intro-decor-top">
                <span class="intro-decor-line"></span>
                <span class="intro-decor-diamond">◆</span>
                <span class="intro-decor-line"></span>
            </div>
            
            <!-- 标题 -->
            <div class="character-intro-title">
                <span class="intro-title-bracket">[</span>
                <span class="intro-title-text">出场预备魔女</span>
                <span class="intro-title-bracket">]</span>
            </div>
            
            <!-- 下方装饰 -->
            <div class="intro-decor-bottom">
                <span class="intro-decor-scale">⚖</span>
            </div>
            
            <!-- 角色卡片 -->
            <div class="character-intro-cards">${cardsHtml}</div>
            
            <!-- 底部提示 -->
            <div class="intro-hint">审判即将开始...</div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // 播放转场音效（学校铃声）
    if (typeof playSFX === 'function' && SFX.schoolBell) {
        playSFX(SFX.schoolBell);
    }
    
    // 触发入场动画
    requestAnimationFrame(() => {
        overlay.classList.add('active');
    });
    
    // 动画结束后移除并回调
    const totalDuration = 1000 + gameState.players.length * 400 + 2500;
    setTimeout(() => {
        overlay.classList.add('fade-out');
        setTimeout(() => {
            overlay.remove();
            if (callback) callback();
        }, 1000);
    }, totalDuration);
}

function aiSelectCharacter() {
    // AI随机选择一个未被选的角色
    const availableChars = CHARACTERS.filter(c => !gameState.selectedCharacters.includes(c.id));
    const randomChar = availableChars[Math.floor(Math.random() * availableChars.length)];
    
    gameState.tempSelectedChar = randomChar.id;
    
    // 更新UI显示AI的选择
    document.querySelectorAll('.char-select-item').forEach(item => {
        item.classList.toggle('selected', item.dataset.id === randomChar.id);
    });
    updateCharacterDetail(randomChar.id);
    
    // 延迟后自动确认（放慢两倍让动画看清）
    setTimeout(() => {
        confirmCharacterSelect();
    }, 2000);
}

// ========== 游戏初始化 ==========
function initGame() {
    // 重置排名计数器
    currentRank = 1;
    
    // 重置被动技能锁
    gameState.passiveMagicLock = false;
    const passiveCheckbox = document.getElementById('passive-lock-checkbox');
    if (passiveCheckbox) {
        passiveCheckbox.checked = true; // 默认开启提示
    }
    
    // 切换到游戏音乐（根据场上状态）
    updateGameMusic();
    
    // 初始化玩家（使用已选择的角色）
    gameState.players = [];
    
    for (let i = 0; i < gameState.playerCount; i++) {
        const charId = gameState.selectedCharacters[i];
        const char = CHARACTERS.find(c => c.id === charId);
        const isAI = gameState.gameMode === 'single' && i > 0;
        // 第一个玩家使用用户输入的名字，AI使用默认名字
        const name = isAI ? `AI ${i}` : (i === 0 ? getPlayerName() : `玩家 ${i + 1}`);
        
        gameState.players.push(createPlayer(i + 1, name, char, isAI));
    }
    
    // 初始化棋盘
    gameState.board = createBoard();
    
    // 初始化回合
    gameState.currentRound = 1;
    gameState.totalSubRounds = Math.floor(Math.random() * 3) + 2; // 2-4
    gameState.currentSubRound = 1;
    gameState.currentPlayerIndex = 0;
    
    // 发牌
    dealCards();
    
    // 渲染
    renderGame();
}

// 四个顶点的初始位置和方向（顺时针）
const START_POSITIONS = [
    { position: 1, direction: 2, cameFrom: 20 },   // 左上角，向右走，来自20
    { position: 6, direction: 7, cameFrom: 5 },    // 右上角，向下走，来自5
    { position: 11, direction: 12, cameFrom: 10 }, // 右下角，向左走，来自10
    { position: 16, direction: 17, cameFrom: 15 }  // 左下角，向上走，来自15
];

// 证据卡定义（与格子上的证据组合一致）
// 每种类型有多个可选线索，随机选择一个
const EVIDENCE_CARDS = {
    // 双证物类 (evidence: 2)
    'evidence_x2_1': { 
        id: 'evidence_x2_1',
        image: 'icon/clue/Clue_006_002.png',
        name: '仪式剑', 
        description: '传说聚齐13位魔女就可以用剑召唤岛上的大魔女，但是这座监牢貌似从来没有成功举行过这样的仪式...',
        provides: { evidence: 2, testimony: 0, heart: 0 } 
    },
    'evidence_x2_2': { 
        id: 'evidence_x2_2',
        image: 'icon/clue/Clue_006_004.png',
        name: '安眠药', 
        description: '药品一定有它的作用，但是这瓶药品空了大半，很难说有没有被过量使用',
        provides: { evidence: 2, testimony: 0, heart: 0 } 
    },
    'evidence_x2_3': { 
        id: 'evidence_x2_3',
        image: 'icon/clue/Clue_010_001.png',
        name: '钢笔', 
        description: '钢笔用来写字。嗯。绝对没有别的用处，尤其不可能有人住在里面。',
        provides: { evidence: 2, testimony: 0, heart: 0 } 
    },
    
    // 双证词类 (testimony: 2)
    'testimony_x2_1': { 
        id: 'testimony_x2_1',
        image: 'icon/clue/Clue_006_006.png',
        name: '梅露露的手机', 
        description: '梅露露不小心把手机掉在案发现场了，里面好像有什么不得了的聊天记录',
        provides: { evidence: 0, testimony: 2, heart: 0 } 
    },
    'testimony_x2_2': { 
        id: 'testimony_x2_2',
        image: 'icon/clue/Clue_006_009.png',
        name: '玻璃碎片', 
        description: '为什么这里会有玻璃碎片？难道这个是隔壁那个世界的记忆？什么叫还能吃？？！',
        provides: { evidence: 0, testimony: 2, heart: 0 } 
    },
    'testimony_x2_3': { 
        id: 'testimony_x2_3',
        image: 'icon/clue/Clue_010_005.png',
        name: '一个文件', 
        description: '这个文件写着什么？大部分都被涂黑了，也许用电脑处理一下就能看清。',
        provides: { evidence: 0, testimony: 2, heart: 0 } 
    },
    
    // 双人心类 (heart: 2)
    'heart_x2_1': { 
        id: 'heart_x2_1',
        image: 'icon/clue/Clue_007_005.png',
        name: '垃圾焚烧炉', 
        description: '垃圾焚烧炉每周一下午三点都会启动，不知怎么回事，这个监牢里的许多魔女和故事和垃圾焚烧炉都有千丝万缕的联系',
        provides: { evidence: 0, testimony: 0, heart: 2 } 
    },
    'heart_x2_2': { 
        id: 'heart_x2_2',
        image: 'icon/clue/Clue_007_006.png',
        name: '左轮手枪', 
        description: '一把手枪。既然出现在这，说明是某位魔女传下来，为后人而是用的。啊，这何尝不是一种延续？',
        provides: { evidence: 0, testimony: 0, heart: 2 } 
    },
    'heart_x2_3': { 
        id: 'heart_x2_3',
        image: 'icon/clue/Clue_010_007.png',
        name: '声音', 
        description: '岛上的大魔女们留下过一些讯息，不过这座监牢的预备魔女都快压力爆了，从来没人耐心听过她们在讲什么。',
        provides: { evidence: 0, testimony: 0, heart: 2 } 
    },
    
    // 证物+证词类 (evidence: 1, testimony: 1)
    'evidence_testimony_1': { 
        id: 'evidence_testimony_1',
        image: 'icon/clue/Clue_007_009.png',
        name: '染色的手稿', 
        description: '这些画出自一名有名的画师之手，上面的杂乱无章的图像拼凑起来，好像有什么隐藏的秘密',
        provides: { evidence: 1, testimony: 1, heart: 0 } 
    },
    'evidence_testimony_2': { 
        id: 'evidence_testimony_2',
        image: 'icon/clue/Clue_007_010.png',
        name: '绳索', 
        description: '一捆绳索。既然尸体没有窒息痕迹，那么这个绳索的意义又在哪里？',
        provides: { evidence: 1, testimony: 1, heart: 0 } 
    },
    'evidence_testimony_3': { 
        id: 'evidence_testimony_3',
        image: 'icon/clue/Clue_010_003.png',
        name: '报纸的碎片', 
        description: '这个监狱密不透风，哪里有新闻能飞过来？等等......',
        provides: { evidence: 1, testimony: 1, heart: 0 } 
    },
    
    // 证物+人心类 (evidence: 1, heart: 1)
    'evidence_heart_1': { 
        id: 'evidence_heart_1',
        image: 'icon/clue/Clue_008_005.png',
        name: '安安的手机', 
        description: '安安的手机被装饰的很好看，光看着暴露出来它的主人严重睡眠不足（或者看起来睡眠不足）的事实。',
        provides: { evidence: 1, testimony: 0, heart: 1 } 
    },
    'evidence_heart_2': { 
        id: 'evidence_heart_2',
        image: 'icon/clue/Clue_009_002.png',
        name: '刺剑', 
        description: '这把剑可不是装饰，曾经可是用来保护了他人，不过它的主人也因此牺牲了......真的！',
        provides: { evidence: 1, testimony: 0, heart: 1 } 
    },
    'evidence_heart_3': { 
        id: 'evidence_heart_3',
        image: 'icon/clue/Clue_010_011.png',
        name: '魔女百科', 
        description: '这本书其实是其实是萌娘百科。你想想啊！魔女有大魔女这种百年老妈妈，也有预备魔女这种魔法少女，记载她们的书难道不是萌娘百科？',
        provides: { evidence: 1, testimony: 0, heart: 1 } 
    },
    
    // 证词+人心类 (testimony: 1, heart: 1)
    'testimony_heart_1': { 
        id: 'testimony_heart_1',
        image: 'icon/clue/Clue_009_006.png',
        name: '人字梯', 
        description: '爬梯子的时候注意不要摔下来了。哦，搬梯子的时候也是，注意身边有没有人，有人赶紧跑。',
        provides: { evidence: 0, testimony: 1, heart: 1 } 
    },
    'testimony_heart_2': { 
        id: 'testimony_heart_2',
        image: 'icon/clue/Clue_009_009.png',
        name: '染血的制服', 
        description: '我说了，搬人字梯的时候要小心一点......',
        provides: { evidence: 0, testimony: 1, heart: 1 } 
    },
    'testimony_heart_3': { 
        id: 'testimony_heart_3',
        image: 'icon/clue/Clue_009_011.png',
        name: '人偶', 
        description: '这可不是巫毒玩偶。如果你也会做娃娃，做成这样已经很厉害了。',
        provides: { evidence: 0, testimony: 1, heart: 1 } 
    }
};

// 按类型分组的线索卡ID
const EVIDENCE_CARD_TYPES = {
    evidence_x2: ['evidence_x2_1', 'evidence_x2_2', 'evidence_x2_3'],
    testimony_x2: ['testimony_x2_1', 'testimony_x2_2', 'testimony_x2_3'],
    heart_x2: ['heart_x2_1', 'heart_x2_2', 'heart_x2_3'],
    evidence_testimony: ['evidence_testimony_1', 'evidence_testimony_2', 'evidence_testimony_3'],
    evidence_heart: ['evidence_heart_1', 'evidence_heart_2', 'evidence_heart_3'],
    testimony_heart: ['testimony_heart_1', 'testimony_heart_2', 'testimony_heart_3']
};

// 获取随机线索卡（按类型）
function getRandomClueByType(type) {
    const cards = EVIDENCE_CARD_TYPES[type];
    if (!cards) return null;
    return cards[Math.floor(Math.random() * cards.length)];
}

// 获取线索卡的显示标签（用于简短显示）
function getClueLabel(cardId) {
    const card = EVIDENCE_CARDS[cardId];
    if (!card) return '❓';
    const p = card.provides;
    let label = '';
    if (p.evidence > 0) label += '🔍'.repeat(p.evidence);
    if (p.testimony > 0) label += '📜'.repeat(p.testimony);
    if (p.heart > 0) label += '💗'.repeat(p.heart);
    return label || '❓';
}

function createPlayer(id, name, character, isAI) {
    const startInfo = START_POSITIONS[(id - 1) % 4];
    const player = {
        id,
        name,
        character,
        isAI,
        position: startInfo.position,
        direction: startInfo.direction,
        cameFrom: startInfo.cameFrom,
        evidenceCards: [],  // 持有的证据卡数组
        evidenceThisSubRound: [],  // 本小轮获得的证据（用于安安强化洗脑）
        witchification: 0,
        isWitchified: false,
        witchifiedRound: null,
        handCards: [],
        isEliminated: false,
        rank: null,
        visitedCells: new Set(),  // 可可技能：记录驻足过的格子
        enhancedMagicUsed: false  // 强化魔法是否已使用
    };
    
    return player;
}

// 辅助函数：给玩家添加证据卡（同时记录到本小轮获得的证据）
function giveEvidenceCard(player, cardId) {
    player.evidenceCards.push(cardId);
    if (!player.evidenceThisSubRound) {
        player.evidenceThisSubRound = [];
    }
    player.evidenceThisSubRound.push(cardId);
    
    // 玩家自己获得线索时播放音效
    if (!player.isAI && typeof playSFX === 'function' && SFX.clap) {
        playSFX(SFX.clap);
    }
}

// 计算玩家的资源总和
function getPlayerResources(player) {
    const totals = { evidence: 0, testimony: 0, heart: 0 };
    player.evidenceCards.forEach(cardId => {
        const card = EVIDENCE_CARDS[cardId];
        if (card) {
            totals.evidence += card.provides.evidence;
            totals.testimony += card.provides.testimony;
            totals.heart += card.provides.heart;
        }
    });
    
    // 可可强化魔法加成
    if (player.cocoEnhancedBonus) {
        totals.evidence += player.cocoEnhancedBonus.evidence;
        totals.testimony += player.cocoEnhancedBonus.testimony;
        totals.heart += player.cocoEnhancedBonus.heart;
    }
    
    return totals;
}

// 格子类型定义
const CELL_TYPES = {
    lounge: { name: '娱乐室', emoji: '🎮', color: '#27ae60', description: '删除自己一个证据' },
    basement: { name: '地下室', emoji: '🔦', color: '#9b59b6', description: '从三个证据中至多选择一个' },
    scene: { name: '现场', emoji: '🔍', color: '#e67e22', description: '获得格子上的证据' }
};

// 现场格子的证据类型（6种）
const EVIDENCE_COMBO_TYPES = [
    { type: 'evidence_x2', label: '🔍🔍 两个证物' },
    { type: 'heart_x2', label: '💗💗 两个人心' },
    { type: 'testimony_x2', label: '📜📜 两个证词' },
    { type: 'evidence_testimony', label: '🔍📜 证物+证词' },
    { type: 'evidence_heart', label: '🔍💗 证物+人心' },
    { type: 'testimony_heart', label: '📜💗 证词+人心' }
];

function createBoard() {
    const cells = [];
    const allCellIds = BOARD_GRID.flat().filter(id => id !== null);
    
    allCellIds.forEach(id => {
        cells.push(createCell(id));
    });
    
    return { cells };
}

// 里世界效果类型
const SHADOW_EFFECTS = {
    swap: { name: '位置互换', emoji: '🔄', description: '互换指定两个角色的位置' },
    basement: { name: '地下室', emoji: '🔦', description: '自身触发一次地下室效果' },
    forceDelete: { name: '强制删除', emoji: '🗑️', description: '强制要求一个玩家删除一个证据卡' },
    nothing: { name: '一无所有', emoji: '💨', description: '什么都没有发生' }
};

function createCell(id) {
    const type = rollCellType();
    const cell = {
        id,
        type,
        isTriggered: false,
        triggeredBy: null,
        triggeredByName: null,
        // 里世界效果
        shadowEffect: rollShadowEffect(false)
    };
    
    // 现场格子需要随机证据组合
    if (type === 'scene') {
        const comboType = EVIDENCE_COMBO_TYPES[Math.floor(Math.random() * EVIDENCE_COMBO_TYPES.length)];
        // 随机选择该类型的一个具体线索卡
        const cardId = getRandomClueByType(comboType.type);
        cell.evidenceCombo = {
            type: comboType.type,
            label: comboType.label,
            cardId: cardId
        };
    }
    
    return cell;
}

// 生成里世界效果（比例 20:20:20:30 = swap:basement:forceDelete:nothing）
function rollShadowEffect(excludeNothing = false) {
    const rand = Math.random() * (excludeNothing ? 60 : 90);
    if (rand < 20) return 'swap';
    if (rand < 40) return 'basement';
    if (rand < 60) return 'forceDelete';
    return 'nothing';
}

function rollCellType() {
    const rand = Math.random();
    if (rand < 0.10) return 'lounge';      // 10% 娱乐室
    if (rand < 0.20) return 'basement';    // 10% 地下室
    return 'scene';                         // 80% 现场
}

function refreshAllCells() {
    gameState.board.cells.forEach(cell => {
        const newCell = createCell(cell.id);
        Object.assign(cell, newCell);
    });
}

function dealCards() {
    gameState.players.forEach(player => {
        player.handCards = [];
        for (let i = 0; i < gameState.totalSubRounds + 1; i++) {
            player.handCards.push(Math.floor(Math.random() * 6) + 1);
        }
    });
}

// ========== 游戏渲染 ==========
function renderGame() {
    renderNavbar();
    renderTurnOrder();
    renderPlayerSlots();
    renderMobilePlayersBar(); // 手机端玩家状态栏
    renderBoard();
    renderUserConsole();
    updatePrompt();
    // 只在游戏开始时启动计时器，不要每次渲染都启动
    if (!gameTimerInterval) {
        startGameTimer();
    }
}

// 游戏计时器
let gameStartTime = null;
let gameTimerInterval = null;

function startGameTimer() {
    if (!gameStartTime) {
        gameStartTime = Date.now();
    }
    if (gameTimerInterval) {
        clearInterval(gameTimerInterval);
    }
    gameTimerInterval = setInterval(updateGameTime, 1000);
    updateGameTime();
}

function updateGameTime() {
    const elapsed = Math.floor((Date.now() - gameStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const seconds = (elapsed % 60).toString().padStart(2, '0');
    const timeEl = document.getElementById('game-time');
    if (timeEl) {
        timeEl.innerHTML = renderClockFont(`${minutes}:${seconds}`, 0.35);
    }
}

// 渲染导航栏
function renderNavbar() {
    const roundEl = document.getElementById('game-round');
    const stageEl = document.getElementById('game-stage');
    if (roundEl) roundEl.innerHTML = `第${renderClockNumber(gameState.currentRound, 0.35)}轮`;
    if (stageEl) stageEl.innerHTML = `第${renderClockNumber(gameState.currentSubRound, 0.35)}局`;
}

// 渲染出牌顺序
function renderTurnOrder() {
    const bar = document.getElementById('turn-order-bar');
    if (!bar) return;
    
    // 获取未淘汰的玩家按出牌顺序排列
    const activePlayers = gameState.players.filter(p => !p.isEliminated);
    const currentIdx = gameState.currentPlayerIndex;
    
    let html = '';
    activePlayers.forEach((player, idx) => {
        const playerIdx = gameState.players.indexOf(player);
        const isCurrent = playerIdx === currentIdx;
        const isDone = playerIdx < currentIdx; // 本局已出过牌
        const char = player.character;
        
        html += `
            <div class="turn-order-item ${isCurrent ? 'current' : ''} ${isDone ? 'done' : ''}">
                <span class="turn-order-number">${idx + 1}</span>
                <img class="turn-order-avatar" src="${char.icon}" alt="${char.name}">
                <span class="turn-order-name">${player.name}</span>
            </div>
        `;
    });
    
    bar.innerHTML = html;
}

// 渲染四角玩家卡片
function renderPlayerSlots() {
    const slots = ['slot-top-left', 'slot-top-right', 'slot-bottom-left', 'slot-bottom-right'];
    const humanPlayerIndex = gameState.players.findIndex(p => !p.isAI);
    
    // 重新排列玩家顺序，当前玩家放在右下角
    const reorderedPlayers = [];
    const playerCount = gameState.players.length;
    
    for (let i = 0; i < playerCount; i++) {
        const idx = (humanPlayerIndex + i + 1) % playerCount;
        if (idx !== humanPlayerIndex) {
            reorderedPlayers.push({ player: gameState.players[idx], originalIndex: idx });
        }
    }
    
    // 清空所有槽位
    slots.forEach(slotId => {
        const slot = document.getElementById(slotId);
        if (slot) slot.innerHTML = '';
    });
    
    // 根据玩家数量分配位置
    const slotAssignments = {
        2: ['slot-top-left'], // 2人：对手在左上
        3: ['slot-top-left', 'slot-top-right'], // 3人：对手在上方两角
        4: ['slot-top-left', 'slot-top-right', 'slot-bottom-left'] // 4人：对手在三个角
    };
    
    const assignedSlots = slotAssignments[playerCount] || [];
    
    reorderedPlayers.forEach((item, i) => {
        if (i < assignedSlots.length) {
            const slot = document.getElementById(assignedSlots[i]);
            if (slot) {
                slot.innerHTML = renderPlayerCard(item.player, item.originalIndex);
            }
        }
    });
}

// 渲染手机端玩家状态栏
function renderMobilePlayersBar() {
    const container = document.getElementById('mobile-players-bar');
    if (!container) return;
    
    const currentPlayerIndex = gameState.currentPlayerIndex;
    
    let html = '';
    gameState.players.forEach((player, index) => {
        const isCurrentTurn = index === currentPlayerIndex;
        const resources = getPlayerResources(player);
        
        let statusClass = '';
        if (isCurrentTurn) statusClass += ' active-turn';
        if (player.isWitchified) statusClass += ' witchified';
        if (player.isDefeated) statusClass += ' defeated';
        
        const witchPercent = Math.min(100, player.witchification);
        
        html += `
            <div class="mobile-player-item${statusClass}">
                <img class="mobile-player-avatar" src="icon/Profile_${player.character.id.charAt(0).toUpperCase() + player.character.id.slice(1)}.png" alt="${player.character.name}">
                <div class="mobile-player-info">
                    <div class="mobile-player-name">${player.character.name}</div>
                    <div class="mobile-player-evidence">
                        <span class="mobile-evidence-item evidence">🔍${resources.evidence}</span>
                        <span class="mobile-evidence-item testimony">📜${resources.testimony}</span>
                        <span class="mobile-evidence-item heart">💗${resources.heart}</span>
                    </div>
                </div>
                <div class="mobile-player-witch">
                    <div class="mobile-player-witch-fill" style="width: ${witchPercent}%"></div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// 渲染单个玩家卡片
function renderPlayerCard(player, playerIndex) {
    const char = player.character;
    const isActive = playerIndex === gameState.currentPlayerIndex;
    const witchLimit = char.id === 'meruru' ? 150 : 100;
    const witchPercent = (player.witchification / witchLimit) * 100;
    
    // 判断玩家状态：胜利/失败
    const isVictory = player.isEliminated && player.rank === 1;
    const isDefeated = player.isEliminated && player.rank !== 1;
    
    // 使用Profile头像图片
    const profileSrc = char.icon; // char.icon 已经是 'icon/Profile_XXX.png' 格式
    
    // 魔法CD状态
    const cdReady = !player.magicCooldown || player.magicCooldown <= 0;
    const cdText = cdReady ? '就绪' : `CD:${player.magicCooldown}`;
    
    // 获取魔法类型标签
    const typeLabel = char.magicType === 'active' ? '主动' : 
                      char.magicType === 'passive' ? '被动' : '固有';
    const typeClass = char.magicType;
    
    // 获取三维资源
    const resources = getPlayerResources(player);
    
    // 生成证据卡列表HTML（使用新的卡片结构）
    const evidenceCardsHtml = player.evidenceCards.length > 0 
        ? player.evidenceCards.map(cardId => {
            const card = EVIDENCE_CARDS[cardId];
            if (!card) return `<span class="evidence-tooltip-item">❓ ${cardId}</span>`;
            return `
                <div class="clue-card-item">
                    <img class="clue-icon" src="${card.image}" alt="${card.name}">
                    <div class="clue-info">
                        <span class="clue-name">${card.name}</span>
                        <span class="clue-label">${getClueLabel(cardId)}</span>
                    </div>
                </div>
            `;
        }).join('')
        : '<span class="evidence-tooltip-empty">暂无证据卡</span>';
    
    return `
        <div class="player-card ${isActive ? 'active-turn' : ''} ${player.isWitchified ? 'witchified' : ''} ${isVictory ? 'victory' : ''} ${isDefeated ? 'defeated' : ''}">
            <!-- 魔女化进度条 -->
            <div class="player-card-witch-bar">
                <div class="player-card-witch-fill" style="width: ${witchPercent}%; background-image: ${getWitchBarGradient(char)};"></div>
                <span class="player-card-witch-value">${renderClockDecimal(player.witchification, 0.25)}%</span>
            </div>
            
            <!-- 卡片主体（头像+魔法） -->
            <div class="player-card-main">
                <!-- 圆形头像 -->
                <div class="player-card-avatar">
                    <img src="${profileSrc}" alt="${char.name}">
                </div>
                
                <!-- 魔法信息 -->
                <div class="player-card-magic" onmouseenter="playFloatSFX()">
                    <div class="player-card-player-name">${player.name}</div>
                    <div class="player-card-char-name">
                        <span class="char-name-first" style="color: ${char.barColors[0]};">${char.name.charAt(0)}</span><span class="char-name-rest">${char.name.slice(1)}</span>
                    </div>
                    <div class="player-card-magic-name">${player.isWitchified && char.magicEnhanced ? '🌙' : '✧'} ${char.magicName}</div>
                    ${player.isWitchified && char.magicEnhanced ? `
                    <div class="player-card-enhanced-hint">强化魔法已解锁</div>
                    ` : ''}
                    <div class="player-card-magic-status">
                        <span class="magic-type-badge ${typeClass}">${typeLabel}</span>
                        <span class="magic-cd-status ${cdReady ? 'ready' : ''}">${cdText}</span>
                    </div>
                    
                    <!-- 魔法详情悬浮窗 -->
                    <div class="magic-tooltip">
                        <div class="magic-tooltip-title">${char.magicName}</div>
                        <div class="magic-tooltip-desc">${char.magicDescription}</div>
                        ${char.magicLimit ? `<div class="magic-tooltip-desc" style="color:#f39c12;">⚠️ ${char.magicLimit}</div>` : ''}
                        <div class="magic-tooltip-cost">
                            <span>💀</span>
                            <span>魔女化惩罚 +${char.magicCost}</span>
                        </div>
                        ${char.magicEnhanced ? `
                        <div class="magic-tooltip-enhanced ${player.isWitchified ? 'active' : ''}">
                            <span>🌙</span>
                            <span>魔女化强化：${char.magicEnhanced}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
            
            <!-- 证据收集进度 -->
            <div class="player-card-evidence" onmouseenter="playFloatSFX()">
                <div class="evidence-progress">
                    <span class="evidence-icon">🔍</span>
                    <div class="evidence-dots">
                        ${renderEvidenceDots(resources.evidence, 8, 'evidence-type')}
                    </div>
                </div>
                <div class="evidence-progress">
                    <span class="evidence-icon">📜</span>
                    <div class="evidence-dots">
                        ${renderEvidenceDots(resources.testimony, 8, 'testimony-type')}
                    </div>
                </div>
                <div class="evidence-progress">
                    <span class="evidence-icon">💗</span>
                    <div class="evidence-dots">
                        ${renderEvidenceDots(resources.heart, 8, 'heart-type')}
                    </div>
                </div>
                
                <!-- 证据详情悬浮窗 -->
                <div class="evidence-tooltip">
                    <div class="evidence-tooltip-title">证据卡 (${player.evidenceCards.length})</div>
                    <div class="evidence-tooltip-list">
                        ${evidenceCardsHtml}
                    </div>
                </div>
            </div>
            
            <!-- 点数牌 -->
            <div class="player-card-cards">
                ${player.handCards.map(card => `<div class="mini-card">${renderClockNumber(card, 0.2)}</div>`).join('')}
            </div>
        </div>
    `;
}

// 渲染证据进度点（8个灯，溢出时显示红色+X）
function renderEvidenceDots(count, max, typeClass) {
    // 如果有溢出，显示红色+X
    if (count > max) {
        const overflow = count - max;
        let html = '';
        // 显示8个满的灯
        for (let i = 0; i < max; i++) {
            html += `<span class="evidence-dot filled ${typeClass}"></span>`;
        }
        // 显示红色溢出数字
        html += `<span class="evidence-overflow">+${overflow}</span>`;
        return html;
    }
    
    // 正常显示灯
    let html = '';
    for (let i = 0; i < max; i++) {
        html += `<span class="evidence-dot ${i < count ? 'filled ' + typeClass : ''}"></span>`;
    }
    return html;
}


// 渲染线索点
function renderClueDots(count, max) {
    let html = '';
    for (let i = 0; i < max; i++) {
        html += `<span class="clue-dot ${i < count ? 'filled' : ''}"></span>`;
    }
    return html;
}

// 渲染用户控制台
function renderUserConsole() {
    // 多人模式：获取本地玩家
    let localPlayer;
    if (networkState.mode === 'online') {
        localPlayer = gameState.players.find(p => p.id === networkState.localPlayerId);
    } else {
        localPlayer = gameState.players.find(p => !p.isAI);
    }
    if (!localPlayer) return;
    
    const char = localPlayer.character;
    const witchLimit = char.id === 'meruru' ? 150 : 100;
    const witchPercent = (localPlayer.witchification / witchLimit) * 100;
    const localPlayerIndex = gameState.players.indexOf(localPlayer);
    const isActive = localPlayerIndex === gameState.currentPlayerIndex;
    
    // 轮到用户时自动打开控制台
    if (isActive && isConsoleCollapsed) {
        openUserConsole();
    }
    
    // 渲染玩家自己的卡片
    renderUserPlayerCard(localPlayer, isActive);
    
    // 更新魔女化进度
    const witchFill = document.getElementById('user-witch-fill');
    const witchLabel = document.getElementById('user-witch-label');
    if (witchFill) {
        witchFill.style.width = `${witchPercent}%`;
        witchFill.style.backgroundImage = getWitchBarGradient(char);
    }
    if (witchLabel) {
        witchLabel.innerHTML = `${renderClockDecimal(localPlayer.witchification, 0.3)}%`;
    }
    
    // 渲染手牌
    renderHandCards();
    
    // 更新魔法按钮状态
    updateMagicButton(localPlayer);
    
    // 渲染特殊按钮（被动开关、里世界）
    renderSpecialButtons(localPlayer);
}

// 渲染玩家自己的卡片（横向布局）
function renderUserPlayerCard(player, isActive) {
    const wrapper = document.getElementById('user-player-card-wrapper');
    if (!wrapper) return;
    
    const char = player.character;
    const witchLimit = char.id === 'meruru' ? 150 : 100;
    const witchPercent = (player.witchification / witchLimit) * 100;
    
    // 判断玩家状态：胜利/失败
    const isVictory = player.isEliminated && player.rank === 1;
    const isDefeated = player.isEliminated && player.rank !== 1;
    
    // 使用头像图片（Profile_XXX.png）
    const profileSrc = char.icon; // char.icon 已经是 'icon/Profile_XXX.png' 格式
    
    // 魔法CD状态
    const cdReady = !player.magicCooldown || player.magicCooldown <= 0;
    const cdText = cdReady ? '就绪' : `CD:${player.magicCooldown}`;
    
    // 获取魔法类型标签
    const typeLabel = char.magicType === 'active' ? '主动' : 
                      char.magicType === 'passive' ? '被动' : '固有';
    const typeClass = char.magicType;
    
    // 获取三维资源
    const resources = getPlayerResources(player);
    
    // 生成证据卡列表HTML（使用新的卡片结构）
    const evidenceCardsHtml = player.evidenceCards.length > 0 
        ? player.evidenceCards.map(cardId => {
            const card = EVIDENCE_CARDS[cardId];
            if (!card) return `<span class="evidence-tooltip-item">❓ ${cardId}</span>`;
            return `
                <div class="clue-card-item">
                    <img class="clue-icon" src="${card.image}" alt="${card.name}">
                    <div class="clue-info">
                        <span class="clue-name">${card.name}</span>
                        <span class="clue-label">${getClueLabel(cardId)}</span>
                    </div>
                </div>
            `;
        }).join('')
        : '<span class="evidence-tooltip-empty">暂无证据卡</span>';
    
    wrapper.innerHTML = `
        <div class="user-player-card ${isActive ? 'active-turn' : ''} ${player.isWitchified ? 'witchified' : ''} ${isVictory ? 'victory' : ''} ${isDefeated ? 'defeated' : ''}">
            <!-- 头像 -->
            <div class="user-card-avatar">
                <img src="${profileSrc}" alt="${char.name}">
            </div>
            
            <!-- 角色信息（带魔法悬浮窗） -->
            <div class="user-card-info user-card-magic-hover" onmouseenter="playFloatSFX()">
                <div class="user-card-player-name">${player.name}</div>
                <div class="user-card-char-name">
                    <span class="char-name-first" style="color: ${char.barColors[0]};">${char.name.charAt(0)}</span><span class="char-name-rest">${char.name.slice(1)}</span>
                </div>
                <div class="user-card-magic-name">${player.isWitchified && char.magicEnhanced ? '🌙' : '✧'} ${char.magicName}</div>
                ${player.isWitchified && char.magicEnhanced ? `
                <div class="user-card-enhanced-hint">强化魔法已解锁</div>
                ` : ''}
                <div class="user-card-magic-status">
                    <span class="magic-type-badge ${typeClass}">${typeLabel}</span>
                    <span class="magic-cd-status ${cdReady ? 'ready' : ''}">${cdText}</span>
                </div>
                
                <!-- 魔法详情悬浮窗 -->
                <div class="user-magic-tooltip">
                    <div class="magic-tooltip-title">${char.magicName}</div>
                    <div class="magic-tooltip-desc">${char.magicDescription}</div>
                    ${char.magicLimit ? `<div class="magic-tooltip-desc" style="color:#f39c12;">⚠️ ${char.magicLimit}</div>` : ''}
                    <div class="magic-tooltip-cost">
                        <span>💀</span>
                        <span>魔女化惩罚 +${char.magicCost}</span>
                    </div>
                    ${char.magicEnhanced ? `
                    <div class="magic-tooltip-enhanced ${player.isWitchified ? 'active' : ''}">
                        <span>🌙</span>
                        <span>魔女化强化：${char.magicEnhanced}</span>
                    </div>
                    ` : ''}
                </div>
            </div>
            
            <!-- 证据收集进度 -->
            <div class="user-card-evidence" onmouseenter="playFloatSFX()">
                <div class="evidence-progress">
                    <span class="evidence-icon">🔍</span>
                    <div class="evidence-dots">
                        ${renderEvidenceDots(resources.evidence, 8, 'evidence-type')}
                    </div>
                </div>
                <div class="evidence-progress">
                    <span class="evidence-icon">📜</span>
                    <div class="evidence-dots">
                        ${renderEvidenceDots(resources.testimony, 8, 'testimony-type')}
                    </div>
                </div>
                <div class="evidence-progress">
                    <span class="evidence-icon">💗</span>
                    <div class="evidence-dots">
                        ${renderEvidenceDots(resources.heart, 8, 'heart-type')}
                    </div>
                </div>
                
                <!-- 证据详情悬浮窗 -->
                <div class="user-evidence-tooltip">
                    <div class="evidence-tooltip-title">证据卡 (${player.evidenceCards.length})</div>
                    <div class="evidence-tooltip-list">
                        ${evidenceCardsHtml}
                    </div>
                </div>
            </div>
            
            <!-- 点数牌 -->
            <div class="user-card-cards">
                ${player.handCards.map(card => `<div class="mini-card">${renderClockNumber(card, 0.2)}</div>`).join('')}
            </div>
        </div>
    `;
}

// 折叠/展开用户控制台
let isConsoleCollapsed = false;

function toggleUserConsole() {
    const consoleEl = document.getElementById('user-console');
    if (!consoleEl) return;
    
    isConsoleCollapsed = !isConsoleCollapsed;
    consoleEl.classList.toggle('collapsed', isConsoleCollapsed);
    
    // 播放音效：打开用flip_2，收起用flip
    if (isConsoleCollapsed) {
        // 收起控制台
        if (typeof playFlipSFX === 'function') {
            playFlipSFX();
        }
    } else {
        // 打开控制台
        if (typeof playFlip2SFX === 'function') {
            playFlip2SFX();
        }
    }
}

// 打开用户控制台（不播放音效，用于自动打开）
function openUserConsole() {
    const consoleEl = document.getElementById('user-console');
    if (!consoleEl || !isConsoleCollapsed) return;
    
    isConsoleCollapsed = false;
    consoleEl.classList.remove('collapsed');
    
    // 播放打开音效
    if (typeof playFlip2SFX === 'function') {
        playFlip2SFX();
    }
}

// 渲染手牌
function renderHandCards() {
    // 多人模式：获取本地玩家
    let localPlayer;
    if (networkState.mode === 'online') {
        localPlayer = gameState.players.find(p => p.id === networkState.localPlayerId);
    } else {
        localPlayer = gameState.players.find(p => !p.isAI);
    }
    if (!localPlayer) return;
    
    const container = document.getElementById('user-hand-cards');
    if (!container) return;
    
    const localPlayerIndex = gameState.players.indexOf(localPlayer);
    const isMyTurn = gameState.currentPlayerIndex === localPlayerIndex && !moveState.isMoving;
    
    container.innerHTML = localPlayer.handCards.map((card, idx) => `
        <div class="hand-card ${!isMyTurn ? 'disabled' : 'my-turn'}" 
             onclick="${isMyTurn ? `playCard(${idx})` : ''}"
             onmouseenter="${isMyTurn ? 'playHoverSFX()' : ''}"
             data-card-index="${idx}">
            ${renderClockNumber(card, 0.5)}
        </div>
    `).join('');
    
    // 更新魔法按钮的发光状态
    const magicBtn = document.getElementById('btn-cast-magic');
    if (magicBtn) {
        const canUseMagic = isMyTurn && canCastMagic(localPlayer);
        if (canUseMagic) {
            magicBtn.classList.add('my-turn');
            magicBtn.classList.remove('disabled');
        } else {
            magicBtn.classList.remove('my-turn');
            if (!isMyTurn) {
                magicBtn.classList.add('disabled');
            }
        }
    }
    
    // 更新回合提示
    updateTurnIndicator(isMyTurn);
}

// 选择手牌（保留用于其他用途）
function selectHandCard(index) {
    const cards = document.querySelectorAll('.hand-card');
    cards.forEach((card, i) => {
        card.classList.toggle('selected', i === index);
    });
    gameState.selectedCardIndex = index;
}

// 更新魔法按钮
function updateMagicButton(player) {
    const btn = document.getElementById('btn-cast-magic');
    const badge = document.getElementById('magic-cd-badge');
    if (!btn || !badge) return;
    
    const cdReady = !player.magicCooldown || player.magicCooldown <= 0;
    
    // 多人模式：检查是否是自己的回合
    let isMyTurn = true;
    if (networkState.mode === 'online') {
        const localPlayerIndex = gameState.players.findIndex(p => p.id === networkState.localPlayerId);
        isMyTurn = localPlayerIndex === gameState.currentPlayerIndex;
    } else {
        const humanPlayerIndex = gameState.players.findIndex(p => !p.isAI);
        isMyTurn = humanPlayerIndex === gameState.currentPlayerIndex;
    }
    
    btn.disabled = !cdReady || !isMyTurn;
    badge.textContent = cdReady ? '就绪' : `CD: ${player.magicCooldown}`;
    
    // 更新按钮样式
    if (isMyTurn && cdReady && canCastMagic(player)) {
        btn.classList.add('my-turn');
        btn.classList.remove('disabled');
    } else {
        btn.classList.remove('my-turn');
        if (!isMyTurn) {
            btn.classList.add('disabled');
        }
    }
}

// 渲染特殊按钮
function renderSpecialButtons(player) {
    const controls = document.getElementById('user-controls');
    if (!controls) return;
    
    const char = player.character;
    const playerId = player.id;
    
    // 移除旧的特殊按钮
    controls.querySelectorAll('.btn-passive-toggle, .btn-shadow-world').forEach(el => el.remove());
    
    // 被动技能开关
    if (char.magicType === 'passive') {
        const passiveBtn = document.createElement('button');
        passiveBtn.className = `btn-passive-toggle ${player.passiveEnabled !== false ? 'active' : ''}`;
        passiveBtn.textContent = player.passiveEnabled !== false ? '被动：开' : '被动：关';
        passiveBtn.onclick = () => {
            const currentPlayer = gameState.players.find(p => p.id === playerId);
            if (currentPlayer) togglePassive(currentPlayer);
        };
        controls.appendChild(passiveBtn);
    }
    
    // 奈叶香的里世界按钮
    if (char.id === 'nayeka') {
        const shadowBtn = document.createElement('button');
        shadowBtn.className = `btn-shadow-world ${player.inShadowWorld ? 'active' : ''}`;
        shadowBtn.textContent = player.inShadowWorld ? '里世界中' : '里世界';
        shadowBtn.onclick = () => {
            const currentPlayer = gameState.players.find(p => p.id === playerId);
            if (currentPlayer) toggleShadowWorld(currentPlayer);
        };
        controls.appendChild(shadowBtn);
    }
}

// 切换被动技能
function togglePassive(player) {
    player.passiveEnabled = player.passiveEnabled === false ? true : false;
    // 同步更新全局被动锁（关闭 = 锁定，不弹出提示）
    gameState.passiveMagicLock = !player.passiveEnabled;
    renderSpecialButtons(player);
}

// 切换里世界
function toggleShadowWorld(player) {
    player.inShadowWorld = !player.inShadowWorld;
    renderSpecialButtons(player);
}

// 退出房间
function exitRoom() {
    if (confirm('确定要退出房间吗？')) {
        if (gameTimerInterval) {
            clearInterval(gameTimerInterval);
        }
        gameStartTime = null;
        showScreen('menu-screen');
    }
}

// 兼容旧函数名
function renderRoundInfo() {
    renderNavbar();
}

// ========== 魔法面板 ==========
function renderMagicPanel() {
    // 新布局不需要单独的魔法面板，魔法信息在角色卡片悬停详情中显示
    // 保留函数以兼容旧代码调用
}

function renderOpponentsMagicPanel() {
    // 新布局不需要单独的对手魔法面板
    // 保留函数以兼容旧代码调用
}

function renderNayekaShadowButton() {
    // 已整合到renderSpecialButtons中
    // 保留函数以兼容旧代码调用
}

// 获取魔法次数/冷却指示器HTML
function getMagicUsageIndicator(player) {
    const char = player.character;
    const isWitchified = player.isWitchified;
    
    // 艾玛：整局1次（信号灯）
    if (char.id === 'emma') {
        const used = gameState.magicStates.emmaActive ? 1 : 0;
        return renderSignalLights(1, used, '#e94560');
    }
    
    // 希罗强化：1次（信号灯）
    if (char.id === 'hiro' && isWitchified) {
        const used = player.enhancedMagicUsed ? 1 : 0;
        return renderSignalLights(1, used, '#e94560');
    }
    
    // 可可强化：1次（信号灯）
    if (char.id === 'coco' && isWitchified) {
        const used = player.enhancedMagicUsed ? 1 : 0;
        return renderSignalLights(1, used, '#f39c12');
    }
    
    // 汉娜强化：2次（信号灯）
    if (char.id === 'hanna' && isWitchified) {
        const used = player.hannaEnhancedUsed || 0;
        return renderSignalLights(2, used, '#27ae60');
    }
    
    // 安安强化：4次（信号灯）
    if (char.id === 'anan' && isWitchified) {
        const used = player.ananEnhancedUsed || 0;
        return renderSignalLights(4, used, '#9b59b6');
    }
    
    // 雪莉强化：3小轮冷却（进度条）
    if (char.id === 'sherry' && isWitchified) {
        const lastTrigger = player.sherryLastTriggerSubRound || 0;
        const currentSubRound = gameState.currentSubRound;
        const elapsed = currentSubRound - lastTrigger;
        const cooldown = 3;
        const progress = Math.min(elapsed / cooldown, 1);
        const ready = progress >= 1;
        return renderCooldownBar(progress, ready, '#3498db');
    }
    
    // 奈叶香：6次（信号灯）
    if (char.id === 'nayeka') {
        const used = player.nayekaMagicUsed || 0;
        return renderSignalLights(6, used, '#7f8c8d');
    }
    
    return null;
}

// 渲染信号灯（次数限制）
function renderSignalLights(total, used, color) {
    let html = '<div class="signal-lights">';
    for (let i = 0; i < total; i++) {
        const isUsed = i < used;
        html += `<span class="signal-light ${isUsed ? 'used' : 'available'}" style="--light-color: ${color}"></span>`;
    }
    html += `<span class="signal-label">${total - used}/${total}</span>`;
    html += '</div>';
    return html;
}

// 渲染冷却进度条
function renderCooldownBar(progress, ready, color) {
    const percent = Math.round(progress * 100);
    return `
        <div class="cooldown-bar-container">
            <div class="cooldown-bar" style="width: ${percent}%; background: ${color}"></div>
            <span class="cooldown-label">${ready ? '✓ 可用' : `冷却中 ${percent}%`}</span>
        </div>
    `;
}

// 获取魔法限制信息
function getMagicLimitInfo(player) {
    const char = player.character;
    switch (char.id) {
        case 'emma':
            if (gameState.magicStates.emmaActive) {
                return '已发动（整局限一次）';
            }
            return '整局游戏只可使用一次';
        case 'noah':
            return '每回合限一次';
        case 'nayeka':
            return '整局游戏限6次';
        case 'meruru':
            return '每回合魔女化上限+50';
        default:
            return null;
    }
}

// 渲染对手魔法面板
function renderOpponentsMagicPanel() {
    const listEl = document.getElementById('opponents-magic-list');
    if (!listEl) return;
    
    // 获取人类玩家
    const humanPlayer = gameState.players.find(p => !p.isAI);
    if (!humanPlayer) return;
    
    // 获取所有对手（非人类玩家）
    const opponents = gameState.players.filter(p => p.isAI && !p.isEliminated);
    
    listEl.innerHTML = opponents.map(opponent => {
        const char = opponent.character;
        const typeLabel = char.magicType === 'active' ? '主动' : 
                          char.magicType === 'passive' ? '被动' : '固有';
        const isTurn = gameState.players[gameState.currentPlayerIndex]?.id === opponent.id;
        const limitInfo = getMagicLimitInfo(opponent);
        
        return `
            <div class="opponent-magic-card ${isTurn ? 'is-turn' : ''}">
                <div class="opponent-header">
                    <span class="opponent-emoji">${getCharIcon(char, 'small')}</span>
                    <div>
                        <div class="opponent-name">${opponent.name}</div>
                        <div class="opponent-char-name">${char.name}</div>
                    </div>
                </div>
                <div class="opponent-skill">
                    <div class="opponent-skill-header">
                        <span class="opponent-skill-type ${char.magicType}">${typeLabel}</span>
                        <span class="opponent-skill-name">${char.magicName}</span>
                    </div>
                    <div class="opponent-skill-desc">${char.magicDescription}</div>
                    ${limitInfo ? `<div class="opponent-skill-limit">⚠️ ${limitInfo}</div>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// 检查是否可以发动魔法
function canCastMagic(player) {
    if (!player || player.isEliminated) return false;
    
    const char = player.character;
    
    // 检查是否被玛格静谧（艾玛和玛格自己除外）
    if (isMagicSilenced(player)) {
        return false;
    }
    
    // 魔女化后：检查是否有强化魔法可用
    if (player.isWitchified) {
        // 有强化魔法且未使用过
        if (char.magicEnhanced && !player.enhancedMagicUsed) {
            return true;
        }
        // 奈叶香强化魔法发动后，普通魔法禁用
        // 其他角色魔女化后普通魔法也禁用
        return false;
    }
    
    // 奈叶香的固有技能可以主动发动（限6次）
    if (char.id === 'nayeka') {
        return (player.nayekaMagicUsed || 0) < 6;
    }
    
    // 梅露露的固有技能可以主动发动
    if (char.id === 'meruru') {
        return true;
    }
    
    // 被动技能不需要手动发动
    if (char.magicType === 'passive') {
        return false;
    }
    
    // 检查特定角色的限制条件
    // TODO: 根据角色实现具体限制
    
    return true;
}

// 发动魔法
function castMagic() {
    // 多人模式：获取本地玩家
    let localPlayer;
    if (networkState.mode === 'online') {
        localPlayer = gameState.players.find(p => p.id === networkState.localPlayerId);
    } else {
        localPlayer = gameState.players.find(p => !p.isAI);
    }
    
    if (!localPlayer || !canCastMagic(localPlayer)) return;
    
    // 多人模式：非房主发送消息
    if (networkState.mode === 'online' && !networkState.isHost) {
        sendMessage('cast_magic', {
            playerId: networkState.localPlayerId
        });
        return;
    }
    
    const char = localPlayer.character;
    
    // 魔女化后发动强化魔法
    if (localPlayer.isWitchified && char.magicEnhanced) {
        castEnhancedMagic(localPlayer);
        return;
    }
    
    // 根据角色ID调用对应的魔法效果
    switch (char.id) {
        case 'emma':
            castMagic_Emma(localPlayer);
            break;
        case 'hanna':
            castMagic_Hanna(localPlayer);
            break;
        case 'anan':
            castMagic_Anan(localPlayer);
            break;
        case 'noah':
            castMagic_Noah(localPlayer);
            break;
        case 'arisa':
            castMagic_Arisa(localPlayer);
            break;
        case 'nayeka':
            castMagic_Nayeka(localPlayer);
            break;
        case 'meruru':
            castMagic_Meruru(localPlayer);
            break;
        default:
            alert(`${char.magicName} 的效果尚未实现`);
    }
}

// 发动强化魔法
function castEnhancedMagic(player) {
    const char = player.character;
    
    switch (char.id) {
        case 'hiro':
            castEnhancedMagic_Hiro(player);
            break;
        case 'coco':
            castEnhancedMagic_Coco(player);
            break;
        case 'sherry':
            castEnhancedMagic_Sherry(player);
            break;
        case 'hanna':
            castEnhancedMagic_Hanna(player);
            break;
        case 'anan':
            castEnhancedMagic_Anan(player);
            break;
        case 'noah':
            castEnhancedMagic_Noah(player);
            break;
        case 'leiya':
            castEnhancedMagic_Leiya(player);
            break;
        case 'milia':
            castEnhancedMagic_Milia(player);
            break;
        case 'nayeka':
            castEnhancedMagic_Nayeka(player);
            break;
        case 'marg':
            castEnhancedMagic_Marg(player);
            break;
        case 'meruru':
            castEnhancedMagic_Meruru(player);
            break;
        default:
            alert(`${char.name} 的强化魔法尚未实现`);
    }
}

// 希罗强化魔法：获得4张额外点数牌，连续行动4次
function castEnhancedMagic_Hiro(player) {
    if (player.enhancedMagicUsed) {
        showMagicAlert('无法发动', '强化魔法已使用过！');
        return;
    }
    
    // 检查玛格被动技能
    checkMargPassive(player, '死亡回溯·强化',
        () => { showMagicAlert('魔法失效', '死亡回溯·强化被玛格的模仿无效化了！'); },
        () => { executeHiroEnhanced(player); }
    );
}

// 实际执行希罗强化魔法
function executeHiroEnhanced(player) {
    player.enhancedMagicUsed = true;
    
    // 获得4张额外点数牌
    for (let i = 0; i < 4; i++) {
        player.handCards.push(Math.floor(Math.random() * 6) + 1);
    }
    
    // 设置连续行动4次
    gameState.hiroExtraTurns = 4;
    
    showMagicCastEffect(player, '死亡回溯·强化', '获得4张额外点数牌，连续行动4次！');
    
    renderGame();
}

// 可可强化魔法：每种线索+1
function castEnhancedMagic_Coco(player) {
    if (player.enhancedMagicUsed) {
        showMagicAlert('无法发动', '强化魔法已使用过！');
        return;
    }
    
    // 检查玛格被动技能
    checkMargPassive(player, '千里眼·强化',
        () => { showMagicAlert('魔法失效', '千里眼·强化被玛格的模仿无效化了！'); },
        () => { executeCocoEnhanced(player); }
    );
}

// 实际执行可可强化魔法
function executeCocoEnhanced(player) {
    player.enhancedMagicUsed = true;
    
    // 给玩家添加一个特殊的强化buff标记
    player.cocoEnhancedBonus = { evidence: 1, testimony: 1, heart: 1 };
    
    showMagicCastEffect(player, '千里眼·强化', '证物、证词、人心各+1！');
    
    renderGame();
}

// 雪莉强化魔法：选择一名玩家进行直接胜利的交锋，发动当小轮不可移动
function castEnhancedMagic_Sherry(player) {
    // 检查冷却（每3小轮可用一次）
    const lastTrigger = player.sherryLastTriggerSubRound || 0;
    const currentSubRound = gameState.currentSubRound;
    const subRoundsSinceLastTrigger = currentSubRound - lastTrigger;
    
    // 跨回合时重置（新回合的小轮数会重置）
    const canTrigger = subRoundsSinceLastTrigger >= 3 || 
                      currentSubRound < lastTrigger ||
                      !player.sherryLastTriggerSubRound;
    
    if (!canTrigger) {
        const remaining = 3 - subRoundsSinceLastTrigger;
        showMagicAlert('冷却中', `还需等待 ${remaining} 个小轮才能再次发动！`);
        return;
    }
    
    // 检查玛格被动技能
    checkMargPassive(player, '巨力化·强化', 
        // 被无效化时
        () => {
            showMagicAlert('魔法失效', '巨力化·强化被玛格的模仿无效化了！');
        },
        // 允许发动时
        () => {
            executeSherryEnhanced(player);
        }
    );
}

// 实际执行雪莉强化魔法
function executeSherryEnhanced(player) {
    const currentSubRound = gameState.currentSubRound;
    
    // 标记发动的小轮（只有这个小轮无法移动）
    player.sherryEnhancedActive = true;
    player.sherryNoMoveSubRound = currentSubRound;
    player.sherryNoMoveRound = gameState.currentRound;
    
    // 显示目标选择
    showSherryTargetSelection(player);
}

// 雪莉强化：选择目标进行交锋
function showSherryTargetSelection(sherryPlayer) {
    const opponents = gameState.players.filter(p => 
        p.id !== sherryPlayer.id && 
        !p.isEliminated
    );
    
    if (opponents.length === 0) {
        return;
    }
    
    const modal = document.createElement('div');
    modal.id = 'sherry-target-modal';
    modal.className = 'sherry-target-modal';
    modal.innerHTML = `
        <div class="sherry-target-content" onclick="event.stopPropagation()">
            <div class="sherry-target-header">
                <span class="sherry-icon">${getCharIcon(sherryPlayer.character, 'small')}</span>
                <span class="sherry-title">巨力化·强化</span>
            </div>
            <div class="sherry-target-info">
                <p>选择一名玩家进行直接胜利的交锋！</p>
            </div>
            <div class="sherry-target-list">
                ${opponents.map(p => `
                    <button class="sherry-target-btn" onclick="confirmSherryTarget(${p.id})">
                        <span class="target-avatar">${getCharIcon(p.character, 'small')}</span>
                        <span class="target-name">${p.name}</span>
                    </button>
                `).join('')}
            </div>
        </div>
    `;
    
    modal.onclick = (e) => {
        if (e.target === modal) {
            e.stopPropagation();
        }
    };
    
    document.body.appendChild(modal);
    
    // 保存状态
    gameState.sherryTargetState = {
        sherryPlayer: sherryPlayer
    };
    
    requestAnimationFrame(() => {
        modal.classList.add('show');
    });
}

function confirmSherryTarget(targetId) {
    const modal = document.getElementById('sherry-target-modal');
    if (modal) {
        modal.classList.add('hide');
        setTimeout(() => modal.remove(), 300);
    }
    
    const { sherryPlayer } = gameState.sherryTargetState;
    const targetPlayer = gameState.players.find(p => p.id === targetId);
    
    if (!targetPlayer) return;
    
    // 记录本次触发的小轮
    sherryPlayer.sherryLastTriggerSubRound = gameState.currentSubRound;
    
    // 开始直接胜利的交锋
    showMagicCastEffect(sherryPlayer, '巨力化·强化', `对 ${targetPlayer.name} 发动直接胜利的交锋！`);
    
    setTimeout(() => {
        startSherryEnhancedConfrontation(sherryPlayer, targetPlayer);
    }, 1000);
}

function startSherryEnhancedConfrontation(sherryPlayer, targetPlayer) {
    // 雪莉强化交锋：雪莉直接获胜，抢夺对方1张证据
    confrontationState = {
        active: true,
        participants: [sherryPlayer, targetPlayer],
        rankings: [sherryPlayer, targetPlayer],  // 雪莉直接第一
        currentStealPhase: 0,  // 初始化抢夺阶段
        stolenThisRound: new Set(),
        callback: () => {
            // 交锋结束后继续正常游戏流程
            renderGame();
            // 继续当前玩家的回合
            const currentPlayer = gameState.players[gameState.currentPlayerIndex];
            if (currentPlayer && currentPlayer.isAI && !currentPlayer.isEliminated) {
                setTimeout(() => aiTurn(currentPlayer), 1000);
            }
        },
        isSherryEnhanced: true
    };
    
    // 目标玩家+5魔女化
    targetPlayer.witchification += 5;
    showWitchPopup(targetPlayer, 5, '被巨力化击败');
    checkWitchification(targetPlayer);
    
    // 显示交锋结果
    const modal = document.getElementById('confrontation-modal');
    if (modal) {
        modal.classList.remove('hidden');
        document.getElementById('conf-player1').innerHTML = `
            <div class="conf-avatar">${getCharIcon(sherryPlayer.character)}</div>
            <div class="conf-name">${sherryPlayer.name}</div>
        `;
        document.getElementById('conf-player2').innerHTML = `
            <div class="conf-avatar">${getCharIcon(targetPlayer.character)}</div>
            <div class="conf-name">${targetPlayer.name}</div>
        `;
        document.getElementById('confrontation-light').className = 'light-on';
        document.getElementById('confrontation-hint').innerHTML = `🥇${sherryPlayer.name} 🥈${targetPlayer.name}`;
        document.getElementById('reaction-btn').style.display = 'none';
    }
    
    // 开始抢夺阶段
    setTimeout(() => {
        startStealPhase();
    }, 1500);
}

// ========== 各角色魔法实现 ==========

// 樱羽艾玛：杀死魔女的魔法
// 效果：所有玩家在艾玛胜利或死亡前无法宣告胜利
// 限制：整局游戏只可使用一次
function castMagic_Emma(player) {
    // 检查是否已经使用过
    if (gameState.magicStates.emmaActive) {
        showMagicAlert('魔法已发动', '「杀死魔女的魔法」整局游戏只能使用一次！');
        return;
    }
    
    // 发动魔法
    gameState.magicStates.emmaActive = true;
    gameState.magicStates.emmaPlayerId = player.id;
    
    // 增加魔女化惩罚
    player.witchification += 95;
    showWitchPopup(player, 95, '发动魔法');
    
    // 检查魔女化
    checkWitchification(player);
    
    // 显示魔法发动效果
    showMagicCastEffect(player, '杀死魔女的魔法', '所有玩家在艾玛胜利或死亡前无法宣告胜利！');
    
    renderGame();
}

// 显示魔法发动效果
function showMagicCastEffect(player, magicName, description) {
    const effect = document.createElement('div');
    effect.className = 'magic-cast-effect';
    effect.innerHTML = `
        <div class="magic-cast-content">
            <div class="magic-cast-icon">✨</div>
            <div class="magic-cast-player">${getCharIcon(player.character, 'small')} ${player.name}</div>
            <div class="magic-cast-name">${magicName}</div>
            <div class="magic-cast-desc">${description}</div>
        </div>
    `;
    document.body.appendChild(effect);
    
    // 播放魔法音效（带混响）
    if (typeof playMagicSFX === 'function') {
        playMagicSFX(player.character.id);
    }
    
    // 播放魔法语音
    if (typeof playMagicVoice === 'function') {
        playMagicVoice(player.character.id);
    }
    
    requestAnimationFrame(() => {
        effect.classList.add('show');
    });
    
    setTimeout(() => {
        effect.classList.add('hide');
        setTimeout(() => effect.remove(), 500);
    }, 2500);
}

// 显示魔法提示
function showMagicAlert(title, message) {
    const alert = document.createElement('div');
    alert.className = 'magic-alert';
    alert.innerHTML = `
        <div class="magic-alert-content">
            <div class="magic-alert-title">${title}</div>
            <div class="magic-alert-message">${message}</div>
        </div>
    `;
    document.body.appendChild(alert);
    
    requestAnimationFrame(() => {
        alert.classList.add('show');
    });
    
    setTimeout(() => {
        alert.classList.add('hide');
        setTimeout(() => alert.remove(), 500);
    }, 2000);
}

function castMagic_Hanna(player) {
    // 远野汉娜：浮空（主动技能）
    // 未魔女化：不打出点数牌自选移动最多X格（X=魔女化/10），移动期间不触发交锋
    // 魔女化后强化：获得两次自选最高10步的移动，初始可指定任意方向，移动期间正常触发交锋
    
    if (player.isWitchified) {
        // 强化浮空
        castEnhancedMagic_Hanna(player);
    } else {
        // 普通浮空
        castNormalMagic_Hanna(player);
    }
}

// 普通浮空：自选移动最多X格（X=魔女化/10），不触发交锋
function castNormalMagic_Hanna(player) {
    const maxSteps = Math.floor(player.witchification / 10);
    
    if (maxSteps <= 0) {
        showMagicAlert('无法发动', '魔女化进度不足10，无法使用浮空！');
        return;
    }
    
    // 检查玛格被动技能
    checkMargPassive(player, '浮空',
        () => { showMagicAlert('魔法失效', '浮空被玛格的模仿无效化了！'); },
        () => { showHannaStepSelection(player, maxSteps, false); }
    );
}

// 强化浮空：两次自选最高10步，可指定任意方向，正常触发交锋
function castEnhancedMagic_Hanna(player) {
    // 检查是否已用完两次机会
    if (player.hannaEnhancedUsed >= 2) {
        showMagicAlert('已用完', '强化浮空的两次机会已用完！');
        return;
    }
    
    // 初始化使用次数
    if (player.hannaEnhancedUsed === undefined) {
        player.hannaEnhancedUsed = 0;
    }
    
    // 检查玛格被动技能
    checkMargPassive(player, '浮空·强化',
        () => { showMagicAlert('魔法失效', '浮空·强化被玛格的模仿无效化了！'); },
        () => { showHannaStepSelection(player, 10, true); }
    );
}

// 显示汉娜浮空步数选择
function showHannaStepSelection(player, maxSteps, isEnhanced) {
    const modal = document.createElement('div');
    modal.id = 'hanna-step-modal';
    modal.className = 'hanna-step-modal';
    
    const title = isEnhanced ? '浮空·强化' : '浮空';
    const info = isEnhanced 
        ? `选择移动步数（剩余${2 - (player.hannaEnhancedUsed || 0)}次机会）` 
        : `选择移动步数（魔女化惩罚: +15）`;
    const note = isEnhanced 
        ? '可指定任意方向，移动期间正常触发交锋' 
        : '移动期间不触发交锋';
    
    // 生成步数按钮
    let stepButtons = '';
    for (let i = 1; i <= maxSteps; i++) {
        stepButtons += `<button class="hanna-step-btn" onclick="confirmHannaStep(${i}, ${isEnhanced})">${i}步</button>`;
    }
    
    modal.innerHTML = `
        <div class="hanna-step-content" onclick="event.stopPropagation()">
            <div class="hanna-step-header">
                <span class="hanna-icon">${getCharIcon(player.character, 'small')}</span>
                <span class="hanna-title">${title}</span>
            </div>
            <div class="hanna-step-info">
                <p>${info}</p>
                <p class="hanna-note">${note}</p>
            </div>
            <div class="hanna-step-buttons">
                ${stepButtons}
            </div>
            <button class="hanna-cancel-btn" onclick="cancelHannaStep()">取消</button>
        </div>
    `;
    
    modal.onclick = (e) => {
        if (e.target === modal) {
            e.stopPropagation();
        }
    };
    
    document.body.appendChild(modal);
    
    // 保存状态
    gameState.hannaStepState = {
        player: player,
        isEnhanced: isEnhanced
    };
    
    requestAnimationFrame(() => {
        modal.classList.add('show');
    });
}

function cancelHannaStep() {
    const modal = document.getElementById('hanna-step-modal');
    if (modal) {
        modal.classList.add('hide');
        setTimeout(() => modal.remove(), 300);
    }
}

function confirmHannaStep(steps, isEnhanced) {
    const modal = document.getElementById('hanna-step-modal');
    if (modal) {
        modal.classList.add('hide');
        setTimeout(() => modal.remove(), 300);
    }
    
    const { player } = gameState.hannaStepState;
    
    // 多人模式：发送步数选择到房主
    if (networkState.mode === 'online' && !networkState.isHost) {
        sendMessage('hanna_step_selected', {
            playerId: networkState.localPlayerId,
            steps: steps,
            isEnhanced: isEnhanced
        });
        return;
    }
    
    // 单人模式或房主：直接执行
    executeHannaStepSelection(player, steps, isEnhanced);
}

// 执行汉娜步数选择（房主或单人模式调用）
function executeHannaStepSelection(player, steps, isEnhanced) {
    if (isEnhanced) {
        // 强化浮空：增加使用次数
        player.hannaEnhancedUsed = (player.hannaEnhancedUsed || 0) + 1;
        
        showMagicCastEffect(player, '浮空·强化', `自选移动${steps}步，可指定任意方向！`);
        
        setTimeout(() => {
            // 强化浮空：可指定任意方向，正常触发交锋
            startHannaEnhancedMove(player, steps);
        }, 1000);
    } else {
        // 普通浮空：增加魔女化
        player.witchification += 15;
        showWitchPopup(player, 15, '发动浮空');
        checkWitchification(player);
        
        showMagicCastEffect(player, '浮空', `自选移动${steps}步，不触发交锋！`);
        
        setTimeout(() => {
            // 普通浮空：不触发交锋
            startHannaNormalMove(player, steps);
        }, 1000);
    }
    
    // 多人模式：房主广播状态
    if (networkState.mode === 'online' && networkState.isHost) {
        broadcastGameState();
    }
}

// 普通浮空移动（不触发交锋）
function startHannaNormalMove(player, steps) {
    moveState = {
        isMoving: true,
        player: player,
        remainingSteps: steps,
        path: [player.position],
        previousPosition: player.position,
        lastPassedCell: null,
        isHannaFloat: true,  // 标记为浮空移动
        skipConfrontation: true  // 不触发交锋
    };
    
    updatePrompt(`${player.name} 浮空移动中... 剩余 ${steps} 步`);
    renderHandCards();
    
    // 开始逐步移动
    hannaFloatMoveStep();
}

// 强化浮空移动（可指定任意方向，正常触发交锋）
function startHannaEnhancedMove(player, steps) {
    moveState = {
        isMoving: true,
        player: player,
        remainingSteps: steps,
        path: [player.position],
        previousPosition: player.position,
        lastPassedCell: null,
        isHannaFloat: true,
        isHannaEnhanced: true,  // 强化浮空
        skipConfrontation: false,  // 正常触发交锋
        isFirstStep: true  // 第一步可指定任意方向
    };
    
    updatePrompt(`${player.name} 强化浮空移动中... 剩余 ${steps} 步`);
    renderHandCards();
    
    // 开始逐步移动
    hannaFloatMoveStep();
}

// 汉娜浮空移动步骤
function hannaFloatMoveStep() {
    if (moveState.remainingSteps <= 0) {
        finishHannaMove();
        return;
    }
    
    const player = moveState.player;
    const currentPos = player.position;
    const connections = CELL_CONNECTIONS[currentPos];
    
    if (!connections || connections.length === 0) {
        finishHannaMove();
        return;
    }
    
    let validDirections;
    
    if (moveState.isHannaEnhanced && moveState.isFirstStep) {
        // 强化浮空第一步：可选择任意方向（包括来时的路）
        validDirections = connections;
        moveState.isFirstStep = false;
    } else {
        // 正常移动：不能回头
        const isFirstStep = moveState.path.length === 1 && moveState.previousPosition === currentPos;
        const cameFrom = isFirstStep ? player.cameFrom : moveState.previousPosition;
        validDirections = connections.filter(pos => pos !== cameFrom);
        
        if (validDirections.length === 0) {
            validDirections = connections;
        }
    }
    
    if (validDirections.length === 1) {
        // 只有一个方向，直接走
        animateHannaMove(validDirections[0]);
    } else {
        // 多个方向，需要选择
        if (player.isAI) {
            const nextPos = validDirections[Math.floor(Math.random() * validDirections.length)];
            animateHannaMove(nextPos);
        } else {
            showHannaDirectionArrows(currentPos, validDirections);
        }
    }
}

// 显示汉娜浮空方向箭头
function showHannaDirectionArrows(currentPos, validDirections) {
    clearDirectionArrows();
    
    validDirections.forEach(targetPos => {
        const targetCell = document.querySelector(`.grid-cell[data-cell="${targetPos}"]`);
        if (!targetCell) return;
        
        const arrow = getArrowForDirection(currentPos, targetPos);
        
        const arrowEl = document.createElement('div');
        arrowEl.className = 'direction-arrow hanna-float-arrow';
        arrowEl.innerHTML = arrow;
        arrowEl.dataset.target = targetPos;
        arrowEl.onclick = () => selectHannaDirection(targetPos);
        
        targetCell.appendChild(arrowEl);
        targetCell.classList.add('fork-highlight');
    });
    
    const hint = moveState.skipConfrontation ? '（不触发交锋）' : '（正常触发交锋）';
    updatePrompt(`选择浮空方向 ${hint}`);
}

function selectHannaDirection(targetPos) {
    clearDirectionArrows();
    
    // 多人模式：发送方向选择到房主
    if (networkState.mode === 'online' && !networkState.isHost) {
        sendMessage('hanna_direction_selected', {
            playerId: networkState.localPlayerId,
            targetPos: targetPos
        });
        return;
    }
    
    // 单人模式或房主：直接执行
    animateHannaMove(targetPos);
}

function animateHannaMove(nextPos) {
    const player = moveState.player;
    const currentPos = player.position;
    
    // 播放脚步音效
    if (typeof playStepSFX === 'function') {
        playStepSFX();
    }
    
    // 创建移动动画
    const currentCell = document.querySelector(`.grid-cell[data-cell="${currentPos}"]`);
    const targetCell = document.querySelector(`.grid-cell[data-cell="${nextPos}"]`);
    
    if (!currentCell || !targetCell) {
        executeHannaMove(nextPos);
        return;
    }
    
    // 浮空特效：绿色光晕
    const floatEffect = document.createElement('div');
    floatEffect.className = 'hanna-float-effect';
    floatEffect.innerHTML = '✨';
    currentCell.appendChild(floatEffect);
    
    setTimeout(() => {
        floatEffect.remove();
        executeHannaMove(nextPos);
    }, 300);
}

function executeHannaMove(nextPos) {
    const player = moveState.player;
    moveState.previousPosition = player.position;
    player.position = nextPos;
    moveState.path.push(nextPos);
    moveState.remainingSteps--;
    moveState.lastPassedCell = nextPos;
    
    // 更新玩家方向
    const connections = CELL_CONNECTIONS[nextPos];
    if (connections && connections.length > 0) {
        const nextDirection = connections.find(pos => pos !== moveState.previousPosition);
        if (nextDirection !== undefined) {
            player.direction = nextDirection;
        }
    }
    
    updatePrompt(`${player.name} 浮空移动中... 剩余 ${moveState.remainingSteps} 步`);
    renderBoard();
    
    // 多人模式：广播移动状态
    if (networkState.mode === 'online' && networkState.isHost) {
        broadcastGameState();
    }
    
    // 检查是否触发交锋
    if (!moveState.skipConfrontation) {
        const opponents = checkConfrontation(player, nextPos);
        if (opponents) {
            startConfrontation(player, opponents, () => {
                checkCocoMagic(player, nextPos, () => {
                    setTimeout(() => hannaFloatMoveStep(), 200);
                });
            });
            return;
        }
    }
    
    // 检查可可千里眼
    checkCocoMagic(player, nextPos, () => {
        setTimeout(() => hannaFloatMoveStep(), 200);
    });
}

function finishHannaMove() {
    const player = moveState.player;
    
    // 更新玩家的cameFrom
    player.cameFrom = moveState.previousPosition;
    
    // 记录可可驻足的格子
    if (player.character.id === 'coco') {
        player.visitedCells.add(player.position);
    }
    
    moveState.isMoving = false;
    
    // 多人模式：广播移动结束状态
    if (networkState.mode === 'online' && networkState.isHost) {
        broadcastGameState();
    }
    
    // 触发格子效果并结束回合
    triggerCellAndFinish(player);
}

function castMagic_Anan(player) {
    // 夏目安安：洗脑（被动技能）
    // 被动技能不能主动发动，只能在其他玩家出牌前触发
    // 魔女化后强化：可主动发动，获得四次机会，将玩家本小轮获得的线索交给安安
    
    if (player.isWitchified) {
        castEnhancedMagic_Anan(player);
    } else {
        showMagicAlert('被动技能', '洗脑是被动技能，会在其他玩家出牌前自动触发！');
    }
}

// ========== 夏目安安：洗脑（被动技能检查） ==========
let ananMagicState = {
    active: false,
    timer: null,
    countdown: 10,
    targetPlayer: null,
    targetCard: null,
    targetCardIndex: null,
    callback: null
};

function checkAnanMagic(targetPlayer, card, cardIndex, callback) {
    // 检查被动技能锁
    if (gameState.passiveMagicLock) {
        callback(card, cardIndex);
        return;
    }
    
    // 找到安安玩家（非当前玩家、未淘汰、角色是anan、未魔女化）
    const ananPlayer = gameState.players.find(p => 
        p.character.id === 'anan' && 
        !p.isEliminated && 
        p.id !== targetPlayer.id &&
        !p.isWitchified  // 魔女化后被动技能失效
    );
    
    // 如果没有安安或安安魔女化了，跳过
    if (!ananPlayer) {
        callback(card, cardIndex);
        return;
    }
    
    // 单人模式：AI安安随机决定（30%概率）
    if (networkState.mode === 'local' && ananPlayer.isAI) {
        if (Math.random() < 0.3) {
            // AI从目标手牌中随机选择一个点数
            const availableCards = [...new Set(targetPlayer.handCards)];
            const forcedCard = availableCards[Math.floor(Math.random() * availableCards.length)];
            
            // 检查玛格被动技能
            checkMargPassive(ananPlayer, '洗脑',
                () => {
                    // 被无效化，使用原来的牌
                    callback(card, cardIndex);
                },
                () => {
                    // 允许发动
                    executeAnanMagic(ananPlayer, targetPlayer, forcedCard, callback);
                }
            );
        } else {
            callback(card, cardIndex);
        }
        return;
    }
    
    // 多人模式：房主发送请求给安安玩家
    if (networkState.mode === 'online' && networkState.isHost) {
        // 检查安安是否是本地玩家
        if (ananPlayer.id === networkState.localPlayerId) {
            // 本地安安，显示UI
            ananMagicState = {
                active: true,
                timer: null,
                countdown: 10,
                targetPlayer: targetPlayer,
                targetCard: card,
                targetCardIndex: cardIndex,
                callback: callback,
                ananPlayer: ananPlayer
            };
            showAnanMagicPrompt(ananPlayer, targetPlayer, card);
        } else {
            // 远程安安，发送请求
            const availableCards = [...new Set(targetPlayer.handCards)].sort((a, b) => a - b);
            sendPassiveRequest('anan_brainwash', ananPlayer.id, {
                targetPlayerName: targetPlayer.name,
                originalCard: card,
                availableCards: availableCards
            }, (activate, data) => {
                if (activate && data && data.forcedCard !== undefined) {
                    checkMargPassive(ananPlayer, '洗脑',
                        () => callback(card, cardIndex),
                        () => executeAnanMagic(ananPlayer, targetPlayer, data.forcedCard, callback)
                    );
                } else {
                    callback(card, cardIndex);
                }
            });
        }
        return;
    }
    
    // 单人模式人类安安：显示选择界面，10秒倒计时
    ananMagicState = {
        active: true,
        timer: null,
        countdown: 10,
        targetPlayer: targetPlayer,
        targetCard: card,
        targetCardIndex: cardIndex,
        callback: callback,
        ananPlayer: ananPlayer
    };
    
    showAnanMagicPrompt(ananPlayer, targetPlayer, card);
}

function showAnanMagicPrompt(ananPlayer, targetPlayer, card) {
    // 获取目标玩家手牌中存在的点数（去重）
    const availableCards = [...new Set(targetPlayer.handCards)].sort((a, b) => a - b);
    
    const modal = document.createElement('div');
    modal.id = 'anan-passive-modal';
    modal.className = 'anan-modal';
    modal.innerHTML = `
        <div class="anan-content" onclick="event.stopPropagation()">
            <div class="anan-header">
                <span class="anan-icon">${getCharIcon(ananPlayer.character, 'small')}</span>
                <span class="anan-title">洗脑</span>
                <span class="anan-countdown" id="anan-countdown">10</span>
            </div>
            <div class="anan-info">
                <p>${targetPlayer.name} 准备打出 <strong>${card}</strong> 点</p>
                <p>是否发动「洗脑」指定其打出的点数？</p>
                <p class="anan-cost">魔女化惩罚: +10</p>
            </div>
            <div class="anan-card-buttons">
                ${availableCards.map(num => `
                    <button class="anan-card-btn ${num === card ? 'original' : ''}" onclick="confirmAnanPassive(${num})">${num}</button>
                `).join('')}
            </div>
            <button class="anan-skip-btn" onclick="skipAnanMagic()">不发动</button>
        </div>
    `;
    
    modal.onclick = (e) => {
        if (e.target === modal) {
            e.stopPropagation();
        }
    };
    
    document.body.appendChild(modal);
    
    requestAnimationFrame(() => {
        modal.classList.add('show');
    });
    
    // 开始倒计时
    startAnanCountdown();
}

function startAnanCountdown() {
    ananMagicState.countdown = 10;
    updateAnanCountdown();
    
    ananMagicState.timer = setInterval(() => {
        ananMagicState.countdown--;
        updateAnanCountdown();
        
        if (ananMagicState.countdown <= 0) {
            // 时间到，不发动
            skipAnanMagic();
        }
    }, 1000);
}

function updateAnanCountdown() {
    const el = document.getElementById('anan-countdown');
    if (el) {
        el.innerHTML = renderClockNumber(ananMagicState.countdown, 0.35);
        el.style.filter = ananMagicState.countdown <= 3 ? 'hue-rotate(-60deg) brightness(1.2)' : 'none';
    }
}

function confirmAnanPassive(forcedCard) {
    if (!ananMagicState.active) return;
    
    // 清除计时器
    if (ananMagicState.timer) {
        clearInterval(ananMagicState.timer);
        ananMagicState.timer = null;
    }
    
    // 关闭弹窗
    const modal = document.getElementById('anan-passive-modal');
    if (modal) {
        modal.classList.add('hide');
        setTimeout(() => modal.remove(), 300);
    }
    
    const { ananPlayer, targetPlayer, targetCard, targetCardIndex, callback } = ananMagicState;
    ananMagicState.active = false;
    
    // 检查玛格被动技能
    checkMargPassive(ananPlayer, '洗脑',
        () => {
            // 被无效化，使用原来的牌
            callback(targetCard, targetCardIndex);
        },
        () => {
            // 允许发动
            executeAnanMagic(ananPlayer, targetPlayer, forcedCard, callback);
        }
    );
}

function executeAnanMagic(ananPlayer, targetPlayer, forcedCard, callback) {
    // 增加魔女化
    ananPlayer.witchification += 10;
    showWitchPopup(ananPlayer, 10, '发动洗脑');
    checkWitchification(ananPlayer);
    
    // 查找指定点数的牌（现在一定存在）
    const forcedIndex = targetPlayer.handCards.indexOf(forcedCard);
    
    showMagicCastEffect(ananPlayer, '洗脑', `${targetPlayer.name} 被强制打出 ${forcedCard} 点！`);
    
    renderGame();
    
    // 延迟执行回调
    setTimeout(() => {
        callback(forcedCard, forcedIndex);
    }, 1000);
}

function skipAnanMagic() {
    if (!ananMagicState.active) return;
    
    // 清除计时器
    if (ananMagicState.timer) {
        clearInterval(ananMagicState.timer);
        ananMagicState.timer = null;
    }
    
    // 关闭弹窗
    const modal = document.getElementById('anan-passive-modal');
    if (modal) {
        modal.classList.add('hide');
        setTimeout(() => modal.remove(), 300);
    }
    
    const { targetCard, targetCardIndex, callback } = ananMagicState;
    ananMagicState.active = false;
    
    // 不发动，使用原来的牌
    callback(targetCard, targetCardIndex);
}

// 强化洗脑：小轮结算时自动触发，不能主动发动
function castEnhancedMagic_Anan(player) {
    showMagicAlert('自动触发', '强化洗脑会在小轮结算时自动触发！');
}

function castMagic_Noah(player) {
    // 城崎诺亚：液体操控（主动技能）
    // 未魔女化：将所有格子重新随机，每回合限一次
    // 魔女化后强化：随机所有格子，且只有诺亚可以看见格子效果
    
    if (player.isWitchified) {
        castEnhancedMagic_Noah(player);
    } else {
        castNormalMagic_Noah(player);
    }
}

// 普通液体操控：将所有格子重新随机
function castNormalMagic_Noah(player) {
    // 检查本回合是否已使用
    if (player.noahUsedThisRound === gameState.currentRound) {
        showMagicAlert('已使用', '液体操控每回合只能使用一次！');
        return;
    }
    
    // 检查玛格被动技能
    checkMargPassive(player, '液体操控',
        () => { showMagicAlert('魔法失效', '液体操控被玛格的模仿无效化了！'); },
        () => { executeNoahNormal(player); }
    );
}

// 实际执行诺亚普通魔法
function executeNoahNormal(player) {
    // 标记本回合已使用
    player.noahUsedThisRound = gameState.currentRound;
    
    // 增加魔女化
    player.witchification += 10;
    showWitchPopup(player, 10, '发动液体操控');
    checkWitchification(player);
    
    // 重新随机所有格子
    refreshAllCells();
    
    showMagicCastEffect(player, '液体操控', '所有格子已重新随机！');
    
    renderGame();
}

// 强化液体操控：随机所有格子，且只有诺亚可以看见
function castEnhancedMagic_Noah(player) {
    // 检查是否已经激活
    if (gameState.noahEnhancedActive) {
        showMagicAlert('已激活', '强化液体操控已经生效中！');
        return;
    }
    
    // 检查玛格被动技能
    checkMargPassive(player, '液体操控·强化',
        () => { showMagicAlert('魔法失效', '液体操控·强化被玛格的模仿无效化了！'); },
        () => { executeNoahEnhanced(player); }
    );
}

// 实际执行诺亚强化魔法
function executeNoahEnhanced(player) {
    // 重新随机所有格子
    refreshAllCells();
    
    // 激活隐藏效果
    gameState.noahEnhancedActive = true;
    gameState.noahPlayerId = player.id;
    
    showMagicCastEffect(player, '液体操控·强化', '所有格子已隐藏，只有诺亚可见！');
    
    renderGame();
}

// ========== 莲见蕾雅：视线诱导 ==========
let leiyaMagicState = {
    active: false,
    timer: null,
    countdown: 10,
    targetPlayer: null,
    currentPos: null,
    validDirections: null,
    callback: null
};

function castMagic_Leiya(player) {
    // 莲见蕾雅：视线诱导（被动技能）
    // 被动技能不能主动发动
    // 魔女化后强化：指定接下来三小轮所有玩家的分叉方向
    
    if (player.isWitchified) {
        castEnhancedMagic_Leiya(player);
    } else {
        showMagicAlert('被动技能', '视线诱导是被动技能，会在其他玩家到达分叉点时自动触发！');
    }
}

// 强化视线诱导：指定接下来三小轮所有玩家的分叉方向
function castEnhancedMagic_Leiya(player) {
    if (player.leiyaEnhancedUsed) {
        showMagicAlert('已使用', '强化视线诱导只能使用一次！');
        return;
    }
    
    // 检查玛格被动技能
    checkMargPassive(player, '视线诱导·强化',
        () => { showMagicAlert('魔法失效', '视线诱导·强化被玛格的模仿无效化了！'); },
        () => { executeLeiyaEnhanced(player); }
    );
}

// 实际执行蕾雅强化魔法
function executeLeiyaEnhanced(player) {
    player.leiyaEnhancedUsed = true;
    
    // 激活强化效果
    gameState.leiyaEnhancedActive = true;
    gameState.leiyaEnhancedPlayerId = player.id;
    gameState.leiyaEnhancedStartSubRound = gameState.currentSubRound;
    gameState.leiyaEnhancedStartRound = gameState.currentRound;
    gameState.leiyaEnhancedRemainingSubRounds = 3;
    
    // 预设的方向选择（将在分叉时由蕾雅指定）
    gameState.leiyaPresetDirections = {};
    
    showMagicCastEffect(player, '视线诱导·强化', '接下来三小轮，所有分叉方向由蕾雅指定！');
    
    renderGame();
}

// 检查蕾雅的视线诱导技能（在分叉点触发）
function checkLeiyaMagicAtFork(targetPlayer, currentPos, validDirections, callback) {
    // 检查强化视线诱导是否激活
    if (gameState.leiyaEnhancedActive && gameState.leiyaEnhancedRemainingSubRounds > 0) {
        const leiyaPlayer = gameState.players.find(p => p.id === gameState.leiyaEnhancedPlayerId);
        if (leiyaPlayer && !leiyaPlayer.isEliminated) {
            // 强化效果：蕾雅指定方向（包括自己）
            showLeiyaEnhancedForkChoice(leiyaPlayer, targetPlayer, currentPos, validDirections, callback);
            return;
        }
    }
    
    // 检查被动技能锁
    if (gameState.passiveMagicLock) {
        callback(null);
        return;
    }
    
    // 找到蕾雅玩家（非当前玩家、未淘汰、角色是leiya、未魔女化）
    const leiyaPlayer = gameState.players.find(p => 
        p.character.id === 'leiya' && 
        !p.isEliminated && 
        p.id !== targetPlayer.id &&
        !p.isWitchified  // 魔女化后被动技能失效（改用强化）
    );
    
    // 如果没有蕾雅或蕾雅魔女化了，跳过
    if (!leiyaPlayer) {
        callback(null);
        return;
    }
    
    // AI蕾雅：随机决定是否发动（40%概率）
    if (networkState.mode === 'local' && leiyaPlayer.isAI) {
        if (Math.random() < 0.4) {
            const chosenDirection = validDirections[Math.floor(Math.random() * validDirections.length)];
            // 检查玛格被动技能
            checkMargPassive(leiyaPlayer, '视线诱导',
                () => {
                    // 被无效化，不指定方向
                    callback(null);
                },
                () => {
                    // 允许发动
                    executeLeiyaMagic(leiyaPlayer, targetPlayer, chosenDirection, callback);
                }
            );
        } else {
            callback(null);
        }
        return;
    }
    
    // 多人模式：房主发送请求给蕾雅玩家
    if (networkState.mode === 'online' && networkState.isHost) {
        // 检查蕾雅是否是本地玩家
        if (leiyaPlayer.id === networkState.localPlayerId) {
            // 本地蕾雅，显示UI
            leiyaMagicState = {
                active: true,
                timer: null,
                countdown: 10,
                targetPlayer: targetPlayer,
                currentPos: currentPos,
                validDirections: validDirections,
                callback: callback,
                leiyaPlayer: leiyaPlayer
            };
            showLeiyaMagicPrompt(leiyaPlayer, targetPlayer, currentPos, validDirections);
        } else {
            // 远程蕾雅，发送请求
            sendPassiveRequest('leiya_guidance', leiyaPlayer.id, {
                targetPlayerName: targetPlayer.name,
                currentPos: currentPos,
                validDirections: validDirections
            }, (activate, data) => {
                if (activate && data && data.direction !== undefined) {
                    checkMargPassive(leiyaPlayer, '视线诱导',
                        () => callback(null),
                        () => executeLeiyaMagic(leiyaPlayer, targetPlayer, data.direction, callback)
                    );
                } else {
                    callback(null);
                }
            });
        }
        return;
    }
    
    // 单人模式人类蕾雅：显示选择界面，10秒倒计时
    leiyaMagicState = {
        active: true,
        timer: null,
        countdown: 10,
        targetPlayer: targetPlayer,
        currentPos: currentPos,
        validDirections: validDirections,
        callback: callback,
        leiyaPlayer: leiyaPlayer
    };
    
    showLeiyaMagicPrompt(leiyaPlayer, targetPlayer, currentPos, validDirections);
}

function showLeiyaMagicPrompt(leiyaPlayer, targetPlayer, currentPos, validDirections) {
    const modal = document.createElement('div');
    modal.id = 'leiya-passive-modal';
    modal.className = 'leiya-modal';
    modal.innerHTML = `
        <div class="leiya-content" onclick="event.stopPropagation()">
            <div class="leiya-header">
                <span class="leiya-icon">${getCharIcon(leiyaPlayer.character, 'small')}</span>
                <span class="leiya-title">视线诱导</span>
                <span class="leiya-countdown" id="leiya-countdown">10</span>
            </div>
            <div class="leiya-info">
                <p>${targetPlayer.name} 到达分叉点（格子${currentPos}）</p>
                <p>是否发动「视线诱导」指定其方向？</p>
                <p class="leiya-cost">魔女化惩罚: +7</p>
            </div>
            <div class="leiya-direction-buttons">
                ${validDirections.map(dir => `
                    <button class="leiya-dir-btn" onclick="confirmLeiyaDirection(${dir})">
                        ${getArrowForDirection(currentPos, dir)} 格子${dir}
                    </button>
                `).join('')}
            </div>
            <button class="leiya-skip-btn" onclick="skipLeiyaMagic()">不发动</button>
        </div>
    `;
    
    modal.onclick = (e) => {
        if (e.target === modal) {
            e.stopPropagation();
        }
    };
    
    document.body.appendChild(modal);
    
    requestAnimationFrame(() => {
        modal.classList.add('show');
    });
    
    // 开始倒计时
    startLeiyaCountdown();
}

function startLeiyaCountdown() {
    leiyaMagicState.countdown = 10;
    updateLeiyaCountdown();
    
    leiyaMagicState.timer = setInterval(() => {
        leiyaMagicState.countdown--;
        updateLeiyaCountdown();
        
        if (leiyaMagicState.countdown <= 0) {
            skipLeiyaMagic();
        }
    }, 1000);
}

function updateLeiyaCountdown() {
    const el = document.getElementById('leiya-countdown');
    if (el) {
        el.innerHTML = renderClockNumber(leiyaMagicState.countdown, 0.35);
        el.style.filter = leiyaMagicState.countdown <= 3 ? 'hue-rotate(-60deg) brightness(1.2)' : 'none';
    }
}

function confirmLeiyaDirection(direction) {
    if (!leiyaMagicState.active) return;
    
    if (leiyaMagicState.timer) {
        clearInterval(leiyaMagicState.timer);
        leiyaMagicState.timer = null;
    }
    
    const modal = document.getElementById('leiya-passive-modal');
    if (modal) {
        modal.classList.add('hide');
        setTimeout(() => modal.remove(), 300);
    }
    
    const { leiyaPlayer, targetPlayer, callback } = leiyaMagicState;
    leiyaMagicState.active = false;
    
    // 检查玛格被动技能
    checkMargPassive(leiyaPlayer, '视线诱导',
        () => {
            // 被无效化，不指定方向
            showMagicAlert('魔法失效', '视线诱导被玛格的模仿无效化了！');
            callback(null);
        },
        () => {
            // 允许发动
            executeLeiyaMagic(leiyaPlayer, targetPlayer, direction, callback);
        }
    );
}

function executeLeiyaMagic(leiyaPlayer, targetPlayer, direction, callback) {
    // 增加魔女化
    leiyaPlayer.witchification += 7;
    showWitchPopup(leiyaPlayer, 7, '发动视线诱导');
    checkWitchification(leiyaPlayer);
    
    showMagicCastEffect(leiyaPlayer, '视线诱导', `${targetPlayer.name} 被引导向格子${direction}！`);
    
    renderGame();
    
    setTimeout(() => {
        callback(direction);
    }, 1000);
}

function skipLeiyaMagic() {
    if (!leiyaMagicState.active) return;
    
    if (leiyaMagicState.timer) {
        clearInterval(leiyaMagicState.timer);
        leiyaMagicState.timer = null;
    }
    
    const modal = document.getElementById('leiya-passive-modal');
    if (modal) {
        modal.classList.add('hide');
        setTimeout(() => modal.remove(), 300);
    }
    
    const { callback } = leiyaMagicState;
    leiyaMagicState.active = false;
    
    callback(null);
}

// 强化视线诱导：显示分叉选择界面
function showLeiyaEnhancedForkChoice(leiyaPlayer, targetPlayer, currentPos, validDirections, callback) {
    // AI蕾雅：随机选择
    if (leiyaPlayer.isAI) {
        const chosenDirection = validDirections[Math.floor(Math.random() * validDirections.length)];
        showMagicAlert('视线诱导·强化', `${targetPlayer.name} 被引导向格子${chosenDirection}！`);
        setTimeout(() => callback(chosenDirection), 500);
        return;
    }
    
    // 人类蕾雅：显示选择界面
    const modal = document.createElement('div');
    modal.id = 'leiya-enhanced-fork-modal';
    modal.className = 'leiya-modal';
    modal.innerHTML = `
        <div class="leiya-content leiya-enhanced" onclick="event.stopPropagation()">
            <div class="leiya-header">
                <span class="leiya-icon">${getCharIcon(leiyaPlayer.character, 'small')}</span>
                <span class="leiya-title">视线诱导·强化</span>
            </div>
            <div class="leiya-info">
                <p>${targetPlayer.name} 到达分叉点（格子${currentPos}）</p>
                <p>指定其前进方向：</p>
                <p class="leiya-remaining">剩余小轮: ${gameState.leiyaEnhancedRemainingSubRounds}</p>
            </div>
            <div class="leiya-direction-buttons">
                ${validDirections.map(dir => `
                    <button class="leiya-dir-btn" onclick="confirmLeiyaEnhancedDirection(${dir})">
                        ${getArrowForDirection(currentPos, dir)} 格子${dir}
                    </button>
                `).join('')}
            </div>
        </div>
    `;
    
    modal.onclick = (e) => {
        if (e.target === modal) {
            e.stopPropagation();
        }
    };
    
    document.body.appendChild(modal);
    
    // 保存回调
    gameState.leiyaEnhancedForkCallback = callback;
    
    requestAnimationFrame(() => {
        modal.classList.add('show');
    });
}

function confirmLeiyaEnhancedDirection(direction) {
    const modal = document.getElementById('leiya-enhanced-fork-modal');
    if (modal) {
        modal.classList.add('hide');
        setTimeout(() => modal.remove(), 300);
    }
    
    const callback = gameState.leiyaEnhancedForkCallback;
    if (callback) {
        callback(direction);
    }
}

function castMagic_Arisa(player) {
    // 紫藤亚里沙：点火（主动技能）
    // 未魔女化：删除自身周围3格内的所有格子效果
    // 魔女化后强化：每一小轮都删除自身4格的所有格子效果
    
    if (player.isWitchified) {
        showMagicAlert('自动触发', '强化点火会在每小轮自动触发！');
        return;
    }
    
    // 普通点火
    castNormalMagic_Arisa(player);
}

// 普通点火：删除自身周围3格内的所有格子效果（自身格子为第1格）
function castNormalMagic_Arisa(player) {
    // 检查玛格被动技能
    checkMargPassive(player, '点火',
        () => { showMagicAlert('魔法失效', '点火被玛格的模仿无效化了！'); },
        () => { executeArisaNormal(player); }
    );
}

// 实际执行亚里沙普通魔法
function executeArisaNormal(player) {
    // 增加魔女化
    player.witchification += 10;
    showWitchPopup(player, 10, '发动点火');
    checkWitchification(player);
    
    // 获取周围3格内的所有格子（包含自身格子）
    const affectedCells = getCellsWithinRange(player.position, 3);
    
    // 删除这些格子的效果（标记为已触发）
    let burnedCount = 0;
    affectedCells.forEach(cellId => {
        const cell = gameState.board.cells.find(c => c.id === cellId);
        if (cell && !cell.isTriggered) {
            cell.isTriggered = true;
            cell.triggeredBy = player.id;
            cell.triggeredByName = '🔥点火';
            burnedCount++;
        }
    });
    
    showMagicCastEffect(player, '点火', `烧毁了周围${burnedCount}个格子的效果！`);
    
    renderGame();
}

// 强化点火：每小轮自动删除周围4格的格子效果
function checkArisaEnhancedAtSubRoundStart() {
    const arisaPlayer = gameState.players.find(p => 
        p.character.id === 'arisa' && 
        !p.isEliminated && 
        p.isWitchified
    );
    
    if (!arisaPlayer) return;
    
    // 获取周围4格内的所有格子（包含自身格子）
    const affectedCells = getCellsWithinRange(arisaPlayer.position, 4);
    
    // 删除这些格子的效果
    let burnedCount = 0;
    affectedCells.forEach(cellId => {
        const cell = gameState.board.cells.find(c => c.id === cellId);
        if (cell && !cell.isTriggered) {
            cell.isTriggered = true;
            cell.triggeredBy = arisaPlayer.id;
            cell.triggeredByName = '🔥强化点火';
            burnedCount++;
        }
    });
    
    if (burnedCount > 0) {
        showMagicCastEffect(arisaPlayer, '点火·强化', `自动烧毁了周围${burnedCount}个格子！`);
        renderGame();
    }
}

// 获取指定格子周围N格内的所有格子（包含自身格子）
function getCellsWithinRange(startPos, range) {
    const visited = new Set([startPos]);
    const queue = [{ pos: startPos, dist: 0 }];
    const result = [startPos]; // 包含自身格子
    
    while (queue.length > 0) {
        const { pos, dist } = queue.shift();
        
        if (dist < range) {
            const connections = CELL_CONNECTIONS[pos];
            if (connections) {
                connections.forEach(nextPos => {
                    if (!visited.has(nextPos)) {
                        visited.add(nextPos);
                        result.push(nextPos);
                        queue.push({ pos: nextPos, dist: dist + 1 });
                    }
                });
            }
        }
    }
    
    return result;
}

// 棋盘网格布局定义 (6列 x 6行)
// null 表示空位，数字表示格子ID
const BOARD_GRID = [
    [1,  2,  3,  4,  5,  6 ],
    [20, null, null, 25, null, 7 ],
    [19, null, null, 26, null, 8 ],
    [18, 21, 22, 23, 24, 9 ],
    [17, null, null, 27, null, 10],
    [16, 15, 14, 13, 12, 11]
];

// 装饰格子定义（row, col -> 装饰类型）
const DECORATION_CELLS = {
    '1-1': 'pond',      // 池塘
    '1-2': 'grass',     // 草地
    '2-1': 'tree',      // 树木
    '2-2': 'flower',    // 花丛
    '4-1': 'rock',      // 岩石
    '4-2': 'bush',      // 灌木
    '1-4': 'mushroom',  // 蘑菇
    '2-4': 'grass',     // 草地
    '4-4': 'pond',      // 池塘
};

// 装饰类型定义
const DECORATION_TYPES = {
    pond: { emoji: '💧', name: '池塘', color: 'rgba(52, 152, 219, 0.3)' },
    grass: { emoji: '🌿', name: '草地', color: 'rgba(39, 174, 96, 0.25)' },
    tree: { emoji: '🌳', name: '古树', color: 'rgba(34, 139, 34, 0.3)' },
    flower: { emoji: '🌸', name: '花丛', color: 'rgba(255, 182, 193, 0.3)' },
    rock: { emoji: '🪨', name: '岩石', color: 'rgba(128, 128, 128, 0.3)' },
    bush: { emoji: '🌲', name: '灌木', color: 'rgba(46, 139, 87, 0.25)' },
    mushroom: { emoji: '🍄', name: '蘑菇', color: 'rgba(139, 69, 19, 0.25)' },
};

// 格子连接关系（用于移动）- 只连接相邻格子
const CELL_CONNECTIONS = {
    // 外环顶部 (1-6)
    1: [2, 20],
    2: [1, 3],
    3: [2, 4],
    4: [3, 5, 25],     // 4连接25（上下相邻）
    5: [4, 6],
    6: [5, 7],
    // 外环右侧 (7-11)
    7: [6, 8],
    8: [7, 9],
    9: [8, 10, 24],    // 分叉点：连接外环和十字
    10: [9, 11],
    11: [10, 12],
    // 外环底部 (12-16)
    12: [11, 13],
    13: [12, 14, 27],  // 分叉点：连接外环和十字
    14: [13, 15],
    15: [14, 16],
    16: [15, 17],
    // 外环左侧 (17-20)
    17: [16, 18],
    18: [17, 19, 21],  // 分叉点：连接外环和十字
    19: [18, 20],
    20: [19, 1],
    // 十字横向 (21-24)
    21: [18, 22],
    22: [21, 23],
    23: [22, 24, 26, 27],  // 十字中心：连接横向(22,24)和纵向(26,27)
    24: [23, 9],
    // 十字纵向 (25-27)
    25: [4, 26],       // 25连接4（上方）和26（下方）
    26: [25, 23],      // 26连接25（上方）和23（下方）- 不连27！
    27: [23, 13]       // 27连接23（上方）和13（下方）
};

function renderBoard() {
    const container = document.getElementById('board-container');
    const cells = gameState.board.cells;
    
    // 检查诺亚强化效果是否激活
    const noahEnhancedActive = gameState.noahEnhancedActive;
    const humanPlayer = gameState.players.find(p => !p.isAI);
    const isNoah = humanPlayer && humanPlayer.character.id === 'noah';
    const canSeeHiddenCells = isNoah || !noahEnhancedActive;
    
    // 检查奈叶香幻视效果是否激活（显示里世界）
    const nayekaVisionActive = gameState.nayekaVisionActive || gameState.nayekaEnhancedActive;
    const isNayeka = humanPlayer && humanPlayer.character.id === 'nayeka';
    const showShadowWorld = nayekaVisionActive || gameState.showingShadowWorld;
    
    let html = `<div class="board-grid ${showShadowWorld ? 'shadow-world-view' : ''}">`;
    
    BOARD_GRID.forEach((row, rowIdx) => {
        row.forEach((cellId, colIdx) => {
            if (cellId === null) {
                // 检查是否有装饰
                const decorKey = `${rowIdx}-${colIdx}`;
                const decorType = DECORATION_CELLS[decorKey];
                if (decorType && DECORATION_TYPES[decorType]) {
                    const decor = DECORATION_TYPES[decorType];
                    html += `<div class="grid-cell decoration decoration-${decorType}" style="background: ${decor.color};">
                        <span class="decoration-emoji">${decor.emoji}</span>
                    </div>`;
                } else {
                    html += '<div class="grid-cell empty"></div>';
                }
            } else {
                const cell = cells.find(c => c.id === cellId);
                const typeInfo = CELL_TYPES[cell.type];
                const triggeredClass = cell && cell.isTriggered ? 'cell-triggered' : '';
                const hiddenClass = !canSeeHiddenCells ? 'cell-hidden' : '';
                
                // 检查哪些玩家在这个格子上
                const playersHere = gameState.players.filter(p => p.position === cellId && !p.isEliminated);
                
                // 格子内容
                let cellContent = '';
                let cellClass = '';
                
                if (showShadowWorld) {
                    // 显示里世界效果
                    const shadowEffect = SHADOW_EFFECTS[cell.shadowEffect];
                    const isNothing = cell.shadowEffect === 'nothing';
                    cellClass = `cell-shadow ${isNothing ? 'shadow-nothing' : 'shadow-active'}`;
                    cellContent = `
                        <span class="shadow-emoji">${shadowEffect.emoji}</span>
                        <span class="shadow-name">${shadowEffect.name}</span>
                    `;
                } else if (!canSeeHiddenCells) {
                    // 诺亚强化效果：其他玩家看到黑色格子
                    cellClass = 'cell-unknown';
                    cellContent = `<span class="cell-emoji">❓</span>`;
                } else if (cell.type === 'scene' && cell.evidenceCombo) {
                    cellClass = `cell-${cell.type}`;
                    cellContent = `<span class="cell-evidence">${cell.evidenceCombo.label.split(' ')[0]}</span>`;
                } else {
                    cellClass = `cell-${cell.type}`;
                    cellContent = `<span class="cell-emoji">${typeInfo.emoji}</span>`;
                }
                
                // 被踩过的显示谁踩的
                let triggeredInfo = '';
                if (cell.isTriggered && cell.triggeredByName && (canSeeHiddenCells || showShadowWorld)) {
                    triggeredInfo = `<span class="triggered-by">${cell.triggeredByName}</span>`;
                }
                
                html += `
                    <div class="grid-cell ${cellClass} ${triggeredClass} ${hiddenClass}" 
                         data-cell="${cellId}"
                         onmouseenter="showCellInfo(${cellId})"
                         onmouseleave="hideCellInfo()">
                        <span class="cell-id">${renderClockNumber(cellId, 0.18)}</span>
                        ${cellContent}
                        ${triggeredInfo}
                        <div class="cell-players">
                            ${playersHere.map((p) => {
                                const pinImg = CHARACTER_IMAGES[p.character.id]?.pin || p.character.icon;
                                return `<span class="player-token"><img src="${pinImg}" alt="${p.name}"></span>`;
                            }).join('')}
                        </div>
                    </div>
                `;
            }
        });
    });
    
    html += '</div>';
    html += '<div id="cell-info-panel" class="cell-info-panel hidden"></div>';
    container.innerHTML = html;
}

function showCellInfo(cellId) {
    const cell = gameState.board.cells.find(c => c.id === cellId);
    if (!cell) return;
    
    // 检查诺亚强化效果
    const noahEnhancedActive = gameState.noahEnhancedActive;
    const humanPlayer = gameState.players.find(p => !p.isAI);
    const isNoah = humanPlayer && humanPlayer.character.id === 'noah';
    const canSeeHiddenCells = isNoah || !noahEnhancedActive;
    
    const panel = document.getElementById('cell-info-panel');
    
    if (!canSeeHiddenCells) {
        // 诺亚强化效果：其他玩家看不到格子信息
        panel.innerHTML = `
            <div class="info-title">❓ 未知</div>
            <div class="info-desc">格子效果被诺亚的魔法隐藏了...</div>
        `;
        panel.classList.remove('hidden');
        return;
    }
    
    const typeInfo = CELL_TYPES[cell.type];
    
    let content = `
        <div class="info-title">${typeInfo.emoji} ${typeInfo.name}</div>
        <div class="info-desc">${typeInfo.description}</div>
    `;
    
    if (cell.type === 'scene' && cell.evidenceCombo && cell.evidenceCombo.cardId) {
        const card = EVIDENCE_CARDS[cell.evidenceCombo.cardId];
        if (card) {
            content += `
                <div class="info-clue-card">
                    <img class="info-clue-icon" src="${card.image}" alt="${card.name}">
                    <div class="info-clue-details">
                        <div class="info-clue-name">${card.name}</div>
                        <div class="info-clue-label">${getClueLabel(cell.evidenceCombo.cardId)}</div>
                        <div class="info-clue-desc">${card.description}</div>
                    </div>
                </div>
            `;
        }
    }
    
    if (cell.isTriggered) {
        content += `<div class="info-triggered">已被 ${cell.triggeredByName} 触发</div>`;
    }
    
    panel.innerHTML = content;
    panel.classList.remove('hidden');
}

function hideCellInfo() {
    const panel = document.getElementById('cell-info-panel');
    if (panel) panel.classList.add('hidden');
}

function updatePrompt(text) {
    const promptEl = document.getElementById('prompt-text');
    if (!promptEl) return;
    
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    promptEl.textContent = text || `${currentPlayer.name} 的回合 - 请选择要打出的点数牌`;
}

// 更新回合指示器（多人模式）
function updateTurnIndicator(isMyTurn) {
    // 更新提示文字
    const promptEl = document.getElementById('prompt-text');
    if (promptEl && networkState.mode === 'online') {
        const currentPlayer = gameState.players[gameState.currentPlayerIndex];
        if (isMyTurn) {
            promptEl.textContent = '你的回合 - 请选择要打出的点数牌';
            promptEl.classList.remove('waiting');
            promptEl.classList.add('my-turn');
        } else {
            promptEl.textContent = `等待 ${currentPlayer.name} 操作...`;
            promptEl.classList.add('waiting');
            promptEl.classList.remove('my-turn');
        }
    }
    
    // 更新控制台整体状态
    const console = document.getElementById('user-console');
    if (console) {
        if (isMyTurn) {
            console.classList.add('my-turn');
            console.classList.remove('waiting-turn');
        } else {
            console.classList.remove('my-turn');
            console.classList.add('waiting-turn');
        }
    }
}

// ========== 分叉点定义 ==========
const FORK_POINTS = {
    9: { directions: [10, 24], labels: ['继续外环 →', '进入十字 ↓'] },
    13: { directions: [14, 27], labels: ['继续外环 ←', '进入十字 ↑'] },
    17: { directions: [16, 27], labels: ['继续外环 ↑', '进入十字 →'] },
    18: { directions: [19, 21], labels: ['继续外环 ↑', '进入十字 →'] },
    23: { directions: [24, 26], labels: ['向右 →', '向上 ↑'] },
    26: { directions: [25, 23, 27], labels: ['向上 ↑', '向左 ←', '向下 ↓'] }
};

// 移动状态
let moveState = {
    isMoving: false,
    player: null,
    remainingSteps: 0,
    path: [],
    previousPosition: null,
    lastPassedCell: null  // 最后经过的格子
};

// ========== 游戏操作 ==========
function playCard(cardIndex) {
    const player = gameState.players[gameState.currentPlayerIndex];
    
    // 多人模式：检查是否是本地玩家的回合
    if (networkState.mode === 'online') {
        if (player.id !== networkState.localPlayerId) {
            return; // 不是自己的回合
        }
        // 发送出牌消息给房主
        if (!networkState.isHost) {
            sendMessage('play_card', {
                playerId: networkState.localPlayerId,
                cardIndex: cardIndex
            });
            return; // 等待房主处理
        }
    } else {
        // 单人模式：AI不能手动出牌
        if (player.isAI || moveState.isMoving) return;
    }
    
    // 执行出牌逻辑
    executePlayCard(player, cardIndex);
}

// 处理远程玩家出牌（房主处理）
function processRemotePlayCard(playerId, cardIndex) {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) return;
    
    // 检查是否是该玩家的回合
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer.id !== playerId) return;
    
    executePlayCard(player, cardIndex);
}

// 处理远程汉娜步数选择（房主处理）
function processRemoteHannaStepSelected(playerId, steps, isEnhanced) {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) return;
    
    // 验证是汉娜角色
    if (player.character.id !== 'hanna') return;
    
    executeHannaStepSelection(player, steps, isEnhanced);
}

// 处理远程汉娜方向选择（房主处理）
function processRemoteHannaDirectionSelected(playerId, targetPos) {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) return;
    
    // 验证是汉娜角色且正在浮空移动
    if (!moveState.isMoving || !moveState.isHannaFloat) return;
    if (moveState.player.id !== playerId) return;
    
    // 执行移动动画（executeHannaMove会广播状态）
    animateHannaMove(targetPos);
}

// 处理远程里世界位置互换（房主处理）
function processRemoteShadowSwap(playerId, targetPlayers) {
    if (!targetPlayers || targetPlayers.length !== 2) return;
    
    const player1 = gameState.players.find(p => p.id === targetPlayers[0]);
    const player2 = gameState.players.find(p => p.id === targetPlayers[1]);
    
    if (!player1 || !player2) return;
    
    // 互换位置
    const tempPos = player1.position;
    const tempDir = player1.direction;
    const tempCame = player1.cameFrom;
    
    player1.position = player2.position;
    player1.direction = player2.direction;
    player1.cameFrom = player2.cameFrom;
    
    player2.position = tempPos;
    player2.direction = tempDir;
    player2.cameFrom = tempCame;
    
    const nayekaPlayer = gameState.players.find(p => p.character.id === 'nayeka');
    showMagicCastEffect(nayekaPlayer, '幻视·位置互换', `${player1.name} 和 ${player2.name} 互换了位置！`);
    
    // 广播状态
    broadcastGameState();
    renderGame();
    
    // 执行回调
    if (gameState.shadowSwapState && gameState.shadowSwapState.callback) {
        gameState.shadowSwapState.callback();
    }
}

// 处理远程里世界强制删除（房主处理）
function processRemoteShadowDelete(playerId, targetId, cardIndex) {
    const targetPlayer = gameState.players.find(p => p.id === targetId);
    if (!targetPlayer || !targetPlayer.evidenceCards[cardIndex]) return;
    
    const deletedCard = targetPlayer.evidenceCards[cardIndex];
    const cardName = EVIDENCE_CARDS[deletedCard].name;
    targetPlayer.evidenceCards.splice(cardIndex, 1);
    
    const nayekaPlayer = gameState.players.find(p => p.character.id === 'nayeka');
    showMagicCastEffect(nayekaPlayer, '幻视·强制删除', `${targetPlayer.name} 被迫删除了 ${cardName}！`);
    
    // 广播状态
    broadcastGameState();
    renderGame();
    
    // 执行回调
    if (gameState.shadowDeleteState && gameState.shadowDeleteState.callback) {
        gameState.shadowDeleteState.callback();
    }
}

// 执行出牌逻辑
function executePlayCard(player, cardIndex) {
    if (moveState.isMoving) return;
    
    const card = player.handCards[cardIndex];
    
    // 播放出牌音效
    if (typeof playCardSFX === 'function') {
        playCardSFX();
    }
    
    // 检查安安的「洗脑」技能（在出牌前触发）
    checkAnanMagic(player, card, cardIndex, (finalCard, finalIndex) => {
        // 移除手牌
        player.handCards.splice(finalIndex, 1);
        
        // 多人模式：广播状态
        if (networkState.mode === 'online' && networkState.isHost) {
            broadcastGameState();
        }
        
        // 检查雪莉强化巨力化发动当小轮不可移动
        if (isSherryCannotMove(player)) {
            showMagicAlert('巨力化', `打出 ${finalCard} 点，但无法移动！`);
            renderGame();
            setTimeout(() => {
                nextTurn();
            }, 1000);
            return;
        }
        
        // 检查希罗的「死亡回溯」技能
        checkHiroMagic(player, finalCard, () => {
            startMove(player, finalCard);
        });
    });
}

// 检查雪莉是否在当前小轮无法移动
function isSherryCannotMove(player) {
    if (player.character.id !== 'sherry') return false;
    if (!player.sherryEnhancedActive) return false;
    
    // 只有在发动强化巨力化的那个小轮无法移动
    return player.sherryNoMoveSubRound === gameState.currentSubRound &&
           player.sherryNoMoveRound === gameState.currentRound;
}

// ========== 二阶堂希罗：死亡回溯 ==========
let hiroMagicState = {
    active: false,
    timer: null,
    countdown: 10,
    targetPlayer: null,
    targetCard: null,
    callback: null
};

function checkHiroMagic(targetPlayer, card, callback) {
    // 检查被动技能锁
    if (gameState.passiveMagicLock) {
        callback();
        return;
    }
    
    // 找到希罗玩家（非当前玩家、未淘汰、角色是hiro）
    const hiroPlayer = gameState.players.find(p => 
        p.character.id === 'hiro' && 
        !p.isEliminated && 
        p.id !== targetPlayer.id
    );
    
    // 如果没有希罗，跳过
    if (!hiroPlayer) {
        callback();
        return;
    }
    
    // 希罗魔女化后，被动技能失效
    if (hiroPlayer.isWitchified) {
        callback();
        return;
    }
    
    // 单人模式：AI希罗随机决定
    if (networkState.mode === 'local' && hiroPlayer.isAI) {
        if (Math.random() < 0.3) {
            checkMargPassive(hiroPlayer, '死亡回溯',
                () => callback(),
                () => executeHiroMagic(hiroPlayer, targetPlayer, card)
            );
        } else {
            callback();
        }
        return;
    }
    
    // 多人模式：房主发送请求给希罗玩家
    if (networkState.mode === 'online' && networkState.isHost) {
        // 检查希罗是否是本地玩家
        if (hiroPlayer.id === networkState.localPlayerId) {
            // 本地希罗，显示UI
            hiroMagicState = {
                active: true,
                timer: null,
                countdown: 10,
                targetPlayer: targetPlayer,
                targetCard: card,
                callback: callback,
                hiroPlayer: hiroPlayer
            };
            showHiroMagicPrompt(hiroPlayer, targetPlayer, card);
        } else {
            // 远程希罗，发送请求
            sendPassiveRequest('hiro_block', hiroPlayer.id, {
                targetPlayerName: targetPlayer.name,
                card: card
            }, (activate) => {
                if (activate) {
                    checkMargPassive(hiroPlayer, '死亡回溯',
                        () => callback(),
                        () => executeHiroMagic(hiroPlayer, targetPlayer, card)
                    );
                } else {
                    callback();
                }
            });
        }
        return;
    }
    
    // 单人模式人类希罗：显示选择界面
    hiroMagicState = {
        active: true,
        timer: null,
        countdown: 10,
        targetPlayer: targetPlayer,
        targetCard: card,
        callback: callback,
        hiroPlayer: hiroPlayer
    };
    
    showHiroMagicPrompt(hiroPlayer, targetPlayer, card);
}

function showHiroMagicPrompt(hiroPlayer, targetPlayer, card) {
    // 创建弹窗
    const modal = document.createElement('div');
    modal.id = 'hiro-magic-modal';
    modal.className = 'hiro-magic-modal';
    modal.innerHTML = `
        <div class="hiro-magic-content" onclick="event.stopPropagation()">
            <div class="hiro-magic-header">
                <span class="hiro-icon">${getCharIcon(hiroPlayer.character, 'small')}</span>
                <span class="hiro-title">死亡回溯</span>
            </div>
            <div class="hiro-magic-info">
                <p><strong>${targetPlayer.name}</strong> 打出了 <strong>${card}</strong> 点</p>
                <p>是否发动魔法禁止其移动？</p>
                <p class="hiro-cost">魔女化惩罚: +15</p>
            </div>
            <div class="hiro-countdown">
                <span id="hiro-countdown-num">${hiroMagicState.countdown}</span>秒
            </div>
            <div class="hiro-magic-buttons">
                <button class="hiro-btn activate" onclick="confirmHiroMagic(true)">发动魔法</button>
                <button class="hiro-btn skip" onclick="confirmHiroMagic(false)">跳过</button>
            </div>
        </div>
    `;
    
    // 阻止背景点击关闭
    modal.onclick = (e) => {
        if (e.target === modal) {
            e.stopPropagation();
            // 不做任何事，必须点击按钮
        }
    };
    
    document.body.appendChild(modal);
    
    // 开始倒计时
    hiroMagicState.timer = setInterval(() => {
        hiroMagicState.countdown--;
        const countdownEl = document.getElementById('hiro-countdown-num');
        if (countdownEl) {
            countdownEl.innerHTML = renderClockNumber(hiroMagicState.countdown, 0.35);
            countdownEl.style.filter = hiroMagicState.countdown <= 3 ? 'hue-rotate(-60deg) brightness(1.2)' : 'none';
        }
        
        if (hiroMagicState.countdown <= 0) {
            // 超时，自动跳过
            confirmHiroMagic(false);
        }
    }, 1000);
    
    // 淡入动画
    requestAnimationFrame(() => {
        modal.classList.add('show');
    });
}

function confirmHiroMagic(activate) {
    if (!hiroMagicState.active) return;
    
    // 清除倒计时
    if (hiroMagicState.timer) {
        clearInterval(hiroMagicState.timer);
        hiroMagicState.timer = null;
    }
    
    // 移除弹窗
    const modal = document.getElementById('hiro-magic-modal');
    if (modal) {
        modal.classList.add('hide');
        setTimeout(() => modal.remove(), 300);
    }
    
    const { hiroPlayer, targetPlayer, targetCard, callback } = hiroMagicState;
    hiroMagicState.active = false;
    
    if (activate) {
        // 检查玛格被动技能
        checkMargPassive(hiroPlayer, '死亡回溯',
            () => {
                // 被无效化，继续正常流程
                showMagicAlert('魔法失效', '死亡回溯被玛格的模仿无效化了！');
                callback();
            },
            () => {
                // 允许发动
                executeHiroMagic(hiroPlayer, targetPlayer, targetCard);
            }
        );
    } else {
        // 不发动，继续正常流程
        callback();
    }
}

function executeHiroMagic(hiroPlayer, targetPlayer, card) {
    // 增加希罗的魔女化
    hiroPlayer.witchification += 10;
    showWitchPopup(hiroPlayer, 10, '发动死亡回溯');
    checkWitchification(hiroPlayer);
    
    // 显示魔法效果
    showMagicCastEffect(hiroPlayer, '死亡回溯', `${targetPlayer.name} 的移动被禁止！`);
    
    // 目标玩家的移动被禁止，直接结束其小轮
    updatePrompt(`${targetPlayer.name} 的移动被「死亡回溯」禁止！`);
    
    renderGame();
    
    // 延迟后进入下一回合
    setTimeout(() => {
        nextTurn();
    }, 1500);
}

// ========== 泽渡可可：千里眼 ==========
let cocoMagicState = {
    active: false,
    timer: null,
    countdown: 10,
    movingPlayer: null,
    cellId: null,
    callback: null,
    cocoPlayer: null
};

function checkCocoMagic(movingPlayer, cellId, callback) {
    // 检查被动技能锁
    if (gameState.passiveMagicLock) {
        callback();
        return;
    }
    
    // 找到可可玩家（非当前移动玩家、未淘汰、角色是coco）
    const cocoPlayer = gameState.players.find(p => 
        p.character.id === 'coco' && 
        !p.isEliminated && 
        p.id !== movingPlayer.id
    );
    
    // 如果没有可可，跳过
    if (!cocoPlayer) {
        callback();
        return;
    }
    
    // 可可魔女化后，被动技能失效
    if (cocoPlayer.isWitchified) {
        callback();
        return;
    }
    
    // 检查这个格子是否是可可驻足过的
    if (!cocoPlayer.visitedCells.has(cellId)) {
        callback();
        return;
    }
    
    // AI可可：随机决定是否发动（40%概率）
    if (networkState.mode === 'local' && cocoPlayer.isAI) {
        if (Math.random() < 0.4) {
            // 检查玛格被动技能
            checkMargPassive(cocoPlayer, '千里眼',
                () => {
                    // 被无效化，继续正常流程
                    callback();
                },
                () => {
                    // 允许发动
                    executeCocoMagic(cocoPlayer, movingPlayer, cellId, callback);
                }
            );
        } else {
            callback();
        }
        return;
    }
    
    // 多人模式：房主发送请求给可可玩家
    if (networkState.mode === 'online' && networkState.isHost) {
        // 检查可可是否是本地玩家
        if (cocoPlayer.id === networkState.localPlayerId) {
            // 本地可可，显示UI
            cocoMagicState = {
                active: true,
                timer: null,
                countdown: 10,
                movingPlayer: movingPlayer,
                cellId: cellId,
                callback: callback,
                cocoPlayer: cocoPlayer
            };
            showCocoMagicPrompt(cocoPlayer, movingPlayer, cellId);
        } else {
            // 远程可可，发送请求
            sendPassiveRequest('coco_clairvoyance', cocoPlayer.id, {
                movingPlayerName: movingPlayer.name,
                cellId: cellId
            }, (activate) => {
                if (activate) {
                    checkMargPassive(cocoPlayer, '千里眼',
                        () => callback(),
                        () => executeCocoMagic(cocoPlayer, movingPlayer, cellId, callback)
                    );
                } else {
                    callback();
                }
            });
        }
        return;
    }
    
    // 单人模式人类可可：显示选择界面，10秒倒计时
    cocoMagicState = {
        active: true,
        timer: null,
        countdown: 10,
        movingPlayer: movingPlayer,
        cellId: cellId,
        callback: callback,
        cocoPlayer: cocoPlayer
    };
    
    showCocoMagicPrompt(cocoPlayer, movingPlayer, cellId);
}

function showCocoMagicPrompt(cocoPlayer, movingPlayer, cellId) {
    const modal = document.createElement('div');
    modal.id = 'coco-magic-modal';
    modal.className = 'coco-magic-modal';
    modal.innerHTML = `
        <div class="coco-magic-content" onclick="event.stopPropagation()">
            <div class="coco-magic-header">
                <span class="coco-icon">${getCharIcon(cocoPlayer.character, 'small')}</span>
                <span class="coco-title">千里眼</span>
            </div>
            <div class="coco-magic-info">
                <p><strong>${movingPlayer.name}</strong> 经过了格子 <strong>${cellId}</strong></p>
                <p>这是你驻足过的格子！</p>
                <p>是否发动魔法触发地下室效果？</p>
                <p class="coco-cost">魔女化惩罚: +10</p>
            </div>
            <div class="coco-countdown">
                <span id="coco-countdown-num">${cocoMagicState.countdown}</span>秒
            </div>
            <div class="coco-magic-buttons">
                <button class="coco-btn activate" onclick="confirmCocoMagic(true)">发动魔法</button>
                <button class="coco-btn skip" onclick="confirmCocoMagic(false)">跳过</button>
            </div>
        </div>
    `;
    
    modal.onclick = (e) => {
        if (e.target === modal) {
            e.stopPropagation();
        }
    };
    
    document.body.appendChild(modal);
    
    // 开始倒计时
    cocoMagicState.timer = setInterval(() => {
        cocoMagicState.countdown--;
        const countdownEl = document.getElementById('coco-countdown-num');
        if (countdownEl) {
            countdownEl.innerHTML = renderClockNumber(cocoMagicState.countdown, 0.35);
            countdownEl.style.filter = cocoMagicState.countdown <= 3 ? 'hue-rotate(-60deg) brightness(1.2)' : 'none';
        }
        
        if (cocoMagicState.countdown <= 0) {
            confirmCocoMagic(false);
        }
    }, 1000);
    
    requestAnimationFrame(() => {
        modal.classList.add('show');
    });
}

function confirmCocoMagic(activate) {
    if (!cocoMagicState.active) return;
    
    if (cocoMagicState.timer) {
        clearInterval(cocoMagicState.timer);
        cocoMagicState.timer = null;
    }
    
    const modal = document.getElementById('coco-magic-modal');
    if (modal) {
        modal.classList.add('hide');
        setTimeout(() => modal.remove(), 300);
    }
    
    const { cocoPlayer, movingPlayer, cellId, callback } = cocoMagicState;
    cocoMagicState.active = false;
    
    if (activate) {
        // 检查玛格被动技能
        checkMargPassive(cocoPlayer, '千里眼',
            () => {
                // 被无效化，继续正常流程
                showMagicAlert('魔法失效', '千里眼被玛格的模仿无效化了！');
                callback();
            },
            () => {
                // 允许发动
                executeCocoMagic(cocoPlayer, movingPlayer, cellId, callback);
            }
        );
    } else {
        callback();
    }
}

function executeCocoMagic(cocoPlayer, movingPlayer, cellId, callback) {
    // 增加可可的魔女化
    cocoPlayer.witchification += 20;
    showWitchPopup(cocoPlayer, 20, '发动千里眼');
    checkWitchification(cocoPlayer);
    
    // 显示魔法效果
    showMagicCastEffect(cocoPlayer, '千里眼', `${cocoPlayer.name} 触发地下室效果！`);
    
    renderGame();
    
    // 触发地下室效果（给可可选择证据）
    setTimeout(() => {
        triggerBasementForCoco(cocoPlayer, callback);
    }, 1000);
}

function triggerBasementForCoco(cocoPlayer, callback) {
    if (cocoPlayer.isAI) {
        // AI随机选择一张证据
        if (Math.random() > 0.3) {
            const allCardIds = Object.keys(EVIDENCE_CARDS);
            const randomCard = allCardIds[Math.floor(Math.random() * allCardIds.length)];
            giveEvidenceCard(cocoPlayer, randomCard);
        }
        renderGame();
        callback();
    } else {
        // 人类可可：显示地下室选择界面
        showCocoBasementModal(cocoPlayer, callback);
    }
}

function showCocoBasementModal(cocoPlayer, callback) {
    // 从6种证据卡中随机抽3张
    const allCardIds = Object.keys(EVIDENCE_CARDS);
    const randomCards = [];
    for (let i = 0; i < 3; i++) {
        randomCards.push(allCardIds[Math.floor(Math.random() * allCardIds.length)]);
    }
    
    const modal = document.createElement('div');
    modal.id = 'coco-basement-modal';
    modal.className = 'coco-basement-modal';
    modal.innerHTML = `
        <div class="coco-basement-content" onclick="event.stopPropagation()">
            <div class="coco-basement-header">
                <span>🔦 千里眼 - 地下室效果</span>
            </div>
            <div class="coco-basement-hint">选择至多1个证据卡，或点击确认跳过</div>
            <div class="coco-basement-cards">
                ${randomCards.map((cardId, idx) => {
                    const card = EVIDENCE_CARDS[cardId];
                    return `
                        <button class="coco-card-btn" data-card="${cardId}" data-idx="${idx}">
                            <img class="modal-clue-icon" src="${card.image}" alt="${card.name}">
                            <span class="card-name">${card.name}</span>
                            <span class="card-label">${getClueLabel(cardId)}</span>
                        </button>
                    `;
                }).join('')}
            </div>
            <button class="coco-confirm-btn" onclick="confirmCocoBasement()">确认</button>
        </div>
    `;
    
    modal.onclick = (e) => {
        if (e.target === modal) {
            e.stopPropagation();
        }
    };
    
    document.body.appendChild(modal);
    
    // 保存状态
    cocoMagicState.basementCards = randomCards;
    cocoMagicState.selectedCard = null;
    cocoMagicState.basementCallback = callback;
    cocoMagicState.basementPlayer = cocoPlayer;
    
    // 绑定选择事件
    modal.querySelectorAll('.coco-card-btn').forEach(btn => {
        btn.onclick = () => {
            const cardId = btn.dataset.card;
            if (btn.classList.contains('selected')) {
                btn.classList.remove('selected');
                cocoMagicState.selectedCard = null;
            } else {
                modal.querySelectorAll('.coco-card-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                cocoMagicState.selectedCard = cardId;
            }
        };
    });
    
    requestAnimationFrame(() => {
        modal.classList.add('show');
    });
}

function confirmCocoBasement() {
    const modal = document.getElementById('coco-basement-modal');
    const { selectedCard, basementCallback, basementPlayer } = cocoMagicState;
    
    if (selectedCard) {
        giveEvidenceCard(basementPlayer, selectedCard);
    }
    
    if (modal) {
        modal.classList.add('hide');
        setTimeout(() => modal.remove(), 300);
    }
    
    renderGame();
    basementCallback();
}

function startMove(player, steps) {
    moveState = {
        isMoving: true,
        player: player,
        remainingSteps: steps,
        path: [player.position],
        previousPosition: player.position,
        lastPassedCell: null
    };
    
    updatePrompt(`${player.name} 移动中... 剩余 ${steps} 步`);
    renderHandCards();
    
    // 开始逐步移动
    moveOneStep();
}

function moveOneStep() {
    if (moveState.remainingSteps <= 0) {
        finishMove();
        return;
    }
    
    const player = moveState.player;
    const currentPos = player.position;
    const connections = CELL_CONNECTIONS[currentPos];
    
    if (!connections || connections.length === 0) {
        finishMove();
        return;
    }
    
    // 判断是否是第一步（刚开始移动，还没走过）
    const isFirstStep = moveState.path.length === 1 && moveState.previousPosition === currentPos;
    
    // 确定"来时的路"：第一步用player.cameFrom，之后用moveState.previousPosition
    const cameFrom = isFirstStep ? player.cameFrom : moveState.previousPosition;
    
    // 过滤掉来时的路（不能回头）
    let validDirections = connections.filter(pos => pos !== cameFrom);
    
    if (validDirections.length === 0) {
        // 死路，允许回头（理论上不应该发生）
        validDirections = connections;
    }
    
    if (validDirections.length === 1) {
        // 只有一个方向，直接走
        animateMove(validDirections[0]);
    } else {
        // 多个方向（分叉点），需要选择
        // 检查蕾雅的「视线诱导」技能
        checkLeiyaMagicAtFork(player, currentPos, validDirections, (chosenDirection) => {
            if (chosenDirection !== null) {
                // 蕾雅指定了方向
                animateMove(chosenDirection);
            } else {
                // 正常选择
                if (player.isAI) {
                    // AI随机选择
                    const nextPos = validDirections[Math.floor(Math.random() * validDirections.length)];
                    animateMove(nextPos);
                } else {
                    // 人类玩家：显示方向箭头
                    showDirectionArrows(currentPos, validDirections);
                }
            }
        });
    }
}

function showDirectionArrows(currentPos, validDirections) {
    // 清除之前的箭头
    clearDirectionArrows();
    
    validDirections.forEach(targetPos => {
        const targetCell = document.querySelector(`.grid-cell[data-cell="${targetPos}"]`);
        if (!targetCell) return;
        
        // 计算箭头方向
        const arrow = getArrowForDirection(currentPos, targetPos);
        
        // 创建箭头元素
        const arrowEl = document.createElement('div');
        arrowEl.className = 'direction-arrow';
        arrowEl.innerHTML = arrow;
        arrowEl.dataset.target = targetPos;
        arrowEl.onclick = () => selectDirection(targetPos);
        
        targetCell.appendChild(arrowEl);
        targetCell.classList.add('fork-highlight');
    });
    
    updatePrompt('选择前进方向（点击箭头）');
}

function getArrowForDirection(fromPos, toPos) {
    // 根据格子位置关系确定箭头方向
    const fromCoord = getCellCoord(fromPos);
    const toCoord = getCellCoord(toPos);
    
    if (!fromCoord || !toCoord) return '➡️';
    
    const dx = toCoord.col - fromCoord.col;
    const dy = toCoord.row - fromCoord.row;
    
    if (dx > 0) return '➡️';
    if (dx < 0) return '⬅️';
    if (dy > 0) return '⬇️';
    if (dy < 0) return '⬆️';
    return '➡️';
}

function getCellCoord(cellId) {
    for (let row = 0; row < BOARD_GRID.length; row++) {
        for (let col = 0; col < BOARD_GRID[row].length; col++) {
            if (BOARD_GRID[row][col] === cellId) {
                return { row, col };
            }
        }
    }
    return null;
}

function selectDirection(targetPos) {
    // 多人模式：发送方向选择
    if (networkState.mode === 'online' && !networkState.isHost) {
        sendMessage('select_direction', {
            playerId: networkState.localPlayerId,
            direction: targetPos
        });
        clearDirectionArrows();
        return;
    }
    
    // 更新玩家方向
    moveState.player.direction = targetPos;
    clearDirectionArrows();
    animateMove(targetPos);
}

// 处理远程玩家方向选择（房主处理）
function processRemoteSelectDirection(playerId, direction) {
    if (!moveState.isMoving) return;
    if (moveState.player.id !== playerId) return;
    
    moveState.player.direction = direction;
    animateMove(direction);
}

// 处理远程玩家资源选择（房主处理）
function processRemoteSelectResource(playerId, selection) {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) return;
    
    // 检查是否是该玩家的回合
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer.id !== playerId) return;
    
    const { type, selected } = selection;
    
    // 执行选择
    if (type === 'basement' && selected !== null) {
        giveEvidenceCard(player, selected);
    } else if (type === 'lounge' && selected !== null) {
        player.evidenceCards.splice(selected, 1);
    }
    
    // 广播状态
    broadcastGameState();
    
    renderGame();
    
    // 继续游戏流程（触发回调）
    if (resourceSelectState.callback) {
        const callback = resourceSelectState.callback;
        resourceSelectState.active = false;
        resourceSelectState.callback = null;
        callback();
    }
}

// 处理远程玩家发动魔法（房主处理）
function processRemoteCastMagic(playerId, magicData = {}) {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) return;
    
    // 检查是否可以发动魔法
    if (!canCastMagic(player)) {
        console.log('[多人] 玩家无法发动魔法:', playerId);
        return;
    }
    
    // 执行魔法
    executeCastMagic(player, magicData);
}

// 执行魔法发动（统一入口）
function executeCastMagic(player, magicData = {}) {
    const charId = player.character.id;
    
    switch (charId) {
        case 'emma':
            castMagic_Emma(player);
            break;
        case 'hanna':
            // 汉娜浮空需要特殊处理（步数选择）
            if (magicData.steps !== undefined) {
                executeHannaStepSelection(player, magicData.steps, magicData.isEnhanced);
            } else {
                castMagic_Hanna(player);
            }
            break;
        case 'noah':
            castMagic_Noah(player);
            break;
        case 'nayeka':
            if (magicData.targetPlayerId !== undefined) {
                executeNayekaMagic(player, magicData.targetPlayerId);
            } else {
                castMagic_Nayeka(player);
            }
            break;
        case 'arisa':
            castMagic_Arisa(player);
            break;
        case 'meruru':
            castMagic_Meruru(player);
            break;
        // 被动技能角色（不能主动发动）
        case 'hiro':
        case 'coco':
        case 'sherry':
        case 'anan':
        case 'leiya':
        case 'milia':
        case 'marg':
            console.log('[魔法] 该角色为被动技能，不能主动发动');
            break;
        default:
            console.log('[魔法] 未知角色:', charId);
    }
    
    // 多人模式：广播状态
    if (networkState.mode === 'online' && networkState.isHost) {
        broadcastGameState();
    }
}

// 资源选择执行函数
function executeEvidenceSelection(player, evidenceType, amount) {
    if (evidenceType === 'physical') {
        player.physicalEvidence = Math.max(0, player.physicalEvidence + amount);
    } else if (evidenceType === 'testimonial') {
        player.testimonialEvidence = Math.max(0, player.testimonialEvidence + amount);
    }
    renderGame();
}

function executeTestimonySelection(player, testimonyType, amount) {
    if (testimonyType === 'physical') {
        player.physicalTestimony = Math.max(0, player.physicalTestimony + amount);
    } else if (testimonyType === 'testimonial') {
        player.testimonialTestimony = Math.max(0, player.testimonialTestimony + amount);
    }
    renderGame();
}

function executeHeartSelection(player, amount) {
    player.heartFragments = Math.max(0, player.heartFragments + amount);
    renderGame();
}

function executeWitchChangeSelection(player, amount) {
    changeWitchification(player, amount);
    renderGame();
}

function executeCellEffectSelection(player, effectId, data) {
    // 通用格子效果处理
    console.log('[格子效果] 执行:', effectId, data);
    // 根据effectId执行对应逻辑
    renderGame();
}

function clearDirectionArrows() {
    document.querySelectorAll('.direction-arrow').forEach(el => el.remove());
    document.querySelectorAll('.grid-cell.fork-highlight').forEach(el => {
        el.classList.remove('fork-highlight');
    });
}

function showForkChoice(currentPos, validDirections) {
    // 不再使用弹窗，改用棋盘上的箭头
    showDirectionArrows(currentPos, validDirections);
}

function animateMove(nextPos) {
    const player = moveState.player;
    const currentPos = player.position;
    
    // 播放脚步音效
    if (typeof playStepSFX === 'function') {
        playStepSFX();
    }
    
    // 获取当前和目标格子的DOM元素
    const currentCell = document.querySelector(`.grid-cell[data-cell="${currentPos}"]`);
    const targetCell = document.querySelector(`.grid-cell[data-cell="${nextPos}"]`);
    
    if (!currentCell || !targetCell) {
        // 直接移动
        executeMove(nextPos);
        return;
    }
    
    // 创建移动动画的棋子
    const token = document.createElement('div');
    token.className = 'moving-token';
    token.style.background = ['#e94560','#3498db','#f39c12','#27ae60'][player.id - 1];
    token.innerHTML = getCharIcon(player.character, 'tiny');
    
    // 计算位置
    const currentRect = currentCell.getBoundingClientRect();
    const targetRect = targetCell.getBoundingClientRect();
    const boardRect = document.getElementById('board-container').getBoundingClientRect();
    
    token.style.left = (currentRect.left - boardRect.left + currentRect.width/2 - 15) + 'px';
    token.style.top = (currentRect.top - boardRect.top + currentRect.height/2 - 15) + 'px';
    
    document.getElementById('board-container').appendChild(token);
    
    // 触发动画
    requestAnimationFrame(() => {
        token.style.left = (targetRect.left - boardRect.left + targetRect.width/2 - 15) + 'px';
        token.style.top = (targetRect.top - boardRect.top + targetRect.height/2 - 15) + 'px';
    });
    
    // 动画结束后更新状态
    setTimeout(() => {
        token.remove();
        executeMove(nextPos);
    }, 300);
}

function executeMove(nextPos) {
    const player = moveState.player;
    moveState.previousPosition = player.position;
    player.position = nextPos;
    moveState.path.push(nextPos);
    moveState.remainingSteps--;
    
    // 记录最后经过的格子（用于停留时判断是否需要再次检查交锋）
    moveState.lastPassedCell = nextPos;
    
    // 更新玩家方向：根据当前位置的连接，找到下一个前进方向
    const connections = CELL_CONNECTIONS[nextPos];
    if (connections && connections.length > 0) {
        // 找到不是来时路的方向作为新方向
        const nextDirection = connections.find(pos => pos !== moveState.previousPosition);
        if (nextDirection !== undefined) {
            player.direction = nextDirection;
        }
    }
    
    updatePrompt(`${player.name} 移动中... 剩余 ${moveState.remainingSteps} 步`);
    renderBoard();
    
    // 检查是否与其他玩家相遇（交锋）- 经过时也触发
    const opponents = checkConfrontation(player, nextPos);
    if (opponents) {
        // 暂停移动，开始交锋
        startConfrontation(player, opponents, () => {
            // 交锋结束后检查可可千里眼，然后继续移动
            checkCocoMagic(player, nextPos, () => {
                setTimeout(() => {
                    moveOneStep();
                }, 200);
            });
        });
        return;
    }
    
    // 检查可可的千里眼技能
    checkCocoMagic(player, nextPos, () => {
        // 继续下一步
        setTimeout(() => {
            moveOneStep();
        }, 200);
    });
}

function finishMove() {
    const player = moveState.player;
    
    // 更新玩家的cameFrom（下次移动时用于禁止回头）
    player.cameFrom = moveState.previousPosition;
    
    // 记录可可驻足的格子（用于千里眼技能）
    if (player.character.id === 'coco') {
        player.visitedCells.add(player.position);
    }
    
    moveState.isMoving = false;
    
    // 停留时不再检查交锋，因为经过时已经检查过了
    // （最后停留的格子就是最后经过的格子）
    
    // 直接触发格子效果
    triggerCellAndFinish(player);
}

// 触发格子效果并结束回合
function triggerCellAndFinish(player) {
    // 触发格子效果
    const cell = gameState.board.cells.find(c => c.id === player.position);
    if (cell && !cell.isTriggered) {
        // 标记格子已触发
        cell.isTriggered = true;
        cell.triggeredBy = player.id;
        cell.triggeredByName = player.name;
        
        // 触发格子效果，传入回调函数
        triggerCell(player, cell, () => {
            // 格子效果处理完成后，继续后续流程
            afterCellEffect(player);
        });
    } else {
        // 格子已被触发或不存在，直接继续
        afterCellEffect(player);
    }
}

// 格子效果处理完成后的流程
function afterCellEffect(player) {
    // 玩家行动后立即检查胜利和溢出惩罚
    checkPlayerStatus(player);
    
    renderGame();
    
    // 检查游戏是否结束
    const activePlayers = gameState.players.filter(p => !p.isEliminated);
    if (activePlayers.length <= 1) {
        checkGameEnd();
        return;
    }
    
    // 下一个玩家
    nextTurn();
}

// 检查玩家状态：胜利条件和溢出惩罚
function checkPlayerStatus(player) {
    if (player.isEliminated) return;
    
    const resources = getPlayerResources(player);
    
    // 检查胜利（行动后立即判定）
    if (resources.evidence >= 8 && 
        resources.testimony >= 8 && 
        resources.heart >= 8) {
        // playerWins 返回 false 表示被艾玛魔法阻止
        const won = playerWins(player);
        if (won) return;
        // 如果被阻止，继续检查溢出惩罚
    }
    
    // 溢出惩罚：每超1点+1魔女化
    let overflowPenalty = 0;
    const overflowDetails = [];
    ['evidence', 'testimony', 'heart'].forEach(type => {
        if (resources[type] > 8) {
            const overflow = resources[type] - 8;
            overflowPenalty += overflow;
            const typeName = type === 'evidence' ? '证物' : type === 'testimony' ? '证词' : '人心';
            overflowDetails.push(`${typeName}超标${overflow}`);
        }
    });
    
    if (overflowPenalty > 0) {
        player.witchification += overflowPenalty;
        showWitchPopup(player, overflowPenalty, overflowDetails.join('、'));
        
        // 检查魔女化（梅露露上限150，其他角色100）
        const witchLimit = player.character.id === 'meruru' ? 150 : 100;
        if (player.witchification >= witchLimit && !player.isWitchified) {
            player.isWitchified = true;
            player.witchifiedRound = gameState.currentRound;
            showWitchifiedAlert(player);
        }
    }
}

// 当前等待资源选择的状态
let resourceSelectState = {
    active: false,
    type: null,  // 'basement' 或 'lounge'
    player: null,
    selected: null,
    callback: null  // 选择完成后的回调
};

function triggerCell(player, cell, callback) {
    // 检查奈叶香幻视效果是否激活（触发里世界效果）
    if (gameState.nayekaVisionActive && player.character.id === 'nayeka') {
        triggerShadowCell(player, cell, callback);
        return;
    }
    
    // 检查奈叶香强化幻视效果（所有人触发里世界效果）
    if (gameState.nayekaEnhancedActive) {
        triggerShadowCell(player, cell, callback);
        return;
    }
    
    switch (cell.type) {
        case 'basement':
            // 地下室：选择至多一个证据卡
            if (!player.isAI) {
                showResourceSelectModal('basement', player, () => {
                    checkMeruruHealAfterCell(player, 'basement', callback);
                });
            } else {
                // AI：从6种证据卡中随机抽3张，然后随机选一张或不选
                if (Math.random() > 0.3) {
                    const allCardIds = Object.keys(EVIDENCE_CARDS);
                    const randomCard = allCardIds[Math.floor(Math.random() * allCardIds.length)];
                    giveEvidenceCard(player, randomCard);
                }
                checkMeruruHealAfterCell(player, 'basement', callback);
            }
            break;
        case 'scene':
            // 现场：获得格子上的证据卡
            if (cell.evidenceCombo && cell.evidenceCombo.cardId) {
                giveEvidenceCard(player, cell.evidenceCombo.cardId);
            }
            if (callback) callback();
            break;
        case 'lounge':
            // 娱乐室：删除一个证据卡
            if (!player.isAI) {
                if (player.evidenceCards.length > 0) {
                    showResourceSelectModal('lounge', player, () => {
                        checkMeruruHealAfterCell(player, 'lounge', callback);
                    });
                } else {
                    checkMeruruHealAfterCell(player, 'lounge', callback);
                }
            } else {
                // AI随机删除一个（如果有的话）
                if (player.evidenceCards.length > 0 && Math.random() > 0.5) {
                    const idx = Math.floor(Math.random() * player.evidenceCards.length);
                    player.evidenceCards.splice(idx, 1);
                }
                checkMeruruHealAfterCell(player, 'lounge', callback);
            }
            break;
        default:
            if (callback) callback();
    }
}

// 触发里世界效果
function triggerShadowCell(player, cell, callback) {
    const effect = cell.shadowEffect;
    const shadowInfo = SHADOW_EFFECTS[effect];
    
    showMagicAlert('里世界', `${shadowInfo.emoji} ${shadowInfo.name}`);
    
    switch (effect) {
        case 'swap':
            // 互换指定两个角色的位置
            if (player.isAI) {
                // AI随机选择两个玩家互换
                const activePlayers = gameState.players.filter(p => !p.isEliminated);
                if (activePlayers.length >= 2) {
                    const shuffled = shuffleArray([...activePlayers]);
                    const p1 = shuffled[0];
                    const p2 = shuffled[1];
                    const tempPos = p1.position;
                    p1.position = p2.position;
                    p2.position = tempPos;
                    showMagicAlert('里世界·位置互换', `${p1.name} 和 ${p2.name} 互换了位置！`);
                }
                if (callback) callback();
            } else {
                showShadowSwapSelection(player, callback);
            }
            break;
        case 'basement':
            // 自身触发一次地下室效果
            triggerBasementForPlayer(player, callback);
            break;
        case 'forceDelete':
            // 强制要求一个玩家删除一个证据卡
            if (player.isAI) {
                const targets = gameState.players.filter(p => !p.isEliminated && p.evidenceCards.length > 0);
                if (targets.length > 0) {
                    const target = targets[Math.floor(Math.random() * targets.length)];
                    const cardIdx = Math.floor(Math.random() * target.evidenceCards.length);
                    const cardName = EVIDENCE_CARDS[target.evidenceCards[cardIdx]].name;
                    target.evidenceCards.splice(cardIdx, 1);
                    showMagicAlert('里世界·强制删除', `${target.name} 被迫删除了 ${cardName}！`);
                }
                if (callback) callback();
            } else {
                showShadowForceDeleteSelection(player, callback);
            }
            break;
        case 'nothing':
            // 一无所有
            if (callback) callback();
            break;
        default:
            if (callback) callback();
    }
}

function showResourceSelectModal(type, player, callback) {
    resourceSelectState = {
        active: true,
        type: type,
        player: player,
        selected: null,
        callback: callback
    };
    
    const modal = document.getElementById('resource-modal');
    const title = document.getElementById('resource-modal-title');
    const hint = document.getElementById('resource-hint');
    const optionsContainer = document.querySelector('.resource-options');
    
    if (type === 'basement') {
        title.textContent = '🔦 地下室 - 选择获得的证据';
        hint.innerHTML = '选择至多1个证据卡，或点击确认跳过';
        
        // 从6种证据卡中随机抽3张（可重复）
        const allCardIds = Object.keys(EVIDENCE_CARDS);
        const randomCards = [];
        for (let i = 0; i < 3; i++) {
            randomCards.push(allCardIds[Math.floor(Math.random() * allCardIds.length)]);
        }
        
        // 显示随机抽到的3张证据卡
        optionsContainer.innerHTML = randomCards.map((cardId, idx) => {
            const card = EVIDENCE_CARDS[cardId];
            return `
                <button class="resource-btn evidence-card-btn" data-card="${cardId}" data-idx="${idx}" onclick="selectEvidenceCard('${cardId}')">
                    <img class="modal-clue-icon" src="${card.image}" alt="${card.name}">
                    <span class="card-name">${card.name}</span>
                    <span class="card-label">${getClueLabel(cardId)}</span>
                </button>
            `;
        }).join('');
    } else {
        title.textContent = '🎮 娱乐室 - 休息';
        hint.innerHTML = '可以选择删除1个证据卡，或直接跳过';
        
        // 显示玩家持有的证据卡
        if (player.evidenceCards.length === 0) {
            optionsContainer.innerHTML = '<p style="color:#aaa">没有证据可删除</p>';
        } else {
            optionsContainer.innerHTML = player.evidenceCards.map((cardId, idx) => {
                const card = EVIDENCE_CARDS[cardId];
                return `
                    <button class="resource-btn evidence-card-btn" data-index="${idx}" onclick="selectEvidenceCardIndex(${idx})">
                        <img class="modal-clue-icon" src="${card.image}" alt="${card.name}">
                        <span class="card-name">${card.name}</span>
                        <span class="card-label">${getClueLabel(cardId)}</span>
                    </button>
                `;
            }).join('');
        }
    }
    
    modal.classList.remove('hidden');
}

function selectEvidenceCard(cardId) {
    if (!resourceSelectState.active || resourceSelectState.type !== 'basement') return;
    
    // 切换选择
    if (resourceSelectState.selected === cardId) {
        resourceSelectState.selected = null;
    } else {
        resourceSelectState.selected = cardId;
    }
    
    // 更新按钮状态
    document.querySelectorAll('.evidence-card-btn').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.card === resourceSelectState.selected);
    });
}

function selectEvidenceCardIndex(idx) {
    if (!resourceSelectState.active || resourceSelectState.type !== 'lounge') return;
    
    // 切换选择
    if (resourceSelectState.selected === idx) {
        resourceSelectState.selected = null;
    } else {
        resourceSelectState.selected = idx;
    }
    
    // 更新按钮状态
    document.querySelectorAll('.evidence-card-btn').forEach(btn => {
        btn.classList.toggle('selected', parseInt(btn.dataset.index) === resourceSelectState.selected);
    });
}

function confirmResourceSelect() {
    if (!resourceSelectState.active) return;
    
    const player = resourceSelectState.player;
    const type = resourceSelectState.type;
    const selected = resourceSelectState.selected;
    const callback = resourceSelectState.callback;
    
    // 多人模式：非房主发送选择消息
    if (networkState.mode === 'online' && !networkState.isHost) {
        sendMessage('select_resource', {
            playerId: networkState.localPlayerId,
            selection: {
                type: type,
                selected: selected
            }
        });
        // 关闭弹窗，等待房主处理
        document.getElementById('resource-modal').classList.add('hidden');
        resourceSelectState.active = false;
        return;
    }
    
    // 执行选择
    if (type === 'basement' && selected !== null) {
        giveEvidenceCard(player, selected);
    } else if (type === 'lounge' && selected !== null) {
        player.evidenceCards.splice(selected, 1);
    }
    
    // 关闭弹窗
    document.getElementById('resource-modal').classList.add('hidden');
    resourceSelectState.active = false;
    
    // 多人模式：广播状态
    if (networkState.mode === 'online' && networkState.isHost) {
        broadcastGameState();
    }
    
    renderGame();
    
    // 执行回调（继续游戏流程）
    if (callback) {
        callback();
    }
}

function nextTurn() {
    // 关闭奈叶香幻视效果（回合结束时恢复正常棋盘）
    if (gameState.nayekaVisionActive) {
        gameState.nayekaVisionActive = false;
        gameState.nayekaVisionPlayerId = null;
    }
    
    // 检查希罗的连续行动
    if (gameState.hiroExtraTurns && gameState.hiroExtraTurns > 0) {
        const hiroPlayer = gameState.players.find(p => p.character.id === 'hiro' && !p.isEliminated);
        if (hiroPlayer) {
            gameState.hiroExtraTurns--;
            gameState.currentPlayerIndex = gameState.players.indexOf(hiroPlayer);
            
            showMagicAlert('连续行动', `${hiroPlayer.name} 还有 ${gameState.hiroExtraTurns + 1} 次额外行动！`);
            
            // 多人模式：广播状态
            if (networkState.mode === 'online' && networkState.isHost) {
                broadcastGameState();
            }
            
            renderGame();
            
            // 多人模式没有AI
            if (networkState.mode !== 'online' && hiroPlayer.isAI) {
                setTimeout(() => aiTurn(hiroPlayer), 1000);
            }
            return;
        }
    }
    
    // 检查是否还有活跃玩家
    const activePlayers = gameState.players.filter(p => !p.isEliminated);
    if (activePlayers.length <= 1) {
        checkGameEnd();
        return;
    }
    
    // 记录当前索引，用于判断是否完成一轮
    const startIndex = gameState.currentPlayerIndex;
    let nextIndex = startIndex;
    let foundNext = false;
    let completedRound = false;
    
    // 寻找下一个未淘汰的玩家
    for (let i = 0; i < gameState.players.length; i++) {
        nextIndex++;
        
        // 如果超过数组长度，回到开头
        if (nextIndex >= gameState.players.length) {
            nextIndex = 0;
            completedRound = true;  // 标记完成了一轮
        }
        
        const player = gameState.players[nextIndex];
        if (!player.isEliminated) {
            foundNext = true;
            break;
        }
    }
    
    if (!foundNext) {
        checkGameEnd();
        return;
    }
    
    // 如果完成了一轮（从末尾回到开头），进入下一小轮
    if (completedRound) {
        endSubRound();
        gameState.currentSubRound++;
        
        if (gameState.currentSubRound > gameState.totalSubRounds) {
            endRound();
            return;
        }
        
        // 小轮开始时检查亚里沙强化点火
        checkArisaEnhancedAtSubRoundStart();
        
        // 根据场上状态切换音乐
        updateGameMusic();
    }
    
    gameState.currentPlayerIndex = nextIndex;
    
    // 多人模式：广播状态
    if (networkState.mode === 'online' && networkState.isHost) {
        broadcastGameState();
    }
    
    // AI自动行动（仅单人模式）
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (networkState.mode !== 'online' && currentPlayer.isAI && !currentPlayer.isEliminated) {
        setTimeout(() => aiTurn(currentPlayer), 1000);
    }
    
    renderGame();
}

// 小轮结束（现在胜利和溢出检查已移到玩家行动后，这里只做渲染）
function endSubRound() {
    // 减少蕾雅强化效果的剩余小轮数
    if (gameState.leiyaEnhancedActive && gameState.leiyaEnhancedRemainingSubRounds > 0) {
        gameState.leiyaEnhancedRemainingSubRounds--;
        if (gameState.leiyaEnhancedRemainingSubRounds <= 0) {
            gameState.leiyaEnhancedActive = false;
            showMagicAlert('视线诱导·强化', '效果已结束！');
        }
    }
    
    // 检查梅露露强化效果（所有玩家魔女化+5）
    checkMeruruEnhancedAtSubRoundEnd();
    
    // 检查梅露露魔女化期间的处刑效果
    checkMeruruWitchExecution();
    
    // 检查安安强化魔法（在清空线索记录之前）
    checkAnanEnhancedAtSubRoundEnd(() => {
        // 清空每个玩家本小轮获得的线索记录
        gameState.players.forEach(p => {
            p.evidenceThisSubRound = [];
        });
        
        renderGame();
    });
}

// 安安强化魔法：小轮结算时检查
let ananEnhancedState = {
    active: false,
    timer: null,
    countdown: 10,
    callback: null
};

function checkAnanEnhancedAtSubRoundEnd(callback) {
    // 找到魔女化的安安玩家
    const ananPlayer = gameState.players.find(p => 
        p.character.id === 'anan' && 
        !p.isEliminated && 
        p.isWitchified
    );
    
    // 如果没有魔女化的安安，直接继续
    if (!ananPlayer) {
        callback();
        return;
    }
    
    // 检查剩余次数
    if ((ananPlayer.ananEnhancedUsed || 0) >= 4) {
        callback();
        return;
    }
    
    // 检查是否有可抢夺的目标
    const opponents = gameState.players.filter(p => 
        p.id !== ananPlayer.id && 
        !p.isEliminated &&
        p.evidenceThisSubRound && p.evidenceThisSubRound.length > 0
    );
    
    if (opponents.length === 0) {
        callback();
        return;
    }
    
    // AI安安：随机决定是否发动（50%概率）
    if (ananPlayer.isAI) {
        if (Math.random() < 0.5) {
            // AI随机选择一个目标
            const target = opponents[Math.floor(Math.random() * opponents.length)];
            executeAnanEnhancedSteal(ananPlayer, target, callback);
        } else {
            callback();
        }
        return;
    }
    
    // 人类安安：显示选择界面，10秒倒计时
    ananEnhancedState = {
        active: true,
        timer: null,
        countdown: 10,
        callback: callback,
        ananPlayer: ananPlayer,
        opponents: opponents
    };
    
    showAnanEnhancedPrompt(ananPlayer, opponents);
}

function showAnanEnhancedPrompt(ananPlayer, opponents) {
    const remaining = 4 - (ananPlayer.ananEnhancedUsed || 0);
    
    const modal = document.createElement('div');
    modal.id = 'anan-enhanced-prompt';
    modal.className = 'anan-modal';
    modal.innerHTML = `
        <div class="anan-content anan-enhanced" onclick="event.stopPropagation()">
            <div class="anan-header">
                <span class="anan-icon">${getCharIcon(ananPlayer.character, 'small')}</span>
                <span class="anan-title">洗脑·强化</span>
                <span class="anan-countdown" id="anan-enhanced-countdown">10</span>
            </div>
            <div class="anan-info">
                <p>小轮结算！是否发动强化魔法夺取线索？</p>
                <p class="anan-remaining">剩余次数: ${remaining}</p>
            </div>
            <div class="anan-target-list">
                ${opponents.map(p => `
                    <button class="anan-target-btn" onclick="confirmAnanEnhancedSteal(${p.id})">
                        <span class="target-avatar">${getCharIcon(p.character, 'small')}</span>
                        <span class="target-name">${p.name}</span>
                        <span class="target-evidence">本轮线索: ${p.evidenceThisSubRound.length}张</span>
                    </button>
                `).join('')}
            </div>
            <button class="anan-skip-btn" onclick="skipAnanEnhanced()">不发动</button>
        </div>
    `;
    
    modal.onclick = (e) => {
        if (e.target === modal) {
            e.stopPropagation();
        }
    };
    
    document.body.appendChild(modal);
    
    requestAnimationFrame(() => {
        modal.classList.add('show');
    });
    
    // 开始倒计时
    startAnanEnhancedCountdown();
}

function startAnanEnhancedCountdown() {
    ananEnhancedState.countdown = 10;
    updateAnanEnhancedCountdown();
    
    ananEnhancedState.timer = setInterval(() => {
        ananEnhancedState.countdown--;
        updateAnanEnhancedCountdown();
        
        if (ananEnhancedState.countdown <= 0) {
            // 时间到，不发动
            skipAnanEnhanced();
        }
    }, 1000);
}

function updateAnanEnhancedCountdown() {
    const el = document.getElementById('anan-enhanced-countdown');
    if (el) {
        el.textContent = ananEnhancedState.countdown;
        el.style.color = ananEnhancedState.countdown <= 3 ? '#e94560' : '#9b59b6';
    }
}

function confirmAnanEnhancedSteal(targetId) {
    if (!ananEnhancedState.active) return;
    
    // 清除计时器
    if (ananEnhancedState.timer) {
        clearInterval(ananEnhancedState.timer);
        ananEnhancedState.timer = null;
    }
    
    // 关闭弹窗
    const modal = document.getElementById('anan-enhanced-prompt');
    if (modal) {
        modal.classList.add('hide');
        setTimeout(() => modal.remove(), 300);
    }
    
    const { ananPlayer, callback } = ananEnhancedState;
    const targetPlayer = gameState.players.find(p => p.id === targetId);
    
    ananEnhancedState.active = false;
    
    if (!targetPlayer) {
        callback();
        return;
    }
    
    // 执行抢夺，然后检查是否可以继续抢夺
    executeAnanEnhancedSteal(ananPlayer, targetPlayer, () => {
        // 抢夺完成后，检查是否还能继续抢夺
        checkAnanEnhancedContinue(ananPlayer, callback);
    });
}

function executeAnanEnhancedSteal(ananPlayer, targetPlayer, onComplete) {
    // 增加使用次数
    ananPlayer.ananEnhancedUsed = (ananPlayer.ananEnhancedUsed || 0) + 1;
    
    // 夺取线索
    const stolenCards = [...(targetPlayer.evidenceThisSubRound || [])];
    stolenCards.forEach(cardId => {
        // 从目标手中移除
        const idx = targetPlayer.evidenceCards.indexOf(cardId);
        if (idx !== -1) {
            targetPlayer.evidenceCards.splice(idx, 1);
        }
        // 添加到安安手中
        ananPlayer.evidenceCards.push(cardId);
    });
    
    // 清空目标本小轮获得的线索记录
    targetPlayer.evidenceThisSubRound = [];
    
    const cardNames = stolenCards.map(id => EVIDENCE_CARDS[id].name).join('、');
    showMagicCastEffect(ananPlayer, '洗脑·强化', `从 ${targetPlayer.name} 处夺取了 ${cardNames}！`);
    
    renderGame();
    
    // 延迟执行回调
    setTimeout(() => {
        onComplete();
    }, 1500);
}

// 检查安安是否可以继续抢夺
function checkAnanEnhancedContinue(ananPlayer, finalCallback) {
    // 检查剩余次数
    if ((ananPlayer.ananEnhancedUsed || 0) >= 4) {
        finalCallback();
        return;
    }
    
    // 检查是否还有可抢夺的目标
    const opponents = gameState.players.filter(p => 
        p.id !== ananPlayer.id && 
        !p.isEliminated &&
        p.evidenceThisSubRound && p.evidenceThisSubRound.length > 0
    );
    
    if (opponents.length === 0) {
        finalCallback();
        return;
    }
    
    // AI安安：随机决定是否继续（40%概率）
    if (ananPlayer.isAI) {
        if (Math.random() < 0.4) {
            const target = opponents[Math.floor(Math.random() * opponents.length)];
            executeAnanEnhancedSteal(ananPlayer, target, () => {
                checkAnanEnhancedContinue(ananPlayer, finalCallback);
            });
        } else {
            finalCallback();
        }
        return;
    }
    
    // 人类安安：再次显示选择界面
    ananEnhancedState = {
        active: true,
        timer: null,
        countdown: 10,
        callback: finalCallback,
        ananPlayer: ananPlayer,
        opponents: opponents
    };
    
    showAnanEnhancedPrompt(ananPlayer, opponents);
}

function skipAnanEnhanced() {
    if (!ananEnhancedState.active) return;
    
    // 清除计时器
    if (ananEnhancedState.timer) {
        clearInterval(ananEnhancedState.timer);
        ananEnhancedState.timer = null;
    }
    
    // 关闭弹窗
    const modal = document.getElementById('anan-enhanced-prompt');
    if (modal) {
        modal.classList.add('hide');
        setTimeout(() => modal.remove(), 300);
    }
    
    const { callback } = ananEnhancedState;
    ananEnhancedState.active = false;
    
    // 不发动，继续流程
    callback();
}

// 显示魔女化变化动效
function showWitchificationChanges(changes) {
    changes.forEach((change, idx) => {
        setTimeout(() => {
            showWitchPopup(change.player, change.amount, change.reason);
        }, idx * 300);
    });
}

function showWitchPopup(player, amount, reason) {
    // 判断是上涨还是下降
    const isIncrease = amount > 0;
    
    // 播放对应音效
    if (typeof playSFX === 'function') {
        if (isIncrease) {
            playSFX(SFX.cut);  // 受击音效
        } else {
            playSFX(SFX.heal); // 治愈音效
        }
    }
    
    // 找到对应玩家的卡片元素并添加动画
    const playerIndex = gameState.players.findIndex(p => p.id === player.id);
    const humanPlayer = gameState.players.find(p => !p.isAI);
    
    // 查找玩家卡片（可能在四角slot或底部user-player-card）
    let targetCard = null;
    
    if (humanPlayer && player.id === humanPlayer.id) {
        // 人类玩家的卡片在底部
        targetCard = document.querySelector('#user-player-card-wrapper .user-player-card');
    } else {
        // AI玩家的卡片在四角
        const slots = document.querySelectorAll('.player-slot .player-card');
        slots.forEach(card => {
            // 通过卡片内容匹配玩家
            const nameEl = card.querySelector('.player-card-player-name');
            if (nameEl && nameEl.textContent === player.name) {
                targetCard = card;
            }
        });
    }
    
    // 添加卡片动画效果
    if (targetCard) {
        if (isIncrease) {
            // 上涨：红色闪动并摇晃
            targetCard.classList.add('witch-damage');
            setTimeout(() => targetCard.classList.remove('witch-damage'), 600);
        } else {
            // 下降：绿色波纹
            targetCard.classList.add('witch-heal');
            setTimeout(() => targetCard.classList.remove('witch-heal'), 800);
        }
    }
    
    // 创建数字跳出效果
    const popup = document.createElement('div');
    popup.className = `witch-popup ${isIncrease ? 'damage' : 'heal'}`;
    popup.dataset.playerId = player.id;
    
    const sign = isIncrease ? '+' : '';
    const amountNum = typeof amount === 'number' ? amount : parseFloat(amount);
    const amountDisplay = renderClockDecimal(Math.abs(amountNum), 0.35);
    
    popup.innerHTML = `
        <div class="witch-popup-content">
            <span class="witch-popup-amount">${sign}${amountDisplay}</span>
            <span class="witch-popup-reason">${reason}</span>
        </div>
    `;
    
    // 定位到玩家卡片位置
    if (targetCard) {
        const rect = targetCard.getBoundingClientRect();
        popup.style.position = 'fixed';
        popup.style.left = (rect.left + rect.width / 2) + 'px';
        popup.style.top = (rect.top + rect.height / 3) + 'px';
        popup.style.transform = 'translateX(-50%)';
    } else {
        // 备用：使用旧的面板定位
        const playerPanels = document.querySelectorAll('.player-panel');
        const targetPanel = playerPanels[playerIndex];
        if (targetPanel) {
            const rect = targetPanel.getBoundingClientRect();
            popup.style.position = 'fixed';
            popup.style.left = (rect.left + rect.width / 2) + 'px';
            popup.style.top = (rect.bottom + 10) + 'px';
            popup.style.transform = 'translateX(-50%)';
        }
    }
    
    document.body.appendChild(popup);
    
    // 触发动画
    requestAnimationFrame(() => {
        popup.classList.add('show');
    });
    
    // 2秒后移除
    setTimeout(() => {
        popup.classList.add('hide');
        setTimeout(() => popup.remove(), 500);
    }, 2000);
}

function aiTurn(player) {
    if (player.handCards.length === 0) {
        nextTurn();
        return;
    }
    
    // 简单AI：随机选牌
    const cardIndex = Math.floor(Math.random() * player.handCards.length);
    const card = player.handCards[cardIndex];
    
    // 检查安安的「洗脑」技能（在出牌前触发）
    checkAnanMagic(player, card, cardIndex, (finalCard, finalIndex) => {
        // 移除手牌
        player.handCards.splice(finalIndex, 1);
        
        // 检查雪莉强化巨力化发动当小轮不可移动
        if (isSherryCannotMove(player)) {
            renderGame();
            setTimeout(() => {
                nextTurn();
            }, 500);
            return;
        }
        
        // 检查希罗的「死亡回溯」技能
        checkHiroMagic(player, finalCard, () => {
            // 希罗没有发动，正常移动
            aiMove(player, finalCard);
        });
    });
}

function aiMove(player, steps) {
    moveState = {
        isMoving: true,
        player: player,
        remainingSteps: steps,
        path: [player.position],
        previousPosition: player.position,
        lastPassedCell: null
    };
    
    updatePrompt(`${player.name} 移动中...`);
    aiMoveStep();
}

function aiMoveStep() {
    if (moveState.remainingSteps <= 0) {
        finishMove();
        return;
    }
    
    const player = moveState.player;
    const currentPos = player.position;
    const connections = CELL_CONNECTIONS[currentPos];
    
    if (!connections || connections.length === 0) {
        finishMove();
        return;
    }
    
    // 判断是否是第一步
    const isFirstStep = moveState.path.length === 1 && moveState.previousPosition === currentPos;
    
    // 确定"来时的路"：第一步用player.cameFrom，之后用moveState.previousPosition
    const cameFrom = isFirstStep ? player.cameFrom : moveState.previousPosition;
    
    // 过滤掉来时的路（不能回头）
    let validDirections = connections.filter(pos => pos !== cameFrom);
    
    if (validDirections.length === 0) {
        validDirections = connections;
    }
    
    // AI随机选择方向（如果有多个）
    const nextPos = validDirections[Math.floor(Math.random() * validDirections.length)];
    animateMove(nextPos);
}

function endRound() {
    const witchChanges = []; // 收集魔女化变化
    const newlyWitchified = []; // 本回合新魔女化的玩家
    
    // 回合结束：结算正常部分的魔女化（不超标的部分）
    gameState.players.forEach(player => {
        if (player.isEliminated) return;
        
        const resources = getPlayerResources(player);
        
        // 正常部分：每个资源（不超过8的部分）每回合+0.5魔女化
        const normalEvidence = Math.min(resources.evidence, 8);
        const normalTestimony = Math.min(resources.testimony, 8);
        const normalHeart = Math.min(resources.heart, 8);
        const normalTotal = normalEvidence + normalTestimony + normalHeart;
        const penalty = normalTotal * 1;
        
        if (penalty > 0) {
            player.witchification += penalty;
            witchChanges.push({
                player: player,
                amount: penalty,
                reason: `持有${normalTotal}点证据`
            });
        }
        
        // 检查魔女化（梅露露上限150，其他角色100）
        const witchLimit = player.character.id === 'meruru' ? 150 : 100;
        if (player.witchification >= witchLimit && !player.isWitchified) {
            player.isWitchified = true;
            player.witchifiedRound = gameState.currentRound;
            newlyWitchified.push(player);
        }
        
        // 检查处刑
        if (player.isWitchified && 
            gameState.currentRound - player.witchifiedRound >= 1 &&
            !player.isEliminated) {
            playerLoses(player);
        }
    });
    
    // 检查游戏是否已结束
    const activePlayers = gameState.players.filter(p => !p.isEliminated);
    if (activePlayers.length <= 1) {
        checkGameEnd();
        return;
    }
    
    // 先显示魔女化变化
    if (witchChanges.length > 0) {
        showWitchificationChanges(witchChanges);
    }
    
    // 显示新魔女化的玩家提示
    newlyWitchified.forEach((player, idx) => {
        setTimeout(() => {
            showWitchifiedAlert(player);
        }, witchChanges.length * 300 + idx * 500);
    });
    
    // 延迟显示回合转场效果
    const alertDelay = witchChanges.length * 300 + newlyWitchified.length * 500 + 500;
    setTimeout(() => {
        showRoundTransition(() => {
            // 刷新所有格子（重新roll类型和证据）
            refreshAllCells();
            
            // 清空可可的驻足点记录
            gameState.players.forEach(p => {
                if (p.character.id === 'coco') {
                    p.visitedCells.clear();
                }
            });
            
            // 下一回合
            gameState.currentRound++;
            gameState.currentSubRound = 1;
            gameState.totalSubRounds = Math.floor(Math.random() * 4) + 2;
            
            // 找到第一个未淘汰的玩家作为起始玩家
            gameState.currentPlayerIndex = gameState.players.findIndex(p => !p.isEliminated);
            if (gameState.currentPlayerIndex === -1) {
                // 没有活跃玩家，游戏结束
                checkGameEnd();
                return;
            }
            
            dealCards();
            
            // 回合开始时检查梅露露的魔女化增加
            checkMeruruRoundStart();
            
            // 根据场上状态切换音乐
            updateGameMusic();
            
            renderGame();
            
            // 如果第一个玩家是AI，自动行动
            const firstPlayer = gameState.players[gameState.currentPlayerIndex];
            if (firstPlayer.isAI && !firstPlayer.isEliminated) {
                setTimeout(() => aiTurn(firstPlayer), 1000);
            }
        });
    }, witchChanges.length * 300 + 500);
}

function showRoundTransition(callback) {
    // 创建转场遮罩
    const overlay = document.createElement('div');
    overlay.className = 'round-transition-overlay';
    overlay.innerHTML = `
        <div class="transition-content">
            <div class="transition-text">回合结束</div>
            <div class="transition-subtext">格子刷新中...</div>
            <div class="transition-spinner">✨</div>
        </div>
    `;
    document.body.appendChild(overlay);
    
    // 淡入
    requestAnimationFrame(() => {
        overlay.classList.add('show');
    });
    
    // 1.5秒后执行回调并淡出
    setTimeout(() => {
        overlay.querySelector('.transition-text').innerHTML = `回合 ${renderClockNumber(gameState.currentRound + 1, 0.5)}`;
        overlay.querySelector('.transition-subtext').textContent = '开始！';
        
        setTimeout(() => {
            overlay.classList.remove('show');
            overlay.classList.add('hide');
            
            // 执行回调
            callback();
            
            // 移除遮罩
            setTimeout(() => {
                overlay.remove();
                
                // 检查是否有玩家将在本回合被处刑，显示警告
                const playersToExecute = gameState.players.filter(p => 
                    p.isWitchified && 
                    !p.isEliminated && 
                    gameState.currentRound - p.witchifiedRound >= 1
                );
                if (playersToExecute.length > 0) {
                    showExecutionWarning(playersToExecute);
                }
            }, 500);
        }, 800);
    }, 1200);
}

// 当前排名计数器
let currentRank = 1;

function playerWins(player) {
    // 检查艾玛的魔法是否生效
    if (gameState.magicStates.emmaActive) {
        const emmaPlayer = gameState.players.find(p => p.id === gameState.magicStates.emmaPlayerId);
        // 如果艾玛还没有胜利或死亡，其他玩家不能宣告胜利
        if (emmaPlayer && !emmaPlayer.isEliminated && player.id !== emmaPlayer.id) {
            showMagicAlert('无法宣告胜利', `${emmaPlayer.name} 的「杀死魔女的魔法」生效中！\n必须等待艾玛胜利或死亡后才能宣告胜利。`);
            return false;
        }
    }
    
    // 玩家胜利，获得当前最高名次
    player.rank = currentRank;
    player.isEliminated = true; // 标记为已完成（不再参与游戏）
    currentRank++;
    
    // 播放胜利语音
    if (typeof playVictoryVoice === 'function') {
        playVictoryVoice(player.character.id);
    }
    
    // 如果是艾玛胜利或死亡，解除魔法效果
    if (gameState.magicStates.emmaPlayerId === player.id) {
        gameState.magicStates.emmaActive = false;
    }
    
    // 如果是诺亚胜利，解除隐藏效果
    if (gameState.noahPlayerId === player.id && gameState.noahEnhancedActive) {
        gameState.noahEnhancedActive = false;
        renderGame();
    }
    
    // 显示胜利提示
    showRankPopup(player, player.rank, '胜利');
    
    // 检查游戏是否结束（只剩一人或无人）
    checkGameEnd();
    return true;
}

function playerLoses(player) {
    // 玩家失败（被处刑），获得当前最低名次（从后往前排）
    // 计算已经失败的玩家数量
    const defeatedCount = gameState.players.filter(p => p.isEliminated && p.rank > currentRank).length;
    // 失败的玩家从最后一名开始往前排
    player.rank = gameState.playerCount - defeatedCount;
    player.isEliminated = true;
    
    // 播放失败语音
    if (typeof playDefeatVoice === 'function') {
        playDefeatVoice(player.character.id);
    }
    
    // 如果是艾玛死亡，解除魔法效果
    if (gameState.magicStates.emmaPlayerId === player.id) {
        gameState.magicStates.emmaActive = false;
        showMagicAlert('魔法解除', `${player.name} 已被处刑，「杀死魔女的魔法」效果解除！`);
    }
    
    // 如果是诺亚失败，解除隐藏效果
    if (gameState.noahPlayerId === player.id && gameState.noahEnhancedActive) {
        gameState.noahEnhancedActive = false;
        showMagicAlert('魔法解除', `${player.name} 已被处刑，格子隐藏效果解除！`);
        renderGame();
    }
    
    // 检查是否需要移除魔女化阴间效果
    if (player.isWitchified) {
        checkWitchifiedOverlay();
    }
    
    // 显示失败提示
    showRankPopup(player, player.rank, '处刑');
    
    // 检查游戏是否结束
    checkGameEnd();
}

function checkGameEnd() {
    const activePlayers = gameState.players.filter(p => !p.isEliminated);
    
    if (activePlayers.length <= 1) {
        // 游戏结束，给最后一个玩家分配名次
        if (activePlayers.length === 1) {
            activePlayers[0].rank = currentRank;
            activePlayers[0].isEliminated = true;
        }
        
        // 显示最终结算界面
        setTimeout(() => {
            showFinalResults();
        }, 1500);
    }
}

function showRankPopup(player, rank, reason) {
    const popup = document.createElement('div');
    popup.className = 'rank-popup';
    
    const rankText = rank === 1 ? '🥇 第1名' : 
                     rank === 2 ? '🥈 第2名' : 
                     rank === 3 ? '🥉 第3名' : `第${rank}名`;
    
    popup.innerHTML = `
        <div class="rank-popup-content ${reason === '胜利' ? 'win' : 'lose'}">
            <span class="rank-popup-player">${getCharIcon(player.character, 'small')} ${player.name}</span>
            <span class="rank-popup-result">${reason}！</span>
            <span class="rank-popup-rank">${rankText}</span>
        </div>
    `;
    document.body.appendChild(popup);
    
    requestAnimationFrame(() => {
        popup.classList.add('show');
    });
    
    setTimeout(() => {
        popup.classList.add('hide');
        setTimeout(() => popup.remove(), 500);
    }, 2500);
}

function showFinalResults() {
    // 按名次排序
    const sortedPlayers = [...gameState.players].sort((a, b) => a.rank - b.rank);
    
    // 更新游戏统计
    const durationEl = document.getElementById('result-duration');
    const roundsEl = document.getElementById('result-rounds');
    
    if (durationEl && gameStartTime) {
        const elapsed = Math.floor((Date.now() - gameStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const seconds = (elapsed % 60).toString().padStart(2, '0');
        durationEl.innerHTML = renderClockFont(`${minutes}:${seconds}`, 0.4);
    }
    
    if (roundsEl) {
        roundsEl.innerHTML = renderClockNumber(gameState.currentRound, 0.4);
    }
    
    // 生成排名列表
    const rankings = document.getElementById('result-rankings');
    rankings.innerHTML = sortedPlayers.map((player, idx) => {
        const rankClass = idx === 0 ? 'first' : idx === 1 ? 'second' : idx === 2 ? 'third' : '';
        const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '🏅';
        const char = player.character;
        const charColor = char.barColors ? char.barColors[0] : '#fff';
        const charIcon = char.icon;
        const nameFirst = char.name.charAt(0);
        const nameRest = char.name.slice(1);
        
        // 计算线索总数（使用getPlayerResources函数）
        const resources = getPlayerResources(player);
        const totalClues = resources.evidence + resources.testimony + resources.heart;
        
        // 魔女化百分比（显示实际值，不限制上限）
        const witchPercent = player.witchification || 0;
        
        return `
            <div class="ranking-item ${rankClass}" style="--char-color: ${charColor};">
                <span class="rank-number">${medal}</span>
                <div class="rank-avatar">
                    <img src="${charIcon}" alt="${char.name}">
                </div>
                <div class="rank-info">
                    <div class="rank-player-name">${player.name}</div>
                    <div class="rank-char-name">
                        <span class="char-first" style="color: ${charColor};">${nameFirst}</span><span class="char-rest">${nameRest}</span>
                    </div>
                </div>
                <div class="rank-stats">
                    <div class="rank-stat">
                        <span class="stat-icon">🔮</span>
                        <span class="stat-num">${renderClockNumber(witchPercent, 0.25)}</span>
                        <span class="stat-unit">%</span>
                    </div>
                    <div class="rank-stat">
                        <span class="stat-icon">📜</span>
                        <span class="stat-num">${renderClockNumber(totalClues, 0.25)}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // 更新标题
    const titleEl = document.getElementById('result-title');
    if (titleEl) {
        titleEl.textContent = '审判终结';
    }
    
    // 切换到结算界面
    showScreen('result-screen');
    
    // 播放结算音乐（如果有）
    if (typeof playHubMusic === 'function') {
        playHubMusic();
    }
}

function endGame(winner) {
    // 旧函数保留兼容，但改为调用新逻辑
    if (winner) {
        playerWins(winner);
    }
}

// 重置所有游戏状态
function resetAllGameState() {
    // 重置主游戏状态
    gameState.status = 'menu';
    gameState.gameMode = 'single';
    gameState.playerCount = 3;
    gameState.currentSelectingPlayer = 0;
    gameState.selectedCharacters = [];
    gameState.players = [];
    gameState.board = null;
    gameState.currentRound = 1;
    gameState.currentSubRound = 1;
    gameState.totalSubRounds = 3;
    gameState.currentPlayerIndex = 0;
    gameState.pendingEvents = [];
    gameState.magicStates = {
        emmaActive: false,
        emmaPlayerId: null
    };
    gameState.passiveMagicLock = false;
    gameState.hiroExtraTurns = 0;
    
    // 重置计时器
    if (gameTimerInterval) {
        clearInterval(gameTimerInterval);
        gameTimerInterval = null;
    }
    gameStartTime = null;
    
    // 重置排名计数器
    currentRank = 1;
    
    // 重置移动状态
    moveState.isMoving = false;
    moveState.player = null;
    moveState.steps = 0;
    moveState.currentStep = 0;
    
    // 重置交锋状态
    confrontationState.active = false;
    confrontationState.participants = [];
    confrontationState.lightOn = false;
    confrontationState.lightOnTime = null;
    confrontationState.lightDelay = 0;
    confrontationState.reactions = {};
    confrontationState.rankings = [];
    confrontationState.currentStealPhase = 0;
    confrontationState.callback = null;
    
    // 重置魔女化弹窗队列
    witchifiedAlertQueue = [];
    isShowingWitchifiedAlert = false;
    
    // 重置各角色魔法状态
    ananMagicState.active = false;
    if (ananMagicState.timer) {
        clearTimeout(ananMagicState.timer);
        ananMagicState.timer = null;
    }
    
    leiyaMagicState.active = false;
    if (leiyaMagicState.timer) {
        clearTimeout(leiyaMagicState.timer);
        leiyaMagicState.timer = null;
    }
    
    hiroMagicState.active = false;
    if (hiroMagicState.timer) {
        clearTimeout(hiroMagicState.timer);
        hiroMagicState.timer = null;
    }
    
    cocoMagicState.active = false;
    if (cocoMagicState.timer) {
        clearTimeout(cocoMagicState.timer);
        cocoMagicState.timer = null;
    }
    
    ananEnhancedState.active = false;
    if (ananEnhancedState.timer) {
        clearTimeout(ananEnhancedState.timer);
        ananEnhancedState.timer = null;
    }
    
    miliaMagicState.active = false;
    if (miliaMagicState.timer) {
        clearTimeout(miliaMagicState.timer);
        miliaMagicState.timer = null;
    }
    
    // 重置玛格被动状态
    if (gameState.margPassiveState && gameState.margPassiveState.timer) {
        clearInterval(gameState.margPassiveState.timer);
    }
    gameState.margPassiveState = null;
    
    // 重置资源选择状态
    resourceSelectState.active = false;
    resourceSelectState.type = null;
    resourceSelectState.player = null;
    resourceSelectState.callback = null;
    resourceSelectState.selected = null;
    
    // 重置抢夺选择
    selectedSteals = [];
    
    // 重置远程被动计时器
    if (remotePassiveTimer) {
        clearTimeout(remotePassiveTimer);
        remotePassiveTimer = null;
    }
    
    // 隐藏所有模态框和覆盖层
    const modals = document.querySelectorAll('.modal, .overlay, [id$="-modal"], [id$="-overlay"]');
    modals.forEach(modal => {
        modal.classList.add('hidden');
    });
    
    // 清理所有动态创建的临时元素
    document.querySelectorAll('.witch-popup, .magic-cast-effect, .magic-alert, .rank-popup, .execution-warning, .witchified-slide-alert, .round-transition-overlay, .character-intro-overlay, .direction-arrow, .moving-token, .hanna-float-effect, .steal-selection').forEach(el => el.remove());
    
    // 隐藏交锋相关元素
    const confAnimation = document.getElementById('confrontation-animation');
    if (confAnimation) confAnimation.classList.add('hidden');
    
    const confModal = document.getElementById('confrontation-modal');
    if (confModal) confModal.classList.add('hidden');
    
    const winnerPortrait = document.getElementById('conf-winner-portrait');
    if (winnerPortrait) {
        winnerPortrait.classList.add('hidden');
        winnerPortrait.classList.remove('show', 'exit-right');
    }
    
    // 重置魔女化滤波效果
    if (typeof deactivateWitchFilter === 'function') {
        deactivateWitchFilter();
    }
    
    // 停止当前音乐，播放大厅音乐
    if (typeof playHubMusic === 'function') {
        playHubMusic();
    }
    
    console.log('[Game] 所有游戏状态已重置');
}

function pauseGame() {
    if (confirm('确定要返回主菜单吗？')) {
        resetAllGameState();
        showScreen('menu-screen');
    }
}

// 切换被动技能锁
function togglePassiveLock() {
    const checkbox = document.getElementById('passive-lock-checkbox');
    // checkbox选中 = 开启提示，未选中 = 关闭提示（锁定）
    gameState.passiveMagicLock = !checkbox.checked;
}

// ========== 交锋系统 ==========
let confrontationState = {
    active: false,
    participants: [],      // 所有参与者（支持2-4人）
    lightOn: false,
    lightOnTime: null,
    lightDelay: 0,
    reactions: {},         // { playerId: { pressTime, isTooEarly } }
    rankings: [],          // 按反应速度排序的结果
    currentStealPhase: 0,  // 当前抢夺阶段
    callback: null
};

// 检查是否触发交锋（玩家移动到有其他玩家的格子）- 返回所有对手
function checkConfrontation(movingPlayer, position) {
    // 找到在同一格子上的所有其他未淘汰玩家
    const opponents = gameState.players.filter(p => 
        p.id !== movingPlayer.id && 
        p.position === position && 
        !p.isEliminated
    );
    return opponents.length > 0 ? opponents : null;
}

// ========== 交锋动画系统 ==========

// 播放交锋前奏动画（所有立绘同时出现同时消失）
function playConfrontationIntro(participants, callback) {
    const container = document.getElementById('confrontation-animation');
    const line = container.querySelector('.conf-anim-line');
    const title = container.querySelector('.conf-anim-title');
    const titleImg = document.getElementById('conf-anim-title-img');
    const charsContainer = document.getElementById('conf-anim-characters');
    const victoryEl = document.getElementById('conf-anim-victory');
    const victoryTextEl = document.getElementById('conf-anim-victory-text');
    
    // 重置状态
    container.classList.remove('hidden');
    line.classList.remove('animate-in');
    title.classList.remove('animate-in');
    charsContainer.innerHTML = '';
    
    // 重置胜利立绘和文字状态（清除上一次的动画）
    victoryEl.classList.remove('animate-in', 'animate-out');
    victoryEl.style.display = 'none';
    victoryEl.style.right = '-500px';
    victoryEl.style.opacity = '0';
    victoryTextEl.style.opacity = '0';
    victoryTextEl.innerHTML = '';
    
    // 设置标题图片
    titleImg.src = 'icon/battle/start.png';
    
    // 计算角色位置（根据人数分布）
    const count = participants.length;
    const positions = getCharacterPositions(count);
    
    // 创建角色立绘元素
    participants.forEach((player, idx) => {
        const char = player.character;
        const charId = char.id;
        const images = CHARACTER_IMAGES[charId];
        
        // 选择立绘：魔女化用witch，否则用normal
        let portraitSrc = player.isWitchified ? images.witch : images.normal;
        if (!portraitSrc) portraitSrc = images.cover;
        
        // 获取角色颜色
        const charColor = char.barColors[0];
        const nameFirst = char.name.charAt(0);
        const nameRest = char.name.slice(1);
        
        // 交替从左右两侧进入
        const fromSide = idx % 2 === 0 ? 'from-left' : 'from-right';
        const pos = positions[idx];
        
        const charEl = document.createElement('div');
        charEl.className = `conf-anim-char ${fromSide}`;
        charEl.style.top = pos.top;
        charEl.innerHTML = `
            <img src="${portraitSrc}" alt="${char.name}">
            <div class="char-name">
                <span class="first-letter" style="color: ${charColor};">${nameFirst}</span>${nameRest}
            </div>
        `;
        charsContainer.appendChild(charEl);
    });
    
    // 开始动画序列
    // 1. 线条滑入
    setTimeout(() => {
        line.classList.add('animate-in');
    }, 100);
    
    // 2. 标题落下
    setTimeout(() => {
        title.classList.add('animate-in');
    }, 400);
    
    // 3. 所有角色同时飞入
    setTimeout(() => {
        // 播放立绘移入音效
        if (typeof playSFX === 'function' && SFX.swoosh) {
            playSFX(SFX.swoosh);
        }
        const chars = charsContainer.querySelectorAll('.conf-anim-char');
        chars.forEach(charEl => {
            charEl.classList.add('animate-in');
        });
    }, 1000);
    
    // 4. 动画结束后回调（2秒动画时间）
    setTimeout(() => {
        container.classList.add('hidden');
        if (callback) callback();
    }, 1000 + 2000 + 300);
}

// 获取角色位置分布
function getCharacterPositions(count) {
    if (count === 2) {
        return [
            { top: '50%', target: '20%' },
            { top: '50%', target: '20%' }
        ];
    } else if (count === 3) {
        return [
            { top: '30%', target: '15%' },
            { top: '50%', target: '20%' },
            { top: '70%', target: '15%' }
        ];
    } else {
        return [
            { top: '25%', target: '12%' },
            { top: '45%', target: '18%' },
            { top: '55%', target: '18%' },
            { top: '75%', target: '12%' }
        ];
    }
}

// 显示交锋胜利立绘（排名确定时立即显示）
function showConfrontationWinnerPortrait(winner) {
    const portraitEl = document.getElementById('conf-winner-portrait');
    const imgEl = document.getElementById('conf-winner-img');
    
    if (!portraitEl || !imgEl) return;
    
    const winnerImages = CHARACTER_IMAGES[winner.character.id];
    if (!winnerImages || !winnerImages.victory) {
        portraitEl.classList.add('hidden');
        return;
    }
    
    // 播放胜利音效
    if (typeof playSFX === 'function' && SFX.glass) {
        playSFX(SFX.glass);
    }
    
    // 播放立绘滑入音效
    if (typeof playSFX === 'function' && SFX.swoosh) {
        playSFX(SFX.swoosh);
    }
    
    // 设置图片并显示
    imgEl.src = winnerImages.victory;
    portraitEl.classList.remove('hidden', 'hide');
    
    requestAnimationFrame(() => {
        portraitEl.classList.add('show');
    });
}

// 隐藏交锋胜利立绘（向右移出屏幕）
function hideConfrontationWinnerPortrait(callback) {
    const portraitEl = document.getElementById('conf-winner-portrait');
    if (!portraitEl) {
        if (callback) callback();
        return;
    }
    
    // 如果已经在退出或已隐藏，直接回调
    if (portraitEl.classList.contains('exit-right') || portraitEl.classList.contains('hidden')) {
        // 等待退出动画完成
        setTimeout(() => {
            portraitEl.classList.add('hidden');
            portraitEl.classList.remove('exit-right', 'show');
            if (callback) callback();
        }, 800);
        return;
    }
    
    // 向右移出屏幕
    portraitEl.classList.remove('show');
    portraitEl.classList.add('exit-right');
    
    setTimeout(() => {
        portraitEl.classList.add('hidden');
        portraitEl.classList.remove('exit-right');
        if (callback) callback();
    }, 800);
}

// 播放交锋收尾动画
// 顺序：标题落下 → 胜利者和失败者立绘同时飞入飞出 → 回调
function playConfrontationOutro(participants, winner, callback) {
    const container = document.getElementById('confrontation-animation');
    const line = container.querySelector('.conf-anim-line');
    const title = container.querySelector('.conf-anim-title');
    const titleImg = document.getElementById('conf-anim-title-img');
    const charsContainer = document.getElementById('conf-anim-characters');
    const victoryEl = document.getElementById('conf-anim-victory');
    const victoryTextEl = document.getElementById('conf-anim-victory-text');
    
    // 先隐藏之前的胜利立绘（不播放动画）
    const oldWinnerPortrait = document.getElementById('conf-winner-portrait');
    if (oldWinnerPortrait) {
        oldWinnerPortrait.classList.add('hidden');
        oldWinnerPortrait.classList.remove('show', 'exit-right');
    }
    
    // 重置状态
    container.classList.remove('hidden');
    line.classList.remove('animate-in');
    title.classList.remove('animate-in');
    victoryEl.style.display = 'none';
    victoryTextEl.style.opacity = '0';
    charsContainer.innerHTML = '';
    
    // 设置标题图片
    titleImg.src = 'icon/battle/finish.png';
    
    // 设置胜利文字
    const winnerChar = winner.character;
    const charColor = winnerChar.barColors[0];
    const nameFirst = winnerChar.name.charAt(0);
    const nameRest = winnerChar.name.slice(1);
    victoryTextEl.innerHTML = `
        <span class="victory-label">胜利：</span>
        <span class="winner-name">
            <span class="first-letter" style="color: ${charColor};">${nameFirst}</span>${nameRest}
        </span>
    `;
    
    // 创建胜利者立绘元素（从右侧进入）
    const winnerImages = CHARACTER_IMAGES[winnerChar.id];
    let winnerPortraitSrc = winnerImages.victory || winnerImages.normal || winnerImages.cover;
    const winnerEl = document.createElement('div');
    winnerEl.className = 'conf-anim-char from-right winner';
    winnerEl.style.top = '50%';
    winnerEl.innerHTML = `
        <img src="${winnerPortraitSrc}" alt="${winnerChar.name}">
        <div class="char-name">
            <span class="first-letter" style="color: ${charColor};">${nameFirst}</span>${nameRest}
        </div>
    `;
    charsContainer.appendChild(winnerEl);
    
    // 创建失败者立绘元素
    const losers = participants.filter(p => p.id !== winner.id);
    losers.forEach((player, idx) => {
        const char = player.character;
        const charId = char.id;
        const images = CHARACTER_IMAGES[charId];
        
        // 选择立绘：魔女化用witch，否则用stress
        let portraitSrc = player.isWitchified ? images.witch : images.stress;
        if (!portraitSrc) portraitSrc = images.normal || images.cover;
        
        // 获取角色颜色
        const loserColor = char.barColors[0];
        const loserNameFirst = char.name.charAt(0);
        const loserNameRest = char.name.slice(1);
        
        // 失败者从左侧进入
        const charEl = document.createElement('div');
        charEl.className = 'conf-anim-char from-left loser';
        charEl.style.top = `${35 + idx * 20}%`;
        charEl.innerHTML = `
            <img src="${portraitSrc}" alt="${char.name}">
            <div class="char-name">
                <span class="first-letter" style="color: ${loserColor};">${loserNameFirst}</span>${loserNameRest}
            </div>
        `;
        charsContainer.appendChild(charEl);
    });
    
    // 开始动画序列
    // 1. 线条滑入
    setTimeout(() => {
        line.classList.add('animate-in');
    }, 100);
    
    // 2. 标题落下
    setTimeout(() => {
        title.classList.add('animate-in');
    }, 400);
    
    // 3. 胜利文字淡入
    setTimeout(() => {
        victoryTextEl.style.transition = 'opacity 0.8s ease-out';
        victoryTextEl.style.opacity = '1';
    }, 800);
    
    // 4. 所有立绘同时飞入飞出（胜利者从右，失败者从左）
    setTimeout(() => {
        // 播放立绘移入音效
        if (typeof playSFX === 'function' && SFX.swoosh) {
            playSFX(SFX.swoosh);
        }
        const chars = charsContainer.querySelectorAll('.conf-anim-char');
        chars.forEach(charEl => {
            charEl.classList.add('animate-in');
        });
    }, 1200);
    
    // 5. 胜利文字退场
    setTimeout(() => {
        victoryTextEl.style.transition = 'opacity 0.8s ease-in';
        victoryTextEl.style.opacity = '0';
    }, 1200 + 2000 + 300);
    
    // 6. 动画结束后回调（失败者动画结束）
    setTimeout(() => {
        container.classList.add('hidden');
        if (callback) callback();
    }, 1200 + 2000 + 300 + 500);
}

// 开始交锋（支持多人）
function startConfrontation(movingPlayer, opponents, callback) {
    // 所有参与者 = 移动的玩家 + 所有对手
    const allParticipants = [movingPlayer, ...opponents];
    
    // 检查人类玩家是否参与交锋
    const humanInvolved = allParticipants.some(p => !p.isAI);
    
    // 播放交锋触发音效
    if (typeof playSFX === 'function' && SFX.battleBurst) {
        playSFX(SFX.battleBurst);
    }
    
    // 切换到交锋音乐
    if (typeof playBattleMusic === 'function') {
        playBattleMusic();
    }
    
    confrontationState = {
        active: true,
        participants: allParticipants,
        lightOn: false,
        lightOnTime: null,
        lightDelay: Math.random() * 2000 + 1000, // 1-3秒随机延迟
        reactions: {},
        rankings: [],
        currentStealPhase: 0,
        callback: callback,
        isSpectating: !humanInvolved  // 人类玩家是否只是观战
    };
    
    // 播放前奏动画，然后显示交锋界面
    playConfrontationIntro(allParticipants, () => {
        // 显示交锋界面
        showConfrontationModal();
        
        // 设置灯亮定时器
        setTimeout(() => {
            if (confrontationState.active) {
                turnLightOn();
            }
        }, confrontationState.lightDelay);
    });
}

function showConfrontationModal() {
    const modal = document.getElementById('confrontation-modal');
    const player1El = document.getElementById('conf-player1');
    const player2El = document.getElementById('conf-player2');
    const light = document.getElementById('confrontation-light');
    const hint = document.getElementById('confrontation-hint');
    const btn = document.getElementById('reaction-btn');
    const vsText = modal.querySelector('.vs-text');
    
    const participants = confrontationState.participants;
    const isSpectating = confrontationState.isSpectating;
    
    // 根据参与人数显示不同布局
    if (participants.length === 2) {
        // 2人对决
        player1El.innerHTML = `
            <div class="conf-avatar">${getCharIcon(participants[0].character)}</div>
            <div class="conf-name">${participants[0].name}</div>
        `;
        player1El.style.display = 'block';
        player1El.style.flexWrap = '';
        player1El.style.gap = '';
        player1El.style.justifyContent = '';
        
        player2El.innerHTML = `
            <div class="conf-avatar">${getCharIcon(participants[1].character)}</div>
            <div class="conf-name">${participants[1].name}</div>
        `;
        player2El.style.display = 'block';
        if (vsText) vsText.style.display = '';
    } else {
        // 3-4人混战
        player1El.innerHTML = participants.map(p => `
            <div class="conf-participant">
                <span class="conf-avatar-small">${getCharIcon(p.character, 'small')}</span>
                <span class="conf-name-small">${p.name}</span>
            </div>
        `).join('');
        player1El.style.display = 'flex';
        player1El.style.flexWrap = 'wrap';
        player1El.style.gap = '15px';
        player1El.style.justifyContent = 'center';
        player2El.style.display = 'none';
        if (vsText) vsText.style.display = 'none';
    }
    
    // 重置状态
    light.className = 'light-off';
    
    if (isSpectating) {
        // 观战模式
        hint.textContent = `⚔️ ${participants.map(p => p.name).join(' vs ')} 正在交锋！`;
        btn.style.display = 'none';
        modal.onclick = null;
        modal.style.cursor = 'default';
    } else {
        // 参与模式 - 点击屏幕任意位置触发
        hint.textContent = `点击屏幕`;
        btn.style.display = 'none'; // 隐藏按钮
        modal.style.cursor = 'pointer';
        modal.onclick = handleReactionPress;
    }
    
    modal.classList.remove('hidden');
    
    // 为所有AI玩家安排反应
    const aiPlayers = participants.filter(p => p.isAI);
    const humanPlayers = participants.filter(p => !p.isAI);
    
    if (humanPlayers.length === 0 || isSpectating) {
        // 全是AI或观战模式
        handleAllAIConfrontation();
    } else {
        // 有人类玩家参与，为AI安排反应
        aiPlayers.forEach(ai => scheduleAIReaction(ai));
    }
}

function turnLightOn() {
    if (!confrontationState.active) return;
    
    confrontationState.lightOn = true;
    confrontationState.lightOnTime = Date.now();
    
    const light = document.getElementById('confrontation-light');
    const hint = document.getElementById('confrontation-hint');
    
    light.className = 'light-on';
    hint.textContent = '点击屏幕';
}

function handleReactionPress() {
    if (!confrontationState.active) return;
    
    const pressTime = Date.now();
    
    // 多人模式：找到本地玩家
    let localPlayer;
    if (networkState.mode === 'online') {
        localPlayer = confrontationState.participants.find(p => p.id === networkState.localPlayerId);
    } else {
        localPlayer = confrontationState.participants.find(p => !p.isAI);
    }
    
    if (!localPlayer || confrontationState.reactions[localPlayer.id]) return;
    
    // 多人模式：发送按下时间给房主
    if (networkState.mode === 'online' && !networkState.isHost) {
        sendMessage('confrontation_press', {
            playerId: networkState.localPlayerId,
            pressTime: pressTime,
            isTooEarly: !confrontationState.lightOn
        });
    }
    
    // 记录本地玩家的反应
    confrontationState.reactions[localPlayer.id] = {
        pressTime: pressTime,
        isTooEarly: !confrontationState.lightOn
    };
    
    // 禁用继续点击
    const modal = document.getElementById('confrontation-modal');
    modal.onclick = null;
    modal.style.cursor = 'default';
    
    // 更新提示
    const hint = document.getElementById('confrontation-hint');
    if (!confrontationState.lightOn) {
        hint.textContent = '抢按了！自动失败！';
    } else {
        hint.textContent = '已点击！等待结果...';
    }
    
    // 检查是否所有人都已反应（房主处理）
    if (networkState.mode !== 'online' || networkState.isHost) {
        checkAllReacted();
    }
}

// 处理远程玩家交锋按下（房主处理）
function processRemoteConfrontationPress(playerId, pressTime) {
    if (!confrontationState.active) return;
    if (confrontationState.reactions[playerId]) return;
    
    confrontationState.reactions[playerId] = {
        pressTime: pressTime,
        isTooEarly: !confrontationState.lightOn
    };
    
    checkAllReacted();
}

// 处理远程玩家抢夺确认（房主处理）
function processRemoteConfirmSteal(playerId, selectedIndexes) {
    const rankings = confrontationState.rankings;
    const winnerIdx = confrontationState.currentStealPhase;
    const loserIdx = confrontationState.currentStealPhase + 1;
    
    const winner = rankings[winnerIdx];
    const loser = rankings[loserIdx];
    
    // 验证是否是该玩家的抢夺回合
    if (winner.id !== playerId) return;
    
    if (!selectedIndexes || selectedIndexes.length === 0) {
        // 跳过抢夺
        confrontationState.currentStealPhase++;
        startStealPhase();
        return;
    }
    
    // 使用可抢卡列表中的卡
    const stolenCards = selectedIndexes.map(idx => confrontationState.currentStealableCards[idx]);
    executeSteal(winner, loser, stolenCards);
}

function scheduleAIReaction(aiPlayer) {
    // AI反应时间：灯亮后200-800ms
    const baseReactionTime = 200 + Math.random() * 600;
    
    const checkAndReact = () => {
        if (!confrontationState.active) return;
        
        if (confrontationState.lightOn) {
            setTimeout(() => {
                if (!confrontationState.active) return;
                if (confrontationState.reactions[aiPlayer.id]) return;
                
                confrontationState.reactions[aiPlayer.id] = {
                    pressTime: confrontationState.lightOnTime + baseReactionTime,
                    isTooEarly: false
                };
                
                checkAllReacted();
            }, baseReactionTime);
        } else {
            setTimeout(checkAndReact, 50);
        }
    };
    
    checkAndReact();
}

function handleAllAIConfrontation() {
    const checkAndResolve = () => {
        if (!confrontationState.active) return;
        
        if (confrontationState.lightOn) {
            // 为所有AI生成反应时间
            confrontationState.participants.forEach(ai => {
                const reactionTime = 200 + Math.random() * 600;
                confrontationState.reactions[ai.id] = {
                    pressTime: confrontationState.lightOnTime + reactionTime,
                    isTooEarly: false
                };
            });
            
            // 延迟显示结果
            const maxTime = Math.max(...Object.values(confrontationState.reactions).map(r => r.pressTime - confrontationState.lightOnTime));
            setTimeout(() => {
                resolveConfrontation();
            }, maxTime + 100);
        } else {
            setTimeout(checkAndResolve, 50);
        }
    };
    
    checkAndResolve();
}

function checkAllReacted() {
    const allReacted = confrontationState.participants.every(p => 
        confrontationState.reactions[p.id]
    );
    
    if (allReacted) {
        resolveConfrontation();
    }
}

function resolveConfrontation() {
    if (!confrontationState.active) return;
    
    const participants = confrontationState.participants;
    const reactions = confrontationState.reactions;
    
    // 检查魔女化的雪莉 - 自动获胜（不需要额外惩罚）
    const witchifiedSherry = participants.find(p => 
        p.character.id === 'sherry' && 
        p.isWitchified &&
        !p.isEliminated
    );
    
    if (witchifiedSherry) {
        // 魔女化雪莉自动获胜
        executeSherryAutoWin(witchifiedSherry, participants);
        return;
    }
    
    // 检查未魔女化雪莉的「巨力化」技能 - 可以选择直接宣告胜利
    const sherryPlayer = participants.find(p => 
        p.character.id === 'sherry' && 
        !p.isWitchified &&
        !p.isEliminated
    );
    
    // 如果有雪莉且是人类玩家，询问是否发动
    if (sherryPlayer && !sherryPlayer.isAI && !gameState.passiveMagicLock) {
        showSherryConfrontationChoice(sherryPlayer, participants, reactions);
        return;
    }
    
    // AI雪莉：50%概率发动
    if (sherryPlayer && sherryPlayer.isAI && Math.random() < 0.5) {
        // 检查玛格被动技能
        checkMargPassive(sherryPlayer, '巨力化',
            () => {
                // 被无效化，正常交锋
                resolveNormalConfrontation(participants, reactions);
            },
            () => {
                // 允许发动
                executeSherryConfrontationWin(sherryPlayer, participants);
            }
        );
        return;
    }
    
    // 正常交锋流程
    resolveNormalConfrontation(participants, reactions);
}

// 魔女化雪莉自动获胜（不需要额外惩罚）
function executeSherryAutoWin(sherryPlayer, participants) {
    // 雪莉直接获得第一名
    confrontationState.rankings = [sherryPlayer, ...participants.filter(p => p.id !== sherryPlayer.id)];
    
    // 显示效果（不增加魔女化）
    showMagicCastEffect(sherryPlayer, '巨力化·魔女', '魔女化状态下自动获胜！');
    
    const hint = document.getElementById('confrontation-hint');
    const rankingText = confrontationState.rankings.map((p, idx) => {
        const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '4️⃣';
        return `${medal}${p.name}`;
    }).join(' ');
    hint.innerHTML = `巨力化·魔女！排名: ${rankingText}`;
    
    // 立即显示胜利立绘
    showConfrontationWinnerPortrait(sherryPlayer);
    
    // 除了雪莉外，其他人都+5魔女化
    confrontationState.rankings.forEach((p, idx) => {
        if (idx > 0) {
            p.witchification += 5;
            setTimeout(() => showWitchPopup(p, 5, '交锋失败'), idx * 300);
            checkWitchification(p);
        }
    });
    
    // 初始化本轮抢夺记录
    confrontationState.stolenThisRound = new Set();
    confrontationState.currentStealPhase = 0;
    
    setTimeout(() => {
        startStealPhase();
    }, 1500);
}

// 显示雪莉巨力化选择
function showSherryConfrontationChoice(sherryPlayer, participants, reactions) {
    const modal = document.createElement('div');
    modal.id = 'sherry-choice-modal';
    modal.className = 'sherry-choice-modal';
    modal.innerHTML = `
        <div class="sherry-choice-content" onclick="event.stopPropagation()">
            <div class="sherry-choice-header">
                <span class="sherry-icon">${getCharIcon(sherryPlayer.character, 'small')}</span>
                <span class="sherry-title">巨力化</span>
            </div>
            <div class="sherry-choice-info">
                <p>是否发动「巨力化」直接宣告胜利？</p>
                <p class="sherry-cost">魔女化惩罚: +20</p>
            </div>
            <div class="sherry-choice-buttons">
                <button class="sherry-btn activate" onclick="confirmSherryConfrontation(true)">发动魔法</button>
                <button class="sherry-btn skip" onclick="confirmSherryConfrontation(false)">正常交锋</button>
            </div>
        </div>
    `;
    
    modal.onclick = (e) => {
        if (e.target === modal) {
            e.stopPropagation();
        }
    };
    
    document.body.appendChild(modal);
    
    // 保存状态
    gameState.sherryConfrontationState = {
        sherryPlayer,
        participants,
        reactions
    };
    
    requestAnimationFrame(() => {
        modal.classList.add('show');
    });
}

function confirmSherryConfrontation(activate) {
    const modal = document.getElementById('sherry-choice-modal');
    if (modal) {
        modal.classList.add('hide');
        setTimeout(() => modal.remove(), 300);
    }
    
    const { sherryPlayer, participants, reactions } = gameState.sherryConfrontationState;
    
    if (activate) {
        // 检查玛格被动技能
        checkMargPassive(sherryPlayer, '巨力化',
            () => {
                // 被无效化，正常交锋
                showMagicAlert('魔法失效', '巨力化被玛格的模仿无效化了！');
                resolveNormalConfrontation(participants, reactions);
            },
            () => {
                // 允许发动
                executeSherryConfrontationWin(sherryPlayer, participants);
            }
        );
    } else {
        resolveNormalConfrontation(participants, reactions);
    }
}

// 雪莉巨力化直接获胜
function executeSherryConfrontationWin(sherryPlayer, participants) {
    // 雪莉直接获得第一名
    confrontationState.rankings = [sherryPlayer, ...participants.filter(p => p.id !== sherryPlayer.id)];
    
    // 增加雪莉的魔女化
    sherryPlayer.witchification += 20;
    showWitchPopup(sherryPlayer, 20, '发动巨力化');
    checkWitchification(sherryPlayer);
    
    // 显示魔法效果
    showMagicCastEffect(sherryPlayer, '巨力化', '在交锋中直接宣告胜利！');
    
    const hint = document.getElementById('confrontation-hint');
    const rankingText = confrontationState.rankings.map((p, idx) => {
        const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '4️⃣';
        return `${medal}${p.name}`;
    }).join(' ');
    hint.innerHTML = `巨力化！排名: ${rankingText}`;
    
    // 立即显示胜利立绘
    showConfrontationWinnerPortrait(sherryPlayer);
    
    // 除了雪莉外，其他人都+5魔女化
    confrontationState.rankings.forEach((p, idx) => {
        if (idx > 0) {
            p.witchification += 5;
            setTimeout(() => showWitchPopup(p, 5, '交锋失败'), idx * 300);
            checkWitchification(p);
        }
    });
    
    // 初始化本轮抢夺记录
    confrontationState.stolenThisRound = new Set();
    confrontationState.currentStealPhase = 0;
    
    setTimeout(() => {
        startStealPhase();
    }, 1500);
}

// 正常交锋流程
function resolveNormalConfrontation(participants, reactions) {
    // 处理抢按惩罚
    const earlyPressers = [];
    const validPressers = [];
    
    participants.forEach(p => {
        const r = reactions[p.id];
        if (r && r.isTooEarly) {
            earlyPressers.push(p);
            // 抢按惩罚在后面统一处理
        } else if (r) {
            validPressers.push({ player: p, pressTime: r.pressTime });
        }
    });
    
    // 按反应时间排序（快的在前）
    validPressers.sort((a, b) => a.pressTime - b.pressTime);
    
    // 生成排名：有效按下的 + 抢按的（抢按的排最后）
    confrontationState.rankings = [
        ...validPressers.map(v => v.player),
        ...earlyPressers
    ];
    
    // 显示结果
    const hint = document.getElementById('confrontation-hint');
    
    if (confrontationState.rankings.length === 0) {
        hint.textContent = '没有人按下按钮！';
        setTimeout(() => endConfrontation(), 2000);
        return;
    }
    
    if (validPressers.length === 0) {
        hint.textContent = '所有人都抢按了！平局！';
        // 所有人都+5魔女化（抢按惩罚）
        earlyPressers.forEach((p, idx) => {
            p.witchification += 5;
            setTimeout(() => showWitchPopup(p, 5, '交锋抢按'), idx * 300);
            checkWitchification(p);
        });
        setTimeout(() => endConfrontation(), 2000);
        return;
    }
    
    // 显示排名
    const rankingText = confrontationState.rankings.map((p, idx) => {
        const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '4️⃣';
        return `${medal}${p.name}`;
    }).join(' ');
    hint.innerHTML = `排名: ${rankingText}`;
    
    // 立即显示胜利立绘
    const winner = confrontationState.rankings[0];
    if (winner) {
        showConfrontationWinnerPortrait(winner);
    }
    
    // 除了第一名外，其他人都+5魔女化
    confrontationState.rankings.forEach((p, idx) => {
        if (idx > 0) {
            p.witchification += 5;
            const reason = earlyPressers.includes(p) ? '交锋抢按' : '交锋失败';
            setTimeout(() => showWitchPopup(p, 5, reason), idx * 300);
            checkWitchification(p);
        }
    });
    
    // 初始化本轮抢夺中获得的证据卡记录（这些卡不能被再次抢夺）
    confrontationState.stolenThisRound = new Set();
    confrontationState.currentStealPhase = 0;
    
    // 开始抢夺阶段（第1名抢第2名，第2名抢第3名...）
    setTimeout(() => {
        startStealPhase();
    }, 1500);
}

// 检查魔女化状态
function checkWitchification(player) {
    // 梅露露上限150，其他角色100
    const witchLimit = player.character.id === 'meruru' ? 150 : 100;
    if (player.witchification >= witchLimit && !player.isWitchified) {
        player.isWitchified = true;
        player.witchifiedRound = gameState.currentRound;
        
        // 播放魔女化音乐
        if (typeof playWitchMusic === 'function') {
            playWitchMusic();
            // 3秒后恢复普通音乐
            setTimeout(() => {
                if (typeof playCommonMusic === 'function') {
                    playCommonMusic();
                }
            }, 5000);
        }
        
        showWitchifiedAlert(player);
        
        // 雪莉魔女化后提示可以发动强化魔法
        if (player.character.id === 'sherry') {
            setTimeout(() => {
                showMagicAlert('巨力化·强化', '可以发动强化魔法！选择目标进行直接胜利的交锋，但发动后自身不可再移动。');
            }, 3500);
        }
        
        // 亚里沙魔女化后：点数牌不足4的各+3
        if (player.character.id === 'arisa') {
            let boostedCount = 0;
            player.handCards = player.handCards.map(card => {
                if (card < 4) {
                    boostedCount++;
                    return card + 3;
                }
                return card;
            });
            if (boostedCount > 0) {
                setTimeout(() => {
                    showMagicAlert('点火·强化', `${boostedCount}张点数牌各+3！`);
                }, 3500);
            }
        }
    }
}

// 魔女化弹窗队列
let witchifiedAlertQueue = [];
let isShowingWitchifiedAlert = false;

// 显示魔女化警告（滑入立绘效果）- 加入队列
function showWitchifiedAlert(player) {
    witchifiedAlertQueue.push(player);
    processWitchifiedAlertQueue();
}

// 处理魔女化弹窗队列
function processWitchifiedAlertQueue() {
    if (isShowingWitchifiedAlert || witchifiedAlertQueue.length === 0) return;
    
    isShowingWitchifiedAlert = true;
    const player = witchifiedAlertQueue.shift();
    
    const char = player.character;
    const charColor = char.barColors ? char.barColors[0] : '#9b59b6';
    const witchImage = CHARACTER_IMAGES[char.id]?.witch || CHARACTER_IMAGES[char.id]?.stress || char.icon;
    const charName = char.name; // 使用角色名
    const firstName = charName.charAt(0);
    const restName = charName.slice(1);
    
    const alert = document.createElement('div');
    alert.className = 'witchified-slide-alert';
    alert.innerHTML = `
        <div class="witchified-slide-line"></div>
        <img class="witchified-slide-image" src="${witchImage}" alt="${charName}">
        <div class="witchified-slide-text">
            <span class="witchified-slide-bracket">[</span>
            <span class="witchified-slide-first" style="color: ${charColor};">${firstName}</span>
            <span class="witchified-slide-bracket">]</span>
            <span class="witchified-slide-rest">${restName}</span>
            <span class="witchified-slide-suffix">已发生魔女化</span>
        </div>
    `;
    document.body.appendChild(alert);
    
    // 播放魔女化出现音效
    if (typeof playWitchAppearSFX === 'function') {
        playWitchAppearSFX();
    }
    
    // 播放立绘滑入音效
    if (typeof playSFX === 'function' && SFX.swoosh) {
        playSFX(SFX.swoosh);
    }
    
    // 激活魔女化滤波效果（水下/窒息感）
    if (typeof activateWitchFilter === 'function') {
        activateWitchFilter();
    }
    
    // 播放角色魔女化语音
    if (typeof playWitchVoice === 'function') {
        setTimeout(() => {
            playWitchVoice(char.id);
        }, 500); // 稍微延迟，让音效先播放
    }
    
    // 根据场上状态切换音乐
    updateGameMusic();
    
    // 添加阴间效果
    activateWitchifiedOverlay();
    
    // 触发动画
    requestAnimationFrame(() => {
        alert.classList.add('slide-in');
    });
    
    // 动画完成后移除，并处理下一个
    setTimeout(() => {
        alert.classList.add('slide-out');
        setTimeout(() => {
            alert.remove();
            isShowingWitchifiedAlert = false;
            // 处理队列中的下一个
            processWitchifiedAlertQueue();
        }, 1500);
    }, 3500);
}

// 激活魔女化阴间效果
function activateWitchifiedOverlay() {
    // 检查是否有魔女化玩家
    const hasWitchified = gameState.players.some(p => p.isWitchified && !p.isEliminated);
    
    const gameScreen = document.getElementById('game-screen');
    if (!gameScreen) return;
    
    if (hasWitchified) {
        // 有魔女化玩家，添加阴间效果
        if (!gameScreen.classList.contains('witchified-atmosphere')) {
            gameScreen.classList.add('witchified-atmosphere');
        }
    } else {
        // 没有魔女化玩家，移除阴间效果
        gameScreen.classList.remove('witchified-atmosphere');
    }
}

// 检查并移除魔女化阴间效果
function checkWitchifiedOverlay() {
    const witchifiedCount = gameState.players.filter(p => p.isWitchified && !p.isEliminated).length;
    
    if (witchifiedCount === 0) {
        // 没有魔女化玩家了，移除阴间效果
        const gameScreen = document.getElementById('game-screen');
        if (gameScreen) {
            gameScreen.classList.remove('witchified-atmosphere');
        }
        
        // 解除魔女化滤波效果
        if (typeof deactivateWitchFilter === 'function') {
            deactivateWitchFilter();
        }
    }
    
    // 根据场上状态切换音乐
    updateGameMusic();
}

// 统一的游戏音乐管理函数
function updateGameMusic() {
    // 同时更新阴间效果
    const hasWitchified = gameState.players.some(p => p.isWitchified && !p.isEliminated);
    const gameScreen = document.getElementById('game-screen');
    
    if (gameScreen) {
        if (hasWitchified) {
            if (!gameScreen.classList.contains('witchified-atmosphere')) {
                gameScreen.classList.add('witchified-atmosphere');
            }
        } else {
            gameScreen.classList.remove('witchified-atmosphere');
        }
    }
    
    // 音乐优先级：魔女化 > 普通（交锋音乐由交锋开始/结束单独控制）
    
    // 如果场上存在魔女化玩家，播放魔女化音乐
    if (hasWitchified) {
        if (typeof playWitchMusic === 'function') {
            playWitchMusic();
        }
        return;
    }
    
    // 否则播放普通游戏音乐
    if (typeof playCommonMusic === 'function') {
        playCommonMusic();
    }
}

// 显示处刑警告（回合开始时）
function showExecutionWarning(players) {
    if (players.length === 0) return;
    
    const warning = document.createElement('div');
    warning.className = 'execution-warning';
    warning.innerHTML = `
        <div class="execution-warning-content">
            <div class="execution-icon">⚰️</div>
            <div class="execution-title">处刑警告</div>
            <div class="execution-players">
                ${players.map(p => `<span class="execution-player">${getCharIcon(p.character, 'small')} ${p.name}</span>`).join('')}
            </div>
            <div class="execution-text">将在本回合结束时被处刑！</div>
        </div>
    `;
    document.body.appendChild(warning);
    
    // 触发动画
    requestAnimationFrame(() => {
        warning.classList.add('show');
    });
    
    // 2.5秒后移除
    setTimeout(() => {
        warning.classList.add('hide');
        setTimeout(() => warning.remove(), 500);
    }, 2500);
}

function startStealPhase() {
    const rankings = confrontationState.rankings;
    
    // 第N名抢第N+1名（N从0开始）
    // 最后一名没有人可抢
    if (confrontationState.currentStealPhase >= rankings.length - 1) {
        // 所有抢夺完成
        endConfrontation();
        return;
    }
    
    const winnerIdx = confrontationState.currentStealPhase;
    const loserIdx = confrontationState.currentStealPhase + 1;
    
    const winner = rankings[winnerIdx];
    const loser = rankings[loserIdx];
    
    // 获取败者可被抢夺的证据（排除本轮刚获得的）
    const stealableCards = loser.evidenceCards.filter((cardId, idx) => {
        const cardKey = `${loser.id}_${idx}_${cardId}`;
        return !confrontationState.stolenThisRound.has(cardKey);
    });
    
    if (stealableCards.length === 0) {
        // 败者没有可抢的证据，跳过
        confrontationState.currentStealPhase++;
        startStealPhase();
        return;
    }
    
    showStealSelection(winner, loser, stealableCards);
}

function showStealSelection(winner, loser, stealableCards) {
    const hint = document.getElementById('confrontation-hint');
    const modal = document.getElementById('confrontation-modal');
    
    // 移除之前的抢夺界面
    const oldSteal = document.querySelector('.steal-selection');
    if (oldSteal) oldSteal.remove();
    
    // 只抢1张
    const maxSteal = 1;
    
    // 重置选择
    selectedSteals = [];
    
    // 保存当前可抢的卡（用于后续处理）
    confrontationState.currentStealableCards = stealableCards;
    
    if (winner.isAI) {
        // AI自动选择抢夺1张
        hint.textContent = `${winner.name} 正在从 ${loser.name} 处抢夺证据...`;
        
        setTimeout(() => {
            // AI随机选择1张
            const randIdx = Math.floor(Math.random() * stealableCards.length);
            const stolenCard = stealableCards[randIdx];
            
            executeSteal(winner, loser, [stolenCard]);
        }, 1000);
    } else {
        // 人类玩家选择
        hint.innerHTML = `${winner.name} 从 ${loser.name} 处抢夺1张证据`;
        
        // 创建选择界面
        const stealContainer = document.createElement('div');
        stealContainer.className = 'steal-selection';
        stealContainer.innerHTML = `
            <div class="steal-target">
                <span>🎯 ${loser.name} 的证据:</span>
            </div>
            <div class="steal-cards">
                ${stealableCards.map((cardId, idx) => {
                    const card = EVIDENCE_CARDS[cardId];
                    return `
                        <button class="steal-card-btn" data-index="${idx}" data-card="${cardId}">
                            <img class="modal-clue-icon" src="${card.image}" alt="${card.name}">
                            <span class="card-name">${card.name}</span>
                            <span class="card-label">${getClueLabel(cardId)}</span>
                        </button>
                    `;
                }).join('')}
            </div>
            <button class="confirm-steal-btn" onclick="confirmSteal()">确认抢夺</button>
        `;
        
        // 插入到modal中
        const content = modal.querySelector('.confrontation-content');
        content.appendChild(stealContainer);
        
        // 绑定选择事件
        stealContainer.querySelectorAll('.steal-card-btn').forEach(btn => {
            btn.onclick = () => toggleStealSelection(btn, maxSteal);
        });
    }
}

let selectedSteals = [];

function toggleStealSelection(btn, maxSteal) {
    const cardId = btn.dataset.card;
    const idx = parseInt(btn.dataset.index);
    
    if (btn.classList.contains('selected')) {
        btn.classList.remove('selected');
        selectedSteals = selectedSteals.filter(s => s.index !== idx);
    } else {
        if (selectedSteals.length < maxSteal) {
            btn.classList.add('selected');
            selectedSteals.push({ index: idx, cardId: cardId });
        }
    }
    
    // 更新按钮文字
    const confirmBtn = document.querySelector('.confirm-steal-btn');
    if (confirmBtn) {
        confirmBtn.textContent = `确认抢夺 (${selectedSteals.length}/${maxSteal}张)`;
    }
}

function confirmSteal() {
    const rankings = confrontationState.rankings;
    const winnerIdx = confrontationState.currentStealPhase;
    const loserIdx = confrontationState.currentStealPhase + 1;
    
    const winner = rankings[winnerIdx];
    const loser = rankings[loserIdx];
    
    // 多人模式：非房主发送消息
    if (networkState.mode === 'online' && !networkState.isHost) {
        sendMessage('confirm_steal', {
            playerId: networkState.localPlayerId,
            selectedSteals: selectedSteals.map(s => s.index)
        });
        // 移除抢夺界面
        const stealSelection = document.querySelector('.steal-selection');
        if (stealSelection) stealSelection.remove();
        selectedSteals = [];
        return;
    }
    
    if (selectedSteals.length === 0) {
        // 跳过抢夺
        confrontationState.currentStealPhase++;
        startStealPhase();
        return;
    }
    
    // 使用可抢卡列表中的卡
    const stolenCards = selectedSteals.map(s => confrontationState.currentStealableCards[s.index]);
    executeSteal(winner, loser, stolenCards);
}

function executeSteal(winner, loser, stolenCards) {
    // 从败者手中移除
    stolenCards.forEach(cardId => {
        const idx = loser.evidenceCards.indexOf(cardId);
        if (idx !== -1) {
            loser.evidenceCards.splice(idx, 1);
        }
    });
    
    // 添加到胜者手中，并标记为本轮获得（不可被再次抢夺）
    stolenCards.forEach(cardId => {
        winner.evidenceCards.push(cardId);
        // 标记这张卡是本轮抢夺获得的
        const cardKey = `${winner.id}_${winner.evidenceCards.length - 1}_${cardId}`;
        confrontationState.stolenThisRound.add(cardKey);
    });
    
    // 显示结果
    const hint = document.getElementById('confrontation-hint');
    const cardNames = stolenCards.map(id => EVIDENCE_CARDS[id].name).join('、');
    hint.textContent = `${winner.name} 从 ${loser.name} 抢夺了 ${cardNames}！`;
    
    // 移除抢夺界面
    const stealSelection = document.querySelector('.steal-selection');
    if (stealSelection) stealSelection.remove();
    
    // 重置选择
    selectedSteals = [];
    
    // 检查胜者的胜利条件和溢出惩罚
    checkPlayerStatus(winner);
    
    // 更新玩家面板显示
    renderPlayerSlots();
    
    // 继续下一对抢夺
    setTimeout(() => {
        confrontationState.currentStealPhase++;
        startStealPhase();
    }, 1500);
}

function endConfrontation() {
    // 清理选择状态
    selectedSteals = [];
    
    // 移除抢夺选择界面
    const stealSelection = document.querySelector('.steal-selection');
    if (stealSelection) stealSelection.remove();
    
    // 恢复VS显示和按钮，清理点击事件
    const modal = document.getElementById('confrontation-modal');
    modal.onclick = null;
    modal.style.cursor = 'default';
    const vsText = modal.querySelector('.vs-text');
    if (vsText) vsText.style.display = '';
    const player2El = document.getElementById('conf-player2');
    if (player2El) player2El.style.display = '';
    const btn = document.getElementById('reaction-btn');
    if (btn) btn.style.display = '';
    
    // 隐藏交锋界面
    modal.classList.add('hidden');
    
    // 保存状态
    const callback = confrontationState.callback;
    const participants = confrontationState.participants;
    const rankings = confrontationState.rankings;
    const winner = rankings && rankings.length > 0 ? rankings[0] : null;
    
    confrontationState.active = false;
    
    // 播放收尾动画（如果有胜利者）
    if (winner && participants.length >= 2) {
        // 播放结算动画（胜利者和失败者立绘都在动画中处理）
        playConfrontationOutro(participants, winner, () => {
            // 根据场上状态切换音乐
            updateGameMusic();
            
            // 更新游戏界面
            renderGame();
            
            // 检查米莉亚的「互换」技能（交锋后触发）
            checkMiliaMagicAfterConfrontation(participants, () => {
                // 执行回调（继续移动）
                if (callback) {
                    callback();
                }
            });
        });
    } else {
        // 没有胜利者，隐藏胜利立绘后直接结束
        hideConfrontationWinnerPortrait(() => {
            updateGameMusic();
            renderGame();
            
            checkMiliaMagicAfterConfrontation(participants, () => {
                if (callback) {
                    callback();
                }
            });
        });
    }
}

// ========== 佐伯米莉亚：互换（被动技能） ==========
let miliaMagicState = {
    active: false,
    timer: null,
    countdown: 10,
    miliaPlayer: null,
    opponents: null,
    callback: null
};

function checkMiliaMagicAfterConfrontation(participants, callback) {
    // 检查被动技能锁
    if (gameState.passiveMagicLock) {
        callback();
        return;
    }
    
    // 找到米莉亚玩家（参与交锋、未淘汰、角色是milia、未魔女化）
    const miliaPlayer = participants.find(p => 
        p.character.id === 'milia' && 
        !p.isEliminated &&
        !p.isWitchified  // 魔女化后被动技能失效（改用强化）
    );
    
    // 如果没有米莉亚或米莉亚魔女化了，跳过
    if (!miliaPlayer) {
        callback();
        return;
    }
    
    // 获取其他参与者（可互换的目标）
    const opponents = participants.filter(p => p.id !== miliaPlayer.id && !p.isEliminated);
    
    if (opponents.length === 0) {
        callback();
        return;
    }
    
    // AI米莉亚：随机决定是否发动（40%概率）
    if (networkState.mode === 'local' && miliaPlayer.isAI) {
        if (Math.random() < 0.4) {
            const target = opponents[Math.floor(Math.random() * opponents.length)];
            // 检查玛格被动技能
            checkMargPassive(miliaPlayer, '互换',
                () => {
                    // 被无效化，继续正常流程
                    callback();
                },
                () => {
                    // 允许发动
                    executeMiliaMagic(miliaPlayer, target, callback);
                }
            );
        } else {
            callback();
        }
        return;
    }
    
    // 多人模式：房主发送请求给米莉亚玩家
    if (networkState.mode === 'online' && networkState.isHost) {
        // 检查米莉亚是否是本地玩家
        if (miliaPlayer.id === networkState.localPlayerId) {
            // 本地米莉亚，显示UI
            miliaMagicState = {
                active: true,
                timer: null,
                countdown: 10,
                miliaPlayer: miliaPlayer,
                opponents: opponents,
                callback: callback
            };
            showMiliaMagicPrompt(miliaPlayer, opponents);
        } else {
            // 远程米莉亚，发送请求
            const opponentData = opponents.map(p => ({
                id: p.id,
                name: p.name,
                characterName: p.character.name,
                evidenceCount: p.evidenceCards.length
            }));
            sendPassiveRequest('milia_swap', miliaPlayer.id, {
                opponents: opponentData
            }, (activate, data) => {
                if (activate && data && data.targetId !== undefined) {
                    const targetPlayer = gameState.players.find(p => p.id === data.targetId);
                    if (targetPlayer) {
                        checkMargPassive(miliaPlayer, '互换',
                            () => callback(),
                            () => executeMiliaMagic(miliaPlayer, targetPlayer, callback)
                        );
                    } else {
                        callback();
                    }
                } else {
                    callback();
                }
            });
        }
        return;
    }
    
    // 单人模式人类米莉亚：显示选择界面，10秒倒计时
    miliaMagicState = {
        active: true,
        timer: null,
        countdown: 10,
        miliaPlayer: miliaPlayer,
        opponents: opponents,
        callback: callback
    };
    
    showMiliaMagicPrompt(miliaPlayer, opponents);
}

function showMiliaMagicPrompt(miliaPlayer, opponents) {
    const modal = document.createElement('div');
    modal.id = 'milia-magic-modal';
    modal.className = 'milia-modal';
    modal.innerHTML = `
        <div class="milia-content" onclick="event.stopPropagation()">
            <div class="milia-header">
                <span class="milia-icon">${getCharIcon(miliaPlayer.character, 'small')}</span>
                <span class="milia-title">互换</span>
                <span class="milia-countdown" id="milia-countdown">10</span>
            </div>
            <div class="milia-info">
                <p>交锋结束！是否发动「互换」？</p>
                <p>互换两人的前进方向、游戏顺位和所有线索</p>
                <p class="milia-cost">魔女化惩罚: +30</p>
            </div>
            <div class="milia-target-list">
                ${opponents.map(p => `
                    <button class="milia-target-btn" onclick="confirmMiliaSwap(${p.id})">
                        <span class="target-avatar">${getCharIcon(p.character, 'small')}</span>
                        <span class="target-name">${p.name}</span>
                        <span class="target-info">证据: ${p.evidenceCards.length}张</span>
                    </button>
                `).join('')}
            </div>
            <button class="milia-skip-btn" onclick="skipMiliaMagic()">不发动</button>
        </div>
    `;
    
    modal.onclick = (e) => {
        if (e.target === modal) {
            e.stopPropagation();
        }
    };
    
    document.body.appendChild(modal);
    
    requestAnimationFrame(() => {
        modal.classList.add('show');
    });
    
    // 开始倒计时
    startMiliaCountdown();
}

function startMiliaCountdown() {
    miliaMagicState.countdown = 10;
    updateMiliaCountdown();
    
    miliaMagicState.timer = setInterval(() => {
        miliaMagicState.countdown--;
        updateMiliaCountdown();
        
        if (miliaMagicState.countdown <= 0) {
            skipMiliaMagic();
        }
    }, 1000);
}

function updateMiliaCountdown() {
    const el = document.getElementById('milia-countdown');
    if (el) {
        el.innerHTML = renderClockNumber(miliaMagicState.countdown, 0.35);
        el.style.filter = miliaMagicState.countdown <= 3 ? 'hue-rotate(-60deg) brightness(1.2)' : 'none';
    }
}

function confirmMiliaSwap(targetId) {
    if (!miliaMagicState.active) return;
    
    if (miliaMagicState.timer) {
        clearInterval(miliaMagicState.timer);
        miliaMagicState.timer = null;
    }
    
    const modal = document.getElementById('milia-magic-modal');
    if (modal) {
        modal.classList.add('hide');
        setTimeout(() => modal.remove(), 300);
    }
    
    const { miliaPlayer, callback } = miliaMagicState;
    const targetPlayer = gameState.players.find(p => p.id === targetId);
    
    miliaMagicState.active = false;
    
    if (!targetPlayer) {
        callback();
        return;
    }
    
    // 检查玛格被动技能
    checkMargPassive(miliaPlayer, '互换',
        () => {
            // 被无效化，继续正常流程
            showMagicAlert('魔法失效', '互换被玛格的模仿无效化了！');
            callback();
        },
        () => {
            // 允许发动
            executeMiliaMagic(miliaPlayer, targetPlayer, callback);
        }
    );
}

function executeMiliaMagic(miliaPlayer, targetPlayer, callback) {
    // 增加魔女化
    miliaPlayer.witchification += 30;
    showWitchPopup(miliaPlayer, 30, '发动互换');
    checkWitchification(miliaPlayer);
    
    // 互换位置
    const tempPosition = miliaPlayer.position;
    const tempDirection = miliaPlayer.direction;
    const tempCameFrom = miliaPlayer.cameFrom;
    
    miliaPlayer.position = targetPlayer.position;
    miliaPlayer.direction = targetPlayer.direction;
    miliaPlayer.cameFrom = targetPlayer.cameFrom;
    
    targetPlayer.position = tempPosition;
    targetPlayer.direction = tempDirection;
    targetPlayer.cameFrom = tempCameFrom;
    
    // 互换游戏顺位（在players数组中的位置）
    const miliaIndex = gameState.players.indexOf(miliaPlayer);
    const targetIndex = gameState.players.indexOf(targetPlayer);
    gameState.players[miliaIndex] = targetPlayer;
    gameState.players[targetIndex] = miliaPlayer;
    
    // 互换所有线索
    const tempCards = [...miliaPlayer.evidenceCards];
    miliaPlayer.evidenceCards = [...targetPlayer.evidenceCards];
    targetPlayer.evidenceCards = tempCards;
    
    // 互换可可强化加成（如果有）
    const tempCocoBonus = miliaPlayer.cocoEnhancedBonus;
    miliaPlayer.cocoEnhancedBonus = targetPlayer.cocoEnhancedBonus;
    targetPlayer.cocoEnhancedBonus = tempCocoBonus;
    
    showMagicCastEffect(miliaPlayer, '互换', `与 ${targetPlayer.name} 互换了位置、顺位和所有线索！`);
    
    renderGame();
    
    setTimeout(() => {
        callback();
    }, 1500);
}

function skipMiliaMagic() {
    if (!miliaMagicState.active) return;
    
    if (miliaMagicState.timer) {
        clearInterval(miliaMagicState.timer);
        miliaMagicState.timer = null;
    }
    
    const modal = document.getElementById('milia-magic-modal');
    if (modal) {
        modal.classList.add('hide');
        setTimeout(() => modal.remove(), 300);
    }
    
    const { callback } = miliaMagicState;
    miliaMagicState.active = false;
    
    callback();
}

// 米莉亚强化魔法：立即互换所有人的位置，自身每种线索等于场上最多的
function castEnhancedMagic_Milia(player) {
    if (player.enhancedMagicUsed) {
        showMagicAlert('无法发动', '强化魔法已使用过！');
        return;
    }
    
    // 检查玛格被动技能
    checkMargPassive(player, '互换·强化',
        () => { showMagicAlert('魔法失效', '互换·强化被玛格的模仿无效化了！'); },
        () => { executeMiliaEnhanced(player); }
    );
}

// 实际执行米莉亚强化魔法
function executeMiliaEnhanced(player) {
    player.enhancedMagicUsed = true;
    
    // 获取所有未淘汰的玩家
    const activePlayers = gameState.players.filter(p => !p.isEliminated);
    
    // 随机打乱所有人的位置
    const positions = activePlayers.map(p => ({ position: p.position, direction: p.direction, cameFrom: p.cameFrom }));
    shuffleArray(positions);
    
    activePlayers.forEach((p, idx) => {
        p.position = positions[idx].position;
        p.direction = positions[idx].direction;
        p.cameFrom = positions[idx].cameFrom;
    });
    
    // 计算场上每种线索的最大值
    let maxEvidence = 0, maxTestimony = 0, maxHeart = 0;
    activePlayers.forEach(p => {
        const resources = getPlayerResources(p);
        maxEvidence = Math.max(maxEvidence, resources.evidence);
        maxTestimony = Math.max(maxTestimony, resources.testimony);
        maxHeart = Math.max(maxHeart, resources.heart);
    });
    
    // 清空米莉亚的证据卡，然后添加足够的卡达到最大值
    player.evidenceCards = [];
    player.cocoEnhancedBonus = null;
    
    // 添加证物
    while (getPlayerResources(player).evidence < maxEvidence) {
        player.evidenceCards.push('evidence_x2');
    }
    // 添加证词
    while (getPlayerResources(player).testimony < maxTestimony) {
        player.evidenceCards.push('testimony_x2');
    }
    // 添加人心
    while (getPlayerResources(player).heart < maxHeart) {
        player.evidenceCards.push('heart_x2');
    }
    
    showMagicCastEffect(player, '互换·强化', `所有人位置打乱！获得场上最多的线索（证物${maxEvidence}、证词${maxTestimony}、人心${maxHeart}）！`);
    
    renderGame();
}

// 辅助函数：打乱数组
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// ========== 黑部奈叶香：幻视（固有技能） ==========

// 渲染奈叶香的里世界查看按钮
function renderNayekaShadowButton() {
    // 移除旧按钮
    const oldBtn = document.getElementById('nayeka-shadow-btn');
    if (oldBtn) oldBtn.remove();
    
    // 检查人类玩家是否是奈叶香
    const humanPlayer = gameState.players.find(p => !p.isAI);
    if (!humanPlayer || humanPlayer.character.id !== 'nayeka') return;
    
    // 创建里世界查看按钮
    const btn = document.createElement('div');
    btn.id = 'nayeka-shadow-btn';
    btn.className = 'nayeka-shadow-btn' + (gameState.showingShadowWorld ? ' active' : '');
    btn.innerHTML = `
        <span class="shadow-btn-icon">👁️</span>
        <span class="shadow-btn-text">${gameState.showingShadowWorld ? '现实世界' : '里世界'}</span>
    `;
    
    // 点击切换里世界/现实世界
    btn.addEventListener('click', function() {
        toggleShadowWorld();
    });
    
    document.getElementById('board-container').appendChild(btn);
}

// 切换里世界/现实世界视图
function toggleShadowWorld() {
    if (gameState.showingShadowWorld) {
        hideShadowWorld();
    } else {
        showShadowWorld();
    }
}

// 显示里世界视图
function showShadowWorld() {
    gameState.showingShadowWorld = true;
    renderBoardShadowView();
    renderNayekaShadowButton();
}

// 隐藏里世界视图
function hideShadowWorld() {
    gameState.showingShadowWorld = false;
    renderBoard();
    // 重新添加奈叶香按钮
    renderNayekaShadowButton();
}

// 渲染里世界视图的棋盘
function renderBoardShadowView() {
    const container = document.getElementById('board-container');
    const cells = gameState.board.cells;
    
    // 检查奈叶香是否魔女化（强化效果）
    const nayekaPlayer = gameState.players.find(p => p.character.id === 'nayeka' && !p.isAI);
    const isEnhanced = nayekaPlayer && nayekaPlayer.isWitchified;
    
    let html = '<div class="board-grid shadow-world-view">';
    
    BOARD_GRID.forEach((row, rowIdx) => {
        row.forEach((cellId, colIdx) => {
            if (cellId === null) {
                // 检查是否有装饰
                const decorKey = `${rowIdx}-${colIdx}`;
                const decorType = DECORATION_CELLS[decorKey];
                if (decorType && DECORATION_TYPES[decorType]) {
                    const decor = DECORATION_TYPES[decorType];
                    html += `<div class="grid-cell decoration decoration-${decorType}" style="background: ${decor.color};">
                        <span class="decoration-emoji">${decor.emoji}</span>
                    </div>`;
                } else {
                    html += '<div class="grid-cell empty"></div>';
                }
            } else {
                const cell = cells.find(c => c.id === cellId);
                const shadowEffect = SHADOW_EFFECTS[cell.shadowEffect];
                const triggeredClass = cell && cell.isTriggered ? 'cell-triggered' : '';
                
                // 检查哪些玩家在这个格子上
                const playersHere = gameState.players.filter(p => p.position === cellId && !p.isEliminated);
                
                // 里世界显示
                const isNothing = cell.shadowEffect === 'nothing';
                const shadowClass = isNothing ? 'shadow-nothing' : 'shadow-active';
                
                html += `
                    <div class="grid-cell cell-shadow ${shadowClass} ${triggeredClass}" 
                         data-cell="${cellId}">
                        <span class="cell-id">${renderClockNumber(cellId, 0.18)}</span>
                        <span class="shadow-emoji">${shadowEffect.emoji}</span>
                        <span class="shadow-name">${shadowEffect.name}</span>
                        <div class="cell-players">
                            ${playersHere.map((p) => {
                                const pinImg = CHARACTER_IMAGES[p.character.id]?.pin || p.character.icon;
                                return `<span class="player-token"><img src="${pinImg}" alt="${p.name}"></span>`;
                            }).join('')}
                        </div>
                    </div>
                `;
            }
        });
    });
    
    html += '</div>';
    
    html += '<div id="cell-info-panel" class="cell-info-panel hidden"></div>';
    container.innerHTML = html;
    
    // 在里世界视图中也添加按钮
    const btn = document.createElement('div');
    btn.id = 'nayeka-shadow-btn';
    btn.className = 'nayeka-shadow-btn active';
    btn.innerHTML = `
        <span class="shadow-btn-icon">👁️</span>
        <span class="shadow-btn-text">里世界</span>
    `;
    
    // 使用mouseenter/mouseleave绑定
    btn.addEventListener('mouseenter', function() {
        showShadowWorld();
    });
    btn.addEventListener('mouseleave', function() {
        hideShadowWorld();
    });
    
    container.appendChild(btn);
}

// 奈叶香主动发动幻视魔法
function castMagic_Nayeka(player) {
    // 检查使用次数
    if ((player.nayekaMagicUsed || 0) >= 6) {
        showMagicAlert('已用完', '幻视整局游戏只能使用6次！');
        return;
    }
    
    // 检查玛格被动技能
    checkMargPassive(player, '幻视',
        () => { showMagicAlert('魔法失效', '幻视被玛格的模仿无效化了！'); },
        () => { executeNayekaNormal(player); }
    );
}

// 实际执行奈叶香普通魔法
function executeNayekaNormal(player) {
    // 增加使用次数
    player.nayekaMagicUsed = (player.nayekaMagicUsed || 0) + 1;
    
    // 增加魔女化
    player.witchification += 15;
    showWitchPopup(player, 15, '发动幻视');
    checkWitchification(player);
    
    // 激活幻视效果（本回合棋盘变成里世界）
    gameState.nayekaVisionActive = true;
    gameState.nayekaVisionPlayerId = player.id;
    
    showMagicCastEffect(player, '幻视', '棋盘翻转为里世界！本回合触发里世界效果！');
    
    // 渲染里世界棋盘
    renderBoard();
    renderNayekaShadowButton();
    renderMagicPanel();
}

function showNayekaCellSelection(player) {
    const modal = document.createElement('div');
    modal.id = 'nayeka-cell-modal';
    modal.className = 'nayeka-modal';
    
    const remaining = 6 - (player.nayekaMagicUsed || 0);
    
    modal.innerHTML = `
        <div class="nayeka-content" onclick="event.stopPropagation()">
            <div class="nayeka-header">
                <span class="nayeka-icon">${getCharIcon(player.character, 'small')}</span>
                <span class="nayeka-title">幻视</span>
            </div>
            <div class="nayeka-info">
                <p>选择一个格子，将其变成里世界效果</p>
                <p class="nayeka-remaining">剩余次数: ${remaining}/6</p>
                <p class="nayeka-cost">魔女化惩罚: +15</p>
            </div>
            <div class="nayeka-cell-grid">
                ${gameState.board.cells.map(cell => {
                    const shadowEffect = SHADOW_EFFECTS[cell.shadowEffect];
                    const isTriggered = cell.isTriggered;
                    return `
                        <button class="nayeka-cell-btn ${isTriggered ? 'triggered' : ''}" 
                                data-cell="${cell.id}"
                                onclick="confirmNayekaCell(${cell.id})"
                                ${isTriggered ? 'disabled' : ''}>
                            <span class="cell-num">${cell.id}</span>
                            <span class="shadow-effect">${shadowEffect.emoji} ${shadowEffect.name}</span>
                        </button>
                    `;
                }).join('')}
            </div>
            <button class="nayeka-cancel-btn" onclick="cancelNayekaMagic()">取消</button>
        </div>
    `;
    
    modal.onclick = (e) => {
        if (e.target === modal) {
            e.stopPropagation();
        }
    };
    
    document.body.appendChild(modal);
    
    gameState.nayekaState = { player };
    
    requestAnimationFrame(() => {
        modal.classList.add('show');
    });
}

function confirmNayekaCell(cellId) {
    const modal = document.getElementById('nayeka-cell-modal');
    if (modal) {
        modal.classList.add('hide');
        setTimeout(() => modal.remove(), 300);
    }
    
    const { player } = gameState.nayekaState;
    const cell = gameState.board.cells.find(c => c.id === cellId);
    
    if (!cell || cell.isTriggered) return;
    
    // 增加使用次数
    player.nayekaMagicUsed = (player.nayekaMagicUsed || 0) + 1;
    
    // 增加魔女化
    player.witchification += 15;
    showWitchPopup(player, 15, '发动幻视');
    checkWitchification(player);
    
    // 执行里世界效果
    executeShadowEffect(player, cell);
}

function cancelNayekaMagic() {
    const modal = document.getElementById('nayeka-cell-modal');
    if (modal) {
        modal.classList.add('hide');
        setTimeout(() => modal.remove(), 300);
    }
}

// 执行里世界效果
function executeShadowEffect(player, cell) {
    const effect = cell.shadowEffect;
    
    // 标记格子已触发
    cell.isTriggered = true;
    cell.triggeredBy = player.id;
    cell.triggeredByName = '👁️幻视';
    
    switch (effect) {
        case 'swap':
            // 互换指定两个角色的位置
            showShadowSwapSelection(player, null);
            break;
        case 'basement':
            // 自身触发一次地下室效果
            showMagicCastEffect(player, '幻视·地下室', '触发地下室效果！');
            setTimeout(() => {
                triggerBasementForPlayer(player, () => {
                    renderGame();
                });
            }, 1000);
            break;
        case 'forceDelete':
            // 强制要求一个玩家删除一个证据卡
            showShadowForceDeleteSelection(player, null);
            break;
        case 'nothing':
            // 一无所有
            showMagicCastEffect(player, '幻视·一无所有', '什么都没有发生...');
            renderGame();
            break;
    }
}

// 里世界效果：互换两个角色位置
function showShadowSwapSelection(player, callback) {
    const activePlayers = gameState.players.filter(p => !p.isEliminated);
    
    if (activePlayers.length < 2) {
        showMagicAlert('无法互换', '没有足够的玩家！');
        renderGame();
        if (callback) callback();
        return;
    }
    
    const modal = document.createElement('div');
    modal.id = 'shadow-swap-modal';
    modal.className = 'shadow-swap-modal';
    modal.innerHTML = `
        <div class="shadow-swap-content" onclick="event.stopPropagation()">
            <div class="shadow-swap-header">
                <span class="shadow-icon">🔄</span>
                <span class="shadow-title">位置互换</span>
            </div>
            <div class="shadow-swap-info">
                <p>选择两个角色互换位置</p>
            </div>
            <div class="shadow-swap-players">
                ${activePlayers.map(p => `
                    <button class="shadow-player-btn" data-id="${p.id}" onclick="toggleShadowSwapPlayer(${p.id})">
                        <span class="player-avatar">${getCharIcon(p.character, 'small')}</span>
                        <span class="player-name">${p.name}</span>
                        <span class="player-pos">格子${p.position}</span>
                    </button>
                `).join('')}
            </div>
            <button class="shadow-confirm-btn" onclick="confirmShadowSwap()" disabled>确认互换</button>
        </div>
    `;
    
    modal.onclick = (e) => {
        if (e.target === modal) {
            e.stopPropagation();
        }
    };
    
    document.body.appendChild(modal);
    
    gameState.shadowSwapState = { selectedPlayers: [], callback: callback };
    
    requestAnimationFrame(() => {
        modal.classList.add('show');
    });
}

function toggleShadowSwapPlayer(playerId) {
    const state = gameState.shadowSwapState;
    const idx = state.selectedPlayers.indexOf(playerId);
    
    if (idx !== -1) {
        state.selectedPlayers.splice(idx, 1);
    } else if (state.selectedPlayers.length < 2) {
        state.selectedPlayers.push(playerId);
    }
    
    // 更新按钮状态
    document.querySelectorAll('.shadow-player-btn').forEach(btn => {
        const id = parseInt(btn.dataset.id);
        btn.classList.toggle('selected', state.selectedPlayers.includes(id));
    });
    
    // 更新确认按钮
    const confirmBtn = document.querySelector('.shadow-confirm-btn');
    if (confirmBtn) {
        confirmBtn.disabled = state.selectedPlayers.length !== 2;
    }
}

function confirmShadowSwap() {
    const state = gameState.shadowSwapState;
    if (state.selectedPlayers.length !== 2) return;
    
    // 多人模式：非房主发送消息
    if (networkState.mode === 'online' && !networkState.isHost) {
        sendMessage('shadow_swap', {
            playerId: networkState.localPlayerId,
            targetPlayers: state.selectedPlayers
        });
        const modal = document.getElementById('shadow-swap-modal');
        if (modal) {
            modal.classList.add('hide');
            setTimeout(() => modal.remove(), 300);
        }
        return;
    }
    
    const modal = document.getElementById('shadow-swap-modal');
    if (modal) {
        modal.classList.add('hide');
        setTimeout(() => modal.remove(), 300);
    }
    
    const player1 = gameState.players.find(p => p.id === state.selectedPlayers[0]);
    const player2 = gameState.players.find(p => p.id === state.selectedPlayers[1]);
    
    if (!player1 || !player2) {
        if (state.callback) state.callback();
        return;
    }
    
    // 互换位置
    const tempPos = player1.position;
    const tempDir = player1.direction;
    const tempCame = player1.cameFrom;
    
    player1.position = player2.position;
    player1.direction = player2.direction;
    player1.cameFrom = player2.cameFrom;
    
    player2.position = tempPos;
    player2.direction = tempDir;
    player2.cameFrom = tempCame;
    
    showMagicCastEffect(gameState.players.find(p => p.character.id === 'nayeka'), 
        '幻视·位置互换', `${player1.name} 和 ${player2.name} 互换了位置！`);
    
    // 多人模式：广播状态
    if (networkState.mode === 'online' && networkState.isHost) {
        broadcastGameState();
    }
    
    renderGame();
    
    // 执行回调
    if (state.callback) state.callback();
}

// 里世界效果：强制删除
function showShadowForceDeleteSelection(nayekaPlayer, callback) {
    const opponents = gameState.players.filter(p => 
        !p.isEliminated && 
        p.evidenceCards.length > 0
    );
    
    if (opponents.length === 0) {
        showMagicCastEffect(nayekaPlayer, '幻视·强制删除', '没有玩家有证据可删除！');
        renderGame();
        if (callback) callback();
        return;
    }
    
    // 保存回调到状态
    gameState.shadowDeleteState = { callback: callback };
    
    const modal = document.createElement('div');
    modal.id = 'shadow-delete-modal';
    modal.className = 'shadow-delete-modal';
    modal.innerHTML = `
        <div class="shadow-delete-content" onclick="event.stopPropagation()">
            <div class="shadow-delete-header">
                <span class="shadow-icon">🗑️</span>
                <span class="shadow-title">强制删除</span>
            </div>
            <div class="shadow-delete-info">
                <p>选择一个玩家，强制其删除一个证据卡</p>
            </div>
            <div class="shadow-delete-players">
                ${opponents.map(p => `
                    <button class="shadow-target-btn" onclick="selectShadowDeleteTarget(${p.id})">
                        <span class="target-avatar">${getCharIcon(p.character, 'small')}</span>
                        <span class="target-name">${p.name}</span>
                        <span class="target-cards">证据: ${p.evidenceCards.length}张</span>
                    </button>
                `).join('')}
            </div>
        </div>
    `;
    
    modal.onclick = (e) => {
        if (e.target === modal) {
            e.stopPropagation();
        }
    };
    
    document.body.appendChild(modal);
    
    requestAnimationFrame(() => {
        modal.classList.add('show');
    });
}

function selectShadowDeleteTarget(targetId) {
    const modal = document.getElementById('shadow-delete-modal');
    if (modal) {
        modal.classList.add('hide');
        setTimeout(() => modal.remove(), 300);
    }
    
    const targetPlayer = gameState.players.find(p => p.id === targetId);
    if (!targetPlayer || targetPlayer.evidenceCards.length === 0) return;
    
    // 显示证据选择界面
    showShadowDeleteCardSelection(targetPlayer);
}

function showShadowDeleteCardSelection(targetPlayer) {
    const modal = document.createElement('div');
    modal.id = 'shadow-delete-card-modal';
    modal.className = 'shadow-delete-modal';
    modal.innerHTML = `
        <div class="shadow-delete-content" onclick="event.stopPropagation()">
            <div class="shadow-delete-header">
                <span class="shadow-icon">🗑️</span>
                <span class="shadow-title">强制删除</span>
            </div>
            <div class="shadow-delete-info">
                <p>选择 ${targetPlayer.name} 要删除的证据卡</p>
            </div>
            <div class="shadow-delete-cards">
                ${targetPlayer.evidenceCards.map((cardId, idx) => {
                    const card = EVIDENCE_CARDS[cardId];
                    return `
                        <button class="shadow-card-btn" onclick="confirmShadowDelete(${targetPlayer.id}, ${idx})">
                            <img class="modal-clue-icon" src="${card.image}" alt="${card.name}">
                            <span class="card-name">${card.name}</span>
                            <span class="card-label">${getClueLabel(cardId)}</span>
                        </button>
                    `;
                }).join('')}
            </div>
        </div>
    `;
    
    modal.onclick = (e) => {
        if (e.target === modal) {
            e.stopPropagation();
        }
    };
    
    document.body.appendChild(modal);
    
    requestAnimationFrame(() => {
        modal.classList.add('show');
    });
}

function confirmShadowDelete(targetId, cardIndex) {
    // 多人模式：非房主发送消息
    if (networkState.mode === 'online' && !networkState.isHost) {
        sendMessage('shadow_delete', {
            playerId: networkState.localPlayerId,
            targetId: targetId,
            cardIndex: cardIndex
        });
        const modal = document.getElementById('shadow-delete-card-modal');
        if (modal) {
            modal.classList.add('hide');
            setTimeout(() => modal.remove(), 300);
        }
        return;
    }
    
    const modal = document.getElementById('shadow-delete-card-modal');
    if (modal) {
        modal.classList.add('hide');
        setTimeout(() => modal.remove(), 300);
    }
    
    const targetPlayer = gameState.players.find(p => p.id === targetId);
    if (!targetPlayer) {
        if (gameState.shadowDeleteState && gameState.shadowDeleteState.callback) {
            gameState.shadowDeleteState.callback();
        }
        return;
    }
    
    const deletedCard = targetPlayer.evidenceCards[cardIndex];
    const cardName = EVIDENCE_CARDS[deletedCard].name;
    targetPlayer.evidenceCards.splice(cardIndex, 1);
    
    const nayekaPlayer = gameState.players.find(p => p.character.id === 'nayeka');
    showMagicCastEffect(nayekaPlayer, '幻视·强制删除', `${targetPlayer.name} 被迫删除了 ${cardName}！`);
    
    // 多人模式：广播状态
    if (networkState.mode === 'online' && networkState.isHost) {
        broadcastGameState();
    }
    
    renderGame();
    
    // 执行回调
    if (gameState.shadowDeleteState && gameState.shadowDeleteState.callback) {
        gameState.shadowDeleteState.callback();
    }
}

// 为玩家触发地下室效果
function triggerBasementForPlayer(player, callback) {
    if (player.isAI) {
        // AI随机选择一张证据
        if (Math.random() > 0.3) {
            const allCardIds = Object.keys(EVIDENCE_CARDS);
            const randomCard = allCardIds[Math.floor(Math.random() * allCardIds.length)];
            giveEvidenceCard(player, randomCard);
        }
        renderGame();
        if (callback) callback();
    } else {
        // 人类玩家：显示地下室选择界面
        showBasementModalForPlayer(player, callback);
    }
}

function showBasementModalForPlayer(player, callback) {
    // 从6种证据卡中随机抽3张
    const allCardIds = Object.keys(EVIDENCE_CARDS);
    const randomCards = [];
    for (let i = 0; i < 3; i++) {
        randomCards.push(allCardIds[Math.floor(Math.random() * allCardIds.length)]);
    }
    
    const modal = document.createElement('div');
    modal.id = 'nayeka-basement-modal';
    modal.className = 'nayeka-basement-modal';
    modal.innerHTML = `
        <div class="nayeka-basement-content" onclick="event.stopPropagation()">
            <div class="nayeka-basement-header">
                <span>🔦 幻视 - 地下室效果</span>
            </div>
            <div class="nayeka-basement-hint">选择至多1个证据卡，或点击确认跳过</div>
            <div class="nayeka-basement-cards">
                ${randomCards.map((cardId, idx) => {
                    const card = EVIDENCE_CARDS[cardId];
                    return `
                        <button class="nayeka-card-btn" data-card="${cardId}" data-idx="${idx}">
                            <img class="modal-clue-icon" src="${card.image}" alt="${card.name}">
                            <span class="card-name">${card.name}</span>
                            <span class="card-label">${getClueLabel(cardId)}</span>
                        </button>
                    `;
                }).join('')}
            </div>
            <button class="nayeka-confirm-btn" onclick="confirmNayekaBasement()">确认</button>
        </div>
    `;
    
    modal.onclick = (e) => {
        if (e.target === modal) {
            e.stopPropagation();
        }
    };
    
    document.body.appendChild(modal);
    
    // 保存状态
    gameState.nayekaBasementState = {
        cards: randomCards,
        selectedCard: null,
        player: player,
        callback: callback
    };
    
    // 绑定选择事件
    modal.querySelectorAll('.nayeka-card-btn').forEach(btn => {
        btn.onclick = () => {
            const cardId = btn.dataset.card;
            if (btn.classList.contains('selected')) {
                btn.classList.remove('selected');
                gameState.nayekaBasementState.selectedCard = null;
            } else {
                modal.querySelectorAll('.nayeka-card-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                gameState.nayekaBasementState.selectedCard = cardId;
            }
        };
    });
    
    requestAnimationFrame(() => {
        modal.classList.add('show');
    });
}

function confirmNayekaBasement() {
    const modal = document.getElementById('nayeka-basement-modal');
    const { selectedCard, player, callback } = gameState.nayekaBasementState;
    
    if (selectedCard) {
        giveEvidenceCard(player, selectedCard);
    }
    
    if (modal) {
        modal.classList.add('hide');
        setTimeout(() => modal.remove(), 300);
    }
    
    renderGame();
    if (callback) callback();
}

// 奈叶香强化魔法：持续为里世界效果
function castEnhancedMagic_Nayeka(player) {
    if (player.enhancedMagicUsed) {
        showMagicAlert('已激活', '强化幻视已经生效中！');
        return;
    }
    
    // 检查玛格被动技能
    checkMargPassive(player, '幻视·强化',
        () => { showMagicAlert('魔法失效', '幻视·强化被玛格的模仿无效化了！'); },
        () => { executeNayekaEnhanced(player); }
    );
}

// 实际执行奈叶香强化魔法
function executeNayekaEnhanced(player) {
    player.enhancedMagicUsed = true;
    gameState.nayekaEnhancedActive = true;
    gameState.nayekaEnhancedPlayerId = player.id;
    
    // 重新生成所有格子的里世界效果（排除"一无所有"）
    gameState.board.cells.forEach(cell => {
        cell.shadowEffect = rollShadowEffect(true); // excludeNothing = true
    });
    
    showMagicCastEffect(player, '幻视·强化', '所有格子持续为里世界效果！一无所有不再产生！');
    
    renderGame();
}

// 检查奈叶香强化效果（在格子触发时调用）
function checkNayekaEnhancedEffect(player, cell, normalCallback) {
    // 如果奈叶香强化效果激活，触发里世界效果而非正常效果
    if (gameState.nayekaEnhancedActive) {
        const nayekaPlayer = gameState.players.find(p => p.id === gameState.nayekaEnhancedPlayerId);
        if (nayekaPlayer && !nayekaPlayer.isEliminated) {
            // 触发里世界效果
            executeShadowEffectForPlayer(player, cell, normalCallback);
            return true;
        }
    }
    return false;
}

// 为任意玩家执行里世界效果（强化幻视用）
function executeShadowEffectForPlayer(player, cell, callback) {
    const effect = cell.shadowEffect;
    
    switch (effect) {
        case 'swap':
            // AI自动随机选择两个玩家互换
            const activePlayers = gameState.players.filter(p => !p.isEliminated);
            if (activePlayers.length >= 2) {
                const shuffled = shuffleArray([...activePlayers]);
                const p1 = shuffled[0];
                const p2 = shuffled[1];
                
                const tempPos = p1.position;
                p1.position = p2.position;
                p2.position = tempPos;
                
                showMagicAlert('里世界·位置互换', `${p1.name} 和 ${p2.name} 互换了位置！`);
            }
            if (callback) callback();
            break;
        case 'basement':
            // 触发地下室效果
            triggerBasementForPlayer(player, callback);
            break;
        case 'forceDelete':
            // 随机选择一个有证据的玩家删除
            const targets = gameState.players.filter(p => !p.isEliminated && p.evidenceCards.length > 0);
            if (targets.length > 0) {
                const target = targets[Math.floor(Math.random() * targets.length)];
                const cardIdx = Math.floor(Math.random() * target.evidenceCards.length);
                const cardName = EVIDENCE_CARDS[target.evidenceCards[cardIdx]].name;
                target.evidenceCards.splice(cardIdx, 1);
                showMagicAlert('里世界·强制删除', `${target.name} 被迫删除了 ${cardName}！`);
            }
            if (callback) callback();
            break;
        case 'nothing':
            showMagicAlert('里世界', '一无所有...');
            if (callback) callback();
            break;
        default:
            if (callback) callback();
    }
}

// ========== 宝生玛格：模仿（被动技能） ==========

// 玛格强化魔法：静谧所有人的魔法
function castEnhancedMagic_Marg(player) {
    if (player.enhancedMagicUsed) {
        showMagicAlert('已激活', '静谧效果已经生效中！');
        return;
    }
    
    player.enhancedMagicUsed = true;
    gameState.margSilenceActive = true;
    gameState.margSilencePlayerId = player.id;
    
    showMagicCastEffect(player, '模仿·强化', '静谧所有人的魔法！（艾玛除外）持续到玛格失败或胜利为止！');
    
    renderGame();
}

// 检查玛格被动技能：其他玩家使用魔法后可以使其失效
function checkMargPassive(casterPlayer, magicName, onNullify, onAllow) {
    // 检查是否有玛格玩家
    const margPlayer = gameState.players.find(p => 
        p.character.id === 'marg' && 
        !p.isEliminated && 
        p.id !== casterPlayer.id
    );
    
    if (!margPlayer) {
        // 没有玛格，直接允许魔法
        if (onAllow) onAllow();
        return;
    }
    
    // 艾玛的魔法不可被静谧
    if (casterPlayer.character.id === 'emma') {
        if (onAllow) onAllow();
        return;
    }
    
    // 检查玛格强化静谧是否激活
    if (gameState.margSilenceActive && gameState.margSilencePlayerId === margPlayer.id) {
        // 强化静谧自动生效
        showMagicCastEffect(margPlayer, '模仿·静谧', `${casterPlayer.name} 的 ${magicName} 被静谧了！`);
        if (onNullify) onNullify();
        return;
    }
    
    // 检查被动技能锁
    if (gameState.passiveMagicLock) {
        if (onAllow) onAllow();
        return;
    }
    
    // 玛格是AI时自动决定
    if (networkState.mode === 'local' && margPlayer.isAI) {
        // AI有15%概率使用模仿
        if (Math.random() < 0.15) {
            margPlayer.witchification += 20;
            showWitchPopup(margPlayer, 20, '发动模仿');
            checkWitchification(margPlayer);
            showMagicCastEffect(margPlayer, '模仿', `${casterPlayer.name} 的 ${magicName} 被无效化了！`);
            if (onNullify) onNullify();
        } else {
            if (onAllow) onAllow();
        }
        return;
    }
    
    // 多人模式：房主发送请求给玛格玩家
    if (networkState.mode === 'online' && networkState.isHost) {
        // 检查玛格是否是本地玩家
        if (margPlayer.id === networkState.localPlayerId) {
            // 本地玛格，显示UI
            showMargPassiveChoice(margPlayer, casterPlayer, magicName, onNullify, onAllow);
        } else {
            // 远程玛格，发送请求
            sendPassiveRequest('marg_mimic', margPlayer.id, {
                casterPlayerName: casterPlayer.name,
                magicName: magicName
            }, (activate) => {
                if (activate) {
                    margPlayer.witchification += 20;
                    showWitchPopup(margPlayer, 20, '发动模仿');
                    checkWitchification(margPlayer);
                    showMagicCastEffect(margPlayer, '模仿', `${casterPlayer.name} 的 ${magicName} 被无效化了！`);
                    if (onNullify) onNullify();
                } else {
                    if (onAllow) onAllow();
                }
            });
        }
        return;
    }
    
    // 单人模式人类玛格玩家：显示选择界面
    showMargPassiveChoice(margPlayer, casterPlayer, magicName, onNullify, onAllow);
}

// 显示玛格被动技能选择界面
function showMargPassiveChoice(margPlayer, casterPlayer, magicName, onNullify, onAllow) {
    const modal = document.createElement('div');
    modal.id = 'marg-passive-modal';
    modal.className = 'marg-passive-modal';
    modal.innerHTML = `
        <div class="marg-passive-content" onclick="event.stopPropagation()">
            <div class="marg-passive-header">
                <span class="marg-icon">${getCharIcon(margPlayer.character, 'small')}</span>
                <span class="marg-title">模仿</span>
                <span class="marg-countdown" id="marg-countdown">10</span>
            </div>
            <div class="marg-passive-info">
                <p>${casterPlayer.name} 发动了 <strong>${magicName}</strong></p>
                <p>是否使用模仿使其失效？</p>
                <p class="marg-cost">魔女化惩罚: +20</p>
            </div>
            <div class="marg-passive-buttons">
                <button class="marg-btn nullify" onclick="confirmMargPassive(true)">🚫 无效化</button>
                <button class="marg-btn allow" onclick="confirmMargPassive(false)">✓ 允许</button>
            </div>
        </div>
    `;
    
    modal.onclick = (e) => {
        if (e.target === modal) {
            e.stopPropagation();
        }
    };
    
    document.body.appendChild(modal);
    
    // 保存状态
    gameState.margPassiveState = {
        margPlayer,
        casterPlayer,
        magicName,
        onNullify,
        onAllow,
        countdown: 10,
        timer: null
    };
    
    requestAnimationFrame(() => {
        modal.classList.add('show');
    });
    
    // 开始10秒倒计时
    startMargCountdown();
}

// 开始玛格倒计时
function startMargCountdown() {
    gameState.margPassiveState.countdown = 10;
    updateMargCountdown();
    
    gameState.margPassiveState.timer = setInterval(() => {
        gameState.margPassiveState.countdown--;
        updateMargCountdown();
        
        if (gameState.margPassiveState.countdown <= 0) {
            // 时间到，默认允许魔法
            confirmMargPassive(false);
        }
    }, 1000);
}

// 更新玛格倒计时显示
function updateMargCountdown() {
    const el = document.getElementById('marg-countdown');
    if (el && gameState.margPassiveState) {
        el.innerHTML = renderClockNumber(gameState.margPassiveState.countdown, 0.35);
        el.style.filter = gameState.margPassiveState.countdown <= 3 ? 'hue-rotate(-60deg) brightness(1.2)' : 'none';
    }
}

// 确认玛格被动技能选择
function confirmMargPassive(nullify) {
    // 清除计时器
    if (gameState.margPassiveState && gameState.margPassiveState.timer) {
        clearInterval(gameState.margPassiveState.timer);
        gameState.margPassiveState.timer = null;
    }
    
    const modal = document.getElementById('marg-passive-modal');
    if (modal) {
        modal.classList.add('hide');
        setTimeout(() => modal.remove(), 300);
    }
    
    const state = gameState.margPassiveState;
    if (!state) return;
    
    if (nullify) {
        // 使用模仿
        state.margPlayer.witchification += 20;
        showWitchPopup(state.margPlayer, 20, '发动模仿');
        checkWitchification(state.margPlayer);
        showMagicCastEffect(state.margPlayer, '模仿', `${state.casterPlayer.name} 的 ${state.magicName} 被无效化了！`);
        if (state.onNullify) state.onNullify();
    } else {
        // 允许魔法
        if (state.onAllow) state.onAllow();
    }
    
    gameState.margPassiveState = null;
    renderGame();
}

// 检查玛格静谧效果是否应该结束（玛格失败或胜利时）
function checkMargSilenceEnd(player) {
    if (gameState.margSilenceActive && gameState.margSilencePlayerId === player.id) {
        gameState.margSilenceActive = false;
        gameState.margSilencePlayerId = null;
        showMagicAlert('静谧解除', '玛格的静谧效果已结束！');
    }
}

// 检查魔法是否被静谧（用于canCastMagic检查）
function isMagicSilenced(player) {
    // 艾玛不受静谧影响
    if (player.character.id === 'emma') return false;
    
    // 玛格自己不受静谧影响
    if (player.character.id === 'marg') return false;
    
    // 检查玛格强化静谧是否激活
    if (gameState.margSilenceActive) {
        const margPlayer = gameState.players.find(p => p.id === gameState.margSilencePlayerId);
        if (margPlayer && !margPlayer.isEliminated) {
            return true;
        }
    }
    
    return false;
}

// ========== 冰上梅露露：治愈（固有技能） ==========

// 梅露露的魔女化上限（固定100%，与其他角色相同）
function getMeruruWitchLimit(player) {
    return 100;
}

// 梅露露主动发动治愈（不能主动发动，只能在地下室/娱乐室触发）
function castMagic_Meruru(player) {
    showMagicAlert('治愈', '治愈是固有技能，在驻留地下室或娱乐室后自动触发！');
}

// 梅露露强化魔法：所有玩家魔女化每小轮+5
function castEnhancedMagic_Meruru(player) {
    if (player.enhancedMagicUsed) {
        showMagicAlert('已激活', '强化治愈已经生效中！');
        return;
    }
    
    // 检查玛格被动技能
    checkMargPassive(player, '治愈·强化',
        () => { showMagicAlert('魔法失效', '治愈·强化被玛格的模仿无效化了！'); },
        () => { executeMeruruEnhanced(player); }
    );
}

// 实际执行梅露露强化魔法
function executeMeruruEnhanced(player) {
    player.enhancedMagicUsed = true;
    gameState.meruruEnhancedActive = true;
    gameState.meruruEnhancedPlayerId = player.id;
    
    showMagicCastEffect(player, '治愈·强化', '所有玩家魔女化每小轮+5！持续到梅露露胜利或失败！');
    
    renderGame();
}

// 检查梅露露治愈触发（在地下室/娱乐室驻留后）
function checkMeruruHealAfterCell(player, cellType, callback) {
    // 只有梅露露且未魔女化时触发
    if (player.character.id !== 'meruru' || player.isWitchified) {
        if (callback) callback();
        return;
    }
    
    // 只在地下室或娱乐室触发
    if (cellType !== 'basement' && cellType !== 'lounge') {
        if (callback) callback();
        return;
    }
    
    // 检查梅露露是否有足够的魔女化可以传递
    if (player.witchification < 5) {
        showMagicAlert('治愈', '魔女化不足5点，无法传递！');
        if (callback) callback();
        return;
    }
    
    // 获取可传递的目标
    const targets = gameState.players.filter(p => 
        p.id !== player.id && 
        !p.isEliminated
    );
    
    if (targets.length === 0) {
        if (callback) callback();
        return;
    }
    
    // AI梅露露自动选择
    if (player.isAI) {
        // 选择魔女化最低的目标
        const target = targets.reduce((min, p) => p.witchification < min.witchification ? p : min, targets[0]);
        executeMeruruHeal(player, target, callback);
        return;
    }
    
    // 人类梅露露：显示选择界面
    showMeruruHealSelection(player, targets, callback);
}

// 显示梅露露治愈目标选择
function showMeruruHealSelection(meruruPlayer, targets, callback) {
    const modal = document.createElement('div');
    modal.id = 'meruru-heal-modal';
    modal.className = 'meruru-heal-modal';
    modal.innerHTML = `
        <div class="meruru-heal-content" onclick="event.stopPropagation()">
            <div class="meruru-heal-header">
                <span class="meruru-icon">${getCharIcon(meruruPlayer.character, 'small')}</span>
                <span class="meruru-title">治愈</span>
            </div>
            <div class="meruru-heal-info">
                <p>将5点魔女化传递给谁？</p>
                <p class="meruru-current">当前魔女化: ${renderClockDecimal(meruruPlayer.witchification, 0.3)}%</p>
            </div>
            <div class="meruru-target-list">
                ${targets.map(p => `
                    <button class="meruru-target-btn" onclick="confirmMeruruHeal(${p.id})">
                        <span class="target-avatar">${getCharIcon(p.character, 'small')}</span>
                        <span class="target-name">${p.name}</span>
                        <span class="target-witch">魔女化: ${renderClockDecimal(p.witchification, 0.25)}%</span>
                    </button>
                `).join('')}
            </div>
            <button class="meruru-skip-btn" onclick="skipMeruruHeal()">不传递</button>
        </div>
    `;
    
    modal.onclick = (e) => {
        if (e.target === modal) {
            e.stopPropagation();
        }
    };
    
    document.body.appendChild(modal);
    
    // 保存状态
    gameState.meruruHealState = {
        meruruPlayer,
        targets,
        callback
    };
    
    requestAnimationFrame(() => {
        modal.classList.add('show');
    });
}

// 确认梅露露治愈目标
function confirmMeruruHeal(targetId) {
    const modal = document.getElementById('meruru-heal-modal');
    if (modal) {
        modal.classList.add('hide');
        setTimeout(() => modal.remove(), 300);
    }
    
    const state = gameState.meruruHealState;
    if (!state) return;
    
    const targetPlayer = gameState.players.find(p => p.id === targetId);
    if (!targetPlayer) {
        if (state.callback) state.callback();
        return;
    }
    
    executeMeruruHeal(state.meruruPlayer, targetPlayer, state.callback);
}

// 跳过梅露露治愈
function skipMeruruHeal() {
    const modal = document.getElementById('meruru-heal-modal');
    if (modal) {
        modal.classList.add('hide');
        setTimeout(() => modal.remove(), 300);
    }
    
    const state = gameState.meruruHealState;
    if (state && state.callback) {
        state.callback();
    }
}

// 执行梅露露治愈
function executeMeruruHeal(meruruPlayer, targetPlayer, callback) {
    // 梅露露减少5点魔女化
    meruruPlayer.witchification = Math.max(0, meruruPlayer.witchification - 5);
    showWitchPopup(meruruPlayer, -5, '治愈传递');
    
    // 目标增加5点魔女化
    targetPlayer.witchification += 5;
    showWitchPopup(targetPlayer, 5, '被治愈传递');
    checkWitchification(targetPlayer);
    
    showMagicCastEffect(meruruPlayer, '治愈', `将5点魔女化传递给了 ${targetPlayer.name}！`);
    
    renderGame();
    
    if (callback) {
        setTimeout(() => callback(), 1000);
    }
}

// 每回合开始时梅露露的魔女化+10
function checkMeruruRoundStart() {
    const meruruPlayer = gameState.players.find(p => 
        p.character.id === 'meruru' && 
        !p.isEliminated
    );
    
    if (!meruruPlayer) return;
    
    // 魔女化+10
    meruruPlayer.witchification += 10;
    showWitchPopup(meruruPlayer, 10, '治愈代价');
    
    // 检查魔女化
    checkWitchification(meruruPlayer);
    
    showMagicAlert('治愈代价', `梅露露魔女化+10`);
}

// 每小轮检查梅露露强化效果
function checkMeruruEnhancedAtSubRoundEnd() {
    if (!gameState.meruruEnhancedActive) return;
    
    const meruruPlayer = gameState.players.find(p => p.id === gameState.meruruEnhancedPlayerId);
    if (!meruruPlayer || meruruPlayer.isEliminated) {
        // 梅露露已失败，结束效果
        gameState.meruruEnhancedActive = false;
        gameState.meruruEnhancedPlayerId = null;
        return;
    }
    
    // 所有玩家魔女化+5
    gameState.players.forEach(p => {
        if (!p.isEliminated) {
            p.witchification += 5;
            showWitchPopup(p, 5, '治愈诅咒');
            checkWitchification(p);
        }
    });
    
    showMagicAlert('治愈·强化', '所有玩家魔女化+5！');
}

// 检查梅露露强化效果是否应该结束
function checkMeruruEnhancedEnd(player) {
    if (gameState.meruruEnhancedActive && gameState.meruruEnhancedPlayerId === player.id) {
        gameState.meruruEnhancedActive = false;
        gameState.meruruEnhancedPlayerId = null;
        showMagicAlert('治愈解除', '梅露露的强化治愈效果已结束！');
    }
}

// 梅露露魔女化期间：每小轮检查并处刑其他魔女化的角色
function checkMeruruWitchExecution() {
    // 找到魔女化的梅露露
    const meruruPlayer = gameState.players.find(p => 
        p.character.id === 'meruru' && 
        !p.isEliminated && 
        p.isWitchified
    );
    
    if (!meruruPlayer) return;
    
    // 找到其他魔女化的角色（不包括梅露露自己）
    const witchifiedPlayers = gameState.players.filter(p => 
        p.id !== meruruPlayer.id && 
        !p.isEliminated && 
        p.isWitchified
    );
    
    if (witchifiedPlayers.length === 0) return;
    
    // 处刑所有魔女化的角色
    witchifiedPlayers.forEach((player, idx) => {
        setTimeout(() => {
            showMagicCastEffect(meruruPlayer, '治愈·审判', `${player.name} 被梅露露的治愈之力处刑！`);
            setTimeout(() => {
                playerLoses(player);
            }, 500);
        }, idx * 1000);
    });
}

// ========== 多人游戏函数 ==========

// 创建房间
async function handleCreateRoom() {
    const statusEl = document.getElementById('connection-status');
    statusEl.className = 'connection-status connecting';
    statusEl.textContent = '正在连接服务器...';
    
    try {
        const roomCode = await createRoom();
        statusEl.className = 'connection-status success';
        statusEl.textContent = '房间创建成功！';
        
        // 跳转到房间界面
        setTimeout(() => {
            showScreen('room-screen');
            document.getElementById('display-room-code').textContent = roomCode;
            updateRoomUI();
        }, 500);
        
    } catch (err) {
        statusEl.className = 'connection-status error';
        statusEl.textContent = '创建失败: ' + err.message;
    }
}

// 加入房间
async function handleJoinRoom() {
    const roomCode = document.getElementById('room-code-input').value.trim();
    if (roomCode.length !== 6) {
        alert('请输入6位房间码');
        return;
    }
    
    const statusEl = document.getElementById('connection-status');
    statusEl.className = 'connection-status connecting';
    statusEl.textContent = '正在加入房间...';
    
    try {
        await joinRoom(roomCode);
        statusEl.className = 'connection-status success';
        statusEl.textContent = '加入成功！';
        
        // 跳转到房间界面
        setTimeout(() => {
            showScreen('room-screen');
            document.getElementById('display-room-code').textContent = roomCode;
            updateRoomUI();
        }, 500);
        
    } catch (err) {
        statusEl.className = 'connection-status error';
        statusEl.textContent = '加入失败: ' + err.message;
    }
}

// 离开房间
function handleLeaveRoom() {
    if (confirm('确定要离开房间吗？')) {
        sendMessage('player_left', { playerId: networkState.localPlayerId }, 'room');
        disconnectMQTT();
        showScreen('online-screen');
    }
}

// 复制房间码
function copyRoomCode() {
    const roomCode = document.getElementById('display-room-code').textContent;
    navigator.clipboard.writeText(roomCode).then(() => {
        const btn = document.querySelector('.copy-btn');
        btn.textContent = '✓ 已复制';
        setTimeout(() => {
            btn.textContent = '📋 复制';
        }, 2000);
    });
}

// 切换准备状态
function toggleReady() {
    const player = networkState.players[networkState.localPlayerId];
    if (!player) return;
    
    player.ready = !player.ready;
    
    // 发送准备状态
    sendMessage('player_ready', {
        playerId: networkState.localPlayerId,
        ready: player.ready
    }, 'room');
    
    updateRoomUI();
}

// 更新房间UI
function updateRoomUI() {
    const listEl = document.getElementById('room-players-list');
    const readyBtn = document.getElementById('ready-btn');
    const startBtn = document.getElementById('start-game-btn');
    
    // 渲染玩家列表（4个槽位）
    let html = '';
    for (let i = 1; i <= 4; i++) {
        const player = networkState.players[i];
        if (player) {
            const isLocal = i === networkState.localPlayerId;
            const statusClass = player.ready ? 'ready' : 'waiting';
            const statusText = player.ready ? '已准备' : '等待中';
            
            html += `
                <div class="room-player-item ${isLocal ? 'is-local' : ''}">
                    <div class="room-player-info">
                        <div class="room-player-avatar">
                            ${player.character ? getCharIcon(CHARACTERS.find(c => c.id === player.character), 'small') : '👤'}
                        </div>
                        <span class="room-player-name">
                            ${player.name}
                            ${player.isHost ? '<span class="room-player-host">房主</span>' : ''}
                            ${isLocal ? ' (你)' : ''}
                        </span>
                    </div>
                    <span class="room-player-status ${statusClass}">${statusText}</span>
                </div>
            `;
        } else {
            html += `
                <div class="room-player-item room-player-slot">
                    <div class="room-player-info">
                        <div class="room-player-avatar">?</div>
                        <span class="room-player-name">等待玩家加入...</span>
                    </div>
                </div>
            `;
        }
    }
    listEl.innerHTML = html;
    
    // 更新准备按钮
    const localPlayer = networkState.players[networkState.localPlayerId];
    if (localPlayer) {
        readyBtn.textContent = localPlayer.ready ? '取消准备' : '准备';
        readyBtn.classList.toggle('is-ready', localPlayer.ready);
    }
    
    // 房主显示开始按钮
    if (networkState.isHost) {
        startBtn.classList.remove('hidden');
        
        // 检查是否所有人都准备好了
        const players = Object.values(networkState.players);
        const allReady = players.length >= 2 && players.every(p => p.ready || p.isHost);
        startBtn.disabled = !allReady;
    } else {
        startBtn.classList.add('hidden');
    }
}

// 房主开始游戏
function handleStartOnlineGame() {
    if (!networkState.isHost) return;
    
    const players = Object.values(networkState.players);
    if (players.length < 2) {
        alert('至少需要2名玩家');
        return;
    }
    
    // 进入角色选择
    gameState.gameMode = 'multi';
    gameState.playerCount = players.length;
    gameState.currentSelectingPlayer = 0;
    gameState.selectedCharacters = [];
    
    // 广播游戏开始（进入角色选择）
    sendMessage('game_start', {
        playerCount: players.length,
        phase: 'character_select'
    }, 'room');
    
    showScreen('character-screen');
    renderOnlineCharacterSelect();
}

// 多人模式角色选择
function renderOnlineCharacterSelect() {
    const playerNum = gameState.currentSelectingPlayer + 1;
    const isMyTurn = playerNum === networkState.localPlayerId;
    
    // 更新标题
    const playerName = networkState.players[playerNum]?.name || `玩家${playerNum}`;
    const titleEl = document.getElementById('char-select-title');
    if (titleEl) {
        titleEl.textContent = isMyTurn ? '选择你的角色' : `等待 ${playerName} 选择角色...`;
    }
    
    // 更新进度指示器（菱形样式）
    const progressEl = document.getElementById('char-select-progress');
    if (progressEl) {
        progressEl.innerHTML = '';
        for (let i = 0; i < gameState.playerCount; i++) {
            // 添加菱形
            const diamond = document.createElement('span');
            diamond.className = 'progress-diamond';
            if (i < gameState.currentSelectingPlayer) {
                diamond.classList.add('done');
            } else if (i === gameState.currentSelectingPlayer) {
                diamond.classList.add('current');
            } else {
                diamond.classList.add('waiting');
            }
            
            // 添加玩家名标签
            const label = document.createElement('span');
            label.className = 'progress-player-label';
            label.textContent = networkState.players[i + 1]?.name || `P${i + 1}`;
            diamond.appendChild(label);
            
            progressEl.appendChild(diamond);
            
            // 添加连接线（除了最后一个）
            if (i < gameState.playerCount - 1) {
                const line = document.createElement('span');
                line.className = 'progress-line';
                if (i < gameState.currentSelectingPlayer) {
                    line.classList.add('done');
                }
                progressEl.appendChild(line);
            }
        }
    }
    
    // 渲染角色卡片列表（右侧滑出式）
    const listEl = document.getElementById('character-list');
    if (listEl) {
        listEl.innerHTML = CHARACTERS.map(char => {
            const isSelected = gameState.selectedCharacters.includes(char.id);
            const isCurrentSelected = gameState.tempSelectedChar === char.id;
            const isMultiplayerDisabled = !char.multiplayerReady;
            const isDisabled = isSelected || isMultiplayerDisabled;
            const canSelect = isMyTurn && !isDisabled;
            
            // 获取选择该角色的玩家名
            let takenByName = '';
            if (isSelected) {
                const takenPlayer = Object.values(networkState.players).find(p => p.character === char.id);
                takenByName = takenPlayer?.name || '已选';
            }
            
            const charColor = char.barColors ? char.barColors[0] : '#9b59b6';
            
            return `
                <div class="char-card ${isSelected ? 'disabled' : ''} ${isCurrentSelected ? 'selected' : ''} ${isMultiplayerDisabled ? 'multiplayer-disabled' : ''}" 
                     style="--char-color: ${charColor};"
                     data-id="${char.id}"
                     onclick="${canSelect ? `playFlipSFX(); selectCharacterItem('${char.id}')` : ''}"
                     onmouseenter="${canSelect ? 'playHoverSFX()' : ''}">
                    <div class="char-card-avatar">
                        <img src="${getCharIcon(char, 'small')}" alt="${char.name}">
                    </div>
                    <span class="char-card-name">${char.name}</span>
                    ${isSelected ? `<span class="char-card-taken">${takenByName}</span>` : ''}
                    ${isMultiplayerDisabled ? `<span class="char-card-taken">多人暂不可用</span>` : ''}
                </div>
            `;
        }).join('');
    }
    
    // 更新详情面板
    updateCharacterDetail(gameState.tempSelectedChar);
}

// 多人模式确认角色选择
function confirmOnlineCharacterSelect() {
    if (!gameState.tempSelectedChar) {
        alert('请先选择一个角色！');
        return;
    }
    
    // 检查是否是自己的回合
    const playerNum = gameState.currentSelectingPlayer + 1;
    if (playerNum !== networkState.localPlayerId) {
        console.log('[角色选择] 不是自己的回合');
        return;
    }
    
    const selectedChar = gameState.tempSelectedChar;
    
    // 触发滑出动画
    const showcaseContent = document.getElementById('showcase-content');
    const showcaseBg = document.getElementById('showcase-bg');
    
    if (showcaseContent) {
        showcaseContent.classList.remove('active');
        showcaseContent.classList.add('slide-out');
    }
    
    setTimeout(() => {
        if (showcaseBg) {
            showcaseBg.classList.remove('active');
            showcaseBg.classList.add('slide-out');
        }
    }, 300);
    
    // 发送角色选择消息（状态更新由handleCharacterSelected统一处理）
    sendMessage('character_selected', {
        playerId: networkState.localPlayerId,
        characterId: selectedChar
    }, 'room');
    
    // 清空临时选择
    gameState.tempSelectedChar = null;
}

// 初始化多人游戏
function initOnlineGame() {
    console.log('[多人游戏] 房主初始化游戏...');
    
    // 重置排名计数器
    currentRank = 1;
    
    // 初始化玩家
    gameState.players = [];
    
    Object.values(networkState.players).forEach((netPlayer, idx) => {
        const char = CHARACTERS.find(c => c.id === netPlayer.character);
        if (!char) {
            console.error(`[多人游戏] 找不到角色: ${netPlayer.character}`);
            return;
        }
        const player = createPlayer(netPlayer.id, netPlayer.name, char, false);
        player.isAI = false;  // 多人模式没有AI
        gameState.players.push(player);
    });
    
    // 按ID排序
    gameState.players.sort((a, b) => a.id - b.id);
    
    // 初始化棋盘
    gameState.board = createBoard();
    
    // 初始化回合
    gameState.currentRound = 1;
    gameState.totalSubRounds = Math.floor(Math.random() * 3) + 2; // 2-4
    gameState.currentSubRound = 1;
    gameState.currentPlayerIndex = 0;
    
    // 发牌
    dealCards();
    
    // 广播完整游戏状态给所有玩家
    sendMessage('game_start', {
        phase: 'game',
        gameState: getSerializableGameState()
    }, 'room');
    
    // 显示角色出场转场动画
    showCharacterIntroTransition(() => {
        showScreen('game-screen');
        renderGame();
    });
}

// 同步游戏状态（非房主接收）
function syncGameState(state) {
    // 恢复Set类型
    if (state.players) {
        state.players.forEach(p => {
            if (Array.isArray(p.visitedCells)) {
                p.visitedCells = new Set(p.visitedCells);
            }
        });
    }
    
    // 同步moveState（汉娜浮空等移动状态）
    if (state._moveState) {
        const ms = state._moveState;
        const player = ms.playerId ? state.players.find(p => p.id === ms.playerId) : null;
        moveState = {
            isMoving: ms.isMoving,
            player: player,
            remainingSteps: ms.remainingSteps,
            path: ms.path || [],
            previousPosition: ms.previousPosition,
            lastPassedCell: ms.lastPassedCell,
            isHannaFloat: ms.isHannaFloat,
            isHannaEnhanced: ms.isHannaEnhanced,
            skipConfrontation: ms.skipConfrontation
        };
        delete state._moveState;
    }
    
    // 更新本地状态
    Object.assign(gameState, state);
    
    // 渲染
    renderGame();
}

// 开始在线游戏（非房主接收）
function startOnlineGame(message) {
    console.log('[多人游戏] 收到游戏开始:', message);
    gameState.gameMode = 'multi';
    
    // 角色选择阶段
    if (message.phase === 'character_select') {
        gameState.playerCount = message.playerCount;
        gameState.currentSelectingPlayer = 0;
        gameState.selectedCharacters = [];
        gameState.tempSelectedChar = null;
        showScreen('character-screen');
        renderOnlineCharacterSelect();
    } 
    // 游戏进行阶段
    else if (message.phase === 'game' && message.gameState) {
        syncGameState(message.gameState);
        
        // 显示角色出场转场动画
        showCharacterIntroTransition(() => {
            showScreen('game-screen');
            renderGame();
        });
    }
}

// ========== 远程被动技能决策UI ==========

// 显示远程被动技能决策界面
function showRemotePassiveDecision(message) {
    const { requestId, skillType } = message;
    
    switch (skillType) {
        case 'hiro_block':
            showRemoteHiroDecision(requestId, message);
            break;
        case 'anan_brainwash':
            showRemoteAnanDecision(requestId, message);
            break;
        case 'coco_clairvoyance':
            showRemoteCocoDecision(requestId, message);
            break;
        case 'leiya_guidance':
            showRemoteLeiyaDecision(requestId, message);
            break;
        case 'milia_swap':
            showRemoteMiliaDecision(requestId, message);
            break;
        case 'marg_mimic':
            showRemoteMargDecision(requestId, message);
            break;
        case 'sherry_force':
            showRemoteSherryDecision(requestId, message);
            break;
        default:
            console.log('未知被动技能类型:', skillType);
            sendPassiveResponse(requestId, false);
    }
}

// 希罗远程决策
function showRemoteHiroDecision(requestId, message) {
    const localPlayer = getLocalPlayer();
    
    const modal = document.createElement('div');
    modal.id = 'remote-passive-modal';
    modal.className = 'hiro-magic-modal';
    modal.innerHTML = `
        <div class="hiro-magic-content" onclick="event.stopPropagation()">
            <div class="hiro-magic-header">
                <span class="hiro-icon">${getCharIcon(localPlayer.character, 'small')}</span>
                <span class="hiro-title">死亡回溯</span>
            </div>
            <div class="hiro-magic-info">
                <p><strong>${message.targetPlayerName}</strong> 打出了 <strong>${message.card}</strong> 点</p>
                <p>是否发动魔法禁止其移动？</p>
                <p class="hiro-cost">魔女化惩罚: +10</p>
            </div>
            <div class="hiro-countdown">
                <span id="remote-countdown">10</span>秒
            </div>
            <div class="hiro-magic-buttons">
                <button class="hiro-btn activate" onclick="confirmRemotePassive('${requestId}', true)">发动魔法</button>
                <button class="hiro-btn skip" onclick="confirmRemotePassive('${requestId}', false)">跳过</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    requestAnimationFrame(() => modal.classList.add('show'));
    
    // 倒计时
    startRemotePassiveCountdown(requestId, 10);
}

// 远程被动技能倒计时
let remotePassiveTimer = null;
function startRemotePassiveCountdown(requestId, seconds) {
    let countdown = seconds;
    const countdownEl = document.getElementById('remote-countdown');
    
    remotePassiveTimer = setInterval(() => {
        countdown--;
        if (countdownEl) countdownEl.textContent = countdown;
        
        if (countdown <= 0) {
            confirmRemotePassive(requestId, false);
        }
    }, 1000);
}

// 确认远程被动技能决策
function confirmRemotePassive(requestId, activate, data = {}) {
    // 清除倒计时
    if (remotePassiveTimer) {
        clearInterval(remotePassiveTimer);
        remotePassiveTimer = null;
    }
    
    // 关闭弹窗
    const modal = document.getElementById('remote-passive-modal');
    if (modal) {
        modal.classList.add('hide');
        setTimeout(() => modal.remove(), 300);
    }
    
    // 发送响应
    sendPassiveResponse(requestId, activate, data);
}

// 安安远程决策（简化版，实际需要显示可选点数）
function showRemoteAnanDecision(requestId, message) {
    const localPlayer = getLocalPlayer();
    
    const modal = document.createElement('div');
    modal.id = 'remote-passive-modal';
    modal.className = 'anan-modal';
    modal.innerHTML = `
        <div class="anan-content" onclick="event.stopPropagation()">
            <div class="anan-header">
                <span class="anan-icon">${getCharIcon(localPlayer.character, 'small')}</span>
                <span class="anan-title">洗脑</span>
                <span class="anan-countdown" id="remote-countdown">10</span>
            </div>
            <div class="anan-info">
                <p>${message.targetPlayerName} 准备打出 <strong>${message.originalCard}</strong> 点</p>
                <p>是否发动「洗脑」指定其打出的点数？</p>
                <p class="anan-cost">魔女化惩罚: +10</p>
            </div>
            <div class="anan-card-buttons">
                ${message.availableCards.map(num => `
                    <button class="anan-card-btn ${num === message.originalCard ? 'original' : ''}" 
                            onclick="confirmRemotePassive('${requestId}', true, {forcedCard: ${num}})">${num}</button>
                `).join('')}
            </div>
            <button class="anan-skip-btn" onclick="confirmRemotePassive('${requestId}', false)">不发动</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    requestAnimationFrame(() => modal.classList.add('show'));
    startRemotePassiveCountdown(requestId, 10);
}

// 可可远程决策
function showRemoteCocoDecision(requestId, message) {
    const localPlayer = getLocalPlayer();
    
    const modal = document.createElement('div');
    modal.id = 'remote-passive-modal';
    modal.className = 'coco-magic-modal';
    modal.innerHTML = `
        <div class="coco-magic-content" onclick="event.stopPropagation()">
            <div class="coco-magic-header">
                <span class="coco-icon">${getCharIcon(localPlayer.character, 'small')}</span>
                <span class="coco-title">千里眼</span>
            </div>
            <div class="coco-magic-info">
                <p><strong>${message.movingPlayerName}</strong> 经过了格子 <strong>${message.cellId}</strong></p>
                <p>这是你驻足过的格子！</p>
                <p>是否发动魔法触发地下室效果？</p>
                <p class="coco-cost">魔女化惩罚: +20</p>
            </div>
            <div class="coco-countdown">
                <span id="remote-countdown">10</span>秒
            </div>
            <div class="coco-magic-buttons">
                <button class="coco-btn activate" onclick="confirmRemotePassive('${requestId}', true)">发动魔法</button>
                <button class="coco-btn skip" onclick="confirmRemotePassive('${requestId}', false)">跳过</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    requestAnimationFrame(() => modal.classList.add('show'));
    startRemotePassiveCountdown(requestId, 10);
}

// 蕾雅远程决策
function showRemoteLeiyaDecision(requestId, message) {
    const localPlayer = getLocalPlayer();
    
    const modal = document.createElement('div');
    modal.id = 'remote-passive-modal';
    modal.className = 'leiya-modal';
    modal.innerHTML = `
        <div class="leiya-content" onclick="event.stopPropagation()">
            <div class="leiya-header">
                <span class="leiya-icon">${getCharIcon(localPlayer.character, 'small')}</span>
                <span class="leiya-title">视线诱导</span>
                <span class="leiya-countdown" id="remote-countdown">10</span>
            </div>
            <div class="leiya-info">
                <p>${message.targetPlayerName} 到达分叉点（格子${message.currentPos}）</p>
                <p>是否发动「视线诱导」指定其方向？</p>
                <p class="leiya-cost">魔女化惩罚: +7</p>
            </div>
            <div class="leiya-direction-buttons">
                ${message.validDirections.map(dir => `
                    <button class="leiya-dir-btn" onclick="confirmRemotePassive('${requestId}', true, {direction: ${dir}})">
                        ${getArrowForDirection(message.currentPos, dir)} 格子${dir}
                    </button>
                `).join('')}
            </div>
            <button class="leiya-skip-btn" onclick="confirmRemotePassive('${requestId}', false)">不发动</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    requestAnimationFrame(() => modal.classList.add('show'));
    startRemotePassiveCountdown(requestId, 10);
}

// 米莉亚远程决策
function showRemoteMiliaDecision(requestId, message) {
    const localPlayer = getLocalPlayer();
    
    const modal = document.createElement('div');
    modal.id = 'remote-passive-modal';
    modal.className = 'milia-modal';
    modal.innerHTML = `
        <div class="milia-content" onclick="event.stopPropagation()">
            <div class="milia-header">
                <span class="milia-icon">${getCharIcon(localPlayer.character, 'small')}</span>
                <span class="milia-title">互换</span>
                <span class="milia-countdown" id="remote-countdown">10</span>
            </div>
            <div class="milia-info">
                <p>交锋结束！是否发动「互换」？</p>
                <p>互换两人的前进方向、游戏顺位和所有线索</p>
                <p class="milia-cost">魔女化惩罚: +30</p>
            </div>
            <div class="milia-target-list">
                ${message.opponents.map(p => `
                    <button class="milia-target-btn" onclick="confirmRemotePassive('${requestId}', true, {targetId: ${p.id}})">
                        <span class="target-name">${p.name}</span>
                        <span class="target-info">证据: ${p.evidenceCount}张</span>
                    </button>
                `).join('')}
            </div>
            <button class="milia-skip-btn" onclick="confirmRemotePassive('${requestId}', false)">不发动</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    requestAnimationFrame(() => modal.classList.add('show'));
    startRemotePassiveCountdown(requestId, 10);
}

// 玛格远程决策
function showRemoteMargDecision(requestId, message) {
    const localPlayer = getLocalPlayer();
    
    const modal = document.createElement('div');
    modal.id = 'remote-passive-modal';
    modal.className = 'marg-passive-modal';
    modal.innerHTML = `
        <div class="marg-passive-content" onclick="event.stopPropagation()">
            <div class="marg-passive-header">
                <span class="marg-icon">${getCharIcon(localPlayer.character, 'small')}</span>
                <span class="marg-title">模仿</span>
                <span class="marg-countdown" id="remote-countdown">10</span>
            </div>
            <div class="marg-passive-info">
                <p>${message.casterPlayerName} 发动了 <strong>${message.magicName}</strong></p>
                <p>是否使用模仿使其失效？</p>
                <p class="marg-cost">魔女化惩罚: +20</p>
            </div>
            <div class="marg-passive-buttons">
                <button class="marg-btn nullify" onclick="confirmRemotePassive('${requestId}', true)">🚫 无效化</button>
                <button class="marg-btn allow" onclick="confirmRemotePassive('${requestId}', false)">✓ 允许</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    requestAnimationFrame(() => modal.classList.add('show'));
    startRemotePassiveCountdown(requestId, 10);
}

// 雪莉远程决策
function showRemoteSherryDecision(requestId, message) {
    const localPlayer = getLocalPlayer();
    
    const modal = document.createElement('div');
    modal.id = 'remote-passive-modal';
    modal.className = 'sherry-choice-modal';
    modal.innerHTML = `
        <div class="sherry-choice-content" onclick="event.stopPropagation()">
            <div class="sherry-choice-header">
                <span class="sherry-icon">${getCharIcon(localPlayer.character, 'small')}</span>
                <span class="sherry-title">巨力化</span>
            </div>
            <div class="sherry-choice-info">
                <p>是否发动「巨力化」直接宣告胜利？</p>
                <p class="sherry-cost">魔女化惩罚: +20</p>
            </div>
            <div class="sherry-countdown">
                <span id="remote-countdown">10</span>秒
            </div>
            <div class="sherry-choice-buttons">
                <button class="sherry-btn activate" onclick="confirmRemotePassive('${requestId}', true)">发动魔法</button>
                <button class="sherry-btn skip" onclick="confirmRemotePassive('${requestId}', false)">正常交锋</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    requestAnimationFrame(() => modal.classList.add('show'));
    startRemotePassiveCountdown(requestId, 10);
}

// ========== 初始化 ==========
document.addEventListener('DOMContentLoaded', () => {
    // 初始化音频系统
    if (typeof initAudio === 'function') {
        initAudio();
    }
    
    // 初始化粒子效果
    if (typeof initParticles === 'function') {
        initParticles();
    }
    
    // 根据时间自动设置日夜模式
    if (typeof autoSetDayNight === 'function') {
        autoSetDayNight();
    }
    
    // 初始化玩家名称输入框
    if (typeof initPlayerNameInput === 'function') {
        initPlayerNameInput();
    }
    
    // 首次显示不使用转场
    showScreen('menu-screen', true);
    
    // 用户首次交互后播放音乐
    const startMusic = () => {
        if (typeof playHubMusic === 'function') {
            playHubMusic();
        }
        document.removeEventListener('click', startMusic);
        document.removeEventListener('keydown', startMusic);
    };
    document.addEventListener('click', startMusic);
    document.addEventListener('keydown', startMusic);
});
