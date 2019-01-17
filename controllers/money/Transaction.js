const moment = require("moment");
const _ = require("underscore");

module.exports = function(db) {
	return {
		add: function(user, data) {
			return new Promise(function(resolve, reject) {
				db.Account.validateAccountAccess(user,data.account).then(function() {
					db.sequelize.transaction().then(function(t) {
						db.Account.findById(data.account).then(function(account) {
							if (account !== null) {
								let transactionMoment = moment.utc(data.tDate, "MM/DD/YYYY");
								db.Summary.findOne({
									where: {
										AccountId: account.id
										,initial: false
										,start: { $lte: transactionMoment.format("YYYY-MM-DD HH:mm:ss") }
										,end: { $gte: transactionMoment.format("YYYY-MM-DD HH:mm:ss") }
									}
								}).then(function(summary) {
									if (summary === null) {
										// create new summary
										let startMoment = moment(transactionMoment).startOf("month");
										let endMoment = moment(transactionMoment).endOf("month");
										// console.log(endMoment);
										db.Summary.findOne({
											where: {
												end: { $lt: startMoment }
												,AccountId: account.id
											}
											,order: [['end', 'DESC']]
										}).then(function(previousSummary) {
											if (previousSummary === null) {
												// no previous summary found, use initial
												db.Summary.findOne({
													where: {
														initial: true
														,AccountId: account.id
													}
												}).then(function(initialSummary) {
													// console.log(initialSummary);
													// resolve(initialSummary.balance);
													db.Summary.create({
															start: startMoment
															,end: endMoment
															,balance: initialSummary.balance
															,initial: false
															,AccountId: account.id
														}
														,{transaction: t}).then(function(newSummary) {
														// resolve(newSummary);
														// add to returned summary
														newSummary.balance = newSummary.balance + Number(data.amount);
														newSummary.save({transaction: t}).then(function(newSummary) {
															newSummary.reload();
															let newTrans = {
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
															db.Transaction.create(newTrans, {transaction: t}).then(function(newTransaction) {
																console.log("commiting transaction");
																t.commit();
																resolve({newTransaction: newTransaction, newSummary: newSummary});
															},function(error) {
																// create transaction error
																console.log("rolling back transaction");
																t.rollback();
																reject({code: 4, error: error});
															});
														},function(error) {
															// summary balance update error
															console.log("rolling back transaction");
															t.rollback();
															reject({code: 3, error: error});
														});
													},function(error) {
														// new summary create error
														console.log("rolling back transaction");
														t.rollback();
														reject({code: 2, error: error});
													});
												});
											} else {
												// console.log(previousSummary);
												// resolve(previousSummary.balance);
												db.Summary.create({
													start: startMoment
													,end: endMoment
													,balance: previousSummary.balance
													,initial: false
													,AccountId: account.id
												}, {transaction: t}).then(function(newSummary) {
													// resolve(newSummary);
													// add to returned summary
													newSummary.balance = newSummary.balance + Number(data.amount);
													newSummary.save({transaction: t}).then(function(newSummary) {
														newSummary.reload();
														let newTrans = {
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
														db.Transaction.create(newTrans, {transaction: t}).then(function(newTransaction) {
															console.log("commiting transaction");
															t.commit();
															resolve({newTransaction: newTransaction, newSummary: newSummary});
														},function(error) {
															// create transaction error
															console.log("rolling back transaction");
															t.rollback();
															reject({code: 4, error: error});
														});
													},function(error) {
														// summary balance update error
														console.log("rolling back transaction");
														t.rollback();
														reject({code: 3, error: error});
													});
												},function(error) {
													// new summary create error
													console.log("rolling back transaction");
													t.rollback();
													reject({code: 2, error: error});
												});
											}
										});
									} else {
										// add to returned summary
										summary.balance = summary.balance + Number(data.amount);
										summary.save({transaction: t}).then(function(summary) {
											summary.reload();
											let newTrans = {
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
											db.Transaction.create(newTrans, {transaction: t}).then(function(newTransaction) {
												console.log("commiting transaction");
												t.commit();
												resolve({newTransaction: newTransaction, newSummary: null});
											},function(error) {
												// create transaction error
												console.log("rolling back transaction");
												t.rollback();
												reject({code: 4, error: error});
											});
										},function(error) {
											// summary balance update error
											console.log("rolling back transaction");
											t.rollback();
											reject({code: 3, error: error});
										});
									}
								});
							} else {
								// account not found
								console.log("rolling back transaction");
								t.rollback();
								reject({code: 1});
							}
						}).catch(function(error) {
							console.log("rolling back transaction");
							t.rollback();
							reject({code: 99, error: error});
						});
					});
				}, function() {
					reject("unauthorized");
				}).catch(function(error) {
					console.log("catch error on Transaction controller add method: " + error);
					reject();
				});
			});
		}
		,clear: function(user, id) {
			return new Promise(function(resolve, reject) {
				// Get summary of transaction
				db.Summaries.findById(id).then(function(summary) {
					// Validate account access
					db.Account.validateAccountAccess(user,summary.AccountId).then(function() {
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
						});
					}, function() {
						reject("unauthorized");
					});
				}, function(error) {
					console.log("error getting summary of transaction: " + error);
					reject();
				}).catch(function(error) {
					console.log("catch error on Transaction controller clear method: " + error);
					reject();
				});
			});
		}
		,delete: function(user, id) {
			return new Promise(function(resolve, reject) {
				// Get summary of transaction
				db.Summaries.findById(id).then(function(summary) {
					// Validate account access
					db.Account.validateAccountAccess(user,summary.AccountId).then(function() {
						db.Transaction.destroy({
							where: { id: id }
						}).then(function(rows) {
							if (rows === 1) {
								resolve();
							} else {
								reject();
							}
						});
					}, function() {
						reject("unauthorized");
					});
				}, function(error) {
					console.log("error getting summary of transaction: " + error);
					reject();
				}).catch(function(error) {
					console.log("catch error on Transaction controller delete method: " + error);
					reject();
				});
			});
		}
		,descriptionLookup: function(user, term) {
			return new Promise(function(resolve, reject) {
				db.Transaction.findAll({
					attributes: ['description']
					,where: { description: { $like: '%'+term+'%' } }
					,order: [["description", "ASC"]]
				}).then(function(results) {
					resolve(_.uniq(_.pluck(results, "description"), true));
				}).catch(function(error) {
					console.log("catch error on Transaction controller descriptionLookup method: " + error);
					reject();
				});
			});
		}
		,getByAccountId: function(user, id, offset, limit) {
			return new Promise(function(resolve, reject) {
				db.Account.validateAccountAccess(user,id).then(function() {
					db.Transaction.findAll({
						where: { postDate: null }
						,include: [{
							model: db.Summary
							,include: [{
								model: db.Account
								,where: { id: Number(id) }
							}] },
							{ model: db.Category },
							{ model: db.Bill }
						]
						// ,offset: Number(offset)
						// ,limit: Number(limit)
						,order: [["transactionDate", "DESC"]]
					}).then(function(results) {
						let allTrans = results;
						let adjustAmount = 0;
						db.FutureTransaction.findAll({
							where: { AccountId: Number(id) }
							,order: [["transactionDate", "DESC"]]
							,include: [{ model: db.Category }, {model: db.Bill}]
						}).then(function(fResults) {
							if (fResults.length > 0) {
								const amounts = _.pluck(fResults, "amount");
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
								},{
									model: db.Category
								},{
									model: db.Bill
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
					});
				}, function() {
					reject("unauthorized");
				}).catch(function(error) {
					console.log("catch error on Transaction controller getByAccountId method: " + error);
					reject();
				});
			});
		}
		,getByCategoryId: function(user, id, start, end) {
			return new Promise(function(resolve, reject) {
				// Get allowed accounts
				db.Account.getAllowedAccounts(user,{where:{active:true}}).then(function(allowedAccounts) {
					const startDate = moment(start, "X");
					const endDate = moment(end, "X");
					db.Transaction.findAll({
						where: {
							CategoryId: id
							,transactionDate: {
								$gte: startDate.format("YYYY-MM-DD")
								,$lte: endDate.format("YYYY-MM-DD")
							}
						},include: [{
							model: db.Summary
							,include: [{
								model: db.Account,
								where: {
									id: {
										$in: allowedAccounts
									}
								}
							}]
						},{
							model: db.Category
						},{
							model: db.Bill
						}]
						,order: [["transactionDate", "ASC"]]
					}).then(function(results) {
						resolve(results);
					});
				}, function(error) {
					console.log("unable to get allowed accounts: " + error);
					reject();
				}).catch(function(error) {
					console.log("catch error on Transaction controller getByCategoryId method: " + error);
					reject();
				});
			});
		}
		,getBySummaryId: function(user, id) {
			return new Promise(function(resolve, reject) {
				// Get account of summary
				db.Summary.findById(id).then(function(summary) {
					db.Account.validateAccountAccess(user,summary.AccountId).then(function() {
						db.Transaction.findAll({
							where: {
								SummaryId: id
							}
							,order: [['transactionDate', 'DESC']]
							,include: [
								{model: db.Category}
								,{model: db.Summary}
								,{model: db.Bill}
							]
						}).then(function(results) {
							resolve(results);
						});
					},function() {
						reject("unauthorized");
					});
				}, function(error) {
					console.log("error getting summary by id " + error);
					reject();
				}).catch(function(error) {
					console.log("catch error on Transaction controller getBySummaryId method: " + error);
					reject();
				});
			});
		}
		,getFlow: function(user, account, start, end) {
			return new Promise(function(resolve, reject) {
				db.Account.validateAccountAccess(user,account).then(function() {
					const startDate = moment(start, "X");
					const endDate = moment(end, "X");
					db.Summary.findAll({
						where: { AccountId: account }
					}).then(function(summaries) {
						const sumIds = _.pluck(summaries, "id");

						db.Transaction.findAll({
							where: {
								SummaryId: { $in: sumIds }
								,transactionDate: {
									$gte: startDate.format("YYYY-MM-DD")
									,$lte: endDate.format("YYYY-MM-DD")
								}
							}
							,order: [["transactionDate", "ASC"]]
						}).then(function(trans) {
							let retObj = {
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
					});
				}, function() {
					reject("unauthorized");
				}).catch(function(error) {
					console.log("catch error on Transaction controller getFlow method: " + error);
					reject();
				});
			});
		}
		,getMoreByAccountId: function(user, id, offset, limit) {
			return new Promise(function(resolve, reject) {
				db.Account.validateAccountAccess(user,id).then(function() {
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
						},{
							model: db.Category
						},{
							model: db.Bill
						}]
						,offset: Number(offset)
						,limit: Number(limit)
					}).then(function(pResults) {
						resolve({cTrans: pResults, adjust: 0});
					});
				}, function() {
					reject("unauthorized");
				}).catch(function(error) {
					console.log("catch error on Transaction controller getMoreByAccountId method: " + error);
					reject();
				});
			});
		}
		,payeeLookup: function(user, term) {
			return new Promise(function(resolve, reject) {
				db.Transaction.findAll({
					attributes: ['payee']
					,where: { payee: { $like: '%'+term+'%' } }
					,order: [["payee", "ASC"]]
				}).then(function(results) {
					resolve(_.uniq(_.pluck(results, "payee"), true));
				}).catch(function(error) {
					console.log("catch error on Transaction controller payeeLookup method: " + error);
					reject();
				});
			});
		}
		,post: function(user, data) {
			return new Promise(function(resolve, reject) {
				// Get summary of transaction
				db.Summaries.findById(data.id).then(function(summary) {
					// Validate account access
					db.Account.validateAccountAccess(user,summary.AccountId).then(function() {
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
						});
					}, function() {
						reject("unauthorized");
					});
				}, function(error) {
					console.log("error getting summary of transaction: " + error);
					reject();
				}).catch(function(error) {
					console.log("catch error on Transaction controller post method: " + error);
					reject();
				});
			});
		}
		,search: function(user, data) {
			return new Promise(function(resolve, reject) {
				db.Account.validateAccountAccess(user,data.accountId).then(function() {
					db.FutureTransaction.findAll({
						where: {
							AccountId: data.accountId
							,$or: [
								{ payee: { $like: '%' + data.text + '%' } },
								{ description: { $like: '%' + data.text + '%' } }
							]
						}
						,include: [{
							model: db.Category
						}]
						,order: [["transactionDate", "DESC"]]
						,limit: 50
					}).then(function(fTrans) {
						db.Summary.findAll({
							attributes: ['id']
							,where: { AccountId: data.accountId }
						}).then(function(summs) {
							const summId = _.pluck(summs, 'id');
							db.Transaction.findAll({
								where: {
									SummaryId: { $in: summId }
									,$or: [
										{ payee: { $like: '%' + data.text + '%' } },
										{ description: {  $like: '%' + data.text + '%' } }
									]
								}
								,include: [{
									model: db.Category
								}]
								,order: [["transactionDate", "DESC"]]
								,limit: 50
							}).then(function(trans) {
								resolve(_.flatten([fTrans, trans]));
							});
						})
					});
				}, function() {
					reject("unauthorized");
				}).catch(function(error) {
					console.log("catch error on Transaction controller search method: " + error);
					reject();
				});
			});
		}
		,update: function(user, data) {
			return new Promise(function(resolve, reject) {
				db.Transaction.findById(data.id).then(function(transaction) {
					if (transaction !== null) {
						// Get summary of transaction
						db.Summaries.findById(transaction.SummaryId).then(function(summary) {
							// Validate account access
							db.Account.validateAccountAccess(user,summary.AccountId).then(function() {
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
									if (data.hasOwnProperty("multiCat")) {
										db.CategorySplit.create({
											transaction: data.id
											,payload: data.multiCat
										}).then(function(/*split*/) {
											resolve(transaction);
										},function(splitError) {
											console.log("error creating category split: " + splitError);
										});
									} else {
										resolve(transaction);
									}
									// resolve(transaction);
								});
							}, function() {
								reject("unauthorized");
							});
						}, function(error) {
							console.log("error getting summary of transaction: " + error);
							reject();
						});
					} else {
						reject();
					}
				}).catch(function(error) {
					console.log("catch error on Transaction controller update method: " + error);
					reject();
				});
			});
		}
	}
};