var crypto = require('../utils/crypto');
var express = require('express');
var db = require('../utils/db');
var http = require("../utils/http");
var fibers = require('fibers');//纤程

var app = express();    //初始化express的进程
var hallAddr = "";


function send(res,ret){
	var str = JSON.stringify(ret);
	res.send(str)
}

var config = null;

exports.start = function(cfg){
	config = cfg;
	hallAddr = config.HALL_IP  + ":" + config.HALL_CLIENT_PORT;
	app.listen(config.CLIENT_PORT);      //监听这个config端口，这样账号服务器就开起来了
	console.log("account server is listening on " + config.CLIENT_PORT);
}





//设置跨域访问        //就是让不同的域名也可以访问  定义不同的API
app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
    res.header("X-Powered-By",' 3.2.1')
	res.header("Content-Type", "application/json;charset=utf-8");
	fibers(function(){
		next();
	}).run();
});
//register 在本游戏中未用到，主要用与在游戏外注册用户的话，用到这个接口
// app.get('/register',function(req,res){       
// 	var account = req.query.account;
// 	var password = req.query.password;
// //注册失败  向前端发送信息
// 	var fnFailed = function(){
// 		send(res,{errcode:1,errmsg:"account has been used."});
// 	};
// //注册成功
// 	var fnSucceed = function(){
// 		send(res,{errcode:0,errmsg:"ok"});	
// 	};

// 	db.is_user_exist(account,function(exist){
// 		if(exist){
// 			db.create_account(account,password,function(ret){
// 				if (ret) {
// 					fnSucceed();
// 				}
// 				else{
// 					fnFailed();
// 				}
// 			});
// 		}
// 		else{
// 			fnFailed();
// 			console.log("account has been used.");			
// 		}
// 	});
// });
 //可以通过这个接口来获取configs里的版本，用于游戏的更新来用
app.get('/get_version',function(req,res){
	var ret = {
		version:config.VERSION,
	}
	send(res,ret);
});
//获取服务器信息 info=信息，  获取版本号，大厅ip地址， appweb 下载新客户端的地址
app.get('/get_serverinfo',function(req,res){
	var ret = {
		version:config.VERSION,
		hall:hallAddr,
		appweb:config.APP_WEB,
	}
	send(res,ret);
});
//guest =游客登录
app.get('/guest',function(req,res){
	//这的account就是浏览器那边的account=    ，再+guest构成   再去结合req的ip地址 和config里的key构成md5的散列   一起作为sign的校验
	var account = "guest_" + req.query.account;
	
	var sign = crypto.md5(account + req.ip + config.ACCOUNT_PRI_KEY);//PRI-KEY私钥
	var ret = {
		errcode:0,//错误代码0
		errmsg:"ok",
		account:account,
		halladdr:hallAddr,
		sign:sign
	}
	send(res,ret);    /////////还能这么用？
});
//auth=用户的验证登陆
app.get('/auth',function(req,res){
	var account = req.query.account;
	var password = req.query.password;

	db.get_account_info(account,password,function(info){
		if(info == null){
			send(res,{errcode:1,errmsg:"invalid account"});//无效账户
			return;
		}

        var account = "vivi_" + req.query.account;
        var sign = get_md5(account + req.ip + config.ACCOUNT_PRI_KEY);
        var ret = {
            errcode:0,
            errmsg:"ok",
            account:account,
            sign:sign
        }
				send(res,ret);
				
	});
});

var appInfo = {
	Android:{
		appid:"wxe39f08522d35c80c",
		secret:"fa88e3a3ca5a11b06499902cea4b9c01",
	},
	iOS:{
		appid:"wxcb508816c5c4e2a4",
		secret:"7de38489ede63089269e3410d5905038",		
	}
};
//访问令牌（微信公众平台开发用到的）  访问特定的http地址   （微信）
function get_access_token(code,os,callback){
	var info = appInfo[os];
	if(info == null){
		callback(false,null);
	}
	var data = {
		appid:info.appid,
		secret:info.secret,
		code:code,
		grant_type:"authorization_code"
	};

	http.get2("https://api.weixin.qq.com/sns/oauth2/access_token",data,callback,true);
}

function get_state_info(access_token,openid,callback){
	var data = {
		access_token:access_token,
		openid:openid
	};

	http.get2("https://api.weixin.qq.com/sns/userinfo",data,callback,true);
}






//上面的那些access token都通过以后 就创建用户     先看看用户是否存在（用到数据库db）
function create_user(account,name,sex,headimgurl,callback){
	var coins = 1000;
	var gems = 21;
	db.is_user_exist(account,function(ret){  //如果不存在就创建用户的各种信息
		if(!ret){
			db.create_user(account,name,coins,gems,sex,headimgurl,function(ret){
				callback();
			});
		}
		else{
			db.update_user_info(account,name,headimgurl,sex,function(ret){
				callback();
			});
		}
	});
};
app.get('/wechat_auth',function(req,res){
	var code = req.query.code;
	var os = req.query.os;
	if(code == null || code == "" || os == null || os == ""){
		return;
	}
	console.log(os);
	get_access_token(code,os,function(suc,data){
		if(suc){
			var access_token = data.access_token;
			var openid = data.openid;
			get_state_info(access_token,openid,function(suc2,data2){
				if(suc2){
					var openid = data2.openid;
					var nickname = data2.nickname;
					var sex = data2.sex;
					var headimgurl = data2.headimgurl;
					var account = "wx_" + openid;
					create_user(account,nickname,sex,headimgurl,function(){
						var sign = crypto.md5(account + req.ip + config.ACCOUNT_PRI_KEY);
					    var ret = {
					        errcode:0,
					        errmsg:"ok",
					        account:account,
					        halladdr:hallAddr,
					        sign:sign
					    };
					    send(res,ret);
					});						
				}
			});
		}
		else{
			send(res,{errcode:-1,errmsg:"unkown err."});
		}
	});
});

app.get('/base_info',function(req,res){
	var userid = req.query.userid;
	db.get_user_base_info(userid,function(data){
		var ret = {
	        errcode:0,
	        errmsg:"ok",
			name:data.name,
			sex:data.sex,
	        headimgurl:data.headimg
	    };
	    send(res,ret);
	});
});

app.get('/image', function (req, res) {
	var url = req.query.url;
	if (!url) {
	  http.send(res, 1, 'invalid url', {});
	  return;
	}
	if(url.search('http://') != 0 && url.search('https://') != 0){
		http.send(res, 1, 'invalid url', {});
		return;
	}

	url = url.split('.jpg')[0];
	

	var safe = url.search('https://') == 0;
	console.log(url);
	var ret = http.getSync(url, null, safe, 'binary');
	if (!ret.type || !ret.data) {
	  http.send(res, 1, 'invalid url', true);
	  return;
	}
	res.writeHead(200, { "Content-Type": ret.type });
	res.write(ret.data, 'binary');
	res.end();
});



//注册
app.get('/register',function(req,res){       
	var account = req.query.account;
	var password = req.query.password;
	console.log(account +"------注册------>" +password);
    db.is_user_exist(account,function(exist){
	    if(!exist){
             db.create_account(account,password,function(ret){
					if (ret) {
						send(res,{errcode:0,errmsg:"ok"});
						
						 	db.init_event_value(account,function(suc){
						 		if(suc)
								console.log("event have init");
						 		else
						 		console.log("event init fail");
							 });
							 db.init_question(account,function(suc){
								 if(suc)
								 console.log("question have all init ");
								 else
								 console.log("question  init fail");
							 });
							

							 db.init_explorenum(account,function(suc){
								 if(suc){
									 console.log("explore_num  have  init");
								 }
								 else{
									 console.log("explore_num init fail");
								 }
							 });
							 db.init_opengame1(account,function(suc){
								   if(suc)
									 console.log("opengame1  have init");
									 else
									 console.log("opengame1 init false");
								 
							 });
							 db.init_game1num(account,function(suc){
								 if(suc)
								 console.log("game1num have init");
								 else
								 console.log(" game1num init false");
							 });
						
							db.initupdate_health_index(account,function(suc){
								if(suc)
								console.log(" healthvalue  init  is  true");
								else
								console.log("     healthvalue  init is false");
							});
							db.initupdate_grow_value(account,function(suc){
								if(suc)
								console.log("grow init  is  true");
								else
								console.log("grow init is false");
							});
							db.initupdate_grow_value1(account,function(suc){
								if(suc)
								console.log("account_grow init  is  true");
								else
								console.log("account_grow init is false");
							});
							db.init_grow100(account,function(suc){
								if(suc){
									console.log("grow100 init is true");
								}
								else{
									console.log("grow100 init is  false");
								}
							});
							db.init_grow200(account,function(suc){
								if(suc){
									console.log("grow200 init is true");
								}
								else{
									console.log("grow200 init is  false");
								}
							});
							db.init_grow300(account,function(suc){
								if(suc){
									console.log("grow300 init is true");
								}
								else{
									console.log("grow300 init is  false");
								}
							});
							db.init_question_jj(account,function(suc){
								if(suc)
								console.log("question_j have all init ");
								else
								console.log("question_j  init fail");

							 });
							 db.init_pjd1(account,function(suc1){
								if(suc1)
								console.log(" picture 的大简介1(p1j-p12j) init success");
								else
								console.log("picture 的大简介1(p1j-p12j)  init false");
							});
							db.init_pjd2(account,function(suc11){
								if(suc11)
								console.log(" picture 的大简介2(p13j-p20j) init success");
								else
								console.log("picture 的大简介2(p13j-p20j)  init false");
							});
							db.init_pjd3(account,function(suc){
								if(suc)
								console.log(" picture 简介3(pj21-pj25) init success");
								else
								console.log("picture 简介3(pj21-pj25) init false");

							});



							db.init_login_number(account,function(suc){
								if(suc)
								console.log("login_number  init  success");
								else
								console.log("  login_number init false ");

							});
							db.init_explore_picture(account,function(suc){
								if(suc)
								console.log("explore_picture  init success");
								else
								console.log("explore_picture init false");

							});
							db.init_pj(account,function(suc){
								if(suc)
								console.log(" pj init success");
								else
								console.log("pj  init false");

							});
							db.init_pifu(account,function(suc){
								if(suc)
								console.log(" pifu init success");
								else
								console.log("pifu  init false");

							});
							


							var date = new Date();
							var year = date.getFullYear();
							var month = date.getMonth()+1;
							var day = date.getDate();
							var hour = date.getHours();
							var minute = date.getMinutes();
							var second = date.getSeconds();
							var t= year+'年'+month+'月'+day+'日 '+hour+':'+minute+':'+second;
							//初始化日记
							db.init_diary_first(account,t,function(suc){
								if(suc)
								console.log(" diary_first  init success");
								else
								console.log(" diary_first  init false");
							});
							var username=["抓到一只小可爱","甜出服务区","傻子一样的悲伤","中国移动我也不动 ","睡到失眠 "];
							function shuffle(a) {
								var len = a.length;
								for (var i = 0; i < len - 1; i++) {
									var index = parseInt(Math.random() * (len - i));
									var temp = a[index];
									a[index] = a[len - i - 1];
									a[len - i - 1] = temp;
								}
							}
							shuffle(username);
							
							 var str=username[0].substr(0,1);
							
							
							db.init_gerenxinxi(account,username[0],str,function(suc){
								if(suc)
									console.log(" 用户个人信息 init success");
									else
									console.log(" 用户的个人信息 init false");
							});



	 				}
	 				else{
						send(res,{errcode:1,errmsg:"对不起，创建账户失败."});
	 				}
				});
			}
	 		
	   else{
	 			send(res,{errcode:1,errmsg:"，对不起，该账户不存在！"});
	 			console.log("account has been used.");			
	 		}
		 });
	});  


	//登陆
app.get('/login',function(req,res){
	var account = req.query.account;
	var password = req.query.password;
	console.log(account +"-----  登陆------->" +password);
	db.is_user_exist(account,function(exist){
			if(exist){
			     db.is_password_true(account,password,function(ret){
				   if(ret)
				    send(res,{errcode:0,errmsg:"密码正确" });
				   else
				      send(res,{errcode:1,errmsg:"密码错误" });


			 });
		}
		else
		send(res,{errcode:1,errmsg:" 抱歉,该账号不存在！" });

		});
	});

