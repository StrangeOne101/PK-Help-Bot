const FS = require('fs');
const PATH = require("path");

let dir = PATH.join(__dirname, "modules");
FS.readdir(dir, function(err, files) {
    if (err) {
        console.log("Unable to scan modules directory: " + err);
        return;
    }

    files.forEach(file => {
        require(PATH.join(dir, file)); //Load the module
    });

    console.log("Loaded " + files.length + " modules.");
});