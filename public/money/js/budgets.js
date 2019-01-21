let accounts = [];
let groups = [];
let categoryArray = [];
let categoryLookup = {};
// var socket = io();

$(document).ready(function() {
	$("body").show();

	$("#yearSelector").html("Current Year ("+moment().startOf("year").format("MMM D, YYYY")+" - "+moment().endOf("year").format("MMM D, YYYY")+")");
	$("#monthSelector").html("Current Month ("+moment().startOf("month").format("MMM D, YYYY")+" - "+moment().endOf("month").format("MMM D, YYYY")+")");
	$("#weekSelector").html("Current Week ("+moment().startOf("week").format("MMM D, YYYY")+" - "+moment().endOf("week").format("MMM D, YYYY")+")");

	getGroups();
	getAccounts().then(function() {
        getBudgets(null);
    });
});

// FIELD EVENTS
$("#addCategoryBtn").on("click",function() {
	$("#addCategoryModal").modal("show");
});

$("#addCategoryButton").on("click", function() {
	let errorCount = 0;
	const $field = $("#newCatName");
	const categoryName = $field.val();
	if (typeof categoryName !== "undefined" && categoryName.length > 0) {
		$field.css("background-color", "#fff");
	} else {
		errorCount++;
		$field.css("background-color", "#f2dede");
	}
	const acct = JSON.stringify($("#newAccounts").val());
	if (acct !== "null") {
		$("#new_acct_error").hide();
	} else {
		errorCount++;
		$("#new_acct_error").show();
	}

	if (errorCount === 0) {
		let exp = true;
		if ($("#newCatType").val("i")) {
			exp = false;
		}
		addCategory($field.val(), exp, acct);
	}
});

$("#addCategoryModal").on("shown.bs.modal", function() {
	$("#newCatName").focus();
}).on("hidden.bs.modal", function() {
	$("#newCatName").val("");
	$("#newCatType").val("e");
	$("#newAccounts option:selected").prop("selected", false);
});

$("#budgetSelect").on("change", function() {
	$("#budgetBody").empty();
	// getPeriods();
	buildBudget();
});

$("#createBudgetBtn").on("click", function() {
    categoryArray.forEach(function(category) {
        let row = '<tr>'+
            '<td style="padding-top:5px;padding-right:10px;">'+category.name+'</td>'+
            '<td style="padding-top:5px;padding-right:10px;">'+
            '<input id="'+category.id+'" type="number" min="0" max="1000000" step="1" class="form-control currency budgetAmount" />'+
            '</td>'+
            '<td style="padding-top:5px;">'+
            '<select id="time_'+category.id+'" class="form-control">'+
            '<option value="1">Daily</option>'+
            '<option value="7">Weekly (7 days)</option>'+
            '<option value="30" selected>Monthly (30 days)</option>'+
            '<option value="365">Yearly (365 days)</option>'+
            '</select>'+
            '</td>'+
            '</tr>';
        if (category.expense === true) {
            $("#newBudExpenses tbody").append(row);
        } else {
            $("#newBudIncomes tbody").append(row);
        }
    });
    $("#createBudgetModal").modal("show");
});

$("#createBudgetButton").on("click", function(){
    let errorCount = 0;
    const $budgetName = $("#newBudName");
    if (typeof $budgetName.val() !== "undefined" && $budgetName.val().length > 0) {
        $budgetName.css("background-color", "#fff");
    } else {
        errorCount++;
        $budgetName.css("background-color", "#f2dede");
    }

    if (errorCount === 0) {
        let data = {};
        $.each($(".budgetAmount"), function(index, obj) {
            if (obj.value !== "") {
                data[obj.id] = {value: obj.value, time: $("#time_"+obj.id).val()};
                // data[obj.id] = obj.value;
            }
        });
        // console.log(data);
        addBudget($budgetName.val(), JSON.stringify(data));
    }
});

$("#createBudgetModal").on("shown.bs.modal", function() {
    $("#newBudName").focus();
}).on("hidden.bs.modal", function() {
    $("#newBudName").val("");
    $("#newBudExpenses tbody").empty();
    $("#newBudIncomes tbody").empty();
    $("#newGroups option:selected").prop("selected", false);
    $("#newBudAccounts option:selected").prop("selected", false);
});

$("#dateSelect").on("change", function(e) {
	const $dateField = $("#dateFields");
	const $startDate = $("#startDate");
	const $endDate = $("#endDate");
	// console.log(e.currentTarget.value);
	switch (e.currentTarget.value) {
		case "c":
			$dateField.show();
			break;
		case "y":
			$dateField.hide();
			// console.log(moment().startOf("year").toDate());
			// console.log(moment().endOf("year").toDate());
			$startDate.val(moment().startOf("year").format("MMM DD, YYYY"));
			$endDate.val(moment().endOf("year").format("MMM DD, YYYY")).trigger("changeDate");
			break;
		case "m":
			$dateField.hide();
			// console.log(moment().startOf("month").toDate());
			// console.log(moment().endOf("month").toDate());
			$startDate.val(moment().startOf("month").format("MMM DD, YYYY"));
			$endDate.val(moment().endOf("month").format("MMM DD, YYYY")).trigger("changeDate");
			break;
		case "w":
			$dateField.hide();
			// console.log(moment().startOf("week").toDate());
			// console.log(moment().endOf("week").toDate());
			$startDate.val(moment().startOf("week").format("MMM DD, YYYY"));
			$endDate.val(moment().endOf("week").format("MMM DD, YYYY")).trigger("changeDate");
			break;
		default:
			$dateField.hide();
			$startDate.val(moment().startOf("month").format("MMM DD, YYYY"));
			$endDate.val(moment().endOf("month").format("MMM DD, YYYY")).trigger("changeDate");
	}
});

