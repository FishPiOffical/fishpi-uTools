<template>
  <div class="chatroom-container">
    <div class="chat-area" :class="{ 'full-width': !showSidebar }">
      <!-- 聊天头部组件 -->
      <ChatHeader />
      <!-- 消息列表组件 -->
      <MessageList :messages="messages" :is-loading-more="isLoadingMore" :has-more-messages="hasMoreMessages"
        :show-sidebar="showSidebar" @load-more="handleLoadMore" @at-user="handleAtUser"
        @send-same-message="handleSendSameMessage" @quote="handleQuote" @add-emoji="handleAddEmoji"
        @update-messages="handleUpdateMessages" />
      <!-- 消息输入组件 -->
      <RoomChatInput ref="chatInputRef" :online-users="onlineUsers" @send-message="handleSendMessage"
        @select-emoji="handleSelectEmoji" @select-image="handleSelectImage" @send-red-packet="handleSendRedPacket" />
    </div>
    <!-- 侧边栏切换按钮 -->
    <div class="sidebar-toggle" :class="{ 'sidebar-hidden': !showSidebar }" @click="toggleSidebar">
      <i :class="showSidebar ? 'fas fa-chevron-right' : 'fas fa-chevron-left'"></i>
    </div>
    <div class="sidebar" v-show="showSidebar">
      <!-- 侧边栏组件 -->
      <Sidebar :online-users="onlineUsers" :current-topic="currentTopic" @topic-click="handleTopicClick" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from "vue";
import ChatHeader from "../components/ChatHeader.vue";
import MessageList from "../components/MessageList.vue";
import RoomChatInput from "../components/RoomChatInput.vue";
import Sidebar from "../components/Sidebar.vue";
import { chatApi } from "../api/chat";
import wsManager from "../utils/websocket";
import { useUserStore } from "../stores/user";
import { useChatroomStore } from "../stores/chatroom";
import { userApi } from "../api/user";
import { ElMessage } from "element-plus";
import { ArrowLeft, ArrowRight } from "@element-plus/icons-vue";

const chatInputRef = ref(null);
const userStore = useUserStore();
const chatroomStore = useChatroomStore();

// 聊天室状态
const messages = ref([]);
const currentPage = ref(1);
const isLoadingMore = ref(false);
const hasMoreMessages = ref(true);

// 在线用户和话题 - 从store获取
const onlineUsers = ref([]);
const currentTopic = ref("");

// 侧边栏状态
const showSidebar = ref(true);

const bells = ref([])

// 获取用户设置
const getUserSettings = () => {
  const savedSettings = utools.dbStorage.getItem("fishpi_settings") || {};
  const currentUsername = userStore.userInfo?.userName;
  return currentUsername ? savedSettings[currentUsername] || {} : savedSettings;
};

// 切换侧边栏显示状态
const toggleSidebar = () => {
  showSidebar.value = !showSidebar.value;
  // 保存到设置中
  const userSettings = getUserSettings();
  userSettings.defaultChatSidebarCollapsed = !showSidebar.value;
  saveUserSettings(userSettings);
};

// 保存用户设置
const saveUserSettings = (settings) => {
  const savedSettings = utools.dbStorage.getItem("fishpi_settings") || {};
  const currentUsername = userStore.userInfo?.userName;

  if (currentUsername) {
    savedSettings[currentUsername] = {
      ...savedSettings[currentUsername],
      ...settings,
    };
  } else {
    Object.assign(savedSettings, settings);
  }

  utools.dbStorage.setItem("fishpi_settings", savedSettings);
};

// 获取当前用户黑名单
const getCurrentBlacklist = () => {
  const allBlacklists = utools.dbStorage.getItem("fishpi_blacklist") || {};
  const currentUser = userStore.userInfo?.userName;
  return currentUser ? allBlacklists[currentUser] || [] : [];
};

