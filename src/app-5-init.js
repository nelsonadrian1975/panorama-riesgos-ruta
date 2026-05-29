function renderMedia() {
  destroyLeafletMap(mediaLeafletMap);
  mediaLeafletMap = null;
  const preview = $("#mapPreview");
  const gpxPreview = $("#gpxPreview");
  const sourceStatus = $("#mapSourceStatus");
  if (state.gpxRoute) {
    const route = routeNames();
    gpxPreview.innerHTML = leafletAvailable()
      ? renderLeafletRouteShell("leafletRouteMap")
      : routeSvg(state.gpxRoute, "route-map-svg", {
          reverse: state.direction === "retorno",
          startLabel: route.origin,
          endLabel: route.destination
        });
    gpxPreview.style.display = "block";
    preview.removeAttribute("src");
    preview.style.display = "none";
    if (leafletAvailable()) initLeafletRouteMap("leafletRouteMap", "media");
    sourceStatus.textContent = leafletAvailable()
      ? `Mapa OpenStreetMap generado desde GPX: ${state.gpxRoute.points.length} puntos`
      : `Mapa técnico generado desde GPX: ${state.gpxRoute.points.length} puntos`;
  } else if (state.mapImage) {
    preview.src = state.mapImage;
    preview.style.display = "block";
    gpxPreview.innerHTML = "";
    gpxPreview.style.display = "none";
    sourceStatus.textContent = "Mapa desde captura cargada";
  } else {
    preview.removeAttribute("src");
    preview.style.display = "none";
    gpxPreview.innerHTML = "";
    gpxPreview.style.display = "none";
    sourceStatus.textContent = "Sin mapa cargado";
  }
  renderPhotoManager();
}

function renderAll() {
  renderProjectInputs();
  renderPoints();
  renderMedia();
  renderPeople();
  renderTrips();
  renderHistory();
  renderAttachments();
  renderDocument();
}

function sampleCriticalPoints() {
  const risks = [
    ["Salida de base", "Portón principal Base BHDC", "Medio"],
    ["Giro derecha", "Giro hacia vía principal con tránsito local", "Medio"],
    ["Cruce urbano", "Cruce con presencia de peatones y mototaxis", "Alto"],
    ["Cable eléctrico", "Cable aéreo próximo a vía", "Alto"],
    ["Badén", "Badén pronunciado en zona urbana", "Medio"],
    ["Curva abierta", "Curva suave a la derecha", "Bajo"],
    ["Curva cerrada", "Curva cerrada con visibilidad limitada", "Alto"],
    ["Puente angosto", "Puente de un carril con barandas laterales", "Alto"],
    ["Pendiente", "Pendiente descendente prolongada", "Alto"],
    ["Desvío", "Desvío temporal por reparación de vía", "Medio"],
    ["Zona poblada", "Ingreso a zona poblada con tránsito mixto", "Medio"],
    ["Cruce Panamericana", "Cruce con vía de alto tránsito", "Alto"],
    ["Cable eléctrico", "Cable aéreo en ingreso a camino interno", "Alto"],
    ["Badén", "Badén corto con aproximación irregular", "Medio"],
    ["Curva izquierda", "Curva izquierda con berma reducida", "Medio"],
    ["Camino afirmado", "Tramo afirmado con polvo y visibilidad variable", "Medio"],
    ["Giro derecha", "Giro derecho con radio amplio", "Bajo"],
    ["Cruce comunal", "Cruce con control comunal y tránsito local", "Medio"],
    ["Pendiente", "Pendiente pronunciada con posible pérdida de tracción", "Alto"],
    ["Zona estrecha", "Tramo estrecho con talud lateral", "Alto"],
    ["Badén", "Badén con acumulación de material suelto", "Medio"],
    ["Curva abierta", "Curva amplia con visibilidad adecuada", "Bajo"],
    ["Cable eléctrico", "Cable de baja altura cercano a componente alto", "Alto"],
    ["Intersección", "Intersección secundaria sin señalización", "Medio"],
    ["Puente", "Puente con acceso en curva", "Alto"],
    ["Desvío", "Desvío por mantenimiento de vía", "Medio"],
    ["Zona escolar", "Paso por zona escolar o tránsito peatonal", "Alto"],
    ["Camino interno", "Ingreso a camino interno de pozo", "Medio"],
    ["Curva derecha", "Curva derecha en tramo de baja velocidad", "Bajo"],
    ["Badén", "Badén profundo antes de acceso", "Medio"],
    ["Pendiente", "Subida pronunciada con superficie irregular", "Alto"],
    ["Zona de polvo", "Tramo con polvo suspendido por tránsito pesado", "Medio"],
    ["Cruce de maquinaria", "Posible cruce con maquinaria de terceros", "Medio"],
    ["Giro izquierdo", "Giro izquierdo hacia acceso operativo", "Medio"],
    ["Cable eléctrico", "Cruce bajo línea aérea", "Alto"],
    ["Estrechamiento", "Reducción de ancho por reparación de vía", "Alto"],
    ["Curva abierta", "Curva suave con berma estable", "Bajo"],
    ["Ingreso a locación", "Ingreso final a plataforma de pozo", "Medio"],
    ["Maniobra final", "Maniobra de ubicación de unidades en locación", "Medio"],
    ["Destino", "Punto final Pozo 11087 ZA-01", "Bajo"]
  ];

  return risks.map(([type, location, riskLevel], index) => {
    const km = Math.floor(index * 1.2);
    const meters = (index * 120) % 1000;
    return makePoint({
      code: String(index + 1).padStart(2, "0"),
      km,
      meters,
      distance: `Km ${km}+${String(meters).padStart(3, "0")}`,
      type,
      riskLevel,
      location,
      descriptionOut: `${location}. Mantener velocidad controlada y comunicación con escoltas durante el avance hacia el pozo.`,
      descriptionReturn: `${location}. En retorno, confirmar vía libre antes de ingresar al tramo y mantener coordinación con escolta posterior.`,
      risk: riskLevel === "Alto"
        ? "Condición con potencial de incidente severo para unidades pesadas, componentes altos o maniobras de giro."
        : riskLevel === "Medio"
          ? "Condición que requiere control operacional y reducción de velocidad."
          : "Condición controlable con conducción preventiva y seguimiento de ruta.",
      control: riskLevel === "Alto"
        ? "Escolta adelantada, paso uno a uno, comunicación radial y autorización del supervisor antes de cruzar o maniobrar."
        : riskLevel === "Medio"
          ? "Reducir velocidad, mantener distancia entre unidades y confirmar comunicación entre escoltas."
          : "Mantener conducción preventiva y respetar velocidad establecida.",
      observation: index % 9 === 0 ? "Validar condición del punto antes de la salida del convoy." : "",
      photo: ""
    });
  });
}

