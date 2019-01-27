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
				// Get invites from user
				db.Verification.findAll({
					where: {
						ownerId: user.id,
						type: { $ne: "email" }
					}
				}).then(function(fromInvites) {
					let fromArr = [];
					fromInvites.forEach(function(fromInvite) {
						let fObj = {
							id: fromInvite.id,
							type: fromInvite.type,
							email: fromInvite.email,
							code: fromInvite.code,
							comments: fromInvite.comments,
							completed: fromInvite.completed,
							failed: fromInvite.failed,
							active: fromInvite.active
						};
						fromArr.push(fObj);
					});
					db.Verification.findAll({
						where: {
							email: user.email,
							active: true,
							type: "group"
						}
					}).then(toInvites => {
						let toArr = [];
						toInvites.forEach(function(toInvite) {
							const pa = JSON.parse(toInvite.post_actions);
							let tObj = {
								id: toInvite.id,
								group_name: pa[0].group_name,
								from: pa[0].sender_name
							};
							toArr.push(tObj);
						});
						resolve({from: fromArr, to: toArr});
					});
				}).catch(function(error) {
					console.log("catch error on Verification controller getForUser method: " + error);
					reject(error);
				});
			});
		},
		groupInvite: function(data) {
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
					console.log("catch error on Verification controller groupInvite method: " + error);
					reject(error);
				});
			});
		},
		groupInviteInternal: function(user, data) {
			return new Promise((resolve, reject) => {
				db.Verification.findOne({
					where: {
						id: data.id,
						email: user.email,
						active: true,
						type: "group"
					}
				}).then(verification => {
					if (verification !== null) {
						if (data.code.toUpperCase() === verification.code) {
							verification.completed = true;
							verification.active = false;
							verification.save().then(function() {
								const pa = JSON.parse(verification.post_actions);
								if (pa.length > 0) {
									pa.forEach(function(action) {
										// console.log("type: " + action.type+'; value: '+action.value);
										if (action.type === "group_add") {
											db.Group.findById(action.value).then(function(group) {
												let members = JSON.parse(group.memberIds);
												members.push(user.id);
												group.memberIds = _.uniq(members);
												group.save();
											});
										}
									});
								}
								resolve();
							});
						} else {
							reject("incorrect_code");
						}
					} else {
						reject("not_found");
					}
				}).catch(error => {
					console.log("catch error on Verification controller groupInviteInternal method: " + error);
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
		siteInvite: function(data) {
			return new Promise(function(resolve, reject) {
				// Check for verification
				db.Verification.findOne({
					where: {
						guid: data.guid,
						code: data.code.toUpperCase()
					}
				}).then(function(verification) {
					// Update verification
					verification.completed = true;
					verification.active = false;
					verification.save().then(function() {
						// Create user
						db.User.create({
							firstName: data.firstName.trim()
							,lastName: data.lastName.trim()
							,email: verification.email.trim().toLowerCase()
							,password: data.password
							,verified: true
							,active: true
						}).then(function(user) {
							const pa = JSON.parse(verification.post_actions);
							if (pa.length > 0) {
								pa.forEach(function(action) {
									// console.log("type: " + action.type+'; value: '+action.value);
									if (action.type === "group_add") {
										db.Verification.createGroupInvitation(action.senderId, action.senderName, user.email, user.firstName, action.value, action.groupName).then(function() {
										});
									}
								});
							}
							resolve();
						},function(error) {
							reject(error);
						});
					});
				}).catch(function(error) {
					console.log("catch error on Verification controller siteInvite method: " + error);
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
												db.Verification.createGroupInvitation(action.senderId, action.senderName, authedUser.email, authedUser.firstName, action.value, action.groupName).then(function() {
													// nothing more to do
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
	};
};