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
					let finResults = [];
					results.forEach(function(result) {
						let tObj = {
							id: result.id,
							name: result.name,
							amounts: result.amounts,
							groups: JSON.parse(result.group_ids),
							accounts: JSON.parse(result.account_ids)
						};
						if (result.ownerId === user.id) {
							tObj.owner = true;
						}
						finResults.push(tObj);
					});
					resolve(finResults);
				}).catch(function(error) {
					reject(error);
				});
			});
		}
		,getById: function(user, id) {
			return new Promise(function(resolve, reject) {
				db.Budget.validateBudgetAccess(user, id).then(function() {
					db.Budget.findById(id).then(function(result) {
						resolve(result);
					});
				}, function() {
					reject("unauthorized");
				}).catch(function(error) {
					console.log("catch error on Budget controller getById method: " + error);
					reject(error);
				});
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
					// Make sure accounts is array of INTs
					budget.account_ids = _.map(data.account_ids, function(val) { return Number(val); });
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
		,update: function(user, data) {
			return new Promise(function(resolve, reject) {
				db.Budget.findOne({
					where: {
						id: data.id,
						ownerId: user.id
					}
				}).then(function(budget) {
					if (budget !== null) {
						budget.name = data.name;
						budget.amounts = data.amounts;
						budget.group_ids = _.map(data.group_ids, function(val) { return Number(val); });
						budget.account_ids = _.map(data.account_ids, function(val) { return Number(val); });
						budget.save().then(function() {
							budget.reload();
							resolve(budget);
						});
					} else {
						reject({code: 1});
					}
				}).catch(function(error) {
					reject({code: -1, error: error});
				});
			});
		}
		,delete: function(user, id) {
			return new Promise(function(resolve, reject) {
				db.Budget.destroy({
					where: {
						id: id,
						ownerId: user.id
					}
				}).then(function(rows) {
					if (rows === 1) {
						resolve();
					} else {
						reject({code: 1});
					}
				}).catch(
				function(error) {
					reject({code: -1, error: error});
				});
			});
		}
		,values: function(user, id, start, end) {
			return new Promise(function(resolve, reject) {
				db.Budget.validateBudgetAccess(user, id).then(function() {
					db.Budget.findById(id).then(function(budg) {
						let tObj = {
							id: budg.id,
							name: budg.name,
							amounts: budg.amounts,
							groups: JSON.parse(budg.group_ids),
							accounts: JSON.parse(budg.account_ids)
						};
						if (budg.ownerId === user.id) {
							tObj.owner = true;
						}
						const amounts = JSON.parse(budg.amounts);
						const categoryIds = _.keys(amounts);
						// Restrict account to only those that the user has access to
						db.Account.getAllowedAccounts(user).then(function(allowedAccounts) {
							const filteredAccounts = _.intersection(allowedAccounts, tObj.accounts);
							// Get summaries of allowed accounts linked to budget
							db.Summary.findAll({
								AccountId: { $in: filteredAccounts }
							}).then(function(summaries) {
								db.Transaction.findAll({
									where: {
										CategoryId: { $in: categoryIds }
										,transactionDate: {
											$gte: moment.unix(start)
											,$lte: moment.unix(end)
										}
										,SummaryId: { $in: _.pluck(summaries, 'id') }
									}
								}).then(function(trans) {
									let totals = {};
									for (let i = 0; i < categoryIds.length; i++) {
										let budTotal = 0;
										for (let k = 0; k < trans.length; k++) {
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
											,transactionDate: {
												$gte: moment.unix(start)
												, $lte: moment.unix(end)
											}
										}
									}).then(function(multiTrans) {
										if (multiTrans.length > 0) {
											const transIds = _.pluck(multiTrans, "id");
											db.CategorySplit.findAll({
												where: { transaction: { $in: transIds } }
											}).then(function(splits) {
												for (let i=0; i<splits.length; i++) {
													const data = JSON.parse(splits[i].payload);
													for (let k=0; k<data.length; k++) {
														if (totals.hasOwnProperty(data[k].id)) {
															totals[data[k].id] += data[k].value;
														}
													}
												}
												resolve({budget: tObj, values: totals});
											});
										} else {
											resolve({budget: tObj, values: totals});
										}
									});
								});
							});
						});
					});
				}, function() {
					reject("unauthorized");
				}).catch(function(error) {
					console.log("catch error on Budget controller values method: " + error);
					reject();
				});
			});
		}
		// ,favorite: function(id) {
		// 	return new Promise(function(resolve, reject) {
		// 		db.Budget.update({
		// 			favorite: false
		// 		}
		// 		,{
		// 			where: {
		// 				favorite: true
		// 			}
		// 		}).then(function() {
		// 			db.Budget.update({
		// 				favorite: true
		// 			}
		// 			,{
		// 				where: {
		// 					id: id
		// 				}
		// 			}).then(function(resp) {
		// 				resolve(resp);
		// 			});
		// 		}).catch(function(error) {
		// 			reject(error);
		// 		});
		// 	});
		// }
	};
};