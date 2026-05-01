"""
EduSense Web App — Complete System with Supabase Integration
=============================================================
Run: python app.py
Open: http://localhost:5000
"""

from flask import Flask, request, jsonify, send_file, render_template
from flask_cors import CORS
import os, json, time, threading, base64
import numpy as np
import cv2
from pathlib import Path
from dotenv import load_dotenv
import sys

_env_path = Path(__file__).parent / '.env'
print(f'[DEBUG] .env path: {_env_path}')
print(f'[DEBUG] .env exists: {_env_path.exists()}')
print(f'[DEBUG] .env contents: {_env_path.read_text() if _env_path.exists() else "FILE NOT FOUND"}')
load_dotenv(_env_path)

# ── Supabase client ───────────────────────────────────────
from supabase import create_client, Client

SUPABASE_URL         = os.getenv('SUPABASE_URL', '')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY', '')
print(f'[DEBUG] SUPABASE_URL loaded: {repr(SUPABASE_URL)}')
print(f'[DEBUG] SUPABASE_SERVICE_KEY loaded: {repr(SUPABASE_SERVICE_KEY[:20] + "..." if SUPABASE_SERVICE_KEY else "EMPTY")}')
sb: Client           = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
print('✅ Supabase client ready')

# ── Flask app ─────────────────────────────────────────────
app = Flask(__name__, template_folder='templates', static_folder='static', static_url_path='')
CORS(app)

BASE_DIR   = Path(__file__).parent
KB_DIR     = BASE_DIR / 'Rag_system' / 'edusense_kb'
OUTPUT_DIR = BASE_DIR / 'generated_notebooks'
UPLOAD_DIR = BASE_DIR / 'Rag_system' / 'uploads'
AUDIO_DIR  = BASE_DIR / 'Rag_system' / 'audio'

for d in [KB_DIR, OUTPUT_DIR, UPLOAD_DIR, AUDIO_DIR]:
    d.mkdir(parents=True, exist_ok=True)

API_KEY = os.getenv('ANTHROPIC_API_KEY', '')

# ── Auth helper ───────────────────────────────────────────
def get_current_user():
    """Extract and validate JWT from Authorization header."""
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if not token:
        return None
    try:
        user = sb.auth.get_user(token)
        return user.user
    except Exception as e:
        print(f'Auth error: {e}')
        return None

# ── Session state ─────────────────────────────────────────
session = {
    'active': False, 'youtube_url': None, 'audio_path': None,
    'transcript': None, 'segments': [], 'struggle_moments': [],
    'notebooks': [], 'emotion_history': [], 'trigger_count': 0,
    'last_trigger': 0, 'session_start': 0,
    'status': 'idle', 'status_msg': '', 'rag': None,
    'video_duration': 0,
    # Supabase fields
    'db_id': None, 'student_id': None, 'teacher_id': None,
    'subject_id': None, 'frame_count': 0,
}

from collections import deque
emotion_buffer    = deque(maxlen=7)   # 7 frames × 2s = 14s smoothing window
baseline_buffer   = deque(maxlen=30)  # 30 frames for personal baseline calibration
baseline_ready    = False
baseline_neutral  = 0.60              # default — updated after calibration
baseline_happy    = 0.10

# ── Initialize FER ────────────────────────────────────────
try:
    from fer import FER as _FER
    try:
        _fer_detector = _FER(mtcnn=True)
        print('✅ FER detector ready (MTCNN)')
    except Exception:
        _fer_detector = _FER()
        print('✅ FER detector ready (Haar cascade fallback)')
except Exception as e:
    _fer_detector = None
    print(f'⚠️ FER not loaded: {e}')

def _warmup_fer():
    try:
        dummy = np.zeros((48, 48, 3), dtype=np.uint8)
        _fer_detector.detect_emotions(dummy)
        print('✅ FER warmed up — instant analysis ready')
    except Exception as e:
        print(f'⚠️ FER warmup: {e}')

if _fer_detector:
    threading.Thread(target=_warmup_fer, daemon=True).start()

# ── Helpers ───────────────────────────────────────────────

def get_rag():
    if session['rag'] is None:
        sys.path.insert(0, str(BASE_DIR))
        from Rag_system.edusense_rag import EduSenseRAG
        session['rag'] = EduSenseRAG(
            anthropic_api_key=API_KEY,
            kb_dir=str(KB_DIR),
            output_dir=str(OUTPUT_DIR),
            whisper_model='base'
        )
    return session['rag']


