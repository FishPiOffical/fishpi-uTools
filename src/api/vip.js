
import { request } from "./request";

export const vipApi = {
  // 获取vip商品信息列表
  getVipList() {
    return request.get("/api/membership/levels");
  },
  // 购买vip会员，参数为 vip 商品的 oId
  buyVip(param) {
    return request.post("/api/membership/open", param);
  },
  //获取vip用户（已经过滤过期用户）
  getVipUser() {
    return request.get("/api/memberships/configs");
  },
  //获取vip用户（已经过滤过期用户）
  getVipUserInfo(userId) {
    return request.get("/api/membership/" + userId);
  },
  // 更新vip用户配置
  upVipUserConfig(params) {
    return request.put("/api/membership/config", params);
  },
};
