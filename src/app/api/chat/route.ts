import { NextRequest } from "next/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const SYSTEM_PROMPT = `Voce e um assistente educacional para uma Calculadora de Vantagem Tributaria do PGBL.

REGRAS:
- Sempre explique conceitos em portugues brasileiro (pt-BR) claro e acessivel.
- Quando disponivel, use o contexto da simulacao do usuario (valores, premissas, break-even) para personalizar respostas.
- Seja explicito sobre premissas e limitacoes; nunca finja conhecer a situacao fiscal completa do usuario.
- NAO forneca aconselhamento fiscal, juridico ou de investimentos personalizado. Sugira consultar um contador para orientacao definitiva.
- Se perguntado sobre aliquotas ou regras atuais, refira-se ao ano-base configurado e recomende verificar no site da Receita Federal.
- Use os numeros da simulacao do usuario sempre que possivel em vez de calcular do zero.
- Mantenha respostas concisas (2-4 paragrafos) a menos que o usuario peca mais detalhes.
- Se o usuario escrever em ingles, responda em ingles.

CONCEITOS-CHAVE:
- PGBL: Plano Gerador de Beneficio Livre. Contribuicoes sao dedutiveis do IR ate 12% da renda tributavel (declaracao completa + contribuicao para INSS).
- No resgate, o IR incide sobre o valor TOTAL (principal + rendimentos).
- O beneficio vem do diferimento: o imposto economizado hoje e reinvestido.
- Tabela regressiva: 35% (0-2 anos) ate 10% (>10 anos).
- VGBL: sem deducao, IR apenas sobre rendimentos no resgate.
- A(N,Y,Z) = patrimonio sem PGBL; B(N,Y,Xout,Xin,Z,D) = patrimonio com PGBL + reembolso reinvestido.
- Delta anualizado = B^(1/N) - A^(1/N) em pontos-base.`;

export async function POST(req: NextRequest) {
  if (!OPENAI_API_KEY) {
    return new Response(
      JSON.stringify({
        error:
          "Chave da API OpenAI nao configurada. Configure OPENAI_API_KEY nas variaveis de ambiente.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const { messages, simulationContext } = await req.json();

    // Build context message
    let contextMsg = "";
    if (simulationContext) {
      contextMsg = `\n\nCONTEXTO DA SIMULACAO ATUAL DO USUARIO:\n${JSON.stringify(simulationContext, null, 2)}`;
    }

    // Only allow user/assistant roles from client to prevent system prompt injection
    const validRoles = new Set(["user", "assistant"]);
    const sanitizedMessages = Array.isArray(messages)
      ? messages
          .filter((m: any) => validRoles.has(m.role) && typeof m.content === "string")
          .map((m: any) => ({ role: m.role as string, content: m.content as string }))
      : [];

    const apiMessages = [
      { role: "system", content: SYSTEM_PROMPT + contextMsg },
      ...sanitizedMessages,
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: apiMessages,
        stream: true,
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `OpenAI API error: ${response.status}` }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    // Stream the response
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data: ")) continue;
            const data = trimmed.slice(6);
            if (data === "[DONE]") {
              controller.close();
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                controller.enqueue(encoder.encode(content));
              }
            } catch {
              // skip invalid JSON
            }
          }
        }

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
