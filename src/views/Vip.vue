<template>
    <div class="vip-page">
        <section class="vip-hero">
            <div class="hero-text">
                <p class="vip-tag">联合会员 · FishPI 高级权益</p>
                <h1>升级昵称，让存在感拉满</h1>
                <p class="subtitle">
                    四档会员按月/按年自由选择，昵称样式、签到特权、积分免税、联合会员等权益一次解锁。
                </p>
                <div class="hero-cards">
                    <article v-for="tier in vipTiers" :key="tier.id" class="hero-card">
                        <header>
                            <h3>{{ tier.name }}</h3>
                            <p>{{ tier.tagline }}</p>
                        </header>
                        <strong>{{ tier.monthly }} 积分/月</strong>
                        <button class="btn" :class="{
                            disabled: currentUserVipInfo && currentUserVipInfo.state !== 0,
                        }" @click="purchaseTier(tier)">
                            {{
                                currentUserVipInfo && currentUserVipInfo.state !== 0
                                    ? "已是VIP"
                            : "立即开通"
                            }}
                        </button>
                    </article>
                </div>
            </div>
        </section>

        <section class="vip-status-card" v-if="currentUserVipInfo && currentUserVipInfo.state !== 0">
            <div class="status-text">
                <p>
                    欢迎 <span class="vip-level">{{ vipProfile.plan }}</span> 用户
                </p>
                <p>
                    会员到期时间：
                    <span class="vip-expire">{{ vipProfile.expireAt }}</span>
                </p>
            </div>
            <div class="status-actions">
                <p class="preview-label">效果预览</p>
                <div class="nickname-preview" :class="[
                    `${previewEffect}`,
                    { bold: isBold, underline: hasUnderline },
                ]" :style="nicknamePreviewStyles">
                    {{ previewText }}
                </div>
                <div class="preview-tools">
                    <button class="outline" :class="{ active: isBold }" @click="isBold = !isBold">
                        加粗
                    </button>
                    <button class="outline" :class="{ active: hasUnderline }" @click="hasUnderline = !hasUnderline">
                        下划线
                    </button>
                    <label class="color-picker" v-if="vipLevel != 'VIP1'">
                        <span>颜色</span>
                        <input type="color" v-model="nicknameColor" @input="handleColorInput" />
                    </label>
                </div>
                <div class="effect-grid" v-if="vipLevel == 'VIP4'">
                    <p class="effect-title">VIP 至尊版专属权益</p>
                    <small>部分渐变效果不支持下划线</small>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px">
                        <button v-for="effect in nicknameEffects" :key="effect.key" class="effect-chip" :class="{
                            active: previewEffect === effect.key,
                            [effect.key]: true,
                        }" @click="applyEffect(effect.key)">
                            {{ effect.label }}
                        </button>
                    </div>
                </div>
                <div class="config-actions">
                    <button class="btn ghost" @click="resetPreview">恢复默认</button>
                    <button class="btn" @click="saveConfig">保存配置</button>
                </div>
            </div>
        </section>

        <section class="pricing">
            <header class="pricing-header">
                <div>
                    <p class="section-tag">PRICING</p>
                    <h2>选择适合您的方案</h2>
                    <p class="subtitle">按月灵活，按年更省积分</p>
                </div>
                <div class="pricing-tabs">
                    <button v-for="tab in billingTabs" :key="tab.value" class="pricing-tab"
                        :class="{ active: billingPeriod === tab.value }" @click="billingPeriod = tab.value">
                        {{ tab.label }}
                    </button>
                </div>
            </header>

            <div class="pricing-grid">
                <article v-for="tier in priceTiers" :key="tier.id" class="pricing-card"
                    :class="{ popular: tier.popular }">
                    <div class="popular-badge" v-if="tier.popular">最受欢迎</div>
                    <header>
                        <h3>{{ tier.name }}</h3>
                        <p>{{ tier.description }}</p>
                    </header>
                    <div class="price-block">
                        <p class="price">
                            <span>{{ displayPrice(tier) }}</span>
                            <small>{{ billingPeriod === "monthly" ? "/月" : "/年" }}</small>
                        </p>
                        <p class="saving" v-if="billingPeriod === 'yearly'">
                            节省 {{ tier.savings }} 积分
                        </p>
                    </div>
                    <ul class="feature-list">
                        <li v-for="feature in tier.features" :key="feature">
                            <i class="fas fa-check"></i>
                            <span>{{ feature }}</span>
                        </li>
                    </ul>
                    <button class="btn" :class="{
                        disabled: currentUserVipInfo && currentUserVipInfo.state !== 0,
                    }" @click="purchaseTier(tier)">
                        {{
                            currentUserVipInfo && currentUserVipInfo.state !== 0
                                ? "已是VIP"
                                : "立即开通"
                        }}
                    </button>
                </article>
            </div>
        </section>

        <section class="faq-section">
            <p class="section-tag">FAQ</p>
            <h2>常见问题</h2>
            <div class="accordion">
                <article v-for="(item, index) in faqList" :key="item.question" class="accordion-item">
                    <button class="accordion-header" @click="toggleFaq(index)">
                        <span class="faq-question">{{ item.question }}</span>
                        <i :class="['fas', activeFaq === index ? 'fa-minus' : 'fa-plus']" class="faq-icon"></i>
                    </button>
                    <div class="accordion-content" :style="{ maxHeight: activeFaq === index ? '200px' : '0px' }">
                        <p class="faq-answer">{{ item.answer }}</p>
                    </div>
                </article>
            </div>
        </section>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { vipApi } from "../api";
