let user_verified = false;
let others;

$(document).ready(function() {
	$("body").show();

	getOthers().then(function() {
		getGroups();
	});
});

// FIELD EVENTS

	$("#addGroupButton").click(function() {
		addGroup();
	});

	$("#editGroupButton").click(function() {
		modifyGroup();
	});

	$("#deleteGroupButton").click(function() {
		removeGroup();
	});

	$("#addGroupModal").on("shown.bs.modal", function() {
		$("#newName").focus();
		if (!user_verified) {
			$("#addMembersDiv").hide();
			$("#newMembersError").show();
		} else {
			$("#addMembersDiv").show();
			$("#newMembersError").hide();
		}
	}).on("hidden.bs.modal", function() {
        clearAddFields();
    });

	$("#infoModal").on("hidden.bs.modal", function() {
		$("#infoModalBody").empty();
	});

	$("#editGroupModal").on("shown.bs.modal", function() {
		$("#editName").focus();
		if (!user_verified) {
			$("#editMembersDiv").hide();
			$("#editMembersError").show();
		} else {
			$("#editMembersDiv").show();
			$("#editMembersError").hide();
		}

	}).on("hidden.bs.modal", function() {
        clearEditFields();
    });

	$("#deleteGroupModal").on("hidden.bs.modal", function() {
		$("#deleteGroupId").val("");
        $("#deleteModalBody").html("");
	});

// FUNCTIONS
function addGroup() {
	let errorCount = 0;
	const newName = $("#newName");
	const newMember = $("#newMember");
	if (typeof newName.val() !== "undefined" && newName.val().length > 0) {
		newName.css("background-color", "#fff");
	} else {
		errorCount++;
		newName.css("background-color", "#f2dede");
	}
	if (newMember.val() !== "") {
		if (!newMember.val().match(/^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/)) {
			errorCount++;
			newMember.css("background-color", "#f2dede");
		} else {
			newMember.css("background-color", "#fff");
		}
	}

	if (errorCount === 0) {
		$("#addGroupModal").modal("hide");
		let group = {
			name: newName.val(),
			member: newMember.val()
		};
		saveGroup(group);
	}
}

function clearAddFields() {
	$("#newName").val("");
	$("#newMember").val("");
	// $("#newMembers option:selected").prop("selected", false);
}

function clearEditFields() {
	$("#editName").val("");
	$("#editMember").val("");
	// $("#editMembers option:selected").prop("selected", false);
	$("#deleteGrpButton").prop("onclick", null).off("click");
}

function deleteGroup(id) {
	$("#editGroupModal").modal("hide");
	const name = $("#"+id+" td[name=name]").html();
	$("#deleteGroupId").val(id);
	$("#deleteModalBody").html("<strong>Are you sure you want to delete the group "+name+"?</strong><br/><br />" +
		"This will remove all listed access for the members.");
	$("#deleteGroupModal").modal("show");
}

function editGroup(id) {
	$("#editGroupId").val(id);
	$("#editName").val($("#"+id+" td[name=name]").html());
	// const aua = $("#"+id+" td[name=members] input[name=member_ids]").val();
	// if (typeof(aua) !== "undefined") {
	// 	$("#editMembers").val(aua.split(","));
	// }
	$("#deleteGrpButton").click(function() {
		deleteGroup(id);
	});
	$("#editGroupModal").modal("show");
}

function getGroups() {
	$.ajax({
		type: "GET"
		,url: "/api/v1/group"
	}).success(function(response) {
		// console.log(response);
		user_verified = response.verified;
		$("#groupTable").find("tbody").empty();
		response.groups.forEach(function(group) {
			const owner = _.findWhere(others, {uid: group.ownerId});
			let row = '<tr id="'+group.id+'">' +
				'<td name="name">'+group.name+'</td>' +
				'<td name="owner" class="small-text">';
			if (owner) {
				row += owner.firstName + " " + owner.lastName;
			}
			row += '</td>'+
				'<td name="members" class="small-text">';
			if (group.memberIds) {
				const members = JSON.parse(group.memberIds);
				let arr = [];
				members.forEach(function(mid) {
					const mem = _.findWhere(others, {uid: mid});
					if (typeof(mem) !== "undefined") {
						arr.push(mem.firstName + " " + mem.lastName);
					}
				});
				row += arr.join('<br />')+'<input type="hidden" name="member_ids" value="'+members.join(',')+'" />';
			}
			row += '</td>' +
				'<td name="accounts" class="small-text"></td>' +
				'<td name="cars" class="small-text"></td>' +
				'<td name="people" class="small-text"></td>' +
				'<td>';
			if (group.owner) {
				row += '<button class="btn btn-sm btn-primary" title="Edit Group" onclick="editGroup(\''+group.id+'\');"><i class="fas fa-pencil-alt"></i></button>';
			}
			row += '</td></tr>';
			$("#groupTable").find("tbody").append(row);
			// Get Accessible Accounts for Group
			$.ajax({
				type: 'GET',
				url: '/api/v1/money/account/groups/'+group.id
			}).success(function(response) {
				// console.log(response);
				let accountArr = [];
				response.accounts.forEach(function(account) {
					accountArr.push(account.name);
				});
				$("#"+response.group+" td[name=accounts]").html(accountArr.join('<br />'));
			}).error(function(/*jqXHR, textStatus, errorThrown*/) {
				console.log('error getting accounts for group');
			});
			// Get Accessible Cars for Group
			$.ajax({
				type: 'GET',
				url: '/api/v1/automobile/car/groups/'+group.id
			}).success(function(response) {
				// console.log(response);
				let carArr = [];
				response.cars.forEach(function(car) {
					carArr.push(car.year+" "+car.make+" "+car.model);
				});
				$("#"+response.group+" td[name=cars]").html(carArr.join('<br />'));
			}).error(function(/*jqXHR, textStatus, errorThrown*/) {
				console.log('error getting cars for group');
			});
			// Get Accessible People for Group
			$.ajax({
				type: 'GET',
				url: '/api/v1/health/person/groups/'+group.id
			}).success(function(response) {
				// console.log(response);
				let personArr = [];
				response.people.forEach(function(person) {
					personArr.push(person.first_name+" "+person.middle_name+" "+person.last_name);
				});
				$("#"+response.group+" td[name=people]").html(personArr.join('<br />'));
			}).error(function(/*jqXHR, textStatus, errorThrown*/) {
				console.log('error getting people for group');
			});
		});
	}).error(function(/*jqXHR, textStatus, errorThrown*/) {
		$("#infoModalBody").html("There was a problem.  Please try again.");
		$("#infoModal").modal("show");
	});
}