app.get('/test_connection',function(req,res){
	account=req.query.account;
	http.send(res,0);
	console.log("connect success");
});


app.get('/get_user_data',function(req,res){
		var account = req.query.account;
		console.log("账号为："+account);
		console.log("fangwendating");
		// 控制 login——number
		if(account == null){
			console.log("yichang");
			return;
		}
		else if(account !=null){

		db.control_login_number(account,function(suc){
			console.log(account);
			if(suc)
				console.log("login_number +1");
			else
			console.log("login_number  update  fail");
		});
	}
	
	

	//健康值定时器

	var interval =setInterval(function(){
		db.get_health_index(account,function(data){
			var health=data.health_index;
			if(health >1){
				
	 	db.update_health_index(account,function(suc){
			if(suc)
			// http.send(res,0,'update success');
			console.log("  health _index update  success");
			else
			// http.send(res,1,'update failed');
			console.log(" health _index   update  failed");
		});
			}
			else{
				console.log("健康值<1,不能再-1");
				clearInterval(interval);
			}

		});
		},1800000);

	

		var interval1=setInterval(function(){
			db.get_grow_value(account,function(data){
				var growvalue=data.grow_value;
			if(growvalue <300){
				console.log("成长值符合要求");
				db.get_health_index(account,function(data){
					var health = data.health_index;
					if(health >1 && health <=3){	
				db.update_grow_value1(account,function(suc){
					if(suc)
					console.log("  grow_value(一阶段)  +1");
					else
					console.log(" grow_value   update  failed");
				});
				db.update_grow_value11(account,function(suc){
					if(suc)
					console.log("  account_grow_value(一阶段)  +1");
					else
					console.log(" account_grow_value   update  failed");
				});

					}
					else  if(health <= 1||health > 3){
						console.log("健康值不在(1,3)，成长值不再此阶段增加");
						clearInterval(interval1);
					}
				});
			}
		});
	   },320000);//5分钟涨1






		   //成长值二阶段8秒+1
		   var interval3=setInterval(function(){
			    db.get_grow_value(account,function(data){
					var growvalue=data.grow_value;
				if(growvalue <300){
					console.log("成长值符合要求");
					db.get_health_index(account,function(data){
						var health = data.health_index;
						if(health >3 && health <=6){	
					db.update_grow_value1(account,function(suc){
						if(suc)
						console.log("  grow_value(二阶段)  +1");
						else
						console.log(" grow_value   update  failed");
					});
					db.update_grow_value11(account,function(suc){
						if(suc)
						console.log("  account_grow_value(二阶段)  +1");
						else
						console.log(" account_grow_value   update  failed");
					});
						}
						else  if(health <= 3||health > 6){
							console.log("健康值不在(3,6)，成长值不再此阶段增加");
							clearInterval(interval3);
						}
					});
				}
			});
		   },240000);//4分钟涨1

	 	   //成长值第三阶段5秒+1
		   var interval4=setInterval(function(){
			db.get_grow_value(account,function(data){
				var growvalue =data.grow_value;
			if(growvalue <300){
				console.log("成长值符合要求");
				db.get_health_index(account,function(data){
					var health = data.health_index;
					if(health >6 && health <=10){	
				db.update_grow_value1(account,function(suc){
					if(suc)
					console.log("  grow_value(三阶段)  +1");
					else
					console.log(" grow_value   update  failed");
				});
				db.update_grow_value11(account,function(suc){
					if(suc)
					console.log("  account_grow_value(三阶段)  +1");
					else
					console.log(" account_grow_value   update  failed");
				});
					}
					else if(health < 6 ){
						console.log("健康值不在(6,10)，成长值不在此阶段增加");
						clearInterval(interval4);
					}
				});
			}
		});
	   },180000);



if(account!=null){

		   //控制成长值 提示框显示
		   db.get_grow_value(account,function(data){
				 var growvalue=data.grow_value;
				  // console.log(growvalue);
			   if(growvalue >=100){
					//  console.log(growvalue);
				db.control_grow100(account,function(suc){
					if(suc)
						console.log("grow100  +1");
					else
						console.log("grow100 init fail");
				});
			}
		  	if(growvalue >=200){
				db.control_grow200(account,function(suc1){
					if(suc1)
						console.log("grow200  +1");
					else
						console.log("grow200 init fail");
				});
			}
			if(growvalue >=300){
				db.control_grow300(account,function(suc2){
					if(suc2)
						console.log("grow300  +1");
					else
						console.log("grow300 init fail");
				});
			}
			 });
			}
			else if(account == null){
				console.log("weikong");
			}

		   //事件的方法
		    var  interal2=setInterval(function(){
			   var event=['select1','select2','select3','select4','select5','select6','select7','select8'];
			db.control_event(account,function(data){
				var arr ={};
				arr=data;
				var num =0;
				for(var key in arr){
					if(arr[key] == 1){
					num=num + 1;
				}	
				}
				// console.log("num:"+ num);
					if(num <3){      //这的num<3 是因为异步   如果后期时间长的话  还可以 试着改回 num<=3
						function shuffle(a) {
							var len = a.length;
							for (var i = 0; i < len - 1; i++) {
								var index = parseInt(Math.random() * (len - i));
								var temp = a[index];
								a[index] = a[len - i - 1];
								a[len - i - 1] = temp;
							}
						}
						shuffle(event);
				
						  console.log(event[0]);


						  if(event[0] == 'select1'){
							db.cha_select1(account,function(data){
								var e1=data.event1;
								// console.log("****************");
								console.log("event1的值："+e1);
								if(e1 == 0){
									db.select_event1(account,function(suc){
							
										if(suc){
										console.log("显示第"+ 1 +"个事件");
										
									}
										else
										console.log("更新失败");
									});
								}
								else if(e1 == 1)
								{
									console.log("event1已经显示过了");
								}
	
							});
					}

					if(event[0] == 'select2'){
						db.cha_select2(account,function(data){
							var e2=data.event2;
							// console.log("****************");
								console.log("event2的值："+e2);
							if(e2 == 0){
								db.select_event2(account,function(suc){
						
									if(suc){
									console.log("显示第"+ 2 +"个事件");
									
								}
									else
									console.log("更新失败");
								});
							}
							else if (e2 ==1){
								console.log("event2已经显示过了");
							}
	
						});
				}

				if(event[0] == 'select3'){
					db.cha_select3(account,function(data){
						var e3=data.event3;
						// console.log("****************");
								console.log("event3的值："+e3);
						if(e3 == 0){
							db.select_event3(account,function(suc){
					
								if(suc){
								console.log("显示第"+ 3 +"个事件");
								
							}
								else
								console.log("更新失败");
							});
						}
						else if(e3 ==1){
							console.log("event3已经显示过了");
						}
	
					});
			}

			if(event[0] == 'select4'){
				db.cha_select4(account,function(data){
					var e4=data.event4;
						// console.log("****************");
								console.log("event4的值："+e4);
	
					if(e4 == 0){
						db.select_event4(account,function(suc){
				
							if(suc){
							console.log("显示第"+4+"个事件");
							
						}
							else
							console.log("更新失败");
						});
					}
					else if(e4 == 1){
						console.log("event4已经显示过了");
					}
	
				});
		}
		if(event[0] == 'select5'){
			db.cha_select5(account,function(data){
				var e5=data.event5;
					// console.log("****************");
							console.log("event5的值："+e5);

				if(e5 == 0){
					db.select_event5(account,function(suc){
			
						if(suc){
						console.log("显示第"+5+"个事件");
						
					}
						else
						console.log("更新失败");
					});
				}
				else if(e5 == 1){
					console.log("event5已经显示过了");
				}

			});
	}
	if(event[0] == 'select6'){
		db.cha_select6(account,function(data){
			var e6=data.event6;
				// console.log("****************");
						console.log("event6的值："+e6);

			if(e6 == 0){
				db.select_event6(account,function(suc){
		
					if(suc){
					console.log("显示第"+6+"个事件");
					
				}
					else
					console.log("更新失败");
				});
			}
			else if(e6 == 1){
				console.log("event6已经显示过了");
			}

		});
}
if(event[0] == 'select7'){
	db.cha_select7(account,function(data){
		var e7=data.event7;
			// console.log("****************");
					console.log("event7的值："+e7);

		if(e7 == 0){
			db.select_event7(account,function(suc){
	
				if(suc){
				console.log("显示第"+7+"个事件");
				
			}
				else
				console.log("更新失败");
			});
		}
		else if(e7 == 1){
			console.log("event7已经显示过了");
		}

	});
}
if(event[0] == 'select8'){
	db.cha_select8(account,function(data){
		var e8=data.event8;
			// console.log("****************");
					console.log("event8的值："+e8);

		if(e8 == 0){
			db.select_event8(account,function(suc){
	
				if(suc){
				console.log("显示第"+8+"个事件");
				
			}
				else
				console.log("更新失败");
			});
		}
		else if(e8 == 1){
			console.log("event8已经显示过了");
		}

	});
}
					}
					else
						clearInterval(interal2);	
			});
			 },70000);
	
			 //大厅
		db.get_user_data(account,function(data){ 
			if(data) { 
					db.cha_notice(account,function(data2){
						db.cha_djfriend33(account,function(data3){
							
						if(data2.length!=0||data3.length!=0){
							var ret = {
								account:data.account,
								userid:data.userid,
								health_index:data.health_index,
								grow_value:data.grow_value,
								event1:data.event1,
								event2:data.event2,
								event3:data.event3,
								event4:data.event4,
								event5:data.event5,
								event6:data.event6,
								event7:data.event7,
								event8:data.event8,
								login_number:data.login_number,
								grow100:data.grow100,
								grow200:data.grow200,
								grow300:data.grow300,
								notice:1,	
								pifu:data.pifu,
								// zhujiao:zhujiao[0],			 
							};
							http.send(res,0,"data all send",ret);
							return;
						}
						else{
							var ret1 = {
								account:data.account,
								userid:data.userid,
								health_index:data.health_index,
								grow_value:data.grow_value,
								event1:data.event1,
								event2:data.event2,
								event3:data.event3,
								event4:data.event4,
								event5:data.event5,
								event6:data.event6,
								event7:data.event7,
								event8:data.event8,
								login_number:data.login_number,
								grow100:data.grow100,
								grow200:data.grow200,
								grow300:data.grow300,
								notice:0,	
								pifu:data.pifu,	 
							};
							http.send(res,0,"data all send",ret1);
							return;

						}
					});
					});
				}
				else{
					var ret2={
					};
					http.send(res,1,"data send  fail",ret2);
					return;
				}
			});
		
	
	
	
});
		
		
	

