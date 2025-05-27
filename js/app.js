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

/**
 * @function initializeApp
 * @description Khởi tạo toàn bộ ứng dụng, kiểm tra trạng thái đăng nhập, tải cài đặt hệ thống và thiết lập các thành phần khác.
 */
function initializeApp() {
    // Kiểm tra trạng thái đăng nhập của người dùng
    checkAuthenticationStatus();

    // Khởi tạo cài đặt hệ thống
    loadSystemSettings();

    // Khởi tạo hệ thống thông báo
    initializeNotifications();

    // Khởi tạo các thành phần Bootstrap (tooltip, popover, modal)
    initializeBootstrapComponents();

    // Khởi tạo các phím tắt bàn phím
    initializeKeyboardShortcuts();

    // Khởi tạo chức năng tự động lưu (nếu có form được đánh dấu)
    initializeAutoSave();

    // Khởi tạo chủ đề (sáng/tối)
    initializeTheme();

    // Khởi tạo tính năng phát hiện trạng thái offline
    initializeOfflineDetection();

    // Khởi tạo giám sát hiệu suất
    initializePerformanceMonitoring();

    // Khởi tạo tính năng tự động đăng xuất nếu người dùng đã đăng nhập
    if (isLoggedIn) {
        initializeAutoLogout();
    }
}

// --- Chức năng xác thực (Authentication Functions) ---

/**
 * @function checkAuthenticationStatus
 * @description Kiểm tra trạng thái đăng nhập của người dùng từ sessionStorage.
 * Nếu phiên hết hạn hoặc không có, sẽ chuyển hướng về trang đăng nhập.
 */
