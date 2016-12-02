var _ = require("underscore");
var moment = require("moment");

module.exports = function(db) {
	return {
		getAll: function() {
			return new Promise(function(resolve, reject) {
				db.Budget.findAll({
					order: [["name", "ASC"]]
				})
				.then(
					function(results) {
						resolve(results);
					}
				)
				.catch(
					function(error) {
						reject(error);
					}
				);
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
		,add: function(data) {
			return new Promise(function(resolve, reject) {
				db.Budget.create({
					name: data.name
					,amounts: data.amounts
				})
				.then(
					function(budget) {
						resolve(budget);
					}
				)
				.catch(
					function(error) {
						reject(error);
					}
				);
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
				db.Budget.findById(id)
				.then(
					function(budg) {
						var amounts = JSON.parse(budg.amounts);
						// var categoryIds = _.pluck(amounts, "id");
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
						})
						.then(
							function(trans) {
								// console.log(trans);
								var totals = {};
								for (var i = 0, ilen = categoryIds.length; i < ilen; i++) {
									var budTotal = 0;
									for (var k = 0, klen = trans.length; k < klen; k++) {
										if (trans[k].CategoryId == categoryIds[i]) {
											budTotal += trans[k].amount;
											// console.log("trans: "+k+"; cat: "+i);
										}
									}
									totals[categoryIds[i]] = budTotal;
								}
								resolve({budget: budg, values: totals});
							}
						);
					}
				).catch(
					function(error) {
						reject(error);
					}
				);
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
}