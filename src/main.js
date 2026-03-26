/**
 * Nova Post TTN Manager — Main Entry Point
 * SPA Router with hash-based navigation
 */

import './styles/index.css';
import 'leaflet/dist/leaflet.css';
import { renderHeader } from './components/header.js';
import { renderDashboard, initDashboard } from './pages/dashboard.js';
import { renderCreateTTN, initCreateTTN } from './pages/createTTN/index.js';
import { renderTracking, initTracking } from './pages/tracking.js';
import { renderDocuments, initDocuments } from './pages/documents.js';
import { renderSettings, initSettings } from './pages/settings.js';
import { hasApiKey } from './api/novaposhta.js';
import { html } from './utils/dom.js';

const app = document.getElementById('app');

// Current page
let currentPage = 'dashboard';

// Navigation
async function navigateTo(page) {
  currentPage = page;
  window.location.hash = page;
  await renderPage();
}

// Theme handling
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  renderPage();
}


async function renderPage() {
  let pageContent = '';

  switch (currentPage) {
    case 'dashboard':
      pageContent = await renderDashboard();
      break;
    case 'create':
      pageContent = renderCreateTTN();
      break;
    case 'tracking':
      pageContent = renderTracking();
      break;
    case 'documents':
      pageContent = renderDocuments();
      break;
    case 'settings':
      pageContent = renderSettings();
      break;
    default:
      pageContent = await renderDashboard();
      currentPage = 'dashboard';
  }

  app.innerHTML = html`${renderHeader(currentPage)}${pageContent}`;

  // Bind navigation
  bindNavigation();

  // Bind theme toggle
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }


  // Initialize page-specific logic
  switch (currentPage) {
    case 'dashboard':
      await initDashboard();
      break;
    case 'create':
      initCreateTTN(navigateTo);
      break;
    case 'tracking':
      initTracking();
      break;
    case 'documents':
      await initDocuments();
      break;
    case 'settings':
      initSettings(navigateTo);
      break;
  }
}

function bindNavigation() {
  document.querySelectorAll('[data-nav]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const target = el.dataset.nav;
      if (target && target !== currentPage) {
        navigateTo(target);
      }
    });
  });
}

// Hash-based routing
function handleHash() {
  const hash = window.location.hash.replace('#', '') || 'dashboard';

  // If no API key, redirect to settings (except settings page itself)
  if (!hasApiKey() && hash !== 'settings') {
    currentPage = hash; // Still render the page but with "set API key" message
  } else {
    currentPage = hash;
  }

  renderPage();
}

window.addEventListener('hashchange', handleHash);

// Initial render
initTheme();
handleHash();

