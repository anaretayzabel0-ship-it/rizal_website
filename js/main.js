/**
 * SK FEDERATION - TRANSPARENT GOVERNANCE
 * Main Application Script
 */

// ==========================================
// DATA
// ==========================================

const DOCUMENTS_DATA = [
    {
        id: 1,
        category: 'Financial Transaction 2026',
        title: 'Quarterly Register of Cash in Bank (RCB)',
        barangay: 'san-roque',
        barangayName: 'San Roque',
        year: '2026',
        date: 'May 2026',
        comments: [
            {
                id: 1,
                author: 'Maria Reyes',
                initials: 'MR',
                time: '2 days ago',
                text: 'The cash flow summary is very transparent. Good work, SK!',
                isOfficial: false,
                likes: 4
            },
            {
                id: 2,
                author: 'SK Admin',
                initials: 'SK',
                time: '1 day ago',
                text: 'Thank you for your kind words. We are committed to transparency.',
                isOfficial: true,
                likes: 2
            },
            {
                id: 3,
                author: 'Anonymous',
                initials: null,
                time: '5 hours ago',
                text: 'When will the next quarterly report be released?',
                isOfficial: false,
                likes: 1,
                isGuest: true
            }
        ],
        description: 'Quarterly report of cash in bank transactions and balances for SK Federation funds.',
        isFeatured: true
    },
    {
        id: 2,
        category: 'Development Plan',
        title: 'Comprehensive Barangay Youth Development Plan (CBYDP) 2026',
        barangay: 'san-roque',
        barangayName: 'San Roque',
        year: '2026',
        date: 'May 2026',
        comments: [],
        description: 'Comprehensive 3-year development plan for youth programs and initiatives.',
        isFeatured: false
    },
    {
        id: 3,
        category: 'Investment Program',
        title: 'Annual Barangay Youth Investment Program (ABYIP) 2026',
        barangay: 'san-roque',
        barangayName: 'San Roque',
        year: '2026',
        date: 'May 2026',
        comments: [
            {
                id: 1,
                author: 'Juan Dela Cruz',
                initials: 'JD',
                time: '1 day ago',
                text: 'I support the livelihood programs included in this investment plan.',
                isOfficial: false,
                likes: 3
            }
        ],
        description: 'Annual budget allocation and investment priorities for youth development.',
        isFeatured: false
    },
    {
        id: 4,
        category: 'Procurement',
        title: 'SK Annual Procurement Plan 2026',
        barangay: 'san-pablo',
        barangayName: 'San Pablo',
        year: '2026',
        date: 'April 2026',
        comments: [
            {
                id: 1,
                author: 'Rosa Lim',
                initials: 'RL',
                time: '3 days ago',
                text: 'Is the bidding open to residents?',
                isOfficial: false,
                likes: 2
            },
            {
                id: 2,
                author: 'SK Admin',
                initials: 'SK',
                time: '2 days ago',
                text: 'Yes, bidding is open. Please visit the barangay hall for more details.',
                isOfficial: true,
                likes: 5
            }
        ],
        description: 'Annual procurement plan for goods and services.',
        isFeatured: false
    }
];


// ==========================================
// AUTH STATE
// ==========================================

let currentUser = null; // null = unauthenticated
let commentMode = null; // 'user' | 'guest'
let activeDocId = null;

// Simulated registered users (in real use, this would be server-side)
const MOCK_USERS = [
    { email: 'maria@example.com', password: 'password123', firstName: 'Maria', lastName: 'Reyes', barangay: 'san-roque' }
];


// ==========================================
// MODAL CONTROLLER
// ==========================================

class ModalController {

    static open(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('is-open');
            document.body.style.overflow = 'hidden';
        }
    }

    static close(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('is-open');
            // Only restore scroll if no other modals are open
            const anyOpen = document.querySelector('.sk-modal-overlay.is-open');
            if (!anyOpen) document.body.style.overflow = '';
        }
    }

    static closeAll() {
        document.querySelectorAll('.sk-modal-overlay.is-open').forEach(m => m.classList.remove('is-open'));
        document.body.style.overflow = '';
    }

    static init() {
        // Close buttons
        document.querySelectorAll('[data-close]').forEach(btn => {
            btn.addEventListener('click', () => {
                ModalController.close(btn.getAttribute('data-close'));
            });
        });

        // Click outside to close
        document.querySelectorAll('.sk-modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    ModalController.close(overlay.id);
                }
            });
        });

        // Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') ModalController.closeAll();
        });
    }
}


