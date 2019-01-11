module.exports = function(sequelize, DataTypes) {
	return sequelize.define("FailedLogin", {
		userName: {
			type: DataTypes.STRING(256)
			,allowNull: false
		}
		,error: {
			type: DataTypes.STRING(256)
			,allowNull: false
		}
	});
};