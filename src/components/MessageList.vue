<template>
  <div class="message-list" ref="messageListRef" @scroll="handleScroll">
    <!-- 弹幕容器 -->
    <div class="barrager-container">
      <div v-for="(barrager, index) in barragers" :key="barrager.id" class="barrager-item" :style="{
        top: barrager.top + 'px',
        animationDuration: barrager.duration + 's',
        color: barrager.color,
      }">
        <img :src="barrager.avatar" class="barrager-avatar" />
        <span class="barrager-content">{{ barrager.content }}</span>
      </div>
    </div>
    <div v-if="isLoadingMore" class="loading-more">
      <div class="loading-spinner"></div>
      加载中...
    </div>
    <div v-if="!hasMoreMessages && messages.length > 0" class="no-more-messages">
      没有更多消息了
    </div>

    <!-- 新消息提示 -->
    <div v-if="hasNewMessages && !isAtBottom && newMessageCount > 0" class="new-messages-notification"
      :style="{ right: showSidebar ? '180px' : '32px' }" @click="scrollToBottom">
      <i class="notification-icon">↓</i>
      <span class="notification-text">{{ newMessageCount }} 条新消息</span>
    </div>

    <div class="messages">
      <template v-for="(item, index) in groupedMessages" :key="item.oId || 'separator-' + index">
        <!-- 时间分隔符 -->
        <div v-if="item.type === 'time-separator'" class="time-separator">
          {{ item.timestamp }}
        </div>
        <!-- 红包状态提示 -->
        <div v-else-if="item.type === 'red-packet-status'" class="red-packet-status-separator">
          <div class="red-packet-status-content" v-html="item.content"></div>
        </div>
        <!-- 话题变更提示 -->
        <div v-else-if="item.type === 'discuss-changed'" class="red-packet-status-separator">
          <div class="red-packet-status-content">
            <span class="changer">{{ item.whoChanged }}</span>
            修改了话题为：<span class="new-topic">{{ item.newDiscuss }}</span>
          </div>
        </div>
        <!-- 自定义消息提示 -->
        <div v-else-if="item.type === 'custom-message'" class="red-packet-status-separator">
          <div class="red-packet-status-content">
            <span class="message-content">{{ item.content }}</span>
          </div>
        </div>
        <!-- 弹幕消息 -->
        <div v-else-if="item.type === 'barrager'" class="barrager-message"></div>
        <!-- 消息内容 -->
        <div v-else class="message-row" :class="{
          'message-row-self': item.userName === userStore.userInfo?.userName,
        }">
          <img :src="item.userAvatarURL48" alt="avatar" class="message-avatar"
            @click="openUserInfoCard(item.userName, $event)" @contextmenu.prevent="
              onAvatarContextMenu($event, item.userName, item.userAvatarURL48)
              " />
          <div class="message-bubble">
            <div class="message-header" v-if="item.userName !== userStore.userInfo?.userName">
              <span class="user-nickname">
                {{
                  item.userNickname
                    ? `${item.userNickname} (${item.userName})`
                    : item.userName
                }}
              </span>
            </div>
            <div class="message-content" @click="
              (e) => {
                handleImageClick(e);
                handleLinkClick(e);
              }
            ">
              <div style="display: flex; align-items: flex-end">
                <div class="message-text" v-if="isMusicMessage(item.content)">
                  <div class="music-card" @click="playMusic(parseMusicMessage(item.content))">
                    <img :src="parseMusicMessage(item.content).coverURL" class="music-cover" alt="cover" />
                    <div class="music-info">
                      <div class="music-title">
                        {{ parseMusicMessage(item.content).title }}
                      </div>
                      <div class="music-source">网易云音乐</div>
                    </div>
                  </div>
                </div>
                <div class="message-text" v-else-if="isWeatherMessage(item.content)">
                  <div class="weather-card">
                    <div class="weather-header">
                      <div class="weather-city">
                        {{ parseWeatherMessage(item.content).t }}
                      </div>
                      <div class="weather-desc">
                        {{ parseWeatherMessage(item.content).st }}
                      </div>
                    </div>
                    <div class="weather-forecast">
                      <div v-for="(day, index) in getWeatherDays(item.content)" :key="index" class="weather-day">
                        <div class="weather-date">{{ day.date }}</div>
                        <div class="weather-icon">
                          {{ getWeatherIcon(day.weatherCode) }}
                        </div>
                        <div class="weather-temp">{{ day.max }}°</div>
                        <div class="weather-temp" style="opacity: 0.8">
                          {{ day.min }}°
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="message-text" v-else-if="isRedPacketMessage(item.content)">
                  <div class="red-packet-card" :class="{
                    finished:
                      parseRedPacketMessage(item.content).got >=
                      parseRedPacketMessage(item.content).count,
                  }" @click="showRedPacketDetails(item)">
                    <div class="red-packet-content">
                      <i class="red-packet-icon">🧧</i>
                      <div class="red-packet-info">
                        <div class="red-packet-type">
                          {{
                            formatRedPacketType(
                              parseRedPacketMessage(item.content).type
                            )
                          }}
                        </div>
                        <div class="red-packet-msg">
                          {{ parseRedPacketMessage(item.content).msg }}
                        </div>
                      </div>
                    </div>
                    <div class="red-packet-footer">
                      <div class="red-packet-amount">
                        {{ parseRedPacketMessage(item.content).money
                        }}<span class="unit">积分</span>
                      </div>
                      <div class="red-packet-status">
                        {{
                          parseRedPacketMessage(item.content).got >=
                            parseRedPacketMessage(item.content).count
                            ? "已领完"
                            : `剩余${parseRedPacketMessage(item.content).count -
                            parseRedPacketMessage(item.content).got
                            }/${parseRedPacketMessage(item.content).count}个`
                        }}
                      </div>
                    </div>
                  </div>
                  <!-- 添加猜拳手势按钮 -->
                  <div v-if="
                    parseRedPacketMessage(item.content).type ===
                    'rockPaperScissors' &&
                    parseRedPacketMessage(item.content).got <
                    parseRedPacketMessage(item.content).count
                  " class="rock-paper-scissors-buttons">
                    <button class="gesture-btn" @click.stop="openRedPacketWithGesture(item, 0)">
                      ✊
                    </button>
                    <button class="gesture-btn" @click.stop="openRedPacketWithGesture(item, 1)">
                      ✌️
                    </button>
                    <button class="gesture-btn" @click.stop="openRedPacketWithGesture(item, 2)">
                      ✋
                    </button>
                  </div>
                </div>
                <div class="message-text" v-else v-html="item.content"
                  @contextmenu.prevent="onMsgContextMenu($event, item)" @load="handleImageLoad"></div>
                <!-- +1按钮移动到气泡右侧 -->
                <button v-if="item.isGrouped" class="plus-one-btn" @click="sendSameMessage(item.content)">
                  +1
                </button>
              </div>
              <!-- 合并消息头像和人数，显示所有头像 -->
              <div v-if="item.isGrouped" class="grouped-users">
                <img v-for="user in item.groupUsers" :key="user.userName" :src="user.userAvatarURL48"
                  class="group-avatar" />
                <span v-if="item.groupUsers.length > 2">{{ item.groupUsers.length }}人+1</span>
              </div>
              <div class="message-footer" v-if="item.userName !== userStore.userInfo?.userName">
                <ClientInfo :client="item.client" />
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- 红包详情弹窗 -->
    <RedPacketModal :visible="showRedPacketModal" :red-packet="currentRedPacket"
      :current-user="userStore.userInfo?.userName" @close="closeRedPacketModal" />

    <!-- 用户信息卡片弹窗 -->
    <div v-if="showUserInfoModal" class="user-info-modal" @click.self="closeUserInfoCard">
      <UserInfoCard :userName="selectedUserName" :x="userInfoCardX" :y="userInfoCardY"
        :currentUser="userStore.userInfo?.userName" @close="closeUserInfoCard" @detail="handleUserDetail"
        @message="handleUserMessage" />
    </div>

    <UserContextMenu :visible="showContextMenu" :x="contextMenuX" :y="contextMenuY" :items="userContextMenuItems"
      @action="handleContextMenuAction" />

    <MsgContextMenu :visible="showMsgContextMenu" :x="msgContextMenuX" :y="msgContextMenuY" :items="msgContextMenuItems"
      @action="handleMsgContextMenuAction" />
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick, computed } from "vue";
import dayjs from "dayjs";
import { useUserStore } from "../stores/user";
import { chatApi } from "../api/chat";
import { useRouter } from "vue-router";
import ClientInfo from "./ClientInfo.vue";
import UserInfoCard from "./UserInfoCard.vue";
import UserContextMenu from "./UserContextMenu.vue";
import MsgContextMenu from "./MsgContextMenu.vue";
import { ElMessage } from "element-plus";
import RedPacketModal from "./RedPacketModal.vue";
import { createImagePreviewWindow } from "../utils/imagePreview";

