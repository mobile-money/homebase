module.exports = function(app, Budget, _, io) {
	// Create budget
	app.post("/api/v1/money/budgets", function(req, res) {
		console.log("budget add requested");
		let body = _.pick(req.body, 'name', 'amounts', 'group_ids', 'account_ids');
		if (body.group_ids === 'null') {
			body.group_ids = [];
		} else {
			body.group_ids = JSON.parse(body.group_ids);
		}
		if (body.account_ids === 'null') {
			body.account_ids = [];
		} else {
			body.account_ids = JSON.parse(body.account_ids);
		}
		Budget.add(req.user,body).then(function(budget) {
			console.log("budget added");
			io.emit("budgetAdded", budget);
			res.status(204).send();
		}).catch(function(error) {
			console.log("budget creation error: "+error);
			if (error === "unauthorized") {
				res.status(401).send();
			} else {
				res.status(500).send();
			}
		});
	});

	// Get all budgets
	app.get("/api/v1/money/budgets/", function(req, res) {
		console.log("budgets requested");
		Budget.getAll(req.user).then(function(results) {
			if (results.length > 0) {
				console.log("budgets retrieved");
				res.json(results);
			} else {
				console.log("no budgets found");
				res.status(404).send();
			}
		}).catch(function(error) {
			console.log("budgets retrieval error: "+error);
			if (error === "unauthorized") {
				res.status(401).send();
			} else {
				res.status(500).send();
			}
		});
	});

	// Get budget by ID
	app.get("/api/v1/money/budgets/:id", function(req, res) {
		console.log("budget requested");
		Budget.getById(req.user, Number(req.params.id)).then(function(result) {
			if (result !== null) {
				console.log("budget retrieved");
				res.json(result);
			} else {
				console.log("budget not found");
				res.status(404).send();
			}
		}).catch(function(error) {
			console.log("budget retrieval error: "+error);
			if (error === "unauthorized") {
				res.status(401).send();
			} else {
				res.status(500).send();
			}
		});
	});

	// // Update Budget as favorite by ID
	// app.put("/api/v1/money/budgets/favorite/:id", function(req, res) {
	// 	console.log("budget favorite requested");
	// 	Budget.favorite(Number(req.params.id)).then(function(response) {
	// 		console.log("budget favorite set");
	// 		res.json(response);
	// 	})
	// 	.catch(function(error) {
	// 		console.log("budget favorite set error: "+error);
	// 		res.status(500).send();
	// 	});
	// });

	// Get Budget values
	app.get("/api/v1/money/budgets/full/:id/:start/:end", function(req, res) {
		console.log("budget values requested");
		Budget.values(req.user, Number(req.params.id), Number(req.params.start), Number(req.params.end)).then(function(response) {
			console.log("budget values retrieved");
			res.json(response);
		}).catch(function(error) {
			console.log("budget values retrieval error: "+error);
			if (error === "unauthorized") {
				res.status(401).send();
			} else {
				res.status(500).send();
			}
		});
	});

	// Update Budget by ID
	app.put("/api/v1/money/budgets/:id", function(req,res) {
		console.log("update budget requested");
		const body = _.pick(req.body, 'name', 'amounts', 'group_ids', 'account_ids');
		body.id = req.params.id;
		if (body.group_ids === 'null') {
			body.group_ids = [];
		} else {
			body.group_ids = JSON.parse(body.group_ids);
		}
		if (body.account_ids === 'null') {
			body.account_ids = [];
		} else {
			body.account_ids = JSON.parse(body.account_ids);
		}
		console.log(body);
		Budget.update(req.user, body).then(function(budget) {
			console.log("budget updated");
			io.emit("budgetUpdated", budget.id);
			res.json(budget);
		}).catch(function(error) {
			if (error.code === 1) {
				console.log("budget not found");
				res.status(404).send();
			} else {
				console.log("budget update error: "+error.error);
				if (error.error === "unauthorized") {
					res.status(401).send();
				} else {
					res.status(500).send();
				}
			}
		});
	});

	// Delete Budget by ID
	app.delete("/api/v1/money/budgets/:id", function(req, res) {
		console.log("delete budget requested");
		Budget.delete(req.user, req.params.id).then(function() {
			console.log("budget deleted");
			io.emit("budgetDeleted");
			res.status(204).send();
		}).catch(function(error) {
			if (error.code === 1) {
				console.log("budget not found");
				res.status(404).send();
			} else {
				console.log("delete budget error: "+error.error);
				if (error.error === "unauthorized") {
					res.status(401).send();
				} else {
					res.status(500).send();
				}
			}
		});
	});
};