function renderPoints() {
  $("#pointsList").innerHTML = state.points.map((point, index) => `
    <article class="item">
      <div class="item-head">
        <div class="item-title">Punto ${index + 1}</div>
        <div class="item-actions">
          <button class="button" data-insert-before="${index}">Insertar antes</button>
          <button class="button" data-insert-after="${index}">Insertar después</button>
          <button class="button" data-move-point="${point.id}" data-move-dir="-1">Subir</button>
          <button class="button" data-move-point="${point.id}" data-move-dir="1">Bajar</button>
          <button class="button danger" data-remove-point="${point.id}">Eliminar</button>
        </div>
      </div>
      <div class="point-grid">
        <label>Código<input data-point="${point.id}" data-field="code" value="${escapeHtml(point.code)}"></label>
        <label>Kilómetro<input type="number" min="0" step="1" data-point="${point.id}" data-field="km" value="${escapeHtml(point.km ?? parseProgressive(point.distance).km)}"></label>
        <label>Metros<input type="number" min="0" max="999" step="10" data-point="${point.id}" data-field="meters" value="${escapeHtml(point.meters ?? parseProgressive(point.distance).meters)}"></label>
        <label class="point-risk-detected">Riesgo detectado<input data-point="${point.id}" data-field="type" value="${escapeHtml(point.type)}"></label>
        <label class="point-risk-level">Nivel de riesgo
          <select class="risk-level-select ${riskLevelClass(point.riskLevel)}" data-point="${point.id}" data-field="riskLevel">
            <option ${point.riskLevel === "Bajo" ? "selected" : ""}>Bajo</option>
            <option ${!point.riskLevel || point.riskLevel === "Medio" ? "selected" : ""}>Medio</option>
            <option ${point.riskLevel === "Alto" ? "selected" : ""}>Alto</option>
          </select>
        </label>
        <label class="full">Referencia<input data-point="${point.id}" data-field="location" value="${escapeHtml(point.location)}"></label>
        <label class="wide">Descripción ida<textarea data-point="${point.id}" data-field="descriptionOut">${escapeHtml(point.descriptionOut)}</textarea></label>
        <label class="wide">Descripción retorno<textarea data-point="${point.id}" data-field="descriptionReturn">${escapeHtml(point.descriptionReturn)}</textarea></label>
        <label class="wide">Descripción del riesgo<textarea data-point="${point.id}" data-field="risk">${escapeHtml(point.risk)}</textarea></label>
        <label class="wide">Control recomendado<textarea data-point="${point.id}" data-field="control">${escapeHtml(point.control)}</textarea></label>
        <label class="full">Observación<textarea data-point="${point.id}" data-field="observation">${escapeHtml(point.observation)}</textarea></label>
      </div>
    </article>
  `).join("");

  $$("[data-point]").forEach((input) => {
    input.addEventListener("input", (event) => updateItem("points", event.target.dataset.point, event.target.dataset.field, event.target.value));
  });

  $$("[data-remove-point]").forEach((button) => {
    button.addEventListener("click", () => removeById("points", button.dataset.removePoint));
  });

  $$("[data-insert-before]").forEach((button) => {
    button.addEventListener("click", () => insertPointAt(Number(button.dataset.insertBefore)));
  });

  $$("[data-insert-after]").forEach((button) => {
    button.addEventListener("click", () => insertPointAt(Number(button.dataset.insertAfter) + 1));
  });

  $$("[data-move-point]").forEach((button) => {
    button.addEventListener("click", () => movePoint(button.dataset.movePoint, Number(button.dataset.moveDir)));
  });
}

