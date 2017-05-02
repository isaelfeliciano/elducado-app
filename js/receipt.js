var ls = localStorage;
var tempReceipt = JSON.parse(ls.getItem('tempReceipt'));

let invoiceID = tempReceipt.invoiceID;
let date = tempReceipt.date;
let resident = tempReceipt.resident;
let residentId = tempReceipt.residentId;
let amount = tempReceipt.amount;
let month = tempReceipt.month;
let payMethod = tempReceipt.payMethod;

if (tempReceipt.checkNumber !== "N/A"){
	$('#jsPayMethodNumberReceipt').text("#" + tempReceipt.checkNumber);
}
if (tempReceipt.accountNumber !== "N/A") {
	$('#jsPayMethodNumberReceipt').text("Numero de cuenta:" + tempReceipt.accountNumber);
}

$('#jsResidentReceipt').text(`${resident}`);
$('#jsInvoiceNumberReceipt').text('Factura: #' + invoiceID);
$('#jsDateReceipt').text(date);
$('#jsAmountReceipt').text(amount);
$('#jsMonthReceipt').text(month);
$('#jsPayMethodReceipt').text(`Metodo de pago: ${payMethod}`);
window.print();

$('.receipt-body').on('mouseover', (e) => {
	e.preventDefault();
	setTimeout(function() {
		window.close(true);
	}, 500);
});
