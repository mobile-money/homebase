module.exports = function(sequelize, DataTypes) {
	return sequelize.define('Host', {
		name: {
			type: DataTypes.STRING(48)
			,allowNull: false
			,unique: true
		}
	}
	,{
		paranoid: true
	});
}