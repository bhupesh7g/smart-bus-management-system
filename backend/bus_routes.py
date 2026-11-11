from sqlalchemy import or_
from bus_search import search_bus
from flask import Blueprint, request, jsonify, session
from sqlalchemy import or_

from database import db
from models import Bus, Route, User

buses = Blueprint("buses", __name__)


def controller_required():
    user_id = session.get("user_id")

    if not user_id:
        return None, (jsonify({"message": "Please login first"}), 401)

    user = db.session.get(User, user_id)

    if not user:
        session.clear()
        return None, (jsonify({"message": "User not found"}), 404)

    if user.role != "controller":
        return None, (jsonify({"message": "Controller access required"}), 403)

    return user, None


def bus_to_dict(bus):
    return {
        "id": bus.id,
        "bus_number": bus.bus_number,
        "total_seats": bus.total_seats,
        "available_seats": bus.available_seats,
        "current_location": bus.current_location,
        "routes": [
            {
                "route_name": route.route_name,
                "start_point": route.start_point,
                "end_point": route.end_point
            }
            for route in bus.routes
        ]
    }


# Get all buses or search buses
@buses.route("/", methods=["GET"])
def get_buses():

    search = request.args.get("search", "").strip()

    query = Bus.query

    if search:
        query = query.outerjoin(Route).filter(
            or_(
                Bus.bus_number.ilike(f"%{search}%"),
                Bus.current_location.ilike(f"%{search}%"),
                Route.route_name.ilike(f"%{search}%"),
                Route.start_point.ilike(f"%{search}%"),
                Route.end_point.ilike(f"%{search}%")
            )
        ).distinct()

    bus_list = query.order_by(Bus.id.desc()).all()

    return jsonify({
        "buses": [bus_to_dict(bus) for bus in bus_list]
    })


# Add a new bus (Controller only)
@buses.route("/", methods=["POST"])
def add_bus():

    user, error = controller_required()

    if error:
        return error

    data = request.get_json() or {}

    bus_number = data.get("bus_number", "").strip()
    total_seats = data.get("total_seats")
    available_seats = data.get("available_seats")
    current_location = data.get("current_location", "").strip()

    if not bus_number or total_seats is None:
        return jsonify({"message": "Bus number and total seats are required"}), 400

    if Bus.query.filter_by(bus_number=bus_number).first():
        return jsonify({"message": "Bus number already exists"}), 409

    try:
        total_seats = int(total_seats)
        available_seats = int(
            available_seats if available_seats is not None else total_seats
        )
    except (ValueError, TypeError):
        return jsonify({"message": "Seat values must be numbers"}), 400

    if total_seats <= 0:
        return jsonify({"message": "Total seats must be greater than zero"}), 400

    if available_seats < 0 or available_seats > total_seats:
        return jsonify({"message": "Invalid available seat count"}), 400

    bus = Bus(
        bus_number=bus_number,
        total_seats=total_seats,
        available_seats=available_seats,
        current_location=current_location
    )

    db.session.add(bus)
    db.session.commit()

    return jsonify({
        "message": "Bus added successfully",
        "bus": bus_to_dict(bus)
    }), 201

@buses.route("/search/<string:bus_number>", methods=["GET"])
def search_bus_api(bus_number):
    bus = search_bus(bus_number)

    if not bus:
        return jsonify({
            "message": "Bus not found"
        }), 404

    return jsonify({
        "message": "Bus found successfully",
        "bus": bus
    }), 200
