$(document).ready(function() {
	$("body").show();
	getMe();
	getInvitations();
});

// FIELD EVENTS

	$("#changePasswordButton").click(function() {
		changePassword();
	});

	$("#changeNameButton").click(function() {
		changeName();
	});

	$("#resendVerifyButton").on("click", function() {
		resendVerification();
	});

// FUNCTIONS
function acceptInvite(id) {

}

function changeName() {
	let errors = 0;
	const newFirstName = $("#firstName").val().trim();
	const newLastName = $("#lastName").val().trim();
	if (newFirstName.length > 24) {
		$("#firstNameError").html("First name cannot be longer than 24 characters");
		errors++;
	} else {
		$("#firstNameError").html("");
	}
	if (newLastName.length > 24) {
		$("#lastNameError").html("First name cannot be longer than 24 characters");
		errors++;
	} else {
		$("#lastNameError").html("");
	}
	if (errors === 0) {
		$.ajax({
			type: "POST",
			url: "/api/v1/users/changeName",
			data: {
				firstName: encodeURIComponent(newFirstName),
				lastName: encodeURIComponent(newLastName)
			}
		}).success(function() {
			$("#infoModalBody").html("Names have been updated!");
			$("#infoModal").modal("show");
			getMe();
		}).error(function(/*jqXHR, textStatus, errorThrown*/) {
			$("#infoModalBody").html("There was a problem.  Please try again.");
			$("#infoModal").modal("show");
		});
	}
}

function changePassword() {
	let errors = 0;
	const $currentPassword = $("#currentPassword");
	const $newPassword = $("#newPassword");
	const $confirmNewPassword = $("#confirmNewPassword");
	if ($currentPassword.val() === "") {
		$("#currentPasswordError").html("Current password is required");
		errors++;
	} else {
		$("#currentPasswordError").html("");
	}
	if ($newPassword.val() !== $confirmNewPassword.val()) {
		$("#confirmNewPasswordError").html("Passwords do not match");
		errors++;
	} else {
		$("#confirmNewPasswordError").html("");
	}
	if (!$newPassword.val().match(/(?=^.{8,16}$)((?=.*\d)(?=.*[A-Z])(?=.*[a-z])|(?=.*\d)(?=.*[^A-Za-z0-9])(?=.*[a-z])|(?=.*[^A-Za-z0-9])(?=.*[A-Z])(?=.*[a-z])|(?=.*\d)(?=.*[A-Z])(?=.*[^A-Za-z0-9]))^.*/)) {
		$("#newPasswordError").html("New password does not meet complexity requirements");
		errors++;
	} else {
		$("#newPasswordError").html("");
	}
	if (errors === 0) {
		// console.log("send");
		$.ajax({
			type: "PUT",
			url: "/api/v1/users/changePassword",
			data: {
				currentPassword: $currentPassword.val(),
				newPassword: $newPassword.val()
			}
		}).success(function() {
			$currentPassword.val("");
			$newPassword.val("");
			$confirmNewPassword.val("");
			$("#infoModalBody").html("Password has been updated!");
			$("#infoModal").modal("show");
		}).error(function(jqXHR/*, textStatus, errorThrown*/) {
			if (jqXHR.status === 400) {
				$("#infoModalBody").html("Current password is not correct");
				$("#infoModal").modal("show");
			} else {
				$("#infoModalBody").html("There was a problem.  Please try again.");
				$("#infoModal").modal("show");
			}
		});
	}
}

function getInvitations() {
	$.ajax({
		type: "GET",
		url: "/api/v1/invitations"
	}).success(function(response) {
		// console.log(response);
		$("#inviteTable").find("tbody").empty();
		response.from.forEach(function(invite) {
			let row = '<tr id="'+invite.id+'">';
			if (invite.type === "group") {
				row += '<td>Invite to Group, ' + invite.comments + '</td>';
			} else if(invite.type === "site") {
				row += '<td>Invite to Site</td>';
			} else {
				row += '<td>'+invite.type+'</td>';
			}
			row += '<td name="email">'+invite.email+'</td>' +
				'<td>'+invite.code+'</td>';
			if (invite.active) {
				row += '<td>Active</td>'+
					'<td><button class="btn btn-sm btn-danger" title="Rescind Invite" onclick="rescindInvite('+invite.id+');"><i class="fa fa-trash" /></button></td>';
			} else {
				if (invite.completed) {
					row += '<td>Accepted</td>';
				} else if (invite.failed) {
					row += '<td>Failed</td>';
				} else {
					row += '<td>Inactive</td>';
				}
				row += '<td></td>';
			}
			row += '</tr>';
			$("#inviteTable").find("tbody").append(row);
		});
		response.to.forEach(function(toInvite) {
			let row = '<tr id="t_'+toInvite.id+'">' +
				'<td>Invite to Group, ' + toInvite.group_name + '</td>' +
				'<td>' + toInvite.from + '</td>' +
				'<td name="code"><input type="text" class="form-control" name="code" maxlength="10" /></td>' +
				'<td><button class="btn btn-sm btn-success" onClick="acceptInvite('+toInvite.id+');"><i class="fa fa-check" /></button></td>' +
				'</tr>';
			$("#inviteToTable").find("tbody").append(row);
		});
	}).error(function() {
		$("#infoModalBody").html("There was a problem.  Please try again.");
		$("#infoModal").modal("show");
	});
}

function getMe() {
	$.ajax({
		type: "GET",
		url: "/api/v1/users/me"
	}).success(function(response) {
		// console.log(response);
		$("#firstName").val(response.firstName);
		$("#lastName").val(response.lastName);
		if (!response.verified) {
			$("#verifyRow").show();
		}
	}).error(function(/*jqXHR, textStatus, errorThrown*/) {
		$("#infoModalBody").html("There was a problem.  Please try again.");
		$("#infoModal").modal("show");
	});
}

function rescindInvite(id) {
	$.ajax({
		type: "DELETE",
		url: "/api/v1/invitations",
		data: {
			id: id
		}
	}).success(function() {
		getInvitations();
	}).error(function() {
		$("#infoModalBody").html("There was a problem.  Please try again.");
		$("#infoModal").modal("show");
	});
}

function resendVerification() {
	$.ajax({
		type: "GET",
		url: "/api/v1/verification/resend"
	}).success(function() {
		$("#infoModalBody").html("Verification email resent");
		$("#infoModal").modal("show");
	}).error(function() {
		$("#infoModalBody").html("There was a problem.  Please try again.");
		$("#infoModal").modal("show");
	})
}