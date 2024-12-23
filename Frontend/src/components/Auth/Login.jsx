import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { account } from "./appwrite";
import { toast } from "react-toastify";
import "./Auth.css";

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false); // State for button text and disabled status
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true); // Disable the button and change its text
    try {
      await account.createEmailPasswordSession(email, password);
      onLogin(true);
      navigate("/"); // Redirect to the main page
      toast.success("Logged in successfully");
    } catch (error) {
      console.error("Login failed:", error);
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
      <h2>Login</h2>
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
          {isSubmitting ? "Please wait..." : "Login"}
        </button>
      </form>
      <p>
        Don't have an account?{" "}
        <button onClick={() => navigate("/signup")} disabled={isSubmitting}>
          Sign Up
        </button>
      </p>
    </div>
  );
};

export default Login;
