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
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = appUrl;
    document.body.appendChild(iframe);

    console.log("iframe", iframe);
    console.log("OS: ", os);
    console.log("App URL: ", appUrl);

    // Fallback to app store after a delay if the app isn't installed
    setTimeout(() => {
      document.body.removeChild(iframe);
      if (os === "ios" || os === "android") {
        window.location.href = storeUrl[os];
        console.log("Store URL: ", storeUrl[os]);
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
      Go to App V3
    </button>
  );
}

export default App;
