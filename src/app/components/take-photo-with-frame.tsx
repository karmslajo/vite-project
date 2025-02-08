/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ModalOverlay } from "../components/modal-overlay";
import styles from "../styles/take-photo-with-frame.module.scss";
import { MediaLongPressTooltip } from "./media-long-press-tooltip";

type CameraProps = {
  frame: any;
  onClose: () => void;
  setCapturedPhoto: React.Dispatch<React.SetStateAction<string | null>>;
};

function Camera(props: CameraProps) {
  const cameraActive = useRef(false);
  const elNodeRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<HTMLImageElement>(null);
  const [facingMode, setFacingMode] = useState("user");
  const [isLandscape, setIsLandscape] = useState(false);
  const [deviceOrientation, setDeviceOrientation] =
    useState<keyof typeof orientationDirectionStyle>("portraitPrimary");
  const [videoDimensions, setVideoDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [test, setTest] = useState("");
  const [test1, setTest1] = useState("");

  const orientationDirectionStyle = {
    portraitPrimary: "",
    portraitSecondary: "",
    landscapePrimary: styles.landscapePrimary,
    landscapeSecondary: styles.landscapeSecondary,
  };

  const calculateVideoSize = useCallback(() => {
    const frame = frameRef.current;
    const video = videoRef.current;
    const container = video?.parentElement;

    if (!frame || !container || !video) return;

    const containerRect = container.getBoundingClientRect();

    // Get aspect ratios
    const containerAspectRatio = containerRect.width / containerRect.height;
    const videoAspectRatio = video.videoWidth / video.videoHeight;

    let videoWidth, videoHeight;

    // Calculate video's actual displayed size (matching object-fit: contain)
    if (videoAspectRatio > containerAspectRatio) {
      videoWidth = containerRect.width;
      videoHeight = containerRect.width / videoAspectRatio;
    } else {
      videoHeight = containerRect.height;
      videoWidth = containerRect.height * videoAspectRatio;
    }

    setVideoDimensions({ width: videoWidth, height: videoHeight });
  }, []);

  function capturePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const frameOverlay = frameRef.current;

    if (!canvas || !video || !frameOverlay) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Set canvas to video's original resolution
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Flip the context horizontally for the video only
    if (facingMode === "user") {
      ctx.save(); // Save the current context state
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    // Draw the cropped video centered on the canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Restore the original context to stop flipping for the frame
    if (facingMode === "user") {
      ctx.restore();
    }

    const frame = new Image();
    frame.crossOrigin = "anonymous";
    // For production
    // frame.src = isLandscape
    //   ? props.frame!.landscape!.url
    //   : props.frame!.portrait!.url;

    // For dev only, do not use in production
    frame.src = isLandscape
      ? `https://api.allorigins.win/raw?url=${props.frame!.landscape!.url}`
      : `https://api.allorigins.win/raw?url=${props.frame!.portrait!.url}`;

    frame.onload = () => {
      ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);
      const imageData = canvas.toDataURL("image/jpeg");
      props.setCapturedPhoto(imageData);
    };

    frame.onerror = (err) => {
      console.error("Error loading frame:", err);
    };

    stopCamera();
  }

  function updateOrientation() {
    const orientation = screen.orientation.type;

    setIsLandscape(orientation.includes("landscape"));

    switch (orientation) {
      case "landscape-primary":
        setDeviceOrientation("landscapePrimary");
        break;
      case "landscape-secondary":
        setDeviceOrientation("landscapeSecondary");
        break;
      case "portrait-primary":
        setDeviceOrientation("portraitPrimary");
        break;
      case "portrait-secondary":
        setDeviceOrientation("portraitSecondary");
        break;
      default:
        setDeviceOrientation("portraitPrimary");
    }

    // const orientation = window.screen.orientation.angle;
    // setIsLandscape(
    //   Math.abs(orientation) === 90 || Math.abs(orientation) === 270
    // );
    // switch (orientation) {
    //   case 0:
    //     setDeviceOrientation("portraitPrimary");
    //     break;
    //   case 90:
    //     setDeviceOrientation("landscapePrimary");
    //     break;
    //   case 180:
    //     setDeviceOrientation("portraitSecondary");
    //     break;
    //   case 270:
    //     setDeviceOrientation("landscapeSecondary");
    //     break;
    //   default:
    //     setDeviceOrientation("portraitPrimary");
    // }
  }

  function closeTakePhotoWithFrame() {
    props.setCapturedPhoto(null);
    stopCamera();
    props.onClose();
    close();
  }

  function switchCamera() {
    setFacingMode((prevMode) => (prevMode === "user" ? "environment" : "user"));
  }

  const getOptimalVideoConstraints = useCallback(async () => {
    const baseConstraints = {
      audio: false,
      facingMode,
      aspectRatio: { ideal: 4 / 3 },
    };

    try {
      // Start camera with minimal constraints to get capabilities
      const tempStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
      });

      const videoTrack = tempStream.getVideoTracks()[0];

      if (!videoTrack) throw new Error("No video track found.");

      const capabilities = videoTrack.getCapabilities();
      const maxWidth = capabilities.width?.max || 8192;
      const maxHeight = capabilities.height?.max || 6144;

      setTest1(`Max Width: ${maxWidth}, Max Height: ${maxHeight}`);

      tempStream.getTracks().forEach((track) => track.stop());

      return {
        video: {
          ...baseConstraints,
          width: {
            ideal: isLandscape ? maxWidth : maxHeight,
          },
          height: {
            ideal: isLandscape ? maxHeight : maxWidth,
          },
        },
      };
    } catch (error) {
      console.error("Error getting camera capabilities:", error);
      return {
        video: {
          ...baseConstraints,
          width: { ideal: isLandscape ? 8192 : 6144 },
          height: { ideal: isLandscape ? 6144 : 8192 },
        },
      };
    }
  }, [facingMode, isLandscape]);

  const startCamera = useCallback(async () => {
    if (cameraActive.current) return;
    cameraActive.current = true;

    stopCamera();

    const contraints = await getOptimalVideoConstraints();

    setTest(JSON.stringify(contraints));

    try {
      const stream = await navigator.mediaDevices.getUserMedia(contraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (error) {
      console.error("Error accessing the camera:", error);
    } finally {
      cameraActive.current = false;
    }

    calculateVideoSize();
    updateOrientation();
  }, [calculateVideoSize, getOptimalVideoConstraints]);

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

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.hidden) {
        stopCamera();
      } else {
        startCamera();
      }
    }

    window.addEventListener("resize", startCamera);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("resize", startCamera);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [startCamera]);

  return (
    <div
      className={`${styles.takePhotoWithFrameContainer} ${orientationDirectionStyle[deviceOrientation]}`}
      ref={elNodeRef}
    >
      <div className={styles.cameraWrapper}>
        <video
          ref={videoRef}
          playsInline={true}
          className={`${styles.cameraFeed} ${
            facingMode === "user" ? styles.reverse : ""
          }`}
        />
        <img
          ref={frameRef}
          src={
            isLandscape
              ? props.frame!.landscape!.url
              : props.frame!.portrait!.url
          }
          alt="Frame overlay"
          className={styles.frameOverlay}
          style={{
            height: videoDimensions.height,
            width: videoDimensions.width,
          }}
        />
      </div>
      <div
        style={{
          color: "white",
          position: "absolute",
          textAlign: "left",
        }}
      >
        {test}
        {`Max Constraints: ${test1}`}
      </div>
      <div className={styles.controls}>
        <div
          onClick={closeTakePhotoWithFrame}
          className={`${styles.controlButton} ${styles.close}`}
        />
        <div
          onClick={capturePhoto}
          className={`${styles.controlButton} ${styles.capture}`}
        />
        <div
          onClick={switchCamera}
          className={`${styles.controlButton} ${styles.switch}`}
        />
      </div>
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
}

