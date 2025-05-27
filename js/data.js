// js/data.js - Data management and storage

// Data storage
let readers = [];
let books = [];
let borrowRecords = [];
let categories = [];
let authors = [];
let publishers = [];
let fines = [];
let renewals = [];
let reservations = [];

// Data initialization
function initializeData() {
    loadAllData();
    
    // If no data exists, create sample data
    if (readers.length === 0) {
        createSampleData();
    }
    
    // Set up data auto-save
    setupAutoSave();
    
    // Initialize data validation
    validateDataIntegrity();
}

// Load all data from localStorage
function loadAllData() {
    try {
        readers = JSON.parse(localStorage.getItem('readers') || '[]');
        books = JSON.parse(localStorage.getItem('books') || '[]');
        borrowRecords = JSON.parse(localStorage.getItem('borrowRecords') || '[]');
        categories = JSON.parse(localStorage.getItem('categories') || '[]');
        authors = JSON.parse(localStorage.getItem('authors') || '[]');
        publishers = JSON.parse(localStorage.getItem('publishers') || '[]');
        fines = JSON.parse(localStorage.getItem('fines') || '[]');
        renewals = JSON.parse(localStorage.getItem('renewals') || '[]');
        reservations = JSON.parse(localStorage.getItem('reservations') || '[]');
        
        // Convert date strings back to Date objects
        convertStringDatesToObjects();
        
        console.log('Data loaded successfully');
    } catch (error) {
        console.error('Error loading data:', error);
        showNotification('Lỗi khi tải dữ liệu. Sử dụng dữ liệu mẫu.', 'warning');
        createSampleData();
    }
}

// Save all data to localStorage
function saveAllData() {
    try {
        localStorage.setItem('readers', JSON.stringify(readers));
        localStorage.setItem('books', JSON.stringify(books));
        localStorage.setItem('borrowRecords', JSON.stringify(borrowRecords));
        localStorage.setItem('categories', JSON.stringify(categories));
        localStorage.setItem('authors', JSON.stringify(authors));
        localStorage.setItem('publishers', JSON.stringify(publishers));
        localStorage.setItem('fines', JSON.stringify(fines));
        localStorage.setItem('renewals', JSON.stringify(renewals));
        localStorage.setItem('reservations', JSON.stringify(reservations));
        
        // Update last save time
        localStorage.setItem('lastSaveTime', new Date().toISOString());
        
        console.log('Data saved successfully');
        return true;
    } catch (error) {
        console.error('Error saving data:', error);
        showNotification('Lỗi khi lưu dữ liệu!', 'error');
        return false;
    }
}

// Convert date strings to Date objects after loading
function convertStringDatesToObjects() {
    const dateFields = {
        readers: ['dateOfBirth', 'registrationDate', 'lastActivity'],
        books: ['publicationDate', 'addedDate', 'lastBorrowed'],
        borrowRecords: ['borrowDate', 'dueDate', 'returnDate'],
        fines: ['issueDate', 'paidDate'],
        renewals: ['renewalDate'],
        reservations: ['reservationDate', 'expiryDate']
    };
    
    Object.keys(dateFields).forEach(dataType => {
        const data = eval(dataType);
        const fields = dateFields[dataType];
        
        data.forEach(item => {
            fields.forEach(field => {
                if (item[field] && typeof item[field] === 'string') {
                    item[field] = new Date(item[field]);
                }
            });
        });
    });
}

// Setup auto-save functionality
function setupAutoSave() {
    // Save data every 5 minutes
    setInterval(() => {
        if (document.visibilityState === 'visible') {
            saveAllData();
        }
    }, 5 * 60 * 1000);
    
    // Save data when page is about to unload
    window.addEventListener('beforeunload', () => {
        saveAllData();
    });
}

// Validate data integrity
function validateDataIntegrity() {
    let issues = [];
    
    // Check for duplicate IDs
    const readerIds = readers.map(r => r.id);
    const bookIds = books.map(b => b.id);
    const borrowIds = borrowRecords.map(br => br.id);
    
    if (new Set(readerIds).size !== readerIds.length) {
        issues.push('Duplicate reader IDs found');
    }
    
    if (new Set(bookIds).size !== bookIds.length) {
        issues.push('Duplicate book IDs found');
    }
    
    if (new Set(borrowIds).size !== borrowIds.length) {
        issues.push('Duplicate borrow record IDs found');
    }
    
    // Check for orphaned records
    borrowRecords.forEach(record => {
        if (!readers.find(r => r.id === record.readerId)) {
            issues.push(`Borrow record ${record.id} has invalid reader ID`);
        }
        if (!books.find(b => b.id === record.bookId)) {
            issues.push(`Borrow record ${record.id} has invalid book ID`);
        }
    });
    
    if (issues.length > 0) {
        console.warn('Data integrity issues:', issues);
        // Auto-fix some issues
        fixDataIntegrityIssues();
    }
}

// Fix data integrity issues
function fixDataIntegrityIssues() {
    // Remove orphaned borrow records
    borrowRecords = borrowRecords.filter(record => {
        const hasValidReader = readers.find(r => r.id === record.readerId);
        const hasValidBook = books.find(b => b.id === record.bookId);
        return hasValidReader && hasValidBook;
    });
    
    // Remove orphaned fines
    fines = fines.filter(fine => {
        return borrowRecords.find(br => br.id === fine.borrowRecordId);
    });
    
    // Update book availability
    updateAllBookAvailability();
    
    saveAllData();
}

