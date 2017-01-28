module.exports = function(app, Bill, _, io) {
	// Get all bills
	app.get("/api/v1/money/bills", function(req, res) {
		console.log("bills requested");
		Bill.getAll()
		.then(
			function(results) {
				if (results.length > 0) {
					console.log("bills retrieved");
					res.json(results);
				} else {
					console.log("no bills found");
					res.status(204).send();
				}
			}
		)
		.catch(
			function(error) {
				console.log("bills retrieval error: "+error);
				res.status(500).send();
			}
		);
	});

	// Insert new bill
	app.post("/api/v1/money/bills", function(req, res) {
		console.log("create bill requested");
		var body = _.pick(req.body, 'payee', 'description', 'category', 'account', 'startDate', 'amount', 'frequency', 'every', 'onThe', 'automatic');
		Bill.create(body)
		.then(
			function(bill) {
				console.log("bill created");
				io.emit("billAdded", bill.id);
				res.status(201).send();
			}
		)
		.catch(
			function(error) {
				console.log("bill creation error: "+error);
				res.status(500).send();
			}
		);
	});

	// Modify bill by ID
	app.put("/api/v1/money/bills", function(req, res) {
		console.log("modify bill requested");
		var body = _.pick(req.body, 'id', 'payee', 'description', 'category', 'account', 'startDate', 'amount', 'frequency', 'every', 'onThe', 'automatic');
		Bill.update(body)
		.then(
			function(result) {
				console.log("bill modified");
				io.emit("billModified", result.id);
				res.status(200).send();
			}
			,function() {
				console.log("bill not found");
				res.status(404).send();
			}
		)
		.catch(
			function(error) {
				console.log("bill modification error: "+error);
				res.status(500).send();
			}
		);
	})

	app.delete("/api/v1/money/bills", function(req, res) {
		console.log("delete bill requested");
		var body = _.pick(req.body, 'id');
		Bill.delete(body.id)
		.then(
			function() {
				console.log("bill deleted");
				io.emit("billDeleted", body.id);
				res.status(204).send();
			}
			,function() {
				console.log("bill not found");
				res.status(404).send();
			}
		)
		.catch(
			function(error) {
				console.log("bill deletion error: "+error);
				res.status(500).send();
			}
		);
	});

	// Post new bills by Account ID
	app.get("/api/v1/money/post/bills/:id", function(req, res) {
		Bill.postNew(req.params.id).then(function(response) {
			res.json(response);
		}).catch(function(error) {
			res.status(500).json(error);
		});
	});
}