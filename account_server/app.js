var db = require('../utils/db');
var configs = require(process.argv[2]);

//init db pool.
db.init(configs.mysql());

//

var config = configs.account_server();//这句话是啥意思
var as = require('./account_server');
as.start(config);

// var dapi = require('./dealer_api');      
// dapi.start(config);


//app.js弄出来就是为了添加到bat文件中  跑的