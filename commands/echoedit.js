const { isOp, getMessage } = require("../api");
const { client } = require("../bot");

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
    name: "echoedit",
    usage: "echoedit <message_id> <new message>",
    description: "Edit a message sent by the bot",
    canUse: async function(sender) {
        return isOp(sender.id);
    },
    run: async function(messageObj, channel, sender, args) {
        if (args.length < 2) {
            messageObj.reply("Usage is `" + exports.usage + "`")
            return;
        }

        const messageId = args[0];
        getMessage(messageId, channel).then((message) => {
            if (message === undefined) {
                messageObj.reply("Failed to find message \"" + messageId + "\"!");
                return;
            }
            if (message.author.id != client.user.id) {
                messageObj.reply("That message was not sent by the bot!");
                return;
            }
            args.shift();
            message.edit(args.join(" "));
            
            messageObj.react("\u2705"); //Check mark
        }).catch((msg) => {
            messageObj.reply("Failed to find message \"" + messageId + "\"!");
        });
    }
}
