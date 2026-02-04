/**
 * Lumina - AI Copilot for the Web
 * Copyright (c) 2026 Harsh Raj Singh. All Rights Reserved.
 * Proprietary and Confidential.
 */

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
    openrouterKey: "",
    groqKey: "",

    // Set to true to unlock technical settings (Gear icons, API tags)
    developerMode: false
};
