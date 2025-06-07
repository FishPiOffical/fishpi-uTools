import { defineStore } from "pinia";
import { userApi } from "../api";

export const useLivenessStore = defineStore("liveness", {
  state: () => ({
    liveness: 0,
    checkInterval: null,
  }),

  actions: {
    async fetchLiveness() {
      try {
        const res = await userApi.getLiveness();
        if (res) {
          this.liveness = res.liveness;
          console.log("更新活跃度成功:", this.liveness);
        }
      } catch (error) {
        console.error("获取活跃度失败:", error);
      }
    },

    startChecking() {
      // 先停止之前的定时器
      this.stopChecking();

      // 立即获取一次
      this.fetchLiveness();

      // 设置定时器，随机30-60秒后再次获取
      const scheduleNextFetch = () => {
        const delay = Math.floor(Math.random() * (60000 - 30000) + 30000);
        this.checkInterval = setTimeout(async () => {
          await this.fetchLiveness();
          scheduleNextFetch();
        }, delay);
      };

      scheduleNextFetch();
    },

    stopChecking() {
      if (this.checkInterval) {
        clearTimeout(this.checkInterval);
        this.checkInterval = null;
      }
    },

    async init() {
      // 先停止之前的定时器
      this.stopChecking();
      // 重置活跃度
      this.liveness = 0;
      // 重新开始检查
      this.startChecking();
    },

    reset() {
      this.liveness = 0;
      this.stopChecking();
    },
  },
});
