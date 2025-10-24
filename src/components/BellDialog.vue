<template>
  <div v-if="visible" class="signature-dialog" @click.self="handleClose">
    <div class="signature-content">
      <div class="dialog-header">
        <h3>关键词消息提醒</h3>
        <i class="fas fa-times close-icon" @click="handleClose"></i>
      </div>
      <div class="tip">已拥有关键词：</div>
      <div class="tip tipdiv" v-if="locatbell.length > 0">
        <div class="tipdivitem" v-for="(value, index) in locatbell" :key="index">
          <span class="keyword-text">{{value}}</span>
          <i class="fas fa-times delete-icon" @click="handleDeleteKeyword(index)"></i>
        </div>
      </div>
      <div class="tip tipdiv" v-else>
        暂无，待添加
      </div>

      <div class="dialog-body">
        <div class="input-area">
          <textarea v-model="keyword" placeholder="输入关键词并点击确认，建议使用简短文字。" rows="2"></textarea>
        </div>
      </div>
      <div class="dialog-footer">
        <button @click="handleClear">重置所有</button>
        <button @click="handleSave">提交</button>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, onMounted } from "vue";
  import { ElMessage } from "element-plus";
  import { useUserStore } from "../stores/user";

  const props = defineProps({
    visible: {
      type: Boolean,
      default: false,
    },
    locatbell: {
      type: Array,
      default: [],
    },
  });

  const emit = defineEmits(["close", "save"]);
  const keyword = ref('');
  const isLoading = ref(false);
  const bellsList = ref([]);

  const handleClose = () => {
    emit("close");
  };

  // 获取当前用户的缓存的提醒词
  const getUserBells = () => {
    const savedBells = utools.dbStorage.getItem("fishpi_bells") || [];
    return savedBells;
  };

  // 保存当前用户的提醒词
  const saveUserBells = (bell) => {
    const savedBells = utools.dbStorage.getItem("fishpi_bells") || [];
    if (savedBells.includes(bell)) return; // Prevent duplicates
    savedBells.push(bell);
    utools.dbStorage.setItem("fishpi_bells", savedBells);
  };

  // 删除单个关键词
  const handleDeleteKeyword = (index) => {
    const savedBells = utools.dbStorage.getItem("fishpi_bells") || [];
    savedBells.splice(index, 1);
    utools.dbStorage.setItem("fishpi_bells", savedBells);

    // 触发父组件更新
    emit("save");

    ElMessage({
      message: "关键词已删除",
      type: "success",
      duration: 2000,
      showClose: true,
    });
  };

  onMounted(() => {
    // 从 utools.dbStorage 获取保存的小尾巴
    const userBells = getUserBells();
    bellsList.value = userBells

    // 监听账号切换事件
    window.addEventListener("fishpi:account-switched", () => {
      // 重新加载用户小尾巴
      const userBells = getUserBells();
      bellsList.value = userBells

    });
  });

  const handleSave = () => {
    const savedBells = utools.dbStorage.getItem("fishpi_bells") || [];
    if (savedBells.includes(keyword.value)) {
      ElMessage({
        message: "关键词已存在",
        type: "warning",
        duration: 2000,
        showClose: true,
      });
      return;
    }  // Prevent duplicates
    if (keyword.value.trim() === "") {
      ElMessage({
        message: "请输入关键词",
        type: "warning",
        duration: 2000,
        showClose: true,
      });
      return;
    }
    saveUserBells(keyword.value);
    handleClose();
    keyword.value = '';
    ElMessage({
      message: "关键词已保存",
      type: "success",
      duration: 2000,
      showClose: true,
    });
  };
  const handleClear = () => {
    utools.dbStorage.setItem("fishpi_bells", []);

    handleClose();

    ElMessage({
      message: "关键词已重置",
      type: "success",
      duration: 2000,
      showClose: true,
    });
  };

</script>

