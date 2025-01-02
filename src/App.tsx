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
      // ios: "itms-apps://apps.apple.com/us/app/facebook/id284882215",
      ios: "https://apps.apple.com/us/app/facebook/id284882215",
      // ios: "https://www.wikipedia.org/",
      android:
        "https://play.google.com/store/apps/details?id=com.gump.android&hl=en-US&ah=5GhbhJoMQ8b3ge9xy2-402N9bck",
    };
    // Create an iframe to silently attempt to open the app
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = appUrl;
    document.body.appendChild(iframe);

    console.log("OS: ", os);
    console.log("App URL: ", appUrl);
    console.log("Window Location Href: ", window.location.href);

    // Fallback to app store after a delay if the app isn't installed
    setTimeout(() => {
      // Remove the iframe after the attempt
      document.body.removeChild(iframe);

      if ((os === "ios" || os === "android") && document.hasFocus()) {
        window.location.href = storeUrl[os];
        console.log("Store URL: ", storeUrl[os]);
        console.log("Window Location Href Store: ", window.location.href);
        console.log("Redirecting to app store");
      }
    }, 1000);
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
      <p>V23</p>
    </>
  );
}

export default App;
