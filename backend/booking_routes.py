
from flask import Blueprint, request, jsonify, session
from database import db
from models import User, Bus, Booking

booking = Blueprint("booking", __name__)


@booking.route("/", methods=["POST"])
def create_booking():

    # Check passenger login
    user_id = session.get("user_id")

    if not user_id:
        return jsonify({"message": "Please login first"}), 401

    user = db.session.get(User, user_id)

    if not user:
        session.clear()
        return jsonify({"message": "User not found"}), 404

    # Get booking details
    data = request.get_json() or {}

    try:
        bus_id = int(data.get("bus_id"))
        seats = int(data.get("seats", 1))
    except (ValueError, TypeError):
        return jsonify({"message": "Invalid bus or seat values"}), 400

    if bus_id <= 0 or seats <= 0:
        return jsonify({"message": "Invalid booking details"}), 400

    # Find bus
    bus = db.session.get(Bus, bus_id)

    if not bus:
        return jsonify({"message": "Bus not found"}), 404

    # Check available seats
    if bus.available_seats >= seats:

        bus.available_seats -= seats

        new_booking = Booking(
            user_id=user.id,
            bus_id=bus.id,
            seats_booked=seats,
            status="confirmed"
        )

        message = "Booking confirmed successfully"

    else:

        new_booking = Booking(
            user_id=user.id,
            bus_id=bus.id,
            seats_booked=seats,
            status="waiting"
        )

        message = "No seats available. Added to waiting list"

    db.session.add(new_booking)
    db.session.commit()

    return jsonify({
        "message": message,
        "booking": {
            "id": new_booking.id,
            "bus_id": new_booking.bus_id,
            "seats": new_booking.seats_booked,
            "status": new_booking.status
        }
    }), 201
