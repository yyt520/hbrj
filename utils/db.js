var mysql=require("mysql");  
var crypto = require('./crypto');

var pool = null;

function nop(a,b,c,d,e,f,g){

}
  
// function generateUserId() {//形成用户id
//     var Id = "";
//     for (var i = 0; i < 6; ++i) {
//         if (i > 0) {
//             Id += Math.floor(Math.random() * 10);
//         } else {
//             Id += Math.floor(Math.random() * 9) + 1;
//         }
//     }
//     return Id;
// }

function query(sql,callback){  
    pool.getConnection(function(err,conn){  
        if(err){  
            callback(err,null,null);  
        }else{  
            conn.query(sql,function(qerr,vals,fields){  
                //释放连接  
                conn.release();  
                //事件驱动回调  
                callback(qerr,vals,fields);  
            });  
        }  
    });  
};

exports.init = function(config){
    pool = mysql.createPool({  
        host: config.HOST,
        user: config.USER,
        password: config.PSWD,
        database: config.DB,
        port: config.PORT,
    });
};

exports.is_account_exist = function(account,callback){//参数中都有callback  前面的参数是看sql语句中需要那些变量
    callback = callback == null? nop:callback;//这条是每个操作都有的
    if(account == null){    //这个判断也是要有的   参数都是要判断的
        callback(false);    //这个 回调callback（）里也是有参数的吗？
        return;
    }

    var sql = 'SELECT * FROM t_accounts WHERE account = "' + account + '"';
    query(sql, function(err, rows, fields) {    //这三个变量的意思   查询也是第一个参数 sql  第二个 function（）
        if (err) {
            callback(false);
            throw err;
        }
        else{
            if(rows.length > 0){
                callback(true);
                console.log(rows);
            }
            else{
                callback(false);
            }
        }
    });
};


//登陆的数据库验证
exports.is_password_true = function(account,password,callback){
    callback = callback == null? nop:callback;
    var sql = 'SELECT password FROM accounts WHERE account = "' + account + '"';
    query(sql, function(err, rows, fields) {
        //   if (err) {
        //      callback(false);
        //      throw err;
        //   }
          if(password != null){

            //  var psw = crypto.md5(password);
             if(rows[0].password == password){
                callback(true);
                // console.log(rows[0]);
                 console.log("password is true");
                return;
            }  
            if(rows[0].password !== password) {
                callback(false);
                console.log("password is  false");
                return;
            }
        

        // callback(true); 

}
    });
};
exports.init_event=function(account,callback){
    callback=callback==null? nop:callback;
    if(account==null){
        callback(null);
        return;
    }
    var sql='SELECT event1,event2,event3,event4,event5,event6,event7,event8 FROM users WHERE account="'+ account +'"';
    query(sql,function(err,rows,fields){
        if(err){
            callback(null);
            return;
        }
        if(rows[0]=null){
            
            callback(true);
            // console.log("**********************************");
            console.log(rows[0]);
            return;
        }
        callback(false);


    });

};
exports.init_event_value=function(account,callback){
    callback = callback ==null? nop:callback;
    if(account==null){
        callback(null);
        return;
    }
    var sql='UPDATE users SET event1 =' + 0 +  ' ,event2 =' + 0 + ',event3 ='+ 0 +',event4 ='+ 0 +',event5 ='+ 0 +',event6 ='+ 0 +',event7 ='+ 0 +',event8 ='+ 0 +' WHERE account=  '+ account;
    // 'UPDATE users SET health_index = ' + 10 + ' WHERE account = ' + account ;
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows.affectedRows > 0);
            return;
        }
       
    });
};
exports.init_question=function(account,callback){
    callback=callback==null?nop:callback;
    // var sql='UPDATE users SET q1=" 下列什么鱼的眼睛长在身体的同一侧 " , q1x1="小丑鱼" , q1x2="比目鱼" ,q1t="2" , q1j="比目鱼又叫鲽鱼，硬骨鱼纲鲽形目鱼类的统称。体甚侧扁，呈长椭圆形、卵圆形或长舌形 " , q2="下列哪种动物的智商最高" , q2x1="海豹" ,q2x2="海豚" ,q2t="2" , q2j=" 海洋学家认为，海豚与人类一样也有学习能力，有海中"智叟"的称号 " , q3="2000年8月20号,广东大亚湾发生赤潮,下列各因素与之关系不大的是" ,q3x1="工业污水" ,q3x2="海流运动微弱" ,q3t="2" ,q3j="由人类活动造成海洋赤潮的主要原因有：工业污水，生活污水" , "     WHERE account=  '+ account;
    // var sql='UPDATE users SET q1="下列什么鱼的眼睛长在身体的同一侧", q1x1="小丑鱼", q1x2="比目鱼",q1t="2", q1j="比目鱼又叫鲽鱼，硬骨鱼纲鲽形目鱼类的统称。体甚侧扁，呈长椭圆形、卵圆形或长舌形，最大体长可达5M。", q2="下列哪种动物的智商最高？", q2x1="海豹",q2x2="海豚",q2t="2", q2j="海洋学家认为，海豚与人类一样也有学习能力，甚至比黑猩猩还略胜一筹，有海中"智叟"的称号", q3="2000年8月20号,广东大亚湾发生赤潮,下列各因素与之关系不大的是",q3x1="工业污水",q3x2="海流运动微弱",q3t="2",q3j="由人类活动造成海洋赤潮的主要原因有：工业污水，海洋水产养殖区，生活污水", q4="下列哪些物质不会造成对海洋的污染？",q4x1="石油及其产品",q4x2="冰川融化水",q4t="2",q4j="冰川融化水相当于海水，并不是污水，但是石油对海洋有极大的污染" ,q5="世界海洋渔获量最多的国家是哪俩个国家？",q5x1="中国和日本",q5x2="中国和美国",q5t="1",q5j="日本处在洋流交界处,海洋鱼会因为海水温度的关系大量的聚集到日本附近,比起日本，中国的渔获量开始降低", q6="世界海洋日是每年的哪天？",q6x1="6月8日",q6x2="7月19日",q6t="1",q6j="2018年世界海洋日的主题是“清洁我们的海洋”，行动重点是防止塑料污染，鼓励寻找解决方案，改善海洋的健康。", q7="海豹皮肤颜色随年龄的变化是怎样的？",q7x1="幼兽色深，成兽色浅",q7x2="几乎没什么变化",q7t="1",q7j="全身被短毛，背部蓝灰色，腹部乳黄色，带有蓝黑色斑点，毛色随年龄变化：幼兽色深，成兽色浅", q8="关于海葵你了解多少？",q8x1="无骨骼，富肉质，因外形像葵花而得名",q8x2="海葵的基盘用于固着",q8t="1", q8j="海葵是六放珊瑚亚纲的一目，是一中构造非常简单的动物，它虽然看上去像花朵，但其实是捕食性动物",q9="被称为海恬鱼的是哪个？",q9x1="海兔",q9x2="水母",q9t="1",q9j="海兔又称海恬鱼，属海兔软体动物门，腹足纲，无盾目，海兔科动物的统称", q10="南极虾不宜直接食用的原因是", q10x1="外壳中氟的含量高",q10x2="眼球中含有丰富的胡萝卜素",q10t="1",q10j="南极磷虾可以吃，但是要注意量不能过多，因为南极磷虾中氟含量较高。氟虽然是人体正常生理代谢所需的元素，但是过量摄入会对人体产生危害", q11="“让暴风雨来的更猛烈些吧”,出自？",q11x1="海的女儿",q11x2="海燕",q11t="2",q11j="海燕是俄国无产阶级文学家高尔基写的散文诗，以深刻的思想性赢得了众多读者的喜爱", q12="海洋灾害不包括哪一个？",q12x1="海水入侵",q12x2="沉船事故",q12t="2",q12j="沉船事故不属于灾害，为不可控的"     WHERE account=   '+account;
     var sql='UPDATE users SET q1="下列什么鱼的眼睛长在身体的同一侧", q1x1="小丑鱼", q1x2="比目鱼",q1t="2",  q2="下列哪种动物的智商最高？", q2x1="海豹",q2x2="海豚",q2t="2",  q3="2000年8月20号,广东大亚湾发生赤潮,下列各因素与之关系不大的是",q3x1="工业污水",q3x2="海流运动微弱",q3t="2",q4="下列哪些物质不会造成对海洋的污染？",q4x1="石油及其产品",q4x2="冰川融化水",q4t="2",q5="世界海洋渔获量最多的国家是哪俩个国家？",q5x1="中国和日本",q5x2="中国和美国",q5t="1", q6="世界海洋日是每年的哪天？",q6x1="6月8日",q6x2="7月19日",q6t="1", q7="海豹皮肤颜色随年龄的变化是怎样的？",q7x1="幼兽色深，成兽色浅",q7x2="几乎没什么变化",q7t="1", q8="关于海葵你了解多少？",q8x1="无骨骼，富肉质，因外形像葵花而得名",q8x2="海葵的基盘用于固着",q8t="1", q9="被称为海恬鱼的是哪个？",q9x1="海兔",q9x2="水母",q9t="1", q10="南极虾不宜直接食用的原因是", q10x1="外壳中氟的含量高",q10x2="眼球中含有丰富的胡萝卜素",q10t="1", q11="“让暴风雨来的更猛烈些吧”,出自？",q11x1="海的女儿",q11x2="海燕",q11t="2", q12="海洋灾害不包括哪一个？",q12x1="海水入侵",q12x2="沉船事故",q12t="2"    WHERE account=   '+account;
   
    query(sql,function(err,rows,fields){

        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows.affectedRows>0);
            return;
        }
    });
};
exports.init_question_jj=function(account,callback){
    callback=callback ==null?nop:callback;
    var sql= 'UPDATE jj  SET  q1j=" 比目鱼又叫鲽鱼，硬骨鱼纲鲽形目鱼类的统称。体甚侧扁，两眼均位于头的左侧或右侧,",q2j="海洋学家认为，海豚与人类一样也有学习能力,相当于2-3岁的儿童智力,", q3j=" 由人类活动造成海洋赤潮的主要原因有：工业污水，生活污水" , q4j=" 冰川融化水相当于海水，并不是污水，但是石油对海洋有极大的污染" , q5j=" 日本处在洋流交界处,海洋鱼会因为海水温度的关系大量的聚集到日本附近" , q6j="2018年世界海洋日的主题是清洁我们的海洋，行动重点是防止塑料污染" , q7j="全身被短毛，背部蓝灰色，腹部乳黄色，带有蓝黑色斑点,幼兽色深，成兽色浅," , q8j="海葵是六放珊瑚亚纲的一目，虽然看上去像花，但其实是捕食动物, " , q9j="海兔又称海恬鱼，属海兔软体动物门，腹足纲，无盾目，海兔科动物的统称 ", q10j="南极磷虾可以吃，但是要注意量不能过多，因为南极磷虾中氟含量较高。 ",  q11j=" 海燕是俄国无产阶级文学家高尔基写的散文诗，", q12j=" 沉船事故不属于灾害，为不可控的 "  WHERE account= '+ account;
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows.affectedRows>0);
            return;
        }
    });
};

