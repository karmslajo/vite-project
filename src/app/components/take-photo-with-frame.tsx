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
  const [facingMode, setFacingMode] = useState("user");
  const [isLandscape, setIsLandscape] = useState(false);
  const [deviceOrientation, setDeviceOrientation] =
    useState<keyof typeof orientationDirectionStyle>("portraitPrimary");
  const [test, setTest] = useState("");
  const [test1, setTest1] = useState("");

  const orientationDirectionStyle = {
    portraitPrimary: "",
    portraitSecondary: "",
    landscapePrimary: styles.landscapePrimary,
    landscapeSecondary: styles.landscapeSecondary,
  };

  function capturePhoto() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    props.setCapturedPhoto(canvas.toDataURL("image/jpeg"));
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

    // const deviceIos = navigator.userAgent.match(/(iPad|iPhone|iPod)/g);

    // const idealWidth = deviceIos ? 7680 : 5440;
    // const idealHeight = deviceIos ? 5760 : 4080;

    // const constraints = await getOptimalVideoConstraints();
    console.log(await getOptimalVideoConstraints());

    const constraints = {
      video: {
        audio: false,
        facingMode: facingMode,
        // Other devices would overflow the container if aspect ratio is not set
        // 1 (Square), 4:3 (Default), 16:9 (Rectangular, needs work since it pushes the controls off screen)
        aspectRatio: { ideal: 4 / 3 },
        // Adjusted for 4K resolution so the browser will pick the highest resolution available
        width: { max: 4096, ideal: 4096 },
        height: { max: 4096, ideal: 4096 },
      },
    };

    setTest(JSON.stringify(constraints));

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const videoElement = document.createElement("video");
      videoElement.srcObject = stream;
      videoElement.play();

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      videoElement.onloadedmetadata = () => {
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
      };
      console.log("HERE");

      const frame = new Image();
      frame.crossOrigin = "anonymous";
      frame.src = isLandscape
        ? `https://api.allorigins.win/raw?url=${props.frame!.landscape!.url}`
        : `https://api.allorigins.win/raw?url=${props.frame!.portrait!.url}`;

      frame.onload = () => {
        const renderFrame = () => {
          if (!canvasRef.current || !cameraActive.current) return;
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          if (facingMode === "user") {
            ctx.save();
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
          }

          // Draw camera feed
          ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

          if (facingMode === "user") {
            ctx.restore();
          }

          // Draw frame overlay on top of the video
          ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);

          requestAnimationFrame(renderFrame);
        };

        renderFrame();
      };
    } catch (error) {
      console.error("Error accessing the camera:", error);
    } finally {
      cameraActive.current = false;
    }

    getOptimalVideoConstraints();
    updateOrientation();
  }, [
    facingMode,
    getOptimalVideoConstraints,
    isLandscape,
    props.frame,
    updateOrientation,
  ]);

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

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [startCamera]);

  return (
    <div
      className={`${styles.takePhotoWithFrameContainer} ${orientationDirectionStyle[deviceOrientation]}`}
      ref={elNodeRef}
    >
      <div className={styles.cameraWrapper}>
        <canvas ref={canvasRef} className={styles.cameraFeed} />
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
