module.exports = function(sequelize, DataTypes) {
    return sequelize.define('CategorySplit', {
        transaction: {
            type: DataTypes.INTEGER
            ,allowNull: false
        }
        ,payload: {
            type: DataTypes.STRING(2048)
            ,allowNull: false
            ,validate: {
                len: [1,2048]
            }
        }
    });
};