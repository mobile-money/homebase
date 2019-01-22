// const moment = require("moment");
const _ = require("underscore");

module.exports = function(db) {
	return {
		deactivate: function(user, data) {
			return new Promise(function(resolve, reject) {
				db.Verification.findOne({
					where: {
						id: data.id,
						ownerId: user.id
					}
				}).then(function(result) {
					if (result !== null) {
						result.active = false;
						result.save().then(function() {
							resolve();
						})
					} else {
						reject(404);
					}
				}).catch(function(error) {
					console.log("catch error on Verification controller deactivate method: " + error);
					reject(error);
				});
			});
		},
		getForUser: function(user) {
			return new Promise(function(resolve, reject) {
				db.Verification.findAll({
					where: {
						ownerId: user.id,
						type: { $ne: "email" }
					}
				}).then(function(invites) {
					let retArr = [];
					invites.forEach(function(invite) {
						let tObj = {
							id: invite.id,
							type: invite.type,
							email: invite.email,
							code: invite.code,
							comments: invite.comments,
							completed: invite.completed,
							failed: invite.failed,
							active: invite.active
						};
						retArr.push(tObj);
					});
					resolve(retArr);
				}).catch(function(error) {
					console.log("catch error on Verification controller getForUser method: " + error);
					reject(error);
				});
			});
		},
		invitation: function(data) {
			return new Promise(function(resolve, reject) {
				db.Verification.findOne({
					where: {
						guid: data.guid,
						code: data.code.toUpperCase()
					}
				}).then(function(verification) {
					verification.completed = true;
					verification.active = false;
					verification.save().then(function() {
						const pa = JSON.parse(verification.post_actions);
						if (pa.length > 0) {
							db.User.findOne({
								where: { email: verification.email }
							}).then(function(member) {
								pa.forEach(function(action) {
									// console.log("type: " + action.type+'; value: '+action.value);
									if (action.type === "group_add") {
										db.Group.findById(action.value).then(function(group) {
											let members = JSON.parse(group.memberIds);
											members.push(member.id);
											group.memberIds = _.uniq(members);
											group.save();
										});
									}
								});
							});
						}
						resolve();
					});
				}).catch(function(error) {
					console.log("catch error on Verification controller invitation method: " + error);
					reject(error);
				});
			});
		},
		resend: function(user) {
			return new Promise(function(resolve, reject) {
				// Deactivate any outstanding email verifications for user
				db.Verification.findOne({
					where: {
						type: "email",
						ownerId: user.id,
						active: true
					}
				}).then(function(verification) {
					if (verification !== null) {
						const post_actions = verification.post_actions;
						verification.active = false;
						verification.save().then(function() {
							db.Verification.createEmailVerification(user, post_actions).then(function() {
								resolve();
							});
						});
					} else {
						db.Verification.createEmailVerification(user, null).then(function() {
							resolve();
						});
					}
				}).catch(function(error) {
					console.log("catch error on Verification controller resend method: " + error);
					reject(error);
				});
			});
		},
		verify: function(data) {
			return new Promise(function(resolve, reject) {
				// Get verification for user
				db.Verification.findOne({
					where: {
						ownerId: data.phase,
						guid: data.guid,
						active: true
						// createdAt: {
						// 	$gte: moment().subtract(7, 'days').toDate()
						// }
					}
				}).then(function(verification) {
					if (verification !== null) {
						// Authenticate user
						db.User.authenticate({email: verification.email, password: data.password}).then(function(authedUser) {
							// Update user as verified
							authedUser.verified = true;
							authedUser.save().then(function() {
								// Update verification as complete
								verification.completed = true;
								verification.active = false;
								verification.save().then(function() {
									const pa = JSON.parse(verification.post_actions);
									if (pa.length > 0) {
										pa.forEach(function(action) {
											// console.log("type: " + action.type+'; value: '+action.value);
											if (action.type === "group_add") {
												db.Verification.createGroupInvitation()
												db.Group.findById(action.value).then(function(group) {
													let members = JSON.parse(group.memberIds);
													members.push(data.phase);
													group.memberIds = _.uniq(members);
													group.save();
												});
											}
										});
									}
									resolve();
								});
							});
						}, function(error) {
							// authentication failed
							console.log("authentication failed: "+error);
							reject("unauthorized");
						});
					} else {
						// no valid verification found
						console.log("no verification found");
						reject("not_found");
					}
				}).catch(function(error) {
					console.log("catch error on Verification controller verify method: " + error);
					reject(error);
				});
			});
		}
		// create: function(user, data) {
		// 	return new Promise(function(resolve, reject) {
		// 		db.User.findById(user.id).then(function(foundUser) {
		// 			if (foundUser) {
		// 				let obj = {
		// 					name: data.name,
		// 					ownerId: user.id,
		// 					memberIds: [],
		// 				};
		// 				if (data.members !== 'null') {
		// 					// Cast member IDs to ints
		// 					JSON.parse(data.members).forEach(function (val) {
		// 						if (Number(val) !== user.id) {
		// 							obj.memberIds.push(Number(val));
		// 						}
		// 					});
		// 				}
		// 				db.Group.create(obj).then(function (group) {
		// 					resolve(group);
		// 				}, function (error) {
		// 					reject(error);
		// 				});
		// 			} else {
		// 				reject("user not found");
		// 			}
		// 		}).catch(function (error) {
		// 			console.log("catch error on Group controller create method: " + error);
		// 			reject(error);
		// 		});
		// 	});
		// },
		// modify: function(user, data) {
		// 	return new Promise(function(resolve, reject) {
		// 		db.Group.findOne({
		// 			where: {
		// 				ownerId: user.id,
		// 				id: data.id
		// 			}
		// 		}).then(function(group) {
		// 			if (group !== null) {
		// 				let obj = {
		// 					name: data.name
		// 				};
		// 				if (data.members !== 'null') {
		// 					// Cast member IDs to ints
		// 					obj.memberIds = [];
		// 					JSON.parse(data.members).forEach(function(val) {
		// 						if (Number(val) !== user.id) {
		// 							obj.memberIds.push(Number(val));
		// 						}
		// 					});
		// 				} else {
		// 					obj.memberIds = null;
		// 				}
		// 				group.update(obj).then(function() {
		// 					resolve();
		// 				}, function() {
		// 					console.log("error modifying group: " + error);
		// 					reject(error);
		// 				})
		// 			} else {
		// 				reject("group not found");
		// 			}
		// 		}, function(error) {
		// 			console.log("error retrieving group: " + error);
		// 			reject(error);
		// 		}).catch(function(error) {
		// 			console.log("catch error on Group controller modify method: " + error);
		// 			reject(error);
		// 		});
		// 	});
		// },
		// destroy: function(user, id) {
		// 	return new Promise(function(resolve, reject) {
		// 		db.Group.findOne({
		// 			where: {
		// 				ownerId: user.id,
		// 				id: id
		// 			}
		// 		}).then(function(group) {
		// 			if (group !== null) {
		// 				group.destroy().then(function() {
		// 					resolve();
		// 				}, function() {
		// 					console.log("error deleting group: " + error);
		// 					reject(error);
		// 				})
		// 			} else {
		// 				reject("group not found");
		// 			}
		// 		}, function(error) {
		// 			console.log("error retrieving group: " + error);
		// 			reject(error);
		// 		}).catch(function(error) {
		// 			console.log("catch error on Group controller delete method: " + error);
		// 			reject(error);
		// 		});
		// 	});
		// }
	};
};