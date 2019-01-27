// const ExpressBrute = require("express-brute");
// const SequelizeStore = require('express-brute-sequelize');
// const Sequelize = require('sequelize');
// let sequelize = new Sequelize('express-brute','express-brute','*U6M327AzxgfVXl1', {
//     host: 'localhost'
//     ,dialect: 'mysql'
//     ,logging: false
// });
// const request = require("request");

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

    // SIGN-UP DISABLED
    // // Add User
    // app.post("/api/v1/users/new", function(req, res) {
    //     const user = _.pick(req.body, 'firstName', 'lastName', 'email', 'password', 'captchaToken');
    //     // Check captcha
    //     // console.log("token: " + user.captchaToken);
    //     const secret = '6LdQd4UUAAAAAAEDoIANNebK8ExjsGf5jUEIcOjh';
    //     request.post({
    //         url: 'https://www.google.com/recaptcha/api/siteverify'
    //         ,form: {
    //             secret: secret
    //             ,response: user.captchaToken
    //         }
    //     }, function (error, response, body) {
    //         // console.log("body: " + body);
    //         const jBody = JSON.parse(body);
    //         if (jBody.success) {
    //             // console.log('captcha success');
    //             console.log("validating new user");
    //             console.log(_.omit(user,'password'));
    //             let err = 0;
    //             if (!user.email.match(/^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/)) {
    //                 err++;
    //             }
    //             if (!user.password.match(/(?=^.{8,16}$)((?=.*\d)(?=.*[A-Z])(?=.*[a-z])|(?=.*\d)(?=.*[^A-Za-z0-9])(?=.*[a-z])|(?=.*[^A-Za-z0-9])(?=.*[A-Z])(?=.*[a-z])|(?=.*\d)(?=.*[A-Z])(?=.*[^A-Za-z0-9]))^.*/)) {
    //                 err++;
    //             }
    //
    //             if (err === 0) {
    //                 console.log("user data valid");
    //                 console.log("adding user");
    //                 User.create(user).then(function(result) {
    //                     console.log("added user");
    //                     res.status(201).json(result);
    //                 }).catch(function(error) {
    //                     if (error === "account already exists") {
    //                         console.log("account already exists");
    //                         res.status(409).send();
    //                     } else {
    //                         console.log("error adding user; " + error);
    //                         res.status(500).json(error);
    //                     }
    //                 });
    //             } else {
    //                 console.log("user data invalid");
    //                 res.status(400).send();
    //             }
    //         } else {
    //             // console.log('captcha failure');
    //             res.status(401).send();
    //         }
    //     });
    // });

    // Login
    // Add brute force prevention to login
    // new SequelizeStore(sequelize, 'bruteStore', {}, function(store) {
    //     const bruteforce = new ExpressBrute(store);
    //     app.post("/api/v1/users/login", bruteforce.prevent, function (req, res) {
        app.post("/api/v1/users/login", function (req, res) {
            console.log("login requested");
            const body = _.pick(req.body, 'email', 'password');
            User.login(body,(req.headers['X-Forwarded-For'] || req.ip)).then(function(response) {
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

    // Logout
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

    app.post("/api/v1/users/changePassword", function(req, res) {

    });

    // Change a users first and/or last name
    app.post("/api/v1/users/changeName", function(req, res) {
        console.log("user name change requested");
        const body = _.pick(req.body, 'firstName', 'lastName');
        User.changeName(req.user,body).then(function() {
            res.status(200).send();
        }).catch(function(error) {
            console.log("error changing user name: " + error);
            if (error === "unauthorized") {
                res.status(401).send();
            } else {
                res.status(500).send();
            }
        });
    });

    // Get the current users names
    app.get("/api/v1/users/me", function(req, res) {
        console.log("current user names requested");
        if (req.hasOwnProperty("user")) {
            res.status(200).json({firstName: req.user.firstName, lastName: req.user.lastName, verified: req.user.verified});
        } else {
            console.log("req does not have user parameter");
            req.status(401).send();
        }
    });

    // Change the users password
    app.put("/api/v1/users/changePassword", function(req, res) {
        console.log("user password change requested");
        const body = _.pick(req.body, 'currentPassword', 'newPassword');
        User.changePassword(req.user, body).then(function() {
            res.status(200).send();
        }).catch(function(error) {
            console.log("error changing user password: " + error);
            if (error === "unauthorized") {
                res.status(401).send();
            } else if (error === "bad_password") {
                res.status(400).send();
            } else {
                res.status(500).send();
            }
        });
    });
};