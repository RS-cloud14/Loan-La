import Dashboard from "@/components/Dashboard";

export default function Home() {
  return (
    <main className="flex-1 w-full relative overflow-hidden">
      {/* Background ambient light effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="relative z-10 w-full min-h-screen">
        <Dashboard />
      </div>
    </main>
  );
}