import { useUserStore } from "../stores/user";
import { VipStore } from "../stores/vip";

const userStore = useUserStore();
const vipStore = VipStore();

const vipProfile = ref({
    plan: "",
    expireAt: "",
});

const vipLevel = ref("");

const vipListData = ref([]);
const currentUserVipInfo = ref(null);

// 解析benefits JSON字符串为功能列表
const parseBenefits = (benefitsStr) => {
    if (!benefitsStr) return [];
    try {
        const benefits = JSON.parse(benefitsStr);
        const features = [];

        if (benefits.bold) features.push("昵称加粗");
        if (benefits.underline) features.push("昵称下划线");
        console.log("benefits:", benefits);

        if (benefits.checkinCard) {
            features.push(`免签卡(年付): ${benefits.checkinCard} 张`);
        }
        if (benefits.metal) features.push("DIY 动态勋章");
        if (benefits.jointVip) features.push("联合会员");
        if (benefits.autoCheckin !== undefined && benefits.autoCheckin !== null) {
            features.push("自动签到(年付)");
        }
        if (benefits.color) {
            if (!benefits.jointVip) {
                features.splice(2, 0, "昵称颜色");
            } else {
                features.splice(2, 0, "昵称渐变");
                features.push("全站积分交易免税");
            }
        }

        return features;
    } catch (e) {
        console.error("解析benefits失败:", e);
        return [];
    }
};

// 计算节省的积分
const calculateSavings = (monthlyPrice, yearlyPrice) => {
    return monthlyPrice * 12 - yearlyPrice;
};

// 从lvCode提取VIP等级和类型
const parseLvCode = (lvCode) => {
    const match = lvCode.match(/VIP(\d)_(MONTH|YEAR)/);
    if (match) {
        return {
            level: `VIP${match[1]}`,
            type: match[2] === "MONTH" ? "monthly" : "yearly",
        };
    }
    return { level: "", type: "" };
};

// 计算vipTiers（只显示月卡版本）
const vipTiers = computed(() => {
    const monthlyTiers = vipListData.value.filter(
        (item) => item.durationType === "月卡"
    );
    const levelMap = {
        VIP1: { name: "尝鲜版", tagline: "入门特权，轻松拥有" },
        VIP2: { name: "基础版", tagline: "昵称颜色 + 免签卡" },
        VIP3: { name: "高级版", tagline: "DIY 勋章，全面升级" },
        VIP4: { name: "至尊版", tagline: "联合会员，特权全开" },
    };

    return monthlyTiers
        .map((item) => {
            const { level } = parseLvCode(item.lvCode);
            const baseInfo = levelMap[level] || { name: item.lvName, tagline: "" };
            const currentLvCode = currentUserVipInfo.value?.lvCode || "";

            return {
                id: level,
                name: baseInfo.name,
                tagline: baseInfo.tagline,
                monthly: item.price,
                isCurrent: currentLvCode === item.lvCode,
            };
        })
        .sort((a, b) => {
            const order = { VIP1: 1, VIP2: 2, VIP3: 3, VIP4: 4 };
            return (order[a.id] || 0) - (order[b.id] || 0);
        });
});

