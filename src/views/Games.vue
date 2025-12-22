<template>
  <div class="games-container">
    <div class="games-header">
      <h2>鱼游</h2>
      <p class="subtitle">摸鱼派有很多在线小游戏陪你打发时间，赢积分！</p>
    </div>
    <div class="games-content">
      <el-row :gutter="8">
        <el-col
          :xs="24"
          :sm="12"
          :md="8"
          :lg="6"
          v-for="game in games"
          :key="game.name"
        >
          <div class="game-card" @click="openGame(game.url)">
            <div class="game-card-content">
              <div class="game-logo">
                <img
                  v-if="!game.logo.startsWith('emoji:')"
                  :src="game.logo"
                  :alt="game.name"
                />
                <span v-else class="emoji-logo">{{
                  game.logo.replace("emoji:", "")
                }}</span>
              </div>
              <div class="game-info">
                <div class="game-info-main">
                  <h3 class="game-title">{{ game.name }}</h3>
                  <p class="game-description">{{ game.description }}</p>
                </div>
                <div class="game-action">
                  <el-button type="primary" text>
                    开始游戏
                    <el-icon class="el-icon--right"><ArrowRight /></el-icon>
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { ArrowRight } from "@element-plus/icons-vue";

const games = ref([

  {
    name: "《进化-Evolve》",
    url: "https://fishpi.cn/games/evolve/",
    description:
      "在本游戏中，您首先由原生质选择进化为某种智慧生物，然后带领他们走向繁荣昌盛，最后迈向星空，征服宇宙。支持第三方存档云同步（需手动在游戏设定中开启），参与 进化排行榜",
    logo: "https://file.fishpi.cn/evolve/evolved.ico",
  },
  {
    name: "《A Dark Room》",
    url: "https://fishpi.cn/games/adarkroom/?lang=zh_cn",
    description:
      "极简主义的游戏杰作，有上世纪 ascii 游戏的遗风。支持存档云同步，参与 摸鱼派 - 白与画科技 ADR 游戏总分排行榜",
    logo: "https://file.fishpi.cn/adarkroom/img/adr.png",
  },
  {
    name: "Minecraft 私服",
    url: "https://fishpi.cn/article/1689661528756",
    description:
      "著名 Minecraft 方块放置与探险游戏，社区成员 Yui 搭建的鱼油专属私服。可打怪，可挖矿，可田园，一起来耍吧~♂♂",
    logo: "https://file.fishpi.cn/2023/08/minecraft-71137c15.png",
  },
  {
    name: "《Maze》",
    url: "https://maze.hancel.org/",
    description:
      "游戏规则十分简单，游戏开始会随机生成一个迷宫，但每次只显示你所在当下位置周围 3 × 3 的迷宫，你只需要凭直觉找到出口即可。通过游戏右上角 Login 按钮使用摸鱼派账号登录后，每次通关将会奖励关卡数 × 10的积分。",
    logo: "https://file.fishpi.cn/2023/05/icon-4d115aa0.png",
  },
  {
    name: "WJU 谜题",
    url: "https://wju.adventext.fun/",
    description:
      "游戏开始会随机生成 WJU 三个字母组成的字符串，你需要通过 5 种字符串的操作，来生成最终的目标字符串。使用摸鱼派账号登录后，每次通关将会随机奖励 128 ~ 1024 的积分。连续通关奖励可以叠加！",
    logo: "https://wju.adventext.fun/images/logo.png",
  },
  {
    name: "《Fight》",
    url: "https://fishpi.cn/games/fight/index.html",
    description: "一款由社区成员 YARI 自主开发的格斗式游戏。",
    logo: "https://file.fishpi.cn/2022/08/image-39430724.png",
  },
  {
    name: "摸鱼大闯关",
    url: "https://p.hancel.org/",
    description:
      "一个非常烧脑的 CTF 类闯关游（酷）戏（刑）。这个游戏的目标就只有一个：进入下一关。在大部分关卡中，你需要利用网页上的提示来找到密码并进入下一关。参与 摸鱼大闯关排行榜",
    logo: "https://fishpi.cn/images/mofish.png",
  },
  {
    name: "摸鱼小闯关",
    url: "https://puzzle.iwpz.net/",
    description:
      '一个摸鱼大闯关的"山寨版"，但关卡内容为原创。框架来自 跳跳 参与 摸鱼小闯关排行榜',
    logo: "https://fishpi.cn/images/mofish.png",
  },
  {
    name: "汉兜",
    url: "https://fishpi.cn/games/handle/",
    description:
      "汉兜是一款猜四字词语的有趣游戏，你有十次的机会猜一个四字词语。每天首次游戏获积分奖励，快来猜猜吧！",
    logo: "https://fishpi.cn/games/handle/favicon.svg",
  },
  {
    name: "人生重开模拟器",
    url: "https://fishpi.cn/games/lifeRestart/view/",
    description:
      "如果你不满意现在的人生，那就来重开吧～支持存档云同步，参与 人生重开模拟器成就排行榜",
    logo: "https://fishpi.cn/images/restart.png",
  },
  {
    name: "Emoji 真假小黄脸",
    url: "https://fishpi.cn/games/emojiPair",
    description:
      "调皮的小黄脸玩起了真假美猴王的游戏，在众黄脸中找出他们吧！每天首次游戏获积分奖励，封顶30积分，参与 Emoji 真假小黄脸排行榜",
    logo: "emoji:😘",
  },
  {
    name: "围住小猫",
    url: "https://fishpi.cn/activity/catch-the-cat",
    description: "你能围住这只调皮的小猫么？",
    logo: "https://fishpi.cn/images/activities/cat.jpg",
  },
  {
    name: "2048",
    url: "https://fishpi.cn/activity/2048",
    description: "加强版2048，来吧~",
    logo: "https://fishpi.cn/images/activities/2048.png",
  },
  {
    name: "字",
    url: "https://fishpi.cn/activity/character",
    description: "写字和打字是完全不一样的体验，请认真感受~",
    logo: "https://fishpi.cn/images/activities/char.png",
  },
  {
    name: "贪吃蛇",
    url: "https://fishpi.cn/activity/eating-snake",
    description: "WASD 或方向键控制上下左右，回味一下文曲星的童年吧~",
    logo: "https://fishpi.cn/images/activities/snak.png",
  },
  {
    name: "五子棋",
    url: "https://fishpi.cn/activity/gobang",
    description: "点击开始，等待对手加入即可开战",
    logo: "https://fishpi.cn/images/activities/gobang.png",
  },
]);

