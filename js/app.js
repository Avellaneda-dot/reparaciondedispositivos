/* app.js - Lógica SmartFix (tema: negro + morado)
   Ctrl + Alt + R para reiniciar (borrar datos)
*/

/* ---------- CONSTANTES de storage ---------- */
const LS_USERS = 'sf_users_prod';
const LS_REPAIRS = 'sf_repairs_prod';
const LS_SERV = 'sf_services_prod';
const LS_CLIENTS = 'sf_clients_prod';

/* ---------- UTILIDADES ---------- */
function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,8); }
function $qs(s){ return document.querySelector(s); }
function $qsa(s){ return Array.from(document.querySelectorAll(s)); }

/* ---------- REFERENCIAS AL DOM ---------- */
const viewLogin = $qs('#view-login'), viewApp = $qs('#view-app');
const loginUser = $qs('#login-user'), loginPass = $qs('#login-pass'), loginRole = $qs('#login-role');
const btnLogin = $qs('#btn-login'), logoutBtn = $qs('#logoutBtn'), loggedAs = $qs('#logged-as');
const btnShowPublic = $qs('#btn-show-public');

const firstAdminPanel = $qs('#first-admin-panel');
const firstUserInput = $qs('#first-username'), firstPassInput = $qs('#first-pass'), firstNameInput = $qs('#first-name');
const btnCreateFirst = $qs('#btn-create-first');

const publicCedula = $qs('#public-cedula'), btnPublicCheck = $qs('#btn-public-check'), publicResults = $qs('#public-results');

const inpCliente = $qs('#inp-cliente'), inpCedula = $qs('#inp-cedula'), inpTelefono = $qs('#inp-telefono');
const inpModelo = $qs('#inp-modelo'), inpImei = $qs('#inp-imei'), inpEstado = $qs('#inp-estado'), inpDetalles = $qs('#inp-detalles');
const serviciosArea = $qs('#servicios-area'), calcTotalEl = $qs('#calc-total');
const btnSave = $qs('#btn-save'), btnClearForm = $qs('#btn-clear-form');

const inpTecnicoSelect = $qs('#inp-tecnico');
const tableBody = $qs('#table-registros tbody');
const searchInput = $qs('#search'), filterState = $qs('#filter-state'), btnExportCSV = $qs('#btn-export-csv');

const uiUser = $qs('#ui-user'), uiRole = $qs('#ui-role'), adminArea = $qs('#admin-area');
const btnNew = $qs('#btn-new'), btnRefresh = $qs('#btn-refresh');

const newUserUsername = $qs('#new-user-username'), newUserPass = $qs('#new-user-pass'), newUserRole = $qs('#new-user-role'), newUserName = $qs('#new-user-name'), btnAddUser = $qs('#btn-add-user');
const tableUsersBody = $qs('#table-users tbody');
const clientsListDiv = $qs('#clients-list');

const svcDefaultsDiv = $qs('#svc-defaults'), btnResetServices = $qs('#btn-reset-services');

/* ---------- ESTADO EN MEMORIA ---------- */
let users = [], repairs = [], services = [], clients = [];
let currentUser = null, editingId = null;

/* ---------- INICIALIZACION ---------- */
function init(){
  loadUsers(); loadServices(); loadClients(); loadRepairs();

  // si no hay admin, mostrar panel para crear primer admin
  const hasAdmin = users.some(u => u.role === 'admin');
  if(!hasAdmin){
    firstAdminPanel.classList.remove('hidden');
  } else {
    firstAdminPanel.classList.add('hidden');
  }

  renderServicesDefaults();
  renderServicesForm();
  renderTechOptions();
  renderTechTable();
  renderRepairsTable();
  renderClientsList();
  hookEvents();
  applyInputFilters();
  setupSecretCombo(); // configurar combinación  Ctrl+Alt+R
}

/* ---------- LOAD / SAVE ---------- */
function loadUsers(){ const raw = localStorage.getItem(LS_USERS); users = raw ? JSON.parse(raw) : []; }
function saveUsers(){ localStorage.setItem(LS_USERS, JSON.stringify(users)); }

