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
    Trả về JSON với các trường:
    - topic: Tên ngắn gọn của chủ đề.
    - positiveLabel: Nhãn Dương tính (Positive) nghĩa là gì (ví dụ: "Là thư rác", "Bị bệnh").
    - negativeLabel: Nhãn Âm tính (Negative) nghĩa là gì.
    - description: Mô tả ngắn về bài toán.
    - fpConsequence: Hậu quả của False Positive (Dương tính giả) trong ngữ cảnh này.
    - fnConsequence: Hậu quả của False Negative (Âm tính giả) trong ngữ cảnh này.
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
          },
          required: ["topic", "positiveLabel", "negativeLabel", "description", "fpConsequence", "fnConsequence"]
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
      fnConsequence: "Bỏ sót bệnh, bệnh nhân không được điều trị kịp thời, nguy hiểm tính mạng."
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