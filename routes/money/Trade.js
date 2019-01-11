module.exports = function(app, Trade, _, io) {
	// Insert trade
	app.post("/api/v1/money/trades", function(req, res) {
		console.log("trade add requested");
		const body = _.pick(req.body, 'account', 'tDate', 'ticker', 'description', 'quantity', 'price');
		// console.log(body);
		Trade.add(req.user, body).then(function(obj) {
			console.log("trade added");
			io.emit("tradeAdded", {trade: obj.newTrade.id, position: obj.position.id});
			res.status(201).send(obj.newTrade);
		}).catch(function(error) {
			console.log("add trade error: "+JSON.stringify(error));
			if (error.code === 1) {
				// Not found
				res.status(404).send();
			} else if (error.code === -1) {
				// Unauthorized
				res.status(401).send();
			} else if (error.code === 0 || error.code === 2) {
				// Bad request
				res.status(400).send();
			} else {
				// Server error
				res.status(500).send();
			}
		});
	});

    // Description (Investment) lookup for typeahead
    app.get("/api/v1/money/trades/lookup/description/:term", function(req, res) {
        Trade.descriptionLookup(req.user, req.params.term).then(function(response) {
            res.json(response);
        }).catch(function(error) {
			console.log("error in description (investment) typeahead for term: " + req.params.term + ". error: " + error);
			res.status(500).send();
		});
    });
};