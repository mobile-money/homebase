const Sequelize = require('sequelize');
const { fn, col } = Sequelize;

module.exports = function(sequelize, DataTypes) {
    let Person = sequelize.define('Person', {
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
        ,ownerId: {
            type: DataTypes.INTEGER
            ,allowNull: false
        }
        ,group_ids: {
            type: DataTypes.JSON
        }
    }
    ,{
        paranoid: true,
        classMethods: {
            validatePersonAccess: function(user, person_id) {
                // query for all people that match the given person id AND match the user id to owner id OR
                // one of the users groups to one of the persons groups
                return new Promise(function(resolve, reject) {
                    let params = {
                        id: person_id,
                        $or: [
                            { ownerId: user.id },
                        ]
                    };
                    user.groups.forEach(function(group) {
                        params.$or.push(fn('JSON_CONTAINS', col('group_ids'), String(group.id)));
                    });
                    Person.findAll({
                        where: params
                    }).then(function(person) {
                        if (person !== null) {
                            if (person.length === 1) {
                                resolve();
                            } else {
                                // somethings off, only one car should be returned
                                reject()
                            }
                        } else {
                            // no such car found
                            reject();
                        }
                    }).catch(function(error) {
                        console.log("error in validatePersonAccess: " + error);
                        reject();
                    });
                });
            }
        }
    });
    return Person;
};