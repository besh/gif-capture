"use client";
import { useRef, useState, useEffect } from "react";
import gifshot from "gifshot";


const RECORDING_TIME = 2000;


const containerStyle = { 
  width: "100vw", 
  height: "100vh", 
  background: "black", 
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  cursor: "pointer"
}

const imageStyle = {
  width: "100vw",
  height: "100vw",
  objectFit: "contain",
  position: "absolute",
  top: "0",
  left: "0"
}

const progressContainerStyle = {
  position: "fixed",
  bottom: "20%",
  left: "50%",
  width: "300px",
  marginLeft: "-150px",
  border: "2px solid pink",
  borderRadius: "8px",
  zIndex: "2",
  height: "40px",
  overflow: "hidden"
}

export default function Home() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [gifUrl, setGifUrl] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [progress, setProgress] = useState(null);
  const recordedChunks = useRef([]);

  const progressStyle = {
    width: `${progress}%`,
    height: "100%",
    backgroundColor: "purple",
    transition: "all ease-in 0.2s"
  }

  useEffect(() => {
    async function getCamera() {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
      setMediaRecorder(new MediaRecorder(stream, { mimeType: "video/webm" }));
    }
    getCamera();
  }, []);

  const startRecording = () => {
    if (gifUrl) {
      setGifUrl(null);

      return;
    }

    if (!mediaRecorder || mediaRecorder.state === "recording") return; // Prevent multiple starts
    
    recordedChunks.current = [];
    mediaRecorder.ondataavailable = (e) => recordedChunks.current.push(e.data);
    mediaRecorder.onstop = processVideo;
  
    mediaRecorder.start();
    setTimeout(() => {
      console.log('recording')
      if (mediaRecorder.state === "recording") {
        console.log('stopping recording')
        mediaRecorder.stop();
      }
    }, RECORDING_TIME);
  };

  const processVideo = async () => {
    const blob = new Blob(recordedChunks.current, { type: "video/webm" });
    const videoUrl = URL.createObjectURL(blob);
    extractFrames(videoUrl);
  };
    
  const extractFrames = (videoUrl) => {
    const video = document.createElement("video");
    video.src = videoUrl;
    video.crossOrigin = "anonymous";
  
    video.onloadeddata = () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
  
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      let frameData = [];
      let frameCount = 20;
      const interval = RECORDING_TIME / frameCount;
      let captureInterval = interval;
      let currentFrame = 0;

      video.play();
      
      const captureFrame = () => {
        setProgress((currentFrame / frameCount) * 100);
        if (currentFrame >= frameCount) {
          console.log("Frames captured, generating GIF...");
          gifshot.createGIF(
            {
              images: frameData,
              interval: 0.1,
              gifWidth: canvas.width,
              gifHeight: canvas.height,
            },
            function (obj) {
              if (!obj.error) {
                console.log("GIF created!");
                setGifUrl(obj.image);
                setProgress(null);
              } else {
                console.error("GIF creation failed", obj.error);
              }
            }
          );
          return;
        }
  
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        applyPosterization(ctx, canvas.width, canvas.height);
        frameData.push(canvas.toDataURL("image/png"));
  
        currentFrame++;
        setTimeout(captureFrame, captureInterval);
      };
  
      captureFrame();
    };
  };
  
  const applyPosterization = (ctx, width, height) => {
    let imageData = ctx.getImageData(0, 0, width, height);
    let data = imageData.data;

    console.log('image data', data)

    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.floor(data[i] / 64) * 64; // Reduce Red depth
      data[i + 1] = Math.floor(data[i + 1] / 64) * 64; // Reduce Green depth
      data[i + 2] = Math.floor(data[i + 2] / 64) * 64; // Reduce Blue depth
    }

    ctx.putImageData(imageData, 0, 0);
  };

  console.log('the gif url', gifUrl)

  return (
    <div onClick={() => (gifUrl ? setGifUrl(null) : startRecording())} style={containerStyle}>
      {gifUrl && (
        <img src={gifUrl} style={imageStyle} />
      )}
      {progress && progress > 0 && (
        <div style={progressContainerStyle}>
          <div style={progressStyle} />
        </div>
      )}
      <video ref={videoRef} autoPlay playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      <canvas ref={canvasRef} width="640" height="480" style={{ display: "none" }} />
    </div>
  );
}
