/**
 * 魔法少女的魔女审判 - 音频管理模块
 */

// ========== 音乐配置 ==========
const MUSIC_CONFIG = {
    // 主菜单/大厅音乐
    Hub: [
        'music/Hub/Bgm_001_001_Loop.mp3',
        'music/Hub/Bgm_017_001_Loop.mp3',
        'music/Hub/Bgm_019_001_Loop.mp3',
        'music/Hub/Bgm_028_001_Loop.mp3',
        'music/Hub/bloom.mp3',
        'music/Hub/gDie Divil JIO.mp3'
    ],
    // 普通游戏进行中
    common: [
        'music/common/Bgm_011_001_Loop.mp3',
        'music/common/Bgm_026_001_Loop.mp3',
        'music/common/Bgm_034_001_Loop.mp3',
        'music/common/Bgm_045_002_Loop.mp3',
        'music/common/Bgm_046_001_Loop.mp3',
        'music/common/迷宮の徒.mp3'
    ],
    // 交锋音乐
    Battle: [
        'music/Battle/Bgm_007_001_Loop.mp3',
        'music/Battle/Bgm_025_001_Loop.mp3',
        'music/Battle/Bgm_033_001_Loop.mp3',
        'music/Battle/Hiro.mp3',
        'music/Battle/Sen-Choose N\'o SurC (-触-).mp3'
    ],
    // 魔女化/紧张时刻
    Witch: [
        'music/Witch/DArime.mp3',
        'music/Witch/Ema.mp3',
        'music/Witch/Noah.mp3',
        'music/Witch/Sar-gedy (-流-).mp3',
        'music/Witch/吸われた祈り.mp3',
        'music/Witch/鉛の腱.mp3'
    ]
};

// ========== 音频状态 ==========
const audioState = {
    bgmPlayer: null,           // 背景音乐播放器
    sfxPlayer: null,           // 音效播放器
    currentCategory: null,     // 当前音乐类别
    currentTrack: null,        // 当前曲目
    bgmVolume: 0.5,            // 背景音乐音量 (0-1)
    sfxVolume: 0.7,            // 音效音量 (0-1)
    isMuted: false,            // 是否静音
    isPlaying: false,          // 是否正在播放
    fadeInterval: null,        // 淡入淡出定时器
    previousCategory: null,    // 上一个类别（用于恢复）
    // Web Audio API 相关（用于魔女化滤波效果）
    audioContext: null,        // 音频上下文
    bgmSource: null,           // BGM 媒体源节点
    lowpassFilter: null,       // 低通滤波器
    bgmGain: null,             // BGM 增益节点
    isWitchFiltered: false     // 是否处于魔女化滤波状态
};

// ========== 初始化 ==========
function initAudio() {
    // 创建背景音乐播放器
    audioState.bgmPlayer = new Audio();
    audioState.bgmPlayer.loop = true;
    audioState.bgmPlayer.volume = audioState.bgmVolume;
    
    // 播放结束时自动切换下一首（如果不循环）
    audioState.bgmPlayer.addEventListener('ended', () => {
        if (!audioState.bgmPlayer.loop) {
            playRandomFromCategory(audioState.currentCategory);
        }
    });
    
    // 创建音效播放器
    audioState.sfxPlayer = new Audio();
    audioState.sfxPlayer.volume = audioState.sfxVolume;
    
    // 初始化 Web Audio API（用于魔女化滤波效果）
    initWebAudio();
    
    // 从localStorage读取设置
    loadAudioSettings();
    
    console.log('[Audio] 音频系统初始化完成');
}

// 初始化 Web Audio API
function initWebAudio() {
    try {
        audioState.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // 创建低通滤波器
        audioState.lowpassFilter = audioState.audioContext.createBiquadFilter();
        audioState.lowpassFilter.type = 'lowpass';
        audioState.lowpassFilter.frequency.value = 22000; // 默认全频
        audioState.lowpassFilter.Q.value = 0.7;
        
        // 创建增益节点
        audioState.bgmGain = audioState.audioContext.createGain();
        audioState.bgmGain.gain.value = 1;
        
        // 连接：滤波器 -> 增益 -> 输出
        audioState.lowpassFilter.connect(audioState.bgmGain);
        audioState.bgmGain.connect(audioState.audioContext.destination);
        
        // 检测是否为本地文件系统（CORS限制）
        audioState.isLocalFile = window.location.protocol === 'file:';
        if (audioState.isLocalFile) {
            console.log('[Audio] 检测到本地文件系统，滤波效果将使用CSS模拟');
        }
        
        console.log('[Audio] Web Audio API 初始化完成');
    } catch (e) {
        console.log('[Audio] Web Audio API 不可用，滤波效果将被禁用');
    }
}

