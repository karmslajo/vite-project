/* eslint-disable @typescript-eslint/no-explicit-any */
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
      android:
        "https://play.google.com/store/apps/details?id=com.gump.android&hl=en-US&ah=5GhbhJoMQ8b3ge9xy2-402N9bck",
    };

    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    let timeout: any;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearTimeout(timeout);
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange
        );
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    if (isSafari && os === "ios") {
      // Use `window.open` to attempt opening the app for Safari
      window.open(appUrl, "_self");

      timeout = setTimeout(() => {
        if (document.hasFocus()) {
          window.location.href = storeUrl.ios;
        }
      }, 1000);
    } else {
      // Use iframe for other browsers
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.src = appUrl;
      document.body.appendChild(iframe);

      timeout = setTimeout(() => {
        if (os in storeUrl && document.hasFocus()) {
          window.location.href = storeUrl[os as keyof typeof storeUrl];
        }

        document.body.removeChild(iframe);
      }, 1000);
    }
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
      <p>V25</p>
    </>
  );
}

export default App;
