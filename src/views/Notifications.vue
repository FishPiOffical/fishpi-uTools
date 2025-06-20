<template>
  <div class="notifications-container">
    <div class="notifications-header">
      <h2>通知中心</h2>
      <button
        v-if="hasUnreadNotifications"
        class="mark-all-read-btn"
        @click="markAllAsRead"
      >
        <i class="fas fa-check-double"></i>
        全部标为已读
      </button>
    </div>
    <div class="notification-tabs">
      <div
        v-for="tab in tabs"
        :key="tab.type"
        :class="['tab-item', { active: currentTab === tab.type }]"
        @click="switchTab(tab.type)"
      >
        {{ tab.name }}
        <span v-if="getUnreadCount(tab.type)" class="unread-badge">
          {{ getUnreadCount(tab.type) }}
        </span>
      </div>
    </div>

    <div class="notification-list" ref="notificationListRef">
      <div v-if="loading && notifications.length === 0" class="loading">
        <div class="loading-spinner"></div>
        <span>加载中...</span>
      </div>
      <div v-else-if="notifications.length === 0" class="empty-tip">
        <i class="fas fa-bell-slash"></i>
        <span>暂无通知</span>
      </div>
      <div v-else class="notification-items">
        <component
          :is="currentNotificationComponent"
          v-for="item in notifications"
          :key="item.dataId"
          :notification="item"
          @mark-as-read="markAsRead"
        />
      </div>
      <div
        v-if="loading && notifications.length > 0"
        class="loading-more-spinner"
      >
        <div class="loading-spinner"></div>
      </div>
      <div v-if="!hasMore && notifications.length > 0" class="end-tip">
        没有更多了
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted } from "vue";
import { notificationApi } from "../api";
import { useNotificationStore } from "../stores/notification";
import CommentNotification from "../components/notifications/CommentNotification.vue";
import PointNotification from "../components/notifications/PointNotification.vue";
import AtNotification from "../components/notifications/AtNotification.vue";
import SystemNotification from "../components/notifications/SystemNotification.vue";
import ReplyNotification from "../components/notifications/ReplyNotification.vue";
import FollowingNotification from "../components/notifications/FollowingNotification.vue";

const notificationStore = useNotificationStore();

const tabs = [
  { type: "point", name: "积分" },
  { type: "commented", name: "评论" },
  { type: "reply", name: "回复" },
  { type: "at", name: "@我" },
  { type: "following", name: "关注" },
  { type: "broadcast", name: "同城" },
  { type: "sys-announce", name: "系统" },
];

const currentTab = ref("point");
const notifications = ref([]);
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const hasMore = ref(true);
const stats = ref({
  unreadNotificationCnt: 0,
  unreadReplyNotificationCnt: 0,
  unreadAtNotificationCnt: 0,
  unreadBroadcastNotificationCnt: 0,
  unreadSysAnnounceNotificationCnt: 0,
  unreadNewFollowerNotificationCnt: 0,
  unreadFollowingNotificationCnt: 0,
  unreadCommentedNotificationCnt: 0,
  unreadPointNotificationCnt: 0,
});

const totalPages = computed(() => Math.ceil(total.value / pageSize.value));

const getUnreadCount = (type) => {
  if (!stats.value) return 0;

  switch (type) {
    case "point":
      return stats.value.unreadPointNotificationCnt || 0;
    case "reply":
      return stats.value.unreadReplyNotificationCnt || 0;
    case "at":
      return stats.value.unreadAtNotificationCnt || 0;
    case "broadcast":
      return stats.value.unreadBroadcastNotificationCnt || 0;
    case "sys-announce":
      return stats.value.unreadSysAnnounceNotificationCnt || 0;
    case "following":
      return stats.value.unreadFollowingNotificationCnt || 0;
    case "commented":
      return stats.value.unreadCommentedNotificationCnt || 0;
    default:
      return 0;
  }
};

