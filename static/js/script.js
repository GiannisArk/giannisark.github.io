    let dataTable;
    const API_URL = '/';
    function getRandomComplianceColor() {
    const colors = ['green', 'orange', 'red'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    return `<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background-color:${color};" title="Compliance: ${color}"></span>`;
}
    // Format large numbers (Downloads) to K, M, B, etc.
    function formatNumber(num) {
    if (num === null || num === undefined) return '';
    if (num < 1000) return num.toString();
    const units = ["K", "M", "B", "T"];
    let unitIndex = -1;
    let scaled = num;
    while (scaled >= 1000 && unitIndex < units.length - 1) {
        scaled /= 1000;
        unitIndex++;
    }
    return scaled.toFixed(1).replace(/\.0$/, '') + units[unitIndex];
    }
    
    function renderTable(data) {
    const resultEl = document.getElementById('result');

    if (!data || data.length === 0 || data[0].package_name === "-") {
        resultEl.innerHTML = '<span style="color:red;">No data available.</span>';
        if (dataTable) dataTable.clear().draw();
        return;
    }

    resultEl.innerHTML = `
        <table id="resultsTable" class="display" style="width:100%">
        <thead>
            <tr>
                <th>Name</th>
                <th>Package Name</th>
                <th>Version</th>
                <th>Downloads</th>
                <th>Collected Data</th>
                <th>Shared Data</th>
                <th style="min-width:160px;white-space:nowrap;">Data Compliance Score</th>

                <th>Type</th>
                <th>Mode</th>
                <th>Icon</th>
            </tr>
        </thead>
        <tbody></tbody>
        </table>
    `;

    if (dataTable) dataTable.destroy();

        const rows = data.map(item => [
        item.name,
        item.package_name,
        item.version,
        `<span data-sort="${item.downloads}">${formatNumber(item.downloads)}</span>`,
        `<span class="truncate" title="${item.collect}">${item.collect}</span>`,
        `<span class="truncate" title="${item.share}">${item.share}</span>`,
        getRandomComplianceColor(), // New column with random color
        item.type,
        item.mode,
        `<img src="data:image/png;base64,${item.icon}" alt="icon" style="width:40px;height:40px;border-radius:8px;">`
    ]);

    dataTable = $('#resultsTable').DataTable({
        data: rows,
        columns: [...Array(9).fill({}), { orderable: false, searchable: false }],
        pageLength: 10,
        lengthChange: false,
        language: { emptyTable: "No apps found" },
        columnDefs: [
        {
            targets: 3, // Downloads column
            type: 'num',
            render: function(data, type, row, meta) {
            if (type === 'sort') {
                const div = document.createElement('div');
                div.innerHTML = data;
                // Use Number() to convert string to number properly
                return Number(div.firstChild.getAttribute('data-sort')) || 0;
            }
            return data; // display formatted number
            }
        }
        ],
        order: [[3, 'desc']] // default sorting descending by Downloads
    });
    //   const broken = [];
    //   const allicons = document.querySelectorAll('#resultsTable img');
    //   allicons.forEach((element,idx) => {
    //     element.onerror = () => {
    //         const package_name = data[idx].package_name;
    //         console.log(package_name)
    //     }
    //   });
    }


    async function loadTopDownloads(limit = 10) {
    try {
        const res = await fetch(`${API_URL}top_downloads?limit=${limit}`);
        const data = await res.json();
        renderTable(data);
    } catch (err) {
        console.error("Error loading top downloads:", err);
    }
    }

    document.getElementById('searchForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const input = document.getElementById('searchInput').value.trim();
    if (!input) return;

    try {
        const res = await fetch(`${API_URL}search/${input}`);
        const data = await res.json();
        renderTable(data);
    } catch (err) {
        console.error("Search failed:", err);
    }
    });

    // Initial load
    loadTopDownloads();
