import React from 'react'
import AppRoutes from './components/AppRoutes'
import { ToastContainer } from 'react-toastify'
import "react-toastify/dist/ReactToastify.css";

const App = () => {
  return (
    <div>
      <AppRoutes/>
      <ToastContainer
        position="top-right"
        autoClose={1500}
      />
    </div>
  )
}

export default App
