import { request } from "./request";

export const breezemoonApi = {
  // 获取清风明月列表
  getBreezemoons(p = 1, size = 20) {
    return request.get("/api/breezemoons", { p, size });
  },

  // 发布清风明月
  publishBreezemoon(content) {
    return request.post("/breezemoon", {
      breezemoonContent: content,
    });
  },

  // 获取用户的清风明月列表
  getUserBreezemoons(username, p = 1, size = 20) {
    return request.get(`/api/user/${username}/breezemoons`, { p, size });
  },
};
