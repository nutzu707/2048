import Hello2048 from "./components/2048";

export default function Home() {
  return (
    <div className="flex justify-center items-center h-screen bg-gradient-to-br from-yellow-200 via-orange-300 to-pink-400">
      <Hello2048/>
    </div>
  );
}
