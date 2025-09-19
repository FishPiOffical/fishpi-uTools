<template>
  <div class="room-chat-input-container">
    <!-- 话题引用显示区域 -->
    <div v-if="quotedTopic" class="quoted-topic">
      <span class="quoted-topic-label">引用话题：</span>
      <span class="quoted-topic-text">{{ currentTopic }}</span>
      <i class="fas fa-times close-icon" @click="clearQuotedTopic"></i>
    </div>
    <!-- 消息引用显示区域 -->
    <div v-if="quoteData" class="quoted-message">
      <span class="quoted-message-label">引用消息：</span>
      <div class="quoted-message-content">
        <span v-if="!isImageMessage(quoteData.content)">{{
          quoteContent
          }}</span>
        <div v-else class="quoted-image-preview">
          <span class="quoted-image-text">{{ quoteData.userName }}：[图片]</span>
        </div>
      </div>
      <i class="fas fa-times close-icon" @click="clearQuote"></i>
    </div>
    <div class="input-icons">
      <!-- 表情图标 -->
      <div class="emoji-icon-wrapper">
        <i class="fas fa-smile icon" @click="openEmojiPicker" title="表情"></i>
        <EmojiPicker :visible="showEmojiPicker" @select="handleEmojiSelect" @close="showEmojiPicker = false" />
      </div>
      <!-- 图片图标 -->
      <i class="fas fa-image icon" @click="openImagePicker" title="图片"></i>
      <!-- 红包图标 -->
      <i class="fas fa-gift icon" @click="openRedPacketDialog" title="红包"></i>
      <!-- 弹幕图标 -->
      <i class="fas fa-comment-dots icon" @click="openDanmakuDialog" title="弹幕"></i>
      <!-- 小尾巴图标 -->
      <i class="fas fa-pen-fancy icon" @click="openSignatureDialog" title="小尾巴"></i>
      <!-- 关键词图标 -->

      <i class="fas fa-bell icon" @click="openBellDialog" title="关键词提醒"></i>
    </div>

    <div class="input-wrapper">
      <div ref="textareaRef" class="input-content" contenteditable="true" @keydown="handleKeyDown" @input="handleInput"
        @focus="showEmojiPicker = false" @click="
          handleImageClick;
        closeEmojiSearch();
        "></div>
      <!-- @提及用户列表 -->
      <div v-if="showMentionList" class="mention-list">
        <div v-for="user in filteredUsers" :key="user.userName" class="mention-item" @click="selectMention(user)">
          <img :src="user.userAvatarURL" alt="avatar" class="mention-avatar" />
          <span class="mention-name">{{ user.userName }}</span>
        </div>
      </div>

      <!-- 表情包搜索结果 -->
      <div v-if="
        showEmojiSearch &&
        (emojiSearchLoading || emojiSearchResults.length > 0)
      " class="emoji-search-results">
        <div class="emoji-search-header">
          <span class="emoji-search-title">推荐表情</span>
          <i class="fas fa-times close-icon" @click="closeEmojiSearch"></i>
        </div>
        <div v-if="emojiSearchLoading" class="emoji-search-loading">
          <i class="fas fa-spinner fa-spin"></i>
          <span>搜索中...</span>
        </div>
        <div v-else class="emoji-search-grid">
          <div v-for="(image, index) in emojiSearchResults" :key="index" class="emoji-search-item"
            @click="selectEmojiImage(image)">
            <img :src="image.thumbURL" :alt="image.title" class="emoji-search-image" @error="handleImageError" />
          </div>
        </div>
      </div>
    </div>
    <div class="input-footer">
      <span class="tip">按 Enter 发送，Shift + Enter 换行</span>
      <button @click="sendMessage" :disabled="!message.trim()" :class="{ disabled: !message.trim() }">
        发送
      </button>
    </div>
    <RedPacketDialog :visible="showRedPacketDialog" :online-users="onlineUsers" @close="showRedPacketDialog = false"
      @send="handleRedPacketSend" />
    <DanmakuDialog :visible="showDanmakuDialog" @close="showDanmakuDialog = false" @send="handleDanmakuSend" />
    <SignatureDialog :visible="showSignatureDialog" :default-signature="signature" @close="showSignatureDialog = false"
      @save="handleSignatureSave" />
    <BellDialog :visible="showBellDialog" :locatbell="bells" @close="showBellDialog = false" @save="handleBellSave" />
  </div>
