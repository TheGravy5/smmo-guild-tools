async function updateGuildList() {
    const apikey = util.getApiKey();
    document.getElementById("content").style.display="none";
    document.getElementById("progressCounter").textContent = "Guilds fetched: 0";
    document.getElementById("progress").style.display="flex";
    let arr = await new Promise((resolve) => {
        
        guildFetchProcess([], 1, apikey, resolve)
    });
    arr = arr.filter((guild) => guild.current_season_exp === 0 && guild.passive === 0);
    util.saveJSON("inactiveGuilds", arr)
    document.getElementById("content").style.display="flex";
    document.getElementById("progress").style.display="none";

}

async function guildFetchProcess(arr, page, apikey, res) {
    const guilds = await api.getAllGuilds(apikey, page);
    arr = [...arr, ...guilds.data];
    console.log(page);
    document.getElementById("progressCounter").textContent = `Guilds fetched: ${arr.length}`;

    if (guilds.next_page_url) {
        setTimeout(async() => {
            page++;
            guildFetchProcess(arr, page, apikey, res)
        }, 2000);
    } else res(arr);
}

async function guildInfoFetchProcess(arr, num, list, apikey, res) {
    console.log(list[num]);
    const guild = await api.getGuildInfo(list[num].id, apikey);
    
    delete guild.members;
    console.log(guild);
    if ( (true || guild.eligible_for_guild_war) && (guild.member_count >= 10) ) {
        arr.push(guild)
    }
    console.log(num);
    const mins = Math.trunc((list.length - (num+1)) / 30)
    const secs = (list.length - (num+1))*2 % 60;
    document.getElementById("progressCounter").textContent = `Determining best war targets... ${num+1} out of ${list.length} - at least ${mins} minutes ${secs} seconds remaining.`;

    if (num+1 < list.length) {
        setTimeout(async() => {
            num++;
            guildInfoFetchProcess(arr, num, list, apikey, res)
        }, 2000);
    } else res(arr);
}

async function planWars() {
    const apikey = util.getApiKey();
    


    document.getElementById("progressCounter").textContent = `Determining best war targets...`;
    document.getElementById("content").style.display="none";
    document.getElementById("progress").style.display="flex";


    const guildList = await util.getStoredJSON("inactiveGuilds");
    let guildInfo = await new Promise((resolve) => {
        guildInfoFetchProcess([], 0, guildList, apikey, resolve);
    });
    
    document.getElementById("progressCounter").textContent = "Determining best war targets... Generating list";
    guildInfo = guildInfo.sort((a, b) => a.member_count < b.member_count);
    util.saveJSON("warPlannerTargets", guildInfo)
    loadTargets(guildInfo);
}

function loadTargets(guildInfo) {
    const template = `
        <a href="https://web.simple-mmo.com/guilds/view/%id?new_page=true" target="_blank" class="wlItem">
            <div>
                <img src="https://web.simple-mmo.com/img/icons/%icon">
                <p>%guildName</p>
            </div>
            <p>Member count: %members</p>
            
        </a>
    `;

    const wl = document.getElementById("warList");
    wl.innerHTML = "";


    for (const guild of guildInfo) {
        let wlitem = template.replace("%icon", guild.icon);
        wlitem = wlitem.replace("%guildName", guild.name);
        wlitem = wlitem.replace("%members", guild.member_count);
        wlitem = wlitem.replace("%id", guild.id);
        wl.innerHTML += wlitem;
    }
    document.getElementById("content").style.display="flex";
    document.getElementById("progress").style.display="none";
}

async function init() {
    const g = await util.getStoredJSON("warPlannerTargets");
    if (g)
        loadTargets(g);
}