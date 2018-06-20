// Global Variables
const socket = io("/auto");

// Global Functions
function gl_getCars() {
    return new Promise(function(resolve, reject) {
        if (typeof(Cookies.get(btoa("automobile_cars"))) === "undefined") {
            $.ajax({
                type: "GET"
                ,url: "/api/v1/automobile/car"
            }).success(function(response) {
                let packed = $.extend(true,[],response);
                Cookies.set(btoa("automobile_cars"),JSONC.pack(packed,true), {expires: 7});
                resolve(response);
            }).error(function(jqXHR) {
                if (jqXHR.status === 404) {
                    resolve([]);
                } else {
                    reject("There was a problem retrieving Cars.  Please try again.");
                }
            });
        } else {
            // console.log("retrieving cached categories");
            resolve(JSONC.unpack(Cookies.get(btoa("automobile_cars")),true));
        }
    });
}

function gl_getInactiveCars() {
    return new Promise(function(resolve, reject) {
        if (typeof(Cookies.get(btoa("automobile_inactive_cars"))) === "undefined") {
            // console.log("refreshing accounts");
            $.ajax({
                type: "GET"
                ,url: "/api/v1/automobile/car/inactive"
            }).success(function(response) {
                let packed = $.extend(true,[],response);
                Cookies.set(btoa("automobile_inactive_cars"),JSONC.pack(packed,true), {expires: 7});
                resolve(response);
            }).error(function(jqXHR) {
                if (jqXHR.status === 404) {
                    resolve([]);
                } else {
                    reject("There was a problem retrieving Inactive Cars.  Please try again.");
                }
            });
        } else {
            // console.log("retrieving cached accounts");
            resolve(JSONC.unpack(Cookies.get(btoa("automobile_inactive_cars")),true));
        }
    });
}

// Global Socket.io listeners
socket.on("refreshCars", function() {
    Cookies.remove(btoa("automobile_cars"));
    Cookies.remove(btoa("automobile_inactive_cars"));
});