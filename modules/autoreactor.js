const API = require("../api");
const FS = require("fs");

let reactionList = [];
const file = "../config/autoreactor.json";

function loadReactions() {
    reactionList = JSON.parse(FS.readFileSync(file, 'utf8'));

    for (object of reactionList) {
        if (!object.channel) console.log("Reaction \"" + object + "\" has no channel!");
        if (!object.reaction && !object.reactions) console.log("Reaction \"" + object + "\" has no reactions!");
    }
}

async function onTextMessage(message) {
    //Loop through all reactions we have in the reaction config
    for (reactionObj of reactionList) {
        //If the channel ID or channel name is equal to the channel specified
        if (message.channel.id === reactionObj.channel || message.channel.name === reactionObj.channel) {
            //If they have multiple reactions to give
            if (reactionObj.reactions) { 
                for (emoji of reactionObj.reactions) {
                    message.react(emoji);
                }
            } else if (reactionObj.reaction) { //Single reaction
                message.react(reactionObj.reaction);
            }

            //If there is a create-thread property and it is true
            if (!reactionObj["create-thread"] && reactionObj["create-thread"] == true) {
                let title = message.content.split("[\n.,?!-]")[0];
                if (message.attachments.size > 0) title = message.attachments.get(0).name; //Use the attachment name instead
                else if (title.length > 50) title = title.substring(0, 50) + "..."; //Cut off long names
                else if (title.length < 8 && message.content >= 8) title = message.content.substring(0, 50); //So things like v1.10.0 don't become a title of "v1"

                message.startThread({name: title, autoArchiveDuration: 60});
            }
        }
    }
}

API.subscribe("reload", loadReactions); //Register the reload of reactions on reload
API.subscribe("messageCreate", onTextMessage); //Register the handler for when text messages are sent

loadReactions(); //Load the reactions