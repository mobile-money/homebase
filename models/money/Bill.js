module.exports = function(sequelize, DataTypes) {
	return sequelize.define('Bill', {
		payee: {
			type: DataTypes.STRING(48)
			,allowNull: false
			,validate: {
				len: [1, 48]
			}
		}
		,description: {
			type: DataTypes.STRING(255)
			,allowNull: true
		}
		,startDate: {
			type: DataTypes.DATE
			,allowNull: false
		}
		,frequency: {
			type: DataTypes.STRING(10)
			,allowNull: false
		}
		,every: {
			type: DataTypes.INTEGER(2)
			,allowNull: false
		}
		,onThe: {
			type: DataTypes.INTEGER(2)
			,allowNull: true
		}
		,amount: {
			type: DataTypes.DECIMAL(8,2)
			,allowNull: false
		}
		,lastAdded: {
			type: DataTypes.DATE
			,allowNull: true
		}
		,automatic: {
			type: DataTypes.BOOLEAN
			,defaultValue: false
			,allowNull: false
		}
	}
	,{
	// 	paranoid: true
	});
};