import { request } from "../api/request";

class WebSocketManager {
  constructor() {
    this.connections = new Map(); // 存储多个连接
    this.eventHandlers = new Map();
    this.reconnectAttempts = new Map();
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
    this.isConnecting = new Map();
    this.isManualClose = new Map();
    this.reconnectTimers = new Map();
  }

  /**
   * 连接到 WebSocket 服务器
   * @param {string} url WebSocket 服务器地址
   * @param {Object} options 连接选项
   * @returns {Promise} 连接结果
   */
  connect(url, options = {}) {
    const connectionId = options.connectionId || url; // 使用 connectionId 或 url 作为唯一标识

    if (this.isConnecting.get(connectionId)) {
      return Promise.reject(new Error("正在连接中..."));
    }

    if (
      this.connections.has(connectionId) &&
      this.connections.get(connectionId).readyState === WebSocket.OPEN
    ) {
      return Promise.resolve(this.connections.get(connectionId));
    }

    this.isConnecting.set(connectionId, true);
    this.isManualClose.set(connectionId, false);

    // 如果URL已经包含了apiKey，直接使用
    let websocketUrl = url;

    // 如果URL不包含apiKey，则添加
    if (!url.includes("apiKey=")) {
      const apiKey = request.getApiKey();
      if (apiKey) {
        websocketUrl = `${url}${url.includes("?") ? "&" : "?"}apiKey=${apiKey}`;
      }
    }

    // 添加额外的参数
    if (options.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        if (!websocketUrl.includes(`${key}=`)) {
          websocketUrl = `${websocketUrl}${
            websocketUrl.includes("?") ? "&" : "?"
          }${key}=${value}`;
        }
      });
    }

    return new Promise((resolve, reject) => {
      try {
        const ws = new WebSocket(websocketUrl);
        this.connections.set(connectionId, ws);

        ws.onopen = () => {
          console.log(`WebSocket 连接已建立: ${connectionId}`);
          this.isConnecting.set(connectionId, false);
          if (this.reconnectTimers.has(connectionId)) {
            clearTimeout(this.reconnectTimers.get(connectionId));
            this.reconnectTimers.delete(connectionId);
          }
          resolve(ws);
        };

        ws.onclose = (event) => {
          console.log(`WebSocket 连接已关闭: ${connectionId}`, event);
          this.isConnecting.set(connectionId, false);

          // 只有在非手动关闭的情况下才进行重连
          if (!this.isManualClose.get(connectionId)) {
            this.handleReconnect(websocketUrl, options, connectionId);
          }
        };

        ws.onerror = (error) => {
          console.error(`WebSocket 错误: ${connectionId}`, error);
          this.isConnecting.set(connectionId, false);
          reject(error);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data, connectionId);
          } catch (e) {
            console.error("消息解析错误:", e);
          }
        };
      } catch (error) {
        this.isConnecting.set(connectionId, false);
        reject(error);
      }
    });
  }

  /**
   * 处理重连逻辑
   * @param {string} url WebSocket 服务器地址
   * @param {Object} options 连接选项
   * @param {string} connectionId 连接标识
   */
  handleReconnect(url, options, connectionId) {
    if (this.isManualClose.get(connectionId)) {
      return;
    }

    const attempts = this.reconnectAttempts.get(connectionId) || 0;
    if (attempts < this.maxReconnectAttempts) {
      this.reconnectAttempts.set(connectionId, attempts + 1);
      console.log(
        `尝试重连 ${connectionId} (${attempts + 1}/${
          this.maxReconnectAttempts
        })...`
      );

      if (this.reconnectTimers.has(connectionId)) {
        clearTimeout(this.reconnectTimers.get(connectionId));
      }

      const timer = setTimeout(() => {
        this.connect(url, options);
      }, this.reconnectDelay);

      this.reconnectTimers.set(connectionId, timer);
    } else {
      console.log(`达到最大重连次数，停止重连: ${connectionId}`);
    }
  }

  /**
   * 发送消息
   * @param {Object} data 要发送的数据
   * @param {string} connectionId 连接标识
   */
  send(data, connectionId) {
    const ws = this.connections.get(connectionId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      console.log(`发送消息到 ${connectionId}:`, data);
      ws.send(data);
    } else {
      console.error(`WebSocket 未连接: ${connectionId}`);
    }
  }

  /**
   * 关闭连接
   * @param {string} connectionId 连接标识
   */
  close(connectionId) {
    if (connectionId) {
      // 关闭指定连接
      this.isManualClose.set(connectionId, true);
      if (this.reconnectTimers.has(connectionId)) {
        clearTimeout(this.reconnectTimers.get(connectionId));
        this.reconnectTimers.delete(connectionId);
      }
      const ws = this.connections.get(connectionId);
      if (ws) {
        ws.close();
        this.connections.delete(connectionId);
      }
    } else {
      // 关闭所有连接
      this.connections.forEach((ws, id) => {
        this.isManualClose.set(id, true);
        if (this.reconnectTimers.has(id)) {
          clearTimeout(this.reconnectTimers.get(id));
          this.reconnectTimers.delete(id);
        }
        ws.close();
      });
      this.connections.clear();
    }
  }

  /**
   * 注册事件处理器
   * @param {string} event 事件名称
   * @param {Function} handler 处理函数
   * @param {string} connectionId 连接标识
   */
  on(event, handler, connectionId) {
    const key = connectionId ? `${event}:${connectionId}` : event;
    if (!this.eventHandlers.has(key)) {
      this.eventHandlers.set(key, new Set());
    }
    this.eventHandlers.get(key).add(handler);
  }

  /**
   * 移除事件处理器
   * @param {string} event 事件名称
   * @param {Function} handler 处理函数
   * @param {string} connectionId 连接标识
   */
  off(event, handler, connectionId) {
    const key = connectionId ? `${event}:${connectionId}` : event;
    if (this.eventHandlers.has(key)) {
      this.eventHandlers.get(key).delete(handler);
    }
  }

  /**
   * 处理接收到的消息
   * @param {Object} data 接收到的数据
   * @param {string} connectionId 连接标识
   */
  handleMessage(data, connectionId) {
    // 触发特定连接的消息事件
    const specificKey = `message:${connectionId}`;
    if (this.eventHandlers.has(specificKey)) {
      this.eventHandlers.get(specificKey).forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
          console.error(`处理消息时出错:`, error);
        }
      });
    }

    // 触发全局消息事件
    if (this.eventHandlers.has("message")) {
      this.eventHandlers.get("message").forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
          console.error(`处理消息时出错:`, error);
        }
      });
    }
  }
}

// 创建单例实例
const wsManager = new WebSocketManager();

export default wsManager;