$("#deleteCategoryModal").on("hidden.bs.modal", function() {
	$("#deleteCategoryModalBody").empty();
	$("#deleteCategoryButton").off("click");
});

$("#editBudgetModal").on("shown.bs.modal", function() {
    $("#editBudName").focus();
}).on("hidden.bs.modal", function() {
    $("#editBudName").val("");
    $("#editBudExpenses").empty();
    $("#editBudIncomes").empty();
    $("#editBudgetButton").off("click");
    $("#editGroups option:selected").prop("selected", false);
    $("#editBudAccounts option:selected").prop("selected", false);
});

$("#editCategoryModal").on("shown.bs.modal", function() {
	$("#editCatName").focus();
}).on("hidden.bs.modal", function() {
	$("#editCatId").val("");
	$("#editCatName").html("");
	$("#editCatType").html("");
	$("#editType").val("");
    $("#editAccountsDiv").hide();
	$("#editCategoryButton").off("click");
	$("#editAccounts option:selected").prop("selected", false);
    $("#edit_acct_type_error").hide();
    $("#edit_acct_error").hide();
    accounts.forEach(function(account){
        $("#editAccounts").append($('<option>',{value: account.id, text: account.name}));
    });
});

$("#editType").on("change", function(e) {
    const id = $("#editCatId").val();
    const currentCat = categoryLookup[id];
    $("#editAccounts").children().remove();
    accounts.forEach(function(account){
        $("#editAccounts").append($('<option>',{value: account.id, text: account.name}));
    });
    // console.log(id);
    // console.log(currentCat);
    if (e.target.value === "add") {
        // $("#editAccounts").val([3,4]);
        $("#editAccounts > option").each(function() {
            if (_.indexOf(JSON.parse(currentCat.account_ids), Number(this.value)) !== -1) {
                this.remove();
            }
            // console.log(this.value);
        });
        $("#editAccountsDiv").show();
    } else if (e.target.value === "remove") {
        // $("#editAccounts").val(JSON.parse(currentCat.account_ids));
        $("#editAccounts > option").each(function() {
            if (_.indexOf(JSON.parse(currentCat.account_ids), Number(this.value)) === -1) {
                this.remove();
            }
            // console.log(this.value);
        });
        $("#editAccountsDiv").show();
    } else {
        $("#editAccountsDiv").hide();
    }
});

$("#infoModalBody").on("hidden.bs.modal", function() {
	$("#infoModalTitle").empty();
	$("#infoModalBody").empty();
});

// SOCKET IO

	socket.on("categoryAdded", function(/*category*/) {
		getCategories();
	}).on("categoryUpdated", function(/*category*/) {
		getBudgets(null);
	}).on("categoryDeleted", function(/*id*/) {
		getBudgets(null);
	}).on("budgetAdded", function(budget) {
		getBudgets(budget.id);
	}).on("budgetUpdated", function(id) {
		if (Number(id) === Number($("#budgetSelect").val())) {
			buildBudget();
		}
	}).on("budgetDeleted", function() {
		getBudgets(null);
	});

// FUNCTIONS
function addBudget(name, amounts) {
    $.ajax({
        type: "POST"
        ,url: "/api/v1/money/budgets"
        ,data: {
            name: name
            ,amounts: amounts
            ,group_ids: JSON.stringify($("#newGroups").val())
            ,account_ids: JSON.stringify($("#newBudAccounts").val())
        }
    }).success(function(/*response*/) {
        $("#createBudgetModal").modal("hide");
        return false;
    }).error(function(/*jqXHR, textStatus, errorThrown*/) {
        $("#infoModalBody").html("There was a problem creating the Budget.  Please try again.");
        $("#infoModal").modal("show");
    });
}

function addCategory(name, expense, accounts) {
    $.ajax({
        type: "POST"
        ,url: "/api/v1/money/categories"
        ,data: {
            name: name
            ,expense: expense
            ,account_ids: accounts
        }
    }).success(function() {
        $("#addCategoryModal").modal("hide");
        return false;
    }).error(function(/*jqXHR, textStatus, errorThrown*/) {
        $("#infoModalBody").html("There was a problem creating the Category.  Please try again.");
        $("#infoModal").modal("show");
    });
    return false;
}

