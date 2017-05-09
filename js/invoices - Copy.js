


var configs;

Storage.prototype.setObj = function(key, obj) {
	return this.setItem(key, JSON.stringify(obj));
}
Storage.prototype.getObj = function(key) {
	return JSON.parse(this.getItem(key));
}

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
		afterGetConfigs(configs);
	});
});

btnClick('#printInBatch', (e) => {
	$('.modal__select-batch').removeClass('no-display');
});

btnClick('#searchInvoiceBatch', (e) => {
	let month = $(`select[name="batch-month"] option:selected`).val();
	let year = $(`select[name="batch-year"] option:selected`).val();

	if(month === "") {
		flashMessage("No ha seleccionado un Mes aun", "flashmessage--danger");
		return;
	}
	searchInvoiceBatch(month, year)
	.then((doc) => {
		console.log(doc);
		let invoiceList = doc
		_.forEach(invoiceList, (item, index) => {
			console.log(item);
			searchResident(item)
			.then((doc) => {
				let resident = doc;
				console.log(resident);
				let tempArray = localStorage.getObj('tempInvoices').tempArray;
				tempArray.push(resident);
				localStorage.setObj('tempInvoices', {tempArray: tempArray});
				console.log(tempArray);
				console.log('tempInvoices updated');
			})
			.catch((err) => {
				console.log(err);
			});

			if (invoiceList.length === (index + 1 )) {
				window.open('./invoices.html');
				setTimeout(printInvoices, 900);
			}
		});
	})
	.catch((err) => {
		console.log("Error");
		console.log(err);
	});
});

btnClick('#printInvoice', (e) => {
	window.open('./invoices.html');
	setTimeout(printInvoices, 900);
});

function printInvoices() {
	var tempInvoices = JSON.parse(localStorage.getItem('tempInvoices')).tempArray;
	_.forEach(tempInvoices, (item, index) => {
		let pendingInvoices = item.pendingInvoices;
		$('.invoice-body').append(`
			<div id="${item.id}" class="invoice-page">
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
						<td class="total">RD$ ${item.invoice.amount}</td>
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
		if (pendingInvoices.length > 1) {
			pendingInvoices = pendingInvoices.shift(item.invoice.id);
			_.forEach(pendingInvoices, (item, index) => {
				mongoDbObj.invoices.findOne({id: item}).toArray((err, doc) => {
					$.insertBefore(`div#${doc.residentId} .data__total`).html(`
					<tr class="data">
						<td class="qty">1</td>
						<td class="description">${doc.description}</td>
						<td class="amount">RD$ ${doc.amount}</td>
						<td class="total">RD$ ${doc.amount}</td>
					</tr>
					`);
				});
			});
		}
		if (tempInvoices.length === (index + 1)) {
			window.print();
		}

	});
}

function searchInvoiceBatch(month, year) {
	return new Promise((resolve, reject) => {
		let rg = RegExp(`^${month}${year}`);
		mongoDbObj.invoices.find({id: rg}).toArray((err, doc) => {
			if (err) {
				reject(err);
			} else {
				resolve(doc);
			}
		});
	});
}

function searchResident(invoice) {
	return new Promise((resolve, reject) => {
		console.log(invoice);
		let residentId = invoice.residentId;
		mongoDbObj.residents.find({id: residentId}).toArray((err, doc) => {
			if (err) {
				reject(err);
			} else {
				doc[0].invoice = invoice;
				resolve(doc[0]);
			}
		});
	});
}

function afterGetConfigs(configs) {
	console.log(configs);
	let i = configs.monthPrefix;
	for (i; i <= 12; i++) {
		let month = moment().month(i - 1).format("MMMM");
		$(`select[name="invoice-month"]`)
		.append(`<option value="${i}">${month}</option`)
	}
}

btnClick('#createInvoices', (e) => {
	configs.selectedMonth = $(`select[name="invoice-month"] option:selected`).val();
	let selectedMonth = configs.selectedMonth;
	let year = configs.yearPrefix;
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
		console.log(doc);
		_.forEach(doc, (item, index) => {
			let invoiceNumber = configs.selectedMonth + year + configs.invoiceSequence;
			configs.invoiceSequence++;
			let id = item.id;
			let category = (item.category).toLowerCase();
			let amount = configs.categoryPrices[category];
			updateConfigs({invoiceSequence: configs.invoiceSequence})
			.then(updatePendingInvoice(invoiceNumber, id))
			.then(createInvoice(invoiceNumber, id, category, amount))
			.then((result) => {
				console.log(result);
			})
			.catch((err) => {
				console.log(err);
			});

			if (doc.length === (index + 1 )) {
				if (parseInt(configs.selectedMonth) === 12) {
					updateConfigs({monthPrefix: 1, yearPrefix: configs.yearPrefix + 1});
					return;
				}
				updateConfigs({monthPrefix: parseInt(configs.selectedMonth)});
			}
		});
	});
});

function updateConfigs(data) { // Updating invoiceSequence
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
	mongoDbObj.residents.update({id: id}, {$push: {pendingInvoices: invoiceNumber}}, (err, result) => {
		if (err) {
			return Promise.reject(err);
		} else {
			return Promise.resolve(result);
		}
	});
}

function createInvoice(invoiceNumber, id, category, amount) {
	let data = {
		id: invoiceNumber,
		dateRealeased: moment().format('DD/MM/YYYY'),
		month: moment().month(configs.selectedMonth - 1).format('MMMM'),
		status: "Sin pagar",
		residentId: id,
		category: category,
		amount: amount,
		dueDate: moment().month(configs.selectedMonth -1).endOf('month').format('DD/MMMM/YYYY'),
		description: `Mantenimiento de el Residencial (${this.month})`
	}

	mongoDbObj.invoices.insertOne(data, (err, result) => {
		if (err) {
			return Promise.reject(err);
		} else {
			return Promise.resolve(result);
		}
	});
}