const props = defineProps({
  messages: {
    type: Array,
    default: () => [],
  },
  isLoadingMore: {
    type: Boolean,
    default: false,
  },
  hasMoreMessages: {
    type: Boolean,
    default: true,
  },
  showSidebar: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits([
  "load-more",
  "red-packet-updated",
  "at-user",
  "quote",
  "add-emoji",
  "send-same-message",
  "update-messages",
]);

const userStore = useUserStore();
const messageListRef = ref(null);
const previousScrollHeight = ref(0);
const isAtBottom = ref(true);
const hasNewMessages = ref(false);
const newMessageCount = ref(0);
const lastMessageCount = ref(0);
const isReceiving = ref(false);
const router = useRouter();
const isPageVisible = ref(true);
const bells = ref([]);

// 监听页面可见性变化
onMounted(() => {
  document.addEventListener("visibilitychange", () => {
    console.log("页面监听页面可见性变化");
    isPageVisible.value = document.visibilityState === "visible";
  });
});

// 时间分隔阈值（分钟）
const TIME_SEPARATOR_THRESHOLD_MINUTES = 5;

// 计算显示的消息列表（包含时间分隔符）
const displayedMessages = computed(() => {
  const list = [];
  let lastMessageTime = null;

  // 遍历消息（不需要反转，因为消息已经按时间顺序排列）
  for (const message of props.messages) {
    const currentTime = dayjs(message.time);

    // 检查是否需要在当前消息前添加分隔符
    if (lastMessageTime) {
      const timeDiffMinutes = currentTime.diff(lastMessageTime, "minute");
      const isDifferentDay = !currentTime.isSame(lastMessageTime, "day");

      if (
        isDifferentDay ||
        timeDiffMinutes > TIME_SEPARATOR_THRESHOLD_MINUTES
      ) {
        list.push({
          type: "time-separator",
          timestamp: isDifferentDay
            ? currentTime.format("YYYY-MM-DD")
            : currentTime.format("HH:mm"),
          _key: `separator-${message.oId || Math.random()
            }-${currentTime.valueOf()}`,
        });
      }
    } else if (props.messages.length > 0) {
      // 为第一条消息添加分隔符
      list.push({
        type: "time-separator",
        timestamp: currentTime.format("YYYY-MM-DD"),
        _key: `separator-first-${message.oId || Math.random()
          }-${currentTime.valueOf()}`,
      });
    }

    // 添加当前消息
    list.push(message);
    lastMessageTime = currentTime;
  }

  return list;
});

// 新增：分组合并消息
const groupedMessages = computed(() => {
  const groups = [];
  let buffer = [];
  const flushBuffer = () => {
    if (buffer.length >= 3) {
      groups.push({
        ...buffer[0],
        isGrouped: true,
        groupUsers: buffer.slice(1).map((m) => ({
          userName: m.userName,
          userAvatarURL48: m.userAvatarURL48,
        })),
        groupCount: buffer.length - 1,
      });
    } else {
      groups.push(...buffer);
    }
    buffer = [];
  };
  for (const message of displayedMessages.value) {
    // 跳过特殊类型
    if (
      message.type === "time-separator" ||
      message.type === "red-packet-status"
    ) {
      flushBuffer();
      groups.push(message);
      continue;
    }
    if (
      buffer.length > 0 &&
      buffer[0].content === message.content &&
      !isRedPacketMessage(message.content) &&
      !isWeatherMessage(message.content) &&
      !isMusicMessage(message.content)
    ) {
      buffer.push(message);
    } else {
      flushBuffer();
      buffer.push(message);
    }
  }
  flushBuffer();
  return groups;
});

// 检查是否在底部
const checkIfAtBottom = () => {
  if (messageListRef.value) {
    const { scrollTop, scrollHeight, clientHeight } = messageListRef.value;
    isAtBottom.value = Math.abs(scrollHeight - scrollTop - clientHeight) < 10;
  }
};

// 监听消息变化
watch(
  () => props.messages,
  (newMessages, oldMessages) => {
    if (newMessages.length > oldMessages.length) {
      // 获取新增的消息
      const newMsg = newMessages[newMessages.length - 1];
      bells.value = getBells();
      // 如果是弹幕消息，直接处理并返回，不进行后续处理
      if (newMsg.type === "barrager") {
        handleBarrager(newMsg);
        return;
      }

      // 如果页面不可见，不处理新消息
      if (!isPageVisible.value) {
        console.log("页面不可见，不处理新消息");
        return;
      }

      // 保存当前滚动位置
      const scrollHeight = messageListRef.value?.scrollHeight || 0;
      const scrollTop = messageListRef.value?.scrollTop || 0;
      const clientHeight = messageListRef.value?.clientHeight || 0;
      const wasAtBottom = scrollHeight - scrollTop - clientHeight < 200;

      nextTick(() => {
        const lastMessage = newMessages[newMessages.length - 1];
        // 如果是弹幕消息，不进行后续处理
        if (lastMessage.type === "barrager") {
          return;
        }

        const isSystemOrSpecialMsg = (msg) => {
          if (
            msg.type === "discuss-changed" ||
            msg.type === "red-packet-status"
          ) {
            return true;
          }
          try {
            const content = JSON.parse(msg.content);
            return (
              content.msgType === "redPacket" ||
              content.msgType === "weather" ||
              content.msgType === "music"
            );
          } catch {
            return false;
          }
        };

        // 重新检测底部状态
        checkIfAtBottom();

        // 使用 requestAnimationFrame 确保在下一帧渲染完成后再处理滚动
        requestAnimationFrame(() => {
          if (
            (isAtBottom.value || wasAtBottom || lastMessage?.isSelf) &&
            lastMessage &&
            lastMessage.isHistory === false &&
            !props.isLoadingMore
          ) {
            console.log("[watch] 自动滚动到底部");
            // 检查消息中是否包含图片
            const hasImages = /<img[^>]+src=/.test(lastMessage.content);
            if (hasImages) {
              // 如果包含图片，等待图片加载完成后再滚动
              const images = document.querySelectorAll(".message-text img");
              let loadedImages = 0;
              const totalImages = images.length;

              if (totalImages === 0) {
                scrollToBottom();
              } else {
                images.forEach((img) => {
                  if (img.complete) {
                    loadedImages++;
                    if (loadedImages === totalImages) {
                      scrollToBottom();
                    }
                  } else {
                    img.onload = () => {
                      loadedImages++;
                      if (loadedImages === totalImages) {
                        scrollToBottom();
                      }
                    };
                  }
                });
              }
            } else {
              scrollToBottom();
            }
            hasNewMessages.value = false;
            newMessageCount.value = 0;
          } else if (
            lastMessage &&
            lastMessage.isHistory === false &&
            !lastMessage.isSelf &&
            !props.isLoadingMore
          ) {
            if (isSystemOrSpecialMsg(lastMessage) || !lastMessage.isSelf) {
              console.log("[watch] 弹出新消息提示");
              hasNewMessages.value = true;
              const newCount = newMessages.length - oldMessages.length;
              if (newCount > 0) {
                newMessageCount.value += newCount;
                lastMessageCount.value = newMessageCount.value; // 保存原始消息数量
              }
            }
          }
        });
      checkBellsInMessage(newMsg.md, bells.value) && utools.showNotification(`有人提了关键词`)

      });
    }
  },
  { deep: true }
);

// 修改 scrollToBottom 函数
const scrollToBottom = () => {
  if (messageListRef.value) {
    nextTick(() => {
      messageListRef.value.scrollTop = messageListRef.value.scrollHeight;
    });
  }
};

// 处理滚动事件
const handleScroll = () => {
  if (messageListRef.value) {
    const { scrollTop, scrollHeight, clientHeight } = messageListRef.value;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;
    checkIfAtBottom();

    // 如果滚动到底部，清除新消息提示
    if (isAtBottom.value) {
      hasNewMessages.value = false;
      newMessageCount.value = 0;
    } else if (hasNewMessages.value && newMessageCount.value > 0) {
      // 计算滚动比例，用于动态更新新消息数量
      const maxDistance = 500; // 最大滚动距离阈值
      const scrollRatio = Math.min(distanceToBottom / maxDistance, 1);
      const originalCount = lastMessageCount.value;
      const newCount = Math.max(Math.floor(originalCount * scrollRatio), 0);

      if (newCount !== newMessageCount.value) {
        newMessageCount.value = newCount;
        if (newCount === 0) {
          hasNewMessages.value = false;
        }
      }
    }

    if (scrollTop === 0 && !props.isLoadingMore && props.hasMoreMessages) {
      // 保存当前滚动高度
      previousScrollHeight.value = messageListRef.value.scrollHeight;
      // 触发加载更多消息
      emit("load-more");
    }
  }
};

// 判断是否为音乐消息
const isMusicMessage = (content) => {
  try {
    const parsed = JSON.parse(content);
    return parsed.msgType === "music";
  } catch {
    return false;
  }
};

// 解析音乐消息
const parseMusicMessage = (content) => {
  try {
    return JSON.parse(content);
  } catch {
    return {};
  }
};

// 播放音乐
const playMusic = (musicInfo) => {
  if (musicInfo.source) {
    window.open(musicInfo.source, "_blank");
  }
};

// 判断是否为天气消息
const isWeatherMessage = (content) => {
  try {
    const parsed = JSON.parse(content);
    return parsed.msgType === "weather";
  } catch {
    return false;
  }
};

// 解析天气消息
const parseWeatherMessage = (content) => {
  try {
    return JSON.parse(content);
  } catch {
    return {};
  }
};

// 获取天气日期数据
const getWeatherDays = (content) => {
  try {
    const weather = JSON.parse(content);
    const dates = weather.date.split(",");
    const weatherCodes = weather.weatherCode.split(",");
    const maxTemps = weather.max.split(",");
    const minTemps = weather.min.split(",");

    return dates.map((date, index) => ({
      date: date.split("/")[1] + "日",
      weatherCode: weatherCodes[index],
      max: maxTemps[index],
      min: minTemps[index],
    }));
  } catch {
    return [];
  }
};

// 获取天气图标
const getWeatherIcon = (code) => {
  const icons = {
    SUNNY: "☀️",
    CLOUDY: "☁️",
    PARTLY_CLOUDY_DAY: "⛅",
    RAINY: "🌧️",
    SNOWY: "❄️",
    WINDY: "🌪️",
    FOGGY: "🌫️",
    THUNDER: "⛈️",
  };
  return icons[code] || "☀️";
};

// 判断是否为红包消息
const isRedPacketMessage = (content) => {
  try {
    const parsed = JSON.parse(content);
    return parsed.msgType === "redPacket";
  } catch {
    return false;
  }
};

// 解析红包消息
const parseRedPacketMessage = (content) => {
  try {
    return JSON.parse(content);
  } catch {
    return {};
  }
};

// 格式化时间
const formatTime = (time) => {
  return dayjs(time).format("HH:mm:ss");
};

// 格式化红包类型
const formatRedPacketType = (type) => {
  const typeMap = {
    random: "拼手气红包",
    average: "平分红包",
    specify: "专属红包",
    heartbeat: "心跳红包",
    rockPaperScissors: "猜拳红包",
  };
  return typeMap[type] || type;
};

// 红包弹窗状态
const showRedPacketModal = ref(false);
const currentRedPacket = ref(null);

// 显示红包详情
const showRedPacketDetails = async (item) => {
  try {
    isReceiving.value = true;
    const gesture =
      parseRedPacketMessage(item.content).type === "rockPaperScissors"
        ? 0
        : undefined;
    const response = await chatApi.openRedPacket(item.oId, gesture);
    // 更新红包信息
    currentRedPacket.value = {
      ...parseRedPacketMessage(item.content),
      who: response.who,
      got: response.info.got,
      count: response.info.count,
      msg: response.info.msg,
      info: response.info,
    };
    showRedPacketModal.value = true;
  } catch (error) {
    console.error("获取红包详情失败:", error);
  } finally {
    isReceiving.value = false;
  }
};

// 关闭红包弹窗
const closeRedPacketModal = () => {
  showRedPacketModal.value = false;
  currentRedPacket.value = null;
};

// 查看用户信息
const showUserProfile = (userName) => {
  router.push(`/user/${userName}`);
};

// 用户信息卡片弹窗
const showUserInfoModal = ref(false);
const selectedUserName = ref("");
const userInfoCardX = ref(0);
const userInfoCardY = ref(0);

const openUserInfoCard = (userName, event) => {
  selectedUserName.value = userName;

  const cardWidth = 320; // 估算卡片宽度
  const cardHeight = 450; // 估算卡片高度
  const padding = 20; // 边缘边距

  let clientX = event.clientX;
  let clientY = event.clientY;

  // 检查是否超出右边界
  if (clientX + cardWidth > window.innerWidth - padding) {
    clientX = window.innerWidth - cardWidth - padding;
  }

  // 检查是否超出下边界
  if (clientY + cardHeight > window.innerHeight - padding) {
    clientY = window.innerHeight - cardHeight - padding;
  }

  // 确保不会超出左边界和上边界
  if (clientX < padding) clientX = padding;
  if (clientY < padding) clientY = padding;

  userInfoCardX.value = clientX;
  userInfoCardY.value = clientY;
  showUserInfoModal.value = true;
};
const closeUserInfoCard = () => {
  showUserInfoModal.value = false;
  selectedUserName.value = "";
};

// 用户信息卡片操作
const handleUserDetail = (userName) => {
  closeUserInfoCard();
  router.push(`/user/${userName}`);
};
const handleUserMessage = (userName) => {
  closeUserInfoCard();
  utools.dbStorage.setItem("private-chat-user", userName);
  router.push(`/private-chat?user=${userName}`);
};

const showContextMenu = ref(false);
const contextMenuX = ref(0);
const contextMenuY = ref(0);
const contextMenuUser = ref("");
const contextMenuUserAvatar = ref("");

function onAvatarContextMenu(e, userName, avatarUrl) {
  e.preventDefault();
  contextMenuX.value = e.clientX;
  contextMenuY.value = e.clientY;
  contextMenuUser.value = userName;
  contextMenuUserAvatar.value = avatarUrl;
  showContextMenu.value = true;
}

function handleContextMenuAction(type) {
  showContextMenu.value = false;
  if (type === "blacklist") {
    addToBlacklist(contextMenuUser.value, contextMenuUserAvatar.value);
    return;
  }
  if (type === "message") {
    handleUserMessage(contextMenuUser.value);
  } else if (type === "at") {
    emit("at-user", contextMenuUser.value);
  } else if (type === "profile") {
    handleUserDetail(contextMenuUser.value);
  }
}

window.addEventListener("click", () => {
  showContextMenu.value = false;
});

const showMsgContextMenu = ref(false);
const msgContextMenuX = ref(0);
const msgContextMenuY = ref(0);
const msgContextMenuItem = ref(null);
const msgContextMenuItems = ref([]);

const canRevokeMessage = (item) => {
  const userRole = userStore.userInfo?.userRole;
  const isAdmin = userRole === "管理员" || userRole === "OP";
  const isSelf = item.userName === userStore.userInfo?.userName;

  // 如果是管理员或OP，可以撤回任何消息
  if (isAdmin) {
    return true;
  }

  // 如果是自己的消息，且未撤回过
  if (isSelf && !item.revoked) {
    return true;
  }

  return false;
};

function onMsgContextMenu(e, item) {
  e.preventDefault();
  // 判断类型
  if (
    isRedPacketMessage(item.content) ||
    isWeatherMessage(item.content) ||
    isMusicMessage(item.content)
  ) {
    return; // 不弹出菜单
  }
  msgContextMenuX.value = e.clientX;
  msgContextMenuY.value = e.clientY;
  msgContextMenuItem.value = item;
  if (/\<img[^>]+src=/.test(item.content)) {
    // 图片消息
    const isSelf = item.userName === userStore.userInfo?.userName;
    msgContextMenuItems.value = [
      { label: "引用", action: "quote", icon: "fas fa-quote-right" },
      { label: "添加到表情", action: "add-emoji", icon: "fas fa-plus-circle" },
      { label: "复制", action: "copy-image", icon: "fas fa-copy" },
      ...(isSelf ? [] : [{ label: "@TA", action: "at", icon: "fas fa-at" }]),
      { label: "复读机", action: "repeat", icon: "fas fa-redo" },
      // 添加撤回选项，根据条件显示
      ...(canRevokeMessage(item)
        ? [{ label: "撤回", action: "revoke", icon: "fas fa-undo" }]
        : []),
      { label: "加入黑名单", action: "blacklist", icon: "fas fa-user-slash" },
    ];
  } else {
    // 文字消息
    const isSelf = item.userName === userStore.userInfo?.userName;
    msgContextMenuItems.value = [
      { label: "复制", action: "copy", icon: "fas fa-copy" },
      { label: "引用", action: "quote", icon: "fas fa-quote-right" },
      ...(isSelf ? [] : [{ label: "@TA", action: "at", icon: "fas fa-at" }]),
      { label: "复读机", action: "repeat", icon: "fas fa-redo" },
      // 添加撤回选项，根据条件显示
      ...(canRevokeMessage(item)
        ? [{ label: "撤回", action: "revoke", icon: "fas fa-undo" }]
        : []),
      { label: "加入黑名单", action: "blacklist", icon: "fas fa-user-slash" },
    ];
  }
  showMsgContextMenu.value = true;
}
function handleMsgContextMenuAction(type) {
  showMsgContextMenu.value = false;
  const item = msgContextMenuItem.value;

  if (type === "revoke") {
    handleRevokeMessage(item);
    return;
  }

  if (type === "copy") {
    // 复制文字
    const temp = document.createElement("div");
    temp.innerHTML = item.content;
    navigator.clipboard.writeText(temp.innerText).then(() => {
      ElMessage.success("复制成功");
    });
  } else if (type === "quote") {
    emit("quote", msgContextMenuItem.value);
  } else if (type === "at") {
    emit("at-user", item.userName);
  } else if (type === "repeat") {
    // 复读机功能
    const temp = document.createElement("div");
    temp.innerHTML = item.content;
    emit("send-same-message", item.md || item.content);
    ElMessage.success(" 复读成功");
  } else if (type === "add-emoji") {
    emit("add-emoji", item);
  } else if (type === "copy-image") {
    // 复制图片
    const match = item.content.match(/<img[^>]+src=["']([^"']+)["']/);
    if (match && match[1]) {
      const imgSrc = match[1];
      if (imgSrc.startsWith("data:image")) {
        // 如果是base64图片，直接复制
        utools.copyImage(imgSrc);
        ElMessage.success("复制成功");
      } else {
        // 如果是URL图片，先下载再复制
        fetch(imgSrc)
          .then((res) => res.blob())
          .then((blob) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              utools.copyImage(reader.result);
              ElMessage.success("复制成功");
            };
            reader.readAsDataURL(blob);
          });
      }
    }
  } else if (type === "blacklist") {
    addToBlacklist(item.userName, item.userAvatarURL48);
  }
}
window.addEventListener("click", () => {
  showMsgContextMenu.value = false;
});

