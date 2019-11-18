// IMPORTS
const Discord = require('discord.js');
const api = require('./api');
const sendMessage = require('./messages');
const score = require('./commands/score');
const event = require('./commands/event');

//Bot Data
const token = "NjQzODk1NDQyNjIyNjQ0MjU1.XdMSxQ.v4J-vLEmVm4YO7H-Ez08TAJpLBI";
const client = new Discord.Client();

//Bot ready
client.on('ready', () => {
    api.login();

    //Do interval every hour
    client.setInterval(()=>{
        doInterval();
        api.login();
    }, 3600000);
});


//When reciving message
client.on('message', message => {

    //Execute main method
    main(message);
});


async function main(message) {
    //Check if it is a command and if it is our discord channel
    if (message.content[0] == '%' && message.channel.guild && message.channel.guild.id == '537724736826900481') {
        //Try to get the user
        let res = await api.get('discordusers', `userid=${message.author.id}`);

        // User does not exist
        if(res.data.length === 0) {
            
            //Add the user
            await api.post(
            'discordusers',
            {
                userid: message.author.id
            })

            //SUCCESS
            sendMessage.sendMessage(
                message.channel,
                `Hello ${message.author.username}.`,
                'Nice to meet you. If you want to know how i work, you can use the command: \`%help\`'
            );

            //Delay a little so that welcome message is displayed before the executed command
            setTimeout(() => {
                commands(message)
            }, 30);

        } else {
            //If there allready is a user execute command directly
            commands(message);
        }
    }
}


async function doInterval() {
    //Check for completed events
    await findCompletedEvents();

    //List next 5 upcoming events
    event.listEvent({
        channel: client.channels.get('646092812194021436')
    }, client);

}

async function findCompletedEvents() {
    //Loop forever...
    do {
        //Earliest event that is not checked as done
        let res = await api.get('events',`status=0&_sort=eventstart:ASC&_limit=1`)

        //If event date has passed mark it as complete
        if(res.data.length > 0 && new Date(res.data[0].eventstart).getTime() < (new Date().getTime() + (60*60*1000))) {
            await api.put('events',res.data[0].id,
            {
                status: 1
            })


        //If not exit function and loop
        } else {
            return;
        }

    } while(true);
}

function commands(message) {
    let args = message.content.slice(1).split(' ');
    switch(args[0].toLowerCase()) {
        case 'help':
            help(message, args.slice(1));
            break;

        case 'scoreboard':
            score.scoreboard(message, client);
            break;

        case 'score':
            switch(args[1].toLowerCase()) {
                case 'to':
                    score.scoreTo(message);
                    break
                
                case 'mine':
                    score.scoreMine(message);
                    break;
                
                default:
                    break;
            }

            break;

        case 'event':
            switch(args[1].toLowerCase()) {
                case 'create':
                    event.createEvent(message, args.slice(2), client);
                    break;

                case 'join':
                    event.joinEvent(message, args.slice(2)[0], client);
                    break;
                
                case 'leave':
                    event.leaveEvent(message, args.slice(2)[0], client);
                    break;

                case 'change':
                    event.changeEvent(message, args.slice(2), client);
                    break;

                case 'delete':
                    event.removeEvent(message, args.slice(2), client);
                    break;
                
                case 'list':
                    event.listEvent(message, client);
                    break;

                case 'done':
                    event.doneEvent(message, client);
                    break;

                case 'approve':
                    event.approveEvent(message, args.slice(2), client);
                    break;
                
                default:
                    break;
            }
            break;
        
        case 'role':
            break;

        default:
            sendMessage.sendMessage(
                message.channel,
                `This command does not exist`,
                'To learn more use: \`%help\`'
            );
            break;
    }
}

client.login(token);


//HELP

function help(message, args) {
    if(args.length === 0) {
        args.push('default');

    }
    switch(args[0].toLowerCase()) {
        case 'event':
            sendMessage.sendMessage(
                message.channel,
                `Event commands:`,
                '',
                [
                    {
                        title: '%event create <event name>, <date>, <description>',
                        text: `Create new Event\n\n*Example:*\n\`%event create Tea Time, 11-01-2020 19:00, Chatting on discord with our friends while drinking tea.\`\n\nDate format: DD-MM-YYYY HH:MM\nDescription is optinal. But do not use comma.`,
                        inline: false
                    },
                    {
                        title: '%event change <event id> <title/description/date>:<new value>',
                        text: `Change Event.\n\n*Example:*\n\`%event change 1337 title:Dinner Time\`\n\nYou can change these values:\ntitle:<text>\ndescription:<text>\ndate:<DD-MM-YYYY HH:MM>\nYou can only change one thing for every change command you run`,
                        inline: false
                    },
                    {
                        title: '%event delete <event id>',
                        text: `Delete Event.\n\n*Example:*\n\`%event change 1337\`\n\nAs a Owner of an event or Admin you can delete a event.`,
                        inline: false
                    },
                    {
                        title: '%event join <event id>',
                        text: `Join a event.\n\n*Example:*\n\`%event join 1337\`\n\nEvent ID is displayed when creating event, listing events, changing events or viewing an event.`,
                        inline: false
                    },
                    {
                        title: '%event leave <event id>',
                        text: `Leave a event.\n\n*Example:*\n\`%event leave 1337\`\n\nEvent ID is displayed when creating event, listing events, changing events or viewing an event.`,
                        inline: false
                    },
                    {
                        title: '%event list',
                        text: `This command list all upcoming events.`,
                        inline: false
                    },
                    {
                        title: '%event done',
                        text: `This command list all events that are done and waiting for approval or waiting to get deleted`,
                        inline: false
                    },
                    {
                        title: '%event approve <event id>',
                        text: `Approve a event.\n\n*Example:*\n\`%event approve 1337\`\n\nOnly admins are able to approve events`,
                        inline: false
                    }
                ]
            );
            break;
        
        case 'score':
            sendMessage.sendMessage(
                message.channel,
                `Score commands:`,
                '',
                [
                    {
                        title: '%scoreboard',
                        text: `Display the top 5 scores for the month.\n\nThe best score will recive free Discord Nitro in the end of the month and the scores will be reset for next month.`,
                        inline: false
                    },
                    {
                        title: '%score to <usertag>',
                        text: `Give someone you love some score.\n\n*Example:*\n\`%score to Schedule Bot#6572\`\n\nThe person you give it to must be tagged. You can only give to one person every 24 hours, and not to yourself. This counts toward the scoreboard.`,
                        inline: false
                    },
                    {
                        title: '%score mine',
                        text: `You can use this command to view your own score`,
                        inline: false
                    }
                ]
            );
            break;
        
        case 'role':
            sendMessage.sendMessage(
                message.channel,
                `Role commands:`,
                ``,
                [
                    {
                        title: '%Coming Soon',
                        text: `Coming Soon`,
                        inline: false
                    }
                ]
            );
            break;

        default:
            sendMessage.sendMessage(
                message.channel,
                `Help Sections:`,
                `Welcome to Schedule Bot.\nThe bot has three type of commands:\n- Event Types\n- Score Types\n- Role Types\n\nBy writing the commands below you can view these commands in more detail.`,
                [
                    {
                        title: '%help event',
                        text: `Create, view, delete and register and unregister for events`,
                        inline: false
                    },
                    {
                        title: '%help score',
                        text: `Viewing score and giving score to someone you like`,
                        inline: false
                    },
                    {
                        title: '%help role',
                        text: `If you have more than 1000 score you can create a role and assign that to anyone you want.`,
                        inline: false
                    }
                ]
            );
            break;
    }
}