function buildBudget() {
    const $endDate = $("#endDate");
    const $startDate = $("#startDate");
    let budgetDays = (moment($endDate.datepicker("getDate")).diff(moment($startDate.datepicker("getDate")), "days") + 1);
    $.ajax({
        type: "GET"
        // ,url: "/api/v1/money/budgets/full/1/"+$("#periodSelect").val()
        ,url: "/api/v1/money/budgets/full/"+$("#budgetSelect").val()+"/"+moment($startDate.datepicker("getUTCDate")).format('X')+'/'+moment($endDate.datepicker("getUTCDate")).format('X')
    }).success(function(data) {
        // console.log(data);
        // console.log(budgetDays);
        let totalExpense = 0;
        let totalIncome = 0;
        let budgetedExpense = 0;
        let budgetedIncome = 0;
        let budget = JSON.parse(data.budget.amounts);
        let head = '<div class="col-md-12">'+
            '<h1 id="budgetName" style="display:inline-block;margin-right:10px;">'+
            data.budget.name+
            '</h1>';
            // '<button class="btn btn-default btn-sm" id="favBudget" title="Default Budget" style="margin-right:5px;"';
        // if (data.budget.favorite === true) {
        //     head += ' disabled><i id="favBudgetIcon" class="fa fa-star text-warning"></i>';
        // } else {
        //     head += ' onclick="favoriteBudget();"><i id="favBudgetIcon" class="fa fa-star-half text-warning"></i>';
        // }
        //  '</button>'+
        if (data.budget.accounts.length > 0) {
            // console.log(data.budget.accounts);
            let appAcctTip = ["Applicable Accounts:"];
            data.budget.accounts.forEach(function(acct) {
                // console.log(_.findWhere(accounts,{id: acct}).name);
                if (typeof(_.findWhere(accounts,{id: acct})) !== "undefined") {
                    appAcctTip.push(_.findWhere(accounts,{id: acct}).name);
                }
            });
            head += '<button class="btn btn-dark btn-sm" style="margin-right:5px;" data-toggle="tooltip" data-placement="bottom" data-html="true" data-container="body" title="'+appAcctTip.join("<br />")+'"><i class="fa fa-balance-scale"></i></button>';
        }
        if (data.budget.groups.length > 0) {
            // console.log(data.budget.groups);
            let appGroupTip = ["Accessible by Group(s):"];
            data.budget.groups.forEach(function(group) {
                // console.log(_.findWhere(accounts,{id: acct}).name);
                if (typeof(_.findWhere(groups,{id: group})) !== "undefined") {
                    appGroupTip.push(_.findWhere(groups,{id: group}).name);
                }
            });
            head += '<button class="btn btn-dark btn-sm" style="margin-right:5px;" data-toggle="tooltip" data-placement="bottom" data-html="true" data-container="body" title="'+appGroupTip.join("<br />")+'"><i class="fa fa-users"></i></button>';
        }
        if (data.budget.owner) {
            head += '<button class="btn btn-primary btn-sm" id="budgetEditBtn" title="Edit Budget" style="margin-right:5px;">' +
                '<i class="fa fa-pencil"></i>' +
                '</button>' +
                '<button class="btn btn-danger btn-sm" id="budgetDeleteBtn" title="Delete Budget">' +
                '<i class="fa fa-trash"></i>' +
                '</button>';
        }
        head += '</div>';
        let startTable = '<div class="col-md-12"><table class="table table-striped"><thead><th style="width:40%;"></th><th style="width:10%;"></th><th style="width:40%;"></th><th style="width:10%;"></th></thead><tbody>';
        let expenses = '<tr><td colspan="4" style="font-size:1.2em;"><strong>Expenses</strong></td></tr>';
        let incomes = '<tr><td colspan="4" style="font-size:1.2em;"><strong>Incomes</strong></td></tr>';

        categoryArray.forEach(function(category) {
            if (Number(category.id) !== 1) {
                if (budget.hasOwnProperty(category.id)) {
                    let calcWidth = 0;
                    let barWidth = 0;
                    let thisBudget = budget[category.id.toString()];
                    let budgetRatio = budgetDays / Number(thisBudget.time);
                    let adjustedBudget = Math.ceil(thisBudget.value * budgetRatio);
                    // console.log(adjustedBudget);
                    // var thisBudget = _.where(budget, {id: category.id.toString()});
                    // console.log(thisBudget);
                    if (category.expense === true) {
                        totalExpense += (Number(data.values[category.id]) * -1);
                        budgetedExpense += adjustedBudget;
                        calcWidth = Math.floor(((Number(data.values[category.id]) * -1).toFixed(2) / adjustedBudget.toFixed(2)) * 100);
                        // calcWidth = Math.floor(((Number(data.values[category.id]) * -1).toFixed(2) / Number(budget[category.id].value).toFixed(2)) * 100);
                        // console.log(calcWidth);
                        if (calcWidth > 100) {
                            barWidth = 100;
                        } else {
                            barWidth = calcWidth;
                        }
                        let barColorClass = "progress-bar-success";
                        if (calcWidth > 100) {
                            barColorClass = "progress-bar-danger";
                        } else if (calcWidth > 70) {
                            barColorClass = "progress-bar-warning";
                        }
                        expenses += '<tr>' +
                            '<td><a onclick="categoryTable(' + category.id + ')">' + category.name + '</a></td>' +
                            '<td>$' + (Number(data.values[category.id]) * -1).toFixed(2) + '</td>' +
                            '<td>' +
                            '<div class="progress">' +
                            '<div class="progress-bar ' + barColorClass + '" role="progressbar" aria-valuenow="' + Number(data.values[category.id]).toFixed(2) + '" aria-valuemin="0" aria-valuemax="' + Number(budget[category.id]).toFixed(2) + '" style="width:' + barWidth + '%;">' +
                            calcWidth + "%" +
                            '</div>' +
                            '</div>' +
                            '</td>' +
                            '<td>$' + adjustedBudget.toFixed(2) + '</td>' +
                            '</tr>';
                    } else {
                        totalIncome += Number(data.values[category.id]);
                        budgetedIncome += adjustedBudget;
                        calcWidth = Math.floor((Number(data.values[category.id]).toFixed(2) / adjustedBudget.toFixed(2)) * 100);
                        if (calcWidth > 100) {
                            barWidth = 100;
                        } else {
                            barWidth = calcWidth;
                        }
                        let barColorClass = "progress-bar-danger";
                        if (calcWidth > 100) {
                            barColorClass = "progress-bar-success";
                        } else if (calcWidth > 70) {
                            barColorClass = "progress-bar-warning";
                        }
                        incomes += '<tr>' +
                            '<td><a onclick="categoryTable(' + category.id + ')">' + category.name + '</a></td>' +
                            '<td>$' + Number(data.values[category.id]).toFixed(2) + '</td>' +
                            '<td>' +
                            '<div class="progress">' +
                            '<div class="progress-bar ' + barColorClass + '" role="progressbar" aria-valuenow="' + Number(data.values[category.id]).toFixed(2) + '" aria-valuemin="0" aria-valuemax="' + Number(budget[category.id]).toFixed(2) + '" style="width:' + barWidth + '%;">' +
                            calcWidth + "%" +
                            '</div>' +
                            '</div>' +
                            '</td>' +
                            '<td>$' + adjustedBudget.toFixed(2) + '</td>' +
                            '</tr>';
                    }
                }
            }
        });

        let budgetBar = '<div class="col-md-6" style="font-size:0.7em;">Budgeted&nbsp;&#43;&#47;&#45;<br /><div class="progress">';
        let largestB = 0;
        if (budgetedIncome >= budgetedExpense) {
            largestB = budgetedIncome;
        } else {
            largestB = budgetedExpense;
        }
        let diffB = budgetedIncome - budgetedExpense;
        if (diffB > 0) {
            let plusWidth = Math.floor((diffB / largestB) * 100);
            budgetBar += '<div class="progress-bar" role="progressbar" style="width:50%;background:transparent;"></div>'+
                '<div class="progress-bar progress-bar-success" role="progressbar" style="font-size:0.9em;width:'+plusWidth+'%;min-width:10%;">'+
                "+$"+diffB.toFixed(2)+
                '</div>';
        } else if (diffB < 0) {
            let minusWidth = Math.floor((Math.abs(diffB) / largestB) * 100);
            budgetBar += '<div class="progress-bar" role="progressbar" style="width:'+(50 - minusWidth)+'%;max-width:40%;background:transparent;"></div>'+
                '<div class="progress-bar progress-bar-danger" role="progressbar" style="font-size:0.9em;width:'+minusWidth+'%;min-width:10%;">'+
                "-$"+Math.abs(diffB).toFixed(2)+
                '</div>'+
                '<div class="progress-bar" role="progressbar" style="width:50%;background:transparent;"></div>';
        } else {
            budgetBar += '<div class="progress-bar" role="progressbar" style="width:100%;font-size:0.9em;">Right On!</div>';
        }
        budgetBar += '</div></div>';

        let statusBar = '<div class="col-md-6" style="font-size:0.7em;">Current&nbsp;&#43;&#47;&#45;<br /><div class="progress">';
        let largest = 0;
        if (totalIncome >= totalExpense) {
            largest = totalIncome;
        } else {
            largest = totalExpense;
        }
        let diff = totalIncome - totalExpense;
        if (diff > 0) {
            let plusWidth = Math.floor((diff / largest) * 100);
            statusBar += '<div class="progress-bar" role="progressbar" style="width:50%;background:transparent;"></div>'+
                '<div class="progress-bar progress-bar-success" role="progressbar" style="font-size:0.9em;width:'+plusWidth+'%;min-width:10%;">'+
                "+$"+diff.toFixed(2)+
                '</div>';
        } else if(diff < 0) {
            let minusWidth = Math.floor((Math.abs(diff) / largest) * 100);
            statusBar += '<div class="progress-bar" role="progressbar" style="max-width:40%;width:'+(50 - minusWidth)+'%;background:transparent;"></div>'+
                '<div class="progress-bar progress-bar-danger" role="progressbar" style="font-size:0.9em;width:'+minusWidth+'%;min-width:10%;">'+
                "-$"+Math.abs(diff).toFixed(2)+
                '</div>'+
                '<div class="progress-bar" role="progressbar" style="width:50%;background:transparent;"></div>';
        } else {
            statusBar += '<div class="progress-bar" role="progressbar" style="font-size:0.9em;width:100%;">Right On!</div>';
        }
        statusBar += '</div></div>';
        let endTable = '</tbody></table></div>';
        let page = head+'<div class="col-md-12"><div class="row">'+budgetBar+statusBar+"</div></div>"+startTable+expenses+incomes+endTable;
        $("#budgetBody").html(page);
        $('[data-toggle="tooltip"]').tooltip();
        $("#budgetEditBtn").click(function() {
            editBudget(data.budget);
        });
        $("#budgetDeleteBtn").click(function() {
            deleteBudget($("#budgetSelect").val());
        });
    }).error(function(/*jqXHR, textStatus, errorThrown*/) {
        $("#infoModalBody").html("There was a problem.  Please try again.");
        $("#infoModal").modal("show");
    });
}

