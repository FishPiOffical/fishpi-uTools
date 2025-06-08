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
      <span class="quoted-message-content">{{ quoteContent }}</span>
      <i class="fas fa-times close-icon" @click="clearQuote"></i>
    </div>
    <div class="input-icons">
      <!-- 表情图标 -->
      <div class="emoji-icon-wrapper">
        <i class="fas fa-smile icon" @click="openEmojiPicker" title="表情"></i>
        <EmojiPicker
          :visible="showEmojiPicker"
          @select="handleEmojiSelect"
          @close="showEmojiPicker = false"
        />
      </div>
      <!-- 图片图标 -->
      <i class="fas fa-image icon" @click="openImagePicker" title="图片"></i>
      <!-- 红包图标 -->
      <i class="fas fa-gift icon" @click="openRedPacketDialog" title="红包"></i>
      <!-- 弹幕图标 -->
      <i
        class="fas fa-comment-dots icon"
        @click="openDanmakuDialog"
        title="弹幕"
      ></i>
      <!-- 小尾巴图标 -->
      <i
        class="fas fa-pen-fancy icon"
        @click="openSignatureDialog"
        title="小尾巴"
      ></i>
    </div>
    <div class="input-wrapper">
      <div
        ref="textareaRef"
        class="input-content"
        contenteditable="true"
        @keydown="handleKeyDown"
        @input="handleInput"
        @focus="showEmojiPicker = false"
        @click="handleImageClick"
      ></div>
      <!-- @提及用户列表 -->
      <div v-if="showMentionList" class="mention-list">
        <div
          v-for="user in filteredUsers"
          :key="user.userName"
          class="mention-item"
          @click="selectMention(user)"
        >
          <img :src="user.userAvatarURL" alt="avatar" class="mention-avatar" />
          <span class="mention-name">{{ user.userName }}</span>
        </div>
      </div>
    </div>
    <div class="input-footer">
      <span class="tip">按 Enter 发送，Shift + Enter 换行</span>
      <button @click="sendMessage">发送</button>
    </div>
    <RedPacketDialog
      :visible="showRedPacketDialog"
      :online-users="onlineUsers"
      @close="showRedPacketDialog = false"
      @send="handleRedPacketSend"
    />
    <DanmakuDialog
      :visible="showDanmakuDialog"
      @close="showDanmakuDialog = false"
      @send="handleDanmakuSend"
    />
    <SignatureDialog
      :visible="showSignatureDialog"
      :default-signature="signature"
      @close="showSignatureDialog = false"
      @save="handleSignatureSave"
    />
    <!-- 图片预览组件 -->
    <vue-easy-lightbox
      :visible="previewVisible"
      :imgs="previewImages"
      :index="previewIndex"
      @hide="previewVisible = false"
    />
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
import { userApi } from "../api/user";
import { ElMessage } from "element-plus";
import VueEasyLightbox from "vue-easy-lightbox";

const props = defineProps({
  onlineUsers: {
    type: Array,
    default: () => [],
  },
});

const message = ref("");
const showEmojiPicker = ref(false);
const showRedPacketDialog = ref(false);
const showMentionList = ref(false);
const mentionStartIndex = ref(-1);
const quotedTopic = ref("");
const currentTopic = ref("");
const quoteData = ref(null); // 新增：引用消息数据
const showDanmakuDialog = ref(false);
const showSignatureDialog = ref(false);
const signature = ref("");
const emit = defineEmits([
  "send-message",
  "select-emoji",
  "select-image",
  "send-red-packet",
]);

const textareaRef = ref(null);

// 图片预览相关
const previewVisible = ref(false);
const previewImages = ref([]);
const previewIndex = ref(0);

// 添加粘贴事件监听
onMounted(() => {
  textareaRef.value?.addEventListener("paste", handlePaste);
});

