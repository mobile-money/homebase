module.exports = function(sequelize, DataTypes) {
	return sequelize.define('Location', {
		floor: {
			type: DataTypes.STRING(48)
			,allowNull: false
		}
		,room: {
			type: DataTypes.STRING(48)
			,allowNull: false
		}
		,note: {
			type: DataTypes.STRING(255)
			,allowNull: true
		}
	}
	,{
		paranoid: true
	});
}