exports.get_health_index=function(account,callback){
    callback = callback ==null? nop:callback;
    if(account == null){
        callback(null);
        return;
    }
    var sql='SELECT health_index FROM users WHERE account = "' + account + '"';
    query(sql,function(err,rows,fields){
        if(err){
            callback(null);
            throw err;

        }
        else{
            callback(rows[0]);
            return;
        }
        
});
};
exports.get_grow_value=function(account,callback){
    callback = callback ==null? nop:callback;
    if(account == null){
        callback(null);
        return;
    }
    var sql='SELECT grow_value FROM users WHERE account = "' + account + '"';
    query(sql,function(err,rows,fields){
        if(err){
            callback(null);
            throw err;

        }
        else{
            callback(rows[0]);
            return;
        }
        
});
};
exports.init_explorenum=function(account,callback){
    callback=callback==null?nop:callback;
    var sql='UPDATE users  SET explore_num = '+ 4 + ' WHERE account =  '+account;
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows.affectedRows>0);
            return;
        }
    });
    
};
exports.init_opengame1=function(account,callback){
    callback=callback==null?nop:callback;
    var sql='UPDATE users SET open_game1 = '+1+' WHERE account= '+account;
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows.affectedRows>0);
            return;
        }

    });

};
exports.control_open_game1=function(account,callback){
    callback=callback==null?nop:callback;
    var sql='UPDATE users SET open_game1 = '+0+' WHERE account= '+account;
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows.affectedRows>0);
            return;
        }

    });
};
exports.init_game1num=function(account,callback){
    callback =callback==null?nop:callback;
    var sql='UPDATE users SET game1num = ' + 6 + ' WHERE account='+account;
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows.affectedRows>0);
            return;
        }
    });
};
exports.getgame1_num=function(account,callback){
    callback=callback==null?nop:callback;
    var sql='SELECT game1num FROM users WHERE account = "'+account+'"' ;
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows[0]);
            return;
        }
    });
};
exports.getgame1explorenum=function(account,callback){
    callback=callback==null?nop:callback;
    var sql='SELECT game1num,explore_num,open_game1 FROM users WHERE account = "'+account+'"' ;
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows[0]);
            return;
        }
    });
};
exports.update_game1num=function(account,callback){
    callback=callback==null?nop:callback;
    var sql='UPDATE users SET game1num = game1num - '+ 1 +' WHERE account= '+account;
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows.affectedRows>0);
            return;
        }
    });
};
exports.update_game1numj=function(account,callback){
    callback=callback==null?nop:callback;
    var sql='UPDATE users SET game1num = game1num + '+1+' WHERE account= '+account;
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows.affectedRows>0);
            return;
        }
    });
};

exports.initupdate_health_index=function(account,callback){
    callback = callback ==null? nop:callback;
    if(account == null){
        callback(null);
        return;
    }
    var sql='UPDATE users SET health_index = ' + 5 + ' WHERE account = ' + account ;
   query(sql,function(err,rows,fields){
    if(err){
        console.log(err);
        callback(false);
        return;
    }
    else{
        callback(rows.affectedRows > 0); //成功的话  rows。affectedrows是1
        //  console.log(rows.affectedRows);      
        return; 
    } 

   });
};
exports.init_login_number=function(account,callback){
    callback=callback==null? nop:callback;
    var sql='UPDATE users SET login_number = '+ 0 +' WHERE account = ' +account;
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
        callback(rows.affectedRows>0);
            return;
             }


    });

};

exports.init_explore_picture=function(account,callback){
    callback=callback == null? nop:callback;
    var sql='UPDATE picture_event SET picture1=' + 0 +  ' ,picture2 =' + 0 + ',picture3 ='+ 0 +',picture4 ='+ 0 +',picture5 ='+ 0 +',picture6 ='+ 0 +',picture7 ='+ 0 +',picture8 ='+ 0 +',picture9 ='+ 0 +',picture10 ='+ 0 +',picture11 ='+ 0 +',picture12 ='+ 0 +',picture13 ='+ 0 +',picture14 ='+ 0 +',picture15 ='+ 0 +' ,picture16 ='+ 0 +' ,picture17 ='+ 0 +' ,picture18 ='+ 0 +' ,picture19 ='+ 0 +',picture20 ='+ 0 +',picture21 ='+ 0 +' ,picture22 ='+ 0 +',picture23='+ 0 +',picture24 ='+ 0 +',picture25 ='+ 0 +' WHERE account=  '+ account;
     query(sql,function(err,rows,fields){
         if(err){
             callback(false);
             return;
         }
         else{
             callback(rows.affectedRows>0);
             return;
         }

     });
};
exports.init_pj=function(account,callback){
    callback=callback == null? nop:callback;
    var sql='UPDATE picture_event SET  pj1= "比目鱼是两只眼睛长在一边的奇鱼,在我国古代，比目鱼是象征忠贞爱情的奇鱼" ,pj2="蝙蝠鱼成年体形可以达到八米，温柔而优美，性情温和和好奇",pj3="灯笼鱼,因体上有能发出晶莹夺目光泽的小圆形发光器、形似灯笼而得名",pj4="翻车鱼,渔民看见它翻躺在水面如在作日光浴而以“翻车”的名字来形容它",pj5="飞鱼,以“能飞”而著名，但飞鱼不是飞翔，感觉上好像是在拍打翼状鳍，其实只是滑翔。",pj6="海龟,终身生活于海洋中，以鱼类、头足纲、甲壳纲动物及海藻为食。",pj7="海马,海马行动迟缓，却能很有效率地捕捉到行动迅速、善于躲藏的桡足类生物。",pj8="海豚,豚泳具有独有的游泳方式，整个身体以小角度跃离水面再以小角度入水，可以与其他鲸类区分。",pj9="海星,体扁平，多为五辐射对称，体盘和腕分界不明显.",pj10="蝴蝶鱼,大部分都生活在20公尺以内的浅水水域，是很典型的日行性鱼类。",pj11="金枪鱼又叫鲔鱼，香港称吞拿鱼，澳门以葡萄牙语旧译为亚冬鱼，大部分皆属于金枪鱼属",pj12="鲸类的祖先，极可能是产于北美、欧洲与亚洲的陆栖有蹄类动物——中爪兽科 ",pj13="绝大多数种类的螃蟹生活在海里或近海区，也有一些栖于淡水或陆地",pj14="龙虾分布于世界各大洲，品种繁多，一般栖息于温暖海洋的近海海底或岸边。",pj15="鲨鱼早在恐龙出现前三亿年前就已经存在地球上，它们在近一亿年来几乎没有改变。",pj16="扇贝为滤食性动物，对食物的大小有选择能力，但对种类无选择能力。",pj17="水母身体的主要成分是水，并由内外两胚层所组成",pj18="乌贼遇到强敌时会以“喷墨”作为逃生的方法并伺机离开，因而有“乌贼”、“墨鱼”等名称。",pj19="小丑鱼,因为脸上都有一条或两条白色条纹，好似京剧中的丑角而得名，是一种热带咸水鱼",pj20="章鱼,生活在水下，适应水温不能低于7℃，海水比重1.021最为适宜，低盐度的环境会死亡。" WHERE account =  '+account;
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows.affectedRows>0);
            return;
        }

    });
};
exports.init_pifu=function(account,callback){
    callback=callback == null? nop:callback;
    var sql=' UPDATE  users  SET pifu= '+ 1 +'  WHERE account = "'+account+'" ';
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows.affectedRows>0);
            return;
        }
    });
};
exports.init_pjd3=function(account,callback){
    callback=callback==null?nop:callback;
    var sql=' UPDATE picture_event SET pj21=" 大胃王,海豹的食量很大,一头60~70公斤的重的海豹,一天要吃掉7~8公斤鱼,他主要捕获各种鱼类和头足鱼，有时也吃甲壳类。",pj22=" 潜水能手,海豹的游泳本领很强,速度可达每小时27公里，同时又善潜水,一般可潜100米左右,南极海域中的威德尔海豹则能潜到600多米深,持续49分钟" ,pj23=" 家庭小分队,海豹繁殖期不集群,仔兽出生后,组成家庭群,哺乳期过后,家庭群结束",pj24=" 海豹体粗圆呈纺锤形,体重20～30千克,全身被短毛,背部蓝灰色,腹部乳黄色,带有蓝黑色斑点,头近圆形,眼大而圆,无外耳廓,吻短而宽上,唇触须长而粗硬,呈念珠状 ", pj25=" 视妻如命,在发情期雄海豹便开始追逐雌海豹,一只雌海豹后面往往跟着数只雄海豹,但雌海豹只能从雄海豹中挑选一只,因此,雄海豹之间不可避免地要发生争斗" WHERE account= ' +account;
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows.affectedRows>0);
            return;
        }
    });
};
exports.init_diary_first=function(account,t,callback){
    callback=callback == null? nop:callback;
    var sql=' UPDATE  diary  SET event = " 欢迎来到海报日记,从今天起你将踏入这个奇幻的世界 " ,et="'+t+'"  WHERE account='+account;
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows.affectedRows>0);
            return;
        }

    });
};
exports.init_gerenxinxi=function(account,un,str,callback){
    callback=callback == null? nop:callback;
    var sql=' UPDATE accounts  SET accountid = "'+account+'" , username="'+un+'", sex="3",geqian="这个家伙很懒还没有留下个签",tx="'+str+'"  WHERE account='+account;
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows.affectedRows>0);
            return;
        }
    });
};
exports.cha_gerenxinxi=function(account,callback){
    callback=callback==null?nop:callback;
    // var sql=' SELECT accountid,username,sex,geqian FROM accounts  WHERE account= "'+account+'"';
    var sql=' SELECT accountid,username,sex,geqian,tx  FROM  accounts  WHERE account  IN ( SELECT DISTINCT djfriend FROM friends WHERE account= "'+ account +'" )';
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows);
            return;
        }
    });
};
exports.cha_info=function(account,callback){
    callback=callback==null?nop:callback;
    var sql='SELECT DISTINCT info,it FROM friends WHERE account= "'+account+'" AND info IS NOT NULL ';
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows);
            return;
        }
    })
};
// exports.del_info=function(account,t,callback){
//     callback=callback==null?nop:callback;
//     var sql='DELETE  FROM  friends WHERE account= '+ account +' AND it= '+ t +' ';
//     query(sql,function(err,rows,fields){
//         if(err){
//             callback(false);
//             return;
//         }
//         else{
//             callback(rows.affectedRows>0);
//             return;
//         }
//     });
// };
exports.del_info=function(account,t,callback){
    callback=callback==null?nop:callback;
    var sql=' DELETE  FROM friends  WHERE account="'+account+'" AND  it="'+ t +'" ';
    query(sql,function(err,rows){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows.affectedRows);
            return;     
             }
    });
};
exports.del_info1=function(account,callback){
    callback=callback==null?nop:callback;
    var sql='DELETE  FROM  friends WHERE account= "'+account+'" AND info IS NOT NULL ';
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows.affectedRows>0);
            return;
        }
    });
};