type ResultPhotoProps = {
  frame: any;
  capturedPhoto: string;
  setCapturedPhoto: React.Dispatch<React.SetStateAction<string | null>>;
};

function ResultPhoto(props: ResultPhotoProps) {
  const [showTooltip, setShowTooltip] = useState(true);
  const [showLongPressComponents, setShowLongPressComponents] = useState(false);
  const [photoOrientation, setPhotoOrientation] = useState<string | null>(null);
  const [isLandscape, setIsLandscape] = useState(false);
  const [copied, setCopied] = useState(false);
  const longPressTimerRef = useRef<any>(null);
  const hashtagsRef = useRef<HTMLDivElement | null>(null);

  function handleTouchStart() {
    longPressTimerRef.current = setTimeout(() => {
      setShowTooltip(false);
      setShowLongPressComponents(true);
    }, 1250);
  }

  function handleTouchEnd() {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
  }

  function handleCopyHashtags() {
    const hashtags = hashtagsRef.current?.textContent;

    if (hashtags) {
      navigator.clipboard
        .writeText(hashtags)
        .then(() => {
          setCopied(true);
          setTimeout(() => {
            setCopied(false);
          }, 3000);
        })
        .catch((err) => {
          console.error("Failed to copy hashtags: ", err);
        });
    }
  }

  async function shareImage() {
    try {
      if (!props.capturedPhoto) {
        console.error("Captured photo is null");
        return;
      }

      const blob = await fetch(props.capturedPhoto).then((res) => res.blob());

      const file = new File(
        [blob],
        `gump_${props.frame?.name}_${Date.now()}.jpeg`,
        { type: "image/jpeg" }
      );

      const shareData = {
        files: [file],
      };

      navigator
        .share(shareData)
        .catch((error) => console.error("Error sharing image:", error));
    } catch (error) {
      console.error("Error preparing image for sharing:", error);
    }
  }

  function determineDeviceAndPhotoDisplayOrientation() {
    if (
      !isLandscape &&
      photoOrientation === "portrait" &&
      !showLongPressComponents
    ) {
      return styles.portraitInPortraitLargePreview;
    }

    if (
      isLandscape &&
      photoOrientation === "landscape" &&
      !showLongPressComponents
    ) {
      return styles.landscapeInLandscapeLargePreview;
    }

    if (
      isLandscape &&
      photoOrientation === "portrait" &&
      !showLongPressComponents
    ) {
      return styles.portraitInLandscapeLargePreview;
    }

    if (!isLandscape && photoOrientation === "portrait") {
      return styles.portraitInPortraitView;
    }

    if (isLandscape && photoOrientation === "landscape") {
      return styles.landscapeInLandscapeView;
    }

    if (isLandscape && photoOrientation === "portrait") {
      return styles.portraitInLandscapeView;
    }

    if (!isLandscape && photoOrientation === "landscape") {
      return styles.landscapeInPortraitView;
    }

    return "";
  }

  const updateOrientation = useCallback(() => {
    setIsLandscape(window.innerWidth > window.innerHeight);
  }, []);

  useEffect(() => {
    if (props.capturedPhoto) {
      const img = new Image();
      img.src = props.capturedPhoto;
      img.onload = () => {
        if (img.width > img.height) {
          setPhotoOrientation("landscape");
        } else {
          setPhotoOrientation("portrait");
        }
      };
    }
  }, [props.capturedPhoto]);

  useEffect(() => {
    updateOrientation();

    window.addEventListener("resize", updateOrientation);
    return () => {
      window.removeEventListener("resize", updateOrientation);
    };
  }, [updateOrientation]);

  return (
    <div className={styles.resultPhotoContainer}>
      <div
        className={`${styles.header} ${
          showLongPressComponents ? styles.longPressHeader : ""
        }`}
      >
        <div
          className={`${styles.backIcon} ${
            showLongPressComponents ? styles.longPressBackIcon : ""
          }`}
          onClick={() => {
            props.setCapturedPhoto(null);
          }}
        />
      </div>
      {showTooltip && <MediaLongPressTooltip show={true} />}
      <div
        className={`${styles.resultPhotoWrapper} ${
          isLandscape && showLongPressComponents
            ? styles.landscapeWithLongPressComponents
            : ""
        }`}
      >
        <img
          className={`${
            styles.resultPhoto
          } ${determineDeviceAndPhotoDisplayOrientation()}`}
          src={props.capturedPhoto ?? ""}
          alt="captured"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleTouchStart}
          onMouseUp={handleTouchEnd}
          onMouseLeave={handleTouchEnd}
        />
      </div>
      {showLongPressComponents && (
        <div className={styles.longPressComponentsWrapper}>
          <div className={styles.hashtagContainer}>
            <div className={styles.hashtagsInner}>
              <div className={styles.hashtags} ref={hashtagsRef}>
                #Yay
              </div>
              <div className={styles.copyIcon} onClick={handleCopyHashtags} />
            </div>
          </div>
          <div className={styles.shareOptions}>
            <div className={styles.shareLinkedin} />
            <div className={styles.shareInstagram} />
            <div className={styles.shareFacebook} />
            <div className={styles.shareButton} onClick={shareImage}>
              <div className={styles.shareIconWhite} />
              <div className={styles.text}>Share</div>
            </div>
          </div>
        </div>
      )}
      {copied && (
        <div className={styles.bottomNotification}>Hashtags Copied</div>
      )}
    </div>
  );
}

export type FrameCameraProps = {
  frame: any;
  onClose: () => void;
};

export function FrameCamera(props: FrameCameraProps) {
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  return (
    <ModalOverlay onClose={props.onClose}>
      {capturedPhoto ? (
        <ResultPhoto
          capturedPhoto={capturedPhoto}
          frame={props.frame}
          setCapturedPhoto={setCapturedPhoto}
        />
      ) : (
        <Camera
          frame={props.frame}
          onClose={props.onClose}
          setCapturedPhoto={setCapturedPhoto}
        />
      )}
    </ModalOverlay>
  );
}