function categoryTable(id) {
    $.ajax({
        type: "GET"
        ,url: "/api/v1/money/transactions/category/"+id+"/"+moment($("#startDate").datepicker("getUTCDate")).format('X')+'/'+moment($("#endDate").datepicker("getUTCDate")).format('X')
    }).success(function(data) {
        // console.log(data);
        let table = '<table class="table-striped table-condensed" style="font-size:0.9em;">'+
            '<thead>'+
            '<tr>'+
            '<th>Date</th>'+
            '<th>Payee</th>'+
            '<th>Description</th>'+
            '<th>Amount</th>'+
            '<th>Account</th>'+
            '</tr>'+
            '</thead>'+
            '<tbody>';
        data.forEach(function(trans) {
            table += '<tr>'+
                '<td>'+moment.utc(trans.transactionDate).format("MMM DD, YYYY")+'</td>'+
                '<td>'+trans.payee+'</td>'+
                '<td>';
            if (trans.description) {
                table += trans.description;
            }
            table += '</td>'+
                '<td>'+Number(trans.amount).toFixed(2)+'</td>'+
                // '<td>'+Math.abs(Number(trans.amount)).toFixed(2)+'</td>'+
                '<td>'+trans.Summary.Account.name+'</td>'+
                '</tr>';
        });
        table += '</tbody></table>';
        $("#infoModalTitle").html(data[0].Category.name);
        $("#infoModalBody").html(table);
        $("#infoModal").modal("show");
    }).error(function(/*jqXHR, textStatus, errorThrown*/) {
        $("#infoModalBody").html("There was a problem.  Please try again.");
        $("#infoModal").modal("show");
    });
}

