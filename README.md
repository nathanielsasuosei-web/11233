# 🎧 Beatvault — Beat Store for Music Producers

A complete beat-selling website: the producer uploads beats and videos from an admin
dashboard, artists create accounts, pay by **Mobile Money** or **bank transfer**, and the
files are **delivered by email** the moment payment clears.

Built with Next.js 14 (App Router), Tailwind CSS, SQLite and Paystack.

---

## ✨ What it does

### For the producer (`/admin`)
- **Upload beats** — audio master, tagged preview, cover art, BPM, key, mood, genre, tags
- **Four licence tiers per beat** with independent pricing (Basic / Premium / Exclusive / Buyout)
- **Upload videos** — YouTube links or video files, optionally linked to a beat
- **Orders dashboard** — see everything sold, resend delivery emails, mark orders paid,
  refund, reset download counters
- **Artists & subscribers** — who bought what, and lifetime spend
- **Message inbox** — read enquiries and reply; the reply is emailed to the artist
- **Email outbox** — every message the site composed, previewable as HTML
- **Settings** — brand, hero copy, currency, Paystack keys, bank + MoMo details

### For artists
- Create an account, log in, keep a permanent **library** of everything bought
- Preview every beat inline before buying
- Cart + checkout with **Mobile Money (MTN / Vodafone / AirtelTigo)**, **bank transfer** or **card**
- Files **emailed instantly** plus re-downloadable from `/dashboard/library`
- Message the producer and read replies in-thread

### Automation
- Payment success → order marked paid → beat sales counter bumped →
  **exclusive/buyout purchases automatically retire the beat from the store** →
  delivery email sent with per-item, rate-limited download links.

---

## 🚀 Quick start

```bash
npm install
npm run demo:media   # generates playable demo beats + cover art
npm run dev          # http://localhost:3000
```

The database is created and seeded on first request. No configuration needed.

### Demo logins

| Role    | URL          | Email                 | Password    |
| ------- | ------------ | --------------------- | ----------- |
| Producer| `/admin/login` | `admin@beatvault.gh` | `admin123`  |
| Artist  | `/login`     | `artist@example.com`  | `artist123` |

Both are overridable with the `ADMIN_EMAIL` / `ADMIN_PASSWORD` env vars.
**Change them before going live.**

---

## 💳 Taking real payments

Out of the box the store runs a **simulated checkout** so you can test the complete
purchase → email → download flow with no keys. To go live:

1. Create a [Paystack](https://paystack.com) account (Ghana, Nigeria, South Africa, Kenya).
2. Put your keys in `.env.local` **or** paste them into `Admin → Settings → Payments`:

   ```env
   PAYSTACK_SECRET_KEY=sk_live_xxxxxxxxxxxx
   NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_xxxxxxxxxxxx
   ```

3. Add the webhook URL in your Paystack dashboard:

   ```
   https://your-domain.com/api/paystack/webhook
   ```

4. The simulated checkout disables itself automatically once a secret key is present.

Mobile money, bank transfer, USSD, QR and card channels are all requested from Paystack;
the buyer picks one at checkout and it is recorded on the order.

---

## 📧 Email delivery

Delivery emails are **always composed**. Whether they are actually sent depends on SMTP:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=Beatvault <orders@beatvault.gh>
```

Without SMTP the app stays fully functional: every message is rendered and stored in
**Admin → Email outbox**, where you can preview the exact HTML the customer would receive.
This makes the whole flow testable before you own a domain.

Emails sent: welcome, beat delivery (with download links), order notification to the
producer, contact-form notification, and producer replies.

---

## 🗄 Storage

Uploads default to local disk (`public/uploads`). To use S3-compatible storage
(AWS S3, Cloudflare R2, MinIO, Backblaze B2, Wasabi…):

```env
S3_BUCKET=beatvault
S3_REGION=auto
S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_PUBLIC_URL=https://cdn.your-domain.com
```

The storage driver is selected automatically — no code changes needed.

---

## 🧱 Tech notes

| Concern  | Choice |
| -------- | ------ |
| Framework| Next.js 14 App Router (server components + route handlers) |
| Styling  | Tailwind CSS with a custom red/ink design system |
| Database | SQLite via the `node:sqlite` built-in — **zero native compilation** |
| Auth     | Signed JWT session cookies (`jose`) + bcrypt password hashing |
| Payments | Paystack (mobile money, bank, card, USSD) with HMAC-verified webhooks |
| Email    | Nodemailer SMTP with an outbox fallback |
| Storage  | Local disk or S3-compatible object storage |

### Layout

```
src/
  app/
    page.tsx                 animated homepage / hero
    beats/                   catalogue + beat detail
    videos/  about/  contact/  licensing/
    login/  register/        artist auth
    dashboard/               artist library, messages, account
    admin/                   producer dashboard (beats, videos, orders,
                             artists, messages, outbox, settings)
    api/                     auth, checkout, download, contact, admin CRUD
  components/                UI (Hero, BeatCard, players, managers…)
  lib/
    db.ts                    schema, migrations, seeding, query helpers
    auth.ts  paystack.ts  mailer.ts  storage.ts  complete.ts  fulfill.ts
scripts/make-demo-media.mjs  synthesises the demo beats & cover art
```

### Security notes

- Prices are **always recalculated server-side** from the database — the client only
  sends beat IDs and licence names.
- Download links are unguessable per-item tokens, limited to 5 downloads, and locked
  until the order is paid.
- Paystack webhooks are verified with an HMAC-SHA512 signature.
- Session cookies are `httpOnly`, `sameSite=lax`, and `secure` in production.
- Admin routes are guarded by a role claim checked on the server.
- Set a strong `AUTH_SECRET` in production.

---

## 📜 Scripts

```bash
npm run dev        # dev server on 0.0.0.0:3000
npm run build      # production build
npm run start      # serve the production build
npm run typecheck  # TypeScript, no emit
npm run demo:media # regenerate demo beats + covers
```

## 🐛 Troubleshooting

**Beats show "no preview"** — the audio file was never uploaded, or you cloned fresh and
`public/uploads` is empty. Run `npm run demo:media` or upload a file in the admin editor.

**Emails not arriving** — check `Admin → Email outbox`. If the status is `stored`, SMTP is
not configured yet.

**"Demo mode" banner at checkout** — no Paystack secret key is set. Add one and it disappears.

**Reset everything** — delete `data/beatvault.db` and restart; the schema and demo content
are recreated automatically.
