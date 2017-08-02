var chatMap = new Map();

var http = require("http");
var config = require("./config");
var discord = require("discord.js");

var parentM;

var barred = [];

var emoji_tickbox = "\u2705";
var emoji_cross = "\u274C";

function handle(message, sender, channel, msgobj) {
	//var isOp = sender.id == "145436402107154433"; //ID of the owner of the bot
	var isOp = config.isOp(sender.id);
	
	if (config.isBarred(sender.id) && !isOp) return;
	if (isChannelIgnored(channel)) return;
	
	if (message.startsWith("!") && isOp) {
		message = message.toLowerCase();
		
		//This cuts the first arg off and splits the rest
		var args = message.substr(message.substr(1).split(" ")[0].length + (message.indexOf(' ') != -1 ? 1 : 0)).split(" ");
		try {
			handleCommand(message.substr(1).split(" ")[0], args, sender, channel, msgobj);
		} catch (exception) {
			console.log(exception);
			send(channel, sender, "An error occured while running this command. Please check the console.")
		}
		
		
	} else {
		for (var [key, msg] of chatMap.entries()) {			
			//console.log("Debug message: " + message + " | key: " + key);
			msg = msg.replace("{SENDER}", sender);
			
			var exp = new RegExp(key, "i");
			if (exp.test(message)) {
				send(channel, sender, msg);
				break;
			}
		}
	}
}

function handleCommand(command, args, sender, channel, msgobj) {
	if (command == "debug") {
		channel.send(channel, sender, "Author: " + sender + ", ID: " + sender.id)
	}
	
	else if (command == "reload") {
		send(channel, sender, "Reloading... one moment");
		config.load();
		fetchChatStuff(function(size) {
			send(channel, sender, "Reload successful! Loaded " + size + " regex commands!");
		});
	} else if (command == "latency") {
		send(channel, sender, "Current ping: " + parentM.client.ping);
	} else if (command == "bar") {
		if (msgobj.mentions.users.size == 0) {
			sender.send("Incorrect usage! Make sure you specify a user! Usage: `!bar @user`");
			msgobj.react(emoji_cross);
		} else {
			for (var [id, user] of msgobj.mentions.users) {
				config.barUser(id);
			}
			msgobj.react(emoji_tickbox);
		}
	} else if (command == "unbar") {
		if (msgobj.mentions.users.size == 0) {
			sender.send("Incorrect usage! Make sure you specify a user! Usage: `!bar @user`");
			msgobj.react(emoji_cross);
		} else {
			for (var [id, user] of msgobj.mentions.users) {
				config.unUser(id);
			}
			msgobj.react(emoji_tickbox);
		}
	}		
}

/**
 * Fetches all chat stuff 
 */
function fetchChatStuff(callback) {
	chatMap.clear();
	
	request(config.getURL(), function(html) {
		for (var i in html.split("\n")) {
			var line = html.split("\n")[i];
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
		
		
		if (typeof callback !== "undefined") {
			callback(chatMap.size);
		}
	});
}

/**
 * Send a message to a person. Depending on the channel, it may
 * be send via the channel or via DM.
 */
function send(channel, sender, message) {
	if (!(channel instanceof discord.TextChannel)) { //If it's not a text channel, just reply. For group DMs or single DMs
		channel.send(message);
		return;
	}
	
	var loud = config.getLoudChannels().indexOf(channel.name) !== -1;
	var quiet = config.getQuietChannels().indexOf(channel.name) !== -1;
	
	if (!loud && !quiet) {
		loud = config.getDefaultChannelType().toLowerCase() == "loud";
		quiet = !loud;
	}
	
	if (loud) { //If the bot is allowed to be voiced in the channel
		channel.send(message);
	} else if (quiet) { //DM them the message if the bot can't reply to the channel
		sender.send(message);
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
function request(url, callback) {
	if (url.startsWith("https://")) url = url.substr(8);
	else if (url.startsWith("http://")) url = url.substr(7);
	
	var urlbase = url.split("/")[0];
	var tempArray = url.split("/");
	tempArray.reverse().pop();
	tempArray.reverse();
	var path = "/" + tempArray.join("/");
	
	//console.log("URL BASE: " + urlbase);
	//console.log("Path: " + path);
	
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
			callback(body);
		});
	})
}
exports.handle = handle;
exports.fetchChatStuff = fetchChatStuff;
exports.setParent = function(module) {
	parentM = module;
}