'use strict'


var configs;
localStorage.setObj('tempInvoices', {tempArray: []});

btnClick('a[href="#invoices-page"]', (e) => {
	location = "#invoices-page";
	// let month = moment().month() + 1;
	// $(`select[name="invoice-month"] option[value="${month}"`).attr('selected', 'selected');
});

btnClick('#generateInvoices', (e) => {
	mongoDbObj.configs.findOne({}, (err, doc) => {
		if (err) {
			console.log(err);
			return
		}
		configs = doc;
		yesDisplay('.modal__generate-invoices');
		noDisplay('#generateNormalInvoice');
		noDisplay('#generateExtraordinaryInvoice');
		yesDisplay('#generateNormalInvoicesBatch');
		yesDisplay('#generateExtraordinaryInvoicesBatch');

		$('.choose-batch-type p').text('Seleccione el tipo de Batch');

		let monthPrefix = configs.monthPrefix;
		populateSelect(1);
	});
});

btnClick('#generateOneInvoice', (e) => {
	yesDisplay('.modal__generate-invoices');
	yesDisplay('#generateNormalInvoice');
	yesDisplay('#generateExtraordinaryInvoice');
	noDisplay('#generateNormalInvoicesBatch');
	noDisplay('#generateExtraordinaryInvoicesBatch');

	$('.choose-batch-type p').text('Seleccione el tipo de Factura');
	populateSelect(1);
});

btnClick('#printInBatch', (e) => {
	// $('.modal__select-batch').removeClass('no-display');
	localStorage.setObj('tempInvoices', {tempArray: []});
	$('#searchInvoiceBatch').trigger('click');
});

btnClick('#btn-search-invoice', (e) => {
	let invoiceNumber = $('input[name="search-invoice"]').val();
	if (invoiceNumber == "") return;
	mongoDbObj.invoices.find({id: invoiceNumber}).toArray((err, doc) => {
		if (err) return console.log(err);
		console.log(doc);
		if (doc.length === 0) return flashMessage('Numero de factura no encontrado', 'flashmessage--info');
		searchResident(doc[0].residentId)
		.then((resident) => {
			console.log(resident);
			resident.invoice = doc[0];
			resident.pendingInvoices = [doc[0]]; // Ambiguo
			// invoicesPage.getPendingInvoices(resident.id);
			// resident.pendingInvoices = invoicesPage.pendingInvoices;
			// console.log(resident.pendingInvoices);
			let tempArray = localStorage.getObj('tempInvoices').tempArray;
			tempArray.push(resident);
			// searchPendingInvoice(resident);

			modalSearchInvoice.invoiceId = '#' + resident.invoice.id;
			modalSearchInvoice.resident = resident.fullName;
			modalSearchInvoice.month = resident.invoice.month;
			modalSearchInvoice.status = resident.invoice.status;
			modalSearchInvoice.amount = resident.invoice.amount;
			modalSearchInvoice.description = resident.invoice.description;

			$('.modal__search-invoice').removeClass('no-display');
			let option = $('#modal__select-search-invoice option:selected').val();
			$('#modal__select-search-invoice').on('change', (e) => {
				option = $('#modal__select-search-invoice option:selected').val();
			});
			$('#modal__btn-search-invoice-continue').one("click", (e) => {
				e.preventDefault();
				$('#modal__search-invoice').addClass('no-display');
				switch (option) {
					case "":
						return;
						break;
					case "print":
						localStorage.setObj('tempInvoices', {tempArray: tempArray});
						window.open('./invoices.html');
						$('.modal__search-invoice').addClass('no-display');
						break;
					case "delete":
						mongoDbObj.invoices.deleteOne({id: resident.invoice.id}, (err, result) => {
							if (err) return console.log(err);
							resident.pendingInvoices.shift(resident.invoice.id);
							mongoDbObj.residents.update({id: resident.id}, {$pull: {pendingInvoices: resident.invoice.id}}, (err, result) => {
								if (err) return console.log(err);
								flashMessage('Factura borrada', 'flashmessage--info');
								$('.modal__search-invoice').addClass('no-display');
								console.log(result);
							});
						});
						break;
				}
			});
		});
	});
});

