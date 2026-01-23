# Implementation Plan - Gating Premium Models

The user wants to restrict DeepSeek, Claude, and ChatGPT to the "Pro" version, leaving only Gemini as the free option.

## Proposed Changes

### Logic Changes
#### [MODIFY] [sidepanel.js](file:///Users/singhharsh199/workspace/Lumina/sidepanel.js)
- **Modify `startExplanation`**:
    - Before calling `callOpenAI`, `callAnthropic`, or `callDeepSeek`, check `isPro()`.
    - If `!isPro()`, DO NOT call the API.
    - Instead, call `updateSection(targetSection, "🔒 Pro Feature. Upgrade to access.")`.
    - Ensure `gemini` calls remain untouched (Free).

### UI Consideration
- We could add lock icons to the tabs, but a simple error message in the result section is clearer and easier to implement quickly.
- We might want to auto-open the Settings or show the Upgrade overlay if they try to access it.

### Documentation
#### [MODIFY] [STORE_LISTING.md](file:///Users/singhharsh199/workspace/Lumina/STORE_LISTING.md)
- Update "Key Features" to clarify that Gemini is Free, others are Pro.

## Verification Plan
1. **Clear License Key**: Ensure no key is set.
2. **Test Gemini**: Should work.
3. **Test DeepSeek**: Should show "Pro Feature" message.
4. **Set License Key**: Enter valid key.
5. **Test DeepSeek**: Should work.
