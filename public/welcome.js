$(document).ready(function() {
	deleteCookie('x-Auth');
	deleteCookie('x-FirstName');
});

// FIELD EVENTS
$("#confirmPassword").on("change",function() {
	if ($("#newPassword").val() !== $(this).val()) {
		$(this).addClass("error");
		$("#confirmPasswordError").show();
	} else {
		$(this).removeClass("error");
		$("#confirmPasswordError").hide();
	}
});

$("#loginButton").on("click", function() {
	logInUser($("#username").val(), $("#password").val());
});

$('#password').keypress(function (e) {
	let key = e.which;
	if(key === 13) {
		$("#loginButton").click();
		return false;
	}
});

$("#signupButton").on("click", function() {
	// $("#signupModal").modal("show");
	$("#thankYouModal").modal("show");
});

$("#signupModal").on("hidden.bs.modal",function() {
	$(".signup-field").val("").removeClass("error");
	$(".signup-error").hide();
	$(".password-case").removeClass("label-success").addClass("label-danger");
});

// FUNCTIONS
function captchaCheck(token) {
	signUpUser(token);
}
function signUpUser(captchaToken) {
	let err = 0;
	const newFirstName = encodeURIComponent($("#newFirstName").val().trim());
	const newLastName = encodeURIComponent($("#newLastName").val().trim());
	const newEmail = encodeURI($("#newEmail").val());
	const newPassword = $("#newPassword").val();
	if (!newEmail.match(/^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/)) {
		err++;
		$("#newEmailError").html("Email address appears to be invalid");
	} else {
		$("#newEmailError").html("");
	}
	if (!newPassword.match(/(?=^.{8,16}$)((?=.*\d)(?=.*[A-Z])(?=.*[a-z])|(?=.*\d)(?=.*[^A-Za-z0-9])(?=.*[a-z])|(?=.*[^A-Za-z0-9])(?=.*[A-Z])(?=.*[a-z])|(?=.*\d)(?=.*[A-Z])(?=.*[^A-Za-z0-9]))^.*/)) {
		err++;
		$("#newPasswordError").html("Password does not meet complexity requirements");
	} else {
		$("#newPasswordError").html("");
	}
	if (newPassword !== $("#confirmPassword").val()) {
		err++;
		$("#confirmPasswordError").html("Password do not match");
	} else {
		$("#confirmPasswordError").html("");
	}

	if (err === 0) {
		$("#signupModal").modal("hide");
		$.ajax({
			type: "POST"
			,url: "/api/v1/users/new"
			,data: {
				firstName: newFirstName
				,lastName: newLastName
				,email: newEmail
				,password: newPassword
				,captchaToken: captchaToken
			}
		}).success(function(/*response*/) {
			logInUser(newEmail, newPassword);
		}).error(function(response/*, textStatus, jqXHR*/) {
			$("#infoModalTitle").html("Could Not Create Account");
			if (response.status === 409) {
				$("#infoModalBody").html("This account already exists.");
			} else {
				$("#infoModalBody").html("There was a problem creating the account.  Please try again later.");
			}
			$("#infoModal").modal("show");
		});
	}
}

function logInUser(username, pass) {
	$.ajax({
		type: "POST"
		,url: "/api/v1/users/login"
		,data: {
			email: username
			,password: pass
		}
	}).success(function(response, textStatus, jqXHR) {
		const auth = jqXHR.getResponseHeader("Auth");
		setCookie("x-Auth", auth, 1);
		setCookie("x-FirstName", response.firstName, 1);
		window.location.replace("/homebase");
	}).error(function(response/*, textStatus, jqXHR*/) {
		if (response.status === 401) {
			$("#infoModalTitle").html("Log In Failure");
			$("#infoModalBody").html("Email address and/or password is incorrect.  Please try again.");
		} else {
			$("#infoModalTitle").html("Could Not Log In");
			$("#infoModalBody").html("Unable to log on at the moment.  Please try again later.");
		}
		$("#infoModal").modal("show");
	});
}