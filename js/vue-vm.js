Vue.component('resident-search', {
	template: `<div id="vm-component-search" class="center-align">
    <input type="text" class="center-align box-radius" v-model="inputValue" @keyup.enter="search(inputValue)">
    <ul id="search-list" v-show="showList" class="center-align-absolute">
    	<li v-for="user in usersList"><a href="#" @click.prevent="search(user.id)">{{ user.id }} | {{ user.fullName }}</a></li> 
    </ul>
    
    <button class="btn center-align" @click="search(inputValue)"><i class="fa fa-search"></i> Buscar</button>
</div>`,
  data: function() {
  	return {
    	inputValue: '',
      	usersList: [],
      	showList: false
    }
  },
  props: ['runthis'],
  methods: {
  	search: function(id) {
  		let vm = this;
  		vm.showList = false;
    	let queryString;
  		console.log(id);
  		let searchInput = id; 
		if (typeof(id) === 'object') return flashMessage("El campo de busqueda esta vacio", "flashmessage--info");
    	if (typeof(id) === 'number') {searchInput = id.toString() }; 
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
					vm.runthis(doc[0]);
					return;
				}
				vm.usersList = doc;
				vm.showList = true;

				/*$('.jsListItem').on('click', (e) => {
					e.preventDefault();
					let residentId = $(e.target).attr('residentId');
					let fullName = $(e.target).attr('fullName');
					callback(residentId, fullName);
				});*/
			}
		});
    }
  }
});


var modalSingleInvoice = new Vue({
	el: '.modal__generate-invoices',
	data: {
		residentId: 'N/A',
		month: 'N/A',
		year: 'N/A',
		residentFullName: 'N/A',
		extraordinaryDescription: '',
		extraordinaryAmount: '',
		btnGenerateExtraordinaryInvoices: 'generateExtraordinaryInvoicesBatchActual()',
		btnModalConfirm: 'generateExtraordinaryInvoiceActual()',
		handleResults: this.handleResultsNormal,
		handleResultsNormal: function(residentId, fullName) {
			noDisplay('.inner-box');
			yesDisplay('.create-invoice-details');
			modalSingleInvoice.residentId = residentId;
			modalSingleInvoice.month = $(`select[name="invoice-month"] option:selected`).val();
			modalSingleInvoice.month = moment().month(modalSingleInvoice.month - 1).format('MMMM');
			modalSingleInvoice.residentFullName = fullName;
		},
		handleResultsExtraordinary: function(residentId, fullName) {
			noDisplay('.inner-box');
			yesDisplay('.generate-extraordinary-invoices');
			modalSingleInvoice.residentId = residentId;
			modalSingleInvoice.residentFullName = fullName;
			modalSingleInvoice.month = moment().format('MMMM');
		}
	},
	methods: {
		runGenerateNormalInvoice: function() {
			generateNormalInvoice(this.residentId)
		},
		search: function() {
			this.extraordinaryDescription = '';
			this.extraordinaryAmount = '';
			search('.choose-resident input[name="search-resident"]', '.choose-resident #search-list', this.handleResults)
		},
		showConfirmStep: function() {
			if(this.extraordinaryDescription === '' || this.extraordinaryAmount === '') {
				return flashMessage('Descripcion/Monto no pueden estar vacio', 'flashmessage--danger');
			}
			noDisplay('.inner-box');
			yesDisplay('.create-invoice-details');
		},
		formatAmount: function(event){
			accountingPage.formatAmount(event);
		}
	},
	watch: {
		month: function() {
			this.month = _.capitalize(this.month);
			console.log('Month changed');
		}
	}
});



var addPaymentPage = new Vue({
	el: '#add-payment-page',
	data: {
		receiptAmount: '',
		tempReceiptAmount: '',
		originalReceiptAmount: ''
	},
	computed: {

	},
	methods: {
		
	},
	watch: {
		receiptAmount: function() {
			if (toNumber(this.receiptAmount) > this.tempReceiptAmount){
				return this.receiptAmount = numeral(this.tempReceiptAmount).format('0,0');
			}
			return this.receiptAmount = numeral(this.receiptAmount).format('0,0');
		},
		tempReceiptAmount: function() {
			return this.tempReceiptAmount = toNumber(this.tempReceiptAmount)
		},
		originalReceiptAmount: function() {
			return this.originalReceiptAmount = toNumber(this.originalReceiptAmount)
		}
	}
});

