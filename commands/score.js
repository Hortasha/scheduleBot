//Properties
const freescore = 1;

// IMPORTS
const api = require('./../api');
const sendMessage = require('./../messages');
const event = require('./event');


async function scoreboard(message, client) {
    //Get 5 discord users with the most points
    let res =  await api.get('discordusers', `_sort=points:DESC&_limit=5`)


    //Push output to fields and return message
    let fields = [];
    for(const [i, obj] of res.data.entries()) {
        fields.push({
            title: i+1 + ". " + client.users.get(obj.userid).username,
            text: `${obj.points} Points`,
            inline: false
        })
    }
    
    //SUCCESS
    sendMessage.sendMessage(
        message.channel,
        `Monthly scoreboard:`,
        'These are the users with the highest score this month',
        fields
    );
}

async function scoreTo(message) {

    //Only one user is mentioned. This user is not themselves.
    if(message.mentions.users.array().length === 1 && message.mentions.users.first().id != message.author.id) {

        //Get user information of the author and reciver
        let res = await api.get('discordusers', `userid_in=${message.author.id}&userid_in=${message.mentions.users.first().id}`);
        
        //Find what data is the author
        let author = 1;
        let reciver = 0;
        if(res.data[0].userid === message.author.id) {
            author = 0;
            reciver = 1;
        }

        //Check if it has been over 24 hours sence last time, and that reciver exist
        if((event.newDate().getTime() - new Date(res.data[author].lastgive).getTime() > (24*60*60*1000)) && res.data.length === 2) {
        
            //Give points to reciver
            let updated = await api.put(
            'discordusers',
            res.data[reciver].id,
            {
                totalpoints: parseInt(res.data[reciver].totalpoints)+freescore,
                points: parseInt(res.data[reciver].points)+freescore
            })

            //Update the time that point was given for author
            await api.put(
                'discordusers',
                res.data[author].id,
                {
                    lastgive: event.newDate().getTime()
                }
            )

            // SUCCESS
            sendMessage.sendMessage(
                message.channel,
                `${message.author.username} increased the score of ${message.mentions.users.first().username}`,
                `${message.mentions.users.first().username} has their score increased by ${freescore} to:\nTotal Points: ${updated.data.totalpoints}\nMonthly Points: ${updated.data.points}`
            )
                
        } else {
            // FAIL
            sendMessage.sendMessage(
                message.channel,
                `Invalid Command`,
                `For help check out: \`%help\`\n\nYou can not:\n- Increase someones score more than once every 24 hours.\n- Give score to anyone that has not registered for the bot.\n- Increase someones score within 24 hours of first interacting with the bot.`
            )
        }


    // FAIL
    } else {
        sendMessage.sendMessage(
            message.channel,
            `Invalid Command`,
            `For help check out: \`%help\`\n\nYou can not:\n- Give yourself score\n- Mention mention more or less than one person`
        )
    }
}

async function scoreMine(message) {

    //Get author score
    let res = await api.get(`discordusers`, `userid=${message.author.id}`)

    //SUCCESS
    sendMessage.sendMessage(
        message.channel,
        `Score - ${message.author.username}`,
        `Total Score:\n${res.data[0].totalpoints} Points\n\nScoreboard:\n${res.data[0].points} Points`
    )
}

async function giveScore(message, args) {
    //Only one user is mentioned. This user is not themselves.
    if(message.mentions.users.array().length !== 1 && message.mentions.users.first().id == message.author.id) {
        sendMessage.missingArguments(message);
        return;
    }
    const reciver = await api.get(`discordusers`, `userid=${message.mentions.users.first().id}`);
    const giver = await api.get(`discordusers`, `userid=${message.author.id}`);
    let arg = parseInt(args[1], 10)
    if(arg !== NaN && giver.data[0].totalpoints > arg && arg > 0) {
        api.put(`discordusers`, reciver.data[0].id, {
            totalpoints: parseInt(reciver.data[0].totalpoints, 10) + arg
        })
        api.put(`discordusers`, giver.data[0].id, {
            totalpoints: parseInt(giver.data[0].totalpoints, 10) - arg
        })

        // SUCCESS
        sendMessage.sendMessage(
            message.channel,
            `${message.author.username} increased the total score of ${message.mentions.users.first().username}`,
            `${message.mentions.users.first().username} has their total score increased by ${arg} to:\nTotal Points: ${parseInt(reciver.data[0].totalpoints, 10) + arg}`
        )
    } else {
        // FAIL
        sendMessage.sendMessage(
            message.channel,
            `Invalid Command`,
            `For help check out: \`%help\`\n\nYou can not:\n- Give away more points than you have\n- Give away negative points\n- You must provide points as a number`
        )
    }
}

async function refreshScore(message, client) {
    if(message.member.hasPermission('checkAdmin') == false) {
        sendMessage.sendMessage(
            message.channel,
            `Invalid Command`,
            `For help check out: \`%help\`\n\nYou can not:\n- Reset the scoreboard unless you are an admin`
        )
        return;
    }
    const topscore = await api.get(`discordusers`, `_sort=points:DESC`);
    const count = await api.get(`discordusers/count`);
    let i = 0;
    let id = 1;
    while(i < count.data) {
        let user = await api.get(`discordusers/${id}`);
        if(user.status === 200) {
            i++;
            await api.put(`discordusers`, id, {
                points: 0
            });
        }
        id++;
    }
    sendMessage.sendMessage(
        message.channel,
        `Scoreboard is reset`,
        `${client.users.get(topscore.data[0].userid).username} had the highest score before the scoreboard reset. Well done.`
    )
}

async function resetScore(message, client) {
    if(message.member.hasPermission('checkAdmin') == false) {
        sendMessage.sendMessage(
            message.channel,
            `Invalid Command`,
            `For help check out: \`%help\`\n\nYou can not:\n- Reset score unless you are an admin`
        )
        return;
    }
    const topscore = await api.get(`discordusers`, `_sort=totalpoints:DESC`);
    const count = await api.get(`discordusers/count`);
    let i = 0;
    let id = 1;
    while(i < count.data) {
        let user = await api.get(`discordusers/${id}`);
        if(user.status === 200) {
            i++;
            await api.put(`discordusers`, id, {
                points: 0,
                totalpoints: 0
            });
        }
        id++;
    }
    sendMessage.sendMessage(
        message.channel,
        `All score is reset. Starting over.`,
        `${client.users.get(topscore.data[0].userid).username} had the highest score before the reset. Well done.`
    )
}

module.exports = {
    scoreboard: scoreboard,
    scoreTo: scoreTo,
    scoreMine: scoreMine,
    giveScore: giveScore,
    refreshScore: refreshScore,
    resetScore: resetScore
}