btnClick('.modal__search-invoice #btn-close-modal', (e) => {
	$('.modal__search-invoice').addClass('no-display');
});

btnClick('#searchInvoiceBatch', (e) => {
	/*let month = $(`select[name="batch-month"] option:selected`).val();
	let year = $(`select[name="batch-year"] option:selected`).val();

	if(month === "") {
		flashMessage("No ha seleccionado un Mes aun", "flashmessage--danger");
		return;
	}*/
	getResidentsWithPendingInvoices()
	.then((residents) => {
		_.forEach(residents, (item, index) => {
			searchPendingInvoice(item);

			if (residents.length === (index + 1)) {
				window.open('./invoices.html');
			}
		});
	})
	.then((result) => {
		console.log(result);
	})
	.catch((reason) => {
		console.log(reason);
	});
});


function attachInvoices(data) {

}

function getResidentsWithPendingInvoices() {
	return new Promise((resolve, reject) => {
		mongoDbObj.residents.find({pendingInvoices: {$not: {$size: 0}}}).toArray((err, doc) => {
			if (err) return reject(doc);
			return resolve(doc);
		});
	});
}


function printInvoices() {
	var tempInvoices = JSON.parse(localStorage.getItem('tempInvoices')).tempArray;
	_.forEach(tempInvoices, (item, index) => {
		$('.invoice-body').append(`
			<div class="invoice-page">
				<div class="owner-details">
					<img src="img/logo-elducado.png">

					<p class="bigger-text bold">FACTURA</p>

					<p>Junta de Vecinos</p>
					<p>Residencial El Ducado</p>
					<p>Santo Domingo, D.N</p>
				</div>

				<div class="resident-details inline-block">
					<p class="big-text bold">RESIDENTE</p>
					<p id="jsResidentInvoice">${item.fullName}</p>
					<p id="jsAddressInvoice">${item.address}</p>
					<p>Residencial El Ducado</p>
					<p>Santo Domingo, D.N</p>
				</div>

				<div class="invoice-details inline-block">
					<p class="big-text bold">FACTURA:</p>
					<p class="big-text bold">FACTURA FECHA:</p>
					<p class="big-text bold">PAGAR ANTES DE:</p>
				</div>
				
				<div class="invoice-details__data inline-block">
					<span id="jsInvoiceNumberInvoice">${item.invoice.id}</span>
					<span id="jsDateInvoice">${item.invoice.dateRealeased}</span>
					<span id="jsDueDateInvoice">${item.invoice.dueDate}</span>
				</div>

				<table class="invoice">
					<tr class="table-head">
						<th class="qty">CANTIDAD</th>
						<th class="description">DESCRIPCIÓN</th>
						<th class="amount">MONTO</th>
						<th class="total">TOTAL</th>
					</tr>
					<tr class="data">
						<td class="qty">1</td>
						<td class="description">${item.invoice.description}</td>
						<td class="amount">RD$ ${item.invoice.amount}</td>
						<td class="total">RD$ ${item.total}</td>
					</tr>
					<tr class="data__total">
						<td class="qty"></td>
						<td class="description"></td>
						<td class="amount">TOTAL</td>
						<td class="total">RD$ ${item.invoiceTotal}</td>
					</tr>
				</table>
				
				<table class="footer">
					<tr class="center-text">
						<td>
							<p>Formas de Pago</p>
							<br>
							<p>Pagos en Efectivo</p>
							<p>Caseta de Pago (Garita)</p>
							<br>
							<p>Deposito o Transferencia</p>
							<p>Cuenta No. ${item.bankAccountNumber} (${item.bank})</p>
							<br>
							<p>Enviar Notificaciones de pagos al email</p>
							<p>${item.email}</p>
						</td>
						<td class="vertical-line"></td>
						<td class="frase">${item.frase}</td>
					</tr>
				</table>
			</div>
		`);
		if (tempInvoices.length === (index + 1)) {
			window.print();
		}
	});
}

