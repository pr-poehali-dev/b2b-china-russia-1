import json
import os
import urllib.request
import psycopg2
from psycopg2.extras import RealDictCursor

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json',
}

SCHEMA = 't_p93404869_b2b_china_russia_1'


def _db():
    dsn = os.environ['DATABASE_URL']
    sep = '&' if '?' in dsn else '?'
    dsn += f'{sep}options=-csearch_path%3D{SCHEMA}'
    conn = psycopg2.connect(dsn)
    conn.autocommit = True
    return conn, conn.cursor(cursor_factory=RealDictCursor)


def _resp(status: int, body: dict):
    return {'statusCode': status, 'headers': CORS, 'isBase64Encoded': False, 'body': json.dumps(body, default=str)}


def handler(event: dict, context) -> dict:
    '''Логистические компании: список, профиль, отзывы, отправка заявки.'''
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'isBase64Encoded': False, 'body': ''}

    params = event.get('queryStringParameters') or {}
    action = params.get('action', 'list')

    body = {}
    if event.get('body'):
        try:
            body = json.loads(event['body'])
        except Exception:
            body = {}

    conn, cur = _db()
    try:
        # --- LIST ---
        if action == 'list' and method == 'GET':
            ltype = params.get('type')
            conditions = ['1=1']
            args = []
            if ltype:
                conditions.append('type = %s')
                args.append(ltype)
            where = ' AND '.join(conditions)
            cur.execute(
                f"SELECT id, company_name, logo_url, type, description, routes, transit_time, "
                f"min_weight, phone, email, website, telegram, wechat, rating, reviews_count, featured "
                f"FROM logistics WHERE {where} ORDER BY featured DESC, rating DESC",
                args
            )
            companies = cur.fetchall()
            cur.execute("SELECT DISTINCT type FROM logistics ORDER BY type")
            types = [r['type'] for r in cur.fetchall()]
            return _resp(200, {'companies': [dict(c) for c in companies], 'types': types})

        # --- GET ONE + REVIEWS ---
        if action == 'get' and method == 'GET':
            lid = params.get('id')
            if not lid:
                return _resp(400, {'error': 'Укажите id'})
            cur.execute(
                "SELECT id, company_name, logo_url, type, description, routes, transit_time, "
                "min_weight, phone, email, website, telegram, wechat, rating, reviews_count, featured "
                "FROM logistics WHERE id = %s",
                (lid,)
            )
            company = cur.fetchone()
            if not company:
                return _resp(404, {'error': 'Компания не найдена'})
            cur.execute(
                "SELECT id, author, company, rating, text, created_at "
                "FROM logistics_reviews WHERE logistics_id = %s ORDER BY created_at DESC",
                (lid,)
            )
            reviews = cur.fetchall()
            return _resp(200, {'company': dict(company), 'reviews': [dict(r) for r in reviews]})

        # --- ADD REVIEW ---
        if action == 'add_review' and method == 'POST':
            lid = body.get('logistics_id')
            author = (body.get('author') or '').strip()
            text = (body.get('text') or '').strip()
            rating = int(body.get('rating', 5))
            if not lid or not author or not text:
                return _resp(400, {'error': 'Заполните имя и текст отзыва'})
            if not 1 <= rating <= 5:
                return _resp(400, {'error': 'Рейтинг от 1 до 5'})
            cur.execute(
                "INSERT INTO logistics_reviews (logistics_id, author, company, rating, text) "
                "VALUES (%s, %s, %s, %s, %s) RETURNING id, author, company, rating, text, created_at",
                (lid, author, body.get('company', ''), rating, text)
            )
            review = cur.fetchone()
            cur.execute(
                "UPDATE logistics SET "
                "rating = (SELECT ROUND(AVG(rating)::numeric, 1) FROM logistics_reviews WHERE logistics_id = %s), "
                "reviews_count = (SELECT COUNT(*) FROM logistics_reviews WHERE logistics_id = %s) "
                "WHERE id = %s",
                (lid, lid, lid)
            )
            return _resp(200, {'review': dict(review)})

        # --- CURRENCY RATE (CNY -> RUB), кэш на сутки ---
        if action == 'rate' and method == 'GET':
            cur.execute(
                "SELECT rate, updated_at FROM exchange_rates "
                "WHERE pair = 'CNY_RUB' AND updated_at > now() - interval '24 hours'"
            )
            cached = cur.fetchone()
            if cached:
                return _resp(200, {'rate': float(cached['rate']), 'updated_at': cached['updated_at'], 'cached': True})

            rate = None
            try:
                req = urllib.request.Request(
                    'https://www.cbr-xml-daily.ru/daily_json.js',
                    headers={'User-Agent': 'Mozilla/5.0'}
                )
                with urllib.request.urlopen(req, timeout=5) as resp:
                    data = json.loads(resp.read().decode('utf-8'))
                cny = data['Valute']['CNY']
                rate = round(float(cny['Value']) / float(cny['Nominal']), 4)
            except Exception:
                cur.execute("SELECT rate, updated_at FROM exchange_rates WHERE pair = 'CNY_RUB'")
                stale = cur.fetchone()
                if stale:
                    return _resp(200, {'rate': float(stale['rate']), 'updated_at': stale['updated_at'], 'cached': True, 'stale': True})
                return _resp(502, {'error': 'Не удалось получить курс валют'})

            cur.execute(
                "INSERT INTO exchange_rates (pair, rate, updated_at) VALUES ('CNY_RUB', %s, now()) "
                "ON CONFLICT (pair) DO UPDATE SET rate = %s, updated_at = now() "
                "RETURNING updated_at",
                (rate, rate)
            )
            row = cur.fetchone()
            return _resp(200, {'rate': rate, 'updated_at': row['updated_at'], 'cached': False})

        return _resp(404, {'error': 'Неизвестное действие'})
    finally:
        cur.close()
        conn.close()