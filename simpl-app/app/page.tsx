
import Posts from './posts/page';

export default async function Home() {
  return (
    <div className="border-2 border-gray-50">
      <h1 className="">
        Superblog
      </h1>
      <ol className="">
        <Posts/>
      </ol>
    </div>
  );
}