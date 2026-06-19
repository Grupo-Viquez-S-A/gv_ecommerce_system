import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div className="w-screen h-screen flex items-center justify-center">
        <h1 className="text-4xl font-bold tet center text-blue-500">
          Hello world!
        </h1>
      </div>
    </>
  )
}

export default App
