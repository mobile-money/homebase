module.exports = function(sequelize, DataTypes) {
	return sequelize.define('FutureTransaction', {
		transactionDate: {
			type: DataTypes.DATE
			,allowNull: false
		}
		,amount: {
			type: DataTypes.DECIMAL(8,2)
			,allowNull: true
		}
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
		,future: {
			type: DataTypes.BOOLEAN
			,allowNull: false
			,defaultValue: true
		}
	// }
	// ,{
	// 	paranoid: true
	});
};