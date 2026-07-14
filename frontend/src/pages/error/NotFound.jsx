export default function NotFound() {
  return (
    <div className="h-screen flex flex-col justify-center items-center text-center">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="text-lg mt-4">Oops! Page not found 😅</p>
      <button onClick={() => window.location.href = "/home"} className="mt-6 px-4 py-2 bg-blue-500 text-white rounded">
        Go Home
      </button>
    </div>
  );
}