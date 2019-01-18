module.exports = function(sequelize, DataTypes) {
	let Category = sequelize.define('Category', {
		name: {
			type: DataTypes.STRING
			,allowNull: false
			,validate: {
				len: [1,48]
			}
		}
		,expense: {
			type: DataTypes.BOOLEAN
			,allowNull: false
			,defaultValue: true
		}
		,account_ids: {
			type: DataTypes.JSON
		}
	// }
	// ,{
	// 	paranoid: true
	});

	return Category;
};