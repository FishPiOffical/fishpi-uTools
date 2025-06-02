import { defineStore } from "pinia";
import { notificationApi } from "../api";

export const useNotificationStore = defineStore("notification", {
  state: () => ({
    unreadCount: 0,
    notifications: [],
    lastFetchTime: 0,
    isFetching: false,
    checkInterval: null,
    page: 1,
    pageSize: 20,
    hasMore: true,
    isLoading: false,
  }),

  getters: {
    shouldRefetch: (state) => {
      const now = Date.now();
      return now - state.lastFetchTime > 60000; // 1分钟缓存
    },
    hasUnread: (state) => state.unreadCount > 0,
  },

  actions: {
    async fetchUnreadCount(force = false) {
      if (this.isFetching) {
        return this.unreadCount;
      }

      if (!this.shouldRefetch && !force) {
        return this.unreadCount;
      }

      try {
        this.isFetching = true;
        const res = await notificationApi.getUnreadCount();
        if (res.code === 0) {
          this.unreadCount = res.unreadNotificationCnt;
          this.lastFetchTime = Date.now();
        }
        return this.unreadCount;
      } catch (error) {
        console.error("获取未读通知数失败:", error);
        return this.unreadCount;
      } finally {
        this.isFetching = false;
      }
    },

    async fetchNotifications(force = false) {
      if (this.isLoading) return;

      try {
        this.isLoading = true;
        const res = await notificationApi.getNotifications(
          this.page,
          this.pageSize
        );
        if (res.code === 0) {
          if (force) {
            this.notifications = res.data;
          } else {
            this.notifications = [...this.notifications, ...res.data];
          }
          this.hasMore = res.data.length === this.pageSize;
          if (this.hasMore) {
            this.page++;
          }
        }
        return this.notifications;
      } catch (error) {
        console.error("获取通知列表失败:", error);
        return this.notifications;
      } finally {
        this.isLoading = false;
      }
    },

    async markAsRead(notificationId) {
      try {
        const res = await notificationApi.markAsRead(notificationId);
        if (res.code === 0) {
          // 更新未读数量
          await this.fetchUnreadCount(true);
          // 更新通知状态
          const index = this.notifications.findIndex(
            (n) => n.id === notificationId
          );
          if (index !== -1) {
            this.notifications[index].isRead = true;
          }
        }
      } catch (error) {
        console.error("标记通知为已读失败:", error);
      }
    },

    async markAllAsRead() {
      try {
        const res = await notificationApi.markAllAsRead();
        if (res.code === 0) {
          this.unreadCount = 0;
          // 更新所有通知状态
          this.notifications = this.notifications.map((n) => ({
            ...n,
            isRead: true,
          }));
        }
      } catch (error) {
        console.error("标记所有通知为已读失败:", error);
      }
    },

    resetNotifications() {
      this.notifications = [];
      this.page = 1;
      this.hasMore = true;
    },

    startChecking() {
      if (this.checkInterval) return;

      this.checkInterval = setInterval(() => {
        if (this.shouldRefetch) {
          this.fetchUnreadCount();
        }
      }, 30000); // 每30秒检查一次
    },

    stopChecking() {
      if (this.checkInterval) {
        clearInterval(this.checkInterval);
        this.checkInterval = null;
      }
    },

    async init() {
      await this.fetchUnreadCount(true);
      this.startChecking();
    },
  },
});