// 发送同样内容
function sendSameMessage(content) {
  emit("send-same-message", content);
}

// 在 script setup 部分添加手气王判断函数
const isLuckyKing = (receiver) => {
  if (!currentRedPacket.value) return false;

  // 如果是平分红包 专属红包 猜拳红包 ，没有手气王
  if (
    currentRedPacket.value.type === "average" ||
    currentRedPacket.value.type === "specify" ||
    currentRedPacket.value.type === "rockPaperScissors"
  )
    return false;

  // 找出最大金额
  const maxMoney = Math.max(
    ...currentRedPacket.value.who.map((w) => w.userMoney)
  );

  // 如果当前用户金额等于最大金额，且是第一个达到最大金额的用户，则为手气王
  return (
    receiver.userMoney === maxMoney &&
    currentRedPacket.value.who.findIndex((w) => w.userMoney === maxMoney) ===
    currentRedPacket.value.who.indexOf(receiver)
  );
};

// 图片预览相关
let previewWindow = null;

// 处理图片点击
const handleImageClick = async (e) => {
  if (e.target.tagName === "IMG") {
    const imgSrc = e.target.src;
    const allImages = Array.from(
      document.querySelectorAll(".message-text img")
    ).map((img) => ({
      src: img.src,
    }));
    const currentIndex = allImages.findIndex((img) => img.src === imgSrc);

    // 关闭之前的预览窗口
    if (previewWindow && !previewWindow.isDestroyed()) {
      previewWindow.close();
    }

    try {
      // 使用新的工具函数创建预览窗口
      previewWindow = await createImagePreviewWindow(allImages, currentIndex);

      // 窗口关闭时重置变量
      const checkWindowClosed = () => {
        if (
          previewWindow &&
          previewWindow.isDestroyed &&
          previewWindow.isDestroyed()
        ) {
          previewWindow = null;
        } else {
          setTimeout(checkWindowClosed, 1000);
        }
      };
      checkWindowClosed();
    } catch (error) {
      console.error("创建图片预览窗口失败:", error);
      ElMessage.error("图片预览失败");
    }
  }
};

