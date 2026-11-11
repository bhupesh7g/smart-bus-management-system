
import os
from booking_routes import booking
from flask import Flask, jsonify
from flask_cors import CORS

from database import db
from models import User, Bus, Route
from auth import auth
from bus_routes import buses

app = Flask(__name__)

app.config["SECRET_KEY"] = os.environ.get(
    "SECRET_KEY",
    "development-secret-change-this"
)

app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///smartbus.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

CORS(
    app,
    origins=["http://127.0.0.1:5500"],
    supports_credentials=True
)

app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_HTTPONLY"] = True

db.init_app(app)

# Register APIs
app.register_blueprint(auth, url_prefix="/api/auth")
app.register_blueprint(buses, url_prefix="/api/buses")
app.register_blueprint(booking, url_prefix="/api/bookings")
with app.app_context():
    db.create_all()


@app.route("/")
def home():
    return jsonify({
        "message": "SmartBus Backend Running!"
    })


if __name__ == "__main__":
    app.run(debug=True)
