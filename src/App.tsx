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

    let appLikelyOpened = false;

    // Redirect to the app
    window.location.href = appUrl;

    // Listen for visibility and pagehide events
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        // User left the browser, likely opened the app
        appLikelyOpened = true;
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    // Fallback to redirect to the store if the app isn't installed
    const fallbackTimeout = setTimeout(() => {
      if (!appLikelyOpened && (os === "ios" || os === "android")) {
        window.location.href = storeUrl[os];
      }
    }, 1000);

    // Cleanup logic to avoid memory leaks
    const cleanup = () => {
      clearTimeout(fallbackTimeout);
      document.removeEventListener("visibilitychange", onVisibilityChange);
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
      <p>V21</p>
    </>
  );
}

export default App;
