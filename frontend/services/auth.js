const API = "http://127.0.0.1:5000";

let currentMode = "login";

function showAuth(mode) {
  currentMode = mode;

  const signup = mode === "signup";

  document.getElementById("nameField").classList.toggle("hidden", !signup);
  document.getElementById("fullName").required = signup;

  // Role dropdown signup ke time hide rahega
  document.getElementById("roleField").classList.toggle("hidden", signup);

  document.getElementById("authTitle").textContent =
    signup ? "Create Account" : "Welcome Back!";

  document.getElementById("authSubtitle").textContent =
    signup ? "Register to continue" : "Login to continue";

  document.getElementById("authSubmit").textContent =
    signup ? "Create Account" : "Login";

  document.getElementById("loginTab").classList.toggle("active", !signup);
  document.getElementById("signupTab").classList.toggle("active", signup);

  document.getElementById("authMessage").textContent = "";
}

document.getElementById("authForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const message = document.getElementById("authMessage");
  const button = document.getElementById("authSubmit");

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  const data = {
    email: email,
    password: password
  };

  if (currentMode === "signup") {
    data.name = document.getElementById("fullName").value.trim();
  }

  const endpoint = currentMode === "signup" ? "signup" : "login";

  try {
    button.disabled = true;
    message.textContent = "Please wait...";

    const response = await fetch(`${API}/api/auth/${endpoint}`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Something went wrong");
    }

    // Signup successful
    if (currentMode === "signup") {
      showAuth("login");

      document.getElementById("email").value = email;

      message.textContent = "Signup successful! Now login.";
      return;
    }

    // Login successful: verify user from backend
    const verifyResponse = await fetch(`${API}/api/auth/me`, {
      method: "GET",
      credentials: "include"
    });

    const userData = await verifyResponse.json();

    if (!verifyResponse.ok) {
      throw new Error("Login verification failed");
    }

    const selectedRole = document.getElementById("loginRole").value;
    const actualRole = userData.user.role;

    // Check selected role with actual account role
    if (selectedRole !== actualRole) {
      await fetch(`${API}/api/auth/logout`, {
        method: "POST",
        credentials: "include"
      });

      throw new Error(
        `This account is registered as ${actualRole}. Please select the correct login role.`
      );
    }

    // Save verified user details
    sessionStorage.setItem("smartbusRole", actualRole);
    sessionStorage.setItem("smartbusEmail", userData.user.email);

    // Open dashboard
    window.location.href = "index.html";

  } catch (error) {
    message.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});

