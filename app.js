'use strict'

var MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectID;
var mongoDbObj;
var assert = require('assert');
var spawn = require('child_process').spawn;
const MONGOPATH = process.env.MONGOPATH;

var configs;
var creatingUser = false;

moment.locale('es-do');

Storage.prototype.setObj = function(key, obj) {
	return this.setItem(key, JSON.stringify(obj));
}
Storage.prototype.getObj = function(key) {
	return JSON.parse(this.getItem(key));
}

btnClick('.close-application', (e) => {
	window.close();
})

function connectMongo() {
	MongoClient.connect('mongodb://127.0.0.1:27017/elducadodb', function(err, db) {
		if (err) {
			startMongoServer();
			return console.log(err); // LOG THIS
		} else {
			console.log("Connected to DB"); // LOG THIS
			mongoDbObj = {db: db,
				residents: db.collection("residents"),
				invoices: db.collection("invoices"),
				configs: db.collection("configs"),
				accounting: db.collection("accounting")
			}

			mongoDbObj.configs.find({}, {_id: 0}).toArray((err, doc) => {
				if (err) {
					return console.log(err);
				}
				localStorage.setObj('configs', doc[0]);
				configs = doc[0];
			});
			$('.splash-screen').addClass('fadeOut');
			setTimeout(() => {
				$('.splash-screen').addClass('no-display');
			}, 900);
		}
	});
};

connectMongo();

function startMongoServer() {
	const mongod = spawn('mongod', ['--dbpath', MONGOPATH]);
	mongod.stdout.once('data', (data) => {
		console.log(data.toString());
		connectMongo();
	});
	mongod.stderr.on('data', (data) => {
		console.log(data.toString());
	});
		/*console.log('foo');
		if (err) {
			flashMessage("Error inicindo DB", "flashmessage--danger")
			console.log(err);
			return;
		}
		console.log('pass');
		console.log(sto);
		console.log(ste);
		connectMongo();*/
}

// Flash Message
function flashMessage(msg, type){
	if(hideFlashMessage)
		clearTimeout(hideFlashMessage);
	$('.flashmessage').removeClass('notVisible')
	.removeClass('flashmessage--success')
	.removeClass('flashmessage--danger')
	.removeClass('flashmessage--info')
	.addClass(type)
	.html('<span>'+msg+'</span>');
	var hideFlashMessage = setTimeout(function(){
		$('.flashmessage').addClass('notVisible').
		html('');
	}, 3000);
}
// Flash Message

function updateConfigs (configs) {
	if (!configs) {
		let configs = localStorage.getObj('configs');
	}
	console.log(configs);
	mongoDbObj.configs.updateOne({id: 1}, {$set: configs}, (err, result) => {
		if (err) return console.log(err);
		console.log(result);
		return Promise.resolve();
	});
}

btnClick('.btn-menu', (e) => {
	$('header .menu').toggleClass('no-display');
});

$('.btn-menu').on('blur', (e) => {
	setTimeout(function() {
		$('header .menu').addClass('no-display');
	}, 500);
});

btnClick('#btn-configs-save', (e) => {
	setConfigs().then(updateConfigs).then(() => {
		flashMessage('Configuraciones salvadas', 'flashmessage--success');
	}).catch((reason) => { console.log(reason) });
});

$('header a').on('click', (e) => {
	$('.icon-selected').removeClass('icon-selected');
	$('header .menu').addClass('no-display');
});

$('header a[href="#configs-page"]').on('click', (e) => {
	getConfigs().then(loadConfigs).catch((reason) => { console.log(reason) });
});

function getConfigs() {
	return new Promise((resolve, reject) => {
		mongoDbObj.configs.find({}, {_id: 0}).toArray((err, doc) => {
			if (err) {
				return reject(err);
			}
			localStorage.setObj('configs', doc[0]);
			configs = doc[0];
			resolve(doc[0]);
		});
	});
}

function setInputVal(name, value) {
	$(`input[name="${name}"]`).val(value);
}

