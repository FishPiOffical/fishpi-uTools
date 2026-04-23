import { request } from "./request";

let cachedAllGroupId = null;

export const emojiApi = {
  // 表情包 V2：获取分组列表
  getGroups() {
    // GET /api/emoji/groups （apiKey 会被 request 拦截器自动注入 params）
    return request.get("/api/emoji/groups");
  },

  // 表情包 V2：获取分组内表情
  getGroupEmojis(groupId) {
    return request.get("/api/emoji/group/emojis", { groupId });
  },

  // 表情包 V2：上传 URL 到“全部”分组（服务端会自动处理）
  uploadUrl(url) {
    return request.post("/api/emoji/upload", { url });
  },

  // 表情包 V2：分组添加 URL 表情（会自动同步到“全部”）
  addUrlEmoji(groupId, url, { sort = 0, name } = {}) {
    return request.post("/api/emoji/group/add-url-emoji", {
      groupId,
      url,
      sort,
      ...(name ? { name } : {}),
    });
  },

  // 表情包 V2：从分组移除表情
  removeEmoji(groupId, emojiId) {
    return request.post("/api/emoji/group/remove-emoji", { groupId, emojiId });
  },

  async getAllGroupId(force = false) {
    if (!force && cachedAllGroupId) return cachedAllGroupId;
    const res = await this.getGroups();
    const groups = res?.data || res?.data?.groups || res?.data?.list || res?.data || [];
    const arr = Array.isArray(groups) ? groups : [];
    const all =
      arr.find((g) => g?.name === "全部") ||
      arr.find((g) => g?.name?.toLowerCase?.() === "all") ||
      arr[0];
    cachedAllGroupId = all?.oId || all?.groupId || all?.id || "";
    return cachedAllGroupId;
  },
};

