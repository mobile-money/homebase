// const socket = io("/auto");
$("#user_name").html(getCookie('x-FirstName'));

function setCookie(cname, cvalue, exdays) {
    let d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    const expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires + ";path=/;secure;samesite=strict";
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

function checkCookie(cname) {
    const cookie = getCookie(cname);
    return cookie !== "";
}

function deleteCookie(cname) {
    document.cookie = cname+"=; expires=Thu, 01 Jan 1970 00:00:00 UTC";
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