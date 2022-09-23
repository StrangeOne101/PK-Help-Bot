const API = require("../api");
const FS = require("fs");
const { ThreadChannel, ForumChannel } = require("discord.js");
const config = require("../config");

let regexMap = new Map();
let fileMap = new Map();

const FUNC_CONTAINS = (s1, s2) => s1.contains(s2);
const FUNC_LESS_THAN = (s1, s2) => s1 < s2;
const FUNC_GREATER_THAN = (s1, s2) => s1 > s2;
const FUNC_LESS_THAN_EQUAL_TO = (s1, s2) => s1 <= s2;
const FUNC_GREATER_THAN_EQUALS_TO = (s1, s2) => s1 >= s2;
const FUNC_EQUALS = (s1, s2) => s1 == s2;
const FUNC_STARTS_WITH = (s1, s2) => s1.startsWith(s2);
const FUNC_ENDS_WITH = (s1, s2) => s1.endsWith(s2);

async function loadResponses() {
    let dir = path.join(__dirname, "/config/autoresponses");
	console.log(dir);
	FS.readdir(dir, function(err, files) {
		if (err) {
			console.log("Unable to scan autoresponses directory: " + err);
			return;
		}

		files.forEach(file => {
			let p = path.join(dir, file);
			let json = JSON.parse(FS.readFileSync(p, 'utf8'));

            if (Array.isArray(json)) {
                for (let o of json) {
                    addResponse(o, p);
                }
            } else {
                addResponse(json, p);
            }
		});

		console.log("Loaded " + regexMap.size + " regex replies(s).");
	});
}

function addResponse(object, path) {
    fileMap.set(path, object);
    let add = function(trigger) {
        if (trigger != '') {
            try {
                let reg = new RegExp(trigger, "i");
                regexMap.set(reg, object);
            } catch (e) {
                console.warn("Invalid regex in " + path + ": " + trigger);
            }
        }
    } 
    if (object.trigger) {
        add(object.trigger);    
    } else if (object.triggers) {
        for (let arr of object.trigger) {
            add(arr);
        }
    }
}

async function onTextMessage(message) {
    let channel = message.channel;
    let msg = API.stripFormatting(message.content);

    if (config.getIgnoredChannels().indexOf(channel.id) != -1 || config.getIgnoredChannels().indexOf(channel.name) != -1) {
        return;
    }

    //Loop through all triggers we have load
    for (trigger of regexMap.keys()) {
        if (trigger.test(msg)) {
            reply(message, regexMap.get(trigger));
        }
        return;
    }
}

async function reply(message, reply) {
    
}



API.subscribe("reload", loadResponses); //Register the reload of reactions on reload
API.subscribe("messageCreate", onTextMessage); //Register the handler for when text messages are sent

loadResponses(); //Load the reactions