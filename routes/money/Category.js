module.exports = function(app, Category, _, io) {
	// Get all categories
	app.get("/api/v1/money/categories", function(req, res) {
		console.log("categories requested");
		Category.getAll().then(function(results) {
			if (results.length > 0) {
				console.log("categories retieved");
                // res.setHeader('Cache-Control','public, max-age=604800');
                res.json(results);
			} else {
				console.log("no categories found");
				res.status(404).send();
			}
		}).catch(
		function(error) {
			console.log("category retrieval error: "+error);
			res.status(500).send();
		});
	});

	// Create category
	app.post("/api/v1/money/categories", function(req, res) {
		console.log("category add requested");
		let body = _.pick(req.body, 'user', 'name', 'expense');
		Category.add(body).then(function(category) {
			console.log("category added");
			io.emit("categoryAdded", category);
			io.emit("refreshCategories");
			res.status(204).send();
		},function(error) {
			console.log("category add error: "+error);
			res.status(500).send();
		});
	});

	// Update category by ID
	app.put("/api/v1/money/categories/:id", function(req, res) {
		console.log("update category requested");
		let body = _.pick(req.body, 'user', 'name', 'expense');
		body.id = req.params.id;
		Category.update(body).then(function(category) {
			console.log("updated category");
			io.emit("categoryUpdated", category);
            io.emit("refreshCategories");
			res.json(category);
		},function(error) {
			console.log("category update error: "+error);
			res.status(500).send();
		});
	});

	// Delete category by ID
	app.delete("/api/v1/money/categories/:id", function(req, res) {
		console.log("delete category requested");
		Category.delete(req.params.id).then(function() {
			console.log("category deleted");
			io.emit("categoryDeleted", req.params.id);
            io.emit("refreshCategories");
			res.status(204).send()
		}).catch(function(error) {
			if (error.code === 1) {
				console.log("category not found");
				res.status(404).send();
			} else {
				console.log("category deletion error: "+error.error);
				res.status(500).send();
			}
		});
	});

    // Data Xfer from MySQL to DynamoDB
    app.get("/api/v1/money/dataXfer/categories/:start/:max",function(req,res) {
        Category.dataXfer(Number(req.params.start),Number(req.params.max)).then(function(result) {
            res.status(200).json(result);
        }).catch(function(err) {
            res.status(500).json(err);
        })
    });
};