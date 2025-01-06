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

  function redirectToApp(albumLink: string) {
    const device = detectOperatingSystem();
    const appUrl = albumLink.replace(/^https?:\/\//, "gumpapp://");

    const storeUrl = {
      windows: "",
      ios: "https://apps.apple.com/us/app/facebook/id284882215",
      android: "https://play.google.com/store/apps/details?id=com.gump.android",
      macos: "",
      linux: "",
      unknown: "",
    };

    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = appUrl;
    document.body.appendChild(iframe);
    setTimeout(() => {
      if (document.hasFocus() && storeUrl[device]) {
        window.location.href = storeUrl[device];
      }
      document.body.removeChild(iframe);
    }, 3000);
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
      <p>V32</p>
    </>
  );
}

export default App;
