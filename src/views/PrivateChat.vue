<template>
  <div class="private-chat-container">
    <div class="chat-list">
      <div class="chat-list-header">
        <h2>私信列表</h2>
        <div class="search-icon" @click="showSearch = true">
          <i class="fas fa-search"></i>
        </div>
      </div>
      <div class="chat-list-content">
        <div v-for="chat in chatList" :key="chat.user_session" class="chat-item"
          :class="{ active: currentChat === chat.user_session }" @click="selectChat(chat)">
          <img :src="
              chat.senderUserName === userStore.userInfo?.userName
                ? chat.receiverAvatar
                : chat.senderAvatar
            " alt="avatar" class="avatar" />
          <span :class="[
              'online-status',
              chat.receiverOnlineFlag ? 'online' : 'offline',
            ]"></span>
          <div class="chat-info">
            <div class="user-name">
              {{
              chat.senderUserName === userStore.userInfo?.userName
              ? chat.receiverUserName
              : chat.senderUserName
              }}
              <span v-if="chat.unreadCount" class="unread-badge">{{
                chat.unreadCount
                }}</span>
            </div>
            <div class="last-message">{{ chat.preview }}</div>
          </div>
        </div>
      </div>
    </div>
    <div class="chat-window">
      <template v-if="currentChat">
        <div class="chat-header">
          <h3>
            {{
            currentChatInfo?.receiverUserName === userStore.userInfo?.userName
            ? currentChatInfo?.senderUserName
            : currentChatInfo?.receiverUserName
            }}
          </h3>
          <!-- You might want to add icons for call, video, etc. here based on your design -->
        </div>
        <div class="messages-container" ref="messagesContainer" @scroll="handleScroll">
          <div v-if="isLoadingMore" class="loading-more">加载中...</div>
          <div v-if="!hasMoreMessages && messages.length > 0" class="no-more-messages">
            没有更多消息了
          </div>

          <div class="messages-list">
            <template v-for="(item, index) in displayedMessages" :key="item.oId || 'separator-' + index">
              <div v-if="item.type === 'time-separator'" class="time-separator">
                {{ item.timestamp }}
              </div>
              <div v-else class="message-row" :class="{
                  'message-row-self':
                    item.senderUserName === userStore.userInfo?.userName,
                }" @contextmenu.prevent="handleContextMenu($event, item)">
                <img :src="item.senderAvatar" alt="avatar" class="message-avatar"
                  @click="showUserProfile(item.senderUserName)" />
                <div class="message-bubble">
                  <div class="message-text" v-html="processMessageContent(item.content)" @click="
                      (e) => {
                        handleImageClick(e);
                        handleLinkClick(e);
                      }
                    " @load="handleImageLoad"></div>
                </div>
              </div>
            </template>
          </div>
        </div>

        <!-- 使用 ChatInput 组件 -->
        <ChatInput ref="chatInputRef" v-model:message="newMessage" :show-transfer="true" :receiver-user-name="
            currentChatInfo?.receiverUserName === userStore.userInfo?.userName
              ? currentChatInfo?.senderUserName
              : currentChatInfo?.receiverUserName
          " @send-message="sendMessage" @select-emoji="handleSelectEmoji" @select-image="handleSelectImage"
          @transfer-success="handleTransferSuccess" @transfer-error="handleTransferError" />
      </template>
      <div v-else class="no-chat-selected">
        <div class="empty-state">
          <div class="empty-illustration">
            <div class="simple-icon">
              <span class="icon-heart">💬</span>
            </div>
          </div>
          <h3>开始聊天</h3>
          <p>选择一个好友开始聊天吧</p>
          <div class="features">
            <div class="feature">
              <span class="feature-icon">💬</span>
              <span class="feature-text">发送消息</span>
            </div>
            <div class="feature">
              <span class="feature-icon">😊</span>
              <span class="feature-text">表情互动</span>
            </div>
            <div class="feature">
              <span class="feature-icon">🖼️</span>
              <span class="feature-text">发送图片</span>
            </div>
            <div class="feature">
              <span class="feature-icon">💰</span>
              <span class="feature-text">转账</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 搜索弹窗 -->
    <el-dialog v-model="showSearch" title="搜索用户" width="400px" :close-on-click-modal="true"
      :close-on-press-escape="true" class="search-dialog">
      <div class="search-container">
        <el-input v-model="searchQuery" placeholder="输入用户名搜索" clearable @input="handleSearch">
          <template #prefix>
            <i class="fas fa-search"></i>
          </template>
        </el-input>

        <!-- 在线用户列表 -->
        <div v-if="!searchQuery" class="online-users-section">
          <div class="section-title">
            <i class="fas fa-circle text-success"></i>
            <span>在线用户（{{ onlineUsers.length }}） </span>
          </div>
          <div class="online-users-list">
            <div v-for="user in onlineUsers" :key="user.userName" class="search-result-item" @click="startChat(user)">
              <img :src="user.userAvatarURL" alt="avatar" class="user-avatar" />
              <span class="user-name">{{ user.userName }}</span>
            </div>
          </div>
        </div>

        <!-- 搜索结果 -->
        <div v-else-if="searchResults.length > 0" class="search-results">
          <div v-for="user in searchResults" :key="user.userName" class="search-result-item" @click="startChat(user)">
            <img :src="user.userAvatarURL" alt="avatar" class="user-avatar" />
            <span class="user-name">{{ user.userName }}</span>
          </div>
        </div>
        <div v-else-if="searchQuery && !isSearching" class="no-results">
          未找到相关用户
        </div>
      </div>
    </el-dialog>

    <!-- 使用 MsgContextMenu 组件 -->
    <MsgContextMenu :visible="contextMenuVisible" :x="contextMenuX" :y="contextMenuY" :items="contextMenuItems"
      @action="handleContextMenuAction" />
  </div>