// 在 script setup 部分添加新的方法
const openRedPacketWithGesture = async (item, gesture) => {
  try {
    isReceiving.value = true;
    const response = await chatApi.openRedPacket(item.oId, gesture);
    // 更新红包信息
    currentRedPacket.value = {
      ...parseRedPacketMessage(item.content),
      who: response.who,
      got: response.info.got,
      count: response.info.count,
      msg: response.info.msg,
      info: response.info,
    };
    showRedPacketModal.value = true;
  } catch (error) {
    console.error("获取红包详情失败:", error);
    ElMessage.error("领取红包失败");
  } finally {
    isReceiving.value = false;
  }
};

// 弹幕相关
const barragers = ref([]);
let barragerId = 0;

// 处理弹幕消息
const handleBarrager = (data) => {
  console.log(data);
  // 确保数据完整性
  if (!data.content || !data.userAvatarURL48) {
    console.warn("弹幕消息数据不完整:", data);
    return;
  }

  const barrager = {
    id: barragerId++,
    content: data.content,
    avatar: data.userAvatarURL48,
    color: data.barragerColor || "rgba(255,255,255,1)",
    top: getRandomTop(),
    duration: 8, // 固定动画时间为8秒
  };

  // 添加到弹幕列表
  barragers.value.push(barrager);

  // 动画结束后移除弹幕，确保动画完整播放
  setTimeout(() => {
    barragers.value = barragers.value.filter((b) => b.id !== barrager.id);
  }, barrager.duration * 1000 + 100); // 额外添加100ms的缓冲时间
};

