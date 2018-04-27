module.exports = function(sequelize, DataTypes) {
	return sequelize.define('Location_Update', {
		locationId: {
			type: DataTypes.INTEGER(2)
		}
		,lastUpdate: {
			type: DataTypes.DATE
		}
		,lastNotification: {
			type: DataTypes.DATE
		}
	});
};