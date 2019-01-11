const Sequelize = require("sequelize");
let sequelize;

const env = require("./env.js");

if (env.site.toString() === "prod") {
	sequelize = new Sequelize(env.db_health.DB, env.db_health.USER, env.db_health.PASS, {
		dialect: "mysql"
		,host: env.db_health.HOST
		,omitNull: false
		,logging: false
	});
} else {
	sequelize = new Sequelize(env.db_health.DB, env.db_health.USER, env.db_health.PASS, {
		dialect: "mysql"
		,host: env.db_health.HOST
		,omitNull: false
	});
}

let db = {};

// // START IMPORTS // //
db.Person = sequelize.import(__dirname + "/../models/health/Person.js");
db.Visit = sequelize.import(__dirname + "/../models/health/Visit.js");
db.Owner = sequelize.import(__dirname + "/../models/health/Owner.js");
// // END IMPORTS // //

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// // START ASSOCIATIONS // //
db.Person.hasMany(db.Visit, {
    'constraints': true
    ,'onDelete': 'cascade'
});
db.Person.hasMany(db.Owner);

db.Visit.belongsTo(db.Person);
// // END ASSOCIATIONS // //

module.exports = db;