def analyze_frame(frame_bgr):
    """
    1. CLAHE preprocessing for lighting robustness
    2. FER-7 → normalized probabilities
    3. Baseline-aware mapping (personal calibration)
    4. Exponential weighted temporal smoothing
    5. Per-emotion adaptive thresholds
    """
    global baseline_neutral, baseline_happy, baseline_ready

    try:
        detector = _fer_detector
        if detector is None:
            return None

        # ── 1. Preprocessing ──────────────────────────────────
        small = cv2.resize(frame_bgr, (320, 240))

        lab   = cv2.cvtColor(small, cv2.COLOR_BGR2LAB)
        l, a, b_ch = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(4, 4))
        l     = clahe.apply(l)
        small = cv2.cvtColor(cv2.merge([l, a, b_ch]), cv2.COLOR_LAB2BGR)

        result = detector.detect_emotions(small)
        if not result:
            print('[FER] No face detected in frame')
            return None

        best = max(result, key=lambda x: x['box'][2] * x['box'][3])
        raw  = best['emotions']

        # ── 2. Normalize probabilities ────────────────────────
        happy    = float(raw.get('happy',    0))
        neutral  = float(raw.get('neutral',  0))
        fear     = float(raw.get('fear',     0))
        surprise = float(raw.get('surprise', 0))
        angry    = float(raw.get('angry',    0))
        disgust  = float(raw.get('disgust',  0))
        sad      = float(raw.get('sad',      0))

        total = happy + neutral + fear + surprise + angry + disgust + sad
        if total < 0.3:
            return None
        h  = happy    / total
        n  = neutral  / total
        f  = fear     / total
        su = surprise / total
        a  = angry    / total
        d  = disgust  / total
        s  = sad      / total

        # ── 3. Baseline calibration ───────────────────────────
        if not baseline_ready:
            baseline_buffer.append({'neutral': n, 'happy': h})
            if len(baseline_buffer) >= 20:
                baseline_neutral = float(np.mean([x['neutral'] for x in baseline_buffer]))
                baseline_happy   = float(np.mean([x['happy']   for x in baseline_buffer]))
                baseline_ready   = True
                print(f"✅ Baseline calibrated — neutral={baseline_neutral:.2f} happy={baseline_happy:.2f}")

        neutral_adj = max(0, n - baseline_neutral * 0.6)
        happy_adj   = max(0, h - baseline_happy   * 0.5)

        # ── 4. Learning state formulas ────────────────────────
        engagement = (
            happy_adj * 0.75 +
            su * 0.25
        )
        boredom = (
            neutral_adj * 0.50 +
            s * 0.30 +
            max(0, 0.3 - h) * 0.20
        )
        confusion_mult = min(f * su * 6.0, 0.5)
        confusion = (
            confusion_mult +
            f  * 0.25 +
            su * 0.20 +
            max(0, 0.25 - h) * 0.15
        )
        frustration = (
            a * 0.60 +
            d * 0.30 +
            f * 0.10
        )

        scores = {
            'engagement':  min(max(engagement,  0.0), 1.0),
            'boredom':     min(max(boredom,     0.0), 1.0),
            'confusion':   min(max(confusion,   0.0), 1.0),
            'frustration': min(max(frustration, 0.0), 1.0),
        }

        # ── 5. Exponential weighted smoothing ─────────────────
        emotion_buffer.append(scores)
        n_frames = len(emotion_buffer)
        raw_w    = np.array([np.exp(0.4 * i) for i in range(n_frames)])
        weights  = raw_w / raw_w.sum()

        smoothed_scores = {
            e: float(np.average([fr[e] for fr in emotion_buffer], weights=weights))
            for e in scores
        }

        # ── 6. Adaptive thresholds ────────────────────────────
        thresholds = {
            'engagement':  0.30,
            'boredom':     0.30,
            'confusion':   0.30,
            'frustration': 0.30,
        }

        result_state = {}
        for e in smoothed_scores:
            conf = round(min(max(smoothed_scores[e], 0.0), 1.0), 3)
            result_state[e] = {
                'confidence': conf,
                'positive':   bool(conf > thresholds[e]),
            }

        return result_state

    except Exception as e:
        print(f"FER error: {e}")
        return None


def is_dissatisfied(emotions):
    if not emotions:
        return False
    bored      = emotions.get('boredom',     {}).get('positive', False)
    confused   = emotions.get('confusion',   {}).get('positive', False)
    frustrated = emotions.get('frustration', {}).get('positive', False)
    engaged    = emotions.get('engagement',  {}).get('positive', False)
    any_negative = bored or confused or frustrated
    if engaged and not frustrated:
        return False
    return any_negative


def get_transcript_at(video_time, window=60):
    if not session['segments']:
        return "Student appeared disengaged during the lecture."
    relevant = [s['text'] for s in session['segments']
                if video_time - window <= s['start'] <= video_time]
    return ' '.join(relevant).strip() or \
           session['transcript'][-500:] if session['transcript'] else "Lecture content."


