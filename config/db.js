var Sequelize = require("sequelize");
var sequelize;

var env = require("./env.js");

sequelize = new Sequelize(env.db.DB, env.db.USER, env.db.PASS, {
	dialect: "mysql"
	,host: env.db.HOST
	,omitNull: false
	// ,logging: false
});

var db = {};

// // START IMPORTS
// // START HVAC
db.EnvData = sequelize.import(__dirname + "/../models/hvac/EnvData.js");
db.Sensor = sequelize.import(__dirname + "/../models/hvac/Sensor.js");
db.Location = sequelize.import(__dirname + "/../models/hvac/Location.js");
db.Host = sequelize.import(__dirname + "/../models/hvac/Host.js");
db.Model = sequelize.import(__dirname + "/../models/hvac/Model.js");
db.System = sequelize.import(__dirname + "/../models/hvac/System.js");
db.Schedule = sequelize.import(__dirname + "/../models/hvac/Schedule.js");
db.System_Run = sequelize.import(__dirname + "/../models/hvac/System_Run.js");
// // END HVAC
// // END IMPORTS

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// // START ASSOCIATIONS
// // START HVAC
db.Location.hasMany(db.Sensor);
db.Location.hasMany(db.EnvData);
db.Location.hasOne(db.System);


db.Sensor.belongsTo(db.Location);
db.Sensor.belongsTo(db.Host);
db.Sensor.belongsTo(db.Model);

db.EnvData.belongsTo(db.Location);

db.Host.hasMany(db.Sensor);

db.Model.hasMany(db.Sensor);

db.System.belongsTo(db.Location);
db.System.hasMany(db.Schedule);
db.System.hasMany(db.System_Run);

db.Schedule.belongsTo(db.System);

db.System_Run.belongsTo(db.System);
// // END HVAC
// // END ASSOCIATIONS

module.exports = db;