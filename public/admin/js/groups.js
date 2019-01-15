let others;

$(document).ready(function() {
	$("body").show();

	getOthers().then(function() {
		getGroups();
	});
	// getInactiveCars();
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
// 	$("#reactivateCarButton").click(function() {
// 		undeleteCar();
// 	});

	$("#addGroupModal").on("shown.bs.modal", function() {
		$("#newName").focus();
	}).on("hidden.bs.modal", function() {
        clearAddFields();
    });

// 	$("#infoModal").on("hidden.bs.modal", function() {
// 		$("#infoModalBody").empty();
// 	});

	$("#editGroupModal").on("shown.bs.modal", function() {
		$("#editName").focus();
	}).on("hidden.bs.modal", function() {
        clearEditFields();
    });

	$("#deleteCarModal").on("hidden.bs.modal", function() {
		$("#deleteCarId").val("");
        $("#deleteModalBody").html("");
	});

// 	$("#reactivateCarModal").on("hidden.bs.modal", function() {
// 		$("#reactivateCarId").val("");
// 		$("#reactivateModalBody").html("");
// 	});

// FUNCTIONS
function addGroup() {
	let errorCount = 0;
	const newName = $("#newName");
	if (typeof newName.val() !== "undefined" && newName.val().length > 0) {
		newName.css("background-color", "#fff");
	} else {
		errorCount++;
		newName.css("background-color", "#f2dede");
	}

	if (errorCount === 0) {
		$("#addGroupModal").modal("hide");
		let group = {
			name: newName.val(),
			members: JSON.stringify($("#newMembers").val())
		};
		saveGroup(group);
	}
}

function clearAddFields() {
	$("#newName").val("");
	$("#newMembers option:selected").prop("selected", false);
}

function clearEditFields() {
	$("#editName").val("");
	$("#editMembers option:selected").prop("selected", false);
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
	const aua = $("#"+id+" td[name=members] input[name=member_ids]").val();
	if (typeof(aua) !== "undefined") {
		$("#editMembers").val(aua.split(","));
	}
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
		$("#groupTable").find("tbody").empty();
		response.forEach(function(group) {
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
					arr.push(mem.firstName + " " + mem.lastName);
				});
				row += arr.join('<br />')+'<input type="hidden" name="member_ids" value="'+members.join(',')+'" />';
			}
			row += '</td>' +
				'<td name="accounts" class="small-text"></td>' +
				'<td name="cars" class="small-text"></td>' +
				'<td name="people" class="small-text"></td>' +
				'<td>';
			if (group.owner) {
				row += '<button class="btn btn-sm btn-primary" title="Edit Group" onclick="editGroup(\''+group.id+'\');"><i class="fa fa-pencil"></i></button>';
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
			response.forEach(function(user){
				$("#newMembers").append($('<option>',{value: user.uid, text: user.firstName+" "+user.lastName}));
				$("#editMembers").append($('<option>',{value: user.uid, text: user.firstName+" "+user.lastName}));
			});
			resolve();
		}).error(function(jqXHR) {
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
		if (typeof editName.val() !== "undefined" && editName.val().length > 0) {
			editName.css("background-color", "#fff");
		} else {
			errorCount++;
			editName.css("background-color", "#f2dede");
		}

		if (errorCount === 0) {
			$("#editGroupModal").modal("hide");
			const group = {
				id: id
				,name: editName.val()
				,members: JSON.stringify($("#editMembers").val())
			};
			$.ajax({
				type: "PUT"
				,url: "/api/v1/group/"
				,data: group
			}).success(function() {
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
	}).success(function() { //response
		getGroups();
		// location.reload();
	}).error(function() { //jqXHR, textStatus, errorThrown
		$("#infoModalBody").html("There was a problem.  Please try again.");
		$("#infoModal").modal("show");
	});
}