export const EMOJI_REACTIONS = [
  { value: "thumbsup", emoji: "👍", label: "赞" },
  { value: "plus", emoji: "➕1️⃣", label: "+1" },
  { value: "thumbsdown", emoji: "👎", label: "反对" },
  { value: "check", emoji: "✅", label: "通过" },
  { value: "cross", emoji: "❌", label: "不通过" },
  { value: "star", emoji: "⭐", label: "收藏" },
  { value: "heart", emoji: "❤️", label: "喜欢" },
  { value: "fire", emoji: "🔥", label: "热门" },
  { value: "party", emoji: "🎉", label: "庆祝" },
  { value: "laugh", emoji: "😂", label: "好笑" },
  { value: "wow", emoji: "😮", label: "惊讶" },
  { value: "clap", emoji: "👏", label: "鼓掌" },
  { value: "hundred", emoji: "💯", label: "满分" },
  { value: "rocket", emoji: "🚀", label: "起飞" },
  { value: "salute", emoji: "🖖", label: "致意" },
  { value: "handshake", emoji: "🤝", label: "握手" },
  { value: "raisedhands", emoji: "🙌", label: "欢呼" },
  { value: "mindblown", emoji: "🤯", label: "震惊" },
  { value: "thinking", emoji: "🤔", label: "思考" },
  { value: "eyes", emoji: "👀", label: "围观" },
  { value: "cry", emoji: "😢", label: "难过" },
  { value: "angry", emoji: "😡", label: "生气" },
  { value: "pray", emoji: "🙏", label: "拜托" },
  { value: "brokenheart", emoji: "💔", label: "破防" },
  { value: "heartonfire", emoji: "❤️‍🔥", label: "上头" },
  { value: "skull", emoji: "💀", label: "笑死" },
  { value: "clown", emoji: "🤡", label: "小丑" },
  { value: "poop", emoji: "💩", label: "吐槽" },
];

export function reactionEmoji(value) {
  return EMOJI_REACTIONS.find((r) => r.value === value)?.emoji || "😀";
}

