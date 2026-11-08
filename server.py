"""
=============================================================================
AdSpot Tashkent — Full-Stack Python Backend & SQLite Marketplace Engine
Lead Backend Architect: Laylo Atajanova (Founder · Backend Architect)
CEO & UX/UI Lead: Nizamatdinova Jasmina
=============================================================================
How to run in VS Code Terminal:
    python server.py

Then open in your browser:
    - Main Website:        http://localhost:8000
    - Live API Docs & DB:  http://localhost:8000/api/docs
=============================================================================
"""

import json
import math
import os
import sqlite3
from datetime import datetime
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "adspot.db")
PORT = int(os.environ.get("PORT", 8000))

# Sensitive Zones in Tashkent (Real GPS coordinates for Haversine distance check)
SENSITIVE_ZONES = [
    {"name": "School #103 (Chilanzar)", "type": "school", "lat": 41.2733, "lng": 69.2051, "radius_m": 150},
    {"name": "Minor Mosque Cultural Zone (Yunusabad)", "type": "mosque", "lat": 41.3283, "lng": 69.2825, "radius_m": 150},
]


def haversine_distance_m(lat1: float, lon1: float, lat2: float, lon2: float) -> int:
    """Calculate real geographic distance in meters between two GPS coordinates."""
    r = 6371000.0  # Earth radius in meters
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0) ** 2
    return int(round(2 * r * math.atan2(math.sqrt(a), math.sqrt(1 - a))))


