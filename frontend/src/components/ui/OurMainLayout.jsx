import React from "react";
import Sidebar from "../layout/Sidebar";

const OurMainLayout = ({children }) => {
  return <>
{/* <div className=""> */}
        <Sidebar/>
      {/* <main className="flex-1 bg-gray-100 p-4"> */}
        {children}
      {/* </main> */}
    {/* </div>   */}
    </>;
};

export default OurMainLayout;
