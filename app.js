// ===== ExtensionMaster v4 - Vercel 웹 버전 =====

// ===== 유틸 =====
function debounce(fn, delay) {
    var timer;
    return function () {
        var args = arguments, ctx = this;
        clearTimeout(timer);
        timer = setTimeout(function () { fn.apply(ctx, args); }, delay);
    };
}

function uid() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return 'id_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
}

// #6: 브라우저 SHA-256 (Web Crypto API)
async function sha256Browser(str) {
    var buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
}
function isHashedBrowser(pw) {
    return typeof pw === 'string' && /^[a-f0-9]{64}$/.test(pw);
}

function escHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ===== 전화번호 정규화 =====
function toDialNum(num, areaCode) {
    if (!num) return '';
    var n = num.replace(/[^0-9]/g, '');
    if (n.charAt(0) !== '0') n = (areaCode || '02').replace(/[^0-9]/g, '') + n;
    return n;
}

// ===== 즐겨찾기 (localStorage + 쿠키 이중 저장) =====
var Favorites = {
    _key: 'ext_favorites',
    _cookieKey: 'ext_fav',

    // 쿠키 읽기
    _getCookie: function () {
        var match = document.cookie.match(new RegExp('(?:^|; )' + this._cookieKey + '=([^;]*)'));
        if (!match) return [];
        try { return JSON.parse(decodeURIComponent(match[1])); } catch (e) { return []; }
    },

    // 쿠키 저장 (1년 만료)
    _setCookie: function (arr) {
        var exp = new Date();
        exp.setFullYear(exp.getFullYear() + 1);
        document.cookie = this._cookieKey + '=' + encodeURIComponent(JSON.stringify(arr))
            + '; expires=' + exp.toUTCString() + '; path=/; SameSite=Lax';
    },

    getAll: function () {
        try {
            var ls = JSON.parse(localStorage.getItem(this._key)) || [];
            if (ls.length > 0) return ls;
            // localStorage가 비어있으면 쿠키에서 자동 복원 (PC 브라우저 설정 대응)
            var ck = this._getCookie();
            if (ck.length > 0) {
                localStorage.setItem(this._key, JSON.stringify(ck));
                return ck;
            }
            return [];
        } catch (e) { return []; }
    },

    toggle: function (id) {
        var f = this.getAll(), idx = f.indexOf(id);
        if (idx >= 0) f.splice(idx, 1); else f.push(id);
        localStorage.setItem(this._key, JSON.stringify(f));
        this._setCookie(f); // 쿠키에도 동시 저장
        return idx < 0;
    },

    has: function (id) { return this.getAll().indexOf(id) >= 0; }
};


// ===== 상수 =====
var DEFAULT_PASSWORD = '1234';

var FLOORS = [
    { id: 'floor_1', name: '1층', order: 1, color: '#6366f1' },
    { id: 'floor_2', name: '2층', order: 2, color: '#a855f7' },
    { id: 'floor_3', name: '3층', order: 3, color: '#22c55e' },
    { id: 'floor_4', name: '4층', order: 4, color: '#f59e0b' },
    { id: 'floor_5', name: '5층', order: 5, color: '#ef4444' },
    { id: 'floor_b1', name: '지하1층', order: 6, color: '#64748b' }
];
FLOORS.sort(function (a, b) { return a.order - b.order; });

// ===== 테마 =====
var THEMES = ['dark', 'midnight', 'forest', 'sunset'];
var THEME_NAMES = { dark: '🌙 다크', midnight: '🔵 미드나잇', forest: '🌿 포레스트', sunset: '🌅 선셋' };

function applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('ext_theme', theme);
    var btn = document.getElementById('themeBtn');
    if (btn) btn.textContent = THEME_NAMES[theme] || theme;
}
function initTheme() {
    applyTheme(localStorage.getItem('ext_theme') || 'dark');
}
function cycleTheme() {
    var cur = document.body.getAttribute('data-theme') || 'dark';
    applyTheme(THEMES[(THEMES.indexOf(cur) + 1) % THEMES.length]);
}

var SEED_DATA = [
    // 지하1층
    { name: '황승호', ext: '308', phone: '2123-8348', floorId: 'floor_b1' },
    { name: '정영철·이장한', ext: '309', phone: '2123-8137', floorId: 'floor_b1' },
    { name: '안내실', ext: '500', phone: '', floorId: 'floor_b1' },
    { name: '청소원휴게실', ext: '502', phone: '', floorId: 'floor_b1' },
    // 1층
    { name: '한계영', ext: '111', phone: '', floorId: 'floor_1' },
    { name: '김현지', ext: '112', phone: '', floorId: 'floor_1' },
    { name: '권민지', ext: '113', phone: '', floorId: 'floor_1' },
    { name: '김정현', ext: '114', phone: '', floorId: 'floor_1' },
    { name: '조시내', ext: '115', phone: '', floorId: 'floor_1' },
    { name: '유형열', ext: '116', phone: '', floorId: 'floor_1' },
    { name: '강미리', ext: '117', phone: '', floorId: 'floor_1' },
    { name: '지정재', ext: '118', phone: '', floorId: 'floor_1' },
    { name: '김희정', ext: '119', phone: '', floorId: 'floor_1' },
    { name: '김소형', ext: '120', phone: '', floorId: 'floor_1' },
    { name: '김승혜', ext: '121', phone: '', floorId: 'floor_1' },
    { name: '조윤신', ext: '122', phone: '', floorId: 'floor_1' },
    { name: '김규성', ext: '123', phone: '', floorId: 'floor_1' },
    { name: '이서경', ext: '126', phone: '', floorId: 'floor_1' },
    { name: '늘봄실무사(김진서)', ext: '108', phone: '2123-8342', floorId: 'floor_1' },
    { name: '에듀케어강사', ext: '124', phone: '', floorId: 'floor_1' },
    { name: '감각통합실', ext: '125', phone: '', floorId: 'floor_1' },
    { name: '학교보안관', ext: '199', phone: '', floorId: 'floor_1' },
    // 2층
    { name: '교감', ext: '220', phone: '2123-8142', floorId: 'floor_2' },
    { name: '김유진', ext: '221', phone: '2123-8341', floorId: 'floor_2' },
    { name: '조희원', ext: '222', phone: '', floorId: 'floor_2' },
    { name: '이종길', ext: '223', phone: '', floorId: 'floor_2' },
    { name: '이민호', ext: '224', phone: '', floorId: 'floor_2' },
    { name: '방정화', ext: '225', phone: '', floorId: 'floor_2' },
    { name: '김민주', ext: '226', phone: '', floorId: 'floor_2' },
    { name: '상새아', ext: '227', phone: '', floorId: 'floor_2' },
    { name: '신숙희', ext: '228', phone: '', floorId: 'floor_2' },
    { name: '김민지', ext: '229', phone: '', floorId: 'floor_2' },
    { name: '이승형', ext: '230', phone: '', floorId: 'floor_2' },
    { name: '한규영', ext: '231', phone: '', floorId: 'floor_2' },
    { name: '이윤희', ext: '232', phone: '', floorId: 'floor_2' },
    { name: '최보름', ext: '233', phone: '', floorId: 'floor_2' },
    { name: '백선영', ext: '299', phone: '', floorId: 'floor_2' },
    // 3층
    { name: '교장', ext: '100', phone: '2123-8130', floorId: 'floor_3' },
    { name: '행정실장', ext: '300', phone: '2123-8133', floorId: 'floor_3' },
    { name: '조미선', ext: '301', phone: '2123-8065', floorId: 'floor_3' },
    { name: '차명일', ext: '302', phone: '2123-8347', floorId: 'floor_3' },
    { name: '김영섭', ext: '303', phone: '2123-8134', floorId: 'floor_3' },
    { name: '박상희', ext: '304', phone: '2123-8345', floorId: 'floor_3' },
    { name: '김재숙', ext: '305', phone: '2123-8131', floorId: 'floor_3' },
    { name: '이우종', ext: '306', phone: '2123-8346', floorId: 'floor_3' },
    { name: '배종협', ext: '307', phone: '2123-8346', floorId: 'floor_3' },
    { name: '정재환', ext: '129', phone: '2123-8135', floorId: 'floor_3' },
    { name: '회의실', ext: '200', phone: '2123-8066', floorId: 'floor_3' },
    // 4층
    { name: '박보배', ext: '413', phone: '', floorId: 'floor_4' },
    { name: '임채린', ext: '', phone: '', floorId: 'floor_4' },
    { name: '김다혜', ext: '', phone: '', floorId: 'floor_4' },
    { name: '전연주', ext: '', phone: '', floorId: 'floor_4' },
    { name: '의료지원실', ext: '411', phone: '', floorId: 'floor_4' },
    { name: 'AI교실', ext: '412', phone: '', floorId: 'floor_4' },
    { name: '도서실', ext: '414', phone: '', floorId: 'floor_4' },
    // 5층
    { name: '박재우', ext: '600', phone: '', floorId: 'floor_5' },
    { name: '선현석', ext: '601', phone: '', floorId: 'floor_5' },
    { name: '신현종', ext: '603', phone: '', floorId: 'floor_5' },
    { name: '신숙희', ext: '604', phone: '', floorId: 'floor_5' },
    { name: '김한별', ext: '605', phone: '', floorId: 'floor_5' },
    { name: '혁신코디', ext: '607', phone: '', floorId: 'floor_5' },
    { name: '최용익', ext: '608', phone: '', floorId: 'floor_5' },
    { name: '지도경', ext: '609', phone: '', floorId: 'floor_5' }
];