function searchInvoiceBatch(month, year) {
	return new Promise((resolve, reject) => {
		let rg = RegExp(`^${month}${year}`);
		let tempArray = [];
		mongoDbObj.invoices.find({id: rg}).toArray((err, doc) => {
			if (err) {
				reject(err);
			} else {
				_.forEach(doc, (item, index) => {
					tempArray.push(item.residentId);
					if (doc.length === (index + 1)) {
						resolve(tempArray);
					}
				});
			}
		});
	});
}

function searchResident(residentId) {
	return new Promise((resolve, reject) => {
		mongoDbObj.residents.findOne({id: residentId}, (err, doc) => {
			if (err) return reject(err);
			resolve(doc);
		});
	})
}

function searchPendingInvoice(resident) {
	let pendingInvoices = resident.pendingInvoices;
	mongoDbObj.invoices.find({id: {$in: pendingInvoices}}).toArray((err, doc) => {
		console.log(doc);
		if (err) {
			return console.log("Error")
		}
		resident.pendingInvoices = doc.reverse();
		console.log(resident);
		let tempArray = localStorage.getObj('tempInvoices').tempArray;
		tempArray.push(resident);
		localStorage.setObj('tempInvoices', {tempArray: tempArray});
	});
}

function printOneInvoice(invoiceId) {
	localStorage.setObj('tempInvoices', {tempArray: []});
	mongoDbObj.invoices.find({id: invoiceId}).toArray((err, doc) => {
		if (err) return console.log(err);
		let invoice = doc[0];
		let residentId = invoice.residentId;
		searchResident(residentId)
		.then((resident) => {
			resident.invoice = invoice;
			resident.pendingInvoices = [invoice];
			let tempArray = localStorage.getObj('tempInvoices').tempArray;
			tempArray.push(resident);
			localStorage.setObj('tempInvoices', {tempArray: tempArray});
			window.open('./invoices.html');
		});
	});
}

function populateSelect(monthPrefix) {
	let i = monthPrefix;
	$(`select[name="invoice-month"]`).html('');
	for (i; i <= 12; i++) {
		let month = moment().month(i - 1).format("MMMM");
		$(`select[name="invoice-month"]`)
		.append(`<option value="${i}">${_.capitalize(month)}</option>`)
	}

	let currentYear = moment().format('YYYY');
	let nextYear = moment().add(1, 'year').format('YYYY');
	$('select[name="invoice-year"]').html('');
	$('select[name="invoice-year"]').append(`
		<option value="${currentYear}">${currentYear}
		</option> <option value="${nextYear}">${nextYear}</option>
	`)
}

btnClick('#generateNormalInvoicesBatch', (e) => {
	noDisplay('.inner-box');
	yesDisplay('.generate-normal-invoices');
	$('#generateNormalInvoicesBatchActual').unbind();
	btnClick('#generateNormalInvoicesBatchActual', generateNormalInvoicesBatch);
});

btnClick('#generateNormalInvoice', (e) => {
	noDisplay('.inner-box');
	yesDisplay('.generate-normal-invoices');
	$('#generateNormalInvoicesBatchActual').unbind(); // Borrowing this btn
	btnClick('#generateNormalInvoicesBatchActual', () => {
		noDisplay('.inner-box');
		yesDisplay('.choose-resident');
	});
	modalSingleInvoice.handleResults = modalSingleInvoice.handleResultsNormal;
	modalSingleInvoice.btnModalConfirm = 'modalSingleInvoice.runGenerateNormalInvoice()'; 
})

