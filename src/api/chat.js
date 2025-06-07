import { request } from "./request";

export const chatApi = {
  // 获取聊天节点
  getChatNode() {
    return request.get("/chat-room/node/get");
  },

  // 获取聊天消息
  getChatMessages(page = 1) {
    return request.get("/chat-room/more", { page });
  },

  // 获取默认表情
  getDefaultEmotions() {
    return request.get("/users/emotions");
  },

  // 获取表情包
  getEmotionPack(gameId) {
    return request.post("/api/cloud/get", { gameId });
  },

  // 发送消息
  sendMessage(content) {
    return request.post("/chat-room/send", {
      content,
      client: import.meta.env.VITE_CLIENT,
    });
  },

  // 撤回消息
  revokeMessage(oId) {
    return request.delete(`/chat-room/revoke/${oId}`);
  },

  // 打开红包
  openRedPacket(oId, gesture) {
    return request.post("/chat-room/red-packet/open", { oId, gesture });
  },

  // 获取私信列表
  getPrivateMessages() {
    return request.get("/chat/get-list");
  },

  // 发送私信
  sendPrivateMessage(userName, content) {
    return request.post("/chat/send", {
      userName,
      content,
    });
  },

  // 获取私信详情
  getPrivateMessageDetail(toUser, page = 1, pageSize = 20) {
    return request.get("/chat/get-message", { toUser, page, pageSize });
  },

  // 获取未读私信消息
  getUnreadMessages() {
    return request.get("/chat/has-unread");
  },

  // 标记私信为已读
  markAsRead(fromUser) {
    return request.get("/chat/mark-as-read", { fromUser });
  },
};
