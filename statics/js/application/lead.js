define(function (require, exports, module) {
    var bootstrap = require('application/bootstrap'),
        datatables = require('datatables'),
        cookie = require('cookie'),
        customer_item = require('application/customer_item'),
        ampie = require('amcharts.pie'),
        templet_lead = require('lib/text!application/templet/lead.html'),
        templet_lead_new = require('lib/text!application/templet/lead_new.html');

    exports.bootstrap_init = function () {
        exports.init();
    }
    exports.init = function () {
        console.log('销售线索列表 - init');
        var table = '#dataTables_lead';
        bootstrap.component_menu_active('lead');
        bootstrap.bootstrap_initWorkspace();
        bootstrap.bootstrap_initUsers();
        bootstrap.bootstrap_initMain(function () {
            var jsonStr, jsonObj;
            if ($.cookie('lead')) {
                jsonStr = $.cookie('lead');
                jsonObj = JSON.parse(jsonStr);
            } else {
                bootstrap.bootstrap_full_users();
                jsonStr = JSON.stringify(airteams.USERS);
                jsonObj = airteams.USERS;
            }

            bootstrap.bootstrap_push('销售线索', '/lead');
            $('#workspace').html(Handlebars.compile(templet_lead)({ 'USER_ID': airteams.account.USER.ID, 'USER_NAME': airteams.account.USER.NAME, 'USERS': jsonStr }));

            //显示span.user的text
            var title = $('#lead .panel_left .title'),
                json;

            if (title.find('span.user').attr('data-user')) {
                var data = bootstrap.bootstrap_user_cookie(jsonObj);
                json = { 'OWNER': data }
                bootstrap.bootstrap_user_showText(title, jsonObj);
            } else {
                json = {};
            }

            var lead_state = airteams.account.SETTING.LEAD.STATE,
                selector_list = $('#lead .title .state').find('ul.selector_list'),
                selector_title = $('#lead .title .state').find('div.selector_title');

            bootstrap.component_selector_bind();
            selector_list.append('<li class="selected">不限</li>');
            for (var index in lead_state) {
                selector_list.append('<li data-value=' + index + '>' + lead_state[index] + '</li>');
            }
            if ($.cookie('lead_filter')) {
                var cookie = JSON.parse($.cookie('lead_filter'));
                json['QUERY'] = {};
                for (var index in cookie) {
                    json['QUERY'][index] = cookie[index];
                }
                var text = bootstrap.bootstrap_loadState(airteams.account.SETTING.LEAD.STATE, json.QUERY.STATE);
                selector_list.find('li').removeClass('selected');
                selector_title.attr('data-value', json.QUERY.STATE).find('span.text').html(text);
                selector_list.find('li[data-value=' + json.QUERY.STATE + ']').addClass('selected');
            }
            exports.call(json);
            $(table).find('tbody').on('click', 'span.checkbox', function () {
                if ($(this).attr('data-value') == 1) $(this).attr('data-value', 0);
                else $(this).attr('data-value', 1);
                $(this).toggleClass('selected').parents('tr').toggleClass('selected');
            });
            $(table).find('thead').on('click', 'span.checkbox', function () {
                if ($(this).attr('data-value') == 1) {
                    $(this).attr('data-value', 0).toggleClass('selected');
                    $(table).find('tbody span.checkbox').attr('data-value', 0).removeClass('selected').parents('tr').removeClass('selected');
                } else {
                    $(this).attr('data-value', 1).toggleClass('selected');
                    $(table).find('tbody span.checkbox').attr('data-value', 1).addClass('selected').parents('tr').addClass('selected');
                }
            });
            bootstrap.component_checkbox_bind(table, '#lead');
            bootstrap.component_owner_bind(table, '#lead', 'single');
            bootstrap.bootstrap_call('chart/lead/pie_by_state', {}, function (response) {
                var pie = ampie.makeChart('lead_pie', {
                    'type': 'pie',
                    'colors': ['#67b7dc', '#fdd400', '#84b761', '#cc4748', '#cd82ad', '#2f4074', '#448e4d', '#b7b83f', '#b9783f', '#b93e3d', '#913167'],
                    'legend': {
                        'markerType': 'circle',
                        'position': 'right',
                        'marginRight': 10,
                        'autoMargins': false
                    },
                    'dataProvider': response,
                    'minRadius': 70,
                    'pullOutRadius': 0,
                    'labelsEnabled': false,
                    'valueField': 'STATE_COUNT',
                    'titleField': 'STATE_NAME',
                    'balloonText': '[[title]]<br>[[value]]<br> ([[percents]]%)',
                    'startDuration': 0
                });
                pie.addListener('clickSlice', function (_params) {
                    $('div.selector ul.selector_list li[data-value=' + _params.dataItem.dataContext.STATE_ID + ']').click();
                });
            });
        });
    };
    exports.call = function () {
        var table = '#dataTables_lead',
            name = [],
            value = [];

        if (arguments.length) {
            for (var index in arguments[0]) {
                name.push(index);
                value.push(arguments[0][index]);
            }
        }

        $(table).dataTable({
            'bLengthChange': false,
            'bAutoWidth': false,
            'bFilter': false,
            'bDestroy': true,
            'processing': true,
            'pagingType': 'simple',
            'aaSorting': [],
            'iDisplayLength': 13,
            'serverSide': true,
            'sAjaxSource': 'lead/list',
            'fnServerData': function (_sSource, _aoData, _fnCallback, _oSettings) {
                var info = '#dataTables_lead_info', paginate = '#dataTables_lead_paginate';
                $(info).hide();
                $(paginate).hide();
                $(table).css('border-bottom', 0);
                if ($('#dataTables_lead_processing').css('display') == 'block') $(table).find('tbody').html('');

                var params = {
                    'API_TOKEN': airteams.settings.API_TOKEN,
                    'START': _oSettings._iDisplayStart,
                    'LIMIT': _oSettings._iDisplayLength
                };
                for (var index = 0; index < _aoData.length; index++) {
                    if (_aoData[index]['name'] == 'iSortCol_0') var sortName = $(table).find('th').eq(_aoData[index]['value']).attr('data-sortname');
                    else if (_aoData[index]['name'] == 'sSortDir_0') var sortValue = _aoData[index]['value'] == 'desc' ? '1' : '0';
                }
                if (sortName) params[sortName] = sortValue;
                for (var index = 0; index < name.length; index++) {
                    params[name[index]] = value[index];
                }

                bootstrap.bootstrap_call(_sSource, params, function (response) {
                    if (response.COUNT_DATABASE) {
                        $(info).show();
                        $(paginate).show();
                        $(table).css('border-bottom', '1px solid #d8d8d8');
                    }
                    console.log(response);
                    $('#lead .panel_wrapper').find('strong[data-mark=component_opportunityList_count]').text(response.COUNT_DATABASE);
                    $(table + ' thead span.checkbox').attr('data-value', 0).removeClass('selected');
                    _fnCallback(exports.format(response));
                    $(table).find('tbody span.checkbox').each(function () {
                        $(this).parents('tr').attr('data-id', $(this).attr('data-id')).attr('data-method', 'lead_item.init');
                    });
                });
            },
            'aoColumns': [
                {
                    'mData': 'ID',
                    'sWidth': '14',
                    'sClass': 'checkbox',
                    'bSortable': false,
                    'mRender': function (_data, _type, _full) {
                        return '<span data-id="' + _data + '" class=\"checkbox\">';
                    }
                },
                {
                    'mData': 'NAME',
                    'sWidth': '80',
                    'sClass': 'label_black'
                },
                {
                    'mData': 'COMPANY',
                    'sWidth': '160',
                    'sClass': 'label_black'
                },
                {
                    'mData': 'CONTACT',
                    'sWidth': '90',
                    'bSortable': false,
                    'mRender': function (_data, _type, _full) {
                        var length = _data.length,
                            bool = false;
                        if (length) {
                            for (var index = 0; index < _data.length; index++) {
                                if (_data[index].CLASS == 'PHONE') {
                                    bool = true;
                                    return _data[index].VALUE;
                                }
                            }
                            if (!bool) return '';
                        } else {
                            return '';
                        }
                    }
                },
                {
                    'mData': 'STATE',
                    'sWidth': '70',
                    'width': '30',
                    'bSortable': false,
                    'mRender': function (_data, _type, _full) {
                        return bootstrap.bootstrap_loadState(airteams.account.SETTING.LEAD.STATE, _data);
                    }
                },
                {
                    'mData': 'RELATION.OWNER',
                    'sWidth': '50',
                    'bSortable': false,
                    'mRender': function (_data, _type, _full) {
                        return bootstrap.bootstrap_loadUser(airteams.account.GROUP, _data).NAME;
                    }
                },
                {
                    'mData': 'CREATED',
                    'width': '120',
                    'mRender': function (_data, _type, _full) {
                        if (_data) {
                            var date = bootstrap.bootstrap_timestamp_to_date(_data),
                                date_year = date.getFullYear(),
                                date_month = bootstrap.bootstrap_time_append_zero(date.getMonth()),
                                date_day = bootstrap.bootstrap_time_append_zero(date.getDate()),
                                date_hours = bootstrap.bootstrap_time_append_zero(date.getHours()),
                                date_minutes = bootstrap.bootstrap_time_append_zero(date.getMinutes());
                            return date_year + '-' + (parseInt(date_month) + 1) + '-' + date_day + ' ' + date_hours + ':' + date_minutes;
                        } else {
                            return '';
                        }
                    }
                }
            ],
            'oLanguage': {
                'sInfo': '从' + ' _START_ ' + '到' + ' _END_ / 共' + ' _TOTAL_ ' + '条数据',
                'sProcessing': '正在加载...',
                'sZeroRecords': '抱歉, 没有检索到销售线索',
                'sInfoEmpty': '从0到0',
                'oPaginate': {
                    'sPrevious': '上一页',
                    'sNext': '下一页'
                }
            }
        });
    };
    exports.component_selector_state = function () {
        var data = exports.lead_list_params();
        exports.call(data);
        if (data.QUERY) {
            $.cookie('lead_filter', JSON.stringify(data.QUERY));
        } else {
            $.cookie('lead_filter', null);
        }
    };
    exports.lead_list_params = function () {
        var title = $('#lead .panel_left .title'),
            state_value = title.find('.state .selector_title').attr('data-value'),
            user_value = $('#lead .panel_left .title span.user').attr('data-user'),
            data = { 'OWNER': [] };

        if (state_value) {
            data['QUERY'] = {};
            data['QUERY']['STATE'] = state_value;
        }
        if (user_value) {
            var userObj = JSON.parse(user_value);
            for (var index in userObj) {
                for (var number = 0; number < userObj[index].length; number++) {
                    data.OWNER.push(userObj[index][number]);
                }
            }
        }

        return data;
    }
    exports.format = function (_input) {
        return {
            recordsTotal: _input.COUNT_DATABASE,
            recordsFiltered: _input.COUNT_DATABASE,
            data: _input.RESULT
        };
    };
    exports.lead_new = function () {
        $('#component_window_qr').show();
        bootstrap.bootstrap_initPopup();
        $('#workspace').append(templet_lead_new);
        var container = $('#component_popup');
        container.show();
        bootstrap.component_selector_bind();
        bootstrap.component_input_bind();
        for (var index in airteams.account.SETTING.CUSTOMER.LEVEL) {
            container.find('li[data-mark=level] ul.selector_list').append('<li data-value="' + index + '">' + airteams.account.SETTING.CUSTOMER.LEVEL[index] + '</li>');
        }
        for (var index in airteams.account.SETTING.LEAD.STATE) {
            container.find('li[data-mark=state] ul.selector_list').append('<li data-value="' + index + '">' + airteams.account.SETTING.LEAD.STATE[index] + '</li>');
        }
        var level = container.find('li[data-mark=level] ul.selector_list li:first'),
            level_value = level.attr('data-value'),
            level_text = bootstrap.bootstrap_loadLevel(airteams.account.SETTING.CUSTOMER.LEVEL, level_value);
        container.find('li[data-mark=level] div.selector_title').attr('data-value', level_value).find('span.text').html(level_text);
        level.addClass('selected');

        var state = container.find('li[data-mark=state] ul.selector_list li:first'),
            state_value = state.attr('data-value'),
            state_text = bootstrap.bootstrap_loadState(airteams.account.SETTING.LEAD.STATE, state_value);
        container.find('li[data-mark=state] div.selector_title').attr('data-value', state_value).find('span.text').html(state_text);
        state.addClass('selected');
    };
    exports.contact_phone_exists = function (contact) {
        for (var index = 0; index < contact.length; index++) {
            if (contact[index].CLASS == 'PHONE') return true;
        }
        return false;
    };
    exports.params = function () {
        var container = $('#component_popup'),
            address = container.find('input[name=lead_address]'),
            email = container.find('input[name=lead_email]'),
            im = container.find('[name=lead_im]'),
            phone = container.find('input[name=lead_phone]'),
            site = container.find('input[name=lead_site]'),
            social = container.find('input[name=lead_social]'),
            bool = true,
            params = {
                'NAME': container.find('input[name=lead_name]').val(),
                'COMPANY': container.find('input[name=lead_company]').val(),
                'LEVEL': container.find('li[data-mark=level] div.selector_title').attr('data-value'),
                'STATE': container.find('li[data-mark=state] div.selector_title').attr('data-value'),
                'REMARK': container.find('textarea[name=lead_remark]').val()
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
        if (bool) return params;
        else return bool;
    }
    exports.lead_new_submit = function () {
        console.log('执行新建销售线索');
        var params,
            title = $('#lead .panel_left .title'),
            bool = true;

        if (!exports.params()) bool = false;
        else params = exports.params();
        if (bool && params.NAME == '') {
            bool = false;
            alert('名字不能为空');
        }
        if (bool && params.COMPANY == '') {
            bool = false;
            alert('公司不能为空');
        }
        if (bool && !exports.contact_phone_exists(params.CONTACT)) {
            bool = false;
            alert('电话不能为空');
        }
        if (bool) {
            bootstrap.bootstrap_call('lead/new', params, function (_response) {
                console.log(_response);
                bootstrap.component_popup_close();
                exports.init();
            });
        }
    };
    exports.lead_convert = function () {
        var params,
            bool = true;

        if (!exports.params()) bool = false;
        else params = exports.params();

        if (bool && params.NAME == '') {
            bool = false;
            alert('名字不能为空');
        }
        if (bool && params.COMPANY == '') {
            bool = false;
            alert('公司不能为空');
        }
        if (bool && !exports.contact_phone_exists(params.CONTACT)) {
            bool = false;
            alert('电话不能为空');
        }
        if (bool) {
            bootstrap.bootstrap_call('lead/new', params, function (_response) {
                var lead_id = _response.ID;
                bootstrap.bootstrap_call('lead/convert', { 'ID': lead_id }, function (_response) {
                    console.log(_response);
                    bootstrap.component_popup_close();
                    alert('转化客户成功');
                    customer_item.init(_response);
                });
            });
        }
    };
    exports.component_owner_transfer_submit = function () {
        var parents = $('#lead'),
            params = {
                'RELATION': {}
            };

        if ($('#dataTables_lead').attr('data-all') == 1) {
            params.ID = 'ALL';
        } else {
            var tr_selected = $('#dataTables_lead tbody').find('span.checkbox[data-value=1]'),
                id_list = [];

            for (var index = 0; index < tr_selected.length; index++) {
                id_list.push(tr_selected.eq(index).closest('tr').attr('data-id'));
            }
            params.ID = id_list;
        }
        params['RELATION']['USER'] = $('#inner_popup').find('.popup_right dd span.checkbox[data-value=1]').parent().attr('data-id');

        if (params.RELATION.USER) {
            bootstrap.bootstrap_call('lead/transfer', params, function (_response) {
                bootstrap.component_owner_transfer_close();
                parents.find('.select_data').removeClass('selected').hide();
                parents.find('.title').css('border-bottom', '0');
                //exports.call();
                var data = exports.lead_list_params();
                exports.call(data);
            });
        } else {
            alert('请选择需要变更的负责人');
        }

    };
    exports.component_user_submit = function () {
        var title = $('#lead .panel_left .title'),
            state_value = title.find('.state .selector_title').attr('data-value'),
            data = { 'OWNER': [] };

        if (state_value) {
            data['QUERY'] = {};
            data['QUERY']['STATE'] = state_value;
        }
        //设置cookie
        var user_cookie = JSON.stringify(airteams.USERS);
        $.cookie('lead', user_cookie);

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
            $('#lead').find('.select_data').removeClass('selected').hide();
            $('#lead').find('.title').css('border-bottom', '0');
            exports.call(data);
            for (var index in airteams.USERS) {
                airteams.USERS[index] = [];
            }
        } else {
            alert('请选择需要筛选的用户');
        }
    };
});