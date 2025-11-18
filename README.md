<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>SmartFix — Gestor Taller</title>
  <!-- Enlaza el CSS -->
  <link rel="stylesheet" href="css/estilos.css">
</head>
<body>
  <div class="wrap">

    <header class="header card">
      <div class="brand">
        <h1>SmartFix</h1>
        <div class="tag">Gestor de reparaciones</div>
      </div>
      <div class="topbar">
        <div id="logged-as" class="muted">No has iniciado sesión</div>
        <button id="logoutBtn" class="btn ghost hidden">Cerrar sesión</button>
      </div>
    </header>

    <!-- VISTA: LOGIN / CREAR PRIMER ADMIN -->
    <main id="view-login" class="card main-card">
      <h2>Iniciar sesión</h2>

      <!-- Si no existe admin, se muestra este panel -->
      <section id="first-admin-panel" class="first-admin hidden card-mini">
        <h3>Crear administrador inicial</h3>
        <p class="small">No hay administrador. Crea la primera cuenta para comenzar.</p>
        <label>Usuario (ej: admin)</label>
        <input id="first-username" placeholder="usuario">
        <label>Contraseña</label>
        <input id="first-pass" type="password" placeholder="contraseña">
        <label>Nombre visible</label>
        <input id="first-name" placeholder="Nombre (ej: Admin)">
        <div class="row" style="margin-top:8px">
          <button id="btn-create-first" class="btn">Crear administrador</button>
        </div>
        <hr>
      </section>

      <div class="form-row">
        <label>Usuario</label>
        <input id="login-user" placeholder="usuario">
        <label>Contraseña</label>
        <input id="login-pass" type="password" placeholder="contraseña">
        <label>Rol</label>
        <select id="login-role">
          <option value="recepcionista">Recepcionista</option>
          <option value="tecnico">Técnico</option>
          <option value="admin">Administrador</option>
        </select>

        <div class="row" style="margin-top:10px">
          <button id="btn-login" class="btn">Entrar</button>
          <button id="btn-show-public" class="btn ghost">Consulta cliente (cédula)</button>
        </div>
      </div>

      <hr>

      <!-- Acceso público: consulta por cédula -->
      <section id="public-panel">
        <h3>Consulta de cliente</h3>
        <p class="small">Si eres cliente, ingresa tu cédula para ver el estado de tus dispositivos.</p>
        <div class="inline">
          <input id="public-cedula" placeholder="Cédula del cliente" inputmode="numeric">
          <button id="btn-public-check" class="btn">Consultar</button>
        </div>
        <div id="public-results" class="public-results"></div>
      </section>
    </main>

    <!-- VISTA PRINCIPAL: aplicación tras login -->
    <section id="view-app" class="hidden">
      <div class="grid">
        <!-- COLUMNA IZQUIERDA: formulario + lista -->
        <div>
          <!-- FORMULARIO: registrar o editar reparación -->
          <div id="panel-form" class="card">
            <h2 id="form-title">Registrar entrada (Recepción)</h2>

            <div class="col">
              <div class="flex">
                <div style="flex:1">
                  <label>Nombre del cliente *</label>
                  <input id="inp-cliente" placeholder="Ej: Juan Pérez">
                </div>
                <div style="width:140px">
                  <label>Cédula *</label>
                  <input id="inp-cedula" placeholder="12345678" inputmode="numeric">
                </div>
              </div>

              <div class="flex">
                <div style="flex:1">
                  <label>Teléfono *</label>
                  <input id="inp-telefono" placeholder="3001234567" inputmode="numeric">
                </div>
                <div style="width:180px">
                  <label>Asignar técnico</label>
                  <select id="inp-tecnico"><option value="">-- Sin asignar --</option></select>
                </div>
              </div>

              <div class="flex">
                <div style="flex:1">
                  <label>Marca / Modelo *</label>
                  <input id="inp-modelo" placeholder="Infinix Hot 12">
                </div>
                <div style="width:200px">
                  <label>IMEI *</label>
                  <input id="inp-imei" placeholder="356789012345678" inputmode="numeric">
                </div>
              </div>

              <label>Estado</label>
              <select id="inp-estado">
                <option value="Ingresado">Ingresado</option>
                <option value="En reparación">En reparación</option>
                <option value="Reparado">Reparado</option>
                <option value="Entregado">Entregado</option>
              </select>

              <label>Detalles / falla</label>
              <textarea id="inp-detalles" placeholder="Descripción de la falla, accesorios, observaciones..."></textarea>

              <label>Servicios (marca y ajusta precio si lo necesitas)</label>
              <div id="servicios-area" class="col"></div>

              <div class="footer-form">
                <div class="muted">Total: <span id="calc-total">0</span> COP</div>
                <div>
                  <button id="btn-save" class="btn">Guardar</button>
                  <button id="btn-clear-form" class="btn ghost">Limpiar</button>
                </div>
              </div>
            </div>
          </div>

          <!-- LISTA: registros -->
          <div id="panel-list" class="card" style="margin-top:12px">
            <div class="list-header">
              <h2>Registros</h2>
              <div class="controls">
                <input id="search" placeholder="Buscar por cliente, IMEI o técnico">
                <select id="filter-state">
                  <option value="">Todos</option>
                  <option value="Ingresado">Ingresado</option>
                  <option value="En reparación">En reparación</option>
                  <option value="Reparado">Reparado</option>
                  <option value="Entregado">Entregado</option>
                </select>
                <button id="btn-export-csv" class="btn ghost">Exportar CSV</button>
              </div>
            </div>

            <table id="table-registros" class="table">
              <thead>
                <tr><th>Cliente</th><th>Teléfono</th><th>Dispositivo (IMEI)</th><th>Servicios</th><th>Estado</th><th>Técnico</th><th class="right">Total</th><th></th></tr>
              </thead>
              <tbody></tbody>
            </table>
          </div>
        </div>

        <!-- COLUMNA DERECHA: admin / info -->
        <aside>
          <div class="card">
            <h3>Panel rápido</h3>
            <div class="small">Usuario: <strong id="ui-user"></strong> — Rol: <strong id="ui-role"></strong></div>

            <div class="actions-vertical">
              <button id="btn-new" class="btn ghost">Nuevo registro</button>
              <button id="btn-refresh" class="btn ghost">Refrescar</button>
            </div>

            <hr>

            <!-- ADMIN: crear usuarios -->
            <div id="admin-area" class="hidden">
              <h4>Administración — Crear usuario</h4>
              <div class="inline">
                <input id="new-user-username" placeholder="usuario">
                <input id="new-user-pass" placeholder="contraseña">
              </div>
              <div class="inline" style="margin-top:8px">
                <select id="new-user-role">
                  <option value="tecnico">Técnico</option>
                  <option value="recepcionista">Recepcionista</option>
                </select>
                <input id="new-user-name" placeholder="Nombre visible (ej: Carlos)">
                <button id="btn-add-user" class="btn">Crear</button>
              </div>

              <table id="table-users" class="table small" style="margin-top:10px">
                <thead><tr><th>Usuario</th><th>Rol</th><th>Activo</th><th></th></tr></thead>
                <tbody></tbody>
              </table>

              <h4 style="margin-top:12px">Clientes</h4>
              <div id="clients-list" class="clients-list"></div>
            </div>

            <hr>

            <h4>Servicios por defecto</h4>
            <div id="svc-defaults" class="col"></div>
            <button id="btn-reset-services" class="btn ghost" style="margin-top:8px">Restablecer precios por defecto</button>
          </div>
        </aside>
      </div>
    </section>

    <footer class="footer muted">
      SmartFix — app local. Presiona <strong>Ctrl + Alt + R</strong> para reiniciar (solo si olvidaste todo).
    </footer>
  </div>

  <script src="js/app.js"></script>
</body>
</html>
