document.addEventListener('DOMContentLoaded', function () {
  // Get chart data from hidden div
  const chartDataElement = document.getElementById('chart-data');

  // Category chart data
  const categoryLabels = JSON.parse(chartDataElement.dataset.categoryLabels);
  const categoryValues = JSON.parse(chartDataElement.dataset.categoryValues);

  // Monthly chart data
  const monthlyLabels = JSON.parse(chartDataElement.dataset.monthlyLabels);
  const monthlyIncome = JSON.parse(chartDataElement.dataset.monthlyIncome);
  const monthlyExpenses = JSON.parse(chartDataElement.dataset.monthlyExpenses);

  // Budget chart data
  const budgetCategories = JSON.parse(chartDataElement.dataset.budgetCategories || '[]');
  const budgetTargets = JSON.parse(chartDataElement.dataset.budgetTargets || '[]');
  const budgetActuals = JSON.parse(chartDataElement.dataset.budgetActuals || '[]');

  // Generate background colors for charts
  function generateColors(count, alpha = 0.8) {
    const colors = [];
    for (let i = 0; i < count; i++) {
      // Generate hue from 0 to 360 degrees
      const hue = (i * 137.5) % 360; // Golden angle approximation for good distribution
      colors.push(`hsla(${hue}, 70%, 60%, ${alpha})`);
    }
    return colors;
  }

  // 1. Category distribution pie chart
  if (document.getElementById('categoryChart')) {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    new Chart(ctx, {
      type: 'pie',
      data: {
        labels: categoryLabels,
        datasets: [{
          data: categoryValues,
          backgroundColor: generateColors(categoryLabels.length),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const value = context.raw;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = Math.round((value / total) * 100);
                return `₹${value.toFixed(2)} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }

  // 2. Monthly income vs expenses chart
  if (document.getElementById('monthlyChart')) {
    const ctx = document.getElementById('monthlyChart').getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: monthlyLabels,
        datasets: [
          {
            label: 'Income',
            data: monthlyIncome,
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            tension: 0.1,
            fill: true
          },
          {
            label: 'Expenses',
            data: monthlyExpenses,
            borderColor: 'rgba(255, 99, 132, 1)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            tension: 0.1,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (value) {
                return '₹' + value;
              }
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function (context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += '₹' + context.parsed.y.toFixed(2);
                }
                return label;
              }
            }
          }
        }
      }
    });
  }

  // 3. Budget comparison chart
  if (document.getElementById('budgetChart')) {
    const ctx = document.getElementById('budgetChart').getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: budgetCategories,
        datasets: [
          {
            label: 'Budget Target',
            data: budgetTargets,
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          },
          {
            label: 'Actual Spending',
            data: budgetActuals,
            backgroundColor: 'rgba(255, 159, 64, 0.6)',
            borderColor: 'rgba(255, 159, 64, 1)',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (value) {
                return '₹' + value;
              }
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function (context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += '₹' + context.parsed.y.toFixed(2);
                }
                return label;
              }
            }
          },
          legend: {
            position: 'top',
          }
        }
      }
    });
  }
});