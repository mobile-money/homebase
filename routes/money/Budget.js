module.exports = function(app, Budget, _, io) {
	// Create budget
	app.post("/api/v1/money/budgets", function(req, res) {
		console.log("budget add requested");
		let body = _.pick(req.body, 'name', 'amounts');
		Budget.add(body).then(function(budget) {
			console.log("budget added");
			io.emit("budgetAdded", budget);
			res.status(204).send();
		},function(error) {
			console.log("budget add error: "+error);
			res.status(500).send();
		});
	});

	// Get all budgets
	app.get("/api/v1/money/budgets/", function(req, res) {
		console.log("budgets requested");
		Budget.getAll().then(function(results) {
			if (results.length > 0) {
				console.log("budgets retrieved");
				res.json(results);
			} else {
				console.log("no budgets found");
				res.status(404).send();
			}
		}).catch(function(error) {
			console.log("budgets retrieval error: "+error);
			res.status(500).send();
		});
	});

	// Get budget by ID
	app.get("/api/v1/money/budgets/:id", function(req, res) {
		console.log("budget requested");
		Budget.getById(Number(req.params.id)).then(function(result) {
			if (result !== null) {
				console.log("budget retrieved");
				res.json(result);
			} else {
				console.log("budget not found");
				res.status(404).send();
			}
		}).catch(function(error) {
			console.log("budget retrieval error: "+error);
			res.status(500).send();
		});
	});

	// Update Budget as favorite by ID
	app.put("/api/v1/money/budgets/favorite/:id", function(req, res) {
		console.log("budget favorite requested");
		Budget.favorite(Number(req.params.id)).then(function(response) {
			console.log("budget favorite set");
			res.json(response);
		}).catch(function(error) {
			console.log("budget favorite set error: "+error);
			res.status(500).send();
		});
	});

	// Get Budget values
	app.get("/api/v1/money/budgets/full/:id/:start/:end", function(req, res) {
		console.log("budget values requested");
		Budget.values(Number(req.params.id), Number(req.params.start), Number(req.params.end)).then(function(response) {
			console.log("budget values retrieved");
			res.json(response);
		}).catch(function(error) {
			console.log("budget values retrieval error: "+error);
			res.status(500).send();
		});
	});

	// Update Budget by ID
	app.put("/api/v1/money/budgets/:id", function(req,res) {
		console.log("update budget requested");
		let body = _.pick(req.body, 'name', 'amounts');
		body.id = req.params.id;
		Budget.update(body).then(function(budget) {
			console.log("budget updated");
			io.emit("budgetUpdated", budget.id);
			res.json(budget);
		}).catch(function(error) {
			if (error.code === 1) {
				console.log("budget not found");
				res.status(404).send();
			} else {
				console.log("budget update error: "+error.error);
				res.status(500).send();
			}
		});
	});

	// Delete Budget by ID
	app.delete("/api/v1/money/budgets/:id", function(req, res) {
		console.log("delete budget requested");
		Budget.delete(req.params.id).then(function() {
			console.log("budget deleted");
			io.emit("budgetDeleted");
			res.status(204).send();
		}).catch(function(error) {
			if (error.code === 1) {
				console.log("budget not found");
				res.status(404).send();
			} else {
				console.log("delete budget error: "+error.error);
				res.status(500).send();
			}
		});
	});

    // Data Xfer from MySQL to DynamoDB
    app.get("/api/v1/money/dataXfer/budgets/:start/:max",function(req,res) {
        Budget.dataXfer(Number(req.params.start),Number(req.params.max)).then(function(result) {
            res.status(200).json(result);
        }).catch(function(err) {
            res.status(500).json(err);
        })
    });
};