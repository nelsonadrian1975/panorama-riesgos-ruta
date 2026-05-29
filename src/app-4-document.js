function renderDocument() {
  destroyLeafletMap(documentLeafletMap);
  documentLeafletMap = null;
  const route = routeNames();
  const points = orderedPoints();
  const trips = orderedTrips();
  const title = state.project.projectName || "Panorama de Riesgos de Ruta";
  const map = routeMapMarkup();

  $("#printDocument").innerHTML = `
    <section class="doc-cover">
      <div>
        <div class="doc-kicker">Panorama de riesgos de ruta</div>
        <h1 class="doc-title">${escapeHtml(title)}</h1>
        <div class="route-line">${escapeHtml(route.origin)} → ${escapeHtml(route.destination)}</div>
      </div>
      <div>${map}</div>
      <div class="summary-grid">
        ${summaryCell("Sentido", route.label)}
        ${summaryCell("Servicio", state.project.serviceType)}
        ${summaryCell("Fecha", state.project.issueDate)}
        ${summaryCell("Versión", state.project.version)}
        ${summaryCell("Distancia total", state.project.totalDistance)}
        ${summaryCell("Puntos críticos", points.length)}
      </div>
    </section>

    <section class="doc-section">
      <h2>Resumen operacional</h2>
      <div class="summary-grid">
        ${summaryCell("Cliente", state.project.client)}
        ${summaryCell("Empresa", state.project.company)}
        ${summaryCell("Origen", route.origin)}
        ${summaryCell("Destino", route.destination)}
        ${summaryCell("Viajes configurados", trips.length)}
        ${summaryCell("Personal registrado", state.people.length)}
        ${summaryCell("Anexos", state.attachments.length)}
        ${summaryCell("Cambios registrados", state.changeLog.length)}
      </div>
    </section>

    <section class="doc-section">
      <h2>Puntos críticos de ruta</h2>
      ${points.map((point, index) => criticalPoint(point, index)).join("") || "<p>No hay puntos registrados.</p>"}
    </section>

    <section class="doc-section">
      <h2>Resumen de criticidad del trayecto</h2>
      ${criticalitySummary(points)}
    </section>

    <section class="doc-section">
      <h2>Configuración del convoy por viaje</h2>
      ${tripsTable(trips)}
    </section>

    <section class="doc-section">
      <h2>Personal involucrado</h2>
      ${peopleTable(state.people)}
    </section>

    <section class="doc-section">
      <h2>Historial de cambios</h2>
      ${historyTable(state.changeLog)}
    </section>

    <section class="doc-section">
      <h2>Controles generales del movimiento</h2>
      <table>
        <tbody>
          <tr><td>Reunión preoperacional</td><td>Validar ruta, responsables, comunicación, condiciones climáticas y estado de unidades.</td></tr>
          <tr><td>Comunicación</td><td>Mantener comunicación radial o telefónica permanente entre escoltas, conductores y supervisor.</td></tr>
          <tr><td>Control de velocidad</td><td>Reducir velocidad en curvas, badenes, zonas pobladas, cruces, cables y pendientes.</td></tr>
          <tr><td>Parada segura</td><td>Detener el convoy ante pérdida de comunicación, visibilidad limitada o condición insegura no controlada.</td></tr>
        </tbody>
      </table>
    </section>

    <section class="doc-section">
      <h2>Anexos documentarios</h2>
      ${attachmentsSection(state.attachments)}
    </section>

    <section class="doc-section">
      <h2>Control de elaboración y aprobación</h2>
      <div class="approval-grid">
        <div class="approval-box"><span>Elabora</span><strong>${escapeHtml(state.project.preparedBy || "Pendiente")}</strong></div>
        <div class="approval-box"><span>Revisa</span><strong>${escapeHtml(state.project.reviewedBy || "Pendiente")}</strong></div>
        <div class="approval-box"><span>Aprueba</span><strong>${escapeHtml(state.project.approvedBy || "Pendiente")}</strong></div>
      </div>
    </section>
    <footer class="doc-product-credit">
      <span>Generado con Panorama de Riesgos de Ruta</span>
      <strong>${escapeHtml(AUTHOR_FOOTER)}</strong>
    </footer>
  `;
}

