const bcrypt = require("bcryptjs");
const cryptojs = require("crypto-js");
const _ = require("underscore");
const moment = require("moment");
const AWS = require("aws-sdk");
const creds = new AWS.SharedIniFileCredentials({profile: 'default'});
function sendLockoutEmail(user) {
	return new Promise(function(resolve, reject) {
		// console.log("testing email send");
		AWS.config.credentials = creds;
		AWS.config.update({region: "us-east-1"});
		const params = {
			Destination: {
				ToAddresses: [
					user.email
				]
			},
			Message: {
				Body: {
					Html: {
						Charset: 'UTF-8',
						Data: '<p>Hello '+user.firstName+',</p><p>Due to too many failed login attempts, your account has been locked out.  ' +
							'Please contact your administrator to resolve this injustice.<br /><br />'+
							'Thank you,<br />The Home Base Team'
					},
					Text: {
						Charset: 'UTF-8',
						Data: 'Hello '+user.firstName+',\r\nDue to too many failed login attempts, your account has been locked out.  ' +
							'Please contact your administrator to resolve this injustice.\r\n\r\n'+
							'Thank you,\r\nThe Home Base Team'
					}
				},
				Subject: {
					Charset: 'UTF-8',
					Data: 'Home Base: Account Locked Out'
				}
			},
			Source: 'admin@litzhome.com',
			// Template: template_name,
			// TemplateData: JSON.stringify(template_data)
		};
		const sendPromise = new AWS.SES().sendEmail(params).promise();
		sendPromise.then(function(data) {
			console.log("lockout email sent to "+user.email);
			console.log(data.MessageId);
			resolve(data.MessageId);
		}).catch(function(error) {
			console.log("error sending lockout email to "+user.email);
			console.error(error, error.stack);
			reject(error);
		});
	});
}

module.exports = function(db) {
	return {
		changeName: function(user, data) {
			return new Promise(function(resolve, reject) {
				db.User.update({
					firstName: data.firstName,
					lastName: data.lastName
				}, {
					where: { id: user.id }
				}).then(function() {
					resolve();
				}).catch(function(error) {
					console.log("catch error on User controller changeName method: " + error);
					reject();
				});
			});
		},
		changePassword: function(user, data) {
			return new Promise(function(resolve, reject) {
				// Get the current user
				db.User.findOne({where: { id: user.id } }).then(function(foundUser) {
					if (foundUser !== null) {
						db.User.authenticate({email: foundUser.email, password: data.currentPassword}).then(function(authUser) {
							let salt = bcrypt.genSaltSync(10);
							let hashedPassword = bcrypt.hashSync(data.newPassword, salt);
							authUser.salt = salt;
							authUser.password_hash = hashedPassword;
							authUser.save().then(function() {
								resolve();
							});
							// this.setDataValue("password", value);
							// this.setDataValue("salt", salt);
							// this.setDataValue("password_hash", hashedPassword);
						}, function(error) {
							console.log("error authenticating user: " + error);
							reject("bad_password");
						});
					} else {
						console.log("user not found");
						reject();
					}
				}).catch(function(error) {
					console.log("catch error on User controller changePassword method: " + error);
					reject();
				});
			});
		},
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
							,verified: false
							,active: true
						}).then(function(user) {
							db.Verification.createEmailVerification(user).then(function() {
								resolve(_.omit(user,['password','salt','password_hash']));
							});
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
		,getOther: function(/*user*/) {
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
				db.Verification.deactivateExpired().then(function() {
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
											sendLockoutEmail(user);
											console.log("failed login: account locked");
											reject({code: 1});
										});
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
					});
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