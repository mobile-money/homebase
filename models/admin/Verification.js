// const _ = require("underscore");
const site_url = "localhost:3000";
const moment = require("moment");
const uuidv4 = require('uuid/v4');
const AWS = require("aws-sdk");
const creds = new AWS.SharedIniFileCredentials({profile: 'default'});

function sendVerificationEmail(id, email, name, guid) {
	return new Promise(function(resolve, reject) {
		// console.log("testing email send");
		AWS.config.credentials = creds;
		AWS.config.update({region: "us-east-1"});
		const params = {
			Destination: {
				ToAddresses: [
					email
				]
			},
			Message: {
				Body: {
					Html: {
						Charset: 'UTF-8',
						Data: '<p>Hello '+name+',</p><p>Thank you for joining our community!  '+
							'Please take a moment to click on the link below to verify your email address.  '+
							'Doing so will allow you to access all the features and allow us to be confident in our communications.</p>'+
							'<a href="https://'+site_url+'/verify/email_verification?id='+guid+'&phase='+id+'">'+
							'https://'+site_url+'/verify/email_verification?id='+guid+'&phase='+id+'</a><br /><br />'+
							'This link will remain active for 14 days.<br />'+
							'Thank you,<br />The Home Base Team'
					},
					Text: {
						Charset: 'UTF-8',
						Data: 'Hello '+name+',\r\nThank you for joining our community!  '+
							'Please take a moment to click on the link below to verify your email address.  '+
							'Doing so will allow you to access all the features and allow us to be confident in our communications.'+
							'\r\n\r\nhttps://'+site_url+'/verify/email_verification?id='+guid+'&phase='+id+'\r\n\r\n'+
							'This link will remain active for 14 days.\r\n'+
							'Thank you,\r\nThe Home Base Team'
					}
				},
				Subject: {
					Charset: 'UTF-8',
					Data: 'Home Base: Email Verification'
				}
			},
			Source: 'admin@litzhome.com',
			// Template: template_name,
			// TemplateData: JSON.stringify(template_data)
		};
		const sendPromise = new AWS.SES().sendEmail(params).promise();
		sendPromise.then(function(data) {
			// console.log("email sent!");
			// console.log(data.MessageId);
			resolve(data.MessageId);
		}).catch(function(error) {
			// console.log("email error");
			// console.error(error, error.stack);
			reject(error);
		});
	});
}
function sendGroupInviteEmail(email, name, owner_name, group_name, guid) {
	return new Promise(function(resolve, reject) {
		// console.log("testing email send");
		AWS.config.credentials = creds;
		AWS.config.update({region: "us-east-1"});
		const params = {
			Destination: {
				ToAddresses: [
					email
				]
			},
			Message: {
				Body: {
					Html: {
						Charset: 'UTF-8',
						Data: '<p>Hello '+name+',</p><p>You have been invited to a group named '+group_name+' by '+owner_name+
							'.  Please take a moment to click on the link below to accept your invitation.  '+
							'You will need a verification code from '+owner_name+' to accept the invitation.</p>'+
							'<a href="https://'+site_url+'/verify/group_invitation?id='+guid+'">'+
							'https://'+site_url+'/verify/group_invitation?id='+guid+'</a><br /><br />'+
							'This link will remain active for 14 days.<br />'+
							'Thank you,<br />The Home Base Team'
					},
					Text: {
						Charset: 'UTF-8',
						Data: 'Hello '+name+',\r\nYou have been invited to a group named '+group_name+' by '+owner_name+
							'.  Please take a moment to click on the link below to accept your invitation.  '+
							'You will need a verification code from '+owner_name+' to accept the invitation.'+
							'\r\n\r\nhttps://'+site_url+'/verify/group_invitation?id='+guid+'\r\n\r\n'+
							'This link will remain active for 14 days.\r\n'+
							'Thank you,\r\nThe Home Base Team'
					}
				},
				Subject: {
					Charset: 'UTF-8',
					Data: 'Home Base: Group Invitation'
				}
			},
			Source: 'admin@litzhome.com',
			// Template: template_name,
			// TemplateData: JSON.stringify(template_data)
		};
		const sendPromise = new AWS.SES().sendEmail(params).promise();
		sendPromise.then(function(data) {
			// console.log("email sent!");
			// console.log(data.MessageId);
			resolve(data.MessageId);
		}).catch(function(error) {
			// console.log("email error");
			// console.error(error, error.stack);
			reject(error);
		});
	});
}
function sendSiteInviteEmail(email, sender_name, guid) {
	return new Promise(function(resolve, reject) {
		AWS.config.credentials = creds;
		AWS.config.update({region: "us-east-1"});
		const params = {
			Destination: {
				ToAddresses: [
					email
				]
			},
			Message: {
				Body: {
					Html: {
						Charset: 'UTF-8',
						Data: '<p>Hello,</p><p>You have been invited to Litzhome.com by '+sender_name+
							'!  Please take a moment to click on the link below to accept your invitation and join our ' +
							'community.  You will need a verification code from '+sender_name+' to accept the invitation.</p>'+
							'<a href="https://'+site_url+'/verify/site_invitation?id='+guid+'&stamp='+Buffer.from(email).toString('base64')+'">'+
							'https://'+site_url+'/verify/site_invitation?id='+guid+'&stamp='+Buffer.from(email).toString('base64')+'</a><br /><br />'+
							'This link will remain active for 14 days.<br />'+
							'Thank you,<br />The <a href="https://'+site_url+'/welcome">Litzhome.com</a> Team'
					},
					Text: {
						Charset: 'UTF-8',
						Data: 'Hello,\r\nYou have been invited to Litzhome.com by '+sender_name+
							'!  Please take a moment to click on the link below to accept your invitation and join our ' +
							'community.  You will need a verification code from '+sender_name+' to accept the invitation.'+
							'\r\n\r\nhttps://'+site_url+'/verify/site_invitation?id='+guid+'&stamp='+Buffer.from(email).toString('base64')+'\r\n\r\n'+
							'This link will remain active for 14 days.\r\n'+
							'Thank you,\r\nThe Litzhome.com Team'
					}
				},
				Subject: {
					Charset: 'UTF-8',
					Data: 'Home Base: Site Invitation'
				}
			},
			Source: 'admin@litzhome.com',
			// Template: template_name,
			// TemplateData: JSON.stringify(template_data)
		};
		const sendPromise = new AWS.SES().sendEmail(params).promise();
		sendPromise.then(function(data) {
			// console.log("email sent!");
			// console.log(data.MessageId);
			resolve(data.MessageId);
		}).catch(function(error) {
			// console.log("email error");
			// console.error(error, error.stack);
			reject(error);
		});
	});
}
function makeId() {
	let text = "";
	const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

	for (let i = 0; i < 6; i++)
		text += possible.charAt(Math.floor(Math.random() * possible.length));

	return text;
}
module.exports = function(sequelize, DataTypes) {
	let Verification = sequelize.define("Verification", {
		guid: {
			type: DataTypes.STRING(36),
			allowNull: false
		},
		type: {
			type: DataTypes.STRING
			,allowNull: false
		}
		,email: {
			type: DataTypes.STRING
			,allowNull: false
		}
		,code: {
			type: DataTypes.STRING,
		}
		,ownerId: {
			type: DataTypes.INTEGER
			,allowNull: false
		}
		,completed: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
		}
		,failed: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: false
		}
		,active: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: true
		}
		,comments: {
			type: DataTypes.STRING
		}
		,post_actions: {
			type: DataTypes.STRING(2048),
			defaultValue: "[]"
		}
	}
	,{
		// paranoid: true,
		hooks: {
		}
		,classMethods: {
			createEmailVerification: function(user, post_actions) {
				return new Promise(function(resolve, reject) {
					const guid = uuidv4();
					let obj = {
						guid: guid,
						type: "email",
						email: user.email,
						ownerId: user.id,
						active: true
					};
					if (post_actions) {
						obj.post_actions = post_actions;
					}
					Verification.create(obj).then(function(verification) {
						// Send email
						sendVerificationEmail(user.id, user.email, user.firstName, guid).then(function(messageId) {
							resolve(messageId);
						}, function(error) {
							// Send email failed, deactivate created verification
							console.log("send email verification message error: " + error);
							verification.active = false;
							verification.save().then(function() {
								reject();
							})
						});
					}).catch(error => {
						console.log("catch error in Verification model createEmailVerification method: " + error);
						reject();
					});
				});
			},
			createGroupInvitation: function(owner_id, owner_name, user_email, user_name, group_id, group_name) {
				return new Promise(function(resolve, reject) {
					const guid = uuidv4();
					let obj = {
						guid: guid,
						type: "group",
						code: makeId(),
						email: user_email,
						ownerId: owner_id,
						active: true,
						comments: group_name,
						post_actions: JSON.stringify([{type: "group_add",value: group_id, group_name: group_name, sender_name: owner_name}])
					};
					Verification.create(obj).then(function(verification) {
						// Send email
						sendGroupInviteEmail(user_email, user_name, owner_name, group_name, guid).then(function(messageId) {
							resolve(messageId);
						}, function(error) {
							// Send email failed, deactivate created verification
							console.log("send group invitation message error: " + error);
							verification.active = false;
							verification.save().then(function() {
								reject();
							})
						});
					}).catch(error => {
						console.log("catch error in Verification model createGroupInvitation method: " + error);
						reject();
					});
				});
			},
			createSiteInvitation: function(sender_id, sender_name, email, post_action) {
				return new Promise(function(resolve, reject) {
					// Check for existing invite
					Verification.findOne({
						where: {
							email: email,
							active: true,
							type: "site"
						}
					}).then(verification => {
						if (verification !== null) {
							// If provided, add post_action to existing verification
							if (post_action) {
								verification.post_actions = JSON.stringify(JSON.parse(verification.post_actions).push(post_action));
								verification.save().then(() => {
									resolve();
								})
							}
						} else {
							// No existing verification, create new
							const guid = uuidv4();
							let obj = {
								guid: guid,
								type: "site",
								code: makeId(),
								email: email,
								ownerId: sender_id,
								active: true,
								post_actions: "[]"
							};
							if (post_action) {
								obj.post_actions = JSON.stringify([post_action]);
							}
							Verification.create(obj).then(verification => {
								sendSiteInviteEmail(email,sender_name, guid).then(messageId => {
									resolve(messageId);
								}, error => {
									// Send email failed, deactivate created verification
									console.log("send site invitation message error: " + error);
									verification.active = false;
									verification.save().then(function() {
										reject();
									});
								});
							});
						}
					}).catch(error => {
						console.log("catch error in Verification model createSiteInvitation method: " + error);
						reject();
					});
				});
			},
			deactivateExpired: function() {
				return new Promise(function(resolve) {
					Verification.update({
						active: false
					},{
						where: {
							createdAt: {
								$lte: moment().subtract(14, 'days').toDate()
							}
						}
					}).then(function() {
						resolve();
					});
				});
			}
		}
		,instanceMethods: {
		}
	});
	
	return Verification;
};
