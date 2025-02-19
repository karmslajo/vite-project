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
  }, [facingMode, updateOrientation]);

  const drawVideoOnCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!canvas || !video) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    if (!ctx) return;

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

    function step() {
      if (!ctx || !video || !canvas) return;

      canvas.width = frame.width;
      canvas.height = frame.height;

      // Flip the context horizontally for the video only
      if (facingMode === "user") {
        ctx.save(); // Save the current context state
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      if (facingMode === "user") {
        ctx.restore();
      }

      ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);

      requestAnimationFrame(step);
    }

    step();
  }, [facingMode, isLandscape, props.frame]);

  function stopCamera() {
    const stream = videoRef.current?.srcObject as MediaStream | null;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
  }

  // useEffect(() => {
  //   const offsetX = 0.5; // center
  //   const offsetY = 0.5; // center

  //   const imageWidth = props.frame.outlineImageWidth;
  //   const imageHeight = props.frame.outlineImageHeight;
  //   const outlineLeft = props.frame.outlineLeft * props.frame.frameWidth;
  //   const outlineTop = props.frame.outlineTop * props.frame.frameHeight;
  //   const outlineWidth = props.frame.outlineWidth * props.frame.frameWidth;
  //   const outlineHeight = props.frame.outlineHeight * props.frame.frameHeight;
  //   const scale = Math.min(
  //     outlineWidth / imageWidth,
  //     outlineHeight / imageHeight
  //   );

  //   let cropLeft = 1;
  //   let cropTop = 1;
  //   let cropWidth = 1;
  //   let cropHeight = 1;
  //   let cropScale = 1;
  //   let scaledWidth = imageWidth * scale;
  //   let scaledHeight = imageHeight * scale;

  //   // decide which gap to fill
  //   if (scaledWidth < outlineWidth) cropScale = outlineWidth / scaledWidth;
  //   if (Math.abs(cropScale - 1) < 1e-14 && scaledHeight < outlineHeight) {
  //     cropScale = outlineHeight / scaledHeight;
  //   }

  //   scaledWidth *= cropScale;
  //   scaledHeight *= cropScale;

  //   // calc source rectangle
  //   cropWidth = imageWidth / (scaledWidth / outlineWidth);
  //   cropHeight = imageHeight / (scaledHeight / outlineHeight);

  //   cropLeft = (imageWidth - cropWidth) * offsetX;
  //   cropTop = (imageHeight - cropHeight) * offsetY;

  //   // make sure source rectangle is valid
  //   if (cropLeft < 0) cropLeft = 0;
  //   if (cropTop < 0) cropTop = 0;
  //   if (cropWidth > imageWidth) cropWidth = imageWidth;
  //   if (cropHeight > imageHeight) cropHeight = imageHeight;

  //   setOutlineImageProps({
  //     x: props.frame.frameLeft + outlineLeft,
  //     y: props.frame.frameTop + outlineTop,
  //     width: outlineWidth,
  //     height: outlineHeight,
  //     crop: {
  //       x: cropLeft,
  //       y: cropTop,
  //       width: cropWidth,
  //       height: cropHeight,
  //     },
  //   });
  // }, [
  //   props.frame.frameHeight,
  //   props.frame.frameLeft,
  //   props.frame.frameTop,
  //   props.frame.frameWidth,
  //   props.frame.outlineHeight,
  //   props.frame.outlineImageHeight,
  //   props.frame.outlineImageWidth,
  //   props.frame.outlineLeft,
  //   props.frame.outlineTop,
  //   props.frame.outlineWidth,
  // ]);

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

    const videoElement = videoRef.current;

    videoElement?.addEventListener("play", drawVideoOnCanvas);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      videoElement?.removeEventListener("play", drawVideoOnCanvas);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [drawVideoOnCanvas, startCamera]);

  // For testing only
  useEffect(() => {
    console.log(getOptimalVideoConstraints());
  }, [getOptimalVideoConstraints]);

  return (
    <div
      className={`${styles.takePhotoWithFrameContainer} ${orientationDirectionStyle[deviceOrientation]}`}
      ref={elNodeRef}
    >
      <div className={styles.cameraWrapper}>
        <video ref={videoRef} style={{ display: "none" }} />
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
        <br />
        {test1}
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
