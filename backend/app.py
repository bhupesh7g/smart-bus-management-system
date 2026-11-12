
import os
from pathlib import Path

from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS

from database import db
from models import User, Bus, Route
from auth import auth
from bus_routes import buses
from booking_routes import booking


# Frontend folder location
FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"

# Flask application
app = Flask(
    __name__,
    static_folder=str(FRONTEND_DIR),
    static_url_path=""
)

app.config["SECRET_KEY"] = os.environ.get(
    "SECRET_KEY",
    "development-secret-change-this"
)

app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///smartbus.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# CORS configuration
CORS(
    app,
    origins=["http://127.0.0.1:5500"],
    supports_credentials=True
)

app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_HTTPONLY"] = True

# Database
db.init_app(app)

# Register API routes
app.register_blueprint(auth, url_prefix="/api/auth")
app.register_blueprint(buses, url_prefix="/api/buses")
app.register_blueprint(booking, url_prefix="/api/bookings")

with app.app_context():
    db.create_all()


# Open frontend login page at root URL
@app.route("/")
def home():
    return send_from_directory(FRONTEND_DIR, "login.html")


# Backend status API
@app.route("/api")
def api_home():
    return jsonify({
        "message": "SmartBus Backend Running!"
    })


if __name__ == "__main__":
    app.run(debug=True)
