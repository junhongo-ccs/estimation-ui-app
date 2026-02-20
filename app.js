const AUTH_PASSWORD = 'ccs-bs-expert'; // 暫定パスワード

// State management
const state = {
  isAuthenticated: false,
};

// DOM Elements
const authGate = document.getElementById('auth-gate');
const appContainer = document.getElementById('app-container');
const loginBtn = document.getElementById('login-btn');
const loginPasswordInput = document.getElementById('password');
const authError = document.getElementById('auth-error');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  setupEventListeners();
});

/**
 * Check if the user is already authenticated
 */
function checkAuth() {
  const isAuth = sessionStorage.getItem('is_authenticated');
  if (isAuth === 'true') {
    grantAccess();
  }
}

/**
 * Handle Login
 */
function handleLogin() {
  const password = loginPasswordInput.value.trim();
  if (password === AUTH_PASSWORD) {
    sessionStorage.setItem('is_authenticated', 'true');
    grantAccess();
  } else {
    authError.style.display = 'block';
    loginPasswordInput.value = '';
    loginPasswordInput.focus();
  }
}

/**
 * Grant access to the app
 */
function grantAccess() {
  state.isAuthenticated = true;
  authGate.style.display = 'none';
  appContainer.style.display = 'flex';
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Login button click
  loginBtn.addEventListener('click', handleLogin);

  // Login password enter key
  loginPasswordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  });
}
