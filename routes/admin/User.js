const ExpressBrute = require("express-brute");
const SequelizeStore = require('express-brute-sequelize');
const Sequelize = require('sequelize');
let sequelize = new Sequelize('express-brute','express-brute','*U6M327AzxgfVXl1', {
    host: 'localhost'
    ,dialect: 'mysql'
    ,logging: false
});
const request = require("request");

module.exports = function(app, User, _) {
    // Get Other Users
    app.get('/api/v1/users', function(req, res) {
        User.getOther(req.user).then(function(results) {
            res.json(results);
        }).catch(function(error) {
            console.log("error getting other users: " + error);
            res.status(500).send();
        });
    });
    // Add User
    app.post("/api/v1/users/new", function(req, res) {
        const user = _.pick(req.body, 'firstName', 'lastName', 'email', 'password', 'captchaToken');
        // Check captcha
        // console.log("token: " + user.captchaToken);
        const secret = '6LdQd4UUAAAAAAEDoIANNebK8ExjsGf5jUEIcOjh';
        request.post({
            url: 'https://www.google.com/recaptcha/api/siteverify'
            ,form: {
                secret: secret
                ,response: user.captchaToken
            }
        }, function (error, response, body) {
            // console.log("body: " + body);
            const jBody = JSON.parse(body);
            if (jBody.success) {
                // console.log('captcha success');
                console.log("validating new user");
                console.log(_.omit(user,'password'));
                let err = 0;
                if (!user.email.match(/^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/)) {
                    err++;
                }
                if (!user.password.match(/(?=^.{8,16}$)((?=.*\d)(?=.*[A-Z])(?=.*[a-z])|(?=.*\d)(?=.*[^A-Za-z0-9])(?=.*[a-z])|(?=.*[^A-Za-z0-9])(?=.*[A-Z])(?=.*[a-z])|(?=.*\d)(?=.*[A-Z])(?=.*[^A-Za-z0-9]))^.*/)) {
                    err++;
                }

                if (err === 0) {
                    console.log("user data valid");
                    console.log("adding user");
                    User.create(user).then(function(result) {
                        console.log("added user");
                        res.status(201).json(result);
                    }).catch(function(error) {
                        if (error === "account already exists") {
                            console.log("account already exists");
                            res.status(409).send();
                        } else {
                            console.log("error adding user; " + error);
                            res.status(500).json(error);
                        }
                    });
                } else {
                    console.log("user data invalid");
                    res.status(400).send();
                }
            } else {
                // console.log('captcha failure');
                res.status(401).send();
            }
        });
    });

    // Add brute force prevention to login
    // new SequelizeStore(sequelize, 'bruteStore', {}, function(store) {
    //     const bruteforce = new ExpressBrute(store);
    //     app.post("/api/v1/users/login", bruteforce.prevent, function (req, res) {
        app.post("/api/v1/users/login", function (req, res) {
            console.log("login requested");
            const body = _.pick(req.body, 'email', 'password');
            User.login(body).then(function(response) {
                res.header("Auth", response.tokenInstance.get("token")).json(response.userInstance.toPublicJSON());
            }, function(error) {
                if (error.code === 1) {
                    // failed login
                    console.log("login failure");
                    res.status(401).send();
                } else {
                    res.status(500).send();
                }
            }).catch(function() {
                res.status(500).send();
            });
        }, function(error) {

        });
    // });

    app.delete("/api/v1/users/logout", function(req, res) {
        console.log("user logout requested");
        const body = _.pick(req.body, 'token');
        User.logout(body.token).then(function() {
            console.log("user logged out");
            res.status(200).send();
        },function(error) {
            console.log("user logout error: "+error);
        });
    });
    //
    // // Get cars
    // app.get("/api/v1/automobile/car", function(req, res) {
    //     console.log("cars requested");
    //     console.log("params: " + JSON.stringify(req.query));
    //     Car.get(req.query).then(function(results) {
    //         console.log("retrieved cars");
    //         res.json(results);
    //     }).catch(function(error) {
    //         console.log("error retrieving cars; " + error);
    //         res.status(500).json(error);
    //     });
    // });
    //
    // // Update car
    // app.put("/api/v1/automobile/car/:id", function(req, res) {
    //     var carId = req.params.id;
    //     if (carId === "reactivate") {
    //         var body = _.pick(req.body, 'id');
    //         console.log("reactivate car "+body.id+" requested");
    //         Car.reactivate(body.id).then(function() {
    //             res.status(200).send();
    //         }).catch(function(error) {
    //             console.log("reactivate car error: "+error);
    //             res.status(500).send();
    //         });
    //     } else {
    //         var car = _.pick(req.body, 'make', 'model', 'year', 'vin', 'license_plate', 'purchase_date', 'purchase_mileage', 'current_mileage');
    //         console.log("car " + carId + " update requested");
    //         console.log(car);
    //         Car.update(carId, car).then(function (results) {
    //             console.log("car " + carId + "updated");
    //             res.json(results);
    //         }).catch(function (error) {
    //             console.log("car update error: " + error);
    //             res.status(500).json(error);
    //         });
    //     }
    // });
    //
    // // Delete car
    // app.delete("/api/v1/automobile/car/:id", function(req, res) {
    //     var carId = req.params.id;
    //     console.log("car " + carId + " delete requested");
    //     Car.delete(carId).then(function(results) {
    //         console.log("car " + carId + "deleted");
    //         res.json(results);
    //     }).catch(function(error) {
    //         console.log("car delete error: " + error);
    //         res.status(500).json(error);
    //     });
    // });
    //
    // app.get("/api/v1/automobile/car/inactive", function(req, res) {
    //     console.log("inactive cars requested");
    //     Car.getInactive().then(function(results) {
    //         if (results.length > 0) {
    //             console.log("inactive cars retrieved");
    //             res.json(results);
    //         } else {
    //             console.log("no inactive cars found");
    //             res.json([]);
    //         }
    //     }).catch(function(error) {
    //         console.log("inactive cars retrieval error: "+error);
    //         res.status(500).send();
    //     });
    // });
    //
    // app.put("/api/v1/automobile/car/reactivate", function(req, res) {
    //     var body = _.pick(req.body, 'id');
    //     console.log("reactivate car "+body.id+" requested");
    //     Car.reactivate(body.id).then(function() {
    //         res.status(200).send();
    //     }).catch(function(error) {
    //         console.log("reactivate car error: "+error);
    //         res.status(500).send();
    //     });
    // });
};