const STORAGE_KEY = "panorama-riesgos-v1";
const FILE_SCHEMA = "panorama-riesgos-ruta";
const FILE_EXTENSION = ".panr.json";
let currentFileHandle = null;

const state = {
  direction: "ida",
  project: {
    projectName: "Panorama de Riesgos de Ruta",
    client: "",
    company: "",
    serviceType: "Fractura",
    origin: "Base BHDC",
    destination: "Pozo 11087 ZA-01",
    issueDate: new Date().toISOString().slice(0, 10),
    version: "1.0",
    totalDistance: "",
    preparedBy: "",
    reviewedBy: "",
    approvedBy: ""
  },
  mapImage: "",
  gpxRoute: null,
  points: [],
  people: [],
  trips: [],
  attachments: [],
  changeLog: []
};

const fields = [
  "projectName",
  "client",
  "company",
  "serviceType",
  "origin",
  "destination",
  "issueDate",
  "version",
  "totalDistance",
  "preparedBy",
  "reviewedBy",
  "approvedBy"
];

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));
const AUTHOR_FOOTER = "Nelson Adrián Arca Godoy | Ingeniero Químico CIP 182479 | arcagodoy@gmail.com";
let mediaLeafletMap = null;
let documentLeafletMap = null;

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setStatus(message) {
  $("#saveStatus").textContent = message;
}

function serializeProject() {
  return {
    schema: FILE_SCHEMA,
    version: 1,
    savedAt: new Date().toISOString(),
    data: {
      project: state.project,
      mapImage: state.mapImage,
      gpxRoute: state.gpxRoute,
      points: state.points,
      people: state.people,
      trips: state.trips,
      attachments: state.attachments,
      changeLog: state.changeLog
    }
  };
}

function projectPayload() {
  return JSON.stringify(serializeProject(), null, 2);
}

function applyProjectData(payload) {
  const data = payload && payload.data ? payload.data : payload;
  Object.assign(state.project, data.project || {});
  if (state.project.serviceType === "Cementacion") state.project.serviceType = "Cementación";
  state.mapImage = data.mapImage || "";
  state.gpxRoute = data.gpxRoute || null;
  state.points = normalizePoints(data.points || []);
  state.people = data.people || [];
  state.trips = normalizeTrips(data.trips || []);
  state.attachments = data.attachments || [];
  state.changeLog = data.changeLog || [];
  state.direction = "ida";
  renderAll();
  saveToBrowser("Proyecto cargado");
}

function saveToBrowser(message = "Guardado") {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  setStatus(message);
  setTimeout(() => setStatus("Listo"), 1200);
}

function load() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    Object.assign(state.project, parsed.project || {});
    if (state.project.serviceType === "Cementacion") state.project.serviceType = "Cementación";
    state.mapImage = parsed.mapImage || "";
    state.gpxRoute = parsed.gpxRoute || null;
    state.points = normalizePoints(parsed.points || []);
    state.people = parsed.people || [];
    state.trips = normalizeTrips(parsed.trips || []);
    state.attachments = parsed.attachments || [];
    state.changeLog = parsed.changeLog || [];
  } catch {
    setStatus("Error al cargar");
  }
}

function normalizePoints(points) {
  return points.map((point) => {
    const progressive = parseProgressive(point.distance);
    return {
      ...point,
      km: point.km ?? progressive.km,
      meters: point.meters ?? progressive.meters,
      riskLevel: point.riskLevel ?? "Medio"
    };
  });
}

function normalizeTrips(trips) {
  return trips.map((trip) => ({
    ...trip,
    frontEscort: trip.frontEscort ?? trip.escort ?? "",
    middleEscort: trip.middleEscort ?? "",
    rearEscort: trip.rearEscort ?? ""
  }));
}

function canUseFileSystemAccess() {
  return "showOpenFilePicker" in window && "showSaveFilePicker" in window;
}

function safeFileName(value) {
  return `${String(value || "Panorama_Riesgos")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 90) || "Panorama_Riesgos"}${FILE_EXTENSION}`;
}