exports.cha_gerenxinxi1=function(account,callback){
    callback=callback==null?nop:callback;
     var sql=' SELECT accountid,username,sex,geqian FROM accounts  WHERE account= "'+account+'"';
    // var sql=' SELECT accountid,username,sex,geqian  FROM  accounts  WHERE account  IN ( SELECT DISTINCT djfriend FROM friends WHERE account= "'+ account +'" )';
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows[0]);
            return;
        }
    });
};
exports.cha_gerenxinxi2=function(account,callback){
    callback=callback==null?nop:callback;
     var sql=' SELECT accountid,username,sex,geqian,tx FROM accounts  WHERE account= "'+account+'"';
    // var sql=' SELECT accountid,username,sex,geqian  FROM  accounts  WHERE account  IN ( SELECT DISTINCT djfriend FROM friends WHERE account= "'+ account +'" )';
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows[0]);
            return;
        }
    });
};


exports.update_gerenxinxi=function(account,username,sex,geqian,callback){
    callback=callback==null?nop:callback;
    var sql=' UPDATE accounts SET username= "'+username+'", sex="'+sex+'" ,geqian="'+geqian+'"  WHERE account= '+account;
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows.affectedRows>0);
            return;
        }
    });
};
exports.cha_friends=function(account,callback){
    callback=callback==null?nop:callback;
    var sql=' SELECT  friend  FROM friends  WHERE account= "'+account+'"';
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows);
            return;
        }
    });

};

exports.cha_friends_info=function(account,callback){
    callback=callback==null?nop:callback;
    // var sql=' SELECT  accountid,username,sex,geqian FROM friends WHERE account= "'+account+'"   ';
    var sql='SELECT  accountid,username,sex,geqian,tx FROM accounts WHERE account IN(SELECT friend FROM friends  WHERE account= "'+account+'")';
    
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows);
            return;
        }

    });

};

exports.cha_friends_info1=function(account,callback){
    callback=callback==null?nop:callback;
    // var sql=' SELECT  accountid,username,sex,geqian FROM friends WHERE account= "'+account+'"   ';
    var sql='SELECT  accountid,username,sex,geqian,tx,grow_value FROM accounts WHERE account IN(SELECT friend FROM friends  WHERE account= "'+account+'") ORDER BY grow_value DESC';
    
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows);
            return;
        }

    });
};
exports.cha_friends_info2=function(account,callback){
    callback=callback==null?nop:callback;
    var sql='SELECT  accountid,username,sex,geqian,tx,grow_value FROM accounts  WHERE account =  "'+account+'" ';
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows[0]);
            return;
        }

    });
};
exports.cha_djsj_hea_=function(account,callback){
    callback=callback==null?nop:callback;
    var sql=' SELECT health_index,event1,event2,event3,event4,event5,event6,event7 FROM users WHERE account= "'+account+'"';
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows[0]);
            return;
        }
    });
};
exports.isfraccountcunzai=function(saccount,callback){
    callback=callback==null?nop:callback;
    var sql=' SELECT account FROM accounts  WHERE account=  "'+saccount+'"';
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows[0]);
            return;
        }
    });
};
exports.isfriend=function(account,callback){
    callback=callback==null?nop:callback;
    var sql=' SELECT friend FROM friends WHERE account= "'+account+'" ';
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows);
            return;
        }
    });
};
exports.isfriend1=function(account,friend,callback){
    callback=callback==null?nop:callback;
    // SELECT accountid,username,sex,geqian FROM accounts WHERE account IN(SELECT friend FROM friends WHERE account= "'+account+'")';
    var sql=' SELECT friend  FROM  friends  WHERE   "'+ friend +'" IN ( SELECT friend  FROM  friends  WHERE  account ="'+account+'")';
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows);
            return;
        }
    });
};
exports.add_friend=function(account,fraccount,callback){
    callback=callback==null?nop:callback;
    var sql=' INSERT INTO  friends(account,appliaccount)  VALUES("'+account+'","'+fraccount+'") ';
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows.affectedRows>0);
            return;
        }
    });
};
exports.add_friend1=function(account,friend,callback){
    callback=callback==null?nop:callback;
    var sql='INSERT INTO friends(account,friend) VALUES("'+account+'","'+friend+'")';
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows.affectedRows>0);
            return;
        }
    });

};
exports.add_info=function(account,info,it,callback){
    callback=callback==null?nop:callback;
    var sql=' INSERT  INTO  friends(account,info,it) VALUES("'+account+'","'+info+'","'+it+'") ';
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows.affectedRows>0);
            return;
        }
    });
}
exports.delete_djfriend=function(account,djfriend,callback){
    callback=callback==null?nop:callback;
    var sql=' DELETE FROM friends WHERE account ="'+account+'" AND djfriend="'+djfriend+'"';
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            throw err;
        }
        else{
            callback(true);
        }
    });

};
exports.delete_appliaccount=function(account,appliaccount,callback){
    callback=callback==null?nop:callback;
    var sql=' DELETE FROM friends WHERE account="'+account+'" AND appliaccount="'+appliaccount+'" ';
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            throw err;
        }
        else{
            callback(true);
        }
    });

}

