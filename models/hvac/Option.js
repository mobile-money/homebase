module.exports = function(sequelize, DataTypes) {
	return sequelize.define('Option', {
		upperBuffer: {
			type: DataTypes.INTEGER(2)
			,allowNull: false
			,defaultValue: 0
		}
		,lowerBuffer: {
			type: DataTypes.INTEGER(2)
			,allowNull: false
			,defaultValue: 0
		}
		,tempScale: {
			type: DataTypes.STRING(1)
			,allowNull: false
			,defaultValue: "f"
		}
		,defaultLocation: {
			type: DataTypes.INTEGER
			,allowNull: true
			,defaultValue: null
		}
	});
}