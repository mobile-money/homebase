module.exports = function(sequelize, DataTypes) {
	return sequelize.define('Schedule', {
		name: {
			type: DataTypes.STRING(48)
			,allowNull: true
		}
		,days: {
			type: DataTypes.STRING(20)
			,allowNull: false
		}
		,startTime: {
			type: DataTypes.STRING(5)
			,allowNull: false
		}
		,endTime: {
			type: DataTypes.STRING(5)
			,allowNull: false
		}
		,targetTemp: {
			type: DataTypes.FLOAT(7,4)
			,allowNull: false
		}
	});
}