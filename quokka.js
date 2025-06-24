let name = "John";
console.log(name);

const formData = {
  email: "femolahd@gmail.com",
  password: "123456"
};

try {
  const response = await fetch("http://localhost:4001/auth/sign-in", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(formData)
  });
  const data = await response.json();
  console.log("Response data:", data);
  console.log("Response cookie:", response.headers.get("set-cookie"));
  console.log("Response status:", response);
  console.log("Response status text:", response.statusText);
  if (!response.ok) {
    setError(data.message || "Sign-in failed");
    setIsLoading(false);
  }
  setFormData({
    email: "",
    password: ""
  });
  setError(data.message || "Sign-in successful");
  setTimeout(() => {
    if (data.role === "admin") {
      router.push("/dashboards/admin-dashboard");
    } else if (data.role === "superadmin") {
      router.push("/dashboards/super-admin-dashboard");
    } else {
      router.push("/dashboards");
    }
  }, 1500);
} catch (error) {
  console.log("Cannot fetch:", error);
}