# 魔女审判的游戏元素
这是一个《魔法少女的魔女审判》的纯前端小游戏。在这里，玩家需要与对手打出点数牌，移动到相应格子上收集证物、证词、人心，最终收集证据达标或者没有“魔女化”的玩家将会获得胜利！


## 魔女化
玩家有一个“魔女化”的进度条。当这个进度条达到100时，玩家将会魔女化。魔女化在下一个回合结束后被处刑。

这个魔女化的进度条只会由以下两点而增加：
1. 手里的证据。每回合，收集的资源都会为魔女化增加0.5点进度。
2. 魔法。玩家有各自的魔法技能，而使用技能后，将会大幅增加魔女化进度。这个进度依据不同角色的能力而变化。

魔女化后，玩家的魔法技能将会被大幅提升，使用一次后作废。

## 资源三维表
玩家需要收集三种证据。每一回合，玩家都会打出一张手中的点数牌，然后移动相应的步数。收集的三个资源正常达标线为6，但是如果每种资源超过了6，多余的部分将会因为“心理压力”，在每一回合按照每一个2的进度增加魔女化。但是当三个资源都达标后，玩家宣告胜利。

## 点数牌
每一回合分为X小轮，每个玩家手中有X+1张点数牌（1~6）。每一个小轮，玩家和对手轮流打出一张点数牌，然后按照点数的大小移动相应格数，然后获得格子上的证据资源。当然，有一些特殊格子是可以停下来休息的，在这里甚至可以选择一个证据删除掉。

每一回合的点数牌从3-6随机。也就是有随机2-5小轮。

点数牌对手和自己都可见

## 格子
棋盘是一个环，中间穿插一个十字路。设计如下所示：

 1  2  3  4  5  6
20       25     7
19       26     8
18 21 22 23 24  9
17       27    10
16 15 14 13 12 11

当然，可以根据玩家（最多四人）的数量，自定义棋盘的大小。

玩家在分叉路时，可以选择自己的前进方向，但是不可以选择回头路。

每一回合，被踩过的格子都会被随机刷新。当一个格子被踩过后且还处在同一回合中，其他人（包括自己）不能再次触发格子的效果。
格子有以下三种：

1. 地下室：自选两个资源加入手中。
2. 现场： 获得随机的两个资源。当然这个随机在每回合都会刷新
3. 娱乐室： 休息，可以选择删除一个资源。

## 交锋
当两名玩家相遇或经过后，将会触发交锋。此时两个玩家需要在灯变亮后看准时机按下按钮，反应最快的玩家将会选择夺取对方的两个证物。如果灯还没亮就交锋将会直接失败。失败的玩家+5魔女化进度

## 魔法
每一个角色都有自己的魔法。有的魔法是主动触发，有的魔法必须被动才能触发，有的是固有技能。

比如，夏目安安的魔法是**主动触发**，可以在任意时间触发，但是有每回合限用一次和+10魔女化的惩罚。夏目安安可以洗脑，强制对手打出安安指定的点数牌。

比如，莲见蕾雅的魔法是**被动触发**。只有对手来到分叉口时，系统应该先询问具有被动技能的蕾雅要不要触发自己的技能。蕾雅+10魔女化惩罚，可以“视线诱导”来强制对手走向自己让他走的方向
。
比如，冰上梅露露的魔法就是**固有技能**。每当她停留在娱乐室或地下室后，她的魔女化进度的3点转移到对手身上。

## 结束
胜利： 玩家需要收集到每种证据至少六个才可以宣告胜利。胜利后，其他玩家继续角逐出名词。失败的玩家名次倒序排。

失败： 玩家魔女化后的第二个回合结束如果没有宣告胜利，将会宣告失败。失败后，其他玩家继续角逐出名词，失败的玩家名次倒序排。


# 魔女审判的模块化设置

## 玩家数据结构
```
Player {
  id: 玩家唯一标识
  name: 玩家名称
  character: 角色信息 {
    name: 角色名（夏目安安/莲见蕾雅/冰上梅露露等）
    magicType: 魔法类型（active/passive/innate）
    magicName: 魔法名称
    magicDescription: 魔法描述
    magicCost: 魔女化惩罚值
    magicUsedThisRound: 本回合是否已使用（主动技能用）
  }
  
  position: 当前棋盘位置ID
  resources: 资源持有 {
    evidence: 证物数量
    testimony: 证词数量
    heart: 人心数量
  }
  
  witchification: 魔女化进度（0-100）
  isWitchified: 是否已魔女化
  witchifiedRound: 魔女化时的回合数（用于判断处刑）
  
  handCards: 当前手牌数组 [1-6的点数]
  isEliminated: 是否已被淘汰
  rank: 最终名次
}
```

## 棋盘数据结构
```
Board {
  size: 棋盘规模配置 {
    outerRing: 外环格子数
    innerCross: 十字路格子数
  }
  
  cells: 格子数组 [{
    id: 格子唯一ID
    type: 格子类型（basement/scene/lounge）
    connections: 相邻格子ID数组
    isFork: 是否为分叉点
    
    // 当回合状态
    isTriggered: 本回合是否已被踩过
    triggeredBy: 触发者玩家ID
    
    // scene类型专用
    randomResources: 本回合随机资源 [resource1, resource2]
  }]
  
  forkPoints: 分叉点ID数组（用于快速查询）
}

格子类型说明：
- basement（地下室）: 自选两个资源
- scene（现场）: 获得随机两个资源
- lounge（娱乐室）: 休息，可删除一个资源
```

