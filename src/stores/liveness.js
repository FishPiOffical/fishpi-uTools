import { defineStore } from "pinia";
import { userApi } from "../api";

export const useLivenessStore = defineStore("liveness", {
  state: () => ({
    liveness: 0,
    lastFetchTime: 0,
    isFetching: false,
    checkInterval: null,
    error: null,
  }),

  getters: {
    shouldRefetch: (state) => {
      const now = Date.now();
      return now - state.lastFetchTime > 45000; // 45秒缓存
    },
  },

  actions: {
    async fetchLiveness(force = false) {
      console.log("开始获取活跃度, force:", force);
      console.log("当前状态:", {
        liveness: this.liveness,
        lastFetchTime: this.lastFetchTime,
        isFetching: this.isFetching,
        shouldRefetch: this.shouldRefetch,
        error: this.error,
      });

      // 如果正在获取中，直接返回当前值
      if (this.isFetching) {
        console.log("正在获取中，返回当前值");
        return this.liveness;
      }

      // 如果数据未过期且不强制刷新，直接返回缓存数据
      if (!this.shouldRefetch && !force) {
        console.log("数据未过期，返回缓存值");
        return this.liveness;
      }

      try {
        this.isFetching = true;
        this.error = null;
        console.log("发送活跃度请求");
        const res = await userApi.getLiveness();
        console.log("活跃度响应:", res);

        if (res) {
          this.liveness = res.liveness;
          this.lastFetchTime = Date.now();
          console.log("更新活跃度成功:", this.liveness);
        } else {
          console.error("获取活跃度失败:", res);
          this.error = res.msg || "获取活跃度失败";
        }
        return this.liveness;
      } catch (error) {
        console.error("获取活跃度失败:", error);
        this.error = error.message || "获取活跃度失败";
        return this.liveness;
      } finally {
        this.isFetching = false;
      }
    },

    async init() {
      console.log("初始化活跃度状态");
      await this.fetchLiveness(true);
      this.startChecking();
    },

    startChecking() {
      if (this.checkInterval) return;

      console.log("开始定时检查活跃度");
      this.checkInterval = setInterval(() => {
        if (this.shouldRefetch) {
          console.log("定时检查：需要更新活跃度");
          this.fetchLiveness();
        }
      }, 45000);
    },

    stopChecking() {
      if (this.checkInterval) {
        console.log("停止定时检查活跃度");
        clearInterval(this.checkInterval);
        this.checkInterval = null;
      }
    },

    reset() {
      this.liveness = 0;
      this.lastFetchTime = 0;
      this.error = null;
      this.stopChecking();
    },
  },
});