function checkAuthenticationStatus() {
    const loginStatus = sessionStorage.getItem('isLoggedIn');
    const username = sessionStorage.getItem('username');
    const loginTime = sessionStorage.getItem('loginTime');

    if (loginStatus === 'true' && username && loginTime) {
        // Kiểm tra xem phiên có còn hợp lệ không (24 giờ)
        const currentTime = new Date().getTime();
        const sessionTime = parseInt(loginTime);
        const sessionDuration = 24 * 60 * 60 * 1000; // 24 giờ

        if (currentTime - sessionTime < sessionDuration) {
            isLoggedIn = true;
            currentUser = {
                username: username,
                role: sessionStorage.getItem('userRole') || 'librarian',
                name: sessionStorage.getItem('userName') || username,
                loginTime: new Date(sessionTime),
                permissions: JSON.parse(sessionStorage.getItem('userPermissions') || '[]')
            };

            // Cập nhật thời gian hoạt động cuối cùng
            sessionStorage.setItem('lastActivity', currentTime.toString());

            // Cập nhật giao diện người dùng với thông tin đăng nhập
            updateUserInterface();
        } else {
            // Phiên đã hết hạn
            logout('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        }
    } else {
        // Không đăng nhập, chuyển hướng đến trang đăng nhập nếu chưa ở đó
        if (!window.location.pathname.includes('index.html') &&
            !window.location.pathname.endsWith('/')) {
            window.location.href = 'index.html';
        }
    }
}

/**
 * @function login
 * @description Xử lý quá trình đăng nhập của người dùng.
 * @param {string} username - Tên tài khoản.
 * @param {string} password - Mật khẩu.
 * @param {boolean} rememberMe - Có ghi nhớ đăng nhập không.
 * @returns {Promise<Object>} - Trả về một Promise chứa thông tin người dùng nếu đăng nhập thành công.
 */
function login(username, password, rememberMe = false) {
    return new Promise((resolve, reject) => {
        showLoading('Đang đăng nhập...');

        // Mô phỏng cuộc gọi API xác thực (thay thế bằng API thực tế trong môi trường sản xuất)
        setTimeout(() => {
            // Thông tin đăng nhập demo
            const validCredentials = [
                { username: 'admin', password: '123456', role: 'admin', name: 'Quản trị viên' },
                { username: 'librarian', password: '123456', role: 'librarian', name: 'Thủ thư' },
                { username: 'staff', password: '123456', role: 'staff', name: 'Nhân viên' }
            ];

            const user = validCredentials.find(u =>
                u.username === username && u.password === password
            );

            hideLoading();

            if (user) {
                // Đặt dữ liệu phiên
                const loginTime = new Date().getTime();
                sessionStorage.setItem('isLoggedIn', 'true');
                sessionStorage.setItem('username', user.username);
                sessionStorage.setItem('userRole', user.role);
                sessionStorage.setItem('userName', user.name);
                sessionStorage.setItem('loginTime', loginTime.toString());
                sessionStorage.setItem('lastActivity', loginTime.toString());

                // Đặt quyền dựa trên vai trò
                const permissions = getUserPermissions(user.role);
                sessionStorage.setItem('userPermissions', JSON.stringify(permissions));

                // Chức năng "Ghi nhớ đăng nhập"
                if (rememberMe) {
                    localStorage.setItem('rememberedUser', username);
                } else {
                    localStorage.removeItem('rememberedUser');
                }

                // Cập nhật biến toàn cục
                isLoggedIn = true;
                currentUser = {
                    username: user.username,
                    role: user.role,
                    name: user.name,
                    loginTime: new Date(loginTime),
                    permissions: permissions
                };

                // Ghi lại hoạt động đăng nhập
                logActivity('login', `Người dùng ${user.name} đăng nhập thành công`);

                showNotification(`Chào mừng ${user.name}!`, 'success');

                resolve(user);
            } else {
                showNotification('Tên đăng nhập hoặc mật khẩu không đúng!', 'error');
                reject(new Error('Tên đăng nhập hoặc mật khẩu không đúng'));
            }
        }, 1500);
    });
}

/**
 * @function logout
 * @description Xử lý quá trình đăng xuất của người dùng.
 * @param {string} [message=null] - Thông báo hiển thị sau khi đăng xuất.
 */
function logout(message = null) {
    // Ghi lại hoạt động đăng xuất
    if (currentUser) {
        logActivity('logout', `Người dùng ${currentUser.name} đăng xuất`);
    }

    // Xóa dữ liệu phiên
    sessionStorage.clear();

    // Xóa biến toàn cục
    isLoggedIn = false;
    currentUser = null;

    // Hiển thị thông báo nếu có
    if (message) {
        showNotification(message, 'info');
    }

    // Chuyển hướng đến trang đăng nhập
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}

/**
 * @function getUserPermissions
 * @description Trả về danh sách quyền dựa trên vai trò của người dùng.
 * @param {string} role - Vai trò của người dùng (admin, librarian, staff).
 * @returns {string[]} - Mảng các quyền.
 */
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

/**
 * @function hasPermission
 * @description Kiểm tra xem người dùng hiện tại có quyền cụ thể hay không.
 * @param {string} permission - Quyền cần kiểm tra.
 * @returns {boolean} - True nếu có quyền, ngược lại là False.
 */
function hasPermission(permission) {
    if (!currentUser || !currentUser.permissions) {
        return false;
    }
    return currentUser.permissions.includes(permission) || currentUser.permissions.includes('view_all');
}

// --- Chức năng cập nhật giao diện người dùng (UI Update Functions) ---

/**
 * @function updateUserInterface
 * @description Cập nhật các phần tử giao diện người dùng với thông tin người dùng hiện tại
 * và áp dụng các quyền dựa trên vai trò.
 */
function updateUserInterface() {
    // Cập nhật tên người dùng trong thanh điều hướng và các vị trí khác
    const userElements = document.querySelectorAll('#currentUser, .current-user');
    userElements.forEach(element => {
        if (element) {
            element.textContent = currentUser?.name || currentUser?.username || 'Người dùng';
        }
    });

    // Cập nhật vai trò người dùng
    const roleElements = document.querySelectorAll('.user-role');
    roleElements.forEach(element => {
        if (element) {
            element.textContent = getRoleDisplayName(currentUser?.role);
        }
    });

    // Ẩn/hiện các phần tử dựa trên quyền
    updatePermissionBasedUI();

    // Cập nhật hiển thị thời gian đăng nhập cuối cùng
    updateLastLoginDisplay();
}

/**
 * @function updatePermissionBasedUI
 * @description Ẩn hoặc hiện các phần tử HTML dựa trên thuộc tính `data-permission`
 * và quyền của người dùng hiện tại.
 */
function updatePermissionBasedUI() {
    const permissionElements = document.querySelectorAll('[data-permission]');
    permissionElements.forEach(element => {
        const requiredPermission = element.getAttribute('data-permission');
        if (hasPermission(requiredPermission)) {
            element.style.display = ''; // Hiển thị phần tử
        } else {
            element.style.display = 'none'; // Ẩn phần tử
        }
    });

    // Vô hiệu hóa các nút dựa trên quyền
    const permissionButtons = document.querySelectorAll('[data-permission-button]');
    permissionButtons.forEach(button => {
        const requiredPermission = button.getAttribute('data-permission-button');
        if (!hasPermission(requiredPermission)) {
            button.disabled = true;
            button.title = 'Bạn không có quyền thực hiện thao tác này';
        }
    });
}

/**
 * @function getRoleDisplayName
 * @description Trả về tên hiển thị của vai trò người dùng.
 * @param {string} role - Vai trò của người dùng.
 * @returns {string} - Tên hiển thị của vai trò.
 */
function getRoleDisplayName(role) {
    const roleNames = {
        admin: 'Quản trị viên',
        librarian: 'Thủ thư',
        staff: 'Nhân viên'
    };
    return roleNames[role] || 'Người dùng';
}

/**
 * @function updateLastLoginDisplay
 * @description Cập nhật hiển thị thời gian đăng nhập cuối cùng trên giao diện.
 */
function updateLastLoginDisplay() {
    const lastLoginElements = document.querySelectorAll('.last-login');
    lastLoginElements.forEach(element => {
        if (element && currentUser?.loginTime) {
            element.textContent = `Đăng nhập lúc: ${formatDateTime(currentUser.loginTime)}`;
        }
    });
}

// --- Hệ thống thông báo (Notification System) ---

/**
 * @function initializeNotifications
 * @description Khởi tạo container thông báo và tải các thông báo đã lưu.
 */
function initializeNotifications() {
    // Tạo container thông báo nếu chưa tồn tại
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

    // Tải các thông báo đã lưu
    loadNotifications();

    // Kiểm tra các thông báo hệ thống (ví dụ: sách quá hạn, sách sắp hết)
    // Đảm bảo window.dataManager đã được tải trước khi gọi hàm này.
    // Hàm này sẽ được gọi lại sau khi data.js được tải đầy đủ.
    setTimeout(() => {
        if (typeof window.dataManager !== 'undefined') {
            checkSystemNotifications();
        }
    }, 1000); // Đợi 1 giây để data.js có thể tải
}

/**
 * @function showNotification
 * @description Hiển thị một thông báo dạng toast trên màn hình.
 * @param {string} message - Nội dung thông báo.
 * @param {'info'|'success'|'error'|'warning'} [type='info'] - Loại thông báo (ảnh hưởng đến màu sắc và biểu tượng).
 * @param {number} [duration=5000] - Thời gian hiển thị thông báo (mili giây). Đặt 0 để hiển thị vĩnh viễn (cho đến khi đóng thủ công).
 * @param {boolean} [persistent=false] - True nếu thông báo nên được lưu và hiển thị lại khi tải lại trang.
 * @returns {string} - ID của thông báo được tạo.
 */
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

    // Thêm vào mảng thông báo
    const notificationData = {
        id: notificationId,
        message: message,
        type: type,
        timestamp: new Date().toISOString(), // Lưu dưới dạng ISO string
        persistent: persistent
    };
    notifications.push(notificationData);

    // Tự động xóa nếu không phải thông báo vĩnh viễn
    if (!persistent && duration > 0) {
        setTimeout(() => {
            removeNotification(notificationId);
        }, duration);
    }

    // Lưu thông báo
    saveNotifications();

    // Phát âm thanh thông báo
    playNotificationSound(type);

    return notificationId;
}

/**
 * @function removeNotification
 * @description Xóa một thông báo cụ thể khỏi màn hình và khỏi danh sách đã lưu.
 * @param {string} notificationId - ID của thông báo cần xóa.
 */
function removeNotification(notificationId) {
    const notification = document.getElementById(notificationId);
    if (notification) {
        notification.classList.add('fade-out'); // Thêm hiệu ứng mờ dần
        setTimeout(() => {
            notification.remove();
        }, 300);
    }

    // Xóa khỏi mảng thông báo
    notifications = notifications.filter(n => n.id !== notificationId);
    saveNotifications();
}

/**
 * @function clearAllNotifications
 * @description Xóa tất cả các thông báo khỏi màn hình và khỏi danh sách đã lưu.
 */
function clearAllNotifications() {
    const container = document.getElementById('notificationContainer');
    if (container) {
        container.innerHTML = '';
    }
    notifications = [];
    saveNotifications();
}

/**
 * @function saveNotifications
 * @description Lưu các thông báo vĩnh viễn vào localStorage.
 */
function saveNotifications() {
    try {
        const persistentNotifications = notifications.filter(n => n.persistent);
        localStorage.setItem('notifications', JSON.stringify(persistentNotifications));
    } catch (error) {
        console.error('Lỗi khi lưu thông báo:', error);
    }
}

/**
 * @function loadNotifications
 * @description Tải các thông báo đã lưu từ localStorage và hiển thị lại.
 */
function loadNotifications() {
    try {
        const saved = localStorage.getItem('notifications');
        if (saved) {
            const savedNotifications = JSON.parse(saved);
            savedNotifications.forEach(notification => {
                // Chỉ hiển thị thông báo từ hôm nay
                const notificationDate = new Date(notification.timestamp);
                const today = new Date();
                if (notificationDate.toDateString() === today.toDateString()) {
                    showNotification(notification.message, notification.type, 0, true); // Hiển thị lại là vĩnh viễn
                }
            });
        }
    } catch (error) {
        console.error('Lỗi khi tải thông báo:', error);
    }
}

/**
 * @function checkSystemNotifications
 * @description Kiểm tra và hiển thị các thông báo hệ thống quan trọng (ví dụ: sách quá hạn, sách sắp hết).
 * Hàm này phụ thuộc vào `window.dataManager` để truy cập dữ liệu.
 */
function checkSystemNotifications() {
    if (typeof window.dataManager === 'undefined') {
        console.warn('dataManager chưa sẵn sàng, không thể kiểm tra thông báo hệ thống.');
        return;
    }

    // Kiểm tra sách quá hạn
    const overdueBooks = window.dataManager.getOverdueBooks();
    if (overdueBooks.length > 0) {
        showNotification(
            `Có ${overdueBooks.length} sách quá hạn cần xử lý!`,
            'warning',
            0, // Hiển thị vĩnh viễn
            true
        );
    }

    // Kiểm tra sách sắp hết hàng (ngưỡng 5 bản)
    const lowStockBooks = window.dataManager.getLowStockBooks(5);
    if (lowStockBooks.length > 0) {
        showNotification(
            `Có ${lowStockBooks.length} loại sách sắp hết hàng!`,
            'warning',
            0, // Hiển thị vĩnh viễn
            true
        );
    }

    // Kiểm tra các yêu cầu gia hạn đang chờ xử lý (nếu có tính năng này)
    // Giả định dataManager có hàm getPendingRenewals()
    // if (typeof window.dataManager.getPendingRenewals === 'function') {
    //     const pendingRenewals = window.dataManager.getPendingRenewals();
    //     if (pendingRenewals.length > 0) {
    //         showNotification(
    //             `Có ${pendingRenewals.length} yêu cầu gia hạn chờ xử lý!`,
    //             'info',
    //             0,
    //             true
    //         );
    //     }
    // }
}

/**
 * @function playNotificationSound
 * @description Phát âm thanh thông báo dựa trên loại thông báo.
 * @param {'info'|'success'|'error'|'warning'} type - Loại thông báo.
 */
function playNotificationSound(type) {
    // Kiểm tra cài đặt hệ thống để xem có bật âm thanh không
    if (!systemSettings.enableSounds) return;

    try {
        const audio = new Audio();
        // Sử dụng dữ liệu base64 cho âm thanh để không phụ thuộc vào tệp bên ngoài
        switch (type) {
            case 'success':
                audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT'; // Âm thanh thành công (ngắn, vui tai)
                break;
            case 'error':
                audio.src = 'data:audio/wav;base64,UklGRiQCAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YUICAAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCgAAAA=='; // Âm thanh lỗi (ngắn, chói tai)
                break;
            default:
                audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT'; // Âm thanh mặc định (thông tin)
        }
        audio.volume = 0.3; // Đặt âm lượng nhỏ hơn
        audio.play().catch(() => {
            // Bỏ qua lỗi phát âm thanh (thường do trình duyệt yêu cầu tương tác của người dùng trước khi phát âm thanh)
        });
    } catch (error) {
        console.error('Lỗi khi phát âm thanh thông báo:', error);
    }
}

// --- Chức năng lớp phủ tải (Loading Overlay Functions) ---

/**
 * @function showLoading
 * @description Hiển thị lớp phủ tải với thông báo tùy chỉnh.
 * @param {string} [message='Đang tải...'] - Thông báo hiển thị trên lớp phủ.
 */
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
    document.body.style.overflow = 'hidden'; // Ngăn cuộn trang khi lớp phủ hiển thị
}

