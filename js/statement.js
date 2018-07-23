Storage.prototype.setObj = function(key, obj) {
  return this.setItem(key, JSON.stringify(obj));
}
Storage.prototype.getObj = function(key) {
  return JSON.parse(this.getItem(key));
}

var win = nw.Window.get();
var counter = 0;

Vue.component('statement-page', {
  template: '#statement-page',
  data() {
    return {
      nextInvoices: []
    }
  },
  methods: {
    formatAmount: function(amount) {
      return numeral(amount).format('0,0');
    },
    formatCellAmount: function(row, column, cellValue, index) {
      return numeral(cellValue).format('0,0'); 
    },
    formatDescription: function(row, column, cellValue, index) {
      if (row.type === "extraordinaryPayments") {
        if (cellValue.length > 38) {
          let trim = cellValue.slice(0, 30) + '...';
          return trim;
        } else {
          return cellValue;
        }
      } else {
        let maintenanceString = `Mantenimiento R. ${_.capitalize(moment(row.month, 'MMMM').format('MMM'))}(${moment(row.dueDate, 'DD/MMMM/YYYY').format('YY')})`
        return maintenanceString;
      }
    },
    formatDate(row, column, cellValue, index) {
      let date = cellValue;
      return moment(date, 'DD/MMMM/YYYY').format('DD/MM/YY');
    },
    sumBy: function(arr, prop) {
      let result;
      result = _.sumBy(arr, (o) => {return o[prop]} );
      return numeral(result).format('0,0');
    },
    getPendingBalance: function(arr) {
      let originalAmount = _.sumBy(arr, (o) => {return o['originalAmount']} );
      let amount = _.sumBy(arr, (o) => {return o['amount']} );
      let pendingBalance = originalAmount - amount;
      return numeral(pendingBalance).format('0,0');
    },
    getPendingAmount: function(row) {
      return numeral(row.originalAmount - row.amount).format("0,0");
    },
    returnEight: function(invoices) {
      if (invoices.length > 12) {
        let thisInvoices = [];
        thisInvoices = invoices.slice(0, 12);
        this.nextInvoices = invoices.slice(12)
        return thisInvoices;
      }
      else {
        return invoices
      }
    }
  },
  props: ['resident'],
  mounted() {
  }
});

var app = new Vue({
  el: '#app',
  data: {
    allStatement: [],
  },
  methods: {
  },
  created() {
    setTimeout(() => {
      this.allStatement = localStorage.getObj('allStatement');
    }, 1000);
    setTimeout(() => {
      window.print();
      window.onafterprint = window.close(true);
    }, 2000);
  }
});