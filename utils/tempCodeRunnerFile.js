exports.is_password_true=function(account,password,callback){
    callback = callback == null? nop:callback;
    var sql='SELECT password FORM accounts WHERE account ="'+ account + '"';
    query(sql, function(err, rows, fields) {
        // if (err) {
        //     callback(false);
        //     throw err;
        // }
        //   rows[0].password=crypto.md5(rows[0].password);
        // if (err) {
        //     callback(false);
        //     throw err;
        // }
        // // var psw=crypto.md5(password);
        // if(password!==null ){
        //     // var psw=crypto.md5(password);
        //    if(password==rows[0].password)
        //    {
        //        callback(true);
        //         return;
        //     }
        // }
        console.log(rows[0]);

})
};