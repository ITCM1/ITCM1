import { getCloudflareContext } from "@opennextjs/cloudflare";

type AgentEnvironment = {
  AI_API_KEY?: string;
  AI_BASE_URL?: string;
  AI_MODEL?: string;
};

export type AgentExecutionResult = {
  provider: "openai-compatible";
  model: string;
  output: string;
};

export async function executeAgentObjective(input: {
  agentKey: string;
  objective: string;
}): Promise<AgentExecutionResult> {
  const context = await getCloudflareContext({ async: true });
  const env = context.env as unknown as AgentEnvironment;
  const apiKey = env.AI_API_KEY?.trim();
  const model = env.AI_MODEL?.trim();

  if (!apiKey || !model) {
    throw new Error("AI_PROVIDER_NOT_CONFIGURED");
  }

  const baseUrl = (env.AI_BASE_URL?.trim() || "https://api.openai.com/v1").replace(/\/$/, "");
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: [
            "You are a specialist assistant inside ITCM GLOBAL AI.",
            "Produce analysis, plans, drafts, and recommendations only.",
            "You cannot send messages, spend money, publish content, access accounts, or perform external actions.",
            "Never claim an external action was completed.",
            "Identify assumptions, risks, and the next owner decision when relevant.",
            "Keep the response structured and directly useful."
          ].join(" ")
        },
        {
          role: "user",
          content: `Agent role: ${input.agentKey}\nOwner objective: ${input.objective}`
        }
      ]
    }),
    signal: AbortSignal.timeout(45000)
  });

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500);
    throw new Error(`AI_PROVIDER_HTTP_${response.status}: ${detail}`);
  }

  const payload = await response.json() as {
    model?: string;
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  const output = payload.choices?.[0]?.message?.content?.trim();
  if (!output) throw new Error("AI_PROVIDER_EMPTY_RESPONSE");

  return {
    provider: "openai-compatible",
    model: payload.model || model,
    output
  };
}