// 计算priceTiers（包含月卡和年卡）
const priceTiers = computed(() => {
    const tiersMap = new Map();

    vipListData.value.forEach((item) => {
        const { level } = parseLvCode(item.lvCode);
        if (!level) return;

        if (!tiersMap.has(level)) {
            tiersMap.set(level, {
                id: level,
                name: item.lvName,
                description: getTierDescription(level),
                monthlyPrice: 0,
                yearlyPrice: 0,
                savings: 0,
                features: [],
                popular: level === "VIP2",
            });
        }

        const tier = tiersMap.get(level);
        if (item.durationType === "月卡") {
            tier.monthlyPrice = item.price;
            // 如果还没有功能列表，使用月卡的benefits
            if (tier.features.length === 0) {
                tier.features = parseBenefits(item.benefits);
            }
        } else if (item.durationType === "年卡") {
            tier.yearlyPrice = item.price;
            tier.savings = calculateSavings(tier.monthlyPrice, item.price);
            // 使用年卡的benefits作为功能列表（通常更完整）
            tier.features = parseBenefits(item.benefits);
        }
    });

    // 设置isCurrent状态
    const currentLvCode = currentUserVipInfo.value?.lvCode || "";
    tiersMap.forEach((tier) => {
        const monthlyItem = vipListData.value.find(
            (item) =>
                parseLvCode(item.lvCode).level === tier.id &&
                item.durationType === "月卡"
        );
        const yearlyItem = vipListData.value.find(
            (item) =>
                parseLvCode(item.lvCode).level === tier.id &&
                item.durationType === "年卡"
        );

        tier.isCurrent =
            (monthlyItem && currentLvCode === monthlyItem.lvCode) ||
            (yearlyItem && currentLvCode === yearlyItem.lvCode);
    });

    return Array.from(tiersMap.values()).sort((a, b) => {
        const order = { VIP1: 1, VIP2: 2, VIP3: 3, VIP4: 4 };
        return (order[a.id] || 0) - (order[b.id] || 0);
    });
});

// 获取等级描述
const getTierDescription = (level) => {
    const descriptions = {
        VIP1: "化繁为简的轻量特权",
        VIP2: "最受欢迎的均衡方案",
        VIP3: "进阶玩家定制体验",
        VIP4: "联合会员 + 全站免税",
    };
    return descriptions[level] || "";
};

const billingTabs = [
    { label: "按月计费", value: "monthly" },
    { label: "按年计费", value: "yearly" },
];

const billingPeriod = ref("monthly");

const displayPrice = (tier) =>
    billingPeriod.value === "monthly"
        ? `${tier.monthlyPrice} 积分`
        : `${tier.yearlyPrice} 积分`;

const COLOR_EFFECT = "plain";

const previewText = ref(userStore.userNickname || "drda");
const nicknameColor = ref("#f03e3e");
const isBold = ref(true);
const hasUnderline = ref(false);
const previewEffect = ref("rainbow");

// 从configJson更新预览配置
const updatePreviewFromConfig = (configJson) => {
    if (!configJson) return;
    try {
        const config = JSON.parse(configJson);
        if (config.bold !== undefined) isBold.value = config.bold;
        if (config.underline !== undefined) hasUnderline.value = config.underline;
        if (config.color) {
            // 如果是渐变效果（字符串如 "rainbow", "neon"等）
            if (typeof config.color === "string" && !config.color.startsWith("#")) {
                // 检查是否是有效的渐变效果
                const validEffects = nicknameEffects.map((e) => e.key);
                if (validEffects.includes(config.color)) {
                    previewEffect.value = config.color;
                } else {
                    previewEffect.value = COLOR_EFFECT;
                    nicknameColor.value = "#f03e3e";
                }
            } else {
                // 如果是颜色值
                previewEffect.value = COLOR_EFFECT;
                nicknameColor.value = config.color;
            }
        } else {
            // 如果没有颜色配置，默认使用纯色
            previewEffect.value = COLOR_EFFECT;
        }
    } catch (e) {
        console.error("解析configJson失败:", e);
    }
};

const nicknameEffects = [
    { key: "rainbow", label: "彩虹效果" },
    { key: "neon", label: "霓虹效果" },
    { key: "fire", label: "火焰效果" },
    { key: "ocean", label: "海洋效果" },
    { key: "forest", label: "森林效果" },
    { key: "sunset", label: "日落效果" },
    { key: "metal", label: "金属效果" },
    { key: "galaxy", label: "星空效果" },
];

const nicknamePreviewStyles = computed(() => ({
    color: previewEffect.value === COLOR_EFFECT ? nicknameColor.value : "inherit",
    "--custom-color": nicknameColor.value,
}));