/**
 * @function hideLoading
 * @description Ẩn lớp phủ tải.
 */
function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.add('d-none');
        document.body.style.overflow = ''; // Cho phép cuộn trang trở lại
    }
}

/**
 * @function updateLoadingMessage
 * @description Cập nhật thông báo trên lớp phủ tải.
 * @param {string} message - Thông báo mới.
 */
function updateLoadingMessage(message) {
    const messageElement = document.querySelector('.loading-message');
    if (messageElement) {
        messageElement.textContent = message;
    }
}

// --- Khởi tạo thành phần Bootstrap (Bootstrap Components Initialization) ---

/**
 * @function initializeBootstrapComponents
 * @description Khởi tạo các thành phần JavaScript của Bootstrap như tooltips, popovers
 * và thiết lập hành vi cho modals.
 */
function initializeBootstrapComponents() {
    // Khởi tạo tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Khởi tạo popovers
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });

    // Khởi tạo modals với các tùy chọn tùy chỉnh
    const modalElements = document.querySelectorAll('.modal');
    modalElements.forEach(modalElement => {
        modalElement.addEventListener('hidden.bs.modal', function () {
            // Xóa dữ liệu form khi modal đóng nếu form có thuộc tính `data-clear-on-close`
            const forms = this.querySelectorAll('form');
            forms.forEach(form => {
                if (form.hasAttribute('data-clear-on-close')) {
                    form.reset();
                }
            });
        });
    });
}

// --- Phím tắt bàn phím (Keyboard Shortcuts) ---

/**
 * @function initializeKeyboardShortcuts
 * @description Thiết lập các phím tắt toàn cục cho ứng dụng.
 */
function initializeKeyboardShortcuts() {
    document.addEventListener('keydown', function(event) {
        // Ctrl/Cmd + shortcuts
        if (event.ctrlKey || event.metaKey) {
            switch(event.key) {
                case 's': // Ctrl + S: Lưu form hiện tại
                    event.preventDefault();
                    saveCurrentForm();
                    break;
                case 'f': // Ctrl + F: Tập trung vào ô tìm kiếm
                    event.preventDefault();
                    focusSearchInput();
                    break;
                case 'n': // Ctrl + N: Mở modal thêm mới
                    event.preventDefault();
                    openNewItemModal();
                    break;
                case 'p': // Ctrl + P: In trang
                    event.preventDefault();
                    printCurrentPage();
                    break;
            }
        }

        // Phím chức năng
        switch(event.key) {
            case 'F1': // F1: Hiển thị trợ giúp
                event.preventDefault();
                showHelpModal();
                break;
            case 'F5': // F5: Làm mới dữ liệu (tránh làm mới toàn bộ trang nếu có Ctrl)
                if (!event.ctrlKey) {
                    event.preventDefault();
                    refreshCurrentData();
                }
                break;
            case 'Escape': // Esc: Đóng modal trên cùng
                closeTopModal();
                break;
        }
    });
}

/**
 * @function saveCurrentForm
 * @description Tìm và kích hoạt nút lưu của form đang hoạt động.
 */
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

/**
 * @function focusSearchInput
 * @description Tập trung vào ô tìm kiếm đầu tiên trên trang.
 */
function focusSearchInput() {
    const searchInputs = document.querySelectorAll('input[type="search"], input[placeholder*="tìm"], input[placeholder*="Tìm"]');
    if (searchInputs.length > 0) {
        searchInputs[0].focus();
        searchInputs[0].select();
    }
}

/**
 * @function openNewItemModal
 * @description Kích hoạt nút mở modal thêm mới đầu tiên trên trang.
 */
function openNewItemModal() {
    const newButtons = document.querySelectorAll('[data-bs-target*="Modal"]:contains("Thêm"), .btn:contains("Thêm mới")');
    if (newButtons.length > 0) {
        newButtons[0].click();
    }
}

/**
 * @function printCurrentPage
 * @description Kích hoạt chức năng in của trình duyệt cho trang hiện tại.
 */
function printCurrentPage() {
    window.print();
}

/**
 * @function showHelpModal
 * @description Hiển thị modal trợ giúp (tạo nếu chưa có).
 */
function showHelpModal() {
    let helpModal = document.getElementById('helpModal');
    if (!helpModal) {
        helpModal = createHelpModal();
        document.body.appendChild(helpModal);
    }

    const modal = new bootstrap.Modal(helpModal);
    modal.show();
}

/**
 * @function createHelpModal
 * @description Tạo cấu trúc HTML cho modal trợ giúp.
 * @returns {HTMLElement} - Phần tử div chứa modal trợ giúp.
 */
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
                                    <p>Để thêm độc giả mới, nhấn nút "Đăng ký độc giả mới" và điền đầy đủ thông tin...</p>
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
                                    <p>Để thêm sách mới, nhấn nút "Thêm sách mới" và điền thông tin sách...</p>
                                </div>
                            </div>
                        </div>
                        <div class="accordion-item">
                            <h2 class="accordion-header">
                                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#help3">
                                    Mượn/Trả sách
                                </button>
                            </h2>
                            <div id="help3" class="accordion-collapse collapse" data-bs-parent="#helpAccordion">
                                <div class="accordion-body">
                                    <p>Sử dụng các tab "Mượn sách", "Trả sách", "Gia hạn" để thực hiện các giao dịch tương ứng.</p>
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

/**
 * @function refreshCurrentData
 * @description Làm mới dữ liệu trên trang hiện tại dựa trên loại trang.
 * Hàm này phụ thuộc vào các hàm `loadXxx()` được định nghĩa trong các tệp HTML cụ thể.
 */
function refreshCurrentData() {
    const currentPage = getCurrentPageType();

    switch(currentPage) {
        case 'readers':
            // Kiểm tra xem hàm loadReaders có tồn tại không trước khi gọi
            if (typeof window.loadReaders === 'function') {
                window.loadReaders();
                showNotification('Đã làm mới dữ liệu độc giả', 'success', 2000);
            } else {
                 showNotification('Không tìm thấy chức năng làm mới dữ liệu độc giả.', 'warning');
            }
            break;
        case 'books':
            // Kiểm tra xem hàm loadBooks có tồn tại không trước khi gọi
            if (typeof window.loadBooks === 'function') {
                window.loadBooks();
                showNotification('Đã làm mới dữ liệu sách', 'success', 2000);
            } else {
                showNotification('Không tìm thấy chức năng làm mới dữ liệu sách.', 'warning');
            }
            break;
        case 'borrow-return':
            // Kiểm tra xem hàm loadStatistics có tồn tại không trước khi gọi
            if (typeof window.loadStatistics === 'function') { // Sử dụng loadStatistics của borrow-return
                window.loadStatistics();
                showNotification('Đã làm mới dữ liệu mượn/trả', 'success', 2000);
            } else {
                showNotification('Không tìm thấy chức năng làm mới dữ liệu mượn/trả.', 'warning');
            }
            break;
        case 'reports':
            // Kiểm tra xem hàm loadReportData có tồn tại không trước khi gọi
            if (typeof window.loadReportData === 'function') {
                window.loadReportData();
                showNotification('Đã làm mới báo cáo', 'success', 2000);
            } else {
                showNotification('Không tìm thấy chức năng làm mới báo cáo.', 'warning');
            }
            break;
        case 'dashboard':
            if (typeof window.loadDashboardData === 'function') {
                window.loadDashboardData();
                showNotification('Đã làm mới bảng điều khiển', 'success', 2000);
            } else {
                showNotification('Không tìm thấy chức năng làm mới bảng điều khiển.', 'warning');
            }
            break;
        default:
            showNotification('Đã làm mới trang', 'success', 2000);
            location.reload(); // Tải lại toàn bộ trang nếu không tìm thấy chức năng cụ thể
    }
}

