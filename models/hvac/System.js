module.exports = function(sequelize, DataTypes) {
	return sequelize.define('System', {
		name: {
			type: DataTypes.STRING(48)
			,allowNull: false
		}
		,controlPin: {
			type: DataTypes.INTEGER(2)
			,allowNull: false
		}
		,heat: {
			type: DataTypes.BOOLEAN
			,allowNull: false
			,defaultValue: true
		}
		,state: {
			type: DataTypes.INTEGER(1)
			,allowNull: false
			,defaultValue: 0
		}
	}
	,{
		paranoid: true
	});
}