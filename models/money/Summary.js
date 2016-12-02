module.exports = function(sequelize, DataTypes) {
	return sequelize.define('Summary', {
		start: {
			type: DataTypes.DATE
			,allowNull: true
		}
		,end: {
			type: DataTypes.DATE
			,allowNull: true
		}
		,balance: {
			type: DataTypes.DECIMAL(10,2)
			,allowNull: false
			,defaultValue: 0
		}
		,initial: {
			type: DataTypes.BOOLEAN
			,allowNull: false
			,defaultValue: false
		}
	}
	,{
	// 	paranoid: true
		hooks: {
			// beforeUpdate: function(summary) {
			// 	console.log("before update balance: "+summary.balance);
			// 	console.log(summary._previousDataValues["balance"]);
			// },
			afterUpdate: function(summary) {
				var delta = (summary.balance - summary._previousDataValues["balance"]).toFixed(2);
				this.update({
					balance: sequelize.literal("balance +"+delta)
				}
				,{
					where: {
						start: { $gt: summary.start }
						,AccountId: summary.AccountId
					}
					,hooks: false
				});
			}
		}
	});
}