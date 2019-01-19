module.exports = function(app, Category, _, io) {
	// Get all categories
	app.get("/api/v1/money/categories", function(req, res) {
        console.log("categories requested");
        Category.getAll(req.user).then(function(results) {
            if (results.length > 0) {
                console.log("categories retrieved");
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

	// Get Categories by account id
    app.get("/api/v1/money/categories/:id", function(req, res) {
        const id = req.params.id;
        console.log("categories for account id " + id + " requested");
        Category.getByAccountId(req.user, id).then(function(results) {
            if (results.length > 0) {
                console.log("categories for account id " + id + " retrieved");
                res.json(results);
            } else {
                console.log("no categories for account id " + id + " found");
                res.status(404).send();
            }
        }).catch(function(error) {
            console.log("category for account id " + id + " retrieval error: "+error);
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
		let body = _.pick(req.body, 'action', 'account_ids');
        console.log("update category requested");
        console.log(body);
		if (body.account_ids === 'null') {
            res.status(204).send();
		} else {
			body.account_ids = _.map(JSON.parse(body.account_ids),function(val) { return Number(val); });
		}
		body.id = req.params.id;
		Category.update(req.user, body).then(function() {
			console.log("updated category");
			io.emit("categoryUpdated");
			res.status(200).send();
		}).catch(function(error) {
			console.log("category update error: "+error);
			if (error === "unauthorized") {
				res.status(401).send();
			} else {
				res.status(500).send();
			}
		});
	});

	// // Delete category by ID
	// app.delete("/api/v1/money/categories/:id", function(req, res) {
	// 	console.log("delete category requested");
	// 	Category.delete(req.user, req.params.id).then(function() {
	// 		console.log("category deleted");
	// 		io.emit("categoryDeleted", req.params.id);
	// 		res.status(204).send()
	// 	}).catch(function(error) {
	// 		if (error.code === 1) {
	// 			console.log("category not found");
	// 			res.status(404).send();
	// 		} else {
	// 			console.log("category deletion error: "+error.error);
	// 			if (error.error === "unauthorized") {
	// 				res.status(401).send();
	// 			} else {
	// 				res.status(500).send();
	// 			}
	// 		}
	// 	});
	// });
};