# How to Set Up PayPal

Since Stripe is unavailable, PayPal is your best option for international cards.

## Option 1: PayPal.Me (Easiest)
This creates a personal payment link.

1.  Go to **[paypal.me](https://www.paypal.me)**.
2.  Log in or Sign up.
3.  Create your unique link (e.g. `paypal.me/HarshSingh`).
4.  **Important**: To ask for a specific amount, add it to the URL.
    *   For $6 USD: `https://paypal.me/YOUR_HANDLE/6USD`
5.  Test the link in your browser. It should show "$6.00".

## Option 2: PayPal Button (Business)
If you have a Business account:
1.  Go to **[PayPal Buttons](https://www.paypal.com/buttons/)**.
2.  Select **"Buy Now"**.
3.  Item Name: "Lumina Pro License".
4.  Price: $6.00 USD.
5.  Click **Create Button**.
6.  Look for the **"Email"** tab (next to "Website").
7.  Copy the link (e.g. `https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick...`).

## Final Step
1.  Open `config.js` in your extension code.
2.  Paste the link into `paypalLink`:
    ```javascript
    paypalLink: "https://paypal.me/harsh/6USD"
    ```
3.  The extension will now open this link when users click "Pay via PayPal".