// 将 BGM 连接到 Web Audio API
function connectBGMToWebAudio() {
    // 本地文件系统下跳过（CORS限制）
    if (audioState.isLocalFile) return;
    if (!audioState.audioContext || !audioState.bgmPlayer) return;
    
    try {
        // 如果已经连接过，不重复连接
        if (audioState.bgmSource) return;
        
        // 恢复音频上下文（如果被暂停）
        if (audioState.audioContext.state === 'suspended') {
            audioState.audioContext.resume();
        }
        
        // 创建媒体源节点
        audioState.bgmSource = audioState.audioContext.createMediaElementSource(audioState.bgmPlayer);
        
        // 连接到滤波器链
        audioState.bgmSource.connect(audioState.lowpassFilter);
        
        console.log('[Audio] BGM 已连接到 Web Audio API');
    } catch (e) {
        console.log('[Audio] BGM 连接失败:', e);
    }
}

// ========== 魔女化音效滤波 ==========

// 激活魔女化滤波效果（水下/窒息感）
function activateWitchFilter() {
    if (audioState.isWitchFiltered) return;
    audioState.isWitchFiltered = true;
    
    // 本地文件系统：使用CSS滤镜模拟效果
    if (audioState.isLocalFile) {
        document.body.classList.add('witch-audio-filter');
        // 降低BGM音量模拟闷音效果
        if (audioState.bgmPlayer) {
            audioState.bgmPlayer.volume = audioState.bgmVolume * 0.4;
        }
        console.log('[Audio] 魔女化滤波效果已激活（CSS模拟）');
        return;
    }
    
    if (!audioState.audioContext || !audioState.lowpassFilter) return;
    
    // 确保 BGM 已连接
    connectBGMToWebAudio();
    
    const now = audioState.audioContext.currentTime;
    
    // 快速切掉高频，营造水下/窒息感
    audioState.lowpassFilter.frequency.cancelScheduledValues(now);
    audioState.lowpassFilter.frequency.setValueAtTime(audioState.lowpassFilter.frequency.value, now);
    audioState.lowpassFilter.frequency.exponentialRampToValueAtTime(400, now + 0.3); // 0.3秒内降到400Hz
    
    // 稍微增加Q值，让低频更浑浊
    audioState.lowpassFilter.Q.setValueAtTime(1.5, now);
    
    console.log('[Audio] 魔女化滤波效果已激活');
}

// 解除魔女化滤波效果
function deactivateWitchFilter() {
    if (!audioState.isWitchFiltered) return;
    audioState.isWitchFiltered = false;
    
    // 本地文件系统：移除CSS滤镜
    if (audioState.isLocalFile) {
        document.body.classList.remove('witch-audio-filter');
        // 恢复BGM音量
        if (audioState.bgmPlayer) {
            audioState.bgmPlayer.volume = audioState.bgmVolume;
        }
        console.log('[Audio] 魔女化滤波效果已解除（CSS模拟）');
        return;
    }
    
    if (!audioState.audioContext || !audioState.lowpassFilter) return;
    
    const now = audioState.audioContext.currentTime;
    
    // 缓慢恢复全频
    audioState.lowpassFilter.frequency.cancelScheduledValues(now);
    audioState.lowpassFilter.frequency.setValueAtTime(audioState.lowpassFilter.frequency.value, now);
    audioState.lowpassFilter.frequency.exponentialRampToValueAtTime(22000, now + 1.5); // 1.5秒恢复
    
    // 恢复Q值
    audioState.lowpassFilter.Q.linearRampToValueAtTime(0.7, now + 1.5);
    
    console.log('[Audio] 魔女化滤波效果已解除');
}

// ========== 背景音乐控制 ==========

