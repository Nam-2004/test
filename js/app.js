// js/app.js - Main application logic

// Global variables
let currentUser = null;
let isLoggedIn = false;
let notifications = [];
let systemSettings = {};

// Application initialization
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Initialize application
function initializeApp() {
    // Check if user is logged in
    checkAuthenticationStatus();
    
    // Initialize system settings
    loadSystemSettings();
    
    // Initialize notifications
    initializeNotifications();
    
    // Initialize tooltips and popovers
    initializeBootstrapComponents();
    
    // Initialize keyboard shortcuts
    initializeKeyboardShortcuts();
    
    // Initialize auto-save functionality
    initializeAutoSave();
    
    // Initialize theme
    initializeTheme();
    
    // Initialize offline detection
    initializeOfflineDetection();
    
    // Initialize performance monitoring
    initializePerformanceMonitoring();
}

// Authentication functions
function checkAuthenticationStatus() {
    const loginStatus = sessionStorage.getItem('isLoggedIn');
    const username = sessionStorage.getItem('username');
    const loginTime = sessionStorage.getItem('loginTime');
    
    if (loginStatus === 'true' && username && loginTime) {
        // Check if session is still valid (24 hours)
        const currentTime = new Date().getTime();
        const sessionTime = parseInt(loginTime);
        const sessionDuration = 24 * 60 * 60 * 1000; // 24 hours
        
        if (currentTime - sessionTime < sessionDuration) {
            isLoggedIn = true;
            currentUser = {
                username: username,
                role: sessionStorage.getItem('userRole') || 'librarian',
                loginTime: new Date(sessionTime),
                permissions: JSON.parse(sessionStorage.getItem('userPermissions') || '[]')
            };
            
            // Update last activity
            sessionStorage.setItem('lastActivity', currentTime.toString());
            
            // Set user info in UI if elements exist
            updateUserInterface();
        } else {
            // Session expired
            logout('Phiên đăng nhập đã hết hạn');
        }
    } else {
        // Not logged in, redirect to login page if not already there
        if (!window.location.pathname.includes('index.html') && 
            !window.location.pathname.endsWith('/')) {
            window.location.href = 'index.html';
        }
    }
}

function login(username, password, rememberMe = false) {
    return new Promise((resolve, reject) => {
        // Show loading
        showLoading('Đang đăng nhập...');
        
        // Simulate API call
        setTimeout(() => {
            // Demo credentials
            const validCredentials = [
                { username: 'admin', password: 'admin123', role: 'admin', name: 'Quản trị viên' },
                { username: 'librarian', password: 'lib123', role: 'librarian', name: 'Thủ thư' },
                { username: 'staff', password: 'staff123', role: 'staff', name: 'Nhân viên' }
            ];
            
            const user = validCredentials.find(u => 
                u.username === username && u.password === password
            );
            
            hideLoading();
            
            if (user) {
                // Set session data
                const loginTime = new Date().getTime();
                sessionStorage.setItem('isLoggedIn', 'true');
                sessionStorage.setItem('username', user.username);
                sessionStorage.setItem('userRole', user.role);
                sessionStorage.setItem('userName', user.name);
                sessionStorage.setItem('loginTime', loginTime.toString());
                sessionStorage.setItem('lastActivity', loginTime.toString());
                
                // Set permissions based on role
                const permissions = getUserPermissions(user.role);
                sessionStorage.setItem('userPermissions', JSON.stringify(permissions));
                
                // Remember me functionality
                if (rememberMe) {
                    localStorage.setItem('rememberedUser', username);
                } else {
                    localStorage.removeItem('rememberedUser');
                }
                
                // Update global variables
                isLoggedIn = true;
                currentUser = {
                    username: user.username,
                    role: user.role,
                    name: user.name,
                    loginTime: new Date(loginTime),
                    permissions: permissions
                };
                
                // Log login activity
                logActivity('login', `Người dùng ${user.name} đăng nhập thành công`);
                
                // Show success notification
                showNotification(`Chào mừng ${user.name}!`, 'success');
                
                resolve(user);
            } else {
                showNotification('Tên đăng nhập hoặc mật khẩu không đúng!', 'error');
                reject(new Error('Invalid credentials'));
            }
        }, 1500);
    });
}

function logout(message = null) {
    // Log logout activity
    if (currentUser) {
        logActivity('logout', `Người dùng ${currentUser.name} đăng xuất`);
    }
    
    // Clear session data
    sessionStorage.clear();
    
    // Clear global variables
    isLoggedIn = false;
    currentUser = null;
    
    // Show message if provided
    if (message) {
        showNotification(message, 'info');
    }
    
    // Redirect to login page
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}

