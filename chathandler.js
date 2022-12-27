var http = require("http");
var config = require("./config");
var discord = require("discord.js");
const commandsLib = require("./commands");

const reloadEvents = [];

var parentM;

const emoji_tickbox = "\u2705";
const emoji_cross = "\u274C";

async function handle(message, sender, channel, msgobj) {
	//var isOp = sender.id == "145436402107154433"; //ID of the owner of the bot
	var isOp = config.isOp(sender.id);
	const pre = config.getCommandPrefix();
	
	if (config.isUserBarred(sender.id) && !isOp) return;
	if (isChannelIgnored(channel)) return;
	
	if (message.startsWith(pre)) {
		message = message.toLowerCase();
		
		//This cuts the first arg off and splits the rest
		var args = message.substr(message.substr(pre.length).split(" ")[0].length + pre.length + (message.indexOf(' ') != -1 ? 1 : 0)).split(" ");
		try {
			msgobj.client.lastUsedChannel = channel;
			await handleCommand(message.substr(config.getCommandPrefix().length).split(" ")[0], args, sender, channel, msgobj);
		} catch (exception) {
			console.log(exception);
			await send(channel, sender, "An error occurred while running this command. Please check the console.")
		}
	}
}

async function handleCommand(command, args, sender, channel, msgobj) {
	if (config.isOp(sender.id)) { //Temp - Will be moved to files later
		if (command == "debug") {
			await channel.send(`Author: ${sender}, ID: ${sender.id}`);
			return;
		} else if (command == "reload") {
			await channel.send("Reloading... one moment");
			console.log("Reloading from config...");
			config.load();
			commandsLib.loadCommands();
			for (callback of reloadEvents) {
				await callback();
			}
			await channel.send("Reload successful!");
			return;
		} else if (command == "latency") {
			await channel.send(`Latency is ${Date.now() - msgobj.createdTimestamp}ms. API Latency is ${Math.round(msgobj.client.ws.ping)}ms`);
			return;
		} else if (command == "bar") {
			if (msgobj.mentions.users.size == 0) {
				await channel.send("Incorrect usage! Make sure you specify a user! Usage: `!bar @user`");
				await msgobj.react(emoji_cross);
			} else {
				for (var [id, user] of msgobj.mentions.users) {
					config.barUser(id);
				}
				await msgobj.react(emoji_tickbox);
			}
			return;
		} else if (command == "unbar") {
			if (msgobj.mentions.users.size == 0) {
				await channel.send("Incorrect usage! Make sure you specify a user! Usage: `!unbar @user`");
				await msgobj.react(emoji_cross);
			} else {
				for (var [id, user] of msgobj.mentions.users) {
					config.unbarUser(id);
				}
				await msgobj.react(emoji_tickbox);
			}
			return;
		}

	}

	if (commandsLib.isCommand(command)) {
		if (commandsLib.canUseCommand(command, sender)) {
			await commandsLib.runCommand(command, sender, msgobj);
		}
	}

}

/**
 * Returns true if the provided channel should be ignored.
 */
function isChannelIgnored(channel) {
	return channel instanceof discord.TextChannel && config.getIgnoredChannels().indexOf(channel.name) !== -1;
}

/**
 * Makes an HTTP request to the given url and
 * calls callback(html)
 */
function request(url) {
	if (url.startsWith("https://")) url = url.substr(8);
	else if (url.startsWith("http://")) url = url.substr(7);
	
	var urlbase = url.split("/")[0];
	var tempArray = url.split("/");
	tempArray.reverse().pop();
	tempArray.reverse();
	var path = "/" + tempArray.join("/");
		
	//console.log("URL BASE: " + urlbase);
	//console.log("Path: " + path);

	return new Promise((res, rej) => { // TODO: handle errors, use rej
		http.get({
			hostname: urlbase,
			path: path,
			agent: false
		}, (response) => {
			var body = '';
			response.on('data', function(d) {
				body += d;	
				//console.log("HTTP REQUEST GOT: " + d)
			});
			response.on('end', function() {
				res(body);
			});
		});
	});
}
exports.handle = handle;
exports.setParent = function(module) {
	parentM = module;
}
exports.addReloadEvent = (callback) => {
	reloadEvents.push(callback);
}