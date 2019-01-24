module.exports = function(app, Group, _) {
    // Get Groups
    app.get("/api/v1/group", function(req, res) {
        console.log("get groups requested");
        Group.get(req.user).then(function(groups) {
            console.log("groups retrieved");
            res.json({groups: groups, verified: req.user.verified});
        }, function(error) {
            console.log("error retrieving groups: " + error);
            res.status(400).send();
        }).catch(function(/*error*/) {
            res.status(500).send();
        })
    });

    // Add Group
    app.post("/api/v1/group", function(req, res) {
        const data = _.pick(req.body, 'name', 'member');
        console.log("new group requested");
        console.log(data);
        Group.create(req.user,data).then(function(group) {
            console.log("group created");
            res.status(201).json({group: group.group, member: group.member});
        }).catch(function(error) {
            console.log("error inserting group: " + error);
            res.status(400).send();
        });
    });

    // Modify Group
    app.put("/api/v1/group", function(req, res) {
        const data = _.pick(req.body, 'id', 'name', 'member');
        console.log("group modify requested");
        console.log(data);
        Group.modify(req.user,data).then(function(group) {
            console.log("group modified");
            res.status(202).json({group: group.group, member: group.member});
        }).catch(function(error) {
            if (error === "group not found") {
                res.status(404).send();
            } else {
                console.log("error modifying group: " + error);
                res.status(400).send();
            }
        });
    });

    // Delete Group
    app.delete("/api/v1/group/:id", function(req, res) {
        const groupId = req.params.id;
        console.log("group delete requested");
        Group.destroy(req.user,groupId).then(function() {
            console.log("group deleted");
            res.status(204).send();
        }).catch(function(error) {
            console.log("error deleting group: " + error);
            res.status(400).send();
        });
    });
};