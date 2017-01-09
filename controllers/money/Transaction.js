var moment = require("moment");
var _ = require("underscore");

module.exports = function(db) {
	return {
		getByAccountId: function(id, offset, limit) {
			return new Promise(function(resolve, reject) {
				db.Transaction.findAll({
					where: { postDate: null }
					,include: [{
						model: db.Summary
						,include: [{
							model: db.Account
							,where: { id: Number(id) }
						}]
					}
					,{
						model: db.Category
					}]
					// ,offset: Number(offset)
					// ,limit: Number(limit)
					,order: [["transactionDate", "DESC"]]
				}).then(function(results) {
					var allTrans = results;
					var adjustAmount = 0;
					db.FutureTransaction.findAll({
						where: { AccountId: Number(id) }
						,order: [["transactionDate", "DESC"]]
						,include: [{ model: db.Category }]
					}).then(function(fResults) {
						if (fResults.length > 0) {
							var amounts = _.pluck(fResults, "amount");
							amounts.forEach(function(amount) {
								adjustAmount += amount;
							});
							// console.log(amounts);
							allTrans = _.union(results, fResults);
							allTrans = _.sortBy(allTrans, function(o) { return -o.transactionDate;});
						}
						db.Transaction.findAll({
							where: {
								postDate: { $ne: null }
							}
							,order: [["postDate", "DESC"],["transactionDate", "DESC"]]
							,include: [{
								model: db.Summary
								,include: [{
									model: db.Account
									,where: { id: Number(id) }
								}]
							}
							,{
								model: db.Category
							}]
							,offset: Number(offset)
							,limit: Number(limit)
						}).then(function(pResults) {
							if (pResults.length > 0) {
								allTrans = _.union(allTrans, pResults);
							}
							resolve({cTrans: allTrans, adjust: adjustAmount});
						});
					});
				}).catch(function(error) {
					reject(error);
				});
			});
		}
		,getMoreByAccountId: function(id, offset, limit) {
			return new Promise(function(resolve, reject) {
				db.Transaction.findAll({
					where: {
						postDate: { $ne: null }
					}
					,order: [["postDate", "DESC"],["transactionDate", "DESC"]]
					,include: [{
						model: db.Summary
						,include: [{
							model: db.Account
							,where: { id: Number(id) }
						}]
					}
					,{
						model: db.Category
					}]
					,offset: Number(offset)
					,limit: Number(limit)
				}).then(function(pResults) {
					resolve({cTrans: pResults, adjust: 0});
				}).catch(function(error) {
					reject(error);
				});
			});
		}
		,getBySummaryId: function(id) {
			return new Promise(function(resolve, reject) {
				db.Transaction.findAll({
					where: {
						SummaryId: id
					}
					,order: [['transactionDate', 'DESC']]
					,include: [
						{model: db.Category}
						,{model: db.Summary}
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
		,getByCategoryId: function(id, start, end) {
			return new Promise(function(resolve, reject) {
				var startDate = moment(start, "X");
				var endDate = moment(end, "X");
				db.Transaction.findAll({
					where: {
						CategoryId: id
						,transactionDate: {
							$gte: startDate.format("YYYY-MM-DD")
							,$lte: endDate.format("YYYY-MM-DD")
						}
					}
					,include: [{
						model: db.Summary
						,include: [{
							model: db.Account
						}]
					}
					,{
						model: db.Category
					}]
					,order: [["transactionDate", "ASC"]]
				}).then(function(results) {
					resolve(results);
				}).catch(function(error) {
					reject(error);
				});
			});
		}
		,add: function(data) {
			return new Promise(function(resolve, reject) {
				db.sequelize.transaction()
				.then(
					function(t) {
						db.Account.findById(data.account)
						.then(
							function(account) {
								if (account !== null) {
									var transactionMoment = moment.utc(data.tDate, "MM/DD/YYYY");
									db.Summary.findOne({
										where: {
											AccountId: account.id
											,initial: false
											,start: {
												$lte: transactionMoment.format("YYYY-MM-DD HH:mm:ss")
											}
											,end: {
												$gte: transactionMoment.format("YYYY-MM-DD HH:mm:ss")
											}
										}
									})
									.then(
										function(summary) {
											if (summary === null) {
												// create new summary
												var startMoment = moment(transactionMoment).startOf("month");
												var endMoment = moment(transactionMoment).endOf("month");
												// console.log(endMoment);
												db.Summary.findOne({
													where: {
														end: {
															$lt: startMoment
														}
														,AccountId: account.id
													}
													,order: [['end', 'DESC']]
												})
												.then(
													function(previousSummary) {
														if (previousSummary === null) {
															// no previous summary found, use initial
															db.Summary.findOne({
																where: {
																	initial: true
																	,AccountId: account.id
																}
															})
															.then(
																function(initialSummary) {
																	// console.log(initialSummary);
																	// resolve(initialSummary.balance);
																	db.Summary.create({
																		start: startMoment
																		,end: endMoment
																		,balance: initialSummary.balance
																		,initial: false
																		,AccountId: account.id
																	}
																	,{transaction: t})
																	.then(
																		function(newSummary) {
																			// resolve(newSummary);
																			// add to returned summary
																			newSummary.balance = newSummary.balance + Number(data.amount);
																			newSummary.save({transaction: t})
																			.then(
																				function(newSummary) {
																					newSummary.reload();
																					var newTrans = {
																						transactionDate: transactionMoment
																						,payee: data.payee
																						,amount: Number(data.amount)
																						,SummaryId: newSummary.id
																						,UserId: 1
																					};
																					if (data.description !== "") {
																						newTrans.description = data.description;
																					}
																					if (data.category !== "") {
																						newTrans.CategoryId = data.category;
																					}
																					if (data.hasOwnProperty("check") && data.check !== "") {
																						newTrans.checkNumber = data.check;
																					}
																					if (data.hasOwnProperty("xfer")) {
																						newTrans.xfer = Number(data.xfer);
																					}
																					if (data.hasOwnProperty("bill")) {
																						newTrans.BillId = Number(data.bill);
																					}
																					if (data.hasOwnProperty("pDate")) {
																						newTrans.postDate = moment.utc(data.pDate,"MM/DD/YYYY");
																					}
																					// console.log(newTrans);
																					db.Transaction.create(newTrans, {transaction: t})
																					.then(
																						function(newTransaction) {
																							console.log("commiting transaction");
																							t.commit();
																							resolve({newTransaction: newTransaction, newSummary: newSummary});
																						}
																						,function(error) {
																							// create transaction error
																							console.log("rolling back transaction");
																							t.rollback();
																							reject({code: 4, error: error});
																						}
																					);
																				}
																				,function(error) {
																					// summary balance update error
																					console.log("rolling back transaction");
																					t.rollback();
																					reject({code: 3, error: error});
																				}
																			);
																		}
																		,function(error) {
																			// new summary create error
																			console.log("rolling back transaction");
																			t.rollback();
																			reject({code: 2, error: error});
																		}
																	);
																}
															);
														} else {
															// console.log(previousSummary);
															// resolve(previousSummary.balance);
															db.Summary.create({
																start: startMoment
																,end: endMoment
																,balance: previousSummary.balance
																,initial: false
																,AccountId: account.id
															}, {transaction: t})
															.then(
																function(newSummary) {
																	// resolve(newSummary);
																	// add to returned summary
																	newSummary.balance = newSummary.balance + Number(data.amount);
																	newSummary.save({transaction: t})
																	.then(
																		function(newSummary) {
																			newSummary.reload();
																			var newTrans = {
																				transactionDate: transactionMoment
																				,payee: data.payee
																				,amount: Number(data.amount)
																				,SummaryId: newSummary.id
																				,UserId: 1
																			};
																			if (data.description !== "") {
																				newTrans.description = data.description;
																			}
																			if (data.category !== "") {
																				newTrans.CategoryId = data.category;
																			}
																			if (data.hasOwnProperty("check") && data.check !== "") {
																				newTrans.checkNumber = Number(data.check);
																			}
																			if (data.hasOwnProperty("xfer")) {
																				newTrans.xfer = Number(data.xfer);
																			}
																			if (data.hasOwnProperty("bill")) {
																				newTrans.BillId = Number(data.bill);
																			}
																			if (data.hasOwnProperty("pDate")) {
																				newTrans.postDate = moment.utc(data.pDate,"MM/DD/YYYY");
																			}
																			// console.log(newTrans);
																			db.Transaction.create(newTrans, {transaction: t})
																			.then(
																				function(newTransaction) {
																					console.log("commiting transaction");
																					t.commit();
																					resolve({newTransaction: newTransaction, newSummary: newSummary});
																				}
																				,function(error) {
																					// create transaction error
																					console.log("rolling back transaction");
																					t.rollback();
																					reject({code: 4, error: error});
																				}
																			);
																		}
																		,function(error) {
																			// summary balance update error
																			console.log("rolling back transaction");
																			t.rollback();
																			reject({code: 3, error: error});
																		}
																	);
																}
																,function(error) {
																	// new summary create error
																	console.log("rolling back transaction");
																	t.rollback();
																	reject({code: 2, error: error});
																}
															);
														}
													}
												);
											} else {
												// add to returned summary
												summary.balance = summary.balance + Number(data.amount);
												summary.save({transaction: t})
												.then(
													function(summary) {
														summary.reload();
														var newTrans = {
															transactionDate: transactionMoment
															,payee: data.payee
															,amount: Number(data.amount)
															,SummaryId: summary.id
															,UserId: 1
														};
														if (data.description !== "") {
															newTrans.description = data.description;
														}
														if (data.category !== "") {
															newTrans.CategoryId = data.category;
														}
														if (data.hasOwnProperty("check") && data.check !== "") {
															newTrans.checkNumber = Number(data.check);
														}
														if (data.hasOwnProperty("xfer")) {
															newTrans.xfer = Number(data.xfer);
														}
														if (data.hasOwnProperty("bill")) {
															newTrans.BillId = Number(data.bill);
														}
														if (data.hasOwnProperty("pDate")) {
															newTrans.postDate = moment.utc(data.pDate,"MM/DD/YYYY");
														}
														// console.log(newTrans);
														db.Transaction.create(newTrans, {transaction: t})
														.then(
															function(newTransaction) {
																console.log("commiting transaction");
																t.commit();
																resolve({newTransaction: newTransaction, newSummary: null});																	
															}
															,function(error) {
																// create transaction error
																console.log("rolling back transaction");
																t.rollback();
																reject({code: 4, error: error});
															}
														);
													}
													,function(error) {
														// summary balance update error
														console.log("rolling back transaction");
														t.rollback();
														reject({code: 3, error: error});
													}
												);
											}
										}
									);
								} else {
									// account not found
									console.log("rolling back transaction");
									t.rollback();
									reject({code: 1});
								}
							}
						)
						.catch(
							function(error) {
								console.log("rolling back transaction");
								t.rollback();
								reject({code: 99, error: error});
							}
						);
					}
				);
			});
		}
		,update: function(data) {
			return new Promise(function(resolve, reject) {
				db.Transaction.findById(data.id).then(function(transaction) {
					if (transaction !== null) {
						transaction.payee = data.payee;
						if (data.hasOwnProperty("description")) {
							transaction.description = data.description;
						} else {
							transaction.description = null;
						}
						if (data.hasOwnProperty("check")) {
							transaction.checkNumber = data.check;
						} else {
							transaction.checkNumber = null;
						}
						if (data.hasOwnProperty("category")) {
							transaction.CategoryId = data.category;
						} else {
							transaction.CategoryId = null;
						}
						
						transaction.save().then(function (transaction) {
							transaction.reload();
							resolve(transaction);
						});
					} else {
						reject();
					}
				}).catch(function(error) {
					reject(error);
				});
			});
		}
		,delete: function(id) {
			return new Promise(function(resolve, reject) {
				db.Transaction.destroy({
					where: {
						id: id
					}
				})
				.then(
					function(rows) {
						if (rows === 1) {
							resolve();
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
		,payeeLookup: function(term) {
			return new Promise(function(resolve, reject) {
				db.Transaction.findAll({
					attributes: ['payee']
					,where: {
						payee: {
							$like: '%'+term+'%'
						}
					}
					,order: [["payee", "ASC"]]
				}).then(function(results) {
					resolve(_.uniq(_.pluck(results, "payee"), true));
				});
			});
		}
		,descriptionLookup: function(term) {
			return new Promise(function(resolve, reject) {
				db.Transaction.findAll({
					attributes: ['description']
					,where: {
						description: {
							$like: '%'+term+'%'
						}
					}
					,order: [["description", "ASC"]]
				}).then(function(results) {
					resolve(_.uniq(_.pluck(results, "description"), true));
				});
			});
		}
		,clear: function(id) {
			return new Promise(function(resolve, reject) {
				db.Transaction.findById(id).then(function(transaction) {
					if (transaction !== null) {
						transaction.cleared = true;
						transaction.save().then(function (transaction) {
							transaction.reload();
							resolve(transaction);
						});
					} else {
						reject();
					}
				}).catch(function(error) {
					reject(error);
				});
			});
		}
		,post: function(data) {
			return new Promise(function(resolve, reject) {
				db.Transaction.findById(data.id).then(function(transaction) {
					if (transaction !== null) {
						transaction.postDate = data.date;
						transaction.save().then(function (transaction) {
							transaction.reload();
							resolve(transaction);
						});
					} else {
						reject();
					}
				}).catch(function(error) {
					reject(error);
				});
			});
		}
		,getFlow: function(account, start, end) {
			return new Promise(function(resolve, reject) {
				var startDate = moment(start, "X");
				var endDate = moment(end, "X");
				db.Summary.findAll({
					where: {
						AccountId: account
					}
				}).then(function(summaries) {
					var sumIds = _.pluck(summaries, "id");

					db.Transaction.findAll({
						where: {
							SummaryId: {
								$in: sumIds
							}
							,transactionDate: {
								$gte: startDate.format("YYYY-MM-DD")
								,$lte: endDate.format("YYYY-MM-DD")
							}
						}
						,order: [["transactionDate", "ASC"]]
					}).then(function(trans) {
						var retObj = {
							expenses: 0
							,mortgage: 0
							,ins: 0
						};
						trans.forEach(function(tran) {
							if (tran.CategoryId === 7) {
								retObj.mortgage += Math.abs(tran.amount);
							} else if (tran.amount < 0) {
								retObj.expenses += Math.abs(tran.amount);
							} else {
								retObj.ins += tran.amount;
							}
						});
						resolve(retObj);
					});
				}).catch(function(error) {
					reject(error);
				})
			});
		}
	}
}