function loadServices(){
  const raw = localStorage.getItem(LS_SERV);
  if(!raw){
    services = [
      { name:'Cambio de pantalla', price:50000 },
      { name:'Cambio de batería', price:30000 },
      { name:'Cambio de puerto de carga', price:25000 },
      { name:'Cambio de cámara', price:20000 },
      { name:'Actualización de software', price:15000 }
    ];
    saveServices();
  } else { services = JSON.parse(raw); }
}
function saveServices(){ localStorage.setItem(LS_SERV, JSON.stringify(services)); }

function loadClients(){ const raw = localStorage.getItem(LS_CLIENTS); clients = raw ? JSON.parse(raw) : []; }
function saveClients(){ localStorage.setItem(LS_CLIENTS, JSON.stringify(clients)); }

function loadRepairs(){ const raw = localStorage.getItem(LS_REPAIRS); repairs = raw ? JSON.parse(raw) : []; }
function saveRepairs(){ localStorage.setItem(LS_REPAIRS, JSON.stringify(repairs)); }

/* ---------- EVENTOS ---------- */
function hookEvents(){
  btnCreateFirst && btnCreateFirst.addEventListener('click', onCreateFirstAdmin);
  btnLogin.addEventListener('click', onLogin);
  logoutBtn.addEventListener('click', logout);
  btnPublicCheck.addEventListener('click', onPublicCheck);
  btnShowPublic.addEventListener('click', ()=> { publicCedula.scrollIntoView({behavior:'smooth'}); });

  btnSave.addEventListener('click', onSaveRepair);
  btnClearForm.addEventListener('click', resetForm);
  btnNew.addEventListener('click', ()=> { showForm(); resetForm(); });
  btnRefresh.addEventListener('click', ()=> { renderRepairsTable(); renderTechOptions(); renderTechTable(); renderClientsList(); });

  searchInput.addEventListener('input', renderRepairsTable);
  filterState.addEventListener('change', renderRepairsTable);
  btnExportCSV.addEventListener('click', exportCSV);

  btnAddUser.addEventListener('click', onAddUser);
  btnResetServices.addEventListener('click', ()=> {
    if(confirm('Restablecer precios por defecto?')){ localStorage.removeItem(LS_SERV); loadServices(); renderServicesDefaults(); renderServicesForm(); }
  });

  // Enter key handlers
  [loginUser, loginPass].forEach(i => i && i.addEventListener('keydown', e => { if(e.key === 'Enter') onLogin(); }));
  publicCedula && publicCedula.addEventListener('keydown', e => { if(e.key === 'Enter') onPublicCheck(); });
}

/* ---------- FILTROS DE INPUT (validaciones en tiempo real) ---------- */
function applyInputFilters(){
  inpCliente && inpCliente.addEventListener('input', ()=> { inpCliente.value = inpCliente.value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ\s]/g,''); });
  newUserName && newUserName.addEventListener && newUserName.addEventListener('input', ()=> { newUserName.value = newUserName.value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ\s]/g,''); });

  inpCedula && inpCedula.addEventListener('input', ()=> { inpCedula.value = inpCedula.value.replace(/\D/g,''); });
  publicCedula && publicCedula.addEventListener('input', ()=> { publicCedula.value = publicCedula.value.replace(/\D/g,''); });
  inpTelefono && inpTelefono.addEventListener('input', ()=> { inpTelefono.value = inpTelefono.value.replace(/\D/g,''); });

  inpImei && inpImei.addEventListener('input', ()=> { inpImei.value = inpImei.value.replace(/\D/g,'').slice(0,16); });
}

/* ---------- CREAR PRIMER ADMIN (sin usuario por defecto) ---------- */
function onCreateFirstAdmin(){
  const username = firstUserInput.value.trim();
  const pass = firstPassInput.value;
  const name = firstNameInput.value.trim() || username;
  if(!username || !pass){ alert('Completa usuario y contraseña para crear el administrador.'); return; }
  if(users.some(u => u.username === username)){ alert('El usuario ya existe. Escoge otro nombre.'); return; }
  users.push({ username, password: pass, role: 'admin', active: true, name });
  saveUsers();
  alert('Administrador creado. Ahora inicia sesión.');
  firstAdminPanel.classList.add('hidden');
}

