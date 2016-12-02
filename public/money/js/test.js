if (!checkCookie("x-Auth")) {
	// window.location.replace("/login");
	// console.log("not logged in");
}


console.log("logged in");
$("#stuff").append(getCookie("x-Auth")+"<br />");

$.ajax({
	type: "GET"
	,url: "/api/test/user"
	// ,headers: {
	// 	x-auth: getCookie("x-Auth")
	// }
	// ,data: {
	// 	token: getCookie("x-Auth")
	// }
})
.success(function(response) {
	$("#stuff").append(JSON.stringify(response));
})
.error(function(jqXHR, textStatus, errorThrown) {
	if (jqXHR.status === 401) {
		logOut();
	} else {
		$("#stuff").append("ERROR");
	}
});

// var auth = getCookie("x-Auth");

// console.log(auth);