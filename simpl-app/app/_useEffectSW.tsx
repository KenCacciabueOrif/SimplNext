'use client'
import { useEffect } from "react";

export default function UESF() {

    useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('./service-worker.js')
        .then((registration) => console.log('scope is: ', registration.scope));
    }
  }, []);

    return (
        <div></div>
    );
}