// 获取随机弹幕位置，避免重叠
const getRandomTop = () => {
  const containerHeight = messageListRef.value?.clientHeight || 300;
  const maxTop = containerHeight * 0.8; // 使用80%的容器高度
  const minGap = 40; // 最小间距
  const existingTops = barragers.value.map((b) => b.top);

  let newTop;
  let attempts = 0;
  const maxAttempts = 10;

  do {
    newTop = Math.random() * maxTop;
    attempts++;
  } while (
    attempts < maxAttempts &&
    existingTops.some((top) => Math.abs(top - newTop) < minGap)
  );

  return newTop;
};

// 修改链接处理函数
const handleLinkClick = (e) => {
  if (e.target.tagName === "A") {
    e.preventDefault();
    const url = e.target.href;
    // 使用系统默认浏览器打开链接
    utools.shellOpenExternal(url);
  }
};

// 添加图片加载完成的处理函数
const handleImageLoad = () => {
  if (isAtBottom.value) {
    nextTick(() => {
      scrollToBottom();
    });
  }
};

// 处理消息撤回
const handleRevokeMessage = async (item) => {
  try {
    const response = await chatApi.revokeMessage(item.oId);
    if (response.code === 0) {
      ElMessage.success(response.msg || "撤回成功");
    }
  } catch (error) {
    console.error("撤回消息失败:", error);
    ElMessage.error("撤回失败");
  }
};
const getBells = () => {
  const savedBells = utools.dbStorage.getItem("fishpi_bells") || [];
  return savedBells;
}
// 检查是否包含
const checkBellsInMessage = (mainString, elementsArray) => {

  console.log("检查关键词:", mainString, elementsArray);
  const foundElements = elementsArray.filter(element =>
    mainString.includes(element)
  );
  return foundElements.length > 0;
}