function loadSample() {
  currentFileHandle = null;
  Object.assign(state.project, {
    projectName: "Panorama de Riesgos Base BHDC al Pozo 11087 ZA-01 - Demo",
    client: "Cliente",
    company: "DRILLCOTEC",
    serviceType: "Fractura",
    origin: "Base BHDC",
    destination: "Pozo 11087 ZA-01",
    totalDistance: "48.6 km",
    preparedBy: "Nelson Adrián Arca Godoy",
    reviewedBy: "Supervisor HSE",
    approvedBy: "Jefatura de Operaciones",
    version: "1.0"
  });
  state.points = sampleCriticalPoints();
  state.people = [
    { id: uid(), name: "Supervisor de convoy", role: "Supervisor responsable", company: "DRILLCOTEC", phone: "+51 999 111 222", responsibility: "Coordinar movimiento, comunicación radial y autorizaciones de ruta." },
    { id: uid(), name: "Escolta delantera", role: "Escolta", company: "Contratista", phone: "+51 999 222 333", responsibility: "Control adelantado de vía, cruces y zonas pobladas." },
    { id: uid(), name: "Escolta posterior", role: "Escolta", company: "Contratista", phone: "+51 999 333 444", responsibility: "Cierre de convoy y control de unidades rezagadas." },
    { id: uid(), name: "Coordinador HSE", role: "HSE", company: "Cliente", phone: "+51 999 444 555", responsibility: "Validar controles operacionales y puntos críticos." }
  ];
  state.trips = [
    { id: uid(), name: "Viaje 1 - Equipos principales", components: "Frack Van\nBlender\nManifold de alta presión", tractors: "T-01, T-02, T-03", drivers: "Conductor 1 - T-01\nConductor 2 - T-02\nConductor 3 - T-03", supervisor: "Supervisor de convoy", frontEscort: "Escolta delantera", middleEscort: "", rearEscort: "Escolta posterior", observations: "Salida inicial del convoy. Mantener comunicación radial permanente." },
    { id: uid(), name: "Viaje 2 - Bombas", components: "Bomba HT-400 01\nBomba HT-400 02\nBomba HT-400 03\nBomba HT-400 04", tractors: "T-04, T-05, T-06, T-07", drivers: "Conductores asignados por unidad", supervisor: "Supervisor de convoy", frontEscort: "Escolta delantera", middleEscort: "Escolta intermedia", rearEscort: "Escolta posterior", observations: "Convoy pesado. Paso controlado en curvas y badenes." },
    { id: uid(), name: "Viaje 3 - Arenado y químicos", components: "Tolva arenera 01\nTolva arenera 02\nBatch mixer\nUnidad química", tractors: "T-08, T-09, T-10, T-11", drivers: "Conductores asignados por unidad", supervisor: "Supervisor de convoy", frontEscort: "Escolta delantera", middleEscort: "Escolta intermedia", rearEscort: "Escolta posterior", observations: "Verificar altura en cables y radios de giro." },
    { id: uid(), name: "Viaje 4 - Soporte", components: "Cisterna de agua\nCamión taller\nCamioneta HSE\nCarga menor", tractors: "T-12, T-13", drivers: "Conductores de soporte", supervisor: "Supervisor de convoy", frontEscort: "Escolta delantera", middleEscort: "", rearEscort: "Escolta posterior", observations: "Último viaje de ida; en retorno será el primero en salir." }
  ];
  state.attachments = [
    { id: uid(), type: "Permiso de trabajo", title: "Permiso de trabajo del movimiento", description: "Documento cargado como imagen para anexo final.", image: "" },
    { id: uid(), type: "Análisis de riesgo / ART", title: "Análisis de riesgo de tarea", description: "ART aplicable al movimiento del convoy.", image: "" },
    { id: uid(), type: "Inspección de unidad", title: "Formato de inspección de unidades", description: "Aplicable a unidades involucradas en el convoy.", image: "" }
  ];
  state.changeLog = [
    { id: uid(), date: new Date().toISOString().slice(0, 10), version: "1.0", responsible: "Supervisor de convoy", detail: "Emisión inicial del panorama de riesgos de ruta." }
  ];
  renderAll();
  saveToBrowser();
}