def generate_session_report():
    history = session['emotion_history']
    if not history:
        return {}

    timeline = []
    for h in history:
        timeline.append({
            'video_time':   round(h.get('video_time', 0), 1),
            'engagement':   round(h['emotions']['engagement']['confidence'], 3),
            'boredom':      round(h['emotions']['boredom']['confidence'], 3),
            'confusion':    round(h['emotions']['confusion']['confidence'], 3),
            'frustration':  round(h['emotions']['frustration']['confidence'], 3),
            'dissatisfied': bool(is_dissatisfied(h['emotions'])),
        })

    total   = len(history)
    focused = sum(1 for h in history if not is_dissatisfied(h['emotions']))
    avg_eng = np.mean([h['emotions']['engagement']['confidence'] for h in history])
    avg_bor = np.mean([h['emotions']['boredom']['confidence'] for h in history])
    avg_con = np.mean([h['emotions']['confusion']['confidence'] for h in history])
    avg_fru = np.mean([h['emotions']['frustration']['confidence'] for h in history])
    duration = time.time() - session['session_start'] if session['session_start'] else 0

    return {
        'session_duration':    round(duration),
        'total_checks':        total,
        'focus_rate':          round(focused / total * 100, 1) if total else 100,
        'avg_engagement':      round(float(avg_eng), 3),
        'avg_boredom':         round(float(avg_bor), 3),
        'avg_confusion':       round(float(avg_con), 3),
        'avg_frustration':     round(float(avg_fru), 3),
        'struggle_count':      len(session['struggle_moments']),
        'notebooks_generated': len(session['notebooks']),
        'timeline':            timeline,
        'struggle_moments':    session['struggle_moments'],
        'notebooks':           session['notebooks'],
    }


# ══════════════════════════════════════════════════════════
#   AUTH ROUTES
# ══════════════════════════════════════════════════════════

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    d = request.json
    try:
        res = sb.auth.sign_up({
            'email':    d['email'],
            'password': d['password'],
            'options': {
                'data': {
                    'role':       d.get('role', 'student'),
                    'full_name':  d.get('full_name', ''),
                    'department': d.get('department', ''),
                    'student_id': d.get('student_id', ''),
                    'faculty_id': d.get('faculty_id', ''),
                }
            }
        })
        if not res.user:
            return jsonify({'error': 'Signup failed — check email format'}), 400
        return jsonify({'success': True, 'user_id': res.user.id})
    except Exception as e:
        return jsonify({'error': str(e)}), 400


