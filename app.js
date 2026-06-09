import authApi from './api/authApi.js';
import parkingApi from './api/parkingApi.js';

// Global State
let allSlots = [];
let allUsers = [];
let currentUser = null;

// =========================================================================
// UTILITIES & NOTIFICATIONS
// =========================================================================
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'danger') icon = '❌';
  if (type === 'warning') icon = '⚠️';

  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);

  // Auto remove toast after 4 seconds
  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s forwards';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Toggle password visibility
document.querySelectorAll('.password-toggle').forEach(button => {
  button.addEventListener('click', function() {
    const targetId = this.getAttribute('data-target');
    const input = document.getElementById(targetId);
    if (input.type === 'password') {
      input.type = 'text';
      this.textContent = '🔒';
    } else {
      input.type = 'password';
      this.textContent = '👁️';
    }
  });
});

// =========================================================================
// AUTHENTICATION FLOWS (Login / Register / Forgot)
// =========================================================================

// Tab Switching
const tabLoginBtn = document.getElementById('tabLoginBtn');
const tabRegisterBtn = document.getElementById('tabRegisterBtn');
const loginCard = document.getElementById('loginCard');
const registerCard = document.getElementById('registerCard');
const forgotPasswordCard = document.getElementById('forgotPasswordCard');

tabLoginBtn.addEventListener('click', () => {
  tabLoginBtn.classList.add('active');
  tabRegisterBtn.classList.remove('active');
  loginCard.classList.add('active');
  registerCard.classList.remove('active');
  forgotPasswordCard.classList.remove('active');
});

tabRegisterBtn.addEventListener('click', () => {
  tabRegisterBtn.classList.add('active');
  tabLoginBtn.classList.remove('active');
  registerCard.classList.add('active');
  loginCard.classList.remove('active');
  forgotPasswordCard.classList.remove('active');
});

// Go to Forgot Password
document.getElementById('toForgotPassword').addEventListener('click', (e) => {
  e.preventDefault();
  loginCard.classList.remove('active');
  forgotPasswordCard.classList.add('active');
});

// Back to Login from Forgot Password
document.getElementById('backToLoginBtn').addEventListener('click', () => {
  forgotPasswordCard.classList.remove('active');
  loginCard.classList.add('active');
});

// Login Execution
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  const submitBtn = document.getElementById('loginSubmitBtn');
  const btnText = submitBtn.querySelector('.btn-text');
  const spinner = submitBtn.querySelector('.spinner');

  // Show loading state
  btnText.style.display = 'none';
  spinner.style.display = 'inline-block';
  submitBtn.disabled = true;

  try {
    const data = await authApi.login({ userEmail: email, userPassword: password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('email', data.userEmail);
    localStorage.setItem('role', data.userRole);
    localStorage.setItem('fullName', data.userFullName);
    localStorage.setItem('userId', data.userId);

    showToast('Đăng nhập thành công!', 'success');
    
    // Check Auth and update UI
    checkAuthStatus();
  } catch (err) {
    const errorMsg = err.response?.data || err.message || 'Đăng nhập thất bại!';
    showToast(errorMsg, 'danger');
  } finally {
    btnText.style.display = 'inline-block';
    spinner.style.display = 'none';
    submitBtn.disabled = false;
  }
});

// Register Execution
document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const regName = document.getElementById('regName').value;
  const regEmail = document.getElementById('regEmail').value;
  const regPassword = document.getElementById('regPassword').value;
  const regPhone = document.getElementById('regPhone').value;
  const regAddress = document.getElementById('regAddress').value;

  const submitBtn = document.getElementById('registerSubmitBtn');
  const btnText = submitBtn.querySelector('.btn-text');
  const spinner = submitBtn.querySelector('.spinner');

  btnText.style.display = 'none';
  spinner.style.display = 'inline-block';
  submitBtn.disabled = true;

  try {
    await authApi.register({
      userFullName: regName,
      userEmail: regEmail,
      userPassword: regPassword,
      userPhone: regPhone,
      userAddress: regAddress
    });
    
    showToast('Đăng ký tài khoản thành công! Hãy đăng nhập.', 'success');
    
    // Switch to Login Tab
    tabLoginBtn.click();
    document.getElementById('registerForm').reset();
  } catch (err) {
    const errorMsg = err.response?.data || err.message || 'Đăng ký thất bại!';
    showToast(errorMsg, 'danger');
  } finally {
    btnText.style.display = 'inline-block';
    spinner.style.display = 'none';
    submitBtn.disabled = false;
  }
});

