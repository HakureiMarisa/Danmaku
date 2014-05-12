var parseURL = require('url').parse;
var path = require("path");
//根据http请求的method来分别保存route规则
var routes = {get:[], post:[], head:[], put:[], delete:[]};

exports.map = function(dict){
    if(dict && dict.url && dict.controller){
        var method = dict.method ? dict.method.toLowerCase() : 'get';
        routes[method].push({
            u: dict.url, //url匹配正则
            c: dict.controller,
            a: dict.action || 'index'
        });
    }
};

exports.getActionInfo = function(url, defaultController, defaultAction){
    var r = {controller:null, action:null, args:null},
        // url: /blog/index?page=1 ,则pathname为: /blog/index
        pathname = parseURL(url).pathname;

    var p = pathname.split('/');
    r.controller = p[1] ? p[1] : defaultController;
    r.action = p[2] ? p[2] : defaultAction;
    var ext = path.extname(url);
    r.ext = ext ? ext.slice(1) : '';
    /*var m_routes = routes[method];
    for(var i in m_routes){
        //正则匹配
        r.args = m_routes[i].u.exec(pathname);
        if(r.args){
            r.controller = m_routes[i].c;
            r.action = m_routes[i].a;
            r.args.shift(); //第一个值为匹配到的整个url，去掉
            break;
        }
    }*/
    //如果匹配到route，r大概是 {controller:'blog', action:'index', args:['1']}
    return r;
};