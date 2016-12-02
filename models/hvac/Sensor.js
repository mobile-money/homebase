module.exports = function(sequelize, DataTypes) {
	return sequelize.define('Sensor', {
		dataPin: {
			type: DataTypes.INTEGER(2)
			,allowNull: false
		}
		,enabled: {
			type: DataTypes.BOOLEAN
			,allowNull: false
			,defaultValue: false
		}
	}
	,{
		paranoid: true
	});
}