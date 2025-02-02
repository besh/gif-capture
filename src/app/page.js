"use client";
import { useRef, useState, useEffect } from "react";
import gifshot from "gifshot";


const RECORDING_TIME = 2000;

export default function Home() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [gifUrl, setGifUrl] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const recordedChunks = useRef([]);

  useEffect(() => {
    async function getCamera() {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
      setMediaRecorder(new MediaRecorder(stream, { mimeType: "video/webm" }));
    }
    getCamera();
  }, []);

  const startRecording = () => {
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

    console.log('the video url', videoUrl)
    extractFrames(videoUrl);
  };

  // const extractFrames = (videoUrl) => {
  //   const video = document.createElement("video");
  //   video.src = videoUrl;
  //   video.crossOrigin = "anonymous";
  
  //   video.onloadeddata = () => {
  //     const canvas = document.createElement("canvas");
  //     const ctx = canvas.getContext("2d");
  
  //     // Ensure canvas dimensions match video
  //     canvas.width = video.videoWidth || 640;
  //     canvas.height = video.videoHeight || 480;
  
  //     // ✅ Ensure `gifInstance` doesn't go out of scope
  //     const gif = new GIF({
  //       workers: 2,
  //       quality: 10,
  //       width: canvas.width,
  //       height: canvas.height,
  //     });
  
  //     let frameCount = 10;
  //     let captureInterval = (video.duration * 1000) / frameCount;
  //     let currentFrame = 0;
  
  //     video.play();
  
  //     const captureFrame = () => {
  //       if (currentFrame >= frameCount) {
  //         console.log("✅ Frames captured, starting GIF render...");
  //         gif.render();
  //         return;
  //       }
  
  //       ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  //       applyPosterization(ctx, canvas.width, canvas.height);
  //       gif.addFrame(ctx, { delay: 100 });
  
  //       console.log(`🖼️ Added frame ${currentFrame + 1} / ${frameCount}`);
  
  //       currentFrame++;
  //       setTimeout(captureFrame, captureInterval);
  //     };
  
  //     // ✅ Ensure `on("finished")` works
  //     gif.on("progress", (p) => console.log(`📊 GIF Progress: ${Math.round(p * 100)}%`));
  //     gif.on("finished", (blob) => {
  //       console.log("🎉 GIF processing complete!");
  //       setGifUrl(URL.createObjectURL(blob));
  //     });
  
  //     captureFrame();
  //   };
  // };
  
  

  // Apply posterization effect
  
  
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
    <div onClick={() => (gifUrl ? setGifUrl(null) : startRecording())} style={{ width: "100vw", height: "100vh", background: "black", display: "flex", justifyContent: "center", alignItems: "center", cursor: "pointer" }}>
      {gifUrl ? <img src={gifUrl} style={{ width: "100%", height: "100%", objectFit: "contain" }} /> : <video ref={videoRef} autoPlay playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
      <canvas ref={canvasRef} width="640" height="480" style={{ display: "none" }} />
    </div>
  );
}
