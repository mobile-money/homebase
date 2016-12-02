var cryptojs = require("crypto-js");

module.exports = function(db) {
	return {
		create: function(data) {
			return new Promise(function(resolve, reject) {
				db.User.create({
					email: data.email.trim().toLowerCase()
					,password: data.password
				})
				.then(
					function(user) {
						resolve(user);
					}
					,function(error) {
						reject(error);
					}
				);
			});
		}
		,login: function(data) {
			return new Promise(function(resolve, reject) {
				var userInstance;
				db.User.authenticate(data)
				.then(
					function(user) {
						// console.log("user auth");
						var token = user.generateToken("authentication");
						userInstance = user;
						return db.Token.create({
							token: token
						});
					}
				)
				.then(
					function(tokenInstance) {
						// console.log("token created");
						resolve({tokenInstance: tokenInstance, userInstance: userInstance});
					}
				)
				.catch(
					function(error) {
						reject(error);
					}
				);
			});
		}
		,logout: function(token) {
			return new Promise(function(resolve, reject) {
				db.Token.findOne({
					where: {
						tokenHash: cryptojs.MD5(token).toString()
					}
				})
				.then(
					function(tokenInstance) {
						// console.log("found: "+JSON.stringify(tokenInstance));
						if (!tokenInstance) {
							reject();
						}
						db.Token.destroy({
							where: {
								id: tokenInstance.id
							}
						})
						.then(
							function() {
								resolve();
							}
						);
					}
				)
				.catch(
					function(error) {
						reject(error);
					}
				);
			});
		}
	};
}