function getUserPermissions(role) {
    const permissions = {
        admin: [
            'view_all', 'edit_all', 'delete_all', 'manage_users', 
            'manage_settings', 'view_reports', 'export_data', 'backup_restore'
        ],
        librarian: [
            'view_all', 'edit_readers', 'edit_books', 'manage_borrow_return',
            'view_reports', 'export_data', 'manage_fines'
        ],
        staff: [
            'view_readers', 'view_books', 'manage_borrow_return', 'view_basic_reports'
        ]
    };
    
    return permissions[role] || [];
}

function hasPermission(permission) {
    if (!currentUser || !currentUser.permissions) {
        return false;
    }
    return currentUser.permissions.includes(permission) || currentUser.permissions.includes('view_all');
}

// UI Update functions
function updateUserInterface() {
    // Update user name in navigation
    const userElements = document.querySelectorAll('#currentUser, .current-user');
    userElements.forEach(element => {
        if (element) {
            element.textContent = currentUser?.name || currentUser?.username || 'User';
        }
    });
    
    // Update user role
    const roleElements = document.querySelectorAll('.user-role');
    roleElements.forEach(element => {
        if (element) {
            element.textContent = getRoleDisplayName(currentUser?.role);
        }
    });
    
    // Show/hide elements based on permissions
    updatePermissionBasedUI();
    
    // Update last login time
    updateLastLoginDisplay();
}

function updatePermissionBasedUI() {
    // Hide/show elements based on user permissions
    const permissionElements = document.querySelectorAll('[data-permission]');
    permissionElements.forEach(element => {
        const requiredPermission = element.getAttribute('data-permission');
        if (hasPermission(requiredPermission)) {
            element.style.display = '';
        } else {
            element.style.display = 'none';
        }
    });
    
    // Disable buttons based on permissions
    const permissionButtons = document.querySelectorAll('[data-permission-button]');
    permissionButtons.forEach(button => {
        const requiredPermission = button.getAttribute('data-permission-button');
        if (!hasPermission(requiredPermission)) {
            button.disabled = true;
            button.title = 'Bạn không có quyền thực hiện thao tác này';
        }
    });
}

function getRoleDisplayName(role) {
    const roleNames = {
        admin: 'Quản trị viên',
        librarian: 'Thủ thư',
        staff: 'Nhân viên'
    };
    return roleNames[role] || 'Người dùng';
}

function updateLastLoginDisplay() {
    const lastLoginElements = document.querySelectorAll('.last-login');
    lastLoginElements.forEach(element => {
        if (element && currentUser?.loginTime) {
            element.textContent = `Đăng nhập lúc: ${formatDateTime(currentUser.loginTime)}`;
        }
    });
}

