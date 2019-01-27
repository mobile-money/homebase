module.exports = function(sequelize, DataTypes) {
	let Login =  sequelize.define("Login", {
		userName: {
			type: DataTypes.STRING(256)
			,allowNull: false
		}
		,count: {
			type: DataTypes.INTEGER
			,allowNull: false
			,defaultValue: 1
		},
		ip: {
			type: DataTypes.STRING
		}
	},{
		classMethods: {
			addLogin: function(user_name, ip) {
				return new Promise(function(resolve) {
					Login.findOne({
						where: {
							userName: user_name,
							ip: ip
						}
					}).then(function(login) {
						if (login !== null) {
							login.increment('count', {by: 1}).then(function() {
								resolve();
							});
						} else {
							Login.create({
								userName: user_name,
								count: 1,
								ip: ip
							}).then(function() {
								resolve();
							});
						}
					}).catch(function(error) {
						console.log("error in addLogin: " + error);
						resolve();
					});
				});
			},
			getLastLogin: (user) => {
				return new Promise((resolve, reject) => {
					Login.findOne({
						where: { userName: user.email },
						order:[[ updatedAt, "DESC" ]]
					}).then((login) => {
						if (login !== null) {
							resolve(login);
						} else {
							reject();
						}
					});
				});
			}
		}
	});

	return Login;
};