// 播放指定类别的随机音乐
function playRandomFromCategory(category, fadeIn = true) {
    if (!MUSIC_CONFIG[category]) {
        console.error(`[Audio] 未知音乐类别: ${category}`);
        return;
    }
    
    const tracks = MUSIC_CONFIG[category];
    const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];
    
    playBGM(randomTrack, category, fadeIn);
}

// 播放指定曲目
function playBGM(trackPath, category = null, fadeIn = true) {
    if (audioState.isMuted) {
        audioState.currentTrack = trackPath;
        audioState.currentCategory = category;
        return;
    }
    
    // 如果正在播放同一首，不重复播放
    if (audioState.currentTrack === trackPath && audioState.isPlaying) {
        return;
    }
    
    // 停止当前淡入淡出
    if (audioState.fadeInterval) {
        clearInterval(audioState.fadeInterval);
        audioState.fadeInterval = null;
    }
    
    // 淡出当前音乐后播放新音乐
    if (audioState.isPlaying && fadeIn) {
        fadeOutBGM(() => {
            startNewBGM(trackPath, category, fadeIn);
        });
    } else {
        startNewBGM(trackPath, category, fadeIn);
    }
}

// 开始播放新音乐
function startNewBGM(trackPath, category, fadeIn) {
    audioState.bgmPlayer.src = trackPath;
    audioState.currentTrack = trackPath;
    audioState.currentCategory = category;
    
    if (fadeIn) {
        audioState.bgmPlayer.volume = 0;
        audioState.bgmPlayer.play().then(() => {
            audioState.isPlaying = true;
            fadeInBGM();
        }).catch(err => {
            console.log('[Audio] 自动播放被阻止，等待用户交互');
        });
    } else {
        audioState.bgmPlayer.volume = audioState.bgmVolume;
        audioState.bgmPlayer.play().then(() => {
            audioState.isPlaying = true;
        }).catch(err => {
            console.log('[Audio] 自动播放被阻止');
        });
    }
}

// 淡入
function fadeInBGM(duration = 1000) {
    const targetVolume = audioState.bgmVolume;
    const step = targetVolume / (duration / 50);
    
    audioState.fadeInterval = setInterval(() => {
        if (audioState.bgmPlayer.volume < targetVolume - step) {
            audioState.bgmPlayer.volume += step;
        } else {
            audioState.bgmPlayer.volume = targetVolume;
            clearInterval(audioState.fadeInterval);
            audioState.fadeInterval = null;
        }
    }, 50);
}

// 淡出
function fadeOutBGM(callback, duration = 500) {
    const step = audioState.bgmPlayer.volume / (duration / 50);
    
    audioState.fadeInterval = setInterval(() => {
        if (audioState.bgmPlayer.volume > step) {
            audioState.bgmPlayer.volume -= step;
        } else {
            audioState.bgmPlayer.volume = 0;
            audioState.bgmPlayer.pause();
            audioState.isPlaying = false;
            clearInterval(audioState.fadeInterval);
            audioState.fadeInterval = null;
            if (callback) callback();
        }
    }, 50);
}

// 暂停背景音乐
function pauseBGM() {
    if (audioState.bgmPlayer && audioState.isPlaying) {
        audioState.bgmPlayer.pause();
        audioState.isPlaying = false;
    }
}

// 恢复背景音乐
function resumeBGM() {
    if (audioState.bgmPlayer && !audioState.isPlaying && !audioState.isMuted) {
        audioState.bgmPlayer.play().then(() => {
            audioState.isPlaying = true;
        }).catch(() => {});
    }
}

// 停止背景音乐
function stopBGM() {
    if (audioState.bgmPlayer) {
        audioState.bgmPlayer.pause();
        audioState.bgmPlayer.currentTime = 0;
        audioState.isPlaying = false;
        audioState.currentTrack = null;
    }
}

// ========== 场景音乐切换 ==========

// 切换到主菜单音乐
function playHubMusic() {
    if (audioState.currentCategory !== 'Hub') {
        playRandomFromCategory('Hub');
    }
}

// 切换到普通游戏音乐
function playCommonMusic() {
    if (audioState.currentCategory !== 'common') {
        audioState.previousCategory = audioState.currentCategory;
        playRandomFromCategory('common');
    }
}

// 切换到交锋音乐
function playBattleMusic() {
    if (audioState.currentCategory !== 'Battle') {
        audioState.previousCategory = audioState.currentCategory;
        playRandomFromCategory('Battle');
    }
}

