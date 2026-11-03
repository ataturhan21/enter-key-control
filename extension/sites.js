// Supported sites and shared settings. Loaded by the content script, popup and background worker.
(function (root) {
  const SITES = [
    { id: "chatgpt", name: "ChatGPT", hosts: ["chatgpt.com", "chat.openai.com"],
      sendButtons: ['button[data-testid="send-button"]', "#composer-submit-button"] },
    { id: "claude", name: "Claude", hosts: ["claude.ai"],
      sendButtons: ['button[aria-label="Send message"]', 'button[aria-label="Send Message"]'] },
    { id: "gemini", name: "Gemini", hosts: ["gemini.google.com"],
      sendButtons: ["button.send-button", 'button[aria-label="Send message"]'] },
    { id: "aistudio", name: "Google AI Studio", hosts: ["aistudio.google.com"],
      sendButtons: ['button[aria-label="Run"]', "run-button button"] },
    { id: "deepseek", name: "DeepSeek", hosts: ["chat.deepseek.com"],
      sendButtons: [] },
    { id: "perplexity", name: "Perplexity", hosts: ["www.perplexity.ai"],
      sendButtons: ['button[aria-label="Submit"]', 'button[data-testid="submit-button"]'] },
    { id: "grok", name: "Grok", hosts: ["grok.com"],
      sendButtons: ['button[type="submit"]', 'button[aria-label="Submit"]'] },
    { id: "mistral", name: "Le Chat (Mistral)", hosts: ["chat.mistral.ai"],
      sendButtons: ['button[type="submit"]', 'button[aria-label="Send question"]'] },
    { id: "copilot", name: "Microsoft Copilot", hosts: ["copilot.microsoft.com"],
      sendButtons: ['button[data-testid="submit-button"]', 'button[aria-label="Submit message"]'] }
  ];

  const DEFAULTS = {
    enabled: true,
    // "mod" = Ctrl+Enter on Windows/Linux, ⌘+Enter on Mac (either works everywhere).
    // "alt" = Alt/Option+Enter.
    sendKey: "mod",
    disabledSites: []
  };

  function siteForHost(host) {
    return SITES.find((s) => s.hosts.includes(host)) || null;
  }

  root.EKC = { SITES, DEFAULTS, siteForHost };
})(typeof self !== "undefined" ? self : this);
