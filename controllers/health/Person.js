const moment = require("moment");

module.exports = function(db) {
    return {
        insert: function(person) {
            return new Promise(function(resolve, reject) {
                db.Person.create(person).then(function(result) {
                    resolve(result);
                }).catch(function(error) {
                    reject(error);
                });
            });
        }
        ,get: function(params) {
            // params.active = true;
            return new Promise(function(resolve, reject) {
                db.Person.findAll({
                    where: params
                    ,order: [[ 'last_name', 'ASC' ],[ 'first_name', 'ASC' ]]
                }).then(function(results) {
                    resolve(results);
                }).catch(function(error) {
                    reject(error);
                })
            });
        }
        ,update: function(personId, data) {
            return new Promise(function(resolve, reject) {
                db.Person.findById(personId).then(function(person) {
                    if (person !== null) {
                        if (data.first_name) { person.first_name = data.first_name; }
                        if (data.middle_name) { person.middle_name = data.middle_name; } else { person.middle_name = null; }
                        if (data.last_name) { person.last_name = data.last_name; }
                        if (data.birth_date) { person.birth_date = data.birth_date; }
                        person.save().then(function(result) {
                            resolve(result);
                        }).catch(function(error) {
                            reject(error);
                        });
                    } else {
                        reject("person not found");
                    }
                }).catch(function(error) {
                    reject(error);
                });
            });
        }
        ,delete: function(personId) {
            return new Promise(function(resolve, reject) {
                db.Person.findById(personId).then(function(person) {
                    if (person !== null) {
                        person.destroy().then(function(result) {
                            resolve(result);
                        }).catch(function(error) {
                            reject(error);
                        });
                    } else {
                        reject("person not found");
                    }
                }).catch(function(error) {
                    reject(error);
                });
            });
        }
    };
};