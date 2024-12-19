/* eslint-disable @typescript-eslint/no-unused-vars */
import "./App.css";

function App() {
  function detectOperatingSystem() {
    const userAgent = navigator.userAgent;

    console.log("User Agent: ", userAgent);

    if (/win/i.test(userAgent)) {
      return "windows";
    }

    if (/macintosh|mac os x/i.test(userAgent)) {
      return "macos";
    }

    if (/linux/i.test(userAgent)) {
      return "linux";
    }

    if (/android/i.test(userAgent)) {
      return "android";
    }

    if (/iPad|iPhone|iPod/.test(userAgent)) {
      return "ios";
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

    // Create a hidden iframe to attempt to open the app
    window.open(appUrl);

    console.log("OS: ", os);
    console.log("App URL: ", appUrl);
    console.log("Window Location Href: ", window.location.href);

    // Fallback to app store after a delay if the app isn't installed
    setTimeout(() => {
      if (os === "ios" || (os === "android" && document.hasFocus())) {
        window.open(appUrl);
        console.log("Store URL: ", storeUrl[os]);
        console.log("Window Location Href Store: ", window.location.href);
        console.log("Redirecting to app store");
      }
    }, 1500);
  }

  return (
    <button
      onClick={() =>
        redirectToApp(
          "gumpapp://pia.gump-staging.net/album/alex/20241118kawagoe"
        )
      }
    >
      Go to App V9
    </button>
  );
}

export default App;
