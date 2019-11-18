const Discord = require('discord.js')


//message template
function sendMessage(channel, title, description, fields = []) {
    const embed = new Discord.RichEmbed()
        .setTitle(title)
        .setColor(0x34bdeb)
        .setDescription(description)
        .setFooter('Schedule your events with Schedule Bot!')
        .setThumbnail('https://cdn.discordapp.com/avatars/643895442622644255/7311f70dfd7021cbd86dfedb64959493.png')

    for(const field of fields) {
        embed.addField(
            `------------------`,
            `**${field.title.toUpperCase()}**\n${field.text}\n\n`,
            field.inline
        );
    }
    channel.send(embed)
}

//Standard Messages
function missingArguments(message) {
    sendMessage(
        message.channel,
        `Invalid Command`,
        `For help check out: \`%help\`\n\nDid you forget the arguments?.`
    )
}

module.exports = {
    sendMessage: sendMessage,
    missingArguments: missingArguments
}