exports.add_djfriend=function(fraccount,account,callback){
    callback=callback==null?nop:callback;
    var sql=' INSERT INTO  friends(account,djfriend)   VALUES("'+fraccount+'","'+account+'")';
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows.affectedRows>0);
            return;
        }
    });

};
exports.cha_djfriend=function(account,callback){
    callback=callback==null?nop:callback;
    var sql=' SELECT djfriend FROM friends WHERE  account=  "'+account+'"';
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows);
            return;
        }
    });
};
exports.cha_djfriend1=function(account,callback){
    callback=callback==null?nop:callback;
    var sql=' SELECT DISTINCT djfriend FROM friends WHERE  account=  "'+account+'"';
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows);
            return;
        }
    });
};
exports.cha_notice=function(account,callback){
    callback=callback==null?nop:callback;
    var sql=' SELECT info   FROM  friends  WHERE account=  "'+account+'"   AND info IS NOT NULL  ' ;
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows);
            return;
        }
    });
};
exports.cha_djfriend33=function(account,callback){
    callback=callback==null?nop:callback;
    var sql=' SELECT DISTINCT djfriend   FROM  friends  WHERE account=  "'+account+'"   AND djfriend IS NOT NULL  ' ;
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows);
            return;
        }
    });
};



exports.init_pjd1=function(account,callback){
    callback=callback==null? nop:callback;
    var sql='UPDATE jj SET p1j=" 比目鱼是两只眼睛长在一边的奇鱼，被认为需两鱼并肩而行，故名比目鱼。它是海水鱼中的一大类，包括有鲆科、鲽科、鳎科的鱼类。鲆科中常见的有“牙鲆”、“斑鲆” ", p2j=" 蝙蝠鱼也被称为燕鱼或蝙蝠燕，它们的成年个体可以生长得很大，一般在40—60cm。它们的幼体拥有超长的背鳍和臂鳍，看上去很像蝙蝠或燕子的翅膀,它们是纯粹的肉食动物，喜欢新鲜的鱼虾肉 , " , p3j=" 分布于南美洲的圭亚那和亚马逊河流域。体长4～5厘米。体长而侧扁，头短，腹圆。两眼上部和尾部各有一块金黄色斑，在灯光照射下，反射出金黄色和红色的色彩," ,p4j=" 分布于栖息于各热带、亚热带海洋。也见于温带或寒带海洋。中国沿海均产,翻车鲀为大型大洋性鱼类，最大体长可达3.0～5.5 m，重达1400～3500 kg。单独或成对游泳，有时十余尾成群，小个体鱼较活泼，常跃出水面 ," ,p5j=" 飞鱼长相奇特，胸鳍特别发达，像鸟类的翅膀一样。长长的胸鳍一直延伸到尾部，整个身体像织布的“长梭”。它凭借自己流线型的优美体型，在海中以每秒10米的速度高速运动, ",p6j="海龟是龟鳖目海龟科动物的统称。广布于大西洋、太平洋和印度洋。中国产的属于日本海龟，北起山东、南至北部湾近海均有分布。长可达1米多,寿命最大为150岁左右.头顶有一对前额鳞, " , p7j="海马是刺鱼目海龙科暖海生数种小型鱼类的统称，是一种小型海洋动物，身长5-30厘米。因头部弯曲与体近直角而得名，头呈马头状而与身体形成一个角，吻呈长管状，口小，背鳍一个，均为鳍条组成 ," ,p8j=" 海豚是与鲸和鼠海豚密切相关的水生哺乳动物，大约于1千万年前的中新世进化而成，广泛生活在大陆架附近的浅海里，偶见于淡水之中。主要以鱼类和软体动物为食,", p9j=" 海星与 海参、 海胆等同属 棘皮动物。它们通常有五个腕，但也有四六个，体扁平，多呈星形。整个身体由许多钙质骨板借结缔组织结合而成，体表有突出的棘、瘤或 疣等附属物,",p10j="  蝴蝶鱼属蝶鱼科。主要分布于太平洋、东非至日本等海域。它的外形就与陆地上的蝴蝶一样，有着五彩缤纷的图案，大部分分布在热带地区的珊瑚礁,", p11j="金枪鱼又叫鲔鱼，香港称吞拿鱼，澳门以葡萄牙语旧译为亚冬鱼，大部分皆属于金枪鱼属。金枪鱼的肉色为红色，这是因为金枪鱼的肌肉中含有了大量的肌红蛋白所致, ", p12j="鲸分为两类，一类是须鲸，一类是齿鲸。鲸属于脊索动物门，脊椎动物亚门，哺乳纲，真兽亚纲，包含了大约98种生活在海洋、河流中的胎生哺乳动物。中国海域就有30余种, " WHERE account='+ account;
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows.affectedRows>0);
            return;
        }
    });
};
exports.init_pjd2=function(account,callback){
    callback=callback==null? nop:callback;
    var sql='UPDATE jj SET p13j=" 它头胸部较粗大，外壳坚硬，色彩斑斓，腹部短小，体长一般在20～40厘米之间，重0.5公斤上下，腹肢可后天演变成螯。最重的能达到5公斤以上，人称龙虾虎 ," , p14j=" 它们靠母蟹来生小螃蟹，每次母蟹都会产很多的卵，数量可达数百万粒以上。这些卵在母蟹腹部孵化后，幼体即可脱离母体，随着沿岸潮流到处浮游。经过几次退壳后，长成大眼幼虫 , ", p15j=" 鲨鱼早在恐龙出现前三亿年前就已经存在地球上,鲨鱼，在古代叫作鲛、鲛鲨、沙鱼，是海洋中的庞然大物"  ,p16j=" 扇贝是扇贝属的双壳类软体动物的代称，约有400余种。该科的60余种是世界各地重要的海洋渔业资源之一。壳、肉、珍珠层具有极高的利用价值。很多扇贝作为美食食用" ,p17j=" 水母身体的主要成分是水，并由内外两胚层所组成，两层间有一个很厚的中胶层，不但透明，而且有漂浮作用 ," ,p18j=" 墨鱼是贝类，亦称乌贼鱼、墨斗鱼、目鱼等。属软体动物门，头足纲，十腕目，乌贼科。中国所指的“墨鱼”或叫“乌贼”，大多是中国东海主产的曼氏无针乌贼和金乌贼两个种 , " ,p19j=" 小丑鱼是对雀鲷科海葵鱼亚科鱼类的俗称，因为脸上都有一条或两条白色条纹，好似京剧中的丑角而得名，是一种热带咸水鱼。已知有28种，一种来自棘颊雀鲷属，其余来自双锯鱼属 ," ,p20j=" 体卵形或卵圆形，肌肉强健，外套腔开口窄，体表一般不具水孔。腕吸盘1列或2列。雄性左侧或右侧第3腕茎化，腕腹缘具精沟，末端具勺状舌叶；茎化腕不能自断。漏斗外套锁退化。"  WHERE account= '+ account;
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows.affectedRows>0);
            return;
        }
    });
};

exports.cha_pj=function(account,callback){
    callback=callback==null?nop:callback;
    var sql='SELECT pj1,pj2,pj3,pj4,pj5,pj6,pj7,pj8,pj9,pj10,pj11,p12,pj3,pj14,pj5,pj16,pj17,pj18,pj19,pj20, FROM picture_event  WHERE account=   "'+account+'" ';
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows.affectedRows>0);
            return;
        }
    });

};
exports.cha_tujiandaj=function(account,callback){
    callback=callback==null?nop:callback;
    var sql='SELECT p1j,p2j,p3j,p4j,p5j,p6j,p7j,p8j,p9j,p10j,p11j,p12j,p13j,p14j,p15j,p16j,p17j,p18j,p19j,p20j FROM jj WHERE account= "'+account+'" ';
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows[0]);
            return;
        }
    });
};




exports.control_login_number=function(account,callback){
    callback=callback==null? nop:callback;
    var sql='UPDATE users SET login_number = login_number + "'+ 1 +'" WHERE account =' + account;
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows.affectedRows>0);
            return;
             }
    });
};
exports.control_grow100=function(account,callback){
    callback=callback==null?nop:callback;
    var sql=' UPDATE users SET grow100 =  "'+1+'" WHERE account= '+account;
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows.affectedRows>0);
            return;
        }
    });
};
exports.control_grow200=function(account,callback){
    callback=callback==null?nop:callback;
    var sql=' UPDATE users SET grow200 =  "'+1+'" WHERE account= '+account;
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows.affectedRows>0);
            return;
        }
    });
};

exports.control_grow300=function(account,callback){
    callback=callback==null?nop:callback;
    var sql=' UPDATE users SET grow300 =  "'+1+'" WHERE account= '+account;
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows.affectedRows>0);
            return;
        }
    });
};

