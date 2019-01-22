$(document).ready(function() {
});

const QueryString = function () {
	// This function is anonymous, is executed immediately and
	// the return value is assigned to QueryString!
	let query_string = {};
	const query = window.location.search.substring(1);
	const vars = query.split("&");
	for (let i=0;i<vars.length;i++) {
		const pair = vars[i].split("=");
		// If first entry with this name
		if (typeof query_string[pair[0]] === "undefined") {
			query_string[pair[0]] = decodeURIComponent(pair[1]);
			// If second entry with this name
		} else if (typeof query_string[pair[0]] === "string") {
			query_string[pair[0]] = [query_string[pair[0]], decodeURIComponent(pair[1])];
			// If third or later entry with this name
		} else {
			query_string[pair[0]].push(decodeURIComponent(pair[1]));
		}
	}
	return query_string;
}();

// FIELD EVENTS
$('#code').keypress(function (e) {
	let key = e.which;
	if(key === 13) {
		verify();
	}
});

$("#acceptButton").on("click",function() {
	verify();
});

// FUNCTIONS
function verify() {
	// console.log(QueryString.id);
	$.ajax({
		type: "POST",
		url: "/api/v1/verification/group",
		data: {
			guid: QueryString.id,
			code: $("#code").val()
		}
	}).success(function() {
		window.location.replace("invitation_accepted");
		// $("#infoModalBody").html("Email has been verified.  Thank you!");
		// $("infoModal").on("hidden.bs.modal", function() {
		//
		// });
		// $("#infoModal").modal("show");
	}).error(function(jqXHR) {
		if (jqXHR.status === 401 || jqXHR.status === 404) {
			$("#infoModalBody").html("Invitation failed.  Please try again.");
		} else {
			$("#infoModalBody").html("There was a problem.  Please try again.");
		}
		$("#infoModal").modal("show");
	})
}

// function signUpUser(captchaToken) {
// 	let err = 0;
// 	const newFirstName = encodeURIComponent($("#newFirstName").val().trim());
// 	const newLastName = encodeURIComponent($("#newLastName").val().trim());
// 	const newEmail = encodeURI($("#newEmail").val());
// 	const newPassword = $("#newPassword").val();
// 	if (!newEmail.match(/^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/)) {
// 		err++;
// 	}
// 	if (!newPassword.match(/(?=^.{8,16}$)((?=.*\d)(?=.*[A-Z])(?=.*[a-z])|(?=.*\d)(?=.*[^A-Za-z0-9])(?=.*[a-z])|(?=.*[^A-Za-z0-9])(?=.*[A-Z])(?=.*[a-z])|(?=.*\d)(?=.*[A-Z])(?=.*[^A-Za-z0-9]))^.*/)) {
// 		err++;
// 	}
//
// 	if (err === 0) {
// 		$("#signupModal").modal("hide");
// 		$.ajax({
// 			type: "POST"
// 			,url: "/api/v1/users/new"
// 			,data: {
// 				firstName: newFirstName
// 				,lastName: newLastName
// 				,email: newEmail
// 				,password: newPassword
// 				,captchaToken: captchaToken
// 			}
// 		}).success(function(/*response*/) {
// 			logInUser(newEmail, newPassword);
// 			// alert("created");
// 		}).error(function(response/*, textStatus, jqXHR*/) {
// 			$("#infoModalTitle").html("Could Not Create Account");
// 			if (response.status === 409) {
// 				$("#infoModalBody").html("This account already exists.");
// 			} else {
// 				$("#infoModalBody").html("There was a problem creating the account.  Please try again later.");
// 			}
// 			$("#infoModal").modal("show");
// 		});
// 	}
// }