import { defineStore } from "pinia";
import { userApi } from "../api";
import { request } from "../api";

export const useUserStore = defineStore("user", {
  state: () => ({
    userInfo: null,
    lastFetchTime: 0,
    isFetching: false,
    checkInterval: null,
  }),

  getters: {
    shouldRefetch: (state) => {
      const now = Date.now();
      return now - state.lastFetchTime > 300000; // 5分钟缓存
    },
    isLoggedIn: () => !!request.getApiKey(),
    userAvatarURL: (state) => state.userInfo?.userAvatarURL || "",
    userNickname: (state) => state.userInfo?.userNickname || "",
    userOnlineFlag: (state) => state.userInfo?.userOnlineFlag || false,
    userPoint: (state) => state.userInfo?.userPoint || 0,
    userIntro: (state) => state.userInfo?.userIntro || "",
    followingUserCount: (state) => state.userInfo?.followingUserCount || 0,
    followerCount: (state) => state.userInfo?.followerCount || 0,
  },

  actions: {
    async fetchUserInfo(force = false) {
      if (this.isFetching) {
        return this.userInfo;
      }

      if (!this.shouldRefetch && !force) {
        return this.userInfo;
      }

      try {
        this.isFetching = true;
        const res = await userApi.getCurrentUser();
        if (res.code === 0) {
          this.userInfo = res.data;
          this.lastFetchTime = Date.now();
          // 同步到本地存储
          utools.dbStorage.setItem("fishpi_user_info", res.data);
        }
        return this.userInfo;
      } catch (error) {
        console.error("获取用户信息失败:", error);
        return this.userInfo;
      } finally {
        this.isFetching = false;
      }
    },

    startChecking() {
      if (this.checkInterval) return;

      this.checkInterval = setInterval(() => {
        if (this.shouldRefetch) {
          this.fetchUserInfo();
        }
      }, 300000); // 每5分钟检查一次
    },

    stopChecking() {
      if (this.checkInterval) {
        clearInterval(this.checkInterval);
        this.checkInterval = null;
      }
    },

    async init() {
      // 先从本地存储获取
      const storedUserInfo = utools.dbStorage.getItem("fishpi_user_info");
      if (storedUserInfo) {
        this.userInfo = storedUserInfo;
      }
      // 然后从服务器获取最新数据
      await this.fetchUserInfo(true);
      this.startChecking();
    },

    logout() {
      this.userInfo = null;
      this.lastFetchTime = 0;
      this.stopChecking();
      utools.dbStorage.removeItem("fishpi_user_info");
    },

    // 更新用户信息
    updateUserInfo(newInfo) {
      this.userInfo = { ...this.userInfo, ...newInfo };
      utools.dbStorage.setItem("fishpi_user_info", this.userInfo);
    },
  },
});
