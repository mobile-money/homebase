module.exports = function(app, User, _) {
	app.post("/api/v1/money/users", function(req, res) {
		console.log("user add requested");
		var body = _.pick(req.body, 'email', 'password');
		User.create(body)
		.then(
			function(user) {
				console.log("user created");
				res.status(201).send();
			}
			,function(error) {
				console.log("user create error: "+error);
				res.status(400).send();
			}
		);
	});

	app.post("/api/v1/money/users/login", function (req, res) {
		console.log("login requested");
		var body = _.pick(req.body, 'email', 'password');
		User.login(body)
		.then(
			function(response) {
				console.log("successful login");
				res.header("Auth", response.tokenInstance.get("token")).json(response.userInstance.toPublicJSON());
			}
		)
		.catch(
			function(error) {
				console.log("login error: "+error);
				res.status(401).send();			
			}
		)
	});

	app.delete("/api/v1/money/users/logout", function(req, res) {
		console.log("user logout requested");
		var body = _.pick(req.body, 'token');
		User.logout(body.token)
		.then(
			function() {
				console.log("user logged out");
				res.status(200).send();
			}
			,function(error) {
				console.log("user logout error: "+error);
			}
		);
		// console.log("delete: "+body.token);
	});
}