</template>

<script setup>
  import {
    ref,
    defineEmits,
    defineProps,
    computed,
    nextTick,
    onMounted,
    onUnmounted,
  } from "vue";
  import EmojiPicker from "./EmojiPicker.vue";
  import RedPacketDialog from "./RedPacketDialog.vue";
  import DanmakuDialog from "./DanmakuDialog.vue";
  import SignatureDialog from "./SignatureDialog.vue";
  import BellDialog from "./BellDialog.vue";
  import { userApi } from "../api/user";
  import { baiduImageAPI } from "../api/baidu";
  import { ElMessage } from "element-plus";
  import { useUserStore } from "../stores/user";
  import { createImagePreviewWindow } from "../utils/imagePreview";

  const props = defineProps({
    onlineUsers: {
      type: Array,
      default: () => [],
    },
  });

  const message = ref("");
  const showEmojiPicker = ref(false);
  const showRedPacketDialog = ref(false);
  const userStore = useUserStore();
  const showMentionList = ref(false);
  const mentionStartIndex = ref(-1);
  const quotedTopic = ref("");
  const currentTopic = ref("");
  const quoteData = ref(null); // 新增：引用消息数据
  const showDanmakuDialog = ref(false);
  const showSignatureDialog = ref(false);
  const showBellDialog = ref(false);
  const signature = ref("");
  const bells = ref([]);
  const emit = defineEmits([
    "send-message",
    "select-emoji",
    "select-image",
    "send-red-packet",
  ]);

  const textareaRef = ref(null);

  // 新增：表情包搜索相关状态
  const showEmojiSearch = ref(false);
  const emojiSearchResults = ref([]);
  const emojiSearchLoading = ref(false);
  const emojiSearchKeyword = ref("");
  const emojiSearchDebounceTimer = ref(null);
  // 新增：推荐表情自动关闭定时器
  const emojiSearchAutoCloseTimer = ref(null);

  // 新增：表情包推荐关键词
  const emojiTriggerKeywords = [
    "表情",
    "emoji",
    "搞笑",
    "哈哈哈",
    "可爱",
    "狗头",
    "猫咪",
    "斗图",
    "生气",
    "开心",
    "难过",
    "鼓掌",
    "拜托",
    "摸鱼",
    "加油",
    "生日",
    "祝福",
  ];

  // 图片预览窗口
  let previewWindow = null;

  // 添加粘贴事件监听
  onMounted(() => {
    textareaRef.value?.addEventListener("paste", handlePaste);

    // 获取当前用户的小尾巴
    const savedSignatures = utools.dbStorage.getItem("fishpi_signatures") || {};
    const savedBells = utools.dbStorage.getItem("fishpi_bells") || [];
    const currentUsername = userStore.userInfo?.userName;
    signature.value = currentUsername
      ? savedSignatures[currentUsername] || ""
      : savedSignatures.default || "";
    bells.value = savedBells
    // 监听账号切换事件
    window.addEventListener("fishpi:account-switched", () => {
      const savedSignatures = utools.dbStorage.getItem("fishpi_signatures") || {};
      const savedBells = utools.dbStorage.getItem("fishpi_bells") || [];
      const currentUsername = userStore.userInfo?.userName;
      signature.value = currentUsername
        ? savedSignatures[currentUsername] || ""
        : savedSignatures.default || "";
      bells.value = savedBells

    });
  });

  onUnmounted(() => {
    textareaRef.value?.removeEventListener("paste", handlePaste);
    window.removeEventListener("fishpi:account-switched", () => { });

    // 清理表情包搜索定时器
    if (emojiSearchDebounceTimer.value) {
      clearTimeout(emojiSearchDebounceTimer.value);
    }
    // 清理自动关闭定时器
    if (emojiSearchAutoCloseTimer.value) {
      clearTimeout(emojiSearchAutoCloseTimer.value);
    }
  });

  // 处理粘贴事件
  const handlePaste = async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.indexOf("image") !== -1) {
        e.preventDefault();
        const file = item.getAsFile();
        try {
          // 显示加载提示
          const loadingMessage = ElMessage({
            message: "正在上传图片...",
            type: "info",
            duration: 0,
            showClose: true,
          });

          // 使用现有的上传方法上传图片
          const uploadRes = await userApi.uploadImage(file);
          if (uploadRes.code === 0 && uploadRes.data.succMap) {
            const newUrl = uploadRes.data.succMap[file.name];
            if (newUrl) {
              // 创建图片元素并设置样式
              const img = document.createElement("img");
              img.src = newUrl;
              img.style.maxWidth = "120px";
              img.style.verticalAlign = "text-bottom";
              img.style.margin = "0 4px";
              img.style.objectFit = "contain";
              img.style.cursor = "pointer";
              document.execCommand("insertHTML", false, img.outerHTML);

              // 关闭加载提示
              loadingMessage.close();
              ElMessage.success("图片上传成功");
            }
          }
        } catch (error) {
          console.error("上传图片失败:", error);
          ElMessage.error("上传图片失败");
        }
        return;
      }
    }
  };

  const focus = () => {
    textareaRef.value?.focus();
  };

  // 插入消息内容
  const insertAtUser = (userName) => {
    textareaRef.value?.focus();
    console.log("insertAtUser", userName);
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const text = `@${userName} `; // 确保用户名后面有空格
    range.deleteContents();

    // 使用innerHTML来插入内容，这样可以保持空格
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = text.replace(/ /g, "&nbsp;");
    range.insertNode(tempDiv.firstChild);

    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
    textareaRef.value.focus();

    // 更新消息内容
    message.value = textareaRef.value.innerHTML.replace(/&nbsp;/g, " ");
  };

  // 插入话题
  const insertTopic = (formattedTopic) => {
    quotedTopic.value = formattedTopic;
    currentTopic.value = formattedTopic.replace(/\*\`#\s*(.*?)\s*#\`\*/g, "$1");
  };

  // 计算引用消息的显示内容
  const quoteContent = computed(() => {
    if (!quoteData.value || !quoteData.value.userName || !quoteData.value.content)
      return "";
    try {
      const content = quoteData.value.content;

      // 检查是否为图片消息
      if (/\<img[^>]+src=/.test(content)) {
        return `${quoteData.value.userName}：[图片]`;
      }

      // 处理文本消息
      const temp = document.createElement("div");
      temp.innerHTML = content;
      const text = temp.innerText || temp.textContent || "";
      const maxLength = 20; // 最大显示长度
      if (text.length > maxLength) {
        return `${quoteData.value.userName}：${text.slice(0, maxLength)}...`;
      }
      return `${quoteData.value.userName}：${text}`;
    } catch (error) {
      console.error("处理引用消息内容失败:", error);
      return `${quoteData.value.userName}：引用消息内容解析失败`;
    }
  });

  // 设置引用消息
  const setQuote = (quote) => {
    quoteData.value = {
      content: quote.md || quote.content || "",
      userName: quote.userName || "",
      userNickname: quote.userNickname || "",
      oId: quote.oId || "",
    };
  };

  // 清除引用消息
  const clearQuote = () => {
    quoteData.value = null;
  };

  // 清除引用的话题
  const clearQuotedTopic = () => {
    quotedTopic.value = "";
    currentTopic.value = "";
  };

  defineExpose({
    focus,
    insertAtUser,
    insertTopic,
    setQuote,
  });

  // 处理输入事件
  const handleInput = (e) => {
    // 将&nbsp;转换回空格
    message.value = e.target.innerHTML.replace(/&nbsp;/g, " ");
    const text = message.value;

    // 新增：如果推荐弹窗已打开，输入时立即关闭
    if (showEmojiSearch.value) {
      closeEmojiSearch();
    }

    const lastAtIndex = text.lastIndexOf("@");

    // 修正图片样式，防止拖拽图片时样式失效
    const imgs = textareaRef.value.querySelectorAll("img");
    imgs.forEach((img) => {
      img.removeAttribute("width");
      img.removeAttribute("height");
      img.style.width = "";
      img.style.height = "";
      img.style.maxWidth = "120px";
      img.style.objectFit = "contain";
    });

    if (lastAtIndex !== -1) {
      const textAfterAt = text.slice(lastAtIndex + 1);
      if (!textAfterAt.includes(" ")) {
        showMentionList.value = true;
        mentionStartIndex.value = lastAtIndex;
      } else {
        showMentionList.value = false;
      }
    } else {
      showMentionList.value = false;
    }

    // 修改：关键词完全匹配才触发表情包推荐
    checkEmojiSearch(text);
  };

  // 修改：关键词完全匹配才触发表情包推荐
  const checkEmojiSearch = (text) => {
    const trimmed = text.trim();
    if (trimmed) {
      // 只有完全等于关键词才触发
      const matched = emojiTriggerKeywords.some((keyword) => trimmed === keyword);
      if (matched) {
        triggerEmojiSearch(trimmed);
      } else {
        closeEmojiSearch();
      }
    } else {
      closeEmojiSearch();
    }
  };

  // 新增：触发表情包搜索（带防抖）
  const triggerEmojiSearch = (keyword) => {
    // 清除之前的定时器
    if (emojiSearchDebounceTimer.value) {
      clearTimeout(emojiSearchDebounceTimer.value);
    }
    // 设置新的定时器
    emojiSearchDebounceTimer.value = setTimeout(() => {
      searchEmojis(keyword);
    }, 500); // 500ms防抖
  };

  // 新增：搜索表情包
  const searchEmojis = async (keyword) => {
    try {
      emojiSearchLoading.value = true;
      showEmojiSearch.value = true;
      // 新增：启动3秒自动关闭定时器
      if (emojiSearchAutoCloseTimer.value) {
        clearTimeout(emojiSearchAutoCloseTimer.value);
      }
      emojiSearchAutoCloseTimer.value = setTimeout(() => {
        showEmojiSearch.value = false;
        emojiSearchResults.value = [];
      }, 3000);
      const response = await baiduImageAPI.searchEmoji(keyword, 0, 20);
      const images = baiduImageAPI.parseImageUrls(response);
      emojiSearchResults.value = images;
    } catch (error) {
      console.error("搜索表情包失败:", error);
      ElMessage.error("搜索表情包失败");
    } finally {
      emojiSearchLoading.value = false;
    }
  };

  // 新增：选择表情包
  const selectEmojiImage = (image) => {
    // 清除自动关闭定时器
    if (emojiSearchAutoCloseTimer.value) {
      clearTimeout(emojiSearchAutoCloseTimer.value);
    }
    // 创建图片元素
    const img = document.createElement("img");
    img.src = image.middleURL || image.thumbURL;
    img.style.maxWidth = "120px";
    img.style.verticalAlign = "text-bottom";
    img.style.margin = "0 4px";
    img.style.objectFit = "contain";
    img.style.cursor = "pointer";

    // 在光标位置插入图片
    const inputContent = textareaRef.value;
    const currentContent = inputContent.innerHTML;
    inputContent.innerHTML = currentContent + img.outerHTML;

    // 更新输入框内容
    message.value = inputContent.innerHTML;

    // 保持焦点并将光标移到末尾
    inputContent.focus();
    const range = document.createRange();
    const sel = window.getSelection();
    range.selectNodeContents(inputContent);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);

    // 关闭表情包搜索
    showEmojiSearch.value = false;
  };

  // 新增：关闭表情包搜索
  const closeEmojiSearch = () => {
    showEmojiSearch.value = false;
    emojiSearchResults.value = [];
    // 清除自动关闭定时器
    if (emojiSearchAutoCloseTimer.value) {
      clearTimeout(emojiSearchAutoCloseTimer.value);
    }
  };

  // 新增：处理图片加载错误
  const handleImageError = (e) => {
    e.target.style.display = "none";
  };

  // 过滤用户列表
  const filteredUsers = computed(() => {
    if (!showMentionList.value) return [];

    const searchText = message.value
      .slice(mentionStartIndex.value + 1)
      .toLowerCase();
    // 如果没有搜索文本，显示所有用户
    if (!searchText) {
      return props.onlineUsers;
    }
    // 否则过滤用户
    return props.onlineUsers.filter((user) =>
      user.userName.toLowerCase().includes(searchText)
    );
  });

  // 选择提及的用户
  const selectMention = (user) => {
    const beforeMention = message.value.slice(0, mentionStartIndex.value);
    const afterMention = message.value
      .slice(mentionStartIndex.value + 1)
      .replace(/[^ ]*$/, "");
    const mentionText = `@${user.userName} `; // 确保用户名后面有空格
    message.value = `${beforeMention}${mentionText}${afterMention}`;

    // 使用innerHTML来保持空格
    textareaRef.value.innerHTML = message.value.replace(/ /g, "&nbsp;");
    showMentionList.value = false;

    // 设置光标位置到@用户名后面
    const range = document.createRange();
    const sel = window.getSelection();
    const textNode = textareaRef.value.firstChild || textareaRef.value;
    const newPosition = mentionStartIndex.value + mentionText.length;
    range.setStart(textNode, newPosition);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);

    textareaRef.value?.focus();
  };

  const sendMessage = () => {
    if (message.value.trim()) {
      let content = message.value;

      // 检查是否为图片链接
      const imageUrlPattern = /^(https?:\/\/.*\.(jpg|jpeg|png|gif|webp))$/i;
      if (imageUrlPattern.test(content.trim())) {
        content = `![图片](${content.trim()})`;
      }

      // 处理引用消息
      if (
        quoteData.value &&
        quoteData.value.userName &&
        quoteData.value.content
      ) {
        const quote = quoteData.value;
        const oId = quote.oId || "";
        const quotePrefix = `\n\n ##### 引用 @${quote.userName}${oId ? ` [↩](https://fishpi.cn/cr#chatroom${oId} "跳转至原消息")` : ""
          }\n\n> ${quote.content}\n\n`;
        content = content + quotePrefix;
      }

      // 处理话题引用
      if (quotedTopic.value) {
        content = `${content}\n${quotedTopic.value}`;
      }

      // 添加小尾巴
      if (signature.value) {
        const trimmedContent = content.trim();
        const shouldAddSignature =
          trimmedContent.length > 0 &&
          !trimmedContent.startsWith("凌 ") &&
          !trimmedContent.startsWith("鸽 ") &&
          !trimmedContent.startsWith("小冰 ") &&
          !trimmedContent.startsWith("点歌 ") &&
          !trimmedContent.startsWith("TTS ") &&
          !trimmedContent.startsWith("朗读 ");

        if (shouldAddSignature) {
          content = `${content}\n\n> ${signature.value}`;
        }
      }

      emit("send-message", content);
      message.value = "";
      textareaRef.value.innerHTML = "";
      quotedTopic.value = "";
      currentTopic.value = "";
      quoteData.value = null;
      closeEmojiSearch(); // 发送后关闭表情包推荐
    }
  };

  const newLine = () => {
    document.execCommand("insertLineBreak");
  };

  const openEmojiPicker = () => {
    showEmojiPicker.value = !showEmojiPicker.value;
  };

  // 处理表情选择
  const handleEmojiSelect = (emoji) => {
    if (typeof emoji === "string") {
      // 只要是 http(s) 链接都插入图片
      const imageUrlPattern = /^https?:\/\//i;
      if (imageUrlPattern.test(emoji.trim())) {
        // 创建图片元素
        const img = document.createElement("img");
        img.src = emoji.trim();
        img.style.maxWidth = "120px";
        img.style.verticalAlign = "text-bottom";
        img.style.margin = "0 4px";
        img.style.objectFit = "contain";
        img.style.cursor = "pointer";

        // 在光标位置插入图片
        const inputContent = textareaRef.value;
        const currentContent = inputContent.innerHTML;
        inputContent.innerHTML = currentContent + img.outerHTML;
        // 更新输入框内容
        message.value = inputContent.innerHTML;
        // 保持焦点并将光标移到末尾
        inputContent.focus();
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(inputContent);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      } else {
        const inputContent = textareaRef.value;
        const currentContent = inputContent.innerHTML;
        inputContent.innerHTML = currentContent + emoji;
        // 更新输入框内容
        message.value = inputContent.innerHTML;
        // 保持焦点并将光标移到末尾
        inputContent.focus();
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(inputContent);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    } else {
      emit("select-emoji", emoji);
    }
  };

  const openImagePicker = () => {
    // 创建文件输入元素
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".jpg,.jpeg,.png,.gif,.mp4";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          // 使用新的上传方法
          const uploadRes = await userApi.uploadImage(file);
          if (uploadRes.code === 0 && uploadRes.data.succMap) {
            const newUrl = uploadRes.data.succMap[file.name];
            if (newUrl) {
              // 发送图片消息
              const markdownImage = `![图片](${newUrl})`;
              emit("send-message", markdownImage);
            }
          }
        } catch (error) {
          console.error("上传图片失败:", error);
          ElMessage.error(error.message || "上传失败");
        }
      }
    };
    input.click();
  };

  const openRedPacketDialog = () => {
    showRedPacketDialog.value = true;
  };

  const handleRedPacketSend = (redPacketData) => {
    emit("send-red-packet", redPacketData);
    showRedPacketDialog.value = false;
  };

  const openDanmakuDialog = () => {
    showDanmakuDialog.value = true;
  };

  const handleDanmakuSend = (content) => {
    // 这里可以自定义弹幕的格式
    const danmakuMessage = `${content}`;
    emit("send-message", danmakuMessage);
  };

  const openSignatureDialog = () => {
    showSignatureDialog.value = true;
  };

  const openBellDialog = () => {
    const savedBells = utools.dbStorage.getItem("fishpi_bells") || [];
    bells.value = savedBells
    showBellDialog.value = true;

  };

  const handleSignatureSave = (newSignature) => {
    signature.value = newSignature;
  };

  // 处理关键词保存/删除后的更新
  const handleBellSave = () => {
    const savedBells = utools.dbStorage.getItem("fishpi_bells") || [];
    bells.value = savedBells;
  };

  // 处理按键事件
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  // 处理图片点击
  const handleImageClick = async (e) => {
    if (e.target.tagName === "IMG") {
      const imgSrc = e.target.src;
      const allImages = Array.from(
        document.querySelectorAll(".input-content img")
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

  // 检查是否为图片消息
  const isImageMessage = (content) => {
    return /\<img[^>]+src=/.test(content);
  };
</script>

<style scoped>
  .room-chat-input-container {
    padding: 12px 20px;
    border-top: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex-shrink: 0;
    background-color: var(--card-bg);
    position: relative;
  }

  .input-wrapper {
    position: relative;
  }

  .input-icons {
    display: flex;
    gap: 15px;
  }

  .emoji-icon-wrapper {
    position: relative;
  }

  .input-icons .icon {
    cursor: pointer;
    font-size: 18px;
    color: var(--sub-text-color);
    transition: color 0.3s ease;
  }

  .input-icons .icon:hover {
    color: var(--primary-color);
  }

  .room-chat-input-container textarea {
    width: 100%;
    height: 60px;
    padding: 10px;
    border: none;
    border-radius: 4px;
    resize: none;
    background-color: var(--card-bg);
    transition: all 0.3s ease;
    font-size: 14px;
    line-height: 1.5;
    caret-color: var(--primary-color);
    caret-width: 2px;
    font-family: inherit;
    color: var(--text-color);
  }

  .room-chat-input-container textarea:focus {
    outline: none;
  }

  .mention-list {
    position: absolute;
    bottom: 100%;
    left: 0;
    width: 200px;
    max-height: 200px;
    overflow-y: auto;
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    z-index: 1000;
  }

  .mention-item {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }

  .mention-item:hover {
    background-color: var(--hover-bg);
  }

  .mention-avatar {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    margin-right: 8px;
  }

  .mention-name {
    font-size: 14px;
    color: var(--text-color);
  }

  .input-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .tip {
    color: var(--sub-text-color);
    font-size: 12px;
  }

  .room-chat-input-container button {
    padding: 0 20px;
    background-color: var(--primary-color);
    color: var(--button-text);
    border: none;
    border-radius: 4px;
    cursor: pointer;
    height: 32px;
    font-size: 14px;
    transition: background-color 0.3s ease;
  }

  .room-chat-input-container button:hover {
    background-color: var(--button-bg);
  }

  .room-chat-input-container button:disabled,
  .room-chat-input-container button.disabled {
    background-color: var(--border-color);
    color: var(--sub-text-color);
    cursor: not-allowed;
    opacity: 0.7;
  }

  :deep(.emoji-picker) {
    position: absolute;
    bottom: calc(100% + 15px);
    left: -5px;
    z-index: 1000;
  }

  .quoted-topic,
  .quoted-message {
    background-color: var(--hover-bg);
    padding: 8px 12px;
    border-radius: 4px;
    margin-bottom: 8px;
    display: flex;
    align-items: flex-start;
    gap: 8px;
    max-width: 100%;
    overflow: hidden;
  }

  .quoted-topic-label,
  .quoted-message-label {
    color: var(--sub-text-color);
    font-size: 13px;
    white-space: nowrap;
  }

  .quoted-topic-text,
  .quoted-message-content {
    flex: 1;
    color: var(--text-color);
    font-size: 13px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .close-icon {
    color: var(--sub-text-color);
    cursor: pointer;
    font-size: 12px;
    transition: color 0.2s ease;
    padding: 4px;
    flex-shrink: 0;
  }

  .close-icon:hover {
    color: var(--text-color);
  }

  .input-content {
    width: 100%;
    min-height: 60px;
    max-height: 100px;
    border: none;
    border-radius: 4px;
    background-color: var(--card-bg);
    transition: all 0.3s ease;
    font-size: 14px;
    line-height: 1.5;
    overflow-y: auto;
    outline: none;
    caret-color: var(--primary-color);
    display: inline-block;
    color: var(--text-color);
  }

  .input-content img {
    vertical-align: text-bottom;
    margin: 0 4px;
    cursor: pointer;
    transition: transform 0.2s ease;
  }

  .input-content img:hover {
    transform: scale(1.02);
  }

  .quoted-image-preview {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .quoted-image {
    width: 120px;
    height: auto;
    cursor: pointer;
  }

  .quoted-image-text {
    color: var(--text-color);
    font-size: 13px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .emoji-search-results {
    position: absolute;
    bottom: 100%;
    left: 0;
    width: 100%;
    max-height: 200px;
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    margin-bottom: 6px;
    display: flex;
    flex-direction: column;
  }

  .emoji-search-header {
    padding: 8px 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--border-color);
    background: var(--hover-bg);
    border-radius: 6px 6px 0 0;
    flex-shrink: 0;
  }

  .emoji-search-title {
    color: var(--text-color);
    font-size: 12px;
    font-weight: 500;
  }

  .emoji-search-loading,
  .emoji-search-empty {
    padding: 12px;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 6px;
    color: var(--sub-text-color);
    font-size: 12px;
    flex-shrink: 0;
  }

  .emoji-search-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 4px;
    padding: 8px;
    overflow-y: auto;
    max-height: 140px;
  }

  .emoji-search-item {
    aspect-ratio: 1;
    border-radius: 4px;
    overflow: hidden;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    border: 1px solid transparent;
  }

  .emoji-search-item:hover {
    transform: scale(1.05);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
    border-color: var(--primary-color);
  }

  .emoji-search-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 3px;
  }
</style>