/**
 * @function getCurrentPageType
 * @description Xác định loại trang hiện tại dựa trên URL.
 * @returns {string} - Loại trang (readers, books, borrow-return, reports, dashboard).
 */
function getCurrentPageType() {
    const path = window.location.pathname;
    if (path.includes('readers.html')) return 'readers';
    if (path.includes('books.html')) return 'books';
    if (path.includes('borrow-return.html')) return 'borrow-return';
    if (path.includes('reports.html')) return 'reports';
    if (path.includes('dashboard.html')) return 'dashboard';
    return 'index'; // Trang đăng nhập hoặc trang chủ
}

/**
 * @function closeTopModal
 * @description Đóng modal đang hiển thị trên cùng.
 */
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

// --- Chức năng tự động lưu (Auto-save Functionality) ---

/**
 * @function initializeAutoSave
 * @description Thiết lập chức năng tự động lưu cho các form có thuộc tính `data-auto-save`.
 */
function initializeAutoSave() {
    const autoSaveForms = document.querySelectorAll('[data-auto-save]');

    autoSaveForms.forEach(form => {
        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('input', debounce(() => {
                autoSaveForm(form);
            }, 2000)); // Tự động lưu sau 2 giây không có hoạt động
        });
    });
}

/**
 * @function autoSaveForm
 * @description Lưu dữ liệu của một form vào localStorage.
 * @param {HTMLFormElement} form - Form cần lưu.
 */
function autoSaveForm(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    const formId = form.id || 'unnamed_form'; // Sử dụng ID của form hoặc tên mặc định

    try {
        localStorage.setItem(`autosave_${formId}`, JSON.stringify({
            data: data,
            timestamp: new Date().toISOString()
        }));

        // Hiển thị chỉ báo lưu thành công
        showAutoSaveIndicator(form);
    } catch (error) {
        console.error('Tự động lưu thất bại:', error);
    }
}

/**
 * @function loadAutoSavedData
 * @description Tải dữ liệu đã tự động lưu cho một form cụ thể.
 * @param {string} formId - ID của form.
 * @returns {Object|null} - Dữ liệu đã lưu hoặc null nếu không có.
 */
function loadAutoSavedData(formId) {
    try {
        const saved = localStorage.getItem(`autosave_${formId}`);
        if (saved) {
            const { data, timestamp } = JSON.parse(saved);
            const saveTime = new Date(timestamp);
            const now = new Date();

            // Chỉ khôi phục nếu được lưu trong vòng 1 giờ qua
            if (now - saveTime < 60 * 60 * 1000) {
                return data;
            } else {
                // Xóa dữ liệu tự động lưu cũ
                localStorage.removeItem(`autosave_${formId}`);
            }
        }
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu tự động lưu:', error);
    }
    return null;
}

/**
 * @function showAutoSaveIndicator
 * @description Hiển thị một chỉ báo nhỏ cho biết dữ liệu đã được tự động lưu.
 * @param {HTMLElement} form - Phần tử form.
 */
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
        form.style.position = 'relative'; // Đảm bảo form có position để indicator có thể đặt vị trí tương đối
        form.appendChild(indicator);
    }

    indicator.style.opacity = '1';
    setTimeout(() => {
        indicator.style.opacity = '0';
    }, 2000);
}

// --- Quản lý chủ đề (Theme Management) ---

/**
 * @function initializeTheme
 * @description Khởi tạo chủ đề của ứng dụng (sáng/tối) từ localStorage.
 */
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);

    // Thêm nút chuyển đổi chủ đề nếu có
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
}

/**
 * @function applyTheme
 * @description Áp dụng chủ đề cho tài liệu HTML.
 * @param {'light'|'dark'} theme - Chủ đề cần áp dụng.
 */
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);

    // Cập nhật biểu tượng nút chuyển đổi chủ đề
    const themeIcon = document.querySelector('#themeToggle i');
    if (themeIcon) {
        themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

/**
 * @function toggleTheme
 * @description Chuyển đổi giữa chủ đề sáng và tối.
 */
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);
    showNotification(`Đã chuyển sang chế độ ${newTheme === 'dark' ? 'tối' : 'sáng'}`, 'info', 2000);
}

// --- Phát hiện trạng thái Offline (Offline Detection) ---

/**
 * @function initializeOfflineDetection
 * @description Thiết lập trình nghe sự kiện để phát hiện trạng thái online/offline
 * và đồng bộ dữ liệu khi kết nối lại.
 */
function initializeOfflineDetection() {
    window.addEventListener('online', () => {
        showNotification('Đã kết nối lại internet', 'success', 3000);
        syncOfflineData();
    });

    window.addEventListener('offline', () => {
        showNotification('Mất kết nối internet. Ứng dụng sẽ hoạt động ở chế độ offline.', 'warning', 5000);
    });
}

/**
 * @function syncOfflineData
 * @description Đồng bộ bất kỳ dữ liệu offline nào khi kết nối internet được khôi phục.
 * (Chức năng này cần được triển khai để gửi dữ liệu offline lên máy chủ trong ứng dụng thực tế).
 */
function syncOfflineData() {
    const offlineData = getOfflineData();
    if (offlineData.length > 0) {
        showLoading('Đang đồng bộ dữ liệu...');

        // Mô phỏng quá trình đồng bộ
        setTimeout(() => {
            clearOfflineData();
            hideLoading();
            showNotification(`Đã đồng bộ ${offlineData.length} thay đổi`, 'success');
        }, 2000);
    }
}

/**
 * @function getOfflineData
 * @description Lấy dữ liệu offline đã lưu từ localStorage.
 * @returns {Array} - Mảng các thay đổi offline.
 */
function getOfflineData() {
    try {
        return JSON.parse(localStorage.getItem('offlineData') || '[]');
    } catch {
        return [];
    }
}

/**
 * @function clearOfflineData
 * @description Xóa tất cả dữ liệu offline đã lưu.
 */
function clearOfflineData() {
    localStorage.removeItem('offlineData');
}

// --- Giám sát hiệu suất (Performance Monitoring) ---

/**
 * @function initializePerformanceMonitoring
 * @description Thiết lập giám sát hiệu suất cơ bản cho ứng dụng (thời gian tải trang, sử dụng bộ nhớ).
 */
function initializePerformanceMonitoring() {
    // Giám sát thời gian tải trang
    window.addEventListener('load', () => {
        const loadTime = performance.now();
        if (loadTime > 3000) { // Cảnh báo nếu tải trang mất hơn 3 giây
            console.warn('Phát hiện tải trang chậm:', loadTime.toFixed(2) + 'ms');
        }
    });

    // Giám sát sử dụng bộ nhớ (nếu trình duyệt hỗ trợ)
    if ('memory' in performance) {
        setInterval(() => {
            const memory = performance.memory;
            if (memory.usedJSHeapSize > 50 * 1024 * 1024) { // Cảnh báo nếu sử dụng hơn 50MB bộ nhớ JS
                console.warn('Phát hiện sử dụng bộ nhớ cao:', (memory.usedJSHeapSize / 1024 / 1024).toFixed(2) + 'MB');
            }
        }, 30000); // Kiểm tra mỗi 30 giây
    }
}

// --- Cài đặt hệ thống (System Settings) ---

/**
 * @function loadSystemSettings
 * @description Tải cài đặt hệ thống từ localStorage hoặc sử dụng cài đặt mặc định.
 */
