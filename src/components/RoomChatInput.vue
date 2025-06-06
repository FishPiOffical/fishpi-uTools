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
        <i class="fas fa-smile icon" @mouseenter="openEmojiPicker"></i>
        <EmojiPicker
          :visible="showEmojiPicker"
          @select="handleEmojiSelect"
          @close="showEmojiPicker = false"
        />
      </div>
      <!-- 图片图标 -->
      <i class="fas fa-image icon" @click="openImagePicker"></i>
      <!-- 红包图标 -->
      <i class="fas fa-gift icon" @click="openRedPacketDialog"></i>
      <!-- 弹幕图标 -->
      <i class="fas fa-comment-dots icon" @click="openDanmakuDialog"></i>
      <!-- 小尾巴图标 -->
      <i class="fas fa-pen-fancy icon" @click="openSignatureDialog"></i>
    </div>
    <div class="input-wrapper">
      <textarea
        ref="textareaRef"
        v-model="message"
        placeholder=""
        @keyup.enter.exact="sendMessage"
        @keyup.enter.shift.exact="newLine"
        @input="handleInput"
        @focus="showEmojiPicker = false"
      ></textarea>
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

// 添加粘贴事件监听
onMounted(() => {
  textareaRef.value?.addEventListener("paste", handlePaste);
});

onUnmounted(() => {
  textareaRef.value?.removeEventListener("paste", handlePaste);
});

// 处理粘贴事件
const handlePaste = async (e) => {
  console.log("开始粘贴");

  const items = e.clipboardData?.items;
  if (!items) return;

  for (const item of items) {
    if (item.type.indexOf("image") !== -1) {
      e.preventDefault();
      const file = item.getAsFile();
      const reader = new FileReader();
      reader.onloadend = () => {
        // 使用utools API粘贴图片
        console.log("粘贴图片");
        utools.hideMainWindowPasteImage(reader.result);
      };
      reader.readAsDataURL(file);
      return;
    }
  }
};

const focus = () => {
  textareaRef.value?.focus();
};

const insertAtUser = (userName) => {
  const textarea = textareaRef.value;
  if (!textarea) return;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const before = message.value.slice(0, start);
  const after = message.value.slice(end);
  message.value = before + "@" + userName + " " + after;
  nextTick(() => {
    textarea.focus();
    const pos = before.length + userName.length + 2;
    textarea.setSelectionRange(pos, pos);
  });
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
  const maxLength = 40; // 最大显示长度
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
const handleInput = () => {
  const text = message.value;
  const lastAtIndex = text.lastIndexOf("@");

  if (lastAtIndex !== -1) {
    const textAfterAt = text.slice(lastAtIndex + 1);
    // 只要输入了@就显示用户列表
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
  message.value = `${beforeMention}@${user.userName} ${afterMention}`;
  showMentionList.value = false;
  textareaRef.value?.focus();
};

const sendMessage = () => {
  if (message.value.trim()) {
    let content = message.value;

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
      content = `${content}\n\n---\n${signature.value}`;
    }

    emit("send-message", content);
    message.value = "";
    quotedTopic.value = "";
    currentTopic.value = "";
    quoteData.value = null; // 发送后清除引用
  }
};

const newLine = () => {
  message.value += "\n";
};

const openEmojiPicker = () => {
  showEmojiPicker.value = true;
};

const handleEmojiSelect = (emoji) => {
  if (typeof emoji === "string") {
    message.value += emoji;
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

.quoted-topic {
  background-color: #fff;
  border-radius: 4px;
  padding: 6px 12px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  border: 1px solid #e8e8e8;
}

.quoted-topic-label {
  color: #999;
  font-size: 13px;
  margin-right: 4px;
}

.quoted-topic-text {
  color: #1890ff;
  font-size: 13px;
  flex: 1;
  margin-right: 8px;
}

.close-icon {
  color: #999;
  cursor: pointer;
  font-size: 12px;
  transition: color 0.2s ease;
  padding: 4px;
}

.close-icon:hover {
  color: #666;
}

.quoted-message {
  background-color: #f5f7fa;
  padding: 8px 12px;
  border-radius: 4px;
  margin-bottom: 8px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.quoted-message-label {
  color: #666;
  font-size: 13px;
  white-space: nowrap;
}

.quoted-message-content {
  flex: 1;
  color: #333;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
