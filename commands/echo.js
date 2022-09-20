const { isOp, getChannel, getId } = require("./../api");

/**
 * This is a basic template for how commands should be setup.
 *
 * @field name The string of characters used to call this command. Do not add
 * the prefix to the start, or if you must, use {prefix}
 * @field usage How this command should be used. Provided in the help command.
 * @field description The description for this command
 * @function canUse Whether the sender can use this command or not. Must return
 * true if run() is ever to be called
 * @function run The code executed when this command is run
 */
module.exports = {
    name: "echo",
    usage: "echo <channel> <message>",
    description: "Send a message to a channel",
    canUse: async function(sender) {
        return isOp(sender.id);
    },
    run: async function(messageObj, channel, sender, args) {
        if (args.length < 2) {
            messageObj.reply("Usage is `" + exports.usage + "`")
            return;
        }

        const cha = args[0];
        getChannel(cha, messageObj).then((chan) => {
            if (chan === undefined) {
                messageObj.reply("Failed to find channel \"" + cha + "\"!");
                return;
            }
            console.log(args);
            args.shift();
            console.log(args);
            chan.send(args.join(" "));
            
            messageObj.react("\u2705");
        }).catch((msg) => {
            console.log("Msg : '" + msg + "'")
            if (msg !== 'undefined' && msg !== '') messageObj.reply(msg);
            else messageObj.reply("Failed to find channel \"" + cha + "\"!")
        });
    }
}
