const Discord = require('discord.js');
const http = require("http");
var config = require("./config");
console.log('******* Bot starting *******');
config.load();
const ChatHandler = require("./chathandler");


// Create an instance of a Discord client
const client = new Discord.Client();

// The token of your bot - https://discordapp.com/developers/applications/me
const token = config.getToken();

// The ready event is vital, it means that your bot will only start reacting to information

var instance = this;
// from Discord _after_ ready is emitted
client.on('ready', () => {
  client.generateInvite(['SEND_MESSAGES'])
  .then(link => {
    console.log(`Generated bot invite link: ${link}`);
  });
  ChatHandler.setParent(instance);
  console.log("Fetching regex commands...");
  ChatHandler.fetchChatStuff();
  
  console.log("Loaded " + config.getOps().length + " op(s) and " + config.getBarredUsers().length + " barred user(s)");
  
  //client.user.setStatus("online");
});

client.on("disconnect", function() {
	//client.user.setStatus("dnd");
})

// Create an event listener for messages
client.on('message', message => {
	if(client.user.id != message.author.id){
	ChatHandler.handle(message.content, message.author, message.channel, message);
	console.log("[" + message.channel + "] " + message.author.username + ": " + message.content);
	}
});

// Log our bot in
client.login(token);
