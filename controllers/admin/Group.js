module.exports = function(db) {
	return {
		get: function(user) {
			return new Promise(function(resolve) {
				resolve(user.groups);
			});
		},
		create: function(user, data) {
			return new Promise(function(resolve, reject) {
				let retObj = {};
				db.User.findById(user.id).then(function(foundUser) {
					if (foundUser) {
						let obj = {
							name: data.name,
							ownerId: user.id,
							memberIds: [],
						};
						db.Group.create(obj).then(function (group) {
							retObj.group = group;
							if (data.member !== 'null') {
								// Look for existing user to be added as a member
								db.User.findOne({
									where: { email: data.member }
								}).then(function(member) {
									if (member !== null) {
										// Member found
										if (member.verified) {
											// Member is verified, so send a confirmation
											retObj.member = "confirming";
											db.Verification.createGroupInvitation(user.id, user.firstName, member.email, member.firstName, group.id, data.name).then(function() {
												resolve(retObj);
											})
										} else {
											// Member is not verified, tell requestor, add post action to verification
											retObj.member = "not_verified";
											db.Verification.findOne({
												where: {
													ownerId: member.id,
													active: true
												}
											}).then(function(verification) {
												// Parse post_actions and push in new entry
												let pa = JSON.parse(verification.post_actions);
												pa.push({type: "group_add", value: group.id});
												verification.post_actions = JSON.stringify(pa);
												verification.save().then(function() {
													resolve(retObj);
												});
											});
										}
									} else {
										// Member not found, send an invitation, add post action to verification
										retObj.member = "invited";
									}
								});
								// Cast member IDs to ints
								// JSON.parse(data.members).forEach(function (val) {
								// 	if (Number(val) !== user.id) {
								// 		obj.memberIds.push(Number(val));
								// 	}
								// });
							} else {
								resolve(retObj);
							}
						}, function (error) {
							reject(error);
						});
					} else {
						reject("user not found");
					}
				}).catch(function (error) {
					console.log("catch error on Group controller create method: " + error);
					reject(error);
				});
			});
		},
		modify: function(user, data) {
			return new Promise(function(resolve, reject) {
				db.Group.findOne({
					where: {
						ownerId: user.id,
						id: data.id
					}
				}).then(function(group) {
					if (group !== null) {
						let obj = {
							name: data.name
						};
						if (data.members !== 'null') {
							// Cast member IDs to ints
							obj.memberIds = [];
							JSON.parse(data.members).forEach(function(val) {
								if (Number(val) !== user.id) {
									obj.memberIds.push(Number(val));
								}
							});
						} else {
							obj.memberIds = null;
						}
						group.update(obj).then(function() {
							resolve();
						}, function() {
							console.log("error modifying group: " + error);
							reject(error);
						})
					} else {
						reject("group not found");
					}
				}, function(error) {
					console.log("error retrieving group: " + error);
					reject(error);
				}).catch(function(error) {
					console.log("catch error on Group controller modify method: " + error);
					reject(error);
				});
			});
		},
		destroy: function(user, id) {
			return new Promise(function(resolve, reject) {
				db.Group.findOne({
					where: {
						ownerId: user.id,
						id: id
					}
				}).then(function(group) {
					if (group !== null) {
						group.destroy().then(function() {
							resolve();
						}, function() {
							console.log("error deleting group: " + error);
							reject(error);
						})
					} else {
						reject("group not found");
					}
				}, function(error) {
					console.log("error retrieving group: " + error);
					reject(error);
				}).catch(function(error) {
					console.log("catch error on Group controller delete method: " + error);
					reject(error);
				});
			});
		}
	};
};