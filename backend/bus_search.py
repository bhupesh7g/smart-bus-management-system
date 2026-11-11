
from models import Bus

def build_bus_hash_map():
    bus_map = {}

    buses = Bus.query.all()

    for bus in buses:
        bus_map[bus.bus_number.upper()] = {
            "id": bus.id,
            "bus_number": bus.bus_number,
            "total_seats": bus.total_seats,
            "available_seats": bus.available_seats,
            "current_location": bus.current_location
        }

    return bus_map


def search_bus(bus_number):
    bus_map = build_bus_hash_map()

    return bus_map.get(bus_number.strip().upper())
