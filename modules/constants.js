export const AI_MODELS = {
    gemini: {
        displayName: 'Gemini',
        providerName: 'Google',
        iconClass: 'fa-brands fa-google',
        keyUrl: 'https://aistudio.google.com/apikey',
        keyStorageName: 'geminiKey',
        sectionId: 'gemini-section',
        instructions: [
            '<strong>Step 1:</strong> Click the button above to visit <strong>Google AI Studio</strong>.',
            '<strong>Step 2:</strong> Sign in with your Google Account.',
            '<strong>Step 3:</strong> Click <strong>"Get API Key"</strong> in the left sidebar.',
            '<strong>Step 4:</strong> Click <strong>"Create API key"</strong> and select a project.',
            '<strong>Step 5:</strong> Copy your new API key and paste it into the field below.'
        ]
    },
    openai: {
        displayName: 'ChatGPT',
        providerName: 'OpenAI',
        iconClass: 'fa-solid fa-bolt',
        keyUrl: 'https://platform.openai.com/api-keys',
        keyStorageName: 'openaiKey',
        sectionId: 'openai-section',
        instructions: [
            '<strong>Step 1:</strong> Click the button above to open the <strong>OpenAI Dashboard</strong>.',
            '<strong>Step 2:</strong> Log in and go to the <strong>"API Keys"</strong> page.',
            '<strong>Step 3:</strong> Click <strong>"+ Create new secret key"</strong>.',
            '<strong>Step 4:</strong> Name your key and <strong>copy it immediately</strong> (it won\'t be shown again!).',
            '<strong>Step 5:</strong> Paste the key into the input field below.'
        ]
    },
    anthropic: {
        displayName: 'Claude',
        providerName: 'Anthropic',
        iconClass: 'fa-solid fa-brain',
        keyUrl: 'https://console.anthropic.com/settings/keys',
        keyStorageName: 'anthropicKey',
        sectionId: 'anthropic-section',
        instructions: [
            '<strong>Step 1:</strong> Click the button above to open the <strong>Anthropic Console</strong>.',
            '<strong>Step 2:</strong> Sign in and navigate to <strong>"Settings"</strong> → <strong>"API Keys"</strong>.',
            '<strong>Step 3:</strong> Click <strong>"Create Key"</strong> and give it a name.',
            '<strong>Step 4:</strong> Copy the secret key and paste it below to enable Claude.'
        ]
    },
    grok: {
        displayName: 'Grok',
        providerName: 'xAI',
        iconClass: 'fa-brands fa-x-twitter',
        keyUrl: 'https://console.x.ai',
        keyStorageName: 'grokKey',
        sectionId: 'grok-section',
        instructions: [
            '<strong>Step 1:</strong> Click the button above to visit the <strong>xAI Console</strong>.',
            '<strong>Step 2:</strong> Log in with your X (Twitter) account.',
            '<strong>Step 3:</strong> Navigate to the <strong>"API Keys"</strong> section in the sidebar.',
            '<strong>Step 4:</strong> Click <strong>"Create API Key"</strong> and copy the code.',
            '<strong>Step 5:</strong> Paste it below to unlock Grok.'
        ]
    },
    deepseek: {
        displayName: 'DeepSeek',
        providerName: 'DeepSeek',
        iconClass: 'fa-solid fa-code',
        keyUrl: 'https://platform.deepseek.com/api_keys',
        keyStorageName: 'deepseekKey',
        sectionId: 'deepseek-section',
        instructions: [
            '<strong>Step 1:</strong> Click the button above to open the <strong>DeepSeek Platform</strong>.',
            '<strong>Step 2:</strong> Sign in and navigate to the <strong>"API Keys"</strong> section.',
            '<strong>Step 3:</strong> Click <strong>"Create API Key"</strong> and copy the generated key.',
            '<strong>Step 4:</strong> Paste it into the input field below to start talking.'
        ]
    },
    openrouter: {
        displayName: 'OpenRouter',
        providerName: 'OpenRouter',
        iconClass: 'fa-solid fa-globe',
        keyUrl: 'https://openrouter.ai/keys',
        keyStorageName: 'openrouterKey',
        sectionId: 'openrouter-section',
        instructions: [
            '<strong>Step 1:</strong> Click the button above to visit <strong>OpenRouter</strong>.',
            '<strong>Step 2:</strong> Sign in and create a new <strong>API Key</strong>.',
            '<strong>Step 3:</strong> Copy your key and paste it below.',
            '<strong>Step 4:</strong> You can access models like Mistral, Llama, and more for free!'
        ]
    },
    groq: {
        displayName: 'Groq',
        providerName: 'Groq',
        iconClass: 'fa-solid fa-bolt-lightning',
        keyUrl: 'https://console.groq.com/keys',
        keyStorageName: 'groqKey',
        sectionId: 'groq-section',
        instructions: [
            '<strong>Step 1:</strong> Click the button above to visit the <strong>Groq Console</strong>.',
            '<strong>Step 2:</strong> Sign in and navigate to <strong>"API Keys"</strong>.',
            '<strong>Step 3:</strong> Click <strong>"Create API Key"</strong> and copy it.',
            '<strong>Step 4:</strong> Paste it below for lightning-fast inference!'
        ]
    }
};

export const MODEL_KEY_MAP = {
    'gemini-section': 'geminiKey',
    'openai-section': 'openaiKey',
    'anthropic-section': 'anthropicKey',
    'grok-section': 'grokKey',
    'deepseek-section': 'deepseekKey',
    'openrouter-section': 'openrouterKey',
    'groq-section': 'groqKey'
};
