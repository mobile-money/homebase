const Sequelize = require('sequelize');
const { fn, col } = Sequelize;
const _ = require("underscore");

function capitalize(string) {
	let retArr = [];
	const arr = string.split(" ");
	for (let i=0; i<arr.length; i++) {
		retArr.push(arr[i].charAt(0).toUpperCase() + arr[i].slice(1));
	}
	return retArr.join(" ");
}

module.exports = function(db, admin) {
	return {
        add: function(user, data) {
            return new Promise(function(resolve, reject) {
                admin.User.findById(user.id).then(function(/*foundUser*/) {
                    const catName = capitalize(data.name.trim());
                    let exp = true;
                    if (data.expense === "false") {
                        exp = false;
                    }
                    const acctIds = _.map(data.account_ids, function(val) { return Number(val); });
                    // Check for existing category
                    db.Category.findOne({
                        where: { name: catName, expense: exp }
                    }).then(function(cat) {
                        if (cat !== null) {
                            // Found a category that matches the name
                            // Merge the existing account_ids with the submitted ones
                            // update the categories account_ids and save it
                            cat.account_ids = _.uniq(_.flatten([acctIds, JSON.parse(cat.account_ids)]));
                            cat.save().then(function() {
                                cat.reload();
                                resolve(cat);
                            });
                        } else {
                            // Did not find a category that matches the name
                            db.Category.create({
                                name: catName
                                ,expense: exp
                                ,account_ids: acctIds
                            }).then(function (category) {
                                resolve(category);
                            }, function (error) {
                                reject(error);
                            });
                        }
                    });
                },function() {
                    reject('error finding user: ' + error);
                }).catch(function(error) {
                    console.log("catch error on Category controller add method: " + error);
                    reject();
                });
            });
        },
		getAll: function(user) {
			return new Promise(function(resolve, reject) {
				db.Account.getAllowedAccounts(user,{where:{active:true}}).then(function(allowedAccounts) {
					// console.log(allowedAccounts);
					let queryArr = [];
					allowedAccounts.forEach(function(allowedAccount) {
						queryArr.push(fn('JSON_CONTAINS', col('account_ids'), String(allowedAccount)));
					});
					db.Category.findAll({
						where: { $or: queryArr },
						order: [["name", "ASC"]]
					}).then(function(categories) {
						resolve(categories);
					},function(error) {
						reject(error);
					});
				});
			});
		},
		getByAccountId: function(user, id) {
			return new Promise(function(resolve, reject) {
			    db.Account.validateAccountAccess(user, id).then(function() {
					// let queryArr = [];
					// allowedAccounts.forEach(function(allowedAccount) {
					// 	queryArr.push(fn('JSON_CONTAINS', col('account_ids'), String(id)));
					// });
					db.Category.findAll({
						where: { $or: [
						    fn('JSON_CONTAINS', col('account_ids'), String(id)),
                            { id: 1 }
                        ] },
						order: [["name", "ASC"]]
					}).then(function(categories) {
						resolve(categories);
					},function(error) {
						reject(error);
					});
				});
			});
		},
		update: function(user, data) {
			return new Promise(function(resolve, reject) {
			    db.Account.getAllowedAccounts(user,{where:{active:true}}).then(function(allowedAccounts) {
			        // Make sure accounts that are being acted on accessible to the user
                    const cleanArr = _.intersection(allowedAccounts,data.account_ids);
                    if (data.action === "add") {
                        let query = "UPDATE banking.Categories SET account_ids=JSON_ARRAY_APPEND(account_ids,'$',"+
                            cleanArr.join(",'$',")+") WHERE id="+data.id;
                        // console.log(query);
                        db.sequelize.query(query).then(function(newCat) {
                            resolve(newCat);
                        }, function(error) {
                            reject(error);
                        });
                        resolve();
                    } else if (data.action === "remove") {
                        // Get the current account_ids for the category
                        db.Category.findById(data.id).then(function(category) {
                            if (category !== null) {
                                const diff = _.difference(JSON.parse(category.account_ids),cleanArr);
                                category.account_ids = diff;
                                category.save().then(function() {
                                    resolve();
                                });
                            } else {
                                reject("category not found");
                            }
                        });
                    } else {
                        resolve({});
                    }
                }).catch(function(error) {
                    console.log("catch error on Category controller update method: " + error);
                    reject(error);
                });
			});
		}
		// ,delete: function(id) {
		// 	return new Promise(function(resolve, reject) {
		// 		db.Category.destroy({
		// 			where: {
		// 				id: id
		// 			}
		// 		})
		// 		.then(
		// 			function(rows) {
		// 				if (rows === 1) {
		// 					resolve();
		// 				} else {
		// 					reject({code: 1});
		// 				}
		// 			}
		// 			,function(error) {
		// 				reject({code: -1, error: error});
		// 			}
		// 		);
		// 	});
		// }
	};
};