export const getArchitectureHTML = () => `
**Lumina Architecture Overview** 💎

Lumina is designed as a **Lightweight, Local-First AI Web Copilot** evolving into an **AI Browser OS**. Built entirely with Vanilla JavaScript and Manifest V3, it completely bypasses the need for a dedicated backend or middleware, communicating directly with LLM providers to ensure low latency and strict privacy.

The architecture is divided into three primary layers: **Extension Core**, **Intelligence & Services**, and the **Browser OS Layer**.

---

**1. Extension Core Layer**
Handles the traditional Chrome extension capabilities, adhering to Manifest V3 sandboxing and lifecycle events.

- **Background Service Worker (\\\`background.js\\\`)**: Acts as the central event bus. Listens for cross-tab messages, manages context menus, and orchestrates the UI.
- **Content Scripts (\\\`content.js\\\`)**: Injected into every webpage. Responsible for extracting DOM context and capturing high-fidelity screenshots.
- **Side Panel Interface (\\\`sidepanel.html\\\` & \\\`ui.js\\\`)**: The primary user interface holding the chat UI, settings, and conversation history.

---

**2. Intelligence & Services Layer**
Operates without an intermediary server, managing all AI logic client-side.

- **Direct Service APIs (\\\`services/\\\`)**: Standalone API clients that take prompts/context, sign requests with local keys, and stream responses directly from providers like Gemini or OpenAI.
- **Data & Storage (\\\`modules/storage.js\\\`)**: Relies entirely on \\\`chrome.storage.local\\\` preventing data from leaking to third-party endpoints.
- **RAG & Memory (\\\`modules/rag.js\\\`)**: Implements client-side Retrieval-Augmented Generation using a local embedding model compiled to WebAssembly.

---

**3. Browser OS Layer (Lumina OS)**
Transforms the browser into an operating system interface by overriding the Chrome New Tab page.

- **Desktop Interface (\\\`desktop.html\\\`)**: Visual entry point with a dynamic wallpaper, icons grid, and a bottom launch Dock.
- **Lumina Kernel (\\\`os/kernel.js\\\`)**: The "heart" of the OS. Boots system components, mounts filesystem, and manages app processes natively in the browser.
- **Window Manager (\\\`os/window_manager.js\\\`)**: Provides a desktop-like experience by dynamically creating, moving, and layering floating draggable windows.
- **Virtual File System (\\\`os/filesystem.js\\\`)**: Mimics a local hierarchical OS environment for users and the AI Agent to read, write, and manipulate mock files.

---

**Summary**
Lumina is a highly decoupled, modular application. By offloading backend responsibilities directly to the browser, it achieves high performance, offline resilience for core logic, and enhanced user privacy. The introduction of the **Lumina OS** layer pushes this paradigm further, treating the browser tab as an independent computing environment managed by an AI Kernel.
`;