exports.init_grow=function(account,callback){
    callback = callback ==null? nop:callback;
    if(account == null){
        callback(null);
        return;
    }
    var sql='SELECT grow_value FROM users WHERE account = "' + account + '"';
    query(sql,function(err,rows,fields){
        if(err){
            callback(null);
            throw err;
            
        }
        if(rows.length == 1){
            callback(true);
            // console.log(rows.length);
            return;
        }
        if(rows.length != 1){
            callback(false);
            console.log(rows.length);
            return;
        }
    });
};
exports.initupdate_grow_value=function(account,callback){
    callback = callback ==null? nop:callback;
    if(account == null){
        callback(null);
        return;
    }
    var sql='UPDATE users SET grow_value = ' + 1 + ' WHERE account = ' + account ;
   query(sql,function(err,rows,fields){
    if(err){
        console.log(err);
        callback(false);
        return;
    }
    else{
        callback(rows.affectedRows > 0); //成功的话  rows。affectedrows是1
        //  console.log(rows.affectedRows);      
        return; 
    } 

   });
};
exports.initupdate_grow_value1=function(account,callback){
    callback = callback ==null? nop:callback;
    if(account == null){
        callback(null);
        return;
    }
    var sql='UPDATE accounts SET grow_value = ' + 1 + ' WHERE account = ' + account ;
   query(sql,function(err,rows,fields){
    if(err){
        console.log(err);
        callback(false);
        return;
    }
    else{
        callback(rows.affectedRows > 0); //成功的话  rows。affectedrows是1
        //  console.log(rows.affectedRows);      
        return; 
    } 

   });
};
exports.init_grow100=function(account,callback){
    callback=callback==null ?nop:callback;
    var sql='UPDATE users SET grow100= '+ 0 + '  WHERE account='+account;
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows.affectedRows>0);
            return;
        };
    });
};
exports.init_grow200=function(account,callback){
    callback=callback==null ?nop:callback;
    var sql='UPDATE users SET grow200= '+ 0 + '  WHERE account='+account;
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows.affectedRows>0);
            return;
        };
    });
};
exports.init_grow300=function(account,callback){
    callback=callback==null ?nop:callback;
    var sql='UPDATE users SET grow300= '+ 0 + '  WHERE account='+account;
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows.affectedRows>0);
            return;
        };
    });
};
        
       
exports.get_user_data = function(account,callback){
    callback = callback == null? nop:callback;
    if(account == null){
        callback(null);
        return;
    }
    var sql = 'SELECT health_index,grow_value,event1,event2,event3,event4,event5,event6,event7,event8,login_number,grow100,grow200,grow300,pifu  FROM users WHERE account = "' + account + '"';
    query(sql, function(err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }

        if(rows.length == 0){
            callback(null);
            return;
        }
        // rows[0].name = crypto.fromBase64(rows[0].name);
        callback(rows[0]);
        // console.log(rows[0]);
    });
};


exports.update_health_index =function(account,callback){
    callback = callback == null? nop:callback;
    var sql='UPDATE users SET health_index = health_index - ' + 1 + ' WHERE account = ' + account;
    query(sql, function(err, rows, fields) {
        if(err){
            console.log(err);
            callback(false);
            return;
        }
        else{
            callback(rows.affectedRows > 0); //成功的话  rows。affectedrows是1
            //   console.log(rows);      
            return; 
        } 
});
};
exports.update_health_index1 =function(account,callback){
    callback = callback == null? nop:callback;
    var sql='UPDATE users SET health_index = health_index + ' + 1 + ' WHERE account = ' + account;
    query(sql, function(err, rows, fields) {
        if(err){
            console.log(err);
            callback(false);
            return;
        }
        else{
            callback(rows.affectedRows > 0); 
                 
            return; 
        } 
});
};


//这个是定义阶段的成长值
exports.update_grow_value1 =function(account,callback){
    callback = callback == null? nop:callback;
    var sql='UPDATE users SET grow_value = grow_value + ' + 1 + ' WHERE account = ' + account;
    query(sql, function(err, rows, fields){
        if(err){
            console.log(err);
            callback(false);
            return;
        }
        else{
            callback(rows.affectedRows > 0); //成功的话  rows。affectedrows是1
            //   console.log(rows);      
            return; 
        } 
});
};
exports.update_grow_value11 =function(account,callback){
    callback = callback == null? nop:callback;
    var sql='UPDATE accounts SET grow_value = grow_value + ' + 1 + ' WHERE account = ' + account;
    query(sql, function(err, rows, fields){
        if(err){
            console.log(err);
            callback(false);
            return;
        }
        else{
            callback(rows.affectedRows > 0); //成功的话  rows。affectedrows是1
            //   console.log(rows);      
            return; 
        } 
});
};

//这个是第二阶段的成长值
exports.update_grow_value2=function(account,callback){
    callback=callback==null? nop:callback;
    var  sql='UPDATE users SET grow_value = grow_value + ' + 2 + ' WHERE account = '+ account;
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows.affectedRows> 0);
            return;
        }

    });

};
//第三阶段的成长值
exports.update_grow_value3=function(account,callback){
    callback=callback==null? nop:callback;
    var  sql='UPDATE users SET grow_value = grow_value + ' + 3 + ' WHERE account = '+ account;
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows.affectedRows> 0);
            return;
        }

    });

};


exports.cha_select1=function(account,callback){
    callback = callback == null? nop:callback;
    var sql='SELECT event1  FROM users WHERE account="'+ account +'"';
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
        callback(rows[0]);
        return;
    }

    });
};

exports.cha_select2=function(account,callback){
    callback = callback == null? nop:callback;
    var sql='SELECT event2  FROM users WHERE account="'+ account +'"';
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
        callback(rows[0]);
        // console.log(rows[0]);
        return;
    }

    });
};
exports.cha_select3=function(account,callback){
    callback = callback == null? nop:callback;
    var sql='SELECT event3  FROM users WHERE account="'+ account +'"';
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
        callback(rows[0]);
        // console.log(rows[0]);
        return;
    }

    });
};
exports.cha_select4=function(account,callback){
    callback = callback == null? nop:callback;
    var sql='SELECT event4  FROM users WHERE account="'+ account +'"';
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
        callback(rows[0]);
        // console.log(rows[0]);
        return;
    }

    });
};


exports.cha_select5=function(account,callback){
    callback = callback == null? nop:callback;
    var sql='SELECT event5  FROM users WHERE account="'+ account +'"';
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
        callback(rows[0]);
        // console.log(rows[0]);
        return;
    }

    });
};

exports.cha_select6=function(account,callback){
    callback = callback == null? nop:callback;
    var sql='SELECT event6  FROM users WHERE account="'+ account +'"';
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
        callback(rows[0]);
        // console.log(rows[0]);
        return;
    }

    });
};

exports.cha_select7=function(account,callback){
    callback = callback == null? nop:callback;
    var sql='SELECT event7  FROM users WHERE account="'+ account +'"';
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
        callback(rows[0]);
        // console.log(rows[0]);
        return;
    }

    });
};

exports.cha_select8=function(account,callback){
    callback = callback == null? nop:callback;
    var sql='SELECT event8  FROM users WHERE account="'+ account +'"';
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
        callback(rows[0]);
        // console.log(rows[0]);
        return;
    }

    });
};

exports.select_event1=function(account,callback){
    callback = callback == null? nop:callback;
    var sql='UPDATE users SET event1 =  ' + 1 + ' WHERE account = ' + account;//因为可以用到account这个参数不知道一个参数咋弄时，在写一个参数
    // var sql='UPDATE users SET grow_value = ' + 1 + ' WHERE account = ' + account ;
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows.affectedRows>0);
            return;
        }   
    });
};
exports.select_event2=function(account,callback){
    callback = callback == null? nop:callback;
    var sql='UPDATE users SET event2 =  ' + 1 + ' WHERE account = ' + account;//因为可以用到account这个参数不知道一个参数咋弄时，在写一个参数
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows.affectedRows>0);
            return;
        }   
    });
};
exports.select_event3=function(account,callback){
    callback = callback == null? nop:callback;
    var sql='UPDATE users SET event3 =  ' + 1 + ' WHERE account = ' + account;//因为可以用到account这个参数不知道一个参数咋弄时，在写一个参数
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows.affectedRows>0);
            return;
        }   
    });
};
exports.select_event4=function(account,callback){
    callback = callback == null? nop:callback;
    var sql='UPDATE users SET event4 =  ' + 1 + ' WHERE account = ' + account;//因为可以用到account这个参数不知道一个参数咋弄时，在写一个参数
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows.affectedRows>0);
            return;
        }   
    });
};
exports.select_event5=function(account,callback){
    callback = callback == null? nop:callback;
    var sql='UPDATE users SET event5 =  ' + 1 + ' WHERE account = ' + account;//因为可以用到account这个参数不知道一个参数咋弄时，在写一个参数
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows.affectedRows>0);
            return;
        }   
    });
};
exports.select_event6=function(account,callback){
    callback = callback == null? nop:callback;
    var sql='UPDATE users SET event6 =  ' + 1 + ' WHERE account = ' + account;//因为可以用到account这个参数不知道一个参数咋弄时，在写一个参数
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows.affectedRows>0);
            return;
        }   
    });
};
exports.select_event7=function(account,callback){
    callback = callback == null? nop:callback;
    var sql='UPDATE users SET event7 =  ' + 1 + ' WHERE account = ' + account;//因为可以用到account这个参数不知道一个参数咋弄时，在写一个参数
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows.affectedRows>0);
            return;
        }   
    });
};
exports.select_event8=function(account,callback){
    callback = callback == null? nop:callback;
    var sql='UPDATE users SET event8 =  ' + 1 + ' WHERE account = ' + account;//因为可以用到account这个参数不知道一个参数咋弄时，在写一个参数
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows.affectedRows>0);
            return;
        }   
    });
};
exports.init_event1=function(account,callback){
    callback=callback==null ?nop:callback;
    var sql='UPDATE users SET event1 =  '+ 0 +' WHERE account = '+account ;
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows.affectedRows>0);
            return;
        }

    });
};
 exports.diary_event=function(account,msg,t,callback){
     callback=callback==null?nop:callback;
     var sql=' INSERT  INTO diary(account,event,et) VALUES("'+ account +'","'+ msg +'","'+ t +'") ';
     query(sql,function(err,rows,fields){
        if (err) {
            if(err.code == 'ER_DUP_ENTRY'){
                callback(false);
                return;         
            }
            callback(false);
            throw err;
        }
        else{
            callback(true);            
        }

     });
 };
 