// 切换到魔女化音乐
function playWitchMusic() {
    if (audioState.currentCategory !== 'Witch') {
        audioState.previousCategory = audioState.currentCategory;
        playRandomFromCategory('Witch');
    }
}

// 恢复到之前的音乐类别
function restorePreviousMusic() {
    if (audioState.previousCategory) {
        playRandomFromCategory(audioState.previousCategory);
        audioState.previousCategory = null;
    }
}

// ========== 音量控制 ==========

// 设置背景音乐音量
function setBGMVolume(volume) {
    audioState.bgmVolume = Math.max(0, Math.min(1, volume));
    if (audioState.bgmPlayer && !audioState.isMuted) {
        audioState.bgmPlayer.volume = audioState.bgmVolume;
    }
    saveAudioSettings();
}

// 设置音效音量
function setSFXVolume(volume) {
    audioState.sfxVolume = Math.max(0, Math.min(1, volume));
    if (audioState.sfxPlayer) {
        audioState.sfxPlayer.volume = audioState.sfxVolume;
    }
    saveAudioSettings();
}

// 切换静音
function toggleMute() {
    audioState.isMuted = !audioState.isMuted;
    
    if (audioState.isMuted) {
        pauseBGM();
    } else {
        if (audioState.currentTrack) {
            resumeBGM();
        } else if (audioState.currentCategory) {
            playRandomFromCategory(audioState.currentCategory, false);
        }
    }
    
    saveAudioSettings();
    updateAudioUI();
    return audioState.isMuted;
}

// ========== 音效播放 ==========

// 音效对象池（避免频繁创建Audio对象）
const sfxPool = {};
const MAX_SFX_INSTANCES = 5; // 每种音效最多同时播放5个

// 播放音效
function playSFX(sfxPath) {
    if (audioState.isMuted) return;
    
    // 初始化该音效的对象池
    if (!sfxPool[sfxPath]) {
        sfxPool[sfxPath] = [];
    }
    
    // 查找可用的Audio实例（已结束播放的）
    let sfx = sfxPool[sfxPath].find(audio => audio.ended || audio.paused);
    
    // 如果没有可用的，且池未满，创建新实例
    if (!sfx && sfxPool[sfxPath].length < MAX_SFX_INSTANCES) {
        sfx = new Audio(sfxPath);
        sfxPool[sfxPath].push(sfx);
    }
    
    // 如果有可用实例，播放
    if (sfx) {
        sfx.volume = audioState.sfxVolume;
        sfx.currentTime = 0;
        sfx.play().catch(() => {});
    }
}

// 预定义音效
const SFX = {
    // UI音效
    hover: 'music/EFFECT/Hat.wav',           // 鼠标划过按钮
    mainClick: 'music/EFFECT/Bell.mp3',      // 主按钮点击（单人/多人游戏）
    mainClick2: 'music/EFFECT/Bell2.mp3',    // 角色选择确认
    subClick: 'music/EFFECT/hub_notification.mp3',  // 次要按钮点击（设置/规则/制作人员）
    swoosh: 'music/EFFECT/swoosh.mp3',       // 转场音效
    select: 'music/EFFECT/808 CH_2.wav',     // 选择切换音效（人数选择等）
    flip: 'music/EFFECT/flip.mp3',           // 翻牌/选择角色卡片音效
    flip2: 'music/EFFECT/flip_2.wav',        // 打开控制台音效
    float: 'music/EFFECT/float.mp3',         // 悬浮窗显示音效
    card: 'music/EFFECT/Card.mp3',           // 出牌音效
    // 脚步音效
    step1: 'music/EFFECT/Step1.wav',
    step2: 'music/EFFECT/Step2.wav',
    step3: 'music/EFFECT/Step3.wav',
    // 魔女化音效
    witchAppear: 'music/EFFECT/Witch APPEAR.mp3',
    // 魔女化变化音效
    cut: 'music/EFFECT/Cut.mp3',             // 受击音效（魔女化上涨）
    heal: 'music/EFFECT/Heal.mp3',           // 治愈音效（魔女化下降）
    // 交锋音效
    battleBurst: 'music/EFFECT/brust_in_battle.mp3',  // 触发交锋
    glass: 'music/EFFECT/glass.mp3',                   // 交锋胜利
    // 转场音效
    schoolBell: 'music/EFFECT/schl-bell-356847.mp3',  // 角色选择结束转场
    // 线索获取音效
    clap: 'music/EFFECT/clap.mp3',                     // 获得线索
    // 游戏音效（预留）
    click: 'sfx/click.mp3',
    confirm: 'sfx/confirm.mp3',
    cancel: 'sfx/cancel.mp3',
    magic: 'sfx/magic.mp3',
    confrontation: 'sfx/confrontation.mp3',
    witchify: 'sfx/witchify.mp3',
    victory: 'sfx/victory.mp3',
    defeat: 'sfx/defeat.mp3'
};