const fetchNotifications = async () => {
  loading.value = true;
  try {
    const params = {
      p: currentPage.value,
      size: pageSize.value,
      type: currentTab.value,
    };

    const res = await notificationApi.getNotifications(params);
    if (res.code === 0) {
      if (currentPage.value === 1) {
        notifications.value = res.data || [];
      } else {
        notifications.value = [...notifications.value, ...(res.data || [])];
      }
      hasMore.value = (res.data || []).length === pageSize.value;
      total.value = res.data?.length || 0;
    } else {
      notifications.value = [];
      total.value = 0;
      hasMore.value = false;
    }
  } catch (error) {
    console.error("获取通知列表失败:", error);
    notifications.value = [];
    total.value = 0;
    hasMore.value = false;
  } finally {
    loading.value = false;
  }
};

const fetchStats = async () => {
  try {
    const res = await notificationApi.getUnreadCount();
    console.log("获取到的通知统计:", res);
    if (res.code === 0 && res) {
      stats.value = {
        ...stats.value,
        ...res,
      };
      console.log("更新后的stats:", stats.value);
    }
  } catch (error) {
    console.error("获取通知统计失败:", error);
  }
};

const switchTab = (type) => {
  currentTab.value = type;
  currentPage.value = 1;
  notifications.value = [];
  fetchNotifications();
};

const markAsRead = async (oId) => {
  try {
    const res = await notificationApi.markTypeAsRead(currentTab.value);
    if (res.code === 0) {
      notifications.value = notifications.value.map((item) => ({
        ...item,
        hasRead: true,
      }));
      await fetchStats();
      await notificationStore.init();
    }
  } catch (error) {
    console.error("标记已读失败:", error);
  }
};

const changePage = (page) => {
  currentPage.value = page;
  fetchNotifications();
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

const markAllAsRead = async () => {
  try {
    const res = await notificationApi.markAllAsRead();
    if (res.code === 0) {
      notifications.value = notifications.value.map((item) => ({
        ...item,
        hasRead: true,
      }));
      await fetchStats();
      await notificationStore.init();
    }
  } catch (error) {
    console.error("标记全部已读失败:", error);
  }
};

const currentNotificationComponent = computed(() => {
  switch (currentTab.value) {
    case "point":
      return PointNotification;
    case "commented":
      return CommentNotification;
    case "reply":
      return ReplyNotification;
    case "at":
      return AtNotification;
    case "sys-announce":
      return SystemNotification;
    case "following":
      return FollowingNotification;
    default:
      return CommentNotification;
  }
});

const hasUnreadNotifications = computed(() => {
  return (
    stats.value.unreadNotificationCnt > 0 ||
    stats.value.unreadReplyNotificationCnt > 0 ||
    stats.value.unreadAtNotificationCnt > 0 ||
    stats.value.unreadBroadcastNotificationCnt > 0 ||
    stats.value.unreadSysAnnounceNotificationCnt > 0 ||
    stats.value.unreadNewFollowerNotificationCnt > 0 ||
    stats.value.unreadFollowingNotificationCnt > 0 ||
    stats.value.unreadCommentedNotificationCnt > 0 ||
    stats.value.unreadPointNotificationCnt > 0
  );
});

const switchToUnreadTab = () => {
  // 获取所有有未读通知的类别
  const unreadTabs = tabs.filter((tab) => getUnreadCount(tab.type) > 0);

  if (unreadTabs.length > 0) {
    // 如果有未读通知，切换到第一个有未读通知的类别
    switchTab(unreadTabs[0].type);
  } else {
    // 如果没有未读通知，切换到第一个类别
    switchTab(tabs[0].type);
  }
};

onMounted(async () => {
  // 先获取统计数据
  await fetchStats();
  // 切换到有未读通知的类别
  switchToUnreadTab();
  // 然后获取通知列表
  await fetchNotifications();

  // 监听刷新通知事件
  window.addEventListener("refresh-notifications", () => {
    fetchNotifications();
    fetchStats();
    // 切换到有未读通知的类别
    switchToUnreadTab();
  });

  // 监听账号切换事件
  window.addEventListener("fishpi:account-switched", async () => {
    // 重置所有状态
    notifications.value = [];
    currentPage.value = 1;
    hasMore.value = true;
    stats.value = {
      unreadNotificationCnt: 0,
      unreadReplyNotificationCnt: 0,
      unreadAtNotificationCnt: 0,
      unreadBroadcastNotificationCnt: 0,
      unreadSysAnnounceNotificationCnt: 0,
      unreadNewFollowerNotificationCnt: 0,
      unreadFollowingNotificationCnt: 0,
      unreadCommentedNotificationCnt: 0,
      unreadPointNotificationCnt: 0,
    };
    // 重新加载数据
    await fetchStats();
    switchToUnreadTab();
    await fetchNotifications();
  });
});

// 添加 onUnmounted 钩子来清理事件监听器
onUnmounted(() => {
  window.removeEventListener("refresh-notifications", () => {
    fetchNotifications();
    fetchStats();
    switchToUnreadTab();
  });

  window.removeEventListener("fishpi:account-switched", async () => {
    notifications.value = [];
    currentPage.value = 1;
    hasMore.value = true;
    stats.value = {
      unreadNotificationCnt: 0,
      unreadReplyNotificationCnt: 0,
      unreadAtNotificationCnt: 0,
      unreadBroadcastNotificationCnt: 0,
      unreadSysAnnounceNotificationCnt: 0,
      unreadNewFollowerNotificationCnt: 0,
      unreadFollowingNotificationCnt: 0,
      unreadCommentedNotificationCnt: 0,
      unreadPointNotificationCnt: 0,
    };
    await fetchStats();
    switchToUnreadTab();
    await fetchNotifications();
  });
});
</script>

<style scoped>
.notifications-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px;
  background-color: var(--background-color);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.notifications-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.notifications-header h2 {
  margin: 0;
  color: var(--text-color);
  font-size: 24px;
  font-weight: 600;
}

.notification-stats {
  display: flex;
  gap: 20px;
  margin-top: 10px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: var(--hover-bg);
  border-radius: 8px;
  transition: all 0.3s;
}

.stat-item:hover {
  background-color: var(--border-color);
}

.stat-item i {
  color: var(--primary-color);
  font-size: 14px;
}

.stat-item .label {
  color: var(--sub-text-color);
  font-size: 13px;
}

.stat-item .value {
  color: var(--point-color);
  font-weight: bold;
  font-size: 13px;
}

.notification-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 10px;
}

