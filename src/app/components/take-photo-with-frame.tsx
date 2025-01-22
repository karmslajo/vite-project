import { Key, useCallback, useEffect, useRef, useState } from "react";
import { ModalOverlay } from "../components/modal-overlay";
import styles from "../styles/take-photo-with-frame.module.scss";
import Webcam from "react-webcam";

type Frame = {
  id: string;
  name: string;
  landscape: {
    url: string;
    frameWidth: number;
    frameHeight: number;
    outlineWidth: number;
    outlineHeight: number;
    outlineLeft: number;
    outlineTop: number;
  };
  portrait: {
    url: string;
    frameWidth: number;
    frameHeight: number;
    outlineWidth: number;
    outlineHeight: number;
    outlineLeft: number;
    outlineTop: number;
  };
  hashtags: Key[] | null | undefined;
};

type CameraProps = {
  frame: Frame;
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

  const frameHeight = isLandscape
    ? props.frame.landscape.frameHeight
    : props.frame.portrait.frameHeight;
  const frameWidth = isLandscape
    ? props.frame.landscape.frameWidth
    : props.frame.portrait.frameWidth;

  const scaleRatio = isLandscape ? 7680 / frameWidth : 4320 / frameWidth;

  const videoConstraints = {
    facingMode: facingMode,
    width: { ideal: frameHeight * scaleRatio }, // Attempt to use the maximum width supported
    height: { ideal: frameWidth * scaleRatio }, // Attempt to use the maximum height supported
    audio: false,
  };

  // const cameraWidthLandscape =
  //   props.frame.landscape.outlineWidth / props.frame.landscape.frameWidth;
  // const cameraWidthPortrait =
  //   props.frame.portrait.outlineWidth / props.frame.portrait.frameWidth;

  // const cameraHeightLandscape =
  //   props.frame.landscape.outlineHeight / props.frame.landscape.frameHeight;
  // const cameraHeightPortrait =
  //   props.frame.portrait.outlineHeight / props.frame.portrait.frameHeight;

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
    // props.setCapturedPhoto(imageSrc);

    // const cameraWidth = isLandscape
    //   ? cameraWidthLandscape
    //   : cameraWidthPortrait;
    // const cameraHeight = isLandscape
    //   ? cameraHeightLandscape
    //   : cameraHeightPortrait;

    // const outlineLeft = isLandscape
    //   ? props.frame.landscape.outlineLeft
    //   : props.frame.portrait.outlineLeft;
    // const outlineTop = isLandscape
    //   ? props.frame.landscape.outlineTop
    //   : props.frame.portrait.outlineTop;

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
        const imageData = canvas.toDataURL("image/jpeg");
        props.setCapturedPhoto(imageData);
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

    window.addEventListener("resize", updateOrientation);
    return () => {
      window.removeEventListener("resize", updateOrientation);
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
          width={"100%"}
          height={"100%"}
          screenshotFormat="image/jpeg"
          mirrored={facingMode === "user"}
          imageSmoothing
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
  frame: Frame;
  capturedPhoto: string;
  setCapturedPhoto: React.Dispatch<React.SetStateAction<string | null>>;
};

function ResultPhoto(props: ResultPhotoProps) {
  const [showLongPressComponents, setShowLongPressComponents] = useState(false);
  const [photoOrientation, setPhotoOrientation] = useState<string | null>(null);
  const [isLandscape, setIsLandscape] = useState(false);
  const longPressTimerRef = useRef<number | null>(null);
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
  frame: Frame;
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