var accountingPage = new Vue({
	el: '#accounting-page',
	data: {
		monthList: moment.months(),
		monthSelected: '',
		yearSelected: '',
		yearList: [],
		monthCredit: '',
		monthDebit: '',
		yearCredit: '',
		yearDebit: '',
		totalBalance: '',
		residents: [],
		debitCheque: '',
		debitName: '',
		debitDescription: '',
		debitAmount: '',
		debitDate: moment().format('YYYY-MM-DD'),
		debitList: [],
		extraordinaryInvoicesList: [],
		extraordinaryInvoicesDescriptions: [],
		currentInvoiceDescription: '',
		monthStatement: ''
	},
	methods: {
		currentMonth: function() {
			return _.capitalize(moment().format('MMMM'));
		},
		currentYear: function() {
			return moment().format('YYYY');
		},
		getYearList: function() {
			mongoDbObj.accounting.aggregate([
				{ $match: { id: "by-year" } },
				{ $group: { _id: "$year" } }
			]).toArray((err, result) => {
				if (err) return console.log(err);
				accountingPage.yearList = result;
			});
		},
		residentsList: function() {
			noDisplay('.accounting-page__inside-page');
			yesDisplay('#accounting-page-residents-list');
			yesDisplay('#btn-close-inside-page');
			$(`#accounting-page-residents-list .list .total-amount`).html('');
			mongoDbObj.residents.find({}).sort({id: 1}).toArray((err, doc) => {
				if (err) return console.log(err);
				accountingPage.residents = doc;
			});

			mongoDbObj.invoices.aggregate([
				{ $match: { status: "Sin pagar" } }, 
				{ $group: { _id: "$residentId", total: { $sum: "$amount" } } }
			]).toArray((err, result) => {
				if (err) return console.log(err);
				_.forEach(result, (item, index) => {
					let id = item._id;
					let amount = accountingPage.numeralFormat(item.total);
					$(`#accounting-page-residents-list .list[resident-id="${id}"`)
					.append(`<p class="total-amount"><i class="fa fa-dollar"></i> Monto Total Pendiente RD$: ${amount}</p>`);
				});
			});

		},
		closeInsidePage: function() {
			noDisplay('.accounting-page__inside-page');
			yesDisplay('#accounting-page-home');
			noDisplay('#btn-close-inside-page');
			this.monthStatement = '';
		},
		goMonthStatement: function() {
			noDisplay('.accounting-page__inside-page');
			yesDisplay('#accounting-page-month-statement');
			yesDisplay('#btn-close-inside-page');
			this.getYearList();
		},
		goResidentsResumen: function() {
			noDisplay('.accounting-page__inside-page');
			yesDisplay('#accounting-page-residents-resumen');
			yesDisplay('#btn-close-inside-page');
		},
		getMonthStatement: function() {
			let month = this.monthSelected;
			let year = this.yearSelected;
			if (month === '' || year === '') return flashMessage('Seleccione Mes y Año', 'flashmessage--danger');
			mongoDbObj.accounting.find({id: "by-month", month: month, year: year}).toArray((err, result) => {
				if (err) return console.log(err);
				if (result.length === 0) return flashMessage("No hay record de mes seleccionado", "flashmessage--info");
				accountingPage.monthStatement = result[0];
			});
		},
		extraordinaryInvoices: function() {
			noDisplay('.accounting-page__inside-page');
			yesDisplay('#accounting-page-extraordinary-invoices');
			yesDisplay('#btn-close-inside-page');
			this.extraordinaryInvoicesList = [];
			mongoDbObj.invoices.aggregate([ 
				{ $match : { type: "extraordinaryPayments" } }, 
				{ $group : { _id: "$description" } } 
			]).toArray((err, result) => {
				if (err) return console.log(err);
				accountingPage.extraordinaryInvoicesDescriptions = result;
			});
		},
		findExtraordinaryInvoices: function(description) {
			this.currentInvoiceDescription = description;
			mongoDbObj.invoices.find({description: description}).toArray((err, result) => {
				if (err) return console.log(err);
				result = _.sortBy(result, ['fullName']);
				accountingPage.extraordinaryInvoicesList = result;
			});
		},
		goAddDebit: function() {
			noDisplay('.accounting-page__inside-page');
			yesDisplay('#accounting-page-add-debit');
			yesDisplay('#btn-close-inside-page');
			mongoDbObj.accounting.find({type: 'debit'}).toArray((err, doc) => {
				if (err) return console.log(err);
				accountingPage.debitList = doc;
			});
		},
		fixInvoices: function() {
			mongoDbObj.invoices.find({status: "Sin pagar"}).toArray((err, doc) => {
				if (err) return console.log(err);
				_.forEach(doc, (invoice, index) => {
					let amount = invoice.amount;
					let originalAmount = amount;
					mongoDbObj.invoices.update({id: invoice.id}, { $set: {originalAmount: originalAmount} }, function(err, result){
						if(err) return console.log(err);
					});
					if(doc.length === (index + 1)) {
						console.log("Terminado");
					}
				});
			});
		},
		fixAmounts: function() {
			mongoDbObj.invoices.find({}).toArray((err, doc) => {
				if (err) return console.log(err);
				_.forEach(doc, (invoice, index) => {
					let amount = toNumber(invoice.amount);
					let originalAmount = toNumber(invoice.originalAmount);
					mongoDbObj.invoices.update({id: invoice.id}, { $set: {amount: amount, originalAmount: originalAmount} }, function(err, result){
						if(err) return console.log(err);
					});
					if(doc.length === (index + 1)) {
						console.log("Terminado");
					}
				});
			});
		},
		fixAddFullNameToInvoices: function() {
			mongoDbObj.invoices.find({}).toArray((err, doc) => {
				if (err) return console.log(err);
				_.forEach(doc, (invoice, index) => {
					mongoDbObj.residents.find({id: invoice.residentId}).toArray((err, result) => {
						if(err) return console.log(err);
						let fullName = result[0].fullName;
						mongoDbObj.invoices.update({id: invoice.id}, { $set: {"fullName": fullName} }, {upsert: true}, function(err, result){
							if(err) return console.log(err);
						});
					});
					if(doc.length === (index + 1)) {
						console.log("Terminado");
					}
				});
			});
		},
		addDebit: function() {
			if (this.debitName == '' || this.debitCheque == '' || this.debitDescription == '' || this.debitAmount == ''){
				return flashMessage('Debe llenar todos los campos', 'flashmessage--danger');
			}
			let obj = {
				debitDate: moment(accountingPage.debitDate, 'YYYY/MM/DD').format('DD/MM/YYYY'),
				debitCheque: accountingPage.debitCheque,
				debitName: accountingPage.debitName,
				debitDescription: accountingPage.debitDescription,
				debitAmount: toDecimal(accountingPage.debitAmount),
				month: _.capitalize(moment(accountingPage.debitDate, 'YYYY/MM/DD').format('MMMM')),
				year: moment(accountingPage.debitDate, 'YYYY/MM/DD').format('YYYY'),
				type: 'debit',
				timestamp: Date.now()
			};

			mongoDbObj.accounting.insertOne(obj, (err, result) => {
				if (err) return console.log(err);

				mongoDbObj.accounting.update(
					{
						id: "general"
					},
					{
						$inc: {
							totalBalance: -toDecimal(obj.debitAmount),
							totalExpensives: toDecimal(obj.debitAmount)
						}
					}, function(err, result) {
						if (err) return console.log(err);

						mongoDbObj.accounting.updateOne(
							{
								id: "by-year",
								year: obj.year
							},
							{
								$inc: {
									balance: -toDecimal(obj.debitAmount),
									cashOut: toDecimal(obj.debitAmount)
								}
							},
							{
								upsert: true
							}, function(err, result) {
								if (err) return console.log(err);

								mongoDbObj.accounting.updateOne(
									{
										id: "by-month",
										month: obj.month,
										year: obj.year
									},
									{
										$inc: {
											balance: -toDecimal(obj.debitAmount),
											cashOut: toDecimal(obj.debitAmount)
										}
									},
									{
										upsert: true
									}, function(err, result) {
										if (err) return console.log(err);
										updateResumen();
									}
								);
							}
						);
					}
				);
			});


			this.debitList.push(obj);
			this.debitCheque = '';
			this.debitName = '';
			this.debitDescription = '';
			this.debitAmount = '';


		},
		deleteDebit: function(event) {
			let _id = $(event.target).parent().children('td:nth-child(1)').attr('_id');
			let amount = $(event.target).parent().children('td:nth-child(6)').text();
			amount = toDecimal(amount);
			let _date = $(event.target).parent().children('td:nth-child(2)').text();
			let year = moment(_date, 'DD/MM/YYYY').format('YYYY');
			let month = _.capitalize(moment(_date, 'DD/MM/YYYY').format('MMMM'));
			if(confirm('Esta seguro, borrar este debito?')){
				mongoDbObj.accounting.remove({_id: ObjectId(_id)}, (err, result) => {
					if (err) return console.log(err);
					mongoDbObj.accounting.update(
						{
							id: "general"
						},
						{
							$inc: {
								totalBalance: amount,
								totalExpensives: -amount
							}
						}, function(err, result) {
							if (err) return console.log(err);
							mongoDbObj.accounting.updateOne(
								{
									id: "by-year",
									year: year
								},
								{
									$inc: {
										balance: amount,
										cashOut: -amount
									}
								},
								{
									upsert: true
								}, function(err, result) {
									if (err) return console.log(err);
									mongoDbObj.accounting.updateOne(
										{
											id: "by-month",
											month: month
										},
										{
											$inc: {
												balance: amount,
												cashOut: -amount,
											}
										},
										{
											upsert: true
										}, function(err, result) {
											if (err) return console.log(err);
											$(event.target).parent().remove();
											flashMessage('Debito eliminado', 'flashmessage--info');
											updateResumen();
										}
									);
								}
							);
						}	
					);
				});
			} else {
				alert('Cancelado')
			}
		},
		formatAmount: function(event) {
			let isDecimal; 
			let value = $(event.target).val();
			let valueStr = value.toString();
			if (valueStr.indexOf('.') !== -1) {
				isDecimal = true;
			  } else {isDecimal = false}
			if (value.length >= 3 && isDecimal == false) {
				value = numeral(value).format('0,0');
				$(event.target).val(value);
			}
		},
		numeralFormat: function(number) {
			return numeral(number).format('0,0.00');
		},
		handleSearchResult: function(result) {
			console.log(result);
		}
	},
	watch: {
		monthCredit: function() {
			return this.monthCredit = numeral(this.monthCredit).format('0,0')
		},
		monthDebit: function() {
			return this.monthDebit = numeral(this.monthDebit).format('0,0')
		},
		yearCredit: function() {
			return this.yearCredit = numeral(this.yearCredit).format('0,0')
		},
		yearDebit: function() {
			return this.yearDebit = numeral(this.yearDebit).format('0,0')
		},
		totalBalance: function() {
			return this.totalBalance = numeral(this.totalBalance).format('0,0')
		}
	},
	computed: {
	}
});