function loadSystemSettings() {
    try {
        const saved = localStorage.getItem('systemSettings');
        systemSettings = saved ? JSON.parse(saved) : getDefaultSettings();
    } catch (error) {
        console.error('Lỗi khi tải cài đặt hệ thống:', error);
        systemSettings = getDefaultSettings(); // Sử dụng cài đặt mặc định nếu có lỗi
    }
}

/**
 * @function getDefaultSettings
 * @description Trả về các cài đặt hệ thống mặc định.
 * @returns {Object} - Đối tượng chứa các cài đặt mặc định.
 */
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
        autoLogout: 30, // phút
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

/**
 * @function saveSystemSettings
 * @description Lưu cài đặt hệ thống hiện tại vào localStorage.
 */
function saveSystemSettings() {
    try {
        localStorage.setItem('systemSettings', JSON.stringify(systemSettings));
        showNotification('Đã lưu cài đặt hệ thống', 'success', 2000);
    } catch (error) {
        console.error('Lỗi khi lưu cài đặt hệ thống:', error);
        showNotification('Lỗi khi lưu cài đặt', 'error');
    }
}

/**
 * @function updateSetting
 * @description Cập nhật một cài đặt hệ thống cụ thể và lưu lại.
 * @param {string} key - Khóa của cài đặt cần cập nhật.
 * @param {*} value - Giá trị mới của cài đặt.
 */
function updateSetting(key, value) {
    systemSettings[key] = value;
    saveSystemSettings();

    // Áp dụng cài đặt ngay lập tức nếu cần
    switch(key) {
        case 'theme':
            applyTheme(value);
            break;
        case 'enableSounds':
            // Cập nhật tùy chọn âm thanh
            break;
        case 'autoLogout':
            resetAutoLogoutTimer();
            break;
    }
}

// --- Ghi nhật ký hoạt động (Activity Logging) ---

/**
 * @function logActivity
 * @description Ghi lại một hoạt động của người dùng hoặc hệ thống.
 * @param {string} action - Hành động (ví dụ: 'login', 'borrow_book', 'delete_reader').
 * @param {string} description - Mô tả ngắn gọn về hành động.
 * @param {Object} [data=null] - Dữ liệu chi tiết liên quan đến hành động.
 */
function logActivity(action, description, data = null) {
    const activity = {
        id: generateId(),
        timestamp: new Date().toISOString(),
        user: currentUser?.username || 'anonymous',
        action: action,
        description: description,
        data: data,
        ip: 'localhost', // Trong ứng dụng thực tế, lấy từ máy chủ
        userAgent: navigator.userAgent
    };

    // Lưu vào local storage (trong ứng dụng thực tế, gửi đến máy chủ)
    let activities = getActivities(Infinity); // Lấy tất cả hoạt động hiện có
    activities.unshift(activity); // Thêm hoạt động mới vào đầu

    // Chỉ giữ lại 1000 hoạt động gần nhất để tránh đầy localStorage
    if (activities.length > 1000) {
        activities = activities.slice(0, 1000);
    }

    try {
        localStorage.setItem('activities', JSON.stringify(activities));
    } catch (error) {
        console.error('Lỗi khi lưu hoạt động:', error);
    }
}

/**
 * @function getActivities
 * @description Lấy danh sách các hoạt động đã ghi.
 * @param {number} [limit=100] - Số lượng hoạt động tối đa cần lấy.
 * @returns {Array<Object>} - Mảng các đối tượng hoạt động.
 */
function getActivities(limit = 100) {
    try {
        const activities = JSON.parse(localStorage.getItem('activities') || '[]');
        return activities.slice(0, limit); // Trả về các hoạt động gần nhất theo giới hạn
    } catch (error) {
        console.error('Lỗi khi tải hoạt động:', error);
        return [];
    }
}

/**
 * @function clearActivities
 * @description Xóa toàn bộ lịch sử hoạt động.
 */
function clearActivities() {
    localStorage.removeItem('activities');
    showNotification('Đã xóa lịch sử hoạt động', 'success');
}

// --- Chức năng tự động đăng xuất (Auto Logout Functionality) ---

let autoLogoutTimer = null;
let autoLogoutWarningTimer = null;

/**
 * @function initializeAutoLogout
 * @description Khởi tạo tính năng tự động đăng xuất dựa trên cài đặt hệ thống.
 */
function initializeAutoLogout() {
    if (!systemSettings.autoLogout || systemSettings.autoLogout <= 0) {
        return; // Không kích hoạt nếu cài đặt không hợp lệ
    }

    resetAutoLogoutTimer(); // Đặt lại bộ hẹn giờ khi khởi tạo

    // Đặt lại bộ hẹn giờ khi có hoạt động của người dùng
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
        document.addEventListener(event, resetAutoLogoutTimer, true);
    });
}

/**
 * @function resetAutoLogoutTimer
 * @description Đặt lại bộ hẹn giờ tự động đăng xuất và cảnh báo.
 */
function resetAutoLogoutTimer() {
    if (!systemSettings.autoLogout || systemSettings.autoLogout <= 0) {
        return;
    }

    // Xóa các bộ hẹn giờ hiện có
    if (autoLogoutTimer) {
        clearTimeout(autoLogoutTimer);
    }
    if (autoLogoutWarningTimer) {
        clearTimeout(autoLogoutWarningTimer);
    }

    const timeoutMs = systemSettings.autoLogout * 60 * 1000; // Chuyển đổi sang mili giây
    const warningMs = timeoutMs - (5 * 60 * 1000); // Cảnh báo 5 phút trước khi hết hạn

    // Đặt bộ hẹn giờ cảnh báo
    if (warningMs > 0) {
        autoLogoutWarningTimer = setTimeout(() => {
            showAutoLogoutWarning();
        }, warningMs);
    }

    // Đặt bộ hẹn giờ đăng xuất
    autoLogoutTimer = setTimeout(() => {
        logout('Phiên đăng nhập đã hết hạn do không hoạt động');
    }, timeoutMs);
}

/**
 * @function showAutoLogoutWarning
 * @description Hiển thị modal cảnh báo tự động đăng xuất.
 */
function showAutoLogoutWarning() {
    const warningModal = createAutoLogoutWarningModal();
    document.body.appendChild(warningModal);

    const modal = new bootstrap.Modal(warningModal);
    modal.show();

    // Tự động đóng cảnh báo sau 5 phút nếu người dùng không tương tác
    setTimeout(() => {
        modal.hide();
        // Xóa modal khỏi DOM sau khi đóng
        if (warningModal.parentNode) {
            warningModal.parentNode.removeChild(warningModal);
        }
    }, 5 * 60 * 1000);
}

/**
 * @function createAutoLogoutWarningModal
 * @description Tạo cấu trúc HTML cho modal cảnh báo tự động đăng xuất.
 * @returns {HTMLElement} - Phần tử div chứa modal cảnh báo.
 */
