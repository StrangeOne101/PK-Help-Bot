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
exports.name = "command-template";
exports.usage = "command-template <message>";
exports.description = "A template for basic commands";
exports.disabled = true;
exports.canUse = function(sender) {
    /**
     * Some examples of what you could have in here...
     *
     * return ["145436402107154433"].indexOf(sender.id) != -1; //Specific users only
     *
     * return isOp(sender.id); //If they are an OP
     *
     * return true; //No limit
     */

    return false; //So this command cannot ever be run
}
exports.run = function(messageObj, channel, sender, args) {
    messageObj.reply("This is just an example command!")
}