// 角色ID到语音文件名映射
const CHARACTER_VOICE_MAP = {
    emma: 'Ema',
    hiro: 'Hiro',
    coco: 'Coco',
    sherry: 'Sherry',
    hanna: 'Hanna',
    anan: 'Anan',
    noah: 'Noah',
    leiya: 'Leia',
    milia: 'Miria',
    nayeka: 'Nanoka',
    marg: 'Margo',
    arisa: 'Alisa',
    meruru: 'Meruru'
};

// 角色语音播放器（独立于普通音效，避免被打断）
let characterVoicePlayer = null;

// 播放角色介绍语音
function playCharacterVoice(charId) {
    if (audioState.isMuted) return;
    
    const voiceName = CHARACTER_VOICE_MAP[charId];
    if (!voiceName) return;
    
    const voicePath = `music/Character_voice/Introduce/${voiceName}.mp3`;
    
    // 停止之前的角色语音
    if (characterVoicePlayer) {
        characterVoicePlayer.pause();
        characterVoicePlayer.currentTime = 0;
    }
    
    // 创建新的播放器
    characterVoicePlayer = new Audio(voicePath);
    characterVoicePlayer.volume = audioState.sfxVolume;
    characterVoicePlayer.play().catch(() => {});
}

// 播放角色胜利语音
function playVictoryVoice(charId) {
    if (audioState.isMuted) return;
    
    const voiceName = CHARACTER_VOICE_MAP[charId];
    if (!voiceName) return;
    
    const voicePath = `music/Character_voice/Victory/${voiceName}.mp3`;
    
    if (characterVoicePlayer) {
        characterVoicePlayer.pause();
        characterVoicePlayer.currentTime = 0;
    }
    
    characterVoicePlayer = new Audio(voicePath);
    characterVoicePlayer.volume = audioState.sfxVolume;
    characterVoicePlayer.play().catch(() => {});
}

// 播放角色失败语音
function playDefeatVoice(charId) {
    if (audioState.isMuted) return;
    
    const voiceName = CHARACTER_VOICE_MAP[charId];
    if (!voiceName) return;
    
    const voicePath = `music/Character_voice/Defeat/${voiceName}.mp3`;
    
    if (characterVoicePlayer) {
        characterVoicePlayer.pause();
        characterVoicePlayer.currentTime = 0;
    }
    
    characterVoicePlayer = new Audio(voicePath);
    characterVoicePlayer.volume = audioState.sfxVolume;
    characterVoicePlayer.play().catch(() => {});
}

// 播放角色魔女化语音（带混响效果）
function playWitchVoice(charId) {
    if (audioState.isMuted) return;
    
    const voiceName = CHARACTER_VOICE_MAP[charId];
    if (!voiceName) return;
    
    const voicePath = `music/Character_voice/Witch/${voiceName}.mp3`;
    
    if (characterVoicePlayer) {
        characterVoicePlayer.pause();
        characterVoicePlayer.currentTime = 0;
    }
    
    // 本地文件系统下直接播放（无混响，CORS限制）
    if (window.location.protocol === 'file:') {
        characterVoicePlayer = new Audio(voicePath);
        characterVoicePlayer.volume = audioState.sfxVolume;
        characterVoicePlayer.play().catch(() => {});
        return;
    }
    
    // 使用 Web Audio API 添加混响效果
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    fetch(voicePath)
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
        .then(audioBuffer => {
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            
            // 创建混响效果（ConvolverNode）
            const convolver = audioContext.createConvolver();
            const reverbBuffer = createReverbImpulse(audioContext, 2, 2, false);
            convolver.buffer = reverbBuffer;
            
            // 创建干湿混合
            const dryGain = audioContext.createGain();
            const wetGain = audioContext.createGain();
            const masterGain = audioContext.createGain();
            
            dryGain.gain.value = 0.6;  // 原声
            wetGain.gain.value = 0.5;  // 混响
            masterGain.gain.value = audioState.sfxVolume;
            
            // 连接节点
            source.connect(dryGain);
            source.connect(convolver);
            convolver.connect(wetGain);
            dryGain.connect(masterGain);
            wetGain.connect(masterGain);
            masterGain.connect(audioContext.destination);
            
            source.start(0);
        })
        .catch(() => {
            // 降级：无混响播放
            characterVoicePlayer = new Audio(voicePath);
            characterVoicePlayer.volume = audioState.sfxVolume;
            characterVoicePlayer.play().catch(() => {});
        });
}