// Create sample data for demonstration
function createSampleData() {
    console.log('Creating sample data...');
    
    // Create categories
    categories = [
        { id: 'cat1', name: 'Văn học', description: 'Sách văn học trong và ngoài nước', color: '#e74c3c' },
        { id: 'cat2', name: 'Khoa học', description: 'Sách khoa học tự nhiên và công nghệ', color: '#3498db' },
        { id: 'cat3', name: 'Lịch sử', description: 'Sách lịch sử Việt Nam và thế giới', color: '#f39c12' },
        { id: 'cat4', name: 'Địa lý', description: 'Sách địa lý và môi trường', color: '#27ae60' },
        { id: 'cat5', name: 'Toán học', description: 'Sách toán học các cấp độ', color: '#9b59b6' },
        { id: 'cat6', name: 'Ngoại ngữ', description: 'Sách học ngoại ngữ', color: '#1abc9c' },
        { id: 'cat7', name: 'Tin học', description: 'Sách tin học và công nghệ thông tin', color: '#34495e' },
        { id: 'cat8', name: 'Tham khảo', description: 'Sách tham khảo và từ điển', color: '#95a5a6' }
    ];
    
    // Create authors
    authors = [
        { id: 'auth1', name: 'Ngô Tất Tố', biography: 'Nhà văn Việt Nam (1894-1954)', nationality: 'Việt Nam' },
        { id: 'auth2', name: 'Vũ Trọng Phụng', biography: 'Nhà văn Việt Nam (1912-1939)', nationality: 'Việt Nam' },
        { id: 'auth3', name: 'Nam Cao', biography: 'Nhà văn Việt Nam (1915-1951)', nationality: 'Việt Nam' },
        { id: 'auth4', name: 'Kim Lân', biography: 'Nhà văn Việt Nam (1920-2007)', nationality: 'Việt Nam' },
        { id: 'auth5', name: 'Bộ Giáo dục và Đào tạo', biography: 'Tác giả tập thể', nationality: 'Việt Nam' },
        { id: 'auth6', name: 'Trần Trọng Kim', biography: 'Sử gia Việt Nam (1883-1953)', nationality: 'Việt Nam' },
        { id: 'auth7', name: 'Nguyễn Văn Huyên', biography: 'Nhà dân tộc học (1905-1975)', nationality: 'Việt Nam' },
        { id: 'auth8', name: 'Raymond Murphy', biography: 'Tác giả sách tiếng Anh', nationality: 'Anh' }
    ];
    
    // Create publishers
    publishers = [
        { id: 'pub1', name: 'NXB Giáo dục Việt Nam', address: 'Hà Nội', phone: '024-3831-7171', email: 'info@nxbgd.vn' },
        { id: 'pub2', name: 'NXB Văn học', address: 'Hà Nội', phone: '024-3943-3256', email: 'info@nxbvanhoc.com.vn' },
        { id: 'pub3', name: 'NXB Khoa học và Kỹ thuật', address: 'Hà Nội', phone: '024-3852-3841', email: 'info@nxbkhkt.com.vn' },
        { id: 'pub4', name: 'NXB Đại học Quốc gia', address: 'TP.HCM', phone: '028-3833-4082', email: 'info@vnuhcmpress.edu.vn' },
        { id: 'pub5', name: 'NXB Trẻ', address: 'TP.HCM', phone: '028-3930-5209', email: 'info@nxbtre.com.vn' },
        { id: 'pub6', name: 'Cambridge University Press', address: 'Cambridge, UK', phone: '+44-1223-312393', email: 'info@cambridge.org' }
    ];
    
    // Create sample books
    books = [
        {
            id: 'book1',
            title: 'Tắt đèn',
            authorId: 'auth1',
            categoryId: 'cat1',
            publisherId: 'pub2',
            isbn: '978-604-2-00001-1',
            publicationYear: 2020,
            publicationDate: new Date('2020-01-15'),
            pages: 280,
            language: 'Tiếng Việt',
            description: 'Tiểu thuyết nổi tiếng của Ngô Tất Tố về cuộc sống nông thôn Việt Nam',
            location: 'Kệ A1-01',
            totalCopies: 15,
            availableCopies: 12,
            borrowedCopies: 3,
            reservedCopies: 0,
            price: 85000,
            condition: 'Tốt',
            addedDate: new Date('2023-01-10'),
            lastBorrowed: new Date('2024-11-10'),
            tags: ['văn học việt nam', 'tiểu thuyết', 'nông thôn'],
            coverImage: null,
            status: 'available'
        },
        {
            id: 'book2',
            title: 'Số đỏ',
            authorId: 'auth2',
            categoryId: 'cat1',
            publisherId: 'pub2',
            isbn: '978-604-2-00002-8',
            publicationYear: 2019,
            publicationDate: new Date('2019-03-20'),
            pages: 320,
            language: 'Tiếng Việt',
            description: 'Tiểu thuyết phê phán xã hội của Vũ Trọng Phụng',
            location: 'Kệ A1-02',
            totalCopies: 12,
            availableCopies: 10,
            borrowedCopies: 2,
            reservedCopies: 0,
            price: 95000,
            condition: 'Tốt',
            addedDate: new Date('2023-01-15'),
            lastBorrowed: new Date('2024-11-08'),
            tags: ['văn học việt nam', 'tiểu thuyết', 'phê phán xã hội'],
            coverImage: null,
            status: 'available'
        },
        {
            id: 'book3',
            title: 'Chí Phèo',
            authorId: 'auth3',
            categoryId: 'cat1',
            publisherId: 'pub2',
            isbn: '978-604-2-00003-5',
            publicationYear: 2021,
            publicationDate: new Date('2021-05-10'),
            pages: 180,
            language: 'Tiếng Việt',
            description: 'Truyện ngắn nổi tiếng của Nam Cao',
            location: 'Kệ A1-03',
            totalCopies: 20,
            availableCopies: 18,
            borrowedCopies: 2,
            reservedCopies: 0,
            price: 65000,
            condition: 'Tốt',
            addedDate: new Date('2023-02-01'),
            lastBorrowed: new Date('2024-11-12'),
            tags: ['văn học việt nam', 'truyện ngắn'],
            coverImage: null,
            status: 'available'
        },
        {
            id: 'book4',
            title: 'Vợ nhặt',
            authorId: 'auth4',
            categoryId: 'cat1',
            publisherId: 'pub2',
            isbn: '978-604-2-00004-2',
            publicationYear: 2020,
            publicationDate: new Date('2020-08-15'),
            pages: 150,
            language: 'Tiếng Việt',
            description: 'Truyện ngắn của Kim Lân về đời sống nông thôn',
            location: 'Kệ A1-04',
            totalCopies: 18,
            availableCopies: 15,
            borrowedCopies: 3,
            reservedCopies: 0,
            price: 55000,
            condition: 'Tốt',
            addedDate: new Date('2023-02-15'),
            lastBorrowed: new Date('2024-11-09'),
            tags: ['văn học việt nam', 'truyện ngắn', 'nông thôn'],
            coverImage: null,
            status: 'available'
        },
        {
            id: 'book5',
            title: 'Toán học 11',
            authorId: 'auth5',
            categoryId: 'cat5',
            publisherId: 'pub1',
            isbn: '978-604-2-00005-9',
            publicationYear: 2023,
            publicationDate: new Date('2023-06-01'),
            pages: 450,
            language: 'Tiếng Việt',
            description: 'Sách giáo khoa Toán học lớp 11',
            location: 'Kệ B2-01',
            totalCopies: 50,
            availableCopies: 42,
            borrowedCopies: 8,
            reservedCopies: 0,
            price: 120000,
            condition: 'Mới',
            addedDate: new Date('2023-08-01'),
            lastBorrowed: new Date('2024-11-13'),
            tags: ['toán học', 'giáo khoa', 'lớp 11'],
            coverImage: null,
            status: 'available'
        },
        {
            id: 'book6',
            title: 'Vật lý 12',
            authorId: 'auth5',
            categoryId: 'cat2',
            publisherId: 'pub1',
            isbn: '978-604-2-00006-6',
            publicationYear: 2023,
            publicationDate: new Date('2023-06-15'),
            pages: 380,
            language: 'Tiếng Việt',
            description: 'Sách giáo khoa Vật lý lớp 12',
            location: 'Kệ B1-01',
            totalCopies: 45,
            availableCopies: 38,
            borrowedCopies: 7,
            reservedCopies: 0,
            price: 115000,
            condition: 'Mới',
            addedDate: new Date('2023-08-15'),
            lastBorrowed: new Date('2024-11-11'),
            tags: ['vật lý', 'giáo khoa', 'lớp 12'],
            coverImage: null,
            status: 'available'
        },
        {
            id: 'book7',
            title: 'Lịch sử Việt Nam',
            authorId: 'auth6',
            categoryId: 'cat3',
            publisherId: 'pub3',
            isbn: '978-604-2-00007-3',
            publicationYear: 2022,
            publicationDate: new Date('2022-03-10'),
            pages: 520,
            language: 'Tiếng Việt',
            description: 'Lịch sử Việt Nam từ thời cổ đại đến hiện đại',
            location: 'Kệ C1-01',
            totalCopies: 25,
            availableCopies: 22,
            borrowedCopies: 3,
            reservedCopies: 0,
            price: 150000,
            condition: 'Tốt',
            addedDate: new Date('2023-03-01'),
            lastBorrowed: new Date('2024-11-07'),
            tags: ['lịch sử', 'việt nam', 'tham khảo'],
            coverImage: null,
            status: 'available'
        },
        {
            id: 'book8',
            title: 'English Grammar in Use',
            authorId: 'auth8',
            categoryId: 'cat6',
            publisherId: 'pub6',
            isbn: '978-1-108-45782-3',
            publicationYear: 2019,
            publicationDate: new Date('2019-01-01'),
            pages: 380,
            language: 'Tiếng Anh',
            description: 'Sách ngữ pháp tiếng Anh cho học sinh trung cấp',
            location: 'Kệ D1-01',
            totalCopies: 30,
            availableCopies: 25,
            borrowedCopies: 5,
            reservedCopies: 0,
            price: 280000,
            condition: 'Tốt',
            addedDate: new Date('2023-01-20'),
            lastBorrowed: new Date('2024-11-14'),
            tags: ['tiếng anh', 'ngữ pháp', 'học ngoại ngữ'],
            coverImage: null,
            status: 'available'
        }
    ];
    
    // Create sample readers
    readers = [
        {
            id: 'reader1',
            studentId: '2023001001',
            fullName: 'Nguyễn Văn An',
            dateOfBirth: new Date('2007-03-15'),
            gender: 'Nam',
            className: '11A1',
            email: 'an.nguyen@student.school.edu.vn',
            phone: '0901234567',
            address: '123 Đường ABC, Quận 1, TP.HCM',
            parentName: 'Nguyễn Văn Bình',
            parentPhone: '0987654321',
            registrationDate: new Date('2023-09-01'),
            cardNumber: 'LIB2023001',
            status: 'active',
            borrowLimit: 5,
            currentBorrows: 2,
            totalBorrows: 15,
            fineAmount: 0,
            lastActivity: new Date('2024-11-10'),
            notes: 'Học sinh tích cực, thường xuyên mượn sách',
            avatar: null
        },
        {
            id: 'reader2',
            studentId: '2023002002',
            fullName: 'Trần Thị Bình',
            dateOfBirth: new Date('2008-07-22'),
            gender: 'Nữ',
            className: '10A2',
            email: 'binh.tran@student.school.edu.vn',
            phone: '0902345678',
            address: '456 Đường DEF, Quận 2, TP.HCM',
            parentName: 'Trần Văn Cường',
            parentPhone: '0976543210',
            registrationDate: new Date('2023-09-01'),
            cardNumber: 'LIB2023002',
            status: 'active',
            borrowLimit: 5,
            currentBorrows: 1,
            totalBorrows: 12,
            fineAmount: 6000,
            lastActivity: new Date('2024-11-08'),
            notes: 'Có 1 cuốn sách quá hạn',
            avatar: null
        },
        {
            id: 'reader3',
            studentId: '2023003003',
            fullName: 'Lê Văn Cường',
            dateOfBirth: new Date('2006-11-08'),
            gender: 'Nam',
            className: '12A1',
            email: 'cuong.le@student.school.edu.vn',
            phone: '0903456789',
            address: '789 Đường GHI, Quận 3, TP.HCM',
            parentName: 'Lê Thị Dung',
            parentPhone: '0965432109',
            registrationDate: new Date('2021-09-01'),
            cardNumber: 'LIB2021001',
            status: 'active',
            borrowLimit: 5,
            currentBorrows: 3,
            totalBorrows: 45,
            fineAmount: 0,
            lastActivity: new Date('2024-11-12'),
            notes: 'Học sinh lớp 12, chuẩn bị thi đại học',
            avatar: null
        },
        {
            id: 'reader4',
            studentId: '2023004004',
            fullName: 'Phạm Thị Dung',
            dateOfBirth: new Date('2007-05-30'),
            gender: 'Nữ',
            className: '11A3',
            email: 'dung.pham@student.school.edu.vn',
            phone: '0904567890',
            address: '321 Đường JKL, Quận 4, TP.HCM',
            parentName: 'Phạm Văn Em',
            parentPhone: '0954321098',
            registrationDate: new Date('2023-09-01'),
            cardNumber: 'LIB2023003',
            status: 'warning',
            borrowLimit: 5,
            currentBorrows: 4,
            totalBorrows: 22,
            fineAmount: 12000,
            lastActivity: new Date('2024-11-05'),
            notes: 'Có 2 cuốn sách quá hạn, cần nhắc nhở',
            avatar: null
        },
        {
            id: 'reader5',
            studentId: '2023005005',
            fullName: 'Hoàng Văn Em',
            dateOfBirth: new Date('2008-01-12'),
            gender: 'Nam',
            className: '10A1',
            email: 'em.hoang@student.school.edu.vn',
            phone: '0905678901',
            address: '654 Đường MNO, Quận 5, TP.HCM',
            parentName: 'Hoàng Thị Phương',
            parentPhone: '0943210987',
            registrationDate: new Date('2023-09-01'),
            cardNumber: 'LIB2023004',
            status: 'active',
            borrowLimit: 5,
            currentBorrows: 1,
            totalBorrows: 8,
            fineAmount: 0,
            lastActivity: new Date('2024-11-09'),
            notes: 'Học sinh mới, cần hướng dẫn sử dụng thư viện',
            avatar: null
        }
    ];
    
    // Create sample borrow records
    borrowRecords = [
        {
            id: 'borrow1',
            readerId: 'reader1',
            bookId: 'book1',
            borrowDate: new Date('2024-10-28'),
            dueDate: new Date('2024-11-11'),
            returnDate: null,
            status: 'borrowed',
            renewalCount: 0,
            notes: 'Mượn để làm bài tập văn học',
            librarian: 'librarian'
        },
        {
            id: 'borrow2',
            readerId: 'reader1',
            bookId: 'book5',
            borrowDate: new Date('2024-11-01'),
            dueDate: new Date('2024-11-15'),
            returnDate: null,
            status: 'borrowed',
            renewalCount: 0,
            notes: 'Mượn để ôn tập toán',
            librarian: 'librarian'
        },
        {
            id: 'borrow3',
            readerId: 'reader2',
            bookId: 'book2',
            borrowDate: new Date('2024-10-25'),
            dueDate: new Date('2024-11-08'),
            returnDate: null,
            status: 'overdue',
            renewalCount: 0,
            notes: 'Quá hạn 7 ngày',
            librarian: 'librarian'
        },
        {
            id: 'borrow4',
            readerId: 'reader3',
            bookId: 'book3',
            borrowDate: new Date('2024-11-05'),
            dueDate: new Date('2024-11-19'),
            returnDate: null,
            status: 'borrowed',
            renewalCount: 1,
            notes: 'Đã gia hạn 1 lần',
            librarian: 'librarian'
        },
        {
            id: 'borrow5',
            readerId: 'reader3',
            bookId: 'book6',
            borrowDate: new Date('2024-11-02'),
            dueDate: new Date('2024-11-16'),
            returnDate: null,
            status: 'borrowed',
            renewalCount: 0,
            notes: 'Ôn tập vật lý',
            librarian: 'librarian'
        },
        {
            id: 'borrow6',
            readerId: 'reader3',
            bookId: 'book7',
            borrowDate: new Date('2024-11-08'),
            dueDate: new Date('2024-11-22'),
            returnDate: null,
            status: 'borrowed',
            renewalCount: 0,
            notes: 'Nghiên cứu lịch sử',
            librarian: 'librarian'
        },
        {
            id: 'borrow7',
            readerId: 'reader4',
            bookId: 'book4',
            borrowDate: new Date('2024-10-20'),
            dueDate: new Date('2024-11-03'),
            returnDate: null,
            status: 'overdue',
            renewalCount: 0,
            notes: 'Quá hạn 12 ngày',
            librarian: 'librarian'
        },
        {
            id: 'borrow8',
            readerId: 'reader4',
            bookId: 'book8',
            borrowDate: new Date('2024-10-22'),
            dueDate: new Date('2024-11-05'),
            returnDate: null,
            status: 'overdue',
            renewalCount: 0,
            notes: 'Quá hạn 10 ngày',
            librarian: 'librarian'
        },
        {
            id: 'borrow9',
            readerId: 'reader5',
            bookId: 'book1',
            borrowDate: new Date('2024-10-15'),
            dueDate: new Date('2024-10-29'),
            returnDate: new Date('2024-10-28'),
            status: 'returned',
            renewalCount: 0,
            notes: 'Trả đúng hạn',
            librarian: 'librarian'
        }
    ];
    
    // Create sample fines
    fines = [
        {
            id: 'fine1',
            borrowRecordId: 'borrow3',
            readerId: 'reader2',
            amount: 6000,
            reason: 'Trả sách quá hạn 3 ngày',
            issueDate: new Date('2024-11-11'),
            dueDate: new Date('2024-11-25'),
            paidDate: null,
            status: 'unpaid',
            notes: 'Phạt 2000đ/ngày',
            issuedBy: 'librarian'
        },
        {
            id: 'fine2',
            borrowRecordId: 'borrow7',
            readerId: 'reader4',
            amount: 8000,
            reason: 'Trả sách quá hạn 4 ngày',
            issueDate: new Date('2024-11-07'),
            dueDate: new Date('2024-11-21'),
            paidDate: null,
            status: 'unpaid',
            notes: 'Phạt 2000đ/ngày',
            issuedBy: 'librarian'
        },
        {
            id: 'fine3',
            borrowRecordId: 'borrow8',
            readerId: 'reader4',
            amount: 4000,
            reason: 'Trả sách quá hạn 2 ngày',
            issueDate: new Date('2024-11-07'),
            dueDate: new Date('2024-11-21'),
            paidDate: null,
            status: 'unpaid',
            notes: 'Phạt 2000đ/ngày',
            issuedBy: 'librarian'
        }
    ];
    
    // Create sample renewals
    renewals = [
        {
            id: 'renewal1',
            borrowRecordId: 'borrow4',
            readerId: 'reader3',
            bookId: 'book3',
            renewalDate: new Date('2024-11-12'),
            newDueDate: new Date('2024-11-26'),
            reason: 'Cần thêm thời gian nghiên cứu',
            approvedBy: 'librarian',
            status: 'approved'
        }
    ];
    
    // Create sample reservations
    reservations = [
        {
            id: 'reservation1',
            readerId: 'reader5',
            bookId: 'book1',
            reservationDate: new Date('2024-11-14'),
            expiryDate: new Date('2024-11-21'),
            status: 'active',
            priority: 1,
            notes: 'Đặt trước để mượn tuần sau',
            notificationSent: false
        }
    ];
    
    // Update book availability based on borrow records
    updateAllBookAvailability();
    
    // Save sample data
    saveAllData();
    
    console.log('Sample data created successfully');
}

