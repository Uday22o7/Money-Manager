import Chart from 'chart.js/auto';

// Initialize all charts
function initCharts() {
  // Category Pie Chart
  new Chart(document.getElementById('categoryChart').getContext('2d'), {
    type: 'pie',
    data: {
      labels: JSON.parse(document.getElementById('chart-data').dataset.categoryLabels),
      datasets: [{
        data: JSON.parse(document.getElementById('chart-data').dataset.categoryValues),
        backgroundColor: [
          '#3498db', '#2ecc71', '#f1c40f', '#e74c3c',
          '#9b59b6', '#1abc9c', '#34495e', '#e67e22'
        ]
      }]
    }
  });

  // Trend Line Chart
  new Chart(document.getElementById('trendChart').getContext('2d'), {
    type: 'line',
    data: {
      labels: JSON.parse(document.getElementById('chart-data').dataset.monthlyLabels),
      datasets: [
        {
          label: 'Income',
          data: JSON.parse(document.getElementById('chart-data').dataset.monthlyIncome),
          borderColor: '#2ecc71'
        },
        {
          label: 'Expenses',
          data: JSON.parse(document.getElementById('chart-data').dataset.monthlyExpenses),
          borderColor: '#e74c3c'
        }
      ]
    }
  });
}

document.addEventListener('DOMContentLoaded', initCharts);