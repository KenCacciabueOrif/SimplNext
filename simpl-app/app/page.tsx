import Posts from './posts/page';
import UESF from './_useEffectSW'
import Head from 'next/head';

export default function Home() {
  return (
    <div className="border h-screen items-center flex flex-col ">
      <Head>
      <link rel="icon" href="/apple-touch-icon.png" />    
      </Head>
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