// ==========================================
// AUTH CONTROLLER
// ==========================================

class AuthController {

    static init() {
        // Header buttons
        document.getElementById('headerLoginBtn')?.addEventListener('click', () => {
            ModalController.open('loginModal');
        });

        document.getElementById('headerRegisterBtn')?.addEventListener('click', () => {
            ModalController.open('registerModal');
        });

        document.getElementById('signOutBtn')?.addEventListener('click', () => {
            AuthController.signOut();
        });

        // Switch between login and register
        document.getElementById('goToRegisterBtn')?.addEventListener('click', () => {
            ModalController.close('loginModal');
            ModalController.open('registerModal');
        });

        document.getElementById('goToLoginBtn')?.addEventListener('click', () => {
            ModalController.close('registerModal');
            ModalController.open('loginModal');
        });

        // Auth choice modal
        document.getElementById('choiceSignInBtn')?.addEventListener('click', () => {
            ModalController.close('authChoiceModal');
            ModalController.open('loginModal');
        });

        document.getElementById('choiceGuestBtn')?.addEventListener('click', () => {
            ModalController.close('authChoiceModal');
            CommentController.enterGuestMode();
            ModalController.open('commentModal');
        });

        // Login form
        document.getElementById('loginForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            AuthController.handleLogin();
        });