function summaryCell(label, value) {
  return `<div class="summary-cell"><span>${escapeHtml(label)}</span>${escapeHtml(value || "Pendiente")}</div>`;
}

function criticalPoint(point, index) {
  const description = state.direction === "retorno" && point.descriptionReturn ? point.descriptionReturn : point.descriptionOut;
  const photo = point.photo ? `<img class="doc-photo" src="${point.photo}" alt="Foto punto ${escapeHtml(point.code)}">` : "";
  const level = point.riskLevel || "Medio";
  return `
    <article class="critical-card ${riskLevelClass(level)} ${point.photo ? "has-photo" : "no-photo"}">
      <div class="critical-content">
        <div class="critical-meta">
          <span class="tag">Punto ${index + 1}</span>
          <span class="tag">${escapeHtml(formatProgressive(point))}</span>
          <span class="tag">Riesgo detectado: ${escapeHtml(point.type || "Referencia")}</span>
          <span class="tag risk-level-tag ${riskLevelClass(level)}">Nivel: ${escapeHtml(level)}</span>
        </div>
        <h3>${escapeHtml(point.location || `Punto ${point.code}`)}</h3>
        <p>${escapeHtml(description || "Descripción pendiente.")}</p>
        <div class="risk-title">Riesgo</div>
        <p>${escapeHtml(point.risk || "Pendiente de definir.")}</p>
        <div class="risk-title">Control recomendado</div>
        <p>${escapeHtml(point.control || "Pendiente de definir.")}</p>
        ${point.observation ? `<p><strong>Observación:</strong> ${escapeHtml(point.observation)}</p>` : ""}
      </div>
      ${point.photo ? `<div class="critical-photo-box">${photo}</div>` : ""}
    </article>
  `;
}