// Notification system
function initializeNotifications() {
    // Create notification container if it doesn't exist
    if (!document.getElementById('notificationContainer')) {
        const container = document.createElement('div');
        container.id = 'notificationContainer';
        container.className = 'notification-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            max-width: 400px;
        `;
        document.body.appendChild(container);
    }
    
    // Load saved notifications
    loadNotifications();
    
    // Check for system notifications
    checkSystemNotifications();
}

function showNotification(message, type = 'info', duration = 5000, persistent = false) {
    const container = document.getElementById('notificationContainer');
    if (!container) return;
    
    const notification = document.createElement('div');
    const notificationId = 'notification_' + Date.now();
    notification.id = notificationId;
    
    const typeClasses = {
        success: 'alert-success',
        error: 'alert-danger',
        warning: 'alert-warning',
        info: 'alert-info'
    };
    
    const typeIcons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    notification.className = `alert ${typeClasses[type]} alert-dismissible fade show notification-item`;
    notification.style.cssText = `
        margin-bottom: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        border: none;
        border-radius: 8px;
    `;
    
    notification.innerHTML = `
        <i class="fas ${typeIcons[type]} me-2"></i>
        <span class="notification-message">${message}</span>
        <button type="button" class="btn-close" onclick="removeNotification('${notificationId}')"></button>
    `;
    
    container.appendChild(notification);
    
    // Add to notifications array
    const notificationData = {
        id: notificationId,
        message: message,
        type: type,
        timestamp: new Date(),
        persistent: persistent
    };
    notifications.push(notificationData);
    
    // Auto remove if not persistent
    if (!persistent && duration > 0) {
        setTimeout(() => {
            removeNotification(notificationId);
        }, duration);
    }
    
    // Save notifications
    saveNotifications();
    
    // Play notification sound
    playNotificationSound(type);
    
    return notificationId;
}

function removeNotification(notificationId) {
    const notification = document.getElementById(notificationId);
    if (notification) {
        notification.classList.add('fade-out');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }
    
    // Remove from notifications array
    notifications = notifications.filter(n => n.id !== notificationId);
    saveNotifications();
}

function clearAllNotifications() {
    const container = document.getElementById('notificationContainer');
    if (container) {
        container.innerHTML = '';
    }
    notifications = [];
    saveNotifications();
}

function saveNotifications() {
    try {
        const persistentNotifications = notifications.filter(n => n.persistent);
        localStorage.setItem('notifications', JSON.stringify(persistentNotifications));
    } catch (error) {
        console.error('Error saving notifications:', error);
    }
}

function loadNotifications() {
    try {
        const saved = localStorage.getItem('notifications');
        if (saved) {
            const savedNotifications = JSON.parse(saved);
            savedNotifications.forEach(notification => {
                // Only show notifications from today
                const notificationDate = new Date(notification.timestamp);
                const today = new Date();
                if (notificationDate.toDateString() === today.toDateString()) {
                    showNotification(notification.message, notification.type, 0, true);
                }
            });
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

function checkSystemNotifications() {
    // Check for overdue books
    if (typeof getOverdueBooks === 'function') {
        const overdueBooks = getOverdueBooks('all', '');
        if (overdueBooks.length > 0) {
            showNotification(
                `Có ${overdueBooks.length} sách quá hạn cần xử lý!`, 
                'warning', 
                0, 
                true
            );
        }
    }
    
    // Check for low stock books
    if (typeof getLowStockBooks === 'function') {
        const lowStockBooks = getLowStockBooks();
        if (lowStockBooks.length > 0) {
            showNotification(
                `Có ${lowStockBooks.length} loại sách sắp hết!`, 
                'warning', 
                0, 
                true
            );
        }
    }
    
    // Check for pending renewals
    if (typeof getPendingRenewals === 'function') {
        const pendingRenewals = getPendingRenewals();
        if (pendingRenewals.length > 0) {
            showNotification(
                `Có ${pendingRenewals.length} yêu cầu gia hạn chờ xử lý!`, 
                'info', 
                0, 
                true
            );
        }
    }
}

function playNotificationSound(type) {
    if (!systemSettings.enableSounds) return;
    
    try {
        const audio = new Audio();
        switch (type) {
            case 'success':
                audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT';
                break;
            case 'error':
                audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT';
                break;
            default:
                audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT';
        }
        audio.volume = 0.3;
        audio.play().catch(() => {
            // Ignore audio play errors (user interaction required)
        });
    } catch (error) {
        console.error('Error playing notification sound:', error);
    }
}

// Loading overlay functions
function showLoading(message = 'Đang tải...') {
    let overlay = document.getElementById('loadingOverlay');
    
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'loadingOverlay';
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;"></div>
                <div class="loading-message mt-3">${message}</div>
            </div>
        `;
        document.body.appendChild(overlay);
    } else {
        overlay.querySelector('.loading-message').textContent = message;
    }
    
    overlay.classList.remove('d-none');
    document.body.style.overflow = 'hidden';
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.add('d-none');
        document.body.style.overflow = '';
    }
}

function updateLoadingMessage(message) {
    const messageElement = document.querySelector('.loading-message');
    if (messageElement) {
        messageElement.textContent = message;
    }
}

// Bootstrap components initialization
function initializeBootstrapComponents() {
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Initialize popovers
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });
    
    // Initialize modals with custom options
    const modalElements = document.querySelectorAll('.modal');
    modalElements.forEach(modalElement => {
        modalElement.addEventListener('hidden.bs.modal', function () {
            // Clear form data when modal is closed
            const forms = this.querySelectorAll('form');
            forms.forEach(form => {
                if (form.hasAttribute('data-clear-on-close')) {
                    form.reset();
                }
            });
        });
    });
}

// Keyboard shortcuts
function initializeKeyboardShortcuts() {
    document.addEventListener('keydown', function(event) {
        // Ctrl/Cmd + shortcuts
        if (event.ctrlKey || event.metaKey) {
            switch(event.key) {
                case 's':
                    event.preventDefault();
                    saveCurrentForm();
                    break;
                case 'f':
                    event.preventDefault();
                    focusSearchInput();
                    break;
                case 'n':
                    event.preventDefault();
                    openNewItemModal();
                    break;
                case 'p':
                    event.preventDefault();
                    printCurrentPage();
                    break;
            }
        }
        
        // Function keys
        switch(event.key) {
            case 'F1':
                event.preventDefault();
                showHelpModal();
                break;
            case 'F5':
                if (!event.ctrlKey) {
                    event.preventDefault();
                    refreshCurrentData();
                }
                break;
            case 'Escape':
                closeTopModal();
                break;
        }
    });
}

function saveCurrentForm() {
    const activeForm = document.querySelector('form:focus-within, .modal.show form');
    if (activeForm) {
        const submitButton = activeForm.querySelector('button[type="submit"], .btn-primary');
        if (submitButton && !submitButton.disabled) {
            submitButton.click();
            showNotification('Đã lưu!', 'success', 2000);
        }
    }
}

function focusSearchInput() {
    const searchInputs = document.querySelectorAll('input[type="search"], input[placeholder*="tìm"], input[placeholder*="Tìm"]');
    if (searchInputs.length > 0) {
        searchInputs[0].focus();
        searchInputs[0].select();
    }
}

