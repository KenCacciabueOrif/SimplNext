

import Posts from './posts/page';
import UESF from './_useEffectSW'


export default function Home() {
  return (
    <div className="border h-screen items-center flex flex-col ">
      <h1 className="text-2xl font-bold border text-center w-full">
        Simpl.
      </h1>
      <ol className="border flex flex-col flex-auto w-full overflow-auto">
        <UESF/>
        <Posts />
      </ol>
    </div>
  );
}