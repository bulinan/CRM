define(function (require, exports, module) {
    var bootstrap = require('application/bootstrap'),
        customer_item = require('application/customer_item'),
        templet_contract_item = require('lib/text!application/templet/contract_item.html'),
        templet_contract_item_edit = require('lib/text!application/templet/contract_item_edit.html');

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
                if (obj.tagName.toLowerCase() == 'a') {
                    return;
                }
            } else if (arguments.length == 1) {
                id = arguments[0];
            }
        } else {
            id = exports.component_contract_getId();
        }

        bootstrap.bootstrap_call('contract/load', { 'ID': id }, function (_response) {
            if (_response == 'CONTRACT_NOT_EXISTS') {
                alert('合同不存在');
                customer_item.contract_init();
                return;
            }
            console.log(_response);
            bootstrap.bootstrap_initWorkspace();
            //bootstrap.bootstrap_showLoading();
            bootstrap.bootstrap_initMain(function () {
                bootstrap.bootstrap_push('合同详情', '/contract/' + id);
                var template = Handlebars.compile(templet_contract_item);

                Handlebars.registerHelper("discount", function (number) {
                    if (parseInt(number) < 10) return number + '折';
                    else return '无折扣';
                });
                Handlebars.registerHelper("people", function (id) {
                    return bootstrap.bootstrap_loadUser(airteams.account.GROUP, id).NAME;
                });
                Handlebars.registerHelper("state", function (id) {
                    return bootstrap.bootstrap_loadState(airteams.account.SETTING.CONTRACT.STATE, id);
                });
                Handlebars.registerHelper("date", function (time) {
                    if (time) {
                        var date = bootstrap.bootstrap_timestamp_to_date(time),
                            date_year = date.getFullYear(),
                            date_month = bootstrap.bootstrap_time_append_zero(date.getMonth() + 1),
                            date_day = bootstrap.bootstrap_time_append_zero(date.getDate());
                        return date_year + '-' + date_month + '-' + date_day;
                    } else {
                        var date = new Date();
                        return date.getFullYear() + '-' + (date.getMonth()+1) + '-' + date.getDate();
                    }
                });
                $('#workspace').append(template(_response));

                var container = $('#contract_item');
                console.log(container.find('.basic p').length);
                container.find('.basic h1 span').html(_response.NAME);
                container.find('.basic a.owner').attr('data-owner', _response.RELATION.OWNER).html(bootstrap.bootstrap_loadUser(airteams.account.GROUP, _response.RELATION.OWNER).NAME);
            });
        });
    };
    exports.component_contract_getId = function () {
        var url = window.location.href,
            array = url.split('/'),
            length = array.length,
            id = array[length - 1];
        return id;
    };
    exports.contract_edit = function () {
        $('#component_window_qr').show();

        var template = Handlebars.compile(templet_contract_item_edit),
            id = exports.component_contract_getId();

        bootstrap.bootstrap_call('contract/load', { 'ID': id }, function (_response) {
            console.log(_response);
            Handlebars.registerHelper("date_convert_word", function (time) {
                var date = time.split('-');
                return date[0] + '年' + date[1] + '月' + date[2] + '日';
            });
            bootstrap.bootstrap_initPopup();
            $('#workspace').append(template(_response));
            var container = $('#component_popup');

            container.show();
            bootstrap.component_selector_bind();
            if (_response.DISCOUNT < 10) {
                container.find('li[data-mark=discount] span.checkbox').attr('data-value', 1).addClass('selected');
                container.find('li[data-mark=discount] span.discount').show();
                container.find('li[data-mark=discount] input[name=contract_discount]').val(_response.DISCOUNT);
            }
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
                container.find('li[data-mark=state] ul.selector_list').append('<li data-value="' + index + '">' + airteams.account.SETTING.CONTRACT.STATE[index] + '</li>');
            }
            var state = container.find('li[data-mark=state] ul.selector_list li:first'),
                state_value = state.attr('data-value'),
                state_text = state.html();
            container.find('li[data-mark=state] div.selector_title span.text').html(state_text);
            state.addClass('selected');
        });
    };
    exports.contract_edit_submit = function () {
        var container = $('#component_popup'),
            discount = container.find('span.checkbox').attr('data-value'),
            params = {
                'ID': exports.component_contract_getId(),
                'NAME': container.find('input[name=contract_name]').val(),
                'NUMBER': container.find('input[name=contract_number]').val(),
                'PRICE': container.find('input[name=contract_price]').val(),
                'DATE_SIGNED': container.find('input[name=contract_date_signed]').attr('data-date'),
                'DATE_START': container.find('input[name=contract_date_start]').attr('data-date'),
                'DATE_END': container.find('input[name=contract_date_end]').attr('data-date'),
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
            bootstrap.bootstrap_call('contract/edit', params, function (_response) {
                console.log(_response);
                bootstrap.component_popup_close();
                exports.init();
            });
        }
    };
    exports.contract_delete = function () {
        var customer_id = arguments[1].closest('.basic').find('h1 a.customer').attr('data-id');
        if (confirm('是否删除？')) {
            bootstrap.bootstrap_call('contract/delete', { 'ID': exports.component_contract_getId() }, function (_response) {
                customer_item.init(customer_id);
            });
        }
    };
    exports.owner_transfer_submit = function () {
        var params = {
            'ID': exports.component_contract_getId(),
            'RELATION': {}
        };
        params['RELATION']['USER'] = $('#owner_popup').find('.popup_right dd div.member[data-value=1]').attr('data-id');

        if (params.RELATION.USER) {
            bootstrap.bootstrap_call('contract/transfer', params, function (_response) {
                bootstrap.component_owner_transfer_close();
                exports.init();
            });
        } else {
            alert('请选择需要变更的负责人');
        }
    }
});