
const API_URL = "http://127.0.0.1:5000/api/auth";

const authService = {
    async login(credentials) {
        const response = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify(credentials)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Login failed");
        }

        return data;
    },

    async signup(userData) {
        const response = await fetch(`${API_URL}/signup`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Signup failed");
        }

        return data;
    }
};


document.getElementById("authForm")
    .addEventListener("submit", async function(event) {

        event.preventDefault();

        const message = document.getElementById("authMessage");

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        try {
            let result;

            if (authMode === "login") {

                result = await authService.login({
                    email,
                    password
                });

            } else {

                const name = document.getElementById("fullName")
                    .value.trim();

                result = await authService.signup({
                    name,
                    email,
                    password
                });
            }

            message.textContent = result.message;

            // Store the actual role returned by Flask.
            sessionStorage.setItem(
                "smartbusRole",
                result.user.role
            );

            sessionStorage.setItem(
                "smartbusUser",
                JSON.stringify(result.user)
            );

            window.location.href = "index.html";

        } catch (error) {

            message.textContent = error.message;
        }
    });
