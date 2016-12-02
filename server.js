var PORT = 3000;
var express = require("express");
var app = express();
var http = require("http").Server(app);
var io = require("socket.io")(http);
var bodyParser = require("body-parser");
var _ = require("underscore");
var db = require("./config/db.js");

app.use(express.static(__dirname + "/public", {extensions: ['html']}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// // CONTROLLERS // //
// HVAC
var Sensor = require("./controllers/hvac/Sensor.js")(db);
var EnvData = require("./controllers/hvac/EnvData.js")(db);
var Host = require("./controllers/hvac/Host.js")(db);
var Location = require("./controllers/hvac/Location.js")(db);
var Model = require("./controllers/hvac/Model.js")(db);
var System = require("./controllers/hvac/System.js")(db);
var Schedule = require("./controllers/hvac/Schedule.js")(db);
var System_Run = require("./controllers/hvac/System_Run.js")(db);

// Start socket.io
io.on("connection", function(socket) {
	console.log("Connection made");
});

// // ROUTES // //
// HVAC
require("./routes/hvac/Sensor.js")(app, Sensor, _, io);
require("./routes/hvac/EnvData.js")(app, EnvData, _, io);
require("./routes/hvac/Host.js")(app, Host, _, io);
require("./routes/hvac/Location.js")(app, Location, _, io);
require("./routes/hvac/Model.js")(app, Model, _, io);
require("./routes/hvac/System.js")(app, System, _, io);
require("./routes/hvac/Schedule.js")(app, Schedule, _, io);
require("./routes/hvac/System_Run.js")(app, System_Run, _, io);

app.get("/", function(req, res) {
	res.redirect("/homebase");
});
	
// Start server
db.sequelize.sync({
	// force: true
}).then(function() {
	http.listen(PORT, function() {
		console.log("Server started on port: " + PORT);
	});
});