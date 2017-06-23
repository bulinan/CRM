define(function (require, exports, module) {
    var bootstrap = require('application/bootstrap'),
        ajaxSubmit = require('lib/jquery.form'),
        templet_component_foot = require('lib/text!application/templet/component_foot.html'),
        templet_component_head = require('lib/text!application/templet/component_head.html'),
        templet_component_menu = require('lib/text!application/templet/component_menu.html'),
        templet_component_window_account = require('lib/text!application/templet/component_window_account.html'),
        templet_component_support = require('lib/text!application/templet/component_support.html'),
        templet_events = require('lib/text!application/templet/events.html'),
        templet_component_owner = require('lib/text!application/templet/component_owner.html'),
        templet_owner_transfer_member = require('lib/text!application/templet/owner_transfer_member.html'),
        templet_calendar_inner = require('lib/text!application/templet/calendar_inner.html'),
        templet_component_owner = require('lib/text!application/templet/component_owner.html'),
        templet_component_user = require('lib/text!application/templet/component_user.html'),
        templet_component_share = require('lib/text!application/templet/component_share.html'), //
        templet_file_item = require('lib/text!application/templet/file_item.html');

    exports.bootstrap_i18n = function () {
        var result = {};
        for (var index = 0; index < arguments.length; index++) result['I' + arguments[index].toString()] = eval("i18n['" + arguments[index].toString() + "']");
        return result;
    };
    exports.bootstrap_init = function (_callback) {
        exports.bootstrap_call('account/load', {}, function (_response) {
            airteams.account = _response;
            airteams.USERS = {};
            for (var index in _response.GROUP) {
                var group_id = _response.GROUP[index].ID;
                airteams.USERS[group_id] = [];
            }
            console.log(airteams.USERS);
            console.log(_response);
            var params = {};
            params['USER_HEAD'] = exports.bootstrap_loadUserHead(_response.USER.HEAD);
            params['USER_NAME'] = _response.USER.NAME;
            $('#component_head').html(Handlebars.compile(templet_component_head)(params));
            $('#component_menu').html(Handlebars.compile(templet_component_menu)());
            $('#component_foot').html(Handlebars.compile(templet_component_foot)());

            exports.bootstrap_bind();
            if (_callback) _callback();
        });
    };
    exports.bootstrap_initWorkspace = function (_callback) {
        $('#workspace').html('');
        $('#component_window_qr').hide();
        $('#component_window_wait').fadeOut('slow', function () {
            if (_callback) _callback();
        });
    };
    exports.bootstrap_showLoading = function () {
        $('#component_window_wait_workspace').show();
    };
    exports.bootstrap_initMain = function (_callback) {
        $('#component_window_wait_workspace').fadeOut('fast', function () {
            if (_callback) _callback();
        });
    };
    exports.bootstrap_initPopup = function () {
        $('#workspace').find('#component_popup').remove();
        $('#workspace').find('#task').remove();
    };
    exports.bootstrap_initUsers = function () {
        for (var index in airteams.USERS) {
            airteams.USERS[index] = [];
        }
    };
    exports.bootstrap_bind = function () {

        $(document).off().delegate('[data-method]', 'click', function (_e) {
            exports.bootstrap_eval(_e, $(this), 'data-method');
        });

        $(document).delegate('body', 'click', function (_e) {
            var target = $(_e.target) || $(_e.srcElement);
            if (!target.closest('[data-window=true]').length) {
                $('[data-window=true]').each(function () {
                    if ($(this).attr('data-close')) exports.bootstrap_eval(_e, $(this), 'data-close');
                    else $(this).attr('data-window', false).hide();
                });
            }
        });
        $(document).find('#component_search_input').on('input propertychange', function () {
            if ($(this).val()) {
                if (bootstrap_call_instance) bootstrap_call_instance.abort();
                $('#component_search_results').html('').append('<li><a><em>正在搜索 ..</em></a></li>').show();
                exports.bootstrap_call('common/search', {
                    'NAME': $('#component_search_input').val()
                }, function (response) {
                    console.log(response);
                    $('#component_search_results').html('').attr('data-window', true);
                    if (response != 'NO_ONE_MATCHED' && response.length) {
                        $('#component_search_results').html('');
                        for (var index = 0; index < response.length; index++) {
                            var item = response[index], model, method;
                            if (item.MODEL == 'CUSTOMER') model = '客户';
                            else if (item.MODEL == 'PERSON') model = '联系人';
                            else if (item.MODEL == 'OPPORTUNITY') model = '业务机会';
                            else if (item.MODEL == 'CONTRACT') model = '合同';
                            else if (item.MODEL == 'LEAD') model = '销售线索';
                            else if (item.MODEL == 'FILE') model = '文件';

                            if (item.MODEL == 'FILE') $('#component_search_results').append('<li><a href="javascript:;"><em>' + model + '</em>' + item.NAME + '</a><a href="javascript:;" class="download" target="_blank" data-method="bootstrap.component_file_download" data-relation="' + item.ID + '">下载</a></li>');
                            else $('#component_search_results').append('<li><a data-method="bootstrap.component_search_results_load" data-model="' + item.MODEL + '" data-relation="' + item.ID + '"><em>' + model + '</em>' + item.NAME + '</a></li>');
                        }
                    } else $('#component_search_results').append('<li><a><em>没有找到任何数据</em></a></li>');
                });
            } else exports.component_search_results_remove();
        });
    };
    exports.component_window_account_show = function (_e) {
        exports.bootstrap_shut(_e);
        Handlebars.registerHelper("is_admin", function (_account, options) {
            if (airteams.account.USER.PHONE == _account) return options.fn(this);
        });
        $('#component_window_account').html(Handlebars.compile(templet_component_window_account)({ 'ACCOUNT_OWNER': airteams.account.RELATION.OWNER }));
        $('#component_window_account').attr('data-window', true).show();
    };
    exports.component_window_account_remove = function () {
        $('#component_window_account').html('').attr('data-window', false).hide();
    };
    exports.component_session_delete = function () {
        top.location = '/logout';
    };
    exports.bootstrap_eval = function (_e, _element, _target) {
        var controller_split = _element.attr(_target).split('.'),
            controller_name = controller_split[0],
            action_name = controller_split[1];
        if (action_name == 'init') {
            var e = _e || event, obj = _e.srcElement || _e.target;
            if (obj.className.toLowerCase() == ' checkbox' || obj.className.split(' ')[0].toLowerCase() == 'checkbox') {
                return;
            }
            $('#component_window_wait_workspace').show();
        }
        if (controller_name == 'bootstrap') eval('airteams.controllers.bootstrap.' + action_name + '(_e, _element)');
        else require(['application/' + controller_name], function (_module) {
            airteams.controllers[controller_name] = _module;
            eval('airteams.controllers.' + controller_name + '.' + action_name + '(_e, _element)');
        });
    };
    exports.bootstrap_push = function (_title, _pathName) {
        if (_title) document.title = _title + ' - AirTeams';
        else document.title = 'AirTeams';
        if (history && history.pushState) history.pushState(null, null, _pathName);
    };
    exports.bootstrap_call = function (_method, _params, _callback) {
        _params['API_TOKEN'] = airteams.settings.API_TOKEN;
        bootstrap_call_instance = $.ajax({
            dataType: 'json',
            type: 'POST', url: airteams.settings.API_BASE + _method + '?request_type=json&' + (new Date()).valueOf(), data: _params,
            success: function (_message) {
                exports.bootstrap_call_required(_message, function () {
                    _callback(_message.response);
                });
            },
            error: function (_message) {
                if (!(typeof (bootstrap_call_instance) == 'undefined') && bootstrap_call_instance.statusText != 'abort') alert('暂时无法连接到服务器，请检查您的网络环境。');
            }
        });
    };
    exports.bootstrap_call_required = function (_message, _callback) {
        if (_message.succeed) _callback();
        else {
            if (_message.response == 'INVALID_TOKEN') top.location.href = '/signin';
            if (_message.response == 'STATE_NOT_EXISTS') alert('状态或阶段不存在');
            if (_message.response == 'PARAMETERS_IMCOMPLETE') alert('参数不全');
            if (_message.response == 'ACCOUNT_NOT_EXISTS') alert('账户不存在');
            if (_message.response == 'COLLECTION_NOT_EXISTS') {
                _callback();
            }
            if (_message.response == 'CONTRACT_NOT_EXISTS') {
                _callback();
            }
            if (_message.response == 'PAYMENT_NOT_EXISTS') {
                _callback();
            }
            if (_message.response == 'LEAD_NOT_EXISTS') {
                _callback();
            }
            if (_message.response == 'OPPORTUNITY_NOT_EXISTS') {
                _callback();
            }
            if (_message.response == 'PRODUCT_NOT_EXISTS') {
                alert('产品不存在');
            }
            if (_message.response == 'USER_NOT_EXISTS') alert('用户不存在');
            if (_message.response == 'COMPETITOR_NOT_EXISTS') alert('竞争对手不存在');
            if (_message.response == 'NO_FILE_UPLOADED') alert('没有上传文件');
            if (_message.response == 'NEED_LEAST_ONE_GROUP') alert('需要选择一个小组');

            if (_message.response == 'INVALID_PARAMETER') alert('某个参数错误');
            if (_message.response == 'CUSTOMER_NOT_EXISTS') {
                _callback();
            }
            if (_message.response == 'VALUE_NOT_EXISTS') alert('选项不存在');
            if (_message.response == 'LEVEL_NOT_EXISTS') alert('级别不存在');
            if (_message.response == 'DATE_NOT_EXISTS') alert('重要日期不存在');
            if (_message.response == 'FLIE_NOT_EXISTS') alert('文件不存在');
            if (_message.response == 'TASKS_NOT_COMPLETED') alert('此阶段任务没有完成，不能推进到下一阶段');
            if (_message.response == 'PERSON_NOT_EXISTS') {
                _callback();
            }
            if (_message.response == 'INVAILD_PASSWORD' || _message.response == 'PASSWORD_NOT_REPEAT') {
                _callback();
            }
            if (_message.response == 'USER_EXISTS' || _message.response == 'BEYOND_THE_LIMIT') _callback();
        }
    };
    exports.bootstrap_full_users = function () {
        for (var index in airteams.account.GROUP) {
            for (var number in airteams.account.GROUP[index].MEMBER) {
                airteams.USERS[airteams.account.GROUP[index].ID].push(airteams.account.GROUP[index].MEMBER[number].ID);
            }
        }
    }; // airteams.USERS填满airteams.account.GROUP中的成员
    exports.bootstrap_loadUser = function (_groups, _id) {
        for (var group_index = 0; group_index < _groups.length; group_index++) {
            if (_groups[group_index].MEMBER) {
                for (var member_index = 0; member_index < _groups[group_index].MEMBER.length; member_index++) {
                    if (_groups[group_index].MEMBER[member_index].ID == _id) return _groups[group_index].MEMBER[member_index];
                }
            }
        }
    };
    exports.bootstrap_loadCharge = function (_groups, _id) {
        for (var index = 0; index < _groups.length; index++) {
            for (var member_index = 0; member_index < _groups[index].MEMBER.length; member_index++) {
                if (_groups[index].MEMBER[member_index].ID == _id)
                    return _groups[index].CHARGE;
            }
        }
    }
    exports.bootstrap_loadUserHead = function (_head) {
        if (!_head) return '/statics/img/avatar.jpg';
        else return airteams.settings.API_BASE + 'file/download?API_TOKEN=' + airteams.settings.API_TOKEN + '&ID=' + _head;
    };
    exports.bootstrap_loadSource = function (_sources, _id) {
        for (var item in _sources) if (item == _id) return _sources[item];
    };
    exports.bootstrap_loadState = function (_states, _id) {
        for (var item in _states) if (item == _id) return _states[item];
    };
    exports.bootstrap_loadType = function (_types, _id) {
        for (var item in _types) if (item == _id) return _types[item];
    };
    exports.bootstrap_loadOpportunityStateArray = function (_states, _template) {
        for (var index = 0; index < _states.length; index++) {
            if (_states[index].ID == _template) {
                return _states[index].STATE;
            }
        }
    };
    exports.bootstrap_loadOpportunityState = function (_states, _template, _id) {
        for (var index = 0; index < _states.length; index++) {
            if (_states[index].ID == _template) {
                for (var item in _states[index].STATE) {
                    if (item == _id) return _states[index].STATE[item];
                }
            }
        }
    }; //某一个状态
    exports.bootstrap_loadSource = function (_sources, _id) {
        for (var source_index in _sources) {
            if (source_index == _id) return _sources[source_index];
        }
    };
    exports.bootstrap_timestamp_to_date = function (_timestamp) {
        return new Date(parseInt(_timestamp) * 1000);
    };
    exports.bootstrap_date_to_timestamp = function (year, month, day) {
        var datums = new Date(Date.UTC(year, month, day));
        return datums.getTime() / 1000;
    }
    exports.bootstrap_time_append_zero = function (_time) {
        return _time < 10 ? '0' + '' + _time : _time;
    };
    exports.bootstrap_random = function (n) {
        var random = '';
        for (var index = 0; index < n; index++) random += Math.floor(Math.random() * 10);
        return random;
    }
    exports.bootstrap_loadLevel = function (_levels, _id) {
        for (var index in _levels) {
            if (index == _id) return _levels[index];
        }
    }
    exports.bootstrap_shut = function (_e) {
        if (_e.stopPropagation) _e.stopPropagation();
        else _e.cancelBubble = true;
    };
    exports.component_menu_blank = function () {
        $('#component_menu ul.link a').removeClass('active');
    };
    exports.component_menu_active = function (_active) {
        exports.component_menu_blank();
        $('#component_menu a[data-active=' + _active + ']').addClass('active');
    };
    exports.component_search_results_remove = function (_e) {
        $('#component_search_input').val('');
        $('#component_search_results').html('').attr('data-window', false).hide();
    };
    exports.component_search_results_load = function () {
        var model = arguments[1].attr('data-model'),
            id = arguments[1].attr('data-relation');

        if (model == 'CUSTOMER') {
            require(['application/customer_item'], function (_module) {
                _module.init(id);
            });
        }
        if (model == 'OPPORTUNITY') {
            require(['application/opportunity_item'], function (_module) {
                _module.init(id);
            });
        }
        if (model == 'PERSON') {
            require(['application/person_item'], function (_module) {
                _module.init(id);
            });
        }
        if (model == 'CONTRACT') {
            require(['application/contract_item'], function (_module) {
                _module.init(id);
            });
        }
        if (model == 'LEAD') {
            require(['application/lead_item'], function (_module) {
                _module.init(id);
            });
        }
        exports.component_search_results_remove();
    };
    exports.component_selector_bind = function () {
        $('div.selector').each(function () {
            var selector = $(this);
            selector.delegate('div.selector_title', 'click', function (_e) {
                exports.bootstrap_shut(_e);
                $('#workspace').find('[data-window=true]').attr('data-window', false).hide();
                selector.find('ul.selector_list').show().attr('data-window', true);
            });
            selector.delegate('ul.selector_list li', 'click', function (_e) {
                var element = $(this),
                    content = element.parent().parent().find('.selector_title span.text'),
                    value = element.attr('data-value'),
                    panel_wrapper = '#opportunity .panel_wrapper';

                if (value) selector.find('div.selector_title').attr('data-value', value);
                else selector.find('div.selector_title').removeAttr('data-value');

                element.parent().hide();
                content.text(element.html());
                element.parent().find('li.selected').removeClass('selected');
                element.addClass('selected');
                $(panel_wrapper).find('.select_data').removeClass('selected').hide();
                $(panel_wrapper).find('.title').css('border-bottom', '0');
                if (selector.attr('data-callback')) exports.bootstrap_eval(_e, selector, 'data-callback');
            });
        });
    };
    exports.component_checkbox_bind = function (_table, _moudle) {
        $(_table).delegate('tbody span.checkbox', 'click', function (_e) {
            bootstrap.bootstrap_shut(_e);
            var count_checked = $(_table).find('tbody span.checkbox[data-value=1]').length,
                count_checkebox = $(_table).find('tbody span.checkbox').length,
                container = $(_moudle).find('.panel_wrapper');

            if ($(_table).attr('data-all') == 1) {
                var count_database = container.find('strong[data-mark=component_opportunityList_count]').text(),
                    count_unchecked = $(_table).find('tbody span.checkbox[data-value=0]').length;

                container.find('strong[data-mark=component_opportunityList_checkedCount]').text(count_database - count_unchecked);
                if (count_checked < count_database) {
                    container.find('.cancel_all').hide();
                    container.find('.select_all').show();
                    $(_table).attr('data-all', 0);
                } else {
                    container.find('.cancel_all').show();
                    container.find('.select_all').hide();
                    $(_table).attr('data-all', 1);
                }
            }
            if (count_checked) {
                container.find('.select_data').addClass('selected').show();
                container.find('.title').css('border-bottom', '1px solid #e5e5e5');
                container.find('strong[data-mark=component_opportunityList_checkedCount]').text(count_checked);

                if (count_checked == count_checkebox) $(_table).find('thead span.checkbox').attr('data-value', 1).addClass('selected');
                else $(_table).find('thead span.checkbox').attr('data-value', 0).removeClass('selected');
            } else {
                container.find('.select_data').removeClass('selected').hide();
                container.find('.title').css('border-bottom', '0');
                $(_table).find('thead span.checkbox').attr('data-value', 0).removeClass('selected');
            }
        });

        $(_table).delegate('thead span.checkbox', 'click', function () {
            var count_checkebox = $(_table).find('tbody span.checkbox').length,
                container = $(_moudle).find('.panel_wrapper');

            if ($(this).attr('data-value') == 1) {
                container.find('.select_data').addClass('selected').show();
                container.find('.title').css('border-bottom', '1px solid #e5e5e5');
                container.find('strong[data-mark=component_opportunityList_checkedCount]').text(count_checkebox);
            } else {
                container.find('.select_data').removeClass('selected').hide();
                container.find('.title').css('border-bottom', '0');
            }
        });

        var data_element = $(_moudle).find('.panel_wrapper .select_data');
        data_element.find('a.select_all').on('click', function () {
            var count = $(this).find('strong[data-mark=component_opportunityList_count]').text(),
                container = $(_moudle).find('.panel_wrapper');

            $(_table).attr('data-all', 1);
            $(_table).find('thead').find('span.checkbox').attr('data-value', 1).addClass('selected').parents('tr').addClass('selected');
            $(_table).find('tbody').find('span.checkbox').attr('data-value', 1).addClass('selected').parents('tr').addClass('selected');

            container.find('strong[data-mark=component_opportunityList_checkedCount]').text(count);

            $(this).hide();
            $(this).parent().find('.cancel_all').show();
        });

        data_element.find('a.cancel_all').on('click', function () {
            var container = $(_moudle).find('.panel_wrapper');

            $(_table).attr('data-all', 0);
            $(_table).find('thead').find('span.checkbox').attr('data-value', 0).removeClass('selected').parents('tr').removeClass('selected');
            $(_table).find('tbody').find('span.checkbox').attr('data-value', 0).removeClass('selected').parents('tr').removeClass('selected');


            container.find('.select_data').removeClass('selected').hide();
            container.find('.title').css('border-bottom', '0');
            $(this).hide();
            $(this).parent().find('.select_all').show();
        });
    };
    exports.component_owner_select = function (_condition) {
        var popup = $('#inner_popup'),
            popup_left = popup.find('.popup_left'),
            popup_right = popup.find('.popup_right'),
            member = airteams.account.GROUP[0].MEMBER;

        popup_left.find('dd').remove();
        popup_right.find('dd').html('');
        if (member) {
            var template = Handlebars.compile(templet_owner_transfer_member);

            Handlebars.registerHelper("show", function (_head) {
                if (_head) return airteams.settings.API_BASE + 'file/download?API_TOKEN=' + airteams.settings.API_TOKEN + '&ID=' + _head;
                else return '/statics/img/avatar.jpg';
            });
            popup_right.find('dd').append(template(member));
        }
        popup_right.find('dd .member').each(function () {
            $(this).append('<span class="checkbox"></span>');
        });

        for (var index = 0; index < airteams.account.GROUP.length; index++) {
            popup_left.find('dl').append('<dd data-group="' + airteams.account.GROUP[index].ID + '"><span class="checkbox"></span><a href="javascript:;">' + airteams.account.GROUP[index].NAME + '</a></dd>');
        }

        if (_condition == 'single') popup.find('.popup_left span.checkbox').addClass('disabled');
        else {
            popup_left.find('span.checkbox').removeClass('disabled');
            popup_left.find('span.checkbox').on('click', function () {
                var group = $(this).closest('dd').attr('data-group');
                airteams.USERS[group] = [];
                if ($(this).attr('data-value') == 1) {
                    $(this).attr('data-value', 0).removeClass('selected');
                    if ($(this).parent().hasClass('selected')) popup.find('.popup_right dd .member').removeClass('selected').find('span.checkbox').attr('data-value', 0).removeClass('selected');
                } else {
                    for (var index in airteams.account.GROUP) {
                        if (airteams.account.GROUP[index].ID == group) {
                            for (var number in airteams.account.GROUP[index].MEMBER) {
                                airteams.USERS[group].push(airteams.account.GROUP[index].MEMBER[number].ID);
                            }
                        }
                    }
                    $(this).attr('data-value', 1).addClass('selected');
                    if ($(this).parent().hasClass('selected')) popup.find('.popup_right dd .member').addClass('selected').find('span.checkbox').attr('data-value', 1).addClass('selected');
                }
                console.log(airteams.USERS);
            });
        }

        popup_left.find('dd:first').addClass('selected');
        popup_right.attr('data-group', airteams.account.GROUP[0].ID);
        console.log(airteams.USERS);
        for (var index in airteams.USERS) {
            if (index == airteams.account.GROUP[0].ID) {
                for (var number in airteams.USERS[index]) {
                    popup_right.find('div.member[data-id=' + airteams.USERS[index][number] + ']').addClass('selected').find('span.checkbox').attr('data-value', 1).addClass('selected');
                }
            }
            for (var group_index in airteams.account.GROUP) {
                if (index == airteams.account.GROUP[group_index].ID) {
                    if (airteams.USERS[index].length == airteams.account.GROUP[group_index].MEMBER.length)
                        popup_left.find('dd[data-group=' + index + '] span.checkbox').attr('data-value', 1).addClass('selected');
                }
            }
        }
    };
    exports.component_owner_opporation = function (_condition) {
        var popup = $('#inner_popup'),
            popup_left = popup.find('.popup_left'),
            popup_right = popup.find('.popup_right');

        popup_right.find('dd').off().on('click', 'span.checkbox', function (_e) {
            if ($(this).hasClass('disabled')) {
            } else {
                if ($(this).attr('data-value') == 1) {
                    $(this).attr('data-value', 0);
                    $(this).closest('dd').find('span.checkbox').removeClass('disabled');
                }
                else {
                    $(this).attr('data-value', 1);
                    if (_condition == 'single') {
                        $(this).closest('dd').find('span.checkbox:not([data-value=1])').addClass('disabled');
                    } else {
                        $(this).closest('dd').find('span.checkbox:not([data-value=1])').removeClass('disabled');
                    }
                }
                if (_condition == 'multiple') {
                    var count_checked = $(this).closest('dd').find('span.checkbox[data-value=1]').length,
                        count_checkbox = $(this).closest('dd').find('span.checkbox').length,
                        group = popup_right.attr('data-group'),
                        member_id = $(this).closest('div.member').attr('data-id');

                    if ($(this).attr('data-value') == 1) {
                        airteams.USERS[group].push(member_id);
                    } else {
                        airteams.USERS[group].splice($.inArray(member_id, airteams.USERS[group]), 1);
                    }
                    console.log(airteams.USERS);
                    if (count_checked == count_checkbox) {
                        popup_left.find('dd[data-group=' + group + '] span.checkbox').attr('data-value', 1).addClass('selected');
                    } else {
                        popup_left.find('dd[data-group=' + group + '] span.checkbox').attr('data-value', 0).removeClass('selected');
                    }
                }
                $(this).toggleClass('selected');
                $(this).parent().toggleClass('selected');
            }
        });
        popup_left.delegate('dl dd', 'click', function (_e) {
            var e = _e || event, obj = e.srcElement || e.target;
            if (obj.className.split(' ')[0].toLowerCase() == 'checkbox') {
                return;
            } //点击checkbox不管用
            var element = $(this),
                group = element.attr('data-group');

            element.parent('dl').find('dd').removeClass('selected');
            element.addClass('selected');

            popup_right.attr('data-group', group);
            for (var index in airteams.account.GROUP) {
                if (airteams.account.GROUP[index].ID == group) var member = airteams.account.GROUP[index].MEMBER;
            }

            popup_right.find('dd').html('');
            if (member) {
                var template = Handlebars.compile(templet_owner_transfer_member);

                Handlebars.registerHelper("show", function (_head) {
                    if (_head) return airteams.settings.API_BASE + 'file/download?API_TOKEN=' + airteams.settings.API_TOKEN + '&ID=' + _head;
                    else return '/statics/img/avatar.jpg';
                });
                popup_right.find('dd').append(template(member));
            }
            popup_right.find('dd .member').each(function () {
                $(this).append('<span class="checkbox"></span>');
            });

            if (element.find('span.checkbox').attr('data-value') == 1) popup.find('.popup_right[data-group=' + group + ']').find('dd .member').addClass('selected').find('span.checkbox').attr('data-value', 1).addClass('selected');
            else {
                console.log(airteams.USERS);
                for (var index in airteams.USERS) {
                    if (index == group) {
                        for (var number in airteams.USERS[index]) {
                            popup.find('.popup_right[data-group=' + group + ']').find('dd .member[data-id=' + airteams.USERS[index][number] + ']').addClass('selected').find('span.checkbox').attr('data-value', 1).addClass('selected');
                        }
                    }
                }
                //popup.find('.popup_right[data-group=' + group + ']').find('dd .member').removeClass('selected').find('span.checkbox').attr('data-value', 0).removeClass('selected');
            }
        });
    }
    exports.component_owner_bind = function (_table, _moudle, _condition) {
        var data_element = $(_moudle).find('.panel_wrapper .select_data'),
            popup_left = $('#inner_popup').find('.popup_left'),
            popup_right = $('#inner_popup').find('.popup_right');

        data_element.find('a.action').on('click', function () {
            var container = $('#inner_popup'),
                model = $(this).attr('data-model');

            $('#component_window_qr').show();
            exports.bootstrap_initUsers();
            container.html(templet_component_owner).show();
            container.find('.button-group button:first').attr('data-method', model + '.component_owner_transfer_submit');
            exports.component_owner_select(_condition);
            exports.component_owner_opporation(_condition);
        });
    };
    exports.component_owner_transfer_close = function () {
        $('#component_window_qr').hide();
        $('#inner_popup').html('').hide();
        $('#owner_popup').html('').hide();
        for (var index in airteams.USERS) {
            airteams.USERS[index] = [];
        }
    };
    exports.owner_change = function () {
        var owner_id = arguments[1].closest('div.basic').find('a.owner').attr('data-owner'),
            model = arguments[1].attr('data-model');
        bootstrap.component_item_owner_transfer(owner_id, model);
    };
    exports.component_item_owner_transfer = function (owner, model) {
        var group_id = airteams.account.USER.RELATION.GROUP,
            member;

        $('#component_window_qr').show();
        $('#owner_popup').html(templet_component_owner).show();
        var popup = $('#owner_popup'),
            popup_left = popup.find('.popup_left'),
            popup_right = popup.find('.popup_right');

        popup.find('button:first').attr('data-method', model + '.owner_transfer_submit')
        popup.find('.popup_left dd').remove();
        popup.find('.popup_right dd').html('');
        for (var index = 0; index < airteams.account.GROUP.length; index++) {
            if (airteams.account.GROUP[index].ID == group_id) member = airteams.account.GROUP[index].MEMBER;
        }
        if (member) {
            var template = Handlebars.compile(templet_owner_transfer_member);

            Handlebars.registerHelper("show", function (_head) {
                if (_head) return airteams.settings.API_BASE + 'file/download?API_TOKEN=' + airteams.settings.API_TOKEN + '&ID=' + _head;
                else return '/statics/img/avatar.jpg';
            });
            popup.find('.popup_right dd').append(template(member));
        }
        popup_right.find('dd .member').each(function () {
            $(this).append('<span class="checkbox"></span>');
        });

        for (var index = 0; index < airteams.account.GROUP.length; index++) {
            popup.find('.popup_left dl').append('<dd data-group="' + airteams.account.GROUP[index].ID + '"><span class="checkbox"></span><a href="javascript:;">' + airteams.account.GROUP[index].NAME + '</a></dd>');
        }
        popup_left.find('dd[data-group=' + group_id + ']').addClass('selected');
        popup_left.find('span.checkbox').addClass('disabled');
        popup_right.attr('data-group', group_id);
        popup_right.find('div.member[data-id=' + owner + ']').attr('data-value', 1).addClass('selected').find('span.checkbox').addClass('selected');
        popup_right.find('div.member:not([data-value=1])').addClass('disabled');
        popup_right.find('div.disabled span.checkbox').addClass('disabled');
        popup_right.delegate('div.member', 'click', function () {
            var element = $(this);

            if (element.hasClass('disabled')) {
            } else {
                if (element.attr('data-value') == 1) {
                    element.attr('data-value', 0);
                    element.closest('dd').find('div.member').removeClass('disabled');
                    element.closest('dd').find('div.member span.checkbox').removeClass('disabled');
                }
                else {
                    element.attr('data-value', 1);
                    element.closest('dd').find('div.member:not([data-value=1])').addClass('disabled');
                    element.closest('dd').find('div.member:not([data-value=1]) span.checkbox').addClass('disabled');
                }
                element.toggleClass('selected');
                element.find('span.checkbox').toggleClass('selected');
            }
        });

        //点击小组 dd
        popup_left.delegate('dl dd', 'click', function (_e) {
            var e = _e || event, obj = e.srcElement || e.target;
            if (obj.className.split(' ')[0].toLowerCase() == 'checkbox') {
                return;
            } //点击checkbox不管用
            var element = $(this),
                group = element.attr('data-group');

            element.parent('dl').find('dd').removeClass('selected');
            element.addClass('selected');
            for (var index in airteams.account.GROUP) {
                if (airteams.account.GROUP[index].ID == group) member = airteams.account.GROUP[index].MEMBER;
            }
            popup_right.attr('data-group', group);
            popup_right.find('dd').html('');

            if (member) {
                var template = Handlebars.compile(templet_owner_transfer_member);

                Handlebars.registerHelper("show", function (_head) {
                    if (_head) return airteams.settings.API_BASE + 'file/download?API_TOKEN=' + airteams.settings.API_TOKEN + '&ID=' + _head;
                    else return '/statics/img/avatar.jpg';
                });
                popup_right.find('dd').append(template(member));
            }
            popup_right.find('dd .member').each(function () {
                $(this).append('<span class="checkbox"></span>');
            });
            if (element.attr('data-group') == group_id) {
                popup_right.find('div.member[data-id=' + owner + ']').attr('data-value', 1).addClass('selected').find('span.checkbox').addClass('selected');
                popup_right.find('div.member:not([data-value=1])').addClass('disabled');
                popup_right.find('div.disabled span.checkbox').addClass('disabled');
            }
        });
    }
    exports.show_events = function (model, events) {
        var container;
        if (model == 'event') {
            container = $('#dashboard .panel_left .content ul');
        } else if (model == 'customer') {
            container = $('#customer_item .panel_left .content ul');
        } else if (model == 'opportunity') {
            container = $('#opportunity_item .panel_left .content ul');
        } else if (model == 'lead') {
            container = $('#lead_item .panel_left .content ul');
        } else if (model == 'person') {
            container = $('#person_item .panel_left .content ul');
        }

        container.find('li.more').remove();
        if (events.COUNT_DATABASE) {
            var template = Handlebars.compile(templet_events),
                start = parseInt(events.START) + parseInt(events.LIMIT),
                title = {
                    //'COMPETITOR': '竞争对手',
                    'CONTRACT': '合同',
                    'CUSTOMER': '客户',
                    'DATE': '重要日期',
                    'LEAD': '销售线索',
                    'NOTE': '记录',
                    'OPPORTUNITY': '业务机会',
                    'PAYMENT': '回款',
                    'PERSON': '联系人',
                    //'PRODUCT': '产品',
                    'TODO': '任务',
                    'FILE': '文件'
                },
                action = {
                    'CREATED': '新建了',
                    'UPDATED': '修改了',
                    'DELETED': '删除了'
                };

            container.find('li.loading').fadeOut('slow');
            Handlebars.registerHelper("head", function (id) {
                var user = {};
                user = bootstrap.bootstrap_loadUser(airteams.account.GROUP, id);
                return bootstrap.bootstrap_loadUserHead(user.HEAD);
            });
            Handlebars.registerHelper("creator", function (id) {
                return bootstrap.bootstrap_loadUser(airteams.account.GROUP, id).NAME;
            });
            Handlebars.registerHelper("compare", function (model, options) {
                if (model == 'OPPORTUNITY') return options.fn(this);
                else return options.inverse(this);
            });
            Handlebars.registerHelper("filter", function (model, options) {
                if (model == 'DATE' || model == 'NOTE' || model == 'TODO' || model == 'FILE') return options.fn(this);
                else return options.inverse(this);
            });
            Handlebars.registerHelper("id", function (model, data) {
                return data.PARAMS[model];
            });
            Handlebars.registerHelper("method", function (model) {
                switch (model) {
                    case 'COMPETITOR':
                        return 'competitor_item.init';
                        break;
                    case 'OPPORTUNITY':
                        return 'opportunity_item.init';
                        break;
                    case 'CONTRACT':
                        return 'contract_item.init';
                        break;
                    case 'CUSTOMER':
                        return 'customer_item.init';
                        break;
                    case 'LEAD':
                        return 'lead_item.init';
                        break;
                    case 'PAYMENT':
                        return 'payment_item.init';
                        break;
                    case 'PERSON':
                        return 'person_item.init';
                        break;
                }
            });
            Handlebars.registerHelper("action", function (name) {
                var array = name.split('_');
                return action[array[1]] + title[array[0]];
            });
            Handlebars.registerHelper("time", function (time) {
                var date = bootstrap.bootstrap_timestamp_to_date(time),
                    date_year = date.getFullYear(),
                    date_month = bootstrap.bootstrap_time_append_zero(date.getMonth()),
                    date_day = bootstrap.bootstrap_time_append_zero(date.getDate()),
                    date_hours = bootstrap.bootstrap_time_append_zero(date.getHours()),
                    date_minutes = bootstrap.bootstrap_time_append_zero(date.getMinutes());
                return date_year + '-' + (parseInt(date_month) + 1) + '-' + date_day + ' ' + date_hours + ':' + date_minutes;
            });
            container.append(template(events.RESULT));
            container.append('<li class="more"><a href="javascript:;" class="button" data-loading="true" data-method="bootstrap.events_more" data-start="' + start + '">加载更多</a></li>');
            if (arguments.length == 3) {
                var id = arguments[2];
                container.find('li.more a').attr('data-id', id).attr('data-mark', model);
            }
        } else {
            container.append('<li class="empty">暂时没有任何动态</li>');
        }
    };
    exports.events_more = function () {
        var element = arguments[1],
            params = {
                'START': element.attr('data-start')
            },
            model;

        if (element.attr('data-mark')) {
            var mark = element.attr('data-mark');
            params['QUERY'] = {};
            if (mark == 'customer') {
                params['QUERY']['CUSTOMER'] = element.attr('data-id');
                model = 'customer';
            } else if (mark == 'opportunity') {
                params['QUERY']['OPPORTUNITY'] = element.attr('data-id');
                model = 'opportunity';
            } else if (mark == 'lead') {
                params['QUERY']['LEAD'] = element.attr('data-id');
                model = 'lead';
            } else if (mark == 'person') {
                params['QUERY']['PERSON'] = element.attr('data-id');
                model = 'person';
            }
        } else {
            model = 'event';
        }
        element.attr('data-title', element.html()).html('正在处理...');
        bootstrap.bootstrap_call('event/list', params, function (response) {
            console.log(model);

            if (response.COUNT_LIST) {
                if (element.attr('data-id')) bootstrap.show_events(model, response, element.attr('data-id'));
                else bootstrap.show_events(model, response);
                element.html(element.attr('data-title')).removeAttr('data-title');
            }
            else element.html('没有更多了');
        });
    };
    exports.component_popup_close = function () {
        $('#component_window_qr').hide();
        //$('#popup_container').html('').hide();
        $('#component_popup').remove();
    };
    exports.component_input_bind = function () {
        $('#component_popup.model').each(function () {
            var container = $(this);
            container.delegate('.multiple input', 'keyup', function () {
                var element = $(this),
                    name = element.attr('name'),
                    input = element.closest('ul').find('input[name=' + name + ']');

                if (element.val()) {
                    if (!input.parent().find('a.onemore').length) {
                        element.parent().append('<a href="javascript:;" class="onemore">再添加一个</a>');
                        element.parent().append('<span class="delete">×</span>');
                    }
                } else {
                    element.parent().find('a.onemore').remove();
                    if (element.closest('ul').find('input[name=' + name + ']').length == 1) element.parent().find('span.delete').remove();
                }
            });
            container.delegate('a.onemore', 'click', function () {
                var element = $(this),
                    name = element.parent().find('input').attr('name'),
                    type = name.split('_')[1],
                    map = {
                        'address': '地址',
                        'email': '邮箱',
                        'phone': '电话',
                        'im': '即时通讯',
                        'site': '网址',
                        'social': '社交网络'
                    };
                element.closest('li').after('<li class="multiple"><label>' + map[type] + '</label><div class="area"><input type="text" name="' + name + '" placeHolder="请填写' + map[type] + '"></div></li>');
                element.remove();
            });
            container.delegate('span.delete', 'click', function () {
                var element = $(this),
                    name = element.parent().find('input').attr('name');

                if (element.closest('ul').find('input[name=' + name + ']').length == 1) {
                    element.parent().find('input').val('');
                    element.parent().find('a.onemore').remove();
                    element.remove();
                } else {
                    element.closest('li').remove();
                    var length = $('#component_popup').find('input[name=' + name + ']').length;
                    $('#component_popup').find('input[name=' + name + ']').eq(length - 1).parent().append('<a href="javascript:;" class="onemore">再添加一个</a>');
                }
            });
        });
    };
    exports.calendar_inner_init = function (_year, _month) {
        var daysOfCurMonth = new Date(_year, _month, 0).getDate(),    //当月的天数
            curDate = new Date(_year, _month - 1, 1),
            firstDay = curDate.getDay(),    //每个月第一天是星期几
            html = '',
            row = Math.ceil((firstDay + daysOfCurMonth) / 7);

        $('#calendar_inner_table thead').html('');
        $('#calendar_inner_table tbody').html('');

        for (var i = 0; i < row; i++) {
            html = html + '<tr>';

            for (var j = 0; j < 7; j++) {
                html = html + '<td data-method="bootstrap.calendar_inner_select_date"></td>';
            }
            html = html + '</tr>';

        }
        $('#calendar_inner_table thead').html('<tr><th>日</th><th>一</th><th>二</th><th>三</th><th>四</th><th>五</th><th>六</th></tr>');
        $('#calendar_inner_table tbody').append(html);

        var date = new Date(),
            today = date.getDate(),
            f = firstDay;

        for (var n = 1; n <= daysOfCurMonth; n++) {

            $('#calendar_inner_table td').eq(f).html(n);
            $('#calendar_inner_table td').eq(f).attr('data-year', _year).attr('data-month', _month).attr('data-day', n);

            if (n == today && _month == parseInt(date.getMonth()) + 1 && _year == date.getFullYear()) {
                $('#calendar_inner_table td').eq(firstDay + n - 1).css('background-color', '#ffe18f');
            }
            f++;

        }
        for (var index = 0; index < $('#calendar_inner_table td').length; index++) {
            if (index < firstDay || index > (daysOfCurMonth + firstDay - 1)) $('#calendar_inner_table td').eq(index).removeAttr('data-method');
        }
        $('#calendar_inner .header strong.year').html(_year);
        $('#calendar_inner .header strong.month').html(_month);
    };
    exports.calendar_inner = function () {
        var curDate = new Date(),
            curYear = curDate.getFullYear(),
            curMonth = curDate.getMonth() + 1,
            curDate = curDate.getDate();
        //current = curDate.getFullYear() + '-' + bootstrap.bootstrap_time_append_zero(curDate.getMonth() + 1) + '-' + bootstrap.bootstrap_time_append_zero(curDate.getDate());
        exports.bootstrap_shut(arguments[0]);
        arguments[1].closest('ul').find('#calendar_inner').remove();
        arguments[1].after(templet_calendar_inner);
        $('#workspace').find('[data-window=true]').attr('data-window', false).hide();
        $('#calendar_inner').show().attr('data-window', true);

        if (arguments[1].attr('data-date')) {
            var date = arguments[1].attr('data-date'),
                array = date.split('-');
            exports.calendar_inner_init(array[0], array[1]);
        } else {
            exports.calendar_inner_init(curYear, curMonth);
        }

    };
    exports.calendar_inner_close = function () {
        arguments[1].attr('data-window', false).hide();
    };
    exports.calendar_inner_lastMonth = function () {
        var year = arguments[1].parent().find('strong.year').html(),
            month = arguments[1].parent().find('strong.month').html();

        exports.calendar_inner_init(year, month - 1);
        if (month < 2) exports.calendar_inner_init(parseInt(year) - 1, 12);
    };
    exports.calendar_inner_nextMonth = function () {
        var year = arguments[1].parent().find('strong.year').html(),
            month = arguments[1].parent().find('strong.month').html();

        exports.calendar_inner_init(year, parseInt(month) + 1);
        if (month > 11) exports.calendar_inner_init(parseInt(year) + 1, 1);
    };
    exports.calendar_inner_select_date = function () {
        var element = arguments[1],
            year = element.attr('data-year'),
            month = element.attr('data-month'),
            day = element.attr('data-day');

        $('#calendar_inner').attr('data-value', false).hide();
        element.closest('div.area').find('input').attr('data-date', year + '-' + month + '-' + day).val(year + '年' + month + '月' + day + '日');
    };
    exports.component_selector_dateClass = function () {
        var content = arguments[1].find('div.selector_title'),
            value = content.attr('data-value');

        if (value == '其他') {
            arguments[1].closest('li').find('.other').show();
        } else {
            arguments[1].closest('li').find('.other input').val('');
            arguments[1].closest('li').find('.other').hide();
        }
    };
    exports.component_selector_date = function () {
        var container = $('#component_popup'),
            curDate = new Date();

        for (var year = 0; year < 200; year++) {
            container.find('div[data-mark=year] ul.selector_list').append('<li data-value="' + (1900 + year) + '">' + (1900 + year) + '年</li>');

            if ((1900 + year) == curDate.getFullYear()) {
                container.find('div[data-mark=year] div.selector_title').attr('data-value', 1900 + year).find('span.text').html((1900 + year) + '年');
                container.find('div[data-mark=year] ul.selector_list li[data-value=' + (1900 + year) + ']').addClass('selected');
            }
        }
        container.find('[data-mark=month] div.selector_title').attr('data-value', exports.bootstrap_time_append_zero(curDate.getMonth() + 1)).find('span.text').html((curDate.getMonth() + 1) + '月');
        container.find('[data-mark=month] ul.selector_list li[data-value=' + exports.bootstrap_time_append_zero(curDate.getMonth() + 1) + ']').addClass('selected');
        var year = container.find('[data-mark=year] div.selector_title').attr('data-value'),
            month = container.find('[data-mark=month] div.selector_title').attr('data-value'),
            daysOfCurMonth = new Date(year, month, 0).getDate();
        console.log(month);
        for (var day = 1; day <= daysOfCurMonth; day++) {
            container.find('[data-mark=day] ul.selector_list').append('<li data-value="' + exports.bootstrap_time_append_zero(day) + '">' + day + '号</li>');
            if (day == curDate.getDate()) {
                container.find('[data-mark=day] div.selector_title').attr('data-value', exports.bootstrap_time_append_zero(day)).find('span.text').html(day + '号');
                container.find('[data-mark=day] ul.selector_list li[data-value=' + exports.bootstrap_time_append_zero(day) + ']').addClass('selected');
            }
        }
    };
    exports.component_selector_day = function () {
        var element = arguments[1],
            month = element.find('div.selector_title').attr('data-value'),
            year = element.parent().find('[data-mark=month] div.selector_title').attr('data-value'),
            daysOfCurMonth = new Date(year, month, 0).getDate();

        for (var day = 1; day <= daysOfCurMonth; day++) {
            element.parent().find('[data-mark=day] ul.selector_list').append('<li data-value="' + exports.bootstrap_time_append_zero(day) + '">' + day + '号</li>');
        }
    };
    exports.component_file_download = function () {
        var file_id;
        if (arguments[1].attr('data-relation')) {
            file_id = arguments[1].attr('data-relation');
            exports.component_search_results_remove();
        } else file_id = arguments[1].closest('tr').attr('data-id');

        window.open(airteams.settings.API_BASE + 'file/download?API_TOKEN=' + airteams.settings.API_TOKEN + '&ID=' + file_id);
    };
    exports.item_add_close = function () {
        $('#component_window_qr').hide();
        $('#item_add_popup').html('').hide();
    };
    exports.item_fileupload = function (_arguments, _model, _collection, _callback) {
        var element = _arguments;
        element.off().on('change', function () {
            if (element.val() == '') return;
            var file_name = element.val().replace(/.*(\/|\\)/, ""),
                file_list = $('#file').find('tbody');

            file_list.find('.empty').parent().hide();
            file_list.prepend('<tr data-id="new"><td class="label_black">' + file_name + '</td><td class="label_black percent">0%</td><td>' + airteams.account.USER.NAME + '</td><td class="new_create">上传中...</td><td></td></tr>');
            var new_row = $('[data-id=new]');
            $('[name=API_TOKEN]').val(airteams.settings.API_TOKEN);
            $('[name=API_TOKEN] + input').val(_collection);
            element.parents('.file_upload').ajaxSubmit({
                dataType: 'json',
                uploadProgress: function (event, position, total, percentComplete) {
                    var percentVal = percentComplete + '%';
                    new_row.find('.percent').html(percentVal);
                },
                success: function (_message) {
                    if (_message.succeed) {
                        var response = _message.response;

                        if (response.SIZE < 1048576) {
                            filesize = Math.round(response.SIZE / 1024) + 'K';
                        } else {
                            filesize = Math.round(response.SIZE / (1024 * 1024)) + 'M';
                        }

                        var date = exports.bootstrap_timestamp_to_date(response.CREATED),
                            date_year = date.getFullYear(),
                            date_month = exports.bootstrap_time_append_zero(date.getMonth() + 1),
                            date_day = exports.bootstrap_time_append_zero(date.getDate());
                        time = date_year + '年' + date_month + '月' + date_day + '日';

                        new_row.attr('data-id', response.ID).html('<td class="label_black">' + response.NAME + '</td><td class="label_black">' + filesize + '</td><td>' + exports.bootstrap_loadUser(airteams.account.GROUP, response.RELATION.CREATOR).NAME + '</td><td>' + time + '</td><td><a href="javascript:;" data-method="' + _model + '_item.file_delete">删除</a><a href="javascript:;" class="file_download" target="_blank" data-method="bootstrap.component_file_download">下载</a></td>');

                        _callback(response.ID);
                    } else {
                        switch (_message.response) {

                            case 'INVALID_TOKEN':
                                top.location.href = '/signin';
                                break;
                            case 'NO_FILE_UPLOADED':
                                upload_error = '没有文件被上传';
                                break;
                            case 'COLLECTION_NOT_EXISTS':
                                upload_error = '文件夹不存在';
                                break;
                            case 'PARAMETERS_IMCOMPLETE':
                                upload_error = '参数不全';
                                break;
                            case 'INVALID_FILE_SIZE':
                                upload_error = '超过文件大小的限制';
                                break;
                        }
                        new_row.attr('data-id', '');
                        new_row.find('.percent').html(upload_error);
                        new_row.find('.new_create').html('上传失败');
                        new_row.find('td:last').html('<a href="javascript:;" data-method="bootstrap.delete_this_row">取消</a>');
                    }
                },
                error: function (xhr) {
                    new_row.attr('data-id', '');
                    new_row.find('.new_create').html('上传失败');
                    new_row.find('td:last').html('<a href="javascript:;" data-method="bootstrap.delete_this_row">取消</a>');
                }
            });
        });
    };
    exports.delete_this_row = function () {
        var tbody = $('#opportunity_item .itemSpace table tbody'),
            element = arguments[1].closest('tr');

        if (tbody.find('td').hasClass('empty')) {
            if (tbody.find('tr').length == 2) {
                element.remove();
                tbody.find('td.empty').parent().show();
            } else {
                element.remove();
            }
        } else {
            if (tbody.find('tr').length == 1) {
                element.remove();
                tbody.append('<tr><td colspan="6" class="empty">当前业务几乎下没有文件</td></tr>');
            } else {
                element.remove();
            }
        }
    };
    exports.component_user_filter = function () {
        var container = $('#inner_popup'),
            model = arguments[1].attr('data-model'),
            userStr = arguments[1].attr('data-user'),
            userObj = JSON.parse(userStr);

        airteams.USERS = {};
        airteams.USERS = userObj;
        console.log(airteams.USERS);
        $('#component_window_qr').show();
        container.html(templet_component_user).show();
        $('#inner_popup').find('.button-group button:first').attr('data-method', model + '.component_user_submit');
        exports.component_owner_select('multiple');
        exports.component_owner_opporation('multiple');
    };
    exports.data_share = function () {
        var container = $('#inner_popup'),
            model = arguments[1].attr('data-model'),
            userStr = arguments[1].attr('data-user'),
            userObj = JSON.parse(userStr);

        airteams.USERS = {};
        airteams.USERS = userObj;
        console.log(airteams.USERS);
        $('#component_window_qr').show();
        container.html(templet_component_share).show();
        $('#inner_popup').find('.button-group button:first').attr('data-method', model + '.component_share_submit');
        exports.component_owner_select('multiple');
        exports.component_owner_opporation('multiple');
    };
    exports.aoData_manage = function (_data) {
        var result = {};
        for (var index = 0; index < _data.length; index) {
            var key = _data[index].name;
            result[key] = _data[index].value;
        }
        console.log(result);
        return result;
    };

    //权限
    // 是否是自己
    exports.component_item_auth = (function () {
        Handlebars.registerHelper("is_auth", function (id, options) {
            if (id == airteams.account.USER.ID) return options.fn(this);
            else return options.inverse(this);
        });
    })();
    // 是否是最高管理员
    exports.component_item_administrator = (function () {
        Handlebars.registerHelper("is_administrator", function (phone, options) {
            console.log(phone);
            if (phone == airteams.account.RELATION.OWNER) return options.fn(this);
            else return options.inverse(this);
        });
    })();
    // 是否是自己或最高管理员
    exports.component_item_all = (function () {
        Handlebars.registerHelper("is_all", function (id, options) {
            if (id == airteams.account.USER.ID || airteams.account.USER.PHONE == airteams.account.RELATION.OWNER) return options.fn(this);
            else return options.inverse(this);
        });
    })();
    //是否是部门管理员或最高管理员
    exports.component_item_charge = (function () {
        Handlebars.registerHelper("is_charge", function (id, options) {
            var bool = false, phone = airteams.account.USER.PHONE;
            for (var index = 0; index < airteams.account.GROUP.length; index++) {
                for (var charge_index = 0; charge_index < airteams.account.GROUP[index].CHARGE.length; charge_index++) {
                    if (airteams.account.GROUP[index].CHARGE[charge_index] == id) bool = true;
                }
            }

            if (bool || airteams.account.RELATION.OWNER == phone) return options.fn(this);
            else return options.inverse(this);
        });
    })();
    //是否可以看见用户的联系方式
    exports.component_item_top = (function () {
        Handlebars.registerHelper("customer_contract", function (id, array, options) {
            var phone = airteams.account.USER.PHONE, bool = false;
            for (var index in array) {
                if (array[index] == airteams.account.USER.ID) bool = true;
            }
            if (id == airteams.account.USER.ID || phone == airteams.account.RELATION.OWNER || bool) return options.fn(this);
            else return options.inverse(this);
        });
    })();
    //是否存在数据的共享中
    exports.component_item_share = (function () {
        Handlebars.registerHelper("is_share", function (array, options) {
            for (var index in array) {
                if (array[index] == airteams.account.USER.ID) return options.fn(this);
            }
            return options.inverse(this);
        });
    })();
    exports.component_file_upload = function () {
        var element = arguments[1];

        element.off().on('change', function () {
            if (element.val() == '') return;
            var file_name = element.val().replace(/.*(\/|\\)/, ""),
                file_list = $('table tbody'),
                collection = element.closest('.title').find('span.collection_current');

            file_list.prepend('<tr data-id="new"><td></td><td class="label_black">' + file_name + '</td><td class="label_black percent">0%</td><td>' + airteams.account.USER.NAME + '</td><td class="new_create">上传中...</td><td></td></tr>');
            var new_row = $('[data-id=new]');
            $('[name=API_TOKEN]').val(airteams.settings.API_TOKEN);
            if (collection.length) $('[name=API_TOKEN] + input').val(collection.attr('data-id'));
            else $('[name=API_TOKEN] + input').val('ROOT');

            element.parents('.file_upload').ajaxSubmit({
                dataType: 'json',
                uploadProgress: function (event, position, total, percentComplete) {
                    var percentVal = percentComplete + '%';
                    new_row.find('.percent').html(percentVal);
                },
                success: function (_message) {
                    if (_message.succeed) {
                        var response = _message.response;
                        new_row.remove();
                        file_list.prepend(Handlebars.compile(templet_file_item)(response));
                        file_list.find('tr.empty').remove();
                    } else {
                        switch (_message.response) {

                            case 'INVALID_TOKEN':
                                top.location.href = '/signin';
                                break;
                            case 'NO_FILE_UPLOADED':
                                upload_error = '没有文件被上传';
                                break;
                            case 'COLLECTION_NOT_EXISTS':
                                upload_error = '文件夹不存在';
                                break;
                            case 'PARAMETERS_IMCOMPLETE':
                                upload_error = '参数不全';
                                break;
                            case 'INVALID_FILE_SIZE':
                                upload_error = '超过文件大小的限制';
                                break;

                        }
                        new_row.attr('data-id', '');
                        new_row.find('.percent').html(upload_error);
                        new_row.find('.new_create').html('上传失败');
                        new_row.find('td:last').html('<a href="javascript:;" data-method="bootstrap.remove_this_row">取消</a>');
                    }
                },
                error: function (xhr) {
                    new_row.attr('data-id', '');
                    new_row.find('.new_create').html('上传失败');
                    new_row.find('td:last').html('<a href="javascript:;" data-method="bootstrap.remove_this_row">取消</a>');
                    file_list.find('tr.empty').remove();
                }
            });
        });
    };
    exports.remove_this_row = function () {
        var element = arguments[1];
        if (element.closest('tbody').find('tr').length == 1) element.closest('tbody').append('<tr class="empty"><td colspan="6">当前目录下没有文件夹和文件</td></tr>');
        element.closest('tr').remove();
    }
    exports.file_new_close = function () {
        var element = arguments[1];

        if (element.closest('tbody').find('tr').length == 1) {
            element.closest('tbody').append('<tr class="empty"><td colspan="6">当前目录下没有文件夹和文件</td></tr>');
        }
        element.closest('tr').remove();
    };
    exports.component_report_year_fill = function () {
        var container = $('#report_item .title .year'),
                date = new Date();

        for (var index = -1; index < 2; index++) {
            container.find('.selector ul.selector_list').append('<li data-value="' + (date.getFullYear() + index) + '">' + (date.getFullYear() + index) + '年</li>');
        }
        container.find('.selector .selector_title').attr('data-value', date.getFullYear()).find('span.text').html(date.getFullYear() + '年');
        container.find('.selector ul.selector_list li[data-value=' + date.getFullYear() + ']').addClass('selected');
        container.find('span.year').html(date.getFullYear());
    }
    exports.component_report_timeSelect_bind = function () {
        var container = $('#report_item .title'),
            user_value = container.find('span.user').attr('data-user'),
            data = {
                'YEAR': container.find('.year .selector .selector_title').attr('data-value'),
                'SCOPE': container.find('.year_range .selector .selector_title').attr('data-value'),
                'OWNER': []
            };
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
    exports.component_report_user_params = function () {
        var title = $('#report_item .title'),
            data = {
                'OWNER': [],
                'YEAR': title.find('.year .selector .selector_title').attr('data-value'),
                'SCOPE': title.find('.year_range .selector .selector_title').attr('data-value')
            };

        return data;
    };
    exports.bootstrap_exact_time = function (_hour, _minute) {
        var container = $('#component_popup');
        for (var index = 0; index < 24; index++) {
            var str, moment;
            if (index < 12) str = '上午', moment = index;
            else if (index == 12) str = '中午', moment = index;
            else str = '下午', moment = index - 12;

            if (index == _hour) {
                container.find('div[data-mark=hour] ul.selector_list').append('<li data-value=' + index + ' class="selected">' + str + moment + '点</li>');
                container.find('div[data-mark=hour] div.selector_title').attr('data-value', index).find('span.text').html(str + moment + '点');
            }
            else container.find('div[data-mark=hour] ul.selector_list').append('<li data-value=' + index + '>' + str + moment + '点</li>');
        }
        for (var index = 0; index < 60; index += 5) {
            var str;
            if (index < 10) str = '0' + index;
            else str = index;
            if (index <= _minute && index + 5 > _minute) {
                container.find('div[data-mark=minute] ul.selector_list').append('<li data-value=' + index + ' class="selected">' + str + '</li>');
                container.find('div[data-mark=minute] div.selector_title').attr('data-value', index).find('span.text').html(str);
            }
            else container.find('div[data-mark=minute] ul.selector_list').append('<li data-value=' + index + '>' + str + '</li>');
        }
    };
    exports.component_filter_close = function () {
        $('#component_window_qr').hide();
        $('#component_filter').remove();
    };
    exports.bootstrap_user_cookie = function (cookie) {
        var data = [];
        for (var index in cookie) {
            for (var number = 0; number < cookie[index].length; number++) {
                data.push(cookie[index][number]);
            }
        }
        return data;
    };
    exports.bootstrap_user_showText = function (title, jsonObj) {
        var data = exports.bootstrap_user_cookie(jsonObj),
            num = 0,
            users_length = 0,
            member_length = 0,
            group_id;
        for (var index in airteams.account.GROUP) {
            member_length = member_length + airteams.account.GROUP[index].MEMBER.length;
        }

        for (var index in jsonObj) {
            users_length = users_length + jsonObj[index].length;
            if (jsonObj[index].length) {
                num++;
                group_id = index;
            }
        }
        if (users_length == member_length) {
            title.find('span.user').html('所有人');
        } else {
            if (num == 1) {
                for (var index in airteams.account.GROUP) {
                    if (airteams.account.GROUP[index].ID == group_id) {
                        var group_name = airteams.account.GROUP[index].NAME;
                        if (data.length == airteams.account.GROUP[index].MEMBER.length) title.find('span.user').html(group_name + '所有人');
                        else {
                            if (data.length == 1) title.find('span.user').html(bootstrap.bootstrap_loadUser(airteams.account.GROUP, data[0]).NAME);
                            else title.find('span.user').html(bootstrap.bootstrap_loadUser(airteams.account.GROUP, data[0]).NAME + ' 等' + data.length + '人');
                        }
                    }
                }

            } else title.find('span.user').html(bootstrap.bootstrap_loadUser(airteams.account.GROUP, data[0]).NAME + ' 等' + data.length + '人');
        }
    };
    //是否是共享者
    exports.bootstrap_is_share = function (data) {
        if (data.length) {
            for (var index in data) {
                if (data[index] == airteams.account.USER.ID) {
                    return true;
                }
            }
            return false;
        } else {
            return false;
        }
    }
});