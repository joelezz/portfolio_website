import React from 'react'

const Home = () => {
  return (
      <>     
      <h1>Joel        <br /> E<span>zz</span>ahid</h1> 
 
      <section id="home">
            <p>Ready to see what modern web development can really do? I craft user-friendly, dynamic experiences from cutting-edge React frontends to intelligent AI integrations. Welcome!</p>    
      <div>
      <a target='_blank'
            rel='noopener noreferrer' href="https://python.org"><img className='tech-logo' src="./python_logo.png"/></a>
      <a target='_blank'
            rel='noopener noreferrer' href="https://www.postgresql.org/"><img className='tech-logo' src="./pg_logo.png"/></a>
      <a target='_blank'
            rel='noopener noreferrer' href="https://developer.mozilla.org/en-US/docs/Web/JavaScript"><img className='tech-logo' src="./javascript_logo.png"/></a>
      <a target='_blank'
            rel='noopener noreferrer' href="https://react.dev/"><img className='tech-logo' src="./react_logo.png"/></a> 
      </div>
      </section>
      </>
  )
}

export default Home