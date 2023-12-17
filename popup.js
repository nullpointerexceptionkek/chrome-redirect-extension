document.addEventListener("DOMContentLoaded", function () {
  loadRules();
  updateToggleButton();

  document
    .getElementById("ButtonsaveRules")
    .addEventListener("click", function () {
      try {
        const rulesJson = document.getElementById("rulesJson").value;
        saveRules(JSON.parse(rulesJson));
      } catch (e) {
        console.error("Error parsing JSON: ", e);
      }
    });

  const toggleButton = document.getElementById("toggleButton");
  toggleButton.addEventListener("click", function () {
    chrome.storage.sync.get(
      ["redirectEnabled", "redirectRules"],
      function (data) {
        const newState = !data.redirectEnabled;
        chrome.storage.sync.set({ redirectEnabled: newState }, function () {
          updateRulesState(newState, data.redirectRules || []);
          updateToggleButton();
        });
      }
    );
  });
});

function loadRules() {
    chrome.storage.sync.get('redirectRules', function(data) {
        const rules = data.redirectRules || [];
        document.getElementById('rulesJson').value = JSON.stringify(rules, null, 2);
        console.log("Loaded rules:", rules);
    });
}


function saveRules(rules) {
    chrome.storage.sync.set({ redirectRules: rules }, function() {
        console.log("Rules saved:", rules);
        chrome.runtime.sendMessage({ action: "updateRules", rules: rules });
    });
}

function updateRulesState(enabled, rules) {
  console.log("Updating rules with state:", enabled);
  let newRules = enabled
    ? rules.map((rule, index) => ({
        id: index + 1,
        priority: 1,
        action: { type: "redirect", redirect: { url: rule.redirectUrl } },
        condition: {
          urlFilter: rule.originalUrl,
          resourceTypes: ["main_frame"],
        },
      }))
    : [];

  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: Array.from(
      { length: chrome.declarativeNetRequest.MAX_NUMBER_OF_DYNAMIC_RULES },
      (_, i) => i + 1
    ),
    addRules: newRules,
  });
}

function updateToggleButton() {
  chrome.storage.sync.get("redirectEnabled", function (data) {
    const toggleButton = document.getElementById("toggleButton");
    if (data.redirectEnabled) {
      toggleButton.textContent = "Disable Redirect";
    } else {
      toggleButton.textContent = "Enable Redirect";
    }
  });
}