// Reader management functions
function addReader(readerData) {
    try {
        // Validate required fields
        if (!readerData.studentId || !readerData.fullName || !readerData.className) {
            throw new Error('Thiếu thông tin bắt buộc');
        }
        
        // Check for duplicate student ID
        if (readers.find(r => r.studentId === readerData.studentId)) {
            throw new Error('Mã học sinh đã tồn tại');
        }
        
        // Generate new reader
        const newReader = {
            id: generateId(),
            studentId: readerData.studentId,
            fullName: readerData.fullName,
            dateOfBirth: new Date(readerData.dateOfBirth),
            gender: readerData.gender,
            className: readerData.className,
            email: readerData.email || '',
            phone: readerData.phone || '',
            address: readerData.address || '',
            parentName: readerData.parentName || '',
            parentPhone: readerData.parentPhone || '',
            registrationDate: new Date(),
            cardNumber: generateCardNumber(),
            status: 'active',
            borrowLimit: systemSettings.maxBooksPerReader || 5,
            currentBorrows: 0,
            totalBorrows: 0,
            fineAmount: 0,
            lastActivity: new Date(),
            notes: readerData.notes || '',
            avatar: readerData.avatar || null
        };
        
        readers.push(newReader);
        saveAllData();
        
        // Log activity
        logActivity('add_reader', `Thêm độc giả mới: ${newReader.fullName} (${newReader.studentId})`);
        
        return newReader;
    } catch (error) {
        console.error('Error adding reader:', error);
        throw error;
    }
}

function updateReader(readerId, readerData) {
    try {
        const readerIndex = readers.findIndex(r => r.id === readerId);
        if (readerIndex === -1) {
            throw new Error('Không tìm thấy độc giả');
        }
        
        const oldReader = { ...readers[readerIndex] };
        
        // Update reader data
        readers[readerIndex] = {
            ...readers[readerIndex],
            ...readerData,
            id: readerId, // Ensure ID doesn't change
            dateOfBirth: readerData.dateOfBirth ? new Date(readerData.dateOfBirth) : readers[readerIndex].dateOfBirth
        };
        
        saveAllData();
        
        // Log activity
        logActivity('update_reader', `Cập nhật thông tin độc giả: ${readers[readerIndex].fullName}`, {
            oldData: oldReader,
            newData: readers[readerIndex]
        });
        
        return readers[readerIndex];
    } catch (error) {
        console.error('Error updating reader:', error);
        throw error;
    }
}

function deleteReader(readerId) {
    try {
        const readerIndex = readers.findIndex(r => r.id === readerId);
        if (readerIndex === -1) {
            throw new Error('Không tìm thấy độc giả');
        }
        
        const reader = readers[readerIndex];
        
        // Check if reader has active borrows
        const activeBorrows = borrowRecords.filter(br => 
            br.readerId === readerId && br.status === 'borrowed'
        );
        
        if (activeBorrows.length > 0) {
            throw new Error('Không thể xóa độc giả đang mượn sách');
        }
        
        // Check if reader has unpaid fines
        const unpaidFines = fines.filter(f => 
            f.readerId === readerId && f.status === 'unpaid'
        );
        
        if (unpaidFines.length > 0) {
            throw new Error('Không thể xóa độc giả có phí phạt chưa thanh toán');
        }
        
        readers.splice(readerIndex, 1);
        saveAllData();
        
        // Log activity
        logActivity('delete_reader', `Xóa độc giả: ${reader.fullName} (${reader.studentId})`);
        
        return true;
    } catch (error) {
        console.error('Error deleting reader:', error);
        throw error;
    }
}

function getReader(readerId) {
    return readers.find(r => r.id === readerId);
}

function getReaderByStudentId(studentId) {
    return readers.find(r => r.studentId === studentId);
}

function getReaderByCardNumber(cardNumber) {
    return readers.find(r => r.cardNumber === cardNumber);
}

function searchReaders(searchTerm, filters = {}) {
    let filteredReaders = [...readers];
    
    // Apply text search
    if (searchTerm) {
        const searchFilter = createSearchFilter(searchTerm, [
            'fullName', 'studentId', 'cardNumber', 'className', 'email', 'phone'
        ]);
        filteredReaders = filteredReaders.filter(searchFilter);
    }
    
    // Apply filters
    if (filters.className) {
        filteredReaders = filteredReaders.filter(r => r.className === filters.className);
    }
    
    if (filters.status) {
        filteredReaders = filteredReaders.filter(r => r.status === filters.status);
    }
    
    if (filters.gender) {
        filteredReaders = filteredReaders.filter(r => r.gender === filters.gender);
    }
    
    if (filters.hasOverdue) {
        const overdueReaderIds = getOverdueReaderIds();
        filteredReaders = filteredReaders.filter(r => overdueReaderIds.includes(r.id));
    }
    
    if (filters.hasFines) {
        filteredReaders = filteredReaders.filter(r => r.fineAmount > 0);
    }
    
    return filteredReaders;
}

