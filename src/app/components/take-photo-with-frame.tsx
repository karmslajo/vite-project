/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ModalOverlay } from "../components/modal-overlay";
import styles from "../styles/take-photo-with-frame.module.scss";
import { MediaLongPressTooltip } from "./media-long-press-tooltip";
import { PoweredByGump } from "./powered-by-gump";
import { cssClass } from "../helpers/css-class";

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

  // Set max to 4096 due to ios canvas limitation to 4096 as of making this
  const MAX_CANVAS_DIMENSION = 4096;

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

  const updateOrientation = useCallback(() => {
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

      // const maxWidth = Math.ceil((capabilities.height?.max || 6144) * 4) / 3;
      const maxWidth = capabilities.width?.max || 5440;
      const maxHeight = capabilities.height?.max || 4080;

      const idealWidth = isLandscape ? maxWidth : maxHeight;
      const idealHeight = isLandscape ? maxHeight : maxWidth;

      setTest1(`Max Width: ${idealWidth}, Max Height: ${idealHeight}`);

      tempStream.getTracks().forEach((track) => track.stop());

      return {
        video: {
          ...baseConstraints,
          width: {
            ideal: idealWidth,
          },
          height: {
            ideal: idealHeight,
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

    // const idealWidth = deviceIos ? 7680 : 5440;
    // const idealHeight = deviceIos ? 5760 : 4080;

    // const constraints = await getOptimalVideoConstraints();

    const constraints = {
      video: {
        audio: false,
        facingMode: facingMode,
        // Other devices would overflow the container if aspect ratio is not set
        // 1 (Square), 4:3 (Default), 16:9 (Rectangular, needs work since it pushes the controls off screen)
        aspectRatio: { ideal: 4 / 3 },
        // Adjusted for 4K resolution so the browser will pick the highest resolution available
        width: {
          max: MAX_CANVAS_DIMENSION,
          ideal: isLandscape ? MAX_CANVAS_DIMENSION : MAX_CANVAS_DIMENSION,
        },
        height: {
          max: MAX_CANVAS_DIMENSION,
          ideal: isLandscape ? MAX_CANVAS_DIMENSION : MAX_CANVAS_DIMENSION,
        },
      },
    };

    setTest(JSON.stringify(constraints));

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

    updateOrientation();
    calculateVideoSize();
  }, [calculateVideoSize, facingMode, isLandscape, updateOrientation]);

  function stopCamera() {
    const stream = videoRef.current?.srcObject as MediaStream | null;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
  }

  function handleUpload(file?: File) {
    if (!file) return;

    const image = new Image();
    image.src = URL.createObjectURL(file);
    image.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      stopCamera();

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      const isImageLandscapeOrEqual =
        image.width > image.height || image.width === image.height;
      const frame = isImageLandscapeOrEqual
        ? props.frame.landscape
        : props.frame.portrait;

      let frameWidthPx = frame.frameWidth;
      let frameHeightPx = frame.frameHeight;

      const frameAspectRatio = frameWidthPx / frameHeightPx;

      if (
        frameWidthPx > MAX_CANVAS_DIMENSION ||
        frameHeightPx > MAX_CANVAS_DIMENSION
      ) {
        if (frameWidthPx > frameHeightPx) {
          frameWidthPx = MAX_CANVAS_DIMENSION;
          frameHeightPx = Math.round(frameWidthPx / frameAspectRatio);
        } else {
          frameHeightPx = MAX_CANVAS_DIMENSION;
          frameWidthPx = Math.round(frameHeightPx * frameAspectRatio);
        }
      }

      canvas.width = frameWidthPx;
      canvas.height = frameHeightPx;

      const scaleX = frameWidthPx / frame.frameWidth;
      const scaleY = frameHeightPx / frame.frameHeight;

      const outlineWidthPx = frame.outlineWidth * frame.frameWidth * scaleX;
      const outlineHeightPx = frame.outlineHeight * frame.frameHeight * scaleY;
      const outlineLeftPx = frame.outlineLeft * frame.frameWidth * scaleX;
      const outlineTopPx = frame.outlineTop * frame.frameHeight * scaleY;

      // Calculate dimensions for 'cover' behavior while maintaining aspect ratio
      const imageAspectRatio = image.width / image.height;
      const outlineAspectRatio = outlineWidthPx / outlineHeightPx;

      let sx, sy, sw, sh;

      const dw = outlineWidthPx;
      const dh = outlineHeightPx;
      const dx = outlineLeftPx;
      const dy = outlineTopPx;

      if (imageAspectRatio > outlineAspectRatio) {
        // Image is wider than outline area (relative to height)
        // Crop the sides of the image
        sh = image.height;
        sw = sh * outlineAspectRatio;
        sy = 0;
        sx = (image.width - sw) / 2; // Center the crop horizontally
      } else {
        // Image is taller than outline area (relative to width)
        // Crop the top and bottom of the image
        sw = image.width;
        sh = sw / outlineAspectRatio;
        sx = 0;
        sy = (image.height - sh) / 2; // Center the crop vertically
      }

      ctx.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh);

      const frameImage = new Image();
      frameImage.crossOrigin = "anonymous";
      frameImage.src = frame.url;
      frameImage.onload = () => {
        ctx.drawImage(frameImage, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL("image/jpeg");
        props.setCapturedPhoto(imageData);
      };
    };
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
  }, [startCamera, updateOrientation]);

  console.log(getOptimalVideoConstraints());

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
        <div
          className={styles.frameCameraOverlay}
          style={{
            height: videoDimensions.height,
            width: videoDimensions.width,
          }}
        >
          <div className={styles.header}>
            <span
              className={styles.closeIcon}
              onClick={closeTakePhotoWithFrame}
            />
          </div>
        </div>
      </div>
      <div
        style={{
          color: "white",
          position: "absolute",
          textAlign: "left",
        }}
      >
        {test}
        <br />
        {`${test1}`}
      </div>
      <div className={styles.controls}>
        <label>
          <input
            type="file"
            accept="image/jpeg,image/png"
            onChange={(e) => handleUpload(e.target.files?.[0])}
            style={{ display: "none" }}
          />
          <span
            className={cssClass({
              [styles.controlButton]: true,
              [styles.close]: true,
            })}
          />
        </label>
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
        {isLandscape && (
          <PoweredByGump
            mode="dark"
            graphicWidthPx={50}
            textPx={10}
            gapPx={4}
          />
        )}
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
      {!isLandscape && (
        <div style={{ position: "absolute", bottom: 0, marginBottom: "25px" }}>
          <PoweredByGump
            mode="dark"
            graphicWidthPx={50}
            textPx={10}
            gapPx={4}
          />
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
