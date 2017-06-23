define(function (require, exports, module) {
    var bootstrap = require('application/bootstrap'),
        datatables = require('datatables'),
        templet_settings_system = require('lib/text!application/templet/settings_system.html'),
        templet_settings_system_account = require('lib/text!application/templet/settings_system_account.html'),
        templet_settings_system_member = require('lib/text!application/templet/settings_system_member.html'),
        templet_settings_system_group = require('lib/text!application/templet/settings_system_group.html'),
        templet_settings_system_data = require('lib/text!application/templet/settings_system_data.html'),
        templet_member_new = require('lib/text!application/templet/member_new.html'),
        templet_member_edit = require('lib/text!application/templet/member_edit.html'),
        templet_group_new = require('lib/text!application/templet/group_new.html'),
        templet_group_edit = require('lib/text!application/templet/group_edit.html'),
        templet_group_charge_set = require('lib/text!application/templet/group_charge_set.html'),
        templet_product = require('lib/text!application/templet/product.html'),
        templet_product_new = require('lib/text!application/templet/product_new.html');

    exports.bootstrap_init = function () {
        exports.init();
    }
    exports.init = function () {
        bootstrap.component_window_account_remove();
        bootstrap.bootstrap_initWorkspace();
        bootstrap.bootstrap_initMain(function () {
            bootstrap.bootstrap_push('系统设置', '/settings/system');
            var data = {
                'ACCOUNT_NAME': airteams.account.NAME
            };
            if (airteams.account.EXPIRATION) {
                var date = bootstrap.bootstrap_timestamp_to_date(airteams.account.EXPIRATION),
                        date_year = date.getFullYear(),
                        date_month = bootstrap.bootstrap_time_append_zero(date.getMonth() + 1),
                        date_day = bootstrap.bootstrap_time_append_zero(date.getDate());

                data['ACCOUNT_EXPIRATION'] = date_year + '年' + date_month + '月' + date_day + '日';
            } else {
                data['ACCOUNT_EXPIRATION'] = '永久使用';
            }
            $('#workspace').append(Handlebars.compile(templet_settings_system)(data));
            exports.call();
        });
    };
    exports.call = function () {
        exports.component_initWorkspace();
        var container = $('#account'),
            data = [];

        for (var index = 0; index < airteams.account.GROUP.length; index++) {
            data = data.concat(airteams.account.GROUP[index].MEMBER);
        }
        Handlebars.registerHelper("group", function (_id) {
            for (var index = 0; index < airteams.account.GROUP.length; index++) {
                if (airteams.account.GROUP[index].ID == _id) return airteams.account.GROUP[index].NAME;
            }
        });
        Handlebars.registerHelper("charge", function (_groupId, _id) {
            for (var index = 0; index < airteams.account.GROUP.length; index++) {
                if (airteams.account.GROUP[index].ID == _groupId) {
                    for (var charge_index in airteams.account.GROUP[index].CHARGE) {
                        if (airteams.account.GROUP[index].CHARGE[charge_index] == _id) return '部门管理员';
                    }
                    return '普通职员';
                }
            }
        });
        Handlebars.registerHelper("is_block", function (block, options) {
            if (!block) return options.fn(this);
            else return options.inverse(this);
        });
        container.find('.itemSpace').html(Handlebars.compile(templet_settings_system_member)(data));
    };
    exports.component_initWorkspace = function () {
        $('#account .container .itemSpace').html('');
        $('#component_window_wait').fadeOut('slow');
    };
    exports.component_subMenu_blank = function () {
        $('#account .panel_full .menu li').removeClass('active');
    };
    exports.member_set = function () {
        exports.component_subMenu_blank();
        arguments[1].addClass('active');
        exports.component_initWorkspace();
        exports.call();
    };
    exports.group_set = function () {
        exports.component_subMenu_blank();

        if (arguments.length) arguments[1].addClass('active');
        else $('#account').find('div.memu li.group').addClass('active');

        exports.component_initWorkspace();
        var container = $('#account');

        Handlebars.registerHelper("charge_name", function (_charges, _members) {
            var charges = '';
            if (!_charges || !_charges.length) return '暂时没有管理员';
            for (var index in _charges) {
                for (var member_index = 0; member_index < _members.length; member_index++) {
                    if (_members[member_index].ID == _charges[index]) {
                        charges = charges + _members[member_index].NAME + ' ';
                    }
                }
            }
            return charges;
        });
        container.find('.itemSpace').html(Handlebars.compile(templet_settings_system_group)(airteams.account.GROUP));
    };
    exports.account_set = function () {
        $('#component_window_qr').show();

        var number = 0,
            data = {
                'ACCOUNT_NAME': airteams.account.NAME,
                'ACCOUNT_LIMIT': airteams.account.LIMIT
            };
        for (var group_index = 0; group_index < airteams.account.GROUP.length; group_index++) {
            number = number + airteams.account.GROUP[group_index].MEMBER.length;
        }
        data['ACCOUNT_USERS'] = number;
        if (airteams.account.EXPIRATION) {
            var date = bootstrap.bootstrap_timestamp_to_date(airteams.account.EXPIRATION),
                    date_year = date.getFullYear(),
                    date_month = bootstrap.bootstrap_time_append_zero(date.getMonth() + 1),
                    date_day = bootstrap.bootstrap_time_append_zero(date.getDate());

            data['ACCOUNT_EXPIRATION'] = date_year + '年' + date_month + '月' + date_day + '日';
        } else {
            data['ACCOUNT_EXPIRATION'] = '永久使用';
        }
        bootstrap.bootstrap_initPopup();
        $('#workspace').append(Handlebars.compile(templet_settings_system_account)(data));
        $('#component_popup').show();
    };
    // 编辑账户设置
    exports.account_edit_submit = function (_e) {
        var params = {
            'NAME': $('input[name=account_name]').val(),
            'RELATION[OWNER]': airteams.account.RELATION.OWNER
        };
        if (params.NAME == '') {
            alert('请填写公司名称');
        } else {
            bootstrap.bootstrap_call('account/edit', params, function (_response) {
                bootstrap.component_popup_close();
                bootstrap.bootstrap_init(function () {
                    exports.init();
                });
            });
        }
    };

    //新建成员
    exports.member_new = function () {
        $('#component_window_qr').show();
        bootstrap.bootstrap_initPopup();
        $('#workspace').append(Handlebars.compile(templet_member_new)(airteams.account.GROUP));
        var container = $('#component_popup');
        container.show();

        bootstrap.component_selector_bind();
        var group_element = container.find('li[data-mark=group] ul.selector_list li:first'),
            group_value = group_element.attr('data-value'),
            group_text = group_element.html();

        group_element.addClass('selected');
        container.find('li[data-mark=group] div.selector_title').attr('data-value', group_value).find('span.text').html(group_text);
    };
    exports.member_new_submit = function () {
        var bool = true,
            params = {
                'NAME': $('input[name=member_name]').val(),
                'PASSWORD': $('input[name=member_password]').val(),
                'PHONE': $('input[name=member_phone]').val(),
                'EMAIL': $('input[name=member_email]').val(),
                'TITLE': $('input[name=member_title]').val(),
                'RELATION[GROUP]': $('li[data-mark=group] div.selector_title').attr('data-value')
            };

        if (bool && params.NAME == '') {
            bool = false;
            alert('请填写成员姓名');
        }
        if (bool && params.PASSWORD == '') {
            bool = false;
            alert('请填写成员登录密码');
        }
        if (bool && params.PHONE == '') {
            bool = false;
            alert('请填写手机号');
        }
        if (bool && !/^\s*0?(13[0-9]|15[012356789]|18[01236789]|14[57])[0-9]{8}\s*$/.test(params.PHONE)) {
            bool = false;
            alert('请填写正确的手机号');
        }
        if (bool && params.EMAIL != '' && !/^\s*(?:\w+\.?)*\w+@(?:\w+\.)+\w+\s*$/.test(params.EMAIL)) {
            bool = false;
            alert('请填写正确的邮件地址');
        }
        if (bool) {
            bootstrap.bootstrap_call('user/new', params, function (_response) {
                if (_response == 'USER_EXISTS') {
                    alert('用户已存在');
                    exports.member_new();
                    return;
                }
                if (_response == 'BEYOND_THE_LIMIT') {
                    alert('超出账号人数限制，您可以购买更多以便完成工作');
                    exports.member_set();
                    return;
                }
                bootstrap.component_popup_close();
                bootstrap.bootstrap_init(function () {
                    exports.call();
                });
            });
        }
    };

    //编辑成员
    exports.member_edit = function () {
        $('#component_window_qr').show();
        bootstrap.bootstrap_initPopup();
        var id = arguments[1].closest('tr').attr('data-id');

        $('#workspace').append(Handlebars.compile(templet_member_edit)(bootstrap.bootstrap_loadUser(airteams.account.GROUP, id)));
        var container = $('#component_popup');
        container.show();

        bootstrap.component_selector_bind();
        var group_id = container.find('li[data-mark=group] div.selector_title').attr('data-value');
        for (var index = 0; index < airteams.account.GROUP.length; index++) {
            container.find('li[data-mark=group] ul.selector_list').append('<li data-value="' + airteams.account.GROUP[index].ID + '">' + airteams.account.GROUP[index].NAME + '</li>');
            if (airteams.account.GROUP[index].ID == group_id) container.find('li[data-mark=group] div.selector_title').find('span.text').html(airteams.account.GROUP[index].NAME);
        }
        container.find('li[data-mark=group] ul.selector_list li[data-value=' + group_id + ']').addClass('selected');
    };
    exports.member_edit_submit = function () {
        var bool = true,
            params = {
                'ID': $('input[name=member_id]').val(),
                'NAME': $('input[name=member_name]').val(),
                'HEAD': $('input[name=member_head]').val(),
                'PHONE': $('input[name=member_phone]').val(),
                'EMAIL': $('input[name=member_email]').val(),
                'TITLE': $('input[name=member_title]').val(),
                'RELATION[GROUP]': $('li[data-mark=group] div.selector_title').attr('data-value')
            };

        if (bool && params.NAME == '') {
            bool = false;
            alert('请填写成员姓名');
        }
        if (bool && params.PHONE == '') {
            bool = false;
            alert('请填写手机号');
        }
        if (bool && !/^\s*0?(13[0-9]|15[012356789]|18[01236789]|14[57])[0-9]{8}\s*$/.test(params.PHONE)) {
            bool = false;
            alert('请填写正确的手机号');
        }
        if (bool && params.EMAIL != '' && !/^\s*(?:\w+\.?)*\w+@(?:\w+\.)+\w+\s*$/.test(params.EMAIL)) {
            bool = false;
            alert('请填写正确的邮件地址');
        }
        console.log(params);
        if (bool) {
            bootstrap.bootstrap_call('user/edit', params, function (_response) {
                bootstrap.component_popup_close();
                bootstrap.bootstrap_init(function () {
                    exports.call();
                });
            });
        }
    };
    exports.group_new = function () {
        $('#component_window_qr').show();
        bootstrap.bootstrap_initPopup();
        $('#workspace').append(templet_group_new);
        $('#component_popup').show();
    };
    exports.group_new_submit = function () {
        var params = {
            'NAME': $('input[name=group_name]').val()
        };
        if (params.NAME == '') {
            alert('请填写部门名称');
        } else {
            bootstrap.bootstrap_call('group/new', params, function (_response) {
                bootstrap.component_popup_close();
                bootstrap.bootstrap_init(function () {
                    exports.group_set();
                });
            });
        }
    };
    exports.group_edit = function () {
        $('#component_window_qr').show();
        bootstrap.bootstrap_initPopup();
        var group_id = arguments[1].closest('tr').attr('data-id');

        for (var index = 0; index < airteams.account.GROUP.length; index++) {
            if (airteams.account.GROUP[index].ID == group_id) $('#workspace').append(Handlebars.compile(templet_group_edit)(airteams.account.GROUP[index]));
        }
        $('#component_popup').show();
    };
    exports.group_edit_submit = function () {
        var params = {
            'ID': $('input[name=group_id]').val(),
            'NAME': $('input[name=group_name]').val(),
            'CHARGE': []
        };
        params.CHARGE.push($('input[name=group_admin]').val());
        if (params.NAME == '') {
            alert('请填写部门名称');
        } else {
            bootstrap.bootstrap_call('group/edit', params, function (_response) {
                bootstrap.component_popup_close();
                bootstrap.bootstrap_init(function () {
                    exports.group_set();
                });
            });
        }
    };
    exports.group_delete = function () {
        var element = arguments[1];
        bootstrap.bootstrap_call('group/remove', { 'ID': element.closest('tr').attr('data-id') }, function (_response) {
            if (confirm('确定删除此部门')) {
                bootstrap.bootstrap_init(function () {
                    element.closest('tr').remove();
                });
            }
        });
    };
    exports.charge_set = function () {
        $('#component_window_qr').show();
        bootstrap.bootstrap_initPopup();

        var element = arguments[1],
            group_id = element.closest('tr').attr('data-id');

        for (var index = 0; index < airteams.account.GROUP.length; index++) {
            if (airteams.account.GROUP[index].ID == group_id) {
                $('#workspace').append(Handlebars.compile(templet_group_charge_set)(airteams.account.GROUP[index]));
                var container = $('#component_popup');
                container.show();
                for (var charge_index in airteams.account.GROUP[index].CHARGE) {
                    container.find('.content ul.member li[data-id=' + airteams.account.GROUP[index].CHARGE[charge_index] + ']').attr('data-value', 1).addClass('selected');
                }
            }
        }
        container.find('ul.member').delegate('li', 'click', function () {
            if ($(this).attr('data-value') == 1) $(this).attr('data-value', 0);
            else $(this).attr('data-value', 1);

            $(this).toggleClass('selected');
        });
    };
    exports.charge_set_submit = function () {
        var container = $('#component_popup'),
            checked = container.find('ul.member li[data-value=1]'),
            params = {
                'ID': $('input[name=group_id]').val(),
                'NAME': $('input[name=group_name]').val(),
                'CHARGE': []
            };
        if (!checked.length) {
            alert('请选择至少一位管理员');
        } else {
            for (var index = 0; index < checked.length; index++) {
                params.CHARGE.push(checked.eq(index).attr('data-id'));
            }
            bootstrap.bootstrap_call('group/edit', params, function (_response) {
                bootstrap.component_popup_close();
                bootstrap.bootstrap_init(function () {
                    exports.group_set();
                });
            });
        }
    };
    exports.data_export = function () {
        exports.component_subMenu_blank();

        if (arguments.length) arguments[1].addClass('active');
        else $('#account').find('div.memu li.data').addClass('active');

        exports.component_initWorkspace();
        var container = $('#account');
        container.find('.itemSpace').html(templet_settings_system_data);
    };
    exports.data_customer_export = function () {
        window.open(airteams.settings.API_BASE + 'common/export?API_TOKEN=' + airteams.settings.API_TOKEN + '&MODEL=CUSTOMER');
    };
    exports.data_opportunity_export = function () {
        window.open(airteams.settings.API_BASE + 'common/export?API_TOKEN=' + airteams.settings.API_TOKEN + '&MODEL=OPPORTUNITY');
    };
    exports.data_lead_export = function () {
        window.open(airteams.settings.API_BASE + 'common/export?API_TOKEN=' + airteams.settings.API_TOKEN + '&MODEL=LEAD');
    };
    exports.data_person_export = function () {
        window.open(airteams.settings.API_BASE + 'common/export?API_TOKEN=' + airteams.settings.API_TOKEN + '&MODEL=PERSON');
    };
    exports.data_date_export = function () {
        window.open(airteams.settings.API_BASE + 'common/export?API_TOKEN=' + airteams.settings.API_TOKEN + '&MODEL=DATE');
    };
    exports.data_contract_export = function () {
        window.open(airteams.settings.API_BASE + 'common/export?API_TOKEN=' + airteams.settings.API_TOKEN + '&MODEL=CONTRACT');
    };
    exports.data_payment_export = function () {
        window.open(airteams.settings.API_BASE + 'common/export?API_TOKEN=' + airteams.settings.API_TOKEN + '&MODEL=PAYMENT');
    };
    exports.member_block = function () {
        var element = arguments[1],
            block = element.attr('data-block'),
            id = element.closest('tr').attr('data-id'),
            params = {
                'ID': id
            };

        if (block == 1) {
            params['BLOCK'] = 0;
            element.attr('data-block', 0).html('停用');
        } else {
            params['BLOCK'] = 1;
            element.attr('data-block', 1).html('启动');
        }
        bootstrap.bootstrap_call('user/block', params, function (_response) {
            console.log(_response);
        });
    };
    exports.product_list = function () {
        exports.component_subMenu_blank();

        if (arguments.length) arguments[1].addClass('active');
        else $('#account').find('div.memu li.product').addClass('active');

        exports.component_initWorkspace();
        var container = $('#account');

        container.find('.itemSpace').html(templet_product);
        exports.product_call();
    };
    exports.product_call = function () {
        var table = '#dataTables_product',
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
            'sAjaxSource': 'product/list',
            'fnServerData': function (_sSource, _aoData, _fnCallback, _oSettings) {
                var info = '#dataTables_product_info', paginate = '#dataTables_product_paginate';
                $(info).hide();
                $(paginate).hide();
                $(table).css('border-bottom', 0);
                if ($('#dataTables_product_processing').css('display') == 'block') $(table).find('tbody').html('');

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
                    'mData': 'PRICE',
                    'sWidth': '120'
                },
                {
                    'mData': 'UNIT_QUANTITY',
                    'sWidth': '150'
                },
                {
                    'mData': 'RELATION.EDITOR',
                    'sWidth': '150',
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
                'sInfoEmpty': '从0到0',
                'oPaginate': {
                    'sPrevious': '上一页',
                    'sNext': '下一页'
                }
            }
        });
    }
    exports.format = function (_input) {
        return {
            recordsTotal: _input.COUNT_DATABASE,
            recordsFiltered: _input.COUNT_DATABASE,
            data: _input.RESULT
        };
    };
    exports.product_new = function () {
        $('#component_window_qr').show();
        bootstrap.bootstrap_initPopup();
        $('#workspace').append(templet_product_new);
        $('#component_popup').show();
    };
    exports.product_new_submit = function () {
        var bool = true,
            params = {
                'NAME': $('input[name=product_name]').val(),
                'PRICE': $('input[name=product_price]').val(),
                'UNIT_QUANTITY': $('input[name=product_unit]').val()
            };

        if (bool && params.NAME == '') {
            bool = false;
            alert('请填写产品名称');
        }
        
        if (bool) {
            bootstrap.bootstrap_call('product/new', params, function (_response) {
                if (_response == 'USER_EXISTS') {
                    alert('用户已存在');
                    exports.member_new();
                    return;
                }
                bootstrap.component_popup_close();
                exports.product_list();
            });
        }
    }
});