        // Register form
        document.getElementById('registerForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            AuthController.handleRegister();
        });

        // Password toggles
        document.querySelectorAll('.sk-pw-toggle').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.getAttribute('data-target');
                const input = document.getElementById(targetId);
                if (!input) return;
                const isText = input.type === 'text';
                input.type = isText ? 'password' : 'text';
                btn.querySelector('i').className = isText ? 'fas fa-eye' : 'fas fa-eye-slash';
            });
        });

        // Password strength meter
        document.getElementById('regPassword')?.addEventListener('input', (e) => {
            AuthController.updatePasswordStrength(e.target.value);
        });
    }

    static handleLogin() {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        let valid = true;

        AuthController.clearErrors(['loginEmail', 'loginPassword']);

        if (!email) {
            AuthController.showError('loginEmailError', 'Email is required.');
            valid = false;
        } else if (!AuthController.isValidEmail(email)) {
            AuthController.showError('loginEmailError', 'Please enter a valid email address.');
            document.getElementById('loginEmail').classList.add('is-invalid');
            valid = false;
        }

        if (!password) {
            AuthController.showError('loginPasswordError', 'Password is required.');
            valid = false;
        }

        if (!valid) return;

        // Simulate login check
        const user = MOCK_USERS.find(u => u.email === email && u.password === password);

        if (!user) {
            AuthController.showError('loginPasswordError', 'Incorrect email or password. Please try again.');
            document.getElementById('loginPassword').classList.add('is-invalid');
            return;
        }

        AuthController.setUser(user);

        // If coming from comment flow, open comment modal
        if (activeDocId !== null) {
            ModalController.close('loginModal');
            CommentController.enterUserMode();
            ModalController.open('commentModal');
        } else {
            ModalController.close('loginModal');
        }

        AuthController.showToast(`Welcome back, ${user.firstName}!`);
    }

    static handleRegister() {
        const firstName = document.getElementById('regFirstName').value.trim();
        const lastName = document.getElementById('regLastName').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const barangay = document.getElementById('regBarangay').value;
        const street = document.getElementById('regStreet').value.trim();
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('regConfirmPassword').value;
        const consent = document.getElementById('regConsent').checked;

        const fields = ['regFirstName', 'regLastName', 'regEmail', 'regBarangay', 'regStreet', 'regPassword', 'regConfirmPassword', 'regConsent'];
        AuthController.clearErrors(fields);

        let valid = true;

        if (!firstName) {
            AuthController.showError('regFirstNameError', 'First name is required.');
            document.getElementById('regFirstName').classList.add('is-invalid');
            valid = false;
        }

        if (!lastName) {
            AuthController.showError('regLastNameError', 'Last name is required.');
            document.getElementById('regLastName').classList.add('is-invalid');
            valid = false;
        }

        if (!email) {
            AuthController.showError('regEmailError', 'Email is required.');
            document.getElementById('regEmail').classList.add('is-invalid');
            valid = false;
        } else if (!AuthController.isValidEmail(email)) {
            AuthController.showError('regEmailError', 'Please enter a valid email address.');
            document.getElementById('regEmail').classList.add('is-invalid');
            valid = false;
        }

        if (!barangay) {
            AuthController.showError('regBarangayError', 'Please select your barangay.');
            document.getElementById('regBarangay').classList.add('is-invalid');
            valid = false;
        }

        if (!street) {
            AuthController.showError('regStreetError', 'Street / Purok / Sitio is required.');
            document.getElementById('regStreet').classList.add('is-invalid');
            valid = false;
        }

        if (!password) {
            AuthController.showError('regPasswordError', 'Password is required.');
            document.getElementById('regPassword').classList.add('is-invalid');
            valid = false;
        } else if (password.length < 8) {
            AuthController.showError('regPasswordError', 'Password must be at least 8 characters.');
            document.getElementById('regPassword').classList.add('is-invalid');
            valid = false;
        }

        if (!confirmPassword) {
            AuthController.showError('regConfirmError', 'Please confirm your password.');
            document.getElementById('regConfirmPassword').classList.add('is-invalid');
            valid = false;
        } else if (password !== confirmPassword) {
            AuthController.showError('regConfirmError', 'Passwords do not match.');
            document.getElementById('regConfirmPassword').classList.add('is-invalid');
            valid = false;
        }

        if (!consent) {
            AuthController.showError('regConsentError', 'You must agree to the Terms of Use to register.');
            valid = false;
        }

        if (!valid) return;

        // Simulate registration
        const newUser = { email, password, firstName, lastName, barangay };
        MOCK_USERS.push(newUser);
        AuthController.setUser(newUser);

        if (activeDocId !== null) {
            ModalController.close('registerModal');
            CommentController.enterUserMode();
            ModalController.open('commentModal');
        } else {
            ModalController.close('registerModal');
        }

        AuthController.showToast(`Account created! Welcome, ${firstName}!`);
    }

    static setUser(user) {
        currentUser = user;
        const initials = (user.firstName[0] + user.lastName[0]).toUpperCase();

        // Update header UI
        document.getElementById('headerLoginBtn').classList.add('d-none');
        document.getElementById('headerRegisterBtn').classList.add('d-none');
        const pill = document.getElementById('userPill');
        pill.classList.remove('d-none');
        document.getElementById('userAvatar').textContent = initials;
        document.getElementById('userDisplayName').textContent = user.firstName;
    }

    static signOut() {
        currentUser = null;
        commentMode = null;
        document.getElementById('headerLoginBtn').classList.remove('d-none');
        document.getElementById('headerRegisterBtn').classList.remove('d-none');
        document.getElementById('userPill').classList.add('d-none');
        AuthController.showToast('You have been signed out.');
    }

    static updatePasswordStrength(password) {
        const fill = document.getElementById('pwStrengthFill');
        const label = document.getElementById('pwStrengthLabel');
        if (!fill || !label) return;

        let score = 0;
        if (password.length >= 8)  score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

        const levels = [
            { pct: '0%',   color: '#ecf0f1',  text: '',        textColor: '' },
            { pct: '25%',  color: '#e74c3c',  text: 'Weak',    textColor: '#e74c3c' },
            { pct: '50%',  color: '#e67e22',  text: 'Fair',    textColor: '#e67e22' },
            { pct: '75%',  color: '#f1c40f',  text: 'Good',    textColor: '#c9900a' },
            { pct: '100%', color: '#27ae60',  text: 'Strong',  textColor: '#27ae60' }
        ];

        const level = levels[score];
        fill.style.width = level.pct;
        fill.style.background = level.color;
        label.textContent = level.text;
        label.style.color = level.textColor;
    }

    static showError(elementId, message) {
        const el = document.getElementById(elementId);
        if (el) {
            el.textContent = message;
            el.classList.add('is-visible');
        }
    }

    static clearErrors(fieldIds) {
        fieldIds.forEach(id => {
            const errorEl = document.getElementById(id + 'Error');
            if (errorEl) {
                errorEl.textContent = '';
                errorEl.classList.remove('is-visible');
            }
            const inputEl = document.getElementById(id);
            if (inputEl) {
                inputEl.classList.remove('is-invalid', 'is-valid');
            }
        });
    }

    static isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    static showToast(message) {
        const toast = document.getElementById('successToast');
        const msg = document.getElementById('toastMessage');
        if (!toast || !msg) return;
        msg.textContent = message;
        toast.classList.add('is-visible');
        setTimeout(() => toast.classList.remove('is-visible'), 3500);
    }
}


