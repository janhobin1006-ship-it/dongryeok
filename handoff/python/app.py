"""동력 공약 사이트 — Python(Flask) 예제

실행:
    pip install -r requirements.txt
    python app.py            →  http://localhost:8000

하는 일:
    /                 HTML 버전에 공약 데이터를 직접 넣어 보냄
    /api/pledges      공약 데이터 JSON (?category=facility 로 분야 필터)
    /html/<파일>       style.css, app.js 같은 정적 파일
나중에 DB로 옮기면 load_data()만 DB 조회로 바꾸면 됩니다. 반환 구조는 pledges.json과 같게 맞추세요.
"""
import json
from pathlib import Path

from flask import Flask, Response, jsonify, request, send_from_directory

BASE = Path(__file__).resolve().parent.parent  # handoff 폴더
app = Flask(__name__)


def load_data():
    return json.loads((BASE / "data" / "pledges.json").read_text(encoding="utf-8"))


@app.get("/")
def index():
    html = (BASE / "html" / "index.html").read_text(encoding="utf-8")
    data = json.dumps(load_data(), ensure_ascii=False).replace("</", "<\\/")
    html = html.replace('href="style.css"', 'href="/html/style.css"')
    html = html.replace(
        '<script src="app.js"></script>',
        f'<script>window.PLEDGES_DATA = {data};</script>\n  <script src="/html/app.js"></script>',
    )
    return Response(html, mimetype="text/html")


@app.get("/api/pledges")
def api_pledges():
    data = load_data()
    cat = request.args.get("category")
    if cat:
        data["categories"] = [c for c in data["categories"] if c["id"] == cat]
    return jsonify(data)


@app.get("/html/<path:name>")
def static_files(name):
    return send_from_directory(BASE / "html", name)


if __name__ == "__main__":
    app.json.ensure_ascii = False
    app.run(port=8000, debug=True)
