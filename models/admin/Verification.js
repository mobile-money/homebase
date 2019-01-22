// const _ = require("underscore");
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
							'<a href="https://localhost:3000/email_verification?id='+guid+'&phase='+id+'">'+
							'https://localhost:3000/email_verification?id='+guid+'&phase='+id+'</a><br /><br />'+
							'This link will remain active for 14 days.<br />'+
							'Thank you,<br />The Home Base Team'
					},
					Text: {
						Charset: 'UTF-8',
						Data: 'Hello '+name+',\r\nThank you for joining our community!  '+
							'Please take a moment to click on the link below to verify your email address.  '+
							'Doing so will allow you to access all the features and allow us to be confident in our communications.'+
							'\r\n\r\nhttps://localhost:3000/email_verification?id='+guid+'&phase='+id+'\r\n\r\n'+
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
							'You will need a code from '+owner_name+' to accept the invitation.</p>'+
							'<a href="https://localhost:3000/group_invitation?id='+guid+'">'+
							'https://localhost:3000/group_invitation?id='+guid+'</a><br /><br />'+
							'This link will remain active for 14 days.<br />'+
							'Thank you,<br />The Home Base Team'
					},
					Text: {
						Charset: 'UTF-8',
						Data: 'Hello '+name+',\r\nYou have been invited to a group named '+group_name+' by '+owner_name+
							'.  Please take a moment to click on the link below to accept your invitation.  '+
							'You will need a code from '+owner_name+' to accept the invitation.'+
							'\r\n\r\nhttps://localhost:3000/group_invitation?id='+guid+'\r\n\r\n'+
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
						post_actions: JSON.stringify([{type: "group_add",value: group_id}])
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