const handleColorInput = (event) => {
    previewEffect.value = COLOR_EFFECT;
    if (event?.target?.value) {
        nicknameColor.value = event.target.value;
    }
};

const applyEffect = (effectKey) => {
    previewEffect.value = effectKey;
};

const resetPreview = () => {
    previewText.value = userStore.userNickname || "drda";
    nicknameColor.value = "#f03e3e";
    isBold.value = true;
    hasUnderline.value = false;
    previewEffect.value = "rainbow";

    // 如果有当前用户的配置，恢复到原始配置
    if (currentUserVipInfo.value?.configJson) {
        updatePreviewFromConfig(currentUserVipInfo.value.configJson);
    }
};

const saveConfig = async () => {
    try {
        const config = {
            bold: isBold.value,
            underline: hasUnderline.value,
            color:
                previewEffect.value === COLOR_EFFECT
                    ? nicknameColor.value
                    : previewEffect.value,
        };

        // 如果当前用户有VIP4，可能还有metal和jointVip等配置
        if (currentUserVipInfo.value?.configJson) {
            try {
                const existingConfig = JSON.parse(currentUserVipInfo.value.configJson);
                if (existingConfig.metal !== undefined)
                    config.metal = existingConfig.metal;
                if (existingConfig.jointVip !== undefined)
                    config.jointVip = existingConfig.jointVip;
                if (existingConfig.autoCheckin !== undefined)
                    config.autoCheckin = existingConfig.autoCheckin;
            } catch (e) {
                console.error("解析现有配置失败:", e);
            }
        }

        const params = JSON.stringify({
            configJson: config,
        });
        console.log("vipConfig", params);
        let res = await vipApi.upVipUserConfig(params);
        console.log(res);
        ElMessage.success("昵称样式已保存");

        // 更新当前用户的配置信息
        if (currentUserVipInfo.value) {
            currentUserVipInfo.value.configJson = JSON.stringify(config);
        }
    } catch (error) {
        console.error("保存配置失败:", error);
        ElMessage.error("保存配置失败");
    }
};
//开通会员
const purchaseTier = async (tier) => {
    if (currentUserVipInfo.value && currentUserVipInfo.value.state !== 0) {
        return;
    }

    ElMessageBox.confirm(
        `确定要开通 ${tier.name} ${billingPeriod.value === "monthly" ? "月卡" : "年卡"
        } 吗？此操作不可恢复。`,
        "确认开通",
        {
            confirmButtonText: "确认",
            cancelButtonText: "取消",
            type: "warning",
        }
    )
        .then(async () => {
            try {
                // 根据当前选择的计费周期和等级，找到对应的VIP套餐
                const durationType =
                    billingPeriod.value === "monthly" ? "月卡" : "年卡";
                const targetItem = vipListData.value.find(
                    (item) =>
                        parseLvCode(item.lvCode).level === tier.id &&
                        item.durationType === durationType
                );

                if (!targetItem) {
                    ElMessage.error("未找到对应的VIP套餐");
                    return;
                }
                // 调用购买API
                let p = { oId: targetItem.oId };
                const res = await vipApi.buyVip(p);

                if (res.code === 0) {
                    ElMessage.success(`已成功开通 ${tier.name}${durationType}`);
                    // 刷新VIP信息
                    if (userStore.userInfo?.userOId) {
                        await getVipUserInfo(userStore.userInfo.userOId);
                    }
                } else {
                    ElMessage.error(res.message || "开通失败");
                }
            } catch (error) {
                // ElMessage.error("购买失败，请稍后重试");
            }
        })
        .catch(() => {
            // 用户取消购买
        });
};

const faqList = [
    {
        question: "是否可以申请退款？",
        answer: "不可以。",
    },
    {
        question: "什么是联合会员？",
        answer:
            "联合会员是 FishPI 机器人开放平台的高级特权，一次订阅即可在所有接入的第三方机器人应用中解锁高级功能。",
    },
    {
        question: "是否支持从低会员升级高会员？",
        answer: "暂不支持，请在当前会员到期后重新开通目标等级。",
    },
    {
        question: "DIY 动态勋章是永久的吗？",
        answer: "不是，勋章仅在会员有效期内有效，会员过期后会回收。",
    },
];

const activeFaq = ref(null);
const toggleFaq = (index) => {
    activeFaq.value = activeFaq.value === index ? null : index;
};
// 获取会员列表
const getVipList = async () => {
    try {
        let res = await vipApi.getVipList();
        if (res.code == 0) {
            vipListData.value = res.data || [];
        } else {
            ElMessage.error(res.message || "获取会员列表失败");
        }
    } catch (error) {
        console.error("获取会员列表异常:", error);
        ElMessage.error("获取会员列表失败");
    }
};

