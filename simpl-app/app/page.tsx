
import Posts from './posts/page';

export default async function Home() {
  return (
    <div className="border h-screen items-center flex flex-col ">
      <h1 className="text-2xl font-bold border text-center w-full">
        Simpl.
      </h1>
      <ol className="border flex flex-col flex-auto w-full overflow-auto">
        <Posts />
      </ol>
    </div>
  );
}