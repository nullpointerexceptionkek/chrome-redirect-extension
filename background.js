chrome.runtime.onInstalled.addListener(() => {
    const defaultRules = [
        { originalUrl: "https://example.com", redirectUrl: "http://example-redirect.com" }
    ];
    chrome.storage.sync.set({ redirectRules: defaultRules, redirectEnabled: false }, () => {
        updateRules(defaultRules, true);
    });
});

chrome.runtime.onStartup.addListener(() => {
    loadAndApplyRules();
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "updateRules") {
        chrome.storage.sync.get('redirectEnabled', function(data) {
            updateRules(request.rules, data.redirectEnabled);
        });
    }
});

function loadAndApplyRules() {
    chrome.storage.sync.get(['redirectRules', 'redirectEnabled'], function(data) {
        updateRules(data.redirectRules || [], data.redirectEnabled);
    });
}

function updateRules(rules, isEnabled) {
    let ruleIdsToRemove = Array.from({ length: chrome.declarativeNetRequest.MAX_NUMBER_OF_DYNAMIC_RULES }, (_, i) => i + 1);
    let newRules = isEnabled ? rules.map((rule, index) => ({
        id: index + 1,
        priority: 1,
        action: { type: 'redirect', redirect: { url: rule.redirectUrl } },
        condition: { urlFilter: rule.originalUrl, resourceTypes: ["main_frame"] }
    })) : [];

    chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: ruleIdsToRemove,
        addRules: newRules
    });
}
