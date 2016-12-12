var PORT = 3000;
var express = require("express");
var app = express();
var http = require("http").Server(app);
var io = require("socket.io")(http);
var bodyParser = require("body-parser");
var _ = require("underscore");
var db_hvac = require("./config/db_hvac.js");
var db_money = require("./config/db_money.js");

app.use(express.static(__dirname + "/public", {extensions: ['html']}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// // CONTROLLERS // //
// HVAC
var Sensor = require("./controllers/hvac/Sensor.js")(db_hvac);
var EnvData = require("./controllers/hvac/EnvData.js")(db_hvac);
var Host = require("./controllers/hvac/Host.js")(db_hvac);
var Location = require("./controllers/hvac/Location.js")(db_hvac);
var Model = require("./controllers/hvac/Model.js")(db_hvac);
var System = require("./controllers/hvac/System.js")(db_hvac);
var Schedule = require("./controllers/hvac/Schedule.js")(db_hvac);
var System_Run = require("./controllers/hvac/System_Run.js")(db_hvac);
var Option = require("./controllers/hvac/Option.js")(db_hvac);
// MONEY
var User = require("./controllers/money/User.js")(db_money);
var Account = require("./controllers/money/Account.js")(db_money);
var Summary = require("./controllers/money/Summary.js")(db_money);
var Category = require("./controllers/money/Category.js")(db_money);
var Transaction = require("./controllers/money/Transaction.js")(db_money);
var FutureTransaction = require("./controllers/money/FutureTransaction.js")(db_money, Transaction);
var Bill = require("./controllers/money/Bill.js")(db_money);
var Budget = require("./controllers/money/Budget.js")(db_money);
var Trade = require("./controllers/money/Trade.js")(db_money);
var Position = require("./controllers/money/Position.js")(db_money);

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
require("./routes/hvac/Option.js")(app, Option, _, io);
// MONEY
require("./routes/money/User.js")(app, User, _);
require("./routes/money/Account.js")(app, Account, _, io);
require("./routes/money/Summary.js")(app, Summary, _);
require("./routes/money/Transaction.js")(app, Transaction, _, io);
require("./routes/money/FutureTransaction.js")(app, FutureTransaction, _, io);
require("./routes/money/Bill.js")(app, Bill, _, io);
require("./routes/money/Category.js")(app, Category, _, io);
require("./routes/money/Budget.js")(app, Budget, _, io);
require("./routes/money/Trade.js")(app, Trade, _, io);
require("./routes/money/Position.js")(app, Position, _, io);
require("./routes/money/Flow.js")(app, Transaction, _, io);

app.get("/", function(req, res) {
	res.redirect("/homebase");
});
	
// Start server
db_hvac.sequelize.sync({
	// force: true
}).then(function() {
	db_money.sequelize.sync({
		// force: true
	}).then(function() {
		http.listen(PORT, function() {
			console.log("Server started on port: " + PORT);
		})
	});
});