function setData(element, value) {
	$(element).text(value);
}

function getInputVal(name) {
	return $(`input[name="${name}"]`).val();
}

function noDisplay(element) {
	$(element).addClass('no-display');
}

function yesDisplay(element) {
	$(element).removeClass('no-display');
}

function loadConfigs(configs) {
	setInputVal('category-a', configs.categoryPrices.A);
	setInputVal('category-b', configs.categoryPrices.B);
	setInputVal('category-c', configs.categoryPrices.C);
	setInputVal('category-d', configs.categoryPrices.D);
	setInputVal('config-email', configs.email);
	setInputVal('config-bank', configs.bank);
	setInputVal('config-bank-account', configs.bankAccountNumber);
	$('textarea[name="config-frase"]').val(configs.frase);
	return Promise.resolve(configs);
}

function setConfigs() {
	return new Promise((resolve, reject) => {
		let configs = {
			categoryPrices: {
				A: parseInt(getInputVal('category-a')),
				B: parseInt(getInputVal('category-b')),
				C: parseInt(getInputVal('category-c')),
				D: parseInt(getInputVal('category-d'))
			},
			email: getInputVal('config-email'),
			bank: getInputVal('config-bank'),
			bankAccountNumber: getInputVal('config-bank-account'),
			frase: $('textarea[name="config-frase"]').val()
		}
		resolve(configs);
	});
}

btnClick("#form-search #btn-search", (e) => {
	search('#form-search input[name="search-resident"]', '#form-search #search-list', loadInvoice);
});




function search(input, list, callback) {
	$(list).html('');
	let queryString;
	let searchInput = $(input).val();
	if (isNaN(parseInt(searchInput))) {
		queryString = {$text: {$search: searchInput}};
	} else { // Is a number
		if (searchInput.length <= 3){
			queryString = {"id": parseInt(searchInput)};
		} else {
			queryString = {"bankAccount.bank": searchInput};
		}
	}
	mongoDbObj.residents.find(queryString).toArray(function(err, doc) {
		if (err) {
			console.log(err); // LOG THIS
			return;
		} else {
			if (doc.length === 0) {
				return flashMessage("No hay resultados", "flashmessage--info");
			}
			if(doc.length === 1) {
				callback(doc[0].id, doc[0].fullName);
				return;
			}
			_.forEach(doc, function(item, index) {
				$(list).append(
					`<li><a class="jsListItem" residentId="${item.id}" fullName="${item.fullName}">${item.id} | ${item.fullName}<i class="fa fa-chevron-right"></i></a></li>`
				);
			});
			$('.jsListItem').on('click', (e) => {
				e.preventDefault();
				let residentId = $(e.target).attr('residentId');
				let fullName = $(e.target).attr('fullName');
				callback(residentId, fullName);
			});
		}
	});	
}