//点击事件
	app.get('/click_event',function(req,res){
		var account=req.query.account;
		var event=req.query.event;
		 var arr=[];
		//这如果不行的话 换双引号  
		// console.log(event);
		var msg1="海豹落入渔网,幸亏您及时赶到解救出来,健康值+1";
			var date = new Date();
      var year = date.getFullYear();
      var month = date.getMonth()+1;
      var day = date.getDate();
      var hour = date.getHours();
      var minute = date.getMinutes();
			var second = date.getSeconds();
			var t= year+'年'+month+'月'+day+'日 '+hour+':'+minute+':'+second;
		if(event == 1){
			db.init_event1(account,function(suc){
				if(suc)
				console.log("event1 已还原");
				else
				console.log("event1 还原失败");

			});
			db.get_health_index(account,function(data){
				if(data.health_index <5){
					db.update_health_index1(account,function(suc){
						if(suc){
							console.log("已与健康值关联，健康值+1");
						}
						else{
							console.log("健康值+1 失败");
						}
					});
				}
				else{
					console.log("健康值已满,无法关联");
				}
			});
			 db.diary_event(account,msg1,t,function(suc){
			 	if(suc)
			 	console.log("event1 点击事件已经添加到日记中");
			 	else
			 	console.log("event1 添加到日记中失败");
			 });
		}
		else if(event ==2){
			db.init_event2(account,function(suc){
				if(suc)
				console.log("event2 已还原");
				else
				console.log("event2 还原失败");

			});
			db.get_health_index(account,function(data){
				if(data.health_index<5){
					db.update_health_index1(account,function(suc){
						if(suc){
							console.log("已与健康值关联，健康值+1");
						}
						else{
							console.log("健康值+1 失败");
						}
					});
				}
				else{
					console.log("健康值已满,无法关联");
				}
			});
			arr.push(2);
			var msg2="感谢您提醒周边工厂降低噪音,健康值+1";
		
			 db.diary_event(account,msg2,t,function(suc){
			 	if(suc)
			 	console.log("event2 点击事件已经添加到日记中");
			 	else
			 	console.log("event2 添加到日记中失败");

			 });
		}
		else if(event ==3){
			db.init_event3(account,function(suc){
				if(suc)
				console.log("event3 已还原");
				else
				console.log("event3 还原失败");

			});
			db.get_health_index(account,function(data){
				if(data.health_index<5){
					db.update_health_index1(account,function(suc){
						if(suc){
							console.log("已与健康值关联，健康值+1");
						}
						else{
							console.log("健康值+1 失败");
						}
					});
				}
				else{
					console.log("健康值已满,无法关联");
				}
			});
			arr.push(3);
			var msg3="您及时清理了这片海域的石油污染,保护了海豹的生存环境,健康值+1";
		
			 db.diary_event(account,msg3,t,function(suc){
			 	if(suc)
			 	console.log("event3 点击事件已经添加到日记中");
			 	else
			 	console.log("event3 添加到日记中失败");

			 });
		}
		else if(event ==4){
			db.init_event4(account,function(suc){
				if(suc)
				console.log("event4 已还原");
				else
				console.log("event4 还原失败");

			});
			db.get_health_index(account,function(data){
				if(data.health_index<5){
					db.update_health_index1(account,function(suc){
						if(suc){
							console.log("已与健康值关联，健康值+1");
						}
						else{
							console.log("健康值+1 失败");
						}
					});
				}
				else{
					console.log("健康值已满,无法关联");
				}
			});
			arr.push(4);
			var msg4="感谢您为防治核污染作出贡献,健康值+1";
		
			db.diary_event(account,msg4,t,function(suc){
				if(suc)
				console.log("event4 点击事件已经添加到日记中");
				else
				console.log("event4 添加到日记中失败");

			});
			
		}
		else if(event ==5){
			db.init_event5(account,function(suc){
				if(suc)
				console.log("event5 已还原");
				else
				console.log("event5 还原失败");

			});
			db.get_health_index(account,function(data){
				if(data.health_index<5){
					db.update_health_index1(account,function(suc){
						if(suc){
							console.log("已与健康值关联，健康值+1");
						}
						else{
							console.log("健康值+1 失败");
						}
					});
				}
				else{
					console.log("健康值已满,无法关联");
				}
			});
			arr.push(5);
			var msg5="成功清除生活垃圾,健康值+1";
		
			db.diary_event(account,msg5,t,function(suc){
				if(suc)
				console.log("event5 点击事件已经添加到日记中");
				else
				console.log("event5 添加到日记中失败");

			});
			
		}
		else if(event ==6){
			db.init_event6(account,function(suc){
				if(suc)
				console.log("event6 已还原");
				else
				console.log("event6 还原失败");

			});
			db.get_health_index(account,function(data){
				if(data.health_index<5){
					db.update_health_index1(account,function(suc){
						if(suc){
							console.log("已与健康值关联，健康值+1");
						}
						else{
							console.log("健康值+1 失败");
						}
					});
				}
				else{
					console.log("健康值已满,无法关联");
				}
			});
			arr.push(6);
			var msg6="成功清除生活垃圾,健康值+1";
		
			db.diary_event(account,msg6,t,function(suc){
				if(suc)
				console.log("event6 点击事件已经添加到日记中");
				else
				console.log("event6 添加到日记中失败");

			});
			
		}
		else if(event ==7){
			db.init_event7(account,function(suc){
				if(suc)
				console.log("event7 已还原");
				else
				console.log("event7 还原失败");

			});
			db.get_health_index(account,function(data){
				if(data.health_index<5){
					db.update_health_index1(account,function(suc){
						if(suc){
							console.log("已与健康值关联，健康值+1");
						}
						else{
							console.log("健康值+1 失败");
						}
					});
				}
				else{
					console.log("健康值已满,无法关联");
				}
			});
			arr.push(7);
			var msg7="被天敌追踪,险中逃生,健康值+1";
		
			db.diary_event(account,msg7,t,function(suc){
				if(suc)
				console.log("event7 点击事件已经添加到日记中");
				else
				console.log("event7 添加到日记中失败");

			});
		}
		console.log(arr);
		
		http.send(res,0,"事件点击日记数据已发送",arr);
		
	});


app.get('/click_answerquestion',function(req,res){
	var account=req.query.account;
	var event =req.query.event;
	if(event==8){
		db.init_event8(account,function(suc){
			if(suc)
			console.log("event8 已还原");
			else
			console.log("event8 还原失败");
		});
		db.cha_question(account,function(data){
			var qu=[1,2,3,4,5,6,7,8,9,10,11,12];
			function shuffle(a) {
				var len = a.length;
				for (var i = 0; i < len - 1; i++) {
					var index = parseInt(Math.random() * (len - i));
					var temp = a[index];
					a[index] = a[len - i - 1];
					a[len - i - 1] = temp;
				}
			}
			shuffle(qu);
			console.log("显示第"+qu[0]+"道题");
			db.cha_jj(account,function(data1){
				if(qu[0]==1){
					var	 qu1={
							q1:data.q1,
							q1x1:data.q1x1,
							q1x2:data.q1x2,
							q1t:data.q1t,
							q1j:data1.q1j,
						}
					}
					else if(qu[0]==2){
						var	 qu1={
							q1:data.q2,
							q1x1:data.q2x1,
							q1x2:data.q2x2,
							q1t:data.q2t,
							q1j:data1.q2j,
						}
		
					}
					else if(qu[0]==3){
						var	 qu1={
							q1:data.q3,
							q1x1:data.q3x1,
							q1x2:data.q3x2,
							q1t:data.q3t,
							q1j:data1.q3j,
						}
					}
					
					else if(qu[0]==4){
						var	 qu1={
							q1:data.q4,
							q1x1:data.q4x1,
							q1x2:data.q4x2,
							q1t:data.q4t,
							q1j:data1.q4j,
						}
					}
					else if(qu[0]==5){
						var	 qu1={
							q1:data.q5,
							q1x1:data.q5x1,
							q1x2:data.q5x2,
							q1t:data.q5t,
							q1j:data1.q5j,
						}
					}
					else if(qu[0]==6){
						var	 qu1={
							q1:data.q6,
							q1x1:data.q6x1,
							q1x2:data.q6x2,
							q1t:data.q6t,
							q1j:data1.q6j,
						}
					}
					else if(qu[0]==7){
						var	 qu1={
							q1:data.q7,
							q1x1:data.q7x1,
							q1x2:data.q7x2,
							q1t:data.q7t,
							q1j:data1.q7j,
						}
					}
					else if(qu[0]==8){
						var	 qu1={
							q1:data.q8,
							q1x1:data.q8x1,
							q1x2:data.q8x2,
							q1t:data.q8t,
							q1j:data1.q8j,
						}
					}
					else if(qu[0]==9){
						var	 qu1={
							q1:data.q9,
							q1x1:data.q9x1,
							q1x2:data.q9x2,
							q1t:data.q9t,
							q1j:data1.q9j,
						}
					}
					else if(qu[0]==10){
						var	 qu1={
							q1:data.q10,
							q1x1:data.q10x1,
							q1x2:data.q10x2,
							q1t:data.q10t,
							q1j:data1.q10j,	
						}
					}
					else if(qu[0]==11){
						var	 qu1={
							q1:data.q11,
							q1x1:data.q11x1,
							q1x2:data.q11x2,
							q1t:data.q11t,
							q1j:data1.q11j,
						}
					}
					else if(qu[0]==12){
						var	 qu1={
							q1:data.q12,
							q1x1:data.q12x1,
							q1x2:data.q12x2,
							q1t:data.q12t,
							q1j:data1.q12j,
						}
					}
					http.send(res,0,"",qu1);

			});
		});
	}
});




app.get('/answerReturn',function(req,res){
	var account=req.query.account;
	var tf=req.query.tf;
	var msg8="您刚刚回答了一道海洋知识科普题，回答正确，奖励成长值：1";
	var msg8f="您刚刚回答了一道海洋知识科普题,回答错误，奖励成长值：0";
	var date = new Date();
      var year = date.getFullYear();
      var month = date.getMonth()+1;
      var day = date.getDate();
      var hour = date.getHours();
      var minute = date.getMinutes();
			var second = date.getSeconds();
			var t= year+'年'+month+'月'+day+'日 '+hour+':'+minute+':'+second;
	if(tf ==1 ){
		db.get_health_index(account,function(data){
			if(data.health_index<5){
				db.update_health_index1(account,function(suc){
					if(suc){
						console.log("已与健康值关联，健康值+1");
					}
					else{
						console.log("健康值+1 失败");
					}
				});
			}
			else{
				console.log("健康值已满,无法关联");
			}
		});
		db.update_grow_value1(account,function(suc){
			if(suc)
			console.log("  回答正确，成长值 +1");
			else
			console.log(" grow_value   update  failed");
		});
		// db.update_grow_value11(account,function(suc){
		// 	if(suc)
		// 	console.log("");
		// 	else
		// 	console.log("");
		// });
		
		
		db.diary_event(account,msg8,t,function(suc){
			if(suc){
			console.log("问题8已添加进日记");
			http.send(res,0,"回答正确");}
			else
			console.log("问题8添加日记失败");
		});
	   
	}
	else if(tf==0){
		
		db.diary_event(account,msg8f,t,function(suc){
			if(suc)
			console.log("问题8f已添加进日记");
			else
			console.log("问题8f添加日记失败");
		});

		console.log("回答错误");
		http.send(res,1,"回答错误");
		
	}
});


// 个人信息

app.get('/account_info',function(req,res){
	var account=req.query.account;
	db.cha_gerenxinxi1(account,function(data){
		if(data){
			http.send(res,0,"",data);
		}
		else{
			console.log("个人信息获取失败");
		}
	});
});
	
	app.get('/alter_account_info',function(req,res){
		var account=req.query.account;
		var username=req.query.name2;
		var geqian=req.query.sign;
		var sex=req.query.sex;
		db.update_gerenxinxi(account,username,sex,geqian,function(suc){
			if(suc)
			console.log("个人信息已修改");
			else
			console.log("个人信息修改失败");
		});
		var ret={
		};
		http.send(res,0,"",ret);
	});





//好友
app.get('/friends',function(req,res){
	var account=req.query.account;
	db.cha_friends_info1(account,function(data){
		var ret={
			data1:data,
		};
		http.send(res,0,"",ret);
	});
});


