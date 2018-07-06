module.exports = function(db) {
    return {
        insert: function(vt) {
            return new Promise(function(resolve, reject) {
                db.Visit.create(vt).then(function(result) {
                    resolve(result);
                }).catch(function(error) {
                    reject(error);
                });
            });
        }
        ,get: function(personId) {
            return new Promise(function(resolve, reject) {
                db.Visit.findAll({
                    where: {
                        PersonId: personId
                    }
                    ,order: [[ 'visit_date', 'DESC' ]]
                }).then(function(results) {
                    resolve(results);
                }).catch(function(error) {
                    reject(error);
                })
            });
        }
        ,update: function(vtId, data) {
            return new Promise(function(resolve, reject) {
                db.Visit.findById(vtId).then(function(vt) {
                    if (vt !== null) {
                        if (data.visit_date) { vt.visit_date = data.visit_date; }
                        if (data.description) { vt.description = data.description; } else { vt.description = null; }
                        if (data.cost) { vt.cost = data.cost; } else { vt.cost = null; }
                        if (data.provider) { vt.provider = data.provider; } else { vt.provider = null; }
                        if (data.PersonId) { vt.PersonId = data.PersonId; }
                        vt.save().then(function(result) {
                            resolve(result);
                        }).catch(function(error) {
                            reject(error);
                        });
                    } else {
                        reject("visit not found");
                    }
                }).catch(function(error) {
                    reject(error);
                });
            });
        }
        ,delete: function(vtId) {
            return new Promise(function(resolve, reject) {
                db.Visit.findById(vtId).then(function(vt) {
                    if (vt !== null) {
                        vt.destroy().then(function(result) {
                            resolve(result);
                        }).catch(function(error) {
                            reject(error);
                        });
                    } else {
                        reject("visit not found");
                    }
                }).catch(function(error) {
                    reject(error);
                });
            });
        }
    };
};