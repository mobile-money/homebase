module.exports = function(app, CategorySplit) {
    // Get category split by transaction ID
    app.get("/api/v1/money/categorySplit/:id", function(req, res) {
        console.log("category split requested");
        CategorySplit.getByTransactionId(req.user, req.params.id).then(function(result) {
            if (result) {
                console.log("category split retrieved");
                res.json(result.payload);
            } else {
                console.log("no category split found");
                res.status(204).send();
            }
        }).catch(function(error) {
            console.log("category split retrieval error: "+error);
            if (error === "unauthorized") {
                res.status(401).send();
            } else if (error === "not found") {
                res.status(404).send();
            } else {
                res.status(500).send();
            }
        });
    });
};