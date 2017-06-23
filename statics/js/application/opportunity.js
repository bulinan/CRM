define(function (require, exports, module) {
    var bootstrap = require('application/bootstrap'),
        datatables = require('datatables'),
        cookie = require('cookie'),
        amfunnel = require('amcharts.funnel'),
        amserial = require('amcharts.serial'),
        templet_opportunity = require('lib/text!application/templet/opportunity.html'),
        templet_component_opportunity_filter = require('lib/text!application/templet/component_opportunity_filter.html');

    exports.bootstrap_init = function () {
        exports.init();
    }
    exports.init = function () {
        var table = '#dataTables_opportunity';
        bootstrap.component_menu_active('opportunity');
        bootstrap.bootstrap_initWorkspace();
        bootstrap.bootstrap_initUsers();
        bootstrap.bootstrap_initMain(function () {
            var jsonStr, jsonObj;
            if ($.cookie('opportunity')) {
                jsonStr = $.cookie('opportunity');
                jsonObj = JSON.parse(jsonStr);
            } else {
                bootstrap.bootstrap_full_users();
                jsonStr = JSON.stringify(airteams.USERS);
                jsonObj = airteams.USERS;
            }
            bootstrap.bootstrap_push('业务机会', '/opportunity');
            $('#workspace').html(Handlebars.compile(templet_opportunity)({ 'USER_ID': airteams.account.USER.ID, 'USER_NAME': airteams.account.USER.NAME, 'USERS': jsonStr }));


            //显示span.user的text
            var title = $('#opportunity .panel_left .title'),
                json;

            if (title.find('span.user').attr('data-user')) {
                var data = bootstrap.bootstrap_user_cookie(jsonObj);
                json = { 'OWNER': data }
                bootstrap.bootstrap_user_showText(title, jsonObj);
            } else {
                json = {};
            }

            if ($.cookie('opportunity_filter')) {
                $('#opportunity .panel_left .title span.filter').attr('data-filter', $.cookie('opportunity_filter'));
                var cookie = JSON.parse($.cookie('opportunity_filter'));
                json['QUERY'] = {};
                for (var index in cookie) {
                    json['QUERY'][index] = cookie[index];
                }
            }
            exports.call(json);
            bootstrap.component_checkbox_bind(table, '#opportunity');
            bootstrap.component_owner_bind(table, '#opportunity', 'single');

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

            bootstrap.bootstrap_call('chart/opportunity/funnel_by_state', {}, function (response) {
                var funnel = amfunnel.makeChart('opportunity_funnel', {
                    'colors': ['#67b7dc', '#fdd400', '#84b761', '#cc4748', '#cd82ad', '#2f4074', '#448e4d', '#b7b83f', '#b9783f', '#b93e3d', '#913167'],
                    'type': 'funnel',
                    'pullDistance': 0,
                    'dataProvider': response,
                    'titleField': 'STATE_NAME',
                    'marginRight': 160,
                    'marginLeft': 15,
                    'labelPosition': 'right',
                    'funnelAlpha': 0.9,
                    'valueField': 'STATE_COUNT',
                    'startX': 0,
                    'neckWidth': '40%',
                    'startAlpha': 0,
                    'outlineThickness': 1,
                    'neckHeight': '30%',
                    'balloonText': '[[title]]:<b>[[value]]</b>',
                    'startDuration': 0
                });
                funnel.balloon.enabled = false;
                funnel.addListener('clickSlice', function (_params) {
                    exports.funnel_by_state(_params.dataItem.dataContext.STATE_ID.toString());
                    //$('.state div.selector ul.selector_list li[data-value=' + _params.dataItem.dataContext.STATE_ID + ']').click();
                });

            });
            bootstrap.bootstrap_call('chart/opportunity/bar_by_time', {}, function (response) {
                $.each(response, function (i, item) {
                    response[i]['TIME_VALUE'] = item['TIME'];
                    response[i]['TIME'] = item['TIME'] + '天'
                });
                var bar = amserial.makeChart('opportunity_bar', {
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
                    console.log(_params.item.dataContext.TIME_VALUE);
                    exports.bar_by_time(_params.item.dataContext.TIME_VALUE);
                    //$('.time div.selector ul.selector_list li[data-value=' + _params.item.dataContext.TIME_VALUE + ']').click();
                });
            });
        });
    };
    exports.call = function () {
        var table = '#dataTables_opportunity',
            name = [],
            value = [];

        if (arguments.length) {
            for (var index in arguments[0]) {
                name.push(index);
                value.push(arguments[0][index]);
            }
        }

        $(table).dataTable({
            //'sDom': 'Rlfrtip',
            'bLengthChange': false,
            //"sScrollX": '100%',
            //'scrollCollapse': true,
            //"bDeferRender": true,
            'bAutoWidth': false,
            'bFilter': false,
            'bDestroy': true,
            'processing': true,
            'pagingType': 'simple',
            'aaSorting': [],
            'iDisplayLength': 13,
            'serverSide': true,
            'sAjaxSource': 'opportunity/list',
            'fnServerData': function (_sSource, _aoData, _fnCallback, _oSettings) {
                var info = '#dataTables_opportunity_info', paginate = '#dataTables_opportunity_paginate', panel_wrapper = '#opportunity .panel_wrapper'; ;
                $(info).hide();
                $(paginate).hide();
                $(table).css('border-bottom', 0);
                if ($('#dataTables_opportunity_processing').css('display') == 'block') $(table).find('tbody').html('');

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
                    $(panel_wrapper).find('strong[data-mark=component_opportunityList_count]').text(response.COUNT_DATABASE);
                    $(table + ' thead span.checkbox').attr('data-value', 0).removeClass('selected');
                    _fnCallback(exports.format(response));
                    if (!$(table).find('tbody').find('span.checkbox[data-value=1]').length) {
                        $(panel_wrapper).find('.select_data').removeClass('selected').hide();
                        $(panel_wrapper).find('.title').css('border-bottom', '0');
                        if ($('table').attr('data-all')) {
                            $(panel_wrapper).find('.cancel_all').hide();
                            $(panel_wrapper).find('.select_all').show();
                            $(table).attr('data-all', 0);
                        }
                    }
                    $(table).find('tbody span.checkbox').each(function () {
                        $(this).parents('tr').attr('data-id', $(this).attr('data-id')).attr('data-method', 'opportunity_item.init');
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
                    'sWidth': '120',
                    'sClass': 'label_black'
                },
                {
                    'mData': 'RELATION.CUSTOMER.NAME',
                    'sWidth': '140',
                    'bSortable': false,
                    'sClass': 'label_black'
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
                    'mData': 'PRICE',
                    'sWidth': '60',
                    'mRender': function (_data, _type, _full) {
                        if (_data.indexOf('.') != -1) return _data;
                        else return _data + '.00';
                    }
                },
                {
                    'mData': 'DATE_DEAL_PREDICT',
                    'sWidth': '80'
                },
                {
                    'mData': 'STATE',
                    'mRender': function (_data, _type, _full) {
                        return bootstrap.bootstrap_loadOpportunityState(airteams.account.SETTING.OPPORTUNITY.STATE, _full.STATE_TEMPLATE, _data);
                    }
                },
                {
                    'mData': 'STATE',
                    'sWidth': '30',
                    'mRender': function (_data, _type, _full) {
                        return _data + '%';
                    }
                }
            ],
            'oLanguage': {
                'sInfo': '从' + ' _START_ ' + '到' + ' _END_ / 共' + ' _TOTAL_ ' + '条数据',
                'sProcessing': '正在加载...',
                'sZeroRecords': '抱歉,没有检索到业务机会',
                'sInfoEmpty': '从0到0',
                'oPaginate': {
                    'sPrevious': '上一页',
                    'sNext': '下一页'
                }
            }
        });
    };
    exports.funnel_by_state = function (state) {
        var title = $('#opportunity .panel_left .title'),
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
                if (index == 'STATE') data['QUERY'][index] = state;
                else {
                    data['QUERY'][index] = object[index];
                    data['QUERY']['STATE'] = state;
                }
            }
        } else {
            data['QUERY']['STATE'] = state;
        }
        for (var index in userObj) {
            for (var number = 0; number < userObj[index].length; number++) {
                data.OWNER.push(userObj[index][number]);
            }
        }
        exports.call(data);
        var userStr = JSON.stringify(data.QUERY);
        title.find('span.filter').attr('data-filter', userStr);
    };
    exports.bar_by_time = function (days) {
        var title = $('#opportunity .panel_left .title'),
            filter = title.find('span.filter').attr('data-filter'),
            user_value = title.find('span.user').attr('data-user'),
            userObj = JSON.parse(user_value),
            data = {
                'OWNER': [],
                'QUERY': {}
            },
            time = {
                '7': [7, 15],
                '15': [15, 30],
                '30': [30, 60],
                '60': [60, 90],
                '90': [90]
            };

        if (filter) {
            var object = JSON.parse(filter);
            for (var index in object) {
                if (index == 'FOLLOW_BEFORE') data['QUERY'][index] = days;
                else {
                    data['QUERY'][index] = object[index];
                    data['QUERY']['FOLLOW_BEFORE'] = days;
                    data['QUERY']['FOLLOW_AFTER'] = time[days][1];
                }
            }
        } else {
            data['QUERY']['FOLLOW_BEFORE'] = days;
            data['QUERY']['FOLLOW_AFTER'] = time[days][1];
        }
        for (var index in userObj) {
            for (var number = 0; number < userObj[index].length; number++) {
                data.OWNER.push(userObj[index][number]);
            }
        }
        exports.call(data);
        var userStr = JSON.stringify(data.QUERY);
        title.find('span.filter').attr('data-filter', userStr);
    };
    exports.component_selector_state = function () {
        var data = exports.opportunity_list_params();
        exports.call(data);
    };
    exports.component_selector_time = function () {
        var data = exports.opportunity_list_params();
        exports.call(data);
    };

    exports.component_owner_transfer_submit = function () {
        var parents = $('#opportunity'),
            params = {
                'RELATION': {}
            };

        if ($('#dataTables_opportunity').attr('data-all') == 1) {
            params.ID = 'ALL';
        } else {
            var tr_selected = $('#dataTables_opportunity tbody').find('span.checkbox[data-value=1]'),
                id_list = [];

            for (var index = 0; index < tr_selected.length; index++) {
                id_list.push(tr_selected.eq(index).closest('tr').attr('data-id'));
            }
            params.ID = id_list;
        }
        params['RELATION']['USER'] = $('#inner_popup').find('.popup_right dd span.checkbox[data-value=1]').parent().attr('data-id');

        console.log(params);
        if (params.RELATION.USER) {
            bootstrap.bootstrap_call('opportunity/transfer', params, function (_response) {
                bootstrap.component_owner_transfer_close();
                parents.find('.select_data').removeClass('selected').hide();
                parents.find('.title').css('border-bottom', '0');
                //exports.call();
                var data = exports.opportunity_list_params();
                exports.call(data);
            });
        } else {
            alert('请选择需要变更的负责人');
        }

    };
    exports.opportunity_list_params = function () {
        var container = $('#component_filter'),
            search_value = container.find('input[name=opportunity_name]').val(),
            time_value = container.find('.time .selector_title').attr('data-value'),
            state_value = container.find('.state .selector_title').attr('data-value'),
            user_value = $('#opportunity .panel_left .title span.user').attr('data-user'),
            data = { 'OWNER': [], 'QUERY': {} },
            time = {
                '7': [7, 15],
                '15': [15, 30],
                '30': [30, 60],
                '60': [60, 90],
                '90': [90]
            };

        if (state_value) {
            //data['QUERY'] = {};
            data['QUERY']['STATE'] = state_value;
            if (time_value) {
                data['QUERY']['FOLLOW_BEFORE'] = time[time_value][0];
                data['QUERY']['FOLLOW_AFTER'] = time[time_value][1];
            }
        } else {
            if (time_value) {
                //data['QUERY'] = {};
                data['QUERY']['FOLLOW_BEFORE'] = time[time_value][0];
                data['QUERY']['FOLLOW_AFTER'] = time[time_value][1];
            }
        }
        if (search_value) {
            data['QUERY']['NAME'] = search_value;
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
    };
    exports.format = function (_input) {
        return {
            recordsTotal: _input.COUNT_DATABASE,
            recordsFiltered: _input.COUNT_DATABASE,
            data: _input.RESULT
        };
    };
    exports.component_user_submit = function () {
        var title = $('#opportunity .panel_left .title'),
            time_value = title.find('.time .selector_title').attr('data-value'),
            state_value = title.find('.state .selector_title').attr('data-value'),
            data = { 'OWNER': [] },
            time = {
                '7': [7, 15],
                '15': [15, 30],
                '30': [30, 60],
                '60': [60, 90],
                '90': [90]
            };

        if (state_value) {
            data['QUERY'] = {};
            data['QUERY']['STATE'] = state_value;
            if (time_value) {
                data['QUERY']['FOLLOW_BEFORE'] = time[time_value][0];
                data['QUERY']['FOLLOW_AFTER'] = time[time_value][1];
            }
        } else {
            if (time_value) {
                data['QUERY'] = {};
                data['QUERY']['FOLLOW_BEFORE'] = time[time_value][0];
                data['QUERY']['FOLLOW_AFTER'] = time[time_value][1];
            }
        }
        //设置cookie
        var user_cookie = JSON.stringify(airteams.USERS);
        $.cookie('opportunity', user_cookie);

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
            $('#opportunity').find('.select_data').removeClass('selected').hide();
            $('#opportunity').find('.title').css('border-bottom', '0');
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
        $('#workspace').append(templet_component_opportunity_filter);
        $('#component_filter').show();
        bootstrap.component_selector_bind();
    };
    exports.component_opportunity_filter = function () {
        exports.component_filter_bind();
        var element = arguments[1],
            opportunity_state = bootstrap.bootstrap_loadOpportunityStateArray(airteams.account.SETTING.OPPORTUNITY.STATE, airteams.account.SETTING.OPPORTUNITY.STATE[0].ID),
            state_list = $('#component_filter .state').find('ul.selector_list'),
            time_list = $('#component_filter .time').find('ul.selector_list');

        state_list.append('<li class="selected">不限</li>');
        console.log(opportunity_state);
        for (var index in opportunity_state) {
            state_list.append('<li data-value=' + index + '>' + opportunity_state[index] + '</li>');
        }
        if (element.attr('data-filter')) {
            var object = JSON.parse(element.attr('data-filter'));
            $('#component_filter').find('ul.selector_list li.selected').removeClass('selected');
            if (object.STATE) {
                state_list.find('li[data-value=' + object.STATE + ']').addClass('selected');
                $('#component_filter .state').find('div.selector_title').attr('data-value', object.STATE).find('span.text').html(bootstrap.bootstrap_loadLevel(opportunity_state, object.STATE));
            }
            if (object.FOLLOW_BEFORE) {
                var selected = time_list.find('li[data-value=' + object.FOLLOW_BEFORE + ']');
                selected.addClass('selected');
                $('#component_filter .time').find('div.selector_title').attr('data-value', object.FOLLOW_BEFORE).find('span.text').html(selected.html());
            }
            if (object.NAME) $('#component_filter').find('input[name=opportunity_name]').val(object.NAME);
        }
    };
    exports.component_filter_submit = function () {
        var data = exports.opportunity_list_params();
        bootstrap.component_filter_close();
        exports.call(data);
        if (data.QUERY) {
            console.log(data.QUERY);
            var str = JSON.stringify(data.QUERY);
            $('#opportunity .panel_left .title span.filter').attr('data-filter', str);
            $.cookie('opportunity_filter', JSON.stringify(data.QUERY));
        } else {
            $('#opportunity .panel_left .title span.filter').removeAttr('data-filter');
        }

    }
});