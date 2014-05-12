require('./shotenjin');
var http = require('http'),
    url = require("url"),
    path = require("path"),  
    fs = require("fs"),
    querystring = require("querystring"),
    route = require('./route');

exports.run = function(config){
    port = config.port || 8080;
    var server = http.createServer(function(req, res){
        var _postData = '';
        req.on('data', function(chunk){
      	    _postData += chunk;
      	})
      	.on('end', function(){
            req.post = querystring.parse(_postData);
            var actionInfo = route.getActionInfo(req.url, config.defaultController, config.defaultAction);
            if (actionInfo.ext) {
              staticFileServer(req, res);
              return;
            }
            var controllerFile = __dirname+'/../controllers/'+actionInfo.controller+'Controller.js';
            fs.exists(controllerFile, function(exists) {  
              if(!exists) {  
                  console.log(controllerFile);
                  handler404(req, res);  
                  return;  
              }
              var controller = require(controllerFile);
              if(controller[actionInfo.action]){
                  var ct = new controllerContext(req, res);
                  controller[actionInfo.action].apply(ct, actionInfo.args);
              }else{
                  handler500(req, res, 'Error: controller "' + actionInfo.controller + '" without action "' + actionInfo.action + '"')
              }
            });
        });      
    }).listen(port);

    /**
     * socketio server
     */
    var io = require("socket.io").listen(server, { log: false });

    //io监听socket事件
    io.on('connection', function (connection) {
        console.log((new Date()) + ' Connection from origin ' + connection.id + '.');

        connection.on('message', function (message) {
          message.sender = connection.id;
          console.log(message);
          connection.broadcast.emit('message', message);

          connection.json.send(message);
          return;
            
            if (message.logicId == "login") {
                clients[message.username] = connection; //将用户名与连接对应
                connection.username = message.username;
            }else if(message.logicId == "chat") {//用户发起会话
                //1、查找该用户是否有历史消息
                var toUser = message.to;//会话目标
                var from = message.username;//会话发起人
                if(history[toUser]&&history[toUser][from]){
                    var historyMsgs = [];
                    for (var i = 0; i < history[toUser][from].length; i++) {
                        historyMsgs.push(history[toUser][from][i]);
                    };
                    connection.json.send({logicId:"history",historyMsgs:historyMsgs});
                }
                //2、检查目标用户是否在线，若在线，转发用户请求,否则，存为历史会话中
                var objConnect = clients[toUser];
                var chatJson = {logicId:"chat", from: from, time: message.time, msg: message.msg };
                    connection.json.send(chatJson);
                if (objConnect) {
                    objConnect.json.send(chatJson);
                } else {//存储于历史会话中
                    if (!history[from]||!history[from][toUser]) {
                        if (!history[from]) {
                            history[from] = [];
                        }
                        history[from][toUser] = [];
                    }
                    history[from][toUser].push(chatJson);
                }
            }
        });

        // user disconnected
        connection.on('disconnect', function (socket) {
            console.log("关闭连接:" + socket);
            //delete clients[connection.username];//删除用户的连接
        });

    });
    console.log('服务器启动于端口'+ port);
};

//controller的上下文对象
var controllerContext = function(req, res){
    this.req = req;
    this.res = res;
    this.handler404 = handler404;
    this.handler500 = handler500;
};
controllerContext.prototype.render = function(viewName, context){
    viewEngine.render(this.req, this.res, viewName, context);
};
controllerContext.prototype.renderJson = function(json){
    viewEngine.renderJson(this.req, this.res, json);
};

var handler404 = function(req, res){
    res.writeHead(404, {'Content-Type': 'text/plain'});
    res.end('Page Not Found');
};

var handler500 = function(req, res, err){
    res.writeHead(500, {'Content-Type': 'text/plain'});
    console.log(err);
    res.end();
};

var viewEngine = {
    render: function(req, res, viewName, context){
      var filename = __dirname+"/../views/"+viewName+".html";
      try{
          var output = Shotenjin.renderView(filename, context);
      }catch(err){
          handler500(req, res, err);
          return;
      }
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end(output);
    },
    renderJson: function(res, json){
        //TODO: 
    }
};

