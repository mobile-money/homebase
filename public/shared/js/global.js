let theme = getCookie("hb_theme");
$("#user_name").html(getCookie('x-FirstName'));
sessionCheck();
setThemeSwitch();
setTheme();

$("#theme_switch").change(function() {
    if ($(this).prop("checked")) {
        // light
        setCookie("hb_theme","light",null);
        theme = "light";
    } else {
        // dark
        setCookie("hb_theme","dark",null);
        theme = "dark";
    }
    setTheme()
});

function checkCookie(cname) {
    const cookie = getCookie(cname);
    return cookie !== "";
}

function deleteCookie(cname) {
    document.cookie = cname+"=; expires=Thu, 01 Jan 1970 00:00:00 UTC";
}

function getCookie(cname) {
    const name = cname + "=";
    const ca = document.cookie.split(';');
    for(let i=0; i<ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0)===' ') c = c.substring(1);
        if (c.indexOf(name) === 0) return c.substring(name.length, c.length);
    }
    return "";
}

function logOut() {
    $.ajax({
        type: "DELETE"
        ,url: "/api/v1/users/logout"
        ,data: {
            token: getCookie("x-Auth")
        }
    });
    deleteCookie("x-Auth");
    window.location.replace("/welcome");
}

function sessionCheck() {
    setTimeout(function() {
        if (getCookie("x-Auth") === "") {
            logOut();
        }
        sessionCheck();
    }, 60000);
}

function setCookie(cname, cvalue, exdays) {
    let expires = "expires=";
    if (exdays !== null) {
        let d = new Date();
        d.setTime(d.getTime() + (exdays*24*60*60*1000));
        expires += +d.toUTCString();
    } else {
        expires += "Fri, 31 Dec 9999 23:59:59 GMT";
    }
    document.cookie = cname + "=" + cvalue + "; " + expires + ";path=/;secure;samesite=strict";
}

function setTheme() {
    if (theme === "dark") {
        // dark
        $("nav").removeClass("navbar-light").removeClass("bg-light").addClass("navbar-dark").addClass("bg-dark");
        $(".modal").addClass("dark");
        $(".card").addClass("bg-dark").addClass("text-white");
        $("table").addClass("table-dark");
        $("body").css("background-color", "#000");
    } else {
        // light
        $("nav").removeClass("navbar-dark").removeClass("bg-dark").addClass("navbar-light").addClass("bg-light");
        $(".modal").removeClass("dark");
        $(".card").removeClass("bg-dark").removeClass("text-white");
        $("table").removeClass("table-dark");
        $("body").css("background-color", "#fcfcfc");
    }
}

function setThemeSwitch() {
    if (theme === "dark") {
        $("#theme_switch").bootstrapToggle("off");
    } else {
        $("#theme_switch").bootstrapToggle("on");
    }
}