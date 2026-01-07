/**
 * 魔法少女的魔女审判 - 网络模块 (MQTT)
 */

// ========== MQTT配置 ==========
const MQTT_CONFIG = {
    brokers: [
        { url: 'wss://broker.emqx.io:8084/mqtt', name: 'EMQX' },
        { url: 'wss://broker.hivemq.com:8884/mqtt', name: 'HiveMQ' }
    ],
    currentBrokerIndex: 0,
    topicPrefix: 'witch-game'
};

// ========== 网络状态 ==========
let networkState = {
    mode: 'local',          // 'local' | 'online'
    isHost: false,          // 是否是房主
    localPlayerId: null,    // 本地玩家ID (1-4)
    roomCode: null,         // 房间码
    client: null,           // MQTT客户端
    connected: false,       // 是否已连接
    players: {},            // 房间内玩家 { oderId: { id, name, ready, character } }
    pendingCallbacks: {},   // 等待响应的回调 { requestId: { callback, timeout } }
    reconnectAttempts: 0,
    maxReconnectAttempts: 3
};

// ========== 生成房间码 ==========
function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// ========== 生成请求ID ==========
function generateRequestId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// ========== 获取MQTT主题 ==========
function getTopic(subTopic) {
    return `${MQTT_CONFIG.topicPrefix}/${networkState.roomCode}/${subTopic}`;
}

// ========== 连接MQTT ==========
async function connectMQTT() {
    return new Promise((resolve, reject) => {
        const broker = MQTT_CONFIG.brokers[MQTT_CONFIG.currentBrokerIndex];
        console.log(`[MQTT] 正在连接 ${broker.name}...`);
        
        const clientId = 'witch_' + Math.random().toString(16).substr(2, 8);
        
        try {
            networkState.client = mqtt.connect(broker.url, {
                clientId: clientId,
                clean: true,
                connectTimeout: 10000,
                reconnectPeriod: 0  // 禁用自动重连，我们手动处理
            });
            
            networkState.client.on('connect', () => {
                console.log('[MQTT] 连接成功');
                networkState.connected = true;
                networkState.reconnectAttempts = 0;
                resolve();
            });
            
            networkState.client.on('error', (err) => {
                console.error('[MQTT] 连接错误:', err);
                networkState.connected = false;
                reject(err);
            });
            
            networkState.client.on('close', () => {
                console.log('[MQTT] 连接关闭');
                networkState.connected = false;
            });
            
            networkState.client.on('message', (topic, message) => {
                handleMQTTMessage(topic, message.toString());
            });
            
        } catch (err) {
            reject(err);
        }
    });
}

// ========== 断开MQTT ==========
function disconnectMQTT() {
    if (networkState.client) {
        networkState.client.end();
        networkState.client = null;
    }
    networkState.connected = false;
    networkState.roomCode = null;
    networkState.isHost = false;
    networkState.players = {};
}

// ========== 创建房间 ==========
async function createRoom() {
    try {
        // 连接MQTT
        if (!networkState.connected) {
            await connectMQTT();
        }
        
        // 生成房间码
        networkState.roomCode = generateRoomCode();
        networkState.isHost = true;
        networkState.localPlayerId = 1;
        networkState.mode = 'online';
        
        // 订阅房间主题
        subscribeToRoom();
        
        // 添加自己到玩家列表
        networkState.players[1] = {
            id: 1,
            name: '房主',
            ready: false,
            character: null,
            isHost: true
        };
        
        console.log(`[房间] 创建成功: ${networkState.roomCode}`);
        return networkState.roomCode;
        
    } catch (err) {
        console.error('[房间] 创建失败:', err);
        throw err;
    }
}

