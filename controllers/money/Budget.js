const _ = require("underscore");
const moment = require("moment");
const Sequelize = require('sequelize');
const { fn, col } = Sequelize;

module.exports = function(db, admin) {
	return {
		getAll: function(user) {
			return new Promise(function(resolve, reject) {
				let queryArr = [];
				user.groups.forEach(function(group) {
					queryArr.push(fn('JSON_CONTAINS', col('group_ids'), String(group.id)));
				});

				db.Budget.findAll({
					where: {
						$or: [
							{ ownerId: user.id },
							{ $or: queryArr }
						]
					},
					order: [["name", "ASC"]]
				}).then(function(results) {
					resolve(results);
				}).catch(function(error) {
					reject(error);
				});
			});
		}
		,getById: function(id) {
			return new Promise(function(resolve, reject) {
				db.Budget.findById(id)
				.then(
					function(result) {
						resolve(result);
					}
				)
				.catch(
					function(error) {
						reject(error);
					}
				);
			});
		}
		,add: function(user, data) {
			return new Promise(function(resolve, reject) {
				admin.User.findById(user.id).then(function(/*foundUser*/) {
					let budget = {
						name: data.name
						,amounts: data.amounts
						,ownerId: user.id
					};
					// Make sure groups is array of INTs
					budget.group_ids = _.map(data.group_ids, function(val) { return Number(val); });
					db.Budget.create(budget).then(function(newBudget) {
						resolve(newBudget);
					});
				}, function() {
					reject('error finding user: ' + error);
				}).catch(function(error) {
					console.log("catch error on Budget controller add method: " + error);
					reject();
				});
			});
		}
		,update: function(data) {
			return new Promise(function(resolve, reject) {
				db.Budget.findById(data.id)
				.then(
					function(budget) {
						if (budget !== null) {
							budget.name = data.name;
							budget.amounts = data.amounts;
							budget.save()
							.then(
								function() {
									budget.reload();
									resolve(budget);
								}
							)
						} else {
							reject({code: 1});
						}
					}
				)
				.catch(
					function(error) {
						reject({code: -1, error: error});
					}
				);
			});
		}
		,delete: function(id) {
			return new Promise(function(resolve, reject) {
				db.Budget.destroy({
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
				)
				.catch(
					function(error) {
						reject({code: -1, error: error});
					}
				);
			});
		}
		,values: function(id, start, end) {
			return new Promise(function(resolve, reject) {
				db.Budget.findById(id).then(function(budg) {
					var amounts = JSON.parse(budg.amounts);
					var categoryIds = _.keys(amounts);
					db.Transaction.findAll({
						where: {
							CategoryId: {
								$in: categoryIds
							}
							,transactionDate: {
								$gte: moment.unix(start)
								,$lte: moment.unix(end)
							}
						}
					}).then(function(trans) {
						var totals = {};
						for (var i = 0; i < categoryIds.length; i++) {
							var budTotal = 0;
							for (var k = 0; k < trans.length; k++) {
								if (Number(trans[k].CategoryId) === Number(categoryIds[i])) {
									budTotal += trans[k].amount;
								}
							}
							totals[categoryIds[i]] = budTotal;
						}
						// Get multi transactions
                        db.Transaction.findAll({
                            where: {
                                CategoryId: "1"
                                , transactionDate: {
                                    $gte: moment.unix(start)
                                    , $lte: moment.unix(end)
                                }
                            }
                        }).then(function(multiTrans) {
                        	if (multiTrans.length > 0) {
                        		var transIds = _.pluck(multiTrans, "id");
                        		db.CategorySplit.findAll({
									where: {
										transaction: {
											$in: transIds
										}
									}
								}).then(function(splits) {
									for (var i=0; i<splits.length; i++) {
										var data = JSON.parse(splits[i].payload);
										for (var k=0; k<data.length; k++) {
											if (totals.hasOwnProperty(data[k].id)) {
												totals[data[k].id] += data[k].value;
											}
										}
									}
                                    resolve({budget: budg, values: totals});
								});
							} else {
                                resolve({budget: budg, values: totals});
                            }
						});
					});
				}).catch(function(error) {
					reject(error);
				});
			});
		}
		,favorite: function(id) {
			return new Promise(function(resolve, reject) {
				db.Budget.update({
					favorite: false
				}
				,{
					where: {
						favorite: true
					}
				}).then(function() {
					db.Budget.update({
						favorite: true
					}
					,{
						where: {
							id: id
						}
					}).then(function(resp) {
						resolve(resp);
					});
				}).catch(function(error) {
					reject(error);
				});
			});
		}
	};
};