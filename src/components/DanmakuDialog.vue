<template>
  <div v-if="visible" class="danmaku-dialog" @click.self="handleClose">
    <div class="danmaku-content">
      <div class="dialog-header">
        <h3>发送弹幕</h3>
        <i class="fas fa-times close-icon" @click="handleClose"></i>
      </div>
      <div class="dialog-body">
        <textarea
          v-model="danmakuContent"
          placeholder="友善弹幕，最多32个字哦"
          rows="3"
          maxlength="32"
        ></textarea>
        <div class="text-count">{{ danmakuContent.length }}/32</div>
        <div class="points-tip">发送弹幕每次将花费 5 积分</div>
      </div>
      <div class="dialog-footer">
        <button @click="handleSend">发射!</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["close", "send"]);

const danmakuContent = ref("");

const handleClose = () => {
  emit("close");
  danmakuContent.value = "";
};

const handleSend = () => {
  if (danmakuContent.value.trim()) {
    const formattedContent = `[barrager]{"color":"rgba(255,255,255,1)","content":"${danmakuContent.value}"}[/barrager]`;
    emit("send", formattedContent);
    danmakuContent.value = "";
    handleClose();
  }
};
</script>

<style scoped>
.danmaku-dialog {
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

.danmaku-content {
  background: var(--card-bg);
  border-radius: 8px;
  width: 380px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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

.dialog-body textarea {
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
}

.dialog-body textarea:focus {
  outline: none;
  border-color: var(--primary-color);
}

.text-count {
  text-align: right;
  color: var(--sub-text-color);
  font-size: 12px;
  margin-top: 8px;
}

.points-tip {
  color: var(--point-color);
  font-size: 12px;
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.points-tip::before {
  content: "💎";
  font-size: 14px;
}

.dialog-footer {
  text-align: right;
}

.dialog-footer button {
  padding: 6px 16px;
  background-color: var(--primary-color);
  color: var(--button-text);
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.dialog-footer button:hover {
  background-color: var(--button-bg);
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