function deleteBudget(id) {
    const name = $("#budgetName").html();
    $("#deleteModalBody").html("<strong>Are you sure you want to delete the Budget "+name+"?</strong>");
    $("#deleteBudgetButton").click(function() {
        removeBudget(id);
    });
    $("#deleteBudgetModal").modal("show");
    return false;
}

function editBudget(budget) {
    console.log(budget);
    $("#editBudName").val(budget.name);
    $("#editGroups").val(budget.groups);
    $("#editBudAccounts").val(budget.accounts);
    let amounts = JSON.parse(budget.amounts);
    categoryArray.forEach(function(category) {
        let setAmount;
        let setTime = "-1";
        if (amounts.hasOwnProperty(category.id)) {
            setAmount = amounts[category.id].value;
            setTime = amounts[category.id].time;
        }
        let row = '<tr>'+
            '<td style="padding-top:5px;padding-right:10px;">'+category.name+'</td>'+
            '<td style="padding-top:5px;padding-right:10px;">'+
            '<input id="'+category.id+'" type="number" min="0" max="1000000" step="1" class="form-control currency budgetAmount" value="'+setAmount+'" />'+
            '</td>'+
            '<td style="padding-top:5px;">'+
            '<select id="time_'+category.id+'" class="form-control">'+
            '<option value="1"';
        if (setTime === "1") {
            row += ' selected';
        }
        row += '>Daily</option>'+
            '<option value="7"';
        if (setTime === "7") {
            row += ' selected';
        }
        row += '>Weekly (7 days)</option>'+
            '<option value="30"';
        if (setTime === "30" || setTime === "-1") {
            row += ' selected';
        }
        row += '>Monthly (30 days)</option>'+
            '<option value="365"';
        if (setTime === "365") {
            row += ' selected';
        }
        row += '>Yearly (365 days)</option>'+
            '</select>'+
            '</td>'+
            '</tr>';
        if (category.expense === true) {
            $("#editBudExpenses").append(row);
        } else {
            $("#editBudIncomes").append(row);
        }
    });
    $("#editBudgetButton").click(function() {
        modifyBudget(budget.id);
    });
    $("#editBudgetModal").modal("show");
}