function openNewItemModal() {
    const newButtons = document.querySelectorAll('[data-bs-target*="Modal"]:contains("Thêm"), .btn:contains("Thêm mới")');
    if (newButtons.length > 0) {
        newButtons[0].click();
    }
}

function printCurrentPage() {
    window.print();
}

function showHelpModal() {
    // Create or show help modal
    let helpModal = document.getElementById('helpModal');
    if (!helpModal) {
        helpModal = createHelpModal();
        document.body.appendChild(helpModal);
    }
    
    const modal = new bootstrap.Modal(helpModal);
    modal.show();
}

function createHelpModal() {
    const modal = document.createElement('div');
    modal.id = 'helpModal';
    modal.className = 'modal fade';
    modal.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">
                        <i class="fas fa-question-circle"></i> Trợ giúp
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <h6>Phím tắt:</h6>
                    <ul>
                        <li><kbd>Ctrl + S</kbd>: Lưu form hiện tại</li>
                        <li><kbd>Ctrl + F</kbd>: Tìm kiếm</li>
                        <li><kbd>Ctrl + N</kbd>: Thêm mới</li>
                        <li><kbd>Ctrl + P</kbd>: In trang</li>
                        <li><kbd>F1</kbd>: Hiển thị trợ giúp</li>
                        <li><kbd>F5</kbd>: Làm mới dữ liệu</li>
                        <li><kbd>Esc</kbd>: Đóng modal</li>
                    </ul>
                    
                    <h6>Hướng dẫn sử dụng:</h6>
                    <div class="accordion" id="helpAccordion">
                        <div class="accordion-item">
                            <h2 class="accordion-header">
                                <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#help1">
                                    Quản lý độc giả
                                </button>
                            </h2>
                            <div id="help1" class="accordion-collapse collapse show" data-bs-parent="#helpAccordion">
                                <div class="accordion-body">
                                    <p>Để thêm độc giả mới, nhấn nút "Thêm độc giả" và điền đầy đủ thông tin...</p>
                                </div>
                            </div>
                        </div>
                        <div class="accordion-item">
                            <h2 class="accordion-header">
                                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#help2">
                                    Quản lý sách
                                </button>
                            </h2>
                            <div id="help2" class="accordion-collapse collapse" data-bs-parent="#helpAccordion">
                                <div class="accordion-body">
                                    <p>Để thêm sách mới, nhấn nút "Thêm sách" và điền thông tin sách...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
                </div>
            </div>
        </div>
    `;
    return modal;
}

function refreshCurrentData() {
    // Refresh data based on current page
    const currentPage = getCurrentPageType();
    
    switch(currentPage) {
        case 'readers':
            if (typeof loadReaders === 'function') {
                loadReaders();
                showNotification('Đã làm mới dữ liệu độc giả', 'success', 2000);
            }
            break;
        case 'books':
            if (typeof loadBooks === 'function') {
                loadBooks();
                showNotification('Đã làm mới dữ liệu sách', 'success', 2000);
            }
            break;
        case 'borrow-return':
            if (typeof loadBorrowReturnData === 'function') {
                loadBorrowReturnData();
                showNotification('Đã làm mới dữ liệu mượn/trả', 'success', 2000);
            }
            break;
        case 'reports':
            if (typeof loadReportData === 'function') {
                loadReportData();
                showNotification('Đã làm mới báo cáo', 'success', 2000);
            }
            break;
        default:
            showNotification('Đã làm mới trang', 'success', 2000);
            location.reload();
    }
}

function getCurrentPageType() {
    const path = window.location.pathname;
    if (path.includes('readers')) return 'readers';
    if (path.includes('books')) return 'books';
    if (path.includes('borrow-return')) return 'borrow-return';
    if (path.includes('reports')) return 'reports';
    return 'dashboard';
}

function closeTopModal() {
    const openModals = document.querySelectorAll('.modal.show');
    if (openModals.length > 0) {
        const topModal = openModals[openModals.length - 1];
        const modal = bootstrap.Modal.getInstance(topModal);
        if (modal) {
            modal.hide();
        }
    }
}

// Auto-save functionality
function initializeAutoSave() {
    const autoSaveForms = document.querySelectorAll('[data-auto-save]');
    
    autoSaveForms.forEach(form => {
        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('input', debounce(() => {
                autoSaveForm(form);
            }, 2000));
        });
    });
}

function autoSaveForm(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    const formId = form.id || 'unnamed_form';
    
    try {
        localStorage.setItem(`autosave_${formId}`, JSON.stringify({
            data: data,
            timestamp: new Date().toISOString()
        }));
        
        // Show subtle save indicator
        showAutoSaveIndicator(form);
    } catch (error) {
        console.error('Auto-save failed:', error);
    }
}

function loadAutoSavedData(formId) {
    try {
        const saved = localStorage.getItem(`autosave_${formId}`);
        if (saved) {
            const { data, timestamp } = JSON.parse(saved);
            const saveTime = new Date(timestamp);
            const now = new Date();
            
            // Only restore if saved within last hour
            if (now - saveTime < 60 * 60 * 1000) {
                return data;
            } else {
                // Remove old auto-save data
                localStorage.removeItem(`autosave_${formId}`);
            }
        }
    } catch (error) {
        console.error('Error loading auto-saved data:', error);
    }
    return null;
}

function showAutoSaveIndicator(form) {
    let indicator = form.querySelector('.auto-save-indicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.className = 'auto-save-indicator';
        indicator.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: #28a745;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            opacity: 0;
            transition: opacity 0.3s;
        `;
        indicator.innerHTML = '<i class="fas fa-check"></i> Đã lưu tự động';
        form.style.position = 'relative';
        form.appendChild(indicator);
    }
    
    indicator.style.opacity = '1';
    setTimeout(() => {
        indicator.style.opacity = '0';
    }, 2000);
}

