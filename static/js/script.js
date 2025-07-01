let dataTable;
const API_URL = '/';
const BATCH_SIZE = 100;
let currentOffset = 0;
let allDataLoaded = false;

function getRandomComplianceScoreBar(total = 5) {
    let html = '<div style="display:flex; gap:4px; justify-content:center;">';
    for (let i = 0; i < total; i++) {
        const color = Math.random() < 0.5 ? 'red' : 'lightgray'; // 50% red or gray
        html += `<span style="
          display:inline-block;
          width:16px;
          height:16px;
          border-radius:50%;
          background-color:${color};
          border: 1px solid #ccc;
        "></span>`;
    }
    html += '</div>';
    return html;
}

function formatNumber(num) {
    if (num === null || num === undefined) return '';
    if (num < 1000) return num.toString();
    const units = ["K+", "M+", "B+", "T+"];
    let unitIndex = -1;
    let scaled = num;
    while (scaled >= 1000 && unitIndex < units.length - 1) {
        scaled /= 1000;
        unitIndex++;
    }
    return scaled.toFixed(1).replace(/\.0$/, '') + units[unitIndex];
}

function commaSeparatedToBullets(str) {
    if (!str) return '';
    const items = str.split(', ').map(s => s.trim()).filter(Boolean);
    if (items.length === 0) return '';

    return `<ul class="custom-bullets" style="padding-left: 20px; margin: 0;">` +
        items.map(item => {
            const color = Math.random() < 0.5 ? 'red' : 'green';
            return `<li style="color: ${color};"><span style="color: black;">${item}</span></li>`;
        }).join('') +
        '</ul>';
}

function renderTable(data) {
    const resultEl = document.getElementById('result');

    if (!data || data.length === 0 || data[0].package_name === "-") {
        resultEl.innerHTML = '<span style="color:red;">No data available.</span>';
        if (dataTable) dataTable.clear().draw();
        return;
    }

    resultEl.innerHTML = `
        <table id="resultsTable" class="display" style="width:100%; table-layout: fixed;">
            <thead>
                <tr>
                    <th style="min-width:120px;">App</th>
                    <th>Package Name</th>
                    <th>Version</th>
                    <th>Downloads</th>
                    <th>Collected Data</th>
                    <th>Shared Data</th>
                    <th style="min-width:160px; white-space:nowrap;">Data Compliance Score</th>
                    <th>Type</th>
                    <th>Mode</th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
    `;

    if (dataTable) dataTable.destroy();

    dataTable = $('#resultsTable').DataTable({
        data: [],
        columns: [...Array(9).fill({})],
        pageLength: 10,
        lengthChange: false,
        language: { emptyTable: "No apps found" },
        columnDefs: [
            {
                targets: 3,
                type: 'num',
                render: function (data, type, row, meta) {
                    if (type === 'sort') {
                        const div = document.createElement('div');
                        div.innerHTML = data;
                        return Number(div.firstChild.getAttribute('data-sort')) || 0;
                    }
                    return data;
                }
            }
        ],
        order: [[3, 'desc']],
        drawCallback: function () {
            // After table draws, add Load More button next to pagination next button

            const paginate = $('#resultsTable_paginate');

            // If button already exists, skip
            if (paginate.find('#loadMoreBtn').length === 0) {
                const btn = $('<button id="loadMoreBtn" class="paginate_button">Load More</button>');
                btn.css({
                    'margin-left': '8px',
                    'padding': '4px 12px',
                    'font-size': '14px',
                    'cursor': 'pointer',
                    'border-radius': '2px',
                    'border': '1px solid #ddd',
                    'background-color': '#fff'
                });

                btn.on('click', () => {
                    loadTopDownloadsBatch();
                });

                // Append Load More button after "Next" button
                paginate.find('a.paginate_button.next').after(btn);
            }

            // Disable Load More button if all data loaded
            const loadMoreBtn = $('#loadMoreBtn');
            if (allDataLoaded) {
                loadMoreBtn.prop('disabled', true).css({
                    'opacity': '0.5',
                    'cursor': 'default'
                });
            } else {
                loadMoreBtn.prop('disabled', false).css({
                    'opacity': '1',
                    'cursor': 'pointer'
                });
            }
        }
    });

    appendToTable(data);
}

function appendToTable(data) {
    if (!data || data.length === 0) return;

    const rows = data.map(item => [
        `<div style="display:flex; flex-direction:column; align-items:center;">
            <img src="data:image/png;base64,${item.icon}" alt="icon" style="width:40px;height:40px;border-radius:8px;margin-bottom:4px;">
            <span style="text-align:center;">${item.name}</span>
        </div>`,
        item.package_name,
        item.version,
        `<span data-sort="${item.downloads}" style="font-weight: bold;">${formatNumber(item.downloads)}</span>`,
        commaSeparatedToBullets(item.collect),
        commaSeparatedToBullets(item.share),
        getRandomComplianceScoreBar(),
        item.type,
        item.mode
    ]);

    if (!dataTable) {
        renderTable(data);
    } else {
        dataTable.rows.add(rows).draw(false);
    }
}

async function loadTopDownloadsBatch(reset = false) {
    if (allDataLoaded && !reset) return;

    if (reset) {
        currentOffset = 0;
        allDataLoaded = false;
        if (dataTable) {
            dataTable.clear().draw();
        }
    }

    try {
        const res = await fetch(`${API_URL}top_downloads?limit=${BATCH_SIZE}&offset=${currentOffset}`);
        const data = await res.json();

        if (data.length < BATCH_SIZE) {
            allDataLoaded = true;
            // Optionally disable the Load More button
            const btn = document.getElementById('loadMoreBtn');
            if (btn) btn.disabled = true;
        }

        currentOffset += data.length;

        if (reset) {
            renderTable(data);
        } else {
            appendToTable(data);
        }
    } catch (err) {
        console.error("Error loading batch:", err);
    }
}

document.getElementById('searchForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const input = document.getElementById('searchInput').value.trim();
    if (!input) return;

    // Disable Load More on search because search results may be small and paginated separately
    const btn = document.getElementById('loadMoreBtn');
    if (btn) btn.disabled = true;

    try {
        const res = await fetch(`${API_URL}search/${input}`);
        const data = await res.json();
        allDataLoaded = true;  // prevent further batch loading on search
        currentOffset = 0;     // reset offset for next top downloads load

        renderTable(data);
    } catch (err) {
        console.error("Search failed:", err);
    }
});

// Initial load - load first batch and render table
loadTopDownloadsBatch(true);