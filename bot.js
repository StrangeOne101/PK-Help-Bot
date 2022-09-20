const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');
const http = require("http");
const config = require("./config");
console.log('******* Bot starting *******');
config.load();
const ChatHandler = require("./chathandler");
const CommandsLib = require("./commands");

// Create an instance of a Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
});

// The token of your bot - https://discordapp.com/developers/applications/me
const token = config.getToken();

// The ready event is vital, it means that your bot will only start reacting to information

var instance = this;
// from Discord _after_ ready is emitted
client.on('ready', async () => {
    let link = client.generateInvite({
        permissions: PermissionsBitField.All,
        scopes: ['bot'],
    });
    console.log(`Generated bot invite link: ${link}`);
    
    ChatHandler.setParent(instance);
    console.log("Fetching regex commands...");
    ChatHandler.fetchChatStuff();
    CommandsLib.loadCommands();
    require("./modulehandler"); //Load modules after load
    
    console.log("Loaded " + config.getOps().length + " op(s) and " + config.getBarredUsers().length + " barred user(s)");
  
    //client.user.setStatus("online");
});

client.on("disconnect", function() {
	//client.user.setStatus("dnd");
})

// Create an event listener for messages
client.on('messageCreate', message => {
    if (client.user.id != message.author.id) {
        ChatHandler.handle(message.content, message.author, message.channel, message);
    }
});

client.on('uncaughtException', (err) => {
    console.error(err);
});

// Log our bot in
client.login(token);

module.exports = {
    client,
    ChatHandler,
    CommandsLib
}
