document.addEventListener("DOMContentLoaded", async () => {
  // Fetch data from the CSV file using PHP
  const response = await fetch("data.php");
  let data = await response.json();

  // Convert date strings to Date objects and sort data by date in ascending order
  data.forEach(row => {
    row[1] = new Date(row[1]);
  });
  data.sort((a, b) => a[1] - b[1]);

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

  // Function to calculate transparency based on Start date
  const getTransparency = (startDate) => {
    const timeDiff = Date.now() - new Date(startDate);
    const daysDiff = timeDiff / (1000 * 60 * 60 * 24); // Milliseconds to days conversion
    const maxDaysDiff = 365; // Adjust this value based on your preference
    const transparency = 1.1 - (daysDiff / maxDaysDiff);
    return Math.max(0, Math.min(1.1, transparency));
  };

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
        startDate: row[1].toLocaleDateString() // Store the "Start" date for the row
      });
    });
  });

  // Function to get the tooltip label
  const getTooltipLabel = (context) => {
    const labelParts = context.dataset.label.split(" - ");
    const sector = labelParts[0];
    const ticker = context.dataset.ticker;
    const startDate = `Start: ${context.dataset.startDate}`; // Use the "Start" date for the row
    const price = context.raw;
    return [
      `Sector: ${sector}`,
      `Ticker: ${ticker}`,
      startDate,
      `Price: ${price.toFixed(2)}%`,
    ];
  };

  // Create the chart
  const ctx = document.getElementById("chart").getContext("2d");
  const chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: datasets.map(dataset => {
        // Get the transparency value based on the Start date for each dataset
        const transparency = getTransparency(dataset.startDate);
        // Convert the RGB color to RGBA with the calculated transparency
        const borderColor = dataset.borderColor.replace('hsl', 'hsla').replace(')', `, ${transparency})`);
        return {
          ...dataset,
          borderColor: borderColor,
          pointHitRadius: 0, // Disable clicking on points
        };
      }),
    },
    options: {
      responsive: true,
      scales: {
        x: {
          type: "linear",
          position: "bottom",
          suggestedMin: 1,
          suggestedMax: 44,
          ticks: {
            stepSize: 1,
          },
        },
        y: {
          min: -30,
          suggestedMax: 30,
        },
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
                    fillStyle: sectorColors[label], // Use the original color without transparency
                    hidden: dataset.hidden,
                    lineCap: "butt",
                    lineDash: [],
                    lineDashOffset: 0,
                    lineJoin: "miter",
                    lineWidth: 3,
                    strokeStyle: sectorColors[label], // Use the original color without transparency
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
        annotation: {
          annotations: {
            zeroLine: {
              type: "line",
              yMin: 0,
              yMax: 0,
              borderColor: "black",
              borderWidth: 3,
              borderDash: [10, 5], // Set the line to be dotted (5px on, 5px off)
            },
          },
        },
      },
    },
  });
});