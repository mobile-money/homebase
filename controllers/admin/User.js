const cryptojs = require("crypto-js");
const _ = require("underscore");
const moment = require("moment");

module.exports = function(db) {
	return {
		create: function(data) {
			return new Promise(function(resolve, reject) {
				// Check for exiting account (email)
				db.User.findAll({
					where: {
						email: data.email.trim().toLowerCase()
					}
				}).then(function(result) {
					if (result.length === 0) {
						db.User.create({
							firstName: data.firstName.trim()
							,lastName: data.lastName.trim()
							,email: data.email.trim().toLowerCase()
							,password: data.password
							,active: true
						}).then(function(user) {
							resolve(_.omit(user,['password','salt','password_hash']));
						},function(error) {
							reject(error);
						});
					} else {
						reject("account already exists");
					}
				}).catch(function(error) {
					console.log("catch error on User controller create method: " + error);
					reject();
				});

			});
		}
		,getOther: function(user) {
			return new Promise(function(resolve, reject) {
				db.User.findAll({
					// where: {
					// 	id : {
					// 		$ne: user.id
					// 	}
					// },
					order: [['lastName', 'ASC']]
				}).then(function(results) {
					let filteredArray = [];
					results.forEach(function(obj) {
						let filteredObj = _.pick(obj, 'firstName', 'lastName');
						// filteredObj.uid = cryptojs.AES.encrypt(obj.id+'_padding','1M1x%SQ%').toString();
						filteredObj.uid = obj.id;
						filteredArray.push(filteredObj);
					});
					resolve(filteredArray);
				}).catch(function(error) {
					console.log("catch error on User controller getOther method: " + error);
					reject();
				})
			});
		}
		,login: function(data, req_ip) {
			return new Promise(function(resolve, reject) {
				let userInstance;
				db.User.authenticate(data).then(function(user) {
					// console.log("user auth");
					const token = user.generateToken("authentication");
					userInstance = user;
					db.Token.create({
						token: token
					}).then(function(tokenInstance) {
						// console.log("token created");
						console.log("successful login");
						db.Login.addLogin(data.email, req_ip).then(function() {
							resolve({tokenInstance: tokenInstance, userInstance: userInstance});
						});
					});
				}, function(error) {
					// failed login
					if (error.match(/^incorrect password/)) {
						db.FailedLogin.create({
							userName: data.email,
							error: error,
							ip: req_ip
						}).then(function() {
							// Check for too many failed logins, 5 in the last 2 hours
							db.FailedLogin.findAll({
								where: {
									userName: data.email,
									createdAt: { $gte: moment().subtract(2, 'hours').toDate() }
								}
							}).then(function(failedLogins) {
								console.log("failed logins: " + failedLogins.length);
								if (failedLogins.length >= 5) {
									db.User.update({
										active: false
									},{
										where: { email: data.email }
									}).then(function() {
										console.log("failed login: account locked");
										reject({code: 1});
									})
								} else {
									console.log("failed login: " + error);
									reject({code: 1});
								}
							});
						});
					} else {
						console.log("failed login: " + error);
						reject({code: 1});
					}
				}).catch(function(error) {
					console.log("catch error on User controller login method: " + error);
					reject({code: -1});
				});
			});
		}
		,logout: function(token) {
			return new Promise(function(resolve, reject) {
				db.Token.findOne({
					where: {
						tokenHash: cryptojs.MD5(token).toString()
					}
				}).then(function(tokenInstance) {
					// console.log("found: "+JSON.stringify(tokenInstance));
					if (!tokenInstance) {
						reject();
					}
					db.Token.destroy({
						where: {
							id: tokenInstance.id
						}
					}).then(function() {
						resolve();
					});
				}).catch(function(error) {
					console.log("catch error on User controller logout method: " + error);
					reject();
				});
			});
		}
	};
};