// Theme management
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);
    
    // Add theme toggle if it exists
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    // Update theme toggle icon
    const themeIcon = document.querySelector('#themeToggle i');
    if (themeIcon) {
        themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);
    showNotification(`Đã chuyển sang chế độ ${newTheme === 'dark' ? 'tối' : 'sáng'}`, 'info', 2000);
}

// Offline detection
function initializeOfflineDetection() {
    window.addEventListener('online', () => {
        showNotification('Đã kết nối lại internet', 'success', 3000);
        syncOfflineData();
    });
    
    window.addEventListener('offline', () => {
        showNotification('Mất kết nối internet. Ứng dụng sẽ hoạt động ở chế độ offline.', 'warning', 5000);
    });
}

function syncOfflineData() {
    // Sync any offline data when connection is restored
    const offlineData = getOfflineData();
    if (offlineData.length > 0) {
        showLoading('Đang đồng bộ dữ liệu...');
        
        // Simulate sync process
        setTimeout(() => {
            clearOfflineData();
            hideLoading();
            showNotification(`Đã đồng bộ ${offlineData.length} thay đổi`, 'success');
        }, 2000);
    }
}

function getOfflineData() {
    try {
        return JSON.parse(localStorage.getItem('offlineData') || '[]');
    } catch {
        return [];
    }
}

function clearOfflineData() {
    localStorage.removeItem('offlineData');
}

// Performance monitoring
function initializePerformanceMonitoring() {
    // Monitor page load time
    window.addEventListener('load', () => {
        const loadTime = performance.now();
        if (loadTime > 3000) {
            console.warn('Slow page load detected:', loadTime + 'ms');
        }
    });
    
    // Monitor memory usage (if available)
    if ('memory' in performance) {
        setInterval(() => {
            const memory = performance.memory;
            if (memory.usedJSHeapSize > 50 * 1024 * 1024) { // 50MB
                console.warn('High memory usage detected:', memory.usedJSHeapSize / 1024 / 1024 + 'MB');
            }
        }, 30000);
    }
}

// System settings
function loadSystemSettings() {
    try {
        const saved = localStorage.getItem('systemSettings');
        systemSettings = saved ? JSON.parse(saved) : getDefaultSettings();
    } catch (error) {
        console.error('Error loading system settings:', error);
        systemSettings = getDefaultSettings();
    }
}

function getDefaultSettings() {
    return {
        enableSounds: true,
        autoSave: true,
        theme: 'light',
        language: 'vi',
        itemsPerPage: 10,
        dateFormat: 'dd/mm/yyyy',
        currency: 'VND',
        timezone: 'Asia/Ho_Chi_Minh',
        enableNotifications: true,
        autoLogout: 30, // minutes
        backupFrequency: 'daily',
        maxFileSize: 5, // MB
        allowedFileTypes: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'],
        libraryName: 'Thư viện trường THPT ABC',
        libraryAddress: '123 Đường ABC, Quận XYZ, TP. HCM',
        libraryPhone: '(028) 1234 5678',
        libraryEmail: 'library@school.edu.vn',
        finePerDay: 2000, // VND
        maxBorrowDays: 14,
        maxRenewals: 2,
        maxBooksPerReader: 5
    };
}

function saveSystemSettings() {
    try {
        localStorage.setItem('systemSettings', JSON.stringify(systemSettings));
        showNotification('Đã lưu cài đặt hệ thống', 'success', 2000);
    } catch (error) {
        console.error('Error saving system settings:', error);
        showNotification('Lỗi khi lưu cài đặt', 'error');
    }
}

function updateSetting(key, value) {
    systemSettings[key] = value;
    saveSystemSettings();
    
    // Apply setting immediately if needed
    switch(key) {
        case 'theme':
            applyTheme(value);
            break;
        case 'enableSounds':
            // Update sound preferences
            break;
        case 'autoLogout':
            resetAutoLogoutTimer();
            break;
    }
}