exports.init_event2=function(account,callback){
    callback=callback==null ?nop:callback;
    var sql='UPDATE users SET event2 =  '+ 0 +' WHERE account = '+account ;
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows.affectedRows>0);
            return;
        }

    });
};
exports.init_event3=function(account,callback){
    callback=callback==null ?nop:callback;
    var sql='UPDATE users SET event3 =  '+ 0 +' WHERE account = '+account ;
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows.affectedRows>0);
            return;
        }

    });
};
exports.init_event4=function(account,callback){
    callback=callback==null ?nop:callback;
    var sql='UPDATE users SET event4 =  '+ 0 +' WHERE account = '+account ;
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows.affectedRows>0);
            return;
        }

    });
};
exports.init_event5=function(account,callback){
    callback=callback==null ?nop:callback;
    var sql='UPDATE users SET event5 =  '+ 0 +' WHERE account = '+account ;
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows.affectedRows>0);
            return;
        }

    });
};
exports.init_event6=function(account,callback){
    callback=callback==null ?nop:callback;
    var sql='UPDATE users SET event6 =  '+ 0 +' WHERE account = '+account ;
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows.affectedRows>0);
            return;
        }

    });
};
exports.init_event7=function(account,callback){
    callback=callback==null ?nop:callback;
    var sql='UPDATE users SET event7 =  '+ 0 +' WHERE account = '+account ;
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows.affectedRows>0);
            return;
        }

    });
};
exports.init_event8=function(account,callback){
    callback=callback==null ?nop:callback;
    var sql='UPDATE users SET event8 =  '+ 0 +' WHERE account = '+account ;
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows.affectedRows>0);
            return;
        }

    });
};
exports.control_event=function(account,callback){
    callback = callback == null? nop:callback;
    var sql='SELECT event1,event2,event3,event4,event5,event6,event7,event8 FROM users  WHERE account="'+ account +'"';
    // 'SELECT health_index FROM users WHERE account = "' + account + '"';
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else
        {
            callback(rows[0]);
            console.log(rows[0]);
            return;
        }

    });

};
exports.cha_question=function(account,callback){
    callback=callback==null?nop:callback;
    var sql=' SELECT q1,q1x1,q1x2,q1t,q2,q2x1,q2x2,q2t,q3,q3x1,q3x2,q3t,q4,q4x1,q4x2,q4t,q5,q5x1,q5x2,q5t,q6,q6x1,q6x2,q6t,q7,q7x1,q7x2,q7t,q8,q8x1,q8x2,q8t,q9,q9x1,q9x2,q9t,q10,q10x1,q10x2,q10t,q11,q11x1,q11x2,q11t,q12,q12x1,q12x2,q12t  FROM users WHERE account="'+account+'"';
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows[0]);
            return;
        }
    });
};
exports.cha_jj=function(account,callback){
    callback=callback==null?nop:callback;
   
    var sql=' SELECT q1j,q2j,q3j,q4j,q5j,q6j,q7j,q8j,q9j,q10j,q11j,q12j  FROM jj WHERE account= "'+account+'" ';

    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows[0]);
            return;
        }
    });
};
exports.control_picture=function(account,picture,callback){
    callback = callback == null ? nop:callback;
    // var sql='UPDATE picture_event  SET ' + picture + ' = ' + 1 + ' WHERE account= '+account;
    var sql='UPDATE picture_event  SET ' + picture + ' = ' + picture + '+' + 1 + ' WHERE account= '+account;
    
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows.affectedRows>0);
            return;
        }
    });
    
};
exports.control_picture1=function(account,picture,callback){
    callback = callback == null ? nop:callback;
    // var sql='UPDATE picture_event  SET ' + picture + ' = ' + 1 + ' WHERE account= '+account;
    var sql='UPDATE picture_event  SET ' + picture + ' = ' + picture + '-' + 1 + ' WHERE account= '+account;
    
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows.affectedRows>0);
            return;
        }
    });
};
exports.cha_picture=function(account,callback){
    callback=callback==null?nop:callback;
    var sql='SELECT * FROM picture_event  WHERE account="' + account + '"';
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows[0]);
            return;
        }
    });
};
exports.gaipifu=function(account,pifu,callback){
    callback=callback==null?nop:callback;
    var sql='UPDATE users SET pifu="'+ pifu +'"  WHERE account = '+account;
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows.affectedRows>0);
            return;
        }
    });
};
exports.cha_diary=function(account,callback){
    callback=callback==null?nop:callback;
    var sql=' SELECT event,et FROM diary WHERE account= "'+ account +'" ORDER BY et DESC';
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows);
            return;
        }
    });

};
exports.get_explore_num_opengame=function(account,callback){
    callback = callback==null?nop:callback;
    var sql='SELECT explore_num,open_game1  FROM  users WHERE account = "'+ account + '" ' ;
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows[0]);
            return;
        }

    });
};
exports.update_explorenum=function(account,callback){
    callback = callback==null?nop:callback;
    var sql='UPDATE users SET explore_num = explore_num -  '+ 1 +' WHERE  account = '+ account;
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows.affectedRows>0);
            return;
        }

    });
    
};
exports.update_explorenum1=function(account,callback){
    callback=callback==null?nop:callback;
    var sql=' UPDATE users SET explore_num = explore_num +' + 1 +' WHERE account='+account ;
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows.affectedRows>0);
            return;
        }
    });
};
exports.chaexplorenum = function(account,callback){
    callback = callback == null?nop:callback;
    var sql='SELECT explore_num  FROM  users  WHERE account = "'+ account +'"';
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            return;
        }
        else{
            callback(rows[0]);
            return;
        }

    });
};
exports.create_account = function(account,password,callback){
    callback = callback == null? nop:callback;
    if(account == null || password == null){
        callback(false);
        return;
    }

     var psw = crypto.md5(password);
    var sql = 'INSERT INTO  accounts(account,password) VALUES("' + account + '","' + password + '")';
    query(sql, function(err, rows, fields) {
        if (err) {
            if(err.code == 'ER_DUP_ENTRY'){
                callback(false);
                return;         
            }
            callback(false);
            throw err;
        }
        else{
            callback(true);            
        }
    });
};

// exports.get_account_info = function(account,password,callback){
//     callback = callback == null? nop:call拍back;
//     if(account == null){
//         callback(null);
//         return;
//     }  

//     var sql = 'SELECT * FROM t_accounts WHERE account = "' + account + '"';
//     query(sql, function(err, rows, fields) {
//         if (err) {
//             callback(null);
//             throw err;
//         }
        
//         if(rows.length == 0){
//             callback(null);
//             return;
//         }
        
//         if(password != null){
//             var psw = crypto.md5(password);
//             if(rows[0].password == psw){
//                 callback(null);
//                 return;
//             }    
//         }

//         callback(rows[0]);  //为啥是返回rows【0】
//     }); 
// };

exports.is_user_exist = function(account,callback){   //这参数为啥是account
    callback = callback == null? nop:callback;
     if(account == null){
         callback(false);
         return;
     }
    var sql = 'SELECT account FROM accounts WHERE account = "' + account + '"'; //为啥要根据account 来查userid
    query(sql, function(err, rows, fields) {
        if (err) {
            throw err;
        }
        if(rows.length == 0){
            callback(false);
            // console.log(rows.length);
            return;
        }

        callback(true);
        // console.log(rows);
    });  
};


// exports.get_user_data = function(account,callback){
//     callback = callback == null? nop:callback;
//     if(account == null){
//         callback(null);
//         return;
//     }

//     var sql = 'SELECT userid,account,health_index FROM users WHERE account = "' + account + '"';
//     query(sql, function(err, rows, fields) {
//         if (err) {
//             callback(null);
//             throw err;
//         }

//         if(rows.length == 0){
//             callback(null);
//             return;
//         }
//         // rows[0].name = crypto.fromBase64(rows[0].name);
//         callback(rows[0]);
//     });
// };

// exports.get_user_data_by_userid = function(userid,callback){
//     callback = callback == null? nop:callback;
//     if(userid == null){
//         callback(null);
//         return;
//     }

//     var sql = 'SELECT userid,account,name,lv,exp,coins,gems,roomid FROM t_users WHERE userid = ' + userid;
//     query(sql, function(err, rows, fields) {
//         if (err) {
//             callback(null);
//             throw err;
//         }

//         if(rows.length == 0){
//             callback(null);
//             return;
//         }
//         rows[0].name = crypto.fromBase64(rows[0].name);
//         callback(rows[0]);
//     });
// };

/**增加玩家房卡 */
// exports.add_user_gems = function(userid,gems,callback){
//     callback = callback == null? nop:callback;
//     if(userid == null){
//         callback(false);
//         return;
//     }
    
//     var sql = 'UPDATE t_users SET gems = gems +' + gems + ' WHERE userid = ' + userid;
//     console.log(sql);
//     query(sql,function(err,rows,fields){
//         if(err){
//             console.log(err);
//             callback(false);
//             return;
//         }
//         else{
//             callback(rows.affectedRows > 0);        //rows 。affectedrows是啥意思   这个为啥 不是callback（true）返回更新的信息
//             return; 
//         } 
//     });
// };

