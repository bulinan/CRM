define(function (require, exports, module) {
    var bootstrap = require('application/bootstrap'),
        customer = require('application/customer'),
        templet_customer_item = require('lib/text!application/templet/customer_item.html'),
        templet_customer_item_overview = require('lib/text!application/templet/customer_item_overview.html'),
        templet_customer_item_overview_person = require('lib/text!application/templet/customer_item_overview_person.html'),
        templet_customer_item_person = require('lib/text!application/templet/customer_item_person.html'),
        templet_customer_item_opportunity = require('lib/text!application/templet/customer_item_opportunity.html'),
        templet_customer_item_date = require('lib/text!application/templet/customer_item_date.html'),
        templet_customer_item_todo = require('lib/text!application/templet/customer_item_todo.html'),
        templet_customer_item_contract = require('lib/text!application/templet/customer_item_contract.html'),
        templet_customer_item_payment = require('lib/text!application/templet/customer_item_payment.html'),
        templet_customer_item_file = require('lib/text!application/templet/customer_item_file.html'),
        templet_customer_item_edit = require('lib/text!application/templet/customer_item_edit.html'),
        templet_contact = require('lib/text!application/templet/contact.html'), //
        templet_person_new = require('lib/text!application/templet/person_new.html'),
        templet_person_new_item = require('lib/text!application/templet/person_new_item.html'),
        templet_opportunity_new = require('lib/text!application/templet/opportunity_new.html'),
        templet_opportunity_new_item = require('lib/text!application/templet/opportunity_new_item.html'),
        templet_contract_new = require('lib/text!application/templet/contract_new.html'),
        templet_payment_new = require('lib/text!application/templet/payment_new.html'),
        templet_payment_new_item = require('lib/text!application/templet/payment_new_item.html'),
        templet_contract_new_item = require('lib/text!application/templet/contract_new_item.html'),
        templet_date_new = require('lib/text!application/templet/date_new.html'), //
        templet_date_customer_item = require('lib/text!application/templet/date_customer_item.html'), //
        templet_date_person_item = require('lib/text!application/templet/date_person_item.html'),
        templet_date_edit = require('lib/text!application/templet/date_edit.html'),
        templet_opportunity_item_overview_person = require('lib/text!application/templet/opportunity_item_overview_person.html'),
        templet_calendar_todo_new = require('lib/text!application/templet/calendar_todo_new.html'),
        templet_calendar_todo_self = require('lib/text!application/templet/calendar_todo_self.html'),
        templet_calendar_todo_other = require('lib/text!application/templet/calendar_todo_other.html');

    exports.bootstrap_init = function () {
        exports.init();
    }
    exports.init = function () {
        var id;
        if (arguments.length) {
            if (arguments.length == 2) {
                var element = arguments[1];
                id = element.attr('data-id');
                var e = arguments[0] || event, obj = arguments[0].srcElement || arguments[0].target;
                /*if (obj.className.toLowerCase() == ' checkbox' || obj.className.split(' ')[0].toLowerCase() == 'checkbox') {
                return;
                }*/
                if (obj.tagName.toLowerCase() == 'button') {
                    $('#component_window_qr').hide();
                }
            } else if (arguments.length == 1) {
                id = arguments[0];
            }
        } else {
            id = exports.component_customer_getId();
        }

        bootstrap.bootstrap_call('customer/load', { 'ID': id }, function (_response) {
            if (_response == 'CUSTOMER_NOT_EXISTS') {
                alert('客户不存在或无权限访问');
                $('#component_window_wait_workspace').hide();
                customer.init(); // 返回列表页
                return;
            }
            bootstrap.component_menu_active('customer');
            bootstrap.bootstrap_initWorkspace();
            bootstrap.bootstrap_initUsers();
            bootstrap.bootstrap_initMain(function () {
                bootstrap.bootstrap_push('客户详情', '/customer/' + id);
                $('#workspace').append(Handlebars.compile(templet_customer_item)(_response));
                bootstrap.component_selector_bind();

                customer_cache = _response;
                console.log(customer_cache);
                for (var number in _response.RELATION.SHARE) {
                    var group = bootstrap.bootstrap_loadUser(airteams.account.GROUP, _response.RELATION.SHARE[number]).RELATION.GROUP;
                    for (var index in airteams.USERS) {
                        if (group == index) airteams.USERS[index].push(_response.RELATION.SHARE[number]);
                    }
                }
                console.log(airteams.USERS);
                var container = $('#customer_item'),
                    jsonStr = JSON.stringify(airteams.USERS);
                $('#workspace').find('.basic h1').attr('data-id', _response.ID).html(_response.VERSION.CURRENT.NAME);
                container.find('.basic a.owner').attr('data-owner', _response.RELATION.OWNER).html(bootstrap.bootstrap_loadUser(airteams.account.GROUP, _response.RELATION.OWNER).NAME);
                container.find('.button-group a[data-user]').attr('data-user', jsonStr);
                exports.call(id);
            });
        });

    };
    exports.call = function (id) {
        var container = $('#customer_item');
        exports.component_initWorkspace();

        bootstrap.bootstrap_call('customer/load', { 'ID': id }, function (_response) {
            var container = $('#customer_item'),
                contact = _response.VERSION.CURRENT.CONTACT,
                contact_length = contact.length;

            container.find('.container .itemSpace').html(Handlebars.compile(templet_customer_item_overview)(_response));
            container.find('.panel_right .contact .content ul').html('');
            if (contact_length) {
                for (var index = 0; index < contact_length; index++) {
                    exports.customer_contact(contact[index].CLASS, contact[index].VALUE);
                }
            } else {
                container.find('.panel_right .contact .content ul').append('<li class="empty">暂时没有联系方式</li>')
            }

            bootstrap.bootstrap_call('person/list', { 'QUERY[CUSTOMER]': id }, function (_response) {
                var container = $('#customer_item .panel_right .person .content');
                container.html('');
                if (_response.COUNT_DATABASE) {
                    var template = Handlebars.compile(templet_customer_item_overview_person);

                    if (_response.COUNT_DATABASE > 6) container.append(template(_response.RESULT.splice(0, 6)));
                    else container.append(template(_response.RESULT));

                } else {
                    container.append('<p class="empty">暂时没有联系人</p>');
                }
            });
            bootstrap.bootstrap_call('event/list', { 'QUERY[CUSTOMER]': id }, function (_response) {
                $('#customer_item .panel_left .content ul').html('');
                bootstrap.show_events('customer', _response, id);
            });
        });
    }
    exports.customer_contact = function (type, value) {
        var container = $('#customer_item'),
            contact_class = {
                'ADDRESS': '地址',
                'EMAIL': '邮箱',
                'IM': '即时通讯',
                'PHONE': '电话',
                'SITE': '网址',
                'SOCIAL': '社交网络'
            };
        container.find('.panel_right .contact ul').append('<li><span class="key">' + contact_class[type] + '</span><span class="value">' + value + '</span></li>');
    };
    exports.component_initWorkspace = function () {
        $('#customer_item .container .itemSpace').html('');
        $('#component_window_wait').fadeOut('slow');
    };
    exports.component_subMenu_blank = function () {
        $('#customer_item .panel_full .menu li').removeClass('active');
    };
    exports.component_customer_getId = function () {
        var url = window.location.href,
            array = url.split('/'),
            length = array.length,
            id = array[length - 1];
        return id;
    }
    exports.overview_init = function () {
        exports.component_subMenu_blank();
        arguments[1].addClass('active');
        exports.component_initWorkspace();
        var id = exports.component_customer_getId();
        exports.call(id);
    };
    exports.person_init = function () {
        exports.component_subMenu_blank();
        var owner_id = arguments[1].attr('data-owner');

        if (arguments.length) arguments[1].addClass('active');
        else $('#customer_item .panel_full .menu li.person').addClass('active');

        exports.component_initWorkspace();
        var id = exports.component_customer_getId();
        var template = Handlebars.compile(templet_customer_item_person);

        bootstrap.bootstrap_call('person/list', { 'QUERY[CUSTOMER]': id }, function (_response) {
            console.log(_response.RESULT);
            Handlebars.registerHelper("phone", function (array) {
                var length = array.length,
                    bool = false;
                if (length) {
                    for (var index = 0; index < array.length; index++) {
                        if (array[index].CLASS == 'PHONE') {
                            bool = true;
                            return array[index].VALUE;
                        }
                    }
                    if (!bool) return '';
                } else {
                    return '';
                }
            });
            $('#customer_item .container .itemSpace').html(template(_response.RESULT));
            if (owner_id != airteams.account.USER.ID && airteams.account.USER.PHONE != airteams.account.RELATION.OWNER) {
                $('a[data-mark=person_new]').hide();
            }
        });

    };
    exports.opportunity_init = function () {
        exports.component_subMenu_blank();
        arguments[1].addClass('active');
        exports.component_initWorkspace();
        var id = exports.component_customer_getId();

        var template = Handlebars.compile(templet_customer_item_opportunity);
        bootstrap.bootstrap_call('opportunity/list', { 'QUERY[CUSTOMER]': id }, function (_response) {
            console.log(_response);
            Handlebars.registerHelper("owner", function (id) {
                return bootstrap.bootstrap_loadUser(airteams.account.GROUP, id).NAME;
            });
            Handlebars.registerHelper("state", function (template, id) {
                return bootstrap.bootstrap_loadOpportunityState(airteams.account.SETTING.OPPORTUNITY.STATE, template, id);
            });
            $('#customer_item .container .itemSpace').html(template(_response.RESULT));
        });
    };
    exports.date_init = function () {
        exports.component_subMenu_blank();
        exports.component_initWorkspace();
        var id = exports.component_customer_getId();

        if (arguments.length) arguments[1].addClass('active');
        else $('#customer_item .panel_full .menu li.date').addClass('active');
        var template = Handlebars.compile(templet_customer_item_date);
        bootstrap.bootstrap_call('date/list', { 'QUERY[CUSTOMER]': id }, function (_response) {
            console.log(_response);
            Handlebars.registerHelper("owner", function (id) {
                return bootstrap.bootstrap_loadUser(airteams.account.GROUP, id).NAME;
            });
            Handlebars.registerHelper("content", function (data) {
                var dataObj = {
                    'NAME': data.NAME,
                    'YEAR': data.YEAR,
                    'MONTH': data.MONTH,
                    'DAY': data.DAY,
                    'REPEAT': data.REPEAT
                };
                var str = JSON.stringify(dataObj);
                return str;
            });
            $('#customer_item .container .itemSpace').html(template(_response.RESULT));
        });
    };
    exports.todo_init = function () {
        exports.component_subMenu_blank();
        exports.component_initWorkspace();
        var id = exports.component_customer_getId();

        if (arguments.length) arguments[1].addClass('active');
        else $('#customer_item .panel_full .menu li.todo').addClass('active');
        var template = Handlebars.compile(templet_customer_item_todo);
        bootstrap.bootstrap_call('todo/list', { 'QUERY[CUSTOMER]': id }, function (_response) {
            console.log(_response);
            Handlebars.registerHelper("owner", function (id) {
                return bootstrap.bootstrap_loadUser(airteams.account.GROUP, id).NAME;
            });
            Handlebars.registerHelper("done", function (data) {
                if (data) return '已经完成';
                else return '正在处理';
            });
            Handlebars.registerHelper("deadline", function (stamp) {
                if (stamp) {
                    var date = bootstrap.bootstrap_timestamp_to_date(stamp),
                        date_year = date.getFullYear(),
                        date_month = bootstrap.bootstrap_time_append_zero(date.getMonth()),
                        date_day = bootstrap.bootstrap_time_append_zero(date.getDate()),
                        date_hours = bootstrap.bootstrap_time_append_zero(date.getHours()),
                        date_minutes = bootstrap.bootstrap_time_append_zero(date.getMinutes());
                    return date_year + '-' + (parseInt(date_month) + 1) + '-' + date_day + ' ' + date_hours + ':' + date_minutes;
                } else {
                    return '';
                }
            });
            Handlebars.registerHelper("content", function (data) {
                var dataObj = {
                    'NAME': data.NAME,
                    'DATE': data.DATE,
                    'OWNER': data.RELATION.OWNER,
                    'DONE': data.DONE,
                    'MODEL_ID': data.RELATION.CUSTOMER.ID,
                    'MODEL_NAME': data.RELATION.CUSTOMER.NAME,
                    'REMARK': data.REMARK
                };
                var str = JSON.stringify(dataObj);
                return str;
            });
            $('#customer_item .container .itemSpace').html(template(_response.RESULT));
        });
    };
    exports.todo_window_close = function () {
        $('#component_window_qr').hide();
        $('#component_popup').html('').hide();
    };
    exports.todo_new = function () {
        var container = $('#component_popup'),
            element = arguments[1],
            model = element.attr('data-model'),
            date = new Date(),
            year = date.getFullYear(),
            month = bootstrap.bootstrap_time_append_zero(date.getMonth()) + 1,
            day = bootstrap.bootstrap_time_append_zero(date.getDate()),
            hour = date.getHours(),
            minute = date.getMinutes();

        $('#component_window_qr').show();
        container.html(templet_calendar_todo_new).show();
        container.find('.button-group button:first').attr('data-method', model + '.todo_new_submit');
        container.find('.button-group button.cancel').attr('data-method', model + '.todo_window_close');
        bootstrap.component_selector_bind();
        container.find('input[name=todo_deadline]').attr('data-date', year + '-' + month + '-' + day).val(year + '年' + month + '月' + day + '日');
        container.find('li[data-mark=creator] div.area').html(airteams.account.USER.NAME);

        bootstrap.bootstrap_exact_time(hour, minute);
    };
    exports.todo_new_submit = function () {
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
        params['RELATION']['MODEL'] = 'CUSTOMER';
        params['RELATION']['CUSTOMER'] = exports.component_customer_getId();
        bootstrap.bootstrap_call('todo/new', params, function (response) {
            exports.todo_window_close();
            exports.todo_init();
        });
    };
    exports.todo_edit = function () {
        var container = $('#component_popup'),
            element = arguments[1],
            model = element.attr('data-model'),
            self = element.attr('data-self'),
            tr = element.closest('tr'),
            contentStr = tr.attr('data-content'),
            contentObj = eval('(' + contentStr + ')'),
            date = bootstrap.bootstrap_timestamp_to_date(contentObj.DATE),
            year = date.getFullYear(),
            month = bootstrap.bootstrap_time_append_zero(date.getMonth()) + 1,
            day = bootstrap.bootstrap_time_append_zero(date.getDate()),
            hour = bootstrap.bootstrap_time_append_zero(date.getHours()),
            minute = bootstrap.bootstrap_time_append_zero(date.getMinutes());
        $('#component_window_qr').show();
        if (self == '1') {
            container.html(templet_calendar_todo_self).show().addClass('calendar_self').attr('data-relation', tr.attr('data-id'));
            container.find('.button-group button').eq(1).remove();
            container.find('.button-group button:first').attr('data-method', model + '.todo_edit_submit');
            container.find('.button-group button.cancel').attr('data-method', model + '.todo_window_close');
        } else {
            container.html(templet_calendar_todo_other).show().removeClass('calendar_self');
            container.find('.button-group button').attr('data-method', model + '.todo_window_close');
        }
        var done_text = container.find('li[data-mark=done] ul.selector_list li[data-value=' + contentObj.DONE + ']').text();
        container.find('input[name=todo_name]').val(contentObj.NAME);
        container.find('input[name=todo_deadline]').attr('data-date', year + '-' + month + '-' + day).val(year + '年' + month + '月' + day + '日');
        container.find('li[data-mark=done] div.selector_title').attr('data-value', contentObj.DONE).find('span.text').html(done_text);
        container.find('li[data-mark=owner] div.area').html(bootstrap.bootstrap_loadUser(airteams.account.GROUP, contentObj.OWNER).NAME);
        if (element.attr('data-remark') && element.attr('data-remark') != 'null') container.find('textarea[name=todo_remark]').html(contentObj.REMARK);

        container.find('ul[data-mark=relation] li a').attr('data-id', contentObj.MODEL_ID).attr('data-method', model + '.init').html(contentObj.MODEL_NAME);
        container.find('ul[data-mark=relation]').show();
        container.addClass('calendar_model');

        // 小时和分钟

        bootstrap.bootstrap_exact_time(hour, minute);
        bootstrap.component_selector_bind();
    };
    exports.todo_edit_submit = function () {
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
        params['RELATION']['MODEL'] = 'CUSTOMER';
        params['RELATION']['CUSTOMER'] = exports.component_customer_getId();
        bootstrap.bootstrap_call('todo/edit', params, function (response) {
            exports.todo_window_close();
            exports.todo_init();
        });
    };
    exports.todo_delete = function () {
        var id = arguments[1].closest('tr').attr('data-id');
        if (confirm('确定删除此项日程安排吗？')) {
            bootstrap.bootstrap_call('todo/delete', { 'ID': id }, function (response) {
                exports.todo_window_close();
                exports.todo_init();
            });
        }
    };
    exports.contract_init = function () {
        exports.component_subMenu_blank();

        if (arguments.length) arguments[1].addClass('active');
        else $('#customer_item .panel_full .menu li.contract').addClass('active');

        exports.component_initWorkspace();
        var id = exports.component_customer_getId();

        var template = Handlebars.compile(templet_customer_item_contract);
        bootstrap.bootstrap_call('contract/list', { 'QUERY[CUSTOMER]': id }, function (_response) {
            console.log(_response);
            Handlebars.registerHelper("discount", function (num) {
                if (parseInt(num) < 10) return num + '折';
                else return '暂无折扣'
            });
            $('#customer_item .container .itemSpace').html(template(_response.RESULT));
        });
    };
    exports.payment_init = function () {
        exports.component_subMenu_blank();

        if (arguments.length) arguments[1].addClass('active');
        else $('#customer_item .panel_full .menu li.payment').addClass('active');

        exports.component_initWorkspace();
        var id = exports.component_customer_getId();

        var template = Handlebars.compile(templet_customer_item_payment);
        bootstrap.bootstrap_call('payment/list', { 'QUERY[CUSTOMER]': id }, function (_response) {
            console.log(_response);
            Handlebars.registerHelper("state", function (id) {
                return bootstrap.bootstrap_loadState(airteams.account.SETTING.PAYMENT.STATE, id);
            });
            Handlebars.registerHelper("type", function (id) {
                return bootstrap.bootstrap_loadType(airteams.account.SETTING.PAYMENT.TYPE, id);
            });
            $('#customer_item .container .itemSpace').html(template(_response.RESULT));
        });
    };
    exports.file_init = function () {
        exports.component_subMenu_blank();
        arguments[1].addClass('active');
        exports.component_initWorkspace();

        var template = Handlebars.compile(templet_customer_item_file),
            file_id;

        if (customer_cache.hasOwnProperty('FILE')) {
            if (customer_cache.FILE.length) file_id = customer_cache.FILE;
            else file_id = '';
        } else file_id = '';

        bootstrap.bootstrap_call('file/list', { 'QUERY[ID]': file_id }, function (_response) {
            console.log(_response);
            Handlebars.registerHelper("creator", function (id) {
                return bootstrap.bootstrap_loadUser(airteams.account.GROUP, id).NAME;
            });
            Handlebars.registerHelper("time", function (time) {
                var date = bootstrap.bootstrap_timestamp_to_date(time),
                    date_year = date.getFullYear(),
                    date_month = bootstrap.bootstrap_time_append_zero(date.getMonth() + 1),
                    date_day = bootstrap.bootstrap_time_append_zero(date.getDate());
                return date_year + '年' + date_month + '月' + date_day + '日';
            });
            Handlebars.registerHelper("size", function (number) {
                if (number < 1048576) {
                    return Math.round(number / 1024) + 'K';
                } else {
                    return Math.round(number / 1024 * 1024) + 'M';
                }
            });
            $('#customer_item .container .itemSpace').html(template(_response.RESULT));
        });
    };
    exports.customer_edit = function () {
        $('#component_window_qr').show();

        var template = Handlebars.compile(templet_customer_item_edit),
            template_contact = Handlebars.compile(templet_contact);
        var id = exports.component_customer_getId();
        bootstrap.bootstrap_call('customer/load', { 'ID': id }, function (_response) {
            console.log(_response);
            Handlebars.registerHelper("level", function (id) {
                return bootstrap.bootstrap_loadLevel(airteams.account.SETTING.CUSTOMER.LEVEL, id);
            });
            Handlebars.registerHelper("owner", function (id) {
                return bootstrap.bootstrap_loadUser(airteams.account.GROUP, id).NAME;
            });
            bootstrap.bootstrap_initPopup();
            $('#workspace').append(template(_response));
            var container = $('#component_popup');
            container.show();
            //联系方式
            var contact = _response.VERSION.CURRENT.CONTACT,
                contact_new = {
                    'ADDRESS': [],
                    'EMAIL': [],
                    'IM': [],
                    'PHONE': [],
                    'SITE': [],
                    'SOCIAL': []
                };

            for (var index = 0; index < contact.length; index++) {
                switch (contact[index].CLASS) {
                    case 'ADDRESS':
                        contact_new.ADDRESS.push(contact[index].VALUE);
                        break;
                    case 'EMAIL':
                        contact_new.EMAIL.push(contact[index].VALUE);
                        break;
                    case 'IM':
                        contact_new.IM.push(contact[index].VALUE);
                        break;
                    case 'PHONE':
                        contact_new.PHONE.push(contact[index].VALUE);
                        break;
                    case 'SITE':
                        contact_new.SITE.push(contact[index].VALUE);
                        break;
                    case 'SOCIAL':
                        contact_new.SOCIAL.push(contact[index].VALUE);
                        break;
                }
            }
            console.log(contact_new);
            Handlebars.registerHelper("judge", function (index, object, options) {
                if (index < object.length - 1) return options.fn(this);
                else {
                    return options.inverse(this);
                }
            });
            container.find('ul.contact').html('');
            container.find('ul.contact').html(template_contact(contact_new));
            //结束
            var value = container.find('li[data-mark=level] div.selector_title').attr('data-value');
            for (var index in airteams.account.SETTING.CUSTOMER.LEVEL) {
                container.find('li[data-mark=level] ul.selector_list').append('<li data-value="' + index + '">' + airteams.account.SETTING.CUSTOMER.LEVEL[index] + '</li>');
            }
            container.find('li[data-mark=level] ul.selector_list').find('li[data-value=' + value + ']').addClass('selected');
            bootstrap.component_selector_bind();
            bootstrap.component_input_bind();
        });
    };
    exports.customer_edit_submit = function () {
        var container = $('#component_popup'),
            address = container.find('input[name=contact_address]'),
            email = container.find('input[name=contact_email]'),
            im = container.find('input[name=contact_im]'),
            phone = container.find('input[name=contact_phone]'),
            site = container.find('input[name=contact_site]'),
            social = container.find('input[name=contact_social]'),
            bool = true,
            params = {
                'ID': exports.component_customer_getId(),
                'NAME': container.find('input[name=customer_name]').val(),
                'LEVEL': container.find('li[data-mark=level] div.selector_title').attr('data-value'),
                'REMARK': container.find('textarea[name=customer_remark]').val()
            };
        params['CONTACT'] = [];
        for (var index = 0; index < address.length; index++) {
            if (address.eq(index).val()) params['CONTACT'].push({ 'CLASS': 'ADDRESS', 'VALUE': address.eq(index).val() });
        }
        for (var index = 0; index < email.length; index++) {
            if (email.eq(index).val()) {
                if (!/^\s*(?:\w+\.?)*\w+@(?:\w+\.)+\w+\s*$/.test(email.eq(index).val())) {
                    bool = false;
                    alert('请输入正确的电子邮件');
                    break;
                }
                else params['CONTACT'].push({ 'CLASS': 'EMAIL', 'VALUE': email.eq(index).val() });
            }
        }
        for (var index = 0; index < im.length; index++) {
            if (im.eq(index).val()) params['CONTACT'].push({ 'CLASS': 'IM', 'VALUE': im.eq(index).val() });
        }
        for (var index = 0; index < phone.length; index++) {
            if (phone.eq(index).val()) {
                if (!/^\s*((0\d{2,3})-)?(\d{7,8})(-(\d{3,}))?\s*$|^\s*0?(13[0-9]|15[012356789]|18[01236789]|14[57])[0-9]{8}\s*$/.test(phone.eq(index).val())) {
                    bool = false;
                    alert('请输入正确的电话号码');
                    break;
                }
                else params['CONTACT'].push({ 'CLASS': 'PHONE', 'VALUE': phone.eq(index).val() });
            }
        }
        for (var index = 0; index < site.length; index++) {
            if (site.eq(index).val()) params['CONTACT'].push({ 'CLASS': 'SITE', 'VALUE': site.eq(index).val() });
        }
        for (var index = 0; index < social.length; index++) {
            if (social.eq(index).val()) params['CONTACT'].push({ 'CLASS': 'SOCIAL', 'VALUE': social.eq(index).val() });
        }
        if (bool && params.NAME == '') {
            bool = false;
            alert('名字不能为空');
        }
        if (bool) {
            bootstrap.bootstrap_call('customer/edit', params, function (_response) {
                console.log(_response);
                bootstrap.component_popup_close();
                exports.init();
            });
        }
    };
    exports.customer_delete = function () {
        var id = exports.component_customer_getId;
        if (confirm('是否删除')) {
            bootstrap.bootstrap_call('customer/delete', { 'ID': id }, function (_response) {
                customer.init();
            });
        }
    }
    exports.person_new = function () {
        $('#component_window_qr').show();
        bootstrap.bootstrap_initPopup();
        $('#workspace').append(templet_person_new);

        var container = $('#component_popup');

        container.show();
        //container.find('input[name=person_owner]').attr('data-id', airteams.account.USER.ID).val(airteams.account.USER.NAME); //负责人
        bootstrap.component_input_bind();
    };
    exports.opportunity_new = function () {
        $('#component_window_qr').show();
        bootstrap.bootstrap_initPopup();
        $('#workspace').append(templet_opportunity_new);
        var container = $('#component_popup'),
            date = new Date(),
            year = date.getFullYear().toString(),
            month = bootstrap.bootstrap_time_append_zero(date.getMonth() + 1).toString(),
            day = bootstrap.bootstrap_time_append_zero(date.getDate()).toString(),
            hour = bootstrap.bootstrap_time_append_zero(date.getHours()).toString(),
            minute = bootstrap.bootstrap_time_append_zero(date.getMinutes()).toString(),
            random = bootstrap.bootstrap_random(4).toString();

        container.show();
        container.find('input[name=opportunity_name]').val(year + month + day + hour + minute + random);
        for (var index in airteams.account.SETTING.OPPORTUNITY.SOURCE) {
            container.find('li[data-mark=source] ul.selector_list').append('<li data-value="' + index + '">' + airteams.account.SETTING.OPPORTUNITY.SOURCE[index] + '</li>');
        }
        for (var index in airteams.account.SETTING.OPPORTUNITY.STATE) {
            container.find('li[data-mark=template] ul.selector_list').append('<li data-value="' + airteams.account.SETTING.OPPORTUNITY.STATE[index].ID + '">' + airteams.account.SETTING.OPPORTUNITY.STATE[index].NAME + '</li>');
        }
        var source = container.find('li[data-mark=source] ul.selector_list').find('li:first'),
            source_value = source.attr('data-value'),
            source_text = source.html(),
            template = container.find('li[data-mark=template] ul.selector_list').find('li:first'),
            template_value = template.attr('data-value'),
            template_text = template.html(),
            state_default = bootstrap.bootstrap_loadOpportunityStateArray(airteams.account.SETTING.OPPORTUNITY.STATE, template_value)[0];

        source.addClass('selected');
        template.addClass('selected');
        container.find('li[data-mark=source] div.selector_title').attr('data-value', source_value).find('span.text').html(source_text);
        container.find('li[data-mark=template] div.selector_title').attr('data-value', template_value).find('span.text').html(template_text);
        //container.find('li[data-mark=state] div.selector_title').attr('data-value', 0).find('span.text').html(state_default);
        bootstrap.component_input_bind();
        bootstrap.component_selector_bind();
    };
    exports.date_new = function () {
        $('#component_window_qr').show();
        bootstrap.bootstrap_initPopup();
        $('#workspace').append(templet_date_new);
        var container = $('#component_popup'),
            model = arguments[1].attr('data-model'),
            classes = ['生日', '受聘', '离职', '合作', '解约', '其他'];
        container.find('.operation button').attr('data-model', model);
        container.show();

        var selector_list = container.find('li[data-mark=class] ul.selector_list');
        if (airteams.account.SETTING.DATE instanceof Array) {
        } else if (airteams.account.SETTING.DATE.constructor == Object) {
            console.log('执行');
            for (var index in airteams.account.SETTING.DATE.NAME) {
                selector_list.append('<li data-value="' + airteams.account.SETTING.DATE.NAME[index] + '">' + airteams.account.SETTING.DATE.NAME[index] + '</li>');
            }
        }
        for (var index in classes) {
            selector_list.append('<li data-value="' + classes[index] + '">' + classes[index] + '</li>');
        }
        var class_value = selector_list.find('li:first').attr('data-value'),
            class_text = selector_list.find('li:first').html();
        selector_list.find('li:first').addClass('selected');
        container.find('li[data-mark=class] div.selector_title').attr('data-value', class_value).find('span.text').html(class_text);
        bootstrap.component_input_bind();
        bootstrap.component_selector_bind();
        bootstrap.component_selector_date();
    };
    exports.date_new_submit = function () {
        var container = $('#component_popup'),
            element = arguments[1],
            date_class = container.find('li[data-mark=class] div.selector_title').attr('data-value'),
            year = container.find('div[data-mark=year] div.selector_title').attr('data-value'),
            month = container.find('[data-mark=month] div.selector_title').attr('data-value'),
            day = container.find('[data-mark=day] div.selector_title').attr('data-value'),
            params = {
                //'RELATION[MODEL]': 'CUSTOMER',
                //'RELATION[CUSTOMER]': $('#workspace .basic h1').attr('data-id'),
                'RELATION': {},
                'DATE': year + '-' + month + '-' + day,
                'REPEAT': container.find('[data-mark=repeat] div.selector_title').attr('data-value')
            };
        if (element.attr('data-model') == 'customer') {
            params['RELATION']['MODEL'] = 'CUSTOMER';
            params['RELATION']['CUSTOMER'] = $('#workspace .basic h1').attr('data-id');
        } else if (element.attr('data-model') == 'person') {
            params['RELATION']['MODEL'] = 'PERSON';
            params['RELATION']['PERSON'] = $('#workspace .basic h1').attr('data-id');
        }
        if (date_class == '其他') {
            params['NAME'] = container.find('input[name=date_class]').val();
        } else {
            params['NAME'] = container.find('li[data-mark=class] div.selector_title span.text').html();
        }
        if (params['NAME'] == '') {
            alert('输入内容不能为空');
        } else {
            bootstrap.bootstrap_call('date/new', params, function (_response) {
                console.log(_response);
                var template,
                    tbody;

                if (element.attr('data-model') == 'customer') {
                    tbody = $('#customer_item .itemSpace table tbody');
                    template = Handlebars.compile(templet_date_customer_item)
                } else if (element.attr('data-model') == 'person') {
                    tbody = $('#person_item .itemSpace table tbody');
                    template = Handlebars.compile(templet_date_person_item)
                }

                Handlebars.registerHelper("owner", function (id) {
                    return bootstrap.bootstrap_loadUser(airteams.account.GROUP, id).NAME;
                });
                if (tbody.find('td').hasClass('empty')) {
                    tbody.find('td.empty').parent().hide();
                }
                tbody.prepend(template(_response));
                bootstrap.component_popup_close();
            });
        }
    };
    exports.date_class_exists = function (name, map) {
        for (var item in map) {
            if (map[item] == name) return true;
        }
        return false;
    }
    exports.date_edit = function () {
        $('#component_window_qr').show();
        bootstrap.bootstrap_initPopup();
        $('#workspace').append(templet_date_edit);
        var container = $('#component_popup'),
            element = arguments[1],
            model = element.attr('data-mark');

        container.find('.button-group button:first').attr('data-method', model + '.date_edit_submit');
        container.show();
        var tr = arguments[1].closest('tr'),
            contentStr = tr.attr('data-content'),
            contentObj = eval('(' + contentStr + ')'),
            map = ['生日', '受聘', '离职', '合作', '解约'],
            class_all = [];

        if (airteams.account.SETTING.DATE instanceof Array) {
        } else if (airteams.account.SETTING.DATE.constructor == Object) {
            for (var index in airteams.account.SETTING.DATE.NAME) {
                container.find('li[data-mark=class] ul.selector_list').append('<li data-value="' + airteams.account.SETTING.DATE.NAME[index] + '">' + airteams.account.SETTING.DATE.NAME[index] + '</li>');
                class_all.push(airteams.account.SETTING.DATE.NAME[index]);
            }
        }
        for (var index in map) {
            container.find('li[data-mark=class] ul.selector_list').append('<li data-value="' + map[index] + '">' + map[index] + '</li>');
        }
        class_all = class_all.concat(map);
        container.find('li[data-mark=class] ul.selector_list').append('<li data-value="其他">其他</li>');
        container.attr('data-id', tr.attr('data-id'));
        if (exports.date_class_exists(contentObj.NAME, class_all)) {
            for (var item in class_all) {
                if (class_all[item] == contentObj.NAME) {
                    container.find('li[data-mark=class] div.selector_title').attr('data-value', class_all[item]).find('span.text').html(contentObj.NAME);
                    container.find('li[data-mark=class] ul.selector_list li[data-value=' + class_all[item] + ']').addClass('selected');
                }
            }
        } else {
            container.find('li[data-mark=class] div.selector_title').attr('data-value', '其他').find('span.text').html('其他');
            container.find('li[data-mark=class] ul.selector_list li[data-value="其他"]').addClass('selected');
            container.find('li[data-mark=class] .other').show();
            container.find('li[data-mark=class] input[name=date_class]').val(contentObj.NAME);
        }
        bootstrap.component_selector_date();
        bootstrap.component_selector_bind();
        container.find('[data-mark=year] div.selector_title').attr('data-value', contentObj.YEAR).find('span.text').html(contentObj.YEAR + '年');
        container.find('[data-mark=year] ul.selector_list li[data-value=' + contentObj.YEAR + ']').addClass('selected');

        var month = container.find('[data-mark=month] ul.selector_list li[data-value=' + contentObj.MONTH + ']'),
            day = container.find('[data-mark=day] ul.selector_list li[data-value=' + contentObj.DAY + ']');

        container.find('[data-mark=month] div.selector_title').attr('data-value', contentObj.MONTH).find('span.text').html(month.html());
        container.find('[data-mark=day] div.selector_title').attr('data-value', contentObj.DAY).find('span.text').html(day.html());
        month.addClass('selected');
        day.addClass('selected');
        if (contentObj.REPEAT) {
            var repeat = container.find('[data-mark=repeat] ul.selector_list li[data-value=' + contentObj.REPEAT + ']');
            container.find('[data-mark=repeat] div.selector_title').attr('data-value', contentObj.REPEAT).find('span.text').html(repeat.html());
            repeat.addClass('selected');
        }
    };
    exports.date_edit_submit = function () {
        var container = $('#component_popup'),
            date_class = container.find('li[data-mark=class] div.selector_title').attr('data-value'),
            year = container.find('div[data-mark=year] div.selector_title').attr('data-value'),
            month = container.find('[data-mark=month] div.selector_title').attr('data-value'),
            day = container.find('[data-mark=day] div.selector_title').attr('data-value'),
            params = {
                'ID': container.attr('data-id'),
                'DATE': year + '-' + month + '-' + day,
                'REPEAT': container.find('[data-mark=repeat] div.selector_title').attr('data-value')
            };
        if (date_class == '其他') {
            params['NAME'] = container.find('input[name=date_class]').val();
        } else {
            params['NAME'] = container.find('li[data-mark=class] div.selector_title span.text').html();
        }
        if (params['NAME'] == '') {
            alert('输入内容不能为空');
        } else {
            bootstrap.bootstrap_call('date/edit', params, function (_response) {
                console.log(_response);
                bootstrap.component_popup_close();
                exports.date_init();
            });
        }
    };
    exports.contract_new = function () {
        $('#component_window_qr').show();
        bootstrap.bootstrap_initPopup();
        $('#workspace').append(templet_contract_new);
        var container = $('#component_popup'),
            state_element = container.find('li[data-mark=state]');
        container.show();

        bootstrap.component_input_bind();
        bootstrap.component_selector_bind();
        container.find('input[name=contract_owner]').attr('data-id', airteams.account.USER.ID).val(airteams.account.USER.NAME);
        container.find('input[name=contract_sign_self]').attr('data-id', airteams.account.USER.ID).val(airteams.account.USER.NAME);
        $('span.checkbox').on('click', function () {
            if ($(this).attr('data-value') == 1) {
                $(this).attr('data-value', 0).removeClass('selected');
                $(this).parent().find('span.discount').hide();
            } else {
                $(this).attr('data-value', 1).addClass('selected');
                $(this).parent().find('span.discount').show();
            }
        });
        for (var index in airteams.account.SETTING.CONTRACT.STATE) {
            state_element.find('ul.selector_list').append('<li data-value="' + index + '">' + airteams.account.SETTING.CONTRACT.STATE[index] + '</li>')
        }
        var state = state_element.find('ul.selector_list li:first'),
            state_value = state.attr('data-value'),
            state_text = state.html();
        state_element.find('div.selector_title').attr('data-value', state_value).find('span.text').html(state_text);
        state.addClass('selected');
    };
    exports.payment_new = function () {
        $('#component_window_qr').show();
        bootstrap.bootstrap_initPopup();
        $('#workspace').append(templet_payment_new);

        var container = $('#component_popup'),
            state_element = container.find('li[data-mark=state]'),
            type_element = container.find('li[data-mark=type]');

        container.show();
        bootstrap.component_selector_bind();

        for (var index in airteams.account.SETTING.PAYMENT.STATE) {
            state_element.find('ul.selector_list').append('<li data-value="' + index + '">' + airteams.account.SETTING.PAYMENT.STATE[index] + '</li>')
        }
        for (var index in airteams.account.SETTING.PAYMENT.TYPE) {
            type_element.find('ul.selector_list').append('<li data-value="' + index + '">' + airteams.account.SETTING.PAYMENT.TYPE[index] + '</li>')
        }
        var state = state_element.find('ul.selector_list li:first'),
            state_value = state.attr('data-value'),
            state_text = state.html(),
            type = type_element.find('ul.selector_list li:first'),
            type_value = type.attr('data-value'),
            type_text = type.html();
        state_element.find('div.selector_title').attr('data-value', state_value).find('span.text').html(state_text);
        type_element.find('div.selector_title').attr('data-value', type_value).find('span.text').html(type_text);
        state.addClass('selected');
        type.addClass('selected');
    };
    exports.person_new_submit = function () {
        var container = $('#component_popup'),
            element = arguments[1],
            address = container.find('input[name=person_address]'),
            email = container.find('input[name=person_email]'),
            im = container.find('[name=person_im]'),
            phone = container.find('input[name=person_phone]'),
            site = container.find('input[name=person_site]'),
            social = container.find('input[name=person_social]'),
            bool = true,
            params = {
                'NAME': container.find('input[name=person_name]').val(),
                'TITLE': container.find('input[name=person_title]').val(),
                'DEPARTMENT': container.find('input[name=person_department]').val(),
                'REMARK': container.find('textarea[name=person_remark]').val(),
                'RELATION[CUSTOMER]': $('#workspace .basic h1').attr('data-id')
            };
        params['CONTACT'] = [];
        for (var index = 0; index < address.length; index++) {
            if (address.eq(index).val()) params['CONTACT'].push({ 'CLASS': 'ADDRESS', 'VALUE': address.eq(index).val() });
        }
        for (var index = 0; index < email.length; index++) {
            if (email.eq(index).val()) {
                if (!/^\s*(?:\w+\.?)*\w+@(?:\w+\.)+\w+\s*$/.test(email.eq(index).val())) {
                    bool = false;
                    alert('请输入正确的电子邮件');
                    break;
                }
                else params['CONTACT'].push({ 'CLASS': 'EMAIL', 'VALUE': email.eq(index).val() });
            }
        }
        for (var index = 0; index < im.length; index++) {
            if (im.eq(index).val()) params['CONTACT'].push({ 'CLASS': 'IM', 'VALUE': im.eq(index).val() });
        }
        for (var index = 0; index < phone.length; index++) {
            if (phone.eq(index).val()) {
                if (!/^\s*((0\d{2,3})-)?(\d{7,8})(-(\d{3,}))?\s*$|^\s*0?(13[0-9]|15[012356789]|18[01236789]|14[57])[0-9]{8}\s*$/.test(phone.eq(index).val())) {
                    bool = false;
                    alert('请输入正确的电话号码');
                    break;
                }
                else params['CONTACT'].push({ 'CLASS': 'PHONE', 'VALUE': phone.eq(index).val() });
            }
        }
        for (var index = 0; index < site.length; index++) {
            if (site.eq(index).val()) params['CONTACT'].push({ 'CLASS': 'SITE', 'VALUE': site.eq(index).val() });
        }
        for (var index = 0; index < social.length; index++) {
            if (social.eq(index).val()) params['CONTACT'].push({ 'CLASS': 'SOCIAL', 'VALUE': social.eq(index).val() });
        }
        console.log(params);
        if (bool && params.NAME == '') {
            bool = false;
            alert('请填写姓名');
        }
        if (bool) {
            bootstrap.bootstrap_call('person/new', params, function (_response) {
                var template = Handlebars.compile(templet_person_new_item),
                tbody = $('#customer_item .itemSpace table tbody');
                Handlebars.registerHelper("phone", function (array) {
                    var length = array.length,
                        bool = false;
                    if (length) {
                        for (var index = 0; index < array.length; index++) {
                            if (array[index].CLASS == 'PHONE') {
                                bool = true;
                                return array[index].VALUE;
                            }
                        }
                        if (!bool) return '';
                    } else {
                        return '';
                    }
                });
                if (tbody.find('td').hasClass('empty')) {
                    tbody.find('td.empty').parent().hide();
                }
                tbody.prepend(template(_response));
                bootstrap.component_popup_close();
            });
        }
    };
    exports.person_delete = function () {
        var element = arguments[1];
        if (confirm('是否删除？')) {
            bootstrap.bootstrap_call('person/delete', { 'ID': element.closest('tr').attr('data-id') }, function (_response) {
                var tbody = $('#customer_item .itemSpace table tbody');

                if (tbody.find('td').hasClass('empty')) {
                    if (tbody.find('tr').length == 2) {
                        element.closest('tr').remove();
                        tbody.find('td.empty').parent().show();
                    } else {
                        element.closest('tr').remove();
                    }
                } else {
                    console.log(tbody.find('tr').length);
                    if (tbody.find('tr').length == 1) {
                        element.closest('tr').remove();
                        tbody.append('<tr><td colspan="5" class="empty">当前客户下没有获取到联系人，<a href="javascript:;" data-method="customer_item.person_new">立即新建</a></td></tr>');
                    } else {
                        element.closest('tr').remove();
                    }
                }
            });
        }
    };
    exports.opportunity_delete = function () {
        var element = arguments[1];
        if (confirm('是否删除？')) {
            bootstrap.bootstrap_call('opportunity/delete', { 'ID': element.closest('tr').attr('data-id') }, function (_response) {
                console.log(_response);
                var tbody = $('#customer_item .itemSpace table tbody');

                if (tbody.find('td').hasClass('empty')) {
                    if (tbody.find('tr').length == 2) {
                        element.closest('tr').remove();
                        tbody.find('td.empty').parent().show();
                    } else {
                        element.closest('tr').remove();
                    }
                } else {
                    console.log(tbody.find('tr').length);
                    if (tbody.find('tr').length == 1) {
                        element.closest('tr').remove();
                        tbody.append('<tr><td colspan="7" class="empty">当前客户下没有获取到业务机会，<a href="javascript:;" data-method="customer_item.opportunity_new">立即新建</a></td></tr>');
                    } else {
                        element.closest('tr').remove();
                    }
                }
            });
        }
    };
    exports.opportunity_new_submit = function () {
        var container = $('#component_popup'),
            date = container.find('input[name=opportunity_date]').attr('data-date'),
            params = {
                'RELATION[CUSTOMER]': $('#workspace .basic h1').attr('data-id'),
                'NAME': container.find('input[name=opportunity_name]').val(),
                'PRICE': container.find('input[name=opportunity_price]').val(),
                //'STATE': container.find('li[data-mark=state] .selector .selector_title').attr('data-value'),
                //'DATE_DEAL_PREDICT': date_array[0] + '-' + bootstrap.bootstrap_time_append_zero(date_array[1]) + '-' + date_array[2],
                'SOURCE': container.find('li[data-mark=source] .selector .selector_title').attr('data-value'),
                'STATE_TEMPLATE': container.find('li[data-mark=template] .selector .selector_title').attr('data-value'),
                'FILE': [],
                'REMARK': container.find('textarea[name=opportunity_remark]').val()
            },
            bool = true;
        if (bool && params.NAME == '') {
            bool = false;
            alert('请填写机会名称');
        }
        if (bool && params.PRICE == '') {
            bool = false;
            alert('请填写机会金额');
        }
        if (bool && !date) {
            bool = false;
            alert('请选择预计成交日期');
        }
        if (bool && !/^\d+(\.\d+)?$/.test(params.PRICE)) {
            bool = false;
            alert('输入的机会金额须为数字（正数）');
        }
        if (bool) {
            var date_array = date.split('-');
            params['DATE_DEAL_PREDICT'] = date_array[0] + '-' + bootstrap.bootstrap_time_append_zero(date_array[1]) + '-' + date_array[2];
            bootstrap.bootstrap_call('opportunity/new', params, function (_response) {
                console.log(_response);
                var template = Handlebars.compile(templet_opportunity_new_item),
                    tbody = $('#customer_item .itemSpace table tbody');
                Handlebars.registerHelper("owner", function (id) {
                    return bootstrap.bootstrap_loadUser(airteams.account.GROUP, id).NAME;
                });
                if (tbody.find('td').hasClass('empty')) {
                    tbody.find('td.empty').parent().hide();
                }
                tbody.prepend(template(_response));
                bootstrap.component_popup_close();
            });
        }

    };
    exports.date_delete = function () {
        var element = arguments[1];
        if (confirm('是否删除？')) {
            bootstrap.bootstrap_call('date/delete', { 'ID': element.closest('tr').attr('data-id') }, function (_response) {
                var tbody, model;
                if (element.closest('table').attr('data-mark') == 'customer') {
                    tbody = $('#customer_item .itemSpace table tbody');
                    model = 'customer';
                } else {
                    tbody = $('#person_item .itemSpace table tbody');
                    model = 'person';
                }

                if (tbody.find('td').hasClass('empty')) {
                    if (tbody.find('tr').length == 2) {
                        element.closest('tr').remove();
                        tbody.find('td.empty').parent().show();
                    } else {
                        element.closest('tr').remove();
                    }
                } else {
                    console.log(tbody.find('tr').length);
                    if (tbody.find('tr').length == 1) {
                        element.closest('tr').remove();
                        tbody.append('<tr><td colspan="4" class="empty">当前客户下没有获取到重要日期，<a href="javascript:;" data-model="' + model + '" data-method="customer_item.date_new">立即新建</a></td></tr>');
                    } else {
                        element.closest('tr').remove();
                    }
                }
            });
        }
    };
    exports.contract_new_submit = function () {
        var container = $('#component_popup'),
            discount = container.find('span.checkbox').attr('data-value'),
            params = {
                'RELATION[CUSTOMER]': $('#workspace .basic h1').attr('data-id'),
                'NAME': container.find('input[name=contract_name]').val(),
                'NUMBER': container.find('input[name=contract_number]').val(),
                'PRICE': container.find('input[name=contract_price]').val(),
                'DATE_SIGNED': container.find('input[name=contract_date_signed]').attr('data-date'),
                'DATE_START': container.find('input[name=contract_date_start]').attr('data-date'),
                'DATE_END': container.find('input[name=contract_date_end]').attr('data-date'),
                //'RELATION[OWNER]': container.find('input[name=contract_owner]').attr('data-id'),
                'SIGN_SELF': container.find('input[name=contract_sign_self]').val(),
                'SIGN_CUSTOMER': container.find('input[name=contract_sign_customer]').val(),
                'STATE': container.find('li[data-mark=state] div.selector_title').attr('data-value'),
                'REMARK': container.find('textarea[name=contract_remark]').val()
            },
            bool = true;
        if (discount == 1) {
            params['DISCOUNT'] = container.find('input[name=contract_discount]').val();
        } else {
            params['DISCOUNT'] = 10;
        }
        if (bool && params['NAME'] == '') {
            bool = false;
            alert('请填写合同名称');
        }
        if (bool && params['PRICE'] == '') {
            bool = false;
            alert('请填写合同金额');
        }
        if (bool && params['DISCOUNT'] > 10) {
            bool = false;
            alert('折扣的范围应该在0到10');
        }
        if (bool && params['DATE_SIGNED'] == '') {
            bool = false;
            alert('请选择签约日期');
        }
        if (bool && params['DATE_START'] == '') {
            bool = false;
            alert('请选择开始日期');
        }
        if (bool && params['DATE_END'] == '') {
            bool = false;
            alert('请选择结束日期');
        }
        if (bool && params['SIGN_CUSTOMER'] == '') {
            bool = false;
            alert('请选择客户签约人');
        }
        if (bool && !/^\d+(\.\d+)?$/.test(params.PRICE)) {
            bool = false;
            alert('输入的合同金额须为数字（正数）');
        }
        if (bool && !/^\d+(\.\d?)?$/.test(params.DISCOUNT)) {
            bool = false;
            alert('输入的折扣范围须为数字（正数）,且只支持1位小数');
        }
        if (bool) {
            bootstrap.bootstrap_call('contract/new', params, function (_response) {
                console.log(_response);
                var template = Handlebars.compile(templet_contract_new_item),
                    tbody = $('#customer_item .itemSpace table tbody');
                if (tbody.find('td').hasClass('empty')) {
                    tbody.find('td.empty').parent().hide();
                }
                tbody.prepend(template(_response));
                bootstrap.component_popup_close();
            });
        }
    };
    exports.contract_delete = function () {
        var element = arguments[1];
        if (confirm('是否删除？')) {
            bootstrap.bootstrap_call('contract/delete', { 'ID': element.closest('tr').attr('data-id') }, function (_response) {
                var tbody = $('#customer_item .itemSpace table tbody');
                if (tbody.find('td').hasClass('empty')) {
                    if (tbody.find('tr').length == 2) {
                        element.closest('tr').remove();
                        tbody.find('td.empty').parent().show();
                    } else {
                        element.closest('tr').remove();
                    }
                } else {
                    console.log(tbody.find('tr').length);
                    if (tbody.find('tr').length == 1) {
                        element.closest('tr').remove();
                        tbody.append('<tr><td colspan="5" class="empty">当前客户下没有获取到业务合同，<a href="javascript:;" data-method="customer_item.contract_new">立即新建</a></td></tr>');
                    } else {
                        element.closest('tr').remove();
                    }
                }
            });
        }
    };
    exports.payment_new_submit = function () {
        var container = $('#component_popup'),
            params = {
                'RELATION[CUSTOMER]': $('#workspace .basic h1').attr('data-id'),
                'NAME': container.find('input[name=payment_name]').val(),
                'PRICE': container.find('input[name=payment_price]').val(),
                'STATE': container.find('li[data-mark=state] div.selector_title').attr('data-value'),
                'TYPE': container.find('li[data-mark=type] div.selector_title').attr('data-value'),
                'REMARK': container.find('textarea[name=payment_remark]').val()
            },
            bool = true;

        if (bool && params['NAME'] == '') {
            bool = false;
            alert('请填写回款名称');
        }
        if (bool && params['PRICE'] == '') {
            bool = false;
            alert('请填写回款金额');
        }
        if (bool && !/^\d+(\.\d+)?$/.test(params.PRICE)) {
            bool = false;
            alert('输入的回款金额须为数字（正数）');
        }
        if (bool) {
            bootstrap.bootstrap_call('payment/new', params, function (_response) {
                console.log(_response);
                var template = Handlebars.compile(templet_payment_new_item),
                    tbody = $('#customer_item .itemSpace table tbody');
                if (tbody.find('td').hasClass('empty')) {
                    tbody.find('td.empty').parent().hide();
                }
                tbody.prepend(template(_response));
                bootstrap.component_popup_close();
            });
        }
    };
    exports.payment_delete = function () {
        var element = arguments[1];
        if (confirm('是否删除？')) {
            bootstrap.bootstrap_call('payment/delete', { 'ID': element.closest('tr').attr('data-id') }, function (_response) {
                var tbody = $('#customer_item .itemSpace table tbody');

                if (tbody.find('td').hasClass('empty')) {
                    if (tbody.find('tr').length == 2) {
                        element.closest('tr').remove();
                        tbody.find('td.empty').parent().show();
                    } else {
                        element.closest('tr').remove();
                    }
                } else {
                    console.log(tbody.find('tr').length);
                    if (tbody.find('tr').length == 1) {
                        element.closest('tr').remove();
                        tbody.append('<tr><td colspan="5" class="empty">当前客户下没有获取到回款，<a href="javascript:;" data-method="customer_item.payment_new">立即新建</a></td></tr>');
                    } else {
                        element.closest('tr').remove();
                    }
                }
            });
        }
    };
    exports.file_upload = function () {
        var element = arguments[1];
        bootstrap.bootstrap_call('customer/load', { 'ID': exports.component_customer_getId() }, function (_response) {
            var customer_cache = _response;
            bootstrap.item_fileupload(element, 'customer', customer_cache.COLLECTION, function (_id) {
                customer_cache.FILE.push(_id);
                var params = {
                    'ID': customer_cache.ID,
                    'NAME': customer_cache.VERSION.CURRENT.NAME,
                    'LEVEL': customer_cache.LEVEL,
                    'REMARK': customer_cache.VERSION.CURRENT.REMARK,
                    'CONTACT': customer_cache.VERSION.CURRENT.CONTACT,
                    'FILE': customer_cache.FILE
                };
                bootstrap.bootstrap_call('customer/edit', params, function (_response) { });
            });
        });
    };
    exports.file_delete = function () {
        var element = arguments[1];
        bootstrap.bootstrap_call('file/delete', { 'ID': element.closest('tr').attr('data-id') }, function (_response) {
            var tbody = $('#customer_item .itemSpace table tbody');
            if (tbody.find('td').hasClass('empty')) {
                if (tbody.find('tr').length == 2) {
                    element.closest('tr').remove();
                    tbody.find('td.empty').parent().show();
                } else {
                    element.closest('tr').remove();
                }
            } else {
                console.log(tbody.find('tr').length);
                if (tbody.find('tr').length == 1) {
                    element.closest('tr').remove();
                    tbody.append('<tr><td colspan="5" class="empty">当前客户下没有获取到相关文件，<a href="javascript:;">立即上传</a></td></tr>');
                } else {
                    element.closest('tr').remove();
                }
            }
        });
    };

    exports.owner_transfer_submit = function () {
        var params = {
            'ID': exports.component_customer_getId(),
            'RELATION': {}
        };
        params['RELATION']['USER'] = $('#owner_popup').find('.popup_right dd div.member[data-value=1]').attr('data-id');

        if (params.RELATION.USER) {
            bootstrap.bootstrap_call('customer/transfer', params, function (_response) {
                bootstrap.component_owner_transfer_close();
                exports.init();
            });
        } else {
            alert('请选择需要变更的负责人');
        }
    };
    exports.component_share_submit = function () {
        var element_share = $('#customer_item .button-group a[data-user]'),
            params = {
                'ID': exports.component_customer_getId(),
                'RELATION': { 'USER': [] }
            };
        for (var index in airteams.USERS) {
            for (var number = 0; number < airteams.USERS[index].length; number++) {
                params.RELATION.USER.push(airteams.USERS[index][number]);
            }
        }
        console.log(params);
        if (params.RELATION.USER.length) {
            bootstrap.bootstrap_call('customer/share', params, function (_response) {
                console.log(airteams.USERS);
                var jsonStr = JSON.stringify(airteams.USERS);
                element_share.attr('data-user', jsonStr);
                bootstrap.component_owner_transfer_close();
                exports.init();
            });
        } else {
            alert('请选择需要共享此客户的用户');
        }
    };
});