// Activity logging
function logActivity(action, description, data = null) {
    const activity = {
        id: generateId(),
        timestamp: new Date().toISOString(),
        user: currentUser?.username || 'anonymous',
        action: action,
        description: description,
        data: data,
        ip: 'localhost', // In real app, get from server
        userAgent: navigator.userAgent
    };
    
    // Save to local storage (in real app, send to server)
    let activities = getActivities();
    activities.unshift(activity);
    
    // Keep only last 1000 activities
    if (activities.length > 1000) {
        activities = activities.slice(0, 1000);
    }
    
    try {
        localStorage.setItem('activities', JSON.stringify(activities));
    } catch (error) {
        console.error('Error saving activity:', error);
    }
}

function getActivities(limit = 100) {
    try {
        const activities = JSON.parse(localStorage.getItem('activities') || '[]');
        return activities.slice(0, limit);
    } catch (error) {
        console.error('Error loading activities:', error);
        return [];
    }
}

function clearActivities() {
    localStorage.removeItem('activities');
    showNotification('Đã xóa lịch sử hoạt động', 'success');
}

// Auto logout functionality
let autoLogoutTimer = null;
let autoLogoutWarningTimer = null;

function initializeAutoLogout() {
    if (!systemSettings.autoLogout || systemSettings.autoLogout <= 0) {
        return;
    }
    
    resetAutoLogoutTimer();
    
    // Reset timer on user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
        document.addEventListener(event, resetAutoLogoutTimer, true);
    });
}

function resetAutoLogoutTimer() {
    if (!systemSettings.autoLogout || systemSettings.autoLogout <= 0) {
        return;
    }
    
    // Clear existing timers
    if (autoLogoutTimer) {
        clearTimeout(autoLogoutTimer);
    }
    if (autoLogoutWarningTimer) {
        clearTimeout(autoLogoutWarningTimer);
    }
    
    const timeoutMs = systemSettings.autoLogout * 60 * 1000; // Convert to milliseconds
    const warningMs = timeoutMs - (5 * 60 * 1000); // Warning 5 minutes before
    
    // Set warning timer
    if (warningMs > 0) {
        autoLogoutWarningTimer = setTimeout(() => {
            showAutoLogoutWarning();
        }, warningMs);
    }
    
    // Set logout timer
    autoLogoutTimer = setTimeout(() => {
        logout('Phiên đăng nhập đã hết hạn do không hoạt động');
    }, timeoutMs);
}

function showAutoLogoutWarning() {
    const warningModal = createAutoLogoutWarningModal();
    document.body.appendChild(warningModal);
    
    const modal = new bootstrap.Modal(warningModal);
    modal.show();
    
    // Auto close warning after 5 minutes
    setTimeout(() => {
        modal.hide();
        warningModal.remove();
    }, 5 * 60 * 1000);
}

