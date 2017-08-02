var fs = require("fs");
var yaml = require('js-yaml');

var config = {};

var file = "./config.yml";

//Get document, or throw exception on error


function load() {
	try {
		console.log("Loading config...");
		config = yaml.safeLoad(fs.readFileSync(file, 'utf8'));
		console.log("YAML Config loaded!");
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
	if (typeof config.Split === 'undefined') config.URL = ">>";
	try {
		fs.writeFile(file, yaml.dump(config));
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
	
	var array = [];
	for (i in config.BarredUsers) {
		if (config.BarredUsers[i] != id) {
			array.push(config.BarredUsers[i]);
		}
	}
	config.BarredUsers = array;
	save();
	return true;
}

function isOp(id) {
	return config.Ops.indexOf(id) != -1;
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

function getDefaultChannelType() {
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

exports.getToken = getToken;
exports.getURL = getURL
exports.getSplit = getSplit
exports.getIgnoredChannels = getIgnoredChannels;
exports.getQuietChannels = getQuietChannels;
exports.getLoudChannels = getLoudChannels;
exports.getDefaultChannelType = getDefaultChannelType;
exports.isOp = isOp;
exports.unbarUser = unbarUser;
exports.isBarred = isUserBarred;
exports.barUser = barUser;
exports.load = load;
exports.save = save;
exports.getOps = function() {
	return config.Ops;
};
exports.getBarredUsers = function() {
	return config.BarredUsers;
};