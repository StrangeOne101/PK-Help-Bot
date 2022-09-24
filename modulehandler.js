const FS = require('fs');
const PATH = require("path");

let dir = PATH.join(__dirname, "modules");
FS.readdir(dir, async function(err, files) {
    if (err) {
        console.log("Unable to scan modules directory: " + err);
        return;
    }

    files.forEach(async file => {
        try {
            require(PATH.join(dir, file)); //Load the module
        } catch (exception) {
            console.error("Failed to load module " + file);
            console.error(exception);
        }
    });

    console.log("Loaded " + files.length + " module(s).");
});