import { defineStore } from "pinia";
import { userApi } from "../api";

export const useLivenessStore = defineStore("liveness", {
  state: () => ({
    liveness: utools.dbStorage.getItem("liveness") ?? 0,
    checkInterval: null, // 定时器
  }),
  actions: {
    async fetchLiveness() {
      console.log("开始获取活跃度...");
      try {
        const res = await userApi.getLiveness();
        if (res) {
          this.liveness = res.liveness;
          console.log("更新活跃度成功:", this.liveness);
          utools.dbStorage.setItem("liveness", res.liveness);
        }else{
          console.log("获取活跃度失败:", res);
        }
      } catch (error) {
        console.error("获取活跃度失败:", error);
      } finally {
        this.liveness = utools.dbStorage.getItem("liveness") ?? 0;
      }
    },

    startChecking() {
      // 先停止之前的定时器
      this.stopChecking();

      // 立即获取一次
      this.fetchLiveness();

      // 设置定时器，每10分钟获取一次
      const scheduleNextFetch = () => {
        const delay = 10 * 60 * 1000; // 10分钟 = 600000毫秒
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
      this.liveness = utools.dbStorage.getItem("liveness") ?? 0;
      // 重新开始检查
      this.startChecking();
    },

    reset() {
      this.liveness = 0;
      this.stopChecking();
    },
  },
});