function generateNormalInvoicesBatch(e) {
	configs.selectedMonth = $(`select[name="invoice-month"] option:selected`).val();
	let selectedMonth = configs.selectedMonth;
	let year = $(`select[name="invoice-year"] option:selected`).val();
	let rg = RegExp(`^${selectedMonth}${year}`); 
	console.log(rg);
	let queryString = { 
		pendingInvoices: { 
			$not: rg 
		}, 
		payedInvoices: {
			$not: rg
		}
	}
	mongoDbObj.residents.find(queryString).toArray((err, doc) => {
		if (err) {
			console.log(err);
			return
		}
		if (doc.length === 0) return flashMessage('Estas facturas ya existen', 'flashmessage--info');
		console.log(doc);
		_.forEach(doc, (item, index) => {
			let invoiceNumber = configs.selectedMonth + year + configs.invoiceSequence;
			configs.invoiceSequence++;
			let id = item.id;
			let category = item.category;
			let amount = configs.categoryPrices[category];
			let fullName = item.fullName;
			updateConfigs({invoiceSequence: configs.invoiceSequence})
			.then(updatePendingInvoice(invoiceNumber, id))
			.then(createInvoice(invoiceNumber, id, category, amount, configs.selectedMonth, year, fullName))
			.then((result) => {
				console.log(result);
				flashMessage('Facturas creadas', 'flashmessage--success');
				$('.modal__select-batch #btn-close-modal').trigger('click');
			})
			.catch((err) => {
				console.log(err);
			});

			if (doc.length === (index + 1 )) {
				if (parseInt(configs.selectedMonth) === 12) {
					updateConfigs({monthPrefix: 1, yearPrefix: configs.yearPrefix + 1});
					return;
				}
				updateConfigs({monthPrefix: parseInt(configs.selectedMonth) + 1});
			}
		});
	});
};

function generateNormalInvoice(residentId) {
	let selectedMonth = $(`select[name="invoice-month"] option:selected`).val();
	let year = $(`select[name="invoice-year"] option:selected`).val();
	let rg = RegExp(`^${selectedMonth}${year}`); 
	let queryString = {
		id: parseInt(residentId), 
		pendingInvoices: { 
			$not: rg 
		}, 
		payedInvoices: {
			$not: rg
		}
	}
	mongoDbObj.residents.find(queryString).toArray((err, doc) => {
		if (err) return console.log(err);
		if (doc.length === 0){
			flashMessage('Estas facturas ya existen', 'flashmessage--info');
			$('.modal__generate-invoices #btn-close-modal').trigger('click');
			return 
		} 
		let resident = doc[0];
		let invoiceNumber = selectedMonth + year + configs.invoiceSequence;
		configs.invoiceSequence++;
		let id = resident.id;
		let category = resident.category;
		let amount = configs.categoryPrices[category];
		let fullName = resident.fullName;
		updateConfigs({invoiceSequence: configs.invoiceSequence})
		.then(updatePendingInvoice(invoiceNumber, id))
		.then(createInvoice(invoiceNumber, id, category, amount, selectedMonth, year, fullName))
		.then((result) => {
			console.log(result);
			flashMessage('Facturas creadas', 'flashmessage--success');
			$('.modal__generate-invoices #btn-close-modal').trigger('click');
		})
		.catch((err) => {
			console.log(err);
		});
	});
}

btnClick('#generateExtraordinaryInvoicesBatch', (e) => {
	noDisplay('.inner-box');
	yesDisplay('.generate-extraordinary-invoices');
	modalSingleInvoice.btnGenerateExtraordinaryInvoices = 'generateExtraordinaryInvoicesBatchActual()';
});

btnClick('#generateExtraordinaryInvoice', (e) => {
	noDisplay('.inner-box');
	yesDisplay('.choose-resident');
	modalSingleInvoice.handleResults = modalSingleInvoice.handleResultsExtraordinary;
	modalSingleInvoice.btnGenerateExtraordinaryInvoices = 'modalSingleInvoice.showConfirmStep()';
	modalSingleInvoice.btnModalConfirm = 'generateExtraordinaryInvoiceActual()';
});

function generateExtraordinaryInvoicesBatchActual() {
	let year = configs.yearPrefix;
	
	mongoDbObj.residents.find().toArray((err, doc) => {
		if (err) {
			console.log(err);
			return
		}
		_.forEach(doc, (item, index) => {
			let invoiceNumber = `${year}${configs.invoiceSequence}`;
			configs.invoiceSequence++;
			let id = item.id;
			let category = item.category;
			let description = getInputVal('extraordinary-description');
			let amount = getInputVal('extraordinary-amount');
			let fullName = item.fullName;
			updateConfigs({invoiceSequence: configs.invoiceSequence})
			.then(updatePendingInvoice(invoiceNumber, id))
			.then(createInvoiceExtraordinary(invoiceNumber, id, category, description, amount, fullName))
			.then((result) => {
				console.log(result);
				$('.modal__generate-invoices #btn-close-modal').trigger('click');
				flashMessage('Facturas creadas', 'flashmessage--success');
			})
			.catch((err) => {
				console.log(err);
			});

			if (doc.length === (index + 1 )) {
				if (parseInt(configs.selectedMonth) === 12) {
					updateConfigs({monthPrefix: 1, yearPrefix: configs.yearPrefix + 1});
					return;
				}
			}
		});
	});
};

