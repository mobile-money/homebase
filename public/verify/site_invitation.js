$(document).ready(function() {
	if (QueryString.hasOwnProperty("stamp")) {
		$("#newEmail").val(atob(QueryString.stamp));
	}
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
$("#acceptButton").on("click",function() {
	verify();
});
$("#successModal").on("hidden.bs.modal", function() {
	window.location.replace("/welcome");
});

// FUNCTIONS
function verify() {
	let err = 0;
	const code = $("#code");
	const newFirstName = encodeURIComponent($("#newFirstName").val().trim());
	const newLastName = encodeURIComponent($("#newLastName").val().trim());
	const newPassword = $("#newPassword").val();
	if (code.val() === "") {
		err++;
		$("#codeError").html("Please enter your verification code");
	} else {
		$("#codeError").html("");
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
		$.ajax({
			type: "POST"
			,url: "/api/v1/verify/site"
			,data: {
				code: code.val()
				,guid: QueryString.id
				,firstName: newFirstName
				,lastName: newLastName
				,password: newPassword
			}
		}).success(function(/*response*/) {
			$("#successModal").modal("show");
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


	// $.ajax({
	// 	type: "POST",
	// 	url: "/api/v1/verify/group",
	// 	data: {
	// 		guid: QueryString.id,
	// 		code: $("#code").val()
	// 	}
	// }).success(function() {
	// 	window.location.replace("group_joined");
	// }).error(function(jqXHR) {
	// 	if (jqXHR.status === 401 || jqXHR.status === 404) {
	// 		$("#infoModalBody").html("Invitation failed.  Please try again.");
	// 	} else {
	// 		$("#infoModalBody").html("There was a problem.  Please try again.");
	// 	}
	// 	$("#infoModal").modal("show");
	// })
}