onMounted(() => {
  bells.value = getBells();
  scrollToBottom();
});

const userContextMenuItems = computed(() => [
  { label: "发送消息", action: "message", icon: "fas fa-comment-dots" },
  { label: "@TA", action: "at", icon: "fas fa-at" },
  { divider: true },
  { label: "查看资料", action: "profile", icon: "fas fa-user" },
  { label: "加入黑名单", action: "blacklist", icon: "fas fa-user-slash" },
]);

// 黑名单相关
const addToBlacklist = (userName, avatarUrl) => {
  const currentUser = userStore.userInfo?.userName;
  if (!currentUser) return;
  const allBlacklists = utools.dbStorage.getItem("fishpi_blacklist") || {};
  const list = allBlacklists[currentUser] || [];
  if (list.some((u) => u.userName === userName)) {
    ElMessage.warning("该用户已在黑名单");
    return;
  }
  list.push({ userName, avatarUrl });
  allBlacklists[currentUser] = list;
  utools.dbStorage.setItem("fishpi_blacklist", allBlacklists);
  ElMessage.success("已加入黑名单");

  // 立即过滤当前显示的消息，移除黑名单用户的消息
  filterBlacklistMessages();

  // 触发全局事件，通知其他组件黑名单已更新
  window.dispatchEvent(
    new CustomEvent("fishpi:blacklist-updated", {
      detail: { action: "add", userName },
    })
  );
};

// 过滤黑名单消息的函数
const filterBlacklistMessages = () => {
  const currentUser = userStore.userInfo?.userName;
  if (!currentUser) return;

  const allBlacklists = utools.dbStorage.getItem("fishpi_blacklist") || {};
  const blacklist = allBlacklists[currentUser] || [];
  const blacklistUserNames = blacklist.map((u) => u.userName);

  // 过滤掉黑名单用户的消息
  const filteredMessages = props.messages.filter((msg) => {
    if (!msg.userName) return true; // 系统消息保留
    return !blacklistUserNames.includes(msg.userName);
  });

  // 通过emit通知父组件更新消息列表
  emit("update-messages", filteredMessages);
};
</script>

<style scoped>
.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  background-color: var(--chatroom-bg);

}

.messages {
  display: flex;
  flex-direction: column;
}

.message-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 16px;
  position: relative;
}