// 消息处理器映射
const messageHandlers = {
  online: (data) => {
    // console.log("处理在线用户消息:", data);
    // 使用store更新数据，自动处理缓存
    chatroomStore.updateData(data);
    // 同步到本地ref
    onlineUsers.value = data.users || [];
    currentTopic.value = data.discussing || "";
  },
  msg: (data) => {
    // 确保消息有必要字段，并添加到消息列表
    if (data.oId && data.content) {
      const isSelf = data.userName === userStore.userInfo?.userName;
      const hasImgTag = /\<img[^>]+src=/.test(data.content);
      const containsGenUrlInContent = /https?:\/\/fishpi\.cn\/gen/.test(data.content || '');
      const containsGenUrlInMd = /https?:\/\/fishpi\.cn\/gen/.test(data.md || '');
      // 优先处理“引用”场景：md 中包含引用头，渲染为嵌套 blockquote，并在内部替换特殊图片
      let handledQuote = false;
      if ((data.md || '').includes('引用')) {
        try {
          const md = data.md || '';
          const rendered = renderNestedQuotesFromMd(md);
          if (rendered && rendered.trim()) {
            data.content = rendered;
            handledQuote = true;
          }
        } catch (e) {
          handledQuote = false;
        }
      }
      if (!handledQuote) {
        if (hasImgTag && containsGenUrlInContent) {
          data.content = generateImageCardFromString(data.content);
        } else if (containsGenUrlInMd) {
          data.content = generateImageCardFromString(data.md);
        }
      }

      messages.value = [
        ...messages.value,
        { ...data, isHistory: false, isSelf },
      ];
    }
  },
  barrager: (data) => {
    console.log("处理弹幕消息:", data);
    // 将弹幕消息添加到消息列表，包含完整的用户信息
    messages.value = [
      ...messages.value,
      {
        type: "barrager",
        content: data.barragerContent,
        time: new Date().getTime(),
        _key: `barrager-${Date.now()}`,
        isHistory: false,
        isSelf: false,
        userAvatarURL: data.userAvatarURL,
        userAvatarURL20: data.userAvatarURL20,
        userAvatarURL48: data.userAvatarURL48,
        userAvatarURL210: data.userAvatarURL210,
        userNickname: data.userNickname,
        userName: data.userName,
        barragerColor: data.barragerColor,
      },
    ];
  },
  revoke: (data) => {
    console.log("处理撤回消息:", data);
    // 找到要撤回的消息
    const index = messages.value.findIndex((msg) => msg.oId === data.oId);
    if (index !== -1) {
      // 替换为撤回提示消息
      messages.value[index] = {
        ...messages.value[index],
        content: `<div class="revoke-message">该消息已被撤回</div>`,
        isRevoked: true,
      };
    }
  },
  redPacketStatus: (data) => {
    console.log("处理红包状态更新:", data);
    // 添加红包领取提示消息
    messages.value = [
      ...messages.value,
      {
        type: "red-packet-status",
        content: `<div class=\"red-packet-status-message\">\n          <span class=\"receiver\">${data.whoGot}</span> 领取了 <span class=\"sender\">${data.whoGive}</span> 的红包\n        </div>`,
        time: new Date().getTime(),
        _key: `red-packet-status-${data.oId}-${Date.now()}`,
        isHistory: false,
        isSelf: false,
      },
    ];

    // 更新原红包消息的状态
    const index = messages.value.findIndex((msg) => {
      try {
        const content = JSON.parse(msg.content);
        return content.msgType === "redPacket" && msg.oId === data.oId;
      } catch {
        return false;
      }
    });

    if (index !== -1) {
      const originalMsg = messages.value[index];
      try {
        const content = JSON.parse(originalMsg.content);
        content.got = data.got;
        content.count = data.count;
        messages.value[index] = {
          ...originalMsg,
          content: JSON.stringify(content),
        };
      } catch (error) {
        console.error("更新红包状态失败:", error);
      }
    }
  },
  discussChanged: (data) => {
    console.log("处理话题变更:", data);
    // 更新当前话题
    currentTopic.value = data.newDiscuss;
    // 更新store中的话题
    chatroomStore.updateTopic(data.newDiscuss);

    // 添加话题变更提示消息
    messages.value = [
      ...messages.value,
      {
        type: "discuss-changed",
        whoChanged: data.whoChanged,
        newDiscuss: data.newDiscuss,
        time: new Date().getTime(),
        _key: `discuss-changed-${Date.now()}`,
        isHistory: false,
        isSelf: false,
      },
    ];
  },
  customMessage: (data) => {
    console.log("处理自定义消息:", data);
    // 将自定义消息添加到消息列表
    messages.value = [
      ...messages.value,
      {
        type: "custom-message",
        content: data.message,
        time: new Date().getTime(),
        _key: `custom-message-${Date.now()}`,
        isHistory: false,
        isSelf: false,
      },
    ];
  },
  // 可以根据需要添加其他消息类型的处理器
};