// ========== 加入房间 ==========
async function joinRoom(roomCode) {
    try {
        // 连接MQTT
        if (!networkState.connected) {
            await connectMQTT();
        }
        
        networkState.roomCode = roomCode.toUpperCase();
        networkState.isHost = false;
        networkState.mode = 'online';
        
        // 订阅房间主题
        subscribeToRoom();
        
        // 发送加入请求
        return new Promise((resolve, reject) => {
            const requestId = generateRequestId();
            
            // 设置超时
            const timeout = setTimeout(() => {
                delete networkState.pendingCallbacks[requestId];
                reject(new Error('加入房间超时，房间可能不存在'));
            }, 5000);
            
            networkState.pendingCallbacks[requestId] = {
                callback: (response) => {
                    clearTimeout(timeout);
                    if (response.success) {
                        networkState.localPlayerId = response.playerId;
                        networkState.players = response.players;
                        console.log(`[房间] 加入成功，玩家ID: ${response.playerId}`);
                        resolve(response);
                    } else {
                        reject(new Error(response.error || '加入失败'));
                    }
                },
                timeout: timeout
            };
            
            // 发送加入请求
            sendMessage('join', {
                requestId: requestId,
                name: '玩家'
            });
        });
        
    } catch (err) {
        console.error('[房间] 加入失败:', err);
        throw err;
    }
}

// ========== 订阅房间主题 ==========
function subscribeToRoom() {
    if (!networkState.client || !networkState.roomCode) return;
    
    const topics = [
        getTopic('state'),      // 游戏状态
        getTopic('action'),     // 玩家操作
        getTopic('room'),       // 房间管理
        getTopic('passive')     // 被动技能
    ];
    
    topics.forEach(topic => {
        networkState.client.subscribe(topic, (err) => {
            if (err) {
                console.error(`[MQTT] 订阅失败: ${topic}`, err);
            } else {
                console.log(`[MQTT] 已订阅: ${topic}`);
            }
        });
    });
}

// ========== 发送消息 ==========
function sendMessage(type, data, subTopic = 'action') {
    if (!networkState.client || !networkState.connected) {
        console.error('[MQTT] 未连接，无法发送消息');
        return;
    }
    
    const message = {
        type: type,
        senderId: networkState.localPlayerId,
        timestamp: Date.now(),
        ...data
    };
    
    const topic = getTopic(subTopic);
    networkState.client.publish(topic, JSON.stringify(message));
    console.log(`[MQTT] 发送: ${type}`, data);
}

// ========== 处理收到的消息 ==========
function handleMQTTMessage(topic, messageStr) {
    try {
        const message = JSON.parse(messageStr);
        
        // 忽略自己发送的消息（除了某些需要确认的）
        if (message.senderId === networkState.localPlayerId && 
            !['join_response', 'state_sync'].includes(message.type)) {
            return;
        }
        
        console.log(`[MQTT] 收到: ${message.type}`, message);
        
        // 根据消息类型处理
        switch (message.type) {
            // ===== 房间管理 =====
            case 'join':
                handleJoinRequest(message);
                break;
            case 'join_response':
                handleJoinResponse(message);
                break;
            case 'player_joined':
                handlePlayerJoined(message);
                break;
            case 'player_left':
                handlePlayerLeft(message);
                break;
            case 'player_ready':
                handlePlayerReady(message);
                break;
            case 'character_selected':
                handleCharacterSelected(message);
                break;
            case 'game_start':
                handleGameStart(message);
                break;
                
            // ===== 游戏操作 =====
            case 'play_card':
                handleRemotePlayCard(message);
                break;
            case 'select_direction':
                handleRemoteSelectDirection(message);
                break;
            case 'select_resource':
                handleRemoteSelectResource(message);
                break;
            case 'cast_magic':
                handleRemoteCastMagic(message);
                break;
            case 'confrontation_press':
                handleRemoteConfrontationPress(message);
                break;
                
            // ===== 汉娜浮空 =====
            case 'hanna_step_selected':
                handleRemoteHannaStepSelected(message);
                break;
            case 'hanna_direction_selected':
                handleRemoteHannaDirectionSelected(message);
                break;
                
            // ===== 被动技能 =====
            case 'passive_request':
                handlePassiveRequest(message);
                break;
            case 'passive_response':
                handlePassiveResponse(message);
                break;
                
            // ===== 状态同步 =====
            case 'state_sync':
                handleStateSync(message);
                break;
                
            default:
                console.log(`[MQTT] 未知消息类型: ${message.type}`);
        }
        
    } catch (err) {
        console.error('[MQTT] 消息解析错误:', err);
    }
}

// ========== 房间管理消息处理 ==========

