<?php
// Read the CSV file without header
$csvFile = 'barrons-picks.csv';
$csvData = array_map('str_getcsv', file($csvFile));

// Remove 'nan' values from the sector column
$filteredData = array_filter($csvData, function ($row) {
    return !empty($row[0]) && !in_array($row[0], ['VALUE INVESTING', 'GROWTH INVESTING']);
});

// Convert the data to JSON format
header('Content-Type: application/json');
echo json_encode(array_values($filteredData));
?>
