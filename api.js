const { client } = require("./bot.js")
const config = require("./config.js")

const id = new RegExp('<(@&?|#)(\d{9,24})>');
const message_id = new RegExp('https:\/\/discord\.com\/channels\/(\d{9,25})\/(\d{9,25})\/(\d{9,25})');

export function getUser(string) {
    return client.users.fetch(getId(string));
}

export function getMember(string, context) {
    var localId = getId(string);
    if (context !== 'undefined' && context.guild !== 'undefined') {
        return context.guild.members.cache.get(localId);
    }
    
    client.guilds.cache.forEach((id, guild) => {
        if (guild.members.cache.get(localId) !== 'undefined') {
            return guild.members.cache.get(localId);
        }
    });

    return null;
}

export function getChannel(string) {
    return await client.channels.fetch(getId(string));
}

export function getId(string) {
    if (typeof string === "string") {
        if (id.test(string)) {
            return id.match(string)[1]; //The proper ID
        } else if (Number(string) != NaN) {
            return string;
        }
    } else if (typeof string === "number" || typeof string === "bigint") {
        return String(string);
    } else if (string.id !== 'undefined') {
        return string.id;
    } 
    return "";
}

export function getMessage(snowflake, context) {
    //Test if it is a URL
    if (message_id.test(snowflake)) {
        const split = message_id.match(snowflake);
        const guild = split[0];
        const chan = split[1];
        const msg = split[2];

        const realGuild = client.guilds.cache.get(guild);
        const realChan = realGuild.channels.cache.get(chan);
        const realMsg = await realChan.message.fetch(msg).get();

        if (realMsg !== 'undefined')
            return realMsg;

        return null;
    }

    //If a channel or guild was provided
    if (context !== 'undefined') {
        //A channel
        if (context.messages !== 'undefined') {
            const msg = await context.messages.fetch(snowflake);
            if (msg !== 'undefined') return msg;

            context.guild.channels.cache.forEach((id, channel) => {
                if (channel.messages !== 'undefined') {
                    const msg = await channel.messages.fetch(snowflake);
                    if (msg !== 'undefined') return msg;
                }
            });

            return null;
        } else if (context.channels !== 'undefined') { //A guild
            context.channels.cache.forEach((id, channel) => {
                if (channel.messages !== 'undefined') {
                    const msg = await channel.messages.fetch(snowflake);
                    if (msg !== 'undefined') return msg;
                }
            });
            return null;
        }
    }

    client.guilds.cache.forEach((id, guild) => {
        guild.channels.cache.forEach((id2, channel) => {
            const msg = channel.messages.cache.get(snowflake);
            if (msg !== 'undefined') {
                return msg;
            }
        })
    });
    return null;

}

export function isOp(snowflake) {
    return config.isOp(getId(snowflake));
}

export function isBlacklisted(snowflake) {
    return config.isUserBarred(getId(snowflake));
}