function editCategory(id) {
    $("#editCatId").val(id);
    $("#editCatName").html(categoryLookup[id].name);
    // $("#editCatName").val(categoryLookup[id].name);
    const $editCatType = $("#editCatType");
    if (categoryLookup[id].expense === true) {
        $editCatType.html("Expense");
        // $("#editCatExpenseLabel").addClass("active");
    } else {
        $editCatType.html("Income");
        // $("#editCatIncomeLabel").addClass("active");
    }
    $("#editCategoryButton").click(function() {
        modifyCategory(id);
    });
    $("#editCategoryModal").modal("show");
}

function getAccounts() {
    return new Promise(function(resolve) {
        $.ajax({
            type: "GET"
            ,url: "/api/v1/money/accounts"
        }).success(function(results) {
            // console.log(results);
            accounts = results;
            results.forEach(function(account){
                $("#newAccounts").append($('<option>',{value: account.id, text: account.name}));
                $("#editAccounts").append($('<option>',{value: account.id, text: account.name}));
                $("#newBudAccounts").append($('<option>',{value: account.id, text: account.name}));
                $("#editBudAccounts").append($('<option>',{value: account.id, text: account.name}));
            });
            resolve();
        }).error(function(/*jqXHR, textStatus, errorThrown*/) {
            // if (jqXHR.status === 404) {
            // 	return false;
            // } else {
            // 	$("#infoModalBody").html("There was a problem.  Please try again.");
            // 	$("#infoModal").modal("show");
            // }
            resolve();
        });
    });
}

function getBudgets(id) {
    getCategories().then(function() {
        $("#budgetSelect").empty();
        $("#budgetBody").empty();
        $.ajax({
            type: "GET"
            ,url: "/api/v1/money/budgets"
        }).success(function(results) {
            results.forEach(function(budget) {
                let option = '<option value="'+budget.id+'"';
                if (id !== null) {
                    if (id === budget.id) {
                        option += ' selected';
                    }
                } else {
                    if (budget.favorite === true) {
                        option += ' selected';
                    }
                }
                option += '>'+budget.name+'</option>';
                $("#budgetSelect").append(option);
            });
            if ($("#budgetSelect").val() !== null) {
                let html = '<div class="row"><div class="col-6">'+
                    '<div class="form-group">'+
                        '<label>From</label>'+
                        '<input type="text" class="datepicker form-control" id="startDate" value="'+moment().startOf("month").format("MMM DD, YYYY")+'" />'+
                    '</div>'+
                '</div>'+
                '<div class="col-6">'+
                    '<div class="form-group">'+
                        '<label>To</label>'+
                        '<input type="text" class="datepicker form-control" id="endDate" value="'+moment().endOf("month").format("MMM DD, YYYY")+'" />'+
                    '</div>'+
                '</div></div>';
                $("#dateFields").html(html);
                $("#startDate").datepicker({format: 'M dd, yyyy', endDate: moment().endOf("month").toDate(), title: "Start Date", autoclose: true}).on("changeDate", function(e) {
                    $("#endDate").data("datepicker").setStartDate(e.date);
                    buildBudget();
                });
                $("#endDate").datepicker({format: 'M dd, yyyy', startDate: moment().startOf("month").toDate(), title: "End Date", autoclose: true}).on("changeDate", function(e) {
                    $("#startDate").data("datepicker").setEndDate(e.date);
                    buildBudget();
                });
                buildBudget();
                // getPeriods();
            }
        }).error(function(jqXHR/*, textStatus, errorThrown*/) {
            if (jqXHR.status === 404) {
                return false;
            } else {
                $("#infoModalBody").html("There was a problem.  Please try again.");
                $("#infoModal").modal("show");
            }
        });
    }).catch(function() {
        $("#budgetSelect").empty();
        $("#budgetBody").empty();
        $.ajax({
            type: "GET"
            ,url: "/api/v1/money/budgets"
        }).success(function(results) {
            results.forEach(function(budget) {
                let option = '<option value="'+budget.id+'"';
                if (id === budget.id) {
                    option += ' selected';
                }
                option += '>'+budget.name+'</option>';
                $("#budgetSelect").append(option);
            });
            if ($("#budgetSelect").val() !== null) {
                let html = '<div class="row"><div class="col-md-6">'+
                    '<input type="text" class="datepicker form-control" id="startDate" value="'+moment().startOf("month").format("MMM DD, YYYY")+'" />'+
                    '</div>'+
                    '<div class="col-md-6">'+
                    '<input type="text" class="datepicker form-control" id="endDate" value="'+moment().endOf("month").format("MMM DD, YYYY")+'" />'+
                    '</div></div>';
                $("#dateFields").html(html);
                $("#startDate").datepicker({format: 'M dd, yyyy', endDate: moment().endOf("month").toDate(), title: "Start Date", autoclose: true}).on("changeDate", function(e) {
                    $("#endDate").data("datepicker").setStartDate(e.date);
                    buildBudget();
                });
                $("#endDate").datepicker({format: 'M dd, yyyy', startDate: moment().startOf("month").toDate(), title: "End Date", autoclose: true}).on("changeDate", function(e) {
                    $("#startDate").data("datepicker").setEndDate(e.date);
                    buildBudget();
                });
                buildBudget();
            }
        }).error(function(jqXHR/*, textStatus, errorThrown*/) {
            if (jqXHR.status === 404) {
                return false;
            } else {
                $("#infoModalBody").html("There was a problem.  Please try again.");
                $("#infoModal").modal("show");
            }
        });
    });
}

