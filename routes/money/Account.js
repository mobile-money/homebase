module.exports = function(app, Account, _, io) {
	// Get all accounts
	app.get("/api/v1/money/accounts", function(req, res) {
		console.log("accounts requested");
		Account.getAll().then(function(results) {
			if (results.length > 0) {
				console.log("accounts retrieved");
				// console.log(results);
				// res.setHeader('Cache-Control','public, max-age=604800');
				res.json(results);
			} else {
				console.log("no accounts found");
				res.status(404).send();
			}
		}).catch(
		function(error) {
			console.log("accounts retrieval error: "+error);
			res.status(500).send();
		});
	});

	// Get all accounts plus summaries/positions
	app.get("/api/v1/money/accountsplus", function(req, res) {
		console.log("accounts requested");
		Account.getAllPlus().then(function(results) {
			if (results.length > 0) {
				console.log("accounts plus retrieved");
				// res.setHeader('Cache-Control','public, max-age=604800');
				res.json(results);
			} else {
				console.log("no accounts found");
				res.status(404).send();
			}
		}).catch(
		function(error) {
			console.log("accounts retrieval error: "+error);
			res.status(500).send();
		});
	});

	// Insert Account
	app.post("/api/v1/money/accounts", function(req, res) {
		console.log("create account requested");
		let body = _.pick(req.body, 'name', 'balance', 'type', 'default');
		Account.create(body).then(function(account) {
			console.log("account created");
			io.emit("accountAdded", account.id);
			io.emit("refreshAccounts");
			res.status(201).send();
		}).catch(function(error) {
			console.log("account creation error: "+error);
			res.status(500).send();
		});
	});

	// Update account
	app.put("/api/v1/money/accounts", function(req, res) {
		console.log("modify account requested");
		let body = _.pick(req.body, 'name', 'type', 'default', 'id');
		Account.update(body).then(function(result) {
			console.log("account modified");
			io.emit("accountChanged", result.id);
            io.emit("refreshAccounts");
			res.status(200).send();
		},function() {
			console.log("account not found");
			res.status(404).send();
		}).catch(
		function(error) {
			console.log("account modification error: "+error);
			res.status(500).send();
		});
	});

	// Make account inactive
	app.delete("/api/v1/money/accounts", function(req, res) {
		console.log("delete account requested");
		let body = _.pick(req.body, 'id');
		Account.delete(body.id).then(function() {
			console.log("account deleted");
			io.emit("accountDeleted", body.id);
            io.emit("refreshAccounts");
			res.status(204).send();
		},function() {
			console.log("account not found");
			res.status(404).send();
		}).catch(function(error) {
			console.log("account deletion error: "+error);
			res.status(500).send();
		});
	});

	//
	app.get("/api/v1/money/investments/:id", function(req, res) {
		console.log("investments requested");
		Account.getInvestments(req.params.id).then(function(obj) {
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
				res.status(500).send();
			}
		});
	});

	// Get inactive accounts
	app.get("/api/v1/money/accounts/inactive", function(req, res) {
		console.log("inactive accounts requested");
		Account.getInactive().then(function(results) {
			if (results.length > 0) {
				console.log("inactive accounts retrieved");
				res.setHeader('Cache-Control','public, max-age=15778458');
				res.json(results);
			} else {
				console.log("no inactive accounts found");
				res.json([]);
			}
		}).catch(function(error) {
			console.log("inactive accounts retrieval error: "+error);
			res.status(500).send();
		});
	});

	// Reactivate account
	app.put("/api/v1/money/accounts/reactivate", function(req, res) {
		let body = _.pick(req.body, 'id');
		console.log("reactivate account "+body.id+"requested");
		Account.reactivate(body.id).then(function() {
            io.emit("refreshAccounts");
			res.status(200).send();
		}).catch(function(error) {
			console.log("reactivate account error: "+error);
			res.status(500).send();
		});
	});

    // Data Xfer from MySQL to DynamoDB
    app.get("/api/v1/money/dataXfer/accounts/:start/:max",function(req,res) {
        Account.dataXfer(Number(req.params.start),Number(req.params.max)).then(function(result) {
            res.status(200).json(result);
        }).catch(function(err) {
            res.status(500).json(err);
        })
    });
};