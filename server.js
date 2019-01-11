// const PORT = 3001;
const SPORT = 3000;
const fs = require("fs");
const express = require("express");
const app = express();
// const http = require("http").Server(app);
const options = {
	key: fs.readFileSync('encryption/server.key'),
	cert: fs.readFileSync('encryption/litzhome_com.crt'),
	ca: [
		fs.readFileSync('encryption/COMODORSAAddTrustCA.crt'),
		fs.readFileSync('encryption/COMODORSADomainValidationSecureServerCA.crt'),
		fs.readFileSync('encryption/AddTrustExternalCARoot.crt')
	]
};
const https = require("https").Server(options, app);
const io = require("socket.io")(https);
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const _ = require("underscore");
const cryptojs = require("crypto-js");
const moment = require("moment");
const db_hvac = require("./config/db_hvac.js");
const db_money = require("./config/db_money.js");
const db_automobile = require("./config/db_automobile.js");
const db_health = require("./config/db_health.js");
const db_admin = require("./config/db_admin.js");

app.use(cookieParser());
app.use(function(req, res, next) {
	// console.log(req.url);
	if (req.url.toLowerCase().match(/^\/$|\/shared|\/welcome|\/api\/v1\/users\/new|\/api\/v1\/users\/login/)) {
		// console.log('shared');
		next();
	} else {
		// console.log("HIT");
		// Get auth token
		const token = req.cookies['x-Auth'];
		// console.log("token: " + token);
		// Validate token
		db_admin.Token.findOne({
			where: {
				tokenHash: cryptojs.MD5(token).toString()
				,createdAt: {
					$gte: moment().subtract(1, 'days').toDate()
				}
			}
		}).then(function(tokenInstance) {
			if (!tokenInstance) {
				console.log("tokenInstance not found");
				res.redirect("/welcome");
				// res.status(401).send();
			} else {
				// console.log("tokenInstance: " + JSON.stringify(tokenInstance));
				// Get user by token
				db_admin.User.findByToken(token).then(function(userInstance) {
					if (!userInstance) {
						console.log("userInstance not found");
						// res.status(401).send();
						res.redirect("/welcome");
					} else {
						if (userInstance.active === false) {
							console.log("userInstance not active");
							// res.status(401).send();
							res.redirect("/welcome");
						} else {
							// console.log("userInstance: " + JSON.stringify(userInstance));
							// req.user = userInstance;
							req.user = {
								id: userInstance.id
								,firstName: userInstance.firstName
								,lastName: userInstance.lastName
								,email: userInstance.email
							};
							next();
							// db_admin.UserAccount.findAll({
							// 	where: {
							// 		UserId: userInstance.id
							// 	}
							// }).then(function(UserAccounts) {
							// 	req.user.Accounts = _.pluck(UserAccounts,'accountId');
							// 	db_admin.UserCar.findAll({
							// 		where: {
							// 			UserId: userInstance.id
							// 		}
							// 	}).then(function(UserCars) {
							// 		req.user.Cars = _.pluck(UserCars,'carId');
							// 		db_admin.UserPerson.findAll({
							// 			where: {
							// 				UserId: userInstance.id
							// 			}
							// 		}).then(function(UserPeople) {
							// 			req.user.People = _.pluck(UserPeople,'personId');
							// 			next();
							// 		})
							// 	});
							// });
						}
					}
				});
			}
		}).catch(function(error) {
			console.log("error validating token: " + error);
			// res.status(401).send();
			res.redirect("/welcome");
		});
	}
	// console.log('HIT');
});
app.use(express.static(__dirname + "/public", {extensions: ['html']}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// app.use(function(req,res,next) {
// 	if (req.secure) {
// 		console.log("sec");
// 		next();
// 	} else {
// 		console.log("unsec");
// 		res.redirect('https://' + req.headers.host + req.url);
// 	}
// });

// // CONTROLLERS // //
// ADMIN
const User = require("./controllers/admin/User.js")(db_admin);
const Group = require("./controllers/admin/Group.js")(db_admin);
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
const Account = require("./controllers/money/Account.js")(db_money, db_admin);
const Summary = require("./controllers/money/Summary.js")(db_money, db_admin);
const Category = require("./controllers/money/Category.js")(db_money, db_admin);
const Transaction = require("./controllers/money/Transaction.js")(db_money);
const FutureTransaction = require("./controllers/money/FutureTransaction.js")(db_money, Transaction, db_admin);
const Bill = require("./controllers/money/Bill.js")(db_money, db_admin);
const Budget = require("./controllers/money/Budget.js")(db_money, db_admin);
const Trade = require("./controllers/money/Trade.js")(db_money, db_admin);
const Position = require("./controllers/money/Position.js")(db_money);
const CategorySplit = require("./controllers/money/CategorySplit.js")(db_money, db_admin);
// AUTOMOBILE
const Car = require("./controllers/automobile/Car.js")(db_automobile, db_admin);
const MaintenanceLog = require("./controllers/automobile/MaintenanceLog.js")(db_automobile);
// HEALTH
const Person = require("./controllers/health/Person.js")(db_health, db_admin);
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
// ADMIN
require("./routes/admin/User.js")(app, User, _);
require("./routes/admin/Group.js")(app, Group, _);
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
require("./routes/money/Account.js")(app, Account, _, io_money);
require("./routes/money/Summary.js")(app, Summary, _);
require("./routes/money/Transaction.js")(app, Transaction, _, io_money);
require("./routes/money/FutureTransaction.js")(app, FutureTransaction, _, io_money);
require("./routes/money/Bill.js")(app, Bill, _, io_money);
require("./routes/money/Category.js")(app, Category, _, io_money);
require("./routes/money/Budget.js")(app, Budget, _, io_money);
require("./routes/money/Trade.js")(app, Trade, _, io_money);
require("./routes/money/Position.js")(app, Position, _, io_money);
require("./routes/money/Flow.js")(app, Transaction);
require("./routes/money/CategorySplit.js")(app, CategorySplit);
// AUTOMOBILE
require("./routes/automobile/Car.js")(app, Car, _);
require("./routes/automobile/MaintenanceLog.js")(app, MaintenanceLog, _);
// HEALTH
require("./routes/health/Person.js")(app, Person, _, io_health);
require("./routes/health/Visit.js")(app, Visit, _, io_health);

app.get("/", function(req, res) {
	res.redirect("/welcome");
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
				db_admin.sequelize.sync({
					// force: true
				}).then(function () {
					https.listen(SPORT, function () {
						console.log("Server started on secure port: " + SPORT);
						// http.listen(PORT, function () {
						// 	console.log("Server started on unsecure port: " + PORT);
						// });
					});
				});
			});
		});
	});
});