<style scoped>
  .signature-dialog {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    animation: fadeIn 0.3s ease;
  }

  .signature-content {
    background: var(--card-bg);
    border-radius: 8px;
    width: 380px;
    padding: 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border: 1px solid var(--border-color);
    animation: slideUp 0.3s ease;
  }

  .dialog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .dialog-header h3 {
    margin: 0;
    font-size: 16px;
    color: var(--text-color);
  }

  .close-icon {
    cursor: pointer;
    color: var(--sub-text-color);
  }

  .dialog-body {
    margin-bottom: 16px;
  }

  .tip {
    font-size: 12px;
    color: var(--sub-text-color);
    margin-bottom: 8px;
  }

  .tipdiv {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    margin-bottom: 8px;
    gap: 10px;
  }

  .tipdivitem {
    color: #000;
    padding: 4px 8px;
    border-radius: 4px;
    background-color: #FF9900;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    position: relative;
    min-width: 60px;
  }

  .keyword-text {
    flex: 1;
    word-break: break-all;
  }

  .delete-icon {
    font-size: 12px;
    cursor: pointer;
    color: #fff;
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 50%;
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .delete-icon:hover {
    background-color: rgba(255, 0, 0, 0.8);
    transform: scale(1.1);
  }

  .input-area {
    margin-bottom: 8px;
  }

  textarea {
    width: 100%;
    padding: 8px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    resize: none;
    margin-bottom: 12px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
      "Helvetica Neue", Arial, sans-serif;
    font-size: 14px;
    line-height: 1.5;
    color: var(--text-color);
    background: var(--card-bg);
    transition: border-color 0.2s;
  }

  textarea:focus {
    outline: none;
    border-color: var(--primary-color);
  }

  .preview {
    background: var(--hover-bg);
    border-radius: 4px;
    padding: 12px;
    font-size: 13px;
    color: var(--sub-text-color);
  }

  .preview-label {
    color: var(--sub-text-color);
    margin-bottom: 8px;
  }

  .preview-content {
    line-height: 1.5;
  }

  .message-row {
    display: flex;
    align-items: flex-start;
    margin-bottom: 8px;
  }

  .message-bubble {
    max-width: 80%;
    min-width: 60px;
    display: flex;
    flex-direction: column;
  }

  .message-content {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  .message-text {
    padding: 10px 12px;
    border-radius: 12px;
    background-color: var(--bubble-bg);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    word-break: break-word;
    line-height: 1.5;
    font-size: 14px;
    color: var(--text-color);
    position: relative;
    width: fit-content;
    max-width: 100%;
  }

  .message-text :deep(blockquote) {
    margin: 8px 0 0 0;
    padding: 8px 12px;
    border-left: 2px solid var(--border-color);
    background-color: var(--hover-bg);
    border-radius: 4px;
    color: var(--sub-text-color);
    font-size: 13px;
    line-height: 1.5;
  }

  .message-text :deep(blockquote p) {
    margin: 0;
  }

  .message-text :deep(blockquote p:last-child) {
    margin-bottom: 0;
  }

  .signature {
    font-size: 12px;
    color: var(--primary-color);
    margin-top: 4px;
    padding: 0 4px;
  }

  .dialog-footer {
    text-align: right;
  }

  .dialog-footer button {
    padding: 6px 16px;
    background-color: var(--button-bg);
    color: var(--button-text);
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.2s;
    margin-left: 8px;
  }

  .dialog-footer button:hover {
    background-color: var(--primary-color);
  }

  .dialog-footer button:first-child {
    background-color: coral;
  }

  .button-group {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 12px;
  }

  .random-btn {
    padding: 6px 12px;
    background: var(--hover-bg);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    color: var(--sub-text-color);
    font-size: 13px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.3s ease;
  }

  .random-btn:hover {
    background: var(--card-bg);
    border-color: var(--primary-color);
  }

  .random-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .random-btn i {
    font-size: 12px;
  }

  .message-row-self {
    flex-direction: row-reverse;
  }

  .message-row-self .message-text {
    background-color: var(--bubble-bg);
    margin-left: auto;
  }

  .message-row-self .message-text :deep(blockquote) {
    background-color: var(--hover-bg);
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }

    to {
      opacity: 1;
    }
  }

  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }

    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
</style>