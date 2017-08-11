module.exports = function(app, CategorySplit, _, io) {
    // Get category split by transaction ID
    app.get("/api/v1/money/categorySplit/:id", function(req, res) {
        console.log("category split requested");
        CategorySplit.getByTransactionId(req.params.id).then(function(result) {
            if (result) {
                console.log("category split retrieved");
                res.json(result.payload);
            } else {
                console.log("no category split found");
                res.status(204).send();
            }
        }).catch(function(error) {
            console.log("category split retrieval error: "+error);
            res.status(500).send();
        });
    });
};