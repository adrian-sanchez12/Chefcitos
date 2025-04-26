import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY); // Esto sí funciona aquí

export async function POST(req) {
  const { to, subject, body } = await req.json();

  try {
    const response = await resend.emails.send({
      from: "onboarding@resend.dev", 
      to,
      subject,
      html: `<div style="font-family: sans-serif;">${body}</div>`,
    });

    return Response.json({ success: true, data: response });
  } catch (error) {
    console.error("Error enviando correo:", error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