/* ---------- AUTENTICACIÓN ---------- */
function onLogin(){
  const u = loginUser.value.trim();
  const p = loginPass.value;
  const r = loginRole.value;
  if(!u || !p){ alert('Completa usuario y contraseña.'); return; }
  const found = users.find(x => x.username === u && x.role === r);
  if(!found){ alert('Usuario no encontrado para ese rol.'); return; }
  if(found.password !== p){ alert('Contraseña incorrecta.'); return; }
  if(!found.active){ alert('Cuenta desactivada. Contacta al administrador.'); return; }
  currentUser = { username: found.username, role: found.role, name: found.name || found.username };
  afterLogin();
}

/* ---------- DESPUÉS DEL LOGIN ---------- */
function afterLogin(){
  viewLogin.classList.add('hidden');
  viewApp.classList.remove('hidden');
  logoutBtn.classList.remove('hidden');
  loggedAs.textContent = `Conectado: ${currentUser.username} (${currentUser.role})`;
  uiUser.textContent = currentUser.username;
  uiRole.textContent = currentUser.role;
  adminArea.classList.toggle('hidden', currentUser.role !== 'admin');
  if(currentUser.role === 'recepcionista' || currentUser.role === 'admin'){
    showForm();
  } else { hideForm(); }
  renderRepairsTable();
  renderTechOptions();
  renderTechTable();
  renderClientsList();
}

/* ---------- LOGOUT ---------- */
function logout(){
  currentUser = null;
  viewApp.classList.add('hidden');
  viewLogin.classList.remove('hidden');
  logoutBtn.classList.add('hidden');
  loggedAs.textContent = 'No has iniciado sesión';
  loginUser.value = ''; loginPass.value = '';
}

/* ---------- SERVICIOS (UI) ---------- */
function renderServicesDefaults(){
  svcDefaultsDiv.innerHTML = '';
  services.forEach((s, idx) => {
    const el = document.createElement('div');
    el.style.display = 'flex'; el.style.justifyContent = 'space-between'; el.style.alignItems = 'center';
    el.innerHTML = `<div class="small">${s.name}</div><div><input data-idx="${idx}" class="svc-price" type="number" value="${s.price}" style="width:110px;padding:6px;border-radius:6px;background:transparent;border:1px solid rgba(255,255,255,0.03)"></div>`;
    svcDefaultsDiv.appendChild(el);
  });
  document.querySelectorAll('.svc-price').forEach(inp => inp.addEventListener('change', (e) => {
    const i = Number(e.target.dataset.idx); services[i].price = Math.round(Number(e.target.value) || 0); saveServices(); renderServicesForm();
  }));
}
function renderServicesForm(){
  serviciosArea.innerHTML = '';
  services.forEach((s, idx) => {
    const wrapper = document.createElement('div'); wrapper.style.display='flex'; wrapper.style.alignItems='center'; wrapper.style.gap='8px';
    wrapper.innerHTML = `<label style="flex:1"><input type="checkbox" data-idx="${idx}" class="svc-checkbox"> ${s.name}</label><input type="number" class="svc-custom" data-idx="${idx}" value="${s.price}" style="width:120px;padding:6px;border-radius:6px;background:transparent;border:1px solid rgba(255,255,255,0.03)">`;
    serviciosArea.appendChild(wrapper);
  });
  $qsa('.svc-checkbox').forEach(chk => chk.addEventListener('change', updateCalcTotal));
  $qsa('.svc-custom').forEach(inp => inp.addEventListener('input', updateCalcTotal));
  updateCalcTotal();
}
function getSelectedServicesFromForm(){
  const sel = [];
  $qsa('.svc-checkbox').forEach(chk => {
    if(chk.checked){
      const idx = Number(chk.dataset.idx);
      const priceEl = document.querySelector('.svc-custom[data-idx="'+idx+'"]');
      const price = Math.round(Number(priceEl.value) || 0);
      sel.push({ name: services[idx].name, price });
    }
  });
  return sel;
}
function updateCalcTotal(){ const sel = getSelectedServicesFromForm(); const total = sel.reduce((s,x)=>s+x.price,0); calcTotalEl.textContent = new Intl.NumberFormat('es-CO').format(total); }