function loadInvoice(residentId, fullName) {
	$('.js-btn-pay-method').removeClass('btn--selected');
	var invoicesArray = [];
	// $('.js-btn-pay-method:nth(1)').addClass('btn--selected');
	residentId = parseInt(residentId);
	mongoDbObj.residents.find({"id": residentId}).toArray((err, doc) => {
		if (err) {
		console.log(err); // LOG THIS
			return;
		}
		if (doc[0].pendingInvoices.length === 0) {
			flashMessage("No tiene factura pendiente", "flashmessage--success");
			return;
		}

		console.log(doc[0].pendingInvoices);

		_.forEach(doc[0].bankAccount, (account, index) => { // Adding accounts to dropdown
			$('select[name="bankAccount"]').append(`
				<option value="${account}">${account.bank}</option>
				`)
		});

		$('#form-receipt').removeClass('no-display');
		$('#form-search').addClass('no-display');
		var pendingInvoices = doc[0].pendingInvoices.reverse();
		_.forEach(pendingInvoices, (item, index) => { 
			mongoDbObj.invoices.find({id: item}).toArray((err, doc) => {
				if (err) {
					console.log(err);
					return
				}
				invoicesArray.push(doc[0]);
				if (pendingInvoices.length === (index + 1)){
				console.log(index);
				console.log(pendingInvoices.length);
					if (invoicesArray.length === 1) { // For just one invoice
						_.forEach(invoicesArray, (item, index) => {
							console.log(invoicesArray);
							$('#btnChangeInvoice').addClass('no-display');
							$('#jsResident').text(`${fullName} (#${residentId})`).val(residentId);
							$('#jsInvoiceNumber').text(item.id);
							$('#jsCategory').text(item.category);
							$('#jsDescription').text(item.description);
							$('#jsType').text(item.type);
							addPaymentPage.receiptAmount = item.amount;
							addPaymentPage.tempReceiptAmount = item.amount;
							addPaymentPage.originalReceiptAmount = item.originalAmount;
							$('#jsMonth').text(item.month);
							$('#jsDate').text(moment().format("DD/MM/YYYY"));
						});
					} else { // For more than one invoice
						let i = 0;
						console.log(invoicesArray);
						$('#btnChangeInvoice').removeClass('no-display');
						$('#jsResident').text(`${fullName} (#${residentId})`).val(residentId);
						$('#jsInvoiceNumber').text(invoicesArray[i].id);
						$('#jsCategory').text(invoicesArray[i].category);
						$('#jsDescription').text(invoicesArray[i].description);
						$('#jsType').text(invoicesArray[i].type);
						addPaymentPage.receiptAmount = invoicesArray[i].amount;
						addPaymentPage.tempReceiptAmount = invoicesArray[i].amount;
						addPaymentPage.originalReceiptAmount = invoicesArray[i].originalAmount;
						$('#jsMonth').text(_.capitalize(invoicesArray[i].month));
						$('#jsDate').text(moment().format("DD/MM/YYYY"));

						$('#btnChangeInvoice').on('click', (e) => {
							e.preventDefault();
							if (i === (invoicesArray.length - 1)) {
								i = 0;
							} else {
								i++
							}
							$('#jsInvoiceNumber').text(invoicesArray[i].id);
							addPaymentPage.receiptAmount = invoicesArray[i].amount;
							addPaymentPage.tempReceiptAmount = invoicesArray[i].amount;
							addPaymentPage.originalReceiptAmount = invoicesArray[i].originalAmount;
							$('#jsDescription').text(invoicesArray[i].description);
							$('#jsType').text(invoicesArray[i].type);
							$('#jsMonth').text(invoicesArray[i].month);
						});
					}
				}
			});
		});
	});
}

function getTempReceipt () {
	let tempReceipt = {
		resident : $('#jsResident').text(),
		invoiceID : $('#jsInvoiceNumber').text(),
		date : $('#jsDate').text(),
		payMethod : $('.js-btn-pay-method.btn--selected').text(),
		amount: addPaymentPage.receiptAmount,
		originalAmount: addPaymentPage.originalReceiptAmount,
		month: $('#jsMonth').text(),
		type: $('#jsType').text(),
		category: $('#jsCategory').text(),
		residentId: parseInt($('#jsResident').val()),
		depositNumber: $('input[name="pay-method-input"]').val(),
		accountNumber: $('select[name="bankAccount"] option:selected').val()
	}
	return tempReceipt;
}

$('nav a').on('click', (e) => {
	$('.icon-selected').removeClass('icon-selected');
	$(e.currentTarget).addClass('icon-selected');
});

$('#btn-close-form-receipt').on('click', (e) => {
	e.preventDefault();
	$('#form-search').removeClass('no-display');
	$('#form-receipt').addClass('no-display');
	$('input[name="pay-method-input"]').addClass('no-display').val(""); // Reset input
	$('select[name="bankAccount"]').addClass('no-display').html('<option value=""></option>'); // Reset input
});

$('#btn-close-modal').on('click', (e) => {
	e.preventDefault();
	$('#modal').addClass('no-display');
});