// 获取聊天节点
const getChatNode = async () => {
  try {
    const response = await chatApi.getChatNode();
    return response.data;
  } catch (error) {
    console.error("获取聊天节点失败:", error);
    return null;
  }
};

// 连接WebSocket
const connectWebSocket = async () => {
  try {
    // 先获取节点
    const response = await chatApi.getChatNode();
    if (!response.data) {
      console.error("获取节点失败，无法建立WebSocket连接");
      return;
    }

    // 使用获取到的节点URL直接建立连接
    await wsManager.connect(response.data, {
      connectionId: "chat-room",
    });

    wsManager.on("message", handleMessage, "chat-room");
  } catch (error) {
    console.error("WebSocket连接失败:", error);
  }
};

// 处理接收到的消息
const handleMessage = (data) => {
  // 判断是否为黑名单用户
  if (data.userName) {
    const blacklist = getCurrentBlacklist();
    if (blacklist.some((u) => u.userName === data.userName)) {
      return; // 黑名单消息直接丢弃
    }
  }
  // console.log("接收到消息：", data);

  // 根据消息类型调用相应的处理器
  const handler = messageHandlers[data.type];

  if (handler) {
    handler(data);
  } else {
    // 如果没有特定的处理器，将其视为普通聊天消息
    // 确保消息有必要字段，并添加到消息列表
    if (data.oId && data.content) {
      const isSelf = data.userName === userStore.userInfo?.userName;
      messages.value = [...messages.value, { ...data, isSelf }];
    }
  }
};

// 加载历史消息
const loadMessages = async (page = 1) => {
  if (isLoadingMore.value || (!hasMoreMessages.value && page !== 1)) return;
  isLoadingMore.value = true;
  try {
    const response = await chatApi.getChatMessages(page);
    if (response.data && response.data.length > 0) {
      // 过滤黑名单消息
      const blacklist = getCurrentBlacklist();
      const filteredMessages = response.data.filter((msg) => {
        if (!msg.userName) return true;
        return !blacklist.some((u) => u.userName === msg.userName);
      });
      // 所有分页的消息都需要翻转
      const reversedMessages = filteredMessages
        .reverse()
        .map((msg) => {
          try {
            const content = replaceSpecialImagesInHtmlContent(msg.content || '');
            return { ...msg, content, isHistory: true };
          } catch (e) {
            return { ...msg, isHistory: true };
          }
        });

      if (page === 1) {
        messages.value = reversedMessages;
        // 只在第一次加载时滚动到底部
        nextTick(() => {
          const messageList = document.querySelector(".message-list");
          if (messageList) {
            messageList.scrollTop = messageList.scrollHeight;
          }
        });
      } else {
        // 保存当前滚动位置
        const messageList = document.querySelector(".message-list");
        const scrollHeight = messageList.scrollHeight;
        const scrollTop = messageList.scrollTop;

        // 将新消息添加到数组前面
        messages.value = [...reversedMessages, ...messages.value];

        // 在下一个渲染周期恢复滚动位置
        nextTick(() => {
          const newScrollHeight = messageList.scrollHeight;
          messageList.scrollTop = scrollTop + (newScrollHeight - scrollHeight);
        });
      }

      // 检查是否还有更多消息
      if (filteredMessages.length < 20) {
        hasMoreMessages.value = false;
      }
    } else {
      hasMoreMessages.value = false;
    }
  } catch (error) {
    console.error("加载消息失败:", error);
    hasMoreMessages.value = false;
  } finally {
    isLoadingMore.value = false;
  }
};

// 处理加载更多消息
const handleLoadMore = () => {
  currentPage.value++;
  loadMessages(currentPage.value);
};

// 处理发送消息
const handleSendMessage = async (content) => {
  if (!content || !content.trim()) return;

  try {
    await chatApi.sendMessage(content);
  } catch (error) {
    console.error("发送消息失败:", error);
  }
};

