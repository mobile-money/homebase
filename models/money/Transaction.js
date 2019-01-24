module.exports = function(sequelize, DataTypes) {
	return sequelize.define('Transaction', {
		transactionDate: {
			type: DataTypes.DATE
			,allowNull: false
		}
		,postDate: {
			type: DataTypes.DATE
			,allowNull: true
		}
		,amount: {
			type: DataTypes.DECIMAL(8,2)
			,allowNull: true
		}
		// ,withdrawl: {
		// 	type: DataTypes.DECIMAL(8,2)
		// 	,allowNull: true
		// }
		,checkNumber: {
			type: DataTypes.INTEGER
			,allowNull: true
		}
		,payee: {
			type: DataTypes.STRING
			,allowNull: false
			,validate: {
				len: [1,64]
			}
		}
		,description: {
			type: DataTypes.STRING
			,allowNull: true
			,validate: {
				len: [1,128]
			}
		}
		,xfer: {
			type: DataTypes.INTEGER
			,allowNull: true
		}
		// ,cleared: {
		// 	type: DataTypes.BOOLEAN
		// 	,allowNull: false
		// 	,defaultValue: false
		// }
	// }
	// ,{
	// 	paranoid: true
	});
};