function getOthers() {
	return new Promise(function(resolve) {
		$.ajax({
			type: "GET"
			,url: '/api/v1/users'
		}).success(function(response) {
			// console.log(response);
			others = response;
			// response.forEach(function(user){
			// 	$("#newMembers").append($('<option>',{value: user.uid, text: user.firstName+" "+user.lastName}));
			// 	$("#editMembers").append($('<option>',{value: user.uid, text: user.firstName+" "+user.lastName}));
			// });
			resolve();
		}).error(function(/*jqXHR*/) {
			// console.log(jqXHR);
			resolve();
		});
	});
}

function modifyGroup() {
	const id = $("#editGroupId").val();
	if (typeof id !== "undefined" && id.length > 0) {
		let errorCount = 0;
		const editName = $("#editName");
		const editMember = $("#editMember");
		if (typeof editName.val() !== "undefined" && editName.val().length > 0) {
			editName.css("background-color", "#fff");
		} else {
			errorCount++;
			editName.css("background-color", "#f2dede");
		}
		if (editMember.val() !== "") {
			if (!editMember.val().match(/^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/)) {
				errorCount++;
				editMember.css("background-color", "#f2dede");
			} else {
				editMember.css("background-color", "#fff");
			}
		}

		if (errorCount === 0) {
			$("#editGroupModal").modal("hide");
			const group = {
				id: id
				,name: editName.val()
				,member: editMember.val()
			};
			$.ajax({
				type: "PUT"
				,url: "/api/v1/group/"
				,data: group
			}).success(function(response) {
				if (response.hasOwnProperty("member")) {
					if (response.member === "confirming") {
						$("#infoModalBody").html("The Member has been sent an invitation.  You will need to provide the Member " +
							"with a code to complete the invitation.  <strong>We strongly suggest providing the code by a means other " +
							"than email.</strong><br />Your invitations can be found in My Accounts.");
					} else if (response.member === "not_verified") {
						$("#infoModalBody").html("The Member has not verified their email yet.  Once they do that, your " +
							"invitation will be sent.");
					} else if (response.member === "invited") {
						$("#infoModalBody").html("The Member does not seem to be a member of the site.  An invitation has been " +
							"sent on your behalf.  You will need to provide the Member with a code to complete the invitation.  " +
							"<strong>We strongly suggest providing the code by a means other than email.</strong><br />" +
							"Your invitations can be found in My Accounts.");
					}
					$("#infoModal").modal("show");
				}
				getGroups();
			}).error(function() { //jqXHR, textStatus, errorThrown
				$("#infoModalBody").html("There was a problem.  Please try again.");
				$("#infoModal").modal("show");
			});
		}
	}
}

function removeGroup() {
	const id = $("#deleteGroupId").val();
	$("#deleteGroupModal").modal("hide");
	if (typeof id !== "undefined" && id.length > 0) {
		$.ajax({
			type: "DELETE"
			,url: "/api/v1/group/"+id
		}).success(function() {
			getGroups();
		}).error(function() { //jqXHR, textStatus, errorThrown
			$("#infoModalBody").html("There was a problem.  Please try again.");
			$("#infoModal").modal("show");
		});
	}
}

function saveGroup(group) {
	$.ajax({
		type: "POST"
		,url: "/api/v1/group"
		,data: group
	}).success(function(response) {
		if (response.hasOwnProperty("member")) {
			if (response.member === "confirming") {
				$("#infoModalBody").html("The Member has been sent an invitation.  You will need to provide the Member " +
					"with a code to complete the invitation.  <strong>We strongly suggest providing the code by a means other " +
					"than email.</strong><br />Your invitations can be found in My Accounts.");
			} else if (response.member === "not_verified") {
				$("#infoModalBody").html("The Member has not verified their email yet.  Once they do that, your " +
					"invitation will be sent.");
			} else if (response.member === "invited") {
				$("#infoModalBody").html("The Member does not seem to be a member of the site.  An invitation has been " +
					"sent on your behalf.  You will need to provide the Member with a code to complete the invitation.  " +
					"<strong>We strongly suggest providing the code by a means other than email.</strong><br />" +
					"Your invitations can be found in My Accounts.");
			}
			$("#infoModal").modal("show");
		}
		getGroups();
	}).error(function() { //jqXHR, textStatus, errorThrown
		$("#infoModalBody").html("There was a problem.  Please try again.");
		$("#infoModal").modal("show");
	});
}