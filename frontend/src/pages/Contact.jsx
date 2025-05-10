import React from 'react'
import FormComponent from '../components/Form'

const Contact = () => {
  return (
    <>
    <h1>Contact</h1> 
    <p>Whether you have a specific project in mind or you just want to expand your professional network, please feel free to contact me.</p>
    <FormComponent />
    <a target='_blank'
          rel='noopener noreferrer' href="https://www.linkedin.com/in/joelezzahid/"><img className='contact-logo' src="./linkedin_logo.png"/></a>
    <a target='_blank'
          rel='noopener noreferrer' href="https://github.com/joelezz"><img className='contact-logo' src="./github_logo.png"/></a>
    <a target='_blank'
          rel='noopener noreferrer' href="mailto:joel@duoai.tech"><img className='contact-logo' src="./email_logo.png"/></a> 
          </>
  )
}

export default Contact