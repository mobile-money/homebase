module.exports = function(db) {
	return {
		getAll: function() {
			return new Promise(function(resolve, reject) {
				db.Account.findAll({
					where: {
						active: true
					}
					,order: [['name', 'ASC']]
					,include: [
						{
							model: db.Summary
							,separate: true
							,order: [['start', 'DESC']]
						}
						,{
							model: db.Position
						}
					]
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
		,create: function(newAccount) {
			return new Promise(function(resolve, reject) {
				db.Account.create({
					name: newAccount.name.trim()
					,type: newAccount.type.trim()
					,default: newAccount.default
				})
				.then(
					function(account) {
						if (newAccount.type.trim() !== "Investment") {
							db.Summary.create({
								balance: newAccount.balance
								,initial: true
							})
							.then(
								function(summary) {
									account.addSummary(summary)
									.then(
										function(account) {
											account.reload();
											resolve(account);
										}
									);
								}
							);
						} else {
							resolve(account);
						}
					}
				)
				.catch(
					function(error) {
						reject(error);
					}
				)
			});
		}
		,delete: function(id) {
			return new Promise(function(resolve, reject) {
				// db.Account.destroy({
				// 	where: {
				// 		id: id
				// 	}
				// })
				// .then(
				// 	function(rows) {
				// 		if (rows === 1) {
				// 			resolve();
				// 		} else {
				// 			reject();
				// 		}
				// 	}
				// )
				// .catch(
				// 	function(error) {
				// 		reject(error);
				// 	}
				// );
				db.Account.update({
					active: false
				}
				,{
					where: {
						id: id
					}
				}).then(function(result) {
					if (result[0] === 1) {
						resolve();
					} else {
						reject("There was a problem deleting the account");
					}
				}).catch(function(error) {
					reject(error);
				});
			});
		}
		,update: function(data) {
			return new Promise(function(resolve, reject) {
				db.Account.findById(data.id)
				.then(
					function(result) {
						if (result !== null) {
							result.name = data.name;
							result.type = data.type;
							result.default = data.default;
							result.save()
							.then(
								function(result) {
									result.reload();
									resolve(result);
								}
							);
						} else {
							reject();
						}
					}
				)
				.catch(
					function(error) {
						reject(error);
					}
				);
			});
		}
		,getInvestments: function(id) {
			return new Promise(function(resolve, reject) {
				var returnObj = {};
				db.Account.findById(id)
				.then(
					function(account) {
						if (account === null) {
							// account not found
							reject({code: 1});
						} else {
							if (account.type !== "Investment") {
								// account not investment
								reject({code: 2});
							} else {
								db.Position.findAll({
									where: {
										AccountId: id
									}
									,order: [["ticker", "ASC"]]
								})
								.then(
									function(positions) {
										if (positions === null) {
											reject({code: 3});
										} else {
											returnObj.positions = positions;
											var positionIds = [];
											var i = 0;
											var len = positions.length;
											for (i; i < len; i++) {
												positionIds.push(positions[i].id);
											}
											db.Trade.findAll({
												where: {
													PositionId: {
														$in: positionIds
													}
												}
												,order: [["transactionDate", "DESC"]]
											})
											.then(
												function(trades) {
													returnObj.trades = trades;
													resolve(returnObj);
												}
											);
										}
									}
								);
							}
						}
					}
				)
				.catch(
					function(error) {
						reject({code: 99, error: error});
					}
				);
			});
		}
		,getInactive: function() {
			return new Promise(function(resolve, reject) {
				db.Account.findAll({
					where: {
						active: false
					}
					,order: [['name', 'ASC']]
					,include: [
						{
							model: db.Summary
							,separate: true
							,order: [['start', 'DESC']]
						}
						,{
							model: db.Position
						}
					]
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
		,reactivate: function(id) {
			return new Promise(function(resolve, reject) {
				db.Account.update({
					active: true
				}
				,{
					where: {
						id: id
					}
				}).then(function(result) {
					if (result[0] === 1) {
						resolve();
					} else {
						reject("There was a problem reactivating the account");
					}
				}).catch(function(error) {
					reject(error);
				});
			});
		}
	};
};