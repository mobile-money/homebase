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
$('#password').keypress(function (e) {
	let key = e.which;
	if(key === 13) {
		verify();
	}
});

$("#verifyButton").on("click",function() {
	verify();
});

// FUNCTIONS
function verify() {
	$.ajax({
		type: "POST",
		url: "/api/v1/verify/email",
		data: {
			phase: QueryString.phase,
			guid: QueryString.id,
			password: $("#password").val()
		}
	}).success(function() {
		window.location.replace("verify/email_verified");
	}).error(function(jqXHR) {
		if (jqXHR.status === 401 || jqXHR.status === 404) {
			$("#infoModalBody").html("Verification failed.  Please try again.");
		} else {
			$("#infoModalBody").html("There was a problem.  Please try again.");
		}
		$("#infoModal").modal("show");
	})
}