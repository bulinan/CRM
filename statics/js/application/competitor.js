define(function (require, exports, module) {
    var bootstrap = require('application/bootstrap'),
        datatables = require('datatables'),
        templet_competitor = require('lib/text!application/templet/competitor.html'),
        templet_competitor_new = require('lib/text!application/templet/competitor_new.html');

    exports.bootstrap_init = function () {
        exports.init();
    }
    exports.init = function () {
        var table = '#dataTables_competitor';
        bootstrap.component_menu_active('competitor');
        bootstrap.bootstrap_initWorkspace();
        bootstrap.bootstrap_initMain(function () {
            bootstrap.bootstrap_push('竞争对手', '/competitor');
            $('#workspace').html(templet_competitor);
            bootstrap.component_selector_bind();
            var selector_scale = $('#competitor .title .scale').find('ul.selector_list'),
                selector_level = $('#competitor .title .level').find('ul.selector_list');

            selector_scale.append('<li class="selected">不限</li>');
            selector_level.append('<li class="selected">不限</li>');
            for (var index in airteams.account.SETTING.COMPETITOR.SCALE) {
                selector_scale.append('<li data-value=' + index + '>' + airteams.account.SETTING.COMPETITOR.SCALE[index] + '</li>');
            }

            for (var index in airteams.account.SETTING.COMPETITOR.LEVEL) {
                selector_level.append('<li data-value=' + index + '>' + airteams.account.SETTING.COMPETITOR.LEVEL[index] + '</li>');
            }
            exports.call();

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
        });

    };
    exports.call = function () {
        var table = '#dataTables_competitor',
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
            'sAjaxSource': 'competitor/list',
            'fnServerData': function (_sSource, _aoData, _fnCallback, _oSettings) {
                var info = '#dataTables_competitor_info', paginate = '#dataTables_competitor_paginate';
                $(info).hide();
                $(paginate).hide();
                $(table).css('border-bottom', 0);
                if ($('#dataTables_competitor_processing').css('display') == 'block') $(table).find('tbody').html('');

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
                    $('#competitor .panel_wrapper').find('strong[data-mark=component_opportunityList_count]').text(response.COUNT_DATABASE);
                    $(table + ' thead span.checkbox').attr('data-value', 0).removeClass('selected');
                    _fnCallback(exports.format(response));
                    $(table).find('tbody span.checkbox').each(function () {
                        $(this).parents('tr').attr('data-id', $(this).attr('data-id')).attr('data-method', 'competitor_item.init');
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
                    'sClass': 'label_black'
                },
                {
                    'mData': 'LEVEL',
                    'sWidth': '120',
                    'mRender': function (_data, _type, _full) {
                        return bootstrap.bootstrap_loadLevel(airteams.account.SETTING.COMPETITOR.LEVEL, _data);
                    }
                },
                {
                    'mData': 'SCALE',
                    'sWidth': '150',
                    'mRender': function (_data, _type, _full) {
                        return bootstrap.bootstrap_loadLevel(airteams.account.SETTING.COMPETITOR.SCALE, _data);
                    }
                },
                {
                    'mData': 'RELATION.CREATOR',
                    'sWidth': '120',
                    'bSortable': false,
                    'mRender': function (_data, _type, _full) {
                        return bootstrap.bootstrap_loadUser(airteams.account.GROUP, _data).NAME;
                    }
                },
                {
                    'mData': 'CREATED',
                    'width': '140',
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
                'sZeroRecords': '抱歉,没有检索到竞争对手',
                'sInfoEmpty': '从0到0',
                'oPaginate': {
                    'sPrevious': '上一页',
                    'sNext': '下一页'
                }
            }
        });
    };
    exports.format = function (_input) {
        return {
            recordsTotal: _input.COUNT_DATABASE,
            recordsFiltered: _input.COUNT_DATABASE,
            data: _input.RESULT
        };
    };
    exports.competitor_new = function () {
        $('#component_window_qr').show();
        bootstrap.bootstrap_initPopup();
        $('#workspace').append(templet_competitor_new);
        var container = $('#component_popup');
        container.show();
        bootstrap.component_selector_bind();

        for (var index in airteams.account.SETTING.COMPETITOR.SCALE) {
            container.find('li[data-mark=scale] ul.selector_list').append('<li data-value="' + index + '">' + airteams.account.SETTING.COMPETITOR.SCALE[index] + '</li>');
        }
        for (var index in airteams.account.SETTING.COMPETITOR.LEVEL) {
            container.find('li[data-mark=level] ul.selector_list').append('<li data-value="' + index + '">' + airteams.account.SETTING.COMPETITOR.LEVEL[index] + '</li>');
        }

        var scale = container.find('li[data-mark=scale] ul.selector_list li:first'),
            scale_value = scale.attr('data-value'),
            scale_text = bootstrap.bootstrap_loadLevel(airteams.account.SETTING.COMPETITOR.SCALE, scale_value);
        container.find('li[data-mark=scale] div.selector_title').attr('data-value', scale_value).find('span.text').html(scale_text);
        scale.addClass('selected');

        var level = container.find('li[data-mark=level] ul.selector_list li:first'),
            level_value = level.attr('data-value'),
            level_text = bootstrap.bootstrap_loadLevel(airteams.account.SETTING.COMPETITOR.LEVEL, level_value);
        container.find('li[data-mark=level] div.selector_title').attr('data-value', level_value).find('span.text').html(level_text);
        level.addClass('selected');
    };
    exports.competitor_new_submit = function () {
        var container = $('#component_popup'),
            params = {
                'NAME': $('input[name=competitor_name]').val(),
                'SCALE': container.find('li[data-mark=scale] div.selector_title').attr('data-value'),
                'LEVEL': container.find('li[data-mark=level] div.selector_title').attr('data-value'),
                'STRENGTH': $('textarea[name=competitor_strength]').val(),
                'WEAKNESS': $('textarea[name=competitor_weakness]').val(),
                'STRATEGY': $('textarea[name=competitor_strategy]').val(),
                'REMARK': $('textarea[name=competitor_remark]').val()
            }

        if (params.NAME == '') {
            alert('请填写竞争对手名称');
        } else {
            bootstrap.bootstrap_call('competitor/new', params, function (_response) {
                bootstrap.component_popup_close();
                exports.init();
            });
        }
    };
    exports.component_selector_scale = function () {
        var data = exports.competitor_list_params();
        exports.call(data);
    };
    exports.component_selector_level = function () {
        var data = exports.competitor_list_params();
        console.log(data);
        exports.call(data);
    }
    exports.competitor_list_params = function () {
        var title = $('#competitor .panel_full .title'),
            scale_value = title.find('.scale .selector_title').attr('data-value'),
            level_value = title.find('.level .selector_title').attr('data-value'),
            data = {};

        if (scale_value) {
            data['QUERY'] = {};
            data['QUERY']['SCALE'] = scale_value;
            if (level_value) {
                data['QUERY']['LEVEL'] = level_value;
            }
        } else {
            if (level_value) {
                data['QUERY'] = {};
                data['QUERY']['LEVEL'] = level_value;
            }
        }
        return data;
    }
});