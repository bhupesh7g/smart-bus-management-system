
from app import app
from database import db
from models import User

with app.app_context():
    email = "controller@smartbus.com"

    user = User.query.filter_by(email=email).first()

    if user:
        print("Controller account already exists")
    else:
        user = User(
            name="Bus Controller",
            email=email,
            role="controller"
        )

        user.set_password("Controller123")

        db.session.add(user)
        db.session.commit()

        print("Controller account created successfully!")
