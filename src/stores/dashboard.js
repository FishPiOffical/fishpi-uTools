import { defineStore } from "pinia";
import { ref } from "vue";

export const useDashboardStore = defineStore("dashboard", () => {
  // 节假日相关状态
  const holidayName = ref("");
  const holidayDays = ref(null);
  const isHolidayToday = ref(false);
  const holidayMessage = ref("正在获取节假日信息...");
  const lastHolidayUpdate = ref(null);

  // 每日一言相关状态
  const dailyQuote = ref("");
  const quoteAuthor = ref("");
  const lastQuoteUpdate = ref(null);

  // 节日祝福语映射
  const holidayGreetings = {
    元旦: "新年快乐！愿新的一年里，万事如意，心想事成！",
    春节: "新春快乐！祝您阖家欢乐，幸福安康！",
    元宵节: "元宵节快乐！记得吃汤圆哦~",
    清明节: "清明时节雨纷纷，路上行人欲断魂。",
    劳动节: "劳动节快乐！感谢每一位辛勤的劳动者！",
    端午节: "端午节快乐！今天吃粽子了吗？",
    中秋节: "中秋快乐！月圆人团圆，记得吃月饼哦~",
    国庆节: "国庆节快乐！祝祖国繁荣昌盛！",
    重阳节: "重阳节快乐！祝您健康长寿！",
    腊八节: "腊八节快乐！记得喝腊八粥哦~",
    除夕: "除夕快乐！祝您阖家团圆，幸福美满！",
  };

  // 获取节日祝福语
  const getHolidayGreeting = (holidayName) => {
    return (
      holidayGreetings[holidayName] || `今天是${holidayName}，祝您节日快乐！`
    );
  };

  // 获取下一个节假日
  const fetchNextHoliday = async () => {
    try {
      // 检查是否需要更新（每天只更新一次）
      const now = new Date();
      const today = now.toDateString();
      if (lastHolidayUpdate.value === today) {
        return;
      }

      // 首先获取今天的日期
      const todayStr = now.toISOString().split("T")[0];

      // 先检查今天是否是节假日
      const todayRes = await fetch(
        `https://timor.tech/api/holiday/info/${todayStr}`
      );
      const todayData = await todayRes.json();

      if (todayData.code === 0) {
        // 如果今天是节假日
        if (todayData.holiday && todayData.holiday.holiday) {
          holidayName.value = todayData.holiday.name;
          holidayDays.value = "今天";
          isHolidayToday.value = true;
          holidayMessage.value = getHolidayGreeting(todayData.holiday.name);
          lastHolidayUpdate.value = today;
          return;
        }
      }

      // 如果今天不是节假日，获取下一个节假日
      const nextRes = await fetch("https://timor.tech/api/holiday/next");
      const nextData = await nextRes.json();

      if (nextData.holiday) {
        holidayName.value = nextData.holiday.name;
        // 计算距离天数
        const holidayDate = new Date(nextData.holiday.date);
        // 只算天数，不考虑时分秒
        const diffTime =
          holidayDate.setHours(0, 0, 0, 0) - now.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        holidayDays.value = diffDays;

        // 如果是当天，显示"今天"
        if (diffDays === 0) {
          holidayDays.value = "今天";
          isHolidayToday.value = true;
          holidayMessage.value = getHolidayGreeting(nextData.holiday.name);
        } else {
          isHolidayToday.value = false;
          holidayMessage.value = `距离${nextData.holiday.name}还有${diffDays}天`;
        }
      } else {
        holidayName.value = "未知";
        holidayDays.value = "-";
        isHolidayToday.value = false;
        holidayMessage.value = "暂无节假日信息";
      }
      lastHolidayUpdate.value = today;
    } catch (e) {
      console.error("获取节假日信息失败:", e);
      holidayName.value = "未知";
      holidayDays.value = "-";
      isHolidayToday.value = false;
      holidayMessage.value = "获取节假日信息失败";
    }
  };

  // 获取每日一言
  const fetchDailyQuote = async () => {
    try {
      // 检查是否需要更新（每天只更新一次）
      const now = new Date();
      const today = now.toDateString();
      if (lastQuoteUpdate.value === today) {
        return;
      }

      const response = await fetch(
        "https://international.v1.hitokoto.cn/?c=d&c=i&c=k&min_length=20&max_length=50"
      );
      const data = await response.json();
      if (data) {
        dailyQuote.value = data.hitokoto;
        quoteAuthor.value = data.from_who || data.from || "佚名";
        lastQuoteUpdate.value = today;
      }
    } catch (error) {
      // 设置一些默认的名言
      const defaultQuotes = [
        {
          text: "生活就像一盒巧克力，你永远不知道下一颗是什么味道。",
          author: "阿甘正传",
        },
        {
          text: "种一棵树最好的时间是十年前，其次是现在。",
          author: "中国谚语",
        },
        { text: "不要等待机会，而要创造机会。", author: "林肯" },
        {
          text: "与其用华丽的外衣装饰自己，不如用知识武装自己。",
          author: "莎士比亚",
        },
        { text: "把时间用在思考上是最能节省时间的事情。", author: "卡曾斯" },
      ];
      const randomQuote =
        defaultQuotes[Math.floor(Math.random() * defaultQuotes.length)];
      dailyQuote.value = randomQuote.text;
      quoteAuthor.value = randomQuote.author;
      lastQuoteUpdate.value = today;
    }
  };

  return {
    // 状态
    holidayName,
    holidayDays,
    isHolidayToday,
    holidayMessage,
    dailyQuote,
    quoteAuthor,
    // 方法
    fetchNextHoliday,
    fetchDailyQuote,
  };
});
