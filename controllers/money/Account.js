const _ = require("underscore");

module.exports = function(db, admin) {
	return {
		create: function(user, newAccount) {
			return new Promise(function(resolve, reject) {
				admin.User.findById(user.id).then(function(foundUser) {
					db.Account.create({
						name: newAccount.name.trim()
						,type: newAccount.type.trim()
						,default: newAccount.default
					}).then(function(account) {
						let bulkArr = [{
							userId: foundUser.id,
							AccountId: account.id,
							master: true
						}];
						if (newAccount.hasOwnProperty("aua")) {
							const arr = JSON.parse(newAccount.aua);
							if (arr) {
								arr.forEach(function(val) {
									// const bytes = cryptojs.AES.decrypt(val,'1M1x%SQ%');
									// const decrypt = bytes.toString(cryptojs.enc.Utf8);
									// const parts = decrypt.split("_");
									const tObj = {
										// userId: parts[0],
										userId: val,
										AccountId: account.id,
										master: false
									};
									bulkArr.push(tObj);
								});
							}
						}
						db.Owner.bulkCreate(bulkArr).then(function() {
							if (newAccount.type.trim() !== "Investment") {
								db.Summary.create({
									balance: newAccount.balance
									,initial: true
								}).then(function(summary) {
									account.addSummary(summary).then(function(account) {
										account.reload();
										resolve(account);
									});
								});
							} else {
								resolve(account);
							}
						}, function(error) {
							account.destroy().then(function() {
								reject('error associating users and cars: ' + error);
							},function() {
								reject('error associating users and cars: ' + error);
							})
						});
					});
				}, function() {
					reject('error finding user: ' + error);
				}).catch(function(error) {
					console.log("catch error on account controller create method: " + error);
					reject();
				});
			});
		}
		,delete: function(user, id) {
			return new Promise(function(resolve, reject) {
				db.Owner.validateAccountMaster(user.id, id).then(function() {
					db.Account.update({
						active: false
					},{
						where: {
							id: id
						}
					}).then(function(result) {
						if (result[0] === 1) {
							resolve();
						} else {
							reject("There was a problem deleting the account");
						}
					});
				}, function() {
					reject("unauthorized");
				}).catch(function(error) {
					console.log("catch error on account controller delete method: " + error);
					reject();
				});
			});
		}
		,getAll: function(user) {
			return new Promise(function(resolve, reject) {
				db.Owner.getAllowedAccounts(user.id).then(function(allowedAccounts) {
					db.Account.findAll({
						where: {
							active: true,
							id: {
								$in: allowedAccounts
							}
						}
						,order: [['name', 'ASC']]
						,include: [
							{
								model: db.Summary
								,separate: true
								,order: [['start', 'DESC']]
							},{
								model: db.Position
							},{
								model: db.Owner
							}
						]
					}).then(function(results) {
						// Extract all the owners of the returned Cars
						let ownerIds = [];
						let finResults = [];
						results.forEach(function(result) {
							let tObj = {
								id: result.id,
								active: result.active,
								default: result.default,
								name: result.name,
								type: result.type,
								Positions: result.Positions,
								Summaries: result.Summaries,
								additional_owners: []
							};
							result.Owners.forEach(function(owner) {
								// Exclude the currently logged in user
								if (owner.userId !== user.id) {
									tObj.additional_owners.push({id: owner.userId});
									ownerIds.push(owner.userId);
								}
								// Set account master
								if (owner.master) {
									if (owner.userId === user.id) {
										tObj.master = true;
									}
								}
							});
							finResults.push(tObj);
						});
						// Create an array of only unique values
						ownerIds = _.uniq(ownerIds);

						if (ownerIds.length > 0) {
							// Query for the identified owners
							admin.User.findAll({
								where: {
									id: {
										$in: ownerIds
									}
								}
							}).then(function(owners) {
								owners.forEach(function(owner) {
									finResults.forEach(function(finResult) {
										finResult.additional_owners.forEach(function(additional_owner) {
											if (additional_owner.id === owner.id) {
												// additional_owner.id = cryptojs.MD5(owner.id+'_padding').toString();
												additional_owner.first_name = owner.firstName;
												additional_owner.last_name = owner.lastName;
											}
										});
									});
								});
								resolve(finResults);
							}, function() {
								// couldn't get additional owners, so just return without them
								resolve(finResults);
							});
						} else {
							resolve(finResults);
						}
					});
				}, function() {
					reject();
				}).catch(function(error) {
					console.log("catch error on account controller getAll method: " + error);
					reject();
				});
			});
		}
		,getInactive: function(user) {
			return new Promise(function(resolve, reject) {
				db.Owner.getAllowedAccounts(user.id).then(function(allowedAccounts) {
					db.Account.findAll({
						where: {
							active: false,
							id: {
								$in: allowedAccounts
							}
						}
						,order: [['name', 'ASC']]
						,include: [
							{
								model: db.Summary
								,separate: true
								,order: [['start', 'DESC']]
							},{
								model: db.Position
							},{
								model: db.Owner
							}
						]
					}).then(function(results) {
						// Extract all the owners of the returned Cars
						let ownerIds = [];
						let finResults = [];
						results.forEach(function(result) {
							let tObj = {
								id: result.id,
								active: result.active,
								default: result.default,
								name: result.name,
								type: result.type,
								Positions: result.Positions,
								Summaries: result.Summaries,
								additional_owners: []
							};
							result.Owners.forEach(function(owner) {
								// Exclude the currently logged in user
								if (owner.userId !== user.id) {
									tObj.additional_owners.push({id: owner.userId});
									ownerIds.push(owner.userId);
								}
								// Set account master
								if (owner.master) {
									if (owner.userId === user.id) {
										tObj.master = true;
									}
								}
							});
							finResults.push(tObj);
						});
						// Create an array of only unique values
						ownerIds = _.uniq(ownerIds);

						if (ownerIds.length > 0) {
							// Query for the identified owners
							admin.User.findAll({
								where: {
									id: {
										$in: ownerIds
									}
								}
							}).then(function(owners) {
								owners.forEach(function(owner) {
									finResults.forEach(function(finResult) {
										finResult.additional_owners.forEach(function(additional_owner) {
											if (additional_owner.id === owner.id) {
												// additional_owner.id = cryptojs.MD5(owner.id+'_padding').toString();
												additional_owner.first_name = owner.firstName;
												additional_owner.last_name = owner.lastName;
											}
										});
									});
								});
								resolve(finResults);
							}, function() {
								// couldn't get additional owners, so just return without them
								resolve(finResults);
							});
						} else {
							resolve(finResults);
						}
					});
				}, function() {
					reject();
				}).catch(function(error) {
					console.log("catch error on account controller getInactive method: " + error);
					reject();
				});
			});
		}
		,getInvestments: function(user, id) {
			return new Promise(function(resolve, reject) {
				db.Owner.validateAccountOwner(user.id, id).then(function() {
					let returnObj = {};
					db.Account.findById(id).then(function(account) {
						if (account === null) {
							// account not found
							reject({code: 1});
						} else {
							if (account.type !== "Investment") {
								// account not investment
								reject({code: 2});
							} else {
								db.Position.findAll({
									where: { AccountId: id }
									,order: [["ticker", "ASC"]]
								}).then(function(positions) {
									if (positions === null) {
										reject({code: 3});
									} else {
										returnObj.positions = positions;
										let positionIds = [];
										for (let i = 0; i < positions.length; i++) {
											positionIds.push(positions[i].id);
										}
										db.Trade.findAll({
											where: { PositionId: { $in: positionIds } }
											,order: [["transactionDate", "DESC"]]
										}).then(function(trades) {
											returnObj.trades = trades;
											resolve(returnObj);
										});
									}
								});
							}
						}
					});
				}, function() {
					reject("unauthorized");
				}).catch(function(error) {
					console.log("catch error on account controller getInvestments method: " + error);
					reject({code: 99, error: ""});
				});
			});
		}
		,update: function(user, data) {
			return new Promise(function(resolve, reject) {
				db.Owner.validateAccountMaster(user.id, data.id).then(function() {
					db.Account.findById(data.id).then(function(result) {
						if (result !== null) {
							result.name = data.name;
							result.type = data.type;
							result.default = data.default;
							result.save().then(function(result) {
								result.reload();
								// Handle owner changes
								db.Owner.findAll({
									where: {
										AccountId: data.id,
										userId: { $ne: user.id }
									}
								}).then(function(owners) {
									let addOwners = [];
									let removeOwners = [];
									const auaArr = JSON.parse(data.aua);
									if (auaArr) {
										// Check for additional owners to add, collect new owners user id
										auaArr.forEach(function(aua) {
											let exists = false;
											owners.forEach(function(owner) {
												if (owner.userId === aua) { exists = true; }
											});
											if (!exists) { addOwners.push(aua); }
										});
										// Check for additional owners to remove, collect existing row id
										owners.forEach(function(owner) {
											let exists = false;
											auaArr.forEach(function(aua) {
												if (aua === owner.userId) { exists = true; }
											});
											if (!exists) { removeOwners.push(owner.id); }
										});
										if (addOwners.length > 0) {
											let addArr = [];
											addOwners.forEach(function(addOwner) {
												let tObj = {
													userId: addOwner,
													AccountId: data.id
												};
												addArr.push(tObj);
											});
											db.Owner.bulkCreate(addArr).then(function() {
												if (removeOwners.length > 0) {
													db.Owner.destroy({
														where: {
															id: {
																$in: removeOwners
															}
														}
													}).then(function() {
														// All done!
														resolve(result);
													}, function() {
														// Error removing additional owners, just move on without updating additional owners
														resolve(result);
													});
												}
											}, function() {
												// Error adding additional owners, just move on without updating additional owners
												resolve(result);
											});
										}
										if (removeOwners.length > 0) {
											db.Owner.destroy({
												where: {
													id: {
														$in: removeOwners
													}
												}
											}).then(function() {
												// All done!
												resolve(result);
											}, function() {
												// Error removing additional owners, just move on without updating additional owners
												resolve(result);
											});
										}
									} else {
										// AUA is empty, so remove all additional owners (except for logged in user)
										db.Owner.destroy({
											where: {
												AccountId: data.id,
												userId: {
													$ne: user.id
												}
											}
										}).then(function() {
											resolve(result);
										}, function() {
											// Error removing additional owners, just move on without updating additional owners
											resolve(result);
										});
									}
								}, function() {
									// Error querying owners, just move on without updating additional owners
									resolve(result);
								});
							});
						} else {
							reject();
						}
					});
				}, function() {
					reject("unauthorized");
				}).catch(function(error) {
					console.log("catch error on account controller update method: " + error);
					reject();
				});
			});
		}
		,reactivate: function(user, id) {
			return new Promise(function(resolve, reject) {
				db.Owner.validateAccountMaster(user.id, id).then(function() {
					db.Account.update({
						active: true
					},{
						where: {
							id: id
						}
					}).then(function(result) {
						if (result[0] === 1) {
							resolve();
						} else {
							reject("There was a problem reactivating the account");
						}
					});
				}, function() {
					reject("unauthorized");
				}).catch(function(error) {
					console.log("catch error on account controller reactivate method: " + error);
					reject();
				});
			});
		}
	};
};