function bindEvents() {
  $$(".tab").forEach((button) => button.addEventListener("click", () => activateTab(button.dataset.tab)));
  $$("[data-open-modal]").forEach((button) => {
    button.addEventListener("click", () => openModal(button.dataset.openModal));
  });
  $$("[data-close-modal]").forEach((button) => {
    button.addEventListener("click", closeModal);
  });
  $("#modalBackdrop").addEventListener("click", (event) => {
    if (event.target === $("#modalBackdrop")) closeModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeModal();
  });
  $("#addPoint").addEventListener("click", () => addPoint());
  $("#addPerson").addEventListener("click", () => addPerson());
  $("#addTrip").addEventListener("click", () => addTrip());
  $("#addHistory").addEventListener("click", () => addHistory());
  $("#addAttachment").addEventListener("click", () => addAttachment());
  $("#openProject").addEventListener("click", openProject);
  $("#openProjectInput").addEventListener("change", (event) => {
    openProjectFromInput(event.target.files[0]);
    event.target.value = "";
  });
  $("#saveData").addEventListener("click", () => saveProject());
  $("#saveAsProject").addEventListener("click", () => saveProjectAs());
  $("#loadSample").addEventListener("click", loadSample);
  $("#resetData").addEventListener("click", () => {
    if (!confirm("Se limpiarán los datos guardados en este navegador.")) return;
    localStorage.removeItem(STORAGE_KEY);
    currentFileHandle = null;
    location.reload();
  });
  $("#mapInput").addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;
    readImage(file, (image) => {
      state.mapImage = image;
      state.gpxRoute = null;
      renderAll();
    });
  });
  $("#gpxInput").addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;
    readGpx(file);
    event.target.value = "";
  });
  $("#clearRouteMap").addEventListener("click", () => {
    state.mapImage = "";
    state.gpxRoute = null;
    renderAll();
  });
  $$(".direction").forEach((button) => {
    button.addEventListener("click", () => {
      state.direction = button.dataset.direction;
      $$(".direction").forEach((entry) => entry.classList.toggle("is-active", entry === button));
      renderMedia();
      renderDocument();
    });
  });
  $("#printPdf").addEventListener("click", async () => {
    renderDocument();
    if (state.gpxRoute && leafletAvailable()) {
      await wait(250);
      refitLeafletMap(documentLeafletMap);
      await waitForLeafletTiles(documentLeafletMap);
      await wait(250);
      refitLeafletMap(documentLeafletMap);
      await waitForLeafletTiles(documentLeafletMap, 2500);
    }
    window.print();
  });
}

window.addEventListener("beforeprint", () => {
  refitLeafletMap(documentLeafletMap);
});

if (window.matchMedia) {
  window.matchMedia("print").addEventListener("change", (event) => {
    if (event.matches) refitLeafletMap(documentLeafletMap);
  });
}

function openModal(modalId) {
  const backdrop = $("#modalBackdrop");
  const modal = $(`#${modalId}`);
  if (!backdrop || !modal) return;
  backdrop.hidden = false;
  $$(".app-modal").forEach((item) => {
    item.hidden = item !== modal;
  });
}

function closeModal() {
  const backdrop = $("#modalBackdrop");
  if (!backdrop) return;
  backdrop.hidden = true;
  $$(".app-modal").forEach((item) => {
    item.hidden = true;
  });
}

load();
bindProjectInputs();
bindEvents();
renderAll();
