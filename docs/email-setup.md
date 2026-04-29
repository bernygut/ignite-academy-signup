# Email Setup

All outbound emails from Ignite Academy route through **Resend** (resend.com).

---

## Email types and how they are sent

| Email | Triggered by | Sent via |
|---|---|---|
| Signup confirmation (applicant) | Public signup form submission | `send-confirmation` Edge Function |
| New signup notification (admin + group leads) | Public signup form submission | `send-confirmation` Edge Function |
| Approval confirmation (applicant) | Admin changes status → Approved | `send-approval` Edge Function |
| Approval notification (admin + group leads) | Admin changes status → Approved | `send-approval` Edge Function |
| User invitation | Admin sends invite from Users page | Supabase Auth (via Resend SMTP) |
| Password reset | User requests password reset | Supabase Auth (via Resend SMTP) |

---

## Resend API key

The API key is stored as a Supabase secret and is **not** in the codebase:

- **Supabase Dashboard → Project Settings → Edge Functions → Secrets → `RESEND_API_KEY`**

To rotate the key: generate a new one in Resend → API Keys, then update the secret in Supabase and redeploy the Edge Functions.

---

## Custom SMTP for Supabase Auth emails

Supabase Auth's built-in email service has a very low rate limit (~2–3 emails/hour). To remove this limit, Supabase Auth is configured to send through Resend's SMTP server.

**Location:** Supabase Dashboard → Project Settings → Authentication → SMTP Settings

| Setting | Value |
|---|---|
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | Resend API key (`re_…`) |
| Sender name | `Ignite Academy` |
| Sender email | Verified domain address |

The sender domain must be verified in the Resend dashboard (Domains section) via DNS records.

---

## Group lead routing

Approval and signup notifications are sent to group leads based on the applicant's **Grupo Patrocinador** field. Group lead email lists are stored as Supabase secrets:

| Secret | Group |
|---|---|
| `GROUP_LEADS_HOLA` | HOLA |
| `GROUP_LEADS_BAMCCR` | BAMCCR |
| `GROUP_LEADS_FAMILIES` | FAMILIES |
| `GROUP_LEADS_WAM` | WAM |
| `GROUP_LEADS_INDIGENOUS` | INDIGENOUS |
| `GROUP_LEADS_GLEAM` | GLEAM |

Each secret is a comma-separated list of email addresses, e.g. `lead1@org.com,lead2@org.com`.

---

## Edge Function deployment

After any change to the email functions, redeploy with:

```
supabase functions deploy send-confirmation --project-ref xtbdfknuzzyuyqxjsvap
supabase functions deploy send-approval --project-ref xtbdfknuzzyuyqxjsvap
```