function createAutoLogoutWarningModal() {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.setAttribute('tabindex', '-1');
    modal.setAttribute('aria-hidden', 'true');
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

/**
 * @function continueSession
 * @description Tiếp tục phiên đăng nhập khi người dùng tương tác với modal cảnh báo.
 * @param {HTMLElement} button - Nút "Tiếp tục" được nhấn.
 */
function continueSession(button) {
    const modalElement = button.closest('.modal');
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    modalInstance.hide();
    // Xóa modal khỏi DOM sau khi đóng
    if (modalElement.parentNode) {
        modalElement.parentNode.removeChild(modalElement);
    }

    resetAutoLogoutTimer(); // Đặt lại bộ hẹn giờ
    showNotification('Đã gia hạn phiên đăng nhập', 'success', 2000);
}

// --- Tiện ích xác thực dữ liệu (Data Validation Utilities) ---

/**
 * @function validateEmail
 * @description Kiểm tra định dạng email.
 * @param {string} email - Chuỗi email.
 * @returns {boolean} - True nếu email hợp lệ, ngược lại là False.
 */
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * @function validatePhone
 * @description Kiểm tra định dạng số điện thoại (chấp nhận các định dạng phổ biến).
 * @param {string} phone - Chuỗi số điện thoại.
 * @returns {boolean} - True nếu số điện thoại hợp lệ, ngược lại là False.
 */
function validatePhone(phone) {
    // Loại bỏ khoảng trắng và dấu gạch ngang
    phone = phone.replace(/[\s-]/g, '');
    // Định dạng số điện thoại Việt Nam (ví dụ: 09x, 08x, 07x, 03x, 05x, 02x)
    const phoneRegex = /^(0|\+84)(3|5|7|8|9)\d{8}$/;
    return phoneRegex.test(phone);
}

/**
 * @function validateStudentId
 * @description Kiểm tra định dạng mã sinh viên (ví dụ: 8-12 chữ số).
 * @param {string} studentId - Chuỗi mã sinh viên.
 * @returns {boolean} - True nếu mã sinh viên hợp lệ, ngược lại là False.
 */
function validateStudentId(studentId) {
    const studentIdRegex = /^[0-9]{8,12}$/;
    return studentIdRegex.test(studentId);
}

/**
 * @function validateISBN
 * @description Kiểm tra định dạng ISBN-10 hoặc ISBN-13.
 * @param {string} isbn - Chuỗi ISBN.
 * @returns {boolean} - True nếu ISBN hợp lệ, ngược lại là False.
 */
function validateISBN(isbn) {
    // Loại bỏ dấu gạch ngang và khoảng trắng
    isbn = isbn.replace(/[-\s]/g, '');

    // Kiểm tra ISBN-10 hoặc ISBN-13
    if (isbn.length === 10) {
        return validateISBN10(isbn);
    } else if (isbn.length === 13) {
        return validateISBN13(isbn);
    }
    return false;
}

/**
 * @function validateISBN10
 * @description Kiểm tra định dạng ISBN-10.
 * @param {string} isbn - Chuỗi ISBN-10.
 * @returns {boolean} - True nếu ISBN-10 hợp lệ, ngược lại là False.
 */
function validateISBN10(isbn) {
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        if (!/\d/.test(isbn[i])) return false; // Ký tự phải là số
        sum += parseInt(isbn[i]) * (10 - i);
    }

    const checkDigit = isbn[9].toLowerCase();
    sum += (checkDigit === 'x') ? 10 : parseInt(checkDigit);

    return sum % 11 === 0;
}

/**
 * @function validateISBN13
 * @description Kiểm tra định dạng ISBN-13.
 * @param {string} isbn - Chuỗi ISBN-13.
 * @returns {boolean} - True nếu ISBN-13 hợp lệ, ngược lại là False.
 */
function validateISBN13(isbn) {
    let sum = 0;
    for (let i = 0; i < 12; i++) {
        if (!/\d/.test(isbn[i])) return false; // Ký tự phải là số
        sum += parseInt(isbn[i]) * (i % 2 === 0 ? 1 : 3);
    }

    const checkDigit = parseInt(isbn[12]);
    return (10 - (sum % 10)) % 10 === checkDigit;
}

/**
 * @function validateRequired
 * @description Kiểm tra xem một giá trị có rỗng hay không.
 * @param {*} value - Giá trị cần kiểm tra.
 * @returns {boolean} - True nếu không rỗng, ngược lại là False.
 */
function validateRequired(value) {
    return value !== null && value !== undefined && value.toString().trim() !== '';
}

/**
 * @function validateMinLength
 * @description Kiểm tra độ dài tối thiểu của một chuỗi.
 * @param {string} value - Chuỗi cần kiểm tra.
 * @param {number} minLength - Độ dài tối thiểu.
 * @returns {boolean} - True nếu đạt độ dài tối thiểu, ngược lại là False.
 */
function validateMinLength(value, minLength) {
    return value && value.toString().length >= minLength;
}

/**
 * @function validateMaxLength
 * @description Kiểm tra độ dài tối đa của một chuỗi.
 * @param {string} value - Chuỗi cần kiểm tra.
 * @param {number} maxLength - Độ dài tối đa.
 * @returns {boolean} - True nếu không vượt quá độ dài tối đa, ngược lại là False.
 */
function validateMaxLength(value, maxLength) {
    return !value || value.toString().length <= maxLength;
}

/**
 * @function validateNumeric
 * @description Kiểm tra xem một giá trị có phải là số hay không.
 * @param {*} value - Giá trị cần kiểm tra.
 * @returns {boolean} - True nếu là số, ngược lại là False.
 */
function validateNumeric(value) {
    return !isNaN(value) && !isNaN(parseFloat(value));
}

/**
 * @function validatePositiveNumber
 * @description Kiểm tra xem một giá trị có phải là số dương hay không.
 * @param {*} value - Giá trị cần kiểm tra.
 * @returns {boolean} - True nếu là số dương, ngược lại là False.
 */
function validatePositiveNumber(value) {
    return validateNumeric(value) && parseFloat(value) > 0;
}

/**
 * @function validateDate
 * @description Kiểm tra xem một chuỗi có phải là định dạng ngày hợp lệ hay không.
 * @param {string} dateString - Chuỗi ngày.
 * @returns {boolean} - True nếu ngày hợp lệ, ngược lại là False.
 */
function validateDate(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
}

/**
 * @function validateFutureDate
 * @description Kiểm tra xem một ngày có phải là ngày trong tương lai hay không.
 * @param {string} dateString - Chuỗi ngày.
 * @returns {boolean} - True nếu là ngày trong tương lai, ngược lại là False.
 */
function validateFutureDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Bỏ qua phần thời gian
    return validateDate(dateString) && date >= today;
}

/**
 * @function validatePastDate
 * @description Kiểm tra xem một ngày có phải là ngày trong quá khứ hay không.
 * @param {string} dateString - Chuỗi ngày.
 * @returns {boolean} - True nếu là ngày trong quá khứ, ngược lại là False.
 */
function validatePastDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Bao gồm cả ngày hôm nay
    return validateDate(dateString) && date <= today;
}

// --- Xác thực biểu mẫu (Form Validation) ---

