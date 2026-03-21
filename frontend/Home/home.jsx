import { useNavigate } from "react-router-dom";

import building from "../src/assets/SLIIT-Building.jpg";
import campus from "../src/assets/sliit-metro-campus-facilities-7.jpg";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <div className="absolute inset-0 z-[1] flex">
        <img src={building} alt="SLIIT Building" className="h-full w-1/2 object-cover" />
        <img src={campus} alt="SLIIT Campus Facilities" className="h-full w-1/2 object-cover" />
      </div>

      <div className="absolute inset-0 z-[2] bg-black/55" />

      <div className="relative z-[3] flex h-screen flex-col items-center justify-center px-4">
        <div className="max-w-xl rounded-3xl p-8 text-center text-white backdrop-blur-3xl">
          <h1>Driven by Algorithms</h1>
          <p className="mt-3 text-xl">Designed for SLIIT</p>
        </div>

        <div className="mt-8">
          <button 
            className="rounded-full bg-black px-12 py-4 text-base font-bold text-white transition hover:scale-105 hover:bg-slate-800"
            onClick={() => navigate("/login")}
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}
