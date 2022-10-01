var chatMap = new Map();

var http = require("http");
var config = require("./config");
var discord = require("discord.js");
const commandsLib = require("./commands");
const { client } = require("./bot");

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
		
		
	} else {
		for (var [key, msg] of chatMap.entries()) {			
			//console.log("Debug message: " + message + " | key: " + key);
			msg = msg.replace("{SENDER}", sender);
			
			var exp = new RegExp(key, "i");
			if (exp.test(message)) {
				msgobj.client.lastUsedChannel = channel;
				await send(channel, sender, msg);
				break;
			}
		}
	}
}

async function handleCommand(command, args, sender, channel, msgobj) {
	if (config.isOp(sender.id)) { //Temp - Will be moved to files later
		if (command == "debug") {
			await channel.send(channel, sender, "Author: " + sender + ", ID: " + sender.id)
			return;
		} else if (command == "reload") {
			await send(channel, sender, "Reloading... one moment");
			config.load();
			commandsLib.loadCommands();
			for (callback of reloadEvents) {
				await callback();
			}
			const size = await fetchChatStuff();
			await send(channel, sender, "Reload successful! Loaded " + size + " regex commands!");
			return;
		} else if (command == "latency") {
			await send(channel, sender, "Current ping: " + parentM.client.ping);
			return;
		} else if (command == "bar") {
			if (msgobj.mentions.users.size == 0) {
				await sender.send("Incorrect usage! Make sure you specify a user! Usage: `!bar @user`");
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
				await sender.send("Incorrect usage! Make sure you specify a user! Usage: `!unbar @user`");
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
 * Fetches all chat stuff 
 */
async function fetchChatStuff() {
	chatMap.clear();
	
	const html = await request(config.getURL());
	for (var line of html.split("\n")) {
		if (line.lastIndexOf(config.getSplit()) !== -1) { //If line contains '>>'
			var regex = line.substr(0, line.lastIndexOf(config.getSplit())); //Get the first part of the string
			var line = line.substr(line.lastIndexOf(config.getSplit()) + config.getSplit().length, line.length); //Get the last part of the string
			
			regex = regex.trim(); //Removes extra spaces
			line = line.trim();
			
			chatMap.set(regex, line);
			console.log("Registered #" + chatMap.size + " regex command");
		}
	}
	
	console.log("Finished loading regex expressisons!");
	
	
	return chatMap.size;
}

/**
 * Send a message to a person. Depending on the channel, it may
 * be send via the channel or via DM.
 */
async function send(channel, sender, message) {
	if (!(channel instanceof discord.TextChannel)) { //If it's not a text channel, just reply. For group DMs or single DMs
		await channel.send(message);
		return;
	}
	
	var loud = config.getLoudChannels().indexOf(channel.name) !== -1;
	var quiet = config.getQuietChannels().indexOf(channel.name) !== -1;
	
	if (!loud && !quiet) {
		loud = config.getDefaultChannelType().toLowerCase() == "loud";
		quiet = !loud;
	}
	
	if (loud) { //If the bot is allowed to be voiced in the channel
		await channel.send(message);
	} else if (quiet) { //DM them the message if the bot can't reply to the channel
		await sender.send(message);
	} else {
		throw Exception("wtf is going on here?!?");
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
exports.fetchChatStuff = fetchChatStuff;
exports.setParent = function(module) {
	parentM = module;
}
exports.addReloadEvent = (callback) => {
	reloadEvents.push(callback);
}