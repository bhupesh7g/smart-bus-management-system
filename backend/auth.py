
from flask import Blueprint, request, jsonify, session
from models import User
from database import db

# Authentication Blueprint
auth = Blueprint("auth", __name__)


# Passenger Signup
@auth.route("/signup", methods=["POST"])
def signup():

    data = request.get_json() or {}

    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not name or not email or not password:
        return jsonify({"message": "All fields are required"}), 400

    if len(password) < 8:
        return jsonify({"message": "Password must be at least 8 characters"}), 400

    existing_user = User.query.filter_by(email=email).first()

    if existing_user:
        return jsonify({"message": "Email already registered"}), 409

    user = User(
        name=name,
        email=email,
        role="passenger"
    )

    user.set_password(password)

    db.session.add(user)
    db.session.commit()

    return jsonify({
        "message": "Signup successful",
        "user": user.to_dict()
    }), 201


# User Login
@auth.route("/login", methods=["POST"])
def login():

    data = request.get_json() or {}

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    user = User.query.filter_by(email=email).first()

    if not user or not user.check_password(password):
        return jsonify({"message": "Invalid email or password"}), 401

    session.clear()
    session["user_id"] = user.id

    return jsonify({
        "message": "Login successful",
        "user": user.to_dict()
    })


# User Logout
@auth.route("/logout", methods=["POST"])
def logout():

    session.clear()

    return jsonify({
        "message": "Logout successful"
    })


# Check Logged-in User
@auth.route("/me", methods=["GET"])
def me():

    user_id = session.get("user_id")

    if not user_id:
        return jsonify({"message": "Please login first"}), 401

    user = db.session.get(User, user_id)

    if not user:
        session.clear()
        return jsonify({"message": "User not found"}), 404

    return jsonify({
        "user": user.to_dict()
    })
