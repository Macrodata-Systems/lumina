# Lumina v2.0 Roadmap 🚀

## Vision
Transform Lumina from a "One-Shot Explainer" into a **Persistent Research Companion**. V2.0 will focus on continuity, depth, and platform independence.

## Core Features (Planned)

### 1. 💬 Interactive Chat (The Big One)
*   **Current**: Single prompt -> Single response.
*   **V2.0**: Full threaded conversation. "Tell me more about the second point."
*   **Tech**: Maintain message history context window in memory/storage.

### 2. ☁️ Cloud Sync (Pro)
*   **Current**: History lives in `chrome.storage.local` (One device only).
*   **V2.0**: Sync history across devices (Work Laptop <-> Home Desktop).
*   **Tech**: Supabase/Firebase integration for Pro users.

### 3. 🧠 Smart Context Manager
*   **Current**: Binary toggle (Screenshot vs Text).
*   **V2.0**: "Auto-Select". If page is YouTube -> Get Transcript. If page is PDF -> Parse PDF text.
*   **Tech**: Specialized content extractors.

## Technical Refactors

*   [ ] Migrate `sidepanel.js` to a Class-based architecture.
*   [ ] Integration of a build system (Vite) if complexity grows.
