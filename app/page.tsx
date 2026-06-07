export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
      <span className="text-5xl" aria-hidden>
        🐶
      </span>
      <h1 className="text-2xl font-semibold tracking-tight">
        DogHealth Tracker
      </h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        강아지 건강 상태에 따라 진화하는 적응형 헬스 트래커
      </p>
    </main>
  );
}
