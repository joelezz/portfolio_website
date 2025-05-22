import React, { useState, useEffect } from "react";

const FormComponent = () => {
  const initialFormState = { // Define initial state for easy reset
    name: "",
    email: "",
    phone: "",
    message: "",
  };
  const [data, setData] = useState(initialFormState);

  // Your useEffect (see note below)
  useEffect(() => {
    // ... (your existing fetch logic, but consider if it should run on mount with empty data)
    // This POST request on mount with empty initial data is unusual.
    // Is it meant to register a view, or perhaps fetch initial data instead?
    // For now, let's assume it's intentional for your backend.
    fetch("https://portfolio-website-backend-749y.onrender.com/form_data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ // This will send empty strings initially
        form_name: data.name,
        form_email: data.email,
        form_phone: data.phone,
        form_message: data.message,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Fetched data on mount:", data);
      })
      .catch((err) => {
        console.error("Error fetching on mount:", err);
      });
  }, []); // Empty dependency array means this runs once on mount

  const handleChange = (e) => {
    setData({
      ...data,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted:", data);

    fetch("https://portfolio-website-backend-749y.onrender.com/form_submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((res) => {
        // Check if the response is ok before trying to parse as JSON
        if (!res.ok) {
          // If server sends non-JSON error or empty response for errors
          return res.text().then(text => { throw new Error(text || `Server responded with ${res.status}`) });
        }
        return res.json();
      })
      .then((response) => {
        console.log("Server response:", response);
        // Clear the form by resetting the state
        setData(initialFormState); // <--- THE REACT WAY TO CLEAR THE FORM
      })
      .catch((error) => {
        console.error("Error submitting form:", error);
        // Optionally, you might want to inform the user about the error
        // and not clear the form so they can try again.
      });
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
          />
        </label>
        <label>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={data.email}
            onChange={handleChange}
          />
        </label>
        <label>
          <input
            type="text"
            name="phone"
            placeholder="Phone"
            value={data.phone}
            onChange={handleChange}
          />
        </label>
        <label>
          <textarea
            name="message"
            className="message"
            placeholder="Your message"
            value={data.message}
            onChange={handleChange}
          ></textarea>
        </label>
        <div>
          <input className="submit-btn" type="submit" value="Submit" />
        </div>
      </form>
    </div>
  );
};

export default FormComponent;