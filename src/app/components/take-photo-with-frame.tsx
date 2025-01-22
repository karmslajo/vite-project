/* eslint-disable @typescript-eslint/no-explicit-any */
import { Key, useCallback, useEffect, useRef, useState } from "react";
import { ModalOverlay } from "../components/modal-overlay";
import styles from "../styles/take-photo-with-frame.module.scss";
import Webcam from "react-webcam";

type CameraProps = {
  frame: any;
  onClose: () => void;
  setCapturedPhoto: React.Dispatch<React.SetStateAction<string | null>>;
};

function Camera(props: CameraProps) {
  const webcamRef = useRef<Webcam>(null);
  const elNodeRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<HTMLImageElement>(null);
  const [facingMode, setFacingMode] = useState("environment");
  const [isLandscape, setIsLandscape] = useState(false);
  const [frameDimensions, setFrameDimensions] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  });

  const videoConstraints = {
    facingMode: facingMode,
    audio: false,
  };

  const calculateFrameDimensions = useCallback(() => {
    const frame = frameRef.current;
    const container = frame?.parentElement;

    if (!frame || !container) return;

    const containerRect = container.getBoundingClientRect();

    // Get the natural aspect ratio of the frame image
    const frameAspectRatio = frame.naturalWidth / frame.naturalHeight;
    const containerAspectRatio = containerRect.width / containerRect.height;

    let frameWidth, frameHeight;

    // Calculate actual rendered dimensions based on object-fit: contain
    if (frameAspectRatio > containerAspectRatio) {
      // Frame is wider relative to container - will fit to width
      frameWidth = containerRect.width;
      frameHeight = containerRect.width / frameAspectRatio;
    } else {
      // Frame is taller relative to container - will fit to height
      frameHeight = containerRect.height;
      frameWidth = containerRect.height * frameAspectRatio;
    }

    const top =
      ((containerRect.height - frameHeight) / 2 / containerRect.height) * 100;
    const bottom = top;
    const left =
      ((containerRect.width - frameWidth) / 2 / containerRect.width) * 100;
    const right = left;

    setFrameDimensions({ top, bottom, left, right });
  }, []);

  const handleFrameLoad = useCallback(() => {
    calculateFrameDimensions();
  }, [calculateFrameDimensions]);

  const capturePhoto = useCallback(() => {
    const canvas = canvasRef.current;
    const frameOverlay = frameRef.current;
    const webcam = webcamRef.current;

    if (!canvas || !webcam || !frameOverlay) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    canvas.width = frameOverlay.naturalWidth;
    canvas.height = frameOverlay.naturalHeight;

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    // For testing camera quality only
    props.setCapturedPhoto(imageSrc);

    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const frame = new Image();
      frame.crossOrigin = "anonymous";

      // For dev only, do not use in production
      frame.src = isLandscape
        ? `https://api.allorigins.win/raw?url=${props.frame!.landscape!.url}`
        : `https://api.allorigins.win/raw?url=${props.frame!.portrait!.url}`;

      frame.onload = () => {
        ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);
        // const imageData = canvas.toDataURL("image/jpeg");
        // props.setCapturedPhoto(imageData);
      };

      frame.onerror = (err) => {
        console.error("Error loading frame:", err);
      };
    };
  }, [isLandscape, props]);

  function closeTakePhotoWithFrame() {
    props.setCapturedPhoto(null);
    props.onClose();
    close();
  }

  function switchCamera() {
    setFacingMode((prevMode) => (prevMode === "user" ? "environment" : "user"));
  }

  const updateOrientation = useCallback(() => {
    setIsLandscape(window.innerWidth > window.innerHeight);
  }, []);

  useEffect(() => {
    updateOrientation();

    function handleResize() {
      updateOrientation();
    }

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [updateOrientation]);

  return (
    <div className={styles.takePhotoWithFrameContainer} ref={elNodeRef}>
      <div className={styles.cameraWrapper}>
        <Webcam
          ref={webcamRef}
          videoConstraints={videoConstraints}
          className={`${styles.cameraFeed} ${
            facingMode === "user" ? styles.reverse : ""
          }`}
          screenshotFormat="image/jpeg"
          forceScreenshotSourceSize
          screenshotQuality={1}
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
          onLoad={handleFrameLoad}
        />
        <div
          className={`${styles.overlayMask} ${styles.overlayTop}`}
          style={{ height: `${frameDimensions.top}%` }}
        />
        <div
          className={`${styles.overlayMask} ${styles.overlayBottom}`}
          style={{ height: `${frameDimensions.bottom}%` }}
        />
        <div
          className={`${styles.overlayMask} ${styles.overlayLeft}`}
          style={{ width: `${frameDimensions.left}%` }}
        />
        <div
          className={`${styles.overlayMask} ${styles.overlayRight}`}
          style={{ width: `${frameDimensions.right}%` }}
        />
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
  const [showLongPressComponents, setShowLongPressComponents] = useState(false);
  const [photoOrientation, setPhotoOrientation] = useState<string | null>(null);
  const [isLandscape, setIsLandscape] = useState(false);
  const longPressTimerRef = useRef<any>(null);
  const hashtagsRef = useRef<HTMLDivElement | null>(null);

  function handleTouchStart() {
    longPressTimerRef.current = setTimeout(() => {
      setShowLongPressComponents(true);
    }, 750);
  }

  function handleTouchEnd() {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
  }

  function handleCopyHashtags() {
    const hashtags = hashtagsRef.current?.textContent;

    if (hashtags) {
      navigator.clipboard.writeText(hashtags).catch((err) => {
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
    if (!isLandscape && photoOrientation === "portrait") {
      return styles.portraitInPortraitView;
    }

    if (isLandscape && photoOrientation === "landscape") {
      return styles.lanscapeInLandscapeView;
    }

    if (isLandscape && photoOrientation === "portrait") {
      return styles.portraitInLandscapeView;
    }

    if (!isLandscape && photoOrientation === "landscape") {
      return styles.lanscapeInPortraitView;
    }
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
      <div className={styles.header}>
        <div
          className={styles.backIcon}
          onClick={() => {
            props.setCapturedPhoto(null);
          }}
        />
      </div>
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
      {showLongPressComponents && (
        <div className={styles.shareOptions}>
          <div className={styles.shareLinkedin} />
          <div className={styles.shareInstagram} />
          <div className={styles.shareFacebook} />
          <div className={styles.shareButton} onClick={shareImage}>
            <div className={styles.shareIconWhite} />
            <div className={styles.text}>share</div>
          </div>
        </div>
      )}
      {showLongPressComponents && props.frame.hashtags && (
        <div className={styles.hashtagContainer}>
          <div className={styles.hashtagLabel}>copy hashtags and share</div>
          <div className={styles.hashtagsInner}>
            <div className={styles.hashtags} ref={hashtagsRef}>
              {props.frame!.hashtags?.map((hashtag: Key | null | undefined) => (
                <span key={hashtag}>{`${hashtag} `}</span>
              ))}
            </div>
            <div className={styles.copyIcon} onClick={handleCopyHashtags} />
          </div>
        </div>
      )}
      <div className={styles.footer}></div>
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
