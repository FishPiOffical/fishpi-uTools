<template>
  <div class="chat-header">
    <div class="header-content">
      <span class="chat-name" @click="showEditDialog = true">{{
        chatRoomName
      }}</span>
    </div>

    <el-dialog
      v-model="showEditDialog"
      title="修改聊天室名称"
      width="30%"
      :close-on-click-modal="false"
    >
      <el-input v-model="tempChatRoomName" placeholder="请输入聊天室名称" />
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showEditDialog = false">取消</el-button>
          <el-button type="primary" @click="saveChatRoomName">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { ElMessage } from "element-plus";

const chatRoomName = ref("摸鱼派聊天室");
const tempChatRoomName = ref("");
const showEditDialog = ref(false);

onMounted(() => {
  // 从本地存储获取保存的聊天室名称
  const savedSettings = utools.dbStorage.getItem("fishpi_settings") || {};
  if (savedSettings.chatRoomName) {
    chatRoomName.value = savedSettings.chatRoomName;
  }
});

const saveChatRoomName = () => {
  if (!tempChatRoomName.value.trim()) {
    ElMessage({
      message: "聊天室名称不能为空",
      type: "warning",
      duration: 2000,
      showClose: true,
    });
    return;
  }

  chatRoomName.value = tempChatRoomName.value;
  const savedSettings = utools.dbStorage.getItem("fishpi_settings") || {};
  savedSettings.chatRoomName = chatRoomName.value;
  utools.dbStorage.setItem("fishpi_settings", savedSettings);

  showEditDialog.value = false;
  ElMessage({
    message: "聊天室名称已更新",
    type: "success",
    duration: 2000,
    showClose: true,
  });
};
</script>

<style scoped>
.chat-header {
  padding: 10px 20px;
  border-bottom: 1px solid #eee;
  background-color: #fff;
}

.header-content {
  display: flex;
}

.chat-name {
  font-size: 18px;
  color: #333;
  font-weight: bold;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.chat-name:hover {
  background-color: #f5f7fa;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}
</style>