// 生成混响脉冲响应
function createReverbImpulse(audioContext, duration, decay, reverse) {
    const sampleRate = audioContext.sampleRate;
    const length = sampleRate * duration;
    const impulse = audioContext.createBuffer(2, length, sampleRate);
    const impulseL = impulse.getChannelData(0);
    const impulseR = impulse.getChannelData(1);
    
    for (let i = 0; i < length; i++) {
        const n = reverse ? length - i : i;
        impulseL[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
        impulseR[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
    }
    
    return impulse;
}

// 播放角色魔法语音（随机选择一个）
function playMagicVoice(charId) {
    if (audioState.isMuted) return;
    
    const voiceName = CHARACTER_VOICE_MAP[charId];
    if (!voiceName) return;
    
    // 魔法语音文件夹路径
    const magicFolder = `music/Character_voice/Magic/${voiceName}/`;
    
    // 预定义每个角色的魔法语音文件
    const MAGIC_VOICE_FILES = {
        emma: ['CommonTrial_Ema05121.mp3', 'CommonTrial_Ema05125.mp3', 'CommonTrial_Ema06192.mp3'],
        hiro: ['CommonTrial_Hiro00027.mp3', 'CommonTrial_Hiro00033.mp3', 'CommonTrial_Hiro06084.mp3'],
        coco: ['CommonTrial_Coco00923.mp3', 'CommonTrial_Coco00928.mp3', 'CommonTrial_Coco01272.mp3'],
        sherry: ['CommonTrial_Sherry01051.mp3', 'CommonTrial_Sherry01053.mp3', 'CommonTrial_Sherry01054.mp3'],
        hanna: ['CommonTrial_Hanna00571.mp3', 'CommonTrial_Hanna00574.mp3', 'CommonTrial_Hanna01139.mp3'],
        anan: ['CommonTrial_AnAn00406.mp3', 'CommonTrial_AnAn00411.mp3', 'CommonTrial_AnAn00757.mp3'],
        noah: ['CommonTrial_Noah00037.mp3', 'CommonTrial_Noah00038.mp3', 'CommonTrial_Noah00041.mp3'],
        leiya: ['CommonTrial_Leia00426.mp3', 'CommonTrial_Leia00427.mp3', 'CommonTrial_Leia00428.mp3'],
        milia: ['CommonTrial_Miria00283.mp3', 'CommonTrial_Miria00290.mp3', 'CommonTrial_Miria00918.mp3'],
        nayeka: ['CommonTrial_Nanoka00526.mp3', 'CommonTrial_Nanoka00527.mp3', 'CommonTrial_Nanoka00530.mp3'],
        marg: ['CommonTrial_Margo01195.mp3', 'CommonTrial_Margo01678.mp3', 'CommonTrial_Margo01682.mp3'],
        arisa: ['CommonTrial_Alisa00569.mp3', 'CommonTrial_Alisa00572.mp3', 'CommonTrial_Alisa01181.mp3'],
        meruru: ['CommonTrial_Meruru00923.mp3', 'CommonTrial_Meruru00926.mp3', 'CommonTrial_Meruru01120.mp3']
    };
    
    const files = MAGIC_VOICE_FILES[charId];
    if (!files || files.length === 0) return;
    
    // 随机选择一个语音文件
    const randomFile = files[Math.floor(Math.random() * files.length)];
    const voicePath = magicFolder + randomFile;
    
    if (characterVoicePlayer) {
        characterVoicePlayer.pause();
        characterVoicePlayer.currentTime = 0;
    }
    
    characterVoicePlayer = new Audio(voicePath);
    characterVoicePlayer.volume = audioState.sfxVolume;
    characterVoicePlayer.play().catch(() => {});
}

// 魔法音效文件映射（charId -> 文件名）
const MAGIC_SFX_MAP = {
    emma: 'Ema',
    hiro: 'Hiro',
    coco: 'Coco',
    sherry: 'Sherry',
    hanna: 'Hanna',
    anan: 'Anan',
    noah: 'Noah',
    leiya: 'Leia',
    milia: 'Miria',
    nayeka: 'Nanoka',
    marg: 'Margo',
    arisa: 'Alisa'
    // meruru 没有魔法音效
};

// 播放魔法音效（带混响）
function playMagicSFX(charId) {
    if (audioState.isMuted) return;
    
    const sfxName = MAGIC_SFX_MAP[charId];
    if (!sfxName) return; // 梅露露等没有音效的角色
    
    const sfxPath = `music/EFFECT/Magic/${sfxName}.mp3`;
    
    // 本地文件系统下直接播放（无混响）
    if (window.location.protocol === 'file:') {
        const sfx = new Audio(sfxPath);
        sfx.volume = audioState.sfxVolume;
        sfx.play().catch(() => {});
        return;
    }
    
    // 使用 Web Audio API 添加混响效果
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    fetch(sfxPath)
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
        .then(audioBuffer => {
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            
            // 创建混响效果
            const convolver = audioContext.createConvolver();
            const reverbBuffer = createReverbImpulse(audioContext, 1.5, 2.5, false);
            convolver.buffer = reverbBuffer;
            
            // 干湿混合
            const dryGain = audioContext.createGain();
            const wetGain = audioContext.createGain();
            const masterGain = audioContext.createGain();
            
            dryGain.gain.value = 0.7;  // 原声
            wetGain.gain.value = 0.4;  // 混响（湿度）
            masterGain.gain.value = audioState.sfxVolume;
            
            // 连接节点
            source.connect(dryGain);
            source.connect(convolver);
            convolver.connect(wetGain);
            dryGain.connect(masterGain);
            wetGain.connect(masterGain);
            masterGain.connect(audioContext.destination);
            
            source.start(0);
        })
        .catch(() => {
            // 降级：无混响播放
            const sfx = new Audio(sfxPath);
            sfx.volume = audioState.sfxVolume;
            sfx.play().catch(() => {});
        });
}

// 停止角色语音
function stopCharacterVoice() {
    if (characterVoicePlayer) {
        characterVoicePlayer.pause();
        characterVoicePlayer.currentTime = 0;
        characterVoicePlayer = null;
    }
}

// 播放悬停音效
function playHoverSFX() {
    playSFX(SFX.hover);
}

// 播放主按钮点击音效
function playMainClickSFX() {
    playSFX(SFX.mainClick);
}

// 播放角色选择确认音效
function playConfirmSFX() {
    playSFX(SFX.mainClick2);
}

// 播放次要按钮点击音效
function playSubClickSFX() {
    playSFX(SFX.subClick);
}

// 播放选择切换音效
function playSelectSFX() {
    playSFX(SFX.select);
}

// 播放翻牌/角色卡片选择音效
function playFlipSFX() {
    playSFX(SFX.flip);
}

// 播放打开控制台音效
function playFlip2SFX() {
    playSFX(SFX.flip2);
}

// 播放悬浮窗显示音效
function playFloatSFX() {
    playSFX(SFX.float);
}

// 播放出牌音效
function playCardSFX() {
    playSFX(SFX.card);
}

// 播放随机脚步音效
function playStepSFX() {
    const steps = [SFX.step1, SFX.step2, SFX.step3];
    const randomStep = steps[Math.floor(Math.random() * steps.length)];
    playSFX(randomStep);
}

// 播放魔女化出现音效
function playWitchAppearSFX() {
    playSFX(SFX.witchAppear);
}

// ========== 设置存储 ==========

function saveAudioSettings() {
    const settings = {
        bgmVolume: audioState.bgmVolume,
        sfxVolume: audioState.sfxVolume,
        isMuted: audioState.isMuted
    };
    localStorage.setItem('witchGame_audioSettings', JSON.stringify(settings));
}

function loadAudioSettings() {
    try {
        const saved = localStorage.getItem('witchGame_audioSettings');
        if (saved) {
            const settings = JSON.parse(saved);
            audioState.bgmVolume = settings.bgmVolume ?? 0.5;
            audioState.sfxVolume = settings.sfxVolume ?? 0.7;
            audioState.isMuted = settings.isMuted ?? false;
        }
    } catch (e) {
        console.log('[Audio] 无法加载音频设置');
    }
}

// ========== UI更新 ==========

function updateAudioUI() {
    // 更新静音按钮图标
    const muteBtn = document.getElementById('mute-btn');
    if (muteBtn) {
        muteBtn.innerHTML = audioState.isMuted ? '🔇' : '🔊';
        muteBtn.title = audioState.isMuted ? '取消静音' : '静音';
    }
    
    // 更新音量滑块
    const bgmSlider = document.getElementById('bgm-volume-slider');
    if (bgmSlider) {
        bgmSlider.value = audioState.bgmVolume * 100;
    }
    
    const sfxSlider = document.getElementById('sfx-volume-slider');
    if (sfxSlider) {
        sfxSlider.value = audioState.sfxVolume * 100;
    }
    
    // 更新音量显示
    const bgmValue = document.getElementById('bgm-volume-value');
    if (bgmValue) {
        bgmValue.textContent = Math.round(audioState.bgmVolume * 100) + '%';
    }
    
    const sfxValue = document.getElementById('sfx-volume-value');
    if (sfxValue) {
        sfxValue.textContent = Math.round(audioState.sfxVolume * 100) + '%';
    }
    
    // 更新当前曲目名称
    updateCurrentTrackDisplay();
}

// 更新当前曲目显示
function updateCurrentTrackDisplay() {
    const trackNameEl = document.getElementById('current-track-name');
    if (trackNameEl) {
        if (audioState.currentTrack) {
            // 从路径中提取文件名
            const fileName = audioState.currentTrack.split('/').pop().replace('.mp3', '');
            trackNameEl.textContent = fileName;
        } else {
            trackNameEl.textContent = '--';
        }
    }
}

// 切换音乐面板显示
function toggleMusicPanel() {
    const panel = document.getElementById('music-panel');
    if (panel) {
        panel.classList.toggle('hidden');
        if (!panel.classList.contains('hidden')) {
            updateAudioUI();
        }
    }
}

// 跳到下一首
function skipToNextTrack() {
    if (audioState.currentCategory) {
        playRandomFromCategory(audioState.currentCategory);
    }
}

// ========== 导出 ==========
window.audioState = audioState;
window.initAudio = initAudio;
window.playHubMusic = playHubMusic;
window.playCommonMusic = playCommonMusic;
window.playBattleMusic = playBattleMusic;
window.playWitchMusic = playWitchMusic;
window.restorePreviousMusic = restorePreviousMusic;
window.playBGM = playBGM;
window.pauseBGM = pauseBGM;
window.resumeBGM = resumeBGM;
window.stopBGM = stopBGM;
window.setBGMVolume = setBGMVolume;
window.setSFXVolume = setSFXVolume;
window.toggleMute = toggleMute;
window.playSFX = playSFX;
window.playHoverSFX = playHoverSFX;
window.playMainClickSFX = playMainClickSFX;
window.playConfirmSFX = playConfirmSFX;
window.playSubClickSFX = playSubClickSFX;
window.playSelectSFX = playSelectSFX;
window.playFlipSFX = playFlipSFX;
window.updateAudioUI = updateAudioUI;
window.playCharacterVoice = playCharacterVoice;
window.stopCharacterVoice = stopCharacterVoice;
window.playStepSFX = playStepSFX;
window.playWitchAppearSFX = playWitchAppearSFX;
window.playVictoryVoice = playVictoryVoice;
window.playDefeatVoice = playDefeatVoice;
window.playWitchVoice = playWitchVoice;
window.playMagicVoice = playMagicVoice;
window.activateWitchFilter = activateWitchFilter;
window.deactivateWitchFilter = deactivateWitchFilter;
window.playMagicSFX = playMagicSFX;