btnClick('.modal__select-batch #btn-close-modal', (e) => {
	$('.modal__select-batch').addClass('no-display');
	$(`select[name="batch-month"] option[value=""]`).attr('selected', 'selected');
});

btnClick('.modal__generate-invoices #btn-close-modal', (e) => {
	noDisplay('.modal__generate-invoices');
	noDisplay('.inner-box');
	yesDisplay('.choose-batch-type');
});

$('.js-btn-pay-method').on('click', (e) => {
	e.preventDefault();
	$('.js-btn-pay-method').removeClass('btn--selected');
	$(e.currentTarget).addClass('btn--selected');
	$('input[name="pay-method-input"]').addClass('no-display');
	$('select[name="bankAccount"]').addClass('no-display');
	let currentSelect = $(e.currentTarget).text();
	if (currentSelect === "Deposito") {
		$('input[name="pay-method-input"]').removeClass('no-display').focus();
	}
	if (currentSelect === "Transferencia") {
		$('select[name="bankAccount"]').removeClass('no-display')
	}
});


$('a[href="#add-payment-page"]').on('click', (e) => {
	e.preventDefault();
	window.location = "#add-payment-page";
	$('input[name="search-resident"]').focus();
});

$('a[href="#residents-list-page"]').on('click', (e) => {
	e.preventDefault();
	window.location = "#residents-list-page";
	$('input[name="search-resident-list"]').focus();
});

$('#btn-confirm').on('click', (e) => {
	e.preventDefault();
	if ($('.btn--selected').length < 1) {
		flashMessage('Seleccione un metodo de pago', 'flashmessage--danger');
		return;
	}

	if ($('.js-btn-pay-method.btn--selected').text() === "Deposito") {
		if ($('input[name="pay-method-input"]').val().length === 0) {
			flashMessage('Complete el campo vacio', 'flashmessage--danger');
			$('input[name="pay-method-input"]').focus();
			return;
		}
	}
	if ($('.js-btn-pay-method.btn--selected').text() === "Transferencia") {
		if ($('select[name="bankAccount"] option:selected').val() === ""){
			flashMessage('Seleccione un numero de cuenta', 'flashmessage--danger');
			return;
		}
	}
	let tempReceipt = getTempReceipt();
	let invoiceID = tempReceipt.invoiceID;
	let date = tempReceipt.date;
	let resident = tempReceipt.resident;
	let amount = tempReceipt.amount;
	let month = tempReceipt.month;
	let payMethod = tempReceipt.payMethod;
	if (tempReceipt.depositNumber !== ""){
		$('#jsPayMethodNumberModal').text(tempReceipt.depositNumber);
	}
	if (tempReceipt.accountNumber !== "") {
		$('#jsPayMethodNumberModal').text(tempReceipt.accountNumber);
	}

	$('#jsResidentModal').text(resident);
	$('#jsInvoiceNumberModal').text(invoiceID);
	$('#jsDateModal').text(date);
	$('#jsAmountModal').text(amount);
	$('#jsMonthModal').text(month);
	$('#jsPayMethodModal').text(payMethod + ":");
	$('.modal-receipt').removeClass('no-display');
});

function btnClick(btn, callback) {
	$(btn).on('click', (e) => {
		e.preventDefault();
		callback(e);
	});
}

function toNumber(string) {
	return parseInt(numeral(string).format('0'));
}
function toDecimal(string) {
	return parseFloat(numeral(string).format('0.00'));
}

btnClick('#btn-save-receipt', (e) => {
	saveReceipt();
});

