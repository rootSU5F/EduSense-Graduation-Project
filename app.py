"""
EduSense Web App — Complete System
====================================
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

load_dotenv()

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

# ── Session state ─────────────────────────────────────────
session = {
    'active': False, 'youtube_url': None, 'audio_path': None,
    'transcript': None, 'segments': [], 'struggle_moments': [],
    'notebooks': [], 'emotion_history': [], 'trigger_count': 0,
    'last_trigger': 0, 'session_start': 0,
    'status': 'idle', 'status_msg': '', 'rag': None,
    'video_duration': 0,
}

from collections import deque
emotion_buffer = deque(maxlen=5)

# Initialize FER once — prefer MTCNN (robust), fall back to Haar cascade
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
    try:
        detector = _fer_detector
        if detector is None:
            return None
        result = detector.detect_emotions(frame_bgr)
        if not result:
            print('[FER] No face detected in frame')
            return None
        raw = result[0]['emotions']

        happy    = raw.get('happy',    0)
        neutral  = raw.get('neutral',  0)
        fear     = raw.get('fear',     0)
        surprise = raw.get('surprise', 0)
        angry    = raw.get('angry',    0)
        disgust  = raw.get('disgust',  0)
        sad      = raw.get('sad',      0)

        mapped = {
            'engagement':  happy * 0.7 + (1 - neutral) * 0.3,
            'boredom':     neutral * 0.6 + sad * 0.4,
            'confusion':   fear * 0.5 + surprise * 0.5,
            'frustration': angry * 0.6 + disgust * 0.4,
        }
        emotion_buffer.append(mapped)
        smoothed = {}
        for e in mapped:
            avg = np.mean([h[e] for h in emotion_buffer])
            smoothed[e] = {'confidence': round(float(avg), 3),
                          'positive': avg > 0.30}
        return smoothed
    except Exception as e:
        print(f"FER error: {e}")
        return None


def is_dissatisfied(emotions):
    return any(emotions[e]['positive']
               for e in ['boredom', 'confusion', 'frustration'])


def get_transcript_at(video_time, window=60):
    if not session['segments']:
        return "Student appeared disengaged during the lecture."
    relevant = [s['text'] for s in session['segments']
                if video_time - window <= s['start'] <= video_time]
    return ' '.join(relevant).strip() or \
           session['transcript'][-500:] if session['transcript'] else "Lecture content."


def generate_session_report():
    """Generate a JSON session report with engagement data"""
    history = session['emotion_history']
    if not history:
        return {}

    # Build engagement timeline (one point per entry)
    timeline = []
    for h in history:
        timeline.append({
            'video_time':  round(h.get('video_time', 0), 1),
            'engagement':  round(h['emotions']['engagement']['confidence'], 3),
            'boredom':     round(h['emotions']['boredom']['confidence'], 3),
            'confusion':   round(h['emotions']['confusion']['confidence'], 3),
            'frustration': round(h['emotions']['frustration']['confidence'], 3),
            'dissatisfied': is_dissatisfied(h['emotions']),
        })

    # Overall stats
    total    = len(history)
    focused  = sum(1 for h in history if not is_dissatisfied(h['emotions']))
    avg_eng  = np.mean([h['emotions']['engagement']['confidence'] for h in history])
    avg_bor  = np.mean([h['emotions']['boredom']['confidence'] for h in history])
    avg_con  = np.mean([h['emotions']['confusion']['confidence'] for h in history])
    avg_fru  = np.mean([h['emotions']['frustration']['confidence'] for h in history])

    duration = time.time() - session['session_start'] if session['session_start'] else 0

    return {
        'session_duration':   round(duration),
        'total_checks':       total,
        'focus_rate':         round(focused / total * 100, 1) if total else 100,
        'avg_engagement':     round(float(avg_eng), 3),
        'avg_boredom':        round(float(avg_bor), 3),
        'avg_confusion':      round(float(avg_con), 3),
        'avg_frustration':    round(float(avg_fru), 3),
        'struggle_count':     len(session['struggle_moments']),
        'notebooks_generated': len(session['notebooks']),
        'timeline':           timeline,
        'struggle_moments':   session['struggle_moments'],
        'notebooks':          session['notebooks'],
    }


# ── Routes ────────────────────────────────────────────────

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
        'status':          session['status'],
        'status_msg':      session['status_msg'],
        'active':          session['active'],
        'elapsed':         f'{m:02d}:{s:02d}',
        'engagement_rate': round(eng, 1),
        'struggle_count':  len(session['struggle_moments']),
        'notebook_count':  len(session['notebooks']),
        'trigger_count':   session['trigger_count'],
        'struggle_moments': session['struggle_moments'],
        'notebooks':       session['notebooks'],
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
    data = request.json
    url  = data.get('youtube_url', '').strip()
    if not url:
        return jsonify({'error': 'YouTube URL required'}), 400
    if session['active']:
        return jsonify({'error': 'Session already active'}), 400

    session.update({
        'youtube_url': url, 'active': True, 'status': 'setup',
        'status_msg': 'Downloading lecture audio...',
        'session_start': time.time(),
        'struggle_moments': [], 'notebooks': [], 'emotion_history': [],
        'trigger_count': 0, 'last_trigger': 0,
        'transcript': None, 'segments': [], 'video_duration': 0,
    })
    emotion_buffer.clear()

    def setup():
        try:
            import yt_dlp

            # Get video duration first
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
            print(f"✅ Ready — {len(session['transcript'])} chars transcribed")

        except Exception as e:
            session.update({
                'status': 'monitoring',
                'status_msg': f'⚠️ Audio failed ({e}) — monitoring without transcript',
                'active': True,
            })
            print(f"⚠️ Setup error: {e}")

    threading.Thread(target=setup, daemon=True).start()
    return jsonify({'success': True})


@app.route('/api/analyze-frame', methods=['POST'])
def analyze_frame_route():
    if not session['active']:
        return jsonify({'status': session['status']})

    try:
        data       = request.json
        img_data   = data.get('image', '')
        video_time = data.get('video_time', 0)  # current YouTube video time in seconds

        if not img_data:
            return jsonify({'emotions': None, 'triggered': False})

        img_bytes = base64.b64decode(img_data.split(',')[1])
        nparr     = np.frombuffer(img_bytes, np.uint8)
        frame     = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if frame is None:
            return jsonify({'emotions': None, 'triggered': False})
        emotions  = analyze_frame(frame)

        if emotions is None:
            return jsonify({'emotions': None, 'triggered': False})

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

        if session['trigger_count'] >= 3 and now - session['last_trigger'] > 180:
            session['last_trigger']  = now
            session['trigger_count'] = 0
            triggered = True
            elapsed   = now - session['session_start']
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
                    emotion_state = emotion_state
                )
                session['notebooks'].append({
                    'path':           path,
                    'filename':       Path(path).name,
                    'timestamp':      moment['video_time_fmt'],
                    'detected':       moment['detected'],
                    'index':          i + 1,
                    'video_time':     moment['video_time'],
                })

            # Save session report
            report      = generate_session_report()
            report_path = OUTPUT_DIR / 'session_report.json'
            with open(report_path, 'w') as f:
                json.dump(report, f, indent=2)

            session['status']     = 'done'
            session['status_msg'] = \
                f"✅ Done! {len(session['notebooks'])} notebooks ready."

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
    """Return engagement data for the chart"""
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
    })
    emotion_buffer.clear()
    return jsonify({'success': True})


if __name__ == '__main__':
    print("\n🚀 EduSense — http://localhost:5000\n")
    app.run(debug=False, host='0.0.0.0', port=5000, threaded=True)
