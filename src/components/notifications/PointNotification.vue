<template>
  <BaseNotification
    :notification="notification"
    @mark-as-read="handleMarkAsRead"
  >
    <div class="notification-header">
      <div class="user-info">
        <span
          class="point-change"
          :class="{
            'point-increase': notification.point > 0,
            'point-decrease': notification.point < 0,
          }"
        >
          {{ notification.point > 0 ? "+" : "" }}{{ notification.point }}
        </span>
        <span class="point-reason" v-html="notification.description"></span>
      </div>
    </div>
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
.notification-item {
  background: var(--card-bg);
  transition: box-shadow 0.2s;
}

.notification-item:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  cursor: pointer;
}

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
  color: var(--primary-color);
  font-size: 1rem;
}

.user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.point-change {
  font-weight: 600;
  font-size: 1rem;
}

.point-increase {
  color: var(--signed-color);
}

.point-decrease {
  color: var(--point-color);
}

.point-reason {
  color: var(--sub-text-color);
  font-size: 0.875rem;
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
