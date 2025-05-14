import React from "react";
import AppRoutes from "./routes/AppRoutes";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import QuixkyBot from "./components/QuixkyBot"; // import your bot component
import "./styles/global.css";
/*
        \                    /  
         )  ◣__◢   (  
        /  / .  . \  \      ROAR! I AM DEX!  
       |   \ --- /   |     PROTECTOR OF CODE!  
        \  (__Y__)  /  
         `--'-'--`  
       //  || ||  \\  
      //   || ||   \\  
     ^^    ^^ ^^    ^^  
 ~ Dex, The Code Guardian ~
*/
function App() {
  return (
    <>
      <AppRoutes />
      <ToastContainer
        position="top-center"
        autoClose={1500}
        hideProgressBar={true}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <QuixkyBot />
    </>
  );
}

export default App;
