<template>
  <div v-if="visible" class="signature-dialog">
    <div class="signature-content">
      <div class="dialog-header">
        <h3>设置小尾巴</h3>
        <i class="fas fa-times close-icon" @click="handleClose"></i>
      </div>
      <div class="dialog-body">
        <textarea
          v-model="signatureContent"
          placeholder="请输入小尾巴内容"
          rows="3"
        ></textarea>
      </div>
      <div class="dialog-footer">
        <button @click="handleSave">保存</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  defaultSignature: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["close", "save"]);

const signatureContent = ref(props.defaultSignature);

const handleClose = () => {
  emit("close");
};

const handleSave = () => {
  emit("save", signatureContent.value);
  handleClose();
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
}

.signature-content {
  background: white;
  border-radius: 8px;
  width: 400px;
  padding: 20px;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.dialog-header h3 {
  margin: 0;
  font-size: 18px;
}

.close-icon {
  cursor: pointer;
  font-size: 18px;
  color: #999;
}

.dialog-body {
  margin-bottom: 20px;
}

.dialog-body textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: none;
}

.dialog-footer {
  text-align: right;
}

.dialog-footer button {
  padding: 8px 20px;
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.dialog-footer button:hover {
  background-color: #40a9ff;
}
</style>
