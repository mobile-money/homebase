module.exports = function(app, Position, _, io) {
	// Update Price
	app.get("/api/v1/money/positions/update/:tick", function(req, res) {
		console.log("position price update requested");
		if (req.params.tick.toUpperCase() !== "CASH") {
			Position.updatePrice(req.params.tick)
			.then(
				function(response) {
					if (response.code === 0) {
						console.log("positions updated");
						io.emit("priceUpdated", {tick: req.params.tick, price: response.price});
						res.status(202).send();
					} else if (response.code === 1) {
						res.status(204).send();
					}
				}
			)
			.catch(
				function(error) {
					console.log("position update error: "+JSON.stringify(error));
					switch (error.code) {
						case 1:
						case 2:
							res.status(404).send();
							break;
						case 3:
							res.status(400).send();
							break;
						case 4:
						case 5:
							res.status(500).send();
							break;
						default:
							res.status(500).send();
					}
				}
			);
		} else {
			// don't update cash
			res.status(204).send();
		}
	});

	// Force Update Price
	app.post("/api/v1/money/positions/update", function(req, res) {
		console.log("position price force update requested");
        var body = _.pick(req.body, 'tick', 'price');
        if (body.tick.toUpperCase() !== "CASH") {
			Position.forceUpdatePrice(body)
			.then(
				function(response) {
					if (response.code === 0) {
						console.log("positions force updated");
						io.emit("priceUpdated", {tick: body.tick, price: body.price});
						res.status(202).send();
					} else if (response.code === 1) {
						res.status(204).send();
					}
				}
			)
			.catch(
				function(error) {
					console.log("position force update error: "+JSON.stringify(error));
					switch (error.code) {
						case 1:
						case 2:
							res.status(404).send();
							break;
						case 3:
							res.status(400).send();
							break;
						case 4:
						case 5:
							res.status(500).send();
							break;
						default:
							res.status(500).send();
					}
				}
			);
		} else {
			// don't update cash
			res.status(204).send();
		}
	});

    // Ticker lookup for typeahead
    app.get("/api/v1/money/positions/lookup/ticker/:term", function(req, res) {
        Position.tickerLookup(req.params.term).then(function(response) {
            res.json(response);
        })
    });
};