// ==========================================
// COMMENT CONTROLLER
// ==========================================

class CommentController {

    static openForDoc(docId) {
        activeDocId = docId;
        const doc = DOCUMENTS_DATA.find(d => d.id === docId);
        if (!doc) return;

        // Populate modal header
        document.getElementById('commentDocCategory').textContent = doc.category;
        document.getElementById('commentDocTitle').textContent = doc.title;
        document.getElementById('commentDocMeta').textContent = `${doc.barangayName}  ·  Updated ${doc.date}`;

        // Render comments
        CommentController.renderThread(doc);

        // Determine compose state
        if (currentUser) {
            CommentController.enterUserMode();
            ModalController.open('commentModal');
        } else {
            // Show auth choice first
            ModalController.open('authChoiceModal');
        }
    }

    static enterUserMode() {
        commentMode = 'user';
        const user = currentUser;
        if (!user) return;

        const initials = (user.firstName[0] + user.lastName[0]).toUpperCase();

        document.getElementById('composeUserBanner').classList.remove('d-none');
        document.getElementById('composeGuestBanner').classList.add('d-none');
        document.getElementById('guestFields').classList.add('d-none');
        document.getElementById('composeCta').classList.add('d-none');
        document.getElementById('composeAvatar').textContent = initials;
        document.getElementById('composeUserName').textContent = `${user.firstName} ${user.lastName}`;
        document.getElementById('sk-compose-box')?.classList.remove('d-none');
    }

    static enterGuestMode() {
        commentMode = 'guest';

        document.getElementById('composeGuestBanner').classList.remove('d-none');
        document.getElementById('composeUserBanner').classList.add('d-none');
        document.getElementById('guestFields').classList.remove('d-none');
        document.getElementById('composeCta').classList.add('d-none');
    }

    static renderThread(doc) {
        const thread = document.getElementById('commentThread');
        const countBadge = document.getElementById('commentCount');
        if (!thread) return;

        const comments = doc.comments || [];
        countBadge.textContent = comments.length;

        if (comments.length === 0) {
            thread.innerHTML = `
                <div class="sk-comment-empty">
                    <i class="fas fa-comment-dots"></i>
                    <p>No comments yet. Be the first to share your thoughts.</p>
                </div>
            `;
            return;
        }

        thread.innerHTML = comments.map((c, idx) => `
            <div>
                <div class="sk-comment-item">
                    <div class="sk-comment-avatar ${c.isGuest ? 'sk-comment-avatar--ghost' : ''}">
                        ${c.isGuest ? '<i class="fas fa-user-secret"></i>' : c.initials}
                    </div>
                    <div class="sk-comment-bubble">
                        <div class="sk-comment-meta">
                            <span class="sk-comment-author">${c.author}</span>
                            ${c.isOfficial ? '<span class="sk-comment-badge">Official</span>' : ''}
                            <span class="sk-comment-time">${c.time}</span>
                        </div>
                        <p class="sk-comment-text">${c.text}</p>
                        <div class="sk-comment-actions">
                            <button class="sk-comment-action-btn">
                                <i class="fas fa-thumbs-up"></i> ${c.likes}
                            </button>
                            <button class="sk-comment-action-btn">Reply</button>
                        </div>
                    </div>
                </div>
                ${idx < comments.length - 1 ? '<div class="sk-comment-divider"></div>' : ''}
            </div>
        `).join('');
    }