function generateCardNumber() {
    const year = new Date().getFullYear();
    const existingNumbers = readers.map(r => r.cardNumber).filter(Boolean);
    let number = 1;
    
    while (existingNumbers.includes(`LIB${year}${number.toString().padStart(3, '0')}`)) {
        number++;
    }
    
    return `LIB${year}${number.toString().padStart(3, '0')}`;
}

// Book management functions
function addBook(bookData) {
    try {
        // Validate required fields
        if (!bookData.title || !bookData.authorId || !bookData.categoryId) {
            throw new Error('Thiếu thông tin bắt buộc');
        }
        
        // Check for duplicate ISBN
        if (bookData.isbn && books.find(b => b.isbn === bookData.isbn)) {
            throw new Error('ISBN đã tồn tại');
        }
        
        // Generate new book
        const newBook = {
            id: generateId(),
            title: bookData.title,
            authorId: bookData.authorId,
            categoryId: bookData.categoryId,
            publisherId: bookData.publisherId || '',
            isbn: bookData.isbn || '',
            publicationYear: parseInt(bookData.publicationYear) || new Date().getFullYear(),
            publicationDate: bookData.publicationDate ? new Date(bookData.publicationDate) : new Date(),
            pages: parseInt(bookData.pages) || 0,
            language: bookData.language || 'Tiếng Việt',
            description: bookData.description || '',
            location: bookData.location || '',
            totalCopies: parseInt(bookData.totalCopies) || 1,
            availableCopies: parseInt(bookData.totalCopies) || 1,
            borrowedCopies: 0,
            reservedCopies: 0,
            price: parseFloat(bookData.price) || 0,
            condition: bookData.condition || 'Tốt',
            addedDate: new Date(),
            lastBorrowed: null,
            tags: bookData.tags || [],
            coverImage: bookData.coverImage || null,
            status: 'available'
        };
        
        books.push(newBook);
        saveAllData();
        
        // Log activity
        logActivity('add_book', `Thêm sách mới: ${newBook.title} (${newBook.totalCopies} bản)`);
        
        return newBook;
    } catch (error) {
        console.error('Error adding book:', error);
        throw error;
    }
}

function updateBook(bookId, bookData) {
    try {
        const bookIndex = books.findIndex(b => b.id === bookId);
        if (bookIndex === -1) {
            throw new Error('Không tìm thấy sách');
        }
        
        const oldBook = { ...books[bookIndex] };
        
        // Update book data
        books[bookIndex] = {
            ...books[bookIndex],
            ...bookData,
            id: bookId, // Ensure ID doesn't change
            publicationDate: bookData.publicationDate ? new Date(bookData.publicationDate) : books[bookIndex].publicationDate,
            totalCopies: parseInt(bookData.totalCopies) || books[bookIndex].totalCopies,
            pages: parseInt(bookData.pages) || books[bookIndex].pages,
            price: parseFloat(bookData.price) || books[bookIndex].price
        };
        
        // Update availability if total copies changed
        if (oldBook.totalCopies !== books[bookIndex].totalCopies) {
            const difference = books[bookIndex].totalCopies - oldBook.totalCopies;
            books[bookIndex].availableCopies = Math.max(0, books[bookIndex].availableCopies + difference);
        }
        
        saveAllData();
        
        // Log activity
        logActivity('update_book', `Cập nhật thông tin sách: ${books[bookIndex].title}`, {
            oldData: oldBook,
            newData: books[bookIndex]
        });
        
        return books[bookIndex];
    } catch (error) {
        console.error('Error updating book:', error);
        throw error;
    }
}

function deleteBook(bookId) {
    try {
        const bookIndex = books.findIndex(b => b.id === bookId);
        if (bookIndex === -1) {
            throw new Error('Không tìm thấy sách');
        }
        
        const book = books[bookIndex];
        
        // Check if book has active borrows
        const activeBorrows = borrowRecords.filter(br => 
            br.bookId === bookId && br.status === 'borrowed'
        );
        
        if (activeBorrows.length > 0) {
            throw new Error('Không thể xóa sách đang được mượn');
        }
        
        // Check if book has active reservations
        const activeReservations = reservations.filter(r => 
            r.bookId === bookId && r.status === 'active'
        );
        
        if (activeReservations.length > 0) {
            throw new Error('Không thể xóa sách đang được đặt trước');
        }
        
        books.splice(bookIndex, 1);
        saveAllData();
        
        // Log activity
        logActivity('delete_book', `Xóa sách: ${book.title} (ISBN: ${book.isbn})`);
        
        return true;
    } catch (error) {
        console.error('Error deleting book:', error);
        throw error;
    }
}

function getBook(bookId) {
    return books.find(b => b.id === bookId);
}

function getBookByISBN(isbn) {
    return books.find(b => b.isbn === isbn);
}

function searchBooks(searchTerm, filters = {}) {
    let filteredBooks = [...books];
    
    // Apply text search
    if (searchTerm) {
        const searchFilter = createSearchFilter(searchTerm, [
            'title', 'isbn', 'description', 'location', 'tags'
        ]);
        filteredBooks = filteredBooks.filter(searchFilter);
    }
    
    // Apply filters
    if (filters.categoryId) {
        filteredBooks = filteredBooks.filter(b => b.categoryId === filters.categoryId);
    }
    
    if (filters.authorId) {
        filteredBooks = filteredBooks.filter(b => b.authorId === filters.authorId);
    }
    
    if (filters.publisherId) {
        filteredBooks = filteredBooks.filter(b => b.publisherId === filters.publisherId);
    }
    
    if (filters.language) {
        filteredBooks = filteredBooks.filter(b => b.language === filters.language);
    }
    
    if (filters.status) {
        filteredBooks = filteredBooks.filter(b => b.status === filters.status);
    }
    
    if (filters.availability === 'available') {
        filteredBooks = filteredBooks.filter(b => b.availableCopies > 0);
    } else if (filters.availability === 'unavailable') {
        filteredBooks = filteredBooks.filter(b => b.availableCopies === 0);
    }
    
    if (filters.condition) {
        filteredBooks = filteredBooks.filter(b => b.condition === filters.condition);
    }
    
    return filteredBooks;
}

function updateBookAvailability(bookId) {
    const book = books.find(b => b.id === bookId);
    if (!book) return;
    
    const activeBorrows = borrowRecords.filter(br => 
        br.bookId === bookId && br.status === 'borrowed'
    ).length;
    
    const activeReservations = reservations.filter(r => 
        r.bookId === bookId && r.status === 'active'
    ).length;
    
    book.borrowedCopies = activeBorrows;
    book.reservedCopies = activeReservations;
    book.availableCopies = book.totalCopies - activeBorrows - activeReservations;
    
    // Update status
    if (book.availableCopies > 0) {
        book.status = 'available';
    } else if (book.borrowedCopies > 0) {
        book.status = 'borrowed';
    } else {
        book.status = 'reserved';
    }
}

function updateAllBookAvailability() {
    books.forEach(book => {
        updateBookAvailability(book.id);
    });
}

// Borrow/Return management functions
function borrowBook(readerId, bookId, notes = '') {
    try {
        const reader = getReader(readerId);
        const book = getBook(bookId);
        
        if (!reader) {
            throw new Error('Không tìm thấy độc giả');
        }
        
        if (!book) {
            throw new Error('Không tìm thấy sách');
        }
        
        // Check reader status
        if (reader.status !== 'active') {
            throw new Error('Độc giả không được phép mượn sách');
        }
        
        // Check borrow limit
        if (reader.currentBorrows >= reader.borrowLimit) {
            throw new Error(`Độc giả đã mượn tối đa ${reader.borrowLimit} cuốn sách`);
        }
        
        // Check book availability
        if (book.availableCopies <= 0) {
            throw new Error('Sách không có sẵn để mượn');
        }
        
        // Check if reader already borrowed this book
        const existingBorrow = borrowRecords.find(br => 
            br.readerId === readerId && 
            br.bookId === bookId && 
            br.status === 'borrowed'
        );
        
        if (existingBorrow) {
            throw new Error('Độc giả đã mượn cuốn sách này');
        }
        
        // Check for unpaid fines
        if (reader.fineAmount > 0) {
            throw new Error('Độc giả có phí phạt chưa thanh toán');
        }
        
        // Create borrow record
        const borrowRecord = {
            id: generateId(),
            readerId: readerId,
            bookId: bookId,
            borrowDate: new Date(),
            dueDate: new Date(Date.now() + (systemSettings.maxBorrowDays || 14) * 24 * 60 * 60 * 1000),
            returnDate: null,
            status: 'borrowed',
            renewalCount: 0,
            notes: notes,
            librarian: currentUser?.username || 'system'
        };
        
        borrowRecords.push(borrowRecord);
        
        // Update reader
        reader.currentBorrows++;
        reader.totalBorrows++;
        reader.lastActivity = new Date();
        
        // Update book
        book.lastBorrowed = new Date();
        updateBookAvailability(bookId);
        
        saveAllData();
        
        // Log activity
        logActivity('borrow_book', `${reader.fullName} mượn sách: ${book.title}`, {
            readerId: readerId,
            bookId: bookId,
            dueDate: borrowRecord.dueDate
        });
        
        return borrowRecord;
    } catch (error) {
        console.error('Error borrowing book:', error);
        throw error;
    }
}

