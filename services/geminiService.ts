import { GoogleGenAI, Type } from "@google/genai";
import { Scenario } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");
  return new GoogleGenAI({ apiKey });
};

export const generateScenario = async (topic: string): Promise<Scenario> => {
  try {
    const ai = getClient();
    
    const prompt = `Tạo một kịch bản phân loại nhị phân (binary classification) thực tế về chủ đề: "${topic}".
    Trả về JSON với các trường mô tả văn bản và CÁC THAM SỐ MÔ PHỎNG (simulation) ước lượng cho bài toán này:

    1. topic: Tên ngắn gọn.
    2. positiveLabel: Nhãn Positive (VD: "Gian lận").
    3. negativeLabel: Nhãn Negative (VD: "Hợp lệ").
    4. description: Mô tả ngắn.
    5. fpConsequence: Hậu quả FP.
    6. fnConsequence: Hậu quả FN.
    7. simulation: Object chứa các số liệu ước lượng thực tế:
       - separation (0.1 đến 0.9): Bài toán này dễ hay khó phân biệt? (0.2=Rất khó/Chồng lấn nhiều, 0.8=Rất dễ/Tách biệt rõ).
       - noise (0.1 đến 0.3): Độ nhiễu dữ liệu (thường khoảng 0.15).
       - balance (0.05 đến 0.95): Tỉ lệ Positive trong thực tế (VD: Gian lận/Ung thư rất hiếm ~0.05-0.1, Spam ~0.3-0.5).

    Trả lời bằng tiếng Việt.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            positiveLabel: { type: Type.STRING },
            negativeLabel: { type: Type.STRING },
            description: { type: Type.STRING },
            fpConsequence: { type: Type.STRING },
            fnConsequence: { type: Type.STRING },
            simulation: {
                type: Type.OBJECT,
                properties: {
                    separation: { type: Type.NUMBER },
                    noise: { type: Type.NUMBER },
                    balance: { type: Type.NUMBER }
                },
                required: ["separation", "noise", "balance"]
            }
          },
          required: ["topic", "positiveLabel", "negativeLabel", "description", "fpConsequence", "fnConsequence", "simulation"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as Scenario;
    }
    throw new Error("No response text");
  } catch (error) {
    console.error("Gemini generation error:", error);
    // Fallback scenario
    return {
      topic: "Mặc định: Chẩn đoán bệnh",
      positiveLabel: "Bị bệnh",
      negativeLabel: "Khỏe mạnh",
      description: "Mô hình AI phân tích ảnh X-quang để phát hiện khối u.",
      fpConsequence: "Bệnh nhân lo lắng vô cớ, tốn kém chi phí xét nghiệm thêm.",
      fnConsequence: "Bỏ sót bệnh, bệnh nhân không được điều trị kịp thời, nguy hiểm tính mạng.",
      simulation: {
          separation: 0.4,
          noise: 0.15,
          balance: 0.3
      }
    };
  }
};

export const askExplanation = async (concept: string, scenario: Scenario): Promise<string> => {
    try {
        const ai = getClient();
        const prompt = `Giải thích ngắn gọn (dưới 60 từ) ý nghĩa của tham số hoặc chỉ số "${concept}" trong ngữ cảnh cụ thể của bài toán này:
        - Bài toán: ${scenario.description}
        - Dương tính (Positive): ${scenario.positiveLabel}
        - Âm tính (Negative): ${scenario.negativeLabel}
        
        Hãy giải thích xem khi tham số này tăng/giảm thì nó ảnh hưởng thế nào đến việc phân loại (dễ hay khó, nhiều lỗi hay ít lỗi). Trả lời bằng tiếng Việt đơn giản.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        return response.text || "Không thể tạo giải thích.";
    } catch (error) {
        return "Lỗi khi kết nối AI.";
    }
}