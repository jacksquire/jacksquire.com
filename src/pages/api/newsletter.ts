import type { APIRoute } from 'astro';

export const prerender = false;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_FORM_ID = '7962105';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const source = typeof body.source === 'string' ? body.source.slice(0, 80) : 'jacksquire';
    const honeypot = typeof body.website === 'string' ? body.website.trim() : '';

    if (honeypot) {
      return Response.json({ subscribed: true });
    }

    if (!EMAIL_PATTERN.test(email)) {
      return Response.json({ subscribed: false, error: 'Enter a valid email address.' }, { status: 400 });
    }

    const formId = import.meta.env.KIT_FORM_ID || import.meta.env.CONVERTKIT_FORM_ID || DEFAULT_FORM_ID;
    const kitApiKey = import.meta.env.KIT_API_KEY;
    let response: Response;

    if (kitApiKey) {
      const subscriber = await fetch('https://api.kit.com/v4/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Kit-Api-Key': kitApiKey },
        body: JSON.stringify({ email_address: email, fields: { source } }),
      });

      if (!subscriber.ok) response = subscriber;
      else {
        response = await fetch(`https://api.kit.com/v4/forms/${formId}/subscribers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Kit-Api-Key': kitApiKey },
          body: JSON.stringify({ email_address: email }),
        });
      }
    } else {
      response = await fetch(`https://app.kit.com/forms/${formId}/subscriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ email_address: email, 'fields[source]': source }),
        redirect: 'follow',
      });
    }

    if (!response.ok) {
      return Response.json({ subscribed: false, error: 'Subscription failed. Try again.' }, { status: 502 });
    }

    return Response.json({ subscribed: true });
  } catch {
    return Response.json({ subscribed: false, error: 'Subscription failed. Try again.' }, { status: 500 });
  }
};