// 处理加入请求（房主处理）
function handleJoinRequest(message) {
    if (!networkState.isHost) return;
    
    // 检查房间是否已满
    const playerCount = Object.keys(networkState.players).length;
    if (playerCount >= 4) {
        sendMessage('join_response', {
            requestId: message.requestId,
            success: false,
            error: '房间已满'
        }, 'room');
        return;
    }
    
    // 分配玩家ID
    const newPlayerId = playerCount + 1;
    networkState.players[newPlayerId] = {
        id: newPlayerId,
        name: message.name || `玩家${newPlayerId}`,
        ready: false,
        character: null,
        isHost: false
    };
    
    // 发送响应
    sendMessage('join_response', {
        requestId: message.requestId,
        success: true,
        playerId: newPlayerId,
        players: networkState.players
    }, 'room');
    
    // 广播玩家加入
    sendMessage('player_joined', {
        playerId: newPlayerId,
        player: networkState.players[newPlayerId],
        players: networkState.players
    }, 'room');
    
    // 更新房间UI
    if (typeof updateRoomUI === 'function') {
        updateRoomUI();
    }
}

// 处理加入响应
function handleJoinResponse(message) {
    const pending = networkState.pendingCallbacks[message.requestId];
    if (pending) {
        pending.callback(message);
        delete networkState.pendingCallbacks[message.requestId];
    }
}

// 处理玩家加入广播
function handlePlayerJoined(message) {
    networkState.players = message.players;
    if (typeof updateRoomUI === 'function') {
        updateRoomUI();
    }
}

// 处理玩家离开
function handlePlayerLeft(message) {
    delete networkState.players[message.playerId];
    if (typeof updateRoomUI === 'function') {
        updateRoomUI();
    }
}

// 处理玩家准备
function handlePlayerReady(message) {
    if (networkState.players[message.playerId]) {
        networkState.players[message.playerId].ready = message.ready;
    }
    if (typeof updateRoomUI === 'function') {
        updateRoomUI();
    }
}

// 处理角色选择
function handleCharacterSelected(message) {
    if (networkState.players[message.playerId]) {
        networkState.players[message.playerId].character = message.characterId;
    }
    if (typeof updateRoomUI === 'function') {
        updateRoomUI();
    }
}

// 处理游戏开始
function handleGameStart(message) {
    if (typeof startOnlineGame === 'function') {
        startOnlineGame(message.gameState);
    }
}

// ========== 游戏操作消息处理 ==========

function handleRemotePlayCard(message) {
    if (networkState.isHost && typeof processRemotePlayCard === 'function') {
        processRemotePlayCard(message.playerId, message.cardIndex);
    }
}

function handleRemoteSelectDirection(message) {
    if (networkState.isHost && typeof processRemoteSelectDirection === 'function') {
        processRemoteSelectDirection(message.playerId, message.direction);
    }
}

function handleRemoteSelectResource(message) {
    if (networkState.isHost && typeof processRemoteSelectResource === 'function') {
        processRemoteSelectResource(message.playerId, message.selection);
    }
}

function handleRemoteCastMagic(message) {
    if (networkState.isHost && typeof processRemoteCastMagic === 'function') {
        processRemoteCastMagic(message.playerId);
    }
}

function handleRemoteConfrontationPress(message) {
    if (networkState.isHost && typeof processRemoteConfrontationPress === 'function') {
        processRemoteConfrontationPress(message.playerId, message.pressTime);
    }
}

// ========== 汉娜浮空消息处理 ==========

function handleRemoteHannaStepSelected(message) {
    if (networkState.isHost && typeof processRemoteHannaStepSelected === 'function') {
        processRemoteHannaStepSelected(message.playerId, message.steps, message.isEnhanced);
    }
}

function handleRemoteHannaDirectionSelected(message) {
    if (networkState.isHost && typeof processRemoteHannaDirectionSelected === 'function') {
        processRemoteHannaDirectionSelected(message.playerId, message.targetPos);
    }
}

// ========== 被动技能消息处理 ==========

// 被动技能请求队列（房主用）
let passiveRequestQueue = {};

function handlePassiveRequest(message) {
    // 检查是否是发给自己的
    if (message.targetPlayerId !== networkState.localPlayerId) return;
    
    // 显示被动技能决策UI
    if (typeof showRemotePassiveDecision === 'function') {
        showRemotePassiveDecision(message);
    }
}