/* ---------- FORMULARIO: guardar / editar reparación ---------- */
function resetForm(){
  editingId = null; $qs('#form-title').textContent = 'Registrar entrada (Recepción)';
  inpCliente.value = ''; inpCedula.value = ''; inpTelefono.value = ''; inpModelo.value = ''; inpImei.value = ''; inpEstado.value = 'Ingresado'; inpDetalles.value = '';
  $qsa('.svc-checkbox').forEach(c => c.checked = false);
  $qsa('.svc-custom').forEach(c => c.value = services[Number(c.dataset.idx)].price);
  inpTecnicoSelect.value = '';
  updateCalcTotal();
}
function showForm(){ $qs('#panel-form').classList.remove('hidden'); }
function hideForm(){ $qs('#panel-form').classList.add('hidden'); }

/* ---------- VALIDACIONES ---------- */
function validoNombre(n){ return /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(n); }
function validoCedula(c){ return /^\d{6,15}$/.test(c); } // 6-15 digitos
function validoTelefono(t){ return /^\d{7,15}$/.test(t); }
function validoIMEI(i){ return /^\d{14,16}$/.test(i); }

/* ---------- GUARDAR REPARACION ---------- */
function onSaveRepair(){
  if(!currentUser){ alert('Inicia sesión'); return; }
  const cliente = inpCliente.value.trim();
  const cedula = inpCedula.value.trim();
  const telefono = inpTelefono.value.trim();
  const modelo = inpModelo.value.trim();
  const imei = inpImei.value.trim();
  const estado = inpEstado.value;
  const detalles = inpDetalles.value.trim();
  const serviciosSel = getSelectedServicesFromForm();
  const total = serviciosSel.reduce((s,x)=>s + Number(x.price), 0);
  const assignedTo = inpTecnicoSelect.value || '';

  if(!cliente || !cedula || !telefono || !modelo || !imei){ alert('Completa los campos obligatorios: nombre, cédula, teléfono, modelo e IMEI'); return; }
  if(!validoNombre(cliente)){ alert('El nombre solo puede contener letras y espacios.'); return; }
  if(!validoCedula(cedula)){ alert('Cédula inválida: solo números (6-15 dígitos).'); return; }
  if(!validoTelefono(telefono)){ alert('Teléfono inválido: solo números.'); return; }
  if(!validoIMEI(imei)){ alert('IMEI inválido: debe tener 14-16 dígitos.'); return; }

  // asociar cliente por cédula
  let client = clients.find(c => c.cedula === cedula);
  if(!client){
    client = { id: uid(), cedula, nombre: cliente, telefono, dispositivos: [] };
    clients.push(client);
    saveClients();
  } else {
    client.nombre = cliente; client.telefono = telefono; saveClients();
  }

  if(editingId){
    const rp = repairs.find(r => r.id === editingId);
    if(!rp){ alert('Registro no encontrado'); resetForm(); return; }
    rp.clienteId = client.id; rp.cliente = cliente; rp.cedula = cedula; rp.telefono = telefono;
    rp.marcaModelo = modelo; rp.imei = imei; rp.estado = estado; rp.detalles = detalles;
    rp.servicios = serviciosSel; rp.total = total; rp.assignedTo = assignedTo;
    if(rp.estado !== 'En reparación' && estado === 'En reparación' && !rp.fechaInicio) rp.fechaInicio = new Date().toISOString();
    if((estado === 'Reparado' || estado === 'Entregado') && !rp.fechaEntrega) rp.fechaEntrega = new Date().toISOString();
    rp.updatedAt = new Date().toISOString();
    saveRepairs();
    alert('Registro actualizado.');
  } else {
    const nuevo = {
      id: uid(),
      clienteId: client.id,
      cliente,
      cedula,
      telefono,
      marcaModelo: modelo,
      imei,
      estado,
      detalles,
      servicios: serviciosSel,
      total,
      assignedTo,
      fechaIngreso: new Date().toISOString(),
      fechaInicio: estado === 'En reparación' ? new Date().toISOString() : null,
      fechaEntrega: (estado === 'Reparado' || estado === 'Entregado') ? new Date().toISOString() : null,
      observaciones: '',
      createdAt: new Date().toISOString(),
      updatedAt: null
    };
    repairs.unshift(nuevo);
    client.dispositivos.unshift(nuevo.id);
    saveClients(); saveRepairs();
    alert('Registro guardado.');
  }

  resetForm(); renderRepairsTable(); renderClientsList();
}