function returnBook(borrowRecordId, condition = 'Tốt', notes = '') {
    try {
        const borrowIndex = borrowRecords.findIndex(br => br.id === borrowRecordId);
        if (borrowIndex === -1) {
            throw new Error('Không tìm thấy phiếu mượn');
        }
        
        const borrowRecord = borrowRecords[borrowIndex];
        
        if (borrowRecord.status !== 'borrowed' && borrowRecord.status !== 'overdue') {
            throw new Error('Sách đã được trả');
        }
        
        const reader = getReader(borrowRecord.readerId);
        const book = getBook(borrowRecord.bookId);
        
        if (!reader || !book) {
            throw new Error('Không tìm thấy thông tin độc giả hoặc sách');
        }
        
        const returnDate = new Date();
        
        // Update borrow record
        borrowRecord.returnDate = returnDate;
        borrowRecord.status = 'returned';
        borrowRecord.notes += (borrowRecord.notes ? '\n' : '') + `Trả ngày ${formatDate(returnDate)}. ${notes}`;
        
        // Update reader
        reader.currentBorrows = Math.max(0, reader.currentBorrows - 1);
        reader.lastActivity = returnDate;
        
        // Update book condition if changed
        if (condition !== book.condition) {
            book.condition = condition;
        }
        
        // Check for overdue and create fine if necessary
        if (returnDate > borrowRecord.dueDate) {
            const overdueDays = Math.ceil((returnDate - borrowRecord.dueDate) / (24 * 60 * 60 * 1000));
            const fineAmount = overdueDays * (systemSettings.finePerDay || 2000);
            
            createFine(borrowRecordId, reader.id, fineAmount, `Trả sách quá hạn ${overdueDays} ngày`);
        }
        
        // Update book availability
        updateBookAvailability(borrowRecord.bookId);
        
        saveAllData();
        
        // Log activity
        logActivity('return_book', `${reader.fullName} trả sách: ${book.title}`, {
            readerId: reader.id,
            bookId: book.id,
            returnDate: returnDate,
            isOverdue: returnDate > borrowRecord.dueDate
        });
        
        // Check for reservations and notify
        checkAndNotifyReservations(borrowRecord.bookId);
        
        return borrowRecord;
    } catch (error) {
        console.error('Error returning book:', error);
        throw error;
    }
}

function renewBook(borrowRecordId, reason = '') {
    try {
        const borrowRecord = borrowRecords.find(br => br.id === borrowRecordId);
        if (!borrowRecord) {
            throw new Error('Không tìm thấy phiếu mượn');
        }
        
        if (borrowRecord.status !== 'borrowed') {
            throw new Error('Chỉ có thể gia hạn sách đang mượn');
        }
        
        const reader = getReader(borrowRecord.readerId);
        const book = getBook(borrowRecord.bookId);
        
        if (!reader || !book) {
            throw new Error('Không tìm thấy thông tin độc giả hoặc sách');
        }
        
        // Check renewal limit
        if (borrowRecord.renewalCount >= (systemSettings.maxRenewals || 2)) {
            throw new Error(`Đã gia hạn tối đa ${systemSettings.maxRenewals || 2} lần`);
        }
        
        // Check if book is reserved by someone else
        const hasReservations = reservations.some(r => 
            r.bookId === borrowRecord.bookId && 
            r.readerId !== borrowRecord.readerId && 
            r.status === 'active'
        );
        
        if (hasReservations) {
            throw new Error('Sách đã được đặt trước bởi độc giả khác');
        }
        
        // Check for overdue
        if (new Date() > borrowRecord.dueDate) {
            throw new Error('Không thể gia hạn sách quá hạn');
        }
        
        // Check for unpaid fines
        if (reader.fineAmount > 0) {
            throw new Error('Độc giả có phí phạt chưa thanh toán');
        }
        
        // Create renewal record
        const renewal = {
            id: generateId(),
            borrowRecordId: borrowRecordId,
            readerId: borrowRecord.readerId,
            bookId: borrowRecord.bookId,
            renewalDate: new Date(),
            newDueDate: new Date(borrowRecord.dueDate.getTime() + (systemSettings.maxBorrowDays || 14) * 24 * 60 * 60 * 1000),
            reason: reason,
            approvedBy: currentUser?.username || 'system',
            status: 'approved'
        };
        
        renewals.push(renewal);
        
        // Update borrow record
        borrowRecord.dueDate = renewal.newDueDate;
        borrowRecord.renewalCount++;
        borrowRecord.notes += (borrowRecord.notes ? '\n' : '') + `Gia hạn lần ${borrowRecord.renewalCount} đến ${formatDate(renewal.newDueDate)}`;
        
        // Update reader activity
        reader.lastActivity = new Date();
        
        saveAllData();
        
        // Log activity
        logActivity('renew_book', `${reader.fullName} gia hạn sách: ${book.title}`, {
            readerId: reader.id,
            bookId: book.id,
            newDueDate: renewal.newDueDate,
            renewalCount: borrowRecord.renewalCount
        });
        
        return renewal;
    } catch (error) {
        console.error('Error renewing book:', error);
        throw error;
    }
}

function getBorrowRecords(filters = {}) {
    let filteredRecords = [...borrowRecords];
    
    if (filters.readerId) {
        filteredRecords = filteredRecords.filter(br => br.readerId === filters.readerId);
    }
    
    if (filters.bookId) {
        filteredRecords = filteredRecords.filter(br => br.bookId === filters.bookId);
    }
    
    if (filters.status) {
        filteredRecords = filteredRecords.filter(br => br.status === filters.status);
    }
    
    if (filters.overdue) {
        const now = new Date();
        filteredRecords = filteredRecords.filter(br => 
            br.status === 'borrowed' && br.dueDate < now
        );
    }
    
    if (filters.dueToday) {
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
        
        filteredRecords = filteredRecords.filter(br => 
            br.status === 'borrowed' && 
            br.dueDate >= today && 
            br.dueDate < tomorrow
        );
    }
    
    return filteredRecords;
}

function getOverdueBooks(status = 'all', searchTerm = '') {
    const now = new Date();
    let overdueRecords = borrowRecords.filter(br => 
        br.status === 'borrowed' && br.dueDate < now
    );
    
    // Update status to overdue
    overdueRecords.forEach(record => {
        record.status = 'overdue';
    });
    
    // Apply search filter
    if (searchTerm) {
        overdueRecords = overdueRecords.filter(record => {
            const reader = getReader(record.readerId);
            const book = getBook(record.bookId);
            
            if (!reader || !book) return false;
            
            const searchText = `${reader.fullName} ${reader.studentId} ${book.title}`.toLowerCase();
            return removeAccents(searchText).includes(removeAccents(searchTerm.toLowerCase()));
        });
    }
    
    return overdueRecords.map(record => {
        const reader = getReader(record.readerId);
        const book = getBook(record.bookId);
        const overdueDays = Math.ceil((now - record.dueDate) / (24 * 60 * 60 * 1000));
        
        return {
            ...record,
            reader: reader,
            book: book,
            overdueDays: overdueDays,
            fineAmount: overdueDays * (systemSettings.finePerDay || 2000)
        };
    });
}

function getOverdueReaderIds() {
    const overdueRecords = getOverdueBooks();
    return [...new Set(overdueRecords.map(record => record.readerId))];
}

// Fine management functions
function createFine(borrowRecordId, readerId, amount, reason) {
    try {
        const fine = {
            id: generateId(),
            borrowRecordId: borrowRecordId,
            readerId: readerId,
            amount: amount,
            reason: reason,
            issueDate: new Date(),
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days to pay
            paidDate: null,
            status: 'unpaid',
            notes: '',
            issuedBy: currentUser?.username || 'system'
        };
        
        fines.push(fine);
        
        // Update reader fine amount
        const reader = getReader(readerId);
        if (reader) {
            reader.fineAmount = (reader.fineAmount || 0) + amount;
            
            // Update reader status if fine amount is high
            if (reader.fineAmount >= 50000) { // 50,000 VND
                reader.status = 'suspended';
            } else if (reader.fineAmount >= 20000) { // 20,000 VND
                reader.status = 'warning';
            }
        }
        
        saveAllData();
        
        // Log activity
        logActivity('create_fine', `Tạo phí phạt ${formatCurrency(amount)} cho độc giả ${reader?.fullName}`, {
            fineId: fine.id,
            readerId: readerId,
            amount: amount,
            reason: reason
        });
        
        return fine;
    } catch (error) {
        console.error('Error creating fine:', error);
        throw error;
    }
}

function payFine(fineId, paymentMethod = 'cash', notes = '') {
    try {
        const fine = fines.find(f => f.id === fineId);
        if (!fine) {
            throw new Error('Không tìm thấy phí phạt');
        }
        
        if (fine.status === 'paid') {
            throw new Error('Phí phạt đã được thanh toán');
        }
        
        const reader = getReader(fine.readerId);
        if (!reader) {
            throw new Error('Không tìm thấy độc giả');
        }
        
        // Update fine
        fine.paidDate = new Date();
        fine.status = 'paid';
        fine.notes += (fine.notes ? '\n' : '') + `Thanh toán ${paymentMethod} ngày ${formatDate(fine.paidDate)}. ${notes}`;
        
        // Update reader fine amount
        reader.fineAmount = Math.max(0, reader.fineAmount - fine.amount);
        
        // Update reader status
        if (reader.fineAmount === 0 && reader.status === 'suspended') {
            reader.status = 'active';
        } else if (reader.fineAmount < 20000 && reader.status === 'warning') {
            reader.status = 'active';
        }
        
        reader.lastActivity = new Date();
        
        saveAllData();
        
        // Log activity
        logActivity('pay_fine', `${reader.fullName} thanh toán phí phạt ${formatCurrency(fine.amount)}`, {
            fineId: fineId,
            readerId: reader.id,
            amount: fine.amount,
            paymentMethod: paymentMethod
        });
        
        return fine;
    } catch (error) {
        console.error('Error paying fine:', error);
        throw error;
    }
}

function getFines(filters = {}) {
    let filteredFines = [...fines];
    
    if (filters.readerId) {
        filteredFines = filteredFines.filter(f => f.readerId === filters.readerId);
    }
    
    if (filters.status) {
        filteredFines = filteredFines.filter(f => f.status === filters.status);
    }
    
    if (filters.overdue) {
        const now = new Date();
        filteredFines = filteredFines.filter(f => 
            f.status === 'unpaid' && f.dueDate < now
        );
    }
    
    return filteredFines;
}

