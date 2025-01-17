// import { useEffect } from "react";
import { useRef, useCallback, useEffect } from "react";
import "./App.css";
import customProtocolCheck from "custom-protocol-check";

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraActive = useRef(false);

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
      ios: "https://apps.apple.com/ph/app/gump-ai-limited/id6670382932",
      android: "https://play.google.com/store/apps/details?id=com.gump.android",
    };
    if (isSafari) {
      window.location.href = `https://gumpapp.onelink.me/0i5A/7m9jy7cr?af_force_deeplink=true&deep_link_value=albumLink&albumLink=${albumLink}`;
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
      }, 1500);
    }
  }

  const openApp = (albumLink: string) => {
    const appUrl = albumLink.replace(/^https?:\/\//, "gumpapp://");
    const appStoreURL =
      "https://apps.apple.com/ph/app/gump-ai-limited/id6670382932";

    customProtocolCheck(
      appUrl,
      () => {
        // App is installed, proceed with opening the app
        window.location.href = appUrl;
      },
      () => {
        // App is not installed, redirect to App Store
        window.location.href = appStoreURL;
      }
    );
  };

  const startCamera = useCallback(async () => {
    if (cameraActive.current) return;
    cameraActive.current = true;

    const constraints = {
      video: {
        audio: false,
        facingMode: "",
      },
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (error) {
      console.error("Error accessing the camera:", error);
    } finally {
      cameraActive.current = false;
    }
  }, []);

  function stopCamera() {
    const stream = videoRef.current?.srcObject as MediaStream | null;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
  }

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera]);

  // useEffect(() => {
  //   // Create a meta tag
  //   const albumLink =
  //     "https://piaayopela.gump.gg/album/jane-doe/iia-1734488550043";
  //   const appUrl = `https://gumpapp.onelink.me/0i5A/7m9jy7cr?deep_link_value=albumLink&albumLink=${albumLink}`;
  //   const metaTag = document.createElement("meta");
  //   metaTag.name = "apple-itunes-app";
  //   metaTag.content = `app-id=6670382932, app-argument=${appUrl}`;

  //   document.head.appendChild(metaTag);

  //   return () => {
  //     document.head.removeChild(metaTag);
  //   };
  // }, []);

  const display: string = "camera";

  return (
    <>
      {display === "webMobileFlow" && (
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
              redirectToAppOrig(
                "https://piaayopela.gump.gg/album/cats-and-dogs"
              )
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
          <button
            onClick={() =>
              openApp(
                "https://pia.gump-staging.net/album/shinjuku-gyoen/202403271000shinjuku-gyoen-1734305812118"
              )
            }
          >
            Test Btn
          </button>
          <p>{navigator.userAgent}</p>
          <p>V56</p>
        </>
      )}
      {display === "camera" && <video ref={videoRef} />}
    </>
  );
}

export default App;