</template>

<script setup>
  import { ref, onMounted, nextTick, onUnmounted, computed } from "vue";
  import { chatApi } from "../api/chat";
  import { userApi } from "../api/user";
  import { useUserStore } from "../stores/user";
  import { useChatroomStore } from "../stores/chatroom";
  import dayjs from "dayjs";
  import wsManager from "../utils/websocket";
  import { useRoute, useRouter } from "vue-router";
  import { ElMessage } from "element-plus";
  import MsgContextMenu from "../components/MsgContextMenu.vue";
  import ChatInput from "../components/ChatInput.vue";
  import { createImagePreviewWindow } from "../utils/imagePreview";

  const userStore = useUserStore();
  const chatList = ref([]);
  const route = useRoute();
  const router = useRouter();
  const currentChat = ref("");
  const currentChatInfo = ref(null);
  const messages = ref([]);
  const newMessage = ref("");
  const messagesContainer = ref(null);

  // Pagination state
  const currentPage = ref(1);
  const isLoadingMore = ref(false);
  const hasMoreMessages = ref(true);
  const previousScrollHeight = ref(0);

  // Constants for time separation (adjust as needed)
  const TIME_SEPARATOR_THRESHOLD_MINUTES = 5;

  const chatInputRef = ref(null);

  // 搜索相关状态
  const showSearch = ref(false);
  const searchQuery = ref("");
  const searchResults = ref([]);
  const isSearching = ref(false);
  const searchTimeout = ref(null);

  // 右键菜单相关状态
  const contextMenuVisible = ref(false);
  const contextMenuX = ref(0);
  const contextMenuY = ref(0);
  const selectedMessage = ref(null);

  // 右键菜单选项
  const contextMenuItems = computed(() => {
    const items = [];

    if (selectedMessage.value?.content?.includes("<img")) {
      // 图片消息
      items.push(
        { label: "复制图片", action: "copy-image", icon: "fas fa-copy" },
        { label: "添加表情", action: "addEmoji", icon: "fas fa-smile" }
      );
    } else {
      // 文字消息
      items.push({ label: "复制", action: "copy", icon: "fas fa-copy" });
    }

    return items;
  });

  // 添加在线用户列表状态
  const onlineUsers = ref([]);

  // 获取在线用户列表
  const getOnlineUsers = () => {
    try {
      // 尝试从新的缓存store获取数据
      const chatroomStore = useChatroomStore();
      if (chatroomStore.isCacheValid) {
        onlineUsers.value = chatroomStore.cachedOnlineUsers;
      } else {
        // 如果新缓存无效，尝试从旧缓存获取
        const users = utools.dbStorage.getItem("fishpi_online_users") || [];
        onlineUsers.value = users;
      }
    } catch (error) {
      console.error("获取在线用户列表失败:", error);
      onlineUsers.value = [];
    }
  };

  // 更新聊天列表中的消息预览
  const updateChatPreview = (userSession, content) => {
    const chatIndex = chatList.value.findIndex(
      (chat) => chat.user_session === userSession
    );
    if (chatIndex !== -1) {
      // 移除 HTML 标签并限制长度
      const preview = content.replace(/<[^>]+>/g, "").slice(0, 30);
      chatList.value[chatIndex].preview = preview;

      // 将当前聊天移到列表顶部
      if (chatIndex > 0) {
        const chat = chatList.value[chatIndex];
        chatList.value.splice(chatIndex, 1);
        chatList.value.unshift(chat);
      }
    }
  };

  const loadChatList = async () => {
    try {
      const response = await chatApi.getPrivateMessages();
      chatList.value = response.data;

      // 获取未读消息
      const unreadResponse = await chatApi.getUnreadMessages();
      if (unreadResponse.data) {
        // 创建一个 Set 来存储所有未读消息的 user_session
        const unreadSessions = new Set(
          unreadResponse.data.map((msg) => msg.user_session)
        );

        // 更新每个聊天的未读状态
        chatList.value = chatList.value.map((chat) => ({
          ...chat,
          hasUnread: unreadSessions.has(chat.user_session),
          unreadCount: unreadResponse.data.filter(
            (msg) => msg.user_session === chat.user_session
          ).length,
        }));
      }
    } catch (error) {
      console.error("加载私信列表失败:", error);
    }
  };

  // 添加标记消息已读的函数
  const markMessagesAsRead = async (receiverUserName) => {
    if (!receiverUserName) return;

    try {
      await chatApi.markAsRead(receiverUserName);
      // 更新当前聊天的未读状态
      if (currentChatInfo.value) {
        currentChatInfo.value.hasUnread = false;
        currentChatInfo.value.unreadCount = 0;
      }
      // 更新聊天列表中的未读状态
      const chatIndex = chatList.value.findIndex(
        (chat) =>
          chat.senderUserName === receiverUserName ||
          chat.receiverUserName === receiverUserName
      );
      if (chatIndex !== -1) {
        chatList.value[chatIndex].hasUnread = false;
        chatList.value[chatIndex].unreadCount = 0;
      }
    } catch (error) {
      console.error("标记消息已读失败:", error);
    }
  };

  const selectChat = async (chat) => {
    // 如果当前有选中的聊天，先标记其消息为已读并关闭连接
    if (currentChatInfo.value) {
      const currentReceiverUserName =
        currentChatInfo.value.senderUserName === userStore.userInfo?.userName
          ? currentChatInfo.value.receiverUserName
          : currentChatInfo.value.senderUserName;
      await markMessagesAsRead(currentReceiverUserName);
      wsManager.close(`chat-${currentReceiverUserName}`);
    }

    currentChat.value = chat.user_session;
    currentChatInfo.value = chat;
    messages.value = []; // Clear messages when selecting a new chat
    currentPage.value = 1; // Reset page
    hasMoreMessages.value = true; // Assume there are more messages
    previousScrollHeight.value = 0; // Reset scroll height

    // 获取接收者用户名
    const receiverUserName =
      chat.senderUserName === userStore.userInfo?.userName
        ? chat.receiverUserName
        : chat.senderUserName;

    // 标记消息为已读
    await markMessagesAsRead(receiverUserName);

    // 连接新的 WebSocket
    try {
      await wsManager.connect("wss://fishpi.cn/chat-channel", {
        params: {
          toUser: receiverUserName,
        },
        connectionId: `chat-${receiverUserName}`,
      });
      wsManager.on("message", handleMessage, `chat-${receiverUserName}`);
    } catch (error) {
      console.error("WebSocket 连接失败:", error);
    }

    // Load the first page of messages
    await loadMessages(receiverUserName, 1);

    // 聚焦输入框
    await nextTick();
    chatInputRef.value?.focus();
  };

  const loadMessages = async (receiverUserName, page) => {
    if (isLoadingMore.value || (!hasMoreMessages.value && page !== 1)) return;

    isLoadingMore.value = true;
    try {
      const response = await chatApi.getPrivateMessageDetail(
        receiverUserName,
        page
      );

      if (response.data && response.data.length > 0) {
        const newMessages = response.data.reverse(); // Reverse the new messages immediately

        // Process messages to add inline style to images
        newMessages.forEach((message) => {
          if (message.content && message.content.includes("<img")) {
            // Simple regex to find img tags and add style. Might need refinement for complex cases.
            message.content = message.content.replace(/<img(.*?)>/g, '<img$1">');
          }
        });

        if (page === 1) {
          messages.value = newMessages; // Assign reversed messages directly for the first page
          await nextTick();
          scrollToBottom(); // Scroll to bottom only for the first page
        } else {
          // Store current scroll position
          const originalScrollHeight = messagesContainer.value.scrollHeight;

          messages.value = [...newMessages, ...messages.value]; // Prepend reversed new messages
          await nextTick();

          // Maintain scroll position by adjusting based on the height added by new messages
          const newScrollHeight = messagesContainer.value.scrollHeight;
          messagesContainer.value.scrollTop =
            newScrollHeight -
            originalScrollHeight +
            messagesContainer.value.scrollTop;
        }

        // Check if there are more messages (assuming a page size of 20)
        if (response.data.length < 20) {
          hasMoreMessages.value = false;
        }
      } else {
        hasMoreMessages.value = false;
      }
    } catch (error) {
      console.error("加载消息失败:", error);
      hasMoreMessages.value = false; // Assume no more messages on error
    } finally {
      isLoadingMore.value = false;
    }
  };

  const sendMessage = async (message) => {
    if (!message.trim() || !currentChat.value) return;

    try {
      const receiverUserName =
        currentChatInfo.value.senderUserName === userStore.userInfo?.userName
          ? currentChatInfo.value.receiverUserName
          : currentChatInfo.value.senderUserName;

      // 通过 WebSocket 发送消息
      wsManager.send(message, `chat-${receiverUserName}`);

      // 添加消息到本地列表
      messages.value.push({
        content: message, // 直接使用原始消息内容，包含 Markdown 格式
        senderUserName: userStore.userInfo?.userName,
        senderAvatar: userStore.userInfo?.userAvatarURL,
        time: new Date().toISOString(),
        markdown: message,
        isSelf: true,
      });

      // 更新聊天列表中的消息预览
      updateChatPreview(currentChat.value, message);

      newMessage.value = "";
      nextTick(() => {
        scrollToBottom();
      });
    } catch (error) {
      console.error("发送消息失败:", error);
      ElMessage.error("发送消息失败");
    }
  };

  const scrollToBottom = () => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  };

  const handleScroll = () => {
    if (messagesContainer.value) {
      const { scrollTop } = messagesContainer.value;

      // Load more messages when scrolled to the top
      if (scrollTop === 0 && !isLoadingMore.value && hasMoreMessages.value) {
        currentPage.value++;
        const receiverUserName =
          currentChatInfo.value.senderUserName === userStore.userInfo?.userName
            ? currentChatInfo.value.receiverUserName
            : currentChatInfo.value.senderUserName;
        loadMessages(receiverUserName, currentPage.value);
      }
    }
  };

  // Handlers for ChatInput component events
  const handleSelectEmoji = (emoji) => {
    if (typeof emoji === "string") {
      // 默认表情已经在 ChatInput 中处理了
      return;
    }

    // 处理表情包
    const receiverUserName =
      currentChatInfo.value.senderUserName === userStore.userInfo?.userName
        ? currentChatInfo.value.receiverUserName
        : currentChatInfo.value.senderUserName;

    // 使用 Markdown 格式发送表情包
    const markdownImage = `![表情包](${emoji.cover})`;

    // 通过 WebSocket 发送消息
    wsManager.send(markdownImage, `chat-${receiverUserName}`);

    // 添加消息到本地列表
    messages.value.push({
      content: markdownImage,
      senderUserName: userStore.userInfo?.userName,
      senderAvatar: userStore.userInfo?.userAvatarURL,
      time: new Date().toISOString(),
      isSelf: true,
    });

    // 更新聊天列表中的消息预览
    updateChatPreview(currentChat.value, "[表情包]");

    // 滚动到底部
    nextTick(() => {
      scrollToBottom();
    });
  };

  const handleSelectImage = () => {
    console.log("Select Image clicked");
    // TODO: Implement logic to open image picker/file upload
  };

  // 处理转账成功
  const handleTransferSuccess = async (transferData) => {
    try {
      // 获取接收者用户名
      const receiverUserName =
        currentChatInfo.value.senderUserName === userStore.userInfo?.userName
          ? currentChatInfo.value.receiverUserName
          : currentChatInfo.value.senderUserName;

      // 构建转账消息
      const transferMessage = `转账 ${transferData.amount} 积分给 ${receiverUserName}`;

      // 通过 WebSocket 发送消息
      wsManager.send(transferMessage, `chat-${receiverUserName}`);

      // 添加消息到本地列表
      messages.value.push({
        content: transferMessage,
        senderUserName: userStore.userInfo?.userName,
        senderAvatar: userStore.userInfo?.userAvatarURL,
        time: new Date().toISOString(),
        isSelf: true,
      });

      // 更新聊天列表中的消息预览
      updateChatPreview(currentChat.value, transferMessage);

      // 滚动到底部
      nextTick(() => {
        scrollToBottom();
      });
    } catch (error) {
      console.error("发送转账消息失败:", error);
      ElMessage.error("发送转账消息失败");
    }
  };

  // 处理转账错误
  const handleTransferError = (error) => {
    console.error("转账失败:", error);
    // 这里可以添加错误提示，比如使用 Element Plus 的 Message 组件
  };

  const formatTime = (time) => {
    // This format is for the time below the bubble, if kept.
    return dayjs(time).format("HH:mm");
  };

  const formatSeparatorTime = (time) => {
    // This is a helper if we need different formatting for separators.
    return dayjs(time).calendar(null, {
      sameDay: "[今天] HH:mm",
      nextDay: "[明天] HH:mm",
      nextWeek: "YYYY-MM-DD HH:mm",
      lastDay: "[昨天] HH:mm",
      lastWeek: "YYYY-MM-DD HH:mm",
      sameElse: "YYYY-MM-DD HH:mm",
    });
  };

  // Computed property to display messages with time separators
  const displayedMessages = computed(() => {
    const list = [];
    let lastMessageTime = null;

    // Iterate through messages (already reversed, newest at the end)
    for (const message of messages.value) {
      const currentTime = dayjs(message.time);

      // Check if a separator is needed before the current message
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
            // Generate a unique key for separators
            _key: `separator-${message.oId || Math.random()
              }-${currentTime.valueOf()}`,
          });
        }
      } else if (messages.value.length > 0) {
        // Add separator before the very first message
        list.push({
          type: "time-separator",
          timestamp: currentTime.format("YYYY-MM-DD"), // Show date for the first message group
          _key: `separator-first-${message.oId || Math.random()
            }-${currentTime.valueOf()}`,
        });
      }

      // Add the current message
      list.push(message);
      lastMessageTime = currentTime; // Update last message time
    }

    return list;
  });

  // 处理接收到的消息
  const handleMessage = (data) => {
    console.log("接收到消息:", data);
    // 检查是否是私聊消息（通过 user_session 字段判断）
    if (data.user_session) {
      // 获取当前聊天的用户会话ID
      const currentSessionId = currentChatInfo.value?.user_session;

      // 检查消息是否属于当前聊天
      if (data.user_session === currentSessionId) {
        // 检查是否是自己发送的消息，如果是则跳过（因为发送时已经添加过了）
        if (data.senderUserName === userStore.userInfo?.userName) {
          return;
        }

        // 添加到消息列表
        messages.value.push({
          oId: data.oId,
          content: data.content,
          senderUserName: data.senderUserName,
          senderAvatar: data.senderAvatar,
          time: data.time,
          markdown: data.markdown,
          isSelf: false, // 收到的消息一定不是自己发的
          user_session: data.user_session,
        });

        // 更新聊天列表中的消息预览
        updateChatPreview(data.user_session, data.content);

        // 滚动到底部
        nextTick(() => {
          scrollToBottom();
        });

        // 标记消息为已读
        const receiverUserName = data.senderUserName;
        markMessagesAsRead(receiverUserName);
      } else {
        // 如果不是当前聊天的消息，更新对应聊天的未读状态
        const chatIndex = chatList.value.findIndex(
          (chat) => chat.user_session === data.user_session
        );
        if (chatIndex !== -1) {
          chatList.value[chatIndex].hasUnread = true;
          chatList.value[chatIndex].unreadCount =
            (chatList.value[chatIndex].unreadCount || 0) + 1;
          // 更新最后一条消息预览
          updateChatPreview(data.user_session, data.content);
        }
      }
    }
  };

  // 处理搜索
  const handleSearch = () => {
    if (searchTimeout.value) {
      clearTimeout(searchTimeout.value);
    }

    if (!searchQuery.value.trim()) {
      searchResults.value = [];
      return;
    }

    isSearching.value = true;
    searchTimeout.value = setTimeout(async () => {
      try {
        // 先检查在线用户列表
        const onlineMatches = onlineUsers.value.filter((user) =>
          user.userName.toLowerCase().includes(searchQuery.value.toLowerCase())
        );

        if (onlineMatches.length > 0) {
          // 如果在线用户中有匹配的，直接显示
          searchResults.value = onlineMatches.map((user) => ({
            userName: user.userName,
            userAvatarURL: user.userAvatarURL,
          }));
        } else {
          // 如果在线用户中没有匹配的，则搜索所有用户
          const response = await userApi.getUsernameSuggestions(
            searchQuery.value
          );
          if (response.code === 0) {
            searchResults.value = response.data;
          } else {
            searchResults.value = [];
          }
        }
      } catch (error) {
        console.error("搜索用户失败:", error);
        searchResults.value = [];
      } finally {
        isSearching.value = false;
      }
    }, 300);
  };

  // 开始聊天
  const startChat = async (user) => {
    showSearch.value = false;
    searchQuery.value = "";
    searchResults.value = [];

    // 检查是否已经存在与该用户的聊天
    const existingChat = chatList.value.find(
      (chat) =>
        chat.senderUserName === user.userName ||
        chat.receiverUserName === user.userName
    );

    if (existingChat) {
      // 如果存在，直接选择该聊天
      await selectChat(existingChat);
    } else {
      // 如果不存在，创建新的聊天
      const newChat = {
        user_session: `${userStore.userInfo.userName}-${user.userName}`,
        senderUserName: userStore.userInfo.userName,
        senderAvatar: userStore.userInfo.userAvatarURL,
        receiverUserName: user.userName,
        receiverAvatar: user.userAvatarURL,
        preview: "",
        unreadCount: 0,
      };

      chatList.value.unshift(newChat);
      await selectChat(newChat);
    }
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

  // 处理图片加载完成
  const handleImageLoad = () => {
    if (isAtBottom.value) {
      nextTick(() => {
        scrollToBottom();
      });
    }
  };

  // 处理链接点击
  const handleLinkClick = (e) => {
    if (e.target.tagName === "A") {
      e.preventDefault();
      const url = e.target.href;
      // 使用系统默认浏览器打开链接
      utools.shellOpenExternal(url);
    }
  };

  // 处理消息内容，将 Markdown 图片转换为 HTML，并处理链接
  const processMessageContent = (content) => {
    let processedContent = content;

    // 先处理 Markdown 图片语法
    processedContent = processedContent.replace(
      /!\[.*?\]\((.*?)\)/g,
      '<img src="$1" alt="图片" />'
    );

    // 使用更安全的方法处理链接：先分割文本，只处理纯文本部分
    const parts = processedContent.split(/(<[^>]+>)/);
    for (let i = 0; i < parts.length; i += 2) {
      // 只处理偶数索引的部分（纯文本）
      if (parts[i]) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        parts[i] = parts[i].replace(
          urlRegex,
          '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
        );
      }
    }

    return parts.join("");
  };

  // 查看用户信息
  const showUserProfile = (userName) => {
    router.push(`/user/${userName}`);
  };

  // 处理右键菜单
  const handleContextMenu = (event, message) => {
    selectedMessage.value = message;
    contextMenuX.value = event.clientX;
    contextMenuY.value = event.clientY;
    contextMenuVisible.value = true;

    // 点击其他地方关闭菜单
    const closeMenu = () => {
      contextMenuVisible.value = false;
      document.removeEventListener("click", closeMenu);
    };
    document.addEventListener("click", closeMenu);
  };

  // 处理右键菜单动作
  const handleContextMenuAction = async (action) => {
    if (!selectedMessage.value) return;

    switch (action) {
      case "copy":
        // 复制文字
        const temp = document.createElement("div");
        temp.innerHTML = selectedMessage.value.content;
        navigator.clipboard.writeText(temp.innerText).then(() => {
          ElMessage.success("复制成功");
        });
        break;

      case "copy-image":
        // 复制图片
        const match = selectedMessage.value.content.match(
          /<img[^>]+src=["']([^"']+)["']/
        );
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
        break;

      case "addEmoji":
        try {
          // 从消息内容中提取图片URL
          const match = selectedMessage.value.content.match(
            /<img[^>]+src=["']([^"']+)["']/
          );
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
        break;
    }

    contextMenuVisible.value = false;
  };

  onMounted(() => {
    loadChatList();
    getOnlineUsers(); // 获取在线用户列表
    // 自动发起私聊
    let userName = route.query.user;
    if (!userName) {
      userName = localStorage.getItem("private-chat-user");
    }
    if (userName) {
      // 查找用户并自动 startChat
      let user = chatList.value.find(
        (chat) =>
          chat.senderUserName === userName || chat.receiverUserName === userName
      );
      if (user) {
        selectChat(user);
      } else {
        userApi.getUserProfile(userName).then((res) => {
          if (res) startChat(res);
        });
      }
      localStorage.removeItem("private-chat-user");
    }

    // 监听账号切换事件
    window.addEventListener("fishpi:account-switched", async () => {
      // 断开所有 WebSocket 连接
      if (currentChatInfo.value) {
        const receiverUserName =
          currentChatInfo.value.senderUserName === userStore.userInfo?.userName
            ? currentChatInfo.value.receiverUserName
            : currentChatInfo.value.senderUserName;
        wsManager.close(`chat-${receiverUserName}`);
      }
      // 清空聊天列表和当前聊天
      chatList.value = [];
      currentChat.value = "";
      currentChatInfo.value = null;
      messages.value = [];
      // 重新加载聊天列表
      await loadChatList();
    });
  });

  onUnmounted(() => {
    // 组件卸载时关闭当前聊天的 WebSocket 连接
    if (currentChatInfo.value) {
      const receiverUserName =
        currentChatInfo.value.senderUserName === userStore.userInfo?.userName
          ? currentChatInfo.value.receiverUserName
          : currentChatInfo.value.senderUserName;
      wsManager.close(`chat-${receiverUserName}`);
    }

    // 移除账号切换事件监听
    window.removeEventListener("fishpi:account-switched", async () => {
      if (currentChatInfo.value) {
        const receiverUserName =
          currentChatInfo.value.senderUserName === userStore.userInfo?.userName
            ? currentChatInfo.value.receiverUserName
            : currentChatInfo.value.senderUserName;
        wsManager.close(`chat-${receiverUserName}`);
      }
      chatList.value = [];
      currentChat.value = "";
      currentChatInfo.value = null;
      messages.value = [];
      await loadChatList();
    });
  });
</script>

<style scoped>
  .private-chat-container {
    display: flex;
    height: 100%;
    background-color: var(--background-color);
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .chat-list {
    width: 200px;
    border-right: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    background-color: var(--hover-bg);
  }

  .chat-list-header {
    padding: 15px 20px;
    border-bottom: 1px solid var(--border-color);
    background-color: var(--card-bg);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .chat-list-header h2 {
    margin: 0;
    font-size: 18px;
    color: var(--text-color);
  }

  .chat-list-content {
    flex: 1;
    overflow-y: auto;
  }

  .chat-item {
    display: flex;
    padding: 15px;
    cursor: pointer;
    transition: all 0.3s ease;
    border-bottom: 1px solid var(--border-color);
    position: relative;
  }

  .chat-item:hover {
    background-color: var(--hover-bg);
  }

  .chat-item.active {
    background-color: var(--border-color);
    border-left: none;
  }

  .chat-item .avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    margin-right: 10px;
    flex-shrink: 0;
    border: 2px solid var(--avatar-border);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .chat-info {
    flex: 1;
    min-width: 0;
  }

  .user-name {
    font-weight: 500;
    margin-bottom: 4px;
    color: var(--text-color);
    display: flex;
    align-items: center;
  }

  .last-message {
    font-size: 12px;
    color: var(--sub-text-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .chat-window {
    flex: 1;
    display: flex;
    flex-direction: column;
    background-color: var(--card-bg);
  }

  .chat-header {
    padding: 15px;
    border-bottom: 1px solid var(--border-color);
    text-align: center;
    background-color: var(--card-bg);
  }

  .chat-header h3 {
    margin: 0;
    font-size: 18px;
    color: var(--text-color);
  }

  .messages-container {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    min-height: 0;
    background-color: var(--chatroom-bg);
  }

  .messages-list {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    flex-grow: 1;
  }

  .message-row {
    display: flex;
    align-items: flex-start;
    margin-bottom: 16px;
    position: relative;
  }

  .message-row-self {
    flex-direction: row-reverse;
    align-self: flex-end;
  }

  .message-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    flex-shrink: 0;
    border: 2px solid var(--avatar-border);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .message-row:not(.message-row-self) .message-avatar {
    margin-right: 12px;
  }

  .message-row-self .message-avatar {
    margin-left: 12px;
  }

  .message-bubble {
    display: flex;
    flex-direction: column;
    max-width: 80%;
  }

  .message-row-self .message-bubble {
    align-items: flex-end;
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
    color: var(--text-color);
    margin-left: auto;
    margin-top: 0;
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
    border-right-color: var(--bubble-bg);
  }

  .message-row-self .message-text::before {
    right: -12px;
    border-left-color: var(--hover-bg);
  }

  .time-separator {
    text-align: center;
    margin: 16px 0;
    font-size: 12px;
    color: var(--sub-text-color);
    position: relative;
  }

  .no-chat-selected {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg,
        var(--background-color) 0%,
        var(--hover-bg) 100%);
    height: 100%;
  }

  .empty-state {
    text-align: center;
    padding: 40px;
    max-width: 480px;
  }

  .empty-illustration {
    margin-bottom: 32px;
  }

  .simple-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 80px;
    height: 80px;
    background: var(--card-bg);
    border-radius: 50%;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    animation: pulse 2s ease-in-out infinite;
  }

  .icon-heart {
    font-size: 40px;
    animation: float 3s ease-in-out infinite;
  }

  @keyframes pulse {
    0% {
      transform: scale(1);
    }

    50% {
      transform: scale(1.05);
    }

    100% {
      transform: scale(1);
    }
  }

  @keyframes float {
    0% {
      transform: translateY(0);
    }

    50% {
      transform: translateY(-5px);
    }

    100% {
      transform: translateY(0);
    }
  }

  .empty-state h3 {
    font-size: 26px;
    color: var(--text-color);
    margin-bottom: 12px;
    font-weight: 600;
    letter-spacing: -0.5px;
    background: none;
    -webkit-background-clip: unset;
    -webkit-text-fill-color: unset;
  }

  .empty-state p {
    color: var(--sub-text-color);
    margin-bottom: 32px;
    font-size: 16px;
    line-height: 1.6;
    max-width: 320px;
    margin-left: auto;
    margin-right: auto;
  }

  .features {
    display: flex;
    justify-content: center;
    gap: 16px;
    margin-top: 32px;
    flex-wrap: wrap;
  }

  .feature {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: var(--card-bg);
    backdrop-filter: blur(8px);
    border-radius: 20px;
    transition: all 0.3s ease;
    border: 1px solid var(--border-color);
  }

  .feature:hover {
    transform: translateY(-2px);
    background: var(--hover-bg);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    border-color: var(--border-color);
  }

  .feature-icon {
    font-size: 18px;
  }

  .feature-text {
    color: var(--text-color);
    font-size: 14px;
    font-weight: 500;
  }

  .loading-more,
  .no-more-messages {
    text-align: center;
    padding: 12px;
    color: var(--sub-text-color);
    font-size: 12px;
    flex-shrink: 0;
  }

  .online-status {
    position: absolute;
    bottom: 15px;
    left: 45px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: 2px solid var(--avatar-border);
    box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
  }

  .online-status.online {
    background-color: var(--signed-color);
    box-shadow: 0 0 0 2px rgba(82, 196, 26, 0.2);
  }

  .online-status.offline {
    background-color: var(--border-color);
    box-shadow: 0 0 0 2px rgba(217, 217, 217, 0.2);
  }

  .unread-badge {
    display: inline-block;
    background-color: var(--badge-bg);
    color: var(--badge-text);
    border-radius: 10px;
    padding: 2px 6px;
    font-size: 12px;
    margin-left: 5px;
    min-width: 18px;
    text-align: center;
    box-shadow: 0 2px 4px rgba(255, 77, 79, 0.2);
  }

  .search-icon {
    cursor: pointer;
    border-radius: 50%;
    transition: all 0.3s ease;
    color: var(--sub-text-color);
  }

  .search-icon:hover {
    background-color: var(--hover-bg);
    color: var(--primary-color);
  }

  .search-icon i {
    font-size: 16px;
  }

  .search-dialog :deep(.el-dialog__body) {
    padding: 20px;
  }

  .search-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .search-results {
    max-height: 300px;
    overflow-y: auto;
  }

  .search-result-item {
    display: flex;
    align-items: center;
    padding: 12px;
    cursor: pointer;
    border-radius: 8px;
    transition: all 0.3s ease;
  }

  .search-result-item:hover {
    background-color: var(--hover-bg);
  }

  .user-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    margin-right: 12px;
  }

  .user-name {
    font-size: 14px;
    color: var(--text-color);
  }

  .no-results {
    text-align: center;
    color: var(--sub-text-color);
    padding: 20px;
  }

  .message-text :deep(img) {
    max-width: 200px;
    height: auto;
    border-radius: 8px;
    margin: 4px 0;
    cursor: pointer;
    display: block;
  }

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

  .online-users-section {
    margin-top: 16px;
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    color: var(--sub-text-color);
    font-size: 14px;
  }

  .text-success {
    color: var(--signed-color);
    font-size: 8px;
  }

  .online-users-list {
    max-height: 200px;
    overflow-y: auto;
  }
</style>