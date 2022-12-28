const API = require("../api");
const FS = require("fs");
const { Attachment, Message } = require("discord.js");

class Log {

    constructor() {
        this.done = false;
        this.version = "";
        this.serverSoftware = "";
    }
}

class Stacktrace {

    static FILTER = ["org.bukkit.", "com.mojang.", "java.", "net.minecraft.", "sun.reflect.", "org.apache."];

    constructor() {
        this.lines = [];
        this.filteredMentions = [];
        this.version = "";
        this.serverSoftware = "";
        this.error = "";
    }

    addLine(line) {
        while (line.startsWith(" ") || line.startsWith("\t")) {
            line = line.substring(1);
        }
    }
}