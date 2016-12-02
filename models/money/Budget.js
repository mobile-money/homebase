module.exports = function(sequelize, DataTypes) {
	return sequelize.define('Budget', {
		name: {
			type: DataTypes.STRING
			,allowNull: false
			,validate: {
				len: [1, 48]
			}
		}
		,amounts: {
			type: DataTypes.STRING(4096)
			,allowNull: false
		}
		,favorite: {
			type: DataTypes.BOOLEAN
			,allowNull: false
			,defaultValue: false
		}
	// }
	// ,{
	// 	paranoid: true
	});
}