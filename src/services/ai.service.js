const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate chat suggestions based on conversation context
 * @param {array} messages - Recent messages (10-20 messages)
 * @param {object} currentUser - Current user info
 * @param {object} otherUser - Other user info
 * @returns {array} 3 suggested replies
 */
const generateChatSuggestions = async (messages, currentUser, otherUser) => {
  try {
    // Build conversation context
    const conversationContext = messages
      .map((msg) => {
        const isCurrentUser =
          msg.sender._id.toString() === currentUser._id.toString();
        const senderName = isCurrentUser ? currentUser.name : otherUser.name;
        return `${senderName}: ${msg.text}`;
      })
      .join("\n");

    // Build user profiles context
    const currentUserProfile = buildUserProfile(currentUser);
    const otherUserProfile = buildUserProfile(otherUser);

    const systemPrompt = 
    `Bạn là một chuyên gia hẹn hò và giao tiếp. Nhiệm vụ của bạn là gợi ý 3 câu trả lời cho người dùng trong ứng dụng hẹn hò.

    NGUYÊN TẮC:
    1. Câu trả lời phải TỰ NHIÊN, không sáo rỗng
    2. Phù hợp với NGỮ CẢNH cuộc trò chuyện
    3. THÚ VỊ và LÔI CUỐN để tạo ấn tượng tốt
    4. Có thể TÁN TỈNH nhẹ nhàng, dí dỏm nếu phù hợp
    5. Dựa trên SỞ THÍCH CHUNG để tạo kết nối
    6. Mỗi gợi ý có PHONG CÁCH KHÁC NHAU:
    - Gợi ý 1: Thân thiện, ấm áp
    - Gợi ý 2: Hài hước, dí dỏm
    - Gợi ý 3: Lãng mạn, tán tỉnh nhẹ nhàng

    THÔNG TIN NGƯỜI DÙNG HIỆN TẠI:
    ${currentUserProfile}

    THÔNG TIN NGƯỜI ĐANG CHAT:
    ${otherUserProfile}

    QUAN TRỌNG:
    - Trả lời bằng tiếng Việt nếu cuộc trò chuyện bằng tiếng Việt
    - Trả lời bằng tiếng Anh nếu cuộc trò chuyện bằng tiếng Anh
    - Mỗi câu trả lời ngắn gọn 1-3 câu
    - Có thể dùng emoji phù hợp 😊
    - KHÔNG dùng những câu sáo rỗng như "Bạn thật tuyệt vời"
    - Phải CỤ THỂ dựa trên nội dung cuộc trò chuyện`;

    const userPrompt = `LỊCH SỬ CUỘC TRÒ CHUYỆN GẦN ĐÂY:
    ${conversationContext || "(Chưa có tin nhắn nào)"}

---

Hãy đưa ra 3 gợi ý trả lời cho ${currentUser.name} để reply tin nhắn của ${
      otherUser.name
    }.

Trả về JSON theo format:
{
  "suggestions": [
    {
      "text": "Câu trả lời 1",
      "style": "friendly",
      "emoji": "😊"
    },
    {
      "text": "Câu trả lời 2", 
      "style": "humorous",
      "emoji": "😄"
    },
    {
      "text": "Câu trả lời 3",
      "style": "flirty",
      "emoji": "😉"
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.8, // Creativity level
      max_tokens: 300,
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content);

    console.log("✅ AI suggestions generated:", result.suggestions.length);

    return result.suggestions;
  } catch (error) {
    console.error("❌ AI suggestion error:", error);
    throw new Error("Failed to generate suggestions");
  }
};

/**
 * Build user profile string for context
 */
const buildUserProfile = (user) => {
  const parts = [];

  if (user.name) parts.push(`Tên: ${user.name}`);
  if (user.age) parts.push(`Tuổi: ${user.age}`);
  if (user.occupation) parts.push(`Nghề nghiệp: ${user.occupation}`);
  if (user.bio) parts.push(`Bio: ${user.bio}`);
  if (user.interests && user.interests.length > 0) {
    parts.push(`Sở thích: ${user.interests.join(", ")}`);
  }
  if (user.location?.city) parts.push(`Thành phố: ${user.location.city}`);

  return parts.join("\n") || "Không có thông tin";
};

/**
 * Generate ice breaker suggestions (for first message)
 * @param {object} currentUser - Current user info
 * @param {object} otherUser - Other user info
 * @returns {array} 3 ice breaker suggestions
 */
const generateIceBreakerSuggestions = async (currentUser, otherUser) => {
  try {
    const currentUserProfile = buildUserProfile(currentUser);
    const otherUserProfile = buildUserProfile(otherUser);

    // Find common interests
    const commonInterests = findCommonInterests(
      currentUser.interests || [],
      otherUser.interests || []
    );

    const systemPrompt = 
    `Bạn là một chuyên gia hẹn hò. Nhiệm vụ của bạn là gợi ý 3 câu mở đầu cuộc trò chuyện cho người dùng trong ứng dụng hẹn hò.

    NGUYÊN TẮC:
    1. Câu mở đầu phải ẤN TƯỢNG và KHÁC BIỆT
    2. KHÔNG dùng "Hi", "Hello", "Xin chào" đơn thuần
    3. Dựa vào SỞ THÍCH CHUNG hoặc THÔNG TIN PROFILE để tạo kết nối
    4. Đặt CÂU HỎI để khơi gợi cuộc trò chuyện
    5. Có thể tán tỉnh nhẹ nhàng, dí dỏm

    THÔNG TIN NGƯỜI DÙNG HIỆN TẠI:
        ${currentUserProfile}

    THÔNG TIN NGƯỜI MUỐN NHẮN TIN:
        ${otherUserProfile}

    SỞ THÍCH CHUNG: ${
        commonInterests.length > 0 ? commonInterests.join(", ") : "Không tìm thấy"
    }`;

    const userPrompt = 
    `Hãy đưa ra 3 câu mở đầu cuộc trò chuyện cho ${currentUser.name} để bắt đầu chat với ${otherUser.name}.

    Trả về JSON theo format:
    {
        "suggestions": [
            {
            "text": "Câu mở đầu 1",
            "style": "curious",
            "basedOn": "interest/bio/occupation"
            },
            {
            "text": "Câu mở đầu 2",
            "style": "playful", 
            "basedOn": "interest/bio/occupation"
            },
            {
            "text": "Câu mở đầu 3",
            "style": "charming",
            "basedOn": "interest/bio/occupation"
            }
        ]
    }`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.9,
      max_tokens: 300,
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content);

    console.log(
      "✅ Ice breaker suggestions generated:",
      result.suggestions.length
    );

    return result.suggestions;
  } catch (error) {
    console.error("❌ Ice breaker suggestion error:", error);
    throw new Error("Failed to generate ice breakers");
  }
};

/**
 * Find common interests between two users
 */
const findCommonInterests = (interests1, interests2) => {
  if (!interests1 || !interests2) return [];
  return interests1.filter((interest) =>
    interests2.some((i) => i.toLowerCase() === interest.toLowerCase())
  );
};

module.exports = {
  generateChatSuggestions,
  generateIceBreakerSuggestions,
};
