let settings = {
    inactivitySetting: 7,
    includeYourNonWarriors: true,
    includeTheirNonWarriors: true,
}
let inactivityTime;
let labelValue = "";



const util = { 
    setInactivityTime: function() {
        switch (settings.inactivitySetting) {
            case 0:
                labelValue = "1 day";
                inactivityTime = 1; 
                break;
            case 1:
                labelValue = "2 days";
                inactivityTime = 2; 
                break;
            case 2:
                labelValue = "3 days";
                inactivityTime = 3; 
                break;
            case 3:
                labelValue = "5 days";
                inactivityTime = 5; 
                break;
            case 4:
                labelValue = "1 week";
                inactivityTime = 7; 
                break;
            case 5:
                labelValue = "2 weeks";
                inactivityTime = 14; 
                break;
            case 6:
                labelValue = "3 weeks";
                inactivityTime = 21; 
                break;
            case 7:
                labelValue = "1 month";
                inactivityTime = 30; 
                break;
            case 8:
                labelValue = "2 months";
                inactivityTime = 61; 
                break;
            case 9:
                labelValue = "3 months";
                inactivityTime = 91; 
                break;
            case 10:
                labelValue = "Never";
                inactivityTime = 36500; // 100 years... 
                break;
        }
    },
    
    getGuildGradients: async function() {
        let gradFetch = await fetch("/smmo-guild-tools/guildGradients.json");
        return await gradFetch.json();
    },
    calculateProbability: function(now, yourMembers, theirMembers) {
        let yourWarriors = [], theirWarriors = [], yourAttackable = [], theirAttackable = [];
        for (let member of yourMembers) {
            if (member.safe_mode === 0) {
                if (member.warrior === 1) {
                    yourAttackable.push(member.level);
                    let d = new Date();
                    d.setDate(now.getDate() - inactivityTime);
                    if (d < (new Date(member.last_activity*1000))) {
                        yourWarriors.push(member.level);
                    }
                } else if (settings.includeYourNonWarriors) {
                    yourAttackable.push(member.level);
                }
            }
        }
        for (let member of theirMembers) {
            if (member.safe_mode === 0) {
                if (member.warrior === 1) {
                    theirAttackable.push(member.level);
                    let d = new Date();
                    d.setDate(now.getDate() - inactivityTime);
                    if (d < (new Date(member.last_activity*1000))) {
                        theirWarriors.push(member.level);
                    }
                } else if (settings.includeTheirNonWarriors) {
                    theirAttackable.push(member.level);
                }
            }
        }
        // [win chance %, their targets, your targets]
        let values = [50, 0, 0];
        for (let warrior of theirWarriors) {
            for (let target of yourAttackable) {
                if (warrior*1.1 > target) {
                    values[1]++;
                }
            }
        }
        for (let warrior of yourWarriors) {
            for (let target of theirAttackable) {
                if (warrior*1.1 > target) {
                    console.log(warrior)
                    console.log(target)

                    values[2]++;
                }
            }
        }
        const prob = (values[2]+1)/(values[1]+values[2]+1);
        values[0] = Math.round(prob*100);
        console.log(values);
        return values;
    },
    getApiKey: function() {
        return localStorage.getItem('api_key');
    },
    getStoredJSON: async function(key) {
        return await JSON.parse(localStorage.getItem(key));
    },
    saveJSON: function(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }
}

const api = { // Functions which call the SimpleMMO Public API directly
    getParams: function(api_key) { // called by other functions to get the params
        return {
            method: "POST",
            body: new URLSearchParams( {
                api_key
            })
        };
    },
    getSGL: async function(season, api_key) {
        const params = api.getParams(api_key);
        const res = await fetch(`https://api.simple-mmo.com/v1/guilds/seasons/${season}`, params);
        return await res.json();
    },
    getAllGuilds: async function(api_key, page=1) {
        const params = api.getParams(api_key);
        const res = await fetch(`https://api.simple-mmo.com/v1/guilds/all?page=${page}`, params);
        return await res.json();
    },
    getGuildMembers: async function(guild_id, api_key) {
        const params = api.getParams(api_key);
        const res = await fetch(`https://api.simple-mmo.com/v1/guilds/members/${guild_id}`, params);
        return await res.json();
    },
    getGuildInfo: async function(guild_id, api_key) {
        const params = api.getParams(api_key);
        const res = await fetch(`https://api.simple-mmo.com/v1/guilds/info/${guild_id}`, params);
        return await res.json();
    },
    getGuildWars: async function(guild_id, api_key) {
        const params = api.getParams(api_key);
        const res = await fetch(`https://api.simple-mmo.com/v1/guilds/info/${guild_id}`, params);
        return await res.json();
    },
    getPlayerInfo: async function(api_key) {
        const params = api.getParams(api_key);
        const res = await fetch('https://api.simple-mmo.com/v1/player/me', params);
        return await res.json();
    },
    
}

window.onload = async () => {
    if (window.location.pathname != "/settings" && 
        window.location.pathname != "/settings/" &&
        window.location.pathname != "/" && 
        !util.getApiKey()) {
        window.location.replace("/settings")
    } else {
        let s = await util.getStoredJSON("settings");
        if (s) {
            settings = s;
        } else {
            util.saveJSON("settings", settings);
        }
        util.setInactivityTime();
        if (typeof init == "function") init();
    }

}
