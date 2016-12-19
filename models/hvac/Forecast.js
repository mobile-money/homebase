module.exports = function(sequelize, DataTypes) {
	return sequelize.define('Forecast', {
		day0_date: {
			type: DataTypes.DATE
		}
		,day0_min: {
			type: DataTypes.FLOAT(5,2)
		}
		,day0_max: {
			type: DataTypes.FLOAT(5,2)
		}
		,day0_iconCode: {
			type: DataTypes.STRING(3)
		}
		,day0_description: {
			type: DataTypes.STRING(255)
		}
		,day1_date: {
			type: DataTypes.DATE
		}
		,day1_min: {
			type: DataTypes.FLOAT(5,2)
		}
		,day1_max: {
			type: DataTypes.FLOAT(5,2)
		}
		,day1_iconCode: {
			type: DataTypes.STRING(3)
		}
		,day1_description: {
			type: DataTypes.STRING(255)
		}
		,day2_date: {
			type: DataTypes.DATE
		}
		,day2_min: {
			type: DataTypes.FLOAT(5,2)
		}
		,day2_max: {
			type: DataTypes.FLOAT(5,2)
		}
		,day2_iconCode: {
			type: DataTypes.STRING(3)
		}
		,day2_description: {
			type: DataTypes.STRING(255)
		}
		,day3_date: {
			type: DataTypes.DATE
		}
		,day3_min: {
			type: DataTypes.FLOAT(5,2)
		}
		,day3_max: {
			type: DataTypes.FLOAT(5,2)
		}
		,day3_iconCode: {
			type: DataTypes.STRING(3)
		}
		,day3_description: {
			type: DataTypes.STRING(255)
		}
		,day4_date: {
			type: DataTypes.DATE
		}
		,day4_min: {
			type: DataTypes.FLOAT(5,2)
		}
		,day4_max: {
			type: DataTypes.FLOAT(5,2)
		}
		,day4_iconCode: {
			type: DataTypes.STRING(3)
		}
		,day4_description: {
			type: DataTypes.STRING(255)
		}
	});
}