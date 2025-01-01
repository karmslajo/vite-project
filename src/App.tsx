import "./App.css";

function App() {
  function detectOperatingSystem() {
    const userAgent = navigator.userAgent;

    console.log("User Agent: ", userAgent);

    if (/android/i.test(userAgent)) {
      return "android";
    }

    if (/iPad|iPhone|iPod/.test(userAgent)) {
      return "ios";
    }

    if (/win/i.test(userAgent)) {
      return "windows";
    }

    if (/macintosh|mac os x/i.test(userAgent)) {
      return "macos";
    }

    if (/linux/i.test(userAgent)) {
      return "linux";
    }

    return "unknown";
  }
  function redirectToApp(albumUrl: string | null) {
    const os = detectOperatingSystem();

    if (!albumUrl) return;
    const appUrl = albumUrl.replace(/^https?:\/\//, "gumpapp://");

    const storeUrl = {
      ios: "https://apps.apple.com/us/app/facebook/id284882215",
      android: "https://play.google.com/store/apps/details?id=com.gump.android",
    };

    let userLeftPage = false;

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        userLeftPage = true;
      }
    };

    document.addEventListener("visibilityChange", onVisibilityChange);

    window.location.href = appUrl;

    const fallbackTimeout = setTimeout(() => {
      if (!userLeftPage && (os === "ios" || os === "android")) {
        window.location.href = storeUrl[os];
      }
    }, 1000);

    const cleanup = () => {
      clearTimeout(fallbackTimeout);
      document.removeEventListener("visibilityChange", onVisibilityChange);
    };

    window.addEventListener("beforeunload", cleanup);
  }

  return (
    <>
      <button
        onClick={() =>
          redirectToApp(
            "https://piaayopela.gump.gg/album/jane-doe/iia-1734488550043"
          )
        }
      >
        1 Go to App With Production Album V15
      </button>
      <button
        onClick={() =>
          redirectToApp("https://piaayopela.gump.gg/album/travel/travel")
        }
      >
        2 Go to App With Production Album V15
      </button>
      <button
        onClick={() =>
          redirectToApp("https://piaayopela.gump.gg/album/cats-and-dogs")
        }
      >
        3 Go to App With Production Album V15
      </button>
      <button
        onClick={() =>
          redirectToApp(
            "https://pia.gump-staging.net/album/sun-life-fun-run/pok%C3%A9mon-run-hong-kong-2024"
          )
        }
      >
        Go to App With Staging Album V15
      </button>
      <p>{navigator.userAgent}</p>
    </>
  );
}

export default App;
