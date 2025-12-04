import { defineStore } from "pinia";
import { vipApi } from "../api";

const STORAGE_KEYS = {
  list: "fishpi_vip_list",
  listTs: "fishpi_vip_list_ts",
  profile: "fishpi_vip_profile",
  profileTs: "fishpi_vip_profile_ts",
  config: "fishpi_vip_config",
};

const CACHE_TTL =  1000; // 5 minutes

const hasStorage = typeof utools !== "undefined" && utools?.dbStorage;

const storage = {
  get(key, fallback = null) {
    if (!hasStorage) return fallback;
    try {
      const value = JSON.parse(utools.dbStorage.getItem(key));
      console.log("读取"+key+"本地存储：",value);
      return value ?? fallback;
    } catch (error) {
      console.warn("读取本地存储失败:", error);
      return fallback;
    }
  },
  set(key, value) {
    if (!hasStorage) return;
    try {
      utools.dbStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn("写入本地存储失败:", error);
    }
  },
  remove(key) {
    if (!hasStorage) return;
    try {
      utools.dbStorage.removeItem(key);
    } catch (error) {
      console.warn("删除本地存储失败:", error);
    }
  },
};

export const useVipStore = defineStore("vip", {
  state: () => ({
    vipList: storage.get(STORAGE_KEYS.list, []),
    vipProfile: storage.get(STORAGE_KEYS.profile, null),
    vipConfig: storage.get(STORAGE_KEYS.config, null),
    lastVipListFetch: storage.get(STORAGE_KEYS.listTs, 0),
    lastVipProfileFetch: storage.get(STORAGE_KEYS.profileTs, 0),
    isLoadingList: false,
    isLoadingProfile: false,
    isSavingConfig: false,
  }),

  getters: {
    isVip: (state) => !!state.vipProfile,
    vipPlan: (state) => state.vipProfile?.plan || "",
    vipExpireAt: (state) => state.vipProfile?.expireAt || "",
    nicknameStyle: (state) => ({
      color: state.vipConfig?.color || "#ffffff",
      effect: state.vipConfig?.effect || "default",
      bold: !!state.vipConfig?.bold,
      underline: !!state.vipConfig?.underline,
      text: state.vipConfig?.text || "",
    }),
    vipListMap: (state) =>
      state.vipList.reduce((acc, item) => {
        if (item?.id) {
          acc[item.id] = item;
        }
        return acc;
      }, {}),
  },

  actions: {
    persistVipList() {
      storage.set(STORAGE_KEYS.list, this.vipList);
      storage.set(STORAGE_KEYS.listTs, this.lastVipListFetch);
    },

    persistVipProfile() {
      storage.set(STORAGE_KEYS.profile, this.vipProfile);
      storage.set(STORAGE_KEYS.profileTs, this.lastVipProfileFetch);
    },

    persistVipConfig() {
      storage.set(STORAGE_KEYS.config, this.vipConfig);
    },

    shouldUseCache(timestamp) {
      if (!timestamp) return false;
      return Date.now() - timestamp < CACHE_TTL;
    },

    async fetchVipList(force = false) {
      // if (this.isLoadingList) return this.vipList;
      // if (!force && this.vipList.length && this.shouldUseCache(this.lastVipListFetch)) {
      //   return this.vipList;
      // }

      try {
        this.isLoadingList = true;
        const res = await vipApi.getVipList();
        if (res.code === 0) {
          this.vipList = res.data || [];
          this.lastVipListFetch = Date.now();
          this.persistVipList();
        } else {
          console.error("获取VIP列表失败:", res.message || res);
        }
      } catch (error) {
        console.error("获取VIP列表异常:", error);
      } finally {
        this.isLoadingList = false;
      }

      return this.vipList;
    },

    async  fetchVipProfile(force = false) {
      // if (this.isLoadingProfile) return this.vipProfile;
      // if (!force && this.shouldUseCache(this.lastVipProfileFetch) && this.vipProfile) {
      //   return this.vipProfile;
      // }

      try {
        this.isLoadingProfile = true;
        const res = await vipApi.getVipUser();
        if (res.code === 0) {
          this.vipProfile = res.data?.profile || res.data || null;
          this.vipConfig = res.data?.config || this.vipConfig;
          this.lastVipProfileFetch = Date.now();
          this.persistVipProfile();
          if (this.vipConfig) {
            this.persistVipConfig();
          }
        } else {
          console.error("获取VIP信息失败:", res.message || res);
        }
      } catch (error) {
        console.error("获取VIP信息异常:", error);
      } finally {
        this.isLoadingProfile = false;
      }

      return this.vipProfile;
    },
    async  fetchVipUserInfo(userId) {
      try {
        const res = await vipApi.getVipUserInfo(userId);
        if (res.code === 0) {
          return res.data
        } else {
          console.error("获取单用户VIP信息失败:", res.message || res);
          return res.message
        }
      } catch (error) {
        console.error("获取单用户VIP信息异常:", error);
        return error
      } 
    },

    async refresh(force = false) {
      await Promise.all([this.fetchVipList(force), this.fetchVipProfile(force)]);
    },

    setVipConfig(config) {
      this.vipConfig = { ...(config || {}) };
      this.persistVipConfig();
    },

    async updateVipConfig(config) {
      if (this.isSavingConfig) return;
      try {
        this.isSavingConfig = true;
        const res = await vipApi.upVipUserConfig(config);
        if (res.code === 0) {
          this.setVipConfig(config);
        } else {
          console.error("更新VIP配置失败:", res.message || res);
        }
      } catch (error) {
        console.error("更新VIP配置异常:", error);
      } finally {
        this.isSavingConfig = false;
      }
    },

    clear() {
      this.vipList = [];
      this.vipProfile = null;
      this.vipConfig = null;
      this.lastVipListFetch = 0;
      this.lastVipProfileFetch = 0;
      storage.remove(STORAGE_KEYS.list);
      storage.remove(STORAGE_KEYS.listTs);
      storage.remove(STORAGE_KEYS.profile);
      storage.remove(STORAGE_KEYS.profileTs);
      storage.remove(STORAGE_KEYS.config);
    },
  },
});

export const VipStore = useVipStore;