// Reservation management functions
function reserveBook(readerId, bookId, notes = '') {
    try {
        const reader = getReader(readerId);
        const book = getBook(bookId);
        
        if (!reader) {
            throw new Error('Không tìm thấy độc giả');
        }
        
        if (!book) {
            throw new Error('Không tìm thấy sách');
        }
        
        // Check reader status
        if (reader.status !== 'active') {
            throw new Error('Độc giả không được phép đặt trước sách');
        }
        
        // Check if book is available
        if (book.availableCopies > 0) {
            throw new Error('Sách đang có sẵn, không cần đặt trước');
        }
        
        // Check if reader already reserved this book
        const existingReservation = reservations.find(r => 
            r.readerId === readerId && 
            r.bookId === bookId && 
            r.status === 'active'
        );
        
        if (existingReservation) {
            throw new Error('Độc giả đã đặt trước cuốn sách này');
        }
        
        // Check if reader already borrowed this book
        const existingBorrow = borrowRecords.find(br => 
            br.readerId === readerId && 
            br.bookId === bookId && 
            br.status === 'borrowed'
        );
        
        if (existingBorrow) {
            throw new Error('Độc giả đang mượn cuốn sách này');
        }
        
        // Get next priority number
        const existingReservations = reservations.filter(r => 
            r.bookId === bookId && r.status === 'active'
        );
        const priority = existingReservations.length + 1;
        
        // Create reservation
        const reservation = {
            id: generateId(),
            readerId: readerId,
            bookId: bookId,
            reservationDate: new Date(),
            expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            status: 'active',
            priority: priority,
            notes: notes,
            notificationSent: false
        };
        
        reservations.push(reservation);
        
        // Update book availability
        updateBookAvailability(bookId);
        
        // Update reader activity
        reader.lastActivity = new Date();
        
        saveAllData();
        
        // Log activity
        logActivity('reserve_book', `${reader.fullName} đặt trước sách: ${book.title}`, {
            readerId: readerId,
            bookId: bookId,
            priority: priority
        });
        
        return reservation;
    } catch (error) {
        console.error('Error reserving book:', error);
        throw error;
    }
}

function cancelReservation(reservationId) {
    try {
        const reservationIndex = reservations.findIndex(r => r.id === reservationId);
        if (reservationIndex === -1) {
            throw new Error('Không tìm thấy đặt trước');
        }
        
        const reservation = reservations[reservationIndex];
        const reader = getReader(reservation.readerId);
        const book = getBook(reservation.bookId);
        
        // Update reservation status
        reservation.status = 'cancelled';
        
        // Update priorities for remaining reservations
        const remainingReservations = reservations.filter(r => 
            r.bookId === reservation.bookId && 
            r.status === 'active' && 
            r.priority > reservation.priority
        );
        
        remainingReservations.forEach(r => {
            r.priority--;
        });
        
        // Update book availability
        updateBookAvailability(reservation.bookId);
        
        saveAllData();
        
        // Log activity
        logActivity('cancel_reservation', `${reader?.fullName} hủy đặt trước sách: ${book?.title}`);
        
        return reservation;
    } catch (error) {
        console.error('Error cancelling reservation:', error);
        throw error;
    }
}

function checkAndNotifyReservations(bookId) {
    const activeReservations = reservations.filter(r => 
        r.bookId === bookId && 
        r.status === 'active'
    ).sort((a, b) => a.priority - b.priority);
    
    if (activeReservations.length > 0) {
        const nextReservation = activeReservations[0];
        const reader = getReader(nextReservation.readerId);
        const book = getBook(bookId);
        
        if (reader && book) {
            // Mark as notified
            nextReservation.notificationSent = true;
            
            // Create notification
            showNotification(
                `Sách "${book.title}" đã có sẵn cho ${reader.fullName}`,
                'info',
                0,
                true
            );
            
            // Log activity
            logActivity('notify_reservation', `Thông báo sách có sẵn cho ${reader.fullName}: ${book.title}`);
        }
    }
}

// Category management functions
function addCategory(categoryData) {
    try {
        if (!categoryData.name) {
            throw new Error('Tên thể loại là bắt buộc');
        }
        
        // Check for duplicate name
        if (categories.find(c => c.name.toLowerCase() === categoryData.name.toLowerCase())) {
            throw new Error('Tên thể loại đã tồn tại');
        }
        
        const newCategory = {
            id: generateId(),
            name: categoryData.name,
            description: categoryData.description || '',
            color: categoryData.color || '#007bff'
        };
        
        categories.push(newCategory);
        saveAllData();
        
        logActivity('add_category', `Thêm thể loại mới: ${newCategory.name}`);
        
        return newCategory;
    } catch (error) {
        console.error('Error adding category:', error);
        throw error;
    }
}

function updateCategory(categoryId, categoryData) {
    try {
        const categoryIndex = categories.findIndex(c => c.id === categoryId);
        if (categoryIndex === -1) {
            throw new Error('Không tìm thấy thể loại');
        }
        
        categories[categoryIndex] = {
            ...categories[categoryIndex],
            ...categoryData,
            id: categoryId
        };
        
        saveAllData();
        
        logActivity('update_category', `Cập nhật thể loại: ${categories[categoryIndex].name}`);
        
        return categories[categoryIndex];
    } catch (error) {
        console.error('Error updating category:', error);
        throw error;
    }
}

function deleteCategory(categoryId) {
    try {
        const categoryIndex = categories.findIndex(c => c.id === categoryId);
        if (categoryIndex === -1) {
            throw new Error('Không tìm thấy thể loại');
        }
        
        // Check if category is being used
        const booksInCategory = books.filter(b => b.categoryId === categoryId);
        if (booksInCategory.length > 0) {
            throw new Error('Không thể xóa thể loại đang được sử dụng');
        }
        
        const category = categories[categoryIndex];
        categories.splice(categoryIndex, 1);
        saveAllData();
        
        logActivity('delete_category', `Xóa thể loại: ${category.name}`);
        
        return true;
    } catch (error) {
        console.error('Error deleting category:', error);
        throw error;
    }
}

// Author management functions
function addAuthor(authorData) {
    try {
        if (!authorData.name) {
            throw new Error('Tên tác giả là bắt buộc');
        }
        
        const newAuthor = {
            id: generateId(),
            name: authorData.name,
            biography: authorData.biography || '',
            nationality: authorData.nationality || ''
        };
        
        authors.push(newAuthor);
        saveAllData();
        
        logActivity('add_author', `Thêm tác giả mới: ${newAuthor.name}`);
        
        return newAuthor;
    } catch (error) {
        console.error('Error adding author:', error);
        throw error;
    }
}

// Publisher management functions
function addPublisher(publisherData) {
    try {
        if (!publisherData.name) {
            throw new Error('Tên nhà xuất bản là bắt buộc');
        }
        
        const newPublisher = {
            id: generateId(),
            name: publisherData.name,
            address: publisherData.address || '',
            phone: publisherData.phone || '',
            email: publisherData.email || ''
        };
        
        publishers.push(newPublisher);
        saveAllData();
        
        logActivity('add_publisher', `Thêm nhà xuất bản mới: ${newPublisher.name}`);
        
        return newPublisher;
    } catch (error) {
        console.error('Error adding publisher:', error);
        throw error;
    }
}

// Statistics functions
function getStatistics() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return {
        readers: {
            total: readers.length,
            active: readers.filter(r => r.status === 'active').length,
            warning: readers.filter(r => r.status === 'warning').length,
            suspended: readers.filter(r => r.status === 'suspended').length
        },
        books: {
            total: books.reduce((sum, book) => sum + book.totalCopies, 0),
            available: books.reduce((sum, book) => sum + book.availableCopies, 0),
            borrowed: books.reduce((sum, book) => sum + book.borrowedCopies, 0),
            reserved: books.reduce((sum, book) => sum + book.reservedCopies, 0),
            titles: books.length
        },
        borrows: {
            total: borrowRecords.length,
            active: borrowRecords.filter(br => br.status === 'borrowed').length,
            overdue: borrowRecords.filter(br => br.status === 'overdue').length,
            today: borrowRecords.filter(br => br.borrowDate >= today).length,
            thisWeek: borrowRecords.filter(br => br.borrowDate >= thisWeek).length,
            thisMonth: borrowRecords.filter(br => br.borrowDate >= thisMonth).length
        },
        returns: {
            today: borrowRecords.filter(br => br.returnDate && br.returnDate >= today).length,
            thisWeek: borrowRecords.filter(br => br.returnDate && br.returnDate >= thisWeek).length,
            thisMonth: borrowRecords.filter(br => br.returnDate && br.returnDate >= thisMonth).length
        },
        fines: {
            total: fines.length,
            unpaid: fines.filter(f => f.status === 'unpaid').length,
            totalAmount: fines.reduce((sum, fine) => sum + fine.amount, 0),
            unpaidAmount: fines.filter(f => f.status === 'unpaid').reduce((sum, fine) => sum + fine.amount, 0)
        },
        reservations: {
            active: reservations.filter(r => r.status === 'active').length,
            total: reservations.length
        }
    };
}

// Data export/import functions
function exportData(format = 'json') {
    const data = {
        readers: readers,
        books: books,
        borrowRecords: borrowRecords,
        categories: categories,
        authors: authors,
        publishers: publishers,
        fines: fines,
        renewals: renewals,
        reservations: reservations,
        exportDate: new Date().toISOString(),
        version: '1.0'
    };
    
    const filename = `library_data_${formatDate(new Date(), 'yyyy-mm-dd')}.${format}`;
    
    if (format === 'json') {
        downloadFile(JSON.stringify(data, null, 2), filename, 'application/json');
    } else if (format === 'csv') {
        // Export each table as separate CSV
        exportToCSV(readers, `readers_${formatDate(new Date(), 'yyyy-mm-dd')}.csv`);
        exportToCSV(books, `books_${formatDate(new Date(), 'yyyy-mm-dd')}.csv`);
        exportToCSV(borrowRecords, `borrow_records_${formatDate(new Date(), 'yyyy-mm-dd')}.csv`);
        exportToCSV(fines, `fines_${formatDate(new Date(), 'yyyy-mm-dd')}.csv`);
    }
    
    logActivity('export_data', `Xuất dữ liệu định dạng ${format.toUpperCase()}`);
    
    return true;
}