function createAutoLogoutWarningModal() {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
        <div class="modal-dialog modal-sm">
            <div class="modal-content">
                <div class="modal-header bg-warning">
                    <h5 class="modal-title">
                        <i class="fas fa-exclamation-triangle"></i> Cảnh báo
                    </h5>
                </div>
                <div class="modal-body text-center">
                    <p>Phiên đăng nhập sẽ hết hạn sau <strong>5 phút</strong> nữa do không hoạt động.</p>
                    <p>Nhấn "Tiếp tục" để duy trì phiên đăng nhập.</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary" onclick="continueSession(this)">
                        <i class="fas fa-check"></i> Tiếp tục
                    </button>
                    <button type="button" class="btn btn-secondary" onclick="logout()">
                        <i class="fas fa-sign-out-alt"></i> Đăng xuất
                    </button>
                </div>
            </div>
        </div>
    `;
    return modal;
}

function continueSession(button) {
    const modal = button.closest('.modal');
    const modalInstance = bootstrap.Modal.getInstance(modal);
    modalInstance.hide();
    modal.remove();
    
    resetAutoLogoutTimer();
    showNotification('Đã gia hạn phiên đăng nhập', 'success', 2000);
}

// Data validation utilities
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePhone(phone) {
    const phoneRegex = /^[0-9+\-\s\(\)]{10,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
}

function validateStudentId(studentId) {
    // Vietnamese student ID format: 8-12 digits
    const studentIdRegex = /^[0-9]{8,12}$/;
    return studentIdRegex.test(studentId);
}

function validateISBN(isbn) {
    // Remove hyphens and spaces
    isbn = isbn.replace(/[-\s]/g, '');
    
    // Check ISBN-10 or ISBN-13
    if (isbn.length === 10) {
        return validateISBN10(isbn);
    } else if (isbn.length === 13) {
        return validateISBN13(isbn);
    }
    return false;
}

function validateISBN10(isbn) {
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        if (!/\d/.test(isbn[i])) return false;
        sum += parseInt(isbn[i]) * (10 - i);
    }
    
    const checkDigit = isbn[9].toLowerCase();
    sum += (checkDigit === 'x') ? 10 : parseInt(checkDigit);
    
    return sum % 11 === 0;
}

function validateISBN13(isbn) {
    let sum = 0;
    for (let i = 0; i < 12; i++) {
        if (!/\d/.test(isbn[i])) return false;
        sum += parseInt(isbn[i]) * (i % 2 === 0 ? 1 : 3);
    }
    
    const checkDigit = parseInt(isbn[12]);
    return (10 - (sum % 10)) % 10 === checkDigit;
}

function validateRequired(value) {
    return value !== null && value !== undefined && value.toString().trim() !== '';
}

function validateMinLength(value, minLength) {
    return value && value.toString().length >= minLength;
}

function validateMaxLength(value, maxLength) {
    return !value || value.toString().length <= maxLength;
}

function validateNumeric(value) {
    return !isNaN(value) && !isNaN(parseFloat(value));
}

function validatePositiveNumber(value) {
    return validateNumeric(value) && parseFloat(value) > 0;
}

function validateDate(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
}

function validateFutureDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return validateDate(dateString) && date >= today;
}

function validatePastDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    return validateDate(dateString) && date <= today;
}

// Form validation
function validateForm(form) {
    const errors = [];
    const requiredFields = form.querySelectorAll('[required]');
    
    requiredFields.forEach(field => {
        if (!validateRequired(field.value)) {
            errors.push(`${getFieldLabel(field)} là bắt buộc`);
            markFieldError(field);
        } else {
            clearFieldError(field);
        }
    });
    
    // Validate specific field types
    const emailFields = form.querySelectorAll('input[type="email"]');
    emailFields.forEach(field => {
        if (field.value && !validateEmail(field.value)) {
            errors.push(`${getFieldLabel(field)} không đúng định dạng`);
            markFieldError(field);
        }
    });
    
    const phoneFields = form.querySelectorAll('input[data-type="phone"]');
    phoneFields.forEach(field => {
        if (field.value && !validatePhone(field.value)) {
            errors.push(`${getFieldLabel(field)} không đúng định dạng`);
            markFieldError(field);
        }
    });
    
    const studentIdFields = form.querySelectorAll('input[data-type="student-id"]');
    studentIdFields.forEach(field => {
        if (field.value && !validateStudentId(field.value)) {
            errors.push(`${getFieldLabel(field)} phải có 8-12 chữ số`);
            markFieldError(field);
        }
    });
    
    const isbnFields = form.querySelectorAll('input[data-type="isbn"]');
    isbnFields.forEach(field => {
        if (field.value && !validateISBN(field.value)) {
            errors.push(`${getFieldLabel(field)} không đúng định dạng ISBN`);
            markFieldError(field);
        }
    });
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

function getFieldLabel(field) {
    const label = form.querySelector(`label[for="${field.id}"]`);
    return label ? label.textContent.replace('*', '').trim() : field.name || field.placeholder || 'Trường';
}

function markFieldError(field) {
    field.classList.add('is-invalid');
    
    // Remove existing error message
    const existingError = field.parentNode.querySelector('.invalid-feedback');
    if (existingError) {
        existingError.remove();
    }
}

function clearFieldError(field) {
    field.classList.remove('is-invalid');
    
    const errorMessage = field.parentNode.querySelector('.invalid-feedback');
    if (errorMessage) {
        errorMessage.remove();
    }
}

function showFormErrors(errors) {
    if (errors.length > 0) {
        const errorHtml = errors.map(error => `<li>${error}</li>`).join('');
        showNotification(`
            <strong>Vui lòng kiểm tra lại:</strong>
            <ul class="mb-0 mt-2">${errorHtml}</ul>
        `, 'error', 8000);
    }
}

// Utility functions
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatDate(date, format = null) {
    if (!date) return '';
    
    const d = new Date(date);
    if (isNaN(d)) return '';
    
    const formatStr = format || systemSettings.dateFormat || 'dd/mm/yyyy';
    
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    
    return formatStr
        .replace('dd', day)
        .replace('mm', month)
        .replace('yyyy', year);
}

function formatDateTime(date) {
    if (!date) return '';
    
    const d = new Date(date);
    if (isNaN(d)) return '';
    
    return formatDate(d) + ' ' + d.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatCurrency(amount, currency = null) {
    if (amount === null || amount === undefined) return '';
    
    const curr = currency || systemSettings.currency || 'VND';
    
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: curr,
        minimumFractionDigits: 0
    }).format(amount);
}

function formatNumber(number, decimals = 0) {
    if (number === null || number === undefined) return '';
    
    return new Intl.NumberFormat('vi-VN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(number);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    if (typeof obj === 'object') {
        const clonedObj = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                clonedObj[key] = deepClone(obj[key]);
            }
        }
        return clonedObj;
    }
}

function sanitizeHtml(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function capitalizeWords(str) {
    if (!str) return '';
    return str.replace(/\w\S*/g, (txt) => 
        txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
}

function removeAccents(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function createSlug(str) {
    return removeAccents(str)
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-');
}

// File handling utilities
function validateFileSize(file, maxSizeMB = null) {
    const maxSize = (maxSizeMB || systemSettings.maxFileSize) * 1024 * 1024;
    return file.size <= maxSize;
}

function validateFileType(file, allowedTypes = null) {
    const allowed = allowedTypes || systemSettings.allowedFileTypes;
    const extension = file.name.split('.').pop().toLowerCase();
    return allowed.includes(extension);
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}

function downloadFile(data, filename, type = 'text/plain') {
    const blob = new Blob([data], { type });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}

// Search and filter utilities
function createSearchFilter(searchTerm, fields) {
    const term = removeAccents(searchTerm.toLowerCase());
    
    return function(item) {
        return fields.some(field => {
            const value = getNestedProperty(item, field);
            if (value === null || value === undefined) return false;
            return removeAccents(value.toString().toLowerCase()).includes(term);
        });
    };
}

function getNestedProperty(obj, path) {
    return path.split('.').reduce((current, key) => {
        return current && current[key] !== undefined ? current[key] : null;
    }, obj);
}

function sortData(data, sortField, sortDirection = 'asc') {
    return [...data].sort((a, b) => {
        const aVal = getNestedProperty(a, sortField);
        const bVal = getNestedProperty(b, sortField);
        
        // Handle null/undefined values
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;
        
        // Handle different data types
        if (typeof aVal === 'string' && typeof bVal === 'string') {
            const comparison = removeAccents(aVal.toLowerCase()).localeCompare(
                removeAccents(bVal.toLowerCase())
            );
            return sortDirection === 'asc' ? comparison : -comparison;
        }
        
        if (typeof aVal === 'number' && typeof bVal === 'number') {
            return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }
        
        if (aVal instanceof Date && bVal instanceof Date) {
            return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }
        
        // Default string comparison
        const aStr = aVal.toString();
        const bStr = bVal.toString();
        const comparison = aStr.localeCompare(bStr);
        return sortDirection === 'asc' ? comparison : -comparison;
    });
}

function paginateData(data, page, itemsPerPage) {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    return {
        data: data.slice(startIndex, endIndex),
        totalPages: Math.ceil(data.length / itemsPerPage),
        currentPage: page,
        totalItems: data.length,
        itemsPerPage: itemsPerPage,
        hasNextPage: endIndex < data.length,
        hasPrevPage: page > 1
    };
}

// Export utilities
function exportToCSV(data, filename, headers = null) {
    if (!data || data.length === 0) {
        showNotification('Không có dữ liệu để xuất', 'warning');
        return;
    }
    
    let csv = '';
    
    // Add BOM for UTF-8
    csv += '\ufeff';
    
    // Add headers
    if (headers) {
        csv += headers.join(',') + '\n';
    } else if (data.length > 0) {
        csv += Object.keys(data[0]).join(',') + '\n';
    }
    
    // Add data rows
    data.forEach(row => {
        const values = Object.values(row).map(value => {
            // Escape quotes and wrap in quotes if contains comma
            const stringValue = value?.toString() || '';
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                return '"' + stringValue.replace(/"/g, '""') + '"';
            }
            return stringValue;
        });
        csv += values.join(',') + '\n';
    });
    
    downloadFile(csv, filename, 'text/csv;charset=utf-8;');
}

function exportToJSON(data, filename) {
    const json = JSON.stringify(data, null, 2);
    downloadFile(json, filename, 'application/json');
}

// Initialize auto logout when app starts
document.addEventListener('DOMContentLoaded', function() {
    if (isLoggedIn) {
        initializeAutoLogout();
    }
});

// Global error handler
window.addEventListener('error', function(event) {
    console.error('Global error:', event.error);
    
    // Don't show error notifications for script loading errors
    if (event.error && !event.filename) {
        showNotification('Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.', 'error');
    }
});

// Global unhandled promise rejection handler
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    showNotification('Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.', 'error');
});

// Expose global functions
window.app = {
    // Authentication
    login,
    logout,
    checkAuthenticationStatus,
    hasPermission,
    
    // Notifications
    showNotification,
    removeNotification,
    clearAllNotifications,
    
    // Loading
    showLoading,
    hideLoading,
    updateLoadingMessage,
    
    // Settings
    updateSetting,
    getSystemSettings: () => systemSettings,
    
    // Validation
    validateForm,
    validateEmail,
    validatePhone,
    validateISBN,
    
    // Utilities
    formatDate,
    formatDateTime,
    formatCurrency,
    formatNumber,
    generateId,
    debounce,
    throttle,
    deepClone,
    
    // File handling
    validateFileSize,
    validateFileType,
    formatFileSize,
    downloadFile,
    
    // Data manipulation
    sortData,
    paginateData,
    createSearchFilter,
    
    // Export
    exportToCSV,
    exportToJSON,
    
    // Activity logging
    logActivity,
    getActivities
};
