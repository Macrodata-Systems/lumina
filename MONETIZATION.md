# How to Monetize Your Chrome Extension

Google **deprecated** the Chrome Web Store Payments system years ago. You **cannot** charge users directly through the store anymore. You must use a third-party payment provider.

## 1. The Core Models for AI Extensions

### A. The "Bring Your Own Key" (BYOK) + Pro Features (Recommended for Lumina)
**How it works:**
- **Free:** Users use their own API keys (Gemini, OpenAI, etc.). Basic functionality.
- **Paid (Pro):** Users pay a monthly subscription (e.g., $5/mo) to unlock "Power Features".
- **Why it's good:** You have **zero** AI server costs. The user pays for their own intelligence; you just charge for the *interface*.
- **Lumina Pro Features Ideas:**
    - "Smart Prompts Library" (Save/Sync prompts across devices).
    - "History" (Save past explanations).
    - "Export to Notion/Obsidian".
    - "Voice Input" (Make this a Pro feature?).

### B. The "All-Inclusive" Subscription
**How it works:**
- Users pay you (e.g., $20/mo).
- You provide the AI. No API keys needed for them.
- **Pros:** Better UX (no friction setup).
- **Cons:** **High Risk**. You have to pay the API bills. If a user analyzes 1000 books, you might lose money. You need a backend server to proxy requests and rate-limit users.

### C. Freemium with Credit Packs
**How it works:**
- Users buy "50 Credits" for $5.
- Each explanation costs 1 credit.
- **Pros:** Good for casual users.
- **Cons:** High implementation effort (backend ledger needed).

---

## 2. Recommended Tech Stack for Payments

Since you must handle payments off-platform, these are the standard tools extension developers use in 2024/2026:

### 1. Payment Provider (Merchant of Record)
Use a "Merchant of Record" so they handle taxes (VAT/Sales Tax) for you.
- **[LemonSqueezy](https://www.lemonsqueezy.com/)**: Very developer-friendly. Easy checkout links.
- **[Stripe](https://stripe.com/)**: The gold standard, but you handle more tax compliance logic.
- **[Gumroad](https://gumroad.com/)**: Good for one-time sales (like a license key).

### 2. Authentication (User Accounts)
You need to know *who* paid.
- **[Supabase](https://supabase.com/)** (Auth + Database): Free tier is generous. Easy to store "User X is Pro".
- **[Firebase](https://firebase.google.com/)**: Classic Google choice. Works well with Chrome Extensions.

### 3. Verification Logic
1. User installs Extension.
2. User clicks "Upgrade" -> Redirects to LemonSqueezy Checkout.
3. User pays.
4. LemonSqueezy sends a "Webhook" to your Backend (Supabase/Firebase Function).
5. Backend updates User's status to `is_pro: true`.
6. Extension checks valid token -> Unlocks features.

---

## 3. How to Implement "License Key" (Simplest method, no backend)
If you don't want to build a complex backend server:
1. Sell a "Lifetime License Key" on Gumroad for $10.
2. In the extension, add a "Enter License Key" box.
3. Validate the key locally (or against Gumroad's simple API).
4. Store usage in `chrome.storage.local`.
*(Note: This is easier to hack/crack, but for a small tool, it's often "good enough" to start).*

---

## 4. Other Revenue Streams (Non-Direct)

### Affiliate Marketing
- You are using Gemini/OpenAI/DeepSeek.
- If they have affiliate programs, put your referral link in the "Get Key" buttons.
- *Example:* "Don't have a DeepSeek Key? Get one here (link)." -> You earn commission.

### Donations
- Add a "Support Development" button.
- Link to **Buy Me a Coffee** or **Ko-fi**.
- *Note:* Effectively, 0.1% of users donate. Do not rely on this for income.

## Summary Recommendation for Lumina
Start with **Model A (BYOK + Pro Features)** using **LemonSqueezy + Supabase**.
1. Keep the core "Explain Page" free (it drives growth).
2. Build a "History/Saved Notes" feature.
3. Gate that feature behind a $5/mo subscription or $29 lifetime unlock.