function criticalitySummary(points) {
  if (!points.length) return "<p>No hay puntos evaluados.</p>";
  const counts = points.reduce(
    (acc, point) => {
      const level = point.riskLevel || "Medio";
      if (level === "Alto") acc.high += 1;
      else if (level === "Bajo") acc.low += 1;
      else acc.medium += 1;
      return acc;
    },
    { high: 0, medium: 0, low: 0 }
  );
  const total = points.length;
  const highPercent = (counts.high / total) * 100;
  const mediumPercent = (counts.medium / total) * 100;
  const lowPercent = (counts.low / total) * 100;
  const globalLevel = counts.high > 0 || mediumPercent > 40 ? "Alto" : counts.medium > 0 ? "Medio" : "Bajo";
  const highRiskPoints = points
    .map((point, index) => ({ point, index }))
    .filter(({ point }) => point.riskLevel === "Alto");
  const priorityDetail = highRiskPoints.length ? `
    <h3>Puntos de atención prioritaria</h3>
    <table>
      <thead>
        <tr>
          <th>Punto</th>
          <th>Progresiva</th>
          <th>Riesgo detectado</th>
          <th>Nivel</th>
        </tr>
      </thead>
      <tbody>
        ${highRiskPoints.map(({ point, index }) => `
          <tr>
            <td>Punto ${index + 1}</td>
            <td>${escapeHtml(formatProgressive(point))}</td>
            <td>${escapeHtml(point.type || "Referencia")}</td>
            <td>${escapeHtml(point.riskLevel || "Medio")}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
    <p>Se listan los riesgos de nivel alto identificados con fines descriptivos y de reconocimiento inicial de la ruta. La ejecución del movimiento queda condicionada a la aplicación de los controles descritos, con los cuales el riesgo operativo se reduce a un nivel controlado.</p>
  ` : counts.medium > 0 ? `
    <h3>Lectura del riesgo</h3>
    <p>No se identifican riesgos de nivel alto. Los riesgos de nivel medio registrados se consignan con fines descriptivos y de reconocimiento inicial de la ruta; la aplicación de los controles descritos permite mantener el riesgo operativo en condición controlada.</p>
  ` : `
    <h3>Lectura del riesgo</h3>
    <p>Ruta con bajo riesgo a lo largo de toda su trayectoria, manteniendo conducción preventiva, comunicación y seguimiento de los controles generales del movimiento.</p>
  `;

  return `
    <div class="criticality-panel ${riskLevelClass(globalLevel)}">
      <div class="criticality-head">
        <div>
          <span>Criticidad global</span>
          <strong>${escapeHtml(globalLevel)}</strong>
        </div>
        <div>
          <span>Total evaluado</span>
          <strong>${total} puntos</strong>
        </div>
      </div>
      <div class="criticality-cards">
        <div class="criticality-card risk-high"><span>Alto</span><strong>${counts.high}</strong></div>
        <div class="criticality-card risk-medium"><span>Medio</span><strong>${counts.medium}</strong></div>
        <div class="criticality-card risk-low"><span>Bajo</span><strong>${counts.low}</strong></div>
      </div>
      <div class="criticality-bar" aria-label="Distribución de criticidad">
        <span class="bar-high" style="width:${highPercent}%"></span>
        <span class="bar-medium" style="width:${mediumPercent}%"></span>
        <span class="bar-low" style="width:${lowPercent}%"></span>
      </div>
      ${priorityDetail}
    </div>
  `;
}

function tripsTable(trips) {
  if (!trips.length) return "<p>No hay viajes registrados.</p>";
  return `
    <table>
      <thead>
        <tr>
          <th>Viaje</th>
          <th>Componentes</th>
          <th>Tractos</th>
          <th>Conductores</th>
          <th>Responsables</th>
          <th>Escoltas</th>
          <th>Observaciones</th>
        </tr>
      </thead>
      <tbody>
        ${trips.map((trip, index) => `
          <tr>
            <td>${state.direction === "retorno" ? `Retorno ${index + 1}` : escapeHtml(trip.name)}</td>
            <td>${escapeHtml(trip.components)}</td>
            <td>${escapeHtml(trip.tractors)}</td>
            <td>${escapeHtml(trip.drivers)}</td>
            <td>Supervisor responsable: ${escapeHtml(trip.supervisor)}</td>
            <td>Delantera: ${escapeHtml(trip.frontEscort ?? trip.escort ?? "")}<br>Intermedia: ${escapeHtml(trip.middleEscort ?? "")}<br>Posterior: ${escapeHtml(trip.rearEscort ?? "")}</td>
            <td>${escapeHtml(trip.observations)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function peopleTable(people) {
  if (!people.length) return "<p>No hay personal registrado.</p>";
  return `
    <table>
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Cargo</th>
          <th>Empresa</th>
          <th>Teléfono</th>
          <th>Responsabilidad</th>
        </tr>
      </thead>
      <tbody>
        ${people.map((person) => `
          <tr>
            <td>${escapeHtml(person.name)}</td>
            <td>${escapeHtml(person.role)}</td>
            <td>${escapeHtml(person.company)}</td>
            <td>${escapeHtml(person.phone)}</td>
            <td>${escapeHtml(person.responsibility)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function historyTable(changeLog) {
  if (!changeLog.length) return "<p>No hay cambios registrados.</p>";
  return `
    <table>
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Versión</th>
          <th>Responsable</th>
          <th>Detalle</th>
        </tr>
      </thead>
      <tbody>
        ${changeLog.map((entry) => `
          <tr>
            <td>${escapeHtml(entry.date)}</td>
            <td>${escapeHtml(entry.version)}</td>
            <td>${escapeHtml(entry.responsible)}</td>
            <td>${escapeHtml(entry.detail)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function attachmentsSection(attachments) {
  if (!attachments.length) return "<p>No hay anexos registrados.</p>";
  return attachments.map((attachment, index) => `
    <article class="annex-card">
      <h3>Anexo ${index + 1}: ${escapeHtml(attachment.title || attachment.type)}</h3>
      <div class="annex-meta">${escapeHtml(attachment.type)}${attachment.description ? ` | ${escapeHtml(attachment.description)}` : ""}</div>
      ${attachment.image ? `<img class="annex-image" src="${attachment.image}" alt="${escapeHtml(attachment.title || attachment.type)}">` : "<p>Imagen pendiente de cargar.</p>"}
    </article>
  `).join("");
}
