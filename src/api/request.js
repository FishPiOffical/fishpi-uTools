import axios from "axios";
import { API_CONFIG } from "./config";

class Request {
  constructor(config) {
    this.config = { ...API_CONFIG, ...config };
    this.instance = axios.create(this.config);

    // 请求拦截器
    this.instance.interceptors.request.use(
      (config) => {
        const apiKey = this.getApiKey();
        if (apiKey) {
          // 检查是否是文件上传请求
          const isFileUpload =
            config.headers["Content-Type"] === "multipart/form-data";

          if (isFileUpload) {
            // 文件上传请求，将apiKey添加到URL参数中
            config.url = `${config.url}${
              config.url.includes("?") ? "&" : "?"
            }apiKey=${apiKey}`;
          } else if (config.method === "get") {
            // GET 请求将 apiKey 添加到 URL 参数中
            config.params = {
              ...config.params,
              apiKey: apiKey,
            };
          } else {
            // 其他 POST 请求将 apiKey 添加到请求体中
            config.data = {
              ...config.data,
              apiKey: apiKey,
            };
          }
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response) => {
        const res = response.data;
        console.log("API响应:", res);

        // 处理 API Key 无效或过期的情况
        if (res.code === -1) {
          if (res.msg === "Invalid API Key" || res.msg.includes("API Key")) {
            this.clearApiKey();
            // 触发登录失效事件
            window.dispatchEvent(new CustomEvent("fishpi:login-invalid"));
          }
          // 触发错误消息事件
          window.dispatchEvent(
            new CustomEvent("fishpi:error", {
              detail: {
                message: res.msg || "请求失败",
                code: res.code,
              },
            })
          );
          return Promise.reject(new Error(res.msg || "请求失败"));
        }

        // 返回响应数据
        return res;
      },
      (error) => {
        console.error("API错误:", error);
        return Promise.reject(error);
      }
    );
  }

  // 获取 API Key
  getApiKey() {
    return utools.dbStorage.getItem("fishpi_api_key");
  }

  // 设置 API Key
  setApiKey(apiKey) {
    utools.dbStorage.setItem("fishpi_api_key", apiKey);
  }

  // 清除 API Key
  clearApiKey() {
    utools.dbStorage.removeItem("fishpi_api_key");
  }

  // GET 请求
  async get(path, params = {}) {
    return this.instance.get(path, { params });
  }

  // POST 请求
  async post(path, data = {}) {
    return this.instance.post(path, data);
  }

  // PUT 请求
  async put(path, data = {}) {
    return this.instance.put(path, data);
  }

  // DELETE 请求
  async delete(path) {
    return this.instance.delete(path);
  }

  // 文件上传
  async upload(path, files) {
    const formData = new FormData();
    // 只添加文件到formData
    files.forEach((file) => {
      formData.append("file[]", file);
    });

    return this.instance.post(path, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  }
}

export const request = new Request();