// ===== 원격 DB (Vercel KV 연동) =====
var ContactDB = {
    _data: {
        contacts: {},
        rooms: {},
        settings: { admin_password: DEFAULT_PASSWORD }
    },
    _saving: false,
    _pendingSave: false,

    _save: async function (auditEntry) {
        if (this._saving) { this._pendingSave = true; return; }
        this._saving = true;
        try {
            var payload = {
                contacts: this._data.contacts,
                rooms: this._data.rooms,
                settings: this._data.settings
            };
            localStorage.setItem('extension_data_v4', JSON.stringify(payload));
            var ctrl = new AbortController();
            var tid = setTimeout(function () { ctrl.abort(); }, 8000);
            var res;
            try {
                res = await fetch('/api/data', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(Object.assign({}, payload, {
                        adminPassword: this._data.settings.admin_password,
                        auditEntry: auditEntry || null   // #15: 변경이력
                    })),
                    signal: ctrl.signal
                });
            } finally {
                clearTimeout(tid);
            }
            if (!res.ok) {
                var err = await res.json().catch(function () { return {}; });
                throw new Error(err.error || '저장 실패 (' + res.status + ')');
            }
            App.hideSaveFailBanner();
        } catch (e) {
            console.error('[ContactDB] 저장 오류:', e);
            App.showToast('저장 오류: ' + e.message, 'error');
            App.showSaveFailBanner(e.message);
        } finally {
            this._saving = false;
            if (this._pendingSave) {
                this._pendingSave = false;
                this._save();
            }
        }
    },

    fetchAll: async function () {
        try {
            var res = await fetch('/api/data');
            var data = res.ok ? await res.json() : null;
            if (data && data.contacts && Object.keys(data.contacts).length > 0) {
                // KV에 실제 데이터가 있을 때만 사용 (빈 KV로 로컬 데이터 덮어쓰기 방지)
                this._data = {
                    contacts: data.contacts,
                    rooms: data.rooms || {},
                    settings: data.settings || { admin_password: DEFAULT_PASSWORD }
                };
                this._audit = data.audit || []; // #15: 변경이력 캐시
                localStorage.setItem('extension_data_v4', JSON.stringify(this._data));
            } else if (data) {
                // KV가 비어있는 경우 → 로컬 캐시 우선 사용 (재배포 후 데이터 보호)
                throw new Error('KV 빈 데이터, 로컬 캐시 확인');
            } else {
                throw new Error('서버 응답 없음');
            }
        } catch (e) {
            console.warn('[ContactDB] 서버 접속 실패, 로컬 캐시 사용:', e.message);
            var stored = localStorage.getItem('extension_data_v4');
            if (stored) {
                var cached = JSON.parse(stored);
                this._data = {
                    contacts: cached.contacts || {},
                    rooms: cached.rooms || {},
                    settings: cached.settings || { admin_password: DEFAULT_PASSWORD }
                };
            }
        }
        return {
            contacts: this._data.contacts,
            rooms: this._data.rooms,
            // 오프라인 캐시에 평문 비밀번호가 있을 경우에도 안전하게 반환
            password: (this._data.settings && this._data.settings.admin_password) || DEFAULT_PASSWORD
        };
    },

    save: async function (contact, auditAction) {
        this._data.contacts[contact.id] = contact;
        await this._save(auditAction ? { action: auditAction, name: contact.name } : null);
    },

    delete: async function (id) {
        var name = (this._data.contacts[id] || {}).name || id;
        delete this._data.contacts[id];
        await this._save({ action: '연락처 삭제', name: name });
    },

    saveRoom: async function (room, auditAction) {
        this._data.rooms[room.id] = room;
        await this._save(auditAction ? { action: auditAction, name: room.name } : null);
    },

    deleteRoom: async function (id) {
        var name = (this._data.rooms[id] || {}).name || id;
        delete this._data.rooms[id];
        await this._save({ action: '방 삭제', name: name });
    },

    savePassword: async function (pw) {
        this._data.settings.admin_password = pw;
        await this._save();
    },

    saveSettings: async function (settingsObj) {
        Object.assign(this._data.settings, settingsObj);
        await this._save();
    },

    clearAll: async function () {
        this._data.contacts = {};
        this._data.rooms = {};
        await this._save({ action: '전체삭제', name: '모든 연락처 삭제됨' });
    },

    seed: async function () {
        App.showToast('초기 데이터를 설정 중입니다...', 'info');
        var orderMap = {};
        for (var i = 0; i < SEED_DATA.length; i++) {
            var p = SEED_DATA[i];
            if (!orderMap[p.floorId]) orderMap[p.floorId] = 0;
            var c = {
                id: uid(),
                name: p.name,
                ext: p.ext || '',
                phone: p.phone || '',
                address: '',
                floorId: p.floorId,
                order: orderMap[p.floorId]++
            };
            App.state.contacts[c.id] = c;
            this._data.contacts[c.id] = c;
        }
        await this._save();
    }
};


