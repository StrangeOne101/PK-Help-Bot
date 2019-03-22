const fs = require("fs");
const config = require("./config");

let commands = new Map();
let PREFIX = config.getCommandPrefix();

function loadCommands() {
	let path = fs.join(__dirname, "commands");
	fs.readdir(path, function(err, files) {
		if (err) {
			console.log("Unable to scan commands directory: " + err);
			return;
		}

		files.forEach(file => {
			const command = require(file);

			if (command.name && command.canRun && command.run) {
				commands.put(command.name.replace("{prefix}", PREFIX).replace(" ", "-").toLowerCase(), command);
			}
		});

		console.log("Loaded " + files.length + " commands.");
	});
}

/**
 * Checks if the provided command is valid
 * @param command string
 * @returns {boolean}
 */
function isCommand(command) {
	return commands.has(command.toLowerCase());
}

/**
 *
 * @param command string
 * @returns {any}
 */
function getCommand(command) {
	return commands.get(command.toLowerCase())
}

function canUseCommand(command, sender) {
	return isCommand(command) && getCommand(command).canUse !== 'undefined' && getCommand(command).canUse(sender);
}

function runCommand(command, sender, message) {
	//This cuts the first arg off and splits the rest
	let args = message.indexOf(' ') == -1 ? [] : message.substr(message.split(" ")[0].length + 1).split(" ");

	try {
		getCommand(command).run(message, message.channel, sender, args);
	} catch (e) {
		console.log(e);
	}
}

exports.loadCommands = loadCommands;
exports.canUseCommand = canUseCommand;
exports.isCommand = isCommand;
exports.runCommand = runCommand;