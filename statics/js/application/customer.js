define(function (require, exports, module) {

    var bootstrap = require('application/bootstrap'),
        datatables = require('datatables'),
    //ColReorder = require('ColReorder'),
        cookie = require('cookie'),
        ampie = require('amcharts.pie'),
        amserial = require('amcharts.serial'),
        templet_customer = require('lib/text!application/templet/customer.html'),
        templet_customer_new = require('lib/text!application/templet/customer_new.html'),
        templet_component_customer_filter = require('lib/text!application/templet/component_customer_filter.html');

    exports.bootstrap_init = function () {
        exports.init();
    }
    exports.init = function () {
        console.log('------------------------');
        console.log($.cookie('customer'));
        var table = '#dataTables_customer';
        bootstrap.component_menu_active('customer');
        bootstrap.bootstrap_initWorkspace();
        bootstrap.bootstrap_initUsers();
        bootstrap.bootstrap_initMain(function () {
            var jsonStr, jsonObj;
            if ($.cookie('customer')) {
                jsonStr = $.cookie('customer');
                jsonObj = JSON.parse(jsonStr);
            } else {
                airteams.USERS[airteams.account.USER.RELATION.GROUP].push(airteams.account.USER.ID);
                jsonStr = JSON.stringify(airteams.USERS);
                jsonObj = airteams.USERS;
            }

            bootstrap.bootstrap_push('我的客户', '/customer');
            $('#workspace').html(Handlebars.compile(templet_customer)({ 'USER_NAME': airteams.account.USER.NAME, 'USER_ID': jsonStr }));

            //显示span.user的text
            var title = $('#customer .panel_left .title'),
                data = bootstrap.bootstrap_user_cookie(jsonObj);
            bootstrap.bootstrap_user_showText(title, jsonObj);

            bootstrap.component_selector_bind();
            bootstrap.component_checkbox_bind(table, '#customer');
            bootstrap.component_owner_bind(table, '#customer', 'single');

            if ($.cookie('customer_filter')) {
                $('#customer .panel_left .title span.filter').attr('data-filter', $.cookie('customer_filter'));
                var json = { 'OWNER': data, 'QUERY': {} },
                    cookie = JSON.parse($.cookie('customer_filter'));
                for (var index in cookie) {
                    json['QUERY'][index] = cookie[index];
                }
                exports.call(json);
            } else {
                exports.call({ 'OWNER': data });
            }


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

            bootstrap.bootstrap_call('chart/customer/pie_by_class', {}, function (response) {
                var pie = ampie.makeChart('customer_pie', {
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
                    exports.pie_by_class(_params.dataItem.dataContext.STATE_ID);
                    //$('div.selector ul.selector_list li[data-value=' + _params.dataItem.dataContext.STATE_ID + ']').click();
                });
            });
            bootstrap.bootstrap_call('chart/customer/bar_by_time', {}, function (response) {
                $.each(response, function (i, item) {
                    response[i]['TIME'] = item['TIME'] + '天';
                });
                var bar = amserial.makeChart('customer_bar', {
                    'type': 'serial',
                    'categoryField': 'TIME',
                    'rotate': true,
                    'colors': ['#67b7dc', '#fdd400', '#84b761', '#cc4748', '#cd82ad', '#2f4074', '#448e4d', '#b7b83f', '#b9783f', '#b93e3d', '#913167'],
                    'graphs': [
                    {
                        'balloonText': '[[value]]名',
                        'fillAlphas': 0.8,
                        'lineAlpha': 0.2,
                        'title': '未联系客户数',
                        'type': 'column',
                        'valueField': 'COUNT',
                        'colorField': 'COLOR'
                    }
                ],
                    'valueAxes': [
                    {
                        'id': 'ValueAxis-1',
                        'position': 'top',
                        'axisAlpha': 0
                    }
                ],
                    'allLabels': [],
                    'balloon': {},
                    'titles': [],
                    'dataProvider': response,
                    'startDuration': 0
                });
                bar.addListener('clickGraphItem', function (_params) {
                    $('[data-aaa=component_selector_customer_dropMenu] li[data-value=' + _params.item.dataContext.TIME + ']').click();
                });
            });
        });

    };
    exports.call = function () {
        var table = '#dataTables_customer',
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
            'sAjaxSource': 'customer/list',
            'fnServerData': function (_sSource, _aoData, _fnCallback, _oSettings) {
                var info = '#dataTables_customer_info', paginate = '#dataTables_customer_paginate';
                $(info).hide();
                $(paginate).hide();
                $(table).css('border-bottom', 0);
                if ($('#dataTables_customer_processing').css('display') == 'block') $(table).find('tbody').html('');

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
                    $('#customer .panel_wrapper').find('strong[data-mark=component_opportunityList_count]').text(response.COUNT_DATABASE);
                    $(table + ' thead span.checkbox').attr('data-value', 0).removeClass('selected');
                    _fnCallback(exports.format(response));
                    $(table).find('tbody span.checkbox').each(function () {
                        $(this).parents('tr').attr('data-id', $(this).attr('data-id')).attr('data-method', 'customer_item.init');
                    });
                });
            },
            'aoColumns': [
                {
                    'mData': 'ID',
                    'sClass': 'checkbox',
                    'sWidth': '14',
                    'bSortable': false,
                    'mRender': function (_data, _type, _full) {
                        return '<span data-id="' + _data + '" class=\"checkbox\">';
                    }
                },
                {
                    'mData': 'VERSION.CURRENT.NAME',
                    'sWidth': '150',
                    'sClass': 'label_black'
                },
                {
                    'mData': 'LEVEL',
                    'sWidth': '55',
                    'mRender': function (_data, _type, _full) {
                        return bootstrap.bootstrap_loadLevel(airteams.account.SETTING.CUSTOMER.LEVEL, _data);
                    }
                },
                {
                    'mData': 'OPPORTUNITY',
                    'sWidth': '50',
                    'mRender': function (_data, _type, _full) {
                        if (_data) return '共 ' + _data + ' 个';
                        else return '';
                    }
                },
                {
                    'mData': 'PAYMENT',
                    'sWidth': '50',
                    'bSortable': false
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
                    'sWidth': '95',
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
                },
                {
                    'mData': 'LAST_NOTE_CREATED',
                    'sWidth': '95',
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
                'sZeroRecords': '抱歉,没有检索到客户',
                'sInfoEmpty': '从0到0',
                'oPaginate': {
                    'sPrevious': '上一页',
                    'sNext': '下一页'
                }
            }
        });
    };
    exports.customer_new = function () {
        $('#component_window_qr').show();
        bootstrap.bootstrap_initPopup();
        $('#workspace').append(templet_customer_new);
        var container = $('#component_popup');
        container.show();
        bootstrap.component_selector_bind();
        bootstrap.component_input_bind();

        for (var index in airteams.account.SETTING.CUSTOMER.LEVEL) {
            container.find('li[data-mark=level] ul.selector_list').append('<li data-value="' + index + '">' + airteams.account.SETTING.CUSTOMER.LEVEL[index] + '</li>');
        }
        var level = container.find('li[data-mark=level] ul.selector_list li:first'),
            level_value = level.attr('data-value'),
            level_text = bootstrap.bootstrap_loadLevel(airteams.account.SETTING.CUSTOMER.LEVEL, level_value);
        container.find('li[data-mark=level] div.selector_title').attr('data-value', level_value).find('span.text').html(level_text);
        level.addClass('selected');
    };
    exports.customer_new_submit = function () {
        var container = $('#component_popup'),
            address = container.find('input[name=customer_address]'),
            email = container.find('input[name=customer_email]'),
            im = container.find('input[name=customer_im]'),
            phone = container.find('input[name=customer_phone]'),
            site = container.find('input[name=customer_site]'),
            social = container.find('input[name=customer_social]'),
            bool = true,
            params = {
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
            bootstrap.bootstrap_call('customer/new', params, function (_response) {
                bootstrap.component_popup_close();
                exports.init();
            });
        }
    };
    exports.component_selector_level = function () {
        var data = exports.customer_list_params();
        exports.call(data);
    };
    exports.component_selector_opportunity = function () {
        var data = exports.customer_list_params();
        exports.call(data);
    };
    exports.pie_by_class = function (level) {
        var title = $('#customer .panel_left .title'),
            filter = title.find('span.filter').attr('data-filter'),
            user_value = title.find('span.user').attr('data-user'),
            userObj = JSON.parse(user_value),
            data = {
                'OWNER': [],
                'QUERY': {}
            };

        if (filter) {
            var object = JSON.parse(filter);
            for (var index in object) {
                if (index == 'LEVEL') data['QUERY'][index] = level;
                else {
                    data['QUERY'][index] = object[index];
                    data['QUERY']['LEVEL'] = level;
                }
            }
        } else {
            data['QUERY']['LEVEL'] = level;
        }
        for (var index in userObj) {
            for (var number = 0; number < userObj[index].length; number++) {
                data.OWNER.push(userObj[index][number]);
            }
        }
        exports.call(data);
        var userStr = JSON.stringify(data.QUERY);
        title.find('span.filter').attr('data-filter', userStr);
    }
    exports.component_owner_transfer_submit = function () {
        var parents = $('#customer'),
            params = {
                'RELATION': {}
            };

        if ($('#dataTables_customer').attr('data-all') == 1) {
            params.ID = 'ALL';
        } else {
            var tr_selected = $('#dataTables_customer tbody').find('span.checkbox[data-value=1]'),
                id_list = [];

            for (var index = 0; index < tr_selected.length; index++) {
                id_list.push(tr_selected.eq(index).closest('tr').attr('data-id'));
            }
            params.ID = id_list;
        }
        params['RELATION']['USER'] = $('#inner_popup').find('.popup_right dd span.checkbox[data-value=1]').parent().attr('data-id');

        console.log(params);
        if (params.RELATION.USER) {
            bootstrap.bootstrap_call('customer/transfer', params, function (_response) {
                bootstrap.component_owner_transfer_close();
                parents.find('.select_data').removeClass('selected').hide();
                parents.find('.title').css('border-bottom', '0');
                var data = exports.customer_list_params();
                exports.call(data);
            });
        } else {
            alert('请选择需要变更的负责人');
        }

    };
    exports.customer_list_params = function () {
        var //title = $('#customer .panel_left .title'),
            container = $('#component_filter'),
            search_value = container.find('input[name=customer_name]').val(),
            opportunity_value = container.find('.opportunity .selector_title').attr('data-value'),
            level_value = container.find('.level .selector_title').attr('data-value'),
            user_value = $('#customer .panel_left .title span.user').attr('data-user'),
            userObj = JSON.parse(user_value),
            data = {
                'OWNER': [],
                'QUERY': {}
            };

        if (opportunity_value) {
            //data['QUERY'] = {};
            data['QUERY']['OPPORTUNITY_COUNT'] = opportunity_value;
            if (level_value) {
                data['QUERY']['LEVEL'] = level_value;
            }
        } else {
            if (level_value) {
                //data['QUERY'] = {};
                data['QUERY']['LEVEL'] = level_value;
            }
        }
        if (search_value) {
            data['QUERY']['NAME'] = search_value;
        }
        for (var index in userObj) {
            for (var number = 0; number < userObj[index].length; number++) {
                data.OWNER.push(userObj[index][number]);
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
    exports.component_user_submit = function () {
        var title = $('#customer .panel_left .title'),
            filter = title.find('span.filter').attr('data-filter'),
            data = {};

        if (filter) {
            var object = JSON.parse(filter);
            data['QUERY'] = {};
            for (var index in object) {
                data['QUERY'][index] = object[index];
            }
            data['OWNER'] = [];
            console.log(data);
        } else {
            data = {
                'OWNER': []
            };
        }

        //设置cookie
        var user_cookie = JSON.stringify(airteams.USERS);
        $.cookie('customer', user_cookie);

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
            $('#customer').find('.select_data').removeClass('selected').hide();
            $('#customer').find('.title').css('border-bottom', '0');
            exports.call(data);
            for (var index in airteams.USERS) {
                airteams.USERS[index] = [];
            }
        } else {
            alert('请选择需要筛选的用户');
        }
    };
    exports.component_filter_bind = function () {
        $('#component_window_qr').show();
        $('#workspace').append(templet_component_customer_filter);
        $('#component_filter').show();
        bootstrap.component_selector_bind();
    };
    exports.component_customer_filter = function () {
        exports.component_filter_bind();
        var element = arguments[1],
            customer_level = airteams.account.SETTING.CUSTOMER.LEVEL,
            level_list = $('#component_filter .level').find('ul.selector_list'),
            opportunity_list = $('#component_filter .opportunity').find('ul.selector_list');

        level_list.append('<li class="selected">不限</li>');
        for (var index in customer_level) {
            level_list.append('<li data-value=' + index + '>' + customer_level[index] + '</li>');
        }
        if (element.attr('data-filter')) {
            var object = JSON.parse(element.attr('data-filter'));
            $('#component_filter').find('ul.selector_list li.selected').removeClass('selected');
            if (object.LEVEL) {
                level_list.find('li[data-value=' + object.LEVEL + ']').addClass('selected');
                $('#component_filter .level').find('div.selector_title').attr('data-value', object.LEVEL).find('span.text').html(bootstrap.bootstrap_loadLevel(customer_level, object.LEVEL));
            }
            console.log(object.OPPORTUNITY_COUNT);
            if (object.OPPORTUNITY_COUNT) {
                opportunity_list.find('li[data-value=' + object.OPPORTUNITY_COUNT + ']').addClass('selected');
                var value = (object.OPPORTUNITY_COUNT == 1) ? '是' : '否';
                console.log(object.OPPORTUNITY_COUNT);
                $('#component_filter .opportunity').find('div.selector_title').attr('data-value', object.OPPORTUNITY_COUNT).find('span.text').html(value);
            }
            if (object.NAME) $('#component_filter').find('input[name=customer_name]').val(object.NAME);
        }
    };
    exports.component_filter_submit = function () {
        var data = exports.customer_list_params();
        bootstrap.component_filter_close();
        exports.call(data);
        if (data.QUERY) {
            console.log(data.QUERY);
            var str = JSON.stringify(data.QUERY);
            $('#customer .panel_left .title span.filter').attr('data-filter', str);
            $.cookie('customer_filter', JSON.stringify(data.QUERY));
        } else {
            $('#customer .panel_left .title span.filter').removeAttr('data-filter');
        }

    }
});