define(function (require, exports, module) {
    var bootstrap = require('application/bootstrap'),
        customer_item = require('application/customer_item'),
        opportunity = require('application/opportunity'),
        templet_opportunity_item = require('lib/text!application/templet/opportunity_item.html'),
        templet_opportunity_item_overview = require('lib/text!application/templet/opportunity_item_overview.html'),
        templet_opportunity_item_process = require('lib/text!application/templet/opportunity_item_process.html'),
        templet_opportunity_item_todo = require('lib/text!application/templet/opportunity_item_todo.html'),
        templet_opportunity_item_process_current = require('lib/text!application/templet/opportunity_item_process_current.html'),
        templet_opportunity_item_process_notes = require('lib/text!application/templet/opportunity_item_process_notes.html'),
        templet_opportunity_item_process_notes_item = require('lib/text!application/templet/opportunity_item_process_notes_item.html'),
        templet_opportunity_item_process_step = require('lib/text!application/templet/opportunity_item_process_step.html'),
        templet_opportunity_item_overview_product = require('lib/text!application/templet/opportunity_item_overview_product.html'),
        templet_opportunity_item_overview_competitor = require('lib/text!application/templet/opportunity_item_overview_competitor.html'),
        templet_opportunity_item_overview_details = require('lib/text!application/templet/opportunity_item_overview_details.html'),
        templet_opportunity_item_overview_person = require('lib/text!application/templet/opportunity_item_overview_person.html'),
        templet_opportunity_item_edit = require('lib/text!application/templet/opportunity_item_edit.html'),
        templet_opportunity_item_file = require('lib/text!application/templet/opportunity_item_file.html'),
        templet_component_person_list = require('lib/text!application/templet/component_person_list.html'),
        templet_product_list = require('lib/text!application/templet/product_list.html'),
        templet_competitor_list = require('lib/text!application/templet/competitor_list.html'),
        templet_note_item_edit = require('lib/text!application/templet/note_item_edit.html');

    exports.bootstrap_init = function () {
        exports.init();
    }
    exports.init = function () {
        var id;
        if (arguments.length) {
            if (arguments.length == 2) {
                var element = arguments[1], model = element.attr('data-model');
                id = element.attr('data-id');
                /*var e = arguments[0] || event, obj = arguments[0].srcElement || arguments[0].target;
                if (obj.className.toLowerCase() == ' checkbox' || obj.className.split(' ')[0].toLowerCase() == 'checkbox' || obj.className.toLowerCase() == 'delete') {
                return;
                }*/
            } else if (arguments.length == 1) {
                id = arguments[0];
            }
        } else {
            id = exports.component_opportunity_getId();
        }

        bootstrap.bootstrap_call('opportunity/load', { 'ID': id }, function (_response) {
            if (_response == 'OPPORTUNITY_NOT_EXISTS') {
                alert('业务机会不存在');
                opportunity.init();
                return;
            }
            console.log(_response);
            bootstrap.component_menu_active('opportunity');
            bootstrap.bootstrap_initWorkspace();
            bootstrap.bootstrap_initUsers();
            bootstrap.bootstrap_initMain(function () {
                bootstrap.bootstrap_push('业务机会详情', '/opportunity/' + id);

                Handlebars.registerHelper("void", function (number) {
                    if (number) return '撤销作废';
                    else return '作废';
                });
                $('#workspace').append(Handlebars.compile(templet_opportunity_item)(_response));
                bootstrap.component_selector_bind();
                if (_response.RELATION.VOID) {
                    $('#opportunity_item').find('.button-group .button:not([data-mark])').removeAttr('data-method')
                }
                for (var number in _response.RELATION.SHARE) {
                    var group = bootstrap.bootstrap_loadUser(airteams.account.GROUP, _response.RELATION.SHARE[number]).RELATION.GROUP;
                    for (var index in airteams.USERS) {
                        if (group == index) airteams.USERS[index].push(_response.RELATION.SHARE[number]);
                    }
                }
                var container = $('#opportunity_item'),
                    jsonStr = JSON.stringify(airteams.USERS);
                $('#workspace').attr('data-model', model);
                $('#workspace').find('.basic h1').attr('data-id', _response.ID);
                $('#workspace').find('.basic a.customer').attr('data-id', _response.RELATION.CUSTOMER.ID).html(_response.RELATION.CUSTOMER.NAME);
                $('#workspace').find('.basic span').html(_response.NAME);
                container.find('.panel_full a.owner').attr('data-owner', _response.RELATION.OWNER).html(bootstrap.bootstrap_loadUser(airteams.account.GROUP, _response.RELATION.OWNER).NAME);
                container.find('.button-group a[data-user]').attr('data-user', jsonStr);
                exports.call(id);
            });
        });

    };
    exports.call = function (id) {
        exports.component_initWorkspace();
        var template = Handlebars.compile(templet_opportunity_item_overview);

        bootstrap.bootstrap_call('opportunity/load', { 'ID': id }, function (_response) {
            var template_details = Handlebars.compile(templet_opportunity_item_overview_details),
                container = $('#opportunity_item');

            opportunity_cache = _response;
            Handlebars.registerPartial("products", templet_opportunity_item_overview_product);
            Handlebars.registerPartial("competitors", templet_opportunity_item_overview_competitor);

            container.find('.container .itemSpace').html(template(_response));
            Handlebars.registerHelper("time", function (stamp) {
                if (stamp) {
                    var date = bootstrap.bootstrap_timestamp_to_date(stamp),
                        date_year = date.getFullYear(),
                        date_month = bootstrap.bootstrap_time_append_zero(date.getMonth() + 1),
                        date_day = bootstrap.bootstrap_time_append_zero(date.getDate());
                    return date_year + '年' + date_month + '月' + date_day + '日';
                } else {
                    return '';
                }
            });
            Handlebars.registerHelper("state", function (id, template) {
                return bootstrap.bootstrap_loadOpportunityState(airteams.account.SETTING.OPPORTUNITY.STATE, template, id);
            });
            Handlebars.registerHelper("standing", function (created) {
                if (created) var created_date = bootstrap.bootstrap_timestamp_to_date(created);
                var date = new Date();
                var standing_time = date.getTime() - created_date.getTime();
                return Math.floor(standing_time / (24 * 3600 * 1000) + 1) + '天';
            });
            $('#opportunity_item .panel_right .details .content').html(template_details(_response));
            //联系人信息
            var container = $('#opportunity_item .panel_right .person .content');
            container.html('');
            if (_response.PERSON.length) {
                var template_person = Handlebars.compile(templet_opportunity_item_overview_person);

                if (_response.PERSON.length > 6) container.append(template_person(_response.PERSON.splice(0, 6)));
                else container.append(template_person(_response.PERSON));

            } else {
                container.append('<p class="empty">当前机会下没有联系人，立即<a href="javascript:;" data-method="opportunity_item.person_add">添加</a></p>');
            }

            bootstrap.bootstrap_call('event/list', { 'QUERY[OPPORTUNITY]': id }, function (_response) {
                $('#opportunity_item .panel_left .content ul').html('');
                bootstrap.show_events('opportunity', _response, id);
            });
            if (_response.RELATION.VOID) {
                $('#opportunity_item .itemSpace').find('a:not([data-id])').removeAttr('data-method');
            }
            if (_response.RELATION.OWNER != airteams.account.USER.ID && airteams.account.USER.PHONE !== airteams.account.RELATION.OWNER) {
                $('#opportunity_item .itemSpace .panel_right').find('a[data-method]').removeAttr('data-method');
                $('#opportunity_item .itemSpace .panel_right').find('a').click(function () {
                    alert('您无权操作');
                });
            }
        });
    };

    exports.component_initWorkspace = function () {
        $('#opportunity_item .container .itemSpace').html('');
        $('#component_window_wait').fadeOut('slow');
    };
    exports.component_subMenu_blank = function () {
        $('#opportunity_item .panel_full .menu li').removeClass('active');
    };
    exports.component_opportunity_getId = function () {
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
        var id = exports.component_opportunity_getId();
        exports.call(id);
    };
    //note列表
    exports.note_list = function (state) {
        var id = exports.component_opportunity_getId();
        bootstrap.bootstrap_call('note/list', { 'QUERY[OPPORTUNITY]': id, 'QUERY[OPPORTUNITY_STATE]': state }, function (_response) {
            console.log(_response);
            var template_notes = Handlebars.compile(templet_opportunity_item_process_notes),
                container = $('#opportunity_item .panel_left .step .content'),
                share_data = opportunity_cache.RELATION.SHARE;

            if (share_data) edit_abled = bootstrap.bootstrap_is_share(share_data);
            else edit_abled = false;
            container.find('ul.notes').remove();
            if (_response.COUNT_DATABASE) {
                $('#opportunity_item .panel_left .step .content').find('p.empty').remove();
                container.attr('data-empty', 0);
                Handlebars.registerHelper("is_stateCurrent", function (state, options) {
                    if (state == opportunity_cache.STATE) return options.fn(this);
                    else return options.inverse(this);
                });
                Handlebars.registerHelper("transform", function (data) {
                    return JSON.stringify(data);
                });
                Handlebars.registerHelper("owner", function (id) {
                    return bootstrap.bootstrap_loadUser(airteams.account.GROUP, id).NAME;
                });
                Handlebars.registerHelper("date", function (time) {
                    var date = bootstrap.bootstrap_timestamp_to_date(time),
                        date_year = date.getFullYear(),
                        date_month = bootstrap.bootstrap_time_append_zero(date.getMonth() + 1),
                        date_day = bootstrap.bootstrap_time_append_zero(date.getDate()),
                        date_hour = bootstrap.bootstrap_time_append_zero(date.getHours()),
                        date_minute = bootstrap.bootstrap_time_append_zero(date.getMinutes()),
                        date_second = bootstrap.bootstrap_time_append_zero(date.getSeconds());
                    return date_year + '-' + date_month + '-' + date_day + ' ' + date_hour + ':' + date_minute + ':' + date_second;
                });
                container.append(template_notes(_response.RESULT));
            } else {
                if (airteams.account.USER.ID == opportunity_cache.RELATION.OWNER || edit_abled || airteams.account.USER.PHONE == airteams.account.RELATION.OWNER) {
                    if (state != opportunity_cache.STATE) $('#opportunity_item .panel_left .step .content').append('<p class="empty">此阶段还没有创建任何记录</p>');
                } else {
                    $('#opportunity_item .panel_left .step .content').append('<p class="empty">此阶段还没有创建任何记录</p>');
                }

                container.attr('data-empty', 1);
            }
        });
    };
    exports.tasks_completed = function () {
        var task_completed = opportunity_cache.TASK,
            state_current = opportunity_cache.STATE;

        console.log('当前状态' + state_current);
        if (task_completed.constructor == Array) {
            if (task_completed.length) {
                for (var i in task_completed) {
                    if (i == state_current) return task_completed[i];
                }
                return '';
            } else {
                return '';
            }
        } else {
            for (var i in task_completed) {
                if (i == state_current) {
                    return task_completed[i];
                }
            }
            return '';
        }
    };
    exports.process_init = function () {
        exports.component_initWorkspace();
        if (arguments.length) {
            exports.component_subMenu_blank();
            arguments[1].addClass('active');
        }

        var template = Handlebars.compile(templet_opportunity_item_process),
            share_data = opportunity_cache.RELATION.SHARE,
            edit_abled,
            state_templates = airteams.account.SETTING.OPPORTUNITY.STATE,
            state_template = opportunity_cache.STATE_TEMPLATE,
            state_current = opportunity_cache.STATE,
            opportunity_owner = $('#opportunity_item .panel_full .basic a.owner').attr('data-owner');

        if (share_data) edit_abled = bootstrap.bootstrap_is_share(share_data);
        else edit_abled = false;
        for (var template_index = 0; template_index < state_templates.length; template_index++) {

            if (state_templates[template_index].ID == state_template) {

                state_templateObject = state_templates[template_index];
                var task_completed_array = exports.tasks_completed();
                console.log('已完成的任务');
                console.log(task_completed_array);

                Handlebars.registerHelper("tasks", function (object, options) {
                    for (var item in object) {
                        if (item == state_current) {
                            var array = object[item];
                            if (array.length) return options.fn(this);
                        }
                    }
                });
                Handlebars.registerHelper("state_current", function (object, options) {
                    for (var item in object) {
                        if (item == state_current) {
                            if (task_completed_array) {
                                var array = object[state_current].filter(function (item) {
                                    if (task_completed_array.indexOf(item) == -1) {
                                        return item;
                                    }
                                });
                                //if (!array) $('#opportunity_item .panel_left .step').find('ul.list').remove();
                                if (array) return options.fn(array);
                            } else {
                                return options.fn(object[state_current]);
                            }
                        }
                    }
                });
                Handlebars.registerHelper("state", function (object, options) {
                    var data = '', element = {};
                    for (var item in object) {
                        element.state_id = item;
                        element.state_value = object[item];
                        data += options.fn(element);
                    }
                    return data;
                });

                Handlebars.registerPartial("process_step", templet_opportunity_item_process_current);
                $('#opportunity_item .container .itemSpace').html(template(state_templates[template_index]));
                if (!$('#opportunity_item .panel_left .step').find('ul.list li').length) {
                    $('#opportunity_item .panel_left .step').find('ul.list').remove();
                    if (state_current != 100) $('#opportunity_item .panel_left .step').find('button[data-abled]').attr('data-completed', true);
                }

                if (opportunity_owner != airteams.account.USER.ID && !edit_abled && airteams.account.USER.PHONE != airteams.account.RELATION.OWNER) {
                    $('#opportunity_item .panel_left .step .content').html('');
                }
                //新加
                var container = $('#opportunity_item .panel_right'),
                    template = Handlebars.compile(templet_opportunity_item_process_step),
                    length = container.find('ul.list li[data-id]').length;
                container.find('.tasks').hide();
                for (var index = 0; index < length; index++) {
                    var state_id = container.find('ul.list li[data-id]').eq(index).attr('data-id');
                    Handlebars.registerHelper("state", function () {
                        return state_id;
                    });
                    container.find('ul.list li[data-id]').eq(index).after(template(state_templateObject.TASK[state_id]));
                }
                if (task_completed_array) {
                    for (var index = 0; index < task_completed_array.length; index++) {
                        container.find('.tasks li[data-value=' + task_completed_array[index] + ']').addClass('selected');
                    }
                }
                container.find('.list li[data-id=' + state_current + ']+ul.tasks').show();
                //
            }
        }
        exports.note_list(state_current);

        if (opportunity_cache.RELATION.VOID) {
            $('#opportunity_item .itemSpace').find('button[data-method]').removeAttr('data-method');
            $('#opportunity_item .itemSpace').find('textarea').attr('disabled', true);
            $('#opportunity_item .itemSpace').find('span.checkbox').addClass('disabled');
        } else {
            $('#opportunity_item').find('.panel_left .list').on('click', 'span.checkbox', function () {
                console.log('点击');
                if ($(this).attr('data-value') == 1) $(this).attr('data-value', 0);
                else $(this).attr('data-value', 1);
                $(this).toggleClass('selected');
            });
        }
    };
    exports.state_init = function () {
        var template = Handlebars.compile(templet_opportunity_item_process_step), //
            container = $('#opportunity_item .panel_right'),
            opportunity_owner = $('#opportunity_item .panel_full .basic a.owner').attr('data-owner'),
            state_current = opportunity_cache.STATE,
            state_template = opportunity_cache.STATE_TEMPLATE,
            state_id,
            element,
            task_completed_array = exports.tasks_completed(),
            edit_abled;

        if (opportunity_cache.RELATION.SHARE) edit_abled = bootstrap.bootstrap_is_share(opportunity_cache.RELATION.SHARE);
        else edit_abled = false;
        $('#opportunity_item .panel_left .step .content').html('');
        if (arguments.length) {
            element = arguments[1];
            state_id = element.attr('data-id');

            if (opportunity_owner == airteams.account.USER.ID || edit_abled || airteams.account.USER.PHONE == airteams.account.RELATION.OWNER) {
                if (state_id == state_current) {
                    var template_left = Handlebars.compile(templet_opportunity_item_process_current),
                    states = airteams.account.SETTING.OPPORTUNITY.STATE;

                    Handlebars.registerHelper("state_current", function (object, options) {
                        for (var item in object) {
                            if (item == state_current) {
                                if (task_completed_array) {
                                    console.log(task_completed_array);
                                    var array = object[state_current].filter(function (item) {
                                        if (task_completed_array.indexOf(item) == -1) {
                                            return item;
                                        }
                                    });
                                    //if (!array) $('#opportunity_item .panel_left .step').find('ul.list').remove();
                                    if (array) return options.fn(array);
                                } else {
                                    return options.fn(object[state_current]);
                                }
                            }
                        }
                    });
                    for (var index = 0; index < states.length; index++) {
                        if (states[index].ID == state_template) {
                            $('#opportunity_item .panel_left .step .content').append(template_left(states[index]));
                        }
                    }
                    if (!$('#opportunity_item .panel_left .step .content').find('ul.list li').length) {
                        $('#opportunity_item .panel_left .step .content').find('ul.list').remove();
                        if (state_current != 100) $('#opportunity_item .panel_left .step .content').find('button[data-abled]').attr('data-completed', true);
                    }
                    if (opportunity_cache.RELATION.VOID) {
                        $('#opportunity_item .itemSpace').find('button[data-method]').removeAttr('data-method');
                        $('#opportunity_item .itemSpace').find('textarea').attr('disabled', true);
                        $('#opportunity_item .itemSpace').find('span.checkbox').addClass('disabled');
                    }
                    $('#opportunity_item .panel_left .step .content').find('ul.list').on('click', 'span.checkbox', function () {
                        if ($(this).attr('data-value') == 1) $(this).attr('data-value', 0);
                        else $(this).attr('data-value', 1);
                        $(this).toggleClass('selected');
                    });
                }
                //exports.note_list(state_id);
            } /*else {
                var params = {
                    'QUERY[OPPORTUNITY]': exports.component_opportunity_getId(),
                    'QUERY[OPPORTUNITY_STATE]': state_id
                };
                bootstrap.bootstrap_call('note/list', params, function (_response) {
                    if (_response.COUNT_DATABASE) {
                        $('#opportunity_item .panel_left .step .content').find('p.empty').remove();
                        exports.note_list(state_id);
                    } else {
                        $('#opportunity_item .panel_left .step .content').append('<p class="empty">此阶段还没有创建任何记录</p>');
                    }
                });
            }*/
            exports.note_list(state_id);
            element.parent().find('ul.tasks').hide();
            element.parent().find('ul.tasks[data-state=' + state_id + ']').show();
        }
        if (parseInt(state_id) < parseInt(state_current) && parseInt(state_id) != 100) {
            container.find('ul.list ul.tasks[data-state=' + state_id + '] li').addClass('selected');
        }
    };
    exports.note_submit = function () {
        var element = arguments[1],
            bool = true,
            container = element.closest('.content'),
            id = exports.component_opportunity_getId(),
            tasks_selected = container.find('ul.list li span.selected'),
            tasks_all = container.find('ul.list li span.checkbox'),
            state_current = opportunity_cache.STATE,
            task_completed = opportunity_cache.TASK,
            params = {
                'RELATION[OPPORTUNITY]': id,
                'CONTENT': container.find('textarea[name=note_content]').val(),
                'FILE': [],
                'OPPORTUNITY_STATE': state_current
            };
        params['TASK'] = [];
        for (var index = 0; index < tasks_selected.length; index++) {
            params['TASK'].push(tasks_selected.eq(index).parent().find('span.name').html());
        }

        if (bool && params.CONTENT == '') {
            bool = false;
            alert('记录内容不能为空');
        }
        if (bool) {
            bootstrap.bootstrap_call('note/new', params, function (_response) {
                //编辑此机会
                console.log(_response);
                var state_container = $('#opportunity_item .panel_right .state ul.list'),
                    template = Handlebars.compile(templet_opportunity_item_process_notes_item),
                    date = new Date(),
                    tasks = exports.tasks_completed(),
                    state = _response.OPPORTUNITY_STATE,
                    opportunity_params = {
                        'ID': exports.component_opportunity_getId(),
                        'RELATION[CUSTOMER]': opportunity_cache.RELATION.CUSTOMER.ID,
                        'NAME': opportunity_cache.NAME,
                        'PRICE': opportunity_cache.PRICE,
                        'DATE_DEAL_PREDICT': opportunity_cache.DATE_DEAL_PREDICT,
                        'OWNER': _response.RELATION.OWNER,
                        'REMARK': opportunity_cache.REMARK,
                        'SOURCE': opportunity_cache.SOURCE,
                        'LAST_NOTE_CREATED': _response.CREATED,
                        'FILE': opportunity_cache.FILE,
                        'PRODUCT': [],
                        'PERSON': [],
                        'COMPETITOR': [],
                        'TASK': {}
                    };

                opportunity_params.TASK = task_completed;
                if (tasks) {
                    if (_response.TASK.length) opportunity_params.TASK[state] = _response.TASK.concat(tasks);
                } else {
                    if (_response.TASK.length) opportunity_params.TASK[state] = _response.TASK;
                }

                console.log(opportunity_params.TASK);
                for (var index = 0; index < opportunity_cache.PRODUCT.length; index++) {
                    opportunity_params.PRODUCT.push(opportunity_cache.PRODUCT[index].ID);
                }
                for (var index = 0; index < opportunity_cache.PERSON.length; index++) {
                    opportunity_params.PERSON.push(opportunity_cache.PERSON[index].ID);
                }
                for (var index = 0; index < opportunity_cache.COMPETITOR.length; index++) {
                    opportunity_params.COMPETITOR.push(opportunity_cache.COMPETITOR[index].ID);
                }
                if (container.find('ul.list').length) {
                    if (tasks_selected.length == tasks_all.length) {
                        element.attr('data-completed', true);
                    } else {
                        element.removeAttr('data-completed');
                        opportunity_params.STATE = state;
                        bootstrap.bootstrap_call('opportunity/edit', opportunity_params, function (_response) {
                            console.log(_response);
                            opportunity_cache = _response;
                            task_completed_array = _response.TASK;
                        });
                    }
                }
                if (element.attr('data-completed')) {
                    if (confirm('此阶段已经完成，是否推进到下一步？')) {
                        var state_next = state_container.find('li[data-id=' + state + ']~li[data-id]').attr('data-id');
                        opportunity_params.STATE = state_next;
                        bootstrap.bootstrap_call('opportunity/edit', opportunity_params, function (_response) {
                            task_completed_array = _response.TASK;
                            opportunity_cache = _response;
                            exports.process_init();
                        });
                    } else {
                        opportunity_params.STATE = state;
                        bootstrap.bootstrap_call('opportunity/edit', opportunity_params, function (_response) {
                            console.log(_response);
                            opportunity_cache = _response; //....
                            task_completed_array = _response.TASK;
                        });
                        container.find('ul.list').remove();
                    }
                }
                if (container.find('ul.notes').length) {
                } else {
                    container.find('ul.notes').remove();
                    container.append('<ul class="notes"></ul>')
                }
                container.find('textarea[name=note_content]').val('');
                tasks_selected.parent().remove();
                Handlebars.registerHelper("owner", function (id) {
                    return bootstrap.bootstrap_loadUser(airteams.account.GROUP, id).NAME;
                });
                Handlebars.registerHelper("transform", function (data) {
                    return JSON.stringify(data);
                });
                Handlebars.registerHelper("date", function (time) {
                    var date = bootstrap.bootstrap_timestamp_to_date(time),
                        date_year = date.getFullYear(),
                        date_month = bootstrap.bootstrap_time_append_zero(date.getMonth() + 1),
                        date_day = bootstrap.bootstrap_time_append_zero(date.getDate()),
                        date_hour = bootstrap.bootstrap_time_append_zero(date.getHours()),
                        date_minute = bootstrap.bootstrap_time_append_zero(date.getMinutes()),
                        date_second = bootstrap.bootstrap_time_append_zero(date.getSeconds());
                    return date_year + '-' + date_month + '-' + date_day + ' ' + date_hour + ':' + date_minute + ':' + date_second;
                });
                container.find('ul.notes').prepend(template(_response));
                if (_response.TASK.length) {
                    for (var index = 0; index < _response.TASK.length; index++) {
                        state_container.find('ul.tasks[data-state=' + _response.OPPORTUNITY_STATE + '] li[data-value=' + _response.TASK[index] + ']').addClass('selected');
                    }
                }
            });
        }
    };
    exports.file_init = function () {
        exports.component_subMenu_blank();
        arguments[1].addClass('active');
        exports.component_initWorkspace();
        var template = Handlebars.compile(templet_opportunity_item_file),
            file_id;

        if (opportunity_cache.FILE == '') file_id = '';
        else file_id = opportunity_cache.FILE;

        bootstrap.bootstrap_call('file/list', { 'QUERY[ID]': file_id }, function (_response) {
            console.log(_response);
            Handlebars.registerHelper("creator", function (_id) {
                return bootstrap.bootstrap_loadUser(airteams.account.GROUP, _id).NAME;
            });
            Handlebars.registerHelper("time", function (time) {
                var date = bootstrap.bootstrap_timestamp_to_date(time),
                    date_year = date.getFullYear(),
                    date_month = bootstrap.bootstrap_time_append_zero(date.getMonth() + 1),
                    date_day = bootstrap.bootstrap_time_append_zero(date.getDate());
                return date_year + '年' + date_month + '月' + date_day + '日';
            });
            Handlebars.registerHelper("size", function (number) {
                if (number < 1048576) {
                    return Math.round(number / 1024) + 'K';
                } else {
                    return Math.round(number / (1024 * 1024)) + 'M';
                }
            });
            $('#opportunity_item .container .itemSpace').html(template(_response.RESULT));
            if (opportunity_cache.RELATION.VOID) {
                $('.itemSpace').find('a[data-method]').removeAttr('data-method');
                $('.itemSpace').find('input[data-method]').attr('type', 'text').removeAttr('data-method');
            }
        });
    };
    exports.opportunity_edit = function () {
        $('#component_window_qr').show();
        var template = Handlebars.compile(templet_opportunity_item_edit);
        var id = exports.component_opportunity_getId();
        bootstrap.bootstrap_call('opportunity/load', { 'ID': id }, function (_response) {
            console.log(_response);
            params_edit_task = _response.TASK;
            console.log(params_edit_task);
            Handlebars.registerHelper("date", function (time) {
                var array = time.split('-');
                return array[0] + '年' + array[1] + '月' + array[2] + '日';
            });
            Handlebars.registerHelper("owner", function (id) {
                return bootstrap.bootstrap_loadUser(airteams.account.GROUP, id).NAME;
            });
            bootstrap.bootstrap_initPopup();
            $('#workspace').append(template(_response));
            var container = $('#component_popup');
            container.show();

            var state_template = _response.STATE_TEMPLATE,
                state_value = _response.STATE,
                state_text = bootstrap.bootstrap_loadOpportunityState(airteams.account.SETTING.OPPORTUNITY.STATE, state_template, state_value),
                state_array = bootstrap.bootstrap_loadOpportunityStateArray(airteams.account.SETTING.OPPORTUNITY.STATE, state_template),
                source_value = _response.SOURCE,
                source_text = bootstrap.bootstrap_loadSource(airteams.account.SETTING.OPPORTUNITY.SOURCE, source_value);

            for (var index in state_array) {
                container.find('li[data-mark=state] ul.selector_list').append('<li data-value="' + index + '">' + state_array[index] + '</li>');
            }
            container.find('li[data-mark=state] div.selector_title').attr('data-value', state_value).find('span.text').html(state_text);
            container.find('li[data-mark=state] ul.selector_list').find('li[data-value=' + state_value + ']').addClass('selected');
            for (var index in airteams.account.SETTING.OPPORTUNITY.SOURCE) {
                container.find('li[data-mark=source] ul.selector_list').append('<li data-value="' + index + '">' + airteams.account.SETTING.OPPORTUNITY.SOURCE[index] + '</li>');
            }
            container.find('li[data-mark=source] div.selector_title span.text').html(source_text);
            container.find('li[data-mark=source] ul.selector_list').find('li[data-value=' + source_value + ']').addClass('selected');
            bootstrap.component_selector_bind();
            bootstrap.component_input_bind();

        });
    };
    exports.opportunity_edit_submit = function () {
        var container = $('#component_popup'),
            date = new Date(),
            product = container.find('li[data-mark=product] a.item'),
            competitor = container.find('li[data-mark=competitor] a.item'),
            person = container.find('li[data-mark=person] a.item'),
            params = {
                'ID': exports.component_opportunity_getId(),
                'NAME': container.find('input[name=opportunity_name]').val(),
                'PRICE': container.find('input[name=opportunity_price]').val(),
                'DATE_DEAL_PREDICT': container.find('input[name=opportunity_date]').attr('data-date'),
                'STATE': container.find('li[data-mark=state] div.selector_title').attr('data-value'),
                'OWNER': container.find('li[data-mark=owner] input[name=opportunity_owner]').val(),
                'REMARK': container.find('textarea[name=opportunity_remark]').val(),
                'SOURCE': container.find('li[data-mark=source] div.selector_title').attr('data-value'),
                'LAST_NOTE_CREATED': bootstrap.bootstrap_date_to_timestamp(date.getFullYear(), date.getMonth(), date.getDay()),
                'FILE': opportunity_cache.FILE,
                'PRODUCT': [],
                'PERSON': [],
                'COMPETITOR': [],
                'TASK': params_edit_task
            },
            bool = true;
        for (var index = 0; index < product.length; index++) {
            params.PRODUCT.push(product.eq(index).attr('data-id'));
        }
        for (var index = 0; index < competitor.length; index++) {
            params.COMPETITOR.push(competitor.eq(index).attr('data-id'));
        }
        for (var index = 0; index < person.length; index++) {
            params.PERSON.push(person.eq(index).attr('data-id'));
        }
        console.log(params);
        if (bool && params.NAME == '') {
            bool = false;
            alert('请填写机会名称');
        }
        if (bool && params.PRICE == '') {
            bool = false;
            alert('请填写机会金额');
        }
        if (bool && !/^\d+(\.\d+)?$/.test(params.PRICE)) {
            bool = false;
            alert('输入的机会金额须为数字（正数）');
        }

        if (bool) {
            bootstrap.bootstrap_call('opportunity/edit', params, function (_response) {
                console.log(_response);
                bootstrap.component_popup_close();
                exports.init();
            });
        }
    };
    exports.opportunity_delete = function () {
        var id = exports.component_opportunity_getId(),
            customer_id = arguments[1].closest('.basic').find('h1 a.customer').attr('data-id');
        if (confirm('是否删除？')) {
            bootstrap.bootstrap_call('opportunity/delete', { 'ID': id }, function (_response) {
                if ($('#workspace').attr('data-model')) {
                    var model = $('#workspace').attr('data-model');
                    if (model == 'customer') customer_item.init(customer_id);
                    else if (model == 'opportunity') opportunity.init();
                } else {
                    opportunity.init();
                }
            });
        }
    };
    exports.owner_transfer_submit = function () {
        var params = {
            'ID': exports.component_opportunity_getId(),
            'RELATION': {}
        };
        params['RELATION']['USER'] = $('#owner_popup').find('.popup_right dd div.member[data-value=1]').attr('data-id');

        if (params.RELATION.USER) {
            bootstrap.bootstrap_call('opportunity/transfer', params, function (_response) {
                bootstrap.component_owner_transfer_close();
                exports.init();
            });
        } else {
            alert('请选择需要变更的负责人');
        }
    };
    exports.opportunity_edit_params = function (_back) { //编辑业务机会时，传递的参数
        var params = {
            'ID': opportunity_cache.ID,
            'NAME': opportunity_cache.NAME,
            'PRICE': opportunity_cache.PRICE,
            'DATE_DEAL_PREDICT': opportunity_cache.DATE_DEAL_PREDICT,
            'STATE': opportunity_cache.STATE,
            'OWNER': opportunity_cache.RELATION.OWNER,
            'REMARK': opportunity_cache.REMARK,
            'SOURCE': opportunity_cache.SOURCE,
            'LAST_NOTE_CREATED': opportunity_cache.LAST_NOTE_CREATED,
            'PRODUCT': [],
            'PERSON': [],
            'COMPETITOR': [],
            'TASK': opportunity_cache.TASK //14个参数
        };
        if (arguments.length == 0) params['FILE'] = opportunity_cache.FILE;
        else params['FILE'] = [];

        for (var index = 0; index < opportunity_cache.PRODUCT.length; index++) {
            params['PRODUCT'].push(opportunity_cache.PRODUCT[index].ID);
        }
        for (var index = 0; index < opportunity_cache.COMPETITOR.length; index++) {
            params['COMPETITOR'].push(opportunity_cache.COMPETITOR[index].ID);
        }
        for (var index = 0; index < opportunity_cache.PERSON.length; index++) {
            params['PERSON'].push(opportunity_cache.PERSON[index].ID);
        }
        return params;
    };
    exports.component_personSelect_submit = function () {
        var container = $('#item_add_popup'),
            item = container.find('div.item[data-value=1]'),
            params = exports.opportunity_edit_params();

        params['PERSON'] = [];
        for (var index = 0; index < item.length; index++) {
            params['PERSON'].push(item.eq(index).attr('data-id'));
        }
        bootstrap.bootstrap_call('opportunity/edit', params, function (_response) {
            bootstrap.item_add_close();
            exports.init();
        });
    };
    exports.product_select_submit = function () {
        var container = $('#item_add_popup'),
            checked_box = container.find('table tbody tr span.checkbox[data-value=1]'),
            params = exports.opportunity_edit_params();

        params['PRODUCT'] = [];
        for (var index = 0; index < checked_box.length; index++) {
            params['PRODUCT'].push(checked_box.eq(index).closest('tr').attr('data-id'));
        }
        console.log(params);
        bootstrap.bootstrap_call('opportunity/edit', params, function (_response) {
            bootstrap.item_add_close();
            exports.init();
        });
    };
    exports.item_checkbox_bind = function () {
        var container = $('#item_add_popup');
        container.find('tbody span.checkbox').on('click', function () {
            var element = $(this);

            if (element.attr('data-value') == 1) element.attr('data-value', 0);
            else element.attr('data-value', 1);
            element.toggleClass('selected');

            if (container.find('tbody span.checkbox[data-value=1]').length == container.find('tbody span.checkbox').length) {
                container.find('thead span.checkbox').attr('data-value', 1).addClass('selected');
            } else {
                container.find('thead span.checkbox').attr('data-value', 0).removeClass('selected');
            }
        });
        container.find('thead span.checkbox').on('click', function () {
            var element = $(this);

            if (element.attr('data-value') == 1) {
                element.attr('data-value', 0);
                container.find('tbody span.checkbox').attr('data-value', 0).removeClass('selected');
            }
            else {
                element.attr('data-value', 1);
                container.find('tbody span.checkbox').attr('data-value', 1).addClass('selected');
            }
            element.toggleClass('selected');
        });
    }
    exports.person_add = function () {
        var element = arguments[1],
            container = $('#item_add_popup'),
            person_contanier = $('#opportunity_item .panel_right .person');

        $('#component_window_qr').show();
        bootstrap.bootstrap_call('person/list', {'QUERY[CUSTOMER]': opportunity_cache.RELATION.CUSTOMER.ID}, function (_response) {
            var length = person_contanier.find('div.item').length;

            Handlebars.registerHelper("is_there", function (length, options) {
                if (length) return options.fn(this);
                else return options.inverse(this);
            });
            $('#item_add_popup').html(Handlebars.compile(templet_component_person_list)(_response.RESULT)).show();
            //container.find('button:first').attr('data-method', model + '.component_personSelect_submit');
            if (length) {
                for (var index = 0; index < length; index++) {
                    var person_id = person_contanier.find('div.item').eq(index).attr('data-id');
                    $('#item_add_popup').find('div.item[data-id=' + person_id + ']').attr('data-value', 1).addClass('selected');
                }
            }
            container.find('div.item').on('click', function () {
                var element = $(this);

                if (element.attr('data-value') == 1) element.attr('data-value', 0);
                else element.attr('data-value', 1);
                element.toggleClass('selected');
            });
        });

    };
    exports.product_add = function () {
        var element = arguments[1],
            container = $('#item_add_popup'),
            product_contanier = $('#opportunity_item .panel_right .product');

        $('#component_window_qr').show();
        bootstrap.bootstrap_call('product/list', {}, function (_response) {
            var length = product_contanier.find('li[data-id]').length;

            $('#item_add_popup').html(Handlebars.compile(templet_product_list)(_response.RESULT)).show();
            exports.item_checkbox_bind();
            if (length) {
                for (var index = 0; index < length; index++) {
                    var product_id = product_contanier.find('li').eq(index).attr('data-id');
                    console.log(product_id);
                    $('#item_add_popup').find('table tbody tr[data-id=' + product_id + '] span.checkbox').attr('data-value', 1).addClass('selected');
                    if (container.find('tbody span.checkbox[data-value=1]').length == container.find('tbody span.checkbox').length) {
                        container.find('thead span.checkbox').attr('data-value', 1).addClass('selected');
                    } else {
                        container.find('thead span.checkbox').attr('data-value', 0).removeClass('selected');
                    }
                }
            }
        });
    };
    exports.item_remove = function () {
        if (confirm('确定移除此项吗？')) arguments[1].remove();
    };
    exports.competitor_add = function () {
        var element = arguments[1],
            container = $('#item_add_popup'),
            competitor_contanier = $('#opportunity_item .panel_right .competitor');

        $('#component_window_qr').show();
        bootstrap.bootstrap_call('competitor/list', {}, function (_response) {
            console.log(_response);
            var length = competitor_contanier.find('li[data-id]').length;

            Handlebars.registerHelper("competitor_level", function (_level) {
                for (var index in airteams.account.SETTING.COMPETITOR.LEVEL) {
                    if (index == _level) return airteams.account.SETTING.COMPETITOR.LEVEL[index];
                }
            });
            Handlebars.registerHelper("competitor_scale", function (_scale) {
                for (var index in airteams.account.SETTING.COMPETITOR.SCALE) {
                    if (index == _scale) return airteams.account.SETTING.COMPETITOR.SCALE[index];
                }
            });
            $('#item_add_popup').html(Handlebars.compile(templet_competitor_list)(_response.RESULT)).show();
            exports.item_checkbox_bind();

            if (length) {
                for (var index = 0; index < length; index++) {
                    var competitor_id = competitor_contanier.find('li').eq(index).attr('data-id');

                    $('#item_add_popup').find('table tbody tr[data-id=' + competitor_id + '] span.checkbox').attr('data-value', 1).addClass('selected');
                    if (container.find('tbody span.checkbox[data-value=1]').length == container.find('tbody span.checkbox').length) {
                        container.find('thead span.checkbox').attr('data-value', 1).addClass('selected');
                    } else {
                        container.find('thead span.checkbox').attr('data-value', 0).removeClass('selected');
                    }
                }
            }
        });
    };
    exports.competitor_select_submit = function () {
        var container = $('#item_add_popup'),
            checked_box = container.find('table tbody span.checkbox[data-value=1]'),
            params = exports.opportunity_edit_params();

        params['COMPETITOR'] = [];
        for (var index = 0; index < checked_box.length; index++) {
            params['COMPETITOR'].push(checked_box.eq(index).closest('tr').attr('data-id'));
        }
        console.log(params);
        bootstrap.bootstrap_call('opportunity/edit', params, function (_response) {
            bootstrap.item_add_close();
            exports.init();
        });
    };
    exports.file_upload = function () {
        bootstrap.item_fileupload(arguments[1], 'opportunity', opportunity_cache.COLLECTION, function (_id) {
            opportunity_cache.FILE.push(_id);
            var params = exports.opportunity_edit_params();

            bootstrap.bootstrap_call('opportunity/edit', params, function (_response) { });
        });
    };
    exports.file_delete = function () {
        if (confirm('确定删除该文件吗?')) {
            var element = arguments[1].closest('tr');
            bootstrap.bootstrap_call('file/delete', { 'ID': element.attr('data-id') }, function (_response) {
                var params = exports.opportunity_edit_params(true);

                for (var index = 0; index < opportunity_cache.FILE.length; index++) {
                    if (opportunity_cache.FILE[index] != element.attr('data-id'))
                        params['FILE'].push(opportunity_cache.FILE[index]);
                }

                bootstrap.bootstrap_call('opportunity/edit', params, function (_response) { });
                var tbody = $('#opportunity_item .itemSpace table tbody');

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
                        tbody.append('<tr><td colspan="5" class="empty">当前业务机会下没有文件</td></tr>');
                    } else {
                        element.remove();
                    }
                }
            });
        }
    };
    exports.component_share_submit = function () {
        var element_share = $('#opportunity_item .button-group a[data-user]'),
            params = {
                'ID': exports.component_opportunity_getId(),
                'RELATION': { 'USER': [] }
            };
        for (var index in airteams.USERS) {
            for (var number = 0; number < airteams.USERS[index].length; number++) {
                params.RELATION.USER.push(airteams.USERS[index][number]);
            }
        }
        console.log(params);
        if (params.RELATION.USER.length) {
            bootstrap.bootstrap_call('opportunity/share', params, function (_response) {
                console.log(airteams.USERS);
                var jsonStr = JSON.stringify(airteams.USERS);
                element_share.attr('data-user', jsonStr);
                bootstrap.component_owner_transfer_close();
                exports.init();
            });
        } else {
            alert('请选择需要共享此业务机会的用户');
        }
    };
    exports.todo_init = function () {
        exports.component_subMenu_blank();
        exports.component_initWorkspace();
        var id = exports.component_opportunity_getId();

        if (arguments.length) arguments[1].addClass('active');
        else $('#opportunity_item .panel_full .menu li.todo').addClass('active');
        var template = Handlebars.compile(templet_opportunity_item_todo);

        bootstrap.bootstrap_call('todo/list', { 'QUERY[OPPORTUNITY]': id }, function (_response) {
            console.log(_response);
            Handlebars.registerHelper("owner", function (id) {
                return bootstrap.bootstrap_loadUser(airteams.account.GROUP, id).NAME;
            });
            Handlebars.registerHelper("done", function (data) {
                if (data) return '已经完成';
                else return '正在处理';
            });
            Handlebars.registerHelper("deadline", function (stamp) {
                if (stamp) {
                    var date = bootstrap.bootstrap_timestamp_to_date(stamp),
                        date_year = date.getFullYear(),
                        date_month = bootstrap.bootstrap_time_append_zero(date.getMonth()),
                        date_day = bootstrap.bootstrap_time_append_zero(date.getDate()),
                        date_hours = bootstrap.bootstrap_time_append_zero(date.getHours()),
                        date_minutes = bootstrap.bootstrap_time_append_zero(date.getMinutes());
                    return date_year + '-' + (parseInt(date_month) + 1) + '-' + date_day + ' ' + date_hours + ':' + date_minutes;
                } else {
                    return '';
                }
            });
            Handlebars.registerHelper("content", function (data) {
                var dataObj = {
                    'NAME': data.NAME,
                    'DATE': data.DATE,
                    'OWNER': data.RELATION.OWNER,
                    'DONE': data.DONE,
                    'MODEL_ID': data.RELATION.OPPORTUNITY.ID,
                    'MODEL_NAME': data.RELATION.OPPORTUNITY.NAME,
                    'REMARK': data.REMARK
                };
                var str = JSON.stringify(dataObj);
                return str;
            });
            $('#opportunity_item .container .itemSpace').html(template(_response.RESULT));
            if (opportunity_cache.RELATION.VOID) {
                $('.itemSpace').find('a[data-method]').removeAttr('data-method');
            }
        });

    };
    exports.todo_window_close = function () {
        $('#component_window_qr').hide();
        $('#component_popup').html('').hide();
    };
    exports.todo_new_submit = function () {
        var container = $('#component_popup'),
            hour = container.find('div[data-mark=hour] div.selector_title').attr('data-value'),
            minute = container.find('div[data-mark=minute] div.selector_title').attr('data-value'),
            params = {
                'NAME': container.find('input[name=todo_name]').val(),
                'DEADLINE': container.find('input[name=todo_deadline]').attr('data-date') + ' ' + hour + ':' + minute + ':00',
                'REMARK': container.find('textarea[name=todo_remark]').val(),
                'RELATION': {},
                'MEMBER': [],
                'FILE': []
            };
        params['RELATION']['MODEL'] = 'OPPORTUNITY';
        params['RELATION']['OPPORTUNITY'] = exports.component_opportunity_getId();
        bootstrap.bootstrap_call('todo/new', params, function (response) {
            exports.todo_window_close();
            exports.todo_init();
        });
    };
    exports.todo_edit_submit = function () {
        var container = $('#component_popup'),
            hour = container.find('div[data-mark=hour] div.selector_title').attr('data-value'),
            minute = container.find('div[data-mark=minute] div.selector_title').attr('data-value'),
            params = {
                'ID': container.attr('data-relation'),
                'NAME': container.find('input[name=todo_name]').val(),
                'DEADLINE': container.find('input[name=todo_deadline]').attr('data-date') + ' ' + hour + ':' + minute + ':00',
                'REMARK': container.find('textarea[name=todo_remark]').val(),
                'DONE': container.find('li[data-mark=done] div.selector_title').attr('data-value'),
                'RELATION': {},
                'MEMBER': [],
                'FILE': []
            };
        params['RELATION']['MODEL'] = 'OPPORTUNITY';
        params['RELATION']['OPPORTUNITY'] = exports.component_opportunity_getId();
        bootstrap.bootstrap_call('todo/edit', params, function (response) {
            exports.todo_window_close();
            exports.todo_init();
        });
    };
    exports.todo_delete = function () {
        var id = arguments[1].closest('tr').attr('data-id');
        if (confirm('确定删除此项日程安排吗？')) {
            bootstrap.bootstrap_call('todo/delete', { 'ID': id }, function (response) {
                exports.todo_window_close();
                exports.todo_init();
            });
        }
    };
    exports.opportunity_cancel = function () {
        var container = $('#opportunity_item'),
            element = arguments[1],
            mark = element.attr('data-mark'),
            params = {
                'ID': exports.component_opportunity_getId(),
                'RELATION': {}
            };
        if (mark == 1) {
            params['RELATION']['VOID'] = 0;
        } else {
            params['RELATION']['VOID'] = 1;
        }
        bootstrap.bootstrap_call('opportunity/void', params, function (_response) {
            exports.init();
        });
    };
    exports.note_edit = function () {
        var element = arguments[1],
            container = $('#opportunity_item .panel_left .notes'),
            data = JSON.parse(element.attr('data-content')),
            state_templates = airteams.account.SETTING.OPPORTUNITY.STATE,
            state_template = opportunity_cache.STATE_TEMPLATE,
            state_current = opportunity_cache.STATE,
            task_completed_array = exports.tasks_completed(),
            tasks_completed;

        if (data.TASK.length) {
            var newArray = task_completed_array.filter(function (item) {
                if (data.TASK.indexOf(item) == -1) {
                    return item;
                }
            });
            if (newArray) tasks_completed = newArray;
            else tasks_completed = data.TASK;
        } else {
            tasks_completed = task_completed_array;
        }
        element.closest('ul.notes').find('span.icon').show();
        element.closest('ul.notes').find('div.information').show();
        element.closest('ul.notes').find('div.opporation').show();
        element.closest('ul.notes').find('div[data-mark=note_edit]').remove();
        element.closest('li').find('span.icon').hide();
        element.closest('li').find('div').hide();

        for (var template_index = 0; template_index < state_templates.length; template_index++) {

            if (state_templates[template_index].ID == state_template) {
                Handlebars.registerHelper("tasks", function (object, options) {
                    for (var item in object) {
                        if (item == state_current) {
                            var array = object[item];
                            if (array.length) return options.fn(this);
                        }
                    }
                });
                Handlebars.registerHelper("state_current", function (object, options) {
                    for (var item in object) {
                        if (item == state_current) {
                            if (tasks_completed) {
                                var array = object[state_current].filter(function (item) {
                                    if (tasks_completed.indexOf(item) == -1) {
                                        return item;
                                    }
                                });
                                //if (!array) container.find('ul.list').remove();
                                if (array) return options.fn(array);
                            } else {
                                return options.fn(object[state_current]);
                            }
                        }
                    }
                });
                Handlebars.registerHelper("is_completed", function (item, options) {
                    if (data.TASK.indexOf(item) == -1) return options.fn(this);
                    else return options.inverse(this);
                });
                element.closest('li').append(Handlebars.compile(templet_note_item_edit)(state_templates[template_index]));
                if (!container.find('ul.list li').length) {
                    container.find('ul.list').remove();
                    if (state_current != 100) container.find('button[data-abled]').attr('data-completed', true);
                }
            }
        }
        container.find('textarea[name=note_content]').val(data.CONTENT);
        container.find('input[name=note_id]').val(data.ID);
        container.find('input[name=note_task]').val(data.TASK);
        container.find('ul.list').on('click', 'span.checkbox', function () {
            if ($(this).attr('data-value') == 1) $(this).attr('data-value', 0);
            else $(this).attr('data-value', 1);
            $(this).toggleClass('selected');
        });
    };
    exports.note_edit_submit = function () {
        var element = arguments[1],
            bool = true,
            container = element.closest('li'),
            id = exports.component_opportunity_getId(),
            tasks_selected = container.find('ul.list li span.selected'),
            tasks_all = container.find('ul.list li span.checkbox'),
            state_current = opportunity_cache.STATE,
            task_completed = opportunity_cache.TASK,
            task_old = container.find('input[name=note_task]').val().split(','),
            params = {
                'ID': container.find('input[name=note_id]').val(),
                'RELATION[OPPORTUNITY]': id,
                'CONTENT': container.find('textarea[name=note_content]').val(),
                'OPPORTUNITY_STATE': state_current
            };
        params['TASK'] = [];
        for (var index = 0; index < tasks_selected.length; index++) {
            params['TASK'].push(tasks_selected.eq(index).parent().find('span.name').html());
        }

        if (bool && params.CONTENT == '') {
            bool = false;
            alert('记录内容不能为空');
        }
        if (bool) {
            bootstrap.bootstrap_call('note/edit', params, function (_response) {
                //编辑此机会
                console.log(_response);
                var state_container = $('#opportunity_item .panel_right .state ul.list'),
                    date = new Date(),
                    tasks = exports.tasks_completed(),
                    state = _response.OPPORTUNITY_STATE,
                    opportunity_params = {
                        'ID': exports.component_opportunity_getId(),
                        'RELATION[CUSTOMER]': opportunity_cache.RELATION.CUSTOMER.ID,
                        'NAME': opportunity_cache.NAME,
                        'PRICE': opportunity_cache.PRICE,
                        'DATE_DEAL_PREDICT': opportunity_cache.DATE_DEAL_PREDICT,
                        'OWNER': _response.RELATION.OWNER,
                        'REMARK': opportunity_cache.REMARK,
                        'SOURCE': opportunity_cache.SOURCE,
                        'LAST_NOTE_CREATED': opportunity_cache.LAST_NOTE_CREATED,
                        'FILE': opportunity_cache.FILE,
                        'PRODUCT': [],
                        'PERSON': [],
                        'COMPETITOR': [],
                        'TASK': {}
                    };

                opportunity_params.TASK = task_completed;
                if (tasks) {
                    var task_left = tasks.filter(function (item) {
                        if (task_old.indexOf(item) == -1) return item;
                    });
                    if (_response.TASK.length) opportunity_params.TASK[state] = _response.TASK.concat(task_left);
                } else {
                    if (_response.TASK.length) opportunity_params.TASK[state] = _response.TASK;
                }
                for (var index = 0; index < opportunity_cache.PRODUCT.length; index++) {
                    opportunity_params.PRODUCT.push(opportunity_cache.PRODUCT[index].ID);
                }
                for (var index = 0; index < opportunity_cache.PERSON.length; index++) {
                    opportunity_params.PERSON.push(opportunity_cache.PERSON[index].ID);
                }
                for (var index = 0; index < opportunity_cache.COMPETITOR.length; index++) {
                    opportunity_params.COMPETITOR.push(opportunity_cache.COMPETITOR[index].ID);
                }
                console.log(opportunity_params);

                if (container.find('ul.list').length) {
                    if (tasks_selected.length == tasks_all.length) {
                        element.attr('data-completed', true);
                    } else {
                        element.removeAttr('data-completed');
                        opportunity_params.STATE = state;
                        bootstrap.bootstrap_call('opportunity/edit', opportunity_params, function (_response) {
                            task_completed_array = _response.TASK;
                            opportunity_cache = _response;
                        });
                    }
                }
                if (element.attr('data-completed')) {
                    if (confirm('此阶段已经完成，是否推进到下一步？')) {
                        var state_next = state_container.find('li[data-id=' + state + ']~li[data-id]').attr('data-id');
                        opportunity_params.STATE = state_next;
                        bootstrap.bootstrap_call('opportunity/edit', opportunity_params, function (_response) {
                            task_completed_array = _response.TASK;
                            opportunity_cache = _response;
                        });
                    } else {
                        opportunity_params.STATE = state;
                        bootstrap.bootstrap_call('opportunity/edit', opportunity_params, function (_response) {
                            opportunity_cache = _response;
                            task_completed_array = _response.TASK;
                        });
                    }
                }
                exports.process_init();
            });
        }
    };
    exports.note_edit_close = function () {
        var element = arguments[1],
            container = element.closest('li');
        container.find(':visible').remove();
        container.find(':hidden').show();
    };
    exports.note_delete = function () {
        var element = arguments[1],
            data = JSON.parse(element.parent().find('a[data-content]').attr('data-content')),
            container = element.closest('li'),
            task_completed = opportunity_cache.TASK,
            task_old = data.TASK,
            params = {
                'ID': data.ID
            };

        if (confirm('是否删除此条沟通记录？')) {
            bootstrap.bootstrap_call('note/delete', params, function (_response) {
                //编辑此机会
                var state_container = $('#opportunity_item .panel_right .state ul.list'),
                    date = new Date(),
                    tasks = exports.tasks_completed(),
                    state = data.OPPORTUNITY_STATE,
                    opportunity_params = {
                        'ID': exports.component_opportunity_getId(),
                        'RELATION[CUSTOMER]': opportunity_cache.RELATION.CUSTOMER.ID,
                        'NAME': opportunity_cache.NAME,
                        'PRICE': opportunity_cache.PRICE,
                        'DATE_DEAL_PREDICT': opportunity_cache.DATE_DEAL_PREDICT,
                        'OWNER': data.RELATION.OWNER,
                        'REMARK': opportunity_cache.REMARK,
                        'STATE': state,  //确定一下？
                        'SOURCE': opportunity_cache.SOURCE,
                        'FILE': opportunity_cache.FILE,
                        'PRODUCT': [],
                        'PERSON': [],
                        'COMPETITOR': [],
                        'TASK': {}
                    };

                opportunity_params.TASK = task_completed;
                if (tasks) {
                    var task_left = tasks.filter(function (item) {
                        if (task_old.indexOf(item) == -1) return item;
                    });
                    opportunity_params.TASK[state] = task_left;
                }
                var note_element = container.parent('ul.notes').find('li[data-id]');
                if (note_element.length == 1) {
                    opportunity_params['LAST_NOTE_CREATED'] = '0';
                } else {
                    if (note_element.eq(0).attr('data-id') == params.ID) {
                        var dataStr = note_element.eq(1).find('a[data-content]').attr('data-content'),
                            dataObj = JSON.parse(dataStr);
                        opportunity_params['LAST_NOTE_CREATED'] = dataObj.CREATED;
                    } else {
                        opportunity_params['LAST_NOTE_CREATED'] = opportunity_cache.LAST_NOTE_CREATED;
                    }
                }

                for (var index = 0; index < opportunity_cache.PRODUCT.length; index++) {
                    opportunity_params.PRODUCT.push(opportunity_cache.PRODUCT[index].ID);
                }
                for (var index = 0; index < opportunity_cache.PERSON.length; index++) {
                    opportunity_params.PERSON.push(opportunity_cache.PERSON[index].ID);
                }
                for (var index = 0; index < opportunity_cache.COMPETITOR.length; index++) {
                    opportunity_params.COMPETITOR.push(opportunity_cache.COMPETITOR[index].ID);
                }
                console.log(opportunity_params);

                bootstrap.bootstrap_call('opportunity/edit', opportunity_params, function (_response) {
                    task_completed_array = _response.TASK;
                    opportunity_cache = _response;
                });
                container.remove();
                exports.process_init();
            });
        }
    }
});