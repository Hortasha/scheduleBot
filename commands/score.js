//Properties
const freescore = 1;

// IMPORTS
const api = require('./../api');
const sendMessage = require('./../messages');


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
        if(((new Date().getTime()) - new Date(res.data[author].lastgive).getTime() > (24*60*60*1000)) && res.data.length === 2) {
        
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
                    lastgive: new Date().getTime() + 1*60*60*1000
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
        `Total Score:\n${res.data[0].totalpoints} Points\n\nMonthly Score:\n${res.data[0].points} Points`
    )
}

module.exports = {
    scoreboard: scoreboard,
    scoreTo: scoreTo,
    scoreMine: scoreMine
}