function getCategories() {
    return new Promise(function(resolve, reject) {
        $.ajax({
            type: "GET"
            ,url: "/api/v1/money/categories"
        }).success(function(categories) {
            // console.log(categories);
            const $catBody = $("#categoryBody");
            $catBody.empty();
            const tableHead = '<table class="table table-striped table-sm"><thead><th class="col-md-10"></th><th class="col-md-1"></th><th class="col-md-1"></th></thead>';
            let expenses = '<tr><td colspan="3" style="font-size:1.2em;"><strong>Expenses</strong></td></tr>';
            let incomes = '<tr><td colspan="3" style="font-size:1.2em;"><strong>Incomes</strong></td></tr>';
            categoryArray = categories;
            for (let i=0, len=categoryArray.length; i<len; i++) {
                let appAcctTip = ["Applicable Accounts:"];
                JSON.parse(categories[i].account_ids).forEach(function(acct) {
                    // console.log(_.findWhere(accounts,{id: acct}).name);
                    if (typeof(_.findWhere(accounts,{id: acct})) !== "undefined") {
                        const name = _.findWhere(accounts,{id: acct}).name;
                        if (name.length > 20) {
                            appAcctTip.push(name.substring(0,7)+"...."+name.substring((name.length-7),name.length));
                        } else {
                            appAcctTip.push(name);
                        }
                    }
                });
                if (categories[i].expense === true) {
                    expenses += '<tr>'+
                        '<td>'+categories[i].name+'</td>'+
                        '<td><span class="badge badge-dark"><i class="fa fa-balance-scale" data-toggle="tooltip" data-placement="bottom" data-html="true" data-container="body" title="'+appAcctTip.join("<br />")+'"></i></span></td>' +
                        '<td>'+
                        '<button class="badge badge-primary" onclick="editCategory(\''+categories[i].id+'\');" style="margin-right:5px;"><i class="fa fa-pencil"></i></button>'+
                        // '<button class="btn btn-danger btn-sm" onclick="deleteCategory(\''+categories[i].id+'\');"><i class="fa fa-trash"></i></button>'+
                        '</td>'+
                        '</tr>';
                } else {
                    incomes += '<tr>'+
                        '<td>'+categories[i].name+'</td>'+
                        '<td><span class="badge badge-dark"><i class="fa fa-balance-scale" data-toggle="tooltip" data-placement="bottom" data-html="true" data-container="body" title="'+appAcctTip.join("<br />")+'"></i></span></td>' +
                        '<td>'+
                        '<button class="badge badge-primary" onclick="editCategory(\''+categories[i].id+'\');" style="margin-right:5px;"><i class="fa fa-pencil"></i></button>'+
                        // '<button class="btn btn-danger btn-sm" onclick="deleteCategory(\''+categories[i].id+'\');"><i class="fa fa-trash"></i></button>'+
                        '</td>'+
                        '</tr>';
                }
                categoryLookup[categoryArray[i].id] = categoryArray[i];
            }
            const tableEnd = '</table>';
            const content = tableHead+expenses+incomes+tableEnd;
            $catBody.append(content);
            $('[data-toggle="tooltip"]').tooltip();
            resolve();
        }).error(function(jqXHR/*, textStatus, errorThrown*/) {
            $("#categoryBody").empty();
            categoryArray = [];
            categoryLookup = {};
            if (jqXHR.status === 404) {
                reject();
            } else {
                $("#infoModalBody").html("There was a problem.  Please try again.");
                $("#infoModal").modal("show");
                reject(jqXHR);
            }
        });
    });
}

function getGroups() {
    $.ajax({
        type: "GET"
        ,url: '/api/v1/group'
    }).success(function(response) {
        // console.log(response);
        groups = response;
        response.forEach(function(group){
            $("#newGroups").append($('<option>',{value: group.id, text: group.name}));
            $("#editGroups").append($('<option>',{value: group.id, text: group.name}));
        });
    }).error(function(jqXHR) {
        // console.log(jqXHR);
    });
}

