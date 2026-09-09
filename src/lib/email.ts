import { Resend } from "resend";

function getResendClient() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY não configurado.");
  return new Resend(key);
}

const FROM = process.env.RESEND_FROM_EMAIL ?? "naoresponda@palpiteiro-front.vercel.app";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://palpiteiro-front.vercel.app";

/** E-mail de boas-vindas enviado logo após o cadastro confirmado. */
export async function enviarBoasVindas(params: {
  nome: string;
  email: string;
}) {
  const resend = getResendClient();

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#101412;font-family:Inter,Arial,sans-serif;color:#e0e3df;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;padding:32px 16px;">
    <tr>
      <td>
        <!-- Logo / Header -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
          <tr>
            <td style="text-align:center;padding-bottom:24px;">
              <img src="${SITE_URL}/icons/icon-192.png" width="64" height="64"
                alt="Palpiteiro" style="border-radius:12px;" />
              <h1 style="margin:12px 0 4px;font-size:22px;font-weight:700;color:#f5f5f0;">
                Bem-vindo ao Palpiteiro, ${params.nome.split(" ")[0]}!
              </h1>
              <p style="margin:0;font-size:14px;color:#9ca39e;">
                Análises estatísticas da Loteca com IA e dados históricos
              </p>
            </td>
          </tr>
        </table>

        <!-- Corpo -->
        <table width="100%" cellpadding="0" cellspacing="0"
          style="background:#151a17;border:1px solid #232b26;border-radius:12px;padding:24px;margin-bottom:24px;">
          <tr>
            <td>
              <p style="margin:0 0 16px;font-size:16px;color:#e0e3df;">
                Sua conta gratuita está ativa. Com o plano Free você já tem acesso a:
              </p>
              <ul style="margin:0 0 20px;padding-left:20px;color:#9ca39e;font-size:14px;line-height:1.8;">
                <li>3 jogos principais do concurso vigente com probabilidades</li>
                <li>Alertas de zebra nos jogos liberados</li>
                <li>Simulador de volante (modo livre)</li>
                <li>Glossário completo do modelo de análise</li>
              </ul>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align:center;padding:8px 0;">
                    <a href="${SITE_URL}/"
                      style="display:inline-block;background:#1e8449;color:#f0ffee;text-decoration:none;
                             font-weight:600;font-size:15px;padding:12px 32px;border-radius:8px;">
                      Acessar o Palpiteiro →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- CTA VIP -->
        <table width="100%" cellpadding="0" cellspacing="0"
          style="background:#151a17;border:1px solid rgba(212,175,55,0.3);border-radius:12px;padding:20px;margin-bottom:24px;">
          <tr>
            <td>
              <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#d4af37;text-transform:uppercase;letter-spacing:0.05em;">
                Clube VIP Palpiteiro
              </p>
              <p style="margin:0 0 12px;font-size:15px;font-weight:700;color:#f5f5f0;">
                Desbloqueie os 14 jogos com análise completa
              </p>
              <p style="margin:0 0 16px;font-size:13px;color:#9ca39e;line-height:1.6;">
                Secas, duplos e triplos recomendados · Alertas de zebras com EV+ ·
                Boletim por e-mail antes do fechamento
              </p>
              <a href="${SITE_URL}/conta"
                style="display:inline-block;background:#d4af37;color:#0b0f0d;text-decoration:none;
                       font-weight:700;font-size:14px;padding:10px 24px;border-radius:8px;">
                Conhecer o VIP
              </a>
            </td>
          </tr>
        </table>

        <!-- Footer -->
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="text-align:center;padding-top:8px;border-top:1px solid #232b26;">
              <p style="margin:12px 0 4px;font-size:12px;color:#5a5f5c;">
                Palpiteiro · Publicações e listas de análises estatísticas esportivas
              </p>
              <p style="margin:0;font-size:11px;color:#5a5f5c;">
                Independente da Caixa Econômica Federal · +18 anos · Jogue com responsabilidade
              </p>
              <p style="margin:8px 0 0;font-size:11px;color:#5a5f5c;">
                <a href="${SITE_URL}/privacidade" style="color:#5a5f5c;">Privacidade</a> ·
                <a href="${SITE_URL}/termos" style="color:#5a5f5c;">Termos</a> ·
                <a href="${SITE_URL}/contato" style="color:#5a5f5c;">Contato</a>
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;

  return resend.emails.send({
    from: FROM,
    to: params.email,
    subject: `Bem-vindo ao Palpiteiro, ${params.nome.split(" ")[0]}! 🍀`,
    html,
  });
}

/** E-mail de confirmação de ativação VIP após pagamento confirmado. */
export async function enviarConfirmacaoVip(params: {
  nome: string;
  email: string;
  dataFim: Date;
}) {
  const resend = getResendClient();
  const dataFormatada = params.dataFim.toLocaleDateString("pt-BR", {
    day: "2-digit", month: "long", year: "numeric",
  });

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#101412;font-family:Inter,Arial,sans-serif;color:#e0e3df;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;padding:32px 16px;">
    <tr>
      <td>
        <table width="100%" cellpadding="0" cellspacing="0"
          style="background:#151a17;border:1px solid rgba(212,175,55,0.4);border-radius:12px;padding:24px;margin-bottom:24px;">
          <tr>
            <td style="text-align:center;">
              <p style="margin:0 0 8px;font-size:28px;">⭐</p>
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#d4af37;">
                VIP ativado!
              </h1>
              <p style="margin:0 0 20px;font-size:15px;color:#e0e3df;">
                Olá, ${params.nome.split(" ")[0]}! Seu plano VIP está ativo até <strong>${dataFormatada}</strong>.
              </p>
              <ul style="text-align:left;margin:0 0 20px;padding-left:20px;color:#9ca39e;font-size:14px;line-height:1.8;">
                <li>14 jogos com probabilidades e análise completa</li>
                <li>Alertas de zebras com EV+ alto</li>
                <li>Estratégia de duplos e triplos</li>
                <li>Boletim por e-mail antes do fechamento</li>
              </ul>
              <a href="${SITE_URL}/"
                style="display:inline-block;background:#d4af37;color:#0b0f0d;text-decoration:none;
                       font-weight:700;font-size:15px;padding:12px 32px;border-radius:8px;">
                Acessar análise completa →
              </a>
            </td>
          </tr>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="text-align:center;padding-top:8px;border-top:1px solid #232b26;">
              <p style="margin:12px 0 0;font-size:11px;color:#5a5f5c;">
                Palpiteiro · Independente da CEF · +18 anos · Jogue com responsabilidade
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return resend.emails.send({
    from: FROM,
    to: params.email,
    subject: "✅ Seu VIP Palpiteiro está ativo!",
    html,
  });
}
