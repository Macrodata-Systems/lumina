# How to Set Up Payments (Gumroad Integration)

To make money with Lumina, you need to sell License Keys. We recommend **Gumroad** because they handle everything (taxes, email delivery, key generation).

## 1. Create Gumroad Product
1.  Go to [Gumroad.com](https://gumroad.com/) and sign up.
2.  Go to **Products** -> **New Product**.
    *   **Name**: Lumina Pro (or whatever you want).
    *   **Type**: Digital Product.
    *   **Price**: $19 (One-time) or $5 (Subscription).
3.  **Important**: In the **Content** tab:
    *   Toggle on **Generate a unique license key per sale**. **(CRITICAL)**
    *   Upload a text file (e.g., `thank_you.txt`) saying "Thanks for purchasing! Paste your key in the extension."
4.  Publish the product.

## 2. Get Your Product "Permalink"
1.  Go to your specific product page (e.g. `gumroad.com/l/lumina-pro`).
2.  The last part of the URL is the **Permalink**.
    *   Example URL: `https://gumroad.com/l/my-cool-extension`
    *   Permalink: `my-cool-extension`

## 3. Configure Extension
1.  Open `config.js` in your project.
2.  Update `gumroadProductPermalink` with your value:
    ```javascript
    export const API_CONFIG = {
        // ...
        gumroadProductPermalink: "my-cool-extension" 
    };
    ```

## 4. Test It
1.  On Gumroad, create a **Discount Code** for 100% off so you can "buy" it for free.
2.  "Buy" your own product.
3.  Copy the key from the receipt.
4.  Paste it into Lumina -> Settings -> License Key.
5.  Click Save. It should say "Pro Features Unlocked! 🚀".

## 5. Enable Pro Mode
To enforce verification, make sure `developerMode` is `false` in `config.js` before distributing.