// exports.get_gems = function(account,callback){
//     callback = callback == null? nop:callback;
//     if(account == null){
//         callback(null);
//         return;
//     }

//     var sql = 'SELECT gems FROM t_users WHERE account = "' + account + '"';
//     query(sql, function(err, rows, fields) {
//         if (err) {
//             callback(null);
//             throw err;
//         }

//         if(rows.length == 0){
//             callback(null);
//             return;
//         }
//         console.log("xxxxxxxxxxxxxxxxxxxxxxxxx")
//         console.log(rows)
//         callback(rows[0]);

//     });
// }; 

// exports.get_user_history = function(userId,callback){
//     callback = callback == null? nop:callback;
//     if(userId == null){
//         callback(null);
//         return;
//     }

//     var sql = 'SELECT history FROM t_users WHERE userid = "' + userId + '"';
//     query(sql, function(err, rows, fields) {
//         if (err) {
//             callback(null);
//             throw err;
//         }

//         if(rows.length == 0){
//             callback(null);
//             return;
//         }
//         var history = rows[0].history;     //这不是只select了 历史么  怎么还rows【0】
//         if(history == null || history == ""){
//             callback(null);    
//         }
//         else{
//             console.log(history.length);
//             history = JSON.parse(history);
//             callback(history);
//         }        
//     });
// };

// exports.update_user_history = function(userId,history,callback){
//     callback = callback == null? nop:callback;
//     if(userId == null || history == null){
//         callback(false);
//         return;
//     }

//     history = JSON.stringify(history);
//     var sql = 'UPDATE t_users SET roomid = null, history = \'' + history + '\' WHERE userid = "' + userId + '"';
//     //console.log(sql);
//     query(sql, function(err, rows, fields) {
//         if (err) {
//             callback(false);
//             throw err;
//         }

//         if(rows.length == 0){
//             callback(false);
//             return;
//         }

//         callback(true);
//     });
// };

// exports.get_games_of_room = function(room_uuid,callback){
//     callback = callback == null? nop:callback;
//     if(room_uuid == null){
//         callback(null);
//         return;
//     }

//     var sql = 'SELECT game_index,create_time,result FROM t_games_archive WHERE room_uuid = "' + room_uuid + '"';
//     //console.log(sql);
//     query(sql, function(err, rows, fields) {
//         if (err) {
//             callback(null);
//             throw err;
//         }

//         if(rows.length == 0){
//             callback(null);
//             return;
//         }

//         callback(rows);
//     });
// };

// exports.get_detail_of_game = function(room_uuid,index,callback){
//     callback = callback == null? nop:callback;
//     if(room_uuid == null || index == null){
//         callback(null);
//         return;
//     }
//     var sql = 'SELECT base_info,action_records FROM t_games_archive WHERE room_uuid = "' + room_uuid + '" AND game_index = ' + index ;
//     //console.log(sql);
//     query(sql, function(err, rows, fields) {
//         if (err) {
//             callback(null);
//             throw err;
//         }

//         if(rows.length == 0){
//             callback(null);
//             return;
//         }
//         callback(rows[0]);
//     });
// }

// exports.create_user = function(account,name,coins,gems,sex,headimg,callback){
//     callback = callback == null? nop:callback;
//     if(account == null || name == null || coins==null || gems==null){
//         callback(false);
//         return;
//     }
//     if(headimg){
//         headimg = '"' + headimg + '"';
//     }
//     else{
//         headimg = 'null';
//     }
//     name = crypto.toBase64(name);
//     var userId = generateUserId();

//     var sql = 'INSERT INTO t_users(userid,account,name,coins,gems,sex,headimg) VALUES("{0}", "{1}","{2}",{3},{4},{5},{6})';
//     sql = sql.format(userId,account,name,coins,gems,sex,headimg);
//     console.log(sql);
//     query(sql, function(err, rows, fields) {
//         if (err) {
//             throw err;
//         }
//         callback(true);
//     });
// };

// exports.update_user_info = function(userid,name,headimg,sex,callback){
//     callback = callback == null? nop:callback;
//     if(userid == null){
//         callback(null);
//         return;
//     }
 
//     if(headimg){
//         headimg = '"' + headimg + '"';
//     }
//     else{
//         headimg = 'null';
//     }
//     name = crypto.toBase64(name);
//     var sql = 'UPDATE t_users SET name="{0}",headimg={1},sex={2} WHERE account="{3}"';
//     sql = sql.format(name,headimg,sex,userid);
//     console.log(sql);
//     query(sql, function(err, rows, fields) {
//         if (err) {
//             throw err;
//         }
//         callback(rows);
//     });
// };

// exports.get_user_base_info = function(userid,callback){
//     callback = callback == null? nop:callback;
//     if(userid == null){
//         callback(null);
//         return;
//     }
//     var sql = 'SELECT name,sex,headimg FROM t_users WHERE userid={0}';
//     sql = sql.format(userid);
//     console.log(sql);
//     query(sql, function(err, rows, fields) {
//         if (err) {
//             throw err;
//         }
//         rows[0].name = crypto.fromBase64(rows[0].name);
//         callback(rows[0]);
//     });
// };

// exports.is_room_exist = function(roomId,callback){
//     callback = callback == null? nop:callback;
//     var sql = 'SELECT * FROM t_rooms WHERE id = "' + roomId + '"';
//     query(sql, function(err, rows, fields) {
//         if(err){
//             callback(false);
//             throw err;
//         }
//         else{
//             callback(rows.length > 0);
//         }
//     });
// };

// exports.cost_gems = function(userid,cost,callback){
//     callback = callback == null? nop:callback;
//     var sql = 'UPDATE t_users SET gems = gems -' + cost + ' WHERE userid = ' + userid;
//     console.log(sql);
//     query(sql, function(err, rows, fields) {
//         if(err){
//             callback(false);
//             throw err;
//         }
//         else{
//             callback(rows.length > 0);
//         }
//     });
// };

// exports.set_room_id_of_user = function(userId,roomId,callback){
//     callback = callback == null? nop:callback;
//     if(roomId != null){
//         roomId = '"' + roomId + '"';
//     }
//     var sql = 'UPDATE t_users SET roomid = '+ roomId + ' WHERE userid = "' + userId + '"';
//     console.log(sql);
//     query(sql, function(err, rows, fields) {
//         if(err){
//             console.log(err);
//             callback(false);
//             throw err;
//         }
//         else{
//             callback(rows.length > 0);
//         }
//     });
// };

// exports.get_room_id_of_user = function(userId,callback){
//     callback = callback == null? nop:callback;
//     var sql = 'SELECT roomid FROM t_users WHERE userid = "' + userId + '"';
//     query(sql, function(err, rows, fields) {
//         if(err){
//             callback(null);
//             throw err;
//         }
//         else{
//             if(rows.length > 0){
//                 callback(rows[0].roomid);
//             }
//             else{
//                 callback(null);
//             }
//         }
//     });
// };


// exports.create_room = function(roomId,conf,ip,port,create_time,callback){
//     callback = callback == null? nop:callback;
//     var sql = "INSERT INTO t_rooms(uuid,id,base_info,ip,port,create_time) \
//                 VALUES('{0}','{1}','{2}','{3}',{4},{5})";
//     var uuid = Date.now() + roomId;
//     var baseInfo = JSON.stringify(conf);
//     sql = sql.format(uuid,roomId,baseInfo,ip,port,create_time);
//     console.log(sql);
//     query(sql,function(err,row,fields){
//         if(err){
//             callback(null);
//             throw err;
//         }
//         else{
//             callback(uuid);
//         }
//     });
// };

// exports.get_room_uuid = function(roomId,callback){
//     callback = callback == null? nop:callback;
//     var sql = 'SELECT uuid FROM t_rooms WHERE id = "' + roomId + '"';
//     query(sql,function(err,rows,fields){
//         if(err){
//             callback(null);
//             throw err;
//         }
//         else{
//             callback(rows[0].uuid);
//         }
//     });
// };

// exports.update_seat_info = function(roomId,seatIndex,userId,icon,name,callback){
//     callback = callback == null? nop:callback;
//     var sql = 'UPDATE t_rooms SET user_id{0} = {1},user_icon{0} = "{2}",user_name{0} = "{3}" WHERE id = "{4}"';
//     name = crypto.toBase64(name);
//     sql = sql.format(seatIndex,userId,icon,name,roomId);
//     //console.log(sql);
//     query(sql,function(err,row,fields){
//         if(err){
//             callback(false);
//             throw err;
//         }
//         else{
//             callback(true);
//         }
//     });
// }

// exports.update_num_of_turns = function(roomId,numOfTurns,callback){
//     callback = callback == null? nop:callback;
//     var sql = 'UPDATE t_rooms SET num_of_turns = {0} WHERE id = "{1}"'
//     sql = sql.format(numOfTurns,roomId);
//     //console.log(sql);
//     query(sql,function(err,row,fields){
//         if(err){
//             callback(false);
//             throw err;
//         }
//         else{
//             callback(true);
//         }
//     });
// };


