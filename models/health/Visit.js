module.exports = function(sequelize, DataTypes) {
    return sequelize.define('Visit', {
            visit_date: {
                type: DataTypes.DATEONLY
                ,allowNull: false
            }
            ,description: {
                type: DataTypes.TEXT
                ,allowNull: false
            }
            ,cost: {
                type: DataTypes.DECIMAL(7,2)
            }
            ,provider: {
                type: DataTypes.STRING(96)
            }
        }
        ,{
            paranoid: true
        });
};