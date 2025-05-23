import React from 'react'
import FormComponent from '../components/Form'

const Contact = () => {
  return (
    <>
    <h1>Contact me</h1> 
    <p>Have a project in mind?</p><p> I help businesses and entrepreneurs turn their ideas into functional web applications. <br /> <br/>
<p>Want to <a target='_blank'
          rel='noopener noreferrer' href="https://www.linkedin.com/in/joelezzahid/"><span>connect</span></a>?</p> <br /> I'm always interested in meeting fellow developers and discussing the latest in web tech.
Drop me a line – I respond to every message.</p>
    <FormComponent />
            <div>
    <a target='_blank'
          rel='noopener noreferrer' href="https://www.linkedin.com/in/joelezzahid/"><img className='contact-logo' src="./linkedin_logo.png"/></a>
    <a target='_blank'
          rel='noopener noreferrer' href="https://github.com/joelezz"><img className='contact-logo' src="./github_logo.png"/></a>
    <a target='_blank'
          rel='noopener noreferrer' href="mailto:hello@joelezzahid.com"><img className='contact-logo' src="./email_logo.png"/></a> 
            </div>
          </>
  )
}

export default Contact