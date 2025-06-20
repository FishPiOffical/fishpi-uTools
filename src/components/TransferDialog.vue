<template>
  <div v-if="visible" class="transfer-dialog-overlay" @click="close">
    <div class="transfer-dialog" @click.stop>
      <h3>转账</h3>
      <div class="transfer-form">
        <div class="form-item">
          <label>转账金额</label>
          <input type="number" v-model="amount" placeholder="请输入转账金额" />
        </div>
        <div class="form-item">
          <label>转账备注</label>
          <input type="text" v-model="memo" placeholder="请输入转账备注" />
        </div>
        <div class="transfer-tips">
          <i class="tips-icon">!</i>
          <span>转账后积分即时到账，请谨慎交易</span>
        </div>
        <div class="dialog-buttons">
          <button class="cancel-btn" @click="close">取消</button>
          <button
            class="confirm-btn"
            @click="confirmTransfer"
            :disabled="isTransferring"
          >
            {{ isTransferring ? "转账中..." : "确认转账" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { ElMessage } from "element-plus";
import { userApi } from "../api/user";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  receiverUserName: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["close", "success", "error"]);

const amount = ref("");
const memo = ref("");
const isTransferring = ref(false);

const close = () => {
  emit("close");
  amount.value = "";
  memo.value = "";
  isTransferring.value = false;
};

const confirmTransfer = async () => {
  if (!amount.value) {
    ElMessage.warning("请输入转账金额");
    return;
  }

  if (Number(amount.value) <= 0) {
    ElMessage.warning("转账金额必须大于0");
    return;
  }

  isTransferring.value = true;
  try {
    await userApi.transfer(
      props.receiverUserName,
      Number(amount.value),
      memo.value
    );
    ElMessage.success("转账成功");
    emit("success", {
      amount: Number(amount.value),
      memo: memo.value,
    });
    close();
  } catch (error) {
    console.error("转账失败:", error);
    ElMessage.error("转账失败，请稍后重试");
    emit("error", error);
  } finally {
    isTransferring.value = false;
  }
};
</script>

<style scoped>
.transfer-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.transfer-dialog {
  background: var(--card-bg);
  padding: 20px;
  border-radius: 8px;
  width: 360px;
  max-width: 90%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 1px solid var(--border-color);
}

.transfer-dialog h3 {
  margin: 0 0 16px 0;
  text-align: center;
  font-size: 18px;
  color: var(--text-color);
  font-weight: 600;
}

.form-item {
  margin-bottom: 16px;
}

.form-item label {
  display: block;
  margin-bottom: 6px;
  color: var(--text-color);
  font-weight: 500;
  font-size: 13px;
}

.form-item input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 13px;
  background: var(--card-bg);
  color: var(--text-color);
  transition: all 0.3s;
}

.form-item input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(240, 211, 94, 0.1);
  outline: none;
}

.transfer-tips {
  display: flex;
  align-items: center;
  padding: 10px;
  background-color: var(--hover-bg);
  border-radius: 4px;
  margin-bottom: 16px;
}

.tips-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  background-color: var(--primary-color);
  color: var(--button-text);
  border-radius: 50%;
  margin-right: 6px;
  font-style: normal;
  font-weight: bold;
  font-size: 12px;
}

.transfer-tips span {
  color: var(--point-color);
  font-size: 12px;
}

.dialog-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}

.dialog-buttons button {
  padding: 8px 20px;
  border-radius: 4px;
  cursor: pointer;
  border: none;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.3s;
}

.dialog-buttons button:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.cancel-btn {
  background-color: var(--hover-bg);
  color: var(--text-color);
}

.confirm-btn {
  background-color: var(--button-bg);
  color: var(--button-text);
}

.cancel-btn:hover {
  background-color: var(--card-bg);
}

.confirm-btn:hover:not(:disabled) {
  background-color: var(--primary-color);
}
</style>
