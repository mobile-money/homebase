module.exports = function(sequelize, DataTypes) {
	return sequelize.define('Account', {
		name: {
			type: DataTypes.STRING
			,allowNull: false
			,validate: {
				len: [1, 48]
			}
		}
		,default: {
			type: DataTypes.BOOLEAN
			,allowNull: false
			,defaultValue: false
		}
		,type: {
			type: DataTypes.STRING
			,allowNull: false
			,validate: {
				len: [1, 24]
			}
		}
		,active: {
			type: DataTypes.BOOLEAN
			,allowNull: false
			,defaultValue: true
		}
	}
	,{
	// 	paranoid: true
		hooks: {
			afterCreate: function(account) {
				if (account.default === true) {
					this.update(
						{
							default: false
						}
						,{
							where: {
								id: {
									$ne: account.id
								}
							}
							,hooks: false
						}
					);
				}
			}
			,afterUpdate: function(account) {
				if (account.default === true) {
					this.update(
						{
							default: false
						}
						,{
							where: {
								id: {
									$ne: account.id
								}
							}
							,hooks: false
						}
					);
				}
			}
		}
	});
}