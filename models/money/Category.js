module.exports = function(sequelize, DataTypes) {
	return sequelize.define('Category', {
		name: {
			type: DataTypes.STRING
			,allowNull: false
			,validate: {
				len: [1,48]
			}
		}
		,expense: {
			type: DataTypes.BOOLEAN
			,allowNull: false
			,defaultValue: true
		}
	// }
	// ,{
	// 	paranoid: true
	});
}