module.exports = function(sequelize, DataTypes) {
    return sequelize.define('Person', {
            last_name: {
                type: DataTypes.STRING(48)
                ,allowNull: false
            }
            ,middle_name: {
                type: DataTypes.STRING(48)
                ,allowNull: true
            }
            ,first_name: {
                type: DataTypes.STRING(48)
                ,allowNull: false
            }
            ,birth_date: {
                type: DataTypes.DATEONLY
            }
        }
        ,{
            paranoid: true
        });
};