/* ---------- RENDER TABLA DE REPARACIONES ---------- */
function renderRepairsTable(){
  tableBody.innerHTML = '';
  const q = searchInput.value.trim().toLowerCase();
  const stateFilter = filterState.value;
  const role = currentUser ? currentUser.role : null;
  const username = currentUser ? currentUser.username : null;

  let visible = repairs.slice();
  if(role === 'tecnico'){
    visible = visible.filter(r => r.assignedTo === username || r.assignedTo === '' || r.assignedTo === null);
  }

  if(stateFilter) visible = visible.filter(r => r.estado === stateFilter);
  if(q){
    visible = visible.filter(r => {
      return (r.cliente && r.cliente.toLowerCase().includes(q)) ||
             (r.imei && r.imei.toLowerCase().includes(q)) ||
             (r.assignedTo && r.assignedTo.toLowerCase().includes(q));
    });
  }

  visible.forEach(r => {
    const tr = document.createElement('tr');
    const svcText = r.servicios.map(s=>`${s.name} (${Number(s.price).toLocaleString('es-CO')})`).join(', ');
    const totalText = new Intl.NumberFormat('es-CO').format(Number(r.total || 0));
    let statusCls = 'status-ing';
    if(r.estado === 'En reparación' || r.estado === 'Reparado') statusCls = 'status-rep';
    if(r.estado === 'Entregado') statusCls = 'status-ent';

    tr.innerHTML = `
      <td><strong>${escapeHtml(r.cliente)}</strong><div class="small">${escapeHtml(r.cedula||'')}</div></td>
      <td>${escapeHtml(r.telefono)}</td>
      <td>${escapeHtml(r.marcaModelo)}<div class="small">IMEI: ${escapeHtml(r.imei)}</div><div class="small">Ingreso: ${formatDate(r.fechaIngreso)}</div></td>
      <td class="small">${escapeHtml(svcText || '—')}</td>
      <td><span class="chip ${statusCls}">${escapeHtml(r.estado)}</span></td>
      <td>${escapeHtml(r.assignedTo || '—')}</td>
      <td class="right">${totalText}</td>
      <td class="actions"></td>
    `;

    const actionsTd = tr.querySelector('td.actions');

    // ver detalles
    const btnView = document.createElement('button'); btnView.className='btn ghost'; btnView.textContent='Ver';
    btnView.addEventListener('click', ()=> openDetails(r.id));
    actionsTd.appendChild(btnView);

    // admin: editar / eliminar / asignar
    if(currentUser && currentUser.role === 'admin'){
      const btnEdit = document.createElement('button'); btnEdit.className='btn ghost'; btnEdit.textContent='Editar';
      btnEdit.addEventListener('click', ()=> startEdit(r.id));
      const btnDel = document.createElement('button'); btnDel.className='btn ghost danger'; btnDel.textContent='Eliminar';
      btnDel.addEventListener('click', ()=> {
        if(confirm('Eliminar registro?')){
          repairs = repairs.filter(x => x.id !== r.id);
          const cl = clients.find(c => c.id === r.clienteId); if(cl){ cl.dispositivos = cl.dispositivos.filter(i=>i!==r.id); saveClients(); }
          saveRepairs(); renderRepairsTable(); renderClientsList();
        }
      });
      const sel = document.createElement('select'); sel.style.marginLeft = '6px';
      const optNone = document.createElement('option'); optNone.value=''; optNone.textContent='-- Asignar --'; sel.appendChild(optNone);
      users.filter(u => u.role === 'tecnico').forEach(t => {
        const o = document.createElement('option'); o.value = t.username; o.textContent = t.username + (t.active ? '' : ' (desactivado)'); sel.appendChild(o);
      });
      sel.value = r.assignedTo || '';
      sel.addEventListener('change', ()=> { r.assignedTo = sel.value; saveRepairs(); renderRepairsTable(); });
      actionsTd.appendChild(sel); actionsTd.appendChild(btnEdit); actionsTd.appendChild(btnDel);
    }

    // recepcionista: puede editar
    if(currentUser && currentUser.role === 'recepcionista'){
      const btnEdit = document.createElement('button'); btnEdit.className='btn ghost'; btnEdit.textContent='Editar';
      btnEdit.addEventListener('click', ()=> startEdit(r.id));
      actionsTd.appendChild(btnEdit);
    }

    // tecnico: tomar / cambiar estado / editar precio / añadir observacion
    if(currentUser && currentUser.role === 'tecnico'){
      const btnClaim = document.createElement('button'); btnClaim.className='btn ghost'; btnClaim.textContent='Tomar';
      btnClaim.addEventListener('click', ()=> { r.assignedTo = currentUser.username; if(!r.fechaInicio) r.fechaInicio = new Date().toISOString(); saveRepairs(); renderRepairsTable(); });
      const selState = document.createElement('select'); selState.innerHTML = '<option>Ingresado</option><option>En reparación</option><option>Reparado</option><option>Entregado</option>';
      selState.value = r.estado;
      selState.addEventListener('change', ()=> {
        r.estado = selState.value;
        if(r.estado === 'En reparación' && !r.fechaInicio) r.fechaInicio = new Date().toISOString();
        if((r.estado === 'Reparado' || r.estado === 'Entregado') && !r.fechaEntrega) r.fechaEntrega = new Date().toISOString();
        saveRepairs(); renderRepairsTable();
      });
      const btnPrice = document.createElement('button'); btnPrice.className='btn ghost'; btnPrice.textContent='Editar precio';
      btnPrice.addEventListener('click', ()=> {
        const newPrice = prompt('Ingrese precio total (mano de obra + repuestos) en COP:', String(r.total || 0));
        if(newPrice !== null){
          const n = Math.round(Number(newPrice) || 0);
          r.total = n; saveRepairs(); renderRepairsTable();
        }
      });
      const btnObs = document.createElement('button'); btnObs.className='btn ghost'; btnObs.textContent='Observación';
      btnObs.addEventListener('click', ()=> {
        const note = prompt('Escribe/edita la observación técnica:', r.observaciones || '');
        if(note !== null){ r.observaciones = note; r.updatedAt = new Date().toISOString(); saveRepairs(); renderRepairsTable(); }
      });
      actionsTd.appendChild(selState); actionsTd.appendChild(btnClaim); actionsTd.appendChild(btnPrice); actionsTd.appendChild(btnObs);
    }

    tableBody.appendChild(tr);
  });
}

