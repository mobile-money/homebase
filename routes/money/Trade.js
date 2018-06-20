// TODO: Need to update
module.exports = function(app, Trade, _, io) {
	// Insert trade
	app.post("/api/v1/money/trades", function(req, res) {
		console.log("trade add requested");
		let body = _.pick(req.body, 'account', 'tDate', 'ticker', 'description', 'quantity', 'price');
		// console.log(body);
		Trade.add(body).then(function(obj) {
			console.log("trade added");
			io.emit("tradeAdded", {trade: obj.newTrade.id, position: obj.position.id});
			res.status(201).send(obj.newTrade);
		}).catch(function(error) {
			console.log("add trade error: "+JSON.stringify(error));
			if (error.code === 1) {
				res.status(404).send();
			} else if (error.code === 2) {
				res.status(400).send();
			} else if (error.code === 0) {
				res.status(400).send();
			} else {
				res.status(500).send();
			}
		});
	});

    // Description (Investment) lookup for typeahead
    app.get("/api/v1/money/trades/lookup/description/:term", function(req, res) {
        Trade.descriptionLookup(req.params.term).then(function(response) {
            res.json(response);
        })
    });

    // Data Xfer from MySQL to DynamoDB
    app.get("/api/v1/money/trades/dataXfer/:start/:max",function(req,res) {
        Trade.dataXfer(Number(req.params.start),Number(req.params.max)).then(function(result) {
            res.status(200).json(result);
        }).catch(function(err) {
            res.status(500).json(err);
        })
    });
};