define(function (require, exports, module) {

    var bootstrap = require('application/bootstrap'),
        amCharts = require('amcharts.serial'),
        templet_dashboard = require('lib/text!application/templet/dashboard.html'),
        templet_dashboard_history = require('lib/text!application/templet/dashboard_history.html'),
        templet_task_new = require('lib/text!application/templet/task_new.html'),
        templet_task_edit = require('lib/text!application/templet/task_edit.html');

    exports.bootstrap_init = function () {
        exports.init();
    }
    exports.init = function () {
        bootstrap.component_menu_active('dashboard');
        bootstrap.bootstrap_initWorkspace();
        //bootstrap.bootstrap_showLoading();
        bootstrap.bootstrap_initMain(function(){
            bootstrap.bootstrap_push('工作中心', '/dashboard');
            $('#workspace').html(Handlebars.compile(templet_dashboard)());

            bootstrap.bootstrap_call('history/list', {}, function (response) {
                console.log(response);
                var template = Handlebars.compile(templet_dashboard_history),
                    container = $('#dashboard .panel_right .history .content ul');

                container.html('');
                Handlebars.registerHelper("model", function (model) {
                    var modelMap = {
                        'CUSTOMER': '客户',
                        'PERSON': '个人',
                        'OPPORTUNITY': '业务机会'
                    };
                    return modelMap[model];
                });
                Handlebars.registerHelper("modelId", function (object) {
                    switch (object.MODEL) {
                        case 'OPPORTUNITY':
                            return object.OPPORTUNITY;
                            break;
                        case 'CUSTOMER':
                            return object.CUSTOMER;
                            break;
                        case 'PERSON':
                            return object.PERSON;
                            break;
                    }
                });
                Handlebars.registerHelper("time", function (time) {
                    var date = bootstrap.bootstrap_timestamp_to_date(time),
                        date_year = date.getFullYear(),
                        date_month = bootstrap.bootstrap_time_append_zero(date.getMonth() + 1),
                        date_day = bootstrap.bootstrap_time_append_zero(date.getDate());
                        date_hours = bootstrap.bootstrap_time_append_zero(date.getHours()),
                        date_minutes = bootstrap.bootstrap_time_append_zero(date.getMinutes());
                    return date_year + '-' + date_month + '-' + date_day + ' ' + date_hours + ':' + date_minutes;
                });
                Handlebars.registerHelper("method", function (model) {
                    switch (model) {
                        case 'OPPORTUNITY':
                            return 'opportunity_item.init';
                            break;
                        case 'CUSTOMER':
                            return 'customer_item.init';
                            break;
                        case 'PERSON':
                            return 'person_item.init';
                            break;
                    }
                });
                if (response.RESULT.length) {
                    if (response.RESULT.length < 6) container.append(template(response.RESULT));
                    else container.append(template(response.RESULT.slice(0, 5)));
                } else {
                    container.append('<li class="empty">您还没有浏览任何东西</li>');
                }
            });
            bootstrap.bootstrap_call('event/list', {}, function (response) {
                $('#dashboard .panel_left .content ul').html('');
                bootstrap.show_events('event', response);
            });
            bootstrap.bootstrap_call('task/load', {}, function (response) {
                console.log(response);

                var date = new Date(),
                    container = $('#dashboard .panel_full .content'),
                    year = date.getFullYear(),
                    month = date.getMonth() + 1,
                    day = date.getDate(),
                    daysOfCurMonth = new Date(year, month, 0).getDate(),
                    result = response[year][month],
                    rate = (result.REACH / result.TASK).toFixed(2),
                    finish = response.FINISH;
                
                    container.find('.value_head span').html(finish.WEEK);
                    container.find('.box_other.reach strong').html(result.REACH);
                    container.find('.box_other.payment strong').html(result.PAYMENT);
                    container.find('.box_other.customer strong').html(finish.CUSTOMER);
                    container.find('.box_other.opportunity strong').html(finish.OPPORTUNITY);

                if (result.TASK) {
                    container.find('li.task span').html(result.TASK);
                    container.find('li.days span').html(daysOfCurMonth - day + '天');
                    if(rate > 1) {
                        container.find('li.complete span').html('100%');
                        container.find('li.surplus span').html('0%');
                    }
                    else {
                        container.find('li.complete span').html(rate * 100 + '%');
                        container.find('li.surplus span').html((1 - rate) * 100 + '%');
                    }
                } else {
                    container.find('ul').html('<li class="empty"><em>还没有任务？</em><a href="javascript:;" data-method="dashboard.task_new">添加一个？</a></li>');
                }

                var chart = amCharts.makeChart('box_main_chart', {
                    "type": "serial",
                    "valueAxes": [{
                        "position": "right"
                    }],
                    "graphs": [{
                        "title": "red line",
                        "bullet": "round",
                        "bulletSize": 10,
                        "bulletBorderAlpha": 1,
                        "bulletBorderColor": "#FFFFFF",
                        "bulletColor": "#2681DC",
                        "lineThickness": 2,
                        "valueField": "value"
                    }],
                    "valueAxes": [{
                        "axisThickness": 0,
                        "position": "right",
                        "gridAlpha": 0.5,
                        "gridColor": "#FFFFFF",
                        "tickLength": 0
                    }],
                    "color": "#FFFFFF",
                    "colors": ["#FFFFFF"],
                    "backgroundAlpha" : 1,
                    "backgroundColor": "#2681DC",
                    "categoryField": "date",
                    "marginTop": 0,
                    "marginBottom": 15,
                    "categoryAxis": {
                        "position": "top",
                        "axisAlpha": 0,
                        "gridThickness": 0
                    },
                    "dataProvider": finish.CHART_BY_WEEK
                }); 
            });

        });
    };
    exports.task_average = function () {
        var container = $('#task');

        var value = container.find('input[name=year_goal]').val();
        if(value != '' && !/^\d+(\.\d+)?$/.test(value)){
            alert('输入的目标金额须为数字(正数)');
            $('input[name=year_goal]').val('');
        }else{
            if (value % 12) {
                alert('年度目标不是12的整数倍，不能平均分配到每个月。');
            } else {
                container.find('table thead input').val(value / 4);
                container.find('table tbody input').val(value / 12);
            }
        }
    };
    exports.task_new = function () {
        $('#component_window_qr').show();
        bootstrap.bootstrap_initPopup();
        $('#workspace').append(templet_task_new);
        var container = $('#task'),
            left = ($(window).width() - 925)/2,
            date = new Date();

        container.show().css({'left' : left});
        window.onresize = function() {
            container.css({'left' : left});
        }
        for (var index = -1; index < 2; index++) {
            container.find('.selector ul.selector_list').append('<li data-value="' + (date.getFullYear() + index) + '">' + (date.getFullYear() + index) + '年</li>');
        }
        container.find('.selector .selector_title').attr('data-value', date.getFullYear()).find('span.text').html(date.getFullYear() + '年');
        container.find('.selector ul.selector_list li[data-value=' + date.getFullYear() + ']').addClass('selected');
        bootstrap.component_selector_bind();
        container.find('span.year').html(date.getFullYear());
    };
    exports.task_edit = function () {
        $('#component_window_qr').show();
        var template = Handlebars.compile(templet_task_edit),
            left = ($(window).width() - 925)/2,
            date = new Date();

        bootstrap.bootstrap_call('task/load', {}, function (response) {
            var tasks = {};
            for (var year_index in response) {
                if (year_index == date.getFullYear()) {
                    var index = 1;
                    for (month_index in response[year_index]) {
                        tasks['TASK_' + index + ''] = response[year_index][month_index].TASK;
                        index++;
                    }
                    tasks['FIRST'] = tasks.TASK_1 + tasks.TASK_2 + tasks.TASK_3;
                    tasks['SECOND'] = tasks.TASK_4 + tasks.TASK_5 + tasks.TASK_6;
                    tasks['THIRD'] = tasks.TASK_7 + tasks.TASK_8 + tasks.TASK_9;
                    tasks['FOURTH'] = tasks.TASK_10 + tasks.TASK_11 + tasks.TASK_12;
                    tasks['YEAR'] = tasks['FIRST'] + tasks['SECOND'] + tasks['THIRD'] + tasks['FOURTH'];
                }
            }
            bootstrap.bootstrap_initPopup();
            $('#workspace').append(template(tasks));
            var container = $('#task');

            container.show().css({'left' : left});
            window.onresize = function() {
                container.css({'left' : ($(window).width() - 925)/2});
            }
            for (var index = -1; index < 2; index++) {
                container.find('.selector ul.selector_list').append('<li data-value="' + (date.getFullYear() + index) + '">' + (date.getFullYear() + index) + '年</li>');
            }
            container.find('.selector .selector_title').attr('data-value', date.getFullYear()).find('span.text').html(date.getFullYear() + '年');
            container.find('.selector ul.selector_list li[data-value=' + date.getFullYear() + ']').addClass('selected');
            container.find('span.year').html(date.getFullYear());
            bootstrap.component_selector_bind();
        });

    };
    exports.component_year_select = function () {
        var content = arguments[1].find('div.selector_title'),
            value = content.attr('data-value');
        $('#task').find('span.year').html(value);
    };
    exports.data_show = function () {
        var content = arguments[1].find('div.selector_title'),
            value = content.attr('data-value'),
            container = $('#task');
        container.find('span.year').html(value);
        bootstrap.bootstrap_call('task/load', {}, function (response) {

            for (var year_index in response) {
                if (year_index == value) {
                    var index = 0, tasks = {};
                    for (month_index in response[year_index]) {
                        tasks['task' + (index + 1)] = response[year_index][month_index].TASK;
                        container.find('tbody input').eq(index).val(response[year_index][month_index].TASK);
                        index++;
                    }
                    var first = tasks.task1 + tasks.task2 + tasks.task3,
                        second = tasks.task4 + tasks.task5 + tasks.task6,
                        third = tasks.task7 + tasks.task8 + tasks.task9,
                        fourth = tasks.task10 + tasks.task12 + tasks.task12,
                        year_all = first + second + third + fourth;
                    container.find('input[name=year_goal]').val(year_all);
                    container.find('input[name=first_quarter]').val(first);
                    container.find('input[name=second_quarter]').val(second);
                    container.find('input[name=third_quarter]').val(third);
                    container.find('input[name=fourth_quarter]').val(fourth);
                }
            }
        });


    };
    exports.task_edit_submit = function () {
        var date = new Date(),
            container = $('#task'),
            year = container.find('.selector div.selector_title').attr('data-value'),
            bool = true,
            first_quarter = container.find('input[name=first_quarter]').val(),
            second_quarter = container.find('input[name=second_quarter]').val(),
            third_quarter = container.find('input[name=third_quarter]').val(),
            fourth_quarter = container.find('input[name=fourth_quarter]').val(),
            params = {};

        params['TASK'] = {};
        params['TASK'][year] = {
            1: container.find('input[name=january]').val(),
            2: container.find('input[name=february]').val(),
            3: container.find('input[name=march]').val(),
            4: container.find('input[name=april]').val(),
            5: container.find('input[name=may]').val(),
            6: container.find('input[name=june]').val(),
            7: container.find('input[name=july]').val(),
            8: container.find('input[name=august]').val(),
            9: container.find('input[name=september]').val(),
            10: container.find('input[name=october]').val(),
            11: container.find('input[name=november]').val(),
            12: container.find('input[name=december]').val()
        };
        var first = parseInt(container.find('input[name=january]').val()) + parseInt(container.find('input[name=february]').val()) + parseInt(container.find('input[name=march]').val()),
            second = parseInt(container.find('input[name=april]').val()) + parseInt(container.find('input[name=may]').val()) + parseInt(container.find('input[name=june]').val()),
            third = parseInt(container.find('input[name=july]').val()) + parseInt(container.find('input[name=august]').val()) + parseInt(container.find('input[name=september]').val()),
            fourth = parseInt(container.find('input[name=october]').val()) + parseInt(container.find('input[name=november]').val()) + parseInt(container.find('input[name=december]').val()),
            year_all = parseInt(first_quarter) + parseInt(second_quarter) + parseInt(third_quarter) + parseInt(fourth_quarter);
        console.log(params);
        if (bool && first != first_quarter) {
            bool = false;
            alert('1-3月目标之和与一季度的目标不一致，请确认。');
        }
        if (bool && second != second_quarter) {
            bool = false;
            alert('4-6月目标之和与二季度的目标不一致，请确认。');
        }
        if (bool && third != third_quarter) {
            bool = false;
            alert('7-9月目标之和与三季度的目标不一致，请确认。');
        }
        if (bool && fourth != fourth_quarter) {
            bool = false;
            alert('10-12月目标之和与四季度的目标不一致，请确认。');
        }
        
        if(container.find('input[name=year_goal]').val()){
            if (bool && year_all != parseInt(container.find('input[name=year_goal]').val())) {
                bool = false;
                alert('12个月目标之和与全年的目标不一致，请确认。');
            }
        }
        if (bool) {
            bootstrap.bootstrap_call('task/edit', params, function (_response) {
                console.log(_response);
                $('#dashboard .panel_right .task').find('ul').attr('data-year', year);
                exports.task_close();
                exports.init();
            });
        }
    };
    exports.task_close = function () {
        $('#component_window_qr').hide();
        $('#task').remove();
    }
});