.tab-item {
  padding: 8px 16px;
  cursor: pointer;
  position: relative;
  border-radius: 4px;
  font-size: 14px;
  color: var(--sub-text-color);
  transition: all 0.3s;
}

.tab-item:hover {
  background-color: var(--hover-bg);
  color: var(--primary-color);
}

.tab-item.active {
  background-color: var(--hover-bg);
  color: var(--primary-color);
  font-weight: 500;
}

.unread-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background-color: var(--badge-bg);
  color: var(--badge-text);
  border-radius: 10px;
  padding: 2px 8px;
  font-size: 12px;
  min-width: 18px;
  text-align: center;
}

.notification-list {
  flex: 1;
  overflow-y: auto;
  padding-right: 10px;
}

.notification-items {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.loading,
.empty-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: var(--sub-text-color);
}

.loading i,
.empty-tip i {
  font-size: 40px;
  margin-bottom: 10px;
  color: var(--border-color);
}

.loading-spinner {
  width: 30px;
  height: 30px;
  border: 3px solid var(--hover-bg);
  border-top: 3px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

.loading-more-spinner {
  display: flex;
  justify-content: center;
  padding: 20px;
}

.loading-more-spinner .loading-spinner {
  margin-bottom: 0;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.end-tip {
  text-align: center;
  padding: 20px;
  color: var(--sub-text-color);
  font-size: 14px;
}

.mark-all-read-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background-color: var(--hover-bg);
  color: var(--primary-color);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.mark-all-read-btn:hover {
  background-color: var(--border-color);
}

.mark-all-read-btn i {
  font-size: 14px;
}
</style>
