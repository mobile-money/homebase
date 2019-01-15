// const moment = require("moment");
const _ = require("underscore");
const Sequelize = require('sequelize');
const { fn, col } = Sequelize;

module.exports = function(db, admin) {
    return {
        delete: function(user, personId) {
            return new Promise(function(resolve, reject) {
                db.Person.findOne({
                    where: {
                        id: personId,
                        ownerId: user.id
                    }
                }).then(function (person) {
                    if (person !== null) {
                        person.destroy().then(function (result) {
                            resolve(result);
                        }).catch(function (error) {
                            reject(error);
                        });
                    } else {
                        reject("person not found");
                    }
                }).catch(function (error) {
                    console.log("catch error on Person controller delete method: " + error);
                    reject();
                });
            });
        }
        ,get: function(user, params) {
            // params.active = true;
            return new Promise(function(resolve, reject) {
                let queryArr = [];
                user.groups.forEach(function(group) {
                    queryArr.push(fn('JSON_CONTAINS', col('group_ids'), String(group.id)));
                });
                params.$or =  [
                    { ownerId: user.id },
                    { $or: queryArr }
                ];

                db.Person.findAll({
                    where: params
                    ,order: [[ 'last_name', 'ASC' ],[ 'first_name', 'ASC' ]]
                }).then(function(results) {
                    let finResults = [];
                    results.forEach(function(result) {
                        let tObj = {
                            id: result.id,
                            first_name: result.first_name,
                            middle_name: result.middle_name,
                            last_name: result.last_name,
                            birth_date: result.birth_date,
                            groups: JSON.parse(result.group_ids)
                        };
                        if (result.ownerId === user.id) {
                            tObj.owner = true;
                        }
                        finResults.push(tObj);
                    });
                    resolve(finResults);
                }).catch(function(error) {
                    console.log("catch error on Person controller get method: " + error);
                    reject();
                });
            });
        }
        ,getByGroup: function(user, groupId) {
            return new Promise(function(resolve, reject) {
                // Make sure user is a part of group
                const group = _.findWhere(user.groups,{id: groupId});
                if (typeof(group !== "undefined")) {
                    db.Person.findAll({
                        where: fn('JSON_CONTAINS', col('group_ids'), String(groupId))
                    }).then(function(people) {
                        // Extract just the first and last name
                        let finArr = [];
                        people.forEach(function(person) {
                            finArr.push({
                                first_name: person.first_name,
                                middle_name: person.middle_name,
                                last_name: person.last_name
                            });
                        });
                        resolve(finArr);
                    }).catch(function(error) {
                        console.log("catch error on Person controller getByGroup method: " + error);
                        reject();
                    });
                } else {
                    reject("unauthorized");
                }
            });
        }
        ,insert: function(user, person) {
            return new Promise(function(resolve, reject) {
                admin.User.findById(user.id).then(function(foundUser) {
                    if (foundUser) {
                        person.ownerId = user.id;
                        // Make sure groups is array of INTs
                        person.group_ids = _.map(person.group_ids, function(val) { return Number(val); });
                        db.Person.create(person).then(function(result) {
                            resolve(result);
                        }, function (error) {
                            reject('unable to create person: ' + error);
                        });
                    } else {
                        reject('user not provided');
                    }
                }, function(error) {
                    reject('error finding user: ' + error);
                }).catch(function(error) {
                    console.log("catch error on Person controller insert method: " + error);
                    reject();
                });
            });
        }
        ,update: function(user, personId, data) {
            return new Promise(function(resolve, reject) {
                db.Person.findOne({
                    where: {
                        id: personId,
                        ownerId: user.id
                    }
                }).then(function(person) {
                    if (person !== null) {
                        if (data.first_name) { person.first_name = data.first_name; }
                        if (data.middle_name) { person.middle_name = data.middle_name; } else { person.middle_name = null; }
                        if (data.last_name) { person.last_name = data.last_name; }
                        if (data.birth_date) { person.birth_date = data.birth_date; }
                        // Make sure groups is array of INTs
                        person.group_ids = _.map(data.group_ids, function(val) { return Number(val); });
                        person.save().then(function(result) {
                            resolve(result);
                        });
                    } else {
                        reject("person not found");
                    }
                }).catch(function(error) {
                    console.log("catch error on Person controller update method: " + error);
                    reject();
                });
            });
        }
    };
};