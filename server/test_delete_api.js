import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

const run = async () => {
  try {
    const port = process.env.PORT || 5000;
    const baseURL = `http://127.0.0.1:${port}/api`;
    console.log(`Testing API at: ${baseURL}`);

    // 1. Log in
    const loginRes = await fetch(`${baseURL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "superadmin@eduvanta.com",
        password: "SuperAdmin@123",
      }),
    });
    if (!loginRes.ok) {
      throw new Error(`Login failed: ${loginRes.statusText}`);
    }
    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log("Logged in successfully. Token obtained.");

    // 2. Send DELETE
    const teacherId = "6a27e2d7220cf73f738407ba";
    console.log(`Sending DELETE request for teacher ${teacherId}...`);
    const deleteRes = await fetch(`${baseURL}/teachers/${teacherId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    console.log("DELETE Response Status:", deleteRes.status);
    const deleteData = await deleteRes.json();
    console.log("DELETE Response Data:", deleteData);

    process.exit(0);
  } catch (error) {
    console.error("Error message:", error.message);
    if (error.cause) {
      console.error("Error cause:", error.cause);
    }
    process.exit(1);
  }
};

run();