function renderPhotoManager() {
  $("#photoManager").innerHTML = state.points.map((point, index) => `
    <article class="item photo-row">
      <div>
        <label class="file-drop">
          <input type="file" accept="image/*" data-photo-point="${point.id}">
          <span>Foto punto ${index + 1}</span>
        </label>
        <img class="thumb" data-thumb="${point.id}" alt="Foto del punto ${index + 1}">
      </div>
      <div>
        <h3>Punto ${escapeHtml(point.code || index + 1)}</h3>
        <p>${escapeHtml(point.location || point.type || "Sin referencia")}</p>
        <button class="button" data-clear-photo="${point.id}">Quitar foto</button>
      </div>
    </article>
  `).join("");

  state.points.forEach((point) => {
    const thumb = $(`[data-thumb="${point.id}"]`);
    if (thumb && point.photo) {
      thumb.src = point.photo;
      thumb.style.display = "block";
    }
  });

  $$("[data-photo-point]").forEach((input) => {
    input.addEventListener("change", (event) => {
      const file = event.target.files[0];
      if (!file) return;
      readImage(file, (image) => {
        updateItem("points", event.target.dataset.photoPoint, "photo", image);
        renderAll();
      });
    });
  });

  $$("[data-clear-photo]").forEach((button) => {
    button.addEventListener("click", () => {
      updateItem("points", button.dataset.clearPhoto, "photo", "");
      renderAll();
    });
  });
}

function renderPeople() {
  $("#peopleList").innerHTML = state.people.map((person, index) => `
    <article class="item">
      <div class="item-head">
        <div class="item-title">Persona ${index + 1}</div>
        <button class="button danger" data-remove-person="${person.id}">Eliminar</button>
      </div>
      <div class="mini-grid">
        <label>Nombre<input data-person="${person.id}" data-field="name" value="${escapeHtml(person.name)}"></label>
        <label>Cargo<input data-person="${person.id}" data-field="role" value="${escapeHtml(person.role)}"></label>
        <label>Empresa<input data-person="${person.id}" data-field="company" value="${escapeHtml(person.company)}"></label>
        <label>Teléfono<input data-person="${person.id}" data-field="phone" value="${escapeHtml(person.phone)}"></label>
        <label class="full">Responsabilidad<textarea data-person="${person.id}" data-field="responsibility">${escapeHtml(person.responsibility)}</textarea></label>
      </div>
    </article>
  `).join("");

  $$("[data-person]").forEach((input) => {
    input.addEventListener("input", (event) => updateItem("people", event.target.dataset.person, event.target.dataset.field, event.target.value));
  });

  $$("[data-remove-person]").forEach((button) => {
    button.addEventListener("click", () => removeById("people", button.dataset.removePerson));
  });
}

function renderTrips() {
  $("#tripsList").innerHTML = state.trips.map((trip, index) => `
    <article class="item">
      <div class="item-head">
        <div class="item-title">Viaje ${index + 1}</div>
        <button class="button danger" data-remove-trip="${trip.id}">Eliminar</button>
      </div>
      <div class="mini-grid">
        <label>Nombre<input data-trip="${trip.id}" data-field="name" value="${escapeHtml(trip.name)}"></label>
        <label>Tractos<input data-trip="${trip.id}" data-field="tractors" value="${escapeHtml(trip.tractors)}"></label>
        <label>Conductores<input data-trip="${trip.id}" data-field="drivers" value="${escapeHtml(trip.drivers)}"></label>
        <label>Supervisor<input data-trip="${trip.id}" data-field="supervisor" value="${escapeHtml(trip.supervisor)}"></label>
        <label>Escolta delantera<input data-trip="${trip.id}" data-field="frontEscort" value="${escapeHtml(trip.frontEscort ?? trip.escort ?? "")}"></label>
        <label>Escolta intermedia<input data-trip="${trip.id}" data-field="middleEscort" value="${escapeHtml(trip.middleEscort ?? "")}"></label>
        <label>Escolta posterior<input data-trip="${trip.id}" data-field="rearEscort" value="${escapeHtml(trip.rearEscort ?? "")}"></label>
        <label class="wide">Componentes<textarea data-trip="${trip.id}" data-field="components">${escapeHtml(trip.components)}</textarea></label>
        <label class="wide">Observaciones<textarea data-trip="${trip.id}" data-field="observations">${escapeHtml(trip.observations)}</textarea></label>
      </div>
    </article>
  `).join("");

  $$("[data-trip]").forEach((input) => {
    input.addEventListener("input", (event) => updateItem("trips", event.target.dataset.trip, event.target.dataset.field, event.target.value));
  });

  $$("[data-remove-trip]").forEach((button) => {
    button.addEventListener("click", () => removeById("trips", button.dataset.removeTrip));
  });
}

