define(function (require, exports, module) {
    var bootstrap = require('application/bootstrap'),
        customer_item = require('application/customer_item'),
        lead = require('application/lead'),
        templet_lead_item = require('lib/text!application/templet/lead_item.html'),
        templet_lead_item_overview = require('lib/text!application/templet/lead_item_overview.html'),
        templet_lead_item_edit = require('lib/text!application/templet/lead_item_edit.html'),
        templet_contact = require('lib/text!application/templet/contact.html');

    exports.bootstrap_init = function () {
        exports.init();
    }
    exports.init = function () {
        var id;
        if (arguments.length) {
            if(arguments.length == 2){
                var element = arguments[1];
                id = element.attr('data-id');
                /*var e = arguments[0] || event, obj = arguments[0].srcElement || arguments[0].target;
                if (obj.className.toLowerCase() == ' checkbox' || obj.className.split(' ')[0].toLowerCase() == 'checkbox') {
                    return;
                }*/
            }else if (arguments.length == 1) {
                id = arguments[0];
            }
        } else {
            id = exports.component_lead_getId();
        }

        bootstrap.bootstrap_call('lead/load', { 'ID': id }, function (_response) {
            if (_response == 'LEAD_NOT_EXISTS') {
                alert('销售线索不存在');
                lead.init();
                return;
            }
            console.log(_response);
            bootstrap.component_menu_active('lead');
            bootstrap.bootstrap_initWorkspace();
            //bootstrap.bootstrap_showLoading();
            bootstrap.bootstrap_initMain(function () {
                bootstrap.bootstrap_push('销售线索详情', '/lead/' + id);
                
                $('#workspace').append(Handlebars.compile(templet_lead_item)(_response));

                bootstrap.component_selector_bind();
                var container = $('#lead_item');

                $('#workspace').find('.basic h1').html(_response.NAME + ' @<span></span>');
                $('#workspace').find('.basic h1 span').html(_response.COMPANY);
                container.find('.basic a.owner').attr('data-owner', _response.RELATION.OWNER).html(bootstrap.bootstrap_loadUser(airteams.account.GROUP, _response.RELATION.OWNER).NAME);
                exports.call(id);
            });
        });

    };
    exports.call = function (id) {
        var container = $('#lead_item'),
            template = Handlebars.compile(templet_lead_item_overview);

        bootstrap.bootstrap_call('lead/load', { 'ID': id }, function (_response) {
            var container = $('#lead_item'),
                contact = _response.CONTACT,
                contact_length = contact.length;

            Handlebars.registerHelper("people", function (id) {
                return bootstrap.bootstrap_loadUser(airteams.account.GROUP, id).NAME;
            });
            Handlebars.registerHelper("time", function (stamp) {
                if (stamp) {
                    var date = bootstrap.bootstrap_timestamp_to_date(stamp),
                        date_year = date.getFullYear(),
                        date_month = bootstrap.bootstrap_time_append_zero(date.getMonth()),
                        date_day = bootstrap.bootstrap_time_append_zero(date.getDate());

                    return date_year + '-' + (parseInt(date_month) + 1) + '-' + date_day;
                } else {
                    return '';
                }
            });

            container.find('.container .itemSpace').html(template(_response));
            container.find('.panel_right .contact .content ul').html('');
            if (contact_length) {
                for (var index = 0; index < contact_length; index++) {
                    exports.lead_contact(contact[index].CLASS, contact[index].VALUE);
                }
            } else {
                container.find('.panel_right .contact .content ul').append('<li class="empty">暂时没有联系方式</li>')
            }
        });
        bootstrap.bootstrap_call('event/list', { 'QUERY[LEAD]': id }, function (_response) {
            $('#lead_item .panel_left .content ul').html('');
            console.log(_response);
            bootstrap.show_events('lead', _response, id);
        });
    };
    exports.lead_contact = function (type, value) {
        var container = $('#lead_item'),
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
    exports.component_lead_getId = function () {
        var url = window.location.href,
            array = url.split('/'),
            length = array.length,
            id = array[length - 1];
        return id;
    };
    exports.lead_edit = function () {
        $('#component_window_qr').show();
        var template = Handlebars.compile(templet_lead_item_edit),
            template_contact = Handlebars.compile(templet_contact),
            id = exports.component_lead_getId();

        bootstrap.bootstrap_call('lead/load', { 'ID': id }, function (_response) {
            console.log(_response);
            Handlebars.registerHelper("level", function (id) {
                return bootstrap.bootstrap_loadLevel(airteams.account.SETTING.CUSTOMER.LEVEL, id);
            });
            Handlebars.registerHelper("state", function (id) {
                return bootstrap.bootstrap_loadState(airteams.account.SETTING.LEAD.STATE, id);
            });
            Handlebars.registerHelper("owner", function (id) {
                return bootstrap.bootstrap_loadUser(airteams.account.GROUP, id).NAME;
            });
            bootstrap.bootstrap_initPopup();
            $('#workspace').append(template(_response));
            var container = $('#component_popup');
            container.show();

            //联系方式
            var contact = _response.CONTACT,
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
            container.find('ul.contact input[name=contact_phone]').closest('li').find('label').append('<span class="red">*</span>');
            //结束
            var value = container.find('li[data-mark=level] div.selector_title').attr('data-value'),
                state_value = container.find('li[data-mark=state] div.selector_title').attr('data-value');
            for (var index in airteams.account.SETTING.CUSTOMER.LEVEL) {
                container.find('li[data-mark=level] ul.selector_list').append('<li data-value="' + index + '">' + airteams.account.SETTING.CUSTOMER.LEVEL[index] + '</li>');
            }
            for (var index in airteams.account.SETTING.LEAD.STATE) {
                container.find('li[data-mark=state] ul.selector_list').append('<li data-value="' + index + '">' + airteams.account.SETTING.LEAD.STATE[index] + '</li>');
            }
            container.find('li[data-mark=level] ul.selector_list').find('li[data-value=' + value + ']').addClass('selected');
            container.find('li[data-mark=state] ul.selector_list').find('li[data-value=' + state_value + ']').addClass('selected');
            bootstrap.component_selector_bind();
            bootstrap.component_input_bind();
        });
    };
    exports.contact_phone_exists = function (contact) {
        for (var index = 0; index < contact.length; index++) {
            if (contact[index].CLASS == 'PHONE') return true;
        }
        return false;
    };
    exports.lead_edit_submit = function () {
        var container = $('#component_popup'),
            address = container.find('input[name=contact_address]'),
            email = container.find('input[name=contact_email]'),
            im = container.find('input[name=contact_im]'),
            phone = container.find('input[name=contact_phone]'),
            site = container.find('input[name=contact_site]'),
            social = container.find('input[name=contact_social]'),
            bool = true,
            params = {
                'ID': exports.component_lead_getId(),
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
        if (bool && params.COMPANY == '') {
            bool = false;
            alert('公司不能为空');
        }
        if (bool && !exports.contact_phone_exists(params.CONTACT)) {
            bool = false;
            alert('电话不能为空');
        }
        if (bool) {
            bootstrap.bootstrap_call('lead/edit', params, function (_response) {
                console.log(_response);
                bootstrap.component_popup_close();
                exports.init();
            });
        }
    };
    exports.lead_convert = function () {
        var lead_id = exports.component_lead_getId();
        bootstrap.bootstrap_call('lead/convert', { 'ID': lead_id }, function (_response) {
            console.log(_response);
            bootstrap.component_popup_close();
            alert('转化客户成功');
            customer_item.init(_response);
        });
    };
    exports.lead_delete = function () {
        var id = exports.component_lead_getId;
        if (confirm('是否删除？')) {
            bootstrap.bootstrap_call('lead/delete', { 'ID': id }, function (_response) {
                lead.init();
            });
        }
    };
    exports.owner_transfer_submit = function () {
        var params = {
            'ID': exports.component_lead_getId(),
            'RELATION': {}
        };
        params['RELATION']['USER'] = $('#owner_popup').find('.popup_right dd div.member[data-value=1]').attr('data-id');

        if (params.RELATION.USER) {
            bootstrap.bootstrap_call('lead/transfer', params, function (_response) {
                bootstrap.component_owner_transfer_close();
                exports.init();
            });
        } else {
            alert('请选择需要变更的负责人');
        }
    }
});