<template>
  <div class="chatroom-container">
    <div class="chat-area" :class="{ 'full-width': !showSidebar }">
      <!-- 聊天头部组件 -->
      <ChatHeader />

      <!-- 消息列表组件 -->
      <MessageList
        :messages="messages"
        :is-loading-more="isLoadingMore"
        :has-more-messages="hasMoreMessages"
        @load-more="handleLoadMore"
        @at-user="handleAtUser"
        @send-same-message="handleSendSameMessage"
        @quote="handleQuote"
        @add-emoji="handleAddEmoji"
      />

      <!-- 消息输入组件 -->
      <RoomChatInput
        ref="chatInputRef"
        :online-users="onlineUsers"
        @send-message="handleSendMessage"
        @select-emoji="handleSelectEmoji"
        @select-image="handleSelectImage"
        @send-red-packet="handleSendRedPacket"
      />
    </div>

    <!-- 侧边栏切换按钮 -->
    <div
      class="sidebar-toggle"
      :class="{ 'sidebar-hidden': !showSidebar }"
      @click="toggleSidebar"
    >
      <i
        :class="showSidebar ? 'fas fa-chevron-right' : 'fas fa-chevron-left'"
      ></i>
    </div>

    <div class="sidebar" v-show="showSidebar">
      <!-- 侧边栏组件 -->
      <Sidebar
        :online-users="onlineUsers"
        :current-topic="currentTopic"
        @topic-click="handleTopicClick"
      />
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
import { userApi } from "../api/user";
import { ElMessage } from "element-plus";
import { ArrowLeft, ArrowRight } from "@element-plus/icons-vue";

const chatInputRef = ref(null);
const userStore = useUserStore();

// 聊天室状态
const messages = ref([]);
const currentPage = ref(1);
const isLoadingMore = ref(false);
const hasMoreMessages = ref(true);

// 在线用户和话题
const onlineUsers = ref([]);
const currentTopic = ref("");

// 侧边栏状态
const showSidebar = ref(true);

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

// 消息处理器映射
const messageHandlers = {
  online: (data) => {
    console.log("处理在线用户消息:", data);
    onlineUsers.value = data.users || [];
    currentTopic.value = data.discussing || "";
    // 保存在线用户列表到 utools.dbStorage
    utools.dbStorage.setItem("fishpi_online_users", data.users || []);
  },
  msg: (data) => {
    console.log("处理聊天消息:", data);
    // 确保消息有必要字段，并添加到消息列表
    if (data.oId && data.content) {
      const isSelf = data.userName === userStore.userInfo?.userName;
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
  console.log("接收到消息：", data);

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
      // 所有分页的消息都需要翻转
      const reversedMessages = response.data
        .reverse()
        .map((msg) => ({ ...msg, isHistory: true }));

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
      if (response.data.length < 20) {
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

// 定义账号切换处理函数
const handleAccountSwitch = async () => {
  // 断开旧的连接
  wsManager.close("chat-room");
  // 清空消息列表
  messages.value = [];
  currentPage.value = 1;
  hasMoreMessages.value = true;
  // 重新连接并加载消息
  await connectWebSocket();
  await loadMessages();
  // 重新获取侧边栏状态
  const userSettings = getUserSettings();
  showSidebar.value = !userSettings.defaultChatSidebarCollapsed;
};

onMounted(() => {
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
});

onUnmounted(() => {
  wsManager.close("chat-room");
  // 移除事件监听
  window.removeEventListener("fishpi:account-switched", handleAccountSwitch);
});
</script>

<style scoped>
.chatroom-container {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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
  background-color: #f8f9fa;
  border-left: 1px solid #eee;
  transition: all 0.3s ease;
}

.sidebar-toggle {
  position: absolute;
  right: 150px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 40px;
  background-color: #f8f9fa;
  border: 1px solid #eee;
  border-right: none;
  border-radius: 4px 0 0 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  transition: all 0.3s ease;
}

.sidebar-toggle.sidebar-hidden {
  right: 0;
}

.sidebar-toggle:hover {
  background-color: #e9ecef;
}

.sidebar-toggle i {
  font-size: 12px;
  color: #666;
}

/* 通知消息样式 */
.notification-message {
  text-align: center;
  color: #999;
  font-size: 12px;
  margin: 8px auto;
  padding: 4px 0;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.notification-message .changer {
  color: #1890ff;
  font-weight: 500;
}

.notification-message .new-topic {
  color: #1890ff;
  font-weight: 500;
  font-style: italic;
}
</style>
