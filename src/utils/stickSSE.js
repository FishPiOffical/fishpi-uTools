import { stickApi } from "../api/stick";

class StickSSE {
  constructor() {
    this.eventSource = null;
    this.clientId = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000; // 3秒
  }

  // 连接SSE
  async connect() {
    try {
      // 首先获取个人信息确认token有效性
      const meResponse = await stickApi.getMe();
      console.log("个人信息:", meResponse);

      // 创建SSE连接
      const token = utools.dbStorage.getItem("stick_token");
      if (!token) {
        throw new Error("未找到认证token");
      }

      // 连接到消息通知，直接在URL中添加authorization参数
      const sseUrl = `${
        stickApi.baseURL
      }/api/realtime?authorization=${encodeURIComponent(token)}`;
      this.eventSource = new EventSource(sseUrl, {
        withCredentials: true,
      });

      this.setupEventListeners();
      this.isConnected = true;
      this.reconnectAttempts = 0;

      console.log("SSE连接已建立");
      return true;
    } catch (error) {
      console.error("SSE连接失败:", error);
      this.handleConnectionError(error);
      return false;
    }
  }

  // 设置事件监听器
  setupEventListeners() {
    if (!this.eventSource) return;

    // 连接建立事件
    this.eventSource.addEventListener("PB_CONNECT", (event) => {
      try {
        const data = JSON.parse(event.data);
        this.clientId = data.clientId;
        console.log("SSE连接已建立，clientId:", this.clientId);

        // 订阅消息
        this.subscribe();

        // 触发连接成功事件
        window.dispatchEvent(
          new CustomEvent("stick:sse-connected", {
            detail: { clientId: this.clientId, data },
          })
        );
      } catch (error) {
        console.error("解析PB_CONNECT事件失败:", error);
      }
    });

    // 钱包变动事件
    this.eventSource.addEventListener("wallets", (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("钱包变动:", data);

        // 触发钱包变动事件
        window.dispatchEvent(
          new CustomEvent("stick:wallet-updated", {
            detail: { data },
          })
        );
      } catch (error) {
        console.error("解析wallets事件失败:", error);
      }
    });

    // 知识点事件
    this.eventSource.addEventListener("stick", (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("收到知识点:", data);

        // 触发知识点事件
        window.dispatchEvent(
          new CustomEvent("stick:knowledge-received", {
            detail: { data },
          })
        );
      } catch (error) {
        console.error("解析stick事件失败:", error);
      }
    });

    // 连接错误
    this.eventSource.onerror = (error) => {
      console.error("SSE连接错误:", error);
      this.handleConnectionError(error);
    };

    // 连接关闭
    this.eventSource.onclose = () => {
      console.log("SSE连接已关闭");
      this.isConnected = false;

      // 触发连接关闭事件
      window.dispatchEvent(new CustomEvent("stick:sse-closed"));

      // 尝试重连
      this.attemptReconnect();
    };
  }

  // 订阅消息
  async subscribe() {
    if (!this.clientId) {
      console.error("clientId未设置，无法订阅");
      return;
    }

    try {
      const response = await stickApi.connectRealtime(this.clientId, [
        "users",
        "wallets",
        "stick",
      ]);
      console.log("订阅成功:", response);
    } catch (error) {
      console.error("订阅失败:", error);
    }
  }

  // 处理连接错误
  handleConnectionError(error) {
    this.isConnected = false;

    // 触发连接错误事件
    window.dispatchEvent(
      new CustomEvent("stick:sse-error", {
        detail: { error },
      })
    );

    // 尝试重连
    this.attemptReconnect();
  }

  // 尝试重连
  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log("达到最大重连次数，停止重连");
      return;
    }

    this.reconnectAttempts++;
    console.log(
      `尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    setTimeout(() => {
      this.connect();
    }, this.reconnectDelay);
  }

  // 断开连接
  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.isConnected = false;
    this.clientId = null;
    this.reconnectAttempts = 0;
    console.log("SSE连接已断开");
  }

  // 获取连接状态
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      clientId: this.clientId,
      reconnectAttempts: this.reconnectAttempts,
    };
  }
}

export const stickSSE = new StickSSE();