// Reset Password Execution
document.getElementById('forgotForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const emailOrPhone = document.getElementById('resetEmail').value;
  const newPassword = document.getElementById('resetPassword').value;
  const confirmPassword = document.getElementById('resetConfirmPassword').value;

  if (newPassword !== confirmPassword) {
    showToast('Mật khẩu xác nhận không khớp!', 'warning');
    return;
  }

  try {
    await authApi.resetPassword({
      emailOrPhone: emailOrPhone,
      newPassword: newPassword,
      confirmPassword: confirmPassword
    });
    showToast('Đặt lại mật khẩu thành công! Hãy đăng nhập.', 'success');
    document.getElementById('backToLoginBtn').click();
    document.getElementById('forgotForm').reset();
  } catch (err) {
    const errorMsg = err.response?.data || err.message || 'Lỗi đặt lại mật khẩu!';
    showToast(errorMsg, 'danger');
  }
});

// Logout Execution
document.getElementById('logoutBtn').addEventListener('click', logout);

function logout() {
  localStorage.clear();
  showToast('Đã đăng xuất tài khoản!', 'warning');
  checkAuthStatus();
}

// =========================================================================
// AUTHORIZATION & DOM NAVIGATION
// =========================================================================

const landingWrapper = document.getElementById('landingWrapper');
const authWrapper = document.getElementById('authWrapper');
const mainDashboard = document.getElementById('mainDashboard');

const landingLoginBtn = document.getElementById('landingLoginBtn');
const authBackToHomeBtn = document.getElementById('authBackToHomeBtn');

if (landingLoginBtn) {
  landingLoginBtn.addEventListener('click', () => {
    landingWrapper.style.display = 'none';
    authWrapper.style.display = 'flex';
  });
}

if (authBackToHomeBtn) {
  authBackToHomeBtn.addEventListener('click', () => {
    authWrapper.style.display = 'none';
    landingWrapper.style.display = 'block';
  });
}

const backHomeLinks = document.querySelectorAll('.back-home-link');
backHomeLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    authWrapper.style.display = 'none';
    landingWrapper.style.display = 'block';
  });
});

const navSlots = document.getElementById('navSlots');
const navUsers = document.getElementById('navUsers');
const slotsSection = document.getElementById('slotsSection');
const usersSection = document.getElementById('usersSection');

// Nav items switching
navSlots.addEventListener('click', (e) => {
  e.preventDefault();
  navSlots.classList.add('active');
  navUsers.classList.remove('active');
  slotsSection.style.display = 'block';
  usersSection.style.display = 'none';
});

navUsers.addEventListener('click', (e) => {
  e.preventDefault();
  navUsers.classList.add('active');
  navSlots.classList.remove('active');
  usersSection.style.display = 'block';
  slotsSection.style.display = 'none';
  loadUsers();
});

function checkAuthStatus() {
  const token = localStorage.getItem('token');
  const email = localStorage.getItem('email');
  const role = localStorage.getItem('role') || 'USER';
  const fullName = localStorage.getItem('fullName') || '';

  if (token) {
    if (landingWrapper) landingWrapper.style.display = 'none';
    authWrapper.style.display = 'none';
    mainDashboard.style.display = 'flex';
    document.getElementById('userEmailDisplay').innerText = email;
    document.getElementById('userRoleDisplay').innerText = role === 'ADMIN' ? 'Quản trị viên' : 'Thành viên';
    document.getElementById('userAvatar').innerText = fullName ? fullName.charAt(0).toUpperCase() : 'U';

    // Show/hide Admin only menu items
    if (role === 'ADMIN') {
      navUsers.style.display = 'flex';
      document.getElementById('openAddSlotModalBtn').style.display = 'inline-flex';
    } else {
      navUsers.style.display = 'none';
      document.getElementById('openAddSlotModalBtn').style.display = 'none';
    }

    // Default view: Slots
    navSlots.click();
    loadSlots();
  } else {
    if (landingWrapper) landingWrapper.style.display = 'block';
    authWrapper.style.display = 'none';
    mainDashboard.style.display = 'none';
  }
}