.message-row-self {
  flex-direction: row-reverse;
  margin-bottom: 8px;
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin: 0 8px;
  flex-shrink: 0;
  border: 2px solid var(--avatar-border);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.message-bubble {
  max-width: 80%;
  min-width: 60px;
  display: flex;
  flex-direction: column;
}

.message-row-self .message-bubble {
  align-items: flex-end;
  margin-bottom: 0;
}

.message-header {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
  padding: 0 4px;
  margin-left: -4px;
}

.message-row-self .message-header {
  flex-direction: row-reverse;
  margin-left: 0;
  margin-right: -4px;
}

.user-nickname {
  font-weight: 500;
  color: var(--text-color);
  margin: 0 6px;
  font-size: 13px;
}

.message-content {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
}

.message-text {
  padding: 10px 12px;
  border-radius: 12px;
  background-color: var(--bubble-bg);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  word-break: break-word;
  line-height: 1.5;
  font-size: 14px;
  color: var(--text-color);
  position: relative;
  width: fit-content;
  max-width: 100%;
}

.message-row-self .message-text {
  background-color: var(--hover-bg);
  margin-left: auto;
  margin-top: 0;
}

/* 音乐卡片样式 */
.message-text :deep(.music-card) {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  width: 250px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.message-text :deep(.music-cover) {
  width: 80px;
  height: 80px;
  object-fit: cover;
  flex-shrink: 0;
}

.message-text :deep(.music-info) {
  flex: 1;
  padding: 12px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.message-text :deep(.music-title) {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.message-text :deep(.music-source) {
  font-size: 12px;
  color: #999;
  display: flex;
  align-items: center;
  gap: 4px;
}

.message-text :deep(.music-source::before) {
  content: "♪";
  font-size: 14px;
}

.message-row-self .message-text :deep(.music-card) {
  background: #e6f4ff;
}

.message-row-self .message-text :deep(.music-title) {
  color: #1890ff;
}

.message-text::before {
  content: "";
  position: absolute;
  top: 12px;
  width: 0;
  height: 0;
  border: 6px solid transparent;
}

.message-row:not(.message-row-self) .message-text::before {
  left: -12px;
  border-right-color: var(--card-bg);
}

.message-row-self .message-text::before {
  right: -12px;
  border-left-color: var(--hover-bg);
}

.message-footer {
  margin-top: 4px;
  padding: 0 4px;
  font-size: 12px;
  color: var(--sub-text-color);
}

.message-footer-self {
  text-align: right;
}

.client-info {
  font-size: 12px;
  color: var(--sub-text-color);
}

.message-text :deep(img) {
  max-width: 200px;
  height: auto;
  border-radius: 8px;
  margin: 4px 0;
  cursor: pointer;
  display: block;
}

.message-text :deep(blockquote) {
  margin: 8px 0;
  padding: 8px 12px;
  border-left: 2px solid var(--border-color);
  background-color: var(--hover-bg);
  border-radius: 4px;
  color: var(--sub-text-color);
  font-size: 13px;
  line-height: 1.5;
}

.message-text :deep(blockquote p) {
  margin: 0;
}

.message-text :deep(blockquote p:last-child) {
  margin-bottom: 0;
}

.message-row-self .message-text :deep(blockquote) {
  background-color: var(--background-color);
}

.message-text :deep(p) {
  margin: 8px 0 0 0;
}

.message-text :deep(p:first-child) {
  margin-top: 0;
}

.message-text :deep(p:last-child) {
  margin-bottom: 0;
}

.time-separator {
  text-align: center;
  margin: 16px 0;
  font-size: 12px;
  color: var(--sub-text-color);
  position: relative;
}

.loading-more,
.no-more-messages {
  text-align: center;
  padding: 12px;
  color: var(--sub-text-color);
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #3498db;
  border-radius: 50%;
  margin-right: 8px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.new-messages-notification {
  position: fixed;
  bottom: 170px;
  /* right 由 :style 动态控制 */
  z-index: 1000;
  background-color: var(--primary-color);
  color: var(--button-text);
  padding: 8px 16px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.new-messages-notification:hover {
  background-color: var(--button-bg);
  transform: translateY(-2px);
}

.notification-text {
  font-size: 14px;
  font-weight: 500;
}

.notification-count {
  background-color: var(--badge-bg);
  color: var(--badge-text);
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 12px;
  min-width: 16px;
  text-align: center;
}

.notification-icon {
  font-size: 16px;
  animation: bounce 1s infinite;
}

@keyframes bounce {

  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-2px);
  }
}

/* 天气卡片样式 */
.message-text :deep(.weather-card) {
  width: 300px;
  background: linear-gradient(135deg, #8e9eab 0%, #eef2f3 100%);
  border-radius: 12px;
  color: #333;
  overflow: hidden;
}

.message-text :deep(.weather-header) {
  padding: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.message-text :deep(.weather-city) {
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 4px;
  color: #333;
}

.message-text :deep(.weather-desc) {
  font-size: 13px;
  color: #666;
}

.message-text :deep(.weather-forecast) {
  display: flex;
  padding: 12px;
  gap: 12px;
}

.message-text :deep(.weather-day) {
  flex: 1;
  text-align: center;
  padding: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.message-text :deep(.weather-date) {
  font-size: 12px;
  opacity: 0.9;
  margin-bottom: 4px;
}

.message-text :deep(.weather-temp) {
  font-size: 14px;
  font-weight: 500;
  margin: 4px 0;
}

.message-text :deep(.weather-icon) {
  font-size: 20px;
  margin: 4px 0;
}

.message-row-self .message-text :deep(.weather-card) {
  background: linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%);
}

/* 红包卡片样式 */
.message-text :deep(.red-packet-card) {
  width: 220px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  color: #fff;
  padding: 12px;
  position: relative;
  background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
  border: none;
  transition: all 0.2s ease;
  cursor: pointer;
}

.message-text :deep(.red-packet-content) {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.message-text :deep(.red-packet-icon) {
  font-size: 32px;
  flex-shrink: 0;
}

.message-text :deep(.red-packet-info) {
  flex: 1;
  min-width: 0;
}

.message-text :deep(.red-packet-type) {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 4px;
}

.message-text :deep(.red-packet-msg) {
  font-size: 12px;
  color: #fffbe6;
  opacity: 0.92;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.message-text :deep(.red-packet-footer) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  height: 24px;
}

.message-text :deep(.red-packet-amount) {
  font-size: 15px;
  font-weight: bold;
  color: #fff;
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.message-text :deep(.red-packet-amount .unit) {
  font-size: 12px;
  font-weight: 400;
  color: #fffbe6;
}

.message-text :deep(.red-packet-status) {
  font-size: 12px;
  color: #fffbe6;
  background: rgba(255, 255, 255, 0.2);
  padding: 1px 8px;
  border-radius: 10px;
  height: 20px;
  line-height: 18px;
}

.message-text :deep(.red-packet-card.finished) {
  background: linear-gradient(135deg, #a8071a 0%, #d4380d 100%);
}

.message-text :deep(.red-packet-card.finished .red-packet-status) {
  background: rgba(255, 255, 255, 0.3);
}

/* 红包详情弹窗 */
.red-packet-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.red-packet-modal-content {
  width: 360px;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
}

.red-packet-modal-header {
  background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
  padding: 24px;
  color: #fff;
  text-align: center;
  position: relative;
}

.red-packet-modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.red-packet-modal-close:hover {
  background: rgba(255, 255, 255, 0.3);
}

.red-packet-modal-body {
  padding: 20px;
  padding-right: 24px;
  max-height: 40vh;
  /* 设置最大高度为视窗高度的60% */
  display: flex;
  flex-direction: column;
}

.red-packet-modal-title {
  font-size: 15px;
  color: #333;
  margin-bottom: 16px;
  font-weight: 500;
  flex-shrink: 0;
  /* 防止标题被压缩 */
}

.red-packet-modal-receivers {
  max-height: calc(60vh - 100px);
  /* 减去标题和padding的高度 */
  overflow-y: auto;
  padding-right: 4px;
  margin-right: -4px;
  flex: 1;
}

/* 自定义滚动条样式 */
.red-packet-modal-receivers::-webkit-scrollbar {
  width: 6px;
}

.red-packet-modal-receivers::-webkit-scrollbar-track {
  background: #f5f5f5;
  border-radius: 3px;
}

.red-packet-modal-receivers::-webkit-scrollbar-thumb {
  background: #d9d9d9;
  border-radius: 3px;
  transition: all 0.3s;
}

.red-packet-modal-receivers::-webkit-scrollbar-thumb:hover {
  background: #bfbfbf;
}

.receiver-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.receiver-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.receiver-item:first-child {
  padding-top: 0;
}

.receiver-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  margin-right: 12px;
}

.receiver-info {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-width: 0;
}

.receiver-name {
  font-size: 14px;
  color: #333;
  margin-right: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.receiver-time {
  font-size: 12px;
  color: #999;
  white-space: nowrap;
}

.receiver-amount {
  font-size: 15px;
  font-weight: 500;
  color: #ff4d4f;
  margin-left: 8px;
  white-space: nowrap;
}

.red-packet-modal-footer {
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
}

.red-packet-modal-button {
  padding: 8px 20px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.red-packet-modal-button.default {
  background: #f5f5f5;
  color: #666;
}

.red-packet-modal-button.default:hover {
  background: #e8e8e8;
}

/* 撤回消息样式 */
.message-text :deep(.revoke-message) {
  color: #999;
  font-style: italic;
  font-size: 13px;
}

.message-row-self .message-text :deep(.revoke-message) {
  color: #999;
}

/* 红包状态提示样式 */
.red-packet-status-separator {
  text-align: center;
  margin: 12px 0;
  font-size: 12px;
  color: #999;
  position: relative;
}

.red-packet-status-content {
  display: inline-block;
  padding: 4px 12px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 12px;
  font-size: 12px;
  color: #666;
}

.red-packet-status-content :deep(.receiver) {
  color: #1890ff;
  font-weight: 500;
}

.red-packet-status-content :deep(.sender) {
  color: #ff4d4f;
  font-weight: 500;
}

.red-packet-status-content :deep(.message-content) {
  color: #999;
  font-weight: 500;
}

.user-info-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2000;
}

.grouped-users {
  display: flex;
  align-items: center;
  margin-top: 4px;
  gap: 2px;
}

.group-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px solid #fff;
  margin-right: -6px;
}

.plus-one-btn {
  margin-left: 8px;
  background: #f6ffed;
  border: 1px solid #b7eb8f;
  color: #52c41a;
  border-radius: 12px;
  padding: 2px 8px;
  cursor: pointer;
  font-size: 14px;
  align-self: center;
  height: 28px;
  display: flex;
  align-items: center;
}

.grouped-users span {
  margin-left: 8px;
}

.red-packet-sender {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.sender-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 8px;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.sender-name {
  font-size: 15px;
  font-weight: 500;
  color: #fff;
}

.current-user-tag {
  display: inline-block;
  background: #1890ff;
  color: #fff;
  font-size: 12px;
  padding: 0 6px;
  border-radius: 10px;
  margin-left: 6px;
  line-height: 1.5;
}

.lucky-king-tag {
  display: inline-block;
  background: #ffd700;
  color: #fff;
  font-size: 12px;
  padding: 0 6px;
  border-radius: 10px;
  margin-left: 6px;
  line-height: 1.5;
}

.red-packet-message {
  font-size: 15px;
  margin: 12px 0;
  color: #fffbe6;
}

.red-packet-amount {
  font-size: 32px;
  font-weight: bold;
  margin: 8px 0;
}

.red-packet-amount .unit {
  font-size: 16px;
  font-weight: normal;
  margin-left: 4px;
}

.red-packet-info {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
}

/* 添加新的样式 */
.rock-paper-scissors-buttons {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  justify-content: center;
}

.gesture-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid #ff4d4f;
  background: #fff;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.gesture-btn:hover {
  background: #fff1f0;
  transform: scale(1.1);
}

.message-row-self .gesture-btn {
  border-color: #1890ff;
}

.message-row-self .gesture-btn:hover {
  background: #e6f7ff;
}

/* 弹幕样式 */
.barrager-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
  z-index: 9999;
}

.barrager-item {
  position: fixed;
  left: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 20px;
  white-space: nowrap;
  animation: barrager-move linear;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  will-change: transform;
  transform: translateZ(0);
}

.barrager-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.barrager-content {
  font-size: 14px;
  font-weight: 500;
  color: #fff;
}

@keyframes barrager-move {
  from {
    transform: translate3d(100vw, 0, 0);
  }

  to {
    transform: translate3d(-100%, 0, 0);
  }
}

/* 添加链接样式 */
.message-text :deep(a) {
  color: #1890ff;
  text-decoration: none;
  word-break: break-all;
}

.message-text :deep(a:hover) {
  text-decoration: underline;
}

.message-row-self .message-text :deep(a) {
  color: #096dd9;
}

/* 添加弹幕消息的隐藏样式 */
.barrager-message {
  display: none;
}
</style>