import React, { useState, useEffect } from "react";

const FormComponent = () => {
  const initialFormState = {
    name: "",
    email: "",
    phone: "",
    message: "",
  };
  
  const [data, setData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success', 'error', or null
  const [errorMessage, setErrorMessage] = useState("");

  // Note: Consider if this useEffect is needed - it sends empty data on mount
  useEffect(() => {
    // This appears to be a ping to the backend on component mount
    // If not needed, you can remove this entire useEffect
    fetch("https://portfolio-website-backend-749y.onrender.com/api/form_data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        form_name: data.name,
        form_email: data.email,
        form_phone: data.phone,
        form_message: data.message,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Initial ping response:", data);
      })
      .catch((err) => {
        console.error("Error on initial ping:", err);
      });
  }, []);

  const handleChange = (e) => {
    setData({
      ...data,
      [e.target.name]: e.target.value,
    });
    // Clear any previous status when user starts typing again
    if (submitStatus) {
      setSubmitStatus(null);
      setErrorMessage("");
    }
  };

  const validateForm = () => {
    const errors = [];
    
    if (!data.name.trim()) errors.push("Name is required");
    if (!data.email.trim()) errors.push("Email is required");
    if (!data.email.includes('@')) errors.push("Please enter a valid email");
    if (!data.message.trim()) errors.push("Message is required");
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Client-side validation
    const errors = validateForm();
    if (errors.length > 0) {
      setSubmitStatus('error');
      setErrorMessage(errors.join('. '));
      return;
    }
    
    setIsSubmitting(true);
    setSubmitStatus(null);
    setErrorMessage("");

    try {
      const response = await fetch("https://portfolio-website-backend-749y.onrender.com/api/form_submit" , {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (response.ok) {
        console.log("Form submitted successfully:", responseData);
        setSubmitStatus('success');
        setData(initialFormState); // Clear the form
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          setSubmitStatus(null);
        }, 5000);
      } else {
        console.error("Server validation errors:", responseData);
        setSubmitStatus('error');
        
        // Handle server validation errors
        if (responseData.errors) {
          const errorMessages = Object.values(responseData.errors).join('. ');
          setErrorMessage(errorMessages);
        } else {
          setErrorMessage(responseData.message || "Failed to submit form. Please try again.");
        }
      }
    } catch (error) {
      console.error("Network error submitting form:", error);
      setSubmitStatus('error');
      setErrorMessage("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="form-container">
      <form className="form" onSubmit={handleSubmit}>
        <label>
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={data.name}
            onChange={handleChange}
            disabled={isSubmitting}
            required
          />
        </label>
        <label>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={data.email}
            onChange={handleChange}
            disabled={isSubmitting}
            required
          />
        </label>
        <label>
          <input
            type="tel"
            name="phone"
            placeholder="Phone (optional)"
            value={data.phone}
            onChange={handleChange}
            disabled={isSubmitting}
          />
        </label>
        <label>
          <textarea
            name="message"
            className="message"
            placeholder="Your message"
            value={data.message}
            onChange={handleChange}
            disabled={isSubmitting}
            required
            rows="5"
          ></textarea>
        </label>
        
        {/* Status Messages */}
        {submitStatus === 'success' && (
          <div className="status-message success-message" style={{
            color: '#28a745',
            backgroundColor: '#d4edda',
            padding: '10px',
            borderRadius: '4px',
            marginBottom: '10px'
          }}>
            ✓ Thank you! Your message has been sent successfully.
          </div>
        )}
        
        {submitStatus === 'error' && (
          <div className="status-message error-message" style={{
            color: '#dc3545',
            backgroundColor: '#f8d7da',
            padding: '10px',
            borderRadius: '4px',
            marginBottom: '10px'
          }}>
            ✗ {errorMessage}
          </div>
        )}
        
        <div>
          <input 
            className="submit-btn" 
            type="submit" 
            value={isSubmitting ? "Sending..." : "Send"}
            disabled={isSubmitting}
            style={{
              opacity: isSubmitting ? 0.7 : 1,
              cursor: isSubmitting ? 'not-allowed' : 'pointer'
            }}
          />
        </div>
      </form>
    </div>
  );
};

export default FormComponent;