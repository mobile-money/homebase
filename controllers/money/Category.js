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
		getAll: function(user) {
			return new Promise(function(resolve, reject) {
				db.Account.getAllowedAccounts(user,{where:{active:true}}).then(function(allowedAccounts) {
					console.log(allowedAccounts);
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
		}
		,add: function(user, data) {
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
					// db.Category.create({
					// 	name: catName
					// 	, expense: exp
					// 	, account_ids: _.map(data.account_ids, function(val) { return Number(val); })
					// }).then(function (category) {
					// 	resolve(category);
					// }, function (error) {
					// 	reject(error);
					// });
				},function() {
					reject('error finding user: ' + error);
				}).catch(function(error) {
					console.log("catch error on Category controller add method: " + error);
					reject();
				});
			});
		}
		,update: function(data) {
			return new Promise(function(resolve, reject) {
				db.Category.findById(data.id)
				.then(
					function(category) {
						var exp = true;
						if (data.expense === "false") {
							exp = false;
						}
						category.name = data.name;
						category.expense = exp;
						category.save()
						.then(
							function(category) {
								category.reload();
								resolve(category);
							}
						);
					}
				)
				.catch(
					function(error) {
						reject(error);
					}
				);
			});
		}
		,delete: function(id) {
			return new Promise(function(resolve, reject) {
				db.Category.destroy({
					where: {
						id: id
					}
				})
				.then(
					function(rows) {
						if (rows === 1) {
							resolve();
						} else {
							reject({code: 1});
						}
					}
					,function(error) {
						reject({code: -1, error: error});
					}
				);
			});
		}
	};
};