function downloadProjectFile() {
  const blob = new Blob([projectPayload()], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = safeFileName(state.project.projectName);
  link.click();
  URL.revokeObjectURL(url);
}

async function saveProject() {
  saveToBrowser();
  if (!currentFileHandle) {
    await saveProjectAs();
    return;
  }
  try {
    const writable = await currentFileHandle.createWritable();
    await writable.write(projectPayload());
    await writable.close();
    setStatus("Archivo actualizado");
  } catch {
    downloadProjectFile();
    setStatus("Descargado");
  }
}

async function saveProjectAs() {
  saveToBrowser();
  if (!canUseFileSystemAccess()) {
    downloadProjectFile();
    setStatus("Descargado");
    return;
  }
  try {
    currentFileHandle = await window.showSaveFilePicker({
      suggestedName: safeFileName(state.project.projectName),
      types: [
        {
          description: "Panorama de Riesgos",
          accept: { "application/json": [".json"] }
        }
      ]
    });
    const writable = await currentFileHandle.createWritable();
    await writable.write(projectPayload());
    await writable.close();
    setStatus("Archivo guardado");
  } catch (error) {
    if (error.name !== "AbortError") {
      downloadProjectFile();
      setStatus("Descargado");
    }
  }
}

async function openProject() {
  if (!canUseFileSystemAccess()) {
    $("#openProjectInput").click();
    return;
  }
  try {
    const [handle] = await window.showOpenFilePicker({
      types: [
        {
          description: "Panorama de Riesgos",
          accept: { "application/json": [".json"] }
        }
      ],
      multiple: false
    });
    const file = await handle.getFile();
    const payload = JSON.parse(await file.text());
    currentFileHandle = handle;
    applyProjectData(payload);
    setStatus("Archivo abierto");
  } catch (error) {
    if (error.name !== "AbortError") setStatus("No se pudo abrir");
  }
}

function openProjectFromInput(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      currentFileHandle = null;
      applyProjectData(JSON.parse(reader.result));
      setStatus("Archivo abierto");
    } catch {
      setStatus("Archivo inválido");
    }
  };
  reader.readAsText(file);
}

function updateProjectFromInputs() {
  fields.forEach((field) => {
    state.project[field] = $(`#${field}`).value;
  });
  $("#pageTitle").textContent = state.project.projectName || "Panorama de Riesgos de Ruta";
  renderDocument();
}

function bindProjectInputs() {
  fields.forEach((field) => {
    const input = $(`#${field}`);
    input.addEventListener("input", updateProjectFromInputs);
  });
}

function renderProjectInputs() {
  fields.forEach((field) => {
    $(`#${field}`).value = state.project[field] || "";
  });
  $("#pageTitle").textContent = state.project.projectName || "Panorama de Riesgos de Ruta";
}

function activateTab(name) {
  $$(".tab").forEach((tab) => tab.classList.toggle("is-active", tab.dataset.tab === name));
  $$(".panel").forEach((panel) => panel.classList.toggle("is-active", panel.dataset.panel === name));
  if (name === "export") renderDocument();
}

function parseProgressive(value) {
  const text = String(value || "");
  const match = text.match(/(\d+)\s*(?:\+|km)?\s*(\d{1,3})?/i);
  return {
    km: match ? Number(match[1]) || 0 : 0,
    meters: match && match[2] ? Number(match[2]) || 0 : 0
  };
}

function formatProgressive(point) {
  const km = Number(point.km);
  const meters = Number(point.meters);
  if (Number.isFinite(km) || Number.isFinite(meters)) {
    return `Km ${Number.isFinite(km) ? km : 0}+${String(Number.isFinite(meters) ? meters : 0).padStart(3, "0")}`;
  }
  return point.distance || "Sin progresiva";
}

function riskLevelClass(level) {
  const normalized = String(level || "Medio").toLowerCase();
  if (normalized === "alto") return "risk-high";
  if (normalized === "bajo") return "risk-low";
  return "risk-medium";
}

