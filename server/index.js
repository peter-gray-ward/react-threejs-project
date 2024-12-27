var port = 5001;
const fs = require('fs')
require('http').createServer(function(req, res) {
	if (req.url == '/space.jpg') {
		res.writeHead(200, {
			'Content-Type': 'image/jpg'
		});
		res.end(fs.readFileSync('/users/peter/desktop/react-threejs-project/client/public/space.jpg'));
		return;
	}
	res.writeHead(200, {
		'Content-Type': 'text/plain'
	});
	res.end('Hello, world.');
}).listen(port, function() {
	console.log("server running on port " + port);
});