// =========================================================================
// PARKING SLOTS BUSINESS LOGIC
// =========================================================================

// Refresh Button
document.getElementById('refreshSlotsBtn').addEventListener('click', loadSlots);

async function loadSlots() {
  try {
    allSlots = await parkingApi.getAllSlots();
    renderSlotsGrid();
    renderSlotsTable();
    updateDashboardStats();
  } catch (err) {
    handleApiError(err, 'Không tải được danh sách slot!');
  }
}

// Update Stats Cards
function updateDashboardStats() {
  const total = allSlots.length;
  const available = allSlots.filter(s => s.available).length;
  const occupied = total - available;

  document.getElementById('totalSlotsCount').innerText = total;
  document.getElementById('availableSlotsCount').innerText = available;
  document.getElementById('occupiedSlotsCount').innerText = occupied;
}

// Render Parking grid (visual blocks)
function renderSlotsGrid() {
  const grid = document.getElementById('parkingGrid');
  grid.innerHTML = '';

  if (allSlots.length === 0) {
    grid.innerHTML = `<div class="card" style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">Không có dữ liệu vị trí đỗ xe.</div>`;
    return;
  }

  const role = localStorage.getItem('role');

  allSlots.forEach(slot => {
    const card = document.createElement('div');
    card.className = `parking-slot-card ${slot.available ? 'available' : 'occupied'}`;
    card.setAttribute('data-id', slot.id);

    // Emojis for vehicle type
    let vehicleIcon = '🚗';
    if (slot.vehicleType?.toLowerCase().includes('máy')) vehicleIcon = '🏍️';
    if (slot.vehicleType?.toLowerCase().includes('đạp')) vehicleIcon = '🚲';

    card.innerHTML = `
      <span class="slot-visual-id">ID: ${slot.id}</span>
      <span class="slot-visual-icon">${slot.available ? '🟢' : vehicleIcon}</span>
      <span class="slot-visual-code">${slot.slotCode}</span>
      <span class="slot-visual-badge">${slot.available ? 'Còn trống' : 'Đã đỗ'}</span>
      <span class="slot-visual-type">${slot.vehicleType || 'Không xác định'}</span>
    `;

    // Only Admin can edit/delete from visual card hover menu
    if (role === 'ADMIN') {
      const actions = document.createElement('div');
      actions.className = 'slot-card-actions';
      
      const editBtn = document.createElement('button');
      editBtn.className = 'btn btn-secondary';
      editBtn.style.padding = '4px 8px';
      editBtn.style.fontSize = '0.8rem';
      editBtn.innerText = 'Sửa';
      editBtn.onclick = (e) => {
        e.stopPropagation();
        openEditSlotModal(slot);
      };

      const delBtn = document.createElement('button');
      delBtn.className = 'btn btn-danger';
      delBtn.style.padding = '4px 8px';
      delBtn.style.fontSize = '0.8rem';
      delBtn.innerText = 'Xóa';
      delBtn.onclick = (e) => {
        e.stopPropagation();
        handleDeleteSlot(slot.id);
      };

      actions.appendChild(editBtn);
      actions.appendChild(delBtn);
      card.appendChild(actions);
    }

    grid.appendChild(card);
  });
}