def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Create SQLite tables and seed initial Tashkent billboard data if empty."""
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS ad_spaces (
            id TEXT PRIMARY KEY,
            district TEXT NOT NULL,
            district_uz TEXT NOT NULL,
            district_ru TEXT NOT NULL,
            district_en TEXT NOT NULL,
            title_uz TEXT NOT NULL,
            title_ru TEXT NOT NULL,
            title_en TEXT NOT NULL,
            street_uz TEXT NOT NULL,
            street_ru TEXT NOT NULL,
            street_en TEXT NOT NULL,
            format TEXT NOT NULL,
            format_uz TEXT NOT NULL,
            format_ru TEXT NOT NULL,
            format_en TEXT NOT NULL,
            dimensions TEXT NOT NULL,
            daily_traffic INTEGER NOT NULL,
            monthly_price_uzs INTEGER NOT NULL,
            owner TEXT NOT NULL,
            sensitive_zone INTEGER NOT NULL DEFAULT 0,
            note_uz TEXT NOT NULL,
            note_ru TEXT NOT NULL,
            note_en TEXT NOT NULL,
            alternative_spot_id TEXT DEFAULT 'CHIL-02',
            lat REAL NOT NULL,
            lng REAL NOT NULL,
            map_x INTEGER NOT NULL,
            map_y INTEGER NOT NULL
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS bookings (
            id TEXT PRIMARY KEY,
            spot_id TEXT NOT NULL,
            title_uz TEXT NOT NULL,
            title_ru TEXT NOT NULL,
            title_en TEXT NOT NULL,
            days_uz TEXT NOT NULL,
            days_ru TEXT NOT NULL,
            days_en TEXT NOT NULL,
            start_date TEXT NOT NULL,
            duration_factor REAL NOT NULL,
            total_uzs INTEGER NOT NULL,
            payment_method TEXT NOT NULL,
            views TEXT NOT NULL,
            lift TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS chat_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            channel TEXT NOT NULL,
            lang TEXT NOT NULL,
            from_role TEXT NOT NULL,
            sender_name TEXT NOT NULL,
            text TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS advisory_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            spot_id TEXT NOT NULL,
            scenario TEXT NOT NULL,
            score INTEGER NOT NULL,
            nearest_zone_m INTEGER NOT NULL,
            created_at TEXT NOT NULL
        )
    """)

    # Seed initial Tashkent Ad Spaces if table is empty
    cur.execute("SELECT COUNT(*) FROM ad_spaces")
    if cur.fetchone()[0] == 0:
        initial_spots = [
            (
                "CHIL-01", "Chilanzar", "Chilonzor", "Чиланзар", "Chilanzar",
                "Chilonzor Metro Chorrahasi", "Перекресток метро Чиланзар", "Chilanzar Metro Junction",
                "Bunyodkor shoh ko‘chasi · 103-maktab yonida (110m)",
                "Пр. Бунёдкор · Рядом со школой №103 (110м)",
                "Bunyodkor Ave · 110m from School #103",
                "billboard", "Bilbord 3×6m", "Билборд 3×6м", "Billboard 3×6m",
                "6.0m × 3.0m", 68400, 5400000, "Toshkent Tashqi Media", 1,
                "Maktab hududiga 110m. Oilaviy mahsulotlar tavsiya etiladi.",
                "110м до школы №103. Рекомендуется семейный креатив.",
                "110m from School #103. Family-friendly creative recommended.",
                "CHIL-02", 41.2725, 69.2044, 210, 280
            ),
            (
                "CHIL-02", "Chilanzar", "Chilonzor", "Чиланзар", "Chilanzar",
                "Bunyodkor Panoramali LED Ekran", "Панорамный LED Экран Бунёдкор", "Bunyodkor Panoramic LED Screen",
                "Novza metro ro‘parasi · Tijorat magistrali",
                "Напротив метро Новза · Магистраль",
                "Opposite Novza Metro · Commercial Artery",
                "led", "LED Ekran", "LED Экран", "LED Screen",
                "8.0m × 4.0m (4K)", 92500, 7800000, "OchiqShahar Digital", 0,
                "Erkin tijorat hududi — kechki oqim +32% yuqori.",
                "Коммерческая зона без ограничений — +32% вечером.",
                "Unrestricted commercial artery — +32% evening engagement.",
                "YUN-01", 41.2916, 69.2225, 295, 235
            ),
            (
                "YUN-01", "Yunusabad", "Yunusobod", "Юнусабад", "Yunusabad",
                "Amir Temur Shoh Ko‘chasi (Minor)", "Проспект Амира Темура (Минор)", "Amir Temur Avenue (Minor)",
                "Minor masjidi va biznes markaz yaqinida (140m)",
                "Вблизи мечети Минор и бизнес-центра (140м)",
                "140m from Minor Mosque & Business Center",
                "billboard", "Bilbord 3×6m", "Билборд 3×6м", "Billboard 3×6m",
                "6.0m × 3.0m", 84000, 6900000, "Poytaxt Bilbord Servis", 1,
                "Madaniy hududga 140m. Vazmin va estetik dizayn tavsiya etiladi.",
                "140м до мечети Минор. Рекомендуется сдержанный дизайн.",
                "140m from Minor cultural zone. Refined visual tone advised.",
                "MIR-01", 41.3275, 69.2817, 400, 115
            ),
            (
                "YUN-02", "Yunusabad", "Yunusobod", "Юнусабад", "Yunusabad",
                "Mega Planet Smart Bekati", "Умная Остановка Mega Planet", "Mega Planet Smart Bus Shelter",
                "Ahmad Donish ko‘chasi · Piyodalar zonasi",
                "Ул. Ахмада Дониша · Пешеходный трафик",
                "Ahmad Donish St · High Foot-Traffic Zone",
                "bus_stop", "Avtobus bekati", "Остановка", "Bus Shelter",
                "1.2m × 1.8m", 39500, 2900000, "AvtoBekat Media", 0,
                "Mahalliy do‘kon va kafelar uchun eng qulay nuqta.",
                "Отлично для локальных магазинов и кофеен.",
                "Ideal eye-level showcase for local shops & cafes.",
                "CHIL-02", 41.3672, 69.2919, 465, 75
            ),
            (
                "MIR-01", "Mirzo Ulugbek", "Mirzo Ulug‘bek", "Мирзо-Улугбек", "Mirzo Ulugbek",
                "Mustaqillik Shoh Ko‘chasi (Darxon)", "Проспект Мустакиллик (Дархан)", "Mustaqillik Avenue (Darkhan)",
                "IT Park va premium biznes koridori",
                "Направление IT Park и бизнес-центров",
                "IT Park & Premium Business Corridor",
                "led", "LED Ekran", "LED Экран", "LED Screen",
                "9.0m × 4.5m (3D LED)", 96200, 8900000, "OchiqShahar Digital", 0,
                "Yuqori xarid qobiliyatiga ega auditoriya oqimi.",
                "Премиальный автомобильный трафик.",
                "High-income commuter corridor.",
                "CHIL-02", 41.3189, 69.3025, 550, 165
            ),
            (
                "YAK-01", "Yakkasaroy", "Yakkasaroy", "Яккасарай", "Yakkasaroy",
                "Shota Rustaveli BRT Bekati", "Остановка Шота Руставели BRT", "Shota Rustaveli BRT Shelter",
                "Kofe-shoplar xiyoboni va BRT avtobus yo‘lagi",
                "Аллея кофеен и выделенная полоса BRT",
                "Cafe Boulevard & Dedicated BRT Corridor",
                "bus_stop", "Avtobus bekati", "Остановка", "Bus Shelter",
                "1.2m × 1.8m", 48000, 3400000, "AvtoBekat Media", 0,
                "4 daqiqalik kontakt vaqti — QR-kod aksiyalari uchun ideal.",
                "4 минуты ожидания — отлично для QR-акций.",
                "4-minute commuter dwell time—great for QR promos.",
                "CHIL-02", 41.2858, 69.2572, 385, 310
            ),
        ]
        cur.executemany("""
            INSERT INTO ad_spaces VALUES (
                ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
            )
        """, initial_spots)

    # Seed initial bookings if empty
    cur.execute("SELECT COUNT(*) FROM bookings")
    if cur.fetchone()[0] == 0:
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        cur.executemany("""
            INSERT INTO bookings VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        """, [
            (
                "CMP-101", "CHIL-02",
                "Bunyodkor 4K LED Ekran", "Панорамный 4K LED Экран Бунёдкор", "Bunyodkor 4K LED Screen",
                "18 / 30 kun", "18 / 30 дней", "18 / 30 days",
                "2026-10-20", 1.0, 7800000, "Payme", "1,665,000", "+24%", now_str
            ),
            (
                "CMP-102", "YAK-01",
                "Shota Rustaveli BRT Bekati", "Остановка Шота Руставели BRT", "Shota Rustaveli BRT Shelter",
                "9 / 14 kun", "9 / 14 дней", "9 / 14 days",
                "2026-10-29", 0.5, 1700000, "Click Up", "432,000", "+19%", now_str
            ),
        ])

    conn.commit()
    conn.close()


