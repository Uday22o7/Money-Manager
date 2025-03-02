

function initCharts() {
  const chartDataDiv = document.getElementById('chart-data');

  // 1. Category Chart Data
  let categoryLabels = JSON.parse(chartDataDiv.dataset.categoryLabels);
  let categoryValues = JSON.parse(chartDataDiv.dataset.categoryValues);

  // Fallback for no category data
  if (!categoryLabels || categoryLabels.length === 0) {
    categoryLabels = ["No Data"];
    categoryValues = [0];
  }

  // 2. Monthly Income vs Expense
  let monthlyIncomePie = parseFloat(chartDataDiv.dataset.monthlyIncomePie) || 0;
  let monthlyExpensePie = parseFloat(chartDataDiv.dataset.monthlyExpensePie) || 0;

  // CATEGORY PIE CHART
  const categoryCtx = document.getElementById('categoryChart').getContext('2d');
  new Chart(categoryCtx, {
    type: 'pie',
    data: {
      labels: categoryLabels,
      datasets: [{
        data: categoryValues,
        backgroundColor: [
          '#3498db','#2ecc71','#f1c40f','#e74c3c',
          '#9b59b6','#1abc9c','#34495e','#e67e22'
        ],
        borderColor: '#ffffff',
        borderWidth: 2
      }]
    },
    options: {
      plugins: {
        legend: { position: 'bottom' }
      },
      layout: { padding: 10 }
    }
  });

  // MONTHLY INCOME VS EXPENSE PIE CHART
  const monthlyCtx = document.getElementById('monthlyChart').getContext('2d');

  // If both monthlyIncomePie and monthlyExpensePie are 0, fallback to a "No Data" slice
  let monthlyLabels, monthlyValues, monthlyColors;
  if (monthlyIncomePie === 0 && monthlyExpensePie === 0) {
    monthlyLabels = ["No Data"];
    monthlyValues = [0];
    monthlyColors = ["#bdc3c7"]; // grey or any fallback color
  } else {
    monthlyLabels = ["Income", "Expense"];
    monthlyValues = [monthlyIncomePie, monthlyExpensePie];
    monthlyColors = ["#2ecc71", "#e74c3c"]; // green & red
  }

  new Chart(monthlyCtx, {
    type: 'pie',
    data: {
      labels: monthlyLabels,
      datasets: [{
        data: monthlyValues,
        backgroundColor: monthlyColors,
        borderColor: '#ffffff',
        borderWidth: 2
      }]
    },
    options: {
      plugins: {
        legend: { position: 'bottom' }
      },
      layout: { padding: 10 }
    }
  });
}

document.addEventListener('DOMContentLoaded', initCharts);
