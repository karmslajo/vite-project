import { useEffect } from "react";
import "./App.css";

function App() {
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
    // const albumLink =
    //   "https://piaayopela.gump.gg/album/jane-doe/iia-1734488550043";
    // const appUrl = albumLink.replace(/^https?:\/\//, "gumpapp://");
    // const appUrl = `https://gumpapp.onelink.me/0i5A/7m9jy7cr?deep_link_value=albumLink&albumLink=${albumLink}`;
    const metaTag = document.createElement("meta");
    metaTag.name = "apple-itunes-app";
    metaTag.content =
      "app-id=6670382932, app-argument=https://gumpapp.onelink.me/0i5A/7m9jy7cr?deep_link_value=albumLink&albumLink=https://piaayopela.gump.gg/album/jane-doe/iia-1734488550043";

    document.head.appendChild(metaTag);

    return () => {
      document.head.removeChild(metaTag);
    };
  }, []);

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
      <p>V52</p>
    </>
  );
}

export default App;
