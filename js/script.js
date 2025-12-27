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

function formatearNumero(num) {
    return new Intl.NumberFormat('es-AR').format(num);
}

db.ref("servicios").on("value", (snapshot) => {
    const data = snapshot.val();
    stockData = data ? Object.values(data) : [];
    renderTabla();
    document.getElementById('loading').style.display = 'none';
    document.getElementById('status-msg').innerHTML = "🟢 Conectado y sincronizado";
});

function activarModoAdmin() {
    const pass = document.getElementById('admin-pass').value;
    if (btoa(pass) === "TWVraQ==") { 
        isAdmin = true;
        document.getElementById('admin-controls').style.display = 'flex';
        document.getElementById('login-box').style.display = 'none';
        document.getElementById('col-acciones').style.display = 'table-cell';
        document.getElementById('filtro-fecha').value = new Date().toISOString().split('T')[0];
        renderTabla();
    } else { alert("Clave incorrecta"); }
}

function renderTabla() {
    const tbody = document.getElementById('tabla-body');
    const filtro = document.getElementById('filtro-fecha').value;
    tbody.innerHTML = "";
    
    let datosAMostrar = filtro ? stockData.filter(item => item.fechaId === filtro) : stockData;
    const datosOrdenados = [...datosAMostrar].sort((a, b) => (b.fechaId + b.hora).localeCompare(a.fechaId + a.hora));

    let totalAcumulado = 0;

    datosOrdenados.forEach((item) => {
        const indexReal = stockData.findIndex(s => s.id === item.id);
        totalAcumulado += (Number(item.monto) || 0);

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input class="input-tab bld" value="${item.servicio || ''}" ${isAdmin?'':'disabled'} onchange="actualizarDato(${indexReal}, 'servicio', this.value)"></td>
            <td><input class="input-tab" value="${item.cliente || ''}" ${isAdmin?'':'disabled'} onchange="actualizarDato(${indexReal}, 'cliente', this.value)"></td>
            <td class="celda-monto">
                <div class="monto-wrapper">
                    <span class="signo">$</span>
                    ${isAdmin 
                        ? `<input type="number" class="monto-input bld" value="${item.monto || 0}" onchange="actualizarDato(${indexReal}, 'monto', Number(this.value))">`
                        : `<span class="monto-format bld">${formatearNumero(item.monto || 0)}</span>`
                    }
                </div>
            </td>
            <td class="td-time">
                <div class="h-v">${item.hora}</div>
                <div class="f-v">${item.fechaId.split('-').reverse().slice(0,2).join('/')}</div>
            </td>
            ${isAdmin ? `<td><button onclick="eliminarFila(${indexReal})" class="btn-x">✕</button></td>` : ''}
        `;
        tbody.appendChild(row);
    });

    document.getElementById('total-monto').innerText = "$" + formatearNumero(totalAcumulado);
}

function actualizarDato(index, campo, valor) { stockData[index][campo] = valor; }

function agregarFila() {
    const ahora = new Date();
    const hora = ahora.getHours().toString().padStart(2, '0') + ":" + ahora.getMinutes().toString().padStart(2, '0');
    stockData.push({ id: Date.now(), servicio: "Corte", cliente: "-", monto: 0, hora: hora, fechaId: ahora.toISOString().split('T')[0] });
    renderTabla();
}

function eliminarFila(i) { if(confirm("¿Borrar?")) { stockData.splice(i, 1); renderTabla(); } }

async function guardarCambios() {
    try { await db.ref("servicios").set(stockData); alert("✅ Guardado"); } catch (e) { alert("Error"); }
}

function limpiarFiltro() { document.getElementById('filtro-fecha').value = ''; renderTabla(); }
function cerrarSesion() { location.reload(); }