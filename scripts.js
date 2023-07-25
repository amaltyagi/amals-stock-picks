document.addEventListener("DOMContentLoaded", async () => {
  // Fetch data from the CSV file using PHP
  const response = await fetch("data.php");
  const data = await response.json();

  // Create a set of unique sector names
  const sectorsSet = new Set(data.map(item => item[0]));

  // Create an object to map each sector to a unique color
  const sectors = [...sectorsSet];
  const sectorColors = {};
  sectors.forEach((sector, index) => {
    sectorColors[sector] = `hsl(${index * (360 / sectors.length)}, 70%, 50%)`;
  });

  // Prepare data for the chart
  const labels = Array.from({ length: 44 }, (_, i) => i + 1);
  const datasets = [];

  let previouslyIsolatedSector = null;

  sectors.forEach((sector) => {
    const sectorData = data.filter(item => item[0] === sector);
    const color = sectorColors[sector];

    sectorData.forEach((row) => {
      const ticker = row[2];
      const prices = row.slice(3).map(Number);
      const percentChanges = prices.map((price, i) => ((price / prices[0]) - 1) * 100);

      datasets.push({
        label: `${sector}`,
        borderColor: color,
        data: percentChanges,
        fill: false,
        lineTension: 0,
        hidden: false, // Show all datasets initially
        ticker: ticker,
      });
    });
  });

  // Function to get the tooltip label
  const getTooltipLabel = (context) => {
    const labelParts = context.dataset.label.split(" - ");
    const sector = labelParts[0];
    const ticker = context.dataset.ticker;
    const date = `Date: ${data[context.dataIndex][1]}`; // Use the 2nd column (dates) from the CSV
    const price = context.raw;
    return [
      `Sector: ${sector}`,
      `Ticker: ${ticker}`,
      date,
      `Price: ${price.toFixed(2)}%`,
    ];
  };

  // Create the chart
  const ctx = document.getElementById("chart").getContext("2d");
  const chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: datasets,
    },
    options: {
      responsive: true,
      scales: {
        x: {
          type: "linear",
          position: "bottom",
          suggestedMin: 1,
          suggestedMax: 44,
        },
        y: {
          min: -30,
          suggestedMax: 30,
        },
      },
      interaction: {
        mode: "index",
        intersect: false,
      },
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            generateLabels: (chart) => {
              const datasets = chart.data.datasets;
              const legendItems = [];
              const usedLabels = new Set();

              datasets.forEach((dataset) => {
                const label = dataset.label;
                if (!usedLabels.has(label)) {
                  legendItems.push({
                    text: label,
                    fillStyle: dataset.borderColor,
                    hidden: dataset.hidden,
                    lineCap: "butt",
                    lineDash: [],
                    lineDashOffset: 0,
                    lineJoin: "miter",
                    lineWidth: 3,
                    strokeStyle: dataset.borderColor,
                  });
                  usedLabels.add(label);
                }
              });

              return legendItems;
            },
          },
          onClick: (event, legendItem) => {
            const sector = legendItem.text;
            const activeSectors = chart.data.datasets.filter(dataset => !dataset.hidden).map(dataset => dataset.label);

            if (previouslyIsolatedSector === sector) {
              // If the clicked sector is already isolated and is clicked again, show all sectors again
              chart.data.datasets.forEach((dataset) => {
                dataset.hidden = false;
              });
              previouslyIsolatedSector = null;
            } else {
              // Toggle the visibility of the clicked sector and hide others
              chart.data.datasets.forEach((dataset) => {
                const datasetSector = dataset.label;
                if (datasetSector === sector) {
                  dataset.hidden = false;
                } else {
                  dataset.hidden = true;
                }
              });
              previouslyIsolatedSector = sector;
            }
            chart.update();
          },
        },
        tooltip: {
          mode: "nearest",
          intersect: false,
          callbacks: {
            label: (context) => getTooltipLabel(context),
          },
        },
      },
      onClick: (event, elements) => {
        if (!elements || elements.length === 0) {
          // No element clicked, reset visibility of all datasets
          chart.data.datasets.forEach((dataset) => {
            dataset.hidden = false;
          });
          previouslyIsolatedSector = null;
        } else {
          // Toggle visibility of datasets based on the clicked element
          const clickedDataset = chart.data.datasets[elements[0].datasetIndex];
          const sector = clickedDataset.label;
          chart.data.datasets.forEach((dataset) => {
            const datasetSector = dataset.label;
            if (datasetSector === sector) {
              // Toggle the visibility of the clicked sector
              dataset.hidden = !dataset.hidden;
            } else {
              dataset.hidden = true; // Hide other sectors
            }
          });
          previouslyIsolatedSector = sector;
        }

        // Update the chart to reflect the changes
        chart.update();
      },
    },
  });
});
