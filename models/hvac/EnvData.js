module.exports = function(sequelize, DataTypes) {
	return sequelize.define('EnvData', {
		temperature: {
			type: DataTypes.DOUBLE(3,1)
			,allowNull: true
		}
		,humidity: {
			type: DataTypes.DOUBLE(3,1)
			,allowNull: true
		}
	});
}