function importData(jsonData) {
    try {
        const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
        
        // Validate data structure
        if (!data.readers || !data.books || !data.borrowRecords) {
            throw new Error('Dữ liệu không đúng định dạng');
        }
        
        // Backup current data
        const backup = {
            readers: [...readers],
            books: [...books],
            borrowRecords: [...borrowRecords],
            categories: [...categories],
            authors: [...authors],
            publishers: [...publishers],
            fines: [...fines],
            renewals: [...renewals],
            reservations: [...reservations]
        };
        
        // Import data
        readers = data.readers || [];
        books = data.books || [];
        borrowRecords = data.borrowRecords || [];
        categories = data.categories || [];
        authors = data.authors || [];
        publishers = data.publishers || [];
        fines = data.fines || [];
        renewals = data.renewals || [];
        reservations = data.reservations || [];
        
        // Convert date strings back to Date objects
        convertStringDatesToObjects();
        
        // Validate and fix data integrity
        validateDataIntegrity();
        
        // Save imported data
        saveAllData();
        
        logActivity('import_data', `Nhập dữ liệu thành công từ file backup`);
        
        return {
            success: true,
            message: 'Nhập dữ liệu thành công',
            backup: backup
        };
    } catch (error) {
        console.error('Error importing data:', error);
        throw new Error(`Lỗi nhập dữ liệu: ${error.message}`);
    }
}

function resetData() {
    try {
        // Clear all data
        readers = [];
        books = [];
        borrowRecords = [];
        categories = [];
        authors = [];
        publishers = [];
        fines = [];
        renewals = [];
        reservations = [];
        
        // Clear localStorage
        const keysToRemove = [
            'readers', 'books', 'borrowRecords', 'categories', 
            'authors', 'publishers', 'fines', 'renewals', 'reservations'
        ];
        
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
        });
        
        logActivity('reset_data', 'Xóa toàn bộ dữ liệu hệ thống');
        
        return true;
    } catch (error) {
        console.error('Error resetting data:', error);
        throw error;
    }
}

// Advanced search functions
function advancedSearch(searchParams) {
    const results = {
        readers: [],
        books: [],
        borrowRecords: []
    };
    
    // Search readers
    if (searchParams.searchReaders) {
        results.readers = searchReaders(searchParams.searchTerm, {
            className: searchParams.className,
            status: searchParams.readerStatus,
            gender: searchParams.gender,
            hasOverdue: searchParams.hasOverdue,
            hasFines: searchParams.hasFines
        });
    }
    
    // Search books
    if (searchParams.searchBooks) {
        results.books = searchBooks(searchParams.searchTerm, {
            categoryId: searchParams.categoryId,
            authorId: searchParams.authorId,
            publisherId: searchParams.publisherId,
            language: searchParams.language,
            status: searchParams.bookStatus,
            availability: searchParams.availability,
            condition: searchParams.condition
        });
    }
    
    // Search borrow records
    if (searchParams.searchBorrows) {
        results.borrowRecords = getBorrowRecords({
            status: searchParams.borrowStatus,
            overdue: searchParams.overdue,
            dueToday: searchParams.dueToday
        });
        
        // Apply text search to borrow records
        if (searchParams.searchTerm) {
            results.borrowRecords = results.borrowRecords.filter(record => {
                const reader = getReader(record.readerId);
                const book = getBook(record.bookId);
                
                if (!reader || !book) return false;
                
                const searchText = `${reader.fullName} ${reader.studentId} ${book.title} ${book.isbn}`.toLowerCase();
                return removeAccents(searchText).includes(removeAccents(searchParams.searchTerm.toLowerCase()));
            });
        }
    }
    
    return results;
}

// Report generation functions
function generateBorrowReport(startDate, endDate, groupBy = 'day') {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    const borrowsInPeriod = borrowRecords.filter(br => 
        br.borrowDate >= start && br.borrowDate <= end
    );
    
    const returnsInPeriod = borrowRecords.filter(br => 
        br.returnDate && br.returnDate >= start && br.returnDate <= end
    );
    
    // Group data by specified period
    const groupedData = {};
    
    borrowsInPeriod.forEach(record => {
        const key = getGroupKey(record.borrowDate, groupBy);
        if (!groupedData[key]) {
            groupedData[key] = { borrows: 0, returns: 0, date: record.borrowDate };
        }
        groupedData[key].borrows++;
    });
    
    returnsInPeriod.forEach(record => {
        const key = getGroupKey(record.returnDate, groupBy);
        if (!groupedData[key]) {
            groupedData[key] = { borrows: 0, returns: 0, date: record.returnDate };
        }
        groupedData[key].returns++;
    });
    
    return {
        period: { start: startDate, end: endDate },
        groupBy: groupBy,
        data: Object.keys(groupedData).map(key => ({
            period: key,
            date: groupedData[key].date,
            borrows: groupedData[key].borrows,
            returns: groupedData[key].returns
        })).sort((a, b) => a.date - b.date),
        summary: {
            totalBorrows: borrowsInPeriod.length,
            totalReturns: returnsInPeriod.length,
            avgBorrowsPerDay: borrowsInPeriod.length / Math.max(1, Math.ceil((end - start) / (24 * 60 * 60 * 1000))),
            avgReturnsPerDay: returnsInPeriod.length / Math.max(1, Math.ceil((end - start) / (24 * 60 * 60 * 1000)))
        }
    };
}

function generateReaderReport(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    const activeReaders = readers.filter(r => 
        r.lastActivity >= start && r.lastActivity <= end
    );
    
    const newReaders = readers.filter(r => 
        r.registrationDate >= start && r.registrationDate <= end
    );
    
    // Group by class
    const classSummary = {};
    readers.forEach(reader => {
        if (!classSummary[reader.className]) {
            classSummary[reader.className] = {
                total: 0,
                active: 0,
                withFines: 0,
                totalBorrows: 0
            };
        }
        
        classSummary[reader.className].total++;
        if (reader.status === 'active') classSummary[reader.className].active++;
        if (reader.fineAmount > 0) classSummary[reader.className].withFines++;
        classSummary[reader.className].totalBorrows += reader.totalBorrows;
    });
    
    return {
        period: { start: startDate, end: endDate },
        summary: {
            totalReaders: readers.length,
            activeReaders: activeReaders.length,
            newReaders: newReaders.length,
            readersWithFines: readers.filter(r => r.fineAmount > 0).length,
            suspendedReaders: readers.filter(r => r.status === 'suspended').length
        },
        classSummary: Object.keys(classSummary).map(className => ({
            className: className,
            ...classSummary[className],
            avgBorrowsPerReader: classSummary[className].totalBorrows / classSummary[className].total
        })).sort((a, b) => a.className.localeCompare(b.className)),
        topReaders: readers
            .filter(r => r.lastActivity >= start && r.lastActivity <= end)
            .sort((a, b) => b.totalBorrows - a.totalBorrows)
            .slice(0, 10)
            .map(r => ({
                id: r.id,
                fullName: r.fullName,
                studentId: r.studentId,
                className: r.className,
                totalBorrows: r.totalBorrows,
                currentBorrows: r.currentBorrows,
                fineAmount: r.fineAmount
            }))
    };
}

function generateBookReport(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    const borrowsInPeriod = borrowRecords.filter(br => 
        br.borrowDate >= start && br.borrowDate <= end
    );
    
    // Count borrows per book
    const bookBorrowCounts = {};
    borrowsInPeriod.forEach(record => {
        if (!bookBorrowCounts[record.bookId]) {
            bookBorrowCounts[record.bookId] = 0;
        }
        bookBorrowCounts[record.bookId]++;
    });
    
    // Group by category
    const categorySummary = {};
    categories.forEach(category => {
        const booksInCategory = books.filter(b => b.categoryId === category.id);
        const borrowsInCategory = borrowsInPeriod.filter(br => {
            const book = getBook(br.bookId);
            return book && book.categoryId === category.id;
        });
        
        categorySummary[category.id] = {
            categoryName: category.name,
            totalBooks: booksInCategory.reduce((sum, book) => sum + book.totalCopies, 0),
            availableBooks: booksInCategory.reduce((sum, book) => sum + book.availableCopies, 0),
            borrowsInPeriod: borrowsInCategory.length,
            popularityRank: 0
        };
    });
    
    // Calculate popularity ranks
    const sortedCategories = Object.values(categorySummary)
        .sort((a, b) => b.borrowsInPeriod - a.borrowsInPeriod);
    
    sortedCategories.forEach((category, index) => {
        category.popularityRank = index + 1;
    });
    
    return {
        period: { start: startDate, end: endDate },
        summary: {
            totalBooks: books.reduce((sum, book) => sum + book.totalCopies, 0),
            totalTitles: books.length,
            availableBooks: books.reduce((sum, book) => sum + book.availableCopies, 0),
            borrowedBooks: books.reduce((sum, book) => sum + book.borrowedCopies, 0),
            borrowsInPeriod: borrowsInPeriod.length
        },
        categorySummary: sortedCategories,
        popularBooks: Object.keys(bookBorrowCounts)
            .map(bookId => {
                const book = getBook(bookId);
                const category = categories.find(c => c.id === book?.categoryId);
                const author = authors.find(a => a.id === book?.authorId);
                
                return {
                    bookId: bookId,
                    title: book?.title || 'Unknown',
                    author: author?.name || 'Unknown',
                    category: category?.name || 'Unknown',
                    borrowCount: bookBorrowCounts[bookId],
                    totalCopies: book?.totalCopies || 0,
                    availableCopies: book?.availableCopies || 0
                };
            })
            .sort((a, b) => b.borrowCount - a.borrowCount)
            .slice(0, 20),
        leastPopularBooks: books
            .filter(book => !bookBorrowCounts[book.id])
            .map(book => {
                const category = categories.find(c => c.id === book.categoryId);
                const author = authors.find(a => a.id === book.authorId);
                
                return {
                    bookId: book.id,
                    title: book.title,
                    author: author?.name || 'Unknown',
                    category: category?.name || 'Unknown',
                    borrowCount: 0,
                    totalCopies: book.totalCopies,
                    availableCopies: book.availableCopies,
                    addedDate: book.addedDate
                };
            })
            .sort((a, b) => b.addedDate - a.addedDate)
            .slice(0, 20)
    };
}

