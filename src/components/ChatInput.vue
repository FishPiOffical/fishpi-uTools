<template>
  <div class="chat-input-container">
    <div class="input-icons">
      <!-- 表情图标 -->
      <i class="fas fa-smile icon" @mouseenter="openEmojiPicker"></i>
      <!-- 图片图标 -->
      <i class="fas fa-image icon" @click="openImagePicker"></i>
      <!-- 转账图标 -->
      <i
        v-if="showTransfer"
        class="fas fa-money-bill-wave icon"
        @click="openTransferDialog"
      ></i>
    </div>
    <textarea
      ref="textareaRef"
      v-model="message"
      placeholder=""
      @keyup.enter="sendMessage"
      @focus="showEmojiPicker = false"
    ></textarea>
    <button @click="sendMessage">发送</button>
    <EmojiPicker
      :visible="showEmojiPicker"
      @select="handleEmojiSelect"
      @close="showEmojiPicker = false"
    />
    <TransferDialog
      :visible="showTransferDialog"
      :receiver-user-name="receiverUserName"
      @close="showTransferDialog = false"
      @success="handleTransferSuccess"
      @error="handleTransferError"
    />
  </div>
</template>

<script setup>
import { ref, defineEmits, defineProps } from "vue";
import EmojiPicker from "./EmojiPicker.vue";
import TransferDialog from "./TransferDialog.vue";

const props = defineProps({
  showTransfer: {
    type: Boolean,
    default: true,
  },
  receiverUserName: {
    type: String,
    required: true,
  },
});

const message = ref("");
const showEmojiPicker = ref(false);
const showTransferDialog = ref(false);
const emit = defineEmits([
  "send-message",
  "select-emoji",
  "select-image",
  "transfer-success",
  "transfer-error",
]);

const textareaRef = ref(null);

const focus = () => {
  textareaRef.value?.focus();
};

defineExpose({
  focus,
});

const sendMessage = () => {
  if (message.value.trim()) {
    emit("send-message", message.value);
    message.value = "";
  }
};

const openEmojiPicker = () => {
  showEmojiPicker.value = true;
};

const handleEmojiSelect = (emoji) => {
  if (typeof emoji === "string") {
    // 默认表情
    message.value += emoji;
  } else {
    // 表情包
    emit("select-emoji", emoji);
  }
};

const openImagePicker = () => {
  // TODO: Implement image selection logic
  emit("select-image");
};

const openTransferDialog = () => {
  showTransferDialog.value = true;
};

const handleTransferSuccess = (transferData) => {
  emit("transfer-success", transferData);
};

const handleTransferError = (error) => {
  emit("transfer-error", error);
};
</script>

<style scoped>
.chat-input-container {
  padding: 10px 20px; /* 调整内边距 */
  border-top: 1px solid #eee;
  display: flex;
  flex-direction: column; /* 图标和输入框垂直排列 */
  gap: 10px; /* 图标行和输入框之间的间距 */
  flex-shrink: 0;
  position: relative;
}

.input-icons {
  display: flex;
  gap: 15px; /* 图标之间的间距 */
}

.input-icons .icon {
  cursor: pointer;
  font-size: 20px; /* 调整图标大小 */
  color: #666;
  transition: color 0.3s ease;
}

.input-icons .icon:hover {
  color: #1890ff; /* 鼠标悬停效果 */
}

.chat-input-container textarea {
  flex: 1;
  height: 60px;
  padding: 10px;
  border: none;
  border-radius: 4px;
  resize: none;
  background-color: #fff;
  transition: background-color 0.3s ease;
  font-size: 14px; /* 使用正常字体大小 */
  line-height: 1.5;
  caret-color: #1890ff;
  caret-width: 2px;
  font-family: inherit; /* 继承父元素字体 */
}

.chat-input-container textarea::placeholder {
  color: #999;
}

.chat-input-container textarea:focus {
  outline: none;
  background-color: #fff;
}

.chat-input-container button {
  padding: 0 20px;
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  flex-shrink: 0;
  height: 35px; /* 调整按钮高度 */
  align-self: flex-end; /* 将按钮对齐到右侧 */
}

.chat-input-container button:hover {
  background-color: #40a9ff;
}
</style>