function handlePassiveResponse(message) {
    // 房主处理被动技能响应
    const requestId = message.requestId;
    if (passiveRequestQueue[requestId]) {
        const { callback, timeout } = passiveRequestQueue[requestId];
        clearTimeout(timeout);
        delete passiveRequestQueue[requestId];
        callback(message.activate, message.data);
    }
}

// 房主发送被动技能请求
function sendPassiveRequest(skillType, targetPlayerId, data, onResponse, timeoutMs = 10000) {
    const requestId = generateRequestId();
    
    // 设置超时
    const timeout = setTimeout(() => {
        if (passiveRequestQueue[requestId]) {
            delete passiveRequestQueue[requestId];
            onResponse(false, null); // 超时默认不发动
        }
    }, timeoutMs);
    
    passiveRequestQueue[requestId] = {
        callback: onResponse,
        timeout: timeout
    };
    
    sendMessage('passive_request', {
        requestId: requestId,
        skillType: skillType,
        targetPlayerId: targetPlayerId,
        ...data
    }, 'passive');
}

// 玩家发送被动技能响应
function sendPassiveResponse(requestId, activate, data = {}) {
    sendMessage('passive_response', {
        requestId: requestId,
        activate: activate,
        data: data
    }, 'passive');
}

// ========== 状态同步 ==========

function handleStateSync(message) {
    // 非房主接收状态同步
    if (!networkState.isHost && typeof syncGameState === 'function') {
        syncGameState(message.gameState);
    }
}

// 房主广播游戏状态
function broadcastGameState() {
    if (!networkState.isHost) return;
    
    sendMessage('state_sync', {
        gameState: getSerializableGameState()
    }, 'state');
}

// 获取可序列化的游戏状态
function getSerializableGameState() {
    // 创建gameState的深拷贝，移除不可序列化的内容
    const state = JSON.parse(JSON.stringify(gameState));
    
    // 移除Set类型（需要转换）
    if (state.players) {
        state.players.forEach(p => {
            if (p.visitedCells) {
                p.visitedCells = Array.from(p.visitedCells || []);
            }
        });
    }
    
    // 添加moveState用于同步移动状态（汉娜浮空等）
    if (typeof moveState !== 'undefined') {
        state._moveState = {
            isMoving: moveState.isMoving,
            playerId: moveState.player ? moveState.player.id : null,
            remainingSteps: moveState.remainingSteps,
            path: moveState.path,
            previousPosition: moveState.previousPosition,
            lastPassedCell: moveState.lastPassedCell,
            isHannaFloat: moveState.isHannaFloat || false,
            isHannaEnhanced: moveState.isHannaEnhanced || false,
            skipConfrontation: moveState.skipConfrontation || false
        };
    }
    
    return state;
}

// ========== 辅助函数 ==========

// 检查是否是本地玩家
function isLocalPlayer(player) {
    if (networkState.mode === 'local') {
        return !player.isAI;
    }
    return player.id === networkState.localPlayerId;
}

// 检查是否是当前玩家的回合
function isMyTurn() {
    if (networkState.mode === 'local') {
        const currentPlayer = gameState.players[gameState.currentPlayerIndex];
        return currentPlayer && !currentPlayer.isAI;
    }
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    return currentPlayer && currentPlayer.id === networkState.localPlayerId;
}

// 获取本地玩家
function getLocalPlayer() {
    if (networkState.mode === 'local') {
        return gameState.players.find(p => !p.isAI);
    }
    return gameState.players.find(p => p.id === networkState.localPlayerId);
}

// ========== 导出 ==========
window.networkState = networkState;
window.createRoom = createRoom;
window.joinRoom = joinRoom;
window.disconnectMQTT = disconnectMQTT;
window.sendMessage = sendMessage;
window.broadcastGameState = broadcastGameState;
window.isLocalPlayer = isLocalPlayer;
window.isMyTurn = isMyTurn;
window.getLocalPlayer = getLocalPlayer;
window.sendPassiveRequest = sendPassiveRequest;
window.sendPassiveResponse = sendPassiveResponse;
