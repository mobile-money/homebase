module.exports = function(app, Verification, _) {
    // Resend verification
    app.get("/api/v1/verification/resend", function(req, res) {
        console.log("resend verification requested by user: " + req.user.id);
        Verification.resend(req.user).then(function() {
            console.log("verification resent");
            res.status(200).send();
        }).catch(function(error) {
            console.log("error resending verification: " + error);
            res.status(500).send();
        });
    });

    // Verify email
    app.post("/api/v1/verify/email", function(req, res) {
        console.log("email verification requested");
        const body = _.pick(req.body, "phase", "guid", "password");
        Verification.verify(body).then(function() {
            res.status(200).send();
        }).catch(function(error) {
            console.log("error verifying email: " + error);
            if (error === "unauthorized") {
                res.status(401).send();
            } else if (error === "not_found") {
                res.status(404).send();
            } else {
                res.status(500).send();
            }
        });
    });

    // Accept group invitation, external (email)
    app.post("/api/v1/verify/group", function(req, res) {
        console.log("group invitation accept requested");
        const body = _.pick(req.body, "guid", "code");
        console.log(body);
        Verification.groupInvite(body).then(function() {
            res.status(200).send();
        }).catch(function(error) {
            console.log("error accepting invite: " + error);
            if (error === "unauthorized") {
                res.status(401).send();
            } else if (error === "not_found") {
                res.status(404).send();
            } else {
                res.status(500).send();
            }
        });
    });

    // Accept group invitation, internal (my_account)
    app.post("/api/v1/verification/group", function(req, res) {
        console.log("internal group invitation accept requested");
        const body = _.pick(req.body, "id", "code");
        console.log(body);
        Verification.groupInviteInternal(req.user, body).then(function() {
            res.status(200).send();
        }).catch(function(error) {
            console.log("error accepting invite: " + error);
            if (error === "incorrect_code") {
                res.status(401).send();
            } else if (error === "not_found") {
                res.status(404).send();
            } else {
                res.status(500).send();
            }
        });
    });

    // Accept site invitation
    app.post("/api/v1/verify/site", function(req, res) {
        console.log("site invitation accept requested");
        const body = _.pick(req.body, "guid", "code", "firstName", "lastName", "password");
        console.log(_.omit(body,"password"));
        Verification.siteInvite(body).then(function() {
            res.status(200).send();
        }).catch(function(error) {
            console.log("error accepting invite: " + error);
            if (error === "unauthorized") {
                res.status(401).send();
            } else if (error === "not_found") {
                res.status(404).send();
            } else {
                res.status(500).send();
            }
        });
    });

    // Get invitations
    app.get("/api/v1/invitations", function(req, res) {
        if (req.hasOwnProperty("user")) {
            console.log("invitations requested for user: " + req.user.id);
            Verification.getForUser(req.user).then(function(results) {
                res.json(results);
            }).catch(function(error) {
                console.log("error retrieving invitations: " + error);
                res.status(500).send();
            });
        } else {
            res.status(401).send();
        }
    });

    // Deactivate invitation
    app.delete("/api/v1/invitations", function(req, res) {
        const body = _.pick(req.body, "id");
        console.log("deactivate invitation requested, id: " + body.id);
        Verification.deactivate(req.user, body).then(function() {
            res.status(200).send();
        }).catch(function(error) {
            console.log("error deactivating invitation: " + error);
            if (error === 404) {
                res.status(404).send();
            } else {
                res.status(500).send();
            }
        });
    });
};