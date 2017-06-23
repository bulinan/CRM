define(function (require, exports, module) {
    var bootstrap = require('application/bootstrap'),
        cookie = require('cookie'),
        amCharts = require('amcharts.serial'),
        templet_report_item = require('lib/text!application/templet/report_item.html');

    exports.bootstrap_init = function () {
        exports.init();
    }
    exports.init = function () {
        bootstrap.component_menu_active('report');
        bootstrap.bootstrap_initWorkspace();
        bootstrap.bootstrap_initUsers();
        bootstrap.bootstrap_initMain(function () {
            var jsonStr, jsonObj;
            if ($.cookie('report_person')) {
                jsonStr = $.cookie('report_person');
                jsonObj = JSON.parse(jsonStr);
            } else {
                bootstrap.bootstrap_full_users();
                jsonStr = JSON.stringify(airteams.USERS);
                jsonObj = airteams.USERS;
            }
            bootstrap.bootstrap_push('新增客户联系人的数量-时间分布', '/report_person');
            $('#workspace').html(Handlebars.compile(templet_report_item)({ 'USER_ID': airteams.account.USER.ID, 'USER_NAME': airteams.account.USER.NAME, 'USERS': jsonStr, 'TITLE': '新增客户联系人的数量-时间分布', 'MODEL': 'report_person' }));
            //显示span.user的text
            var title = $('#report_item .title');
            if(title.find('span.user').attr('data-user')){
                bootstrap.bootstrap_user_showText(title, jsonObj);
            }
            
            bootstrap.component_selector_bind();
            bootstrap.component_report_year_fill();

            var data = bootstrap.component_report_timeSelect_bind();
            exports.chart_load(data);
        });
    };
    exports.component_selector_time = function () {
        var data = bootstrap.component_report_timeSelect_bind();
        exports.chart_load(data);
    };
    exports.chart_load = function (_data) {

        bootstrap.bootstrap_call('report/person', _data, function (response) {
            console.log(response);
            $('#box_main_chart').height($('#report_item').height() - 125);

            var chart = amCharts.makeChart('box_main_chart', {
                "type": "serial",
                "legend": {
                    "align": "center",
                    "position": "right"
                },
                "dataProvider": response,
                "graphs": [{
                    "balloonText": "新建客户: [[value]]个",
                    "bullet": "round",
                    "title": "客户",
                    "valueField": "CUSTOMER",
                    "fillAlphas": 0
                }, {
                    "balloonText": "新建联系人: [[value]]人",
                    "bullet": "round",
                    "title": "联系人",
                    "valueField": "PERSON",
                    "fillAlphas": 0
                }],
                "categoryField": "MONTH"
            });
        });

    };
    exports.component_user_submit = function () {
        var title = $('#report_item .title'),
            data = bootstrap.component_report_user_params();

        //设置cookie
        var user_cookie = JSON.stringify(airteams.USERS);
        $.cookie('report_person', user_cookie);

        var num = 0, users_length = 0, member_length = 0, group_id;
        for (var index in airteams.account.GROUP) {
            member_length = member_length + airteams.account.GROUP[index].MEMBER.length;
        }

        for (var index in airteams.USERS) {
            users_length = users_length + airteams.USERS[index].length;

            for (var number = 0; number < airteams.USERS[index].length; number++) {
                data.OWNER.push(airteams.USERS[index][number]);
            }
            if (airteams.USERS[index].length) {
                num++;
                group_id = index;
            }
        }
        if (data.OWNER.length) {
            if (users_length == member_length) {
                title.find('span.user').html('所有人');
            } else {
                if (num == 1) {
                    for (var index in airteams.account.GROUP) {
                        if (airteams.account.GROUP[index].ID == group_id) {
                            var group_name = airteams.account.GROUP[index].NAME;
                            if (data.OWNER.length == airteams.account.GROUP[index].MEMBER.length) title.find('span.user').html(group_name + '所有人');
                            else {
                                if (data.OWNER.length == 1) title.find('span.user').html(bootstrap.bootstrap_loadUser(airteams.account.GROUP, data.OWNER[0]).NAME);
                                else title.find('span.user').html(bootstrap.bootstrap_loadUser(airteams.account.GROUP, data.OWNER[0]).NAME + ' 等' + data.OWNER.length + '人');
                            }
                        }
                    }

                } else title.find('span.user').html(bootstrap.bootstrap_loadUser(airteams.account.GROUP, data.OWNER[0]).NAME + ' 等' + data.OWNER.length + '人');
            }
            var jsonStr = JSON.stringify(airteams.USERS);
            title.find('span.user').attr('data-user', jsonStr);
            bootstrap.component_owner_transfer_close();
            exports.chart_load(data);
        } else {
            alert('请选择需要筛选的用户');
        }
    }
});