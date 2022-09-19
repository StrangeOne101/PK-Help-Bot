const fs = require("fs");
const path = require("path");
const config = require("./config");

let commands = new Map();
let PREFIX = config.getCommandPrefix();

function loadCommands() {
	let dir = path.join(__dirname, "commands");
	console.log(dir);
	var command_no = 0;
	fs.readdir(dir, function(err, files) {
		if (err) {
			console.log("Unable to scan commands directory: " + err);
			return;
		}

		files.forEach(file => {
			let p = path.join(dir, file);
			const command = require(p);

			if (command.name && command.canUse && command.run) {
				if (command.disabled && command.disabled === true) {
					console.log("Command " + file + " disabled")
				} else {
					commands.set(command.name.replace("{prefix}", PREFIX).replace(" ", "-").toLowerCase(), command);
					command_no++;
				}
			}
		});

		console.log("Loaded " + command_no + " command(s).");
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