<template>
  <div class="chat-input-container">
    <div class="input-icons">
      <!-- 表情图标 -->
      <div class="emoji-icon-wrapper">
        <i class="fas fa-smile icon" @click="openEmojiPicker"></i>
        <EmojiPicker
          :visible="showEmojiPicker"
          @select="handleEmojiSelect"
          @close="showEmojiPicker = false"
        />
      </div>
      <!-- 图片图标 -->
      <i class="fas fa-image icon" @click="openImagePicker"></i>
      <!-- 转账图标 -->
      <i
        v-if="showTransfer"
        class="fas fa-money-bill-wave icon"
        @click="openTransferDialog"
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
      ></div>
    </div>
    <div class="input-footer">
      <span class="tip">按 Enter 发送，Shift + Enter 换行</span>
      <button @click="sendMessage">发送</button>
    </div>
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
import { ref, defineEmits, defineProps, onMounted, onUnmounted } from "vue";
import EmojiPicker from "./EmojiPicker.vue";
import TransferDialog from "./TransferDialog.vue";
import { ElMessage } from "element-plus";
import { userApi } from "../api/user";

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
            img.style.verticalAlign = "middle";
            img.style.margin = "0 4px";
            img.style.objectFit = "contain";
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

defineExpose({
  focus,
});

// 处理输入事件
const handleInput = (e) => {
  message.value = e.target.innerHTML;
};

const sendMessage = () => {
  if (message.value.trim()) {
    let content = message.value;

    // 检查是否为图片链接
    const imageUrlPattern = /^(https?:\/\/.*\.(jpg|jpeg|png|gif|webp))$/i;
    if (imageUrlPattern.test(content.trim())) {
      content = `![图片](${content.trim()})`;
    }

    emit("send-message", content);
    message.value = "";
    textareaRef.value.innerHTML = "";
  }
};

const handleKeyDown = (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
};

const openEmojiPicker = () => {
  showEmojiPicker.value = !showEmojiPicker.value;
};

// 处理表情选择
const handleEmojiSelect = (emoji) => {
  if (typeof emoji === "string") {
    // 检查是否是图片链接
    const imageUrlPattern = /^(https?:\/\/.*\.(jpg|jpeg|png|gif|webp))$/i;
    if (imageUrlPattern.test(emoji.trim())) {
      // 创建图片元素
      const img = document.createElement("img");
      img.src = emoji.trim();
      img.style.maxWidth = "120px";
      img.style.verticalAlign = "middle";
      img.style.margin = "0 4px";
      img.style.objectFit = "contain";

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

const openTransferDialog = () => {
  showTransferDialog.value = true;
};

const handleTransferSuccess = (transferData) => {
  // 只触发转账成功事件，让父组件处理消息发送
  emit("transfer-success", transferData);
  // 关闭转账对话框
  showTransferDialog.value = false;
};

const handleTransferError = (error) => {
  emit("transfer-error", error);
};
</script>

<style scoped>
.chat-input-container {
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

.input-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tip {
  color: var(--sub-text-color);
  font-size: 12px;
}

.chat-input-container button {
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

.chat-input-container button:hover {
  background-color: var(--button-bg);
}

:deep(.emoji-picker) {
  position: absolute;
  bottom: calc(100% + 15px);
  left: -5px;
  z-index: 1000;
}

.input-content {
  width: 100%;
  min-height: 60px;
  max-height: 100px;
  padding: 10px;
  border: none;
  border-radius: 4px;
  background-color: var(--card-bg);
  transition: all 0.3s ease;
  font-size: 14px;
  line-height: 1.5;
  overflow-y: auto;
  outline: none;
  caret-color: var(--primary-color);
  color: var(--text-color);
}

.input-content:focus {
  outline: none;
}

/* 自定义滚动条样式 */
.input-content::-webkit-scrollbar {
  width: 6px;
}

.input-content::-webkit-scrollbar-track {
  background: var(--background-color);
  border-radius: 3px;
}

.input-content::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 3px;
}

.input-content::-webkit-scrollbar-thumb:hover {
  background: var(--sub-text-color);
}
</style>
