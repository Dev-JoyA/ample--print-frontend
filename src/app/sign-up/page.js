import Link from "next/link";
import "../pages/all.css"

const page = () => {
  return (
  <div className="signin-container">
    <h1>Sign Up</h1>
    <form>
        <label>Firstname</label>
        <input type="text" placeholder='firstname'></input>
        <label>Lastname</label>
        <input type="text" placeholder='lastname'></input>
        <label>Username</label>
        <input type="text" placeholder='Username'></input>
        <label>Email</label>
        <input type="email" placeholder='email'></input>
        <label>Password</label>
        <input type="password" placeholder='password'></input>
        <label>Phone Number</label>
        <input type="number" placeholder='phone number'></input>
        <butoon>Submit</butoon>
    </form>  
    <p>Already have an account <Link href="/sign-in">Sign-in</Link> </p>
  </div>
  )
}

export default page