<template>
  <div v-if="visible" class="about-author-modal">
    <div class="modal-overlay" @click="close"></div>
    <div class="modal-content">
      <div class="modal-header">
        <h3>关于作者</h3>
        <button class="close-btn" @click="close">×</button>
      </div>
      <div class="modal-body">
        <div class="author-info">
          <h4>马达</h4>
          <p>一个会点编程和热爱摸鱼的开发者</p>
          <p class="info-text">
            嗨，我是马达！平时喜欢写写代码，摸摸鱼，捣鼓一些有趣的小工具。这个插件希望能让摸鱼的小伙伴们用得更顺手一些。如果你觉得这个插件还不错的话，欢迎给个好评和评论噢，这对我来说是最大的鼓励！
          </p>
        </div>
        <div class="project-links">
          <h5>项目相关</h5>
          <div class="link-buttons">
            <button class="link-btn" @click="openExternalLink(LINKS.GITHUB)">
              <i class="fas fa-code-branch"></i> 开源仓库
            </button>
            <button class="link-btn" @click="openExternalLink(LINKS.ISSUES)">
              <i class="fas fa-bug"></i> 问题反馈
            </button>
          </div>
        </div>
        <div class="cursor-ai-info-wrapper">
          <p class="ai-assisted-text">
            本项目由
            <span class="cursor-link" @click="openExternalLink(LINKS.CURSOR)"
              >Cursor AI</span
            >
            辅助开发完成
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from "vue";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:visible"]);

const close = () => {
  emit("update:visible", false);
};

const openExternalLink = (url) => {
  utools.shellOpenExternal(url);
};

const LINKS = {
  GITHUB: "https://github.com/FishPiOffical/fishpi-uTools",
  ISSUES: "https://github.com/FishPiOffical/fishpi-uTools/issues",
  CURSOR: "https://www.cursor.com/cn",
};
</script>

<style scoped>
.about-author-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
}

.modal-content {
  position: relative;
  background: white;
  border-radius: 20px;
  width: 90%;
  max-width: 420px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  z-index: 1001;
}

.modal-header {
  padding: 28px 28px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  color: #1a1f36;
  font-size: 1.4rem;
  font-weight: 600;
}

.modal-body {
  padding: 0 28px 28px;
}

.author-info {
  text-align: left;
  margin-bottom: 28px;
}

.author-info h4 {
  margin: 0 0 8px;
  color: #1a1f36;
  font-size: 1.3rem;
  font-weight: 600;
}

.author-info p {
  margin: 0;
  color: #697386;
  line-height: 1.6;
  font-size: 0.95rem;
}

.author-info .info-text {
  margin-top: 12px;
  color: #697386;
  font-size: 0.9rem;
  line-height: 1.6;
}

.project-links {
  margin-top: 24px;
  text-align: left;
}

.project-links h5 {
  font-size: 1rem;
  font-weight: 600;
  color: #1a1f36;
  margin-bottom: 16px;
}

.link-buttons {
  display: flex;
  gap: 12px;
}

.link-btn {
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 10px;
  padding: 10px 18px;
  color: #1a1f36;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
}

.link-btn:hover {
  background-color: #f1f3f5;
  border-color: #dee2e6;
  text-decoration: none;
  color: #1a1f36;
}

.cursor-ai-info-wrapper {
  margin-top: 28px;
  text-align: left;
}

.ai-assisted-text {
  color: #697386;
  font-size: 0.85rem;
  margin: 0;
  line-height: 1.6;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #697386;
  cursor: pointer;
  padding: 4px;
  line-height: 1;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background-color: #f8f9fa;
  color: #1a1f36;
}

.cursor-link {
  color: #1a1f36;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;
  cursor: pointer;
}

.cursor-link:hover {
  color: #4a90e2;
}
</style>
