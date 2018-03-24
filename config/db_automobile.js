var Sequelize = require("sequelize");
var sequelize;

var env = require("./env.js");

if (env.site === "prod") {
	sequelize = new Sequelize(env.db_automobile.DB, env.db_automobile.USER, env.db_automobile.PASS, {
		dialect: "mysql"
		,host: env.db_automobile.HOST
		,omitNull: false
		,logging: false
	});
} else {
	sequelize = new Sequelize(env.db_automobile.DB, env.db_automobile.USER, env.db_automobile.PASS, {
		dialect: "mysql"
		,host: env.db_automobile.HOST
		,omitNull: false
	});
}

var db = {};

// // START IMPORTS // //
db.Car = sequelize.import(__dirname + "/../models/automobile/Car.js");
db.MaintenanceLog = sequelize.import(__dirname + "/../models/automobile/MaintenanceLog.js");
// // END IMPORTS // //

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// // START ASSOCIATIONS // //
db.Car.hasMany(db.MaintenanceLog, {
	'constraints': true
	,'onDelete': 'cascade'
});
db.MaintenanceLog.belongsTo(db.Car);
// // END ASSOCIATIONS // //

module.exports = db;