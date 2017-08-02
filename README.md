# PK-Help-Bot
A Node.js discord bot that matches messages to regex. Made to try help people if staff aren't around.

The bot fetches a list of regex expressions from an online pastebin file and stores them locally. Any messages it then recieves, it will then check for matches and reply with the desired output.

There are a few commands for ops built in, but nothing too fancy. Things like

- `!reload` - reloads the config and the regex expressions
- `!bar @user` - Prevents the bot from responding to that user. Can be used when people abuse the bot. 
- `!unbar @user` - Unbars the user.

# Installation
This bot is built on Node.js, so you must have that installed along with npm.

1. `npm install`
2. `npm install discord.js`
3. `npm install js-yaml`

You can then run the bot with `node bot.js`

# Configuration
```
Token: '***insertTokenHere***'
URL: 'https://pastebin.com/raw/zYBsBi5R'
Split: '>>'
Ops:
  - '145436402107154433'
BarredUsers:
  - null
```
**Token**: The bot token provided from discord. 

**URL**: The url to fetch regex expressions from. Doesn't have to be pastebin but will still read the page like plain text.

**Split**: The characters that divide the regex expression from the reply

**Ops**: A list of ops that can use any ! commands. These are users unique discord IDs, and can be seen when typing @username in any channel the bot is in. In the log, it will translate it to <@USER_ID>

**BarredUsers**: A list of IDs of people that cannot use the bot.
