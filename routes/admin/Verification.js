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
    app.post("/api/v1/verification/email", function(req, res) {
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

    // Accept group invitation
    app.post("/api/v1/verification/group", function(req, res) {
        console.log("group invitation accept requested");
        const body = _.pick(req.body, "guid", "code");
        console.log(body);
        Verification.invitation(body).then(function() {
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

    // // Add Group
    // app.post("/api/v1/group", function(req, res) {
    //     const data = _.pick(req.body, 'name', 'members');
    //     console.log("new group requested");
    //     console.log(data);
    //     Group.create(req.user,data).then(function(group) {
    //         console.log("group created");
    //         res.status(201).json(group);
    //     }).catch(function(error) {
    //         console.log("error inserting group: " + error);
    //         res.status(400).send();
    //     });
    // });
    //
    // // Modify Group
    // app.put("/api/v1/group", function(req, res) {
    //     const data = _.pick(req.body, 'id', 'name', 'members');
    //     console.log("group modify requested");
    //     console.log(data);
    //     Group.modify(req.user,data).then(function() {
    //         console.log("group modified");
    //         res.status(202).send();
    //     }).catch(function(error) {
    //         if (error === "group not found") {
    //             res.status(404).send();
    //         } else {
    //             console.log("error modifying group: " + error);
    //             res.status(400).send();
    //         }
    //     });
    // });
    //
    // // Delete Group
    // app.delete("/api/v1/group/:id", function(req, res) {
    //     const groupId = req.params.id;
    //     console.log("group delete requested");
    //     Group.destroy(req.user,groupId).then(function() {
    //         console.log("group deleted");
    //         res.status(204).send();
    //     }).catch(function(error) {
    //         console.log("error deleting group: " + error);
    //         res.status(400).send();
    //     });
    // });
};