app.get('/selectFriends',function(req,res){
	var account=req.query.account;
	var saccount=req.query.selectAccount;
	var ret={};
db.isfraccountcunzai(saccount,function(data){
	if(data){
		if(saccount==account){
			ret={
				account:saccount,
				msg:"输入账号为此账号",
			};
			console.log("输入账号为此账号");
			http.send(res,1,"",ret);
		}
		else{
			db.cha_gerenxinxi2(saccount,function(data1){
				var ret1={
					msg1:"data 正确",
					id:data1.accountid,
					name:data1.username,
					sex:data1.sex,
					sign:data1.geqian,
					surname:data1.tx,
				};
				console.log("该账号存在");
			http.send(res,0,"",ret1)
			});
		}
	}
	else{
		ret={
			msg:"输入账号不存在",
		};
		console.log("输入账号不存在");
	 	 http.send(res,1,"",ret);
	 }
});
});
//添加好友
 app.get('/addFriends',function(req,res){
 	var account=req.query.account;
 	var fraccount=req.query.addAccount;
	 var ret={};
	 var arr={};
	 var b=0;
	 db.isfriend(account,function(data){
		
		 arr=data;
		for (var key in arr){
			if(arr[key]==fraccount){
				b=b+1;
			}
		}
		if(b!=0){
			console.log("该账号已经是他(她)的好友");
			ret={
				msg:"该账号已经是他(她)的好友",
			};
			http.send(res,1,"",ret);
			return;
		}
		 else{
			 db.add_friend(account,fraccount,function(suc){
				 if(suc){
					 db.add_djfriend(fraccount,account,function(suc1){
						 if(suc1){
							ret={
								msg1:"该账号已添加到他的 好友申请列表",
								msg2:"该账号的好友请求 也已发送到申请账号",
							};
							console.log("1.该账号已添加到他的 好友申请列表");
							console.log("2.该账号的好友请求 也已发送到申请账号");
							http.send(res,0,ret);
							return;
						 }
						 else{
							 console.log("该账号的好友请求 没有到发送到申请账号");
						 }
					 });
					}
			
				 else{
					 console.log("添加到好友申请失败");
				 }
			 });
		 }
	 });
 });
  //通知
 app.get('/notice',function(req,res){
	 var account=req.query.account;
	db.cha_gerenxinxi(account,function(data){
		db.cha_info(account,function(data5){
			var ret={
				data1:data,
				data2:data5,
			};
			http.send(res,0,"",ret);
		});
	});
 });
 //删除通知
 app.get('/delnotice',function(req,res){
	 var account=req.query.account;
	 var t=req.query.t;
	 db.del_info(account,t,function(suc1){
		 if(suc1)
		 console.log("通知删除成功");
		 else
		 console.log("通知删除失败");
	 });
	 var ret={
		 msg:"success",
	 };
	 http.send(res,0,"",ret);
 });
 //删除全部通知
 app.get('/clear',function(req,res){
	 var account=req.query.account;
	 db.del_info1(account,function(suc){
		 if(suc)
		 console.log(" info all del");
		 else
		 console.log("info del fail");
	 });
	 var ret={
		 msg:"data all del",
	 };
	 http.send(res,0,"",ret);
 });
 //好友同意
 app.get('/tongyi',function(req,res){
	 var account=req.query.account;
	 var ty=req.query.apply;//这个是 是否同意的那个变量
	 var djfriend=req.query.applyAccount;//这个是同意的那个号
	 var date = new Date();
      var year = date.getFullYear();
      var month = date.getMonth()+1;
      var day = date.getDate();
      var hour = date.getHours();
      var minute = date.getMinutes();
			var second = date.getSeconds();
			var t= year+'年'+month+'月'+day+'日 '+hour+':'+minute+':'+second;

	 if(ty==1){
		 db.delete_djfriend(account,djfriend,function(suc){
			 if(suc){
				 console.log("该账号的申请人信息已删除");
			 }
			 else{
				 console.log("申请人信息删除失败");
						 }
		 });
		 db.delete_appliaccount(djfriend,account,function(suc1){
			 if(suc1){
				 console.log("那边的申请信息也已删除");
			 }
			 else{
				 console.log("那边的申请信息删除失败");
			 }
		});
		db.add_friend1(account,djfriend,function(suc2){
			if(suc2){
				console.log("账号"+djfriend+"已经添加到账号"+account+"的好友列表");
			}
			else
			console.log("添加好友失败");
		});
		var info="您刚刚同意了账号"+djfriend+"的申请请求，你们已经是好友了";
		db.add_info(account,info,t,function(suc3){
			if(suc3)
			console.log("添加成功的系统消息已插入");
			else
			console.log("插入失败");
		});
		db.add_friend1(djfriend,account,function(suc12){
			if(suc12)
			console.log("同样 他的好友列表也有你了");
			else
			console.log("插入失败");
		});
		var info1="账号"+account+"同意了您的好友请求，你们已经是好友了";
		db.add_info(djfriend,info1,t,function(suc4){
			if(suc4)
			console.log("添加成功的系统消息已插入");
			else
			console.log("插入失败");
		});
		console.log(account+"同意了他的申请");
		var ret={

		};
		http.send(res,0,"",ret);
	 }
	 else{
		db.delete_djfriend(account,djfriend,function(suc){
			if(suc){
				console.log("该账号的申请人信息已删除");
			}
			else{
				console.log("申请人信息删除失败");
						}
		});
		db.delete_appliaccount(djfriend,account,function(suc1){
			if(suc1){
				console.log("那边的申请信息也已删除");
			}
			else{
				console.log("那边的申请信息删除失败");
			}
	 });
	 console.log("账号"+account+"拒绝了"+djfriend+"的请求");
	 var info2="您刚刚拒绝了账号"+djfriend+"的申请请求";

	 db.add_info(account,info2,t,function(suc5){
		 if(suc5)
		 console.log("插入成功");
		 else
		 console.log("插入失败");
	 });
	 var info3="很遗憾"+account+"拒绝了你的好友请求";
	 db.add_info(djfriend,info3,t,function(suc5){
		if(suc5)
		console.log("插入成功");
		else
		console.log("插入失败");
	});
	var ret={
		msg:"success",
	};
	http.send(res,1,"",ret);
	 }
 });
 

 //好友家园
 app.get('/friendsHall',function(req,res){
	 var friend=req.query.friendsAccount;
	 console.log(friend);
	 db.cha_friends_info2(friend,function(data){
		 db.cha_djsj_hea_(friend,function(data1){
			 db.cha_picture(friend,function(data2){
				var num;
				var num1;
				 //num为图鉴的数量
				 num =data2.picture1 + data2.picture2 + data2.picture3+data2.picture4+data2.picture5+data2.picture6+data2.picture7+data2.picture8+data2.picture9+data2.picture10+data2.picture11+data2.picture12+data2.picture13+data2.picture14+data2.picture15+data2.picture16+data2.picture17+data2.picture18+data2.picture19+data2.picture20;
				 //num1为事件数
				//  console.log("num"+num);
				 num1=data2.picture21+data2.picture22+data2.picture23+data2.picture24+data2.picture25;
				//  console.log();
				 var ret={
					 accountid:data.accountid,
					 username:data.username,
					 sex:data.sex,
					 geqian:data.geqian,
					 tx:data.tx,
					 growvalue:data.grow_value,
					 healthvalue:data1.health_index,
					 tujianshu:num,
					 shijianshu:num1,
					 event1:data1.event1,
					 event2:data1.event2,
					 event3:data1.event3,
					 event4:data1.event4,
					 event5:data1.event5,
					 event6:data1.event6,
					 event7:data1.event7,
				 };
				 http.send(res,0,"",ret);
			 });
		 });
	 });
 });
