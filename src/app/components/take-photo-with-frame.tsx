/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Key, useCallback, useEffect, useRef, useState } from "react";
import { ModalOverlay } from "../components/modal-overlay";
import imgBottomCircles2 from "../../../public/bottom-circles-2.webp";
import styles from "../styles/take-photo-with-frame.module.scss";

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
  const [frameDimensions, setFrameDimensions] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  });

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

  function capturePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const frameOverlay = frameRef.current;

    if (!canvas || !video || !frameOverlay) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Set canvas to frame's original resolution
    canvas.width = frameOverlay.naturalWidth;
    canvas.height = frameOverlay.naturalHeight;

    // Flip the context horizontally for the video only
    // ctx.save() // Save the current context state
    // ctx.translate(canvas.width, 0)
    // ctx.scale(-1, 1)

    // Scale video to fit frame's resolution
    const videoAspectRatio = video.videoWidth / video.videoHeight;
    const frameAspectRatio = canvas.width / canvas.height;

    let sx = 0,
      sy = 0,
      sWidth = video.videoWidth,
      sHeight = video.videoHeight;

    if (videoAspectRatio > frameAspectRatio) {
      // Video is wider than frame, crop horizontally
      const cropWidth = video.videoWidth - video.videoHeight * frameAspectRatio;
      sx = cropWidth / 2;
      sWidth = video.videoWidth - cropWidth;
    } else if (videoAspectRatio < frameAspectRatio) {
      // Video is taller than frame, crop vertically
      const cropHeight =
        video.videoHeight - video.videoWidth / frameAspectRatio;
      sy = cropHeight / 2;
      sHeight = video.videoHeight - cropHeight;
    }

    // Draw the cropped video centered on the canvas
    ctx.drawImage(
      video,
      sx,
      sy,
      sWidth,
      sHeight,
      0,
      0,
      canvas.width,
      canvas.height
    );

    // Restore the original context to stop flipping for the frame
    // ctx.restore()

    const frame = new Image();
    frame.crossOrigin = "anonymous";
    frame.src = isLandscape
      ? props.frame!.landscape!.url
      : props.frame!.portrait!.url;

    frame.onload = () => {
      ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);
      const imageData = canvas.toDataURL("image/png");
      props.setCapturedPhoto(imageData);
    };

    frame.onerror = (err) => {
      console.error("Error loading frame:", err);
    };

    stopCamera();
  }

  const updateOrientation = useCallback(() => {
    setIsLandscape(window.innerWidth > window.innerHeight);
  }, []);

  function closeTakePhotoWithFrame() {
    props.setCapturedPhoto(null);
    stopCamera();
    props.onClose();
    close();
  }

  function switchCamera() {
    setFacingMode((prevMode) => (prevMode === "user" ? "environment" : "user"));
  }

  const startCamera = useCallback(async () => {
    if (cameraActive.current) return;
    cameraActive.current = true;

    const frameOverlay = frameRef.current;
    if (!frameOverlay) return;

    const frameRect = frameOverlay.getBoundingClientRect();
    const frameAspectRatio = frameRect.width / frameRect.height;

    const constraints = {
      video: {
        audio: false,
        width: isLandscape ? frameRect.width : frameRect.height,
        height: isLandscape ? frameRect.height : frameRect.width,
        facingMode: facingMode,
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
  }, [facingMode]);

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
    updateOrientation();
    calculateFrameDimensions();

    function handleResize() {
      updateOrientation();
      calculateFrameDimensions();
      // Handles resizing the video feed to fit the frame depending on orientation
      startCamera();
    }

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [updateOrientation, calculateFrameDimensions, startCamera]);

  return (
    <div className={styles.takePhotoWithFrameContainer} ref={elNodeRef}>
      <div className={styles.cameraWrapper}>
        <video ref={videoRef} className={styles.cameraFeed} />
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

  function shareImage() {
    try {
      if (!props.capturedPhoto) {
        console.error("Captured photo is null");
        return;
      }

      const blob = new Blob([props.capturedPhoto.split(",")[1]], {
        type: "image/png",
      });
      const file = new File(
        [blob],
        `gump_${props.frame?.name}_frame_photo_${Date.now()}.png`,
        { type: "image/png" }
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
      <div className={styles.footer}>
        <img
          className={styles.bottomFigures}
          src={imgBottomCircles2}
          alt="bottomCircles2"
        />
      </div>
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
