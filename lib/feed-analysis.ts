import { generateObject } from "ai";
import { gateway } from "@ai-sdk/gateway";
import { z } from "zod";
import type { DogContext } from "@/lib/dog-context";

// Vercel AI Gateway slug — anthropic/claude-sonnet-4.6 (vision-capable Sonnet, confirmed in @ai-sdk/gateway GatewayModelId union)
export const MODEL = "anthropic/claude-sonnet-4.6";

const schema = z.object({
  rating: z.number().int().min(1).max(5),
  summary: z.string(),
  nutrients: z.array(z.object({ label: z.string(), value: z.string() })),
  cautions: z.array(z.object({ ingredient: z.string(), reason: z.string() })),
  benefits: z.array(z.string()),
});

export type FeedAnalysisResult = z.infer<typeof schema>;

function buildPrompt(dog: DogContext): string {
  const lines = [
    `강아지 "${dog.name}"의 보호자가 사료 봉지의 성분표 사진을 올렸습니다.`,
    `사진의 보장성분·원료명을 읽고, 이 강아지에게 적합한지 한국어로 평가하세요.`,
    `강아지 정보: 이름 ${dog.name}` +
      (dog.ageText ? `, 나이 ${dog.ageText}` : "") +
      (dog.weight != null ? `, 체중 ${dog.weight}kg` : ""),
    dog.diseases.length
      ? `등록된 지병: ${dog.diseases.join(", ")}. 이 지병 관점에서 주의해야 할 성분을 cautions에 반드시 짚어주세요.`
      : `등록된 지병 없음.`,
    `규칙:`,
    `- rating은 이 강아지 기준 종합 점수 1~5(5가 가장 좋음).`,
    `- nutrients엔 성분표에서 읽은 핵심 영양(예: 조단백, 조지방)을 label/value로.`,
    `- cautions엔 이 강아지에게 주의할 성분과 그 이유. 없으면 빈 배열.`,
    `- benefits엔 좋은 특징. 없으면 빈 배열.`,
    `- 성분표가 사진에서 읽히지 않으면 rating을 1~2로 낮추고 summary에 그 사실을 적으세요.`,
  ];
  return lines.join("\n");
}

export async function analyzeFeedLabel(input: {
  imageUrl: string;
  dog: DogContext;
}): Promise<{ result: FeedAnalysisResult; model: string }> {
  const { object } = await generateObject({
    model: gateway(MODEL),
    schema,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: buildPrompt(input.dog) },
          { type: "file", mediaType: "image", data: new URL(input.imageUrl) },
        ],
      },
    ],
  });
  return { result: object, model: MODEL };
}
