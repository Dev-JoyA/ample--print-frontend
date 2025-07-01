// let name = "John";
// console.log(name);

// const formData = {
//   email: "femolahd@gmail.com",
//   password: "123456"
// };

// try {
//   const response = await fetch("http://localhost:4001/auth/sign-in", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json"
//     },
//     body: JSON.stringify(formData)
//   });
//   const data = await response.json();
//   const token = response.headers.get("set-cookie");
//   console.log("Token:", token);
//   // console.log("Response data:", data);
//   // console.log("Response cookie:", response.headers.get("set-cookie"));
//   // console.log("Response status:", response);
//   // console.log("Response status text:", response.statusText);
//   if (!response.ok) {
//     setError(data.message || "Sign-in failed");
//     setIsLoading(false);
//   }
//   setFormData({
//     email: "",
//     password: ""
//   });
//   setError(data.message || "Sign-in successful");
//   setTimeout(() => {
//     if (data.role === "admin") {
//       router.push("/dashboards/admin-dashboard");
//     } else if (data.role === "superadmin") {
//       router.push("/dashboards/super-admin-dashboard");
//     } else {
//       router.push("/dashboards");
//     }
//   }, 1500);
// } catch (error) {
//   console.log("Cannot fetch:", error);
// }


export async function fetchRequest(request) {
  const url = "http://localhost:4001/contents/products";
  const options = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer my-token", // optional
    }
    // body: JSON.stringify({}) // for POST/PUT
  };

  console.log("Outgoing Request:");
  console.log("URL:", url);
  console.log("Options:", options);

  const response = await fetch(url, options);
  const data = await response.json();
  console.log(data, "Data fetched successfully from request");
  console.log(response);
}

fetchRequest()
  .then(() => console.log("Fetch request completed"))
  .catch((error) => console.error("Error in fetch request:", error));
