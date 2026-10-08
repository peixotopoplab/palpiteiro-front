"use server";

import { Resend } from "resend";

export interface ContatoState {
  error: string | null;
  success: boolean;
}

export async function enviarContato(
  _prev: ContatoState,
  formData: FormData
): Promise<ContatoState> {
  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const assunto = String(formData.get("assunto") ?? "").trim();
  const mensagem = String(formData.get("mensagem") ?? "").trim();

  if (!nome || !email || !mensagem) {
    return { error: "Preencha todos os campos obrigatórios.", success: false };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Digite um e-mail válido.", success: false };
  }
  if (mensagem.length < 10) {
    return { error: "A mensagem precisa ter pelo menos 10 caracteres.", success: false };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[contato] RESEND_API_KEY não configurada");
    return { error: "Serviço de e-mail indisponível. Tente mais tarde.", success: false };
  }

  try {
    const resend = new Resend(apiKey);
    const adminEmail = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

    await resend.emails.send({
      from: adminEmail,
      to: adminEmail,
      replyTo: email,
      subject: `[Contato Palpiteiro] ${assunto || "Mensagem do site"}`,
      html: `
        <p><strong>Nome:</strong> ${nome}</p>
        <p><strong>E-mail:</strong> ${email}</p>
        <p><strong>Assunto:</strong> ${assunto || "Não informado"}</p>
        <hr>
        <p>${mensagem.replace(/\n/g, "<br>")}</p>
      `,
    });

    return { error: null, success: true };
  } catch (err) {
    console.error("[contato] erro ao enviar:", err);
    return { error: "Não foi possível enviar a mensagem. Tente novamente.", success: false };
  }
}
