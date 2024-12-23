import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

const ConfirmToast = ({ message, onConfirm, autoClose = 5000 }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const interval = 100; // Update progress every 100ms
    const decrement = (interval / autoClose) * 100; // Amount to decrease per interval

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          toast.dismiss(); // Auto close the toast when progress reaches 0
        }
        return prev - decrement;
      });
    }, interval);

    return () => clearInterval(timer); // Cleanup interval on unmount
  }, [autoClose]);

  return (
    <div>
      <p style={{marginTop:"15px", marginBottom: "15px" }}>{message}</p>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <button
          style={{
            backgroundColor: "green",
            color: "white",
            border: "none",
            padding: "5px 10px",
            borderRadius: "3px",
            cursor: "pointer",
          }}
          onClick={() => {
            toast.dismiss();
            onConfirm();
          }}
        >
          Confirm
        </button>
        <button
          style={{
            backgroundColor: "red",
            color: "white",
            border: "none",
            padding: "5px 10px",
            borderRadius: "3px",
            cursor: "pointer",
          }}
          onClick={() => {
            toast.dismiss();
          }}
        >
          Cancel
        </button>
      </div>
      <div
        style={{
          marginTop: "10px",
          height: "5px",
          background: "#ccc",
          borderRadius: "3px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: "100%",
            background: "#4caf50",
            transition: "width 0.1s linear",
          }}
        />
      </div>
    </div>
  );
};

export default ConfirmToast;
