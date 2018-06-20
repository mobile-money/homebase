module.exports = function(app, CategorySplit) {
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

    // Data Xfer from MySQL to DynamoDB
    app.get("/api/v1/money/dataXfer/categorySplit/:start/:max",function(req,res) {
        CategorySplit.dataXfer(Number(req.params.start),Number(req.params.max)).then(function(result) {
            res.status(200).json(result);
        }).catch(function(err) {
            res.status(500).json(err);
        })
    });
};