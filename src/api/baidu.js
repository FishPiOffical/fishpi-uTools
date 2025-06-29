import axios from "axios";

// 百度图片搜索API
class BaiduImageAPI {
  constructor() {
    this.baseURL = "https://image.baidu.com";
    this.instance = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Referer: "https://image.baidu.com/",
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
      },
    });

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response) => {
        return response.data;
      },
      (error) => {
        console.error("百度图片搜索API错误:", error);
        return Promise.reject(error);
      }
    );
  }

  // 搜索表情包
  async searchEmoji(keyword = "表情包", page = 0, count = 30) {
    try {
      const params = {
        tn: "resultjson_com",
        word: keyword,
        queryWord: keyword,
        ie: "utf-8",
        oe: "utf-8",
        pn: page * count,
        rn: count,
      };

      const response = await this.instance.get("/search/acjson", { params });
      return response;
    } catch (error) {
      console.error("搜索表情包失败:", error);
      throw error;
    }
  }

  // 解析图片URL
  parseImageUrls(data) {
    if (!data || !data.data) {
      return [];
    }

    const images = data.data
      .filter((item) => {
        // 过滤掉空对象和没有图片URL的项目
        return item && item.thumbURL && item.thumbURL.trim() !== "";
      })
      .map((item) => ({
        thumbURL: item.thumbURL,
        middleURL: item.middleURL || item.thumbURL,
        hoverURL: item.hoverURL || item.thumbURL,
        width: item.width || 0,
        height: item.height || 0,
        type: item.type || "jpeg",
        title: item.fromPageTitle || "",
      }));

    return images;
  }
}

export const baiduImageAPI = new BaiduImageAPI();
