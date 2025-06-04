<template>
  <div v-if="visible" class="danmaku-dialog">
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
  background: white;
  border-radius: 12px;
  width: 400px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideUp 0.3s ease;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.dialog-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
  font-weight: 600;
}

.close-icon {
  cursor: pointer;
  font-size: 18px;
  color: #999;
  transition: color 0.3s;
  padding: 4px;
}

.close-icon:hover {
  color: #666;
}

.dialog-body {
  margin-bottom: 24px;
}

.dialog-body textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  resize: none;
  font-size: 14px;
  line-height: 1.5;
  transition: all 0.3s;
  background: #fafafa;
}

.dialog-body textarea:focus {
  outline: none;
  border-color: #1890ff;
  background: #fff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
}

.text-count {
  text-align: right;
  color: #999;
  font-size: 12px;
  margin-top: 8px;
}

.points-tip {
  color: #ff4d4f;
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
  padding: 8px 24px;
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
}

.dialog-footer button:hover {
  background-color: #40a9ff;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.3);
}

.dialog-footer button:active {
  transform: translateY(0);
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
