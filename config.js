// config.js

// ⚠️ SECURITY WARNING ⚠️
// Hardcoding API keys in a Chrome Extension is EXTREMELY RISKY.
// Anyone who installs this extension can view source and execute requests with YOUR keys.
// If you publish this to the Chrome Web Store or a public GitHub repository, your keys WILL be stolen and abused.
//
// ONLY do this if:
// 1. You are keeping this extension for personal use only.
// 2. You are sharing it only with trusted friends/colleagues.
// 3. You accept the risk of your quota being drained.

export const API_CONFIG = {
    // Paste your keys inside the quotes below
    geminiKey: "",
    openaiKey: "",
    anthropicKey: "",
    grokKey: "",
    deepseekKey: "",

    // Set to true to unlock all features for development
    developerMode: true,

    // GLOBAL BETA: Set to true to give everyone PRO features for 6 months
    earlyBirdBeta: true,

    // Your Google Apps Script Web App URL
    licenseServerUrl: "",

    // Stripe Payment Link (Optional)
    stripePaymentLink: "",

    // PayPal Link (e.g. paypal.me/yourname OR gumroad link)
    paypalLink: "https://paypal.me/singhharsh199/6USD",

    // UPI ID for Indian Users
    upiId: "singhharsh199-1@okaxis"
};