function generateExtraordinaryInvoiceActual() {
	let year = configs.yearPrefix;
	let residentId = parseInt(modalSingleInvoice.residentId);
	mongoDbObj.residents.find({id: residentId}).toArray((err, doc) => {
		if (err) {
			console.log(err);
			return
		}
		_.forEach(doc, (item, index) => {
			let invoiceNumber = `${year}${configs.invoiceSequence}`;
			configs.invoiceSequence++;
			let id = item.id;
			let category = item.category;
			let description = getInputVal('extraordinary-description');
			let amount = getInputVal('extraordinary-amount');
			let fullName = item.fullName;
			updateConfigs({invoiceSequence: configs.invoiceSequence})
			.then(updatePendingInvoice(invoiceNumber, id))
			.then(createInvoiceExtraordinary(invoiceNumber, id, category, description, amount, fullName))
			.then((result) => {
				console.log(result);
				$('.modal__generate-invoices #btn-close-modal').trigger('click');
				flashMessage('Facturas creadas', 'flashmessage--success');
			})
			.catch((err) => {
				console.log(err);
			});
		});
	});
}

function updateConfigs(data) { // Updating invoiceSequence
	console.log("updateConfigs");
	return new Promise((resolve, reject) => {
		mongoDbObj.configs.update({}, {$set: data}, (err, result) => {
			if (err) {
				reject(err);
			} else {
				console.log("Configs updated");
				resolve(result);
			}
		});
	});
}

function updatePendingInvoice(invoiceNumber, id) {
	let array = [invoiceNumber];
	mongoDbObj.residents.update({id: id}, {$push: {pendingInvoices: { $each: array, $position: 0}}}, (err, result) => {
		if (err) {
			return Promise.reject(err);
		} else {
			return Promise.resolve(result);
		}
	});
}

function createInvoice(invoiceNumber, id, category, amount, selectedMonth, year, fullName) {
	amount = toNumber(amount);
	let month = moment().month(selectedMonth - 1).format('MMMM');
	let data = {
		id: invoiceNumber,
		dateRealeased: moment().format('DD/MM/YYYY'),
		month: month,
		status: "Sin pagar",
		residentId: id,
		fullName: fullName,
		category: category,
		type: "maintenancePayments",
		amount: amount,
		originalAmount: amount,
		dueDate: moment().year(year).month(selectedMonth -1).endOf('month').format('DD/MMMM/YYYY'),
		description: `Mantenimiento de el Residencial (${_.capitalize(month)})`
	}

	mongoDbObj.invoices.insertOne(data, (err, result) => {
		if (err) {
			return Promise.reject(err);
		} else {
			return Promise.resolve(result);
		}
	})
}

function createInvoiceExtraordinary(invoiceNumber, id, category, description, amount, fullName) {
	console.log("createInvoiceExtraordinary");
	amount = toNumber(amount);
	let month = moment().format('MMMM');
	let data = {
		id: invoiceNumber,
		dateRealeased: moment().format('DD/MM/YYYY'),
		month: month,
		status: "Sin pagar",
		residentId: id,
		fullName: fullName,
		category: category,
		type: "extraordinaryPayments",
		amount: amount,
		originalAmount: amount,
		dueDate: moment().add(1, 'M').endOf('month').format('DD/MMMM/YYYY'),
		description: description
	}

	mongoDbObj.invoices.insertOne(data, (err, result) => {
		if (err) {
			return Promise.reject(err);
		} else {
			return Promise.resolve(result);
		}
	});
}
