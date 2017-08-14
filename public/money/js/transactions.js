
var accountArray = [];
var accountNames = {};
var categoryArray = [];
var multiCategoriesObj = [];
var socket = io();
var transactionLimit = 50;

$(document).ready(function() {
	$("body").show();
	$("#newTDate").val(moment().format("MM/DD/YYYY"));
	$(".datepicker").datepicker({
		format: 'mm/dd/yyyy'
		,autoclose: true
	});

	$("#positionSection").empty();
	$("#newPayee").focus();

	getCategories();
	getAccounts();
	// getTransactions(null, null);
});

var QueryString = function () {
  // This function is anonymous, is executed immediately and 
  // the return value is assigned to QueryString!
  var query_string = {};
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i=0;i<vars.length;i++) {
    var pair = vars[i].split("=");
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

// FIELD EVENTS //
$("#accountSelect").change(function() {
    resetAddTransaction();
    clearSearch();
    $("#transactionTable").find("tbody").empty();
    if (accountNames[this.value].type === "Investment") {
        // $("#periodSelect").hide();
        getInvestments(this.value, null, null, null);
    } else {
        // $("#periodSelect").show();
        // getPeriods($("#accountSelect").val());
        getTransactions(null, null);
    }
    setupTable();
    $("#newPayee").focus();
});

$("#addTransaction").click(function() {
    addTransaction();
});

$("#cancelMultiCategoryButton").click(function() {
    multiCategoriesObj = [];
	$("#newCategory").val("");
    $("#multiCategoryModal").modal("hide");
});

$("#commitFTransactionButton").click(function() {
    sendCommit();
});

$("#commitFutureTransactionModal").on("hidden.bs.modal", function() {
    $("#commitFTransactionId").val("");
    $("#commitModalBody").empty();
    // $("#newPayee").focus();
});

$("#completeMultiCategoryButton").click(function() {
    var cnt = 0;
    var lastId = -1;
	$(".multiCatValue").each(function(i,e) {
        if (e["valueAsNumber"]) {
        	var idSplit = e.id.split("_");
            var val = e["valueAsNumber"];
        	var cat = _.where(categoryArray,{id: Number(idSplit[1])});
        	console.log(cat.length);
        	if (cat.length > 0) {
        	    if (cat[0].expense) {
        	        val = val * -1;
                }
            }
            multiCategoriesObj.push({
                id: idSplit[1]
                ,name: idSplit[2]
                ,value: val
            });
            lastId = idSplit[1];
            cnt++;
        }
	});
	if (cnt === 0) {
	    $("#newCategory").val("");
        multiCategoriesObj = [];
    } else if (cnt === 1) {
        $("#newCategory").val(lastId);
        multiCategoriesObj = [];
    }
    $("#multiCategoryModal").modal("hide");
});

$("#deleteTransactionButton").click(function() {
    removeTransaction();
});

$("#deleteTransactionModal").on("hidden.bs.modal", function() {
    // $("#newPayee").focus();
});

$("#editFTransactionButton").click(function() {
    modifyFTransaction();
});

$("#editFutureTransactionModal").on("hidden.bs.modal", function() {
    $("#editFTransactionId").val("");
    $("#editFTDate").val("");
    $("#editFPayee").val("");
    $("#editFDescription").val("");
    $("#editFCheck").val("");
    $("#editFDeposit").val("");
    $("#editFWithdrawl").val("");
    $("#editFCategory").empty();
    // $("#newPayee").focus();
}).on("shown.bs.modal", function() {
    $("#editFPayee").focus();
});

$("#editTransactionButton").click(function() {
    modifyTransaction();
});

$("#editTransactionModal").on("hidden.bs.modal", function() {
    $("#editTransactionId").val("");
    $("#editPayee").val("");
    $("#editDescription").val("");
    $("#editCheck").val("");
    $("#editCategory").empty();
    // $("#newPayee").focus();
}).on("shown.bs.modal", function() {
    $("#editPayee").focus();
});

$("#infoModal").on("hidden.bs.modal", function() {
    $("#infoModalBody").empty();
    $("#newPayee").focus();
});

$("#newCategory").change(function() {
	if ($("#newCategory").val() === "1") {
		initiateMultiCategory();
	} else {
		multiCategoriesObj = [];
	}
});

$("#newDescription").typeahead({source: function(query, process) {
		// return $.get("/api/v1/money/transactions/lookup/payee/"+encodeURI(query));
		$.ajax({
			url: "/api/v1/money/transactions/lookup/description/"+encodeURI(query)
			,success: process
		})
	}, minLength: 3});

$("#newPayee").typeahead({source: function(query, process) {
	// return $.get("/api/v1/money/transactions/lookup/payee/"+encodeURI(query));
	$.ajax({
		url: "/api/v1/money/transactions/lookup/payee/"+encodeURI(query)
		,success: process
	})
}, minLength: 3});

$("#searchClear").click(function() {
    getTransactions(null, null);
});

$("#searchField").keypress(function(e) {
    if(e.which === 13) {
        var obj = {
            text: $("#searchField").val()
            ,accountId: Number($("#accountSelect").val())
        };
        if (obj.text === "") { return false; }
        $("#searchClear").prop('disabled',false);
        $.ajax({
            type: "POST"
            ,url: "/api/v1/money/transactions/search"
            ,data: obj
        }).success(function(response) {
            $("#transactionTable").find("tbody").empty();
            // Current Transactions
            response.forEach(function(result) {
                var dp = false;
                var dateNow = new Date();
                var row;
                var tDateMoment = moment.utc(result.transactionDate);
                if (result.hasOwnProperty("future")) {
                    dp = true;
                    row = '<tr id="f_'+result.id+'"';
                    if (tDateMoment.isAfter(moment(),'days')) {
                        row += ' class="success"';
                    }
                    row += '><td><input size="10" class="datepicker form-control" data-tid="'+result.id+'" value="'+moment.utc(result.transactionDate).format("MM/DD/YYYY")+'" data-date-start-date="'+moment.utc(result.transactionDate).format("MM/DD/YYYY")+'" data-date-end-date="'+dateNow+'" id="post_'+result.id+'" style="color:#fff;" /></td>';
                } else {
                    row = '<tr id="'+result.id+'">'+
                        '<td>'+moment.utc(result.postDate).format("MM/DD/YYYY")+'</td>';
                }
                row += '<td name="transactionDate">'+
                    tDateMoment.format("MM/DD/YYYY")+
                    '</td>'+
                    '<td name="payee">';
                if (result.BillId !== null) {
                    row += '&nbsp;<i class="glyphicon glyphicon-repeat img-rounded trans-badge" title="Repeating Transaction"></i>';
                }
                row += result.payee+'</td>';
                if (result.description !== null) {
                    row += '<td name="description">';
                    if (result.xfer !== null) {
                        row += "[Transfer] ";
                    }
                    row += result.description+'</td>';
                } else {
                    row += '<td name="description">';
                    if (result.xfer !== null) {
                        row += "[Transfer]";
                    }
                    row += '</td>';
                }
                if (result.checkNumber !== null) {
                    row += '<td name="check">'+result.checkNumber+'</td>';
                } else {
                    row += '<td name="check"></td>';
                }

                if (result.amount !== null) {
                    if (result.amount > 0) {
                        row += '<td name="plus">'+result.amount.toFixed(2)+'</td><td name="minus"></td>';
                    } else {
                        row += '<td name="plus"></td><td name="minus">'+(Number(result.amount) * -1).toFixed(2)+'</td>';
                    }
                }
                if (result.Category !== null) {
                    row += '<td name="category">'+result.Category.name+'</td>';
                } else {
                    row += '<td name="category"></td>';
                }
                row += '<td name="balance"></td>';
                if (result.hasOwnProperty("future")) {
                    row += '<td>'+
                        '<button class="btn btn-primary btn-xs" title="Edit Transaction" onclick="editFTransaction(\''+result.id+'\');">'+
                        '<i class="glyphicon glyphicon-pencil"></i>'+
                        '</button>'+
                        '<button class="btn btn-danger btn-xs" title="Delete Transaction" onclick="deleteTransaction(\''+result.id+'\');">'+
                        '<i class="glyphicon glyphicon-remove"></i>'+
                        '</button>'+
                        '</td>';
                } else {
                    row += '<td>' +
                        '<button class="btn btn-primary btn-xs" title="Edit Account" onclick="editTransaction(\'' + result.id + '\');">' +
                        '<i class="glyphicon glyphicon-pencil"></i>' +
                        '</button>' +
                        '</td>';
                }
                row += '</tr>';
                if (result.description !== "gobble gobble") {
                    $("#transactionTable").find("tbody").append(row);
                }
                if (dp) {
                    $("#post_"+result.id).datepicker({
                        format: 'mm/dd/yyyy'
                        ,autoclose: true
                        ,todayHighlight: true
                    }).on("changeDate", function(e) {
                        sendCommit(Number(e.target.dataset["tid"]), e.target.value)
                    });
                }
            });
        }).error(function(jqXHR) {
            $("#infoModalBody").html("There was a problem.  Please try again.");
            $("#infoModal").modal("show");
            console.log(jqXHR);
        });
    }
});

$("#startXferBtn").click(function() {
    var currentAccount = $("#accountSelect").val();
    var $xferAccountsElem = $("#xferAccounts");
    $xferAccountsElem.empty();
    if ($("#xferAccountId").val() === "") {
        $xferAccountsElem.html('<option id="noAccountSelected" />');
    }
    $("#xferModal").modal("show");
    accountArray.forEach(function(account) {
        if (account.id !== Number(currentAccount)) {
            var option = '<option value="'+account.id+'"';
            if (Number($("#xferAccountId").val()) === account.id) {
                option += ' selected';
            }
            option += '>'+account.name+'</option>';
            $("#xferAccounts").append(option);
        }
    });
    $("#noXferBtn").click(function() {
        $("#noXferBtn").removeClass("btn-default").addClass("active btn-primary");
        $("#xferAccountId").val("");
        $("#xferAccounts").prepend('<option id="noAccountSelected" selected />');
    });
    $("#xferButton").click(function() {
        setXfer();
    });
});

$("#xferAccounts").change(function() {
    var val = $("#xferAccounts").val();
    if (val !== null) {
        $("#noAccountSelected").remove();
        $("#noXferBtn").removeClass("active btn-primary").addClass("btn-default");
        $("#xferAccountId").val(val);
    }
});

$("#xferModal").on("hidden.bs.modal", function() {
	$("#xferButton").off("click");
	$("#newPayee").focus();
});

// SOCKET IO //
socket.on("categoryAdded", function(/*category*/) {
    getCategories();
});

socket.on("connect", function() {
	});

socket.on("priceUpdated", function(update) {
    $("."+update.tick.toUpperCase()).css("background-color", "#F0EEA1").animate({backgroundColor: "#F5F5F5"}, 5000);
    var $valElem = $("."+update.tick.toUpperCase()+" td[name=value]");
    var $dChangeElem = $("."+update.tick.toUpperCase()+" td[name=dChange]");
    var $pChangeElem = $("."+update.tick.toUpperCase()+" td[name=pChange]");
    var quantity = $("."+update.tick.toUpperCase()+" td[name=quantity]").html();
    var origValue = $valElem.html();
    var origDChange = $dChangeElem.html();
    var basis = Number(origValue) - Number(origDChange);
    var newValue = Number(quantity) * Number(update.price);
    var newDChange = newValue - basis;
    var newPChange = (basis / newDChange) * 100;

    $("."+update.tick.toUpperCase()+" td[name=price]").html(Number(update.price).toFixed(2));
    $valElem.html(newValue.toFixed(2));
    $dChangeElem.html(newDChange.toFixed(2));
    $pChangeElem.html(newPChange.toFixed(2));

    if (newDChange > 0) {
        $dChangeElem.css("color", "green");
    } else if (newDChange < 0) {
        $dChangeElem.css("color", "red");
    } else {
        $dChangeElem.css("color", "black");
    }
    if (newPChange > 0) {
        $pChangeElem.css("color", "green");
    } else if (newPChange < 0) {
        $pChangeElem.css("color", "red");
    } else {
        $pChangeElem.css("color", "black");
    }

    var totalValue = 0;
    var totalBasis = Number($("#totalBasis").html());
    $.each($(".positionRow td[name=value]"), function() {
        totalValue += Number($(this).html());
    });
    $("#totalValue").html(totalValue.toFixed(2));
    var totalDChange = totalValue - totalBasis;
    var $totalDChangeElem = $("#totalDChange");
    $totalDChangeElem.html(totalDChange.toFixed(2));
    if (totalDChange > 0) {
        $totalDChangeElem.css("color", "green");
    } else if (totalDChange < 0) {
        $totalDChangeElem.css("color", "red");
    } else {
        $totalDChangeElem.css("color", "black");
    }
    var totalPChange = (totalDChange / totalBasis) * 100;
    var $totalPChangeElem = $("#totalPChange");
    $totalPChangeElem.html(totalPChange.toFixed(2));
    if (totalPChange > 0) {
        $totalPChangeElem.css("color", "green");
    } else if (totalPChange < 0) {
        $totalPChangeElem.css("color", "red");
    } else {
        $totalPChangeElem.css("color", "black");
    }
});

socket.on("tradeAdded", function(obj) {
    getInvestments($("#accountSelect").val(), obj.trade, obj.position, "add");
});

socket.on("transactionAdded", function(transId) {
		getTransactions(0, $("#transactionTable").find("tbody tr").length, transId);
	});

socket.on("transactionChanged", function(transId) {
	getTransactions(0, $("#transactionTable").find("tbody tr").length, transId);
});

socket.on("transactionCleared", function(id) {
    // console.log(id);
    $("#clr_"+id).attr("checked", true).attr("disabled", true);
});

socket.on("transactionDeleted", function(id) {
		// console.log(id);
		$("#"+id).animate({backgroundColor: "#C9302C"}, 400).fadeOut(300);
	});

socket.on("summaryAdded", function(newSummary) {
	// getPeriods($("#accountSelect").val());
});

// FUNCTIONS //
function addTransaction() {
    //Clear existing errors
    $(".newTrans").removeClass("error");
    var errors = 0;
    var $accountElem = $("#accountSelect");
    var $xferAccountElem = $("#xferAccountId");
    var $dateElem = $("#newTDate");
    var $payeeElem = $("#newPayee");
    var $descriptionElem = $("#newDescription");
    var $checkElem = $("#newCheck");
    var $depositElem = $("#newDeposit");
    var $withdrawlElem = $("#newWithdrawl");
    var $categoryElem = $("#newCategory");
    var nt = {};
    if (accountNames[$accountElem.val()].type !== "Investment") {
        //Get values
        nt = {
            account: $accountElem.val()
        };
        if ($xferAccountElem.val() !== "") {
            nt.xfer = $xferAccountElem.val();
        }
        if ($dateElem.val() !== "") {
            nt.tDate = $dateElem.val();
        }
        if ($payeeElem.val() !== "") {
            nt.payee = $payeeElem.val();
        }
        if ($descriptionElem.val() !== "") {
            nt.description = $descriptionElem.val();
        }
        if ($checkElem.val() !== "") {
            nt.check = $checkElem.val();
        }
        if ($depositElem.val() !== "") {
            nt.deposit = $depositElem.val();
        }
        if ($withdrawlElem.val() !== "") {
            nt.withdrawl = $withdrawlElem.val();
        }
        if ($categoryElem.val() !== "") {
            nt.category = $categoryElem.val();
            if ($categoryElem.val() === "1") {
            	nt.multiCat = JSON.stringify(multiCategoriesObj);
			}
        }


        // //Validation
        //Check format of transaction date
        if (!nt.tDate.match(/^\d{2}([./-])\d{2}\1\d{4}$/)) {
            $dateElem.addClass("error");
            errors++;
        }
        //Make sure something is in the payee field
        if (typeof nt.payee === "undefined") {
            $payeeElem.addClass("error");
            errors++;
        }
        //Make sure check number is an integer
        if (typeof nt.check !== "undefined") {
            if (!nt.check.match(/^\d+$/)) {
                $checkElem.addClass("error");
                errors++;
            }
        }
        //Deposit format
        if (typeof nt.deposit !== "undefined") {
            if (!nt.deposit.match(/(?=.)^\$?(([1-9][0-9]{0,2}(,[0-9]{3})*)|[0-9]+)?(\.[0-9]{1,2})?$/) || nt.deposit.length > 16) {
                $depositElem.addClass("error");
                errors++;
            }
        }
        //Withdrawl format
        if (typeof nt.withdrawl !== "undefined") {
            if (!nt.withdrawl.match(/(?=.)^\$?(([1-9][0-9]{0,2}(,[0-9]{3})*)|[0-9]+)?(\.[0-9]{1,2})?$/) || nt.withdrawl.length > 16) {
                $withdrawlElem.addClass("error");
                errors++;
            }
        }
        //Make sure deposit or withdrawl have a value, but not both
        if ((typeof nt.deposit !== "undefined" && typeof nt.withdrawl !== "undefined") || (typeof nt.deposit === "undefined" && typeof nt.withdrawl === "undefined")) {
            $depositElem.addClass("error");
            $withdrawlElem.addClass("error");
            errors++;
        }

        if (errors === 0) {
            if (nt.hasOwnProperty("deposit")) {
                nt.amount = nt.deposit * 1;
                delete nt.deposit;
            } else if (nt.hasOwnProperty("withdrawl")) {
                nt.amount = nt.withdrawl * -1;
                delete nt.withdrawl;
            }
            // if (moment(new Date(nt.tDate)) > moment()) {
            // console.log(nt);
            $.ajax({
                type: "POST"
                ,url: "/api/v1/money/futureTransactions"
                ,data: nt
            }).success(function(/*response*/) {
                // Sumbit xfer transaction, if applicable
                if ($xferAccountElem.val() !== "") {
                    var xt = {
                        account: $xferAccountElem.val()
                        ,tDate: nt.tDate
                        ,payee: accountNames[nt.account].name
                        ,amount: (nt.amount * -1)
                        ,xfer: $accountElem.val()
                    };
                    if (nt.hasOwnProperty("check")) {
                        xt.check = nt.check;
                    }
                    if (nt.hasOwnProperty("description")) {
                        xt.description = nt.description;
                    }
                    $.ajax({
                        type: "POST"
                        ,url: "/api/v1/money/futureTransactions"
                        ,data: xt
                    })
                        .success(function(/*xferResponse*/) {
                            resetAddTransaction();
                            return false;
                        })
                        .error(function(/*jqXHR, textStatus, errorThrown*/) {
                            $("#infoModalBody").html("There was a problem adding the transfer transaction.  Please add it manually.");
                            $("#infoModal").modal("show");
                            resetAddTransaction();
                            return false;
                        });
                } else {
                    resetAddTransaction();
                    return false;
                }
            }).error(function(/*jqXHR, textStatus, errorThrown*/) {
                $("#infoModalBody").html("There was a problem adding the transaction.  Please try again.");
                $("#infoModal").modal("show");
                return false;
            });
        }
    } else {
        nt = {
            account: $accountElem.val()
        };
        if ($dateElem.val() !== "") {
            nt.tDate = $dateElem.val();
        }
        if ($payeeElem.val() !== "") {
            nt.ticker = $payeeElem.val().toUpperCase();
        }
        if ($descriptionElem.val() !== "") {
            nt.description = $descriptionElem.val();
        }
        if ($depositElem.val() !== "") {
            nt.quantity = $depositElem.val();
        }
        if ($withdrawlElem.val() !== "") {
            nt.price = $withdrawlElem.val();
        }

        // //Validation
        //Check format of transaction date
        if (!nt.tDate.match(/^\d{2}([./-])\d{2}\1\d{4}$/)) {
            $dateElem.addClass("error");
            errors++;
        }
        //Make sure something is in the ticker field and is less than 10 characters
        if (typeof nt.ticker === "undefined") {
            $payeeElem.addClass("error");
            errors++;
        } else {
            if (nt.ticker.length > 15) {
                $payeeElem.addClass("error");
                errors++;
            }
        }
        //Make sure quantity has a value
        if (typeof nt.quantity === "undefined") {
            $depositElem.addClass("error");
            errors++;
        }
        //Make sure price has a value
        if (typeof nt.price === "undefined") {
            $withdrawlElem.addClass("error");
            errors++;
        }
        //Quantity format
        if (typeof nt.quantity !== "undefined") {
            if (!nt.quantity.match(/(?=.)^\$?-?(([1-9][0-9]{0,2}(,[0-9]{3})*)|[0-9]+)?(\.[0-9]{1,3})?$/) || nt.quantity.length > 16) {
                $depositElem.addClass("error");
                errors++;
            }
        }
        //Price format
        if (typeof nt.price !== "undefined") {
            if (!nt.price.match(/(?=.)^\$?(([1-9][0-9]{0,2}(,[0-9]{3})*)|[0-9]+)?(\.[0-9]{1,3})?$/) || nt.price.length > 16) {
                $withdrawlElem.addClass("error");
                errors++;
            }
        }

        if (errors === 0) {
            $.ajax({
                type: "POST"
                ,url: "/api/v1/money/trades"
                ,data: nt
            })
                .success(function(/*response*/) {
                    resetAddTransaction();
                    return false;
                })
                .error(function(/*jqXHR, textStatus, errorThrown*/) {
                    $("#infoModalBody").html("There was a problem adding the trade.  Please try again.");
                    $("#infoModal").modal("show");
                    return false;
                });
        }
    }
    return false;
}

function clearSearch() {
	$("#searchField").val("");
	$("#searchClear").prop('disabled',true);
}

function deleteTransaction(id) {
    var name = $("#f_"+id+" td[name=payee]").html();
    $("#deleteTransactionId").val(id);
    $("#deleteModalBody").html("<strong>Are you sure you want to delete the transaction for "+name+"?</strong>");
    $("#deleteTransactionModal").modal("show");
    return false;
}

function editFTransaction(id) {
    $("#editFutureTransactionId").val(id);
    $("#editFTDate").datepicker('setDate', new Date($("#f_"+id+" td[name=transactionDate]").text()));
    $("#editFPayee").val($("#f_"+id+" td[name=payee]").text().trim());
    $("#editFDescription").val($("#f_"+id+" td[name=description]").text().trim());
    $("#editFCheck").val($("#f_"+id+" td[name=check]").html());
    $("#editFDeposit").val($("#f_"+id+" td[name=plus]").html());
    $("#editFWithdrawl").val($("#f_"+id+" td[name=minus]").html());
    var $catElem = $("#editFCategory");
    var catLabel = $("#f_"+id+" td[name=category]").html();
    $catElem.prop("disabled",false);
    $catElem.append("<option />");
    for (var i = 0; i < categoryArray.length; i++) {
        var html = '<option value="'+categoryArray[i].id+'"';
        if (catLabel === categoryArray[i].name) {
            html += " selected";
        }
        html += '>'+categoryArray[i].name+'</option>';
        $catElem.append(html);
    }
    if (catLabel === "-Multiple-") {
        $catElem.prop("disabled",true);
    }
    $("#editFutureTransactionModal").modal("show");
}

function editTransaction(id) {
    $("#editTransactionId").val(id);
    $("#editPayee").val($("#"+id+" td[name=payee]").text().trim());
    $("#editDescription").val($("#"+id+" td[name=description]").text().trim());
    $("#editCheck").val($("#"+id+" td[name=check]").html());
    var $catElem = $("#editCategory");
    var $catLabel = $("#"+id+" td[name=category]");
    $catElem.append("<option />");
    for (var i = 0; i < categoryArray.length; i++) {
        var html = '<option value="'+categoryArray[i].id+'"';
        if ($catLabel.html() === categoryArray[i].name) {
            html += " selected";
        }
        html += '>'+categoryArray[i].name+'</option>';
        $catElem.append(html);
    }
    if ($catLabel.html() === "-Multiple-") {
        $catElem.prop("disabled",true);
    }
    $("#editTransactionModal").modal("show");
}

function getAccounts() {
    $.ajax({
        type: "GET"
        ,url: "/api/v1/money/accounts"
    })
        .success(function(response) {
            var jq_accountSelect = $("#accountSelect");
            $("#addTransaction").prop("disabled", false);
            accountArray = response;
            jq_accountSelect.empty();
            if (response.length === 1) {
                $("#startXferBtn").prop("disabled", true);
            }
            response.forEach(function(account) {
                accountNames[account.id] = {name: account.name, type: account.type};
                if (typeof QueryString["acct"] !== "undefined") {
                    if (account.id === Number(QueryString["acct"])) {
                        jq_accountSelect.append('<option value="'+account.id+'" selected>'+account.name+'</option>');
                    } else {
                        jq_accountSelect.append('<option value="'+account.id+'">'+account.name+'</option>');
                    }
                } else {
                    if (account.default === true) {
                        jq_accountSelect.append('<option value="'+account.id+'" selected>'+account.name+'</option>');
                    } else {
                        jq_accountSelect.append('<option value="'+account.id+'">'+account.name+'</option>');
                    }
                }
            });
            if (accountNames[jq_accountSelect.val()].type === "Investment") {
                getInvestments(jq_accountSelect.val(), null, null);
            } else {
                getTransactions(null, null);
                // getPeriods($("#accountSelect").val());
            }
        })
        .error(function(jqXHR) {
            if (jqXHR.status === 404) {
                $("#addTransaction").prop("disabled", true);
                return false;
            } else {
                $("#addTransaction").prop("disabled", true);
                $("#infoModalBody").html("There was a problem.  Please try again.");
                $("#infoModal").modal("show");
            }
        });
}

function getBills() {
	$.ajax({
		type: "GET"
		,url: "/api/v1/money/post/bills/"+$("#accountSelect").val()
	});
}

function getCategories() {
    $.ajax({
        type: "GET"
        ,url: "/api/v1/money/categories"
    })
        .success(function(response) {
            categoryArray = response;
            $("#newCategory").html('<option id="defaultCategory" />');
            response.forEach(function(category) {
                $("#newCategory").append('<option value="'+category.id+'">'+category.name+'</option>');
            });
        })
        .error(function(jqXHR) {
            if (jqXHR.status === 404) {
                return false;
            } else {
                $("#infoModalBody").html("There was a problem retrieving Categories.  Please try again.");
                $("#infoModal").modal("show");
            }
        });
}

function getInvestments(id, tradeId, positionId, type) {
    setupTable();
    $("#searchDiv").hide();
    $.ajax({
        type: "GET"
        ,url: "/api/v1/money/investments/"+id
    })
        .success(function(response, textStatus, jqXHR) {
            var $positionSectionElem = $("#positionSection");
            var $tableElem = $("#transactionTable");
            $positionSectionElem.empty();
            $tableElem.find("tbody").empty();
            if (jqXHR.status !== 204) {
                if (response.trades.length > 0) {
                    var costs = {};
                    response.trades.forEach(function(trade, index) {
                        if (trade.description !== "Employer Match") {
                            if (costs.hasOwnProperty(trade.ticker)) {
                                costs[trade.ticker] = costs[trade.ticker] + (Number(trade.quantity) * Number(trade.price));
                            } else {
                                costs[trade.ticker] = (Number(trade.quantity) * Number(trade.price));
                            }
                        }
                        var row = '<tr class="transRow" id="trade_'+trade.id+'"';
                        if (index >= transactionLimit) { row += ' style="display:none;"'; }
                        row += '>'+
                            '<td>'+moment.utc(trade.transactionDate).format("MM/DD/YYYY")+'</td>';
                        row += '<td>'+trade.ticker+'</td>';
                        if (trade.description !== null) {
                            row += '<td>'+trade.description+'</td>';
                        } else {
                            row += '<td></td>';
                        }
                        row += '<td>'+trade.quantity.toFixed(3)+'</td>'+
                            '<td>'+trade.price.toFixed(3)+'</td>'+
                            '<td>'+(Number(trade.quantity) * Number(trade.price)).toFixed(2)+'</td>'+
                            '</tr>';
                        $tableElem.find("tbody").append(row);
                    });
                    if ($(".transRow:visible").length !== $(".transRow").length) {
                        var moreRow = '<tr id="moreRow" style="text-align:center;">'+
                            '<td colspan="6">'+
                            '<a onclick="getMoreInvestments();">'+
                            'More&nbsp;<i class="glyphicon glyphicon-chevron-down"></i>'+
                            '</a>'+
                            '</td>'+
                            '</tr>';
                    }
                    $tableElem.find("tbody").append(moreRow);
                    if (type !== null) {
                        tradeHighlight(tradeId, "trade");
                    }
                }
                if (response.positions.length > 0) {
                    var totalBasis = 0;
                    var totalValue = 0;
                    var table = '<div class="well"><table class="table table-condensed">'+
                        '<thead>'+
                        '<tr>'+
                        '<th>Ticker</th>'+
                        '<th>Name</th>'+
                        '<th>Quantity</th>'+
                        '<th>Current Price</th>'+
                        '<th>Basis</th>'+
                        '<th>Value</th>'+
                        '<th>+/- $</th>'+
                        '<th>+/- %</th>'+
                        '</tr>'+
                        '</thead>'+
                        '<tbody>';
                    response.positions.forEach(function(position) {
                        if (position.ticker.toUpperCase() !== "CASH") {
                            if (moment.utc(position.updatedAt).dayOfYear() !== moment.utc().dayOfYear()) {
                                $.ajax({
                                    type: "GET"
                                    ,url: "/api/v1/money/positions/update/"+position.ticker
                                });
                            }
                        }
                        var value = (Number(position.quantity) * Number(position.currentPrice));
                        var cost = costs[position.ticker];
                        var dollarChange = value - cost;
                        var percentChange = (dollarChange / cost) * 100;
                        totalBasis += cost;
                        totalValue += value;
                        var row = '<tr id="position_'+position.id+'" class="'+position.ticker.toUpperCase()+' positionRow"';
                        row += '>'+
                            '<td name="ticker">'+position.ticker+'</td>'+
                            '<td name="name">'+position.name+'</td>'+
                            '<td name="quantity">'+position.quantity+'</td>'+
                            '<td name="price">'+position.currentPrice+'</td>';
                        if (typeof(cost) !== "undefined") {
                            row += '<td name="basis">'+cost.toFixed(2)+'</td>';
                        }
                        row += '<td name="value">'+value.toFixed(2)+'</td>'+
                            '<td name="dChange"';
                        if (dollarChange > 0) {
                            row += ' style="color:green;"'
                        } else if (dollarChange < 0) {
                            row += ' style="color:red;"'
                        }
                        row += '>'+dollarChange.toFixed(2)+'</td>'+
                            '<td name="pChange"';
                        if (percentChange > 0) {
                            row += ' style="color:green;"'
                        } else if (percentChange < 0) {
                            row += ' style="color:red;"'
                        }
                        row += '>'+percentChange.toFixed(2)+'</td>'+
                            '</tr>';
                        table += row;
                    });
                    table += '<tr>'+
                        '<td colspan="4"></td>'+
                        '<td id="totalBasis" style="font-weight: bold;">'+totalBasis.toFixed(2)+'</td>'+
                        '<td id="totalValue" style="font-weight: bold;">'+totalValue.toFixed(2)+'</td>'+
                        '<td id="totalDChange" style="font-weight: bold;';
                    var totalDollarChange = totalValue - totalBasis;
                    if (totalDollarChange > 0) {
                        table += 'color:green;'
                    } else if (totalDollarChange < 0) {
                        table += 'color:red;'
                    }
                    table += '">'+totalDollarChange.toFixed(2)+'</td>'+
                        '<td id="totalPChange" style="font-weight: bold;';
                    var totalPercentChange = (totalDollarChange / totalBasis) * 100;
                    if (totalPercentChange > 0) {
                        table += 'color:green;'
                    } else if (totalPercentChange < 0) {
                        table += 'color:red;'
                    }
                    table += '">'+totalPercentChange.toFixed(2)+'</td>'+
                        '</tr></tbody></table></div>';
                    $positionSectionElem.html(table);
                    if (type !== null) {
                        tradeHighlight(positionId, "position");
                    }
                }
            }
        })
        .error(function(jqXHR/*, textStatus, errorThrown*/) {
            if (jqXHR.status === 404) {
                return false;
            } else {
                $("#infoModalBody").html("There was a problem.  Please try again.");
                $("#infoModal").modal("show");
            }
        });
}

function getTransactions(offset, limit, transId) {
    var $tableElem = $("#transactionTable");
    $("#searchDiv").show();
    clearSearch();
    setupTable();
    if (offset === null) { offset = 0; }
    if (limit === null || limit <= transactionLimit) {
        limit = transactionLimit;
    }
    $.ajax({
        type: "GET"
        ,url: "/api/v1/money/transactions/account/"+$("#accountSelect").val()+"/"+offset+"/"+limit
    })
        .success(function(response) {
            // console.log(response);
            $tableElem.find("tbody").empty();
            // var balance = Number(response.cTrans[0].Summary.balance);
            var balance = 0;
            var initialBalance = 0;
            for (var i = 0; i < response.cTrans.length; i++) {
                if (!response.cTrans[i].future) {
                    if (response.cTrans[i].postDate !== null) {
                        if (response.cTrans[i].hasOwnProperty("Summary")) {
                            balance = Number(response.cTrans[i].Summary.balance);
                            initialBalance = Number(response.cTrans[i].Summary.balance);
                            break;
                        }
                    }
                }
            }
            // console.log(initialBalance);
            balance += Number(response.adjust);

            // Current Transactions
            response.cTrans.forEach(function(result) {
                var dp = false;
                var dateNow = new Date();
                var row;
                var tDateMoment = moment.utc(result.transactionDate);
                if (result.hasOwnProperty("future")) {
                    dp = true;
                    row = '<tr id="f_'+result.id+'"';
                    if (tDateMoment.isAfter(moment(),'days')) {
                        row += ' class="success"';
                    }
                    row += '><td><input size="10" class="datepicker form-control" data-tid="'+result.id+'" value="'+moment.utc(result.transactionDate).format("MM/DD/YYYY")+'" data-date-start-date="'+moment.utc(result.transactionDate).format("MM/DD/YYYY")+'" data-date-end-date="'+dateNow+'" id="post_'+result.id+'" style="color:#fff;" /></td>';
                } else {
                    row = '<tr id="'+result.id+'">'+
                        '<td>'+moment.utc(result.postDate).format("MM/DD/YYYY")+'</td>';
                }
                row += '<td name="transactionDate">'+
                    tDateMoment.format("MM/DD/YYYY")+
                    '</td>'+
                    '<td name="payee">';
                if (result.BillId !== null) {
                    row += '&nbsp;<i class="glyphicon glyphicon-repeat img-rounded trans-badge" title="Repeating Transaction"></i>';
                }
                if (result.Bill !== null) {
                    if (result.Bill.automatic) {
                        row += '&nbsp;<i class="glyphicon glyphicon-flash img-rounded trans-badge" title="Automatic Payment"></i>';
                    }
                }
                row += result.payee+'</td>';
                if (result.description !== null) {
                    row += '<td name="description">';
                    if (result.xfer !== null) {
                        row += "[Transfer] ";
                    }
                    row += result.description+'</td>';
                } else {
                    row += '<td name="description">';
                    if (result.xfer !== null) {
                        row += "[Transfer]";
                    }
                    row += '</td>';
                }
                if (result.checkNumber !== null) {
                    row += '<td name="check">'+result.checkNumber+'</td>';
                } else {
                    row += '<td name="check"></td>';
                }

                if (result.amount !== null) {
                    if (result.amount > 0) {
                        row += '<td name="plus">'+result.amount.toFixed(2)+'</td><td name="minus"></td>';
                    } else {
                        row += '<td name="plus"></td><td name="minus">'+(Number(result.amount) * -1).toFixed(2)+'</td>';
                    }
                }
                if (result.Category !== null) {
                    row += '<td name="category" id="cat_'+result.id+'" data-toggle="tooltip" data-html="true" data-container="body" data-placement="bottom">'+result.Category.name+'</td>';
                    if (result.Category.id === 1) {
                        $.ajax({
                            type: "GET"
                            ,url: "/api/v1/money/categorySplit/"+result.id
                        }).success(function(catSplit) {
                            // console.log(catSplit);
                            if (catSplit) {
                                var titleArr = [];
                                JSON.parse(catSplit).forEach(function(cat) {
                                    titleArr.push(cat.name + ": " + cat.value.toFixed(2));
                                });
                                // console.log($("#"+result.id+"[name='category']"));
                                $("#cat_"+result.id).prop("title",titleArr.join("<br />")).tooltip();
                                // $("#cat_"+result.id);
                            }
                        });
                    }
                } else {
                    row += '<td name="category"></td>';
                }
                row += '<td name="balance">'+balance.toFixed(2)+'</td>';
                if (result.hasOwnProperty("future")) {
                    row += '<td>'+
                        '<button class="btn btn-primary btn-xs" title="Edit Transaction" onclick="editFTransaction(\''+result.id+'\');">'+
                        '<i class="glyphicon glyphicon-pencil"></i>'+
                        '</button>'+
                        // '<button class="btn btn-success btn-xs" title="Commit Transaction" onclick="commitFTransaction(\''+result.id+'\');">'+
                        // 	'<i class="glyphicon glyphicon-plus"></i>'+
                        // '</button>'+
                        '<button class="btn btn-danger btn-xs" title="Delete Transaction" onclick="deleteTransaction(\''+result.id+'\');">'+
                        '<i class="glyphicon glyphicon-remove"></i>'+
                        '</button>'+
                        '</td>';
                } else {
                    row += '<td>' +
                        '<button class="btn btn-primary btn-xs" title="Edit Account" onclick="editTransaction(\'' + result.id + '\');">' +
                        '<i class="glyphicon glyphicon-pencil"></i>' +
                        '</button>' +
                        '</td>';
                }
                row += '</tr>';
                if (result.description !== "gobble gobble") {
                    $("#transactionTable").find("tbody").append(row);
                }
                if (dp) {
                    $("#post_"+result.id).datepicker({
                        format: 'mm/dd/yyyy'
                        ,autoclose: true
                        ,todayHighlight: true
                    }).on("changeDate", function(e) {
                        // postTransaction(Number(e.target.dataset.tid), e.target.value);
                        sendCommit(Number(e.target.dataset["tid"]), e.target.value)
                        // console.log({id: Number(e.target.dataset.tid), value: e.target.value});
                    });
                }
                balance -= result.amount;
            });
            // console.log(response.cTrans.length);
            if (response.cTrans.length >= transactionLimit) {
                var moreRow = '<tr id="moreRow" style="text-align:center;">'+
                    '<td colspan="9">'+
                    '<a onclick="getMoreTransactions('+balance+','+transactionLimit+','+transactionLimit+');">'+
                    'More&nbsp;<i class="glyphicon glyphicon-chevron-down"></i>'+
                    '</a>'+
                    '</td>'+
                    '</tr>';
                $tableElem.find("tbody").append(moreRow);
            }
            if (transId !== null) {
                transactionHighlight(transId);
            }
            getBills();
        })
        .error(function(jqXHR/*, textStatus, errorThrown*/) {
            if (jqXHR.status === 404) {
                return false;
            } else {
                $("#infoModalBody").html("There was a problem.  Please try again.");
                $("#infoModal").modal("show");
            }
        });
}

function getMoreInvestments() {
    $("#moreRow").remove();
    var visible = $(".transRow:visible").length;
    var $tableElem = $("#transactionTable");
    $tableElem.find("tbody tr:lt("+(visible + transactionLimit)+")").show();
    if (visible !== $(".transRow").length) {
        var moreRow = '<tr id="moreRow" style="text-align:center;">'+
            '<td colspan="6">'+
            '<a onclick="getMoreInvestments('+visible+');">'+
            'More&nbsp;<i class="glyphicon glyphicon-chevron-down"></i>'+
            '</a>'+
            '</td>'+
            '</tr>';
        $tableElem.find("tbody").append(moreRow);
    }
}

function getMoreTransactions(balance, offset, limit) {
    // setupTable();
    // if (offset === null) { offset = 0; }
    // if (limit === null) { limit = 10; }
    var $tableElem = $("#transactionTable");
    $.ajax({
        type: "GET"
        ,url: "/api/v1/money/transactions/more/account/"+$("#accountSelect").val()+"/"+offset+"/"+limit
    })
        .success(function(response) {
            $("#moreRow").remove();
            // console.log(response);
            // $("#transactionTable tbody").empty();
            // var balance = Number(response[0].Summary.balance);

            response.cTrans.forEach(function(result) {
                if (!result.hasOwnProperty("future")) {
                    var row = '<tr id="'+result.id+'">'+
                        '<td>';
                    if (result.postDate !== null) {
                        row += moment.utc(result.postDate).format("MM/DD/YYYY");
                    }
                    // '<input id="clr_'+result.id+'" type="checkbox" onclick="clearTransaction('+result.id+');"';
                    // if (result.cleared === true) {
                    // 	row += 'checked disabled';
                    // }
                    // row += '></input>'+
                    row += '</td>'+
                        '<td name="transactionDate">'+moment.utc(result.transactionDate).format("MM/DD/YYYY")+'</td>'+
                        '<td name="payee">'+result.payee+'</td>';
                    if (result.description !== null) {
                        row += '<td name="description">';
                        if (result.xfer !== null) {
                            row += "[Transfer] ";
                        }
                        row += result.description+'</td>';
                    } else {
                        row += '<td name="description">';
                        if (result.xfer !== null) {
                            row += "[Transfer]";
                        }
                        row += '</td>';
                    }
                    if (result.checkNumber !== null) {
                        row += '<td name="check">'+result.checkNumber+'</td>';
                    } else {
                        row += '<td name="check"></td>';
                    }

                    if (result.amount !== null) {
                        if (result.amount > 0) {
                            row += '<td name="plus">'+result.amount.toFixed(2)+'</td><td name="minus"></td>';
                        } else {
                            row += '<td name="plus"></td><td name="minus">'+(Number(result.amount) * -1).toFixed(2)+'</td>';
                        }
                    }
                    if (result.Category !== null) {
                        row += '<td name="category">'+result.Category.name+'</td>';
                    } else {
                        row += '<td name="category"></td>';
                    }
                    row += '<td name="balance">'+balance.toFixed(2)+'</td>';
                    row += '<td>'+
                        '<button class="btn btn-primary btn-xs" title="Edit Account" onclick="editTransaction(\''+result.id+'\');">'+
                        '<i class="glyphicon glyphicon-pencil"></i>'+
                        '</button>'+
                        '</td>'+
                        '</tr>';
                    $tableElem.find("tbody").append(row);
                    balance -= result.amount;
                }
            });
            if (response.cTrans.length >= transactionLimit) {
                var moreRow = '<tr id="moreRow" style="text-align:center;">'+
                    '<td colspan="9">'+
                    '<a onclick="getMoreTransactions('+balance+','+(offset+transactionLimit)+','+transactionLimit+');">'+
                    'More&nbsp;<i class="glyphicon glyphicon-chevron-down"></i>'+
                    '</a>'+
                    '</td>'+
                    '</tr>';
                $tableElem.find("tbody").append(moreRow);
            }
            // if (type !== null) {
            // 	transactionHighlight(transId);
            // }
        })
        .error(function(jqXHR/*, textStatus, errorThrown*/) {
            if (jqXHR.status === 404) {
                $("#moreRow").remove();
                return false;
            } else {
                $("#infoModalBody").html("There was a problem.  Please try again.");
                $("#infoModal").modal("show");
            }
        });
}

function initiateMultiCategory() {
    var amount = 0.00;
    var filteredList = _.filter(categoryArray, function(obj) { return Number(obj.id) !== 1; });
    var midpoint = Math.ceil(((filteredList.length - 1)/2));
    var $depositElem = $("#newDeposit");
    if ($depositElem.val() !== "") {
    	amount = Number($depositElem.val());
	} else if ($("#newWithdrawl").val() !== "") {
    	amount = Number($("#newWithdrawl").val());
	}
	var body = '<table><thead><tr><th style="padding: 5px;">Unassigned Amount</th><th id="transAmount" style="padding: 5px;">'+amount.toFixed(2)+'</th>'+
        '<th style="padding: 5px;">Discount</th><th style="padding: 5px;"><div class="input-group">'+
        '<input type="number" class="form-control" min="0" max="100" step="1" id="multiCatDiscount" />'+
        '<span class="input-group-addon">%</span></div></th></tr></thead><tbody>';
    for (var i=0; i<midpoint; i++) {
        var left = i;
        var right = i+midpoint;
        body += '<tr>'+
            '<td style="padding: 5px;">' + filteredList[left].name + '</td><td style="padding: 5px;">'+
            '<input type="number" class="form-control currency multiCatValue" min="0" max="1000000" step="0.01" data-number-to-fixed="2" data-number-stepfactor="100" id="multiCat_' + filteredList[left].id + '_'+ filteredList[left].name +'" />'+
            '</td><td style="padding: 5px;">';
        if (right <= (filteredList.length+1)) {
            body += filteredList[right].name + '</td><td style="padding: 5px;">'+
            '<input type="number" class="form-control currency multiCatValue" min="0" max="1000000" step="0.01" data-number-to-fixed="2" data-number-stepfactor="100" id="multiCat_' + filteredList[right].id + '_'+ filteredList[right].name +'" />';
        }
        body += '</td>'+
            '</tr>';
    }
    body += "</tbody></table>";
    $("#multiCategoryModalBody").html(body);
    $(".multiCatValue").change(function() {calc();});
    $("#multiCatDiscount").change(function() {
        var val = $("#multiCatDiscount");
        if (!val.val() || Number(val.val()) < 0) {
            val.val(0);
        } else if (Number(val.val()) > 100) {
            val.val(100);
        }
        calc();
    });

    function calc() {
        var $amountElem = $("#transAmount");
        $amountElem.removeClass("error");
        var $completeButtonElem = $("#completeMultiCategoryButton");
        $completeButtonElem.prop("disabled",false);
        var discount = (100 - $("#multiCatDiscount").val()) * 0.01;
        var assignedAmount = 0;
        $(".multiCatValue").each(function(i,elem) {
            if (elem["valueAsNumber"]) {
                assignedAmount += elem["valueAsNumber"];
            }
        });
        var newAmount = amount - (assignedAmount * discount);
        $amountElem.html(newAmount.toFixed(2));
        if (newAmount < 0) {
            $amountElem.addClass("error");
            $completeButtonElem.prop("disabled",true);
        }
    }

    $("#multiCategoryModal").modal("show");
}

function modifyFTransaction() {
    var id = $("#editFutureTransactionId").val();

    //Clear existing errors
    var errors = 0;
    $(".editFTrans").removeClass("error");

    //Get values
    var et = {};
    var $dateElem = $("#editFTDate");
    var $payeeElem = $("#editFPayee");
    var $descriptionElem = $("#editFDescription");
    var $checkElem = $("#editFCheck");
    var $depositElem = $("#editFDeposit");
    var $withdrawlElem = $("#editFWithdrawl");
    var $categoryElem = $("#editFCategory");
    if ($dateElem.val() !== "") {
        et.tDate = $dateElem.val();
    }
    if ($payeeElem.val() !== "") {
        et.payee = $payeeElem.val();
    }
    if ($descriptionElem.val() !== "") {
        et.description = $descriptionElem.val();
    }
    if ($checkElem.val() !== "") {
        et.check = $checkElem.val();
    }
    if ($depositElem.val() !== "") {
        et.deposit = $depositElem.val();
    }
    if ($withdrawlElem.val() !== "") {
        et.withdrawl = $withdrawlElem.val();
    }
    if ($categoryElem.val() !== "") {
        et.category = $categoryElem.val();
    }

    // //Validation
    //Check format of transaction date
    if (!et.tDate.match(/^\d{2}([./-])\d{2}\1\d{4}$/)) {
        $dateElem.addClass("error");
        errors++;
    }
    //Make sure something is in the payee field
    if (typeof et.payee === "undefined") {
        $payeeElem.addClass("error");
        errors++;
    }
    //Make sure check number is an integer
    if (typeof et.check !== "undefined") {
        if (!et.check.match(/^\d+$/)) {
            $checkElem.addClass("error");
            errors++;
        }
    }
    //Deposit format
    if (typeof et.deposit !== "undefined") {
        if (!et.deposit.match(/(?=.)^\$?(([1-9][0-9]{0,2}(,[0-9]{3})*)|[0-9]+)?(\.[0-9]{1,2})?$/) || et.deposit.length > 16) {
            $depositElem.addClass("error");
            errors++;
        }
    }
    //Withdrawl format
    if (typeof et.withdrawl !== "undefined") {
        if (!et.withdrawl.match(/(?=.)^\$?(([1-9][0-9]{0,2}(,[0-9]{3})*)|[0-9]+)?(\.[0-9]{1,2})?$/) || et.withdrawl.length > 16) {
            $withdrawlElem.addClass("error");
            errors++;
        }
    }
    //Make sure deposit or withdrawl have a value, but not both
    if ((typeof et.deposit !== "undefined" && typeof et.withdrawl !== "undefined") || (typeof et.deposit === "undefined" && typeof et.withdrawl === "undefined")) {
        $depositElem.addClass("error");
        $withdrawlElem.addClass("error");
        errors++;
    }

    if (errors === 0) {
        $("#editFutureTransactionModal").modal("hide");
        if (et.hasOwnProperty("deposit")) {
            et.amount = et.deposit * 1;
            delete et.deposit;
        } else if (et.hasOwnProperty("withdrawl")) {
            et.amount = et.withdrawl * -1;
            delete et.withdrawl;
        }
        $.ajax({
            type: "PUT"
            ,url: "/api/v1/money/futureTransactions/"+id
            ,data: et
        })
            .success(function(/*response*/) {
                // console.log("success!");
                return false;
            })
            .error(function(/*jqXHR, textStatus, errorThrown*/) {
                $("#infoModalBody").html("There was a problem.  Please try again.");
                $("#infoModal").modal("show");
            });
    }
    return false;
}

function modifyTransaction() {
    var id = $("#editTransactionId").val();
    var $payeeElem = $("#editPayee");
    var $descriptionElem = $("#editDescription");
    var $checkElem = $("#editCheck");
    var $categoryElem = $("#editCategory");

    //Clear existing errors
    var errors = 0;
    $(".editTrans").removeClass("error");

    //Get values
    var et = {};
    if ($payeeElem.val() !== "") {
        et.payee = $payeeElem.val().trim();
    }
    if ($descriptionElem.val() !== "") {
        et.description = $descriptionElem.val();
    }
    if ($checkElem.val() !== "") {
        et.check = $checkElem.val();
    }
    if ($categoryElem.val() !== "") {
        et.category = $categoryElem.val();
    }

    // //Validation
    //Make sure something is in the payee field
    if (typeof et.payee === "undefined") {
        $payeeElem.addClass("error");
        errors++;
    }
    //Make sure check number is an integer
    if (typeof et.check !== "undefined") {
        if (!et.check.match(/^\d+$/)) {
            $checkElem.addClass("error");
            errors++;
        }
    }

    if (errors === 0) {
        $("#editTransactionModal").modal("hide");
        $.ajax({
            type: "PUT"
            ,url: "/api/v1/money/transactions/"+id
            ,data: et
        })
            .success(function(/*response*/) {
                // console.log("success!");
                return false;
            })
            .error(function(/*jqXHR, textStatus, errorThrown*/) {
                $("#infoModalBody").html("There was a problem.  Please try again.");
                $("#infoModal").modal("show");
            });
    }
    return false;
}

function removeTransaction() {
    var id = $("#deleteTransactionId").val();
    $("#deleteTransactionModal").modal("hide");
    if (typeof id !== "undefined" && id.length > 0) {
        $.ajax({
            type: "DELETE"
            ,url: "/api/v1/money/futureTransactions/"+id
        })
            .success(function() {
                return false;
            })
            .error(function(/*jqXHR, textStatus, errorThrown*/) {
                $("#infoModalBody").html("There was a problem.  Please try again.");
                $("#infoModal").modal("show");
            });
    }
    return false;
}

function resetAddTransaction() {
    $("#newTDate").datepicker('update', new Date());
    $("#newPayee").val("");
    $("#newDescription").val("");
    $("#newCheck").val("");
    $("#newDeposit").val("");
    $("#newWithdrawl").val("");
    $("#newCategory").val("");
    $("#xferAccountId").val("");
    $("#startXferBtn").removeClass("btn-primary active").addClass("btn-default");
    $("#noXferBtn").removeClass("btn-default").addClass("active btn-primary");
}

function sendCommit(rid, pdate) {
    // console.log(rid);
    // console.log(pdate);
    // var id = $("#commitFutureTransactionId").val();
    // $("#commitFutureTransactionModal").modal("hide");
    $.ajax({
        type: "PUT"
        ,url: "/api/v1/money/futureTransaction/commit/"+rid
        ,data: {
            pDate: pdate
        }
    }).success(function(/*response*/) {
        // console.log(response);
    }).error(function(/*jqXHR, textStatus, errorThrown*/) {
        $("#infoModalBody").html("There was a problem.  Please try again.");
        $("#infoModal").modal("show");
    });
}

function setupTable() {
	$("#positionSection").empty();
	var $payeeElems = $(".payeeHeader");
	var $plusElems = $(".plusHeader");
	var $minusElems = $(".minusHeader");
	var $balanceElems = $(".balanceHeader");
	var $depositElem = $("#newDeposit");
	var $withdrawlElem = $("#newWithdrawl");
	var $zuluElems = $(".zulu");
	var $periodElem = $("#periodSelect");
	switch (accountNames[$("#accountSelect").val()].type) {
		case "Checking":
		case "Savings":
            $payeeElems.html("Payee");
            $plusElems.html("Deposit");
            $minusElems.html("Withdrawl");
            $balanceElems.html("Balance");
            $depositElem.prop("step", "0.01");
            $withdrawlElem.prop("step", "0.01");
            $zuluElems.show();
            $periodElem.show();
			break;
		case "Credit Card":
            $payeeElems.html("Payee");
            $plusElems.html("Payment");
            $minusElems.html("Purchase");
            $balanceElems.html("Balance");
            $depositElem.prop("step", "0.01");
            $withdrawlElem.prop("step", "0.01");
            $zuluElems.show();
            $periodElem.show();
			break;
		case "Investment":
            $payeeElems.html("Ticker");
            $plusElems.html("Quantity");
            $minusElems.html("Price");
            $balanceElems.html("Cost");
            $depositElem.prop("step", "0.001");
            $withdrawlElem.prop("step", "0.001");
            $zuluElems.hide();
            $periodElem.hide();
			break;
		case "Loan":
		case "Mortgage":
            $payeeElems.html("Payee");
            $plusElems.html("Payment");
            $minusElems.html("Increase");
            $balanceElems.html("Balance");
            $depositElem.prop("step", "0.01");
            $withdrawlElem.prop("step", "0.01");
            $zuluElems.show();
            $periodElem.show();
			break;
		default:
            $payeeElems.html("Payee");
            $plusElems.html("Deposit");
            $minusElems.html("Withdrawl");
            $balanceElems.html("Balance");
            $depositElem.prop("step", "0.01");
            $withdrawlElem.prop("step", "0.01");
            $zuluElems.show();
            $periodElem.show();
	}
}

function setXfer() {
	$("#xferModal").modal("hide");
	$("#xferAccounts").html('<option id="noAccountSelected" />');
	if ($("#xferAccountId").val() !== "") {
		$("#startXferBtn").removeClass("btn-default").addClass("btn-primary active");
	} else {
		$("#startXferBtn").removeClass("btn-primary active").addClass("btn-default");
	}
}

function tradeHighlight(id, type) {
    var jq_elem = $("#"+type+"_"+id);
    var baseBG = jq_elem.css("background-color");
    jq_elem.css("background-color", "#F0EEA1").animate({backgroundColor: baseBG}, 5000);
}

function transactionHighlight(id) {
	var jq_elem = $("#"+id);
	var baseBG = jq_elem.css("background-color");
	jq_elem.css("background-color", "#F0EEA1").animate({backgroundColor: baseBG}, 5000);
}