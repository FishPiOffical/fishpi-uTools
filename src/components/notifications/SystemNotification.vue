<template>
  <BaseNotification
    :notification="notification"
    @mark-as-read="handleMarkAsRead"
  >
    <div class="notification-message" v-html="notification.description"></div>
    <div class="notification-meta">
      <div class="notification-time">
        <i class="fas fa-clock"></i>
        <span>{{ formatTime(notification.createTime) }}</span>
      </div>
    </div>
  </BaseNotification>
</template>

<script setup>
import { defineProps, defineEmits } from "vue";
import BaseNotification from "./BaseNotification.vue";

const props = defineProps({
  notification: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["mark-as-read"]);

const handleMarkAsRead = (oId) => {
  emit("mark-as-read", oId);
};

const formatTime = (time) => {
  if (!time) return "";
  const date = new Date(time);
  const now = new Date();
  const diff = now - date;

  if (diff < 60 * 1000) return "刚刚";
  if (diff < 60 * 60 * 1000) return Math.floor(diff / (60 * 1000)) + "分钟前";
  if (diff < 24 * 60 * 60 * 1000)
    return Math.floor(diff / (60 * 60 * 1000)) + "小时前";
  if (diff < 30 * 24 * 60 * 60 * 1000)
    return Math.floor(diff / (24 * 60 * 60 * 1000)) + "天前";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day} ${hour}:${minute}`;
};
</script>

<style scoped>
.notification-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--hover-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.notification-icon i {
  color: var(--sub-text-color);
  font-size: 1rem;
}

.user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.system-title {
  font-weight: 600;
  color: var(--text-color);
  font-size: 0.875rem;
}

.notification-message {
  color: var(--text-color);
  line-height: 1.7;
  word-break: break-word;
  font-size: 0.875rem;
  padding: 12px;
  background: var(--hover-bg);
  border-radius: 8px;
  margin: 8px 0;
}

.notification-message :deep(p) {
  margin: 0;
}

.notification-message :deep(a) {
  color: var(--primary-color);
  text-decoration: none;
}

.notification-message :deep(a:hover) {
  text-decoration: underline;
}

.notification-message :deep(.green) {
  color: var(--signed-color);
}

.notification-message :deep(.red) {
  color: var(--point-color);
}

.notification-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--sub-text-color);
  font-size: 0.75rem;
}

.notification-time {
  display: flex;
  align-items: center;
  gap: 4px;
}

.notification-time i {
  font-size: 0.75rem;
}
</style>
