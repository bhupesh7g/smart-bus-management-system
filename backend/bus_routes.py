from sqlalchemy import or_
from bus_search import search_bus
from datetime import datetime
from flask import Blueprint, request, jsonify, session
from sqlalchemy import or_

from database import db
from models import Bus, Route, User, RouteStop
from datetime import datetime
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
        "journey_started": bus.journey_started,
        "departure_time": (
                            bus.departure_time.strftime("%H:%M")
                            if bus.departure_time else None
                            ),
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

# Update existing bus information (Controller only)
@buses.route("/<string:bus_number>", methods=["PUT"])
def update_bus(bus_number):

    user, error = controller_required()

    if error:
        return error

    bus = Bus.query.filter_by(bus_number=bus_number).first()

    if not bus:
        return jsonify({"message": "Bus not found"}), 404

    data = request.get_json() or {}

    if not any(key in data for key in [
    "available_seats", "current_location", "departure_time"]):
        return jsonify({"message": "No information provided to update"}), 400

    if "available_seats" in data:
        try:
            seats = int(data["available_seats"])
        except (ValueError, TypeError):
            return jsonify({"message": "Available seats must be a number"}), 400

        if seats < 0 or seats > bus.total_seats:
            return jsonify({
                "message": f"Available seats must be between 0 and {bus.total_seats}"
            }), 400

        bus.available_seats = seats

    if "current_location" in data:
        location = data["current_location"].strip()

        if not location:
            return jsonify({"message": "Current location cannot be empty"}), 400

        bus.current_location = location
    if "departure_time" in data:
        try:
            bus.departure_time = datetime.strptime(
                data["departure_time"], "%H:%M"
            ).time()
        except (ValueError, TypeError):
            return jsonify({
                "message": "Invalid departure time. Use HH:MM format."
            }), 400
    db.session.commit()

    return jsonify({
        "message": "Bus information updated successfully",
        "bus": bus_to_dict(bus)
    }), 200

# Start or end bus journey (Controller only)
@buses.route("/<string:bus_number>/journey", methods=["PUT"])
def update_journey(bus_number):

    user, error = controller_required()

    if error:
        return error

    bus = Bus.query.filter_by(bus_number=bus_number).first()

    if not bus:
        return jsonify({"message": "Bus not found"}), 404

    data = request.get_json() or {}
    started = data.get("started")

    if not isinstance(started, bool):
        return jsonify({"message": "Journey status must be true or false"}), 400

    bus.journey_started = started
    db.session.commit()

    return jsonify({
        "message": "Journey started successfully" if started else "Journey ended successfully",
        "journey_started": bus.journey_started
    }), 200

@buses.route("/<string:bus_number>/stops", methods=["POST"])
def add_bus_stop(bus_number):
    user, error = controller_required()
    if error:
        return error

    data = request.get_json() or {}

    stop_name = data.get("stop_name", "").strip()
    stop_order = data.get("stop_order")
    arrival_offset = data.get("arrival_offset_minutes")

    if not stop_name or stop_order is None or arrival_offset is None:
        return jsonify({"message": "All stop details are required"}), 400

    try:
        stop_order = int(stop_order)
        arrival_offset = int(arrival_offset)
    except (ValueError, TypeError):
        return jsonify({"message": "Order and arrival time must be numbers"}), 400

    if stop_order < 1 or arrival_offset < 0:
        return jsonify({"message": "Invalid stop order or arrival time"}), 400

    bus = Bus.query.filter_by(bus_number=bus_number).first()
    if not bus:
        return jsonify({"message": "Bus not found"}), 404

    route = Route.query.filter_by(bus_id=bus.id).first()
    if not route:
        return jsonify({"message": "Route not found for this bus"}), 404

    existing = RouteStop.query.filter_by(
        route_id=route.id,
        stop_order=stop_order
    ).first()

    if existing:
        return jsonify({"message": "This stop order already exists"}), 409

    stop = RouteStop(
        route_id=route.id,
        stop_name=stop_name,
        stop_order=stop_order,
        arrival_offset_minutes=arrival_offset
    )

    db.session.add(stop)
    db.session.commit()

    return jsonify({"message": "Stop added successfully"}), 201


@buses.route("/<string:bus_number>/stops", methods=["GET"])
def get_bus_stops(bus_number):
    bus = Bus.query.filter_by(bus_number=bus_number).first()

    if not bus:
        return jsonify({"message": "Bus not found"}), 404

    route = Route.query.filter_by(bus_id=bus.id).first()

    if not route:
        return jsonify({"stops": []})

    stops = RouteStop.query.filter_by(
        route_id=route.id
    ).order_by(RouteStop.stop_order).all()

    return jsonify({
        "stops": [
            {
                "id": stop.id,
                "stop_name": stop.stop_name,
                "stop_order": stop.stop_order,
                "arrival_offset_minutes": stop.arrival_offset_minutes
            }
            for stop in stops
        ]
    })