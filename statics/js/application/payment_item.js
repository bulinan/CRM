define(function (require, exports, module) {
    var bootstrap = require('application/bootstrap'),
        customer_item = require('application/customer_item'),
        templet_payment_item = require('lib/text!application/templet/payment_item.html'),
        templet_payment_item_edit = require('lib/text!application/templet/payment_item_edit.html');

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
            id = exports.component_payment_getId();
        }

        bootstrap.bootstrap_call('payment/load', { 'ID': id }, function (_response) {
            if (_response == 'PAYMENT_NOT_EXISTS') {
                alert('回款不存在');
                customer_item.payment_init();
                return;
            }
            console.log(_response);
            bootstrap.bootstrap_initWorkspace();
            //bootstrap.bootstrap_showLoading();
            bootstrap.bootstrap_initMain(function () {
                bootstrap.bootstrap_push('回款详情', '/payment/' + id);
                var template = Handlebars.compile(templet_payment_item);

                Handlebars.registerHelper("people", function (id) {
                    return bootstrap.bootstrap_loadUser(airteams.account.GROUP, id).NAME;
                });
                Handlebars.registerHelper("state", function (id) {
                    return bootstrap.bootstrap_loadState(airteams.account.SETTING.PAYMENT.STATE, id);
                });
                Handlebars.registerHelper("type", function (id) {
                    return bootstrap.bootstrap_loadType(airteams.account.SETTING.PAYMENT.TYPE, id);
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

                var container = $('#payment_item');
                container.find('.basic h1 span').html(_response.NAME);
                container.find('.basic a.owner').attr('data-owner', _response.RELATION.OWNER).html(bootstrap.bootstrap_loadUser(airteams.account.GROUP, _response.RELATION.OWNER).NAME);
            });
        });
    };
    exports.component_payment_getId = function () {
        var url = window.location.href,
            array = url.split('/'),
            length = array.length,
            id = array[length - 1];
        return id;
    };
    exports.payment_edit = function () {
        $('#component_window_qr').show();

        var template = Handlebars.compile(templet_payment_item_edit),
            id = exports.component_payment_getId();

        bootstrap.bootstrap_call('payment/load', { 'ID': id }, function (_response) {
            console.log(_response);
            bootstrap.bootstrap_initPopup();
            $('#workspace').append(template(_response));
            var container = $('#component_popup');

            container.show();
            bootstrap.component_selector_bind();

            for (var index in airteams.account.SETTING.PAYMENT.STATE) {
                container.find('li[data-mark=state] ul.selector_list').append('<li data-value="' + index + '">' + airteams.account.SETTING.PAYMENT.STATE[index] + '</li>');
            }
            var state = container.find('li[data-mark=state] ul.selector_list li[data-value=' + _response.STATE + ']'),
                state_text = state.html();
            container.find('li[data-mark=state] div.selector_title span.text').html(state_text);
            state.addClass('selected');

            for (var index in airteams.account.SETTING.PAYMENT.TYPE) {
                container.find('li[data-mark=type] ul.selector_list').append('<li data-value="' + index + '">' + airteams.account.SETTING.PAYMENT.TYPE[index] + '</li>');
            }
            var type = container.find('li[data-mark=type] ul.selector_list li[data-value=' + _response.TYPE + ']'),
                type_text = type.html();
            container.find('li[data-mark=type] div.selector_title span.text').html(type_text);
            type.addClass('selected');
        });
    };
    exports.payment_edit_submit = function () {
        var container = $('#component_popup'),
            params = {
                'ID': exports.component_payment_getId(),
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
            bootstrap.bootstrap_call('payment/edit', params, function (_response) {
                console.log(_response);
                bootstrap.component_popup_close();
                exports.init();
            });
        }
    };
    exports.payment_delete = function () {
        var customer_id = arguments[1].closest('.basic').find('h1 a.customer').attr('data-id');
        if (confirm('是否删除？')) {
            bootstrap.bootstrap_call('payment/delete', { 'ID': exports.component_payment_getId() }, function (_response) {
                customer_item.init(customer_id);
            });
        }
    };
    exports.owner_transfer_submit = function () {
        var params = {
            'ID': exports.component_payment_getId(),
            'RELATION': {}
        };
        params['RELATION']['USER'] = $('#owner_popup').find('.popup_right dd div.member[data-value=1]').attr('data-id');

        if (params.RELATION.USER) {
            bootstrap.bootstrap_call('payment/transfer', params, function (_response) {
                bootstrap.component_owner_transfer_close();
                exports.init();
            });
        } else {
            alert('请选择需要变更的负责人');
        }
    }
});