function saveReceipt(print) {
	let tempReceipt = getTempReceipt();
	let invoiceID = tempReceipt.invoiceID;
	let date = tempReceipt.date;
	let payMethod = tempReceipt.payMethod;
	let depositNumber = tempReceipt.depositNumber;
	let accountNumber = tempReceipt.accountNumber;
	let resident = tempReceipt.resident;
	let residentId = tempReceipt.residentId;
	let category = tempReceipt.category;
	let amount = toNumber(addPaymentPage.receiptAmount);
	let status = 'Pagada';
	let amountForSaveInInvoice = undefined;

	if (amount < addPaymentPage.tempReceiptAmount) {
		status = 'Sin pagar'
		amountForSaveInInvoice = addPaymentPage.receiptAmount;
	} else if ((amount - addPaymentPage.tempReceiptAmount) === 0) {
		status = 'Pagada';
		amount = addPaymentPage.tempReceiptAmount;
		amountForSaveInInvoice = addPaymentPage.originalReceiptAmount;

		mongoDbObj.residents.update(
			{
				"id": residentId
			},
			{
				$pull:
					{
						pendingInvoices : invoiceID
					},
				$push:
					{
						payedInvoices : invoiceID 
					}
			},
			function(err, result) {
				if (err) {
					console.log(err);
					return;
				}
			}
		);
	}


	flashMessage("Salvando...", 'flashmessage--info')
	mongoDbObj.invoices.update(
		{
			"id": invoiceID
		},
		{
			$set:
				{
					"datePayed": date,
					"status" : status,
					"payMethod": payMethod,
					"depositNumber": depositNumber,
					"accountNumber": accountNumber, 
					"resident": resident,
					"amount": toNumber(amountForSaveInInvoice)
				}
		},
		function(err, result) {
			if (err) {
				console.log(err);
				return;
			}
			console.log(result);
			flashMessage("Salvado", "flashmessage--success");
			$('#btn-close-modal').trigger('click');
			$('#btn-close-form-receipt').trigger('click');
			if (print) {
				setTimeout(function() {
					window.open('./receipt.html');
				}, 900);
			}
		}
	);
	mongoDbObj.accounting.update(
		{
			id: "general"
		},
		{
			$inc: {
				totalBalance: amount,
				totalCashIn: amount,
				totalExpensives: 0
			}
		}, function(err, result) {
			if (err) return console.log(err);
		}
	);

	let incObj = {
		cashOut: 0,
		extraordinaryPayments: 0,
		maintenancePayments: 0
	};
	incObj['cashIn'] = amount;
	incObj['balance'] = amount;
	incObj[tempReceipt.type] = amount;
	mongoDbObj.accounting.updateOne(
		{
			id: "by-month",
			month: accountingPage.currentMonth(),
			year: accountingPage.currentYear()
		},
		{
			$inc: incObj
		},
		{
			upsert: true
		}, function(err, result) {
			if(err) return console.log(err)
		} 
	);

	let incObj2 = {
		cashIn: 0,
		balance: 0,
		cashOut: 0,
		maintenancePayments: 0,
		extraordinaryPayments: 0
	}
	incObj2.cashIn = amount;
	incObj2.balance = amount;
	incObj2[tempReceipt.type] = amount;
	mongoDbObj.accounting.updateOne(
		{
			id: "by-year",
			year: accountingPage.currentYear()
		},
		{
			$inc: incObj2
		},
		{
			upsert: true
		}, function(err, result) {
			if(err) return console.log(err)
		} 
	);
}


$('#btn-print-receipt').on('click', (e) => {
	let jsonReceipt = JSON.stringify(getTempReceipt());
	localStorage.setItem('tempReceipt', jsonReceipt);
	saveReceipt(true);
});

$('input[name="search-resident-list"]').on('keydown', (e) => {
	if (e.which == 13 || e.keyCode == 13) {
		$('#searchResident').trigger('click');
	}
});

