// solutions:
// https://mux.com/blog/the-state-of-going-live-from-a-browser/
// https://juejin.cn/post/6844903986403737607
// https://github.com/fbsamples/Canvas-Streaming-Example/blob/master/README.md

const { Server } = require('socket.io')
const { spawn } = require('child_process');

const app = require('http').createServer(function(req,res){
	// Set CORS headers
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Request-Method', '*');
	res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
	res.setHeader('Access-Control-Allow-Headers', '*');
	if ( req.method === 'OPTIONS' ) {
		res.writeHead(200);
		res.end();
		return;
	}

	// ...
});

// var io = socketio.listen(app, {
//   log: true,
//   origins: '*:*'
// });
const io = new Server(app, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// io.set('transports', [
//   'polling',
//   'websocket',
//   'xhr-polling',
//   'jsonp-polling'
// ]);
const ffmpeg = spawn('ffmpeg', [
  // Facebook requires an audio track, so we create a silent one here.
  // Remove this line, as well as `-shortest`, if you send audio from the browser.
  '-f', 'lavfi', '-i', 'anullsrc',
  
  // FFmpeg will read input video from STDIN
  '-i', '-',
  
  
  // '-ar', '44100',
  // '-b:a', '128k',
  // '-pix_fmt', 'yuv420p',
  // '-profile:v', 'baseline',
  // '-s', '426x240',
  // '-bufsize', '6000k',
  // '-vb', '400k',
  '-shortest',
  // If we're encoding H.264 in-browser, we can set the video codec to 'copy'
  // so that we don't waste any CPU and quality with unnecessary transcoding.
  // If the browser doesn't support H.264, set the video codec to 'libx264'
  // or similar to transcode it to H.264 here on the server.
  // '-vcodec', 'copy', 
  '-vcodec', 'libx264',

  // AAC audio is required for Facebook Live.  No browser currently supports
  // encoding AAC, so we must transcode the audio to AAC here on the server.
  // '-acodec', 'aac',
  '-acodec', 'aac',
  
  // FLV is the container format used in conjunction with RTMP
  '-f', 'flv',
  '-flvflags', 'no_duration_filesize',
  
  // The output RTMP URL.
  // For debugging, you could set this to a filename like 'test.flv', and play
  // the resulting file with VLC.  Please also read the security considerations
  // later on in this tutorial.
  'rtmp://localhost:1935/live/rfBd56ti2SMtYvSgD5xAV0YU99zampta7Z7S575KLkIZ9PYk'
])
io.on('connection', function (socket) {
  console.log('on connection');

  socket.on('message', data => {
    console.log(data)
    ffmpeg.stdin.write(data);
  })

  // socket.on('disconnect', () => {
  //   console.log('user disconnected');
  //   ffmpeg.kill('SIGINT');
  // });

  // Handle STDIN pipe errors by logging to the console.
  // These errors most commonly occur when FFmpeg closes and there is still
  // data to write.  If left unhandled, the server will crash.
  ffmpeg.stdin.on('error', (e) => {
    console.log('FFmpeg STDIN Error', e);
  });
  
  // FFmpeg outputs all of its messages to STDERR.  Let's log them to the console.
  ffmpeg.stderr.on('data', (data) => {
    console.log('FFmpeg STDERR:', data.toString());
  });
})

app.listen(8880);