const firebaseConfig = {
    apiKey: "AIzaSyCrXnHPcq9J__LWAH7yCd__CtC77MitZ2A",
    authDomain: "dani-peluqueria.firebaseapp.com",
    databaseURL: "https://dani-peluqueria-default-rtdb.firebaseio.com",
    projectId: "dani-peluqueria",
    storageBucket: "dani-peluqueria.firebasestorage.app",
    messagingSenderId: "733641745768",
    appId: "1:733641745768:web:b8f771ddf387ccb037a2dd"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let stockData = [];
let isAdmin = false;

db.ref("servicios").on("value", (snapshot) => {
    const data = snapshot.val();
    stockData = data ? Object.values(data) : [];
    renderTabla();
    document.getElementById('loading').style.display = 'none';
    document.getElementById('status-msg').innerHTML = "🟢 <span style='color:black'>Conectado</span>";
});

function activarModoAdmin() {
    const pass = document.getElementById('admin-pass').value;
    if (btoa(pass) === "TWVraQ==") {
        isAdmin = true;
        document.getElementById('admin-controls').style.display = 'flex';
        document.getElementById('admin-pass').style.display = 'none';
        document.getElementById('btn-login').style.display = 'none';
        document.getElementById('col-acciones').style.display = 'table-cell';
        const hoy = new Date().toISOString().split('T')[0];
        document.getElementById('filtro-fecha').value = hoy;
        renderTabla();
    } else { alert("Clave incorrecta"); }
}

function renderTabla() {
    const tbody = document.getElementById('tabla-body');
    const filtro = document.getElementById('filtro-fecha').value;
    tbody.innerHTML = "";
    
    let datosAMostrar = stockData;
    if (filtro) {
        datosAMostrar = stockData.filter(item => item.fechaId === filtro);
    }

    const datosOrdenados = [...datosAMostrar].sort((a, b) => {
        return (b.fechaId + b.hora).localeCompare(a.fechaId + a.hora);
    });

    let totalAcumulado = 0;

    datosOrdenados.forEach((item) => {
        const indexReal = stockData.findIndex(s => s.id === item.id);
        totalAcumulado += (Number(item.monto) || 0);

        const row = document.createElement('tr');
        if(isAdmin) row.classList.add('editing');

        row.innerHTML = `
            <td><input class="editable bold-text" value="${item.servicio || ''}" ${isAdmin?'':'disabled'} onchange="actualizarDato(${indexReal}, 'servicio', this.value)"></td>
            <td><input class="editable" value="${item.cliente || ''}" ${isAdmin?'':'disabled'} onchange="actualizarDato(${indexReal}, 'cliente', this.value)"></td>
            <td class="celda-monto">
                <div class="monto-wrapper">
                    <span class="currency-symbol">$</span>
                    <input type="number" class="editable bold-text monto-input" value="${item.monto || 0}" ${isAdmin?'':'disabled'} onchange="actualizarDato(${indexReal}, 'monto', Number(this.value))">
                </div>
            </td>
            <td>
                <input type="time" class="editable-date" value="${item.hora}" ${isAdmin?'':'disabled'} onchange="actualizarDato(${indexReal}, 'hora', this.value)">
                <input type="date" class="editable-date fecha-small" value="${item.fechaId}" ${isAdmin?'':'disabled'} onchange="actualizarDato(${indexReal}, 'fechaId', this.value)">
            </td>
            ${isAdmin ? `<td><button onclick="eliminarFila(${indexReal})" class="btn-del">🗑️</button></td>` : ''}
        `;
        tbody.appendChild(row);
    });

    if (datosOrdenados.length > 0) {
        const tRow = document.createElement('tr');
        tRow.className = "fila-total";
        tRow.innerHTML = `
            <td colspan="2" style="text-align:right; font-weight:bold;">TOTAL:</td>
            <td colspan="${isAdmin ? '3' : '2'}" style="color: #27ae60; font-weight:900; font-size:1.1rem; text-align:left; padding-left:10px;">$${totalAcumulado}</td>
        `;
        tbody.appendChild(tRow);
    }
}

function actualizarDato(index, campo, valor) {
    stockData[index][campo] = valor;
}

function agregarFila() {
    const ahora = new Date();
    const hora = ahora.getHours().toString().padStart(2, '0') + ":" + ahora.getMinutes().toString().padStart(2, '0');
    const fechaId = ahora.toISOString().split('T')[0];
    stockData.push({ id: Date.now(), servicio: "Corte", cliente: "-", monto: 0, hora: hora, fechaId: fechaId });
    renderTabla();
}

function eliminarFila(i) {
    if(confirm("¿Borrar registro?")) { stockData.splice(i, 1); renderTabla(); }
}

async function guardarCambios() {
    if (!isAdmin) return;
    const btn = document.getElementById('btn-save');
    btn.innerText = "⏳...";
    try {
        await db.ref("servicios").set(stockData);
        alert("✅ Guardado correctamente");
    } catch (e) { alert("Error al guardar"); }
    btn.innerText = "💾 Guardar";
}

function limpiarFiltro() { document.getElementById('filtro-fecha').value = ''; renderTabla(); }
function cerrarSesion() { location.reload(); }