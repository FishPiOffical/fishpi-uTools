import { defineStore } from "pinia";

export const useChatroomStore = defineStore("chatroom", {
  state: () => ({
    // 在线用户缓存
    onlineUsers: [],
    // 当前话题缓存
    currentTopic: "",
    // 最后更新时间
    lastUpdateTime: 0,
    // 缓存有效期（5分钟）
    cacheExpiry: 5 * 60 * 1000,
    // 是否正在加载
    isLoading: false,
  }),

  getters: {
    // 检查缓存是否有效
    isCacheValid: (state) => {
      return Date.now() - state.lastUpdateTime < state.cacheExpiry;
    },
    
    // 获取缓存的在线用户
    cachedOnlineUsers: (state) => {
      return state.onlineUsers;
    },
    
    // 获取缓存的话题
    cachedTopic: (state) => {
      return state.currentTopic;
    },
  },

  actions: {
    // 从缓存加载数据
    loadFromCache() {
      try {
        const cached = utools.dbStorage.getItem("fishpi_chatroom_cache");
        if (cached && cached.timestamp) {
          const now = Date.now();
          if (now - cached.timestamp < this.cacheExpiry) {
            this.onlineUsers = cached.onlineUsers || [];
            this.currentTopic = cached.currentTopic || "";
            this.lastUpdateTime = cached.timestamp;
            console.log("从缓存加载聊天室数据成功");
            return true;
          }
        }
      } catch (error) {
        console.error("加载缓存失败:", error);
      }
      return false;
    },

    // 保存数据到缓存
    saveToCache() {
      try {
        const cacheData = {
          onlineUsers: this.onlineUsers,
          currentTopic: this.currentTopic,
          timestamp: Date.now(),
        };
        utools.dbStorage.setItem("fishpi_chatroom_cache", cacheData);
        console.log("聊天室数据已缓存");
      } catch (error) {
        console.error("保存缓存失败:", error);
      }
    },

    // 更新在线用户
    updateOnlineUsers(users) {
      this.onlineUsers = users || [];
      this.lastUpdateTime = Date.now();
      this.saveToCache();
    },

    // 更新话题
    updateTopic(topic) {
      this.currentTopic = topic || "";
      this.lastUpdateTime = Date.now();
      this.saveToCache();
    },

    // 批量更新数据
    updateData(data) {
      if (data.users !== undefined) {
        this.onlineUsers = data.users || [];
      }
      if (data.discussing !== undefined) {
        this.currentTopic = data.discussing || "";
      }
      this.lastUpdateTime = Date.now();
      this.saveToCache();
    },

    // 清除缓存
    clearCache() {
      this.onlineUsers = [];
      this.currentTopic = "";
      this.lastUpdateTime = 0;
      try {
        utools.dbStorage.removeItem("fishpi_chatroom_cache");
      } catch (error) {
        console.error("清除缓存失败:", error);
      }
    },

    // 初始化store
    init() {
      // 尝试从缓存加载数据
      this.loadFromCache();
    },
  },
}); 