// After install or update, load the content script into chat tabs that are already open,
// so they work without a manual refresh.
chrome.runtime.onInstalled.addListener(async () => {
  const patterns = chrome.runtime.getManifest().content_scripts[0].matches;
  const tabs = await chrome.tabs.query({ url: patterns });
  for (const tab of tabs) {
    chrome.scripting
      .executeScript({ target: { tabId: tab.id }, files: ["sites.js", "content.js"] })
      .catch(() => {}); // discarded or restricted tabs: the popup offers a reload instead
  }
});
