let dataTable;
const API_URL = '/';

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
    item.downloads,
    item.collect,
    item.share,
    item.type,
    item.mode,
    `<img src="data:image/png;base64,${item.icon}" alt="icon" style="width:40px;height:40px;border-radius:8px;">`
  ]);

  dataTable = $('#resultsTable').DataTable({
    data: rows,
    columns: [...Array(8).fill({}), { orderable: false, searchable: false }],
    pageLength: 5,
    lengthChange: false,
    language: { emptyTable: "No apps found" }
  });
}

async function loadTopDownloads(limit = 5) {
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