function makePoint(data = {}) {
  const progressive = parseProgressive(data.distance);
  return {
    id: uid(),
    code: String(state.points.length + 1).padStart(2, "0"),
    distance: "",
    km: progressive.km,
    meters: progressive.meters,
    type: "Referencia",
    riskLevel: "Medio",
    location: "",
    descriptionOut: "",
    descriptionReturn: "",
    risk: "",
    control: "",
    observation: "",
    photo: "",
    ...data
  };
}

function addPoint(data = {}) {
  state.points.push(makePoint(data));
  renderAll();
}

function insertPointAt(index) {
  const boundedIndex = Math.max(0, Math.min(index, state.points.length));
  state.points.splice(boundedIndex, 0, makePoint({ code: `${String(boundedIndex + 1).padStart(2, "0")}A` }));
  renderAll();
}

function movePoint(id, direction) {
  const index = state.points.findIndex((point) => point.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= state.points.length) return;
  const [point] = state.points.splice(index, 1);
  state.points.splice(target, 0, point);
  renderAll();
}

function addPerson(data = {}) {
  state.people.push({
    id: uid(),
    name: "",
    role: "",
    company: "",
    phone: "",
    responsibility: "",
    ...data
  });
  renderAll();
}

function addTrip(data = {}) {
  state.trips.push({
    id: uid(),
    name: `Viaje ${state.trips.length + 1}`,
    components: "",
    tractors: "",
    drivers: "",
    supervisor: "",
    escort: "",
    frontEscort: "",
    middleEscort: "",
    rearEscort: "",
    observations: "",
    ...data
  });
  renderAll();
}

function addAttachment(data = {}) {
  state.attachments.push({
    id: uid(),
    type: "Permiso de trabajo",
    title: "",
    description: "",
    image: "",
    ...data
  });
  renderAll();
}

function addHistory(data = {}) {
  state.changeLog.push({
    id: uid(),
    date: new Date().toISOString().slice(0, 10),
    version: state.project.version || "1.0",
    responsible: state.project.preparedBy || "",
    detail: "",
    ...data
  });
  renderAll();
}

function removeById(collection, id) {
  state[collection] = state[collection].filter((item) => item.id !== id);
  renderAll();
}

function updateItem(collection, id, field, value) {
  const item = state[collection].find((entry) => entry.id === id);
  if (!item) return;
  item[field] = value;
  if (collection === "points" && (field === "km" || field === "meters")) {
    item[field] = Number(value);
    item.distance = formatProgressive(item);
  }
  renderDocument();
}

function readImage(file, callback) {
  const reader = new FileReader();
  reader.onload = () => callback(reader.result);
  reader.readAsDataURL(file);
}

function parseGpx(text, fileName = "Ruta GPX") {
  const xml = new DOMParser().parseFromString(text, "application/xml");
  if (xml.querySelector("parsererror")) throw new Error("GPX inválido");
  const nodes = [...xml.querySelectorAll("trkpt"), ...xml.querySelectorAll("rtept")];
  const points = nodes
    .map((node) => ({
      lat: Number(node.getAttribute("lat")),
      lon: Number(node.getAttribute("lon"))
    }))
    .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lon));
  if (points.length < 2) throw new Error("El GPX no tiene suficientes puntos");
  return {
    name: xml.querySelector("trk > name, rte > name, metadata > name")?.textContent?.trim() || fileName,
    importedAt: new Date().toISOString(),
    points
  };
}

function readGpx(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      state.gpxRoute = parseGpx(reader.result, file.name);
      renderAll();
      setStatus(`GPX cargado: ${state.gpxRoute.points.length} puntos`);
    } catch {
      setStatus("GPX inválido");
    }
  };
  reader.readAsText(file);
}

function routeBounds(points) {
  return points.reduce(
    (bounds, point) => ({
      minLat: Math.min(bounds.minLat, point.lat),
      maxLat: Math.max(bounds.maxLat, point.lat),
      minLon: Math.min(bounds.minLon, point.lon),
      maxLon: Math.max(bounds.maxLon, point.lon)
    }),
    { minLat: points[0].lat, maxLat: points[0].lat, minLon: points[0].lon, maxLon: points[0].lon }
  );
}