// 获取会员列表信息（所有用户的配置，可选）
const getVipUser = async () => {
    try {
        let res = await vipApi.getVipUser();
        if (res.code == 0) {
            // 这个接口返回所有用户的配置，可以根据需要处理
            // 当前主要用于了解其他用户的配置情况
        } else {
            console.warn("获取会员列表信息失败:", res.message);
        }
    } catch (error) {
        console.error("获取会员列表信息异常:", error);
    }
};

// 获取会员个人信息
const getVipUserInfo = async (userId) => {
    try {
        let res = await vipApi.getVipUserInfo(userId);
        if (res.code == 0) {
            if (res.data && res.data.state !== 0) {
                // 用户有VIP
                currentUserVipInfo.value = res.data;

                // 更新vipProfile
                const { level, type } = parseLvCode(res.data.lvCode);
                const tierName =
                    vipListData.value.find((item) => item.lvCode === res.data.lvCode)
                        ?.lvName || level;

                vipLevel.value = level;

                vipProfile.value = {
                    plan: `${type === "monthly" ? "月费" : "年费"} ${tierName} ${level}`,
                    expireAt: res.data.expiresAt
                        ? new Date(res.data.expiresAt).toLocaleString("zh-CN", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                        })
                        : "",
                };

                // 更新预览配置
                if (res.data.configJson) {
                    updatePreviewFromConfig(res.data.configJson);
                    previewText.value = userStore.userNickname || "drda";
                }
            } else {
                // 用户没有VIP
                currentUserVipInfo.value = null;
                vipProfile.value = {
                    plan: "",
                    expireAt: "",
                };
            }
        } else {
            ElMessage.error(res.message || "获取会员配置失败");
        }
    } catch (error) {
        console.error("获取会员配置异常:", error);
        ElMessage.error("获取会员配置失败");
    }
};

onMounted(async () => {
    // 获取用户信息后再获取VIP信息
    await getVipUserInfo(userStore.userInfo.oId);
    // 并行获取数据
    await Promise.all([getVipList(), getVipUser()]);
});
</script>

<style scoped>
.vip-page {
    padding: 32px;
    background: var(--background-color);
    color: var(--text-color);
    display: flex;
    flex-direction: column;
    gap: 32px;
    height: 100%;
    overflow-y: auto;
}

.vip-hero {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 24px;
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 16px;
    padding: 32px;
}

.hero-text h1 {
    font-size: 32px;
    margin: 12px 0;
}

.subtitle {
    color: var(--sub-text-color);
    max-width: 460px;
}

.vip-tag,
.section-tag {
    font-size: 12px;
    letter-spacing: 0.1em;
    color: var(--primary-color);
    text-transform: uppercase;
}

.hero-cards {
    margin-top: 20px;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 10px;
}