btnClick('#searchResident', (e) => {
	let queryString;
	let searchInput = $('input[name="search-resident-list"]').val();
	if (isNaN(parseInt(searchInput))) {
		queryString = {$text: {$search: searchInput}};
	} else { // Is a number
		queryString = {"id": parseInt(searchInput)};
	}
	mongoDbObj.residents.find(queryString).toArray(function(err, doc) {
		if (err) {
			console.log(err); // LOG THIS
			return;
		} else {
			$('#search-list-resident-card').html("").removeClass('no-display');
			console.log(doc.length);
			if(doc.length === 0){
				flashMessage("No hay resultados", 'flashmessage--info');
				return;
			}
			if(doc.length === 1) {
			$('#createResident').addClass('no-display');
				loadResidentCard(doc[0]);
				return;
			}
			$('#search-list-resident-card').html("").removeClass('no-display');
			$('#createResident').addClass('no-display');
			_.forEach(doc, function(item, index) {
				$('#search-list-resident-card').append(
					`<li><a class="jsListItemResidentCard" index="${index}"">${item.id} | ${item.fullName}<i class="fa fa-chevron-right"></i></a></li>`
				);
				btnClick('.jsListItemResidentCard', (e) => {
					$('#search-list-resident-card').addClass('no-display');
					let array_index = parseInt($(e.target).attr('index'));
					loadResidentCard(doc[array_index]);
				});
			});
		}
	});
});

btnClick('#save-resident', (e) => {
	let firstName = $('input[name="firstName"]').val();
	let lastName = $('input[name="lastName"]').val();
	let category = $('select[name="category"] option:selected').val();

	if(firstName == "" || lastName == "" || category == "") {
		flashMessage('Llene los campos requeridos', 'flashmessage--danger');
		return
	}
	saveResident();
});

btnClick('#createResident', (e) => {
	creatingUser = true;
	$('#createResident').addClass('no-display');
	$('.form-resident-card').removeClass('no-display');
	$('.residents-list-page__box #btn-close-modal').removeClass('no-display');
	$('#save-resident').removeClass('no-display');
	$('input[name="search-resident-list"]').addClass('no-display');
	$('#searchResident').addClass('no-display');
	$('.btn-delete-resident').addClass('no-display');
});