/**
 * @function validateForm
 * @description Thực hiện xác thực cho một form dựa trên các thuộc tính HTML5 và quy tắc tùy chỉnh.
 * @param {HTMLFormElement} form - Form cần xác thực.
 * @returns {{isValid: boolean, errors: string[]}} - Đối tượng chứa trạng thái hợp lệ và danh sách lỗi.
 */
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

    // Xác thực các loại trường cụ thể
    const emailFields = form.querySelectorAll('input[type="email"]');
    emailFields.forEach(field => {
        if (field.value && !validateEmail(field.value)) {
            errors.push(`${getFieldLabel(field)} không đúng định dạng email`);
            markFieldError(field);
        }
    });

    const phoneFields = form.querySelectorAll('input[data-type="phone"]');
    phoneFields.forEach(field => {
        if (field.value && !validatePhone(field.value)) {
            errors.push(`${getFieldLabel(field)} không đúng định dạng số điện thoại`);
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

/**
 * @function getFieldLabel
 * @description Lấy nhãn (label) của một trường form.
 * @param {HTMLElement} field - Trường form.
 * @returns {string} - Nhãn của trường.
 */
function getFieldLabel(field) {
    const label = field.closest('.mb-3')?.querySelector('label'); // Tìm label trong cùng một nhóm form
    return label ? label.textContent.replace('*', '').trim() : field.name || field.placeholder || 'Trường';
}

/**
 * @function markFieldError
 * @description Đánh dấu một trường form là có lỗi.
 * @param {HTMLElement} field - Trường form.
 */
function markFieldError(field) {
    field.classList.add('is-invalid');
    // Thêm feedback lỗi nếu chưa có
    if (!field.nextElementSibling || !field.nextElementSibling.classList.contains('invalid-feedback')) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'invalid-feedback';
        errorDiv.textContent = 'Giá trị không hợp lệ.'; // Có thể tùy chỉnh thông báo lỗi cụ thể hơn
        field.parentNode.insertBefore(errorDiv, field.nextSibling);
    }
}

/**
 * @function clearFieldError
 * @description Xóa trạng thái lỗi của một trường form.
 * @param {HTMLElement} field - Trường form.
 */
function clearFieldError(field) {
    field.classList.remove('is-invalid');
    const errorMessage = field.parentNode.querySelector('.invalid-feedback');
    if (errorMessage) {
        errorMessage.remove();
    }
}

/**
 * @function showFormErrors
 * @description Hiển thị danh sách các lỗi xác thực form bằng thông báo.
 * @param {string[]} errors - Mảng các thông báo lỗi.
 */
function showFormErrors(errors) {
    if (errors.length > 0) {
        const errorHtml = errors.map(error => `<li>${error}</li>`).join('');
        showNotification(`
            <strong>Vui lòng kiểm tra lại:</strong>
            <ul class="mb-0 mt-2">${errorHtml}</ul>
        `, 'error', 8000);
    }
}

// --- Hàm tiện ích chung (General Utility Functions) ---

/**
 * @function generateId
 * @description Tạo một ID duy nhất dựa trên thời gian và số ngẫu nhiên.
 * @returns {string} - ID duy nhất.
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * @function formatDate
 * @description Định dạng một đối tượng Date hoặc chuỗi ngày thành chuỗi theo định dạng mong muốn.
 * @param {Date|string} date - Đối tượng Date hoặc chuỗi ngày.
 * @param {string} [format=systemSettings.dateFormat] - Định dạng đầu ra (ví dụ: 'dd/mm/yyyy', 'yyyy-mm-dd').
 * @returns {string} - Chuỗi ngày đã định dạng.
 */
function formatDate(date, format = null) {
    if (!date) return '';

    const d = new Date(date);
    if (isNaN(d.getTime())) return ''; // Kiểm tra ngày không hợp lệ

    const formatStr = format || systemSettings.dateFormat || 'dd/mm/yyyy';

    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();

    return formatStr
        .replace('dd', day)
        .replace('mm', month)
        .replace('yyyy', year);
}

/**
 * @function formatDateTime
 * @description Định dạng một đối tượng Date hoặc chuỗi ngày thành chuỗi ngày và giờ.
 * @param {Date|string} date - Đối tượng Date hoặc chuỗi ngày.
 * @returns {string} - Chuỗi ngày và giờ đã định dạng.
 */
function formatDateTime(date) {
    if (!date) return '';

    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

    return formatDate(d) + ' ' + d.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * @function formatCurrency
 * @description Định dạng một số thành chuỗi tiền tệ theo định dạng Việt Nam Đồng.
 * @param {number} amount - Số tiền.
 * @param {string} [currency=systemSettings.currency] - Mã tiền tệ (ví dụ: 'VND').
 * @returns {string} - Chuỗi tiền tệ đã định dạng.
 */
function formatCurrency(amount, currency = null) {
    if (amount === null || amount === undefined || isNaN(amount)) return '';

    const curr = currency || systemSettings.currency || 'VND';

    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: curr,
        minimumFractionDigits: 0 // Không hiển thị số thập phân cho VND
    }).format(amount);
}

/**
 * @function formatNumber
 * @description Định dạng một số.
 * @param {number} number - Số cần định dạng.
 * @param {number} [decimals=0] - Số chữ số thập phân.
 * @returns {string} - Chuỗi số đã định dạng.
 */
function formatNumber(number, decimals = 0) {
    if (number === null || number === undefined || isNaN(number)) return '';

    return new Intl.NumberFormat('vi-VN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(number);
}

/**
 * @function debounce
 * @description Tạo một hàm debounce, giúp trì hoãn việc thực thi hàm cho đến khi
 * một khoảng thời gian nhất định trôi qua mà không có thêm lời gọi nào.
 * @param {Function} func - Hàm cần debounce.
 * @param {number} wait - Thời gian chờ (mili giây).
 * @returns {Function} - Hàm đã được debounce.
 */
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

/**
 * @function throttle
 * @description Tạo một hàm throttle, giúp giới hạn tần suất thực thi hàm.
 * @param {Function} func - Hàm cần throttle.
 * @param {number} limit - Khoảng thời gian tối thiểu giữa các lần thực thi (mili giây).
 * @returns {Function} - Hàm đã được throttle.
 */
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

/**
 * @function deepClone
 * @description Tạo một bản sao sâu của một đối tượng hoặc mảng.
 * @param {*} obj - Đối tượng cần sao chép.
 * @returns {*} - Bản sao sâu của đối tượng.
 */
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    if (typeof obj === 'object') {
        const clonedObj = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) { // Sử dụng hasOwnProperty an toàn hơn
                clonedObj[key] = deepClone(obj[key]);
            }
        }
        return clonedObj;
    }
}

/**
 * @function sanitizeHtml
 * @description Loại bỏ các thẻ HTML nguy hiểm khỏi một chuỗi để ngăn chặn tấn công XSS.
 * @param {string} str - Chuỗi HTML cần làm sạch.
 * @returns {string} - Chuỗi đã được làm sạch.
 */
function sanitizeHtml(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

/**
 * @function escapeRegExp
 * @description Thoát các ký tự đặc biệt trong một chuỗi để sử dụng trong biểu thức chính quy.
 * @param {string} string - Chuỗi cần thoát.
 * @returns {string} - Chuỗi đã được thoát.
 */
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * @function capitalizeFirst
 * @description Viết hoa chữ cái đầu tiên của một chuỗi và chuyển phần còn lại thành chữ thường.
 * @param {string} str - Chuỗi cần xử lý.
 * @returns {string} - Chuỗi đã được viết hoa chữ cái đầu.
 */
function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * @function capitalizeWords
 * @description Viết hoa chữ cái đầu tiên của mỗi từ trong một chuỗi.
 * @param {string} str - Chuỗi cần xử lý.
 * @returns {string} - Chuỗi đã được viết hoa các từ.
 */
function capitalizeWords(str) {
    if (!str) return '';
    return str.replace(/\w\S*/g, (txt) =>
        txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
}

/**
 * @function removeAccents
 * @description Loại bỏ dấu tiếng Việt khỏi một chuỗi.
 * @param {string} str - Chuỗi cần loại bỏ dấu.
 * @returns {string} - Chuỗi không dấu.
 */
function removeAccents(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * @function createSlug
 * @description Tạo một slug (chuỗi thân thiện với URL) từ một chuỗi.
 * @param {string} str - Chuỗi cần tạo slug.
 * @returns {string} - Slug đã tạo.
 */
function createSlug(str) {
    return removeAccents(str)
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Chỉ giữ lại chữ cái, số, khoảng trắng và dấu gạch ngang
        .replace(/\s+/g, '-') // Thay thế khoảng trắng bằng dấu gạch ngang
        .replace(/-+/g, '-') // Thay thế nhiều dấu gạch ngang bằng một
        .trim('-'); // Cắt bỏ dấu gạch ngang ở đầu và cuối
}

// --- Tiện ích xử lý tệp (File Handling Utilities) ---

/**
 * @function validateFileSize
 * @description Kiểm tra kích thước tệp có vượt quá giới hạn tối đa không.
 * @param {File} file - Đối tượng File.
 * @param {number} [maxSizeMB=systemSettings.maxFileSize] - Kích thước tối đa cho phép (MB).
 * @returns {boolean} - True nếu kích thước hợp lệ, ngược lại là False.
 */
function validateFileSize(file, maxSizeMB = null) {
    const maxSize = (maxSizeMB || systemSettings.maxFileSize) * 1024 * 1024;
    return file.size <= maxSize;
}

/**
 * @function validateFileType
 * @description Kiểm tra loại tệp có nằm trong danh sách cho phép không.
 * @param {File} file - Đối tượng File.
 * @param {string[]} [allowedTypes=systemSettings.allowedFileTypes] - Mảng các phần mở rộng tệp cho phép (ví dụ: ['jpg', 'png']).
 * @returns {boolean} - True nếu loại tệp hợp lệ, ngược lại là False.
 */
function validateFileType(file, allowedTypes = null) {
    const allowed = allowedTypes || systemSettings.allowedFileTypes;
    const extension = file.name.split('.').pop().toLowerCase();
    return allowed.includes(extension);
}

/**
 * @function formatFileSize
 * @description Định dạng kích thước tệp thành chuỗi dễ đọc (Bytes, KB, MB, GB).
 * @param {number} bytes - Kích thước tệp theo byte.
 * @returns {string} - Chuỗi kích thước tệp đã định dạng.
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * @function readFileAsDataURL
 * @description Đọc nội dung tệp dưới dạng Data URL (base64).
 * @param {File} file - Đối tượng File.
 * @returns {Promise<string>} - Promise chứa Data URL.
 */
function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}

/**
 * @function downloadFile
 * @description Tải xuống một tệp từ dữ liệu được cung cấp.
 * @param {string|Blob} data - Dữ liệu của tệp (chuỗi hoặc Blob).
 * @param {string} filename - Tên tệp khi tải xuống.
 * @param {string} [type='text/plain'] - Kiểu MIME của tệp.
 */
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
    window.URL.revokeObjectURL(url); // Giải phóng URL đối tượng
}

// --- Tiện ích tìm kiếm và lọc (Search and Filter Utilities) ---

/**
 * @function createSearchFilter
 * @description Tạo một hàm lọc để tìm kiếm các mục dựa trên một thuật ngữ và các trường cụ thể.
 * @param {string} searchTerm - Thuật ngữ tìm kiếm.
 * @param {string[]} fields - Mảng các tên trường để tìm kiếm trong đó (có thể là đường dẫn lồng nhau, ví dụ: 'user.name').
 * @returns {Function} - Hàm lọc (item => boolean).
 */
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

/**
 * @function getNestedProperty
 * @description Lấy giá trị của một thuộc tính lồng nhau từ một đối tượng.
 * @param {Object} obj - Đối tượng.
 * @param {string} path - Đường dẫn đến thuộc tính (ví dụ: 'user.profile.name').
 * @returns {*} - Giá trị của thuộc tính hoặc null nếu không tìm thấy.
 */
function getNestedProperty(obj, path) {
    return path.split('.').reduce((current, key) => {
        return current && typeof current === 'object' && Object.prototype.hasOwnProperty.call(current, key) ? current[key] : null;
    }, obj);
}

/**
 * @function sortData
 * @description Sắp xếp một mảng dữ liệu theo một trường và hướng sắp xếp cụ thể.
 * @param {Array<Object>} data - Mảng dữ liệu cần sắp xếp.
 * @param {string} sortField - Tên trường để sắp xếp theo (có thể là đường dẫn lồng nhau).
 * @param {'asc'|'desc'} [sortDirection='asc'] - Hướng sắp xếp ('asc' cho tăng dần, 'desc' cho giảm dần).
 * @returns {Array<Object>} - Mảng dữ liệu đã sắp xếp (là một bản sao mới).
 */
function sortData(data, sortField, sortDirection = 'asc') {
    return [...data].sort((a, b) => {
        const aVal = getNestedProperty(a, sortField);
        const bVal = getNestedProperty(b, sortField);

        // Xử lý giá trị null/undefined
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;

        // Xử lý các kiểu dữ liệu khác nhau
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
            return sortDirection === 'asc' ? aVal.getTime() - bVal.getTime() : bVal.getTime() - aVal.getTime();
        }

        // So sánh mặc định cho các kiểu khác
        const aStr = aVal.toString();
        const bStr = bVal.toString();
        const comparison = aStr.localeCompare(bStr);
        return sortDirection === 'asc' ? comparison : -comparison;
    });
}