const openGame = (url) => {
  utools.shellOpenExternal(url);
};
</script>

<style scoped>
.games-container {
  padding: 20px;
  height: 100%;
  background-color: var(--background-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.games-header {
  margin-bottom: 24px;
}

.games-header h2 {
  font-size: 24px;
  color: var(--text-color);
  margin: 0;
}

.subtitle {
  color: var(--sub-text-color);
  margin: 8px 0 0;
  font-size: 14px;
}

.games-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px 0;
  overflow-x: hidden;
}

.game-card {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  margin-bottom: 20px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid var(--border-color);
  position: relative;
  overflow: hidden;
  max-width: 100%;
}

.game-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  border-color: var(--border-color);
}

.game-card-content {
  display: flex;
  align-items: center;
  gap: 16px;
  height: auto;
  max-width: 100%;
}

.game-logo {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: var(--hover-bg);
  border-radius: 10px;
  padding: 8px;
  transition: all 0.3s ease;
}

.game-card:hover .game-logo {
  transform: scale(1.05);
  background: var(--border-color);
}

.game-logo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 6px;
}

.emoji-logo {
  font-size: 32px;
}

.game-info {
  flex: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
  gap: 16px;
  max-width: 100%;
}

.game-info-main {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.game-title {
  font-size: 1.18rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0 0 4px 0;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.game-description {
  font-size: 0.98rem;
  color: var(--sub-text-color);
  margin: 0;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  max-width: 100%;
}

.game-action {
  display: flex;
  align-items: center;
  margin: 0;
}

.game-action .el-button {
  font-size: 0.95rem;
  padding: 6px 14px;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.game-action .el-button:hover {
  background: var(--hover-bg);
}

.game-action .el-icon {
  margin-left: 4px;
  transition: transform 0.3s ease;
}

.game-card:hover .game-action .el-icon {
  transform: translateX(4px);
}

@media (max-width: 768px) {
  .game-card {
    padding: 1rem;
    height: 160px;
  }

  .game-card-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .game-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .game-description {
    max-width: 100%;
    white-space: normal;
  }

  .emoji-logo {
    font-size: 28px;
  }

  .game-action .el-button {
    font-size: 0.85rem;
    padding: 4px 10px;
  }
}
</style>
