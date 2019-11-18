// IMPORTS
const api = require('./../api');
const sendMessage = require('./../messages');

//PROPERTIES
const eventReward = 3;

async function createEvent(message, args, client) {

    //Split up arguments for event creation
    args = args.join(' ').split(', ');

    //Generate date from input
    let date;
    if(args.length > 1) {
        date = convertDate(new Date(), args[1]);
    }

    //Check that it is atleast 2-3 arguments seperated by comma and that the date is yet to come
    if((args.length === 2 || args.length === 3) && new Date(date).getTime() > (new Date().getTime() + (60*60*1000))) {

        //Add event to database
        let res = await api.post(
            'events',
            {
                eventstart: date,
                ownerid: message.author.id,
                title: args[0],
                description: args[2] ? args[2] : ''
            }
        )
        //Check success
        if(res.data.id) {

            //SUCCESS
            sendMessage.sendMessage(
                message.channel,
                `Event Added`,
                `The event: **${res.data.title}**, will start at ${new Date(res.data.eventstart).toUTCString().substring(0, new Date(res.data.eventstart).toUTCString().length - 4)} GMT+1\n**Event ID: ${res.data.id}** created by ${client.users.get(res.data.ownerid).username}`
            )
        }
    } else {
        //FAIL
        sendMessage.sendMessage(
            message.channel,
            `Invalid Command`,
            `For help check out: \`%help\`\n\nYou can not:\n- Create an event for a day that has passed`
        )
    }
}

async function joinEvent(message, arg, client) {
    
    //check if arguments are missing
    if(arg == undefined) {
        sendMessage.missingArguments(message);
        return;
    }

    //get event from database
    let res = await api.get(`events/${arg}`);
    
    //get if person allready is registered on event
    let regCheck = await api.get(`registrations`,`event=${arg}&participant=${message.author.id}`)

    //If event exist, if not registered allready, if person is not the owner of event and that the event is not completed
    if(res.data.id && regCheck.data.length === 0 && res.data.ownerid != message.author.id && res.data.status === 0) {
        
        //Register for event
        await api.post(
        'registrations',
        {
            participant: message.author.id,
            event: arg
        });

        //SUCCESS
        sendMessage.sendMessage(
            message.channel,
            `${message.author.username} registered for ${res.data.title}`,
            `Looking forward to seeing you on the event. To view upcoming events, use: \`%event list\`\n\n**Event ID: ${res.data.id}** - created by ${client.users.get(res.data.ownerid).username}`
        )
    } else {
        //FAIL
        sendMessage.sendMessage(
            message.channel,
            `Invalid Command`,
            `For help check out: \`%help\`\n\nYou can not:\n- Register for your own event\n- Register more than once\n- Register for an event that does not exist\n- Register for an event that has happened`
        )
    }
}

async function leaveEvent(message, arg, client) {
    //check if arguments are missing
    if(arg == undefined || arg.length === 0) {
        sendMessage.missingArguments(message);
        return;
    }

    // Check if registered to event
    let res = await api.get('registrations', `event=${arg}&participant=${message.author.id}`)
    if (res.data.length === 1) {

        // Get information about the event for response
        let event = await api.get(`events/${arg}`)

        // Delete registration
        await api.delete('registrations', res.data[0].id);

        //SUCCESS
        sendMessage.sendMessage(
            message.channel,
            `${message.author.username} unregistered from ${event.data.title}`,
            `Sorry to see you leave, but there will be more events in the future.\n\n**Event ID: ${event.data.id}** - created by ${client.users.get(event.data.ownerid).username}`
        )

    } else {
        //FAIL
        sendMessage.sendMessage(
            message.channel,
            `Invalid Command`,
            `For help check out: \`%help\`\n\nYou can not:\n- Leave an event that does not exist\n- Leave an event you are not registered to\n- Leave an event you own. (Try deleting the event instead)\n`
        )
    }
}

async function changeEvent(message, args, client) {
    let event = await api.get(`events`, `id_in=${args[0]}`)
    
    //Check if event exist, check if author is admin or owner of event.
    if(event.data.length === 1 && (message.author.id == event.data[0].ownerid || message.member.hasPermission('checkAdmin'))) {
        
        //Manipulate new value data into array
        let newValue = args.slice(1).join(' ').split(':');
        newValue[0].toLowerCase()

        //Create an object and store new value into object
        let newdata = {};
        if(newValue.length === 2 && newValue[1].length > 0) {
            if(newValue[0] === 'title') {
                newdata.title = newValue[1];
            }
            if(newValue[0] === 'description') {
                newdata.description = newValue[1];
            }
            if(newValue[0] === 'date') {
                let date = new Date();
                newdata.eventstart = convertDate(date, newValue[1]);
            }
        }

        // Update the new value
        let res = await api.put('events', args[0], newdata)

        // SUCCESS
        sendMessage.sendMessage(
            message.channel,
            `Event Changed`,
            `The event: **${res.data.title}**, will start at ${new Date(res.data.eventstart).toUTCString().substring(0, new Date(res.data.eventstart).toUTCString().length - 4)} GMT+1\n\n**Event ID: ${res.data.id}** - created by ${client.users.get(res.data.ownerid).username}`
        )
    } else {

        // FAIL
        sendMessage.sendMessage(
            message.channel,
            `Invalid Command`,
            `For help check out: \`%help\`\n\nYou can not:\n- Update a event that does not exist\n- Have permission to change this event`
        )
    }
}

