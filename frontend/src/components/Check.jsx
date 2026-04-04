import React from "react";

const TestTailwind = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 p-6">

      {/* Color Test */}
      <div className="bg-background text-text p-6 rounded-xl shadow-soft w-80 text-center">
        <h1 className="text-2xl font-bold">Primary Box</h1>
        <p>If background is light pink → ✅ Working</p>
      </div>

      <div className="bg-secondary p-6 rounded-xl w-80 text-center">
        <p>Secondary Color Test</p>
      </div>

      <div className="bg-accent p-6 rounded-xl w-80 text-center">
        <p>Accent Color Test</p>
      </div>

      {/* Font Test */}
      <div className="font-poppins text-xl">
        This is Poppins Font
      </div>

      <div className="font-inter text-xl">
        This is Inter Font
      </div>

      {/* Shadow Test */}
      <div className="bg-white p-6 rounded-xl shadow-soft">
        Soft Shadow Test
      </div>

    </div>
  );
};

export default TestTailwind;