/**
 * @function paginateData
 * @description Phân trang một mảng dữ liệu.
 * @param {Array<Object>} data - Mảng dữ liệu cần phân trang.
 * @param {number} page - Số trang hiện tại (bắt đầu từ 1).
 * @param {number} itemsPerPage - Số mục trên mỗi trang.
 * @returns {Object} - Đối tượng chứa dữ liệu phân trang và thông tin liên quan.
 */
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

// --- Tiện ích xuất dữ liệu (Export Utilities) ---

/**
 * @function exportToCSV
 * @description Xuất dữ liệu sang định dạng CSV.
 * @param {Array<Object>} data - Mảng các đối tượng dữ liệu.
 * @param {string} filename - Tên tệp CSV.
 * @param {string[]} [headers=null] - Mảng các tiêu đề cột (nếu null, sẽ dùng khóa của đối tượng đầu tiên).
 */
function exportToCSV(data, filename, headers = null) {
    if (!data || data.length === 0) {
        showNotification('Không có dữ liệu để xuất', 'warning');
        return;
    }

    let csv = '';

    // Thêm BOM (Byte Order Mark) cho UTF-8 để đảm bảo hiển thị tiếng Việt đúng trong Excel
    csv += '\ufeff';

    // Thêm tiêu đề
    if (headers) {
        csv += headers.map(header => `"${String(header).replace(/"/g, '""')}"`).join(',') + '\n';
    } else if (data.length > 0) {
        csv += Object.keys(data[0]).map(key => `"${String(key).replace(/"/g, '""')}"`).join(',') + '\n';
    }

    // Thêm các hàng dữ liệu
    data.forEach(row => {
        const values = Object.values(row).map(value => {
            // Chuyển đổi giá trị thành chuỗi, xử lý null/undefined
            const stringValue = value === null || value === undefined ? '' : String(value);
            // Thoát dấu ngoặc kép và bọc trong dấu ngoặc kép nếu chứa dấu phẩy, dấu ngoặc kép hoặc xuống dòng
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                return '"' + stringValue.replace(/"/g, '""') + '"';
            }
            return stringValue;
        });
        csv += values.join(',') + '\n';
    });

    downloadFile(csv, filename, 'text/csv;charset=utf-8;');
}

/**
 * @function exportToJSON
 * @description Xuất dữ liệu sang định dạng JSON.
 * @param {Array<Object>} data - Mảng các đối tượng dữ liệu.
 * @param {string} filename - Tên tệp JSON.
 */
function exportToJSON(data, filename) {
    const json = JSON.stringify(data, null, 2); // Định dạng JSON đẹp
    downloadFile(json, filename, 'application/json');
}

// --- Xử lý lỗi toàn cục (Global Error Handling) ---

// Trình xử lý lỗi toàn cục cho các lỗi JavaScript không được xử lý
window.addEventListener('error', function(event) {
    console.error('Lỗi toàn cục:', event.error);

    // Không hiển thị thông báo lỗi cho các lỗi tải script
    if (event.error && !event.filename) {
        showNotification('Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.', 'error');
    }
});

// Trình xử lý lỗi toàn cục cho các Promise bị từ chối không được xử lý
window.addEventListener('unhandledrejection', function(event) {
    console.error('Promise bị từ chối không được xử lý:', event.reason);
    showNotification('Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.', 'error');
});

// --- Phơi bày các hàm toàn cục (Expose Global Functions) ---

// Phơi bày các hàm quan trọng thông qua đối tượng `window.app` để có thể truy cập từ các tệp script khác
window.app = {
    // Xác thực
    login,
    logout,
    checkAuthenticationStatus,
    hasPermission,

    // Thông báo
    showNotification,
    removeNotification,
    clearAllNotifications,

    // Lớp phủ tải
    showLoading,
    hideLoading,
    updateLoadingMessage,

    // Cài đặt
    updateSetting,
    getSystemSettings: () => systemSettings, // Trả về bản sao của cài đặt

    // Xác thực dữ liệu
    validateForm,
    validateEmail,
    validatePhone,
    validateISBN,
    validateRequired,
    validateMinLength,
    validateMaxLength,
    validateNumeric,
    validatePositiveNumber,
    validateDate,
    validateFutureDate,
    validatePastDate,
    showFormErrors,

    // Tiện ích chung
    formatDate,
    formatDateTime,
    formatCurrency,
    formatNumber,
    generateId,
    debounce,
    throttle,
    deepClone,
    sanitizeHtml,
    escapeRegExp,
    capitalizeFirst,
    capitalizeWords,
    removeAccents,
    createSlug,

    // Xử lý tệp
    validateFileSize,
    validateFileType,
    formatFileSize,
    readFileAsDataURL,
    downloadFile,

    // Thao tác dữ liệu (tìm kiếm, sắp xếp, phân trang)
    sortData,
    paginateData,
    createSearchFilter,
    getNestedProperty, // Cần được phơi bày nếu createSearchFilter sử dụng nó

    // Xuất dữ liệu
    exportToCSV,
    exportToJSON,

    // Ghi nhật ký hoạt động
    logActivity,
    getActivities,
    clearActivities,

    // Tự động đăng xuất
    resetAutoLogoutTimer,
    continueSession
};
