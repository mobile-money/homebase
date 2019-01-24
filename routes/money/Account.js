module.exports = function(app, Account, _, io) {
	app.get("/api/v1/money/accounts", function(req, res) {
		console.log("accounts requested for user: " + req.user.id);
		// console.log(req.user);
		Account.getAll(req.user).then(function(results) {
			if (results.length > 0) {
				console.log("accounts retrieved");
				res.json(results);
			} else {
				console.log("no accounts found");
				res.status(404).send();
			}
		}).catch(function(error) {
			console.log("accounts retrieval error: "+error);
			if (error === "unauthorized") {
				res.status(401).send();
			} else {
				res.status(500).send();
			}
		});
	});

	app.post("/api/v1/money/accounts", function(req, res) {
		console.log("create account requested");
		const body = _.pick(req.body, 'name', 'balance', 'type', 'default', 'group_ids');
		if (body.group_ids === 'null') {
			body.group_ids = [];
		} else {
			body.group_ids = JSON.parse(body.group_ids);
		}
		Account.create(req.user, body).then(function(account) {
			console.log("account created");
			io.emit("accountAdded", account.id);
			res.status(201).send();
		}).catch(function(error) {
			console.log("account creation error: "+error);
			if (error === "unauthorized") {
				res.status(401).send();
			} else {
				res.status(500).send();
			}
		});
	});

	app.put("/api/v1/money/accounts", function(req, res) {
		console.log("modify account requested");
		const body = _.pick(req.body, 'name', 'type', 'default', 'id', 'group_ids');
		if (body.group_ids === 'null') {
			body.group_ids = [];
		} else {
			body.group_ids = JSON.parse(body.group_ids);
		}
		Account.update(req.user, body).then(function(result) {
			console.log("account modified");
			io.emit("accountChanged", result.id);
			res.status(200).send();
		},function() {
			console.log("account not found");
			res.status(404).send();
		}).catch(
		function(error) {
			console.log("account modification error: "+error);
			if (error === "unauthorized") {
				res.status(401).send();
			} else {
				res.status(500).send();
			}
		});
	});

	app.delete("/api/v1/money/accounts", function(req, res) {
		console.log("delete account requested");
		const body = _.pick(req.body, 'id');
		Account.delete(req.user, body.id).then(function() {
			console.log("account deleted");
			io.emit("accountDeleted", body.id);
			res.status(204).send();
		},function() {
			console.log("account not found");
			res.status(404).send();
		}).catch(function(error) {
			console.log("account deletion error: "+error);
			if (error === "unauthorized") {
				res.status(401).send();
			} else {
				res.status(500).send();
			}
		});
	});

	app.get("/api/v1/money/investments/:id", function(req, res) {
		console.log("investments requested");
		Account.getInvestments(req.user, req.params.id).then(function(obj) {
			console.log("retrieved investments");
			res.json(obj);
		}).catch(function(error) {
			console.log("investment retrieval error: "+error);
			if (error.code === 1 || error.code === 2) {
				// account not found or not Investment
				res.status(404).send();
			} else if (error.code === 2) {
				// no positions
				res.status(204).send();
			} else {
				if (error === "unauthorized") {
					res.status(401).send();
				} else {
					res.status(500).send();
				}
			}
		});
	});

	app.get("/api/v1/money/accounts/inactive", function(req, res) {
		console.log("inactive accounts requested");
		Account.getInactive(req.user).then(function(results) {
			if (results.length > 0) {
				console.log("inactive accounts retrieved");
				res.json(results);
			} else {
				console.log("no inactive accounts found");
				res.json([]);
			}
		}).catch(function(error) {
			console.log("inactive accounts retrieval error: "+error);
			if (error === "unauthorized") {
				res.status(401).send();
			} else {
				res.status(500).send();
			}
		});
	});

	app.put("/api/v1/money/accounts/reactivate", function(req, res) {
		const body = _.pick(req.body, 'id');
		console.log("reactivate account "+body.id+"requested");
		Account.reactivate(req.user, body.id).then(function() {
			res.status(200).send();
		}).catch(function(error) {
			console.log("reactivate account error: "+error);
			if (error === "unauthorized") {
				res.status(401).send();
			} else {
				res.status(500).send();
			}
		});
	});

	// Get Accessible Accounts by Group ID
	app.get('/api/v1/money/account/groups/:id', function (req, res) {
		const groupId = req.params.id;
		console.log("getting accessible accounts for group: " + groupId);
		Account.getByGroup(req.user, groupId).then(function(accounts) {
			res.status(200).json({group: Number(groupId), accounts: accounts});
		}).catch(function(error) {
			console.log("get accounts by group error: "+error);
			if (error === "unauthorized") {
				res.status(401).send();
			} else {
				res.status(500).send();
			}
		});
	});
};