function modifyBudget(id) {
    // console.log("clicked");
    let errorCount = 0;
    const $budgetName = $("#editBudName");
    if (typeof $budgetName.val() !== "undefined" && $budgetName.val().length > 0) {
        $budgetName.css("background-color", "#fff");
    } else {
        errorCount++;
        $budgetName.css("background-color", "#f2dede");
    }

    if (errorCount === 0) {
        // console.log("going");
        let data = {};
        $.each($(".budgetAmount"), function(index, obj) {
            if (obj.value !== "") {
                // data[obj.id] = obj.value;
                data[obj.id] = {value: obj.value, time: $("#time_"+obj.id).val()};
            }
        });
        const dataString = JSON.stringify(data);
        // console.log(dataString);
        $.ajax({
            type: "PUT"
            ,url: "/api/v1/money/budgets/"+id
            ,data: {
                name: $budgetName.val()
                ,amounts: dataString
                ,group_ids: JSON.stringify($("#editGroups").val())
                ,account_ids: JSON.stringify($("#editBudAccounts").val())
            }
        }).success(function(/*budget*/) {
            $("#editBudgetModal").modal("hide");
            return false;
        }).error(function(/*jqXHR, textStatus, errorThrown*/) {
            $("#infoModalBody").html("There was a problem updating "+$budgetName.val()+".  Please try again.");
            $("#infoModal").modal("show");
        });
    }
}

function modifyCategory(id) {
    const action = $("#editType").val();
    const accts = $("#editAccounts").val();
    console.log(accts);
    let errorCount = 0;
    if (action === "") {
        $("#edit_acct_type_error").show();
        errorCount++;
    } else { $("#edit_acct_type_error").hide(); }
    if (accts === null) {
        $("#edit_acct_error").show();
        errorCount++;
    } else { $("#edit_acct_error").hide(); }

    if (errorCount === 0) {
        $.ajax({
            type: "PUT"
            ,url: "/api/v1/money/categories/"+id
            ,data: {
                action: action,
                account_ids: JSON.stringify(accts)
            }
        }).success(function(/*category*/) {
            $("#editCategoryModal").modal("hide");
            return false;
        }).error(function(/*jqXHR, textStatus, errorThrown*/) {
            $("#infoModalBody").html("There was a problem updating the Category.  Please try again.");
            $("#infoModal").modal("show");
        });
    }
}

function removeBudget(id) {
    $("#deleteBudgetModal").modal("hide");
    $.ajax({
        type: "DELETE"
        ,url: "/api/v1/money/budgets/"+id
    }).success(function() {
        return false;
    }).error(function(/*jqXHR, textStatus, errorThrown*/) {
        $("#infoModalBody").html("There was a problem deleting "+name+".  Please try again.");
        $("#infoModal").modal("show");
    });
    // console.log("remove:"+id);
}

// function removeCategory(id) {
// 	$("#deleteCategoryModal").modal("hide");
// 	$.ajax({
// 		type: "DELETE"
// 		,url: "/api/v1/money/categories/"+id
// 	})
// 	.success(function() {
// 		return false;
// 	})
// 	.error(function(jqXHR, textStatus, errorThrown) {
// 		if (jqXHR.status === 404) {
// 			return false;
// 		} else {
// 			$("#infoModalBody").html("There was a problem deleting the Category.  Please try again.");
// 			$("#infoModal").modal("show");
// 		}
// 	});
// }

// function favoriteBudget() {
//     var selectedBudget = $("#budgetSelect").val();
//     $.ajax({
//         type: "PUT"
//         ,url: "/api/v1/money/budgets/favorite/"+selectedBudget
//     }).success(function(response) {
//         $("#favBudgetIcon").removeClass("glyphicon-star-empty").addClass("glyphicon-star");
//         $("#favBudget").prop("disabled", true);
//     });
// }

// function getPeriods() {
//     $.ajax({
//         type: "GET"
//         ,url: "/api/v1/money/unique/summaries"
//     })
//     .success(function(results) {
//         $("#periodSelect").empty();
//         var nowStamp = moment().format("x");
//         results.forEach(function(period) {
//             if (period.start !== null) {
//                 var startStamp = moment.utc(period.start).format("x");
//                 var startString = moment.utc(period.start).format("MMM D, YYYY")
//                 var endStamp = moment.utc(period.end).format("x");
//                 var endString = moment.utc(period.end).format("MMM D, YYYY");
//                 if (nowStamp >= startStamp && nowStamp <= endStamp) {
//                     $("#periodSelect").append('<option value="'+period.summaries.join("x")+'" selected>'+startString+' - '+endString+'</option>');
//                 } else {
//                     $("#periodSelect").append('<option value="'+period.summaries.join("x")+'">'+startString+' - '+endString+'</option>');
//                 }
//             }
//         });
//         if ($("#periodSelect").val() !== null) {
//             buildBudget();
//         }
//     })
//     .error(function(jqXHR, textStatus, errorThrown) {
//         if (jqXHR.status === 404) {
//             return false;
//         } else {
//             $("#infoModalBody").html("There was a problem.  Please try again.");
//             $("#infoModal").modal("show");
//         }
//     });
// }

// function deleteCategory(id) {
//     var name = categoryLookup[id].name;
//     $("#deleteCategoryModalBody").html("<strong>Are you sure you want to delete the Category "+name+"?</strong><br />"+name+" will also be removed from all Budgets!");
//     $("#deleteCategoryButton").click(function() {
//         removeCategory(id);
//     });
//     $("#deleteCategoryModal").modal("show");
// }