function saveResident() {
	if (creatingUser === true){
		let firstName = $('input[name="firstName"]').val();
		let lastName = $('input[name="lastName"]').val();

		let tempObj = {
			id: configs.nextResidentNumber,
			firstName: firstName,
			lastName: lastName,
			fullName: firstName + " " + lastName,
			firstName2: $('input[name="firstName2"]').val(),
			lastName2: $('input[name="lastName2"]').val(),
			firstNameOwner: getInputVal('firstNameOwner') == "" ? firstName : getInputVal('firstNameOwner'),
			lastNameOwner: getInputVal('lastNameOwner') == "" ? lastName : getInputVal('lastNameOwner'),
			category: $('select[name="category"] option:selected').val(),
			email: $('input[name="email"]').val(),
			address: $('input[name="address"]').val(),
			phone: $('input[name="phone"]').val(),
			cellPhone: $('input[name="cellPhone"]').val(),
			cellPhone2: $('input[name="cellPhone2"]').val(),
			cellPhoneOwner: getInputVal('cellPhoneOwner') == "" ? getInputVal('cellPhone') : getInputVal('cellPhoneOwner'),
			personID: $('input[name="personID"]').val(),
			personID2: $('input[name="personID2"]').val(),
			personIDOwner: getInputVal('personIDOwner') == "" ? getInputVal('personID') : getInputVal('personIDOwner'),
			bankAccount: [ 
				{
					bankName: $('input[name="bankName1"]').val(),
					bank: $('input[name="bank1"]').val(),
				},
				{
					bankName: $('input[name="bankName2"]').val(),
					bank: $('input[name="bank2"]').val(),
				},
				{
					bankName: $('input[name="bankName3"]').val(),
					bank: $('input[name="bank3"]').val(),
				}
			]
		};
		saveNewResidentToDB(tempObj)
		.then((result) => {
			flashMessage('Usuario creado', 'flashmessage--success');
			creatingUser = false;
			$('.residents-list-page__box #btn-close-modal').trigger('click');
			configs.nextResidentNumber++;
			localStorage.setObj('configs', configs);
			// updateConfigs();

			console.log(configs);
			mongoDbObj.configs.updateOne({id: 1}, {$set: configs}, (err, result) => {
				if (err) return console.log(err);
				console.log(result);
			});
		})
		.catch((reason) => {
			flashMessage('Usuario No creado', 'flashmessage--danger');
			console.log(reason);
		});
	} else {
		console.log('Just saving');
		let id = $('#search-list-resident-id').attr('data');
		let firstName = $('input[name="firstName"]').val();
		let lastName = $('input[name="lastName"]').val();

		let tempObj = {
			firstName: firstName,
			lastName: lastName,
			fullName: firstName + " " + lastName,
			firstName2: $('input[name="firstName2"]').val(),
			lastName2: $('input[name="lastName2"]').val(),
			firstNameOwner: getInputVal('firstNameOwner') == "" ? firstName : getInputVal('firstNameOwner'),
			lastNameOwner: getInputVal('lastNameOwner') == "" ? lastName : getInputVal('lastNameOwner'),
			category: $('select[name="category"] option:selected').val(),
			email: $('input[name="email"]').val(),
			address: $('input[name="address"]').val(),
			phone: $('input[name="phone"]').val(),
			cellPhone: $('input[name="cellPhone"]').val(),
			cellPhone2: $('input[name="cellPhone2"]').val(),
			cellPhoneOwner: getInputVal('cellPhoneOwner') == "" ? getInputVal('cellPhone') : getInputVal('cellPhoneOwner'),
			personID: $('input[name="personID"]').val(),
			personID2: $('input[name="personID2"]').val(),
			personIDOwner: getInputVal('personIDOwner') == "" ? getInputVal('personID') : getInputVal('personIDOwner'),
			bankAccount: [ 
				{
					bankName: $('input[name="bankName1"]').val(),
					bank: $('input[name="bank1"]').val(),
				},
				{
					bankName: $('input[name="bankName2"]').val(),
					bank: $('input[name="bank2"]').val(),
				},
				{
					bankName: $('input[name="bankName3"]').val(),
					bank: $('input[name="bank3"]').val(),
				}
			]		
		};
		saveResidentToDB(tempObj, id)
		.then((result) => {
			flashMessage('Residente actualizado', 'flashmessage--success');
			$('.residents-list-page__box #btn-close-modal').trigger('click');
		})
		.catch((reason) => {
			flashMessage('No se pudo actualizar los datos', 'flashmessage--danger');
		});
	}
}

function saveResidentToDB(data, id) {
	return new Promise((resolve, reject) => {
		mongoDbObj.residents.updateOne({id: parseInt(id)}, {$set: data}, (err, result) => {
			if (err) return reject(err);
			return resolve(result);
		});
	});
}
function saveNewResidentToDB(data) {
	console.log(data);
	return new Promise((resolve, reject) => {
		mongoDbObj.residents.insert(data, (err, result) => {
			if (err) return reject(err);
			return resolve(result);
		});
	});
}

function loadResidentCard(resident) {
	console.log(resident);
	$('.form-resident-card').removeClass('no-display');
	$('.residents-list-page__box #btn-close-modal').removeClass('no-display');
	$('#save-resident').removeClass('no-display');
	$('#createResident').addClass('no-display');
	$('.btn-delete-resident').removeClass('no-display');
	$('input[name="search-resident-list"]').addClass('no-display');
	$('#searchResident').addClass('no-display');
	
	$('#search-list-resident-id').text(`Propiedad No. ${resident.id}`).attr('data', resident.id);
	$('input[name="firstName"]').val(resident.firstName);
	$('input[name="firstName2"]').val(resident.firstName2);
	$('input[name="firstNameOwner"]').val(resident.firstNameOwner);
	$('input[name="lastName"]').val(resident.lastName);
	$('input[name="lastName2"]').val(resident.lastName2);
	$('input[name="lastNameOwner"]').val(resident.lastNameOwner);
	$(`select[name="category"]`).val('empty');
	$(`select[name="category"]`).val(resident.category);
	$('input[name="email"]').val(resident.email);
	$('input[name="address"]').val(resident.address);
	$('input[name="phone"]').val(resident.phone);
	$('input[name="cellPhone"]').val(resident.cellPhone);
	$('input[name="cellPhone2"]').val(resident.cellPhone2);
	$('input[name="cellPhoneOwner"]').val(resident.cellPhoneOwner);
	$('input[name="personID"]').val(resident.personID);
	$('input[name="personID2"]').val(resident.personID2);
	$('input[name="personIDOwner"]').val(resident.personIDOwner);
	if (resident.bankAccount.length > 0) {
		$('input[name="bankName1"]').val(resident.bankAccount[0].bankName);
		$('input[name="bankName2"]').val(resident.bankAccount[1].bankName);
		$('input[name="bankName3"]').val(resident.bankAccount[2].bankName);
		$('input[name="bank1"]').val(resident.bankAccount[0].bank);
		$('input[name="bank2"]').val(resident.bankAccount[1].bank);
		$('input[name="bank3"]').val(resident.bankAccount[2].bank);
	}

	$('.modal__delete-resident #resident').text(`${resident.fullName} #(${resident.id})`);
}

