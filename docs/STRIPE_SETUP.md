# How to Set Up Stripe (India Edition 🇮🇳)

Since you are in India, Stripe has specific requirements for accepting international payments.

## 1. Create Account
1.  Go to [dashboard.stripe.com/register](https://dashboard.stripe.com/register).
2.  **Country**: India.
3.  **Type**: "Individual / Sole Proprietor" (unless you have a registered company).

## 2. Business Details (Crucial for Approval)
Stripe India is strict. Fill this carefully:
*   **Industry**: Digital Products -> Software.
*   **Website**: Link to your **GitHub Profile** or the Chrome Web Store listing link.
*   **Product Description**: "I sell a Chrome Extension license key for productivity software called Lumina."

## 3. Bank Details
*   Enter your **Canara Bank** details (Account No & IFSC).
*   **Currency**: Select **INR** as settlement currency.

## 4. International Payments (Important)
To accept USD/GBP from global users:
1.  Go to **Settings** -> **Payment methods**.
2.  Ensure **Cards** (Visa, Mastercard) are enabled.
3.  **Export Code**: You might be expected to provide an IEC (Import Export Code).
    *   *Tip*: For small individual usage, you might be able to start without one, but obtaining an IEC from DGFT is online and costs ₹500 if Stripe demands it later.

## 5. create Payment Link (No Code)
This is the magic link you need for the extension.
1.  Search for **Payment Links** in the top bar or sidebar.
2.  Click **+ New**.
3.  **Product**: Add new product -> "Lumina Pro License".
    *   **Price**: ₹500 (INR). *Note: Charging international cards in INR is possible, they convert it. Or you can charge $6 USD.*
    *   **Recommendation**: Set price to **$6.00 USD** so international users aren't confused by ₹ symbols.
4.  **Options**:
    *   Collect customers' addresses: **Yes** (Billing address only). *Required for tax.*
5.  Click **Create Link**.
6.  Copy the URL (e.g. `https://buy.stripe.com/test_...` or live `https://buy.stripe.com/...`).

## 6. Add to Extension
1.  Open `config.js`.
2.  Paste the link into `stripePaymentLink`.
3.  Now the "Pay with Card" button works globally!
