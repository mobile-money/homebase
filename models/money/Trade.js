module.exports = function(sequelize, DataTypes) {
	return sequelize.define('Trade', {
		transactionDate: {
			type: DataTypes.DATE
			,allowNull: false
		}
		,description: {
			type: DataTypes.STRING
			,allowNull: true
			,validate: {
				len: [1,128]
			}
		}
		,ticker: {
			type: DataTypes.STRING
			,allowNull: false
			,validate: {
				len: [1, 15]
			}
		}
		,quantity: {
			type: DataTypes.DECIMAL(7,3)
			,allowNull: false
		}
		,price: {
			type: DataTypes.DECIMAL(7,3)
			,allowNull: false
		}
	}
	,{
	// 	paranoid: true
		// hooks: {
		// }
	});
};