$(document).ready(function() {
	$('#password').keypress(function (e) {
		var key = e.which;
		if(key == 13) {
			$("#loginButton").click();
			return false;  
		}
	}); 
	
	$("#signupButton").click(function() {
		signUpUser($("#username").val(),$("#password").val());
	});

	$("#loginButton").click(function() {
		logInUser($("#username").val(), $("#password").val());
	});	
});

function signUpUser(username, pass) {
	$.ajax({
		type: "POST"
		,url: "/api/v1/money/users"
		,data: {
			email: username
			,password: pass
		}
	})
	.success(function(response) {
		logInUser(username, pass);
	})
	.error(function() {
		console.log("not created");
	});
}

function logInUser(username, pass) {
	$.ajax({
		type: "POST"
		,url: "/api/v1/money/users/login"
		,data: {
			email: username
			,password: pass
		}
	})
	.success(function(response, textStatus, jqXHR) {
		var auth = jqXHR.getResponseHeader("Auth");
		// console.log(auth);
		setCookie("x-Auth", auth, 14);
		// document.cookie = "Auth="+auth;
		// console.log("logged in");
		window.location.replace("/test");
	})
	.error(function() {
		console.log("login error");
	});
}