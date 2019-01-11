const Sequelize = require("sequelize");
let sequelize;

const env = require("./env.js");

// sequelize = new Sequelize(env.db_money.DB, env.db_money.USER, env.db_money.PASS, {
// 	dialect: "mysql"
// 	,host: env.db_money.HOST
// 	,omitNull: false
// 	// ,logging: false
// });
if (env.site === "prod") {
	sequelize = new Sequelize(env.db_admin.DB, env.db_admin.USER, env.db_admin.PASS, {
		dialect: "mysql"
		,host: env.db_admin.HOST
		,omitNull: false
		,logging: false
	});
} else {
	sequelize = new Sequelize(env.db_admin.DB, env.db_admin.USER, env.db_admin.PASS, {
		dialect: "mysql"
		,host: env.db_admin.HOST
		,omitNull: false
	});
}

let db = {};

// // START IMPORTS // //
db.User = sequelize.import(__dirname + "/../models/admin/User.js");
db.Token = sequelize.import(__dirname + "/../models/admin/Token.js");
db.Group = sequelize.import(__dirname + "/../models/admin/Group.js");
// // END IMPORTS // //

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// // START ASSOCIATIONS // //
// // END ASSOCIATIONS // //

module.exports = db;