    static submitComment() {
        const textarea = document.getElementById('commentTextarea');
        const text = textarea?.value.trim();

        if (!text) {
            textarea.style.borderColor = '#e74c3c';
            setTimeout(() => textarea.style.borderColor = '', 1500);
            return;
        }

        const doc = DOCUMENTS_DATA.find(d => d.id === activeDocId);
        if (!doc) return;

        let authorName, initials, isGuest = false;

        if (commentMode === 'user' && currentUser) {
            authorName = `${currentUser.firstName} ${currentUser.lastName}`;
            initials = (currentUser.firstName[0] + currentUser.lastName[0]).toUpperCase();
        } else {
            const guestName = document.getElementById('guestName')?.value.trim();
            authorName = guestName || 'Anonymous';
            initials = null;
            isGuest = true;
        }

        const newComment = {
            id: Date.now(),
            author: authorName,
            initials: initials,
            time: 'Just now',
            text: text,
            isOfficial: false,
            likes: 0,
            isGuest: isGuest,
            isPending: isGuest // guest comments are pending review
        };

        doc.comments.push(newComment);
        textarea.value = '';

        CommentController.renderThread(doc);

        // Update comment count on the card
        const card = document.querySelector(`[data-doc-id="${activeDocId}"]`);
        if (card) {
            const metaCount = card.querySelector('.doc-comment-count');
            if (metaCount) metaCount.textContent = `${doc.comments.length} comment${doc.comments.length !== 1 ? 's' : ''}`;
        }

        const msg = isGuest
            ? 'Comment submitted! It will appear after review.'
            : 'Comment posted successfully!';

        AuthController.showToast(msg);
    }

    static init() {
        // Submit comment button
        document.getElementById('submitCommentBtn')?.addEventListener('click', () => {
            CommentController.submitComment();
        });

        // Start comment CTA
        document.getElementById('startCommentBtn')?.addEventListener('click', () => {
            if (currentUser) {
                CommentController.enterUserMode();
            } else {
                ModalController.close('commentModal');
                ModalController.open('authChoiceModal');
            }
        });

        // Switch to sign in from guest banner
        document.getElementById('switchToSignInBtn')?.addEventListener('click', () => {
            ModalController.close('commentModal');
            ModalController.open('loginModal');
        });

        // Textarea — if unauthenticated and no mode chosen, prompt
        document.getElementById('commentTextarea')?.addEventListener('focus', () => {
            if (!currentUser && commentMode === null) {
                document.getElementById('commentTextarea').blur();
                ModalController.close('commentModal');
                ModalController.open('authChoiceModal');
            }
        });
    }
}


// ==========================================
// NAVIGATION CONTROLLER
// ==========================================

class NavigationController {
    constructor() {
        this.pages = {
            home: document.getElementById('homePage'),
            resolutions: document.getElementById('resolutionsPage'),
            policyBoard: document.getElementById('policyBoardPage')
        };

        this.navLinks = {
            home: document.getElementById('homeNavLink'),
            resolutions: document.getElementById('resolutionsNavLink'),
            policyBoard: document.getElementById('policyBoardNavLink'),
            accomplishment: document.getElementById('accomplishmentNavLink')
        };

        this.currentPage = 'home';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.showPage('home');
    }

