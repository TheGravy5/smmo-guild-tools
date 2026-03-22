const tabs = [["all", "warriors", "nonSafe", "safe"]];
function changeTab(bar_id, tab_id, style) { // Change tab
    for (const tab of tabs[bar_id]) {
        if (tab == tab_id) { document.getElementById(tab).style.display = style; }
        else { document.getElementById(tab).style.display = "none"; }
    }
}

const memberTemplate = `
    <div class="member" style="background-color: rgb(%bg)">
        <div class="memberInfo">
            <div class="one">
                <p><a href="https://web.simple-mmo.com/user/view/%id" target=_blank>%name</a></p>
                <p class="level">Level <b>%level</b></p>
            </div>
            <p class="pid">@%id</p>
        </div>
        <p class="label">%label</p>
    </div>
`;

async function getStats() {
    const apiKey = util.getApiKey();
    const you = await api.getPlayerInfo(apiKey);
    util.saveJSON("you", you);

    const memberList = await api.getGuildMembers(you.guild.id, apiKey);
    util.saveJSON("memberList", memberList)

    if (!localStorage.getItem('memberListPast')) {
        util.saveJSON("memberListPast", memberList)
    }
    let storedList = await util.getStoredJSON("memberListPast")

    const now = new Date();
    for (let member of memberList) {
        if (!storedList.find((element) => {
            return (element.user_id === member.user_id);
        })) {
            storedList.push(member);
        }
    }
    util.saveJSON("memberListPast", storedList);
    
    loadStats()
}

async function loadStats() {
    const you = await util.getStoredJSON("you");
    if (you) {
        document.getElementById('name').innerText = you.guild.name;
        const guildGradients = await util.getGuildGradients();
        if (guildGradients[you.guild.id.toString()]) {
            document.getElementById('name').style.background = `-webkit-linear-gradient(${guildGradients[you.guild.id.toString()]})`;
            document.getElementById('name').style.backgroundClip = `text`;
            document.getElementById('name').style.color = `transparent`;
        }
        loadGuildMemberList(
            document.getElementById("memberOptions").value,
            document.getElementById("memberOptionsMode").value
        );
    } else getStats();
    
}