## 游戏管理器数据结构
```
GameManager {
  // 基础状态
  gameId: 游戏唯一标识
  status: 游戏状态（waiting/playing/ended）
  playerCount: 玩家数量（2-4）
  
  // 回合管理
  currentRound: 当前回合数
  currentSubRound: 当前小轮数
  totalSubRounds: 本回合总小轮数（2-5）
  currentPlayerIndex: 当前行动玩家索引
  turnOrder: 玩家行动顺序数组
  
  // 玩家列表
  players: Player数组
  activePlayers: 未淘汰玩家ID数组
  
  // 棋盘
  board: Board实例
  
  // 事件队列（用于处理交锋、被动技能等）
  pendingEvents: [{
    type: 事件类型（confrontation/passiveSkill/fork）
    involvedPlayers: 涉及玩家ID数组
    data: 事件相关数据
  }]
  
  // 历史记录（用于回放/调试）
  actionHistory: 行动记录数组
}
```

## 回合流程结构
```
RoundFlow {
  phases: [
    "roundStart"      // 回合开始：刷新格子、发牌
    "subRoundLoop"    // 小轮循环
    "roundEnd"        // 回合结束：结算魔女化
  ]
  
  subRoundPhases: [
    "checkPassiveSkills"  // 检查被动技能触发条件
    "playCard"            // 打出点数牌
    "move"                // 移动（含分叉选择）
    "checkConfrontation"  // 检查交锋
    "triggerCell"         // 触发格子效果
    "checkActiveSkills"   // 主动技能使用窗口
  ]
}
```

## AI行为结构
```
AIBehavior {
  difficulty: 难度等级（easy/normal/hard）
  personality: AI性格 {
    aggressive: 激进度（0-1，影响交锋和抢夺决策）
    cautious: 谨慎度（0-1，影响魔女化风险评估）
    strategic: 策略性（0-1，影响路径规划深度）
  }
  
  decisionMakers: {
    // 选牌决策
    cardSelection: (handCards, gameState) => selectedCard
    
    // 分叉路选择
    forkChoice: (availablePaths, gameState) => chosenPath
    
    // 地下室资源选择
    basementChoice: (currentResources, witchification) => [resource1, resource2]
    
    // 娱乐室删除选择
    loungeChoice: (currentResources, witchification) => resourceToDelete | null
    
    // 主动技能使用判断
    activeSkillDecision: (gameState) => shouldUse
    
    // 交锋反应（模拟反应时间）
    confrontationReaction: (difficulty) => reactionTime
  }
  
  // 评估函数
  evaluators: {
    pathValue: 评估路径上格子的价值
    resourcePriority: 评估当前最需要的资源类型
    threatLevel: 评估其他玩家的威胁程度
    witchRisk: 评估魔女化风险
  }
}
```

## 交锋系统结构
```
ConfrontationSystem {
  state: 交锋状态（waiting/lightOn/resolved）
  participants: [playerId1, playerId2]
  
  lightDelay: 灯亮延迟时间（随机1-3秒）
  lightOnTime: 灯亮的时间戳
  
  reactions: {
    [playerId]: {
      pressTime: 按下时间戳
      isTooEarly: 是否抢按（灯亮前按下）
    }
  }
  
  result: {
    winner: 胜者ID（null表示都抢按）
    loser: 败者ID
    stolenResources: 被抢夺的资源
  }
}
```

## 装饰性音乐数据结构
```
AudioManager {
  bgm: {
    menu: 菜单BGM
    playing: 游戏中BGM
    tension: 紧张时刻BGM（魔女化接近100时）
    victory: 胜利BGM
    defeat: 失败BGM
  }
  
  sfx: {
    cardPlay: 打牌音效
    move: 移动音效
    cellTrigger: {
      basement: 地下室音效
      scene: 现场音效
      lounge: 娱乐室音效
    }
    confrontation: {
      start: 交锋开始
      lightOn: 灯亮
      win: 交锋胜利
      lose: 交锋失败
    }
    magic: 魔法使用音效
    witchification: 魔女化警告音效
    elimination: 处刑音效
  }
  
  settings: {
    bgmVolume: BGM音量（0-1）
    sfxVolume: 音效音量（0-1）
    isMuted: 是否静音
  }
}
```

## 装饰性UI数据结构
```
UIManager {
  screens: {
    menu: 主菜单界面
    characterSelect: 角色选择界面
    game: 游戏主界面
    result: 结算界面
  }
  
  gameUI: {
    board: {
      cellSprites: 格子精灵/样式
      playerTokens: 玩家棋子
      pathHighlight: 可移动路径高亮
    }
    
    playerPanel: {
      portrait: 角色头像
      resourceBars: 三维资源条
      witchGauge: 魔女化进度条（带警告动画）
      handCards: 手牌显示区
    }
    
    actionUI: {
      cardSelector: 选牌界面
      forkSelector: 分叉选择界面
      resourcePicker: 资源选择界面（地下室/娱乐室）
      skillButton: 技能按钮
    }
    
    confrontationUI: {
      vsScreen: 对决画面
      lightIndicator: 灯光指示器
      reactionButton: 反应按钮
      resultDisplay: 结果展示
    }
    
    notifications: {
      turnIndicator: 回合/小轮提示
      eventPopup: 事件弹窗
      skillActivation: 技能发动特效
    }
  }
  
  animations: {
    tokenMove: 棋子移动动画
    resourceGain: 资源获得动画
    resourceLose: 资源失去动画
    witchProgress: 魔女化进度变化动画
    magicEffect: 魔法效果动画
    elimination: 处刑动画
  }
  
  theme: {
    colorScheme: 配色方案
    fontFamily: 字体
    cellColors: 不同格子类型的颜色
  }
}
```