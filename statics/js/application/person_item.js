define(function (require, exports, module) {
    var bootstrap = require('application/bootstrap'),
        customer_item = require('application/customer_item'),
        templet_person_item = require('lib/text!application/templet/person_item.html'),
        templet_person_item_overview = require('lib/text!application/templet/person_item_overview.html'),
        templet_person_item_edit = require('lib/text!application/templet/person_item_edit.html'),
        templet_person_item_date = require('lib/text!application/templet/person_item_date.html'),
        templet_contact = require('lib/text!application/templet/contact.html'),
        templet_customer_item_date = require('lib/text!application/templet/customer_item_date.html'),
        templet_date_new = require('lib/text!application/templet/date_new.html'),
        templet_date_new_item = require('lib/text!application/templet/date_new_item.html');

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
            id = exports.component_person_getId();
        }

        bootstrap.bootstrap_call('person/load', { 'ID': id }, function (_response) {
            if (_response == 'PERSON_NOT_EXISTS') {
                alert('联系人不存在');
                customer_item.person_init();
                return;
            }
            console.log(_response);
            bootstrap.bootstrap_initWorkspace();
            //bootstrap.bootstrap_showLoading();
            bootstrap.bootstrap_initMain(function () {
                bootstrap.bootstrap_push('联系人详情', '/person/' + id);
                $('#workspace').append(Handlebars.compile(templet_person_item)(_response));
                bootstrap.component_selector_bind();

                var container = $('#person_item');
                $('#workspace').find('.basic h1').attr('data-id', _response.ID);
                $('#workspace').find('.basic h1 a.customer').attr('data-id', _response.RELATION.CUSTOMER.ID).html(_response.RELATION.CUSTOMER.NAME);
                $('#workspace').find('.basic h1 span').html(_response.VERSION.CURRENT.NAME);
                exports.call(id);
            });
        });
    };
    exports.call = function (id) {
        exports.component_initWorkspace();
        var container = $('#person_item'),
            template = Handlebars.compile(templet_person_item_overview);

        bootstrap.bootstrap_call('person/load', { 'ID': id }, function (_response) {
            var container = $('#person_item'),
                contact = _response.VERSION.CURRENT.CONTACT,
                contact_length = contact.length;

            Handlebars.registerHelper("has_value", function (value) {
                if (value) return value;
                else return '暂无';
            });
            container.find('.container .itemSpace').html(template(_response));
            container.find('.panel_right .contact .content ul').html('');
            if (contact_length) {
                for (var index = 0; index < contact_length; index++) {
                    exports.person_contact(contact[index].CLASS, contact[index].VALUE);
                }
            } else {
                container.find('.panel_right .contact .content ul').append('<li class="empty">暂时没有联系方式</li>')
            }
            bootstrap.bootstrap_call('event/list', { 'QUERY[PERSON]': id }, function (_response) {
                $('#person_item .panel_left .content ul').html('');
                bootstrap.show_events('person', _response, id);
            });
        });

       
    }
    exports.person_contact = function (type, value) {
        var container = $('#person_item'),
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
        $('#person_item .container .itemSpace').html('');
        $('#component_window_wait').fadeOut('slow');
    };
    exports.component_subMenu_blank = function () {
        $('#person_item .panel_full .menu li').removeClass('active');
    };
    exports.component_person_getId = function () {
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
        var id = exports.component_person_getId();
        exports.call(id);
    };
    exports.person_edit = function () {
        $('#component_window_qr').show();
        var template = Handlebars.compile(templet_person_item_edit),
            template_contact = Handlebars.compile(templet_contact),
            id = exports.component_person_getId();

        bootstrap.bootstrap_call('person/load', { 'ID': id }, function (_response) {
            console.log(_response);
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
            Handlebars.registerHelper("judge", function (index, object, options) {
                if (index < object.length - 1) return options.fn(this);
                else {
                    return options.inverse(this);
                }
            });
            container.find('ul.contact').html('');
            container.find('ul.contact').html(template_contact(contact_new));
            //结束
            bootstrap.component_selector_bind();
            bootstrap.component_input_bind();
        });
    }
    exports.person_delete = function () {
        var customer_id = arguments[1].closest('.basic').find('h1 a.customer').attr('data-id');
        if (confirm('是否删除？')) {
            bootstrap.bootstrap_call('person/delete', { 'ID': exports.component_person_getId() }, function (_response) {
                customer_item.init(customer_id);
            });
        }
    };
    exports.person_edit_submit = function () {
        var container = $('#component_popup'),
            address = container.find('input[name=contact_address]'),
            email = container.find('input[name=contact_email]'),
            im = container.find('input[name=contact_im]'),
            phone = container.find('input[name=contact_phone]'),
            site = container.find('input[name=contact_site]'),
            social = container.find('input[name=contact_social]'),
            bool = true,
            params = {
                'ID': exports.component_person_getId(),
                'NAME': container.find('input[name=person_name]').val(),
                'TITLE': container.find('input[name=person_title]').val(),
                'DEPARTMENT': container.find('input[name=person_department]').val(),
                'REMARK': container.find('textarea[name=person_remark]').val()
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
            alert('请填写联系人姓名');
        }
        if (bool) {
            bootstrap.bootstrap_call('person/edit', params, function (_response) {
                bootstrap.component_popup_close();
                exports.init();
            });
        }
    };
    exports.date_init = function () {
        exports.component_subMenu_blank();
        exports.component_initWorkspace();
        var id = exports.component_person_getId();

        if (arguments.length) arguments[1].addClass('active');
        else $('#person_item .panel_full .menu li.date').addClass('active');
        var template = Handlebars.compile(templet_person_item_date);
        bootstrap.bootstrap_call('date/list', { 'QUERY[PERSON]': id }, function (_response) {
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
            $('#person_item .container .itemSpace').html(template(_response.RESULT));
        });
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
    exports.owner_transfer_submit = function () {
        var params = {
            'ID': exports.component_person_getId(),
            'RELATION': {}
        };
        params['RELATION']['USER'] = $('#owner_popup').find('.popup_right dd div.member[data-value=1]').attr('data-id');

        if (params.RELATION.USER) {
            bootstrap.bootstrap_call('person/transfer', params, function (_response) {
                bootstrap.component_owner_transfer_close();
                exports.init();
            });
        } else {
            alert('请选择需要变更的负责人');
        }
    }
});