<template>
  <BaseNotification
    :notification="notification"
    @mark-as-read="handleMarkAsRead"
  >
    <div class="notification-header">
      <img
        v-if="!notification.deleted"
        :src="notification.userAvatarURL || notification.thumbnailURL"
        :alt="notification.userName"
        class="user-avatar"
      />
      <div class="user-info">
        <span class="user-name" v-if="!notification.deleted">{{
          notification.userName
        }}</span>
        <span class="user-name deleted" v-else>未知用户</span>
        <span
          class="user-action"
          v-if="!notification.deleted && notification.dataType === 38"
          >在聊天室@了你</span
        >
        <span
          class="user-action"
          v-else-if="!notification.deleted && notification.dataType === 27"
          >赞同了你的帖子</span
        >
        <span
          class="user-action"
          v-else-if="!notification.deleted && notification.dataType === 25"
          >赞同了你的回帖</span
        >
      </div>
    </div>
    <div
      class="notification-message"
      :class="{ 'deleted-message': notification.deleted }"
      v-if="notification.dataType === 38 && !notification.deleted"
      v-html="notification.content"
    ></div>
    <div
      class="notification-message"
      :class="{ 'deleted-message': notification.deleted }"
      v-else
      v-html="
        notification.deleted ? '相关数据已被删除' : notification.description
      "
    ></div>
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
.notification-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid var(--avatar-border);
  flex-shrink: 0;
  background: var(--card-bg);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 1rem;
}

.user-name {
  color: var(--text-color);
}

.user-action {
  color: var(--sub-text-color);
  font-weight: 400;
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

.notification-message :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 8px 0;
}

.notification-message :deep(a) {
  color: var(--primary-color);
  text-decoration: none;
}

.notification-message :deep(a:hover) {
  text-decoration: underline;
}

.notification-message :deep(.name-at) {
  color: var(--primary-color);
  font-weight: 500;
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

.deleted {
  color: var(--sub-text-color);
  font-style: italic;
}

.deleted-message {
  color: var(--sub-text-color);
  font-style: italic;
  background: var(--card-bg);
}
</style>