onUnmounted(() => {
  textareaRef.value?.removeEventListener("paste", handlePaste);
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
  if (!quoteData.value) return "";
  const temp = document.createElement("div");
  temp.innerHTML = quoteData.value.content;
  const text = temp.innerText;
  const maxLength = 20; // 最大显示长度
  if (text.length > maxLength) {
    return `${quoteData.value.userName}：${text.slice(0, maxLength)}...`;
  }
  return `${quoteData.value.userName}：${text}`;
});

// 设置引用消息
const setQuote = (quote) => {
  quoteData.value = quote;
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
  const lastAtIndex = text.lastIndexOf("@");

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
    if (quoteData.value) {
      const quote = quoteData.value;
      const quotePrefix = `\n\n ##### 引用 @${quote.userName} [↩](https://fishpi.cn/cr#chatroom${quote.oId} "跳转至原消息")\n\n> ${quote.content}\n\n`;
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
    console.log(emoji);

    // 检查是否是图片链接
    const imageUrlPattern = /^(https?:\/\/.*\.(jpg|jpeg|png|gif|webp))$/i;
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

const handleSignatureSave = (newSignature) => {
  signature.value = newSignature;
};

// 处理按键事件
const handleKeyDown = (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
};

// 处理图片点击
const handleImageClick = (e) => {
  if (e.target.tagName === "IMG") {
    const imgSrc = e.target.src;
    const allImages = Array.from(
      document.querySelectorAll(".input-content img")
    ).map((img) => ({
      src: img.src,
    }));
    previewIndex.value = allImages.findIndex((img) => img.src === imgSrc);
    previewImages.value = allImages;
    previewVisible.value = true;
  }
};
</script>

<style scoped>
.room-chat-input-container {
  padding: 12px 20px;
  border-top: 1px solid #eee;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
  background-color: #fff;
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
  color: #666;
  transition: color 0.3s ease;
}

.input-icons .icon:hover {
  color: #1890ff;
}

.room-chat-input-container textarea {
  width: 100%;
  height: 60px;
  padding: 10px;
  border: none;
  border-radius: 4px;
  resize: none;
  background-color: #fff;
  transition: all 0.3s ease;
  font-size: 14px;
  line-height: 1.5;
  caret-color: #1890ff;
  caret-width: 2px;
  font-family: inherit;
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
  background: white;
  border: 1px solid #eee;
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
  background-color: #f5f5f5;
}

.mention-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  margin-right: 8px;
}

.mention-name {
  font-size: 14px;
  color: #333;
}

.input-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tip {
  color: #999;
  font-size: 12px;
}

.room-chat-input-container button {
  padding: 0 20px;
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  height: 32px;
  font-size: 14px;
  transition: background-color 0.3s ease;
}

.room-chat-input-container button:hover {
  background-color: #40a9ff;
}

:deep(.emoji-picker) {
  position: absolute;
  bottom: calc(100% + 15px);
  left: -5px;
  z-index: 1000;
}

.quoted-topic,
.quoted-message {
  background-color: #f5f7fa;
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
  color: #666;
  font-size: 13px;
  white-space: nowrap;
}

.quoted-topic-text,
.quoted-message-content {
  flex: 1;
  color: #333;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.close-icon {
  color: #999;
  cursor: pointer;
  font-size: 12px;
  transition: color 0.2s ease;
  padding: 4px;
  flex-shrink: 0;
}

.close-icon:hover {
  color: #666;
}

.input-content {
  width: 100%;
  min-height: 60px;
  max-height: 100px;
  padding: 10px;
  border: none;
  border-radius: 4px;
  background-color: #fff;
  transition: all 0.3s ease;
  font-size: 14px;
  line-height: 1.5;
  overflow-y: auto;
  outline: none;
  caret-color: #1890ff;
  display: inline-block;
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

/* 自定义滚动条样式 */
.input-content::-webkit-scrollbar {
  width: 6px;
}

.input-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.input-content::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.input-content::-webkit-scrollbar-thumb:hover {
  background: #999;
}
</style>
