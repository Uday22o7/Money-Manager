

function initCharts() {
  // Get chart data from the hidden div
  const chartDataDiv = document.getElementById('chart-data');
  let categoryLabels = JSON.parse(chartDataDiv.dataset.categoryLabels);
  let categoryValues = JSON.parse(chartDataDiv.dataset.categoryValues);

  // If no data is provided, default to a single slice "No Data" with value 0
  if (!categoryLabels || categoryLabels.length === 0) {
    categoryLabels = ["No Data"];
    categoryValues = [0];
  }
  
  // Create the Category Pie Chart
  const ctx = document.getElementById('categoryChart').getContext('2d');
  new Chart(ctx, {
    type: 'pie',  // You can change this to 'doughnut' for a ring-style chart
    data: {
      labels: categoryLabels,
      datasets: [{
        data: categoryValues,
        backgroundColor: [
          '#3498db',
          '#2ecc71',
          '#f1c40f',
          '#e74c3c',
          '#9b59b6',
          '#1abc9c',
          '#34495e',
          '#e67e22'
          // Add more colors if needed
        ],
        borderColor: '#ffffff', // white outer boundary for each slice
        borderWidth: 2
      }]
    },
    options: {
      plugins: {
        legend: {
          position: 'bottom'
        }
      },
      layout: {
        padding: 10
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', initCharts);
