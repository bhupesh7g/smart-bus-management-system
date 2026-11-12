"""
Seed 8 illustrative Dehradun SmartBus routes into the existing SQLite database.
Run from the backend directory:
    python seed_dehradun.py

Safe to re-run: seeded buses/routes are updated and their route stops are replaced.
Existing unrelated buses, routes, users and bookings are left untouched.
These are demo routes/timings, not verified live public-transport schedules.
"""
from datetime import datetime
from app import app
from database import db
from models import Bus, Route, RouteStop

ROUTES = [
    ("DEH-SB-001", 40, "07:00", "ISBT Dehradun", "Clock Tower", "ISBT – Clock Tower",
     [("ISBT Dehradun", 0), ("Niranjanpur", 8), ("Saharanpur Chowk", 15), ("Prince Chowk", 22), ("Dehradun Railway Station", 30), ("Clock Tower", 38)]),
    ("DEH-SB-002", 40, "07:15", "Clock Tower", "Rajpur", "Clock Tower – Rajpur",
     [("Clock Tower", 0), ("Survey Chowk", 5), ("Dilaram Chowk", 12), ("Jakhan", 20), ("Pacific Mall", 26), ("Rajpur", 34)]),
    ("DEH-SB-003", 35, "07:30", "ISBT Dehradun", "Prem Nagar", "ISBT – Prem Nagar",
     [("ISBT Dehradun", 0), ("Patel Nagar", 8), ("Ballupur Chowk", 18), ("FRI Main Gate", 25), ("Prem Nagar", 35)]),
    ("DEH-SB-004", 35, "07:45", "Clock Tower", "Clement Town", "Clock Tower – Clement Town",
     [("Clock Tower", 0), ("Gandhi Road", 6), ("Araghar", 14), ("Dharampur", 21), ("Turner Road", 29), ("Clement Town", 38)]),
    ("DEH-SB-005", 40, "08:00", "ISBT Dehradun", "Sahastradhara", "ISBT – Sahastradhara",
     [("ISBT Dehradun", 0), ("Niranjanpur", 8), ("Clock Tower", 22), ("Survey Chowk", 28), ("IT Park", 39), ("Sahastradhara Crossing", 48), ("Sahastradhara", 58)]),
    ("DEH-SB-006", 35, "08:15", "Dehradun Railway Station", "Mussoorie Diversion", "Railway Station – Mussoorie Road",
     [("Dehradun Railway Station", 0), ("Clock Tower", 8), ("Astley Hall", 13), ("Dilaram Chowk", 20), ("Malsi", 31), ("Mussoorie Diversion", 38)]),
    ("DEH-SB-007", 40, "08:30", "Clock Tower", "Raipur", "Clock Tower – Raipur",
     [("Clock Tower", 0), ("Survey Chowk", 5), ("Raipur Road", 14), ("Ladpur", 22), ("Raipur", 30)]),
    ("DEH-SB-008", 35, "08:45", "ISBT Dehradun", "Maldevta", "ISBT – Maldevta",
     [("ISBT Dehradun", 0), ("Dharampur", 12), ("Raipur", 24), ("Gujrara", 35), ("Maldevta", 48)]),
]

with app.app_context():
    try:
        for bus_number, seats, departure, start, end, route_name, stops in ROUTES:
            bus = Bus.query.filter_by(bus_number=bus_number).first()
            if bus is None:
                bus = Bus(bus_number=bus_number, total_seats=seats,
                          available_seats=seats, current_location=start)
                db.session.add(bus)
                db.session.flush()
            else:
                bus.total_seats = seats
                bus.available_seats = seats
                bus.current_location = start
            bus.departure_time = datetime.strptime(departure, "%H:%M").time()

            route = Route.query.filter_by(bus_id=bus.id, route_name=route_name).first()
            if route is None:
                route = Route(bus_id=bus.id, route_name=route_name,
                              start_point=start, end_point=end)
                db.session.add(route)
                db.session.flush()
            else:
                route.start_point = start
                route.end_point = end

            RouteStop.query.filter_by(route_id=route.id).delete()
            for order, (stop_name, offset) in enumerate(stops, start=1):
                db.session.add(RouteStop(route_id=route.id, stop_name=stop_name,
                                         stop_order=order,
                                         arrival_offset_minutes=offset))
        db.session.commit()
        print("Dehradun demo data seeded: 8 buses, 8 routes.")
    except Exception:
        db.session.rollback()
        raise