// exports.update_next_button = function(roomId,nextButton,callback){
//     callback = callback == null? nop:callback;
//     var sql = 'UPDATE t_rooms SET next_button = {0} WHERE id = "{1}"'
//     sql = sql.format(nextButton,roomId);
//     //console.log(sql);
//     query(sql,function(err,row,fields){
//         if(err){
//             callback(false);
//             throw err;
//         }
//         else{
//             callback(true);
//         }
//     });
// };

// exports.get_room_addr = function(roomId,callback){
//     callback = callback == null? nop:callback;
//     if(roomId == null){
//         callback(false,null,null);
//         return;
//     }

//     var sql = 'SELECT ip,port FROM t_rooms WHERE id = "' + roomId + '"';
//     query(sql, function(err, rows, fields) {
//         if(err){
//             callback(false,null,null);
//             throw err;
//         }
//         if(rows.length > 0){
//             callback(true,rows[0].ip,rows[0].port);
//         }
//         else{
//             callback(false,null,null);
//         }
//     });
// };

// exports.get_room_data = function(roomId,callback){
//     callback = callback == null? nop:callback;
//     if(roomId == null){
//         callback(null);
//         return;
//     }

//     var sql = 'SELECT * FROM t_rooms WHERE id = "' + roomId + '"';
//     query(sql, function(err, rows, fields) {
//         if(err){
//             callback(null);
//             throw err;
//         }
//         if(rows.length > 0){
//             rows[0].user_name0 = crypto.fromBase64(rows[0].user_name0);
//             rows[0].user_name1 = crypto.fromBase64(rows[0].user_name1);
//             rows[0].user_name2 = crypto.fromBase64(rows[0].user_name2);
//             rows[0].user_name3 = crypto.fromBase64(rows[0].user_name3);
//             callback(rows[0]);
//         }
//         else{
//             callback(null);
//         }
//     });
// };

// exports.delete_room = function(roomId,callback){
//     callback = callback == null? nop:callback;
//     if(roomId == null){
//         callback(false);
//     }
//     var sql = "DELETE FROM t_rooms WHERE id = '{0}'";
//     sql = sql.format(roomId);
//     console.log(sql);
//     query(sql,function(err,rows,fields){
//         if(err){
//             callback(false);
//             throw err;
//         }
//         else{
//             callback(true);
//         }
//     });
// }

// exports.create_game = function(room_uuid,index,base_info,callback){
//     callback = callback == null? nop:callback;
//     var sql = "INSERT INTO t_games(room_uuid,game_index,base_info,create_time) VALUES('{0}',{1},'{2}',unix_timestamp(now()))";
//     sql = sql.format(room_uuid,index,base_info);
//     //console.log(sql);
//     query(sql,function(err,rows,fields){
//         if(err){
//             callback(null);
//             throw err;
//         }
//         else{
//             callback(rows.insertId);
//         }
//     });
// };

// exports.delete_games = function(room_uuid,callback){
//     callback = callback == null? nop:callback;
//     if(room_uuid == null){
//         callback(false);
//     }    
//     var sql = "DELETE FROM t_games WHERE room_uuid = '{0}'";
//     sql = sql.format(room_uuid);
//     console.log(sql);
//     query(sql,function(err,rows,fields){
//         if(err){
//             callback(false);
//             throw err;
//         }
//         else{
//             callback(true);
//         }
//     });
// }

// exports.archive_games = function(room_uuid,callback){
//     callback = callback == null? nop:callback;
//     if(room_uuid == null){
//         callback(false);
//     }
//     var sql = "INSERT INTO t_games_archive(SELECT * FROM t_games WHERE room_uuid = '{0}')";
//     sql = sql.format(room_uuid);
//     console.log(sql);
//     query(sql,function(err,rows,fields){
//         if(err){
//             callback(false);
//             throw err;
//         }
//         else{
//             exports.delete_games(room_uuid,function(ret){
//                 callback(ret);
//             });
//         }
//     });
// }

// exports.update_game_action_records = function(room_uuid,index,actions,callback){
//     callback = callback == null? nop:callback;
//     var sql = "UPDATE t_games SET action_records = '"+ actions +"' WHERE room_uuid = '" + room_uuid + "' AND game_index = " + index ;
//     //console.log(sql);
//     query(sql,function(err,rows,fields){
//         if(err){
//             callback(false);
//             throw err;
//         }
//         else{
//             callback(true);
//         }
//     });
// };

// exports.update_game_result = function(room_uuid,index,result,callback){
//     callback = callback == null? nop:callback;
//     if(room_uuid == null || result){
//         callback(false);
//     }
    
//     result = JSON.stringify(result);
//     var sql = "UPDATE t_games SET result = '"+ result +"' WHERE room_uuid = '" + room_uuid + "' AND game_index = " + index ;
//     //console.log(sql);
//     query(sql,function(err,rows,fields){
//         if(err){
//             callback(false);
//             throw err;
//         }
//         else{
//             callback(true);
//         }
//     });
// };

// exports.get_message = function(type,version,callback){
//     callback = callback == null? nop:callback;
    
//     var sql = 'SELECT * FROM t_message WHERE type = "'+ type + '"';
    
//     if(version == "null"){
//         version = null;
//     }
    
//     if(version){
//         version = '"' + version + '"';
//         sql += ' AND version != ' + version;   
//     }
     
//     query(sql, function(err, rows, fields) {
//         if(err){
//             callback(false);
//             throw err;
//         }
//         else{
//             if(rows.length > 0){
//                 callback(rows[0]);    
//             }
//             else{
//                 callback(null);
//             }
//         }
//     });
// };





//探寻神秘海域
exports.user_login = function (userid, password, callback) {
    callback = callback == null ? nop : callback;
    if (userid == null || password == null) {
        console.log("userid is null or password is null !");
        callback(null);
        return;
    }
    var sql = 'SELECT * FROM user WHERE userid = "' + userid + '"';
    console.log(sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            throw (err);
        }
        console.log("rows.length", rows.length);
        if (rows.length == 0) {
            callback({ exist: 2 });    //账号不存在
            return
        }
        var sql = 'SELECT * FROM user WHERE userid = "' + userid + '"AND password = "' + password + '"';
        console.log(sql);
        query(sql, function (err, rows, fields) {
            if (err) {
                throw (err);
            }
            console.log("rows.length", rows.length);
            if (rows.length == 0) {
                callback({ exist: 1 });   //密码错误
                return
            }
            callback({ exist: 0, data: rows[0] }); //返回账户信息
        })
    })
};

exports.user_register = function (userid, password, callback) {
    callback = callback == null ? nop : callback;
    if (userid == null || password == null) {
        console.log("userid is null or password is null !");
        callback(null);
        return;
    }
    var sql = 'INSERT INTO user(userid,password,sceneCount) VALUES("{0}", "{1}","{2}")';
    sql = sql.format(userid, password, 1);
    console.log(sql)
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(false);
            throw (err);
        } else {
            callback(true);
        }

    })
};

exports.user_pass = function (userid, sceneCount, callback) {
    callback = callback == null ? nop : callback;
    if (userid == null || sceneCount == null) {
        console.log("user id is null or sceneCount is null");
        callback({ errcode: 2 });
        return
    }
    var sql = 'SELECT sceneCount FROM user WHERE userid="' + userid + '"';
    console.log(sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            callback({ errcode: 2 });
            throw (err)
        }
        if (rows.length == 0) {
            callback({ errcode: 2 });
            return;
        }
        console.log(rows[0])
        if (rows[0].sceneCount < sceneCount)
            var sql = 'UPDATE user SET sceneCount=' + sceneCount + ' WHERE userid = "' + userid + '"';
        else {
            console.log("user already pass this scene")
            callback({ errcode: 1 });
            return;
        }
        console.log(sql);
        query(sql, function (err, rows, fields) {
            if (err) {
                callback({ errcode: 2 })
                throw (err)
            }
            if (rows.length == 0) {
                console.log("update err")
                callback({ errcode: 2 })
                return;
            }
            console.log("success")
            callback({ errcode: 0 })

        })
    })
};

exports.test_question = function (callback) {
    callback = callback == null ? nop : callback;
    //var sql = 'SELECT * FROM question'
    var sql = 'SELECT * FROM question order by rand() limit 30'
    console.log(sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            throw (err)
        }
        console.log(rows);
        callback(rows)
    })
};

exports.update_achieve = function (userid, achieveId, callback) {
    callback = callback == null ? nop : callback;
    if (userid == null || achieveId == null) {
        console.log("user id is null or achieveId is null");
        callback(1);
        return
    }
    var sql = 'SELECT achievement FROM user WHERE userid = "' + userid + '"';
    console.log(sql)
    query(sql, function (err, rows, fields) {
        if (err) {
            throw (err)
        }
        console.log(rows)
        console.log(rows[0].achievement);
        if (rows[0].achievement == null || rows[0].achievement == "") {
            console.log("is null")
            var achieve = achieveId;
        } else {
            var achieve = rows[0].achievement + "," + achieveId;
        }
        console.log(achieve);
        var sql = 'UPDATE user SET achievement = "' + achieve + '" WHERE userid = "' + userid + '"';
        console.log(sql);
        query(sql, function (err, rows, fields) {
            if (err) {
                throw (err)
            }
            console.log(rows);
            if (rows.length == 0) {
                console.log("update err")
                callback(1)
                return;
            }
            console.log("success")
            callback(0)
        })
    })

}







//测试
// exports.dbtest=function()

exports.query = query;