// ===== 카드 렌더 헬퍼 =====
function renderCard(c, isAdmin, showLocation) {
    var s = ContactDB._data.settings || {};
    var h = '<div class="contact-card' + (isAdmin ? ' is-admin' : '') + (showLocation ? ' fav-card' : '') + '" data-id="' + c.id + '"' + (isAdmin ? ' draggable="true"' : '') + '>';
    if (!isAdmin) {
        var fav = Favorites.has(c.id);
        h += '<button class="cc-fav-btn' + (fav ? ' active' : '') + '" data-id="' + c.id + '" title="즐겨찾기 추가/제거">'
            + (fav ? '★' : '☆') + '</button>';
    }
    if (c.role) h += '<div class="cc-role">' + escHtml(c.role) + '</div>';
    h += '<div class="cc-name">' + escHtml(c.name) + '</div>';
    if (c.ext) {
        var main = toDialNum(s.mainPhone || '', s.areaCode || '02');
        var extHref = main ? ' href="tel:' + main + ',,' + c.ext + '"' : '';
        h += '<a class="cc-ext"' + extHref + '>내선 ' + escHtml(c.ext) + '</a>';
    }
    if (c.phone) {
        h += '<a class="cc-phone" href="tel:' + toDialNum(c.phone, s.areaCode || '02') + '">' + escHtml(c.phone) + '</a>';
    }
    if (c.address) h += '<div class="cc-address">' + escHtml(c.address) + '</div>';
    if (showLocation) {
        var floor = FLOORS.find(function (f) { return f.id === c.floorId; });
        var room = c.roomId ? App.state.rooms[c.roomId] : null;
        var loc = floor ? floor.name : '';
        if (room && room.name) loc += (loc ? ' \u00b7 ' : '') + room.name;
        if (loc) h += '<div class="cc-location">&#128205; ' + escHtml(loc) + '</div>';
    }
    if (isAdmin) h += '<button class="cc-edit-btn" data-id="' + c.id + '" title="편집">✎</button>';
    h += '</div>';
    return h;
}

// ===== 렌더러 =====
var Renderer = {
    render: function () {
        var canvas = document.getElementById('canvas');
        var contacts = App.state.contacts;
        var rooms = App.state.rooms;
        var filterFloor = App.state.filterFloor;
        var isAdmin = App.state.isAdmin;
        var s = ContactDB._data.settings || {};
        var html = '';

        // ── 즐겨찾기 전용 뷰 ──
        if (filterFloor === '_favorites') {
            var allFavIds = Favorites.getAll();
            var allFavContacts = allFavIds.map(function (id) { return contacts[id]; }).filter(Boolean);
            if (allFavContacts.length > 0) {
                html += '<section class="floor-section" style="--fc:#fbbf24">';
                html += '<div class="floor-header">';
                html += '<span class="floor-name">★ 즐겨찾기</span>';
                html += '<span class="floor-count">' + allFavContacts.length + '명</span>';
                html += '</div><div class="contact-grid fav-grid">';
                allFavContacts.forEach(function (c) { html += renderCard(c, false, true); });
                html += '</div></section>';
            } else {
                html = '<div class="cc-empty" style="padding:2rem;">즐겨찾기가 없습니다. 카드의 ☆ 버튼을 눌러 추가하세요.</div>';
            }
            canvas.innerHTML = html;
            App.bindCanvasEvents();
            return;
        }

        var floors = filterFloor
            ? FLOORS.filter(function (f) { return f.id === filterFloor; })
            : FLOORS;

        // ── 전체 뷰 상단 즐겨찾기 섹션 (비관리자) ──
        if (!isAdmin && !filterFloor) {
            var topFavIds = Favorites.getAll();
            if (topFavIds.length > 0) {
                var topFavContacts = topFavIds.map(function (id) { return contacts[id]; }).filter(Boolean);
                if (topFavContacts.length > 0) {
                    html += '<section class="floor-section" style="--fc:#fbbf24">';
                    html += '<div class="floor-header">';
                    html += '<span class="floor-name">★ 즐겨찾기</span>';
                    html += '<span class="floor-count">' + topFavContacts.length + '명</span>';
                    html += '</div><div class="contact-grid fav-grid">';
                    topFavContacts.forEach(function (c) { html += renderCard(c, false, true); });
                    html += '</div></section>';
                }
            }
        }

        floors.forEach(function (floor) {
            var floorContacts = Object.values(contacts)
                .filter(function (c) { return c.floorId === floor.id; })
                .sort(function (a, b) { return (a.order || 0) - (b.order || 0); });

            var floorRooms = Object.values(rooms)
                .filter(function (r) { return r.floorId === floor.id; })
                .sort(function (a, b) { return (a.order || 0) - (b.order || 0); });

            if (floorContacts.length === 0 && floorRooms.length === 0 && !isAdmin) return;

            html += '<section class="floor-section" data-floor-id="' + floor.id + '" style="--fc:' + floor.color + '">';
            html += '<div class="floor-header">';
            html += '<span class="floor-name">' + escHtml(floor.name) + '</span>';
            html += '<span class="floor-count">' + floorContacts.length + '명</span>';
            if (isAdmin) {
                html += '<button class="btn btn-success floor-add-btn" data-floor="' + floor.id
                    + '" style="font-size:0.72rem;padding:0.2rem 0.55rem;margin-left:auto;">+ 연락처</button>';
                html += '<button class="btn floor-room-btn" data-floor="' + floor.id
                    + '" style="font-size:0.72rem;padding:0.2rem 0.55rem;">+ 방</button>';
            }
            html += '</div>';

            // 방별 연락처
            floorRooms.forEach(function (room) {
                var roomContacts = floorContacts.filter(function (c) { return c.roomId === room.id; });
                html += '<div class="room-section" data-room-id="' + room.id + '">';
                html += '<div class="room-header">';
                html += '<span class="room-name">' + escHtml(room.name) + '</span>';
                if (room.mainPhone) {
                    var d = toDialNum(room.mainPhone, s.areaCode || '02');
                    html += '<a class="room-phone" href="tel:' + d + '">TEL ' + escHtml(room.mainPhone) + '</a>';
                }
                if (room.phone2) {
                    var d2 = toDialNum(room.phone2, s.areaCode || '02');
                    html += '<a class="room-phone2" href="tel:' + d2 + '">TEL ' + escHtml(room.phone2) + '</a>';
                }
                if (room.fax) html += '<span class="room-fax">FAX ' + escHtml(room.fax) + '</span>';
                if (isAdmin) html += '<button class="room-edit-btn" data-id="' + room.id + '" title="방 편집">✎</button>';
                html += '</div>';
                html += '<div class="contact-grid">';
                roomContacts.forEach(function (c) { html += renderCard(c, isAdmin); });
                if (isAdmin && roomContacts.length === 0) {
                    html += '<div class="cc-empty">연락처 편집에서 이 방을 선택하면 여기에 표시됩니다</div>';
                }
                html += '</div></div>';
            });

            // 자유 연락처 (방 없음)
            var freeContacts = floorContacts.filter(function (c) { return !c.roomId; });
            if (freeContacts.length > 0 || (isAdmin && floorRooms.length === 0)) {
                html += '<div class="contact-grid">';
                freeContacts.forEach(function (c) { html += renderCard(c, isAdmin); });
                if (isAdmin && floorContacts.length === 0 && floorRooms.length === 0) {
                    html += '<div class="cc-empty">+ 연락처 버튼으로 연락처를 등록하세요</div>';
                }
                html += '</div>';
            }

            html += '</section>';
        });

        if (!html) {
            html = '<div class="cc-empty" style="padding:2rem;">표시할 연락처가 없습니다.</div>';
        }

        canvas.innerHTML = html;
        App.bindCanvasEvents();
    }
};

