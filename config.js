var fs = require("fs");

var config = {};

var file = "./config/config.json";

//Get document, or throw exception on error


function load() {
	try {
		console.log("Loading config...");
		config = JSON.parse(fs.readFileSync(file, 'utf8'));
		console.log("JSON Config loaded!");
	} catch (e) {
		console.log(e);
		return false;
	}
	return true;
}

function save() {
	if (typeof config.BarredUsers === 'undefined') config.BarredUsers = [];
	if (typeof config.Ops === 'undefined') config.Ops = [];
	if (typeof config.Token === 'undefined') config.Token = "***insertTokenHere***";
	if (typeof config.URL === 'undefined') config.URL = "https://pastebin.com/raw/zYBsBi5R";
	if (typeof config.Split === 'undefined') config.Split = ">>";
	if (typeof config.CommandPrefix === 'undefined') config.CommandPrefix = "!";
	try {
		fs.writeFileSync(file, JSON.stringify(config));
	} catch (e) {
		console.log(e);
		return false;
	}
	return true;
}

function isUserBarred(id) {
	return config.BarredUsers.indexOf(id) != -1;
}

function barUser(id) {
	if (isUserBarred(id)) return false;
	config.BarredUsers.push(id);
	save();
	return true;
}

function unbarUser(id) {
	if (!isUserBarred(id)) return false;
	
	config.BarredUsers = config.BarredUsers.filter((item)=>item != id);
	save();
	return true;
}

function isOp(id) {
	return config.Ops.includes(id);
}

function getToken() {
	return typeof config.Token === 'undefined' ? "***insertTokenHere***" : config.Token;
}

function getURL() {
	return config.URL;
}

function getSplit() {
	return typeof config.Split === 'undefined' ? ">>" : config.Split;
}

function getCommandPrefix() {
	return typeof config.CommandPrefix === 'undefined' ? "!" : config.CommandPrefix;
}

function getDefaultChannelType() {
	return typeof config.DefaultChannelType === 'undefined' ? "quiet" : config.DefaultChannelType;
}

function getIgnoredChannels() {
	return typeof config.IgnoredChannels === 'undefined' ? [] : config.IgnoredChannels;
}

function getLoudChannels() {
	return typeof config.LoudChannels === 'undefined' ? [] : config.LoudChannels;
}

function getQuietChannels() {
	return typeof config.QuietChannels === 'undefined' ? [] : config.QuietChannels;
}

//ES6
module.exports = {
	getToken,
	getURL,
	getSplit,
	getIgnoredChannels,
	getQuietChannels,
	getLoudChannels,
	getDefaultChannelType,
	getCommandPrefix,
	isOp,
	unbarUser,
	isUserBarred,
	barUser,
	load,
	save,
	getOps: () => config.Ops,
	getBarredUsers: () => config.BarredUsers
}