// 处理选择表情
const handleSelectEmoji = (emoji) => {
  if (typeof emoji === "string") {
    // 默认表情已经在 RoomChatInput 中处理了
    return;
  }

  // 处理表情包 - 发送 Markdown 格式的图片表情
  const markdownEmoji = `![图片表情](${emoji.cover})`;
  chatApi
    .sendMessage(markdownEmoji)
    .then(() => {
      // 重新加载消息列表
      messages.value = [];
      currentPage.value = 1;
      hasMoreMessages.value = true;
      loadMessages(1);
    })
    .catch((error) => {
      console.error("发送表情包消息失败:", error);
    });
};

// 处理选择图片
const handleSelectImage = () => {
  // TODO: 处理图片选择
  console.log("选择图片");
};

// 处理发送红包
const handleSendRedPacket = async (redPacketData) => {
  try {
    const { msg, money, count, type, gesture, recivers } = redPacketData;
    const redPacketContent = JSON.stringify({
      msg,
      money,
      count,
      type,
      gesture,
      recivers: recivers || [],
    });

    const content = `[redpacket]${redPacketContent}[/redpacket]`;
    await chatApi.sendMessage(content);
  } catch (error) {
    console.error("发送红包失败:", error);
  }
};

const handleAtUser = (userName) => {
  chatInputRef.value?.insertAtUser(userName);
};

// 处理+1按钮
const handleSendSameMessage = (content) => {
  if (!content) return;
  handleSendMessage(content);
};

// 处理话题点击
const handleTopicClick = (formattedTopic) => {
  chatInputRef.value?.insertTopic(formattedTopic);
};

// 处理引用消息
const handleQuote = (message) => {
  chatInputRef.value?.setQuote(message);
};

// 处理添加表情
const handleAddEmoji = async (item) => {
  try {
    // 从消息内容中提取图片URL
    const match = item.content.match(/<img[^>]+src=["']([^"']+)["']/);
    if (!match || !match[1]) {
      ElMessage.warning("无法提取表情图片地址");
      return;
    }

    const imgSrc = match[1];
    // 获取当前表情包列表
    const res = await userApi.getEmotionPack("emojis");

    if (res.code !== 0) {
      ElMessage.error("获取表情包列表失败");
      return;
    }

    // 解析表情包数据，处理空数据的情况
    let urls = [];
    try {
      urls = res.data ? JSON.parse(res.data) : [];
      // 确保urls是数组
      if (!Array.isArray(urls)) {
        urls = [];
      }
    } catch (e) {
      console.warn("解析表情包数据失败，将使用空数组", e);
      urls = [];
    }

    // 检查是否已存在相同的表情
    if (urls.includes(imgSrc)) {
      ElMessage.warning("该表情已存在");
      return;
    }

    // 添加新的图片URL
    urls.push(imgSrc);

    // 同步到服务器
    const syncRes = await userApi.syncEmotionPack(
      "emojis",
      JSON.stringify(urls)
    );
    if (syncRes.code === 0) {
      ElMessage.success("添加表情成功");
    } else {
      ElMessage.error("同步表情包失败");
    }
  } catch (error) {
    console.error("添加表情失败:", error);
    ElMessage.error("添加表情失败：" + (error.message || "未知错误"));
  }
};

// 处理黑名单过滤后的消息更新
const handleUpdateMessages = (filteredMessages) => {
  messages.value = filteredMessages;
};

// 定义账号切换处理函数
const handleAccountSwitch = async () => {
  // 断开旧的连接
  wsManager.close("chat-room");
  // 清空消息列表
  messages.value = [];
  currentPage.value = 1;
  hasMoreMessages.value = true;
  // 清除聊天室缓存
  chatroomStore.clearCache();
  // 重新连接并加载消息
  await connectWebSocket();
  await loadMessages();
  // 重新获取侧边栏状态
  const userSettings = getUserSettings();
  showSidebar.value = !userSettings.defaultChatSidebarCollapsed;
};

