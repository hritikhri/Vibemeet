import React from "react";
import Sidebar from "../layout/Sidebar";

const OurMainLayout = ({ children }) => {
  return (
    <>
      <div className="flex">
        <Sidebar />
        <main className="flex-1 bg-gray-100 ">{children}</main>
      </div>
    </>
  );
};

export default OurMainLayout;
