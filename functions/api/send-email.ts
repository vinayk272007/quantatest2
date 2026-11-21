// Cloudflare Pages function — proxies email sends to the Resend API.
// Only RESEND_API_KEY is needed (set in Cloudflare Pages environment variables).
// Returns 503 if the key is missing so the client can handle gracefully.

interface SendEmailBody {
  to: string;
  subject: string;
  html: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export const onRequestPost: PagesFunction = async ({ request }) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const apiKey = (request as unknown as { RESEND_API_KEY?: string }).RESEND_API_KEY
    ?? (globalThis as Record<string, unknown>).RESEND_API_KEY as string | undefined;

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Email service is not configured.' }), {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json() as SendEmailBody;
    if (!body.to || !body.subject || !body.html) {
      return new Response(JSON.stringify({ error: 'Missing required fields (to, subject, html).' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const fromEmail = (globalThis as Record<string, unknown>).RESEND_FROM_EMAIL as string | undefined ?? 'onboarding@resend.dev';
    const fromName = 'QuantaPrep';

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: [body.to],
        subject: body.subject,
        html: body.html,
      }),
    });

    if (!resendResponse.ok) {
      const errText = await resendResponse.text();
      return new Response(JSON.stringify({ error: 'Email provider rejected the request.', detail: errText }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = await resendResponse.json();
    return new Response(JSON.stringify({ success: true, id: result.id ?? null }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message ?? 'Unexpected error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};
