const memberTemplate = `
    <div class="member" style="background-color: rgb(%bg)">
        <div class="memberInfo">
            <div class="one">
                <p><a href="https://web.simple-mmo.com/user/view/%id" target=_blank>%name</a></p>
                
                <p class="level">Level <b>%level</b></p>
            </div>
            <p class="pid">@%id</p>
        </div>
        <div class="label">%label
            <div>
                <div class="hoverpopup">
                    %popup
                </div>
            </div>
        </div>
    </div>
`;

async function getSGL() {
    const season = 14;
    const apikey = util.getApiKey();

    document.getElementById("sgl").innerHTML = '';
    const sgl = await api.getSGL(season, apikey);
    const guildGrads = await util.getGuildGradients();
    const rankTemplate = `
        <div class="sglRank" style="justify-content: space-between; %bg">
            <div class="sglRank">
                <p>%rank.</p>
                <img src="https://web.simple-mmo.com%img">
                <div class="one">
                    <p><a href="https://web.simple-mmo.com/guilds/view/%gid?new_page=true" target=_blank><span style="white-space: nowrap; %styleName">%name</span></a></p>
                    <p class="gexp"><b>%exp</b> EXP</p>
                </div>
            </div>
            <div class="sglRank">
                <p class="desktopOnlyBlock">+ <b>%gains</b> exp on war win</p>
                <button onclick="inspect(%gid)">Inspect</button>
            </div>
        </div>
    `;
    document.getElementById('sgl').style.display = 'block';
    for (let rank of sgl) {
        let r = rankTemplate.replace('%rank', rank.position);
        let bg = "background-color: rgb(10, 10, 10);"
        if (rank.position % 2 === 1) bg = "background-color: rgb(25, 25, 25);"
        r = r.replace('%bg', bg);
        r = r.replace('%img', rank.guild.icon);
        r = r.replace('%name', rank.guild.name);
        r = r.replace('%exp', rank.experience.toLocaleString());
        r = r.replace('%gains', Math.max(120000, Math.round(rank.experience*0.02)).toLocaleString());
        r = r.replaceAll('%gid', rank.guild.id);
        if (guildGrads[rank.guild.id.toString()]) 
            r = r.replace('%styleName', `background: -webkit-linear-gradient(${guildGrads[rank.guild.id.toString()]}); background-clip: text; color: transparent;`);
        else r = r.replace('%styleName', "")
        document.getElementById("sgl").innerHTML += r;
    }
}

async function inspect(guild_id) {
    const apikey = util.getApiKey();

    const info = await api.getGuildInfo(guild_id, apikey);
    let ml = document.getElementById("memberListInspect");
    ml.innerHTML = "<h2 style='text-align: center;'>Attackable Players</h2>";
    document.getElementById("infoName").textContent = `[${info.tag}] ${info.name}`;
    document.getElementById("infoExp").textContent = info.current_season_exp.toLocaleString();
    let type = 'PvP';
    if (info.passive === 1) {
        type = 'PvE';
        setInspectPvEVals();
    } else {
        let members = await api.getGuildMembers(guild_id, apikey);
        members = members.sort((a, b) => {
            return b.level - a.level;
        });
        let warriors = 0;
        let attackable = 0;
        const now = new Date();
        for (let member of members) {
            if (member.safe_mode === 0) {
                attackable++;                
                let mem = memberTemplate.replace('%name', member.name);
                mem = mem.replace("%level", member.level.toLocaleString());
                mem = mem.replaceAll("%id", member.user_id);
                let bg = "25, 25, 25";
                if (member.warrior === 1) {
                    warriors++;
                    let d = new Date();
                    d.setDate(now.getDate() - inactivityTime);
                    if (d < (new Date(member.last_activity*1000))) {
                        mem = mem.replace("%label", `<img style="width: 32px;" src="/smmo-guild-tools/assets/sword_with_background.png">`);
                        mem = mem.replace("%popup", `
                            <div class="popupheader">
                                <img style="width: 32px;" src="/smmo-guild-tools/assets/sword_with_background.png">
                                <p>Warrior</p>
                            </div>
                            <hr>
                            <p class=mini>Attack targets up to 1.1x their level.</p>
                            %popup`)
                    } else {
                        mem = mem.replace("%label", `<img style="filter: grayscale(100%); width: 32px;" src="/smmo-guild-tools/assets/sword_with_background.png">`);
                        mem = mem.replace("%popup", `
                            <div class="popupheader">
                                <img style="filter: grayscale(100%); width: 32px;" src="/smmo-guild-tools/assets/sword_with_background.png">
                                <p>Inactive Warrior</p>
                            </div>
                            <hr>
                            <p class=mini>Does not attack.<br>Included in all calculations as a target.</p>
                            %popup`)
                    }
                    
                } else {
                    mem = mem.replace("%label", `<img style="width: 32px;" src="/smmo-guild-tools/assets/shield.png">`);
                    mem = mem.replace("%popup", `
                        <div class="popupheader">
                                <img style="width: 32px;" src="/smmo-guild-tools/assets/shield.png">
                                <p>Attackable Member</p>
                            </div>
                            <hr>
                            <p class=mini>Does not attack.<br>Included in calculations as a target depending on the "Include non-warriors in calculations" setting toggle.</p>
                            %popup`)
                }
                mem = mem.replace("%bg", bg);
                mem = mem.replace("%popup", ``)
                ml.innerHTML += mem;
            }
        }
        const yourMembers = await util.getStoredJSON("memberList");
        if (yourMembers) {
            const probs = util.calculateProbability(now, yourMembers, members);
            console.log(probs)
            setInspectPvPVals(info.current_season_exp, warriors, attackable, probs);
        } else {
            setInspectPvPVals(info.current_season_exp, warriors, attackable, ["?", "?", "?"]);
        }
        
    }
    document.getElementById("infoType").textContent = type;
    document.getElementById("guildInfo").style.left = "max(100vw - 576px, 0px)";
    
}

function setInspectPvEVals() {
    document.getElementById("infoStats").style.display = "none";
    document.getElementById("infoWinP").style.display = "none";
}

function setInspectPvPVals(exp, warriors, attackable, probs) {
    document.getElementById("infoStats").style.display = "flex";
    document.getElementById("infoWinP").style.display = "block";
    document.getElementById("infoWin").textContent = Math.max(120000, Math.round(exp*0.02)).toLocaleString();
    document.getElementById("infoWarriors").textContent = warriors;
    document.getElementById("infoTargets").textContent = attackable;
    document.getElementById("infoProb").textContent = `${probs[0]}%`;
    document.getElementById("infoTheirKills").textContent = probs[1].toLocaleString();
    document.getElementById("infoYourKills").textContent = probs[2].toLocaleString();
    document.getElementById("infoRatio").style.width = `${probs[0]}%`
}

function closeInfo() {
    document.getElementById("guildInfo").style.left = "100vw";
}


function init() {
    getSGL();
}
