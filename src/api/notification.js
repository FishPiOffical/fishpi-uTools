import { request } from "./request";

export const notificationApi = {
  // 获取通知列表
  getNotifications(params) {
    return request.get("/api/getNotifications", params);
  },

  // 将所有通知标记为已读
  markAllAsRead() {
    return request.get("/notifications/all-read");
  },

  // 将指定类型的通知标记为已读
  markTypeAsRead(type) {
    return request.get(`/notifications/make-read/${type}`);
  },

  // 获取未读通知数量
  getUnreadCount() {
    return request.get("/notifications/unread/count");
  },
};