//好友家园事件
 app.get('/friendsEvent',function(req,res){
	 var account=req.query.account;
	 var friend=req.query.friendsAccount;
	 var event=req.query.event;
	 var date = new Date();
      var year = date.getFullYear();
      var month = date.getMonth()+1;
      var day = date.getDate();
      var hour = date.getHours();
      var minute = date.getMinutes();
			var second = date.getSeconds();
			var t= year+'年'+month+'月'+day+'日 '+hour+':'+minute+':'+second;
			if(event == 1){
				db.init_event1(friend,function(suc){
					if(suc)
					console.log(" 好友event1 已还原");
					else
					console.log("好友event1 还原失败");
	
				});
				db.get_health_index(friend,function(data){
					if(data.health_index<5){
				db.update_health_index1(friend,function(suc){
					if(suc){
						console.log("帮助好友清理垃圾，好友健康值+1");
					}
					else{
						console.log("健康值+1 失败");
					}
	
				});
			}
			else{
				console.log("好友健康值是满的，不关联");
			}
		});

		db.get_health_index(account,function(data1){
			if(data1.health_index<5){
				db.update_health_index1(account,function(suc){
					if(suc){
						console.log("您刚刚帮助好友清理垃圾，您的健康值+1");
					}
					else{
						console.log("健康值+1 失败");
					}
	
				});
			}
			else{
				console.log("您的健康值是满的，不关联");
			}
		});
				var msg1="您的好友"+account+"刚刚帮你清理了垃圾,您的健康值+1";
					
				 db.diary_event(friend,msg1,t,function(suc){
					 if(suc)
					 console.log("好友的event1 点击事件已经添加到日记中");
					 else
					 console.log("好友的event1 添加到日记中失败");
				 });
				 var msg2=" 您在好友"+friend+"的家园中帮他清理了垃圾，奖励健康值+1";
				 db.diary_event(account,msg2,t,function(suc){
					if(suc)
					console.log("帮助好友的event1 点击事件已经添加到日记中");
					else
					console.log("帮助好友的event1 添加到日记中失败");
				});
				var info=" 您的好友"+ account +"刚刚访问了你的家园，并帮你清理了垃圾";
				db.add_info(friend,info,t,function(suc){
					if(suc)
					console.log(" 通知添加成功");
					else
					console.log("通知添加失败");

				});
			}
			else if(event==2){
				db.init_event2(friend,function(suc){
					if(suc)
					console.log(" 好友event2 已还原");
					else
					console.log("好友event2 还原失败");
	
				});
				db.get_health_index(friend,function(data){
					if(data.health_index<5){
				db.update_health_index1(friend,function(suc){
					if(suc){
						console.log("帮助好友清理垃圾，好友健康值+1");
					}
					else{
						console.log("健康值+1 失败");
					}
	
				});
			}
			else{
				console.log("好友健康值是满的，不关联");
			}
		});
		db.get_health_index(account,function(data1){
			if(data1.health_index<5){
		db.update_health_index1(account,function(suc){
			if(suc){
				console.log("帮助好友清理垃圾，自己健康值+1");
			}
			else{
				console.log("健康值+1 失败");
			}

		});
	}
	else{
		console.log("自己健康值是满的，不关联");
	}
});
				var msg3="您的好友"+account+"刚刚帮你清理了垃圾,您的健康值+1";
					
				 db.diary_event(friend,msg3,t,function(suc){
					 if(suc)
					 console.log("好友的event2 点击事件已经添加到日记中");
					 else
					 console.log("好友的event2 添加到日记中失败");
				 });
				 var msg4=" 您在好友"+friend+"的家园中帮他清理了垃圾，奖励健康值+1";
				 db.diary_event(account,msg4,t,function(suc){
					if(suc)
					console.log("帮助好友的event2 点击事件已经添加到日记中");
					else
					console.log("帮助好友的event2 添加到日记中失败");
				});
				var info1=" 您的好友"+ account +"刚刚访问了你的家园，并帮你清理了垃圾";
				db.add_info(friend,info1,t,function(suc){
					if(suc)
					console.log(" 通知添加成功");
					else
					console.log("通知添加失败");

				});
			}
			else if(event==3){
				db.init_event3(friend,function(suc){
					if(suc)
					console.log(" 好友event3 已还原");
					else
					console.log("好友event3 还原失败");
	
				});
				db.get_health_index(friend,function(data){
					if(data.health_index<5){
				db.update_health_index1(friend,function(suc){
					if(suc){
						console.log("帮助好友清理垃圾，好友健康值+1");
					}
					else{
						console.log("健康值+1 失败");
					}
	
				});
			}
			else{
				console.log("好友健康值是满的，不关联");
			}
		});
		db.get_health_index(account,function(data){
			if(data.health_index<5){
		db.update_health_index1(account,function(suc){
			if(suc){
				console.log("帮助好友清理垃圾，自己健康值+1");
			}
			else{
				console.log("健康值+1 失败");
			}

		});
	}
	else{
		console.log("自己健康值是满的，不关联");
	}
});
				var msg5="您的好友"+account+"刚刚帮你清理了垃圾,您的健康值+1";
					
				 db.diary_event(friend,msg5,t,function(suc){
					 if(suc)
					 console.log("好友的event3点击事件已经添加到日记中");
					 else
					 console.log("好友的event3 添加到日记中失败");
				 });
				 var msg6=" 您在好友"+friend+"的家园中帮他清理了垃圾，奖励健康值+1";
				 db.diary_event(account,msg6,t,function(suc){
					if(suc)
					console.log("帮助好友的event3 点击事件已经添加到日记中");
					else
					console.log("帮助好友的event3 添加到日记中失败");
				});
				var info2=" 您的好友"+ account +"刚刚访问了你的家园，并帮你清理了垃圾";
				db.add_info(friend,info2,t,function(suc){
					if(suc)
					console.log(" 通知添加成功");
					else
					console.log("通知添加失败");

				});
			}
			else if(event==4){
				db.init_event4(friend,function(suc){
					if(suc)
					console.log(" 好友event4 已还原");
					else
					console.log("好友event4 还原失败");
	
				});
				db.get_health_index(friend,function(data){
					if(data.health_index<5){
				db.update_health_index1(friend,function(suc){
					if(suc){
						console.log("帮助好友清理垃圾，好友健康值+1");
					}
					else{
						console.log("健康值+1 失败");
					}
	
				});
			}
			else{
				console.log("好友健康值是满的，不关联");
			}
		});
		db.get_health_index(account,function(data){
			if(data.health_index<5){
		db.update_health_index1(account,function(suc){
			if(suc){
				console.log("帮助好友清理垃圾，自己健康值+1");
			}
			else{
				console.log("健康值+1 失败");
			}

		});
	}
	else{
		console.log("自己健康值是满的，不关联");
	}
});
				var msg7="您的好友"+account+"刚刚帮你清理了垃圾,您的健康值+1";
					
				 db.diary_event(friend,msg7,t,function(suc){
					 if(suc)
					 console.log("好友的event4 点击事件已经添加到日记中");
					 else
					 console.log("好友的event4 添加到日记中失败");
				 });
				 var msg8=" 您在好友"+friend+"的家园中帮他清理了垃圾，奖励健康值+1";
				 db.diary_event(account,msg8,t,function(suc){
					if(suc)
					console.log("帮助好友的event4 点击事件已经添加到日记中");
					else
					console.log("帮助好友的event4 添加到日记中失败");
				});
				var info3=" 您的好友"+ account +"刚刚访问了你的家园，并帮你清理了垃圾";
				db.add_info(friend,info3,t,function(suc){
					if(suc)
					console.log(" 通知添加成功");
					else
					console.log("通知添加失败");

				});
			}
			else if(event==5){
				db.init_event5(friend,function(suc){
					if(suc)
					console.log(" 好友event5 已还原");
					else
					console.log("好友event5 还原失败");
	
				});
				db.get_health_index(friend,function(data){
					if(data.health_index<5){
				db.update_health_index1(friend,function(suc){
					if(suc){
						console.log("帮助好友清理垃圾，好友健康值+1");
					}
					else{
						console.log("健康值+1 失败");
					}
	
				});
			}
			else{
				console.log("好友健康值是满的，不关联");
			}
		});
		db.get_health_index(account,function(data){
			if(data.health_index<5){
		db.update_health_index1(account,function(suc){
			if(suc){
				console.log("帮助好友清理垃圾，自己健康值+1");
			}
			else{
				console.log("健康值+1 失败");
			}

		});
	}
	else{
		console.log("自己健康值是满的，不关联");
	}
});
				var msg9="您的好友"+account+"刚刚帮你清理了垃圾,您的健康值+1";
					
				 db.diary_event(friend,msg9,t,function(suc){
					 if(suc)
					 console.log("好友的event5 点击事件已经添加到日记中");
					 else
					 console.log("好友的event5 添加到日记中失败");
				 });
				 var msg10=" 您在好友"+friend+"的家园中帮他清理了垃圾，奖励健康值+1";
				 db.diary_event(account,msg10,t,function(suc){
					if(suc)
					console.log("帮助好友的event5 点击事件已经添加到日记中");
					else
					console.log("帮助好友的event5 添加到日记中失败");
				});
				var info4=" 您的好友"+ account +"刚刚访问了你的家园，并帮你清理了垃圾";
				db.add_info(friend,info4,t,function(suc){
					if(suc)
					console.log(" 通知添加成功");
					else
					console.log("通知添加失败");

				});
			}
			else if(event==6){
				db.init_event6(friend,function(suc){
					if(suc)
					console.log(" 好友event6 已还原");
					else
					console.log("好友event6 还原失败");
	
				});
				db.get_health_index(friend,function(data){
					if(data.health_index<5){
				db.update_health_index1(friend,function(suc){
					if(suc){
						console.log("帮助好友清理垃圾，好友健康值+1");
					}
					else{
						console.log("健康值+1 失败");
					}
	
				});
			}
			else{
				console.log("好友健康值是满的，不关联");
			}
		});
		db.get_health_index(account,function(data){
			if(data.health_index<5){
		db.update_health_index1(account,function(suc){
			if(suc){
				console.log("帮助好友清理垃圾，自己健康值+1");
			}
			else{
				console.log("健康值+1 失败");
			}

		});
	}
	else{
		console.log("自己健康值是满的，不关联");
	}
});
				var msg11="您的好友"+account+"刚刚帮你清理了垃圾,您的健康值+1";
					
				 db.diary_event(friend,msg11,t,function(suc){
					 if(suc)
					 console.log("好友的event6 点击事件已经添加到日记中");
					 else
					 console.log("好友的event6 添加到日记中失败");
				 });
				 var msg12=" 您在好友"+friend+"的家园中帮他清理了垃圾，奖励健康值+1";
				 db.diary_event(account,msg12,t,function(suc){
					if(suc)
					console.log("帮助好友的event6 点击事件已经添加到日记中");
					else
					console.log("帮助好友的event6 添加到日记中失败");
				});
				var info5=" 您的好友"+ account +"刚刚访问了你的家园，并帮你清理了垃圾";
				db.add_info(friend,info5,t,function(suc){
					if(suc)
					console.log(" 通知添加成功");
					else
					console.log("通知添加失败");

				});

			}
			else if(event==7){
				db.init_event7(friend,function(suc){
					if(suc)
					console.log(" 好友event7 已还原");
					else
					console.log("好友event7 还原失败");
	
				});
				db.get_health_index(friend,function(data){
					if(data.health_index<5){
				db.update_health_index1(friend,function(suc){
					if(suc){
						console.log("帮助好友清理垃圾，好友健康值+1");
					}
					else{
						console.log("健康值+1 失败");
					}
	
				});
			}
			else{
				console.log("好友健康值是满的，不关联");
			}
		});
		db.get_health_index(account,function(data){
			if(data.health_index<5){
		db.update_health_index1(account,function(suc){
			if(suc){
				console.log("帮助好友清理垃圾，自己健康值+1");
			}
			else{
				console.log("健康值+1 失败");
			}

		});
	}
	else{
		console.log("自己健康值是满的，不关联");
	}
});
				var msg13="您的好友"+account+"刚刚帮你清理了垃圾,您的健康值+1";
					
				 db.diary_event(friend,msg13,t,function(suc){
					 if(suc)
					 console.log("好友的event7 点击事件已经添加到日记中");
					 else
					 console.log("好友的event7 添加到日记中失败");
				 });
				 var msg14=" 您在好友"+friend+"的家园中帮他清理了垃圾，奖励健康值+1";
				 db.diary_event(account,msg14,t,function(suc){
					if(suc)
					console.log("帮助好友的event7 点击事件已经添加到日记中");
					else
					console.log("帮助好友的event7 添加到日记中失败");
				});
				var info6=" 您的好友"+ account +"刚刚访问了你的家园，并帮你清理了垃圾";
				db.add_info(friend,info6,t,function(suc){
					if(suc)
					console.log(" 通知添加成功");
					else
					console.log("通知添加失败");

				});
			}
			var ret={
				xx:"data all send",
			};
			http.send(res,0,"",ret);
 });
 //留言
 app.get('/submitMessage',function(req,res){
	 var account=req.query.account;
	 var friend=req.query.friendsAccount;
	 var liuyan=req.query.leaveMessage;//这个要和前端改变量的
	 var date = new Date();
							var year = date.getFullYear();
							var month = date.getMonth()+1;
							var day = date.getDate();
							var hour = date.getHours();
							var minute = date.getMinutes();
							var second = date.getSeconds();
							var t= year+'年'+month+'月'+day+'日 '+hour+':'+minute+':'+second;
							db.cha_gerenxinxi1(account,function(data){
								var n=data.username;
								var info="你的好友"+n+"给你留言了，快去日记看看吧";
								db.add_info(friend,info,t,function(suc){
									if(suc)
									console.log("留言通知插入成功");
									else
									console.log("留言通知插入失败");
								});
							
	 var msg="您的好友"+n+"对你说："+liuyan;
	 db.diary_event(friend,msg,t,function(suc1){
		 if(suc1)
		 console.log("留言已插入日记");
		 else
		 console.log("留言插入失败");
	 });
	});
	 var ret={
		 msg:"success",
	 };
	 http.send(res,0,"",ret);
 });




 //赠送卡片
 app.get('/sendGift',function(req,res){
	 var account=req.query.account;
	 var friend=req.query.friendsAccount;
	 var kahao=req.query.gift;
	 var picture='picture'+ kahao;
	 var date = new Date();
							var year = date.getFullYear();
							var month = date.getMonth()+1;
							var day = date.getDate();
							var hour = date.getHours();
							var minute = date.getMinutes();
							var second = date.getSeconds();
							var t= year+'年'+month+'月'+day+'日 '+hour+':'+minute+':'+second;
								
							if(account == friend){
								console.log("输入账号为本人的账号");
										var ret1={
											// msg:"输入账号为本账号",
										};
										http.send(res,1,"输入账号为本账号",ret1);
									}
									else{
										db.isfriend(account,function(data){
											var b=0;
											var arr={};
											arr=data;
											for (var key in arr){
												if(arr[key].friend==friend){
													b=b+1;
												}
											}
											if(b==1){
												db.control_picture1(account,picture,function(suc){
													if(suc)
													console.log("账号"+account+"的"+picture+'卡片数量已-1');
													else
													console.log(""+picture+"卡片数量-1失败");
												});
												db.control_picture(friend,picture,function(suc1){
													if(suc1)
													console.log("账号"+friend+"的"+picture+"卡片数量已+1");
													else
													console.log(""+friend+"卡片数量+1失败");
												});
												var arr=['比目鱼','蝙蝠鱼','灯笼鱼','翻车鱼','飞鱼','海龟','海马','海豚','海星','蝴蝶鱼','金枪鱼','鲸','龙虾','螃蟹','鲨鱼','扇贝','水母','乌贼','小丑鱼','章鱼'];
												var info=" 您的好友"+account+"刚刚赠送了你一张"+arr[kahao-1]+"图鉴";
												db.add_info(friend,info,t,function(suc2){
													if(suc2)
													console.log("info  添加成功");
													else
													console.log(" info  添加失败");
												});
												var msg=" 您刚刚赠送了好友"+ friend +"一张"+arr[kahao-1]+"卡";
												db.diary_event(account,msg,t,function(suc3){
													if(suc3)
													console.log("赠送日记添加成功");
													else
													console.log("赠送日记添加失败");
												});
												var msg1="好友"+account+"刚刚赠送了你一张"+arr[kahao-1]+"卡";
												db.diary_event(friend,msg1,t,function(suc4){
												 if(suc4)
												 console.log("赠送日记添加成功(好友)");
												 else
												 console.log("赠送日记添加失败(好友)");
											 });
											 var ret={
											 };
											 http.send(res,0,"success",ret);
										 }
										 else{
											
												var ret3={
												}
												http.send(res,1,"输入账号不是好友",ret3);
											}
										});
										 }
 });

	//探索
	app.get('/explore1_event',function(req,res){
		var account=req.query.account;
		var explore=req.query.explore;
		console.log(explore+"号池");
		var explore_1=[0,1,2,3,4,5,6,7,8];
		var date = new Date();
							var year = date.getFullYear();
							var month = date.getMonth()+1;
							var day = date.getDate();
							var hour = date.getHours();
							var minute = date.getMinutes();
							var second = date.getSeconds();
							var t= year+'年'+month+'月'+day+'日 '+hour+':'+minute+':'+second;
		
		if(explore==1){
			function shuffle(a) {
				var len = a.length;
				for (var i = 0; i < len - 1; i++) {
					var index = parseInt(Math.random() * (len - i));
					var temp = a[index];
					a[index] = a[len - i - 1];
					a[len - i - 1] = temp;
				}
			}
			shuffle(explore_1);
			// console.log("出现"+explore_1[0]);
			var picture='picture'+explore_1[0];
			console.log(picture);
			var tip1=null;
			
				if(explore_1[0]==1){

					db.control_picture(account,picture,function(suc){
						if(suc){
							console.log(" picture1  have +  1");
						}
						else
							console.log("init fail");
					});
					tip1="恭喜你找到一个小伙伴：比目鱼,该图鉴已放入背包";
					var msg1="恭喜你找到一个小伙伴：比目鱼";
					db.diary_event(account,msg1,t,function(suc){
						if(suc)
						console.log("success");
						else
						console.log("fali");
					});

				}
				else if(explore_1[0]==2){
					db.control_picture(account,picture,function(suc){
						if(suc){
							console.log(" picture2  have +  1");
						}
						else
							console.log("init fail");
					});
					tip1="恭喜你找到一个小伙伴：蝙蝠鱼,该图鉴已放入背包";
					var msg2="恭喜你找到一个小伙伴：蝙蝠鱼";

					db.diary_event(account,msg2,t,function(suc){
						if(suc)
						console.log("success");
						else
						console.log("fali");
					});

				}
				else if(explore_1[0]==3){
					db.control_picture(account,picture,function(suc){
						if(suc){
							console.log(" picture3  have +  1");
						}
						else
							console.log("init fail");
					});
					tip1="恭喜你找到一个小伙伴：灯笼鱼,该图鉴已放入背包";
					var msg3="恭喜你找到一个小伙伴：灯笼鱼";
					db.diary_event(account,msg3,t,function(suc){
						if(suc)
						console.log("success");
						else
						console.log("fali");
					});

				}
				else if(explore_1[0]==4){
					db.control_picture(account,picture,function(suc){
						if(suc){
							console.log(" picture4  have +  1");
						}
						else
							console.log("init fail");
					});
					tip1="恭喜你找到一个小伙伴：翻车鱼,该图鉴已放入背包";
					var msg4="恭喜你找到一个小伙伴：翻车鱼";
					db.diary_event(account,msg4,t,function(suc){
						if(suc)
						console.log("success");
						else
						console.log("fali");
					});

				}
				else if(explore_1[0]==5){
					db.control_picture(account,picture,function(suc){
						if(suc){
							console.log(" picture5  have +  1");
						}
						else
							console.log("init fail");
					});
					tip1="恭喜你找到一个小伙伴：飞鱼,该图鉴已放入背包";
					var msg5="恭喜你找到一个小伙伴：飞鱼";
					db.diary_event(account,msg5,t,function(suc){
						if(suc)
						console.log("success");
						else
						console.log("fali");
					});

				}
				else if(explore_1[0]==6){
					db.control_picture(account,picture,function(suc){
						if(suc){
							console.log(" picture6  have +  1");
						}
						else
							console.log("init fail");
					});
					tip1="恭喜你找到一个小伙伴：海龟,该图鉴已放入背包";
					var msg6="恭喜你找到一个小伙伴：海龟";
					db.diary_event(account,msg6,t,function(suc){
						if(suc)
						console.log("success");
						else
						console.log("fali");
					});

				}
				else if(explore_1[0]==7){
					db.control_picture(account,picture,function(suc){
						if(suc){
							console.log(" picture7  have +  1");
						}
						else
							console.log("init fail");
					});
					tip1="恭喜你找到一个小伙伴：海马,该图鉴已放入背包";
					var msg7="恭喜你找到一个小伙伴：海马";
					db.diary_event(account,msg7,t,function(suc){
						if(suc)
						console.log("success");
						else
						console.log("fali");
					});

				}
				else if(explore_1[0]==8){
					db.control_picture(account,picture,function(suc){
						if(suc){
							console.log(" picture8  have +  1");
						}
						else
							console.log("init fail");
					});
					tip1="恭喜你找到一个小伙伴：海豚,该图鉴已放入背包";
					var msg8="恭喜你找到一个小伙伴：海豚";
					db.diary_event(account,msg8,t,function(suc){
						if(suc)
						console.log("success");
						else
						console.log("fali");
					});

				}
				else{
					console.log("随机值为0，不显示图鉴");
				}
				db.get_explore_num_opengame(account,function(data){
					if(data.explore_num >0){
				db.update_explorenum(account,function(suc){
					if(suc)
						console.log(" explore_num  have  -1");
					else
					console.log("explore_num  update fali");
				});
			}
			else{
				console.log("探索次数已用尽");
			}
		});

			}
			db.get_explore_num_opengame(account,function(data){
				
				var ret={
					e:data.explore_num,
					p:explore_1[0],
					tip:tip1,

				};
				http.send(res,0,"",ret);
			});
		});
		
		
		app.get('/explore2_event',function(req,res){
			var account=req.query.account;
		      var explore=req.query.explore;
			   console.log(explore+"号池");
				 var explore_2=[0,9,10,11,12,13,14,15,16,17];
				 var tip1=null;
			   if(explore==2){
				function shuffle(a) {
					var len = a.length;
					for (var i = 0; i < len - 1; i++) {
						var index = parseInt(Math.random() * (len - i));
						var temp = a[index];
						a[index] = a[len - i - 1];
						a[len - i - 1] = temp;
					}
				}
				shuffle(explore_2);
				// console.log( "出现"+explore_2[0]);
				var picturet='picture'+explore_2[0];
				console.log("出现"+picturet);
				var date = new Date();
							var year = date.getFullYear();
							var month = date.getMonth()+1;
							var day = date.getDate();
							var hour = date.getHours();
							var minute = date.getMinutes();
							var second = date.getSeconds();
							var t= year+'年'+month+'月'+day+'日 '+hour+':'+minute+':'+second;
					if(explore_2[0]==9){
						db.control_picture(account,picturet,function(suc){
							if(suc){
								console.log(" picture9  have +  1");
							}
							else
								console.log("init fail");
						});
						tip1="恭喜你找到一个小伙伴：海星,该图鉴已放入背包";
						var msg9="恭喜你找到一个小伙伴：海星";
						db.diary_event(account,msg9,t,function(suc){
							if(suc)
							console.log("success");
							else
							console.log("fali");
						});
					}
					else if(explore_2[0]==10){
						db.control_picture(account,picturet,function(suc){
							if(suc){
								console.log(" picture10  have +  1");
							}
							else
								console.log("init fail");
						});
						tip1="恭喜你找到一个小伙伴：蝴蝶鱼,该图鉴已放入背包";
						var msg10="恭喜你找到一个小伙伴：蝴蝶鱼";
						db.diary_event(account,msg10,t,function(suc){
							if(suc)
							console.log("success");
							else
							console.log("fali");
						});
	
					}
					else if(explore_2[0]==11){
						db.control_picture(account,picturet,function(suc){
							if(suc){
								console.log(" picture11  have +  1");
							}
							else
								console.log("init fail");
						});
						tip1="恭喜你找到一个小伙伴：金枪鱼,该图鉴已放入背包";
						var msg11="恭喜你找到一个小伙伴：金枪鱼";
						db.diary_event(account,msg11,t,function(suc){
							if(suc)
							console.log("success");
							else
							console.log("fali");
						});
	
					}
					else if(explore_2[0]==12){
						db.control_picture(account,picturet,function(suc){
							if(suc){
								console.log(" picture12  have +  1");
							}
							else
								console.log2("init fail");
						});
						tip1="恭喜你找到一个小伙伴：鲸,该图鉴已放入背包";
						var msg12="恭喜你找到一个小伙伴：鲸";
						db.diary_event(account,msg12,t,function(suc){
							if(suc)
							console.log("success");
							else
							console.log("fali");
						});
	
					}
					else if(explore_2[0]==13){
						db.control_picture(account,picturet,function(suc){
							if(suc){
								console.log(" picture13  have +  1");
							}
							else
								console.log("init fail");
						});
						tip1="恭喜你找到一个小伙伴：龙虾,该图鉴已放入背包";
						var msg13="恭喜你找到一个小伙伴：龙虾";
						db.diary_event(account,msg13,t,function(suc){
							if(suc)
							console.log("success");
							else
							console.log("fali");
						});
	
					}
					else if(explore_2[0]==14){
						db.control_picture(account,picturet,function(suc){
							if(suc){
								console.log(" picture14  have +  1");
							}
							else
								console.log("init fail");
						});
						tip1="恭喜你找到一个小伙伴：螃蟹,该图鉴已放入背包";
						var msg14="恭喜你找到一个小伙伴：螃蟹";
						db.diary_event(account,msg14,t,function(suc){
							if(suc)
							console.log("success");
							else
							console.log("fali");
						});
	
					}
					else if(explore_2[0]==15){
						db.control_picture(account,picturet,function(suc){
							if(suc){
								console.log(" picture15  have +  1");
							}
							else
								console.log("init fail");
						});
						tip1="恭喜你找到一个小伙伴：鲨鱼,该图鉴已放入背包";
						var msg15="恭喜你找到一个小伙伴：鲨鱼";
						db.diary_event(account,msg15,t,function(suc){
							if(suc)
							console.log("success");
							else
							console.log("fali");
						});
	
					}
					else if(explore_2[0]==16){
						db.control_picture(account,picturet,function(suc){
							if(suc){
								console.log(" picture16  have +  1");
							}
							else
								console.log("init fail");
						});
						tip1="恭喜你找到一个小伙伴：扇贝,该图鉴已放入背包";
						var msg16="恭喜你找到一个小伙伴：扇贝";
						db.diary_event(account,msg16,t,function(suc){
							if(suc)
							console.log("success");
							else
							console.log("fali");
						});
	
					}
					else if(explore_2[0]==17){
						db.control_picture(account,picturet,function(suc){
							if(suc){
								console.log(" picture17 have +  1");
							}
							else
								console.log("init fail");
						});
						tip1="恭喜你找到一个小伙伴：水母,该图鉴已放入背包";
						var msg17="恭喜你找到一个小伙伴：水母";
						db.diary_event(account,msg17,t,function(suc){
							if(suc)
							console.log("success");
							else
							console.log("fali");
						});
	
					}
					else{
						console.log("随机值为0，不显示图鉴");
					}
					db.get_explore_num_opengame(account,function(data){
						if(data.explore_num>0){
					db.update_explorenum(account,function(suc){
						if(suc)
							console.log(" explore_num  have  -1");
						else
						console.log("explore_num  update fali");
					});
				}
				else{
					console.log("探索次数已用尽");
				}
			});

				}
				db.get_explore_num_opengame(account,function(data){
					var ret={
						e:data.explore_num,
						p:explore_2[0],
						tip:tip1,
					};
					http.send(res,0,"",ret);
				});
		});

		app.get('/explore3_event',function(req,res){
			var account=req.query.account;
		      var explore=req.query.explore;
			   console.log(explore+"号池");
				 var explore_3=[0,18,19,20,21,22,23,24,25];
				 var tip1=null;

			   if(explore==3){
			function shuffle(a) {
				var len = a.length;
				for (var i = 0; i < len - 1; i++) {
					var index = parseInt(Math.random() * (len - i));
					var temp = a[index];
					a[index] = a[len - i - 1];
					a[len - i - 1] = temp;
				}
			}
			shuffle(explore_3);
			// console.log("出现"+explore_3[0]+"号图鉴");
			var picturett='picture'+explore_3[0];
			console.log("出现"+picturett);
			var date = new Date();
							var year = date.getFullYear();
							var month = date.getMonth()+1;
							var day = date.getDate();
							var hour = date.getHours();
							var minute = date.getMinutes();
							var second = date.getSeconds();
							var t= year+'年'+month+'月'+day+'日 '+hour+':'+minute+':'+second;
			
				if(explore_3[0]==18){
					db.control_picture(account,picturett,function(suc){
						if(suc){
							console.log(" picture18  have +  1");
						}
						else
							console.log("init fail");
					});
					tip1="恭喜你找到一个小伙伴：乌贼,该图鉴已放入背包";
					var msg18="恭喜你找到一个小伙伴：乌贼";
					db.diary_event(account,msg18,t,function(suc){
						if(suc)
						console.log("success");
						else
						console.log("fali");
					});

				}
				else if(explore_3[0]==19){
					db.control_picture(account,picturett,function(suc){
						if(suc){
							console.log(" picture19  have +  1");
						}
						else
							console.log("init fail");
					});
					tip1="恭喜你找到一个小伙伴：小丑鱼,该图鉴已放入背包";
					var msg19="恭喜你找到一个小伙伴：小丑鱼";
					db.diary_event(account,msg19,t,function(suc){
						if(suc)
						console.log("success");
						else
						console.log("fali");
					});

				}
				else if(explore_3[0]==20){
					db.control_picture(account,picturett,function(suc){
						if(suc){
							console.log(" picture20  have +  1");
						}
						else
							console.log("init fail");
					});
					tip1="恭喜你找到一个小伙伴：章鱼,该图鉴已放入背包";
					var msg20="恭喜你找到一个小伙伴：章鱼";
					db.diary_event(account,msg20,t,function(suc){
						if(suc)
						console.log("success");
						else
						console.log("fali");
					});

				}
				else if(explore_3[0]==21){
					db.control_picture(account,picturett,function(suc){
						if(suc){
							console.log(" picture21  have +  1");
						}
						else
							console.log("init fail");
					});
					tip1="恭喜您获得了关于海豹生活习惯的活动1,该活动已放入背包";
					var msg21="恭喜您获得了关于海豹生活习惯的活动1";
					db.diary_event(account,msg21,t,function(suc){
						if(suc)
						console.log("success");
						else
						console.log("fali");
					});

					

				}
				else if(explore_3[0]==22){
					db.control_picture(account,picturett,function(suc){
						if(suc){
							console.log(" picture22  have +  1");
						}
						else
							console.log("init fail");
					});
					tip1="恭喜您获得了关于海豹生活习惯的活动2,该活动已放入背包";
					var msg22="恭喜您获得了关于海豹生活习惯的活动2";
					db.diary_event(account,msg22,t,function(suc){
						if(suc)
						console.log("success");
						else
						console.log("fali");
					});

				}
				else if(explore_3[0]==23){
					db.control_picture(account,picturett,function(suc){
						if(suc){
							console.log(" picture23  have +  1");
						}
						else
							console.log("init fail");
					});
					tip1="恭喜您获得了关于海豹生活习惯的活动3,该活动已放入背包";
					var msg23="恭喜您获得了关于海豹生活习惯的活动3";
					db.diary_event(account,msg23,t,function(suc){
						if(suc)
						console.log("success");
						else
						console.log("fali");
					});
					

				}
				else if(explore_3[0]==24){
					db.control_picture(account,picturett,function(suc){
						if(suc){
							console.log(" picture24  have +  1");
						}
						else
							console.log("init fail");
					});
					tip1="恭喜您获得了关于海豹生活习惯的活动4,该活动已放入背包";
					var msg24="恭喜您获得了关于海豹生活习惯的活动4";
					db.diary_event(account,msg24,t,function(suc){
						if(suc)
						console.log("success");
						else
						console.log("fali");
					});

				}
				else if(explore_3[0]==25){
					db.control_picture(account,picturett,function(suc){
						if(suc){
							console.log(" picture25  have +  1");
						}
						else
							console.log("init fail");
					});
					tip1="恭喜您获得了关于海豹生活习惯的活动5,该活动已放入背包";
					var msg25="恭喜您获得了关于海豹生活习惯的活动5";
					db.diary_event(account,msg25,t,function(suc){
						if(suc)
						console.log("success");
						else
						console.log("fali");
					});

				}
				else{
					console.log("随机值为0，不显示图鉴");
				}
				db.get_explore_num_opengame(account,function(data){
					if(data.explore_num>0){
				db.update_explorenum(account,function(suc){
					if(suc)
						console.log(" explore_num  have  -1");
					else
					console.log("explore_num  update fali");
				});
			}
			else{
				console.log("探索次数已用尽");
			}
		});
			}

			db.get_explore_num_opengame(account,function(data){
				// var e=data.explore_num;
				var ret={
					e:data.explore_num,
					p:explore_3[0],
					tip:tip1,
				};
				http.send(res,0,"",ret);
			});
			// http.send(res,0,"explore3  info all send",explore_3[0]);
			// console.log(explore_3[0]);
		});




		


		//访问探索的界面（包括探索次数，opengame1）
	app.get('/getExploreNum',function(req,res){
		var account=req.query.account;
		//探索次数 6s加1  上限4
		var  interal5=setInterval(function(){
			db.get_explore_num_opengame(account,function(data){
				if(data.explore_num<4){

			db.update_explorenum1(account,function(suc){
				if(suc)
				console.log(" 今日探索次数已 +1");
				else
				console.log("今日探索次数 +1 失败");
			});
		}
		else{
			clearInterval(interal5);
			console.log("今日探索次数已加上限");
		}
	});
		},180000);//3分钟涨一次探索次数

		
		db.get_explore_num_opengame(account,function(data){
			db.cha_picture(account,function(data1){
				var p1=data1.picture1;
				if(p1!=0){
					db.control_open_game1(account,function(suc){
						if(suc)
						console.log("open_game1 变为0 游戏功能解锁");
						else
						console.log("open_game1 init fail");
					});
					return;
				}
				
				else if(data1.picture2!=0){
					db.control_open_game1(account,function(suc){
						if(suc)
						console.log("open_game1 变为0 游戏功能解锁");
						else
						console.log("open_game1 init fail");
					});
					return;
				}
				else if(data1.picture3!=0){
					db.control_open_game1(account,function(suc){
						if(suc)
						console.log("open_game1 变为0 游戏功能解锁");
						else
						console.log("open_game1 init fail");
					});
					return;
				}
				else if(data1.picture4!=0){
					db.control_open_game1(account,function(suc){
						if(suc)
						console.log("open_game1 变为0 游戏功能解锁");
						else
						console.log("open_game1 init fail");
					});
					return;
				}
				else if(data1.picture5!=0){
					db.control_open_game1(account,function(suc){
						if(suc)
						console.log("open_game1 变为0 游戏功能解锁");
						else
						console.log("open_game1 init fail");
					});
					return;
				}
				else if(data1.picture6!=0){
					db.control_open_game1(account,function(suc){
						if(suc)
						console.log("open_game1 变为0 游戏功能解锁");
						else
						console.log("open_game1 init fail");
					});
					return;
				}
				else if(data1.picture7!=0){
					db.control_open_game1(account,function(suc){
						if(suc)
						console.log("open_game1 变为0 游戏功能解锁");
						else
						console.log("open_game1 init fail");
					});
					return;
				}
				else if(data1.picture8!=0){
					db.control_open_game1(account,function(suc){
						if(suc)
						console.log("open_game1 变为0 游戏功能解锁");
						else
						console.log("open_game1 init fail");
					});
					return;
				}
				else if(data1.picture9!=0){
					db.control_open_game1(account,function(suc){
						if(suc)
						console.log("open_game1 变为0 游戏功能解锁");
						else
						console.log("open_game1 init fail");
					});
					return;
				}
				else if(data1.picture10!=0){
					db.control_open_game1(account,function(suc){
						if(suc)
						console.log("open_game1 变为0 游戏功能解锁");
						else
						console.log("open_game1 init fail");
					});
					return;
				}
				else if(data1.picture11!=0){
					db.control_open_game1(account,function(suc){
						if(suc)
						console.log("open_game1 变为0 游戏功能解锁");
						else
						console.log("open_game1 init fail");
					});
					return;
				}
				else if(data1.picture12!=0){
					db.control_open_game1(account,function(suc){
						if(suc)
						console.log("open_game1 变为0 游戏功能解锁");
						else
						console.log("open_game1 init fail");
					});
					return;
				}
				else if(data1.picture13!=0){
					db.control_open_game1(account,function(suc){
						if(suc)
						console.log("open_game1 变为0 游戏功能解锁");
						else
						console.log("open_game1 init fail");
					});
					return;
				}
				else if(data1.picture14!=0){
					db.control_open_game1(account,function(suc){
						if(suc)
						console.log("open_game1 变为0 游戏功能解锁");
						else
						console.log("open_game1 init fail");
					});
					return;
				}
				else if(data1.picture15!=0){
					db.control_open_game1(account,function(suc){
						if(suc)
						console.log("open_game1 变为0 游戏功能解锁");
						else
						console.log("open_game1 init fail");
					});
					return;
				}
				else if(data1.picture16!=0){
					db.control_open_game1(account,function(suc){
						if(suc)
						console.log("open_game1 变为0 游戏功能解锁");
						else
						console.log("open_game1 init fail");
					});
					return;
				}
				else if(data1.picture17!=0){
					db.control_open_game1(account,function(suc){
						if(suc)
						console.log("open_game1 变为0 游戏功能解锁");
						else
						console.log("open_game1 init fail");
					});
					return;
				}
				else if(data1.picture18!=0){
					db.control_open_game1(account,function(suc){
						if(suc)
						console.log("open_game1 变为0 游戏功能解锁");
						else
						console.log("open_game1 init fail");
					});
					return;
				}
				else if(data1.picture19!=0){
					db.control_open_game1(account,function(suc){
						if(suc)
						console.log("open_game1 变为0 游戏功能解锁");
						else
						console.log("open_game1 init fail");
					});
					return;
				}
				else if(data1.picture20!=0){
					db.control_open_game1(account,function(suc){
						if(suc)
						console.log("open_game1 变为0 游戏功能解锁");
						else
						console.log("open_game1 init fail");
					});
					return;
				}
				else if(data1.picture21!=0){
					db.control_open_game1(account,function(suc){
						if(suc)
						console.log("open_game1 变为0 游戏功能解锁");
						else
						console.log("open_game1 init fail");
					});
					return;
				}
				else if(data1.picture22!=0){
					db.control_open_game1(account,function(suc){
						if(suc)
						console.log("open_game1 变为0 游戏功能解锁");
						else
						console.log("open_game1 init fail");
					});
					return;
				}
				else if(data1.picture23!=0){
					db.control_open_game1(account,function(suc){
						if(suc)
						console.log("open_game1 变为0 游戏功能解锁");
						else
						console.log("open_game1 init fail");
					});
					return;
				}
				else if(data1.picture24!=0){
					db.control_open_game1(account,function(suc){
						if(suc)
						console.log("open_game1 变为0 游戏功能解锁");
						else
						console.log("open_game1 init fail");
					});
					return;
				}
				else if(data1.picture25!=0){
					db.control_open_game1(account,function(suc){
						if(suc)
						console.log("open_game1 变为0 游戏功能解锁");
						else
						console.log("open_game1 init fail");
					});
					return;
				}
				else
				console.log("您还没有任何图鉴，不能解锁游戏");

			});
		
			var ret={
				e:data.explore_num,
				o:data.open_game1,
			};
			console.log("剩余的探索次数"+data.explore_num+"open_game1"+data.open_game1);
			http.send(res,0," ",ret);
		});
	});
	//换皮肤
	app.get('/alertDress',function(req,res){
		var account=req.query.account;
		var pifu=req.query.dress;
		db.gaipifu(account,pifu,function(suc){
			if(suc)
			console.log("pifu  update success");
			else
			console.log("pifu  update false");
		});
		var ret={};
		http.send(res,0," 皮肤更换成功",ret);
	});
		//背包
		app.get('/bag',function(req,res){
			var account=req.query.account;
			db.cha_picture(account,function(data){
				console.log("背包*********************");
			//背包要发给前端的值
				var ret={
					1:data.picture1,
					2:data.picture2,
					3:data.picture3,
					4:data.picture4,
					5:data.picture5,
					6:data.picture6,
					7:data.picture7,
				  8:data.picture8,
					9:data.picture9,
					10:data.picture10,
					11:data.picture11,
					12:data.picture12,
					13:data.picture13,
					14:data.picture14,
					15:data.picture15,
					16:data.picture16,
					17:data.picture17,
					18:data.picture18,
					19:data.picture19,
					20:data.picture20,
					21:data.picture21,
					22:data.picture22,
					23:data.picture23,
					24:data.picture24,
					25:data.picture25,
				};
				http.send(res,0," ",ret);
		});
	});
	app.get('/picture_j',function(req,res){
		var account =req.query.account;
		var pnum=req.query.p;
		var data1=null;
		var name1=null;
		db.cha_tujiandaj(account,function(data){
			db.cha_picture(account,function(data7){			
			if(pnum==1){
				 data1=data.p1j;
				 name1="比目鱼";
				 
			}
			else if(pnum==2){
				 data1=data.p2j;
				 name1="蝙蝠鱼";
			}
			else if(pnum==3){
				data1=data.p3j;
				name1="灯笼鱼";

		 }
		 else if(pnum==4){
			data1=data.p4j;
			name1="翻车鱼";
	 }
	 else if(pnum==5){
		data1=data.p5j;
		name1="飞鱼";
			}  
			else if(pnum==6){
				data1=data.p6j;
				name1="海龟";
		 } 
		 else if(pnum==7){
			data1=data.p7j;
			name1="海马";
	 }
	 else if(pnum==8){
		data1=data.p8j;
		name1="海豚";
		 }
		 else if(pnum==9){
			data1=data.p9j;
			name1="海星";
			 }
			 else if(pnum==10){
				data1=data.p10j;
				name1="蝴蝶鱼";
				 }
				 else if(pnum==11){
					 data1=data.p11j;
					 name1="金枪鱼";
				 }
				 else if(pnum==12){
					data1=data.p12j;
					name1="鲸";
				}
				else if(pnum==13){
					data1=data.p13j;
					name1="龙虾";
				}
				else if(pnum==14){
					data1=data.p14j;
					name1="螃蟹";
				}
				else if(pnum==15){
					data1=data.p15j;
					name1="鲨鱼";
				}
				else if(pnum==16){
					data1=data.p16j;
					name1="扇贝";
				}
				else if(pnum==17){
					data1=data.p17j;
					name1="水母";
				}
				else if(pnum==18){
					data1=data.p18j;
					name1="乌贼";
				}
				else if(pnum==19){
					data1=data.p19j;
					name1="小丑鱼";
				}
				else if(pnum==20){
					data1=data.p20j;
					name1="章鱼";
				}
				else if(pnum==21){
					data1=data7.pj21;
					name1="大胃王";
				}
				else if(pnum==22){
					data1=data7.pj22;
					name1="潜水能手";
				}
				else if(pnum==23){
					data1=data7.pj23;
					name1="家庭小分队";
				}
				else if(pnum==24){
					data1=data7.pj24;
					name1="海豹的体态";
				}
				else if(pnum==25){
					data1=data7.pj25;
					name1="视妻如命";
				}
				var ret={
					data2:data1,
					name:name1,
				}
				http.send(res,0,"",ret);
				console.log("图片的大简介已发送");
			});	
		});
	});

	//日记
	app.get('/diary',function(req,res){
		var account=req.query.account;
		db.cha_diary(account,function(data){
			
			if(data){
					var ret={
						riji:data,
					};
				 http.send(res,0,"",ret);
				 return;
			}
			else{
				http.send(res,1,"send fali ");
				return;
			}
		});
	});
  



		//游戏1
		app.get('/game1',function(req,res){
			var account=req.query.account;
			var arr=[];
			db.cha_picture(account,function(data){
				console.log("game1----------------------------------------");
				 console.log(data);
				var p1=data.picture1;
				if(p1!=0){
					arr.push(1);
				}
				else{
					console.log("picture1 not exsit");
				}
				var p2=data.picture2;
				if(p2!=0){
					arr.push(2);
				}
				else{
					console.log("picture2 not exsit");
				}
				var p3=data.picture3;
				if(p3!=0){
					arr.push(3);
				}
				else{
					console.log("picture3 not exsit");
				}
				var p4=data.picture4;
				if(p4!=0){
					arr.push(4);
				}
				else{
					console.log("picture4 not exsit");
				}
				var p5=data.picture5;
				if(p5!=0){
					arr.push(5);
				}
				else{
					console.log("picture5 not exsit");
				}
				var p6=data.picture6;
				if(p6!=0){
					arr.push(6);
				}
				else{
					console.log("picture6 not exsit");
				}
				var p7=data.picture7;
				if(p7!=0){
					arr.push(7);
				}
				else{
					console.log("picture7 not exsit");
				}
				var p8=data.picture8;
				if(p8!=0){
					arr.push(8);
				}
				else{
					console.log("picture8 not exsit");
				}
				var p9=data.picture9;
				if(p9!=0){
					arr.push(9);
				}
				else{
					console.log("picture9 not exsit");
				}
				var p10=data.picture10;
				if(p10!=0){
					arr.push(10);
				}
				else{
					console.log("picture10 not exsit");
				}
				var p11=data.picture11;
				if(p11!=0){
					arr.push(11);
				}
				else{
					console.log("picture11 not exsit");
				}
				var p12=data.picture12;
				if(p12!=0){
					arr.push(12);
				}
				else{
					console.log("picture12 not exsit");
				}
				var p13=data.picture13;
				if(p13!=0){
					arr.push(13);
				}
				else{
					console.log("picture13 not exsit");
				}
				var p14=data.picture14;
				if(p14!=0){
					arr.push(14);
				}
				else{
					console.log("picture14 not exsit");
				}
				var p15=data.picture15;
				if(p15!=0){
					arr.push(15);
				}
				else{
					console.log("picture15 not exsit");
				}
				var p16=data.picture8;
				if(p16!=0){
					arr.push(16);
				}
				else{
					console.log("picture16 not exsit");
				}
				var p17=data.picture17;
				if(p17!=0){
					arr.push(17);
				}
				else{
					console.log("picture17 not exsit");
				}
				var p18=data.picture18;
				if(p18!=0){
					arr.push(18);
				}
				else{
					console.log("picture18 not exsit");
				}
				var p19=data.picture19;
				if(p19!=0){
					arr.push(19);
				}
				else{
					console.log("picture19 not exsit");
				}
				var p20=data.picture20;
				if(p20!=0){
					arr.push(20);
				}
				else{
					console.log("picture20 not exsit");
				}
				function shuffle(a) {
					var len = a.length;
					for (var i = 0; i < len - 1; i++) {
						var index = parseInt(Math.random() * (len - i));
						var temp = a[index];
						a[index] = a[len - i - 1];
						a[len - i - 1] = temp;
					}
				}
				shuffle(arr);
				//  console.log(arr[0]);

				var  interal6=setInterval(function(){
					db.getgame1_num(account,function(data){
						if(data.game1num<6){
					db.update_game1numj(account,function(suc){
						if(suc)
						console.log(" 今日游戏次数已+1");
						else
						console.log("今日游戏次数+1 失败");
					});
				}
				else{
					clearInterval(interal6);
					console.log("今日游戏次数已加上限");
				}
			});
				},600000);//10分钟涨一次


				db.getgame1explorenum(account,function(data){

					db.cha_picture(account,function(data1){
						var pj=0;
						if(arr[0]==1){
							pj=data1.pj1;
						}
						else if(arr[0]==2){
							pj=data1.pj2;
						}
						else if(arr[0]==3){
							pj=data1.pj3;
						}
						else if(arr[0]==4){
							pj=data1.pj4;
						}
						else if(arr[0]==5){
							pj=data1.pj5;
						}
						else if(arr[0]==6){
							pj=data1.pj6;
						}
						else if(arr[0]==7){
							pj=data1.pj7;
						}
						else if(arr[0]==8){
							pj=data1.pj8;
						}
						else if(arr[0]==9){
							pj=data1.pj9;
						}
						else if(arr[0]==10){
							pj=data1.pj10;
						}
						else if(arr[0]==11){
							pj=data1.pj11;
						}
						else if(arr[0]==12){
							pj=data1.pj12;
						}
						else if(arr[0]==13){
							pj=data1.pj13;
						}
						else if(arr[0]==14){
							pj=data1.pj14;
						}
						else if(arr[0]==15){
							pj=data1.pj15;
						}
						else if(arr[0]==16){
							pj=data1.pj16;
						}
						else if(arr[0]==17){
							pj=data1.pj17;
						}
						else if(arr[0]==18){
							pj=data1.pj18;
						}
						else if(arr[0]==19){
							pj=data1.pj19;
						}
						else if(arr[0]==20){
							pj=data1.pj20;
						}
						var ret={
							g:data.game1num,
						e:data.explore_num,
						a:arr[0],
						o:data.open_game1,//open_game1初值为1
						p:pj,
						
					 };

					 http.send(res,0," 发游戏次数",ret);
					});
				});
			});
		});
	
		app.get('/game1Over',function(req,res){
			var account=req.query.account;
			var success=req.query.success;
			console.log("前端发给我的success值"+success);
			var date = new Date();
			var year = date.getFullYear();
			var month = date.getMonth()+1;
			var day = date.getDate();
			var hour = date.getHours();
			var minute = date.getMinutes();
			var second = date.getSeconds();
			var t= year+'年'+month+'月'+day+'日 '+hour+':'+minute+':'+second;
				if(success == 1){
					db.getgame1_num(account,function(data){
						var g=data.game1num;
						if(g >=1){
										db.update_game1num(account,function(suc){
											if(suc)
											console.log("game1次数已 -1");
											else
											console.log("gamenum-1  update fail");
										});
									}
									else if(g==0||g<0)
									console.log("游戏次数<1,不能再减");
								});
					db.get_explore_num_opengame(account,function(data){
						if(data.explore_num<4){
					db.update_explorenum1(account,function(suc){
						if(suc)
						console.log("游戏赢了，探索次数+1");
						else
						console.log("explorenum update fail");

					});
				}
					else{
					console.log("探索次数已上限，不再增加");}
					});
					var msg1="您刚刚在游戏环节赢了，好棒";
					db.diary_event(account,msg1,t,function(suc){
						if(suc)
						console.log("success");
						else
						console.log("fali");
					});
				}
				else if(success == 0){
					db.getgame1_num(account,function(data1){
						var g1=data1.game1num;
						if(g1 >=1){
										db.update_game1num(account,function(suc1){
											if(suc1)
											console.log("game1次数已 -1");
											else
											console.log("gamenum-1  update fail");
										});
									}
									else if(g1==0||g1 <0)
									console.log("游戏次数<1,不能再减");
								});
					console.log("游戏输了，探索次数不变");
					var msg2="很遗憾您刚刚在游戏环节输了，别灰心，再接再厉";
					db.diary_event(account,msg2,t,function(suc){
						if(suc)
						console.log("success");
						else
						console.log("fali");
					});
				}
			http.send(res,0,"游戏按完了 ");
		});





