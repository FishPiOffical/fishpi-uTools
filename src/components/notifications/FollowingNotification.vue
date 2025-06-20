<template>
  <BaseNotification
    :notification="notification"
    @mark-as-read="handleMarkAsRead"
  >
    <div class="notification-header">
      <img
        v-if="!notification.deleted"
        :src="notification.thumbnailURL"
        :alt="notification.authorName"
        class="user-avatar"
      />
      <div class="user-info">
        <span class="user-name" v-if="!notification.deleted">{{
          notification.authorName
        }}</span>
        <span class="user-name deleted" v-else>未知用户</span>
        <span class="user-action">发布了新文章</span>
      </div>
    </div>
    <div
      class="notification-message"
      :class="{ 'deleted-message': notification.deleted }"
    >
      <a @click="openExternal(notification.url)" class="article-title">{{
        notification.articleTitle
      }}</a>
      <div
        class="article-tags"
        v-if="
          notification.articleTagObjs && notification.articleTagObjs.length > 0
        "
      >
        <span
          v-for="tag in notification.articleTagObjs"
          :key="tag.oId"
          class="tag"
        >
          <img :src="tag.tagIconPath" :alt="tag.tagTitle" class="tag-icon" />
          {{ tag.tagTitle }}
        </span>
      </div>
    </div>
    <div class="notification-meta">
      <div class="notification-time">
        <i class="fas fa-clock"></i>
        <span>{{ formatTime(notification.createTime) }}</span>
      </div>
      <div class="article-stats">
        <span class="comment-count">
          <i class="fas fa-comment"></i>
          {{ notification.articleCommentCount }}
        </span>
        <span class="perfect-badge" v-if="notification.articlePerfect">
          <i class="fas fa-crown"></i>
          精
        </span>
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

const openExternal = (url) => {
  utools.shellOpenExternal(url);
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

.article-title {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 500;
  display: block;
  margin-bottom: 8px;
  cursor: pointer;
}

.article-title:hover {
  text-decoration: underline;
}

.article-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.tag {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background: var(--hover-bg);
  border-radius: 4px;
  font-size: 12px;
  color: var(--primary-color);
}

.tag-icon {
  width: 16px;
  height: 16px;
  border-radius: 2px;
}

.notification-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
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

.article-stats {
  display: flex;
  align-items: center;
  gap: 12px;
}

.comment-count {
  display: flex;
  align-items: center;
  gap: 4px;
}

.comment-count i {
  font-size: 0.75rem;
}

.perfect-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--point-color);
  font-weight: 500;
}

.perfect-badge i {
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
