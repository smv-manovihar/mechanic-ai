import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { account, ID } from "./appwrite";
import "./Auth.css";
import { toast } from "react-toastify";

const Signup = ({ onSignup }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false); // State for button text and disabled status
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true); // Disable the button and change its text
    try {
      const userId = ID.unique();
      await account.create(userId, email, password);
      await account.createEmailPasswordSession(email, password);
      onSignup(true);
      navigate("/"); // Redirect to the main page
      toast.success("Logged in successfully");
    } catch (error) {
      console.error("Signup failed:", error);
      toast.error(error.message, {
        position: "bottom-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
    } finally {
      setIsSubmitting(false); // Re-enable the button after the operation
    }
  };

  return (
    <div className="auth-container">
      <h2>Sign Up</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Please wait..." : "Sign Up"}
        </button>
      </form>
      <p>
        Already have an account?{" "}
        <button onClick={() => navigate("/login")} disabled={isSubmitting}>
          Login
        </button>
      </p>
    </div>
  );
};

export default Signup;
