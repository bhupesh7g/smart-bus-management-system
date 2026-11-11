
from collections import deque
from models import Booking


def get_waiting_queue(bus_id):
    # Database se waiting passengers nikalo
    bookings = Booking.query.filter_by(
        bus_id=bus_id,
        status="waiting"
    ).order_by(
        Booking.created_at.asc(),
        Booking.id.asc()
    ).all()

    # FIFO Queue banao
    waiting_queue = deque()

    for booking in bookings:
        waiting_queue.append(booking)

    return waiting_queue


def add_to_queue(waiting_queue, booking):
    waiting_queue.append(booking)


def get_next_passenger(waiting_queue):
    if waiting_queue:
        return waiting_queue.popleft()

    return None
