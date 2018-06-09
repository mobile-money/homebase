// Global Variables
const socket = io("/money");

// Global Socket.io listeners
socket.on("refreshAccounts", function() {
    Cookies.remove(btoa("money_accounts"));
});

socket.on("refreshBills", function() {
    Cookies.remove(btoa("money_bills"));
});

socket.on("refreshCategories", function() {
    Cookies.remove(btoa("money_categories"));
});

// Global Functions
function gl_getAccounts() {
    return new Promise(function(resolve, reject) {
        if (typeof(Cookies.get(btoa("money_accounts"))) === "undefined") {
            // console.log("refreshing accounts");
            $.ajax({
                type: "GET"
                ,url: "/api/v1/money/accounts"
            }).success(function(response) {
                let packed = $.extend(true,[],response);
                Cookies.set(btoa("money_accounts"),JSONC.pack(packed,true), {expires: 7});
                resolve(response);
            }).error(function(jqXHR) {
                if (jqXHR.status === 404) {
                    resolve([]);
                } else {
                    reject("There was a problem retrieving Accounts.  Please try again.");
                }
            });
        } else {
            // console.log("retrieving cached accounts");
            resolve(JSONC.unpack(Cookies.get(btoa("money_accounts")),true));
        }
    });
}

const gl_getBills = () => {
    return new Promise(function(resolve, reject) {
        if (typeof(Cookies.get(btoa("money_bills"))) === "undefined") {
            $.ajax({
                type: "GET"
                , url: "/api/v1/money/post/bills/" + $("#accountSelect").val()
            }).success(function (response) {
                let packed = $.extend(true, [], response.bills);
                Cookies.set(btoa("money_bills"), JSONC.pack(packed, true), {expires: 1});
                resolve(response.bills);
            }).error(function (jqXHR) {
                reject(jqXHR);
            });
        } else {
            resolve(JSONC.unpack(Cookies.get(btoa("money_bills")),true));
        }
    });
};

function gl_getCategories() {
    return new Promise(function(resolve, reject) {
        if (typeof(Cookies.get(btoa("money_categories"))) === "undefined") {
            // console.log("refreshing categories");
            $.ajax({
                type: "GET"
                ,url: "/api/v1/money/categories"
            }).success(function(response) {
                let packed = $.extend(true,[],response);
                Cookies.set(btoa("money_categories"),JSONC.pack(packed,true), {expires: 7});
                resolve(response);
            }).error(function(jqXHR) {
                if (jqXHR.status === 404) {
                    resolve([]);
                } else {
                    reject("There was a problem retrieving Categories.  Please try again.");
                }
            });
        } else {
            // console.log("retrieving cached categories");
            resolve(JSONC.unpack(Cookies.get(btoa("money_categories")),true));
        }
    });
}