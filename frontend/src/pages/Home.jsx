import React from 'react'

const Home = () => {
  return (
      <>
      <h1>Joel E<span>zz</span>ahid – Web Developer</h1> 
      <div className='main-textarea'>
            <p>I have more than two years of experience in programming, focusing on building dynamic, user-friendly applications with React and Python. While I’m currently expanding my skills, particularly in full-stack development, I’ve worked on various projects involving frontend interfaces and backend functionality using React and Flask.</p>    
      </div>
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

            
            </>
  )
}

export default Home