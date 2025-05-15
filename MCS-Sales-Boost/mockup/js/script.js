// DOM Elements
const navLinks = document.querySelectorAll('.nav-menu li');
const pages = document.querySelectorAll('.page');
const productButtons = document.querySelectorAll('.product-buttons button');
const chartCanvas = document.getElementById('salesChart');

// Navigation
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        // Remove active class from all links
        navLinks.forEach(l => l.classList.remove('active'));
        // Add active class to clicked link
        link.classList.add('active');
        
        // Hide all pages
        pages.forEach(page => page.classList.remove('active'));
        // Show corresponding page
        const targetPage = document.getElementById(link.dataset.page);
        targetPage.classList.add('active');
    });
});

// Product Category Filter
productButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Remove active class from all buttons
        productButtons.forEach(btn => btn.classList.remove('active'));
        // Add active class to clicked button
        button.classList.add('active');
        
        // Update chart data based on selected category
        updateChart(button.dataset.category);
    });
});

// Chart.js Configuration
let salesChart;

function initializeChart() {
    const ctx = chartCanvas.getContext('2d');
    salesChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Q1', 'Q2', 'Q3', 'Q4'],
            datasets: [{
                label: 'Sales (Rs.)',
                data: [1200000, 1500000, 1800000, 2100000],
                backgroundColor: '#2563eb',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'Rs. ' + value.toLocaleString();
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

function updateChart(category) {
    // Simulate different data based on category
    const data = {
        'all': [1200000, 1500000, 1800000, 2100000],
        'broadband': [800000, 1000000, 1200000, 1400000],
        'voice': [400000, 500000, 600000, 700000]
    };
    
    salesChart.data.datasets[0].data = data[category];
    salesChart.update();
}

// Initialize chart when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeChart();
    
    // Set default active page
    document.querySelector('.nav-menu li').click();
    document.querySelector('.product-buttons button').click();
});

// File Upload Handler
const fileInput = document.getElementById('dealFile');
const uploadButton = document.getElementById('uploadButton');

uploadButton.addEventListener('click', () => {
    if (fileInput.files.length === 0) {
        alert('Please select a file to upload');
        return;
    }
    
    const file = fileInput.files[0];
    if (file.type !== 'text/csv') {
        alert('Please upload a CSV file');
        return;
    }
    
    // Simulate file upload
    uploadButton.disabled = true;
    uploadButton.textContent = 'Uploading...';
    
    setTimeout(() => {
        alert('File uploaded successfully!');
        uploadButton.disabled = false;
        uploadButton.textContent = 'Upload Deals';
        fileInput.value = '';
    }, 1500);
});

// Table Sorting
const tableHeaders = document.querySelectorAll('th[data-sort]');

tableHeaders.forEach(header => {
    header.addEventListener('click', () => {
        const sortKey = header.dataset.sort;
        const isAscending = header.classList.contains('asc');
        
        // Remove sort classes from all headers
        tableHeaders.forEach(h => {
            h.classList.remove('asc', 'desc');
        });
        
        // Add appropriate sort class
        header.classList.add(isAscending ? 'desc' : 'asc');
        
        // Sort table data
        sortTable(sortKey, !isAscending);
    });
});

function sortTable(key, ascending) {
    const tbody = document.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    rows.sort((a, b) => {
        const aValue = a.querySelector(`td[data-${key}]`).textContent;
        const bValue = b.querySelector(`td[data-${key}]`).textContent;
        
        if (key === 'value' || key === 'days') {
            return ascending 
                ? parseFloat(aValue.replace(/[^0-9.-]+/g, '')) - parseFloat(bValue.replace(/[^0-9.-]+/g, ''))
                : parseFloat(bValue.replace(/[^0-9.-]+/g, '')) - parseFloat(aValue.replace(/[^0-9.-]+/g, ''));
        }
        
        return ascending
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
    });
    
    // Reorder rows
    rows.forEach(row => tbody.appendChild(row));
} 