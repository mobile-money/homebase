module.exports = function(app, Account, _, io) {
	app.get("/api/v1/money/accounts", function(req, res) {
		console.log("accounts requested");
		Account.getAll()
		.then(
			function(results) {
				if (results.length > 0) {
					console.log("accounts retrieved");
					res.json(results);
				} else {
					console.log("no accounts found");
					res.status(404).send();
				}
			}
		)
		.catch(
			function(error) {
				console.log("accounts retrieval error: "+error);
				res.status(500).send();
			}
		);
	});

	app.post("/api/v1/money/accounts", function(req, res) {
		console.log("create account requested");
		var body = _.pick(req.body, 'name', 'balance', 'type', 'default');
		Account.create(body)
		.then(
			function(account) {
				console.log("account created");
				io.emit("accountAdded", account.id);
				res.status(201).send();
			}
		)
		.catch(
			function(error) {
				console.log("account creation error: "+error);
				res.status(500).send();
			}
		);
	});

	app.put("/api/v1/money/accounts", function(req, res) {
		console.log("modify account requested");
		var body = _.pick(req.body, 'name', 'type', 'default', 'id');
		Account.update(body)
		.then(
			function(result) {
				console.log("account modified");
				io.emit("accountChanged", result.id);
				res.status(200).send();
			}
			,function() {
				console.log("account not found");
				res.status(404).send();
			}
		)
		.catch(
			function(error) {
				console.log("account modification error: "+error);
				res.status(500).send();
			}
		);
	})

	app.delete("/api/v1/money/accounts", function(req, res) {
		console.log("delete account requested");
		var body = _.pick(req.body, 'id');
		Account.delete(body.id)
		.then(
			function() {
				console.log("account deleted");
				io.emit("accountDeleted", body.id);
				res.status(204).send();
			}
			,function() {
				console.log("account not found");
				res.status(404).send();
			}
		)
		.catch(
			function(error) {
				console.log("account deletion error: "+error);
				res.status(500).send();
			}
		);
	});

	app.get("/api/v1/money/investments/:id", function(req, res) {
		console.log("investments requested");
		Account.getInvestments(req.params.id)
		.then(
			function(obj) {
				console.log("retrieved investments");
				res.json(obj);
			}
		)
		.catch(
			function(error) {
				console.log("investment retrieval error: "+error);
				if (error.code === 1 || error.code === 2) {
					// account not found or not Investment
					res.status(404).send();
				} else if (error.code === 2) {
					// no positions
					res.status(204).send();
				} else {
					res.status(500).send();
				}
			}
		);
	});

	app.get("/api/v1/money/accounts/inactive", function(req, res) {
		console.log("inactive accounts requested");
		Account.getInactive()
		.then(
			function(results) {
				if (results.length > 0) {
					console.log("inactive accounts retrieved");
					res.json(results);
				} else {
					console.log("no inactive accounts found");
					res.json([]);
				}
			}
		)
		.catch(
			function(error) {
				console.log("inactive accounts retrieval error: "+error);
				res.status(500).send();
			}
		);
	});

	app.put("/api/v1/money/accounts/reactivate", function(req, res) {
		var body = _.pick(req.body, 'id');
		console.log("reactivate account "+body.id+"requested");
		Account.reactivate(body.id)
		.then(
			function() {
				res.status(200).send();
			}
		)
		.catch(
			function(error) {
				console.log("reactivate account error: "+error);
				res.status(500).send();
			}
		);
	});

}