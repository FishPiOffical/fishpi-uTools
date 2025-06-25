/**
 * 计算图片预览窗口的大小
 * @param {string} imageSrc - 图片地址
 * @returns {Promise<Object>} 返回窗口配置对象
 */
export function calculateImageWindowSize(imageSrc) {
  return new Promise((resolve) => {
    console.log("开始计算窗口大小，图片地址:", imageSrc);

    const img = new Image();

    img.onload = function () {
      console.log(
        "图片加载成功，原始尺寸:",
        img.naturalWidth,
        "x",
        img.naturalHeight
      );

      // 获取屏幕尺寸
      const screenWidth = window.screen.width;
      const screenHeight = window.screen.height;

      // 设置最大窗口尺寸（屏幕的80%）
      const maxWidth = screenWidth * 0.8;
      const maxHeight = screenHeight * 0.8;

      // 设置最小窗口尺寸
      const minWidth = 800;
      const minHeight = 600;

      // 标题栏高度
      const titleBarHeight = 40;

      // 计算图片显示尺寸
      let displayWidth = img.naturalWidth;
      let displayHeight = img.naturalHeight;

      console.log("初始显示尺寸:", displayWidth, "x", displayHeight);
      console.log("最大允许尺寸:", maxWidth, "x", maxHeight);

      // 如果图片太大，按比例缩小到最大尺寸内
      if (displayWidth > maxWidth || displayHeight > maxHeight) {
        const ratio = Math.min(
          maxWidth / displayWidth,
          maxHeight / displayHeight
        );
        displayWidth = Math.floor(displayWidth * ratio);
        displayHeight = Math.floor(displayHeight * ratio);
        console.log("图片过大，缩放比例:", ratio);
        console.log("缩放后尺寸:", displayWidth, "x", displayHeight);
      }

      // 确保不小于最小尺寸
      displayWidth = Math.max(displayWidth, minWidth);
      displayHeight = Math.max(displayHeight, minHeight);

      // 计算窗口总高度（图片高度 + 标题栏高度）
      const windowHeight = displayHeight + titleBarHeight;

      console.log("最终窗口尺寸:", displayWidth, "x", windowHeight);

      resolve({
        width: displayWidth,
        height: windowHeight,
        minWidth: minWidth,
        minHeight: minHeight,
      });
    };

    img.onerror = function () {
      console.error("图片加载失败，使用默认窗口大小:", imageSrc);
      resolve({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
      });
    };

    img.src = imageSrc;
  });
}

/**
 * 创建图片预览窗口
 * @param {Array} images - 图片数组
 * @param {number} currentIndex - 当前图片索引
 * @returns {Promise<Object>} 返回窗口对象
 */
export async function createImagePreviewWindow(images, currentIndex = 0) {
  if (!images || images.length === 0) {
    throw new Error("没有图片可以预览");
  }

  const currentImage = images[currentIndex];
  if (!currentImage || !currentImage.src) {
    throw new Error("当前图片无效");
  }

  // 准备URL参数
  const imagesParam = encodeURIComponent(JSON.stringify(images));
  const url = `image-preview.html?images=${imagesParam}&index=${currentIndex}`;

  // 计算合适的窗口大小
  const windowSize = await calculateImageWindowSize(currentImage.src);
  const windowWidth = windowSize.width;
  const windowHeight = windowSize.height;

  console.log("创建图片预览窗口，尺寸:", windowWidth, "x", windowHeight);

  if (window.utools) {
    try {
      // 计算窗口居中位置
      const screenWidth = window.screen.width;
      const screenHeight = window.screen.height;
      const x = Math.floor((screenWidth - windowWidth) / 2);
      const y = Math.floor((screenHeight - windowHeight) / 2);

      // 使用 createBrowserWindow 创建独立窗口
      const previewWindow = utools.createBrowserWindow(
        url,
        {
          show: false,
          title: "图片预览",
          width: windowWidth,
          height: windowHeight,
          x: x,
          y: y,
          center: true,
          resizable: true,
          minimizable: true,
          maximizable: true,
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
          },
        },
        () => {
          console.log("图片预览窗口加载完成");
          // 显示窗口
          previewWindow.show();

          // 向窗口发送消息，传递窗口对象信息
          try {
            previewWindow.webContents.send("window-info", {
              width: windowWidth,
              height: windowHeight,
              windowId: previewWindow.id,
            });
          } catch (error) {
            console.error("发送窗口信息失败:", error);
          }
        }
      );

      console.log("图片预览窗口创建成功:", previewWindow);
      return previewWindow;
    } catch (error) {
      console.error("创建图片预览窗口失败:", error);
      throw error;
    }
  } else {
    // 非 uTools 环境，使用普通浏览器窗口
    console.log("非 uTools 环境，使用普通窗口");
    const newWindow = window.open(
      url,
      "_blank",
      `width=${windowWidth},height=${windowHeight},left=${Math.floor(
        (screen.width - windowWidth) / 2
      )},top=${Math.floor(
        (screen.height - windowHeight) / 2
      )},resizable=yes,scrollbars=yes,status=yes`
    );
    return newWindow;
  }
}
