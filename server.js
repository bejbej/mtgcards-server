var env = require('env2')('./env.json');
var db = require("./db/db.js");
var controllers = require("./controllers/controllers.js");
var bodyParser = require("body-parser");

var app = require("./common/app.js")();
app.use(bodyParser.json());
controllers(app);

app.use((error, request, response, next) => {
    response.status(500).json({message: error.message, stack: error.stack});
});

db.init(process.env.database).then(() => {
    console.log("Database connection ready");
    var server = app.listen(process.env.PORT || 8082, function () {
        var port = server.address().port;
        console.log("App now running on port", port);
    });
}).catch(error => {
    console.log("Database connection error: " + error);
});

