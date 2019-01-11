const bcrypt = require("bcryptjs");
const _ = require("underscore");
const cryptojs = require("crypto-js");
const jwt = require("jsonwebtoken");

module.exports = function(sequelize, DataTypes) {
	let User = sequelize.define("User", {
		firstName: {
			type: DataTypes.STRING
			,allowNull: false
			,validate: {
				len: [1,24]
			}
		}
		,lastName: {
			type: DataTypes.STRING
			,allowNull: false
			,validate: {
				len: [1,24]
			}
		}
		,email: {
			type: DataTypes.STRING
			,allowNull: false
			,unique: true
			,validate: {
				isEmail: true
				,len: [1,48]
			}
		}
		,salt: {
			type: DataTypes.STRING
		}
		,password_hash: {
			type: DataTypes.STRING
		}
		,password: {
			type: DataTypes.VIRTUAL
			,allowNull: false
			,validate: {
				len: [8,16]
			}
			,set: function(value) {
				let salt = bcrypt.genSaltSync(10);
				let hashedPassword = bcrypt.hashSync(value, salt);

				this.setDataValue("password", value);
				this.setDataValue("salt", salt);
				this.setDataValue("password_hash", hashedPassword);
			}
		}
		,active: {
			type: DataTypes.BOOLEAN
			,allowNull: false
			,defaultValue: true
		}
	}
	,{
		// paranoid: true,
		hooks: {
			beforeValidate: function(user, options) {
				if (typeof user.email === "string") {
					user.email = user.email.toLowerCase();
				}
			}
		}
		,classMethods: {
			authenticate: function(body) {
				return new Promise(function(resolve, reject) {
					if (typeof body.email !== "string" || typeof body.password !== "string") {
						reject("incorrect value types for login");
					}
					User.findOne({
						where: { email: body.email }
					}).then(function(foundUser) {
						if (!foundUser) {
							reject("user not found");
						} else {
							if (foundUser.active) {
								if (!bcrypt.compareSync(body.password, foundUser.get("password_hash"))) {
									reject("incorrect password for user: " + foundUser.id);
								} else {
									resolve(foundUser);
								}
							} else {
								reject("user inactive");
							}
						}
					},function(error) {
						reject(error);
					});
				});
			}
			,findByToken: function(token) {
				return new Promise(function(resolve, reject) {
					try {
						let decodedJWT = jwt.verify(token, "WTHy2j!2");
						let bytes = cryptojs.AES.decrypt(decodedJWT.token, "9F^y@1k1");
						let tokenData = JSON.parse(bytes.toString(cryptojs.enc.Utf8));
						
						User.findById(tokenData.id).then(function(user) {
							if (user) {
								resolve(user);
							} else {
								reject();
							}
						},function(error) {
							reject();
						});
					} catch (e) {
						reject();
					}
				});
			}
		}
		,instanceMethods: {
			toPublicJSON: function() {
				let json = this.toJSON();
				return _.pick(json, 'firstName');
			}
			,generateToken: function(type) {
				if (!_.isString(type)) {
					return undefined;
				}
				
				try {
					let stringData = JSON.stringify({id: this.get("id"), type: type});
					let encyptedData = cryptojs.AES.encrypt(stringData, "9F^y@1k1").toString();
					let token = jwt.sign({
						token: encyptedData
					}, "WTHy2j!2");
					
					return token;
				} catch(e) {
					return undefined;
				}
			}
		}
	});
	
	return User;
};
