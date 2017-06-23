define(function (require, exports, module) {
    var bootstrap = require('application/bootstrap'),
        competitor = require('application/competitor'),
        templet_competitor_item = require('lib/text!application/templet/competitor_item.html'),
        templet_competitor_item_edit = require('lib/text!application/templet/competitor_item_edit.html');

    exports.bootstrap_init = function () {
        exports.init();
    }
    exports.init = function () {
        var id;
        if (arguments.length) {
            if (arguments.length == 2) {
                var element = arguments[1];
                id = element.attr('data-id');
            } else if (arguments.length == 1) {
                id = arguments[0];
            }
        } else {
            id = exports.component_competitor_getId();
        }

        bootstrap.bootstrap_call('competitor/load', { 'ID': id }, function (_response) {
            if (_response == 'COMPETITOR_NOT_EXISTS') {
                alert('竞争对手不存在');
                competitor.init();
                return;
            }
            console.log(_response);
            bootstrap.component_menu_active('competitor');
            bootstrap.bootstrap_initWorkspace();
            bootstrap.bootstrap_initMain(function () {
                bootstrap.bootstrap_push('竞争对手详情', '/competitor/' + id);

                Handlebars.registerHelper("scale", function (id) {
                    return bootstrap.bootstrap_loadLevel(airteams.account.SETTING.COMPETITOR.SCALE, id);
                });
                Handlebars.registerHelper("level", function (id) {
                    return bootstrap.bootstrap_loadLevel(airteams.account.SETTING.COMPETITOR.LEVEL, id);
                });
                Handlebars.registerHelper("people", function (id) {
                    return bootstrap.bootstrap_loadUser(airteams.account.GROUP, id).NAME;
                });
                Handlebars.registerHelper("time", function (stamp) {
                    if (stamp) {
                        var date = bootstrap.bootstrap_timestamp_to_date(stamp),
                            date_year = date.getFullYear(),
                            date_month = bootstrap.bootstrap_time_append_zero(date.getMonth()),
                            date_day = bootstrap.bootstrap_time_append_zero(date.getDate());

                        return date_year + '年' + (parseInt(date_month) + 1) + '月' + date_day + '日';
                    } else {
                        var date = new Date();
                        return date.getFullYear() + '年' + (date.getMonth() + 1) + '月' + date.getDate() + '日';
                    }
                });
                $('#workspace').append(Handlebars.compile(templet_competitor_item)(_response));
            });
        });

    };
    exports.component_competitor_getId = function () {
        var url = window.location.href,
            array = url.split('/'),
            length = array.length,
            id = array[length - 1];
        return id;
    };
    exports.competitor_edit = function () {
        $('#component_window_qr').show();
        var template = Handlebars.compile(templet_competitor_item_edit),
            id = exports.component_competitor_getId();

        bootstrap.bootstrap_call('competitor/load', { 'ID': id }, function (_response) {
            bootstrap.bootstrap_initPopup();
            $('#workspace').append(template(_response));
            var container = $('#component_popup');
            container.show();

            var scale_value = container.find('li[data-mark=scale] div.selector_title').attr('data-value'),
                level_value = container.find('li[data-mark=level] div.selector_title').attr('data-value');

            for (var index in airteams.account.SETTING.COMPETITOR.SCALE) {
                container.find('li[data-mark=scale] ul.selector_list').append('<li data-value="' + index + '">' + airteams.account.SETTING.COMPETITOR.SCALE[index] + '</li>');
            }
            for (var index in airteams.account.SETTING.COMPETITOR.LEVEL) {
                container.find('li[data-mark=level] ul.selector_list').append('<li data-value="' + index + '">' + airteams.account.SETTING.COMPETITOR.LEVEL[index] + '</li>');
            }
            container.find('li[data-mark=scale] ul.selector_list').find('li[data-value=' + scale_value + ']').addClass('selected');
            container.find('li[data-mark=level] ul.selector_list').find('li[data-value=' + level_value + ']').addClass('selected');
            bootstrap.component_selector_bind();
        });
    };
    exports.competitor_edit_submit = function () {
        var container = $('#component_popup'),
            params = {
                'ID': exports.component_competitor_getId(),
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
            bootstrap.bootstrap_call('competitor/edit',params,function(_response){
                bootstrap.component_popup_close();
                exports.init();
            });
        }
    };
    exports.competitor_delete = function () {
        var id = exports.component_competitor_getId;
        if (confirm('是否删除？')) {
            bootstrap.bootstrap_call('competitor/delete', { 'ID': id }, function (_response) {
                competitor.init();
            });
        }
    };
});