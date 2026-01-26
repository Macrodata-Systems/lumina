# Lumina v2.0 Roadmap & Improvement Plan

Based on critical feedback to improve User Experience and differentiator.

## 1. 🎨 User Experience (UX) Overhaul
*Goal: Shift from "Developer-First" to "User-First".*

- [ ] **First-Run Onboarding Flow**:
    - "Select content → Ask question → Get explanation" guided tour.
- [ ] **Example Prompts (Quick Chips)**:
    - "Summarize this page"
    - "Explain like I’m 12"
    - "Find key arguments"
- [ ] **Model Labels (Transparency)**:
    - **Gemini Flash**: "Fast & Free"
    - **GPT-4o**: "Best for Reasoning"
    - **Claude 3.5**: "Best for Writing"
    - **DeepSeek R1**: "Deep Reasoning / Coding"

## 2. ⚡ Free API Strategy (Sustainability)
*Goal: Solve the "Free APIs don't scale" problem.*

- [ ] **Option A: Hybrid Local + API (Long-term)**
    - Integrate **WebLLM** or **Ollama** (via localhost) for basic tasks.
    - Offload complex queries to APIs.
- [ ] **Option B: Smart Caching (Immediate Impact)**
    - Hash page content/URL.
    - If content hasn't changed, serve cached summary.
    - *Impact: Reduces API usage by 40-60%.*

## 3. 📄 PDF & Document Handling
*Goal: Make Lumina a powerhouse for researchers.*

- [ ] **Smart Chunking Strategy**:
    - Chunk by: Headings, Pages, Semantic blocks.
- [ ] **Granular Control**:
    - "Explain Page 4" button.
    - "Summarize Section 2.1".

## 4. 🚀 Killer Differentiators
*Goal: create the "Why Lumina?" moment.*

- [x] **Smart Text Selection Bubble** (Implemented v1.2) -> *Needs Polish/Visibility fix.*
- [ ] **Timeline-Style Reasoning**: Visualize the AI's "thought process" (especially for DeepSeek R1).
- [ ] **Inline Explanations**: Like Grammarly, but for context/facts.
- [ ] **Citations**: Clickable source jumping.
