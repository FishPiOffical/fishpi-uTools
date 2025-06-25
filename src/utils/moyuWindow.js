// 在模块作用域保存窗口实例
let moyuWindowInstance = null;

/**
 * 创建或激活摸鱼提醒窗口
 * @param {string} userAvatar - 用户头像地址
 * @param {string} username - 用户名
 * @returns {Promise<Object>} 返回窗口对象
 */
export async function createMoYuWindow(userAvatar = null, username = null) {
  // 如果已存在实例且未销毁，直接显示并聚焦
  if (moyuWindowInstance && !moyuWindowInstance.isDestroyed()) {
    moyuWindowInstance.show();
    moyuWindowInstance.focus();
    return moyuWindowInstance;
  }

  // 准备URL参数
  const params = new URLSearchParams();
  if (userAvatar) {
    params.append("avatar", encodeURIComponent(userAvatar));
  }
  if (username) {
    params.append("username", encodeURIComponent(username));
  }

  const url = `moyu-window.html${
    params.toString() ? `?${params.toString()}` : ""
  }`;
  const windowWidth = 360;
  const windowHeight = 70; // 调整高度以适应展开状态（60 + 200）

  console.log("创建摸鱼小窗，尺寸:", windowWidth, "x", windowHeight);
  console.log("摸鱼小窗参数:", { userAvatar, username });

  try {
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    const x = screenWidth - windowWidth - 20;
    const y = screenHeight - windowHeight - 100;

    // 创建新窗口
    moyuWindowInstance = utools.createBrowserWindow(
      url,
      {
        show: false,
        title: "摸鱼小窗",
        width: windowWidth,
        height: windowHeight,
        x: x,
        y: y,
        center: false,
        resizable: false,
        minimizable: false,
        maximizable: false,
        alwaysOnTop: true, // 保持窗口在最前面
        skipTaskbar: true, // 不在任务栏显示
        frame: false, // 去掉默认标题栏
        transparent: true, // 透明背景
        hasShadow: false, // 去掉窗口阴影
        backgroundColor: "#00000000", // 强制背景透明
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          backgroundThrottling: false,
        },
      },
      () => {
        moyuWindowInstance.show();
      }
    );

    // 关闭时清空变量
    moyuWindowInstance.on &&
      moyuWindowInstance.on("closed", () => {
        moyuWindowInstance = null;
      });

    return moyuWindowInstance;
  } catch (error) {
    console.error("创建摸鱼小窗失败:", error);
    moyuWindowInstance = null;
    throw error;
  }
}

/**
 * 显示摸鱼提醒
 * @param {Object} options - 配置选项
 * @param {string} options.userAvatar - 用户头像地址
 * @param {string} options.username - 用户名
 * @param {boolean} options.autoClose - 是否自动关闭（默认false）
 * @param {number} options.autoCloseDelay - 自动关闭延迟时间（毫秒，默认不自动关闭）
 * @returns {Promise<Object>} 返回窗口对象
 */
export async function showMoYuReminder(options = {}) {
  const {
    userAvatar = null,
    username = null,
    autoClose = false,
    autoCloseDelay = 0,
  } = options;

  try {
    const window = await createMoYuWindow(userAvatar, username);

    // 如果设置了自动关闭
    if (autoClose && autoCloseDelay > 0) {
      setTimeout(() => {
        if (window && !window.isDestroyed()) {
          window.close();
        }
      }, autoCloseDelay);
    }

    return window;
  } catch (error) {
    console.error("显示摸鱼提醒失败:", error);
    throw error;
  }
}