async function removeEvent(message, args, client) {

    // Get event
    let event = await api.get(`events`, `id_in=${args[0]}`)

    //Check if event exist, check if author is admin or owner of event.
    if(event.data.length === 1 && (message.author.id == event.data[0].ownerid || message.member.hasPermission('checkAdmin'))) {

        // Remove event and users registered to that event
        let res = await api.delete('events', args[0]);
        removeRegisteredFromEvent(args[0]);

        // SUCCESS
        sendMessage.sendMessage(
            message.channel,
            `Event Deleted`,
            `The event: **${event.data[0].title}**, was deleted by ${message.author.username}\n\nEvent was created by ${client.users.get(res.data.ownerid).username}`
        )
    } else {
        // FAIL
        sendMessage.sendMessage(
            message.channel,
            `Invalid Command`,
            `For help check out: \`%help\`\n\nYou can not:\n- Delete an event that does not exist\n- Delete an event because you do not have permission`
        )
    }
}

async function listEvent(message, client) {
    // Get the next 5 upcoming events
    let res = await api.get('events', `status=0&_sort=eventstart:ASC&_limit=5`)

    // Populate information to be displayed into an array
    let eventList = [];
    for(const event of res.data) {
        eventList.push({
            title: `${event.title}`,
            text: `Starts: ${new Date(event.eventstart).toUTCString().substring(0, new Date(event.eventstart).toUTCString().length - 4)} GMT+1\n\n**Event ID: ${event.id}** - created by ${client.users.get(event.ownerid).username}`,
            inline: false
        })
    }

    // SUCCESS
    sendMessage.sendMessage(
        message.channel,
        `Upcoming Events`,
        `These are the next five upcomiong events:`,
        eventList
    )
}

async function doneEvent(message, client) {
    // Get the next 5 upcoming events
    let res = await api.get('events', `status=1&_sort=eventstart:ASC`)

    // Populate information to be displayed into an array
    let eventList = [];
    for(const event of res.data) {
        eventList.push({
            title: `${event.title}`,
            text: `Started: ${new Date(event.eventstart).toUTCString().substring(0, new Date(event.eventstart).toUTCString().length - 4)} GMT+1\n\n**Event ID: ${event.id}** - created by ${client.users.get(event.ownerid).username}`,
            inline: false
        })
    }

    // SUCCESS
    sendMessage.sendMessage(
        message.channel,
        `Completed events`,
        `These events are currently waiting for admin approval:`,
        eventList
    )
}

async function approveEvent(message, arg, client) {

    //check if arguments are missing
    if(arg == undefined || arg.length === 0) {
        sendMessage.missingArguments(message);
        return;
    }

    // Get event by ID
    let res = await api.get(`events/${arg}`)
    console.log(res.data);
    if(res.data.status && message.member.hasPermission('checkAdmin') && res.data.status == 1) {
        let participants = await api.get(`registrations`, `event=${arg}`);

        // Give points to participants
        let participantNames = [];
        for(const participant of participants.data) {
            let user = await api.get('discordusers', `userid=${participant.participant}`)
            await api.put(`discordusers`, user.data[0].id, {
                points: user.data[0].points + eventReward,
                totalpoints: user.data[0].totalpoints + eventReward
            })
            participantNames.push(client.users.get(user.data[0].userid).username);
        }

        // Give points to owner
        let owner = await api.get('discordusers', `userid=${res.data.ownerid}`);
        await api.put(`discordusers`, owner.data[0].id, {
            points: owner.data[0].points + (eventReward * participants.data.length),
            totalpoints: owner.data[0].totalpoints + (eventReward * participants.data.length)
        });
        let ownerName = client.users.get(owner.data[0].userid).username;

        // Change status
        await api.put(`events`, arg, {status: 2});

        // SUCCESS
        sendMessage.sendMessage(
            message.channel,
            `${res.data.title} has been approved.`,
            `**These participants recive ${eventReward} points each:**\n${participantNames.join(', ')}\n\nThe event organizer ${ownerName} recive ${eventReward*participants.data.length} points.`
        )
    } else {
        sendMessage.sendMessage(
            message.channel,
            `Invalid Command`,
            `For help check out: \`%help\`\n\nYou can not:\n- Approve event if you are not an admin\n- Approve events that are not marked as done`
        )
    }
}


//Convert date DD-MM-YYYY HH:MM to date format
function convertDate(date, arg) {
    date.setDate(arg.substring(0,2));
    date.setFullYear(parseInt(arg.substring(6,10)));
    date.setMonth(parseInt(arg.substring(3,5))-1);
    date.setHours(parseInt(arg.substring(11,13))+1);
    date.setMinutes(arg.substring(14,16));
    date.setSeconds(0);
    return date;
}

//Removing all registered users from specific event
async function removeRegisteredFromEvent(eventid) {
    let users = await api.get(`registrations`,`event=${eventid}`)
    
    for(let user of users.data) {
        api.delete
        (
            `registrations`,
            user.id
        )
    }
}

module.exports = {
    createEvent: createEvent,
    changeEvent: changeEvent,
    removeEvent: removeEvent,
    listEvent: listEvent,
    leaveEvent: leaveEvent,
    joinEvent: joinEvent,
    doneEvent: doneEvent,
    approveEvent: approveEvent
}