// 监听黑名单更新事件
const handleBlacklistUpdated = (event) => {
  const { action, userName } = event.detail;

  if (action === "add") {
    // 添加黑名单：过滤当前消息列表，移除该用户的消息
    const blacklist = getCurrentBlacklist();
    const blacklistUserNames = blacklist.map((u) => u.userName);

    // 过滤掉黑名单用户的消息
    const filteredMessages = messages.value.filter((msg) => {
      if (!msg.userName) return true; // 系统消息保留
      return !blacklistUserNames.includes(msg.userName);
    });

    messages.value = filteredMessages;
  } else if (action === "remove") {
    // 移除黑名单：需要重新加载消息，因为可能有该用户的历史消息需要显示
    // 重新加载当前页的消息
    const currentMessages = messages.value;
    currentPage.value = 1;
    hasMoreMessages.value = true;
    loadMessages(1);
  }
};

const getBells = () => {
  const savedBells = utools.dbStorage.getItem("fishpi_bells") || [];
  return savedBells;
}
// 检查是否包含
const checkBellsInMessage = (mainString, elementsArray) => {
  const foundElements = elementsArray.filter(element =>
    mainString.includes(element)
  );
  return foundElements.length > 0;
}

//从特殊图片链接字符串中解析参数
const parseImageParams = (inputStr) => {
  console.log("parseImageParams12222222222222222222222222222333333123333333333333333333333333333333:", inputStr); 
  // 支持三种输入：Markdown 图片、HTML <img>、直接 URL 字符串
  let url = null;
  let title = null;
  // Markdown
  const mdMatch = inputStr.match(/!\[.*?\]\((https?[^)]+)\)/);
  if (mdMatch) {
    url = mdMatch[1];
  }
  // HTML <img>
  if (!url) {
    const htmlMatch = inputStr.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (htmlMatch) {
      url = htmlMatch[1];
      const titleMatch = inputStr.match(/<img[^>]+title=["']([^"']+)["']/i);
      if (titleMatch) {
        title = titleMatch[1];
      }
    }
  }
  // 直接 URL
  if (!url && /^https?:\/\//.test(inputStr.trim())) {
    url = inputStr.trim();
  }

  if (!url) {
    throw new Error('未找到有效的图片URL');
  }

  // 解析URL参数
  const decodeHtmlEntities = (s) => String(s)
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

  const normalizedUrl = decodeHtmlEntities(url);
  const urlObj = new URL(normalizedUrl);
  const urlParams = new URLSearchParams(urlObj.search);
  // 解析颜色参数：支持单色、逗号分隔多色或 auto
  const parseColorParam = (raw) => {
    if (!raw) return { value: null, values: null, isAuto: false };
    const v = String(raw).trim();
    if (!v) return { value: null, values: null, isAuto: false };
    if (v.toLowerCase() === 'auto') return { value: 'auto', values: null, isAuto: true };
    const parts = v.split(',').map(s => s.trim()).filter(Boolean);
    const normalizeHex = (s) => s.startsWith('#') ? s : ('#' + s);
    if (parts.length > 1) {
      return { value: null, values: parts.map(normalizeHex), isAuto: false };
    }
    return { value: normalizeHex(parts[0]), values: null, isAuto: false };
  };

  const backParsed = parseColorParam(urlParams.get('backcolor'));
  const fontParsed = parseColorParam(urlParams.get('fontcolor'));

  return {
    // 原有字段
    imageUrl: urlParams.get('url'),
    text: (() => { const t = urlParams.get('txt'); try { return t ? decodeURIComponent(t) : t; } catch { return t; } })(),
    backgroundColor: backParsed.value, // 单色时为字符串；多色/auto时为 null
    fontColor: fontParsed.value,       // 单色时为字符串；多色/auto时为 null
    altText: "图片表情",
    originalUrl: normalizedUrl,
    title: title || '加辣',

    // 新增字段
    version: urlParams.get('ver') || '0.1',
    way: urlParams.get('way') || 'bottom',
    fontway: urlParams.get('fontway') || 'bottom',
    shadow: parseFloat(urlParams.get('shadow')),
    anime: parseFloat(urlParams.get('anime')),
    border: parseInt(urlParams.get('border')),
    barlen: parseInt(urlParams.get('barlen')),
    fontsize: parseInt(urlParams.get('fontsize')),
    barradius: parseInt(urlParams.get('barradius')),

    // 颜色增强信息
    backgroundColors: backParsed.values, // 多色时为数组，否则为 null
    backgroundAuto: backParsed.isAuto,
    fontColors: fontParsed.values,       // 多色时为数组，否则为 null
    fontAuto: fontParsed.isAuto,
  };
}
//重新生成特殊图片消息内容（兼容旧签名 + 新参数对象）
const generateImageCard = (arg1, text, backgroundColor = '#F59B95', fontColor = '#f3f1f1', scale = 0.7) => {
  const isNew = typeof arg1 === 'object' && arg1 !== null && 'imageUrl' in arg1;
  const p = isNew
    ? arg1
    : {
      imageUrl: arg1,
      text,
      backgroundColor,
      fontColor,
      scale,
      title: '加辣',
      version: '0.1',
      way: 'bottom',
      fontway: 'bottom',
      shadow: 0,
      anime: 0.7,
      size: 48,
      border: 10,
      barlen: undefined,
      fontsize: 18,
      barradius: 80,
      backgroundColors: null,
      backgroundAuto: false,
      fontColors: null,
      fontAuto: false,
    };

  const toCssDirection = (dir) => {
    const map = {
      top: 'to top',
      bottom: 'to bottom',
      left: 'to left',
      right: 'to right',
      'top-left': 'to top left',
      'top-right': 'to top right',
      'bottom-left': 'to bottom left',
      'bottom-right': 'to bottom right',
    };
    if (!dir) return 'to bottom';
    if (/^\d+deg$/.test(dir)) return dir;
    return map[dir] || 'to bottom';
  };

  const buildBackground = () => {
    const dir = toCssDirection(p.way);
    if (p.backgroundAuto) {
      return `linear-gradient(${dir}, #ffecd2, #fcb69f)`;
    }
    if (Array.isArray(p.backgroundColors) && p.backgroundColors.length > 1) {
      return `linear-gradient(${dir}, ${p.backgroundColors.join(', ')})`;
    }
    return p.backgroundColor || '#F59B95';
  };

  const buildFontStyles = () => {
    const dir = toCssDirection(p.fontway);
    if (p.fontAuto) {
      return {
        color: 'transparent',
        bg: `linear-gradient(${dir}, #89f7fe, #66a6ff)`,
      };
    }
    if (Array.isArray(p.fontColors) && p.fontColors.length > 1) {
      return {
        color: 'transparent',
        bg: `linear-gradient(${dir}, ${p.fontColors.join(', ')})`,
      };
    }
    return { color: p.fontColor || '#f3f1f1', bg: null };
  };

  const bg = buildBackground();
  const font = buildFontStyles();
  const figureHeight = Number.isFinite(p.size) ? `${p.size}px` : '48px';
  const avatarSize = Number.isFinite(p.size) ? `${Math.max(24, Math.round(p.size * 0.98))}px` : '47px';
  const padding = Number.isFinite(p.border) ? `${p.border}px` : '10px';
  const boxShadowBlur = Number.isFinite(p.border) ? Math.max(6, 10 + p.border) : 10;
  const shadowOpacity = Number.isFinite(p.shadow) ? Math.min(1, Math.max(0, p.shadow)) : 0.5;
  const animationDuration = Number.isFinite(p.anime) ? p.anime : 0.7;
  const captionFontSize = Number.isFinite(p.fontsize) ? `${p.fontsize}px` : '18px';
  const captionRadius = Number.isFinite(p.barradius) ? `${p.barradius}px` : '80px';
  const captionWidth = Number.isFinite(p.barlen) ? `${p.barlen}px` : 'auto';
  const transformScale = Number.isFinite(p.scale) ? p.scale : 0.7;

  const captionExtra = font.bg
    ? `background: ${font.bg}; -webkit-background-clip: text; background-clip: text; color: transparent;`
    : `color: ${font.color};`;

  return `
<figure style="
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 0;
    line-height: 0;
    background: ${bg};
    padding: ${padding};
    border-radius: ${captionRadius};
    text-align: center;
    box-shadow: rgba(0,0,0,${shadowOpacity}) 0px 0px ${boxShadowBlur}px;
    position: relative;
    height: ${figureHeight};
    transform: scale(${transformScale});
    transform-origin: left center;
">
    <img src="${p.imageUrl}" 
         alt="${p.text}" 
         title="${p.title || '加辣'}" 
         style="
            position: absolute;
            width:${avatarSize};
            height: ${avatarSize};
            left:0px;
            border-radius: 50%;
            box-shadow: rgba(255, 254, 238, ${Math.min(1, 0.6 + shadowOpacity / 2)}) 0px 0px 10px;
         ">
    <figcaption style="
        ${captionExtra}
        font-family: sans-serif;
        font-size: ${captionFontSize};
        line-height: 1.2;
        margin-left: calc(${avatarSize} - 5px);
        opacity: 0;
        transform: translateX(-30px);
        animation: fadeSlideIn ${animationDuration}s ease-out 0.5s forwards;
        display: inline-block;
        min-width: ${captionWidth};
        border-radius: ${captionRadius};
        padding: 0 6px;
    ">${p.text}</figcaption>
</figure>
  `.trim();
}
//根据输入字符串生成图片卡片内容
const generateImageCardFromString = (inputStr) => {
  const params = parseImageParams(inputStr);
  return generateImageCard(params);
}

