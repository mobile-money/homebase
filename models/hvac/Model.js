module.exports = function(sequelize, DataTypes) {
	return sequelize.define('Model', {
		name: {
			type: DataTypes.STRING(48)
			,allowNull: false
		}
		,manufacturer: {
			type: DataTypes.STRING(48)
			,allowNull: false
		}
		,temperature: {
			type: DataTypes.BOOLEAN
			,allowNull: false
			,defaultValue: true
		}
		,humidity: {
			type: DataTypes.BOOLEAN
			,allowNull: false
			,defaultValue: false
		}
	}
	,{
		paranoid: true
	});
}