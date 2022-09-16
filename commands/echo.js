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
exports.name = "echo";
exports.usage = "echo <channel> <message>";
exports.description = "Send a message to a channel";
exports.canUse = function(sender) {
    return isOp(sender.id);
}
exports.run = function(messageObj, channel, sender, args) {
    if (args.length < 2) {
        messageObj.reply("Usage is `" + exports.usage + "`")
        return;
    }

    var chan = getChannel(args[0]);
    args.pop();
    chan.send(args);
    
    messageObj.reply("Message sent!")
}
