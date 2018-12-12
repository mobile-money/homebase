module.exports = function(app, Transaction, _, io) {
	// Get all transactions by Account ID
	app.get("/api/v1/money/transactions/account/:id/:offset/:limit", function(req, res) {
		console.log("transactions requested");
		Transaction.getByAccountId(req.params.id,req.params.offset,req.params.limit).then(function(results) {
			if (results.cTrans.length > 0) {
				console.log("transactions retrieved");
				res.json(results);
			} else {
				console.log("no transactions found");
				res.status(404).send();
			}
		}).catch(function(error) {
			console.log("transactions retrieval error: "+error);
			res.status(500).send();
		});
	});

	// Get more transactions by Account ID
	app.get("/api/v1/money/transactions/more/account/:id/:offset/:limit", function(req, res) {
		console.log("more transactions requested");
		Transaction.getMoreByAccountId(req.params.id,req.params.offset,req.params.limit).then(function(results) {
			if (results.cTrans.length > 0) {
				console.log("more transactions retrieved");
				res.json(results);
			} else {
				console.log("no more transactions found");
				res.status(404).send();
			}
		}).catch(function(error) {
			console.log("more transactions retrieval error: "+error);
			res.status(500).send();
		});
	});

	// Get all transactions by Summary ID
	app.get("/api/v1/money/transactions/:id", function(req, res) {
		console.log("transactions requested");
		Transaction.getBySummaryId(Number(req.params.id)).then(function(results) {
			if (results.length > 0) {
				console.log("transactions retrieved");
				res.json(results);
			} else {
				console.log("no transactions found");
				res.status(404).send();
			}
		}).catch(function(error) {
			console.log("transactions retrieval error: "+error);
			res.status(500).send();
		});
	});

	// Get all transactions by Category ID
	app.get("/api/v1/money/transactions/category/:id/:start/:end", function(req, res) {
		console.log("transactions by category requested");
		Transaction.getByCategoryId(Number(req.params.id),Number(req.params.start),Number(req.params.end)).then(function(results) {
			if (results.length > 0) {
				console.log("transactions by category retrieved");
				res.json(results);
			} else {
				console.log("no transactions by category found");
				res.status(404).send();
			}
		}).catch(
		function(error) {
			console.log("transactions by category retrieval error: "+error);
			res.status(500).send();
		});
	});

	// Insert transaction
	app.post("/api/v1/money/transactions", function(req, res) {
		console.log("transaction add requested");
		const body = _.pick(req.body, 'account', 'tDate', 'payee', 'description', 'check', 'amount', 'category', 'xfer');
		// console.log(body);
		Transaction.add(body).then(function(obj) {
			console.log("transaction added");
			io.emit("transactionAdded", obj.newTransaction.id);
			if (obj.newSummary !== null) {
				io.emit("summaryAdded", obj.newSummary)
			}
			res.status(201).send(obj.newTransaction);
		}).catch(function(error) {
			console.log("add transaction error: "+JSON.stringify(error));
			if (error.code === 1) {
				// account not found
				res.status(404).send();
			} else if (error.code === 2) {
				// new summary create error
				res.status(400).send();
			} else if (error.code === 3) {
				// summary balance update error
				res.status(400).send();
			} else if (error.code === 4) {
				// create transaction error
				res.status(400).send();
			} else {
				res.status(500).send();
			}
		});
	});

	// Update transaction by ID
	app.put("/api/v1/money/transactions/:id", function(req, res) {
		console.log("modify transaction requested");
		const body = _.pick(req.body, 'payee', 'description', 'check', 'category', 'multiCat');
		body.id = req.params.id;
		Transaction.update(body).then(function(result) {
			console.log("transaction modified");
			io.emit("transactionChanged", result.id);
			res.status(200).send();
		},function() {
			console.log("transaction not found");
			res.status(404).send();
		}).catch(function(error) {
			console.log("transaction modification error: "+error);
			res.status(500).send();
		});
	});

	// Delete transaction by ID
	app.delete("/api/v1/money/transactions/:id", function(req, res) {
		res.status(405).send();
		// console.log("delete transaction requested");
		// Transaction.delete(req.params.id)
		// .then(
		// 	function() {
		// 		console.log("transaction deleted");
		// 		io.emit("transactionDeleted", req.params.id);
		// 		res.status(204).send();
		// 	}
		// 	,function() {
		// 		console.log("transaction not found");
		// 		res.status(404).send();
		// 	}
		// )
		// .catch(
		// 	function(error) {
		// 		console.log("transaction deletion error: "+error);
		// 		res.status(500).send();
		// 	}
		// );
	});

	// Payee lookup for typeahead
	app.get("/api/v1/money/transactions/lookup/payee/:term", function(req, res) {
		Transaction.payeeLookup(req.params.term).then(function(response) {
			res.json(response);
		})
	});

	// Description lookup for typeahead
	app.get("/api/v1/money/transactions/lookup/description/:term", function(req, res) {
		Transaction.descriptionLookup(req.params.term).then(function(response) {
			res.json(response);
		})
	});

	// Set transaction as cleared
	app.put("/api/v1/money/clear/transactions", function(req, res) {
		console.log("transaction clear requested");
		const body = _.pick(req.body, 'id');
		Transaction.clear(body.id).then(function(result) {
			console.log("transaction cleared");
			io.emit("transactionCleared", result.id);
			res.status(200).send();
		}).catch(function(error) {
			console.log("transaction clear error: "+error);
			res.status(500).send();
		});
	});

	// Set transaction as posted
	app.put("/api/v1/money/post/transactions", function(req, res) {
		console.log("transaction post requested");
		const body = _.pick(req.body, 'id', 'date');
		Transaction.post(body).then(function(result) {
			console.log("transaction posted");
			io.emit("transactionChanged", result.id);
			res.status(200).send();
		}).catch(function(error) {
			console.log("transaction post error: "+error);
			res.status(500).send();
		});
	});

	// Search transactions
	app.post("/api/v1/money/transactions/search", function(req,res) {
		console.log("search transactions requested");
		const body = _.pick(req.body, 'text', 'accountId');
		Transaction.search(body).then(function(results) {
			console.log("search transactions retrieved");
			res.json(results);
		}).catch(function(error) {
			console.log("search transactions error: "+error);
			res.status(500).send();
		});
	});
};