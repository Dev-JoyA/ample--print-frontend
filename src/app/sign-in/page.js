import "../css/all.css"
import React from "react";

const page =() => {
  return (
    <div className="signin-container">   
      <h1>Sign In</h1>
       <form>
        <label>Email</label>
        <input type="email" placeholder='email'></input>
        <label>Password</label>
        <input type="password" placeholder='password'></input>
        <butoon>Submit</butoon>
     </form>
     <p>Or sign in with google <a href="google/oauth">Google</a> </p>
   </div>
  );
}

export default page
