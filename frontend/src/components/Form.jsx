import React, { useState, useEffect } from "react";

const FormComponent = () => {
  const [data, setData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  useEffect(() => {
    fetch("http://localhost:5000/form_data", {
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
        console.log("Fetched data:", data);
      })
      .catch((err) => {
        console.error("Error fetching:", err);
      });
  }, []);
  

  const handleChange = (e) => {
    setData({
      ...data,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted:", data);

    // You can send the form data to Flask here
    fetch("http://localhost:5000/form_submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
      .then((response) => console.log("Server response:", response))
      .catch((error) => console.error("Error:", error));

      var allInputs = document.querySelectorAll('input'); // logic to clear the form after submitting the data
      allInputs.forEach(singleInput => singleInput.value = '');
      var textarea = document.querySelectorAll('textarea');
      textarea.forEach(singleInput => singleInput.value = '')
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
