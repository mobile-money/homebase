module.exports = function(app, Car, _) {
    // Insert car
    app.post("/api/v1/automobile/car", function(req, res) {
        var keys = ["active","current_mileage","license_plate","make","model","purchase_date","purchase_mileage","vin","year","sold_date"];
        var car = _.pick(req.body,keys);
        console.log("inserting car");
        console.log(car);
        Car.insert(car).then(function(result) {
            console.log("inserted car");
            res.status(201).json(result);
        }).catch(function(error) {
            console.log("error inserting car; " + error);
            res.status(500).json(error);
        });
    });

    // Get cars
    app.get("/api/v1/automobile/car", function(req, res) {
        console.log("cars requested");
        console.log("params: " + JSON.stringify(req.query));
        Car.get(req.query).then(function(results) {
            console.log("retrieved cars");
            res.json(results);
        }).catch(function(error) {
            console.log("error retrieving cars; " + error);
            res.status(500).json(error);
        });
    });

    // Update car
    app.put("/api/v1/automobile/car/:id", function(req, res) {
        var carId = req.params.id;
        if (carId === "reactivate") {
            var body = _.pick(req.body, 'id');
            console.log("reactivate car "+body.id+" requested");
            Car.reactivate(body.id).then(function() {
                res.status(200).send();
            }).catch(function(error) {
                console.log("reactivate car error: "+error);
                res.status(500).send();
            });
        } else {
            var keys = ["active","current_mileage","license_plate","make","model","purchase_date","purchase_mileage","vin","year","sold_date"];
            var car = _.pick(req.body,keys);
            // var car = _.pick(req.body, 'make', 'model', 'year', 'vin', 'license_plate', 'purchase_date', 'purchase_mileage', 'current_mileage');
            console.log("car " + carId + " update requested");
            console.log(car);
            Car.update(carId, car).then(function (results) {
                console.log("car " + carId + "updated");
                res.json(results);
            }).catch(function (error) {
                console.log("car update error: " + error);
                res.status(500).json(error);
            });
        }
    });

    // Delete car
    app.delete("/api/v1/automobile/car/:id", function(req, res) {
        var carId = req.params.id;
        console.log("car " + carId + " delete requested");
        Car.delete(carId).then(function(results) {
            console.log("car " + carId + "deleted");
            res.json(results);
        }).catch(function(error) {
            console.log("car delete error: " + error);
            res.status(500).json(error);
        });
    });

    app.get("/api/v1/automobile/car/inactive", function(req, res) {
        console.log("inactive cars requested");
        Car.getInactive().then(function(results) {
            if (results.length > 0) {
                console.log("inactive cars retrieved");
                res.json(results);
            } else {
                console.log("no inactive cars found");
                res.json([]);
            }
        }).catch(function(error) {
            console.log("inactive cars retrieval error: "+error);
            res.status(500).send();
        });
    });

    app.put("/api/v1/automobile/car/reactivate", function(req, res) {
        var body = _.pick(req.body, 'id');
        console.log("reactivate car "+body.id+" requested");
        Car.reactivate(body.id).then(function() {
            res.status(200).send();
        }).catch(function(error) {
            console.log("reactivate car error: "+error);
            res.status(500).send();
        });
    });

    // // Data Xfer from MySQL to DynamoDB
    // app.get("/api/v1/automobile/car/dataXfer",function(req,res) {
    //     Car.dataXfer().then(function(result) {
    //         res.status(200).json(result);
    //     }).catch(function(err) {
    //         res.status(500).json(err);
    //     })
    // });
};