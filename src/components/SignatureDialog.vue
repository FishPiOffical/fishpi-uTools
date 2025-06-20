<template>
  <div v-if="visible" class="signature-dialog" @click.self="handleClose">
    <div class="signature-content">
      <div class="dialog-header">
        <h3>小尾巴</h3>
        <i class="fas fa-times close-icon" @click="handleClose"></i>
      </div>
      <div class="dialog-body">
        <div class="tip">小尾巴会自动添加到消息下方，建议使用简短文字。</div>
        <div class="input-area">
          <textarea
            v-model="signatureContent"
            placeholder="输入小尾巴内容"
            rows="2"
          ></textarea>
        </div>
        <div class="button-group">
          <button
            class="random-btn"
            @click="generateRandomQuote"
            :disabled="isLoading"
          >
            <i class="fas fa-random"></i>
            {{ isLoading ? "生成中..." : "随机生成诗句/名言" }}
          </button>
        </div>
        <div class="preview" v-if="signatureContent">
          <div class="preview-label">预览：</div>
          <div class="preview-content">
            <div class="message-row message-row-self">
              <div class="message-bubble">
                <div class="message-content">
                  <div class="message-text">
                    这是一条消息
                    <blockquote v-if="signatureContent">
                      {{ signatureContent }}
                    </blockquote>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="dialog-footer">
        <button @click="handleSave">确定</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { useUserStore } from "../stores/user";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  defaultSignature: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["close", "save"]);
const signatureContent = ref(props.defaultSignature);
const isLoading = ref(false);
const userStore = useUserStore();

const handleClose = () => {
  emit("close");
};

// 获取当前用户的小尾巴
const getUserSignature = () => {
  const savedSignatures = utools.dbStorage.getItem("fishpi_signatures") || {};
  const currentUsername = userStore.userInfo?.userName;
  return currentUsername
    ? savedSignatures[currentUsername] || ""
    : savedSignatures;
};

// 保存当前用户的小尾巴
const saveUserSignature = (signature) => {
  const savedSignatures = utools.dbStorage.getItem("fishpi_signatures") || {};
  const currentUsername = userStore.userInfo?.userName;

  if (currentUsername) {
    savedSignatures[currentUsername] = signature;
  } else {
    Object.assign(savedSignatures, { default: signature });
  }

  utools.dbStorage.setItem("fishpi_signatures", savedSignatures);
};

onMounted(() => {
  // 从 utools.dbStorage 获取保存的小尾巴
  const userSignature = getUserSignature();
  signatureContent.value = userSignature || props.defaultSignature;

  // 监听账号切换事件
  window.addEventListener("fishpi:account-switched", () => {
    // 重新加载用户小尾巴
    const userSignature = getUserSignature();
    signatureContent.value = userSignature || props.defaultSignature;
  });
});

const handleSave = () => {
  saveUserSignature(signatureContent.value);
  emit("save", signatureContent.value);
  handleClose();

  ElMessage({
    message: "小尾巴已保存",
    type: "success",
    duration: 2000,
    showClose: true,
  });
};

// 随机生成诗句/名言
const generateRandomQuote = async () => {
  try {
    isLoading.value = true;
    // 使用今日诗词API
    const response = await fetch("https://v2.jinrishici.com/one.json");
    const data = await response.json();

    if (data && data.data && data.data.content) {
      signatureContent.value = data.data.content;
    } else {
      // 如果API调用失败，使用备用诗句
      const backupQuotes = [
        "人生若只如初见，何事秋风悲画扇。",
        "海内存知己，天涯若比邻。",
        "春风得意马蹄疾，一日看尽长安花。",
        "纸上得来终觉浅，绝知此事要躬行。",
        "不畏浮云遮望眼，自缘身在最高层。",
        "会当凌绝顶，一览众山小。",
        "长风破浪会有时，直挂云帆济沧海。",
        "天生我材必有用，千金散尽还复来。",
        "欲穷千里目，更上一层楼。",
        "莫愁前路无知己，天下谁人不识君。",
      ];
      const randomIndex = Math.floor(Math.random() * backupQuotes.length);
      signatureContent.value = backupQuotes[randomIndex];
    }
  } catch (error) {
    console.error("获取随机诗句失败:", error);
    ElMessage.error("获取随机诗句失败，请重试");
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.signature-dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.signature-content {
  background: var(--card-bg);
  border-radius: 8px;
  width: 380px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 1px solid var(--border-color);
  animation: slideUp 0.3s ease;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.dialog-header h3 {
  margin: 0;
  font-size: 16px;
  color: var(--text-color);
}

.close-icon {
  cursor: pointer;
  color: var(--sub-text-color);
}

.dialog-body {
  margin-bottom: 16px;
}

.tip {
  font-size: 12px;
  color: var(--sub-text-color);
  margin-bottom: 8px;
}

.input-area {
  margin-bottom: 8px;
}

textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  resize: none;
  margin-bottom: 12px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-color);
  background: var(--card-bg);
  transition: border-color 0.2s;
}

textarea:focus {
  outline: none;
  border-color: var(--primary-color);
}

.preview {
  background: var(--hover-bg);
  border-radius: 4px;
  padding: 12px;
  font-size: 13px;
  color: var(--sub-text-color);
}

.preview-label {
  color: var(--sub-text-color);
  margin-bottom: 8px;
}

.preview-content {
  line-height: 1.5;
}

.message-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 8px;
}

.message-bubble {
  max-width: 80%;
  min-width: 60px;
  display: flex;
  flex-direction: column;
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

.message-text :deep(blockquote) {
  margin: 8px 0 0 0;
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

.signature {
  font-size: 12px;
  color: var(--primary-color);
  margin-top: 4px;
  padding: 0 4px;
}

.dialog-footer {
  text-align: right;
}

.dialog-footer button {
  padding: 6px 16px;
  background-color: var(--button-bg);
  color: var(--button-text);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.dialog-footer button:hover {
  background-color: var(--primary-color);
}

.button-group {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}

.random-btn {
  padding: 6px 12px;
  background: var(--hover-bg);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--sub-text-color);
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s ease;
}

.random-btn:hover {
  background: var(--card-bg);
  border-color: var(--primary-color);
}

.random-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.random-btn i {
  font-size: 12px;
}

.message-row-self {
  flex-direction: row-reverse;
}

.message-row-self .message-text {
  background-color: var(--bubble-bg);
  margin-left: auto;
}

.message-row-self .message-text :deep(blockquote) {
  background-color: var(--hover-bg);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
