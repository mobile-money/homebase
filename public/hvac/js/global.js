const socket = io("/hvac");

var systemCookies = [
	"temperatureScale"
	,"defaultLocation"
	,"upperBuffer"
	,"lowerBuffer"
];
function checkSystemOptions() {
	var cookiesPresent = checkCookies();
	if (cookiesPresent === false) {
		setSystemOptions();
	}
}
function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}
function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}
function deleteCookie(cname) {
	document.cookie = cname+"=; expires=Thu, 01 Jan 1970 00:00:00 UTC";
}
function deleteCookies() {
	systemCookies.forEach(function(cookie) {
		deleteCookie(cookie);
	});
}
function checkCookies() {
	var cookiesPresent = true;
	systemCookies.forEach(function(cookie) {
		var temp = getCookie(cookie);
		if (temp === "") {
			cookiesPresent = false;
		}
	});
	return cookiesPresent;
}
function setSystemOptions() {
	$.ajax({
		type: "GET"
		,url: "/api/v1/hvac/option"
	}).success(function(results){
		setCookie("temperatureScale",results.tempScale,7);
		setCookie("defaultLocation",results.defaultLocation,7);
		setCookie("upperBuffer",results.upperBuffer,7);
		setCookie("lowerBuffer",results.lowerBuffer,7);
	}).error(function(jqXHR, textStatus, errorThrown) {
		return;
	});
}
function convertTemp(origScale, val, dec) {
	var sysScale = getCookie("temperatureScale");
	if (origScale.toLowerCase() === "c") {
		if (sysScale.toLowerCase() === "c") {
			if (dec !== null) {
				return Number(val.toFixed(dec));
			} else {
				return val;
			}
		} else if (sysScale.toLowerCase() === "k") {
			return CtoK(val,dec);
		} else {
			return CtoF(val, dec);
		}
	} else if (origScale.toLowerCase() === "f") {
		if (sysScale.toLowerCase() === "c") {
			return FtoC(val, dec);
		} else if (sysScale.toLowerCase() === "k") {
			return FtoK(val,dec);
		} else {
			if (dec !== null) {
				return Number(val.toFixed(dec));
			} else {
				return val;
			}
		}
	} else if (origScale.toLowerCase() === "k") {
		if (sysScale.toLowerCase() === "c") {
			return KtoC(val, dec);
		} else if (sysScale.toLowerCase() === "k") {
			if (dec !== null) {
				return Number(val.toFixed(dec));
			} else {
				return val;
			}
		} else {
			return KtoF(val, dec);
		}
	} else {
		return 0;
	}
}
function CtoF(cVal,dec) {
	var fVal = (Number(cVal) * (9/5) + 32);
	if (dec !== null) {
		return Number(fVal.toFixed(dec));
	} else {
		return fVal;
	}
}
function FtoC(fVal,dec) {
	var cVal = (Number(fVal) - 32) * (5/9);
	if (dec !== null) {
		return Number(cVal.toFixed(dec));
	} else {
		return cVal;
	}
}
function KtoF(kVal,dec) {
	var fVal = ((9/5) * (Number(kVal) - 273)) + 32;
	if (dec !== null) {
		return Number(fVal.toFixed(dec));
	} else {
		return fVal;
	}
}
function FtoK(fVal,dec) {
	var kVal = ((5/9) * (Number(fVal) -32)) + 273;
	if (dec !== null) {
		return Number(kVal.toFixed(dec));
	} else {
		return kVal;
	}
}
function KtoC(kVal,dec) {
	var cVal = Number(kVal) - 273;
	if (dec !== null) {
		return Number(cVal.toFixed(dec));
	} else {
		return cVal;
	}
}
function CtoK(cVal,dec) {
	var kVal = Number(cVal) + 273;
	if (dec !== null) {
		return Number(kVal.toFixed(dec));
	} else {
		return kVal;
	}
}