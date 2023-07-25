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

    sectors.forEach((sector) => {
        const filteredData = data.filter(item => item[0] === sector);
        const color = sectorColors[sector];

        filteredData.forEach((row) => {
            const ticker = row[2];
            const prices = row.slice(3).map(Number);
            const percentChanges = prices.map((price, i) => ((price / prices[0]) - 1) * 100);

            datasets.push({
                label: `${sector} - ${ticker}`, // Include both sector and ticker in the label
                borderColor: color,
                data: percentChanges,
                fill: false,
                lineTension: 0,
            });
        });
    });

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
                            const data = chart.data;
                            const uniqueLabels = new Set();
                            if (data.datasets.length) {
                                return data.datasets.map((dataset, i) => {
                                    const label = dataset.label.split(" - ")[0];
                                    if (!uniqueLabels.has(label)) {
                                        uniqueLabels.add(label);
                                        return {
                                            text: label,
                                            fillStyle: dataset.borderColor,
                                            hidden: !chart.getDataVisibility(i),
                                            index: i,
                                        };
                                    }
                                }).filter(label => label !== undefined);
                            }
                            return [];
                        },
                    },
                },
                tooltip: {
                    mode: "nearest",
                    intersect: false,
                    callbacks: {
                        label: (context) => {
                            const labelParts = context.dataset.label.split(" - ");
                            const sector = labelParts[0];
                            const ticker = labelParts[1];
                            const price = context.raw;
                            return [
                                `Sector: ${sector}`,
                                `Ticker: ${ticker}`,
                                `Price: ${price.toFixed(2)}%`,
                            ];
                        },
                    },
                },
            },
        },
    });
});