/* ---------- DETALLES (alert simple) ---------- */
function openDetails(id){
  const r = repairs.find(x => x.id === id); if(!r) return alert('Registro no encontrado');
  const svcText = r.servicios.map(s => `${s.name} — ${Number(s.price).toLocaleString('es-CO')} COP`).join('\n');
  const info = [
    `Cliente: ${r.cliente}`,
    `Cédula: ${r.cedula || '—'}`,
    `Teléfono: ${r.telefono || '—'}`,
    `Dispositivo: ${r.marcaModelo}`,
    `IMEI: ${r.imei}`,
    `Estado: ${r.estado}`,
    `Técnico: ${r.assignedTo || '—'}`,
    `Servicios:\n${svcText || '—'}`,
    `Total: ${Number(r.total || 0).toLocaleString('es-CO')} COP`,
    `Fecha ingreso: ${formatDate(r.fechaIngreso)}`,
    `Fecha inicio: ${formatDate(r.fechaInicio)}`,
    `Fecha entrega: ${formatDate(r.fechaEntrega)}`,
    `Observaciones: ${r.observaciones || '—'}`
  ].join('\n\n');
  alert(info);
}

/* ---------- INICIAR EDICION ---------- */
function startEdit(id){
  const r = repairs.find(x => x.id === id); if(!r) return alert('Registro no encontrado');
  editingId = id; $qs('#form-title').textContent = 'Editar registro'; showForm();
  inpCliente.value = r.cliente; inpCedula.value = r.cedula || ''; inpTelefono.value = r.telefono || '';
  inpModelo.value = r.marcaModelo; inpImei.value = r.imei; inpEstado.value = r.estado; inpDetalles.value = r.detalles || '';
  $qsa('.svc-checkbox').forEach(cb => cb.checked = false);
  $qsa('.svc-custom').forEach(inp => inp.value = services[Number(inp.dataset.idx)].price);
  r.servicios.forEach(s => {
    const idx = services.findIndex(x => x.name === s.name);
    if(idx >= 0){
      const cb = document.querySelector('.svc-checkbox[data-idx="'+idx+'"]');
      const priceInp = document.querySelector('.svc-custom[data-idx="'+idx+'"]');
      if(cb) cb.checked = true;
      if(priceInp) priceInp.value = s.price;
    }
  });
  inpTecnicoSelect.value = r.assignedTo || '';
  updateCalcTotal();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ---------- GESTIÓN DE USUARIOS (ADMIN) ---------- */
function renderTechOptions(){
  inpTecnicoSelect.innerHTML = '<option value="">-- Sin asignar --</option>';
  users.filter(u => u.role === 'tecnico').forEach(t => {
    const o = document.createElement('option'); o.value = t.username; o.textContent = t.username + (t.active ? '' : ' (desactivado)');
    inpTecnicoSelect.appendChild(o);
  });
}
function renderTechTable(){
  tableUsersBody.innerHTML = '';
  users.forEach(u => {
    if(u.role === 'tecnico' || u.role === 'recepcionista'){
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${u.username}</td><td>${u.role}</td><td>${u.active ? 'Sí' : 'No'}</td><td></td>`;
      const td = tr.querySelector('td:last-child');
      const btnPwd = document.createElement('button'); btnPwd.className='btn ghost'; btnPwd.textContent='Cambiar contraseña';
      btnPwd.addEventListener('click', ()=> { const np = prompt('Nueva contraseña para ' + u.username + ' (vacío = cancelar)'); if(np !== null && np.trim() !== ''){ u.password = np.trim(); saveUsers(); alert('Contraseña cambiada.'); renderTechTable(); }});
      const btnToggle = document.createElement('button'); btnToggle.className='btn ghost'; btnToggle.textContent = u.active ? 'Desactivar' : 'Activar';
      btnToggle.addEventListener('click', ()=> { if(confirm((u.active ? 'Desactivar ' : 'Activar ') + u.username + '?')){ u.active = !u.active; saveUsers(); renderTechTable(); renderTechOptions(); renderRepairsTable(); }});
      const btnDel = document.createElement('button'); btnDel.className='btn ghost danger'; btnDel.textContent='Eliminar';
      btnDel.addEventListener('click', ()=> { if(confirm('Eliminar usuario ' + u.username + '?')){ users = users.filter(x=>x.username !== u.username); saveUsers(); renderTechTable(); renderTechOptions(); renderRepairsTable(); }});
      td.appendChild(btnPwd); td.appendChild(btnToggle); td.appendChild(btnDel);
      tableUsersBody.appendChild(tr);
    }
  });
}
function onAddUser(){
  const username = newUserUsername.value.trim(), pass = newUserPass.value, role = newUserRole.value, name = newUserName.value.trim();
  if(!username || !pass || !role){ alert('Completa usuario, contraseña y rol'); return; }
  if(users.some(x => x.username === username)){ alert('El usuario ya existe'); return; }
  users.push({ username, password: pass, role, active: true, name: name || username });
  saveUsers(); newUserUsername.value=''; newUserPass.value=''; newUserName.value='';
  renderTechTable(); renderTechOptions(); alert('Usuario creado.');
}

/* ---------- CLIENTES: lista y vista pública ---------- */
function renderClientsList(){
  clientsListDiv.innerHTML = '';
  if(clients.length === 0){ clientsListDiv.innerHTML = '<div class="small">No hay clientes aún.</div>'; return; }
  clients.forEach(c => {
    const el = document.createElement('div'); el.style.padding='6px'; el.style.borderBottom='1px solid rgba(255,255,255,0.03)';
    el.innerHTML = `<strong>${escapeHtml(c.nombre)}</strong> — ${escapeHtml(c.cedula)} <div class="small">Tel: ${escapeHtml(c.telefono)} — dispositivos: ${c.dispositivos.length}</div>`;
    const btn = document.createElement('button'); btn.className='btn ghost'; btn.textContent='Ver dispositivos'; btn.style.marginLeft='8px';
    btn.addEventListener('click', ()=> {
      const list = c.dispositivos.map(id=>{
        const r = repairs.find(rr => rr.id === id);
        return r ? `${r.marcaModelo} (IMEI: ${r.imei}) — Estado: ${r.estado}` : `ID ${id} (no encontrado)`;
      }).join('\n');
      alert(`Dispositivos de ${c.nombre}:\n\n` + (list || '—'));
    });
    el.appendChild(btn);
    clientsListDiv.appendChild(el);
  });
}

/* ---------- CONSULTA PUBLICA (CLIENTE) POR CÉDULA ---------- */
function onPublicCheck(){
  const ced = publicCedula.value.trim();
  if(!ced){ alert('Ingresa tu cédula'); return; }
  if(!/^\d{6,15}$/.test(ced)){ alert('Cédula inválida: solo números (6-15 dígitos)'); return; }
  const matched = repairs.filter(r => r.cedula === ced);
  publicResults.innerHTML = '';
  if(matched.length === 0){ publicResults.innerHTML = '<div class="small">No hay dispositivos registrados con esta cédula.</div>'; return; }
  const tbl = document.createElement('table'); tbl.className = 'table';
  tbl.innerHTML = `<thead><tr><th>Modelo</th><th>Estado</th><th class="right">Precio</th><th>Fecha entrega</th></tr></thead>`;
  const tb = document.createElement('tbody');
  matched.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${escapeHtml(r.marcaModelo)}</td><td>${escapeHtml(r.estado)}</td><td class="right">${new Intl.NumberFormat('es-CO').format(Number(r.total||0))}</td><td>${formatDate(r.fechaEntrega)}</td>`;
    tb.appendChild(tr);
  });
  tbl.appendChild(tb);
  publicResults.appendChild(tbl);
}

/* ---------- EXPORTAR CSV ---------- */
function exportCSV(){
  if(repairs.length === 0){ alert('No hay registros'); return; }
  const headers = ['id','cliente','cedula','telefono','marcaModelo','imei','estado','servicios','total','tecnico','detalles','fechaIngreso','fechaInicio','fechaEntrega','createdAt','updatedAt'];
  const rows = repairs.map(r => {
    const serviciosText = r.servicios.map(s=>`${s.name} (${s.price})`).join('; ');
    return [r.id,r.cliente,r.cedula,r.telefono,r.marcaModelo,r.imei,r.estado,serviciosText,r.total,r.assignedTo||'',r.detalles||'',r.fechaIngreso||'',r.fechaInicio||'',r.fechaEntrega||'',r.createdAt||'',r.updatedAt||''].map(c => `"${String(c||'').replace(/"/g,'""')}"`).join(',');
  });
  const csv = headers.join(',') + '\n' + rows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'reparaciones.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

/* ---------- HELPERS ---------- */
function formatDate(iso){
  if(!iso) return '—';
  try { const d = new Date(iso); return d.toLocaleString('es-CO'); } catch(e){ return iso; }
}
function escapeHtml(s){ if(!s) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

/* ---------- COMBINACIÓN SECRETA: Ctrl + Alt + R ---------- */
/* Al presionar Ctrl+Alt+R se borra localStorage (usuarios, clientes, reparaciones y servicios)
   y se recarga la página para permitir crear el primer administrador de nuevo.
   Esto es útil si olvidas el admin. */
function setupSecretCombo(){
  window.addEventListener('keydown', (e) => {
    if(e.ctrlKey && e.altKey && (e.key === 'r' || e.key === 'R')){
      const ok = confirm('¿Deseas reiniciar el sistema (borrar todos los datos locales) ? Esta acción eliminará usuarios, clientes y registros. Continuar?');
      if(!ok) return;
      // borrar los items claves
      localStorage.removeItem(LS_USERS);
      localStorage.removeItem(LS_REPAIRS);
      localStorage.removeItem(LS_CLIENTS);
      localStorage.removeItem(LS_SERV);
      alert('Sistema reiniciado. La página se recargará y podrás crear el administrador inicial.');
      location.reload();
    }
  });
}

/* ---------- INICIO ---------- */
init();