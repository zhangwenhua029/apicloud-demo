var ymma = {
    /**
     * 获取日期
     * @param  {[type]} addDayCount 相减数
     * @return {[type]}             形式为 xxxx-xx-xx
     */
    getDateStr: function(addDayCount) {
        addDayCount = addDayCount || 0;
        var dd = new Date();
        dd.setDate(dd.getDate() + addDayCount); //获取AddDayCount天后的日期 
        var y = dd.getFullYear();
        var m = dd.getMonth() + 1; //获取当前月份的日期 
        var d = dd.getDate();
        return y + "-" + (m > 9 ? m : '0' + m) + "-" + (d > 9 ? d : '0' + d);
    },
    /**
     * 合并两个对象
     * @param  {[type]} o1 [description]
     * @param  {[type]} o2 [description]
     * @return {[type]}    [description]
     */
    merge: function(_old, _new) {
        var _o = _old;
        for (var key in _new) {_o[key] = _new[key] }
        return _o;
    },
    /**
     * 监听夜间模式
     * @return {[type]} [description]
     */
    addMoonEvent : function (api) {
        var $body = $('body');
        api.getPrefs({key: 'moon'}, function( ret, err ){
            if( ret.value == 'moon' ) $body.addClass('theme-dark');
            else $body.removeClass('theme-dark');
        });
        api.addEventListener({name: 'event_Moon'}, function(ret, err) {
            api.closeSlidPane();
            if(ret.value == 'sun') $body.removeClass('theme-dark');
            else $body.addClass('theme-dark');
        });
    }
}


/**
 * sqlite3
 * 数据库操作的方法
 * @param  {[type]} api [description]
 * @return {[type]}     [description]
 */
function initSqlite(api) {
    if (!api) {return; }
    var db = api.require('db');
    var databaseName = 'localUser';
    return {
        /**
         * 判断数据库表是否有效
         * @param  {Function} callback [description]
         * @return {[type]}            [description]
         */
        init: function(callback) {
            callback = callback || function() {};
            api.getPrefs({key: 'db'}, function(ret, err) {
                if (ret && ret.value) callback();
                else {
                    db.openDatabase({name: databaseName, path: 'widget://localUser.db'}, function(ret, err){
                        api.setPrefs({key: 'db', value: '1'});
                        callback();
                    });
                }
            });
        },
        /**
         * http://docs.apicloud.com/%E7%AB%AFAPI/%E5%8A%9F%E8%83%BD%E6%89%A9%E5%B1%95/db#4
         * @param  {[type]}   param    [description]
         * @param  {Function} callback [description]
         * @return {[type]}            [description]
         */
        selectSql: function(param, callback) {
            db.selectSql(param, callback);
        },
        /**
         * http://docs.apicloud.com/%E7%AB%AFAPI/%E5%8A%9F%E8%83%BD%E6%89%A9%E5%B1%95/db#4
         * @param  {[type]}   param    [description]
         * @param  {Function} callback [description]
         * @return {[type]}            [description]
         */
        executeSql: function(param, callback) {
            db.executeSql(param, callback);
        },
        /**
         * 查询数据
         * @param  {object}   param    : {
         *                             table    : 表名 
         *                             column   : 输出的列
         *                             where    : 条件
         *                             orderby  : 排序
         *                             groupby  : 分组
         *                             limitBegin   : 开始
         *                             limitEnd     : 结束
         * }
         * @param  {Function} callback [description]
         */
        query: function(param, callback) {
            callback = callback || function(s) {}
            if (!param || !param.table) {
                callback({err: '参数出错！'});
                return;
            }
            var config = {
                table: '',
                column: '*',
                where: '1=1',
                orderby: '',
                groupby: '',
                limitBegin: 0,
                limitEnd: ''
            }
            param = ymma.merge(config, param);
            var sql = 'select ' + param.column + ' from ' + param.table + ' where ' + param.where;
            if (param.groupby) sql += ' group by ' + param.groupby;
            if (param.orderby) sql += ' order by ' + param.orderby;
            if (param.limitEnd) sql += ' limit ' + param.limitBegin + ',' + param.limitEnd + ' ';
            db.selectSql({name: databaseName, sql: sql }, function(ret, err) {
                if (ret.status && ret.data.length > 0) callback(ret.data);
                else callback({err: '获取数据出错！', content:err});
            });
        },
        /**
         * 获取数据表条数，根据条件
         * @param  {object}   param    : {
         *                             table    : 表名 
         *                             where    : 条件
         *                             groupby  : 分组
         * @param  {Function} callback [description]
         * @return {[type]}            [description]
         */
        count: function(param, callback) {
            callback = callback || function(s) {};
            if (!param || !param.table) {callback({err: '参数出错！'}); return; }
            var config = {
                table: '',
                where: '1=1',
                groupby: ''
            }
            param = ymma.merge(config, param);
            var sql = 'select count(1) as e from ' + param.table + ' where ' + param.where;
            if (param.groupby) sql += ' group by ' + param.groupby;
            db.selectSql({name: databaseName, sql: sql }, function(ret, err) {
                if (ret.status) callback(ret.data[0].e);
                else callback({err: '获取数据出错！', content:err});
            });
        },
        /**
         * 删除一条数据
         * @param  {string}   table    表名
         * @param  {string}   where    条件
         * @param  {Function} callback [description]
         */
        delete: function(table, where, callback) {
            callback = callback || function(s) {};
            if (!table || !where || where == '1=1') {callback({err: '参数出错！或条件为1=1！'}); return; }
            var sql = "delete from " + table + " where " + where;
            db.executeSql({name: databaseName, sql: sql }, function(ret, err) {
                if (ret.status) callback({res: '删除成功'});
                else callback({err: '删除数据出错！', content:err});
            });
        },
        /**
         * 更新一条数据
         * @param  {string}   table    表名
         * @param  {string}   set      更新的字段 例如："a='',b=''"
         * @param  {string}   where    条件
         * @param  {Function} callback [description]
         */
        update: function(table, set, where, callback) {

        },
        /**
         * 添加一条数据
         * @param  {[type]}   table    要添加的表
         * @param  {[type]}   columns  [description]
         * @param  {[type]}   values   [description]
         * @param  {Function} callback [description]
         * @return {[type]}            [description]
         */
        insert: function (table ,columns ,values ,callback) {
            callback = callback || function(s ,n) {};
            if (!table || !columns || !values) {callback({err: '参数出错！'}); return; }
            var sql = "insert into "+table+"("+columns+")values("+values+")";
            dbsql.executeSql({name: databaseName, sql: sql }, function(ret, err) {
                callback(ret, err);
            });
        }
    }
}