// 在完整 HTML 片段中将 fishpi 特殊图片 <img> 原位替换为 <figure>
const replaceSpecialImagesInHtmlContent = (html) => {
  if (!html) return html;
  return html.replace(/<img[^>]+src=["'](https?:[^"']*fishpi\.cn\/gen[^"']*)["'][^>]*>/gi, (match) => {
    console.log("match12222222222222222222222222222333333123333333333333333333333333333333:", match);
    try {
      return generateImageCardFromString(match);
    } catch (e) {
      return match;
    }
  });
};

// 将 Markdown 中的特殊图片语法替换成生成的 figure（支持多处）
const replaceSpecialImagesInLine = (line) => {
  return line.replace(/!\[[^\]]*\]\((https?:[^)]+fishpi\.cn\/gen[^)]*)\)/g, (match) => {
    try {
      return generateImageCardFromString(match);
    } catch (e) {
      return match;
    }
  });
};

// 转义 HTML
const escapeHtml = (s) => String(s)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/\"/g, '&quot;')
  .replace(/'/g, '&#39;');

// 渲染引用头部 h5（##### 引用 @user [↩](url "title")）
const renderQuoteHeader = (content) => {
  const m = content.match(/^#{1,6}\s*引用\s*@([^\s\[]+)\s*\[[^\]]*\]\(([^)\s]+)(?:\s+\"[^\"]*\")?\)/);
  if (!m) return null;
  const user = m[1];
  const link = m[2];
  const memberUrl = user ? `https://fishpi.cn/member/${user}` : '#';
  return `<h5>引用 @<a href="${memberUrl}" aria-label="${user}" rel="nofollow">${user}</a> <a href="${link}" title="跳转至原消息" rel="nofollow">↩</a></h5>`;
};

// 将包含多级 > 的 Markdown 引用转换为嵌套的 blockquote 结构，且在任意层内替换特殊图片
const renderNestedQuotesFromMd = (md) => {
  const full = String(md || '');
  const headerIdx = full.search(/#{1,6}\s*引用\s*@/);
  const lines = full.split('\n');
  // 计算第一条以 > 开头的行的字符位置
  let firstQuoteLineIdx = -1;
  let pos = 0;
  for (let li = 0; li < lines.length; li++) {
    if (/^\s*>+/.test(lines[li])) { firstQuoteLineIdx = pos; break; }
    pos += lines[li].length + 1; // +1 for the newline
  }
  // 计算起始：取最早出现的 引用头 或 > 行
  let startIdx = -1;
  if (headerIdx >= 0 && firstQuoteLineIdx >= 0) startIdx = Math.min(headerIdx, firstQuoteLineIdx);
  else if (headerIdx >= 0) startIdx = headerIdx;
  else startIdx = firstQuoteLineIdx; // may be -1

  let leadRaw = '';
  let quoteSegment = '';
  if (startIdx >= 0) {
    leadRaw = full.slice(0, startIdx).trim();
    quoteSegment = full.slice(startIdx);
  } else {
    // 没有引用，仅正文
    return full.trim() ? `<p>${escapeHtml(full.trim())}</p>` : '';
  }

  const qLines = quoteSegment.split('\n');
  let htmlParts = [];
  let currentLevel = 0;
  // 如果开头就是“##### 引用 @...”而非 > 行，先渲染 header 行
  const firstLine = qLines[0] || '';
  const firstHeader = renderQuoteHeader(firstLine.trim());
  let qStart = 0;
  if (firstHeader) {
    htmlParts.push(firstHeader);
    qStart = 1;
  }
  // 从 qStart 开始处理 > 引用行
  for (let i = qStart; i < qLines.length; i++) {
    const line = qLines[i];
    const m = line.match(/^\s*(>+)\s?(.*)$/);
    if (!m) { continue; }
    const level = m[1].length;
    const content = m[2];
    if (level > currentLevel) {
      for (let k = 0; k < level - currentLevel; k++) htmlParts.push('<blockquote>');
    } else if (level < currentLevel) {
      for (let k = 0; k < currentLevel - level; k++) htmlParts.push('</blockquote>');
    }
    currentLevel = level;
    const trimmed = content.trim();
    const headerHtml = renderQuoteHeader(trimmed);
    if (headerHtml) {
      htmlParts.push(headerHtml);
    } else {
      const replaced = replaceSpecialImagesInLine(trimmed);
      if (replaced === trimmed) {
        const safe = escapeHtml(trimmed);
        if (safe.trim()) htmlParts.push(`<p>${safe}</p>`);
      } else {
        htmlParts.push(`<p>${replaced}</p>`);
      }
    }
  }
  for (let k = 0; k < currentLevel; k++) htmlParts.push('</blockquote>');

  const leadHtml = leadRaw ? `<p>${escapeHtml(leadRaw)}</p>` : '';
  return leadHtml + htmlParts.join('');
};


onMounted(() => {
  // 初始化聊天室store
  chatroomStore.init();


  // 从缓存加载数据到本地ref
  onlineUsers.value = chatroomStore.cachedOnlineUsers;
  currentTopic.value = chatroomStore.cachedTopic;

  bells.value = getBells();

  // 从设置中获取侧边栏状态
  const userSettings = getUserSettings();
  showSidebar.value = !userSettings.defaultChatSidebarCollapsed;

  connectWebSocket();
  loadMessages();
  // 设置输入框焦点
  nextTick(() => {
    chatInputRef.value?.focus();
  });

  // 监听账号切换事件
  window.addEventListener("fishpi:account-switched", handleAccountSwitch);

  // 监听黑名单更新事件
  window.addEventListener("fishpi:blacklist-updated", handleBlacklistUpdated);
});

onUnmounted(() => {
  wsManager.close("chat-room");
  // 移除事件监听
  window.removeEventListener("fishpi:account-switched", handleAccountSwitch);
  window.removeEventListener(
    "fishpi:blacklist-updated",
    handleBlacklistUpdated
  );
});
</script>

<style scoped>
.chatroom-container {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background-color: var(--background-color);
  position: relative;
}

.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
}

.chat-area.full-width {
  margin-right: 0;
}

.sidebar {
  width: 150px;
  background-color: var(--card-bg);
  border-left: 1px solid var(--border-color);
  transition: all 0.3s ease;
}

.sidebar-toggle {
  position: absolute;
  right: 150px;
  top: 50%;
  transform: translateY(-50%);
  width: 12px;
  height: 40px;
  background-color: var(--hover-bg);
  border: 1px solid var(--border-color);
  border-right: none;
  border-radius: 12px 0 0 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  transition: all 0.3s ease;
  opacity: 0;
  pointer-events: none;
}

.sidebar-toggle.sidebar-hidden {
  right: 0;
}

.sidebar-toggle:hover {
  background-color: var(--border-color);
}

.sidebar-toggle i {
  font-size: 12px;
  color: var(--sub-text-color);
}

/* 通知消息样式 */
.notification-message {
  text-align: center;
  color: var(--sub-text-color);
  font-size: 12px;
  margin: 8px auto;
  padding: 4px 0;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.notification-message .changer {
  color: var(--primary-color);
  font-weight: 500;
}

.notification-message .new-topic {
  color: var(--primary-color);
  font-weight: 500;
  font-style: italic;
}

.sidebar-toggle {
  opacity: 1;
  pointer-events: auto;
}
</style>