import { useState } from 'react';

function FormComponent() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [message, setMessage] = useState("")

  return (
    
    <form className='form-container'>
      <label>
        Name:
        <input type="text" value={name} onChange={(e) => setName(e.target.value)}
      required />
      </label>

      <label>
        Email:
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </label>

      <label>
        Phone:
        <input type="phone" value={phone} onChange={(e) => setPhone(e.target.value)}
      required />
      </label>

      <label>
        Message:
        <textarea type="text" value={message} onChange={(e) => setMessage(e.target.value)}
      required />
      </label>
      <br></br>
      <div className="button-holder">      
        <input className="submit-btn" type="submit" />
      </div>
    </form>
   
  );
}

export default FormComponent;
