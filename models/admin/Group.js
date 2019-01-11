module.exports = function(sequelize, DataTypes) {
	return sequelize.define("Group", {
		name: {
			type: DataTypes.STRING(48)
			,allowNull: false
			,validate: {
				len: [1,48]
			}
		},
		ownerId: {
			type: DataTypes.INTEGER
			,allowNull: false
		},
		memberIds: {
			type: DataTypes.JSON
		},
		Accounts: {
			type: DataTypes.JSON
		},
		Cars: {
			type: DataTypes.JSON
		},
		People: {
			type: DataTypes.JSON
		}
	});
};
