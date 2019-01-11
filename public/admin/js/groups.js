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
	$("#deleteModalBody").html("<strong>Are you sure you want to delete the group "+name+"?</strong>");
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
				'<td name="owner">';
			if (owner) {
				row += owner.firstName + " " + owner.lastName;
			}
			row += '</td>'+
				'<td name="members">';
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
				'<td name="accounts"></td>' +
				'<td name="cars"></td>' +
				'<td name="people"></td>' +
				'<td>';
			if (group.owner) {
				row += '<button class="btn btn-sm btn-primary" title="Edit Group" onclick="editGroup(\''+group.id+'\');"><i class="fa fa-pencil"></i></button>';
			}
			row += '</td></tr>';
			$("#groupTable").find("tbody").append(row);
		});
	}).error(function(/*jqXHR, textStatus, errorThrown*/) {
		$("#infoModalBody").html("There was a problem.  Please try again.");
		$("#infoModal").modal("show");
	});
}

// function getInactiveCars() {
// 	$.ajax({
// 		type: "GET"
// 		,url: "/api/v1/automobile/car/inactive"
// 	}).success(function(response) {
// 		$("#inactiveCarTable").find("tbody").empty();
// 		response.forEach(function(car) {
//             let row = '<tr id="'+car.id+'">' +
//                 '<td name="make">'+car.make+'</td>' +
//                 '<td name="model">'+car.model+'</td>'+
//                 '<td name="year">'+car.year+'</td>' +
//                 '<td name="vin">'+car.vin+'</td>' +
//                 '<td name="license_plate">'+car.license_plate+'</td>' +
//                 '<td name="purchase_date">'+moment.utc(car.purchase_date).format("MMM D, YYYY")+'</td>' +
//                 '<td name="purchase_mileage">'+car.purchase_mileage+'</td>' +
//                 '<td name="current_mileage">'+car.current_mileage+'</td>' +
//                 '<td name="sold_date">'+moment.utc(car.sold_date).format("MMM D, YYYY")+'</td>' +
//                 '<td name="mx_log"><a href="/automobile/mx_log?CarId='+car.id+'">MX&nbsp;Log</a></td>';
// 			if (car.additional_owners.length > 0) {
// 				let addUsers = "Additional users with access:";
// 				let addUsersIds = [];
// 				car.additional_owners.forEach(function(additional_user) {
// 					addUsers += "<br />"+additional_user.first_name+' '+additional_user.last_name;
// 					addUsersIds.push(additional_user.id);
// 				});
// 				row += '<td name="additional_users"><i class="fa fa-user" data-toggle="tooltip" data-placement="bottom" data-html="true" data-container="body" title="'+addUsers+'"></i>' +
// 					'<input name="additional_users_ids" type="hidden" value="'+addUsersIds.join(",")+'" /></td>';
// 			} else {
// 				row += '<td></td>';
// 			}
// 			if (car.master) {
// 				row += '<td>'+
// 					'<button class="btn btn-primary" title="Reactivate Car" onclick="reactivateCar(\''+car.id+'\');">'+
// 					'<i class="fa fa-pencil"></i>'+
// 					'</button>'+
// 					'</td>';
// 			} else {
// 				row += '<td></td>';
// 			}
// 			row += '</tr>';
// 			$("#inactiveCarTable").find("tbody").append(row);
// 		});
// 		$('[data-toggle="tooltip"]').tooltip();
// 	}).error(function(jqXHR) { //, textStatus, errorThrown
// 		if (jqXHR.status === 500) {
// 			$("#infoModalBody").html("There was a problem.  Please try again.");
// 			$("#infoModal").modal("show");
// 		}
// 	});
// }

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

// function reactivateCar(id) {
// 	const make = $("#"+id+" td[name=make]").html();
// 	const model = $("#"+id+" td[name=model]").html();
// 	const year = $("#"+id+" td[name=year]").html();
// 	$("#reactivateCarId").val(id);
// 	$("#reactivateModalBody").html("Would you like to reactivate the "+year+"&nbsp;"+make+"&nbsp;"+model+"?");
// 	$("#reactivateCarModal").modal("show");
// }
//
// function removeCar() {
// 	const id = $("#deleteCarId").val();
// 	$("#deleteCarModal").modal("hide");
// 	if (typeof id !== "undefined" && id.length > 0) {
// 		$.ajax({
// 			type: "DELETE"
// 			,url: "/api/v1/automobile/car/"+id
// 		}).success(function() {
// 			getCars();
// 			getInactiveCars();
// 			return false;
// 		}).error(function() { //jqXHR, textStatus, errorThrown
// 			$("#infoModalBody").html("There was a problem.  Please try again.");
// 			$("#infoModal").modal("show");
// 		});
// 	}
// }

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

// function undeleteCar() {
// 	const id = $("#reactivateCarId").val();
// 	$("#reactivateCarModal").modal("hide");
// 	if (typeof id !== "undefined" && id.length > 0) {
// 		$.ajax({
// 			type: "PUT"
// 			,url: "/api/v1/automobile/car/reactivate"
// 			,data: {
// 				id: id
// 			}
// 		}).success(function() {
// 			getCars();
// 			getInactiveCars();
// 			return false;
// 		}).error(function() { //jqXHR, textStatus, errorThrown
// 			$("#infoModalBody").html("There was a problem.  Please try again.");
// 			$("#infoModal").modal("show");
// 		});
// 	}
// }