const Sequelize = require("sequelize");
let sequelize;

const env = require("./env.js");

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

let db = {};

// // START IMPORTS // //
db.Car = sequelize.import(__dirname + "/../models/automobile/Car.js");
db.MaintenanceLog = sequelize.import(__dirname + "/../models/automobile/MaintenanceLog.js");
db.Owner = sequelize.import(__dirname + "/../models/automobile/Owner.js");
// // END IMPORTS // //

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// // START ASSOCIATIONS // //
db.Car.hasMany(db.MaintenanceLog, {
	'constraints': true
	,'onDelete': 'cascade'
});
db.Car.hasMany(db.Owner);

db.MaintenanceLog.belongsTo(db.Car);
// // END ASSOCIATIONS // //

module.exports = db;