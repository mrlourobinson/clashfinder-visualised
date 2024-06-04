document.getElementById('csvFileInput').addEventListener('change', handleFileSelect, false);

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const contents = e.target.result;
            const rows = contents.split('\n').map(row => row.split(','));
            renderTable(rows);
        };
        reader.readAsText(file);
    }
}

function renderTable(rows) {
    const table = document.createElement('table');
    rows.forEach(row => {
        const tr = document.createElement('tr');
        row.forEach(cell => {
            const td = document.createElement('td');
            td.textContent = cell;
            tr.appendChild(td);
        });
        table.appendChild(tr);
    });
    const outputDiv = document.getElementById('csvOutput');
    outputDiv.innerHTML = '';
    outputDiv.appendChild(table);
}