@app.route('/api/auth/login', methods=['POST'])
def login():
    d = request.json
    try:
        res = sb.auth.sign_in_with_password({
            'email':    d['email'],
            'password': d['password'],
        })
        profile = sb.table('profiles') \
            .select('*') \
            .eq('id', res.user.id) \
            .single() \
            .execute()
        return jsonify({
            'success':      True,
            'access_token': res.session.access_token,
            'role':         profile.data['role'],
            'profile':      profile.data,
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 401


@app.route('/api/auth/me', methods=['GET'])
def me():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    try:
        profile = sb.table('profiles') \
            .select('*') \
            .eq('id', user.id) \
            .single() \
            .execute()
        return jsonify({'profile': profile.data})
    except Exception as e:
        return jsonify({'error': str(e)}), 400


# ══════════════════════════════════════════════════════════
#   TEACHER ROUTES
# ══════════════════════════════════════════════════════════

@app.route('/api/teacher/subjects')
def teacher_subjects():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    try:
        res = sb.table('subjects') \
            .select('*, profiles!teacher_id(full_name)') \
            .eq('teacher_id', user.id) \
            .execute()
        return jsonify({'subjects': res.data})
    except Exception as e:
        return jsonify({'error': str(e)}), 400


@app.route('/api/subjects/all')
def all_subjects():
    """All subjects with teacher name — populates lecture modal dropdown."""
    try:
        res = sb.table('subjects') \
            .select('*, profiles!teacher_id(full_name)') \
            .execute()
        return jsonify({'subjects': res.data})
    except Exception as e:
        return jsonify({'error': str(e)}), 400


@app.route('/api/teacher/heatmap')
def teacher_heatmap():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    subject_id = request.args.get('subject_id')
    try:
        sessions_res = sb.table('sessions') \
            .select('id') \
            .eq('teacher_id', user.id) \
            .execute()
        session_ids = [s['id'] for s in sessions_res.data]
        if not session_ids:
            return jsonify({'moments': []})

        query = sb.table('struggle_moments') \
            .select('*, subjects(name), profiles!student_id(full_name, student_id)') \
            .in_('session_id', session_ids)

        if subject_id:
            query = query.eq('subject_id', subject_id)

        res = query.execute()
        return jsonify({'moments': res.data})
    except Exception as e:
        return jsonify({'error': str(e)}), 400


@app.route('/api/teacher/students')
def teacher_students():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    try:
        sessions_res = sb.table('sessions') \
            .select('student_id, avg_engagement, avg_confusion, avg_frustration, focus_rate, subject_id, subjects(name)') \
            .eq('teacher_id', user.id) \
            .execute()

        students = {}
        for s in sessions_res.data:
            sid = s['student_id']
            if sid not in students:
                profile = sb.table('profiles') \
                    .select('full_name, student_id') \
                    .eq('id', sid).single().execute()
                students[sid] = {
                    'id':         sid,
                    'full_name':  profile.data['full_name'],
                    'student_id': profile.data['student_id'],
                    'sessions':   [],
                }
            students[sid]['sessions'].append(s)

        return jsonify({'students': list(students.values())})
    except Exception as e:
        return jsonify({'error': str(e)}), 400


@app.route('/api/teacher/stats')
def teacher_stats():
    """Summary stats for the teacher overview dashboard."""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    try:
        sessions_res = sb.table('sessions') \
            .select('id, avg_engagement, focus_rate, student_id') \
            .eq('teacher_id', user.id) \
            .execute()

        struggles_res = sb.table('struggle_moments') \
            .select('id, subject_id') \
            .in_('session_id', [s['id'] for s in sessions_res.data]) \
            .execute() if sessions_res.data else type('obj', (object,), {'data': []})()

        unique_students = len(set(s['student_id'] for s in sessions_res.data if s['student_id']))
        data = sessions_res.data
        avg_eng = round(
            sum(s['avg_engagement'] or 0 for s in data) / len(data) * 100, 1
        ) if data else 0

        # Critical students = those with avg_engagement < 0.45
        critical = sum(
            1 for s in data
            if s['avg_engagement'] and s['avg_engagement'] < 0.45
        )

        return jsonify({
            'total_students':   unique_students,
            'avg_engagement':   avg_eng,
            'struggle_count':   len(struggles_res.data),
            'critical_students': critical,
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400


# ══════════════════════════════════════════════════════════
#   STUDENT ROUTES
# ══════════════════════════════════════════════════════════

@app.route('/api/student/history')
def student_history():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    try:
        res = sb.table('sessions') \
            .select('*, subjects(name), profiles!teacher_id(full_name)') \
            .eq('student_id', user.id) \
            .order('started_at', desc=True) \
            .limit(20) \
            .execute()
        return jsonify({'sessions': res.data})
    except Exception as e:
        return jsonify({'error': str(e)}), 400


@app.route('/api/student/notebooks')
def student_notebooks():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    try:
        res = sb.table('notebooks') \
            .select('*, sessions(subjects(name))') \
            .eq('student_id', user.id) \
            .order('created_at', desc=True) \
            .execute()
        return jsonify({'notebooks': res.data})
    except Exception as e:
        return jsonify({'error': str(e)}), 400


@app.route('/api/student/stats')
def student_stats():
    """Summary stats for the student home dashboard."""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    try:
        sessions_res = sb.table('sessions') \
            .select('avg_engagement, avg_boredom, avg_confusion, avg_frustration, focus_rate, started_at') \
            .eq('student_id', user.id) \
            .eq('status', 'done') \
            .order('started_at', desc=True) \
            .limit(20) \
            .execute()

        struggles_res = sb.table('struggle_moments') \
            .select('id') \
            .eq('student_id', user.id) \
            .execute()

        notebooks_res = sb.table('notebooks') \
            .select('id') \
            .eq('student_id', user.id) \
            .execute()

        data    = sessions_res.data
        avg_eng = round(
            sum(s['avg_engagement'] or 0 for s in data) / len(data) * 100, 1
        ) if data else 0

        return jsonify({
            'lectures_watched': len(data),
            'avg_engagement':   avg_eng,
            'struggle_count':   len(struggles_res.data),
            'notebooks_count':  len(notebooks_res.data),
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400


@app.route('/api/student/struggle-topics')
def student_struggle_topics():
    """Aggregate struggle data by topic for the Hardest Topics page."""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    try:
        res = sb.table('struggle_moments') \
            .select('subject_id, confusion, frustration, boredom, subjects(name)') \
            .eq('student_id', user.id) \
            .execute()

        topics = {}
        for m in res.data:
            name = (m.get('subjects') or {}).get('name', 'Unknown')
            if name not in topics:
                topics[name] = {'confusion': [], 'frustration': [], 'boredom': [], 'count': 0}
            topics[name]['confusion'].append(m['confusion'] or 0)
            topics[name]['frustration'].append(m['frustration'] or 0)
            topics[name]['boredom'].append(m['boredom'] or 0)
            topics[name]['count'] += 1

        result = []
        for name, vals in topics.items():
            avg_difficulty = round(
                (sum(vals['confusion']) / len(vals['confusion']) * 0.4 +
                 sum(vals['frustration']) / len(vals['frustration']) * 0.4 +
                 sum(vals['boredom']) / len(vals['boredom']) * 0.2) * 100, 1
            )
            result.append({'subject': name, 'difficulty': avg_difficulty, 'count': vals['count']})

        result.sort(key=lambda x: x['difficulty'], reverse=True)
        return jsonify({'topics': result})
    except Exception as e:
        return jsonify({'error': str(e)}), 400


# ══════════════════════════════════════════════════════════
#   EXISTING ROUTES (updated with Supabase persistence)
# ══════════════════════════════════════════════════════════

@app.route('/')
def index():
    p = BASE_DIR / 'templates' / 'index.html'
    if p.exists():
        return p.read_text(encoding='utf-8')
    return "<h1>EduSense</h1><p>templates/index.html not found</p>"


@app.route('/api/status')
def status():
    elapsed = time.time() - session['session_start'] \
              if session['session_start'] else 0
    m, s = divmod(int(elapsed), 60)
    eng  = 100.0
    if session['emotion_history']:
        focused = sum(1 for h in session['emotion_history']
                      if not is_dissatisfied(h['emotions']))
        eng = focused / len(session['emotion_history']) * 100
    return jsonify({
        'status':           session['status'],
        'status_msg':       session['status_msg'],
        'active':           session['active'],
        'elapsed':          f'{m:02d}:{s:02d}',
        'engagement_rate':  round(eng, 1),
        'struggle_count':   len(session['struggle_moments']),
        'notebook_count':   len(session['notebooks']),
        'trigger_count':    session['trigger_count'],
        'struggle_moments': session['struggle_moments'],
        'notebooks':        session['notebooks'],
    })


@app.route('/api/upload-pdf', methods=['POST'])
def upload_pdf():
    if 'file' not in request.files:
        return jsonify({'error': 'No file'}), 400
    f    = request.files['file']
    path = UPLOAD_DIR / f.filename
    f.save(path)
    try:
        rag   = get_rag()
        count = rag.upload_textbook(str(path), f.filename.replace('.pdf', ''))
        return jsonify({'success': True, 'chunks': count, 'filename': f.filename})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/kb-stats')
def kb_stats():
    try:
        rag = get_rag()
        return jsonify({'chunks': rag.kb.count()})
    except Exception as e:
        return jsonify({'chunks': 0, 'error': str(e)})


@app.route('/api/start-session', methods=['POST'])
def start_session():
    data       = request.json
    url        = data.get('youtube_url', '').strip()
    teacher_id = data.get('teacher_id')
    subject_id = data.get('subject_id')
    # Accept student_id from body (sent by frontend) OR from JWT token
    student_id = data.get('student_id')
    if not student_id:
        user = get_current_user()
        student_id = user.id if user else None

    if not url:
        return jsonify({'error': 'YouTube URL required'}), 400

    # Auto-reset if a previous session is stuck active
    if session['active']:
        print('⚠️ Session was active — auto-resetting before starting new session')
        session.update({
            'active': False, 'youtube_url': None, 'audio_path': None,
            'transcript': None, 'segments': [], 'struggle_moments': [],
            'notebooks': [], 'emotion_history': [], 'trigger_count': 0,
            'last_trigger': 0, 'session_start': 0,
            'status': 'idle', 'status_msg': '', 'video_duration': 0,
            'db_id': None, 'student_id': None, 'teacher_id': None,
            'subject_id': None, 'frame_count': 0,
        })
        emotion_buffer.clear()

    # Create session row in Supabase
    session_db_id = None
    try:
        insert_data = {
            'youtube_url': url,
            'status':      'setup',
            'status_msg':  'Downloading lecture audio...',
        }
        if student_id:  insert_data['student_id'] = student_id
        if teacher_id:  insert_data['teacher_id'] = teacher_id
        if subject_id:  insert_data['subject_id'] = subject_id

        db_row = sb.table('sessions').insert(insert_data).execute()
        session_db_id = db_row.data[0]['id']
        print(f'✅ Session created in Supabase: {session_db_id}')
    except Exception as e:
        print(f'⚠️ Supabase session insert error: {e}')

    session.update({
        'db_id':      session_db_id,
        'student_id': student_id,
        'teacher_id': teacher_id,
        'subject_id': subject_id,
        'youtube_url': url, 'active': True, 'status': 'setup',
        'status_msg': 'Downloading lecture audio...',
        'session_start': time.time(),
        'struggle_moments': [], 'notebooks': [], 'emotion_history': [],
        'trigger_count': 0, 'last_trigger': 0, 'frame_count': 0,
        'transcript': None, 'segments': [], 'video_duration': 0,
    })
    emotion_buffer.clear()

    def setup():
        try:
            import yt_dlp
            with yt_dlp.YoutubeDL({'quiet': True}) as ydl:
                info = ydl.extract_info(url, download=False)
                session['video_duration'] = info.get('duration', 0)

            ydl_opts = {
                'format':      'bestaudio/best',
                'outtmpl':     str(AUDIO_DIR / 'lecture.%(ext)s'),
                'postprocessors': [{
                    'key':            'FFmpegExtractAudio',
                    'preferredcodec': 'mp3',
                }],
                'quiet': True,
            }
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([url])

            session['audio_path'] = str(AUDIO_DIR / 'lecture.mp3')
            session['status_msg'] = 'Transcribing with Whisper...'

            import whisper
            model  = whisper.load_model('base')
            result = model.transcribe(
                session['audio_path'], language='en',
                initial_prompt='Computer science lecture.', verbose=False
            )
            session['transcript'] = result['text']
            session['segments']   = result.get('segments', [])
            session['status']     = 'monitoring'
            session['status_msg'] = '✅ Monitoring student...'

            if session_db_id:
                sb.table('sessions').update({
                    'status':     'monitoring',
                    'status_msg': '✅ Monitoring student...'
                }).eq('id', session_db_id).execute()

            print(f"✅ Ready — {len(session['transcript'])} chars transcribed")

        except Exception as e:
            session.update({
                'status':     'monitoring',
                'status_msg': f'⚠️ Audio failed ({e}) — monitoring without transcript',
                'active':     True,
            })
            if session_db_id:
                try:
                    sb.table('sessions').update({
                        'status':     'monitoring',
                        'status_msg': '⚠️ Audio failed — monitoring without transcript',
                    }).eq('id', session_db_id).execute()
                except:
                    pass
            print(f"⚠️ Setup error: {e}")

    threading.Thread(target=setup, daemon=True).start()
    return jsonify({'success': True, 'session_id': session_db_id})


@app.route('/api/analyze-frame', methods=['POST'])
def analyze_frame_route():
    if not session['active']:
        return jsonify({'status': session['status']})

    try:
        data       = request.json
        img_data   = data.get('image', '')
        video_time = data.get('video_time', 0)

        if not img_data:
            return jsonify({'emotions': None, 'triggered': False})

        img_bytes = base64.b64decode(img_data.split(',')[1])
        nparr     = np.frombuffer(img_bytes, np.uint8)
        frame     = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if frame is None:
            return jsonify({'emotions': None, 'triggered': False})
        if len(frame.shape) == 2:
            frame = cv2.cvtColor(frame, cv2.COLOR_GRAY2BGR)

        emotions = analyze_frame(frame)
        if emotions is None:
            return jsonify({'emotions': None, 'triggered': False})

        # ── Batch write emotion history every 10 frames ───────
        session['frame_count'] = session.get('frame_count', 0) + 1
        if session['frame_count'] % 10 == 0 and session.get('db_id'):
            try:
                sb.table('emotion_history').insert({
                    'session_id':  session['db_id'],
                    'video_time':  video_time,
                    'engagement':  emotions['engagement']['confidence'],
                    'boredom':     emotions['boredom']['confidence'],
                    'confusion':   emotions['confusion']['confidence'],
                    'frustration': emotions['frustration']['confidence'],
                    'dissatisfied': is_dissatisfied(emotions),
                }).execute()
            except Exception as db_err:
                print(f'Supabase emotion history insert error: {db_err}')

        now = time.time()
        session['emotion_history'].append({
            'time':       now,
            'video_time': video_time,
            'emotions':   emotions,
        })

        triggered = False
        if is_dissatisfied(emotions):
            session['trigger_count'] += 1
        else:
            session['trigger_count'] = max(0, session['trigger_count'] - 1)

        if session['trigger_count'] >= 2 and now - session['last_trigger'] > 60:
            session['last_trigger']  = now
            session['trigger_count'] = 0
            triggered  = True
            elapsed    = now - session['session_start']
            mins, secs = divmod(int(video_time), 60)

            session['struggle_moments'].append({
                'timestamp':      elapsed,
                'video_time':     video_time,
                'video_time_fmt': f"{mins:02d}:{secs:02d}",
                'timestamp_fmt':  f"{int(elapsed//60):02d}:{int(elapsed%60):02d}",
                'emotions':       {e: emotions[e]['confidence'] for e in emotions},
                'detected':       [e for e in emotions if emotions[e]['positive']],
                'transcript':     get_transcript_at(video_time),
            })
            print(f"⚠️ Struggle at video {mins:02d}:{secs:02d}")

            # ── Persist struggle moment to Supabase ───────────
            if session.get('db_id'):
                try:
                    sb.table('struggle_moments').insert({
                        'session_id':     session['db_id'],
                        'student_id':     session.get('student_id'),
                        'subject_id':     session.get('subject_id'),
                        'video_time':     video_time,
                        'video_time_fmt': f"{mins:02d}:{secs:02d}",
                        'engagement':     emotions['engagement']['confidence'],
                        'boredom':        emotions['boredom']['confidence'],
                        'confusion':      emotions['confusion']['confidence'],
                        'frustration':    emotions['frustration']['confidence'],
                        'detected':       [e for e in emotions if emotions[e]['positive']],
                        'transcript':     get_transcript_at(video_time),
                    }).execute()
                except Exception as db_err:
                    print(f'Supabase struggle insert error: {db_err}')

        return jsonify({
            'emotions':       {e: {'confidence': emotions[e]['confidence'],
                                   'positive':   emotions[e]['positive']}
                               for e in emotions},
            'triggered':      triggered,
            'trigger_count':  session['trigger_count'],
            'struggle_count': len(session['struggle_moments']),
        })

    except Exception as e:
        print(f"analyze error: {e}")
        return jsonify({'error': str(e), 'triggered': False})


@app.route('/api/end-session', methods=['POST'])
def end_session():
    if not session['active']:
        return jsonify({'error': 'No active session'}), 400

    session['active']     = False
    session['status']     = 'processing'
    session['status_msg'] = f"Generating {len(session['struggle_moments'])} notebooks..."

    def generate():
        try:
            rag = get_rag()
            for i, moment in enumerate(session['struggle_moments']):
                session['status_msg'] = \
                    f"Notebook {i+1}/{len(session['struggle_moments'])}..."
                emotion_state = {
                    e: {
                        'positive':   moment['emotions'][e] > 0.30,
                        'confidence': moment['emotions'][e],
                    }
                    for e in moment['emotions']
                }
                path = rag.process_with_text(
                    transcript    = moment['transcript'],
                    emotion_state = emotion_state,
                    subject_id    = session.get('subject_id'),
                )
                session['notebooks'].append({
                    'path':           path,
                    'filename':       Path(path).name,
                    'timestamp':      moment['video_time_fmt'],
                    'detected':       moment['detected'],
                    'index':          i + 1,
                    'video_time':     moment['video_time'],
                })

            # Save session report JSON file
            report      = generate_session_report()
            report_path = OUTPUT_DIR / 'session_report.json'
            with open(report_path, 'w') as f:
                json.dump(report, f, indent=2)

            session['status']     = 'done'
            session['status_msg'] = f"✅ Done! {len(session['notebooks'])} notebooks ready."

            # ── Persist final report to Supabase ──────────────
            if session.get('db_id'):
                try:
                    sb.table('sessions').update({
                        'status':          'done',
                        'status_msg':      session['status_msg'],
                        'ended_at':        time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
                        'focus_rate':      report.get('focus_rate'),
                        'avg_engagement':  report.get('avg_engagement'),
                        'avg_boredom':     report.get('avg_boredom'),
                        'avg_confusion':   report.get('avg_confusion'),
                        'avg_frustration': report.get('avg_frustration'),
                    }).eq('id', session['db_id']).execute()

                    # Persist each notebook record
                    for nb in session['notebooks']:
                        sb.table('notebooks').insert({
                            'session_id':     session['db_id'],
                            'student_id':     session.get('student_id'),
                            'filename':       nb['filename'],
                            'video_time_fmt': nb['timestamp'],
                            'detected':       nb['detected'],
                            'status':         'done',
                        }).execute()

                    print(f'✅ Session report saved to Supabase')
                except Exception as db_err:
                    print(f'Supabase end-session persist error: {db_err}')

        except Exception as e:
            session['status']     = 'done'
            session['status_msg'] = f'Error: {e}'
            print(f"Generation error: {e}")

    threading.Thread(target=generate, daemon=True).start()
    return jsonify({'success': True, 'moments': len(session['struggle_moments'])})


@app.route('/api/session-report')
def session_report():
    report_path = OUTPUT_DIR / 'session_report.json'
    if report_path.exists():
        return send_file(str(report_path), as_attachment=True,
                         download_name='edusense_report.json')
    return jsonify(generate_session_report())


@app.route('/api/engagement-timeline')
def engagement_timeline():
    history = session['emotion_history']
    return jsonify({
        'timeline': [
            {
                'video_time':  round(h.get('video_time', 0), 1),
                'engagement':  round(h['emotions']['engagement']['confidence'], 3),
                'boredom':     round(h['emotions']['boredom']['confidence'], 3),
                'confusion':   round(h['emotions']['confusion']['confidence'], 3),
                'frustration': round(h['emotions']['frustration']['confidence'], 3),
            }
            for h in history
        ],
        'struggle_moments': [
            {'video_time': m['video_time'], 'detected': m['detected']}
            for m in session['struggle_moments']
        ]
    })


@app.route('/api/notebooks')
def get_notebooks():
    return jsonify({'notebooks': session['notebooks']})


@app.route('/api/download/<filename>')
def download_notebook(filename):
    path = OUTPUT_DIR / filename
    if not path.exists():
        return jsonify({'error': 'Not found'}), 404
    return send_file(str(path), as_attachment=True)


@app.route('/api/struggle-moments')
def get_struggle_moments():
    return jsonify({'moments': session['struggle_moments']})


@app.route('/api/reset', methods=['POST'])
def reset():
    session.update({
        'active': False, 'youtube_url': None, 'audio_path': None,
        'transcript': None, 'segments': [], 'struggle_moments': [],
        'notebooks': [], 'emotion_history': [], 'trigger_count': 0,
        'last_trigger': 0, 'session_start': 0,
        'status': 'idle', 'status_msg': '', 'video_duration': 0,
        'db_id': None, 'student_id': None, 'teacher_id': None,
        'subject_id': None, 'frame_count': 0,
    })
    emotion_buffer.clear()
    global baseline_ready, baseline_neutral, baseline_happy
    baseline_buffer.clear()
    baseline_ready   = False
    baseline_neutral = 0.60
    baseline_happy   = 0.10
    return jsonify({'success': True})



# ══════════════════════════════════════════════════════════
#   KNOWLEDGE BASE ROUTES
# ══════════════════════════════════════════════════════════

@app.route('/api/teacher/upload-pdf', methods=['POST'])
def teacher_upload_pdf():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    try:
        profile = sb.table('profiles').select('role').eq('id', user.id).single().execute()
        if profile.data.get('role') != 'teacher':
            return jsonify({'error': 'Only teachers can upload PDFs'}), 403
    except Exception as e:
        return jsonify({'error': str(e)}), 400

    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    subject_id = request.form.get('subject_id')
    if not subject_id:
        return jsonify({'error': 'subject_id is required'}), 400

    f             = request.files['file']
    original_name = f.filename
    if not original_name.lower().endswith('.pdf'):
        return jsonify({'error': 'Only PDF files are allowed'}), 400

    ts        = time.strftime('%Y%m%d_%H%M%S')
    safe      = original_name.replace(' ', '_').replace('/', '_')
    filename  = f"{subject_id[:8]}_{ts}_{safe}"
    save_path = UPLOAD_DIR / filename
    f.save(str(save_path))
    file_size = save_path.stat().st_size

    db_row_id = None
    try:
        row = sb.table('subject_pdfs').insert({
            'teacher_id':    user.id,
            'subject_id':    subject_id,
            'filename':      filename,
            'original_name': original_name,
            'file_size':     file_size,
            'status':        'processing',
        }).execute()
        db_row_id = row.data[0]['id']
    except Exception as e:
        print(f'⚠️ subject_pdfs insert error: {e}')

    def index_pdf():
        try:
            rag         = get_rag()
            source      = f"{subject_id[:8]}::{original_name.replace('.pdf', '')}"
            chunk_count = rag.upload_textbook(str(save_path), source_name=source)
            if db_row_id:
                sb.table('subject_pdfs').update({
                    'status':      'ready',
                    'chunk_count': chunk_count,
                    'indexed_at':  time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
                }).eq('id', db_row_id).execute()
            print(f'✅ Indexed {chunk_count} chunks from {original_name}')
        except Exception as e:
            print(f'❌ PDF indexing error: {e}')
            if db_row_id:
                try:
                    sb.table('subject_pdfs').update({
                        'status': 'error', 'error_msg': str(e),
                    }).eq('id', db_row_id).execute()
                except: pass

    threading.Thread(target=index_pdf, daemon=True).start()
    return jsonify({
        'success': True, 'filename': filename,
        'original_name': original_name, 'file_size': file_size,
        'db_id': db_row_id, 'status': 'processing',
    })


@app.route('/api/teacher/pdfs')
def teacher_pdfs():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    try:
        res = sb.table('subject_pdfs') \
            .select('*, subjects(name)') \
            .eq('teacher_id', user.id) \
            .order('uploaded_at', desc=True) \
            .execute()
        return jsonify({'pdfs': res.data})
    except Exception as e:
        return jsonify({'error': str(e)}), 400


@app.route('/api/teacher/pdfs/<pdf_id>', methods=['DELETE'])
def delete_pdf(pdf_id):
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    try:
        row = sb.table('subject_pdfs').select('filename, teacher_id') \
            .eq('id', pdf_id).single().execute()
        if row.data['teacher_id'] != user.id:
            return jsonify({'error': 'Forbidden'}), 403
        file_path = UPLOAD_DIR / row.data['filename']
        if file_path.exists():
            file_path.unlink()
        sb.table('subject_pdfs').delete().eq('id', pdf_id).execute()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 400


@app.route('/api/teacher/subjects-with-pdfs')
def subjects_with_pdfs():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    try:
        subjects_res = sb.table('subjects').select('id, name') \
            .eq('teacher_id', user.id).execute()
        pdfs_res = sb.table('subject_pdfs').select('subject_id, status') \
            .eq('teacher_id', user.id).execute()
        pdf_counts = {}
        for p in pdfs_res.data:
            sid = p['subject_id']
            if sid not in pdf_counts:
                pdf_counts[sid] = {'total': 0, 'ready': 0}
            pdf_counts[sid]['total'] += 1
            if p['status'] == 'ready':
                pdf_counts[sid]['ready'] += 1
        result = []
        for s in subjects_res.data:
            counts = pdf_counts.get(s['id'], {'total': 0, 'ready': 0})
            result.append({**s, **counts})
        return jsonify({'subjects': result})
    except Exception as e:
        return jsonify({'error': str(e)}), 400


if __name__ == '__main__':
    print("\n🚀 EduSense — http://localhost:5000\n")
    app.run(debug=False, host='0.0.0.0', port=5000, threaded=True, ssl_context='adhoc')