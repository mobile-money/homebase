const _ = require("underscore");

module.exports = function(db) {
    return {
        delete: function(user, vtId) {
            return new Promise(function(resolve, reject) {
                db.Visit.findById(vtId).then(function(vt) {
                    if (vt !== null) {
                        db.Owner.validatePersonOwner(user.id, vt.PersonId).then(function() {
                            vt.destroy().then(function (result) {
                                resolve(result);
                            }).catch(function (error) {
                                reject(error);
                            });
                        }, function() {
                            reject('unauthorized');
                        });
                    } else {
                        reject("visit not found");
                    }
                }).catch(function(error) {
                    console.log("catch error on Visit controller delete method: " + error);
                    reject();
                });
            });
        }
        ,get: function(user, personId) {
            return new Promise(function(resolve, reject) {
                db.Owner.validatePersonOwner(user.id, personId).then(function() {
                    db.Visit.findAll({
                        where: {
                            PersonId: personId
                        }
                        ,order: [[ 'visit_date', 'DESC' ]]
                    }).then(function(results) {
                        resolve(results);
                    });
                }, function() {
                    reject('unauthorized');
                }).catch(function(error) {
                    console.log("catch error on Visit controller get method: " + error);
                    reject();
                });
            });
        }
        ,insert: function(user, vt) {
            return new Promise(function(resolve, reject) {
                db.Owner.validatePersonOwner(user.id, vt.PersonId).then(function() {
                    db.Visit.create(vt).then(function (result) {
                        resolve(result);
                    });
                }, function() {
                    reject('unauthorized');
                }).catch(function (error) {
                    console.log("catch error on Visit controller insert method: " + error);
                    reject();
                });
            });
        }
        ,update: function(user, vtId, data) {
            return new Promise(function(resolve, reject) {
                db.Owner.validatePersonOwner(user.id, data.PersonId).then(function() {
                    db.Visit.findById(vtId).then(function (vt) {
                        if (vt !== null) {
                            if (data.visit_date) {
                                vt.visit_date = data.visit_date;
                            }
                            if (data.description) {
                                vt.description = data.description;
                            } else {
                                vt.description = null;
                            }
                            if (data.cost) {
                                vt.cost = data.cost;
                            } else {
                                vt.cost = null;
                            }
                            if (data.provider) {
                                vt.provider = data.provider;
                            } else {
                                vt.provider = null;
                            }
                            if (data.PersonId) {
                                vt.PersonId = data.PersonId;
                            }
                            vt.save().then(function (result) {
                                resolve(result);
                            }).catch(function (error) {
                                reject(error);
                            });
                        } else {
                            reject("visit not found");
                        }
                    });
                }, function() {
                    reject('unauthorized');
                }).catch(function (error) {
                    console.log("catch error on Visit controller update method: " + error);
                    reject();
                });
            });
        }
    };
};