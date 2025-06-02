<template>
  <div class="register-container">
    <div class="register-content">
      <!-- 左侧注册表单 -->
      <div class="register-box">
        <div class="register-header">
          <h2>注册账号</h2>
          <p class="register-subtitle">欢迎加入摸鱼派</p>
        </div>
        <div class="form-content">
          <!-- 第一步：基本信息 -->
          <div v-if="currentStep === 1">
            <div class="form-item">
              <div class="input-wrapper">
                <i class="fas fa-user"></i>
                <input
                  v-model="form.userName"
                  type="text"
                  placeholder="用户名,允许数字/英文"
                  @keyup.enter="nextStep"
                />
              </div>
            </div>
            <div class="form-item">
              <div class="input-wrapper">
                <i class="fas fa-phone"></i>
                <input
                  v-model="form.userPhone"
                  type="text"
                  placeholder="手机号码"
                  @keyup.enter="nextStep"
                />
              </div>
            </div>
            <div class="form-item">
              <div class="input-wrapper">
                <i class="fas fa-user-friends"></i>
                <input
                  v-model="form.invitecode"
                  type="text"
                  placeholder="邀请码（选填）"
                  @keyup.enter="nextStep"
                />
              </div>
            </div>
            <div class="form-item captcha-item">
              <div class="input-wrapper">
                <i class="fas fa-shield-alt"></i>
                <input
                  v-model="form.captcha"
                  type="text"
                  placeholder="图形验证码"
                  @keyup.enter="nextStep"
                />
              </div>
              <img
                :src="captchaUrl"
                alt="验证码"
                class="captcha-img"
                @click="refreshCaptcha"
              />
            </div>
            <div class="form-item">
              <button
                class="register-btn"
                :disabled="loading"
                @click="nextStep"
              >
                <span v-if="loading" class="loading-spinner"></span>
                {{ loading ? "处理中..." : "下一步" }}
              </button>
            </div>
          </div>

          <!-- 第二步：验证码 -->
          <div v-if="currentStep === 2">
            <div class="form-item">
              <div class="input-wrapper">
                <i class="fas fa-key"></i>
                <input
                  v-model="form.smsCode"
                  type="text"
                  placeholder="短信验证码"
                  @keyup.enter="verifySmsCode"
                />
              </div>
            </div>
            <div class="form-item">
              <button
                class="register-btn"
                :disabled="loading"
                @click="verifySmsCode"
              >
                <span v-if="loading" class="loading-spinner"></span>
                {{ loading ? "验证中..." : "验证" }}
              </button>
            </div>
          </div>

          <!-- 第三步：设置密码和邮箱 -->
          <div v-if="currentStep === 3">
            <div class="form-item">
              <div class="input-wrapper">
                <i class="fas fa-lock"></i>
                <input
                  v-model="form.userPassword"
                  type="password"
                  placeholder="设置密码"
                  @keyup.enter="completeRegister"
                />
              </div>
            </div>
            <div class="form-item">
              <div class="input-wrapper">
                <i class="fas fa-envelope"></i>
                <input
                  v-model="form.userEmail"
                  type="email"
                  placeholder="邮箱"
                  @keyup.enter="completeRegister"
                />
              </div>
            </div>
            <div class="form-item">
              <div class="role-select">
                <label>
                  <input
                    type="radio"
                    v-model="form.userAppRole"
                    :value="0"
                    name="role"
                  />
                  黑客
                </label>
                <label>
                  <input
                    type="radio"
                    v-model="form.userAppRole"
                    :value="1"
                    name="role"
                  />
                  画家
                </label>
              </div>
            </div>
            <div class="form-item">
              <button
                class="register-btn"
                :disabled="loading"
                @click="completeRegister"
              >
                <span v-if="loading" class="loading-spinner"></span>
                {{ loading ? "注册中..." : "完成注册" }}
              </button>
            </div>
          </div>

          <div class="form-footer">
            <a href="#" class="footer-link" @click.prevent="goToLogin">
              <i class="fas fa-arrow-left"></i>
              返回登录
            </a>
          </div>
        </div>
      </div>

      <!-- 右侧欢迎文案 -->
      <div class="welcome-section">
        <h2>Hi，鱼油，欢迎来到摸鱼派！</h2>
        <p class="welcome-subtitle">
          如果你也是奋斗在一线、热爱工作的苦逼青年，期待与众多鱼油聚集起来，那就加入友好的摸鱼派社区吧！
          ❤️
        </p>
        <div class="welcome-text">
          <p>
            在这里有为你准备的聊天室、鱼游、充满生活感的帖子，只要来到摸鱼派，你就是我们的家庭成员～这里以「友善」为第一守则，你可以完全放开自己，和鱼油们畅所欲言，邂逅各行各业的搬砖人，参与摸鱼派有趣的活动
            :)
          </p>
          <p>
            日常、闲聊、生活、吐槽、提问、技术、读书、游戏、兴趣 ......
            都可以在摸鱼派中讨论。
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from "vue";
import { userApi } from "../api";
import MD5 from "crypto-js/md5";
import { useRouter } from "vue-router";

