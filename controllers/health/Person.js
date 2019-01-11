// const moment = require("moment");
const _ = require("underscore");
// const cryptojs = require('crypto-js');

module.exports = function(db, admin) {
    return {
        delete: function(user, personId) {
            return new Promise(function(resolve, reject) {
                db.Owner.validatePersonMaster(user.id,personId).then(function() {
                    db.Person.findById(personId).then(function (person) {
                        if (person !== null) {
                            person.destroy().then(function (result) {
                                resolve(result);
                            }).catch(function (error) {
                                reject(error);
                            });
                        } else {
                            reject("person not found");
                        }
                    });
                }, function() {
                    reject('unauthorized');
                }).catch(function (error) {
                    console.log("catch error on Person controller delete method: " + error);
                    reject();
                });
            });
        }
        ,get: function(user, params) {
            // params.active = true;
            return new Promise(function(resolve, reject) {
                db.Owner.getAllowedPeople(user.id).then(function(ap) {
                    if (params.hasOwnProperty("id")) {
                        if (_.indexOf(ap,Number(params.id)) === -1) {
                            reject('unauthorized');
                        }
                    } else {
                        params.id = { $in: ap };
                    }

                    db.Person.findAll({
                        where: params
                        ,order: [[ 'last_name', 'ASC' ],[ 'first_name', 'ASC' ]]
                        ,include: [{
                            model: db.Owner
                        }]
                    }).then(function(results) {
                        // Extract all the owners of the returned People
                        let ownerIds = [];
                        let finResults = [];
                        results.forEach(function(result) {
                            let tObj = {
                                id: result.id,
                                first_name: result.first_name,
                                middle_name: result.middle_name,
                                last_name: result.last_name,
                                birth_date: result.birth_date,
                                additional_owners: []
                            };
                            result.Owners.forEach(function(owner) {
                                // Exclude the currently logged in user
                                if (owner.userId !== user.id) {
                                    tObj.additional_owners.push({id: owner.userId});
                                    ownerIds.push(owner.userId);
                                }
                                // Set person master
                                if (owner.master) {
                                    if (owner.userId === user.id) {
                                        tObj.master = true;
                                    }
                                }
                            });
                            finResults.push(tObj);
                        });
                        // Create an array of only unique values
                        ownerIds = _.uniq(ownerIds);
                        // console.log(ownerIds);

                        if (ownerIds.length > 0) {
                            // Query for the identified owners
                            admin.User.findAll({
                                where: {
                                    id: {
                                        $in: ownerIds
                                    }
                                }
                            }).then(function(owners) {
                                owners.forEach(function(owner) {
                                    finResults.forEach(function(finResult) {
                                        finResult.additional_owners.forEach(function(additional_owner) {
                                            if (additional_owner.id === owner.id) {
                                                // additional_owner.id = cryptojs.MD5(owner.id+'_padding').toString();
                                                additional_owner.first_name = owner.firstName;
                                                additional_owner.last_name = owner.lastName;
                                            }
                                        });
                                    });
                                });
                                resolve(finResults);
                            }, function() {
                                // couldn't get additional owners, so just return without them
                                resolve(finResults);
                            });
                        } else {
                            resolve(finResults);
                        }
                    });
                }, function() {
                    reject();
                }).catch(function(error) {
                    console.log("catch error on Person controller get method: " + error);
                    reject();
                });
            });
        }
        ,insert: function(user, person) {
            return new Promise(function(resolve, reject) {
                admin.User.findById(user.id).then(function(foundUser) {
                    if (foundUser) {
                        db.Person.create(person).then(function(result) {
                            let bulkArr = [{
                                userId: foundUser.id,
                                PersonId: result.id,
                                master: true
                            }];
                            if (person.hasOwnProperty("aua")) {
                                const arr = JSON.parse(person.aua);
                                if (arr) {
                                    arr.forEach(function(val) {
                                        // const bytes = cryptojs.AES.decrypt(val,'1M1x%SQ%');
                                        // const decrypt = bytes.toString(cryptojs.enc.Utf8);
                                        // const parts = decrypt.split("_");
                                        const tObj = {
                                            // userId: parts[0],
                                            userId: val,
                                            PersonId: result.id,
                                            master: false
                                        };
                                        bulkArr.push(tObj);
                                    });
                                }
                            }
                            db.Owner.bulkCreate(bulkArr).then(function() {
                                resolve(result);
                            }, function(error) {
                                result.destroy().then(function() {
                                    reject('error associating users and person: ' + error);
                                },function() {
                                    reject('error associating users and person: ' + error);
                                })
                            });
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
                db.Owner.validatePersonMaster(user.id,personId).then(function() {
                    db.Person.findById(personId).then(function(person) {
                        if (person !== null) {
                            if (data.first_name) { person.first_name = data.first_name; }
                            if (data.middle_name) { person.middle_name = data.middle_name; } else { person.middle_name = null; }
                            if (data.last_name) { person.last_name = data.last_name; }
                            if (data.birth_date) { person.birth_date = data.birth_date; }
                            person.save().then(function(result) {
                                // Handle owner changes
                                db.Owner.findAll({
                                    where: {
                                        PersonId: personId,
                                        userId: {
                                            $ne: user.id
                                        }
                                    }
                                }).then(function(owners) {
                                    let addOwners = [];
                                    let removeOwners = [];
                                    const auaArr = JSON.parse(data.aua);
                                    if (auaArr) {
                                        // Check for additional owners to add, collect new owners user id
                                        auaArr.forEach(function(aua) {
                                            let exists = false;
                                            owners.forEach(function(owner) {
                                                if (owner.userId === aua) { exists = true; }
                                            });
                                            if (!exists) { addOwners.push(aua); }
                                        });
                                        // Check for additional owners to remove, collect existing row id
                                        owners.forEach(function(owner) {
                                            let exists = false;
                                            auaArr.forEach(function(aua) {
                                                if (aua === owner.userId) { exists = true; }
                                            });
                                            if (!exists) { removeOwners.push(owner.id); }
                                        });
                                        if (addOwners.length > 0) {
                                            let addArr = [];
                                            addOwners.forEach(function(addOwner) {
                                                let tObj = {
                                                    userId: addOwner,
                                                    PersonId: personId
                                                };
                                                addArr.push(tObj);
                                            });
                                            db.Owner.bulkCreate(addArr).then(function() {
                                                if (removeOwners.length > 0) {
                                                    db.Owner.destroy({
                                                        where: {
                                                            id: {
                                                                $in: removeOwners
                                                            }
                                                        }
                                                    }).then(function() {
                                                        // All done!
                                                        resolve(result);
                                                    }, function() {
                                                        // Error removing additional owners, just move on without updating additional owners
                                                        resolve(result);
                                                    });
                                                }
                                            }, function() {
                                                // Error adding additional owners, just move on without updating additional owners
                                                resolve(result);
                                            });
                                        }
                                        if (removeOwners.length > 0) {
                                            db.Owner.destroy({
                                                where: {
                                                    id: {
                                                        $in: removeOwners
                                                    }
                                                }
                                            }).then(function() {
                                                // All done!
                                                resolve(result);
                                            }, function() {
                                                // Error removing additional owners, just move on without updating additional owners
                                                resolve(result);
                                            });
                                        }
                                    } else {
                                        // AUA is empty, so remove all additional owners (except for logged in user)
                                        db.Owner.destroy({
                                            where: {
                                                PersonId: personId,
                                                userId: {
                                                    $ne: user.id
                                                }
                                            }
                                        }).then(function() {
                                            resolve(result);
                                        }, function() {
                                            // Error removing additional owners, just move on without updating additional owners
                                            resolve(result);
                                        });
                                    }
                                }, function() {
                                    // Error querying owners, just move on without updating additional owners
                                    resolve(result);
                                });
                            });
                        } else {
                            reject("person not found");
                        }
                    });
                },function() {
                    reject('unauthorized');
                }).catch(function(error) {
                    console.log("catch error on Person controller update method: " + error);
                    reject();
                });
            });
        }
    };
};