// Render slots inside details table
function renderSlotsTable() {
  const tbody = document.getElementById('slotTableBody');
  tbody.innerHTML = '';

  const role = localStorage.getItem('role');

  allSlots.forEach(slot => {
    const tr = document.createElement('tr');
    
    // Action column based on admin privileges
    let actionHtml = `<span class="text-dark">Không có quyền</span>`;
    if (role === 'ADMIN') {
      actionHtml = `
        <div class="row-actions">
          <button class="btn-action-edit" title="Sửa" data-id="${slot.id}">📝</button>
          <button class="btn-action-delete" title="Xóa" data-id="${slot.id}">🗑️</button>
        </div>
      `;
    }

    tr.innerHTML = `
      <td>${slot.id}</td>
      <td><strong>${slot.slotCode}</strong></td>
      <td>${slot.vehicleType}</td>
      <td>
        <span class="badge ${slot.available ? 'badge-success' : 'badge-danger'}">
          ${slot.available ? 'Còn trống' : 'Đã đỗ'}
        </span>
      </td>
      <td>${actionHtml}</td>
    `;

    // Add event listeners for table buttons
    if (role === 'ADMIN') {
      tr.querySelector('.btn-action-edit').addEventListener('click', () => openEditSlotModal(slot));
      tr.querySelector('.btn-action-delete').addEventListener('click', () => handleDeleteSlot(slot.id));
    }

    tbody.appendChild(tr);
  });
}

// Add / Edit Slot Modal Handling
const slotModal = document.getElementById('slotModal');
const slotForm = document.getElementById('slotForm');
const slotModalTitle = document.getElementById('slotModalTitle');

document.getElementById('openAddSlotModalBtn').addEventListener('click', () => {
  slotModalTitle.innerText = 'Thêm Slot Mới';
  slotForm.reset();
  document.getElementById('slotFormId').value = '';
  openModal(slotModal);
});

document.getElementById('closeSlotModalBtn').addEventListener('click', () => closeModal(slotModal));
document.getElementById('cancelSlotModalBtn').addEventListener('click', () => closeModal(slotModal));

function openEditSlotModal(slot) {
  slotModalTitle.innerText = 'Cập nhật Thông tin Slot';
  document.getElementById('slotFormId').value = slot.id;
  document.getElementById('slotCode').value = slot.slotCode;
  document.getElementById('vehicleType').value = slot.vehicleType;
  document.getElementById('slotAvailable').value = slot.available.toString();
  openModal(slotModal);
}

// Modal open/close actions
function openModal(modal) {
  modal.classList.add('open');
}
function closeModal(modal) {
  modal.classList.remove('open');
}

// Submit Slot Form (Create / Update)
slotForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('slotFormId').value;
  const slotData = {
    slotCode: document.getElementById('slotCode').value,
    vehicleType: document.getElementById('vehicleType').value,
    available: document.getElementById('slotAvailable').value === 'true'
  };

  try {
    if (id) {
      // Update
      await parkingApi.updateSlot(id, slotData);
      showToast(`Đã cập nhật thành công Slot ID ${id}!`, 'success');
    } else {
      // Create
      await parkingApi.createSlot(slotData);
      showToast('Đã tạo thành công slot đỗ xe mới!', 'success');
    }
    closeModal(slotModal);
    loadSlots();
  } catch (err) {
    handleApiError(err, 'Lỗi thao tác vị trí đỗ xe!');
  }
});

// Delete Slot Action
async function handleDeleteSlot(id) {
  if (!confirm(`Bạn chắc chắn muốn xóa vị trí đỗ xe ID: ${id}?`)) return;

  try {
    await parkingApi.deleteSlot(id);
    showToast(`Đã xóa thành công Slot ID ${id}!`, 'success');
    loadSlots();
  } catch (err) {
    handleApiError(err, 'Lỗi xóa vị trí đỗ xe!');
  }
}

// =========================================================================
// USER MANAGEMENT BUSINESS LOGIC (ADMIN VIEW)
// =========================================================================

document.getElementById('refreshUsersBtn').addEventListener('click', loadUsers);

async function loadUsers() {
  try {
    allUsers = await authApi.getAllUsers();
    renderUsersTable();
  } catch (err) {
    handleApiError(err, 'Không tải được danh sách thành viên!');
  }
}

