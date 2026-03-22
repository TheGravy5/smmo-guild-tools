function setApiKey() {
    apikey = document.getElementById("apiKey").value;
    document.getElementById("apiKey").value = "";
    localStorage.setItem("api_key", apikey);
    document.getElementById("api").textContent = '✅ Key Set';
    setTimeout(() => {
        document.getElementById("api").textContent = 'Submit';
    }, 1000);
}

function setInactivityTime() {
    const range = document.getElementById("warriorInactivity");
    const value = Number.parseInt(range.value);
    settings.inactivitySetting = value;
    util.setInactivityTime();
    document.getElementById("warriorInactivityTime").textContent = labelValue;
    util.saveJSON("settings", settings);
}

function updateINW() {
    const y = document.getElementById("includeYourNonWarriors");
    const t = document.getElementById("includeTheirNonWarriors");
    settings.includeYourNonWarriors = y.checked;
    settings.includeTheirNonWarriors = t.checked;
    util.saveJSON("settings", settings);
    console.log(settings)
}

function init() {
    document.getElementById("warriorInactivityTime").textContent = labelValue;
    document.getElementById("warriorInactivity").value = settings.inactivitySetting;
    document.getElementById("includeYourNonWarriors").checked = settings.includeYourNonWarriors;
    document.getElementById("includeTheirNonWarriors").checked = settings.includeTheirNonWarriors;
}