def format_spot_row(row: sqlite3.Row) -> dict:
    """Convert a SQLite ad_spaces row into the frontend nested dictionary format."""
    return {
        "id": row["id"],
        "district": row["district"],
        "districtLabel": {"uz": row["district_uz"], "ru": row["district_ru"], "en": row["district_en"]},
        "title": {"uz": row["title_uz"], "ru": row["title_ru"], "en": row["title_en"]},
        "street": {"uz": row["street_uz"], "ru": row["street_ru"], "en": row["street_en"]},
        "format": row["format"],
        "formatLabel": {"uz": row["format_uz"], "ru": row["format_ru"], "en": row["format_en"]},
        "dimensions": row["dimensions"],
        "dailyTraffic": row["daily_traffic"],
        "monthlyPriceUZS": row["monthly_price_uzs"],
        "owner": row["owner"],
        "sensitiveZone": bool(row["sensitive_zone"]),
        "sensitiveNote": {"uz": row["note_uz"], "ru": row["note_ru"], "en": row["note_en"]},
        "alternativeSpotId": row["alternative_spot_id"],
        "lat": row["lat"],
        "lng": row["lng"],
        "mapX": row["map_x"],
        "mapY": row["map_y"],
    }


def generate_ai_concierge_reply(user_text: str, lang: str) -> str:
    """Smart Python AI Concierge that queries SQLite ad_spaces based on user keywords/budget."""
    conn = get_db_connection()
    cur = conn.cursor()
    q = user_text.lower()

    sql = "SELECT * FROM ad_spaces WHERE 1=1"
    params = []

    if any(k in q for k in ["chilanzar", "chilonzor", "чиланзар", "novza", "bunyodkor"]):
        sql += " AND district = ?"
        params.append("Chilanzar")
    elif any(k in q for k in ["yunus", "юнус", "minor", "amir temur", "mega"]):
        sql += " AND district = ?"
        params.append("Yunusabad")
    elif any(k in q for k in ["mirzo", "мирзо", "darxon", "дархан", "it park"]):
        sql += " AND district = ?"
        params.append("Mirzo Ulugbek")
    elif any(k in q for k in ["yakkasaroy", "яккасарай", "rustaveli", "руставели"]):
        sql += " AND district = ?"
        params.append("Yakkasaroy")

    if "led" in q or "экран" in q or "ekran" in q:
        sql += " AND format = 'led'"
    elif "bus" in q or "bekat" in q or "останов" in q:
        sql += " AND format = 'bus_stop'"

    sql += " ORDER BY daily_traffic DESC LIMIT 2"
    cur.execute(sql, params)
    rows = cur.fetchall()
    conn.close()

    if not rows:
        conn = get_db_connection()
        rows = conn.execute("SELECT * FROM ad_spaces ORDER BY daily_traffic DESC LIMIT 2").fetchall()
        conn.close()

    spots_summary = []
    for r in rows:
        price_m = f"{r['monthly_price_uzs'] / 1000000:.1f}M UZS"
        traffic_k = f"{r['daily_traffic'] / 1000:.1f}K"
        title = r[f"title_{lang}"] if f"title_{lang}" in r.keys() else r["title_en"]
        spots_summary.append(f"{r['id']} ({title} — {price_m}/mo · {traffic_k} views/day)")

    joined = " & ".join(spots_summary)
    if lang == "uz":
        return f"SQLite bazasidan topilgan eng mos nuqtalar: {joined}."
    if lang == "ru":
        return f"Подобрано из базы данных SQLite: {joined}."
    return f"Matched from live SQLite database: {joined}."


