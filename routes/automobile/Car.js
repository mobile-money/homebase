module.exports = function(app, Car, _) {
    // Insert car
    app.post("/api/v1/automobile/car", function(req, res) {
        const car = _.pick(req.body, 'make', 'model', 'year', 'vin', 'license_plate', 'purchase_date', 'purchase_mileage', 'current_mileage', 'group_ids');
        if (car.group_ids === 'null') {
            car.group_ids = [];
        } else {
            car.group_ids = JSON.parse(car.group_ids);
        }
        console.log("inserting car");
        console.log(car);
        Car.insert(req.user, car).then(function(result) {
            console.log("inserted car");
            res.status(201).json(result);
        }).catch(function(error) {
            console.log("error inserting car; " + error);
            if (error === "unauthorized") {
                res.status(401).send();
            } else {
                res.status(500).json(error);
            }
        });
    });

    // Get cars
    app.get("/api/v1/automobile/car", function(req, res) {
        console.log("cars requested");
        console.log("params: " + JSON.stringify(req.query));
        Car.get(req.user, req.query).then(function(results) {
            console.log("retrieved cars");
            res.json(results);
        }).catch(function(error) {
            console.log("error retrieving cars; " + error);
            if (error === "unauthorized") {
                res.status(401).send();
            } else {
                res.status(500).json(error);
            }
        });
    });

    // Update car
    app.put("/api/v1/automobile/car/:id", function(req, res) {
        const carId = req.params.id;
        if (carId === "reactivate") {
            const body = _.pick(req.body, 'id');
            console.log("reactivate car "+body.id+" requested");
            Car.reactivate(req.user, body.id).then(function() {
                res.status(200).send();
            }).catch(function(error) {
                console.log("reactivate car error: "+error);
                if (error === "unauthorized") {
                    res.status(401).send();
                } else {
                    res.status(500).send();
                }
            });
        } else {
            const car = _.pick(req.body, 'make', 'model', 'year', 'vin', 'license_plate', 'purchase_date', 'purchase_mileage', 'current_mileage', 'group_ids');
            if (car.group_ids === 'null') {
                car.group_ids = [];
            } else {
                car.group_ids = JSON.parse(car.group_ids);
            }
            console.log("car " + carId + " update requested");
            console.log(car);
            Car.update(req.user, carId, car).then(function (results) {
                console.log("car " + carId + "updated");
                res.json(results);
            }).catch(function (error) {
                console.log("car update error: " + error);
                if (error === "unauthorized") {
                    res.status(401).send();
                } else {
                    res.status(500).json(error);
                }
            });
        }
    });

    // Delete car
    app.delete("/api/v1/automobile/car/:id", function(req, res) {
        const carId = req.params.id;
        console.log("car " + carId + " delete requested");
        Car.delete(req.user, carId).then(function(results) {
            console.log("car " + carId + "deleted");
            res.json(results);
        }).catch(function(error) {
            console.log("car delete error: " + error);
            if (error === "unauthorized") {
                res.status(401).send();
            } else {
                res.status(500).json(error);
            }
        });
    });

    // Get inactive cars
    app.get("/api/v1/automobile/car/inactive", function(req, res) {
        console.log("inactive cars requested");
        Car.getInactive(req.user).then(function(results) {
            if (results.length > 0) {
                console.log("inactive cars retrieved");
                res.json(results);
            } else {
                console.log("no inactive cars found");
                res.json([]);
            }
        }).catch(function(error) {
            console.log("inactive cars retrieval error: "+error);
            if (error === "unauthorized") {
                res.status(401).send();
            } else {
                res.status(500).send();
            }
        });
    });

    // Reactivate car
    app.put("/api/v1/automobile/car/reactivate", function(req, res) {
        const body = _.pick(req.body, 'id');
        console.log("reactivate car "+body.id+" requested");
        Car.reactivate(body.id).then(function() {
            res.status(200).send();
        }).catch(function(error) {
            console.log("reactivate car error: "+error);
            if (error === "unauthorized") {
                res.status(401).send();
            } else {
                res.status(500).send();
            }
        });
    });

    // Get Accessible Cars by Group ID
    app.get('/api/v1/automobile/car/groups/:id', function (req, res) {
        const groupId = req.params.id;
        console.log("getting accessible cars for group: " + groupId);
        Car.getByGroup(req.user, groupId).then(function(cars) {
            res.status(200).json({group: Number(groupId), cars: cars});
        }).catch(function(error) {
            console.log("get cars by group error: "+error);
            if (error === "unauthorized") {
                res.status(401).send();
            } else {
                res.status(500).send();
            }
        });
    });
};