// ===== 메인 앱 =====
var App = {
    state: {
        contacts: {},
        rooms: {},
        isAdmin: false,
        filterFloor: ''
    },

    _adminPassword: DEFAULT_PASSWORD,

    init: async function () {
        document.getElementById('loadingOverlay').classList.remove('hidden');
        try {
            var data = await ContactDB.fetchAll();
            this.state.contacts = data.contacts;
            this.state.rooms = data.rooms;
            this._adminPassword = data.password;

            if (Object.keys(this.state.contacts).length === 0) {
                // localStorage에도 데이터가 없을 때만 시드 실행 (재배포 후 데이터 손실 방지)
                var _local = localStorage.getItem('extension_data_v4');
                var _localContacts = _local ? (JSON.parse(_local).contacts || {}) : {};
                if (Object.keys(_localContacts).length === 0) {
                    await ContactDB.seed();
                }
            }

            if (sessionStorage.getItem('ext_admin') === 'true') this.state.isAdmin = true;

            initTheme();
            this.bindEvents();
            this.updateFloorFilter();
            Renderer.render();
            this.updateAdminUI();
            this.updateStatInfo();
        } catch (e) {
            console.error('[ExtensionMaster] init 오류:', e);
        } finally {
            document.getElementById('loadingOverlay').classList.add('hidden');
        }
    },

    bindEvents: function () {
        var self = this;

        // 검색
        var searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('focus', function () { this.select(); });
        searchInput.addEventListener('input', debounce(function (e) {
            var q = e.target.value.trim();
            if (q.length >= 1) self.showSearchResults(q);
            else self.hideSearchResults(false);
        }, 180));
        searchInput.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') self.hideSearchResults(true);
        });

        if (!App._searchListenerBound) {
            App._searchListenerBound = true;
            document.addEventListener('mousedown', function (e) {
                var resultsEl = document.getElementById('searchResults');
                if (resultsEl && !resultsEl.classList.contains('hidden')) {
                    if (!resultsEl.contains(e.target) && e.target !== searchInput) {
                        App.hideSearchResults(false);
                    }
                }
            });
        }

        // 층 필터
        document.getElementById('filterFloor').addEventListener('change', function (e) {
            self.state.filterFloor = e.target.value;
            Renderer.render();
        });

        // 테마 버튼
        document.getElementById('themeBtn').addEventListener('click', function () { cycleTheme(); });

        // 새로고침
        document.getElementById('refreshBtn').addEventListener('click', async function () {
            document.getElementById('loadingOverlay').classList.remove('hidden');
            try {
                var data = await ContactDB.fetchAll();
                self.state.contacts = data.contacts;
                self.state.rooms = data.rooms;
                self._adminPassword = data.password;
                Renderer.render();
                self.updateStatInfo();
                self.showToast('새로고침 완료', 'success');
            } finally {
                document.getElementById('loadingOverlay').classList.add('hidden');
            }
        });

        // 관리자 버튼
        document.getElementById('adminBtn').addEventListener('click', function () {
            if (self.state.isAdmin) {
                self._logoutAdmin();
            } else {
                document.getElementById('loginScreen').classList.remove('hidden');
                setTimeout(function () { document.getElementById('loginPassword').focus(); }, 50);
            }
        });

        // 로그인 모달
        document.getElementById('loginBtn').addEventListener('click', function () { self.doLogin(); });
        document.getElementById('loginCancel').addEventListener('click', function () {
            document.getElementById('loginScreen').classList.add('hidden');
            document.getElementById('loginPassword').value = '';
        });
        document.getElementById('loginPassword').addEventListener('keydown', function (e) {
            if (e.key === 'Enter') self.doLogin();
        });

        // 관리자 배너 버튼
        document.getElementById('adminLogout').addEventListener('click', function () { self._logoutAdmin(); });
        document.getElementById('adminDateBtn').addEventListener('click', function () { self.openDateModal(); });
        document.getElementById('dm-save').addEventListener('click', function () { self.saveDateFromModal(); });
        document.getElementById('dm-cancel').addEventListener('click', function () {
            document.getElementById('dateModal').classList.add('hidden');
        });
        document.getElementById('adminClearAll').addEventListener('click', function () {
            if (!confirm('⚠️ 모든 연락처를 삭제하시겠습니까?\n\n삭제 전 CSV 백업을 권장합니다.\n(CSV 내보내기 버튼 → 저장 후 삭제)')) return;
            ContactDB.clearAll().then(function () {
                App.state.contacts = {};
                App.state.rooms = {};
                ContactDB._audit = [];
                Renderer.render();
                App.updateStatInfo();
                App.showToast('전체 삭제 완료', 'success');
            });
        });

        // CSV 내보내기
        document.getElementById('exportCsvBtn').addEventListener('click', function () {
            App.exportCSV();
        });

        // 변경이력 모달
        document.getElementById('auditBtn').addEventListener('click', function () {
            App.openAuditModal();
        });
        document.getElementById('audit-close').addEventListener('click', function () {
            document.getElementById('auditModal').classList.add('hidden');
        });

        // 연락처 모달
        document.getElementById('cm-save').addEventListener('click', function () { self.saveContactFromModal(); });
        document.getElementById('cm-cancel').addEventListener('click', function () {
            document.getElementById('contactModal').classList.add('hidden');
        });
        document.getElementById('cm-delete').addEventListener('click', function () { self.deleteContactFromModal(); });

        // 방 모달
        document.getElementById('rm-save').addEventListener('click', function () { self.saveRoomFromModal(); });
        document.getElementById('rm-cancel').addEventListener('click', function () {
            document.getElementById('roomModal').classList.add('hidden');
        });
        document.getElementById('rm-delete').addEventListener('click', function () { self.deleteRoomFromModal(); });

        // 설정 모달
        document.getElementById('settingsBtn').addEventListener('click', function () {
            var s = ContactDB._data.settings || {};
            document.getElementById('st-mainPhone').value = s.mainPhone || '';
            document.getElementById('st-areaCode').value = s.areaCode || '02';
            document.getElementById('st-newPw').value = '';
            document.getElementById('st-newPwConfirm').value = '';
            document.getElementById('settingsModal').classList.remove('hidden');
        });
        document.getElementById('st-save').addEventListener('click', async function () {
            var mainPhone = document.getElementById('st-mainPhone').value.trim();
            var areaCode = document.getElementById('st-areaCode').value.trim() || '02';
            var newPw = document.getElementById('st-newPw').value;
            var newPwCfm = document.getElementById('st-newPwConfirm').value;

            var settingsToSave = { mainPhone: mainPhone, areaCode: areaCode };

            // 비밀번호 변경 처리
            if (newPw || newPwCfm) {
                if (newPw.length < 4) {
                    App.showToast('비밀번호는 4자 이상이어야 합니다', 'error'); return;
                }
                if (newPw !== newPwCfm) {
                    App.showToast('비밀번호가 일치하지 않습니다', 'error'); return;
                }
                // SHA-256으로 해시화 후 저장
                var hashed = await sha256Browser(newPw);
                settingsToSave.admin_password = hashed;
                // 메모리+로컬캐시의 비밀번호도 즉시 갱신
                App._adminPassword = hashed;
                ContactDB._data.settings.admin_password = hashed;
            }

            await ContactDB.saveSettings(settingsToSave);
            document.getElementById('settingsModal').classList.add('hidden');
            document.getElementById('st-newPw').value = '';
            document.getElementById('st-newPwConfirm').value = '';
            App.showToast(newPw ? '설정 및 비밀번호 변경 완료' : '설정 저장 완료', 'success');
        });
        document.getElementById('st-cancel').addEventListener('click', function () {
            document.getElementById('settingsModal').classList.add('hidden');
        });

        // 인쇄 버튼
        document.getElementById('printBtn').addEventListener('click', function () {
            var f = document.getElementById('printFloorSel').value;
            App.print(f || null);
        });
    },

    // 이벤트 위임 (canvas 클릭)
    bindCanvasEvents: function () {
        var self = this;
        var canvas = document.getElementById('canvas');

        if (canvas._clickHandler) canvas.removeEventListener('click', canvas._clickHandler);
        canvas._clickHandler = function (e) {
            var favBtn = e.target.closest('.cc-fav-btn');
            if (favBtn) {
                e.stopPropagation();
                Favorites.toggle(favBtn.dataset.id);
                Renderer.render();
                return;
            }

            var editBtn = e.target.closest('.cc-edit-btn');
            if (editBtn) { self.openContactModal(editBtn.dataset.id); return; }

            var addBtn = e.target.closest('.floor-add-btn');
            if (addBtn) { self.openContactModal(null, addBtn.dataset.floor); return; }

            var roomEditBtn = e.target.closest('.room-edit-btn');
            if (roomEditBtn) { self.openRoomModal(roomEditBtn.dataset.id); return; }

            var roomAddBtn = e.target.closest('.floor-room-btn');
            if (roomAddBtn) { self.openRoomModal(null, roomAddBtn.dataset.floor); return; }
        };
        canvas.addEventListener('click', canvas._clickHandler);

        if (canvas._dblclickHandler) canvas.removeEventListener('dblclick', canvas._dblclickHandler);
        canvas._dblclickHandler = function (e) {
            if (!self.state.isAdmin) return;
            var card = e.target.closest('.contact-card');
            if (card) self.openContactModal(card.dataset.id);
        };
        canvas.addEventListener('dblclick', canvas._dblclickHandler);

        // ===== 드래그앤드롭 순서 변경 (관리자 모드 전용) =====
        var _dragId = null;

        if (canvas._dragstartHandler) canvas.removeEventListener('dragstart', canvas._dragstartHandler);
        canvas._dragstartHandler = function (e) {
            if (!App.state.isAdmin) return;
            var card = e.target.closest('.contact-card');
            if (!card) return;
            _dragId = card.dataset.id;
            setTimeout(function () { card.classList.add('dragging'); }, 0);
            e.dataTransfer.effectAllowed = 'move';
        };
        canvas.addEventListener('dragstart', canvas._dragstartHandler);

        if (canvas._dragendHandler) canvas.removeEventListener('dragend', canvas._dragendHandler);
        canvas._dragendHandler = function () {
            canvas.querySelectorAll('.dragging').forEach(function (el) { el.classList.remove('dragging'); });
            canvas.querySelectorAll('.drag-over').forEach(function (el) { el.classList.remove('drag-over'); });
            _dragId = null;
        };
        canvas.addEventListener('dragend', canvas._dragendHandler);

        if (canvas._dragoverHandler) canvas.removeEventListener('dragover', canvas._dragoverHandler);
        canvas._dragoverHandler = function (e) {
            if (!_dragId) return;
            var card = e.target.closest('.contact-card');
            if (!card || card.dataset.id === _dragId) return;
            e.preventDefault();
            canvas.querySelectorAll('.drag-over').forEach(function (el) { el.classList.remove('drag-over'); });
            card.classList.add('drag-over');
        };
        canvas.addEventListener('dragover', canvas._dragoverHandler);

        if (canvas._dropHandler) canvas.removeEventListener('drop', canvas._dropHandler);
        canvas._dropHandler = function (e) {
            e.preventDefault();
            if (!_dragId) return;
            var targetCard = e.target.closest('.contact-card');
            if (!targetCard || targetCard.dataset.id === _dragId) { _dragId = null; return; }
            targetCard.classList.remove('drag-over');

            var draggedC = App.state.contacts[_dragId];
            var targetC = App.state.contacts[targetCard.dataset.id];
            if (!draggedC || !targetC) { _dragId = null; return; }

            // 서로 다른 층/방이면 이동 불가
            if (draggedC.floorId !== targetC.floorId || (draggedC.roomId || '') !== (targetC.roomId || '')) {
                App.showToast('같은 공간 내에서만 순서를 변경할 수 있습니다', 'error');
                _dragId = null;
                return;
            }

            // 동일 그룹 연락처를 order 순으로 정렬
            var group = Object.values(App.state.contacts)
                .filter(function (c) {
                    return c.floorId === draggedC.floorId && (c.roomId || '') === (draggedC.roomId || '');
                })
                .sort(function (a, b) { return (a.order || 0) - (b.order || 0); });

            var fromIdx = group.findIndex(function (c) { return c.id === _dragId; });
            group.splice(fromIdx, 1);
            var toIdx = group.findIndex(function (c) { return c.id === targetC.id; });
            // 카드 하반부에 드롭하면 뒤에 삽입
            var rect = targetCard.getBoundingClientRect();
            if (e.clientY > rect.top + rect.height / 2) toIdx++;
            group.splice(toIdx, 0, draggedC);

            // order 값 재할당 후 저장
            group.forEach(function (c, i) {
                c.order = i;
                App.state.contacts[c.id] = c;
                ContactDB._data.contacts[c.id] = c;
            });
            _dragId = null;
            Renderer.render();
            ContactDB._save();
        };
        canvas.addEventListener('drop', canvas._dropHandler);
    },

    updateFloorFilter: function () {
        var sel = document.getElementById('filterFloor');
        sel.innerHTML = '<option value="">전체 층</option>'
            + '<option value="_favorites">★ 즐겨찾기</option>';
        FLOORS.forEach(function (f) {
            sel.innerHTML += '<option value="' + f.id + '">' + f.name + '</option>';
        });

        var psel = document.getElementById('printFloorSel');
        psel.innerHTML = '<option value="">전체</option>';
        FLOORS.forEach(function (f) {
            psel.innerHTML += '<option value="' + f.id + '">' + f.name + '</option>';
        });
    },

    updateAdminUI: function () {
        var banner = document.getElementById('adminBanner');
        if (this.state.isAdmin) {
            banner.classList.remove('hidden');
            document.body.classList.add('admin-mode');
        } else {
            banner.classList.add('hidden');
            document.body.classList.remove('admin-mode');
        }
    },

    updateStatInfo: function () {
        var total = Object.keys(this.state.contacts).length;
        var el = document.getElementById('statInfo');
        if (!el) return;
        var txt = '총 ' + total + '명';
        var updated = ContactDB._data.settings && ContactDB._data.settings.lastUpdated;
        if (updated) {
            var p = updated.split('-');
            if (p.length === 3) txt += ' · 업데이트: ' + p[0] + '년 ' + p[1] + '월 ' + p[2] + '일';
        }
        el.textContent = txt;
    },

    _logoutAdmin: async function () {
        var btn = document.getElementById('adminLogout');
        if (btn) { btn.disabled = true; btn.textContent = '저장 중...'; }
        // _save()는 내부 catch에서 오류를 처리하고 throw하지 않으므로
        // saveFailBanner 표시 여부로 성공/실패를 판단
        await ContactDB._save();
        var failBanner = document.getElementById('saveFailBanner');
        if (failBanner && !failBanner.classList.contains('hidden')) {
            // 저장 실패 → 버튼 복구하고 중단
            if (btn) { btn.disabled = false; btn.textContent = '저장후나감'; }
            return;
        }
        this.state.isAdmin = false;
        sessionStorage.removeItem('ext_admin');
        Renderer.render();
        this.updateAdminUI();
        this.showToast('저장 완료 · 관리자 모드 종료', 'success');
    },

    doLogin: async function () {
        var pw = document.getElementById('loginPassword').value;
        // #6: 서버가 해시를 반환하면 해시 비교, 오프라인 폴백은 평문 비교
        var isMatch;
        if (isHashedBrowser(this._adminPassword)) {
            isMatch = (await sha256Browser(pw)) === this._adminPassword;
        } else {
            isMatch = pw === this._adminPassword; // 오프라인/미마이그레이션 폴백
        }
        if (isMatch) {
            this.state.isAdmin = true;
            sessionStorage.setItem('ext_admin', 'true');
            document.getElementById('loginScreen').classList.add('hidden');
            document.getElementById('loginPassword').value = '';
            Renderer.render();
            this.updateAdminUI();
            this.showToast('관리자 모드 활성화', 'success');
        } else {
            this.showToast('비밀번호가 틀렸습니다', 'error');
            document.getElementById('loginPassword').value = '';
        }
    },

    openContactModal: function (id, defaultFloor) {
        var contact = id ? this.state.contacts[id] : null;
        document.getElementById('cm-id').value = id || '';
        document.getElementById('cm-role').value = contact ? (contact.role || '') : '';
        document.getElementById('cm-name').value = contact ? (contact.name || '') : '';
        document.getElementById('cm-ext').value = contact ? (contact.ext || '') : '';
        document.getElementById('cm-phone').value = contact ? (contact.phone || '') : '';
        document.getElementById('cm-address').value = contact ? (contact.address || '') : '';

        var floorSel = document.getElementById('cm-floor');
        floorSel.innerHTML = '';
        FLOORS.forEach(function (f) {
            var opt = document.createElement('option');
            opt.value = f.id; opt.textContent = f.name;
            floorSel.appendChild(opt);
        });
        floorSel.value = contact ? contact.floorId : (defaultFloor || FLOORS[0].id);

        // 방 선택 드롭다운
        function updateRoomSelect(floorId, currentRoomId) {
            var roomSel = document.getElementById('cm-room');
            roomSel.innerHTML = '<option value="">방 없음 (자유)</option>';
            Object.values(App.state.rooms)
                .filter(function (r) { return r.floorId === floorId; })
                .sort(function (a, b) { return (a.order || 0) - (b.order || 0); })
                .forEach(function (r) {
                    var opt = document.createElement('option');
                    opt.value = r.id; opt.textContent = r.name;
                    roomSel.appendChild(opt);
                });
            roomSel.value = currentRoomId || '';
        }
        updateRoomSelect(floorSel.value, contact ? (contact.roomId || '') : '');
        if (floorSel._roomUpdateHandler) floorSel.removeEventListener('change', floorSel._roomUpdateHandler);
        floorSel._roomUpdateHandler = function () { updateRoomSelect(floorSel.value, ''); };
        floorSel.addEventListener('change', floorSel._roomUpdateHandler);

        document.getElementById('contactModalTitle').textContent = id ? '연락처 수정' : '연락처 추가';
        document.getElementById('cm-delete').style.display = id ? 'inline-flex' : 'none';
        document.getElementById('contactModal').classList.remove('hidden');
        setTimeout(function () { document.getElementById('cm-name').focus(); }, 50);
    },

    saveContactFromModal: async function () {
        var id = document.getElementById('cm-id').value;
        var name = document.getElementById('cm-name').value.trim();
        if (!name) { this.showToast('이름을 입력하세요', 'error'); return; }

        var isNew = !id;
        var existing = id ? this.state.contacts[id] : null;
        var contact = {
            id: id || uid(),
            role: document.getElementById('cm-role').value.trim(),
            name: name,
            ext: document.getElementById('cm-ext').value.trim(),
            phone: document.getElementById('cm-phone').value.trim(),
            address: document.getElementById('cm-address').value.trim(),
            floorId: document.getElementById('cm-floor').value,
            roomId: document.getElementById('cm-room').value,
            order: existing ? (existing.order || 0) : (Object.values(this.state.contacts).reduce(function (max, c) { return Math.max(max, c.order || 0); }, -1) + 1)
        };

        this.state.contacts[contact.id] = contact;
        await ContactDB.save(contact, isNew ? '연락처 추가' : '연락처 수정');
        document.getElementById('contactModal').classList.add('hidden');
        Renderer.render();
        this.updateStatInfo();
        this.showToast(isNew ? '연락처 추가 완료' : '연락처 수정 완료', 'success');
    },

    deleteContactFromModal: async function () {
        var id = document.getElementById('cm-id').value;
        if (!id || !confirm('이 연락처를 삭제하시겠습니까?')) return;
        delete this.state.contacts[id];
        await ContactDB.delete(id);
        document.getElementById('contactModal').classList.add('hidden');
        Renderer.render();
        this.updateStatInfo();
        this.showToast('연락처 삭제 완료', 'success');
    },

    openRoomModal: function (id, defaultFloor) {
        var room = id ? this.state.rooms[id] : null;
        document.getElementById('rm-id').value = id || '';
        document.getElementById('rm-name').value = room ? (room.name || '') : '';
        document.getElementById('rm-phone').value = room ? (room.mainPhone || '') : '';
        document.getElementById('rm-phone2').value = room ? (room.phone2 || '') : '';
        document.getElementById('rm-fax').value = room ? (room.fax || '') : '';

        var floorSel = document.getElementById('rm-floor');
        floorSel.innerHTML = '';
        FLOORS.forEach(function (f) {
            var opt = document.createElement('option');
            opt.value = f.id; opt.textContent = f.name;
            floorSel.appendChild(opt);
        });
        floorSel.value = room ? room.floorId : (defaultFloor || FLOORS[0].id);

        document.getElementById('roomModalTitle').textContent = id ? '방 수정' : '방 추가';
        document.getElementById('rm-delete').style.display = id ? 'inline-flex' : 'none';
        document.getElementById('roomModal').classList.remove('hidden');
        setTimeout(function () { document.getElementById('rm-name').focus(); }, 50);
    },

    saveRoomFromModal: async function () {
        var id = document.getElementById('rm-id').value;
        var name = document.getElementById('rm-name').value.trim();
        if (!name) { this.showToast('방 이름을 입력하세요', 'error'); return; }

        var isNew = !id;
        var existing = id ? this.state.rooms[id] : null;
        var room = {
            id: id || uid(),
            name: name,
            mainPhone: document.getElementById('rm-phone').value.trim(),
            phone2: document.getElementById('rm-phone2').value.trim(),
            fax: document.getElementById('rm-fax').value.trim(),
            floorId: document.getElementById('rm-floor').value,
            order: existing ? (existing.order || 0) : (Object.values(this.state.rooms).reduce(function (max, r) { return Math.max(max, r.order || 0); }, -1) + 1)
        };

        this.state.rooms[room.id] = room;
        await ContactDB.saveRoom(room, isNew ? '방 추가' : '방 수정');
        document.getElementById('roomModal').classList.add('hidden');
        Renderer.render();
        this.showToast(isNew ? '방 추가 완료' : '방 수정 완료', 'success');
    },

    deleteRoomFromModal: async function () {
        var id = document.getElementById('rm-id').value;
        if (!id || !confirm('이 방을 삭제하시겠습니까?\n소속 연락처는 자유 연락처로 이동됩니다.')) return;
        // 소속 연락처 roomId 초기화 (state + _data 동시 갱신)
        Object.values(this.state.contacts).forEach(function (c) {
            if (c.roomId === id) {
                c.roomId = '';
                ContactDB._data.contacts[c.id] = c;
            }
        });
        delete this.state.rooms[id];
        delete ContactDB._data.rooms[id];
        // deleteRoom 대신 _save()로 contacts + rooms를 한 번에 저장
        await ContactDB._save();
        document.getElementById('roomModal').classList.add('hidden');
        Renderer.render();
        this.showToast('방 삭제 완료', 'success');
    },

    showSearchResults: function (q) {
        var resultsEl = document.getElementById('searchResults');
        var searchInput = document.getElementById('searchInput');
        if (!resultsEl || !searchInput) return;

        var r = searchInput.getBoundingClientRect();
        resultsEl.style.top = (r.bottom + 4) + 'px';
        resultsEl.style.left = r.left + 'px';
        resultsEl.style.width = Math.max(300, r.width) + 'px';

        var lq = q.toLowerCase();
        var matches = Object.values(App.state.contacts).filter(function (c) {
            return (c.name || '').toLowerCase().includes(lq) ||
                (c.role || '').toLowerCase().includes(lq) ||
                (c.ext || '').includes(lq) ||
                (c.phone || '').includes(lq) ||
                (c.address || '').toLowerCase().includes(lq);
        });

        resultsEl.innerHTML = '';
        if (matches.length === 0) {
            resultsEl.innerHTML = '<div class="search-result-empty">검색 결과 없음</div>';
        } else {
            var self = this;
            matches.forEach(function (c) {
                var floor = FLOORS.find(function (f) { return f.id === c.floorId; });
                var room = c.roomId ? App.state.rooms[c.roomId] : null; // #13: 방 이름
                var parts = [floor ? floor.name : ''];
                if (room && room.name) parts.push(room.name);
                if (c.ext) parts.push('내선 ' + c.ext);
                if (c.phone) parts.push(c.phone);
                if (c.address) parts.push(c.address);

                var item = document.createElement('div');
                item.className = 'search-result-item';
                item.innerHTML =
                    '<div class="search-result-name">' + escHtml(c.name) + '</div>' +
                    '<div class="search-result-meta">' + escHtml(parts.filter(Boolean).join(' · ')) + '</div>';
                item.addEventListener('mousedown', function (e) { e.stopPropagation(); });
                item.addEventListener('click', function () {
                    self.hideSearchResults(true);
                    self.scrollToContact(c.id);
                });
                resultsEl.appendChild(item);
            });
        }
        resultsEl.classList.remove('hidden');
    },

    hideSearchResults: function (clearInput) {
        var resultsEl = document.getElementById('searchResults');
        if (resultsEl) resultsEl.classList.add('hidden');
        if (clearInput) {
            var si = document.getElementById('searchInput');
            if (si) si.value = '';
        }
    },

    scrollToContact: function (id) {
        var contact = App.state.contacts[id];
        if (!contact) return;

        if (App.state.filterFloor === '_favorites') {
            // 즐겨찾기 뷰: 해당 카드가 즐겨찾기에 없으면 전체 뷰로 전환
            if (!Favorites.has(id)) {
                App.state.filterFloor = '';
                var sel = document.getElementById('filterFloor');
                if (sel) sel.value = '';
                Renderer.render();
            }
        } else if (App.state.filterFloor && App.state.filterFloor !== contact.floorId) {
            App.state.filterFloor = '';
            var sel = document.getElementById('filterFloor');
            if (sel) sel.value = '';
            Renderer.render();
        }

        requestAnimationFrame(function () {
            var el = document.querySelector('.contact-card[data-id="' + id + '"]');
            if (!el) return;
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('search-highlight');
            setTimeout(function () { el.classList.remove('search-highlight'); }, 1500);
        });
    },

    openDateModal: function () {
        var cur = (ContactDB._data.settings && ContactDB._data.settings.lastUpdated) || '';
        document.getElementById('dm-date').value = cur;
        document.getElementById('dateModal').classList.remove('hidden');
        setTimeout(function () { document.getElementById('dm-date').focus(); }, 50);
    },

    saveDateFromModal: async function () {
        var val = document.getElementById('dm-date').value;
        if (!ContactDB._data.settings) ContactDB._data.settings = {};
        ContactDB._data.settings.lastUpdated = val;
        await ContactDB._save();
        document.getElementById('dateModal').classList.add('hidden');
        this.updateStatInfo();
        this.showToast('업데이트 날짜 저장 완료', 'success');
    },

    print: function (floorId) {
        var contacts = this.state.contacts;
        var rooms = this.state.rooms;
        var s = ContactDB._data.settings || {};
        var floors = floorId
            ? FLOORS.filter(function (f) { return f.id === floorId; })
            : FLOORS;

        var html = '<div class="print-title">'
            + '<strong>연세재활학교 내선번호부</strong>'
            + (s.lastUpdated ? '<span>' + escHtml(s.lastUpdated) + ' 기준</span>' : '')
            + '</div><div class="print-columns">';

        floors.forEach(function (floor) {
            var floorContacts = Object.values(contacts)
                .filter(function (c) { return c.floorId === floor.id; })
                .sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
            var floorRooms = Object.values(rooms)
                .filter(function (r) { return r.floorId === floor.id; })
                .sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
            if (!floorContacts.length && !floorRooms.length) return;

            html += '<div class="print-floor">';
            html += '<div class="print-floor-name">' + escHtml(floor.name) + '</div>';

            floorRooms.forEach(function (room) {
                var rc = floorContacts.filter(function (c) { return c.roomId === room.id; });
                html += '<div class="print-room">';
                html += '<span class="print-room-name">' + escHtml(room.name) + '</span>';
                if (room.mainPhone) html += '<span class="print-room-phone"> ' + escHtml(room.mainPhone) + '</span>';
                html += '<div class="print-persons">';
                rc.forEach(function (c) {
                    html += '<div class="print-row">'
                        + '<span class="pr-name">' + escHtml(c.name) + '</span>'
                        + (c.role ? '<span class="pr-role">' + escHtml(c.role) + '</span>' : '')
                        + (c.ext ? '<span class="pr-ext">' + escHtml(c.ext) + '</span>' : '')
                        + (c.phone ? '<span class="pr-phone">' + escHtml(c.phone) + '</span>' : '')
                        + '</div>';
                });
                html += '</div></div>';
            });

            var free = floorContacts.filter(function (c) { return !c.roomId; });
            free.forEach(function (c) {
                html += '<div class="print-row">'
                    + '<span class="pr-name">' + escHtml(c.name) + '</span>'
                    + (c.role ? '<span class="pr-role">' + escHtml(c.role) + '</span>' : '')
                    + (c.ext ? '<span class="pr-ext">' + escHtml(c.ext) + '</span>' : '')
                    + (c.phone ? '<span class="pr-phone">' + escHtml(c.phone) + '</span>' : '')
                    + '</div>';
            });

            html += '</div>';
        });

        html += '</div>';
        document.getElementById('printLayout').innerHTML = html;
        window.print();
    },

    // #14: CSV 내보내기
    exportCSV: function () {
        var rows = [['이름', '직책', '내선번호', '직통번호', '비고', '층', '방']];
        Object.values(App.state.contacts)
            .sort(function (a, b) {
                if (a.floorId !== b.floorId) return a.floorId < b.floorId ? -1 : 1;
                return (a.order || 0) - (b.order || 0);
            })
            .forEach(function (c) {
                var floor = FLOORS.find(function (f) { return f.id === c.floorId; });
                var room = c.roomId ? App.state.rooms[c.roomId] : null;
                rows.push([
                    c.name || '',
                    c.role || '',
                    c.ext || '',
                    c.phone || '',
                    c.address || '',
                    floor ? floor.name : '',
                    room ? room.name : ''
                ]);
            });
        var csv = rows.map(function (r) {
            return r.map(function (cell) { return '"' + String(cell).replace(/"/g, '""') + '"'; }).join(',');
        }).join('\r\n');
        var blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        var date = new Date().toLocaleDateString('ko-KR').replace(/\. /g, '-').replace('.', '');
        a.href = url; a.download = '내선번호부_' + date + '.csv'; a.click();
        URL.revokeObjectURL(url);
        this.showToast('CSV 다운로드 완료', 'success');
    },

    // #15: 변경이력 모달
    openAuditModal: function () {
        var audit = ContactDB._audit || [];
        var tbody = '';
        if (audit.length === 0) {
            tbody = '<tr><td colspan="3" style="text-align:center;color:#475569;padding:1rem;">변경이력이 없습니다</td></tr>';
        } else {
            audit.forEach(function (e) {
                var d = new Date(e.time);
                var ts = d.toLocaleDateString('ko-KR') + ' ' + d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
                tbody += '<tr style="border-bottom:1px solid rgba(255,255,255,0.06);">'
                    + '<td style="padding:0.45rem 0.5rem;font-size:0.75rem;color:#94a3b8;white-space:nowrap;">' + escHtml(ts) + '</td>'
                    + '<td style="padding:0.45rem 0.5rem;font-size:0.78rem;">' + escHtml(e.action) + '</td>'
                    + '<td style="padding:0.45rem 0.5rem;font-size:0.78rem;color:#e2e8f0;">' + escHtml(e.name) + '</td>'
                    + '</tr>';
            });
        }
        document.getElementById('auditTbody').innerHTML = tbody;
        document.getElementById('auditModal').classList.remove('hidden');
    },

    showToast: function (msg, type) {
        var t = document.getElementById('toast');
        t.textContent = msg;
        t.className = 'toast ' + (type || '');
        clearTimeout(this._toastTimer);
        setTimeout(function () { t.classList.add('show'); }, 10);
        this._toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2400);
    },

    // #9: 저장 실패 재시도 배너
    showSaveFailBanner: function (msg) {
        var banner = document.getElementById('saveFailBanner');
        var msgEl = document.getElementById('saveFailMsg');
        if (msgEl) msgEl.textContent = '저장 실패: ' + (msg || '네트워크 오류');
        if (banner) banner.classList.remove('hidden');
    },

    hideSaveFailBanner: function () {
        var banner = document.getElementById('saveFailBanner');
        if (banner) banner.classList.add('hidden');
    },

    retrySave: async function () {
        var banner = document.getElementById('saveFailBanner');
        var btn = document.getElementById('saveRetryBtn');
        if (btn) { btn.disabled = true; btn.textContent = '저장 중...'; }
        try {
            await ContactDB._save();
            // 성공 시 배너는 hideSaveFailBanner()가 _save 내부에서 호출
        } finally {
            if (btn) { btn.disabled = false; btn.textContent = '재시도'; }
        }
    }
};

document.addEventListener('DOMContentLoaded', function () {
    App.init();
});
