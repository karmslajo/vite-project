// import { useEffect, useState } from "react";
import "./App.css";

function App() {
  // const [isChrome, setIsChrome] = useState(false);
  // const [isSafari, setIsSafari] = useState(false);

  function detectOperatingSystem() {
    const userAgent = navigator.userAgent;

    if (/android/i.test(userAgent)) {
      return "android";
    }

    if (/iPad|iPhone|iPod/.test(userAgent)) {
      return "ios";
    }
  }

  function redirectToApp(albumLink: string) {
    const device = detectOperatingSystem();
    const appUrl = albumLink.replace(/^https?:\/\//, "gumpapp://");
    const isSafari = /^((?!chrome|android|crios).)*safari/i.test(
      navigator.userAgent
    );

    const storeUrl = {
      ios: "https://apps.apple.com/us/app/facebook/id284882215",
      android: "https://play.google.com/store/apps/details?id=com.gump.android",
    };

    if (isSafari) {
      window.location.href = appUrl;
      setTimeout(() => {
        if (document.hasFocus() && device && storeUrl[device]) {
          window.location.href = storeUrl[device];
        }
      }, 4000);
    } else {
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.src = appUrl;
      document.body.appendChild(iframe);
      document.body.removeChild(iframe);

      setTimeout(() => {
        if (document.hasFocus() && device && storeUrl[device]) {
          window.location.href = storeUrl[device];
        }
      }, 1500);
    }
  }

  // useEffect(() => {
  //   const userAgent = navigator.userAgent;

  //   // Detect Chrome
  //   setIsChrome(userAgent.indexOf("Chrome") > -1);

  //   // Detect Safari
  //   setIsSafari(userAgent.indexOf("Safari") > -1);

  //   // Discard Safari since it also matches Chrome
  //   if (isChrome && isSafari) setIsSafari(false);
  // }, [isChrome, isSafari]);

  return (
    <>
      <button
        onClick={() =>
          redirectToApp(
            "https://piaayopela.gump.gg/album/jane-doe/iia-1734488550043"
          )
        }
      >
        1 Go to App With Production Album
      </button>
      <button
        onClick={() =>
          redirectToApp("https://piaayopela.gump.gg/album/travel/travel")
        }
      >
        2 Go to App With Production Album
      </button>
      <button
        onClick={() =>
          redirectToApp("https://piaayopela.gump.gg/album/cats-and-dogs")
        }
      >
        3 Go to App With Production Album
      </button>
      <button
        onClick={() =>
          redirectToApp(
            "https://pia.gump-staging.net/album/sun-life-fun-run/pok%C3%A9mon-run-hong-kong-2024"
          )
        }
      >
        Go to App With Staging Album
      </button>
      <p>{navigator.userAgent}</p>
      <p>V36</p>
      {/* <p>Chrome: {isChrome}</p>
      <p>Safari: {isSafari}</p> */}
    </>
  );
}

export default App;
