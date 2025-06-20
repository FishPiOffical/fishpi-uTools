<template>
  <div class="publish-container">
    <!-- 浮动按钮 -->
    <div class="float-button" @click="showModal = true">
      <i class="fas fa-pen"></i>
    </div>

    <!-- 弹窗 -->
    <div v-if="showModal" class="modal-overlay" @click="handleOverlayClick">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>发布清风明月</h3>
          <button class="close-button" @click="showModal = false">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="input-wrapper">
            <textarea
              v-model="content"
              placeholder="写下此刻的心情..."
              :maxlength="200"
              class="publish-textarea"
              ref="textarea"
              @keydown.enter.exact.prevent="handlePublish"
              @keydown.enter.shift.exact="newLine"
            ></textarea>
            <div class="input-tips">
              <span
                class="char-count"
                :class="{ 'near-limit': content.length > 180 }"
              >
                {{ content.length }}/200
              </span>
            </div>
          </div>
          <div class="publish-footer">
            <button
              @click="handlePublish"
              :disabled="!content.trim()"
              class="publish-button"
              :class="{ 'button-loading': isPublishing }"
            >
              <span class="button-text">发布</span>
              <i class="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import { breezemoonApi } from "../api";

const emit = defineEmits(["publish-success"]);
const showModal = ref(false);
const content = ref("");
const textarea = ref(null);
const isPublishing = ref(false);

// 监听弹窗显示，自动聚焦输入框
watch(showModal, (newVal) => {
  if (newVal) {
    setTimeout(() => {
      textarea.value?.focus();
    }, 100);
  } else {
    content.value = "";
    isPublishing.value = false;
  }
});

// 处理遮罩层点击
const handleOverlayClick = (e) => {
  if (e.target.classList.contains("modal-overlay")) {
    showModal.value = false;
  }
};

// 处理换行
const newLine = () => {
  content.value += "\n";
};

// 处理发布
const handlePublish = async () => {
  if (!content.value.trim() || isPublishing.value) return;

  try {
    isPublishing.value = true;
    await breezemoonApi.publishBreezemoon(content.value);
    content.value = "";
    showModal.value = false;
    emit("publish-success");
  } catch (error) {
    console.error("发布清风明月失败:", error);
  } finally {
    isPublishing.value = false;
  }
};
</script>

<style scoped>
.publish-container {
  position: relative;
}

.float-button {
  position: fixed;
  right: 30px;
  bottom: 30px;
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #ff9800 0%, #ff5722 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 100;
}

.float-button:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 6px 16px rgba(255, 152, 0, 0.4);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease-out;
  backdrop-filter: blur(4px);
}

.modal-content {
  background-color: var(--card-bg);
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-header h3 {
  margin: 0;
  font-size: 20px;
  color: var(--text-color);
  font-weight: 600;
}

.close-button {
  background: none;
  border: none;
  color: var(--sub-text-color);
  font-size: 20px;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: all 0.2s;
}

.close-button:hover {
  background-color: var(--hover-bg);
  color: var(--primary-color);
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
}

.input-wrapper {
  position: relative;
  margin-bottom: 16px;
  background-color: var(--card-bg);
  border-radius: 4px;
}

.publish-textarea {
  width: 100%;
  min-height: 60px;
  padding: 10px;
  border: none;
  border-radius: 4px;
  resize: none;
  background-color: var(--card-bg);
  transition: all 0.3s ease;
  font-size: 14px;
  line-height: 1.5;
  caret-color: #ff9800;
  caret-width: 2px;
  font-family: inherit;
  color: var(--text-color);
}

.publish-textarea:focus {
  outline: none;
}

.input-tips {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  padding: 0 4px;
  color: var(--sub-text-color);
  font-size: 12px;
}

.char-count {
  transition: color 0.3s;
}

.char-count.near-limit {
  color: #ff9800;
}

.shortcut-tip {
  color: var(--sub-text-color);
}

.publish-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

.publish-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  background: linear-gradient(135deg, #ff9800 0%, #ff5722 100%);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 500;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}

.publish-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
}

.publish-button:disabled {
  background: #e0e0e0;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.publish-button i {
  font-size: 16px;
  transition: transform 0.3s;
}

.publish-button:hover:not(:disabled) i {
  transform: translateX(4px);
}

.button-loading {
  pointer-events: none;
  opacity: 0.8;
}

.button-loading i {
  animation: send 1s infinite;
}

@keyframes send {
  0% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(8px);
  }
  100% {
    transform: translateX(0);
  }
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
