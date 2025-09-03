import React from 'react'

const CoverLetter = async ({params}) => {
    const id = await params.id
  return (
    <div>
      <h1>Cover Letter: {id}</h1>
      <p>Welcome to the cover letter page for {id}.</p>
    </div>
  )
}

export default CoverLetter
