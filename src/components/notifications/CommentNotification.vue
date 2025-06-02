<template>
  <BaseNotification
    :notification="notification"
    @mark-as-read="handleMarkAsRead"
  >
    <div class="notification-header">
      <img
        :src="notification.commentAuthorThumbnailURL"
        :alt="notification.commentAuthorName"
        class="user-avatar"
      />
      <div class="user-info">
        <span class="user-name">{{ notification.commentAuthorName }}</span>
        <span
          class="user-action ellipsis"
          :title="'评论了你的文章' + notification.commentArticleTitle"
        >
          评论了你的文章《{{ notification.commentArticleTitle }}》
        </span>
      </div>
    </div>
    <div
      class="notification-message"
      v-html="notification.commentContent"
    ></div>
    <div class="notification-meta">
      <div class="notification-time">
        <i class="fas fa-clock"></i>
        <span>{{ formatTime(notification.commentCreateTime) }}</span>
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
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 4px;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid #fff;
  flex-shrink: 0;
  background: #f8fafc;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 1rem;
  min-width: 0;
}

.user-name {
  font-weight: 700;
  color: #a0aec0;
  line-height: 1.2;
}

.user-action {
  color: #64748b;
  font-weight: 400;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 220px;
  display: block;
}

.ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 220px;
  display: block;
}

.notification-item {
  background: #fff;
  transition: box-shadow 0.2s;
}

.notification-item:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  cursor: pointer;
}

.notification-message {
  color: #1a1f36;
  line-height: 1.7;
  word-break: break-word;
  font-size: 0.875rem;
  padding: 12px;
  background: rgba(0, 0, 0, 0.02);
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
  color: #3b82f6;
  text-decoration: none;
}

.notification-message :deep(a:hover) {
  text-decoration: underline;
}

.notification-message :deep(.name-at) {
  color: #3b82f6;
  font-weight: 500;
}

.notification-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #64748b;
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