// 探索神秘海域


app.get('/login_1', function (req, res) {
	var userid = req.query.userid;
	var password = req.query.password;

	db.user_login(userid, password, function (info) {
		if (info.exist == 0) {
			var data = info.data;
			send(res, { exist: 0, data: data })
		} else if (info.exist == 1)
			send(res, { exist: 1, data: null });
		else if (info.exist == 2)
			send(res, { exist: 2, data: null });
	});
});

app.get('/register_1', function (req, res) {
	var userid = req.query.userid;
	var password = req.query.password;

	db.user_register(userid, password, function (success) {
		if (success) {
			send(res, true);
		} else {
			send(res, false);
		}
	})
});

app.get('/pass', function (req, res) {
	var userid = req.query.userid;
	var sceneCount = req.query.sceneCount;
	db.user_pass(userid, sceneCount, function (code) {
		if (code == null) {
			send(res, { errcode: 2 })
		}
		else
			send(res, code);
	})

});

app.get('/getQuestion', function (req, res) {
	db.test_question(function (data) {
		var stem = [];
		var potion = [];
		var validity = [];
		for (var i = 0; i < data.length; i++) {
			stem.push(data[i].stem);
			potion.push(data[i].potion.split(","));
			validity.push(data[i].validity.split(","))
		}
		send(res, { stem: stem, potion: potion, validity, validity })
	})
})

app.get('/get_achieve', function (req, res) {
	var userid = req.query.userid;
	var achieveId = req.query.achieveId;
	db.update_achieve(userid, achieveId, function (errcode) {
		send(res, { errcode: errcode });
	})
})

	