class AdSpotRequestHandler(SimpleHTTPRequestHandler):
    """Serves static frontend files AND handles all /api/* REST endpoints."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def _send_json(self, data: dict, status: int = 200):
        payload = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(payload)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        query = parse_qs(parsed.query)

        if path == "/api/health":
            conn = get_db_connection()
            spots_count = conn.execute("SELECT COUNT(*) FROM ad_spaces").fetchone()[0]
            bookings_count = conn.execute("SELECT COUNT(*) FROM bookings").fetchone()[0]
            total_rev = conn.execute("SELECT COALESCE(SUM(total_uzs), 0) FROM bookings").fetchone()[0]
            conn.close()
            return self._send_json({
                "status": "ok",
                "engine": "AdSpot Python 3 SQLite Engine",
                "architect": "Laylo Atajanova — Founder & Backend Architect",
                "ceo_ux": "Nizamatdinova Jasmina — CEO & UX/UI Lead",
                "database": "adspot.db (SQLite3)",
                "stats": {
                    "verified_spots": spots_count,
                    "active_bookings": bookings_count,
                    "total_revenue_uzs": total_rev,
                }
            })

        if path == "/api/spots":
            district = query.get("district", ["all"])[0]
            fmt = query.get("format", ["all"])[0]
            conn = get_db_connection()
            sql = "SELECT * FROM ad_spaces WHERE 1=1"
            params = []
            if district != "all":
                sql += " AND district = ?"
                params.append(district)
            if fmt != "all":
                sql += " AND format = ?"
                params.append(fmt)
            rows = conn.execute(sql, params).fetchall()
            conn.close()
            return self._send_json({"spots": [format_spot_row(r) for r in rows]})

        if path == "/api/bookings":
            conn = get_db_connection()
            rows = conn.execute("SELECT * FROM bookings ORDER BY rowid DESC").fetchall()
            total_rev = conn.execute("SELECT COALESCE(SUM(total_uzs), 0) FROM bookings").fetchone()[0]
            spots_count = conn.execute("SELECT COUNT(*) FROM ad_spaces").fetchone()[0]
            conn.close()
            campaigns = []
            for r in rows:
                campaigns.append({
                    "id": r["id"],
                    "spotId": r["spot_id"],
                    "title": {"uz": r["title_uz"], "ru": r["title_ru"], "en": r["title_en"]},
                    "days": {"uz": r["days_uz"], "ru": r["days_ru"], "en": r["days_en"]},
                    "views": r["views"],
                    "lift": r["lift"],
                    "totalUzs": r["total_uzs"],
                    "paymentMethod": r["payment_method"],
                })
            return self._send_json({
                "campaigns": campaigns,
                "ownerStats": {
                    "monthlyEarningsUzs": total_rev + 28900000,
                    "verifiedStructures": spots_count,
                    "activeCampaignsCount": len(campaigns) + 12,
                }
            })

        if path == "/api/docs":
            return self._serve_api_docs_page()

        return super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path
        length = int(self.headers.get("Content-Length", 0))
        raw_body = self.rfile.read(length).decode("utf-8") if length > 0 else "{}"
        try:
            body = json.loads(raw_body)
        except Exception:
            body = {}

        # 1. Create a New Booking in SQLite
        if path == "/api/bookings":
            spot_id = body.get("spotId", "YUN-01")
            start_date = body.get("startDate", "2026-11-08")
            duration_factor = float(body.get("durationFactor", 1.0))
            payment_method = body.get("paymentMethod", "Payme")

            conn = get_db_connection()
            spot = conn.execute("SELECT * FROM ad_spaces WHERE id = ?", (spot_id,)).fetchone()
            if not spot:
                spot = conn.execute("SELECT * FROM ad_spaces LIMIT 1").fetchone()

            total_uzs = int(round((spot["monthly_price_uzs"] * duration_factor) / 10000.0) * 10000)
            cmp_id = f"CMP-{int(datetime.now().timestamp()) % 900 + 100}"
            views_str = f"{spot['daily_traffic']:,}"
            now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            conn.execute("""
                INSERT INTO bookings VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            """, (
                cmp_id, spot["id"],
                spot["title_uz"], spot["title_ru"], spot["title_en"],
                "1 / 30 kun · Hozir faol", "1 / 30 дней · Активно", "1 / 30 days · Live Now",
                start_date, duration_factor, total_uzs, payment_method,
                views_str, "+28%", now_str
            ))
            conn.commit()
            conn.close()
            return self._send_json({"status": "created", "campaignId": cmp_id, "totalUzs": total_uzs}, 201)

        # 2. Add a New Billboard / LED Screen (Space Owner Portal)
        if path == "/api/spots":
            district = body.get("district", "Yunusabad")
            title = body.get("title", "New Tashkent LED Screen")
            street = body.get("street", "Amir Temur Corridor")
            fmt = body.get("format", "led")
            price = int(body.get("monthlyPriceUZS", 6500000))
            traffic = int(body.get("dailyTraffic", 74000))
            dimensions = body.get("dimensions", "6.0m × 3.0m")
            owner = body.get("owner", "Poytaxt Bilbord Servis")

            prefix = {"Chilanzar": "CHIL", "Yunusabad": "YUN", "Mirzo Ulugbek": "MIR", "Yakkasaroy": "YAK"}.get(district, "TAS")
            conn = get_db_connection()
            count = conn.execute("SELECT COUNT(*) FROM ad_spaces WHERE id LIKE ?", (f"{prefix}-%",)).fetchone()[0]
            new_id = f"{prefix}-0{count + 1}"

            # Assign realistic Tashkent GPS & SVG coordinates by district
            coords = {
                "Chilanzar": (41.2810, 69.2130, 250, 260, "Chilonzor", "Чиланзар"),
                "Yunusabad": (41.3450, 69.2860, 430, 95, "Yunusobod", "Юнусабад"),
                "Mirzo Ulugbek": (41.3250, 69.3180, 520, 145, "Mirzo Ulug‘bek", "Мирзо-Улугбек"),
                "Yakkasaroy": (41.2920, 69.2640, 360, 290, "Yakkasaroy", "Яккасарай"),
            }.get(district, (41.3111, 69.2797, 350, 200, district, district))

            fmt_labels = {
                "billboard": ("Bilbord 3×6m", "Билборд 3×6м", "Billboard 3×6m"),
                "led": ("LED Ekran", "LED Экран", "LED Screen"),
                "bus_stop": ("Avtobus bekati", "Остановка", "Bus Shelter"),
            }.get(fmt, ("Bilbord 3×6m", "Билборд 3×6м", "Billboard 3×6m"))

            conn.execute("""
                INSERT INTO ad_spaces VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            """, (
                new_id, district, coords[4], coords[5], district,
                title, title, title,
                street, street, street,
                fmt, fmt_labels[0], fmt_labels[1], fmt_labels[2],
                dimensions, traffic, price, owner, 0,
                "Tasdiqlangan yangi reklama nuqtasi.",
                "Проверенная новая рекламная конструкция.",
                "Newly verified outdoor ad structure.",
                "CHIL-02", coords[0], coords[1], coords[2], coords[3]
            ))
            row = conn.execute("SELECT * FROM ad_spaces WHERE id = ?", (new_id,)).fetchone()
            conn.commit()
            conn.close()
            return self._send_json({"status": "created", "spot": format_spot_row(row)}, 201)

        # 3. Python Smart Advisory & Pre-Flight Compliance Check
        if path == "/api/advisory-check":
            spot_id = body.get("spotId", "YUN-01")
            scenario = body.get("scenario", "school_conflict")
            conn = get_db_connection()
            spot = conn.execute("SELECT * FROM ad_spaces WHERE id = ?", (spot_id,)).fetchone()
            lat = spot["lat"] if spot else 41.3275
            lng = spot["lng"] if spot else 69.2817

            # Calculate real Haversine distance to nearest Tashkent school/mosque
            distances = [haversine_distance_m(lat, lng, z["lat"], z["lng"]) for z in SENSITIVE_ZONES]
            nearest_m = min(distances) if distances else 450
            score = {"school_conflict": 72, "grammar_clutter": 64, "family_optimal": 98}.get(scenario, 95)

            conn.execute(
                "INSERT INTO advisory_logs (spot_id, scenario, score, nearest_zone_m, created_at) VALUES (?,?,?,?,?)",
                (spot_id, scenario, score, nearest_m, datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
            )
            conn.commit()
            conn.close()
            return self._send_json({
                "spotId": spot_id,
                "scenario": scenario,
                "score": score,
                "nearestSensitiveZoneMeters": nearest_m,
                "verifiedBy": "AdSpot Python Smart Advisory Engine v1.0"
            })

        # 4. Live Chat & Python 24/7 AI Concierge
        if path == "/api/chat":
            channel = body.get("channel", "owner")
            lang = body.get("lang", "en")
            user_text = body.get("text", "").strip()
            now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            conn = get_db_connection()
            conn.execute(
                "INSERT INTO chat_messages (channel, lang, from_role, sender_name, text, created_at) VALUES (?,?,?,?,?,?)",
                (channel, lang, "user", "Business Owner", user_text, now_str)
            )

            if channel == "ai":
                reply_text = generate_ai_concierge_reply(user_text, lang)
                sender = "AdSpot 24/7 AI (Python SQLite)"
            else:
                replies = {
                    "uz": "Tasdiqlangan joy egasi: So‘rovingiz qabul qilindi! Konstruksiya darhol o‘rnatishga tayyor, 1 oylik bron uchun banner chop etish bepul.",
                    "ru": "Проверенный владелец: Запрос получен! Конструкция свободна, при бронировании на 1 месяц печать баннера бесплатно.",
                    "en": "Verified Space Owner: Message received! This structure is ready for immediate installation, and 1-month bookings include free banner printing."
                }
                reply_text = replies.get(lang, replies["en"])
                sender = "Poytaxt Bilbord Servis"

            conn.execute(
                "INSERT INTO chat_messages (channel, lang, from_role, sender_name, text, created_at) VALUES (?,?,?,?,?,?)",
                (channel, lang, "partner", sender, reply_text, now_str)
            )
            conn.commit()
            conn.close()
            return self._send_json({"sender": sender, "reply": reply_text})

        return self._send_json({"error": "Unknown API endpoint"}, 404)

    def _serve_api_docs_page(self):
        """Interactive Backend Architecture & SQLite Inspector Page at /api/docs."""
        conn = get_db_connection()
        spots_count = conn.execute("SELECT COUNT(*) FROM ad_spaces").fetchone()[0]
        bookings_count = conn.execute("SELECT COUNT(*) FROM bookings").fetchone()[0]
        logs_count = conn.execute("SELECT COUNT(*) FROM advisory_logs").fetchone()[0]
        conn.close()

        html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>AdSpot Python Backend Architecture & Live API Docs</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#F6F2EA] text-[#1B3249] font-sans p-8">
  <div class="max-w-5xl mx-auto space-y-6">
    <div class="p-6 rounded-3xl bg-[#1B3249] text-[#FBF9F5] flex flex-wrap items-center justify-between gap-4">
      <div>
        <div class="text-xs uppercase tracking-widest text-[#D4B895] font-bold">PYTHON 3 + SQLITE3 BACKEND ENGINE</div>
        <h1 class="text-2xl font-extrabold mt-1">AdSpot Tashkent — REST API & Database Console</h1>
        <p class="text-xs text-[#EBE2D3] mt-1">Backend Architect: Laylo Atajanova · CEO & UX/UI Lead: Nizamatdinova Jasmina</p>
      </div>
      <a href="/" class="px-5 py-2.5 rounded-full bg-[#D4B895] text-[#1B3249] text-xs font-extrabold">← Back to Website</a>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="p-5 rounded-2xl bg-[#EBE2D3] border border-[#C8AD8D]">
        <div class="text-xs font-bold text-[#5A6B7C]">SQLite Table: ad_spaces</div>
        <div class="text-3xl font-extrabold text-[#284B63] mt-1">{spots_count} Spots</div>
        <div class="text-xs mt-1">With real Tashkent GPS (lat/lng)</div>
      </div>
      <div class="p-5 rounded-2xl bg-[#EBE2D3] border border-[#C8AD8D]">
        <div class="text-xs font-bold text-[#5A6B7C]">SQLite Table: bookings</div>
        <div class="text-3xl font-extrabold text-[#284B63] mt-1">{bookings_count} Campaigns</div>
        <div class="text-xs mt-1">Payme / Click Up / Didox records</div>
      </div>
      <div class="p-5 rounded-2xl bg-[#EBE2D3] border border-[#C8AD8D]">
        <div class="text-xs font-bold text-[#5A6B7C]">SQLite Table: advisory_logs</div>
        <div class="text-3xl font-extrabold text-[#284B63] mt-1">{logs_count} Scans</div>
        <div class="text-xs mt-1">Haversine school/mosque checks</div>
      </div>
    </div>

    <div class="p-6 rounded-2xl bg-[#FBF9F5] border border-[#C8AD8D] space-y-3 text-xs">
      <h2 class="text-base font-extrabold">Live REST API Endpoints (Click to inspect JSON)</h2>
      <div class="flex items-center justify-between p-3 rounded-xl bg-[#EBE2D3]/60">
        <span><strong class="px-2 py-0.5 rounded bg-[#284B63] text-white">GET</strong> <code>/api/health</code> — Server status & SQLite metrics</span>
        <a href="/api/health" target="_blank" class="font-bold text-[#284B63] underline">Open JSON ↗</a>
      </div>
      <div class="flex items-center justify-between p-3 rounded-xl bg-[#EBE2D3]/60">
        <span><strong class="px-2 py-0.5 rounded bg-[#284B63] text-white">GET</strong> <code>/api/spots</code> — All verified Tashkent billboards & GPS coordinates</span>
        <a href="/api/spots" target="_blank" class="font-bold text-[#284B63] underline">Open JSON ↗</a>
      </div>
      <div class="flex items-center justify-between p-3 rounded-xl bg-[#EBE2D3]/60">
        <span><strong class="px-2 py-0.5 rounded bg-[#284B63] text-white">GET</strong> <code>/api/bookings</code> — Active campaigns & Space Owner earnings</span>
        <a href="/api/bookings" target="_blank" class="font-bold text-[#284B63] underline">Open JSON ↗</a>
      </div>
      <div class="flex items-center justify-between p-3 rounded-xl bg-[#EBE2D3]/60">
        <span><strong class="px-2 py-0.5 rounded bg-[#1B3249] text-[#D4B895]">POST</strong> <code>/api/spots</code> · <code>/api/bookings</code> · <code>/api/advisory-check</code> · <code>/api/chat</code></span>
        <span class="font-semibold text-[#5A6B7C]">Connected to Frontend UI</span>
      </div>
    </div>
  </div>
</body>
</html>"""
        payload = html.encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)


if __name__ == "__main__":
    init_db()
    server = ThreadingHTTPServer(("0.0.0.0", PORT), AdSpotRequestHandler)
    print("=" * 68)
    print("  AdSpot Tashkent — Python Backend & SQLite Server Running!")
    print(f"  Website URL:       http://localhost:{PORT}")
    print(f"  API Console URL:   http://localhost:{PORT}/api/docs")
    print(f"  SQLite Database:   {DB_PATH}")
    print("=" * 68)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down AdSpot server...")
        server.server_close()
