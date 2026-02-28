// ===== ExtensionMaster - Vercel KV API =====
import { kv } from '@vercel/kv';

const DATA_KEY        = 'extension_data_v4';
const DEFAULT_PASSWORD = '1234';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // ── GET: 데이터 조회 ──────────────────────────────
    if (req.method === 'GET') {
        try {
            const data = await kv.get(DATA_KEY);
            return res.status(200).json(
                data || { contacts: {}, rooms: {}, settings: { admin_password: DEFAULT_PASSWORD } }
            );
        } catch (e) {
            console.error('[data.js] GET 오류:', e);
            return res.status(500).json({ error: '데이터 조회 실패' });
        }
    }

    // ── POST: 데이터 저장 (관리자만) ─────────────────
    if (req.method === 'POST') {
        try {
            const { contacts, rooms, settings, adminPassword } = req.body;

            if (!contacts) {
                return res.status(400).json({ error: '잘못된 요청 형식' });
            }

            // 현재 저장된 비밀번호로 검증
            const current   = await kv.get(DATA_KEY);
            const currentPw = current?.settings?.admin_password || DEFAULT_PASSWORD;

            if (adminPassword !== currentPw) {
                return res.status(401).json({ error: '비밀번호가 틀렸습니다' });
            }

            await kv.set(DATA_KEY, { contacts, rooms: rooms || {}, settings: settings || {} });
            return res.status(200).json({ ok: true });
        } catch (e) {
            console.error('[data.js] POST 오류:', e);
            return res.status(500).json({ error: '데이터 저장 실패' });
        }
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
}
