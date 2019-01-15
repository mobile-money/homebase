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
	sequelize = new Sequelize(env.db_money.DB, env.db_money.USER, env.db_money.PASS, {
		dialect: "mysql"
		,host: env.db_money.HOST
		,omitNull: false
		,logging: false
	});
} else {
	sequelize = new Sequelize(env.db_money.DB, env.db_money.USER, env.db_money.PASS, {
		dialect: "mysql"
		,host: env.db_money.HOST
		,omitNull: false
	});
}

let db = {};

// // START IMPORTS // //
db.Account = sequelize.import(__dirname + "/../models/money/Account.js");
db.Summary = sequelize.import(__dirname + "/../models/money/Summary.js");
db.Category = sequelize.import(__dirname + "/../models/money/Category.js");
db.Transaction = sequelize.import(__dirname + "/../models/money/Transaction.js");
db.FutureTransaction = sequelize.import(__dirname + "/../models/money/FutureTransaction.js");
db.Bill = sequelize.import(__dirname + "/../models/money/Bill.js");
db.Budget = sequelize.import(__dirname + "/../models/money/Budget.js");
db.Position = sequelize.import(__dirname + "/../models/money/Position.js");
db.Trade = sequelize.import(__dirname + "/../models/money/Trade.js");
db.CategorySplit = sequelize.import(__dirname + "/../models/money/CategorySplit.js");
// // END IMPORTS // //

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// // START ASSOCIATIONS // //
db.Account.hasMany(db.Summary, {
	'constraints': true
	,'onDelete': 'cascade'
});
db.Account.hasMany(db.Position, {
	'constraints': true
	,'onDelete': 'cascade'
});
db.Account.hasMany(db.FutureTransaction, {
	'constraints': true
	,'onDelete': 'cascade'
});

db.Summary.hasMany(db.Transaction, {
	'constraints': true
	,'onDelete': 'cascade'
});
db.Summary.belongsTo(db.Account);

db.Category.hasMany(db.Transaction, {
	'onDelete': 'set null'
});

db.Transaction.belongsTo(db.Summary);
db.Transaction.belongsTo(db.Category);
db.Transaction.belongsTo(db.Bill);

db.FutureTransaction.belongsTo(db.Category);
db.FutureTransaction.belongsTo(db.Bill);

db.Bill.belongsTo(db.Account);
db.Bill.belongsTo(db.Category);

db.Position.belongsTo(db.Account);

db.Trade.belongsTo(db.Position);
// // END ASSOCIATIONS // //

module.exports = db;