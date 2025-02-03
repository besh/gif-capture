"use client";
import { useRef, useState, useEffect } from "react";
import gifshot from "gifshot";


const RECORDING_TIME = 1000;

const EDGE_THRESHOLD = 20;  // Lower = more edges, higher = fewer edges
const EDGE_CONTRAST = 1.8;  // Increase to boost edges
const COLOR_REDUCTION = 120; // Lower = more colors, higher = more posterization

const E_INK_EDGE_THRESHOLD = 20;  // Lower = more edges
const E_INK_EDGE_CONTRAST = 1;  // Increase to boost edges
const E_INK_NOISE_INTENSITY = 30; // Higher = more dithering noise

const STIPPLE_DENSITY = 0.5;
function applyStippleEffect(ctx, width, height) {
  let imageData = ctx.getImageData(0, 0, width, height);
  let data = imageData.data;
  ctx.clearRect(0, 0, width, height);
  
  for (let i = 0; i < data.length; i += 4) {
    let brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
    if (Math.random() < brightness / 255 * STIPPLE_DENSITY) {
      let x = (i / 4) % width;
      let y = Math.floor(i / 4 / width);
      ctx.fillStyle = `rgb(${data[i]}, ${data[i + 1]}, ${data[i + 2]})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }
}

const ASCII_CHARS = "@#%*+=- .";
function applyASCIIEffect(ctx, width, height) {
  let imageData = ctx.getImageData(0, 0, width, height);
  let data = imageData.data;
  let textCanvas = document.createElement("canvas");
  let textCtx = textCanvas.getContext("2d");
  textCanvas.width = width;
  textCanvas.height = height;
  textCtx.fillStyle = "white";
  textCtx.fillRect(0, 0, width, height);
  
  for (let y = 0; y < height; y += 8) {
    for (let x = 0; x < width; x += 8) {
      let i = (y * width + x) * 4;
      let brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      let charIndex = Math.floor((brightness / 255) * (ASCII_CHARS.length - 1));
      textCtx.fillStyle = "black";
      textCtx.fillText(ASCII_CHARS[charIndex], x, y);
    }
  }
  ctx.drawImage(textCanvas, 0, 0);
}

const EMOJI = "✅🥕😂💀🎉🚀 🫶"
function applyEmojiEffect(ctx, width, height) {
  let imageData = ctx.getImageData(0, 0, width, height);
  let data = imageData.data;
  let textCanvas = document.createElement("canvas");
  let textCtx = textCanvas.getContext("2d");
  textCanvas.width = width;
  textCanvas.height = height;
  textCtx.fillStyle = "white";
  textCtx.fillRect(0, 0, width, height);
  
  for (let y = 0; y < height; y += 8) {
    for (let x = 0; x < width; x += 8) {
      let i = (y * width + x) * 4;
      let brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      let charIndex = Math.floor((brightness / 255) * (EMOJI.length - 1));
      textCtx.fillStyle = "black";
      textCtx.fillText(EMOJI[charIndex], x, y);
    }
  }
  ctx.drawImage(textCanvas, 0, 0);
}

const GLITCH_SHIFT = 5;
function applyGlitchEffect(ctx, width, height) {
  let imageData = ctx.getImageData(0, 0, width, height);
  let data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    if (Math.random() < 0.05) {
      let offset = GLITCH_SHIFT * 4;
      data[i] = data[i + offset] || data[i];
      data[i + 1] = data[i + 1 + offset] || data[i + 1];
    }
  }
  ctx.putImageData(imageData, 0, 0);
}

const HEATMAP_COLORS = ["blue", "green", "yellow", "red"];
function applyHeatmapEffect(ctx, width, height) {
  let imageData = ctx.getImageData(0, 0, width, height);
  let data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    let brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
    let index = Math.floor((brightness / 255) * (HEATMAP_COLORS.length - 1));
    ctx.fillStyle = HEATMAP_COLORS[index];
    let x = (i / 4) % width;
    let y = Math.floor(i / 4 / width);
    ctx.fillRect(x, y, 1, 1);
  }
}

const PIXEL_SIZE = 10;
function applyPixelationEffect(ctx, width, height) {
  let imageData = ctx.getImageData(0, 0, width, height);
  let data = imageData.data;
  ctx.clearRect(0, 0, width, height);
  
  for (let y = 0; y < height; y += PIXEL_SIZE) {
    for (let x = 0; x < width; x += PIXEL_SIZE) {
      let i = (y * width + x) * 4;
      ctx.fillStyle = `rgb(${data[i]}, ${data[i + 1]}, ${data[i + 2]})`;
      ctx.fillRect(x, y, PIXEL_SIZE, PIXEL_SIZE);
    }
  }
}

function applyCRTMonitorEffect(ctx, width, height) {
  let imageData = ctx.getImageData(0, 0, width, height);
  let data = imageData.data;
  for (let y = 0; y < height; y += 2) {
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.fillRect(0, y, width, 1);
  }
  ctx.putImageData(imageData, 0, 0);
}

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

const applyIllustrationEffect = (ctx, width, height) => {
  let imageData = ctx.getImageData(0, 0, width, height);
  let data = imageData.data;
  
  // Convert to Grayscale (for edge detection)
  let grayscale = new Uint8ClampedArray(data.length);
  for (let i = 0; i < data.length; i += 4) {
    let avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
    grayscale[i] = grayscale[i + 1] = grayscale[i + 2] = avg;
    grayscale[i + 3] = 255;
  }

  // Apply Edge Detection
  for (let i = 0; i < data.length; i += 4) {
    let left = grayscale[i - 4] || grayscale[i];
    let right = grayscale[i + 4] || grayscale[i];
    let top = grayscale[i - width * 4] || grayscale[i];
    let bottom = grayscale[i + width * 4] || grayscale[i];

    // Compute edge strength
    let edge = Math.abs(left - right) + Math.abs(top - bottom);
    edge = Math.min(edge * EDGE_CONTRAST, 255); // Boost edge contrast

    // Apply Edge Threshold
    edge = edge > EDGE_THRESHOLD ? 0 : 255; 

    // Reduce color depth for an illustrated effect
    data[i] = Math.floor(data[i] / COLOR_REDUCTION) * COLOR_REDUCTION + edge;
    data[i + 1] = Math.floor(data[i + 1] / COLOR_REDUCTION) * COLOR_REDUCTION + edge;
    data[i + 2] = Math.floor(data[i + 2] / COLOR_REDUCTION) * COLOR_REDUCTION + edge;
  }

  ctx.putImageData(imageData, 0, 0);
};

const applyEInkEffect = (ctx, width, height) => {
  let imageData = ctx.getImageData(0, 0, width, height);
  let data = imageData.data;

  // Convert to Grayscale
  let grayscale = new Uint8ClampedArray(data.length);
  for (let i = 0; i < data.length; i += 4) {
    let avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
    grayscale[i] = grayscale[i + 1] = grayscale[i + 2] = avg;
    grayscale[i + 3] = 255;
  }

  // Apply Edge Detection
  for (let i = 0; i < data.length; i += 4) {
    let left = grayscale[i - 4] || grayscale[i];
    let right = grayscale[i + 4] || grayscale[i];
    let top = grayscale[i - width * 4] || grayscale[i];
    let bottom = grayscale[i + width * 4] || grayscale[i];

    // Compute edge strength
    let edge = Math.abs(left - right) + Math.abs(top - bottom);
    edge = Math.min(edge * E_INK_EDGE_CONTRAST, 255);

    // Apply Threshold
    edge = edge > E_INK_EDGE_THRESHOLD ? 0 : 255;

    // **Simulated Dithering**: Adds slight randomness before thresholding
    let noise = Math.random() * E_INK_NOISE_INTENSITY - E_INK_NOISE_INTENSITY / 2;
    let pixel = grayscale[i] + noise;
    
    // **Binarization** (Black & White)
    pixel = pixel > 128 ? 255 : 0;

    data[i] = data[i + 1] = data[i + 2] = Math.max(pixel, edge);
  }

  ctx.putImageData(imageData, 0, 0);
};

const WATERCOLOR_BLUR = 5;
function applyWatercolorEffect(ctx, width, height) {
  ctx.globalAlpha = 0.8;
  for (let i = 0; i < WATERCOLOR_BLUR; i++) {
    ctx.filter = `blur(${i}px)`;
    ctx.drawImage(ctx.canvas, 0, 0);
  }
  ctx.globalAlpha = 1;
  ctx.filter = "none";
}

const EFFECTS = {
  stipple: applyStippleEffect,
  ascii: applyASCIIEffect,
  emoji: applyEmojiEffect,
  glitch: applyGlitchEffect,
  heatmap: applyHeatmapEffect,
  watercolor: applyWatercolorEffect,
  crt: applyCRTMonitorEffect,
  pixelate: applyPixelationEffect,
  posterize: applyPosterization,
  eink: applyEInkEffect,
  illustration: applyIllustrationEffect
};

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
  width: "100%",
  objectFit: "contain",
  position: "absolute",
  top: "0",
  left: "0",
  filter: "",
  zIndex: "2",
  animation: "fadeIn 0.5s ease-in-out"
}

const fadeInKeyframes = `
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

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

const selectStyle = {
  position: "fixed",
  top: "20px",
  zIndex: "5",
  left: '50%',
  height: '30px',
  width: '150px',
  marginLeft: '-75px'
}

export default function Home() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [gifUrl, setGifUrl] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [currentEffect, setCurrentEffect] = useState("stipple");
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

  useEffect(() => {
    // Inject keyframes into a <style> tag if it doesn't already exist
    const styleSheet = document.styleSheets[0];
    if (styleSheet) {
      styleSheet.insertRule(fadeInKeyframes, styleSheet.cssRules.length);
    }
  }, [])

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

      console.log('dimensions', video.videoWidth, video.videoHeight)
      
      // divide by two to reduce gif filesize
      canvas.width = (window.innerWidth / 2);
      canvas.height = (window.innerHeight / 2);

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
        
        ctx.save(); // Save the current state
        ctx.scale(-1, 1); // Flip horizontally
        ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
        ctx.restore()

        console.log(EFFECTS[currentEffect])

        EFFECTS[currentEffect](ctx, canvas.width, canvas.height);
        frameData.push(canvas.toDataURL("image/png"));
  
        currentFrame++;
        setTimeout(captureFrame, captureInterval);
      };
  
      captureFrame();
    };
  };
  const entries = Object.entries(EFFECTS);

  return (
    <div>
      <select value={currentEffect} style={selectStyle} onChange={(e) => setCurrentEffect(e.target.value)}>
        {entries.map(item => {
          const [key] = item;
          return (
            <option key={key} value={key}>{key}</option>
          )
        })}
      </select>
      <div 
        onPointerDown={() => (gifUrl ? setGifUrl(null) : startRecording())} 
        onTouchStart={() => (gifUrl ? setGifUrl(null) : startRecording())} 
        style={containerStyle}
      >
        {gifUrl && (
          <img src={gifUrl} style={imageStyle} />
        )}
        {progress && progress > 0 && (
          <div style={progressContainerStyle}>
            <div style={progressStyle} />
          </div>
        )}
        <video ref={videoRef} autoPlay playsInline style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scale3d(-1, 1, -1)" }} />
        <canvas ref={canvasRef} width="100%" height="100%" style={{ display: "none" }} />
      </div>
    </div>
  );
}
