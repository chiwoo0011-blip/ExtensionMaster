// ===== ExtensionMaster - Vercel KV API v2 =====
import { kv } from '@vercel/kv';
import crypto from 'crypto';

// ── 키 상수 ──────────────────────────────────────────────────────────
const LEGACY_KEY = 'extension_data_v4';   // 구버전 단일키 폴백용
const CONTACTS_KEY = 'em_contacts_v5';       // #8: 분리 저장
const ROOMS_KEY = 'em_rooms_v5';
const SETTINGS_KEY = 'em_settings_v5';
const AUDIT_KEY = 'em_audit_v5';          // #15: 변경이력
const RATE_PREFIX = 'em_rate:';

const DEFAULT_PASSWORD = '1234';
const MAX_ATTEMPTS = 15;  // Vercel 네트워크 재시도 대비 완화 (5 -> 15)
const BLOCK_TTL = 300;    // 5분 (900 -> 300)
const AUDIT_MAX = 20;     // 최대 보관 이력 수

// ── 보안 유틸 ─────────────────────────────────────────────────────────
function sha256(str) {
    return crypto.createHash('sha256').update(String(str)).digest('hex');
}
function isHashed(pw) {
    return typeof pw === 'string' && /^[a-f0-9]{64}$/.test(pw);
}
function toHash(pw) {
    return isHashed(pw) ? pw : sha256(pw);
}

// ── 데이터 로드 (분리 키 우선, 레거시 단일키 폴백) ─────────────────
async function loadData() {
    const [contacts, rooms, settings, audit] = await Promise.all([
        kv.get(CONTACTS_KEY),
        kv.get(ROOMS_KEY),
        kv.get(SETTINGS_KEY),
        kv.get(AUDIT_KEY),
    ]);
    if (contacts !== null) {
        return { contacts: contacts || {}, rooms: rooms || {}, settings: settings || {}, audit: audit || [] };
    }
    const legacy = await kv.get(LEGACY_KEY);
    const base = legacy || { contacts: {}, rooms: {}, settings: {} };
    return { ...base, audit: audit || [] };
}

async function saveData(contacts, rooms, settings) {
    await Promise.all([
        kv.set(CONTACTS_KEY, contacts),
        kv.set(ROOMS_KEY, rooms),
        kv.set(SETTINGS_KEY, settings),
    ]);
}

// ── 핸들러 ───────────────────────────────────────────────────────────
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    // ── GET ──────────────────────────────────────────────────────────
    if (req.method === 'GET') {
        try {
            const data = await loadData();
            const settings = data.settings || {};
            const storedPw = settings.admin_password || DEFAULT_PASSWORD;
            return res.status(200).json({
                contacts: data.contacts || {},
                rooms: data.rooms || {},
                audit: data.audit || [],
                settings: {
                    ...settings,
                    admin_password: toHash(storedPw)
                }
            });
        } catch (e) {
            console.error('[data.js] GET 오류:', e);
            return res.status(500).json({ error: '데이터 조회 실패' });
        }
    }

    // ── POST ─────────────────────────────────────────────────────────
    if (req.method === 'POST') {
        // Rate Limiting
        const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
        const rateKey = RATE_PREFIX + ip;
        const attempts = (await kv.get(rateKey)) || 0;

        if (attempts >= MAX_ATTEMPTS) {
            return res.status(429).json({
                error: `비밀번호 시도 횟수 초과. ${BLOCK_TTL / 60}분 후 다시 시도하세요.`
            });
        }

        try {
            const { contacts, rooms, settings, adminPassword, auditEntry } = req.body;
            if (!contacts) return res.status(400).json({ error: '잘못된 요청 형식' });

            // 비밀번호 검증
            const data = await loadData();
            const storedPw = data.settings?.admin_password || DEFAULT_PASSWORD;
            const isMatch = isHashed(storedPw)
                ? adminPassword === storedPw
                : adminPassword === sha256(storedPw);

            if (!isMatch) {
                await kv.set(rateKey, attempts + 1, { ex: BLOCK_TTL });
                return res.status(401).json({ error: '비밀번호가 틀렸습니다' });
            }

            await kv.del(rateKey);

            // settings 비밀번호 해시화
            const newSettings = { ...(settings || {}) };
            newSettings.admin_password = newSettings.admin_password
                ? toHash(newSettings.admin_password)
                : toHash(storedPw);

            // #15: Audit Log 추가
            if (auditEntry && auditEntry.action) {
                const currentAudit = data.audit || [];
                const entry = {
                    time: new Date().toISOString(),
                    action: auditEntry.action,
                    name: auditEntry.name || '',
                };
                const newAudit = [entry, ...currentAudit].slice(0, AUDIT_MAX);
                await kv.set(AUDIT_KEY, newAudit);
            }

            await saveData(contacts, rooms || {}, newSettings);
            return res.status(200).json({ ok: true });

        } catch (e) {
            console.error('[data.js] POST 오류:', e);
            return res.status(500).json({ error: '데이터 저장 실패' });
        }
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
}