var staticFileServer = function(req, res, filePath){
    if(!filePath){
        filePath = path.join(__dirname+"/../", url.parse(req.url).pathname);
    }
    fs.exists(filePath, function(exists) {  
        if(!exists) {  
            handler404(req, res);  
            return;  
        }  
  
        fs.readFile(filePath, "binary", function(err, file) {  
            if(err) {  
                handler500(req, res, err);
                return;  
            }
            
            var ext = path.extname(filePath);
            ext = ext ? ext.slice(1) : 'html';
            res.writeHead(200, {'Content-Type': contentTypes[ext] || 'text/html'});
            res.write(file, "binary");
            res.end();
        });  
    });
};
var contentTypes = {
  "aiff": "audio/x-aiff",
  "arj": "application/x-arj-compressed",
  "asf": "video/x-ms-asf",
  "asx": "video/x-ms-asx",
  "au": "audio/ulaw",
  "avi": "video/x-msvideo",
  "bcpio": "application/x-bcpio",
  "ccad": "application/clariscad",
  "cod": "application/vnd.rim.cod",
  "com": "application/x-msdos-program",
  "cpio": "application/x-cpio",
  "cpt": "application/mac-compactpro",
  "csh": "application/x-csh",
  "css": "text/css",
  "deb": "application/x-debian-package",
  "dl": "video/dl",
  "doc": "application/msword",
  "drw": "application/drafting",
  "dvi": "application/x-dvi",
  "dwg": "application/acad",
  "dxf": "application/dxf",
  "dxr": "application/x-director",
  "etx": "text/x-setext",
  "ez": "application/andrew-inset",
  "fli": "video/x-fli",
  "flv": "video/x-flv",
  "gif": "image/gif",
  "gl": "video/gl",
  "gtar": "application/x-gtar",
  "gz": "application/x-gzip",
  "hdf": "application/x-hdf",
  "hqx": "application/mac-binhex40",
  "html": "text/html",
  "ice": "x-conference/x-cooltalk",
  "ief": "image/ief",
  "igs": "model/iges",
  "ips": "application/x-ipscript",
  "ipx": "application/x-ipix",
  "jad": "text/vnd.sun.j2me.app-descriptor",
  "jar": "application/java-archive",
  "jpeg": "image/jpeg",
  "jpg": "image/jpeg",
  "js": "text/javascript",
  "json": "application/json",
  "latex": "application/x-latex",
  "lsp": "application/x-lisp",
  "lzh": "application/octet-stream",
  "m": "text/plain",
  "m3u": "audio/x-mpegurl",
  "man": "application/x-troff-man",
  "me": "application/x-troff-me",
  "midi": "audio/midi",
  "mif": "application/x-mif",
  "mime": "www/mime",
  "movie": "video/x-sgi-movie",
  "mp4": "video/mp4",
  "mpg": "video/mpeg",
  "mpga": "audio/mpeg",
  "ms": "application/x-troff-ms",
  "nc": "application/x-netcdf",
  "oda": "application/oda",
  "ogm": "application/ogg",
  "pbm": "image/x-portable-bitmap",
  "pdf": "application/pdf",
  "pgm": "image/x-portable-graymap",
  "pgn": "application/x-chess-pgn",
  "pgp": "application/pgp",
  "pm": "application/x-perl",
  "png": "image/png",
  "pnm": "image/x-portable-anymap",
  "ppm": "image/x-portable-pixmap",
  "ppz": "application/vnd.ms-powerpoint",
  "pre": "application/x-freelance",
  "prt": "application/pro_eng",
  "ps": "application/postscript",
  "qt": "video/quicktime",
  "ra": "audio/x-realaudio",
  "rar": "application/x-rar-compressed",
  "ras": "image/x-cmu-raster",
  "rgb": "image/x-rgb",
  "rm": "audio/x-pn-realaudio",
  "rpm": "audio/x-pn-realaudio-plugin",
  "rtf": "text/rtf",
  "rtx": "text/richtext",
  "scm": "application/x-lotusscreencam",
  "set": "application/set",
  "sgml": "text/sgml",
  "sh": "application/x-sh",
  "shar": "application/x-shar",
  "silo": "model/mesh",
  "sit": "application/x-stuffit",
  "skt": "application/x-koan",
  "smil": "application/smil",
  "snd": "audio/basic",
  "sol": "application/solids",
  "spl": "application/x-futuresplash",
  "src": "application/x-wais-source",
  "stl": "application/SLA",
  "stp": "application/STEP",
  "sv4cpio": "application/x-sv4cpio",
  "sv4crc": "application/x-sv4crc",
  "svg": "image/svg+xml",
  "swf": "application/x-shockwave-flash",
  "tar": "application/x-tar",
  "tcl": "application/x-tcl",
  "tex": "application/x-tex",
  "texinfo": "application/x-texinfo",
  "tgz": "application/x-tar-gz",
  "tiff": "image/tiff",
  "tr": "application/x-troff",
  "tsi": "audio/TSP-audio",
  "tsp": "application/dsptype",
  "tsv": "text/tab-separated-values",
  "txt": "text/plain",
  "unv": "application/i-deas",
  "ustar": "application/x-ustar",
  "vcd": "application/x-cdlink",
  "vda": "application/vda",
  "vivo": "video/vnd.vivo",
  "vrm": "x-world/x-vrml",
  "wav": "audio/x-wav",
  "wax": "audio/x-ms-wax",
  "wma": "audio/x-ms-wma",
  "wmv": "video/x-ms-wmv",
  "wmx": "video/x-ms-wmx",
  "wrl": "model/vrml",
  "wvx": "video/x-ms-wvx",
  "xbm": "image/x-xbitmap",
  "xlw": "application/vnd.ms-excel",
  "xml": "text/xml",
  "xpm": "image/x-xpixmap",
  "xwd": "image/x-xwindowdump",
  "xyz": "chemical/x-pdb",
  "zip": "application/zip"
};