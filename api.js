const { client } = require("./bot")
const config = require("./config")
const { addReloadEvent } = require("./chathandler")

const id = new RegExp('<(@&?|#)(\d{9,24})>');
const message_id = new RegExp('https:\/\/discord\.com\/channels\/(\d{9,25})\/(\d{9,25})\/(\d{9,25})');

async function getUser(string) {
    return await client.users.fetch(getId(string));
}

async function getMember(string, context = undefined) {
    var localId = getId(string);
    if (context !== undefined && context.guild !== undefined) {
        return context.guild.members.cache.get(localId);
    }
    
    client.guilds.cache.forEach((id, guild) => {
        if (guild.members.cache.get(localId) !== undefined) {
            return guild.members.cache.get(localId);
        }
    });

    return undefined;
}

async function getChannel(string, context = undefined) {
    let id = getId(string);
    if (context !== undefined && context.guild) {
        if (id !== undefined) {
            return await context.guild.channels.fetch(id);
        }
        let chan = context.guild.channels.cache.find((c) => c.name === string);
        if (chan !== undefined) {
            return Promise.resolve(chan);
        }
    }
    if (id !== undefined) {
        return await client.channels.fetch(id);
    }
    let chan = client.channels.cache.find((c) => c.name === string);
    if (chan !== undefined) {
        return Promise.resolve(chan);
    }
    return Promise.reject("Channel with ID \"" + string + "\" not found!");
}

function getId(string) {
    if (typeof string === "string") {
        if (id.test(string)) {
            return id.match(string)[1]; //The proper ID
        } else if (!isNaN(Number(string))) {
            return string;
        }
    } else if (typeof string === "number" || typeof string === "bigint") {
        return String(string);
    } else if (string.id !== undefined) {
        return string.id;
    } 
    return undefined;
}

async function getMessage(snowflake, context = undefined) {
    //Test if it is a URL
    if (message_id.test(snowflake)) {
        const split = message_id.match(snowflake);
        const guild = split[0];
        const chan = split[1];
        const msg = split[2];

        const realGuild = client.guilds.cache.get(guild);
        const realChan = realGuild.channels.cache.get(chan);
        const realMsg = await realChan.message.fetch(msg);

        if (realMsg !== undefined)
            return realMsg;

        return null;
    }

    //If a channel or guild was provided
    if (context !== undefined) {
        //A channel
        if (context.messages !== undefined) {
            const msg = await context.messages.fetch(snowflake);
            if (msg !== undefined) return msg;

            context.guild.channels.cache.forEach(async (id, channel) => {
                if (channel.messages !== undefined) {
                    const msg = await channel.messages.fetch(snowflake);
                    if (msg !== undefined) return msg;
                }
            });

            return null;
        } else if (context.channels !== undefined) { //A guild
            context.channels.cache.forEach(async (id, channel) => {
                if (channel.messages !== undefined) {
                    const msg = await channel.messages.fetch(snowflake);
                    if (msg !== undefined) return msg;
                }
            });
            return null;
        }
    }

    client.guilds.cache.forEach((id, guild) => {
        guild.channels.cache.forEach((id2, channel) => {
            const msg = channel.messages.cache.get(snowflake);
            if (msg !== undefined) {
                return msg;
            }
        })
    });
    return null;

}

async function isOp(snowflake) {
    return config.isOp(getId(snowflake));
}

async function isBlacklisted(snowflake) {
    return config.isUserBarred(getId(snowflake));
}

function subscribe(event, callback) {
    if (event === "reload") {
        addReloadEvent(callback);
    } else {
        client.on(event, callback);
    }
}

module.exports = {
    subscribe,
    isBlacklisted,
    isOp,
    getMember,
    getMessage,
    getChannel,
    getId,
    getUser
}