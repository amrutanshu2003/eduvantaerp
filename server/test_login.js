import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

const run = async () => {
  try {
    const port = process.env.PORT || 5000;
    const baseURL = `http://127.0.0.1:${port}/api`;
    console.log(`Testing Login with email: ${baseURL}`);

    const loginRes = await fetch(`${baseURL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "demoteacher@gmail.com", // using email
        password: "Teacher@123",
      }),
    });

    console.log("Login Response Status:", loginRes.status);
    const loginData = await loginRes.json();
    console.log("Login Response Data:", loginData);

    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
};

run();
