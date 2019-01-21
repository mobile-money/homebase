$(document).ready(function() {
	$("body").show();
	getMe();
});

// FIELD EVENTS

	$("#changePasswordButton").click(function() {
		changePassword();
	});

	$("#changeNameButton").click(function() {
		changeName();
	});

// FUNCTIONS
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

function getMe() {
	$.ajax({
		type: "GET",
		url: "/api/v1/users/me"
	}).success(function(response) {
		$("#firstName").val(response.firstName);
		$("#lastName").val(response.lastName);
	}).error(function(/*jqXHR, textStatus, errorThrown*/) {
		$("#infoModalBody").html("There was a problem.  Please try again.");
		$("#infoModal").modal("show");
	});
}