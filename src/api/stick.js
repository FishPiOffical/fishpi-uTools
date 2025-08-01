import { request } from "./request";

// 基础访问域名
const STICK_BASE_URL = "https://stick.aweoo.com";

class StickRequest {
  constructor() {
    this.baseURL = STICK_BASE_URL;
    this.instance = request.instance;
  }

  // 获取认证头
  getAuthHeader() {
    const token = utools.dbStorage.getItem("stick_token");
    return token ? { Authorization: token } : {};
  }

  // 设置token
  setToken(token) {
    utools.dbStorage.setItem("stick_token", token);
  }

  // 清除token
  clearToken() {
    utools.dbStorage.removeItem("stick_token");
  }

  // 获取登录URL
  getLoginUrl() {
    return `${this.baseURL}/fishpi/login`;
  }

  // 处理登录回调
  handleLoginCallback(callbackData) {
    if (callbackData && callbackData.token) {
      // 验证token格式
      const payload = this.parseToken(callbackData.token);
      if (!payload) {
        throw new Error("Token格式无效");
      }

      // 检查token是否过期
      if (this.isTokenExpired(callbackData.token)) {
        throw new Error("Token已过期");
      }

      // 保存token
      this.setToken(callbackData.token);
      return callbackData;
    }
    throw new Error("登录失败：未获取到token");
  }

  // 检查登录状态
  checkLoginStatus() {
    const token = utools.dbStorage.getItem("stick_token");
    if (!token) {
      return { isLoggedIn: false, reason: "未找到token" };
    }

    if (this.isTokenExpired(token)) {
      this.clearToken();
      return { isLoggedIn: false, reason: "token已过期" };
    }

    return { isLoggedIn: true };
  }

  // 获取个人信息
  async getMe() {
    try {
      const response = await this.instance.get(`${this.baseURL}/game/me`, {
        headers: this.getAuthHeader(),
      });
      return response;
    } catch (error) {
      // 如果是认证错误，清除token
      if (error.response?.status === 401 || error.response?.status === 403) {
        this.clearToken();
        throw new Error("认证失败，请重新登录");
      }
      throw error;
    }
  }

  // 连接实时通知接口
  async connectRealtime(
    clientId,
    subscriptions = ["users", "wallets", "stick"]
  ) {
    return this.instance.post(
      `${this.baseURL}/api/realtime`,
      {
        clientId,
        subscriptions,
      },
      {
        headers: this.getAuthHeader(),
      }
    );
  }

  // 获取缴费项目单
  async getProductList() {
    return this.instance.get(`${this.baseURL}/game/product/list`, {
      headers: this.getAuthHeader(),
    });
  }

  // 缴费操作
  async buyProduct(id, count = 1) {
    return this.instance.post(
      `${this.baseURL}/game/product/buy`,
      {
        id,
        count,
      },
      {
        headers: this.getAuthHeader(),
      }
    );
  }

  // 获取知识点（补课）
  async getOvertime() {
    return this.instance.get(`${this.baseURL}/game/overtime`, {
      headers: this.getAuthHeader(),
    });
  }

  // 请求解惑
  async getExplanation(historyId) {
    return this.instance.get(`${this.baseURL}/game/${historyId}`, {
      headers: this.getAuthHeader(),
    });
  }

  // 获取解惑图片
  async getExplanationImage(imageUrl) {
    return this.instance.get(imageUrl, {
      headers: this.getAuthHeader(),
      responseType: "blob",
    });
  }

  // 创建SSE连接
  createSSEConnection() {
    const token = utools.dbStorage.getItem("stick_token");
    if (!token) {
      throw new Error("未找到认证token");
    }

    // 使用authorization参数进行认证
    const eventSource = new EventSource(
      `${this.baseURL}/api/realtime?authorization=${encodeURIComponent(token)}`
    );

    return eventSource;
  }

  // 解析JWT token
  parseToken(token) {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) {
        throw new Error("Invalid JWT format");
      }
      const payload = JSON.parse(atob(parts[1]));
      return payload;
    } catch (error) {
      console.error("Token解析失败:", error);
      return null;
    }
  }

  // 检查token是否过期
  isTokenExpired(token) {
    const payload = this.parseToken(token);
    if (!payload || !payload.exp) {
      return true;
    }
    return Date.now() >= payload.exp * 1000;
  }
}

export const stickApi = new StickRequest();