    setupEventListeners() {
        this.navLinks.home?.addEventListener('click', (e) => { e.preventDefault(); this.showPage('home'); });
        this.navLinks.resolutions?.addEventListener('click', (e) => { e.preventDefault(); this.showPage('resolutions'); });
        this.navLinks.policyBoard?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showPage('policyBoard');
            setTimeout(() => this.renderDocuments(), 100);
        });
        this.navLinks.accomplishment?.addEventListener('click', (e) => {
            e.preventDefault();
            alert('Accomplishment Reports page coming soon!');
        });

        document.getElementById('applyFilterBtn')?.addEventListener('click', () => this.applyFilters());
    }

    showPage(pageName) {
        Object.values(this.pages).forEach(p => { if (p) p.style.display = 'none'; });
        if (this.pages[pageName]) {
            this.pages[pageName].style.display = 'block';
            this.currentPage = pageName;
        }
        this.updateActiveNav(pageName);
    }

    updateActiveNav(pageName) {
        Object.keys(this.navLinks).forEach(key => {
            this.navLinks[key]?.classList.toggle('active', key === pageName);
        });
    }

    renderDocuments() {
        const container = document.getElementById('documentsContainer');
        if (!container) return;
        container.innerHTML = '';

        DOCUMENTS_DATA.forEach(doc => {
            const commentCount = Array.isArray(doc.comments) ? doc.comments.length : doc.comments;
            const card = document.createElement('div');
            card.className = `document-card ${doc.isFeatured ? 'card-featured' : ''}`;
            card.setAttribute('data-barangay', doc.barangay);
            card.setAttribute('data-year', doc.year);
            card.setAttribute('data-doc-id', doc.id);

            card.innerHTML = `
                <div class="card-content">
                    <div class="doc-header">
                        <span class="doc-category">${doc.category}</span>
                    </div>
                    <h3 class="doc-title">${doc.title}</h3>
                    <div class="doc-meta">
                        <span><i class="fas fa-map-marker-alt"></i> ${doc.barangayName}</span>
                        <span><i class="fas fa-calendar-alt"></i> Updated ${doc.date}</span>
                        <span class="doc-comment-count"><i class="fas fa-comments"></i> ${commentCount} comment${commentCount !== 1 ? 's' : ''}</span>
                    </div>
                    <p class="doc-description">${doc.description}</p>
                    <div class="doc-divider"></div>
                    <div class="doc-actions">
                        <button class="btn-comment" data-doc-id="${doc.id}"><i class="fas fa-comment me-1"></i> Comment</button>
                        <button class="btn-view"><i class="fas fa-eye me-1"></i> View</button>
                        <button class="btn-download"><i class="fas fa-download me-1"></i> Download</button>
                    </div>
                </div>
            `;

            container.appendChild(card);
        });

        this.setupDocumentHandlers();
    }

    setupDocumentHandlers() {
        document.querySelectorAll('.btn-comment').forEach(btn => {
            btn.addEventListener('click', () => {
                const docId = parseInt(btn.getAttribute('data-doc-id'));
                CommentController.openForDoc(docId);
            });
        });

        document.querySelectorAll('.btn-view').forEach(btn => {
            btn.addEventListener('click', () => alert('View document functionality coming soon!'));
        });

        document.querySelectorAll('.btn-download').forEach(btn => {
            btn.addEventListener('click', () => alert('Download functionality coming soon!'));
        });
    }

    applyFilters() {
        const selectedBarangay = document.getElementById('barangayFilter')?.value || 'all';
        const selectedYear = document.getElementById('yearFilter')?.value || 'all';

        const allCards = document.querySelectorAll('#policyBoardPage .document-card');
        let visibleCount = 0;

        allCards.forEach(card => {
            const match =
                (selectedBarangay === 'all' || card.getAttribute('data-barangay') === selectedBarangay) &&
                (selectedYear === 'all' || card.getAttribute('data-year') === selectedYear);
            card.style.display = match ? 'block' : 'none';
            if (match) visibleCount++;
        });

        const noResults = document.getElementById('noResultsMessage');
        if (noResults) noResults.style.display = visibleCount === 0 ? 'block' : 'none';
    }
}


// ==========================================
// INIT
// ==========================================

document.addEventListener('DOMContentLoaded', function () {
    ModalController.init();
    AuthController.init();
    CommentController.init();
    window.navigationController = new NavigationController();
    console.log('SK Federation Portal - Initialized');
});
