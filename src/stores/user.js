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
      return now - state.lastFetchTime > 120000; // 2分钟缓存
    },
    isLoggedIn: (state) => {
      return !!state.userInfo && !!request.getApiKey();
    },
    userAvatarURL: (state) => state.userInfo?.userAvatarURL || "",
    userName: (state) => state.userInfo?.userName || "",
    userNickname: (state) => state.userInfo?.userNickname || "",
    userOnlineFlag: (state) => state.userInfo?.userOnlineFlag || false,
    userOnlineMinute: (state) => {
      console.log("当前用户信息:", state.userInfo);
      return state.userInfo?.onlineMinute || 0;
    },
    userRole: (state) => state.userInfo?.userRole || "",
    userNo: (state) => state.userInfo?.userNo || "",
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

          // 同步更新账号列表中的用户信息
          const accounts = utools.dbStorage.getItem("fishpi_accounts") || [];
          const currentUserName = res.data.userName;
          const accountIndex = accounts.findIndex(
            (account) => account.userName === currentUserName
          );

          if (accountIndex !== -1) {
            // 更新账号列表中的用户信息，保留 apiKey
            const apiKey = accounts[accountIndex].apiKey;
            accounts[accountIndex] = {
              ...res.data,
              apiKey: apiKey,
            };
            utools.dbStorage.setItem("fishpi_accounts", accounts);
            console.log("已同步更新账号列表中的用户信息");
          }
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
      }, 120000); // 每2分钟检查一次
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
      const apiKey = request.getApiKey();

      if (storedUserInfo && apiKey) {
        this.userInfo = storedUserInfo;
        this.lastFetchTime = Date.now();
        this.startChecking();
      } else {
        // 如果没有用户信息或 API Key，清除状态
        this.logout();
      }
    },

    logout() {
      this.userInfo = null;
      this.lastFetchTime = 0;
      this.stopChecking();
      request.clearApiKey();
      utools.dbStorage.removeItem("fishpi_user_info");
    },

    // 更新用户信息
    updateUserInfo(newInfo) {
      this.userInfo = { ...this.userInfo, ...newInfo };
      utools.dbStorage.setItem("fishpi_user_info", this.userInfo);

      // 同步更新账号列表中的用户信息
      const accounts = utools.dbStorage.getItem("fishpi_accounts") || [];
      const currentUserName = this.userInfo.userName;
      const accountIndex = accounts.findIndex(
        (account) => account.userName === currentUserName
      );

      if (accountIndex !== -1) {
        // 更新账号列表中的用户信息，保留 apiKey
        const apiKey = accounts[accountIndex].apiKey;
        accounts[accountIndex] = {
          ...this.userInfo,
          apiKey: apiKey,
        };
        utools.dbStorage.setItem("fishpi_accounts", accounts);
        console.log("已同步更新账号列表中的用户信息");
      }
    },

    // 设置用户信息（用于切换账号）
    setUserInfo(userInfo) {
      if (!userInfo || !userInfo.apiKey) {
        console.error("设置用户信息失败：缺少必要信息");
        return;
      }

      // 先清除当前状态
      this.stopChecking();

      // 设置新的 API Key
      request.setApiKey(userInfo.apiKey);

      // 更新用户信息，只保留需要的数据
      const cleanUserInfo = {
        userName: userInfo.userName,
        userNickname: userInfo.userNickname,
        userAvatarURL: userInfo.userAvatarURL,
        userOnlineFlag: userInfo.userOnlineFlag,
        onlineMinute: userInfo.onlineMinute || 0,
        userRole: userInfo.userRole,
        userNo: userInfo.userNo,
        userPoint: userInfo.userPoint,
        userIntro: userInfo.userIntro,
        followingUserCount: userInfo.followingUserCount,
        followerCount: userInfo.followerCount,
        apiKey: userInfo.apiKey,
      };

      console.log("保存的用户信息:", cleanUserInfo);

      this.userInfo = cleanUserInfo;
      this.lastFetchTime = Date.now();

      // 保存到本地存储
      utools.dbStorage.setItem("fishpi_user_info", cleanUserInfo);

      // 重新开始检查
      this.startChecking();
    },
  },
});
