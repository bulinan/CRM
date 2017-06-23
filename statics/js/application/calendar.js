define(function (require, exports, module) {

    var bootstrap = require('application/bootstrap'),
        cookie = require('cookie'),
        templet_calendar = require('lib/text!application/templet/calendar.html'),
        templet_calendar_todo_self = require('lib/text!application/templet/calendar_todo_self.html'),
        templet_calendar_todo_other = require('lib/text!application/templet/calendar_todo_other.html'),
        templet_calendar_todo_new = require('lib/text!application/templet/calendar_todo_new.html'),
        templet_calendar_date = require('lib/text!application/templet/calendar_date.html'),
        templet_calendar_todo_item = require('lib/text!application/templet/calendar_todo_item.html');

    exports.bootstrap_init = function () {
        exports.init();
    }
    exports.init = function () {
        bootstrap.component_menu_active('calendar');
        bootstrap.bootstrap_initWorkspace();
        bootstrap.bootstrap_initUsers();
        bootstrap.bootstrap_initMain(function () {
            var jsonStr, jsonObj;
            if ($.cookie('calendar')) {
                jsonStr = $.cookie('calendar');
                jsonObj = JSON.parse(jsonStr);
            } else {
                bootstrap.bootstrap_full_users();
                jsonStr = JSON.stringify(airteams.USERS);
                jsonObj = airteams.USERS;
            }
            bootstrap.bootstrap_push('日程安排', '/calendar');
            $('#workspace').html(Handlebars.compile(templet_calendar)({ 'USER_ID': airteams.account.USER.ID, 'USER_NAME': airteams.account.USER.NAME, 'USERS': jsonStr }));

            //显示span.user的text
            var container = $('#workspace .header'),
                json;
            if (container.find('span.user').attr('data-user')) {
                bootstrap.bootstrap_user_showText(container, jsonObj);
                json = jsonObj;
            } else {
                json = {};
            }

            var element_width = container.find('span.user').outerWidth(),
                elemment_right = container.find('span.user').css('right').toString().slice(0, -2);

            container.find('ul.select_date').css('right', parseInt(element_width) + parseInt(elemment_right) + 9);

            var date = new Date(),
                year = date.getFullYear(),
                month = date.getMonth();

            exports.calendar_init(year, month + 1, json);
        });
    };
    exports.calendar_init = function (_year, _month, jsonObj) {
        var daysOfCurMonth = new Date(_year, _month, 0).getDate(),    //当月的天数
            curDate = new Date(_year, _month - 1, 1),
            firstDay = curDate.getDay(),    //每个月第一天是星期几
            html = '',
            row = Math.ceil((firstDay + daysOfCurMonth) / 7);

        $('#calendar_table thead').html('');
        $('#calendar_table tbody').html('');

        for (var i = 0; i < row; i++) {
            html = html + '<tr>';
            for (var j = 0; j < 7; j++) {
                html = html + '<td data-model="calendar" data-method="calendar.calendar_todo_new"></td>';
            }
            html = html + '</tr>';
        }
        $('#calendar_table thead').html('<tr><th>星期日</th><th>星期一</th><th>星期二</th><th>星期三</th><th>星期四</th><th>星期五</th><th>星期六</th></tr>');
        $('#calendar_table tbody').append(html);

        var date = new Date(),
            today = date.getDate(),
            f = firstDay;

        for (var n = 1; n <= daysOfCurMonth; n++) {

            $('#calendar_table td').eq(f).html(n);
            $('#calendar_table td').eq(f).attr('data-year', _year).attr('data-month', bootstrap.bootstrap_time_append_zero(_month)).attr('data-day', bootstrap.bootstrap_time_append_zero(n));

            if (n == today && _month == parseInt(date.getMonth()) + 1 && _year == date.getFullYear()) {
                $('#calendar_table td').eq(firstDay + n - 1).css('background-color', '#fffee0');
                //$('#calendar_table td').eq(firstDay + n - 1).attr('date-curent', _year + '-' + _month + '-' + today);
            }
            f++;

        }

        $('.header strong.year').html(_year);
        $('.header strong.month').html(_month);

        if (date.getFullYear() == _year && date.getMonth() == _month - 1) {
            $('.header a.today').addClass('default');
        } else {
            $('.header a.today').removeClass('default');
        }

        //显示上一个月剩余的天数
        var daysOfLastMonth = new Date(_year, _month - 1, 0).getDate();    //上一个月的天数

        for (var m = firstDay - 1; m >= 0; m--) {
            $('#calendar_table td').eq(m).html(daysOfLastMonth).addClass('other').removeAttr('data-method');
            if (_month == 1) {
                $('#calendar_table td').eq(m).attr('data-year', parseInt(_year) - 1).attr('data-month', 12).attr('data-day', daysOfLastMonth);
            } else {
                $('#calendar_table td').eq(m).attr('data-year', _year).attr('data-month', bootstrap.bootstrap_time_append_zero(_month - 1)).attr('data-day', daysOfLastMonth);
            }

            daysOfLastMonth--;
        }

        //显示下个月剩余的天数

        var fillDays = firstDay + daysOfCurMonth, //下一个月在当前日历中显示的天数
        emptyDays = row * 7 - fillDays;

        if (emptyDays >= 1) {
            for (var k = 1; k <= emptyDays; k++) {

                $('#calendar_table td').eq(fillDays).html(k).addClass('other').removeAttr('data-method');
                if (_month == 12) {
                    $('#calendar_table td').eq(fillDays).attr('data-year', parseInt(_year) + 1).attr('data-month', 01).attr('data-day', bootstrap.bootstrap_time_append_zero(k));
                } else {
                    $('#calendar_table td').eq(fillDays).attr('data-year', _year).attr('data-month', bootstrap.bootstrap_time_append_zero(_month + 1)).attr('data-day', bootstrap.bootstrap_time_append_zero(k));
                }

                fillDays++;
            }
        }

        var params = {
            'DATE_AFTER': _year + '-' + _month + '-' + '01',
            'DATE_BEFORE': _year + '-' + _month + '-' + daysOfCurMonth
        };
        if (!$.isEmptyObject(jsonObj)) {
            params['OWNER'] = bootstrap.bootstrap_user_cookie(jsonObj);
        }
        if (!$('#calendar_table td ul').html()) $('#calendar td').append('<ul></ul>');

        bootstrap.bootstrap_call('common/calendar', params, function (response) {
            var templete = Handlebars.compile(templet_calendar_todo_item);
            var n = [], data = {};
            for (var i = 0; i < response.length; i++) {
                if (n.indexOf(response[i].DAY) == -1) n.push(response[i].DAY);
            }
            for (var index = 0; index < n.length; index++) {
                var name = n[index], item = [];

                for (var i = 0; i < response.length; i++) {
                    if (response[i].DAY == name) {
                        response[i]['USER_PHONE'] = airteams.account.USER.PHONE;
                        item.push(response[i]);
                    }
                }
                data[name] = item;
            }
            console.log(data);
            Handlebars.registerHelper("judge", function (type, options) {
                if (type == 'TODO') return options.fn(this);
                else return options.inverse(this);
            });
            Handlebars.registerHelper("modelClass", function (model, options) {
                if (model == 'CALENDAR') return options.fn(this);
                else return options.inverse(this);
            });
            Handlebars.registerHelper("modelID", function (dataItem) {
                var model = dataItem.RELATION.MODEL;
                return dataItem['RELATION'][model].ID;
            });
            Handlebars.registerHelper("modelName", function (dataItem) {
                var model = dataItem.RELATION.MODEL;
                return dataItem['RELATION'][model].NAME;
            });
            Handlebars.registerHelper("checkboxDone", function (done) {
                if (done) return new Handlebars.SafeString('<span class="checkbox selected" data-value="1" data-method="calendar.calendar_todo_check"></span>');
                else return new Handlebars.SafeString('<span class="checkbox" data-value="0" data-method="calendar.calendar_todo_check"></span>');
            });
            Handlebars.registerHelper("otherCheckboxDone", function (done) {
                if (done) return new Handlebars.SafeString('<span class="checkbox selected selectedDisabled" data-value="1"></span>');
                else return new Handlebars.SafeString('<span class="checkbox disabled" data-value="0"></span>');
            });
            Handlebars.registerHelper("textDone", function (done) {
                if (done) return 'checked';
            });
            Handlebars.registerHelper("object", function (relation) {
                var model = relation.MODEL;
                return relation[model]['NAME'];
            });
            $('#calendar_table td ul').html('');
            for (index in data) {
                $('#calendar_table td[data-month=' + bootstrap.bootstrap_time_append_zero(_month) + '][data-day=' + index + '] ul').append(templete(data[index]));
            }

        });
        $('#calendar_table').find('td').on('click', 'span.checkbox', function () {
            if ($(this).hasClass('disabled') || $(this).hasClass('selectedDisabled')) {
            } else {
                if ($(this).attr('data-value') == 1) {
                    $(this).attr('data-value', 0);
                    $(this).parent().find('span.name').removeClass('checked');
                    $(this).parent().attr('data-done', 0);
                }
                else {
                    $(this).attr('data-value', 1);
                    $(this).parent().find('span.name').addClass('checked');
                    $(this).parent().attr('data-done', 1);
                }
                $(this).toggleClass('selected');
            }
        });
    };
    exports.component_today = function () {
        var date = new Date();
        exports.calendar_init(date.getFullYear(), date.getMonth() + 1);
    };
    exports.component_last_month = function () {
        var _year = arguments[1].closest('ul.select_date').find('strong.year').html(),
            _month = arguments[1].closest('ul.select_date').find('strong.month').html();

        exports.calendar_init(_year, _month - 1);
        if (_month < 2) exports.calendar_init(parseInt(_year) - 1, 12);
    };
    exports.component_next_month = function () {
        var _year = arguments[1].closest('ul.select_date').find('strong.year').html(),
            _month = arguments[1].closest('ul.select_date').find('strong.month').html();

        exports.calendar_init(_year, parseInt(_month) + 1);
        if (_month > 11) exports.calendar_init(parseInt(_year) + 1, 1);
    };
    exports.calendar_window_close = function () {
        $('#component_window_qr').hide();
        $('#component_popup').html('').hide();
    };
    exports.calendar_date_show = function () {
        $('#component_window_qr').show();
        var container = $('#component_popup'),
            element = arguments[1],
            td = element.closest('td'),
            template = Handlebars.compile(templet_calendar_date),
            params = {
                'DATE': td.attr('data-year') + '-' + td.attr('data-month') + '-' + td.attr('data-day'),
                'MODELNAME': element.find('span.model_name').html(),
                'NAME': element.find('span.name').html(),
                'MODELID': element.find('span.model_name').attr('data-id')
            };

        container.html('');
        container.html(template(params)).show();
    }
    exports.calendar_todo_show = function () {
        var e = arguments[0] || event,
            obj = arguments[0].srcElement || arguments[0].target,
            element = arguments[1],
            container = $('#component_popup'),
            done = element.attr('data-done'),
            done_text,
            year = element.attr('data-year'),
            month = element.attr('data-month'),
            day = element.attr('data-day'),
            date = year + '-' + month + '-' + day,
            deadline = element.attr('data-deadline'),
            stamp = bootstrap.bootstrap_timestamp_to_date(deadline),
            date_hours = bootstrap.bootstrap_time_append_zero(stamp.getHours()),
            date_minutes = bootstrap.bootstrap_time_append_zero(stamp.getMinutes()),
            todo_state = {
                '0': '正在处理',
                '1': '已经完成'
            };

        if (obj.className.split(' ')[0].toLowerCase() == 'checkbox') {
        } else {
            $('#component_window_qr').show();
            container.html('');
            if (element.attr('data-self') == '1') {
                container.html(templet_calendar_todo_self).show().addClass('calendar_self').attr('data-relation', element.attr('data-id')).attr('data-owner', element.attr('data-owner'));
                container.find('.button-group button:first').attr('data-method', 'calendar.calendar_todo_edit_submit');
                container.find('.button-group button').eq(1).attr('data-method', 'calendar.calendar_todo_delete');
                container.find('.button-group button').eq(2).attr('data-method', 'calendar.calendar_window_close');
                var done_element = container.find('li[data-mark=done] ul.selector_list li[data-value=' + done + ']');

                done_text = done_element.text();
                done_element.addClass('selected');
            } else {
                container.html(templet_calendar_todo_other).show().removeClass('calendar_self');
                container.find('.button-group button').attr('data-method', 'calendar.calendar_window_close');
                done_text = todo_state[done];
            }

            container.find('input[name=todo_name]').val(element.attr('data-name'));
            container.find('input[name=todo_deadline]').attr('data-date', date).val(year + '年' + month + '月' + day + '日');
            container.find('li[data-mark=done] div.selector_title').attr('data-value', done).find('span.text').html(done_text);
            container.find('li[data-mark=owner] div.area').html(bootstrap.bootstrap_loadUser(airteams.account.GROUP, element.attr('data-owner')).NAME);
            if (element.attr('data-remark') && element.attr('data-remark') != 'null') container.find('textarea[name=todo_remark]').html(element.attr('data-remark'));

            var data_model = element.attr('data-model');
            if (data_model != 'CALENDAR') {
                var mark;
                if (data_model == 'CUSTOMER') mark = 'customer_item';
                else if (data_model == 'OPPORTUNITY') mark = 'opportunity_item';
                container.find('ul[data-mark=relation] li a').attr('data-id', element.attr('data-parentid')).attr('data-method', mark + '.init').html(element.attr('data-parentname'));
                container.find('ul[data-mark=relation]').show();
                container.addClass('calendar_model');
            } else {
                container.removeClass('calendar_model');
            }

            // 小时和分钟
            bootstrap.bootstrap_exact_time(date_hours, date_minutes);
        }
        bootstrap.component_selector_bind();
    };
    exports.calendar_todo_new = function () {
        var e = arguments[0] || event,
            obj = arguments[0].srcElement || arguments[0].target,
            element = arguments[1],
            model = element.attr('data-model'),
            container = $('#component_popup');

        if (obj.tagName.toLowerCase() == 'td') {
            var year = element.attr('data-year'),
                month = element.attr('data-month'),
                day = element.attr('data-day'),
                date = year + '-' + month + '-' + day;

            $('#component_window_qr').show();
            container.html(templet_calendar_todo_new).show();
            container.find('.button-group button:first').attr('data-method', model + '.calendar_todo_new_submit');
            container.find('.button-group button.cancel').attr('data-method', model + '.calendar_window_close');
            bootstrap.component_selector_bind();
            container.find('input[name=todo_deadline]').attr('data-date', date).val(year + '年' + month + '月' + day + '日');
            container.find('li[data-mark=creator] div.area').html(airteams.account.USER.NAME);
            var curDate = new Date(),
                hour = curDate.getHours(),
                minute = curDate.getMinutes();

            bootstrap.bootstrap_exact_time(hour, minute);
        }
    };
    exports.calendar_todo_new_submit = function () {
        var container = $('#component_popup'),
            hour = container.find('div[data-mark=hour] div.selector_title').attr('data-value'),
            minute = container.find('div[data-mark=minute] div.selector_title').attr('data-value'),
            params = {
                'NAME': container.find('input[name=todo_name]').val(),
                'DEADLINE': container.find('input[name=todo_deadline]').attr('data-date') + ' ' + hour + ':' + minute + ':00',
                'REMARK': container.find('textarea[name=todo_remark]').val(),
                'RELATION': {},
                'MEMBER': [],
                'FILE': []
            };
        params['RELATION']['MODEL'] = 'CALENDAR';
        console.log(params);
        bootstrap.bootstrap_call('todo/new', params, function (response) {
            console.log(response);
            $('#calendar_table td[data-year=' + response.YEAR + '][data-month=' + response.MONTH + '][data-day=' + response.DAY + '] ul').append('<li class="self" data-owner="' + airteams.account.USER.ID + '" data-type="todo" data-id="' + response.ID + '" data-model="' + params.RELATION.MODEL + '" data-name="' + response.NAME + '" data-self="1" data-remark="' + response.REMARK + '" data-done="0" data-year="' + response.YEAR + '" data-month="' + response.MONTH + '" data-day="' + response.DAY + '" data-deadline="' + response.DATE + '" data-method="calendar.calendar_todo_show"><span class="checkbox"></span><span class="name">' + response.NAME + '</span></li>');
        });
        exports.calendar_window_close();
    };
    exports.calendar_todo_delete = function () {
        var id = $('#component_popup').attr('data-relation');
        if (confirm('确定删除此项日程安排吗？')) {
            bootstrap.bootstrap_call('todo/delete', { 'ID': id }, function (response) {
                exports.calendar_window_close();
                $('#calendar_table td').find('ul li[data-id=' + id + ']').remove();
            });
        }
    };
    exports.calendar_todo_edit_submit = function () {
        var container = $('#component_popup'),
            hour = container.find('div[data-mark=hour] div.selector_title').attr('data-value'),
            minute = container.find('div[data-mark=minute] div.selector_title').attr('data-value'),
            params = {
                'ID': container.attr('data-relation'),
                'NAME': container.find('input[name=todo_name]').val(),
                'DEADLINE': container.find('input[name=todo_deadline]').attr('data-date') + ' ' + hour + ':' + minute + ':00',
                'REMARK': container.find('textarea[name=todo_remark]').val(),
                'DONE': container.find('li[data-mark=done] div.selector_title').attr('data-value'),
                'RELATION': {},
                'MEMBER': [],
                'FILE': []
            };
        var element = $('#calendar_table li[data-id=' + params.ID + ']');
        params['RELATION']['MODEL'] = element.attr('data-model');
        if (element.attr('data-parentid')) params['RELATION'][element.attr('data-model')] = element.attr('data-parentid');

        bootstrap.bootstrap_call('todo/edit', params, function (response) {
            console.log(response);
            exports.calendar_window_close();
            $('#calendar_table td li[data-id=' + params.ID + ']').remove();
            if (response.RELATION.MODEL == 'CALENDAR') $('#calendar_table td[data-year=' + response.YEAR + '][data-month=' + response.MONTH + '][data-day=' + response.DAY + '] ul').append('<li class="self" data-owner="' + container.attr('data-owner') + '" data-type="todo" data-id="' + params.ID + '" data-model="' + params.RELATION.MODEL + '" data-name="' + response.NAME + '" data-self="1" data-remark="' + response.REMARK + '" data-done="' + response.DONE + '" data-year="' + response.YEAR + '" data-month="' + response.MONTH + '" data-day="' + response.DAY + '" data-deadline="' + response.DATE + '" data-method="calendar.calendar_todo_show"><span class="checkbox"></span><span class="name">' + response.NAME + '</span></li>');
            else $('#calendar_table td[data-year=' + response.YEAR + '][data-month=' + response.MONTH + '][data-day=' + response.DAY + '] ul').append('<li class="self" data-owner="' + container.attr('data-owner') + '" data-type="todo" data-id="' + params.ID + '" data-model="' + params.RELATION.MODEL + '" data-parentid="' + response.RELATION[response.RELATION.MODEL].ID + '" data-parentname="' + response.RELATION[response.RELATION.MODEL].NAME + '" data-name="' + response.NAME + '" data-self="1" data-remark="' + response.REMARK + '" data-done="' + response.DONE + '" data-year="' + response.YEAR + '" data-month="' + response.MONTH + '" data-day="' + response.DAY + '" data-deadline="' + response.DATE + '" data-method="calendar.calendar_todo_show"><span class="checkbox"></span><span class="name">' + response.RELATION[response.RELATION.MODEL].NAME + ' ' + response.NAME + '</span></li>');

            if (response.DONE) {
                $('#calendar_table td li[data-id=' + params.ID + ']').find('span.checkbox').attr('data-value', 1).addClass('selected');
                $('#calendar_table td li[data-id=' + params.ID + ']').find('span.name').addClass('checked');
            }
        });
    };
    exports.calendar_todo_check = function () {
        var element = arguments[1].parent(),
            deadline = element.attr('data-deadline'),
            stamp = bootstrap.bootstrap_timestamp_to_date(deadline),
            date_hour = bootstrap.bootstrap_time_append_zero(stamp.getHours()),
            date_minute = bootstrap.bootstrap_time_append_zero(stamp.getMinutes());
        params = {
            'ID': element.attr('data-id'),
            'NAME': element.attr('data-name'),
            'DEADLINE': element.attr('data-year') + '-' + element.attr('data-month') + '-' + element.attr('data-day') + ' ' + date_hour + ':' + date_minute + ':00',
            'REMARK': element.attr('data-remark'),
            'DONE': element.attr('data-done'),
            'STATE': '123',
            'RELATION': {},
            'MEMBER': [],
            'FILE': []
        };
        params['RELATION']['MODEL'] = element.attr('data-model');
        if (element.attr('data-parentid')) params['RELATION'][element.attr('data-model')] = element.attr('data-parentid');
        console.log(params);
        bootstrap.bootstrap_call('todo/edit', params, function (response) {
            console.log(response);
            //element.remove();
            //if (response.RELATION.MODEL == 'CALENDAR') $('#calendar_table td[data-year=' + response.YEAR + '][data-month=' + response.MONTH + '][data-day=' + response.DAY + '] ul').append('<li class="self" data-type="todo" data-id="' + params.ID + '" data-model="' + params.RELATION.MODEL + '" data-name="' + response.NAME + '" data-self="1" data-remark="' + response.REMARK + '" data-done="' + response.DONE + '" data-year="' + response.YEAR + '" data-month="' + response.MONTH + '" data-day="' + response.DAY + '" data-method="calendar.calendar_todo_show"><span class="checkbox"></span><span class="name">' + response.NAME + '</span></li>');
            //else $('#calendar_table td[data-year=' + response.YEAR + '][data-month=' + response.MONTH + '][data-day=' + response.DAY + '] ul').append('<li class="self" data-type="todo" data-id="' + params.ID + '" data-model="' + params.RELATION.MODEL + '" data-parentid="' + response.RELATION[response.RELATION.MODEL] + '" data-parentname="" data-name="' + response.NAME + '" data-self="1" data-remark="' + response.REMARK + '" data-done="' + response.DONE + '" data-year="' + response.YEAR + '" data-month="' + response.MONTH + '" data-day="' + response.DAY + '" data-method="calendar.calendar_todo_show"><span class="checkbox"></span><span class="name">' + response.RELATION.NAME + ' ' + response.NAME + '</span></li>');
            element.attr('data-done', response.DONE);
        });
    };
    exports.component_user_submit = function () {
        var _year = $('#workspace .header ul.select_date').find('strong.year').html(),
            _month = $('#workspace .header ul.select_date').find('strong.month').html(),
            daysOfCurMonth = new Date(_year, _month, 0).getDate(),
            element_user = $('#workspace .header').find('span.user'),
            data = {
                'DATE_AFTER': _year + '-' + _month + '-' + '01',
                'DATE_BEFORE': _year + '-' + _month + '-' + daysOfCurMonth,
                'OWNER': []
            };

        //设置cookie
        var user_cookie = JSON.stringify(airteams.USERS);
        $.cookie('calendar', user_cookie);

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
                element_user.html('所有人');
            } else {
                if (num == 1) {
                    for (var index in airteams.account.GROUP) {
                        if (airteams.account.GROUP[index].ID == group_id) {
                            var group_name = airteams.account.GROUP[index].NAME;
                            if (data.OWNER.length == airteams.account.GROUP[index].MEMBER.length) element_user.html(group_name + '所有人');
                            else {
                                if (data.OWNER.length == 1) element_user.html(bootstrap.bootstrap_loadUser(airteams.account.GROUP, data.OWNER[0]).NAME);
                                else element_user.html(bootstrap.bootstrap_loadUser(airteams.account.GROUP, data.OWNER[0]).NAME + ' 等' + data.OWNER.length + '人');
                            }
                        }
                    }

                } else {
                    element_user.html(bootstrap.bootstrap_loadUser(airteams.account.GROUP, data.OWNER[0]).NAME + ' 等' + data.OWNER.length + '人');
                }
                var element_width = element_user.outerWidth(),
                    elemment_right = element_user.css('right').toString().slice(0, -2);
                $('#workspace .header').find('ul.select_date').css('right', parseInt(element_width) + parseInt(elemment_right) + 9);
            }
            var jsonStr = JSON.stringify(airteams.USERS);
            element_user.attr('data-user', jsonStr);
            bootstrap.component_owner_transfer_close();
            bootstrap.bootstrap_call('common/calendar', data, function (response) {
                var templete = Handlebars.compile(templet_calendar_todo_item);

                var n = [], datas = {};
                for (var i = 0; i < response.length; i++) {
                    if (n.indexOf(response[i].DAY) == -1) n.push(response[i].DAY);
                }
                for (var index = 0; index < n.length; index++) {
                    var name = n[index], item = [];

                    for (var i = 0; i < response.length; i++) {
                        if (response[i].DAY == name) item.push(response[i]);
                    }
                    datas[name] = item;
                }
                console.log(datas);
                $('#calendar_table td ul').html('');
                for (index in datas) {
                    $('#calendar_table td[data-month=' + bootstrap.bootstrap_time_append_zero(_month) + '][data-day=' + index + '] ul').append(templete(datas[index]));
                }

            });
        } else {
            alert('请选择需要筛选的用户');
        }
    };
});