function renderUsersTable() {
  const tbody = document.getElementById('userTableBody');
  tbody.innerHTML = '';

  const role = localStorage.getItem('role');

  allUsers.forEach(user => {
    const tr = document.createElement('tr');
    tr.className = user.deleted ? 'text-dark' : '';

    let actionHtml = `<span class="text-dark">Không có quyền</span>`;
    if (role === 'ADMIN') {
      actionHtml = `
        <div class="row-actions">
          <button class="btn-action-edit" title="Sửa" data-id="${user.userId}">📝</button>
          <button class="btn-action-delete" title="${user.deleted ? 'Khôi phục' : 'Vô hiệu hóa'}" data-id="${user.userId}">
            ${user.deleted ? '🔄' : '🚫'}
          </button>
        </div>
      `;
    }

    tr.innerHTML = `
      <td>${user.userId}</td>
      <td><strong>${user.userFullName}</strong></td>
      <td>${user.userEmail}</td>
      <td>${user.userPhone}</td>
      <td>${user.userAddress}</td>
      <td>
        <span class="badge ${user.userRole === 'ADMIN' ? 'badge-info' : 'badge-secondary'}">
          ${user.userRole}
        </span>
      </td>
      <td>
        <span class="badge ${user.deleted ? 'badge-danger' : 'badge-success'}">
          ${user.deleted ? 'Đã khóa' : 'Hoạt động'}
        </span>
      </td>
      <td>${actionHtml}</td>
    `;

    if (role === 'ADMIN') {
      tr.querySelector('.btn-action-edit').addEventListener('click', () => openEditUserModal(user));
      tr.querySelector('.btn-action-delete').addEventListener('click', () => handleDeleteUser(user.userId));
    }

    tbody.appendChild(tr);
  });
}

// User Modal Handling
const userModal = document.getElementById('userModal');
const userForm = document.getElementById('userForm');

document.getElementById('closeUserModalBtn').addEventListener('click', () => closeModal(userModal));
document.getElementById('cancelUserModalBtn').addEventListener('click', () => closeModal(userModal));

function openEditUserModal(user) {
  document.getElementById('userFormId').value = user.userId;
  document.getElementById('userFullName').value = user.userFullName;
  document.getElementById('userEmail').value = user.userEmail;
  document.getElementById('userPhone').value = user.userPhone;
  document.getElementById('userAddress').value = user.userAddress;
  openModal(userModal);
}

userForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('userFormId').value;
  const userData = {
    userFullName: document.getElementById('userFullName').value,
    userEmail: document.getElementById('userEmail').value,
    userPhone: document.getElementById('userPhone').value,
    userAddress: document.getElementById('userAddress').value
  };

  try {
    await authApi.updateUser(id, userData);
    showToast(`Cập nhật thông tin thành viên ID ${id} thành công!`, 'success');
    closeModal(userModal);
    loadUsers();
  } catch (err) {
    handleApiError(err, 'Không thể cập nhật thành viên!');
  }
});

async function handleDeleteUser(id) {
  try {
    await authApi.deleteUser(id);
    showToast(`Đã thay đổi trạng thái hoạt động thành viên ID ${id}!`, 'success');
    loadUsers();
  } catch (err) {
    handleApiError(err, 'Lỗi thay đổi trạng thái thành viên!');
  }
}

// =========================================================================
// ERROR HANDLER
// =========================================================================
function handleApiError(err, fallbackMsg) {
  // If unauthorized, redirect to login
  if (err.response?.status === 401 || err.response?.status === 403) {
    showToast('Phiên làm việc đã hết hạn hoặc bạn không có quyền!', 'danger');
    logout();
  } else {
    const errorMsg = err.response?.data || err.message || fallbackMsg;
    showToast(errorMsg, 'danger');
  }
}

// =========================================================================
// LOAD APP INITIAL STATE
// =========================================================================
window.addEventListener('load', checkAuthStatus);
window.addEventListener('unhandledrejection', function(event) {
  console.error('Unhandled rejection:', event.reason);
});