.hero-card {
    padding: 10px;
    border-radius: 12px;
    border: 1px solid var(--border-color);
    background: var(--chatroom-bg);
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.hero-card strong {
    font-size: 20px;
}

.btn {
    border: none;
    border-radius: 8px;
    background: var(--primary-color);
    color: var(--button-text);
    padding: 10px 18px;
    cursor: pointer;
    transition: opacity 0.2s ease;
}

.btn.ghost {
    background: transparent;
    border: 1px solid var(--primary-color);
    color: var(--primary-color);
}

.btn.disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.vip-status-card {
    background: var(--card-bg);
    border-radius: 16px;
    border: 1px solid var(--border-color);
    padding: 32px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 32px;
}

.vip-level,
.vip-expire {
    color: #ff6b6b;
    font-weight: 600;
}

.status-actions {
    border-top: 1px dashed var(--border-color);
    padding-top: 32px;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.nickname-preview {
    font-size: 32px;
    padding: 16px 24px;
    border-radius: 12px;
    border: 1px dashed var(--border-color);
    width: fit-content;
    min-width: 200px;
}

.nickname-preview[class*="effect-"] {
    transition: background 0.3s ease, color 0.3s ease, text-shadow 0.3s ease;
}

.nickname-preview.effect-plain {
    color: var(--custom-color);
}

.nickname-preview.effect-rainbow {
    background: linear-gradient(90deg, #ff6b6b, #feca57, #48dbfb, #5f27cd);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.nickname-preview.effect-neon {
    color: #39ff14;
    text-shadow: 0 0 8px rgba(57, 255, 20, 0.8), 0 0 16px rgba(57, 255, 20, 0.6);
}

.nickname-preview.effect-fire {
    background: linear-gradient(180deg, #ffd700, #ff8c00, #ff4500);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.nickname-preview.effect-ocean {
    background: linear-gradient(180deg, #00c6ff, #0072ff);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.nickname-preview.effect-forest {
    background: linear-gradient(180deg, #a8e063, #56ab2f);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.nickname-preview.effect-sunset {
    background: linear-gradient(180deg, #ff9966, #ff5e62);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.nickname-preview.effect-metal {
    color: #d7d7d7;
    text-shadow: 0 1px 1px rgba(255, 255, 255, 0.8), 0 -1px 1px rgba(0, 0, 0, 0.2);
}

.nickname-preview.effect-galaxy {
    background: linear-gradient(120deg, #8e2de2, #4a00e0, #06beb6);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.nickname-preview.bold {
    font-weight: 800;
}

.nickname-preview.underline {
    text-decoration: underline;
}

.preview-tools {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
}

.outline {
    border: 1px solid var(--border-color);
    background: transparent;
    padding: 8px 16px;
    border-radius: 999px;
    cursor: pointer;
    color: var(--text-color);
}

.outline.active {
    border-color: var(--primary-color);
    color: var(--primary-color);
}

.color-picker {
    display: flex;
    align-items: center;
    gap: 8px;
    border: 1px solid var(--border-color);
    border-radius: 999px;
    padding: 6px 12px;
}

.color-picker input {
    border: none;
    background: transparent;
    cursor: pointer;
    width: 32px;
    height: 32px;
}

.nickname-preview.effect-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.nickname-preview.effect-title {
    width: 100%;
    font-weight: 600;
    margin-bottom: 4px;
}

.effect-chip {
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 8px 12px;
    cursor: pointer;
    color: var(--text-color);
}

.effect-chip.active {
    border-color: var(--primary-color);
    background-color: #ff6b6b;
    color: #fff;
}

.config-actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
}

.pricing {
    background: var(--card-bg);
    border-radius: 16px;
    border: 1px solid var(--border-color);
    padding: 32px;
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.pricing-header {
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 16px;
}

.pricing-tabs {
    display: inline-flex;
    padding: 4px;
    border-radius: 999px;
    background: var(--chatroom-bg);
}

.pricing-tab {
    border: none;
    background: transparent;
    padding: 8px 18px;
    border-radius: 999px;
    cursor: pointer;
}

.pricing-tab.active {
    background: var(--card-bg);
    color: var(--primary-color);
    font-weight: 600;
}

.pricing-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 16px;
}

.pricing-card {
    border: 1px solid var(--border-color);
    border-radius: 14px;
    background: var(--chatroom-bg);
    padding: 24px;
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.pricing-card.popular {
    border-color: var(--primary-color);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
}

.popular-badge {
    position: absolute;
    top: 12px;
    right: 12px;
    background: var(--primary-color);
    color: var(--button-text);
    border-radius: 999px;
    padding: 4px 12px;
    font-size: 12px;
}

.price-block {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.price {
    font-size: 24px;
    font-weight: 700;
}

.price small {
    font-size: 14px;
    margin-left: 4px;
    color: var(--sub-text-color);
}

.saving {
    color: var(--primary-color);
    font-weight: 600;
}

.feature-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
    color: var(--sub-text-color);
}

.feature-list i {
    color: var(--primary-color);
    margin-right: 8px;
}

.faq-section {
    background: var(--card-bg);
    border-radius: 16px;
    border: 1px solid var(--border-color);
    padding: 32px;
}

.accordion {
    margin-top: 24px;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.accordion-item {
    border: 1px solid var(--border-color);
    border-radius: 12px;
}

.accordion-header {
    width: 100%;
    border: none;
    background: transparent;
    padding: 16px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;
    cursor: pointer;
}

.accordion-content {
    overflow: hidden;
    transition: max-height 0.25s ease;
    padding: 0 20px;
}

.accordion-content p {
    margin: 0;
    padding-bottom: 16px;
    color: var(--sub-text-color);
}

.faq-question {
    color: var(--text-color);
}

.faq-icon {
    color: var(--text-color);
}

.faq-answer {
    color: var(--sub-text-color);
}

@media (max-width: 900px) {
    .status-actions {
        padding-top: 24px;
    }

    .pricing-header {
        flex-direction: column;
    }
}
</style>
