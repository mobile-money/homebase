module.exports = function(sequelize, DataTypes) {
	return sequelize.define('System_Run', {
		on: {
			type: DataTypes.DATE
			,allowNull: false
			,defaultValue: DataTypes.NOW
		}
		,off: {
			type: DataTypes.DATE
			,allowNull: true
		}
	});
}