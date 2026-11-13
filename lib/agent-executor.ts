import { getCloudflareContext } from "@opennextjs/cloudflare";

type AgentEnvironment = {
  AI_PROVIDER?: string;
  AI_API_KEY?: string;
  AI_BASE_URL?: string;
  AI_MODEL?: string;
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
  ANTHROPIC_API_KEY?: string;
  ANTHROPIC_MODEL?: string;
  ANTHROPIC_BASE_URL?: string;
};

export type AgentExecutionResult = {
  provider: "openai" | "anthropic";
  model: string;
  output: string;
};

const systemPrompt = [
  "You are a specialist assistant inside ITCM GLOBAL AI.",
  "Produce analysis, plans, drafts, and recommendations only.",
  "You cannot send messages, spend money, publish content, access accounts, or perform external actions.",
  "Never claim an external action was completed.",
  "Identify assumptions, risks, and the next owner decision when relevant.",
  "Keep the response structured and directly useful."
].join(" ");

function resolveProvider(env: AgentEnvironment): "openai" | "anthropic" | null {
  const selected = env.AI_PROVIDER?.trim().toLowerCase();
  if (selected === "openai" || selected === "anthropic") return selected;
  if (env.OPENAI_API_KEY?.trim() || env.AI_API_KEY?.trim()) return "openai";
  if (env.ANTHROPIC_API_KEY?.trim()) return "anthropic";
  return null;
}

function resolveModel(env: AgentEnvironment, provider: "openai" | "anthropic"): string {
  if (provider === "anthropic") return env.ANTHROPIC_MODEL?.trim() || env.AI_MODEL?.trim() || "";
  return env.OPENAI_MODEL?.trim() || env.AI_MODEL?.trim() || "";
}

function resolveKey(env: AgentEnvironment, provider: "openai" | "anthropic"): string {
  if (provider === "anthropic") return env.ANTHROPIC_API_KEY?.trim() || "";
  return env.OPENAI_API_KEY?.trim() || env.AI_API_KEY?.trim() || "";
}

export async function isAgentProviderConfigured(): Promise<boolean> {
  try {
    const context = await getCloudflareContext({ async: true });
    const env = context.env as unknown as AgentEnvironment;
    const provider = resolveProvider(env);
    return Boolean(provider && resolveKey(env, provider) && resolveModel(env, provider));
  } catch {
    return false;
  }
}

export async function executeAgentObjective(input: {
  agentKey: string;
  objective: string;
}): Promise<AgentExecutionResult> {
  const context = await getCloudflareContext({ async: true });
  const env = context.env as unknown as AgentEnvironment;
  const provider = resolveProvider(env);

  if (!provider) throw new Error("AI_PROVIDER_NOT_CONFIGURED");

  const apiKey = resolveKey(env, provider);
  const model = resolveModel(env, provider);
  if (!apiKey || !model) throw new Error("AI_PROVIDER_NOT_CONFIGURED");

  const userPrompt = `Agent role: ${input.agentKey}\nOwner objective: ${input.objective}`;
  let response: Response;

  if (provider === "anthropic") {
    const baseUrl = (env.ANTHROPIC_BASE_URL?.trim() || "https://api.anthropic.com").replace(/\/$/, "");
    response = await fetch(`${baseUrl}/v1/messages`, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        temperature: 0.2,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }]
      }),
      signal: AbortSignal.timeout(45000)
    });
  } else {
    const baseUrl = (env.AI_BASE_URL?.trim() || "https://api.openai.com/v1").replace(/\/$/, "");
    response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ]
      }),
      signal: AbortSignal.timeout(45000)
    });
  }

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500);
    throw new Error(`AI_PROVIDER_HTTP_${response.status}: ${detail}`);
  }

  let output = "";
  let responseModel = model;
  if (provider === "anthropic") {
    const payload = await response.json() as {
      model?: string;
      content?: Array<{ type?: string; text?: string }>;
    };
    responseModel = payload.model || model;
    output = payload.content?.filter((part) => part.type === "text").map((part) => part.text || "").join("\n").trim() || "";
  } else {
    const payload = await response.json() as {
      model?: string;
      choices?: Array<{ message?: { content?: string | null } }>;
    };
    responseModel = payload.model || model;
    output = payload.choices?.[0]?.message?.content?.trim() || "";
  }

  if (!output) throw new Error("AI_PROVIDER_EMPTY_RESPONSE");
  return { provider, model: responseModel, output };
}
