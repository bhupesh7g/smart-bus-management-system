
import requests

BASE_URL = "http://127.0.0.1:5000"
session = requests.Session()

email = input("Enter passenger email: ")
password = input("Enter password: ")
bus_id = input("Enter bus ID: ")
seats = input("Enter seats to book: ")

# Step 1: Login
login_response = session.post(
    f"{BASE_URL}/api/auth/login",
    json={"email": email, "password": password}
)

print("\nLogin Status:", login_response.status_code)
print(login_response.json())

if login_response.status_code != 200:
    print("Login failed. Booking stopped.")
    exit()

# Step 2: Book seats
booking_response = session.post(
    f"{BASE_URL}/api/bookings/",
    json={"bus_id": bus_id, "seats": seats}
)

print("\nBooking Status:", booking_response.status_code)
print(booking_response.json())