var modalSearchInvoice = new Vue({
	el: '.modal__search-invoice',
	data: {
		invoiceId: '',
		resident: '',
		month: '',
		status: '',
		description: '',
		amount: ''
	},
	watch: {
		amount: function() {
			return this.amount = numeral(this.amount).format('0,0.00');
		},
		month: function() {
			return this.month = _.capitalize(this.month);
		}
	}
});

var invoicesPage = new Vue({
	el: '#invoices-page',
	data: {
		pendingInvoices: [],
		payedInvoices: [],
		resident: {},
		residentId: 0,
		showButtons: true,
		showPayedInvoices: false
	},
	methods: {
		triggerBtnSearchInvoice: function() {
			$('#btn-search-invoice').click();
		},
		getPendingInvoices: function(residentId) {
			return new Promise((resolve, reject) => {
				mongoDbObj.invoices.find({status: 'Sin pagar', residentId: residentId}).toArray((err, result) => {
					if (err) return console.log(err);
					return resolve(residentId, result);
				});
			});
		},
		getPayedInvoices: function(residentId) {
			return new Promise((resolve, reject) => {
				mongoDbObj.invoices.find({status: 'Pagada', residentId: residentId}).toArray((err, result) => {
					if (err) return console.log(err);
					return resolve(result);
				});
			})
		},
		handleSearchResult: function(result) {
			this.resident = result;
			this.residentId = result.id;
			let self = this;
			this.getPayedInvoices(result.id)
			.then((result) => {
				self.showButtons = false;
				self.showPayedInvoices = true;
				// self.residentId = residentId;
				self.payedInvoices = result;
				console.log(result);
			})
		},
		printOneInvoice: function(invoiceId) {
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
		},
		printPendingInvoices: function() {
			this.searchPendingInvoice(this.resident)
			.then((status) => {
				if(status) window.open('./invoices.html');
			});
		},
		deleteOneInvoice: function(invoiceId) {
			mongoDbObj.invoices.deleteOne({id: invoiceId}, (err, result) => {
				if (err) return console.log(err);
				resident.pendingInvoices.shift(invoiceId);
				mongoDbObj.residents.update({id: residentId}, {$pull: {pendingInvoices: invoiceId}}, (err, result) => {
					if (err) return console.log(err);
					flashMessage('Factura borrada', 'flashmessage--info');
					$('.modal__search-invoice').addClass('no-display');
					console.log(result);
				});
			});
		},
		numeralFormat: function(number) {
			return accountingPage.numeralFormat(number);
		},
		closeResidentPayed: function() {
			this.showPayedInvoices = false;
			this.showButtons = true;
		},
		searchResident: function(residentId) {
			return new Promise((resolve, reject) => {
				mongoDbObj.residents.findOne({id: residentId}, (err, doc) => {
					if (err) return reject(err);
					resolve(doc);
				});
			});
		},
		searchPendingInvoice: function(resident) {
			return new Promise((resolve, reject) => {
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
					resolve(true);
				});
			});
		}
	}
});



/*var myVm = new Vue({
	el: '#app',
  data: {
  	residentObj: {}
  },
  methods: {
  	callback: function(text) {
    	console.log(text);
    }
  }
})*/