const router = useRouter();
const loading = ref(false);
const currentStep = ref(1);
const captchaUrl = ref("/captcha");
const userId = ref("");

const form = reactive({
  userName: "",
  userPhone: "",
  invitecode: "",
  captcha: "",
  smsCode: "",
  userPassword: "",
  userEmail: "",
  userAppRole: 0,
});

// 刷新验证码
const refreshCaptcha = () => {
  captchaUrl.value = `https://fishpi.cn/captcha`;
};

// 下一步
const nextStep = async () => {
  if (currentStep.value === 1) {
    if (!form.userName || !form.userPhone || !form.captcha) {
      utools.showNotification("请填写完整信息");
      return;
    }

    try {
      loading.value = true;
      await userApi.register({
        userName: form.userName,
        userPhone: form.userPhone,
        invitecode: form.invitecode,
        captcha: form.captcha,
      });
      currentStep.value = 2;
      utools.showNotification("验证码已发送");
    } catch (error) {
      utools.showNotification(error.message || "发送验证码失败");
      refreshCaptcha();
    } finally {
      loading.value = false;
    }
  }
};

// 验证短信验证码
const verifySmsCode = async () => {
  if (!form.smsCode) {
    utools.showNotification("请输入验证码");
    return;
  }

  try {
    loading.value = true;
    const result = await userApi.verifyCode(form.smsCode);
    if (result.code === 0) {
      userId.value = result.userId;
      currentStep.value = 3;
    } else {
      utools.showNotification("验证码错误");
    }
  } catch (error) {
    utools.showNotification(error.message || "验证失败");
  } finally {
    loading.value = false;
  }
};

// 完成注册
const completeRegister = async () => {
  if (!form.userPassword || !form.userEmail) {
    utools.showNotification("请填写完整信息");
    return;
  }

  try {
    loading.value = true;
    const result = await userApi.completeRegister(
      {
        userAppRole: form.userAppRole,
        userPassword: MD5(form.userPassword).toString(),
        userId: userId.value,
        userEmail: form.userEmail,
      },
      form.invitecode
    );

    if (result.code === 0) {
      utools.showNotification("注册成功");
      goToLogin();
    } else {
      utools.showNotification("注册失败");
    }
  } catch (error) {
    utools.showNotification(error.message || "注册失败");
  } finally {
    loading.value = false;
  }
};

// 返回登录页
const goToLogin = () => {
  router.push("/login");
};

// 初始化时刷新验证码
refreshCaptcha();
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #ffffff;
  position: relative;
  overflow: hidden;
}

.register-content {
  display: flex;
  width: 900px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  border: 1px solid #f0f0f0;
}

.register-box {
  width: 380px;
  background: white;
  padding: 40px;
  border-right: 1px solid #f0f0f0;
}

.welcome-section {
  flex: 1;
  padding: 40px;
  background: #fafafa;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.welcome-section h2 {
  margin: 0 0 20px;
  font-size: 28px;
  font-weight: 500;
  color: #000;
}

.welcome-subtitle {
  margin: 0 0 24px;
  font-size: 16px;
  color: #666;
  line-height: 1.6;
}

.welcome-text {
  color: #666;
  font-size: 14px;
  line-height: 1.8;
}

.welcome-text p {
  margin: 0 0 16px;
}

.welcome-text p:last-child {
  margin-bottom: 0;
}

.register-header {
  text-align: center;
  margin-bottom: 30px;
}

.register-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 500;
  color: #000;
}

.register-subtitle {
  margin: 8px 0 0;
  font-size: 14px;
  color: #666;
}

.form-content {
  width: 100%;
}

.form-item {
  margin-bottom: 18px;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-wrapper i {
  position: absolute;
  left: 12px;
  color: #999;
  font-size: 16px;
  transition: color 0.3s ease;
}

input {
  width: 100%;
  padding: 10px 10px 10px 35px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 14px;
  transition: all 0.3s ease;
  background: #ffffff;
}

input:focus {
  border-color: #000;
  background: #fff;
  box-shadow: none;
  outline: none;
}

.captcha-item {
  display: flex;
  gap: 10px;
}

.captcha-item .input-wrapper {
  flex: 1;
}

.captcha-img {
  height: 40px;
  border-radius: 4px;
  cursor: pointer;
}

.register-btn {
  width: 100%;
  padding: 10px;
  background: #000;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.register-btn:disabled {
  background: #e0e0e0;
  cursor: not-allowed;
  color: #999;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.form-footer {
  text-align: center;
  margin-top: 24px;
  font-size: 13px;
}

.footer-link {
  color: #666;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: color 0.3s ease;
  padding: 2px 4px;
  border-radius: 4px;
}

.footer-link:hover {
  color: #000;
}

.role-select {
  display: flex;
  gap: 20px;
  justify-content: center;
}

.role-select label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: #666;
}

.role-select input[type="radio"] {
  width: auto;
  margin: 0;
}
</style>
