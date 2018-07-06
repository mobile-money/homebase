const PORT = 3000;
const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const bodyParser = require("body-parser");
const _ = require("underscore");
const db_hvac = require("./config/db_hvac.js");
const db_money = require("./config/db_money.js");
const db_automobile = require("./config/db_automobile.js");
const db_health = require("./config/db_health.js");

app.use(express.static(__dirname + "/public", {extensions: ['html']}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// // CONTROLLERS // //
// HVAC
const Sensor = require("./controllers/hvac/Sensor.js")(db_hvac);
const EnvData = require("./controllers/hvac/EnvData.js")(db_hvac);
const Host = require("./controllers/hvac/Host.js")(db_hvac);
const Location = require("./controllers/hvac/Location.js")(db_hvac);
const Model = require("./controllers/hvac/Model.js")(db_hvac);
const System = require("./controllers/hvac/System.js")(db_hvac);
const Schedule = require("./controllers/hvac/Schedule.js")(db_hvac);
const System_Run = require("./controllers/hvac/System_Run.js")(db_hvac);
const Option = require("./controllers/hvac/Option.js")(db_hvac);
const Forecast = require("./controllers/hvac/Forecast.js")(db_hvac);
// MONEY
const User = require("./controllers/money/User.js")(db_money);
const Account = require("./controllers/money/Account.js")(db_money);
const Summary = require("./controllers/money/Summary.js")(db_money);
const Category = require("./controllers/money/Category.js")(db_money);
const Transaction = require("./controllers/money/Transaction.js")(db_money);
const FutureTransaction = require("./controllers/money/FutureTransaction.js")(db_money, Transaction);
const Bill = require("./controllers/money/Bill.js")(db_money);
const Budget = require("./controllers/money/Budget.js")(db_money);
const Trade = require("./controllers/money/Trade.js")(db_money);
const Position = require("./controllers/money/Position.js")(db_money);
const CategorySplit = require("./controllers/money/CategorySplit.js")(db_money);
// AUTOMOBILE
const Car = require("./controllers/automobile/Car.js")(db_automobile);
const MaintenanceLog = require("./controllers/automobile/MaintenanceLog.js")(db_automobile);
// HEALTH
const Person = require("./controllers/health/Person.js")(db_health);
const Visit = require("./controllers/health/Visit.js")(db_health);

// Start socket.io
// io.on("connection", function(/*socket*/) {
// 	console.log("Connection made");
// });
const io_money = io.of("/money");
io_money.on("connection", function(/*socket*/) {
    console.log("Connection made - Money");
});
const io_auto = io.of("/auto");
io_auto.on("connection", function(/*socket*/) {
    console.log("Connection made - Automobile");
});
const io_hvac = io.of("/hvac");
io_hvac.on("connection", function(/*socket*/) {
    console.log("Connection made - HVAC");
});
const io_health = io.of("/health");
io_health.on("connection", function(/*socket*/) {
    console.log("Connection made - Health");
});

// // ROUTES // //
// HVAC
require("./routes/hvac/Sensor.js")(app, Sensor, _, io_hvac);
require("./routes/hvac/EnvData.js")(app, EnvData, _, io_hvac);
require("./routes/hvac/Host.js")(app, Host, _, io_hvac);
require("./routes/hvac/Location.js")(app, Location, _, io_hvac);
require("./routes/hvac/Model.js")(app, Model, _, io_hvac);
require("./routes/hvac/System.js")(app, System, _, io_hvac);
require("./routes/hvac/Schedule.js")(app, Schedule, _, io_hvac);
require("./routes/hvac/System_Run.js")(app, System_Run, _, io_hvac);
require("./routes/hvac/Option.js")(app, Option, _, io_hvac);
require("./routes/hvac/Forecast.js")(app, Forecast, _, io_hvac);
// MONEY
require("./routes/money/User.js")(app, User, _);
require("./routes/money/Account.js")(app, Account, _, io_money);
require("./routes/money/Summary.js")(app, Summary, _);
require("./routes/money/Transaction.js")(app, Transaction, _, io_money);
require("./routes/money/FutureTransaction.js")(app, FutureTransaction, _, io_money);
require("./routes/money/Bill.js")(app, Bill, _, io_money);
require("./routes/money/Category.js")(app, Category, _, io_money);
require("./routes/money/Budget.js")(app, Budget, _, io_money);
require("./routes/money/Trade.js")(app, Trade, _, io_money);
require("./routes/money/Position.js")(app, Position, _, io_money);
require("./routes/money/Flow.js")(app, Transaction, _, io_money);
require("./routes/money/CategorySplit.js")(app, CategorySplit, _, io_money);
// AUTOMOBILE
require("./routes/automobile/Car.js")(app, Car, _);
require("./routes/automobile/MaintenanceLog.js")(app, MaintenanceLog, _);
// HEALTH
require("./routes/health/Person.js")(app, Person, _, io_health);
require("./routes/health/Visit.js")(app, Visit, _, io_health);

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
		db_automobile.sequelize.sync({
			// force: true
		}).then(function() {
			db_health.sequelize.sync({
				// force: true
			}).then(function() {
                http.listen(PORT, function() {
                    console.log("Server started on port: " + PORT);
                });
			});
		});
	});
});