function renderHistory() {
  $("#historyList").innerHTML = state.changeLog.map((entry, index) => `
    <article class="item">
      <div class="item-head">
        <div class="item-title">Cambio ${index + 1}</div>
        <button class="button danger" data-remove-history="${entry.id}">Eliminar</button>
      </div>
      <div class="mini-grid">
        <label>Fecha<input type="date" data-history="${entry.id}" data-field="date" value="${escapeHtml(entry.date)}"></label>
        <label>Versión<input data-history="${entry.id}" data-field="version" value="${escapeHtml(entry.version)}"></label>
        <label class="wide">Responsable<input data-history="${entry.id}" data-field="responsible" value="${escapeHtml(entry.responsible)}"></label>
        <label class="full">Detalle del cambio<textarea data-history="${entry.id}" data-field="detail">${escapeHtml(entry.detail)}</textarea></label>
      </div>
    </article>
  `).join("");

  $$("[data-history]").forEach((input) => {
    input.addEventListener("input", (event) => updateItem("changeLog", event.target.dataset.history, event.target.dataset.field, event.target.value));
  });

  $$("[data-remove-history]").forEach((button) => {
    button.addEventListener("click", () => removeById("changeLog", button.dataset.removeHistory));
  });
}

function renderAttachments() {
  $("#attachmentsList").innerHTML = state.attachments.map((attachment, index) => `
    <article class="item attachment-row">
      <div>
        <label class="file-drop">
          <input type="file" accept="image/*" data-attachment-image="${attachment.id}">
          <span>Cargar imagen</span>
        </label>
        <img class="thumb" data-attachment-thumb="${attachment.id}" alt="Imagen del anexo ${index + 1}">
      </div>
      <div>
        <div class="item-head">
          <div class="item-title">Anexo ${index + 1}</div>
          <button class="button danger" data-remove-attachment="${attachment.id}">Eliminar</button>
        </div>
        <div class="mini-grid">
          <label>Tipo
            <select data-attachment="${attachment.id}" data-field="type">
              <option ${attachment.type === "Permiso de trabajo" ? "selected" : ""}>Permiso de trabajo</option>
              <option ${["Análisis de riesgo / ART", "Analisis de riesgo / ART"].includes(attachment.type) ? "selected" : ""}>Análisis de riesgo / ART</option>
              <option ${["Inspección de unidad", "Inspeccion de unidad"].includes(attachment.type) ? "selected" : ""}>Inspección de unidad</option>
              <option ${attachment.type === "Formato HSE" ? "selected" : ""}>Formato HSE</option>
              <option ${attachment.type === "Otro documento" ? "selected" : ""}>Otro documento</option>
            </select>
          </label>
          <label class="wide">Titulo<input data-attachment="${attachment.id}" data-field="title" value="${escapeHtml(attachment.title)}" placeholder="Ej. Permiso de trabajo en caliente"></label>
          <label class="full">Observación<textarea data-attachment="${attachment.id}" data-field="description">${escapeHtml(attachment.description)}</textarea></label>
        </div>
      </div>
    </article>
  `).join("");

  state.attachments.forEach((attachment) => {
    const thumb = $(`[data-attachment-thumb="${attachment.id}"]`);
    if (thumb && attachment.image) {
      thumb.src = attachment.image;
      thumb.style.display = "block";
    }
  });

  $$("[data-attachment]").forEach((input) => {
    input.addEventListener("input", (event) => updateItem("attachments", event.target.dataset.attachment, event.target.dataset.field, event.target.value));
  });

  $$("[data-attachment-image]").forEach((input) => {
    input.addEventListener("change", (event) => {
      const file = event.target.files[0];
      if (!file) return;
      readImage(file, (image) => {
        updateItem("attachments", event.target.dataset.attachmentImage, "image", image);
        renderAll();
      });
    });
  });

  $$("[data-remove-attachment]").forEach((button) => {
    button.addEventListener("click", () => removeById("attachments", button.dataset.removeAttachment));
  });
}

function orderedPoints() {
  return state.direction === "retorno" ? [...state.points].reverse() : state.points;
}

function orderedTrips() {
  return state.direction === "retorno" ? [...state.trips].reverse() : state.trips;
}

function routeNames() {
  const isReturn = state.direction === "retorno";
  return {
    origin: isReturn ? state.project.destination : state.project.origin,
    destination: isReturn ? state.project.origin : state.project.destination,
    label: isReturn ? "RETORNO" : "IDA"
  };
}