function generateFineReport(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    const finesInPeriod = fines.filter(f => 
        f.issueDate >= start && f.issueDate <= end
    );
    
    const paidFinesInPeriod = fines.filter(f => 
        f.paidDate && f.paidDate >= start && f.paidDate <= end
    );
    
    // Group by reader
    const readerFines = {};
    finesInPeriod.forEach(fine => {
        if (!readerFines[fine.readerId]) {
            readerFines[fine.readerId] = {
                totalFines: 0,
                totalAmount: 0,
                paidAmount: 0,
                unpaidAmount: 0
            };
        }
        
        readerFines[fine.readerId].totalFines++;
        readerFines[fine.readerId].totalAmount += fine.amount;
        
        if (fine.status === 'paid') {
            readerFines[fine.readerId].paidAmount += fine.amount;
        } else {
            readerFines[fine.readerId].unpaidAmount += fine.amount;
        }
    });
    
    return {
        period: { start: startDate, end: endDate },
        summary: {
            totalFines: finesInPeriod.length,
            totalAmount: finesInPeriod.reduce((sum, fine) => sum + fine.amount, 0),
            paidFines: paidFinesInPeriod.length,
            paidAmount: paidFinesInPeriod.reduce((sum, fine) => sum + fine.amount, 0),
            unpaidFines: fines.filter(f => f.status === 'unpaid').length,
            unpaidAmount: fines.filter(f => f.status === 'unpaid').reduce((sum, fine) => sum + fine.amount, 0)
        },
        topFineReaders: Object.keys(readerFines)
            .map(readerId => {
                const reader = getReader(readerId);
                return {
                    readerId: readerId,
                    fullName: reader?.fullName || 'Unknown',
                    studentId: reader?.studentId || 'Unknown',
                    className: reader?.className || 'Unknown',
                    ...readerFines[readerId]
                };
            })
            .sort((a, b) => b.totalAmount - a.totalAmount)
            .slice(0, 20),
        dailyFines: generateDailyFineData(start, end)
    };
}

function generateDailyFineData(startDate, endDate) {
    const dailyData = {};
    const currentDate = new Date(startDate);
    
    // Initialize all dates with zero values
    while (currentDate <= endDate) {
        const dateKey = formatDate(currentDate, 'yyyy-mm-dd');
        dailyData[dateKey] = {
            date: new Date(currentDate),
            finesIssued: 0,
            amountIssued: 0,
            finesPaid: 0,
            amountPaid: 0
        };
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Add actual fine data
    fines.forEach(fine => {
        // Fines issued
        const issueKey = formatDate(fine.issueDate, 'yyyy-mm-dd');
        if (dailyData[issueKey]) {
            dailyData[issueKey].finesIssued++;
            dailyData[issueKey].amountIssued += fine.amount;
        }
        
        // Fines paid
        if (fine.paidDate) {
            const paidKey = formatDate(fine.paidDate, 'yyyy-mm-dd');
            if (dailyData[paidKey]) {
                dailyData[paidKey].finesPaid++;
                dailyData[paidKey].amountPaid += fine.amount;
            }
        }
    });
    
    return Object.values(dailyData).sort((a, b) => a.date - b.date);
}

function getGroupKey(date, groupBy) {
    const d = new Date(date);
    
    switch (groupBy) {
        case 'day':
            return formatDate(d, 'yyyy-mm-dd');
        case 'week':
            const weekStart = new Date(d);
            weekStart.setDate(d.getDate() - d.getDay());
            return `Week of ${formatDate(weekStart, 'yyyy-mm-dd')}`;
        case 'month':
            return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
        case 'year':
            return d.getFullYear().toString();
        default:
            return formatDate(d, 'yyyy-mm-dd');
    }
}

// Data maintenance functions
function cleanupExpiredReservations() {
    const now = new Date();
    let cleanedCount = 0;
    
    reservations.forEach(reservation => {
        if (reservation.status === 'active' && reservation.expiryDate < now) {
            reservation.status = 'expired';
            cleanedCount++;
            
            // Update book availability
            updateBookAvailability(reservation.bookId);
            
            // Log activity
            const reader = getReader(reservation.readerId);
            const book = getBook(reservation.bookId);
            logActivity('expire_reservation', 
                `Hết hạn đặt trước: ${reader?.fullName} - ${book?.title}`);
        }
    });
    
    if (cleanedCount > 0) {
        saveAllData();
        console.log(`Cleaned up ${cleanedCount} expired reservations`);
    }
    
    return cleanedCount;
}

function updateOverdueStatus() {
    const now = new Date();
    let updatedCount = 0;
    
    borrowRecords.forEach(record => {
        if (record.status === 'borrowed' && record.dueDate < now) {
            record.status = 'overdue';
            updatedCount++;
            
            // Update reader status if needed
            const reader = getReader(record.readerId);
            if (reader && reader.status === 'active') {
                const overdueCount = borrowRecords.filter(br => 
                    br.readerId === reader.id && br.status === 'overdue'
                ).length;
                
                if (overdueCount >= 3) {
                    reader.status = 'suspended';
                } else if (overdueCount >= 1) {
                    reader.status = 'warning';
                }
            }
        }
    });
    
    if (updatedCount > 0) {
        saveAllData();
        console.log(`Updated ${updatedCount} overdue records`);
    }
    
    return updatedCount;
}

function generateOverdueFines() {
    const now = new Date();
    let finesCreated = 0;
    
    const overdueRecords = borrowRecords.filter(br => 
        br.status === 'overdue' && 
        !fines.find(f => f.borrowRecordId === br.id)
    );
    
    overdueRecords.forEach(record => {
        const overdueDays = Math.ceil((now - record.dueDate) / (24 * 60 * 60 * 1000));
        const fineAmount = overdueDays * (systemSettings.finePerDay || 2000);
        
        createFine(
            record.id,
            record.readerId,
            fineAmount,
            `Trả sách quá hạn ${overdueDays} ngày`
        );
        
        finesCreated++;
    });
    
    if (finesCreated > 0) {
        console.log(`Created ${finesCreated} overdue fines`);
    }
    
    return finesCreated;
}

function performDailyMaintenance() {
    console.log('Performing daily maintenance...');
    
    const results = {
        expiredReservations: cleanupExpiredReservations(),
        overdueUpdates: updateOverdueStatus(),
        finesCreated: generateOverdueFines(),
        timestamp: new Date()
    };
    
    // Update all book availability
    updateAllBookAvailability();
    
    // Save maintenance log
    logActivity('daily_maintenance', 'Thực hiện bảo trì hàng ngày', results);
    
    console.log('Daily maintenance completed:', results);
    
    return results;
}

// Utility functions for data management
function getLowStockBooks(threshold = 2) {
    return books.filter(book => book.availableCopies <= threshold && book.availableCopies > 0);
}

function getPopularBooks(limit = 10, days = 30) {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const recentBorrows = borrowRecords.filter(br => br.borrowDate >= cutoffDate);
    
    const bookBorrowCounts = {};
    recentBorrows.forEach(record => {
        bookBorrowCounts[record.bookId] = (bookBorrowCounts[record.bookId] || 0) + 1;
    });
    
    return Object.keys(bookBorrowCounts)
        .map(bookId => ({
            book: getBook(bookId),
            borrowCount: bookBorrowCounts[bookId]
        }))
        .filter(item => item.book)
        .sort((a, b) => b.borrowCount - a.borrowCount)
        .slice(0, limit);
}

function getActiveReaders(days = 30) {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return readers.filter(reader => reader.lastActivity >= cutoffDate);
}

function getDueSoonBooks(days = 3) {
    const cutoffDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    
    return borrowRecords
        .filter(br => br.status === 'borrowed' && br.dueDate <= cutoffDate)
        .map(record => ({
            ...record,
            reader: getReader(record.readerId),
            book: getBook(record.bookId),
            daysUntilDue: Math.ceil((record.dueDate - new Date()) / (24 * 60 * 60 * 1000))
        }))
        .sort((a, b) => a.dueDate - b.dueDate);
}

// Initialize data when module loads
document.addEventListener('DOMContentLoaded', function() {
    initializeData();
    
    // Set up daily maintenance (run every hour to check)
    setInterval(() => {
        const now = new Date();
        const lastMaintenance = localStorage.getItem('lastMaintenanceDate');
        const today = formatDate(now, 'yyyy-mm-dd');
        
        if (lastMaintenance !== today) {
            performDailyMaintenance();
            localStorage.setItem('lastMaintenanceDate', today);
        }
    }, 60 * 60 * 1000); // Check every hour
});

// Export data management functions
window.dataManager = {
    // Reader functions
    addReader,
    updateReader,
    deleteReader,
    getReader,
    getReaderByStudentId,
    getReaderByCardNumber,
    searchReaders,
    
    // Book functions
    addBook,
    updateBook,
    deleteBook,
    getBook,
    getBookByISBN,
    searchBooks,
    updateBookAvailability,
    updateAllBookAvailability,
    
    // Borrow/Return functions
    borrowBook,
    returnBook,
    renewBook,
    getBorrowRecords,
    getOverdueBooks,
    
    // Fine functions
    createFine,
    payFine,
    getFines,
    
    // Reservation functions
    reserveBook,
    cancelReservation,
    
    // Category/Author/Publisher functions
    addCategory,
    updateCategory,
    deleteCategory,
    addAuthor,
    addPublisher,
    
    // Data access
    getAllReaders: () => readers,
    getAllBooks: () => books,
    getAllBorrowRecords: () => borrowRecords,
    getAllCategories: () => categories,
    getAllAuthors: () => authors,
    getAllPublishers: () => publishers,
    getAllFines: () => fines,
    getAllRenewals: () => renewals,
    getAllReservations: () => reservations,
    
    // Statistics and reports
    getStatistics,
    generateBorrowReport,
    generateReaderReport,
    generateBookReport,
    generateFineReport,
    
    // Utility functions
    getLowStockBooks,
    getPopularBooks,
    getActiveReaders,
    getDueSoonBooks,
    
    // Data management
    saveAllData,
    loadAllData,
    exportData,
    importData,
    resetData,
    performDailyMaintenance,
    
    // Advanced search
    advancedSearch
};
