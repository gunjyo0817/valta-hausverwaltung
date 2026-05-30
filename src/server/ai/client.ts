import { getServerEnv } from "@/server/env";

type ResponsesApiContent = {
  type?: string;
  text?: string;
};

type ResponsesApiOutput = {
  content?: ResponsesApiContent[];
};

type ResponsesApiPayload = {
  output_text?: string;
  output?: ResponsesApiOutput[];
  error?: {
    message?: string;
  };
};

export function getConfiguredAiModel() {
  return getServerEnv().OPENAI_MODEL ?? "gpt-4.1-mini";
}

function extractOutputText(payload: ResponsesApiPayload) {
  if (typeof payload.output_text === "string") return payload.output_text;

  for (const item of payload.output ?? []) {
    for (const content of item.content ?? []) {
      if (typeof content.text === "string") return content.text;
    }
  }

  return "";
}

export async function requestOpenAiJson<T>(input: {
  system: string;
  prompt: string;
}): Promise<{ model: string; output: T }> {
  const env = getServerEnv();
  if (!env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const model = env.OPENAI_MODEL ?? "gpt-4.1-mini";
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      instructions: input.system,
      input: input.prompt,
      text: { format: { type: "json_object" } },
      max_output_tokens: 1200,
    }),
  });

  const payload = (await response.json()) as ResponsesApiPayload;
  if (!response.ok) {
    throw new Error(payload.error?.message ?? `OpenAI request failed with HTTP ${response.status}`);
  }

  const text = extractOutputText(payload);
  if (!text) throw new Error("OpenAI response did not include text output");

  return {
    model,
    output: JSON.parse(text) as T,
  };
}
