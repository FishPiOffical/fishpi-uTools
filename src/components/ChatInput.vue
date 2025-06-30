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
        @click="closeEmojiSearch()"
      ></div>

      <!-- 表情包搜索结果 -->
      <div
        v-if="
          showEmojiSearch &&
          (emojiSearchLoading || emojiSearchResults.length > 0)
        "
        class="emoji-search-results"
      >
        <div class="emoji-search-header">
          <span class="emoji-search-title">推荐表情</span>
          <i class="fas fa-times close-icon" @click="closeEmojiSearch"></i>
        </div>
        <div v-if="emojiSearchLoading" class="emoji-search-loading">
          <i class="fas fa-spinner fa-spin"></i>
          <span>搜索中...</span>
        </div>
        <div v-else class="emoji-search-grid">
          <div
            v-for="(image, index) in emojiSearchResults"
            :key="index"
            class="emoji-search-item"
            @click="selectEmojiImage(image)"
          >
            <img
              :src="image.thumbURL"
              :alt="image.title"
              class="emoji-search-image"
              @error="handleImageError"
            />
          </div>
        </div>
      </div>
    </div>
    <div class="input-footer">
      <span class="tip">按 Enter 发送，Shift + Enter 换行</span>
      <button
        @click="sendMessage"
        :disabled="!message.trim()"
        :class="{ disabled: !message.trim() }"
      >
        发送
      </button>
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
import { baiduImageAPI } from "../api/baidu";

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

// 新增：表情包搜索相关状态
const showEmojiSearch = ref(false);
const emojiSearchResults = ref([]);
const emojiSearchLoading = ref(false);
const emojiSearchDebounceTimer = ref(null);
// 新增：推荐表情自动关闭定时器
const emojiSearchAutoCloseTimer = ref(null);

// 新增：表情包推荐关键词
const emojiTriggerKeywords = [
  "表情",
  "emoji",
  "哈哈哈",
  "搞笑",
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

// 添加粘贴事件监听
onMounted(() => {
  textareaRef.value?.addEventListener("paste", handlePaste);
});

onUnmounted(() => {
  textareaRef.value?.removeEventListener("paste", handlePaste);

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

  // 新增：如果推荐弹窗已打开，输入时立即关闭
  if (showEmojiSearch.value) {
    closeEmojiSearch();
  }

  // 检查是否触发表情包搜索
  checkEmojiSearch(message.value);
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
    closeEmojiSearch(); // 发送后关闭表情包推荐
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
    // 只要是 http(s) 链接都插入图片
    const imageUrlPattern = /^https?:\/\//i;
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

.chat-input-container button:disabled,
.chat-input-container button.disabled {
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
  color: var(--text-color);
}

.input-content:focus {
  outline: none;
}

.emoji-search-results {
  position: absolute;
  bottom: calc(100% + 10px);
  left: 0;
  right: 0;
  z-index: 1000;
  background-color: var(--card-bg);
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  max-height: 200px;
  display: flex;
  flex-direction: column;
}

.emoji-search-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  border-bottom: 1px solid var(--border-color);
  background: var(--hover-bg);
  border-radius: 4px 4px 0 0;
  flex-shrink: 0;
}

.emoji-search-title {
  color: var(--text-color);
  font-size: 12px;
  font-weight: bold;
}

.close-icon {
  cursor: pointer;
  font-size: 14px;
  color: var(--sub-text-color);
  transition: color 0.3s ease;
}

.close-icon:hover {
  color: var(--primary-color);
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
  max-height: 150px;
}

.emoji-search-item {
  cursor: pointer;
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: 3px;
  transition: transform 0.2s ease;
  border: 1px solid transparent;
}

.emoji-search-item:hover {
  transform: scale(1.05);
  border-color: var(--primary-color);
}

.emoji-search-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
