import L from 'leaflet';
import { findNearestBranches } from '../utils/distance.js';
import { html } from '../utils/dom.js';

// Fix for leaflet markers in Vite/Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom Icons for different branch types
const defaultIcon = new L.Icon({
  ...L.Icon.Default.prototype.options
});

const cargoIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-gold.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const highlightIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

let mapInstance = null;
let markersLayer = null;
let currentWarehouses = [];

function createModalDOM() {
  if (document.getElementById('map-modal-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'map-modal-overlay';
  overlay.innerHTML = html`
    <div class="map-modal">
      <div class="map-modal-header">
        <h3 id="map-modal-title">Вибір відділення на карті</h3>
        <button class="map-modal-close" id="map-modal-close">×</button>
      </div>
      <div class="map-modal-body">
         <div id="map-container"></div>
         <div id="map-sidebar" class="map-sidebar">
            <h4 id="map-sidebar-title">Виберіть відділення</h4>
            <div id="map-sidebar-content">Натисніть на маркер відділення на карті, щоб побачити деталі.</div>
         </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const style = document.createElement('style');
  style.innerHTML = `
    #map-modal-overlay {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5); z-index: 9999;
      display: none; align-items: center; justify-content: center;
    }
    .map-modal {
      background: var(--bg-card, #fff); width: 90vw; height: 90vh;
      border-radius: var(--radius-lg, 12px); display: flex; flex-direction: column;
      overflow: hidden; box-shadow: var(--shadow-xl, 0 10px 25px rgba(0,0,0,0.2));
    }
    .map-modal-header {
      padding: var(--space-md, 16px); border-bottom: 1px solid var(--border-color, #e2e8f0);
      display: flex; justify-content: space-between; align-items: center;
    }
    .map-modal-header h3 { margin: 0; font-size: 1.2rem; }
    .map-modal-close {
      background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-muted, #64748b);
    }
    .map-modal-body {
      flex: 1; display: flex; min-height: 0;
    }
    #map-container {
      flex: 1; height: 100%;
    }
    .map-sidebar {
      width: 320px; border-left: 1px solid var(--border-color, #e2e8f0);
      padding: var(--space-md, 16px); overflow-y: auto; background: var(--bg-card, #fff);
      display: flex; flex-direction: column; gap: 12px;
    }
    .map-sidebar h4 { margin: 0 0 8px 0; }
    .branch-card {
      padding: 12px; border: 1px solid var(--border-color, #e2e8f0);
      border-radius: 8px; margin-bottom: 8px; font-size: 14px;
    }
    .branch-card.highlight {
      border-color: var(--primary-color, #ef4444); background: #fef2f2;
    }
    .branch-card-title { font-weight: 600; margin-bottom: 4px; }
    .branch-card-btn {
      margin-top: 8px; padding: 6px 12px; background: var(--primary-color, #ef4444);
      color: white; border: none; border-radius: 4px; cursor: pointer; width: 100%;
    }
    .branch-card-btn.sec {
      background: var(--bg-body, #f1f5f9); color: var(--text-color, #1e293b); border: 1px solid var(--border-color); margin-top: 4px;
    }
  `;
  document.head.appendChild(style);

  document.getElementById('map-modal-close').addEventListener('click', closeMapModal);
}

export function openMapModal(warehouses, onSelect) {
  createModalDOM();
  currentWarehouses = warehouses;

  const overlay = document.getElementById('map-modal-overlay');
  overlay.style.display = 'flex';

  if (!mapInstance) {
    mapInstance = L.map('map-container');
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapInstance);
    markersLayer = L.featureGroup().addTo(mapInstance);
  } else {
    // Invalidate size in case modal dimensions changed
    setTimeout(() => mapInstance.invalidateSize(), 100);
  }

  renderMarkers(warehouses, onSelect);

  // Update sidebar
  const sidebarContent = document.getElementById('map-sidebar-content');
  sidebarContent.innerHTML = 'Натисніть на маркер відділення на карті, щоб побачити деталі.';
}

export function closeMapModal() {
  const overlay = document.getElementById('map-modal-overlay');
  if (overlay) overlay.style.display = 'none';
}

function renderMarkers(warehouses, onSelect, highlights = []) {
  markersLayer.clearLayers();

  const bounds = [];

  warehouses.forEach(w => {
    if (!w.Latitude || !w.Longitude) return;

    let icon = defaultIcon;
    const maxWeight = parseInt(w.TotalMaxWeightAllowed);
    const isCargo = w.CategoryOfWarehouse === 'Cargo' || w.Description.toLowerCase().includes('вантажне') || (!isNaN(maxWeight) && (maxWeight > 30 || maxWeight === 0));

    if (isCargo) {
      icon = cargoIcon;
    }

    // Check if this branch is in the highlights list
    const isHighlight = highlights.find(h => h.Ref === w.Ref);
    if (isHighlight) {
      icon = highlightIcon; // Overrides defaults to show it's a found nearest branch
    }

    const marker = L.marker([parseFloat(w.Latitude), parseFloat(w.Longitude)], { icon });
    marker.on('click', () => {
      showSidebarDetails(w, onSelect);
    });

    // Popup on hover or click
    marker.bindPopup(html`<b>${w.Description}</b>`);
    markersLayer.addLayer(marker);
    bounds.push([parseFloat(w.Latitude), parseFloat(w.Longitude)]);
  });

  if (bounds.length > 0) {
    if (highlights.length > 0) {
      // If we are highlighting, focus on the highlighted ones plus the original selected one (which we assume is also in view or we just use highlights bounding box)
      mapInstance.fitBounds(L.latLngBounds(highlights.map(h => [parseFloat(h.Latitude), parseFloat(h.Longitude)])).pad(0.5));
    } else {
      mapInstance.fitBounds(L.latLngBounds(bounds).pad(0.1));
    }
  }
}

function showSidebarDetails(w, onSelect) {
  const sidebarContent = document.getElementById('map-sidebar-content');

  // Check cargo
  const maxWeight = parseInt(w.TotalMaxWeightAllowed);
  const isCargo = w.CategoryOfWarehouse === 'Cargo' || w.Description.toLowerCase().includes('вантажне') || (!isNaN(maxWeight) && (maxWeight > 30 || maxWeight === 0));

  // Basic info
  let markup = html`
    <div class="branch-card">
      <div class="branch-card-title">${w.Description}</div>
      <div style="font-size: 13px; color: #64748b;">
        <b>Тип:</b> ${isCargo ? 'Вантажне' : 'Поштове / Інше'}<br>
        <b>Розклад:</b> ${w.Reception?.Monday || 'Невідомо'}<br>
        <b>Обмеження ваги:</b> ${w.TotalMaxWeightAllowed > 0 ? `до ${w.TotalMaxWeightAllowed} кг` : 'Без обмежень'}
      </div>
      <button class="branch-card-btn" id="map-select-btn">✅ Обрати це відділення</button>
      
      <div style="margin-top: 16px; margin-bottom: 8px; font-size: 13px; font-weight: 600;">Пошук поруч:</div>
      <button class="branch-card-btn sec" id="map-find-cargo-btn">🔎 Найближчі вантажні</button>
      <button class="branch-card-btn sec" id="map-find-post-btn">🔎 Найближчі поштові</button>
    </div>
  `;
  sidebarContent.innerHTML = markup;

  // Bind actions
  document.getElementById('map-select-btn').onclick = () => {
    onSelect(w);
    closeMapModal();
  };

  document.getElementById('map-find-cargo-btn').onclick = () => {
    const nearest = findNearestBranches(w, currentWarehouses, 'Cargo', 3);
    showNearestInSidebar(w, nearest, onSelect);
  };

  document.getElementById('map-find-post-btn').onclick = () => {
    const nearest = findNearestBranches(w, currentWarehouses, 'Post', 3);
    showNearestInSidebar(w, nearest, onSelect);
  };
}

function showNearestInSidebar(source, nearestBranches, onSelect) {
  const sidebarContent = document.getElementById('map-sidebar-content');

  let markup = html`
      <button class="branch-card-btn sec" id="map-back-btn" style="margin-bottom: 12px;">← Назад до ${source.Description.split(',')[0]}...</button>
      <h4 style="margin-bottom: 8px;">Знайдено найближчі:</h4>
    `;

  nearestBranches.forEach((w, idx) => {
    markup += html`
          <div class="branch-card highlight">
            <div class="branch-card-title">${w.Description}</div>
            <div style="font-size: 13px; color: #64748b; margin-bottom: 8px;">
                <b>Відстань:</b> ~${w.distance.toFixed(2)} км
            </div>
            <button class="branch-card-btn" id="map-select-nearest-btn-${idx}">✅ Обрати</button>
          </div>
        `;
  });

  if (nearestBranches.length === 0) {
    markup += html`<div style="font-size: 13px;">Поруч нічого не знайдено.</div>`;
  }

  sidebarContent.innerHTML = markup;

  document.getElementById('map-back-btn').onclick = () => {
    showSidebarDetails(source, onSelect);
    renderMarkers(currentWarehouses, onSelect); // Reset map view to full
  };

  nearestBranches.forEach((w, idx) => {
    document.getElementById(`map-select-nearest-btn-${idx}`).onclick = () => {
      onSelect(w);
      closeMapModal();
    };
  });

  // Re-render map highlighting these nearest branches
  renderMarkers(currentWarehouses, onSelect, nearestBranches);
}
