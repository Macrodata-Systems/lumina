# Lumina v1.3 - Release Notes

**Version 1.3** brings a streamlined interface, improved stability, and a focus on the core "Top 3" AI models (Gemini, ChatGPT, Claude).

## 🌟 What's New

### 1. Unified & Streamlined UI
-   **Simplified Tabs**: We've hidden experimental providers (Grok, DeepSeek) to focus on the most reliable trio: **Gemini, ChatGPT, and Claude**.
-   **Improved Chip Alignment**: Suggestion chips ("Summarize Page", etc.) are now left-aligned and scrollable, ensuring they are never cut off on smaller screens.
-   **Cleaner Footer**: Adjusted spacing and alignment for a more professional look.

### 2. Enhanced Reliability
-   **OpenRouter Fallback**: Under the hood, we've upgraded our OpenRouter integration to support **Mistral 7B** as a reliable fallback, ensuring free users always have a working model (even if hidden for now, the logic is ready).
-   **Error Handling**: Added specific, actionable error messages for OpenRouter "User not found" and "No endpoints" issues, directly guiding users to the fix.

### 3. Codebase Improvements
-   **Production Ready**: Removed debug logging for slightly faster performance and cleaner execution.
-   **Manifest Update**: Updated usage descriptions to strictly match visible features, ensuring smooth Web Store review.

## 🚀 How to Test
1.  **Load Extension**: Ensure version is `1.3` in `chrome://extensions`.
2.  **Check UI**: Verify that only Gemini, ChatGPT, Claude, and History tabs are visible.
3.  **Test Chips**: Open the side panel and check that "Summarize Page" is fully visible on the left.
4.  **Verify Keys**: Ensure your API keys for the visible providers still work as expected.

## 📦 Submission Status
-   **Ready for Upload**: All files (manifest, logos, code) are prepped for the Chrome Web Store Dashboard.
