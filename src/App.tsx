import { useEffect } from "react";
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
    // const device = detectOperatingSystem();
    // const appUrl = `https://gumpapp.onelink.me/0i5A/7m9jy7cr?albumLink=${albumLink}`;
    const appUrl = `https://gumpapp.onelink.me/0i5A/7m9jy7cr?af_force_deeplink=true&deep_link_value=albumLink&albumLink=${albumLink}`;
    // const isSafari = /^((?!chrome|android|crios).)*safari/i.test(
    //   navigator.userAgent
    // );

    window.location.href = appUrl;
  }

  function redirectToAppOrig(albumLink: string) {
    const device = detectOperatingSystem();
    const appUrl = albumLink.replace(/^https?:\/\//, "gumpapp://");
    const isSafari = /^((?!chrome|android|crios).)*safari/i.test(
      navigator.userAgent
    );

    const storeUrl = {
      windows: "",
      ios: "https://apps.apple.com/us/app/facebook/id284882215",
      android: "https://play.google.com/store/apps/details?id=com.gump.android",
    };
    if (isSafari) {
      window.location.href = appUrl;
      setTimeout(() => {
        if (document.hasFocus() && device && storeUrl[device]) {
          window.location.href = storeUrl[device];
        }
      }, 3000);
    } else {
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.src = appUrl;
      document.body.appendChild(iframe);
      setTimeout(() => {
        if (document.hasFocus() && device && storeUrl[device]) {
          window.location.href = storeUrl[device];
        }
        document.body.removeChild(iframe);
      }, 2000);
    }
  }

  useEffect(() => {
    // Create a meta tag
    const metaTag = document.createElement("meta");
    metaTag.name = "apple-itunes-app";
    metaTag.content =
      "app-id=1064216828, app-argument=https://www.reddit.com/r/nba/comments/1hw70t6/highlight_lebron_james_decides_to_stop_passing/?utm_source=share&utm_medium=web3x&utm_name=web3xcss&utm_term=1&utm_content=share_button";

    document.head.appendChild(metaTag);

    return () => {
      document.head.removeChild(metaTag);
    };
  }, []);

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
          redirectToAppOrig("https://piaayopela.gump.gg/album/cats-and-dogs")
        }
      >
        3 Orig Go to App With Production Album
      </button>
      <button
        onClick={() =>
          redirectToApp(
            "https://pia.gump-staging.net/album/sun-life-fun-run/pok%C3%A9mon-run-hong-kong-2024"
          )
        }
      >
        1 Go to App With Staging Album
      </button>
      <button
        onClick={() =>
          redirectToApp(
            "https://pia.gump-staging.net/album/alex/20241118kawagoe"
          )
        }
      >
        2 Go to App With Staging Album
      </button>
      <button
        onClick={() =>
          redirectToAppOrig(
            "https://pia.gump-staging.net/album/shinjuku-gyoen/202403271000shinjuku-gyoen-1734305812118"
          )
        }
      >
        3 Orig Go to App With Staging Album
      </button>
      <p>{navigator.userAgent}</p>
      <p>V49</p>
      {/* <p>Chrome: {isChrome}</p>
      <p>Safari: {isSafari}</p> */}
    </>
  );
}

export default App;