async function loadGuildMemberList(sortMethod, timeRange) {
    document.getElementById("all").innerHTML = '<h2 style="width: 100%; text-align: center;">All Members</h2>'
    document.getElementById("warriors").innerHTML = '<h2 style="width: 100%; text-align: center;">Warriors</h2>';
    document.getElementById("nonSafe").innerHTML = '<h2 style="width: 100%; text-align: center;">Non-Warrior PvP Members</h2>';
    document.getElementById("safe").innerHTML = '<h2 style="width: 100%; text-align: center;">PvE Members</h2>';
    const oldList = await util.getStoredJSON("memberList2Past");
    let storedList = await util.getStoredJSON("memberListPast");
    let memberList = await util.getStoredJSON("memberList");
    if (timeRange == "lastWeek") {
        memberList = storedList;
        storedList = oldList;
    }
    switch (sortMethod) {
        case "level":
            if (timeRange == "alltime") {
                memberList = memberList.sort((a, b) => {
                    return b.level - a.level;
                });
            } else {
                memberList = memberList.sort((a, b) => {
                    let storedA = storedList.find((element) => {
                        return a.user_id == element.user_id;
                    });
                    let storedB = storedList.find((element) => {
                        return b.user_id == element.user_id;
                    });
                    return (b.level - storedB.level) - (a.level - storedA.level);
                });
            }
            break;
        case "pvp":
            if (timeRange == "alltime") {
                memberList = memberList.sort((a, b) => {
                    return b.user_kills - a.user_kills;
                });
            } else {
                memberList = memberList.sort((a, b) => {
                    let storedA = storedList.find((element) => {
                        return a.user_id == element.user_id;
                    });
                    let storedB = storedList.find((element) => {
                        return b.user_id == element.user_id;
                    });
                    return (b.user_kills - storedB.user_kills) - (a.user_kills - storedA.user_kills);
                });
            }
            break;
        case "pve":
            if (timeRange == "alltime") {
                memberList = memberList.sort((a, b) => {
                    return b.npc_kills - a.npc_kills;
                });
            } else {
                memberList = memberList.sort((a, b) => {
                    let storedA = storedList.find((element) => {
                        return a.user_id == element.user_id;
                    });
                    let storedB = storedList.find((element) => {
                        return b.user_id == element.user_id;
                    });
                    return (b.npc_kills - storedB.npc_kills) - (a.npc_kills - storedA.npc_kills);
                });
            }
            break;
        case "steps":
            if (timeRange == "alltime") {
                memberList = memberList.sort((a, b) => {
                    return b.steps - a.steps;
                });
            } else {
                memberList = memberList.sort((a, b) => {
                    let storedA = storedList.find((element) => {
                        return a.user_id == element.user_id;
                    });
                    let storedB = storedList.find((element) => {
                        return b.user_id == element.user_id;
                    });
                    return (b.steps - storedB.steps) - (a.steps - storedA.steps);
                });
            }
    }
    
    let mn = 0;
    let mns = [0, 0, 0];
    for (let member of memberList) {
        let mem = memberTemplate.replace('%name', member.name);
        mem = mem.replace("%level", member.level.toLocaleString());
        mem = mem.replaceAll("%id", member.user_id);
        /*Add Label*/ switch (sortMethod) {
            case "level":
                if (timeRange == "alltime") {
                    mem = mem.replace("%label", ``);
                } else {
                    let stored = storedList.find((element) => {
                        return member.user_id == element.user_id;
                    });
                    let diff = member.level - stored.level;
                    mem = mem.replace("%label", `${diff.toLocaleString()} levels`);
                }
                break;
            case "pvp":
                if (timeRange == "alltime") {
                    mem = mem.replace("%label", `${member.user_kills.toLocaleString()} player kills`);
                } else {
                    let stored = storedList.find((element) => {
                        return member.user_id == element.user_id;
                    });
                    let diff = member.user_kills - stored.user_kills;
                    mem = mem.replace("%label", `${diff.toLocaleString()} player kills`);
                }
                break;
            case "pve":
                if (timeRange == "alltime") {
                    mem = mem.replace("%label", `${member.npc_kills.toLocaleString()} NPC kills`);
                } else {
                    let stored = storedList.find((element) => {
                        return member.user_id == element.user_id;
                    });
                    let diff = member.npc_kills - stored.npc_kills;
                    mem = mem.replace("%label", `${diff.toLocaleString()} NPC kills`);
                }
                break;
            case "steps":
                if (timeRange == "alltime") {
                    mem = mem.replace("%label", `${member.steps.toLocaleString()} steps`);
                } else {
                    let stored = storedList.find((element) => {
                        return member.user_id == element.user_id;
                    });
                    let diff = member.steps - stored.steps;
                    mem = mem.replace("%label", `${diff.toLocaleString()} steps`);
                }
        }
        let ml;
        let bg = "10, 10, 10";
        let bg2 = "10, 10, 10";
        mn++;
        if (mn % 2 == 0) {
            bg2 = "25, 25, 25";
        }
        document.getElementById("all").innerHTML += mem.replace("%bg", bg2);
        if (member.warrior === 1) {
            ml = document.getElementById("warriors");
            mns[0]++;
            if (mns[0] % 2 == 0) {
                bg = "25, 25, 25";
            }
        } else if (member.safe_mode === 0) {
            ml = document.getElementById("nonSafe");
            mns[1]++;
            if (mns[1] % 2 == 0) {
                bg = "25, 25, 25";
            }
        } else {
            ml = document.getElementById("safe");
            mns[2]++;
            if (mns[2] % 2 == 0) {
                bg = "25, 25, 25";
            }
        }
        mem = mem.replace("%bg", bg);
        ml.innerHTML += mem;
    }
}

let confirmResetWeekly = false;
async function resetWeekly() {
    if (confirmResetWeekly) {
        localStorage.setItem('memberList2Past', localStorage.getItem("memberListPast"))
        localStorage.setItem('memberListPast', localStorage.getItem("memberList"));
        loadGuildMemberList(document.getElementById("memberOptions").value, document.getElementById("memberOptionsMode").value);
        confirmResetWeekly = false;
        document.getElementById("resetWeekly").textContent = "Trigger Weekly Reset";
    } else {
        document.getElementById("resetWeekly").textContent = "Click Again to Confirm";
        confirmResetWeekly = true;
        setTimeout(() => {
            confirmResetWeekly = false;
            document.getElementById("resetWeekly").textContent = "Trigger Weekly Reset";
        }, 5000);
    }
}

function init() {
    document.getElementById("memberOptions").onchange = function(ev) {
        const time = document.getElementById("memberOptionsMode").value;
        loadGuildMemberList(ev.target.value, time);
    }
    document.getElementById("memberOptionsMode").onchange = function(ev) {
        const option = document.getElementById("memberOptions").value;
        loadGuildMemberList(option, ev.target.value);
    }
    loadStats()
}