btnClick('.residents-list-page__box #btn-close-modal', (e) => {
	$('#search-list-resident-id').text("");
	$('.form-resident-card').addClass('no-display');
	$('.residents-list-page__box #btn-close-modal').addClass('no-display');
	$('#save-resident').addClass('no-display');
	$('input[name="search-resident-list"]').removeClass('no-display');
	$('#searchResident').removeClass('no-display');
	$('#createResident').removeClass('no-display');
	$('.modal__delete-resident').addClass('no-display');
	$('.btn-delete-resident').addClass('no-display');
	clearResidentCardFields();
});

function clearResidentCardFields() {
	$('input[name="firstName"]').val("");
	$('input[name="firstName2"]').val("");
	$('input[name="firstNameOwner"]').val("");
	$('input[name="lastName"]').val("");
	$('input[name="lastName2"]').val("");
	$('input[name="lastNameOwner"]').val("");
	$('select[name="category"]').val("empty");
	$('input[name="email"]').val("");
	$('input[name="address"]').val("");
	$('input[name="phone"]').val("");
	$('input[name="cellPhone"]').val("");
	$('input[name="cellPhone2"]').val("");
	$('input[name="cellPhoneOwner"]').val("");
	$('input[name="personID"]').val("");
	$('input[name="personID2"]').val("");
	$('input[name="personIDOwner"]').val("");
	$('input[name="bankName1"]').val("");
	$('input[name="bank1"]').val("");
	$('input[name="bankName2"]').val("");
	$('input[name="bank2"]').val("");
	$('input[name="bankName3"]').val("");
	$('input[name="bank3"]').val("");
}

btnClick('.btn-delete-resident', (e) => {
	$('.modal__delete-resident').removeClass('no-display');
	btnClick('.modal__delete-resident #btn-close-modal', (e) => {
		$('.modal__delete-resident').addClass('no-display');
	});
});

btnClick('.modal__delete-resident #confirm-delete', (e) => {
	let currentResident = $('#search-list-resident-id').attr('data');
	$('.modal__delete-resident').addClass('no-display');
	deleteResident(parseInt(currentResident))
	.then(deletePendingInvoices(currentResident))
	.then((result) => {
		flashMessage('Residente y sus facturas pendientes eliminados', 'flashmessage--info');
		$('.btn-delete-resident').addClass('no-display');
	})
	.catch((reason) => {
		console.log(reason);
	});
});

function deleteResident (id) {
	return new Promise((resolve, reject) => {
		mongoDbObj.residents.deleteOne({id: id}, (err, result) => {
			if (err) return reject(err);
			return resolve(result);
		});
	});
}

function deletePendingInvoices (id) {
	mongoDbObj.invoices.deleteMany({residentId: id, status: "Sin pagar"}, (err, result) => {
		if (err) return Promise.reject(err);
		return Promise.resolve(result);
	});
}

