module.exports = function(app, Category, _, io) {
	// Get all categories
	app.get("/api/v1/money/categories", function(req, res) {
		console.log("categories requested");
		Category.getAll(req.user).then(function(results) {
			if (results.length > 0) {
				console.log("categories retieved");
				res.json(results);
			} else {
				console.log("no categories found");
				res.status(404).send();
			}
		}).catch(function(error) {
			console.log("category retrieval error: "+error);
			res.status(500).send();
		});
	});

	// Create category
	app.post("/api/v1/money/categories", function(req, res) {
		console.log("category add requested");
		let body = _.pick(req.body, 'name', 'expense', 'account_ids');
		if (body.account_ids === 'null') {
			body.account_ids = [];
		} else {
			body.account_ids = JSON.parse(body.account_ids);
		}
		Category.add(req.user, body).then(function(category) {
			console.log("category added");
			io.emit("categoryAdded", category);
			res.status(204).send();
		}).catch(function(error) {
			console.log("category add error: "+error);
			if (error === "unauthorized") {
				res.status(401).send();
			} else {
				res.status(500).send();
			}
		});
	});

	// Update category by ID
	app.put("/api/v1/money/categories/:id", function(req, res) {
		console.log("update category requested");
		let body = _.pick(req.body, 'user', 'name', 'expense', 'account_ids');
		if (body.account_ids === 'null') {
			body.account_ids = [];
		} else {
			body.account_ids = JSON.parse(body.account_ids);
		}
		body.id = req.params.id;
		Category.update(body).then(function(category) {
			console.log("updated category");
			io.emit("categoryUpdated", category);
			res.status(200).json(category);
		}).catch(function(error) {
			console.log("category update error: "+error);
			if (error === "unauthorized") {
				res.status(401).send();
			} else {
				res.status(500).send();
			}
		});
	});

	// Delete category by ID
	app.delete("/api/v1/money/categories/:id", function(req, res) {
		console.log("delete category requested");
		Category.delete(req.params.id).then(function() {
			console.log("category deleted");
			io.emit("categoryDeleted", req.params.id);
			res.status(204).send()
		}).catch(function(error) {
			if (error.code === 1) {
				console.log("category not found");
				res.status(404).send();
			} else {
				console.log("category deletion error: "+error.error);
				if (error.error === "unauthorized") {
					res.status(401).send();
				} else {
					res.status(500).send();
				}
			}
		});
	});
};