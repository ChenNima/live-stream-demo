var socket

(async () => {
  await import('https://cdn.jsdelivr.net/npm/socket.io-client@3.1.3/dist/socket.io.min.js')
  socket = io("ws://localhost:8880");
  socket.on('connect', function() {
    console.log('on connect')
});
})()

async function startCapture(displayMediaOptions) {
  let captureStream = null;

  try {
    captureStream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
  } catch(err) {
    console.error("Error: " + err);
  }
  return captureStream;
}



const startRecord = async () => {
  const stream =  await startCapture({
    video: {
      cursor: "always"
    },
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      sampleRate: 44100
    }
  })
  const video = document.querySelector('#local-video');
  video.srcObject = stream;
  video.play();

  const mediaRecorder = new MediaRecorder(stream, {
    mimeType : 'video/webm;codecs=h264',
    audioBitsPerSecond : 128000,
    videoBitsPerSecond : 700000,
  });
  mediaRecorder.start(3000);
  mediaRecorder.onstart = function (e) {
    console.log('mediaRecorder 开始录制');
  };
  mediaRecorder.ondataavailable = function (e) {
    // e.data是视频的流数据Blob格式
    console.log(e.data);
    socket.emit("message", e.data)
  };

  stream.oninactive = () => mediaRecorder.stop()
}

document.querySelector('#start-record').onclick = startRecord