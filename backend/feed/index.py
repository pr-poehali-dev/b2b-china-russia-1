import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token, X-Visitor-Id',
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


def _resp(status, body):
    return {'statusCode': status, 'headers': CORS, 'isBase64Encoded': False, 'body': json.dumps(body, default=str)}


def handler(event: dict, context) -> dict:
    '''Видео-лента: публичный фид, лайки, просмотры, аналитика для поставщика.'''
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'isBase64Encoded': False, 'body': ''}

    params = event.get('queryStringParameters') or {}
    action = params.get('action', 'feed')
    headers = event.get('headers') or {}
    visitor_id = headers.get('X-Visitor-Id') or headers.get('x-visitor-id') or params.get('vid', 'anon')

    body = {}
    if event.get('body'):
        try:
            body = json.loads(event['body'])
        except Exception:
            body = {}

    conn, cur = _db()
    try:
        # --- PUBLIC FEED ---
        if action == 'feed' and method == 'GET':
            tab = params.get('tab', 'new')   # new | hot | verified
            hashtag = params.get('hashtag')
            category = params.get('category')
            offset = int(params.get('offset', 0))
            limit = 10

            conditions = ["m.type = 'video'"]
            args = []

            if hashtag:
                conditions.append('%s = ANY(m.hashtags)')
                args.append(hashtag)
            if category:
                conditions.append('(m.category = %s OR s.category = %s)')
                args += [category, category]

            where = ' AND '.join(conditions)

            order = {
                'hot': 'm.likes_count DESC, m.views_count DESC',
                'verified': "CASE s.plan WHEN 'Platinum' THEN 0 WHEN 'Gold' THEN 1 WHEN 'Premium' THEN 2 ELSE 3 END, m.created_at DESC",
            }.get(tab, 'm.created_at DESC')

            cur.execute(f"""
                SELECT m.id, m.url, m.caption, m.hashtags, m.category,
                       m.likes_count, m.views_count, m.created_at, m.duration_sec,
                       s.id AS seller_id, s.company_name, s.plan, s.logo_url, s.province,
                       EXISTS(SELECT 1 FROM video_likes l WHERE l.media_id=m.id AND l.visitor_id=%s) AS liked
                FROM media m
                JOIN sellers s ON s.id = m.seller_id
                WHERE {where}
                ORDER BY {order}
                LIMIT {limit} OFFSET {offset}
            """, [visitor_id] + args)
            videos = cur.fetchall()

            # trending hashtags
            cur.execute("""
                SELECT unnest(hashtags) AS tag, COUNT(*) AS cnt
                FROM media WHERE type='video' AND array_length(hashtags,1) > 0
                GROUP BY tag ORDER BY cnt DESC LIMIT 20
            """)
            tags = cur.fetchall()

            return _resp(200, {
                'videos': [dict(v) for v in videos],
                'hashtags': [dict(t) for t in tags],
                'has_more': len(videos) == limit,
            })

        # --- LIKE / UNLIKE ---
        if action == 'like' and method == 'POST':
            media_id = body.get('media_id')
            if not media_id:
                return _resp(400, {'error': 'Нет media_id'})
            try:
                cur.execute(
                    "INSERT INTO video_likes (media_id, visitor_id) VALUES (%s, %s)",
                    (media_id, visitor_id)
                )
                cur.execute("UPDATE media SET likes_count = likes_count + 1 WHERE id = %s", (media_id,))
                liked = True
            except Exception:
                cur.execute("DELETE FROM video_likes WHERE media_id=%s AND visitor_id=%s", (media_id, visitor_id))
                cur.execute("UPDATE media SET likes_count = GREATEST(0, likes_count - 1) WHERE id = %s", (media_id,))
                liked = False
            cur.execute("SELECT likes_count FROM media WHERE id=%s", (media_id,))
            row = cur.fetchone()
            return _resp(200, {'liked': liked, 'likes_count': row['likes_count'] if row else 0})

        # --- VIEW (count) ---
        if action == 'view' and method == 'POST':
            media_id = body.get('media_id')
            seller_id = body.get('seller_id')
            if not media_id:
                return _resp(400, {'error': 'Нет media_id'})
            cur.execute(
                "INSERT INTO video_views (media_id, seller_id, visitor_id) VALUES (%s, %s, %s)",
                (media_id, seller_id, visitor_id)
            )
            cur.execute("UPDATE media SET views_count = views_count + 1 WHERE id = %s", (media_id,))
            return _resp(200, {'ok': True})

        # --- SELLER VIDEOS (public) ---
        if action == 'seller_videos' and method == 'GET':
            seller_id = params.get('seller_id')
            if not seller_id:
                return _resp(400, {'error': 'Нет seller_id'})
            cur.execute("""
                SELECT m.id, m.url, m.caption, m.hashtags, m.category,
                       m.likes_count, m.views_count, m.created_at, m.duration_sec,
                       EXISTS(SELECT 1 FROM video_likes l WHERE l.media_id=m.id AND l.visitor_id=%s) AS liked
                FROM media m
                WHERE m.seller_id=%s AND m.type='video'
                ORDER BY m.created_at DESC
            """, [visitor_id, seller_id])
            return _resp(200, {'videos': [dict(v) for v in cur.fetchall()]})

        # --- SELLER ANALYTICS ---
        if action == 'analytics' and method == 'GET':
            seller_id = params.get('seller_id')
            if not seller_id:
                return _resp(400, {'error': 'Нет seller_id'})
            cur.execute("""
                SELECT
                  COUNT(*) FILTER (WHERE type='video') AS total_videos,
                  COALESCE(SUM(views_count) FILTER (WHERE type='video'), 0) AS total_views,
                  COALESCE(SUM(likes_count) FILTER (WHERE type='video'), 0) AS total_likes
                FROM media WHERE seller_id=%s
            """, (seller_id,))
            totals = cur.fetchone()
            cur.execute("""
                SELECT m.id, m.caption, m.views_count, m.likes_count, m.created_at
                FROM media m WHERE m.seller_id=%s AND m.type='video'
                ORDER BY m.views_count DESC LIMIT 5
            """, (seller_id,))
            top = cur.fetchall()
            return _resp(200, {
                'totals': dict(totals) if totals else {},
                'top_videos': [dict(v) for v in top],
            })

        # --- UPDATE VIDEO META (caption, hashtags, category) ---
        if action == 'update_video' and method == 'POST':
            from hashlib import sha256
            import hmac, base64, time
            token = headers.get('X-Auth-Token') or headers.get('x-auth-token', '')
            SECRET = os.environ.get('DATABASE_URL', 'sinobridge-salt')
            seller_id = None
            try:
                raw = base64.urlsafe_b64decode(token.encode()).decode()
                parts = raw.split('.')
                sid, ts, sig = parts[0], parts[1], parts[2]
                payload = f"{sid}.{ts}"
                expected = hmac.new(SECRET.encode(), payload.encode(), sha256).hexdigest()[:24]
                if hmac.compare_digest(sig, expected):
                    seller_id = int(sid)
            except Exception:
                pass
            if not seller_id:
                return _resp(401, {'error': 'Требуется авторизация'})

            media_id = body.get('media_id')
            cur.execute(
                "UPDATE media SET caption=%s, hashtags=%s, category=%s WHERE id=%s AND seller_id=%s",
                (body.get('caption'), body.get('hashtags', []), body.get('category'), media_id, seller_id)
            )
            return _resp(200, {'ok': True})

        return _resp(404, {'error': 'Неизвестное действие'})
    finally:
        cur.close()
        conn.close()
