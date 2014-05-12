var config = require('./sys_modules/config.js'),
	app = require('./sys_modules/server.js');

app.run(config.config);
