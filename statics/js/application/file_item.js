define(function (require, exports, module) {
    var bootstrap = require('application/bootstrap'),
        file = require('application/file'),
        templet_file = require('lib/text!application/templet/file.html'),
        templet_file_new = require('lib/text!application/templet/file_new.html'),
        templet_file_list = require('lib/text!application/templet/file_list.html'),
        templet_collection_item = require('lib/text!application/templet/collection_item.html'),
        templet_file_item_list = require('lib/text!application/templet/file_item_list.html');

    exports.bootstrap_init = function () {
        exports.init();
    }
    exports.init = function () {
        var file_id;
        if (arguments.length) {
            var element = arguments[1];

            if (element.hasClass('load')) file_id = element.closest('tr').attr('data-id');
            else file_id = element.attr('data-id');

        } else {
            file_id = exports.component_file_getId();
        }

        bootstrap.bootstrap_call('collection/load', { 'ID': file_id }, function (_response) {
            if (_response == 'COLLECTION_NOT_EXISTS') {
                alert('文件夹不存在');
                file.init();
                return;
            }
            bootstrap.component_menu_active('file');
            bootstrap.bootstrap_initWorkspace();
            bootstrap.bootstrap_showLoading();

            bootstrap.bootstrap_initMain(function () {
                bootstrap.bootstrap_push('文件管理', '/file/' + file_id);
                $('#workspace').html(templet_file_item_list);

                bootstrap.bootstrap_call('collection/location', { 'ID': file_id }, function (_response) {
                    for (var index = 1; index < _response.length - 1; index++) {
                        $('#file_item .title span.collection_current').before(' &gt; <a href="javascript:;" data-id="' + _response[index].ID + '" data-method="file_item.init">' + _response[index].NAME + '</a>');
                    }
                });

                $('#file_item .title span.collection_current').attr('data-id', file_id).html(' &gt; ' + _response.NAME);
                Handlebars.registerHelper("file_class", function (type, options) {
                    if (type == 'FOLDER') return options.fn(this);
                    else return options.inverse(this);
                });
                Handlebars.registerHelper("file_type", function (name) {
                    var array = name.split('.'),
                        length = array.length;
                    return array[length - 1];
                });
                Handlebars.registerHelper("creator", function (id) {
                    if (!id) return '系统';
                    else return bootstrap.bootstrap_loadUser(airteams.account.GROUP, id).NAME;
                });
                Handlebars.registerHelper("create_time", function (_data) {
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
                });
                Handlebars.registerHelper("size", function (number) {
                    if (number < 1048576) {
                        return Math.round(number / 1024) + 'kB';
                    } else {
                        return Math.round(number / (1024 * 1024)) + 'mB';
                    }
                });
                Handlebars.registerHelper("lock", function (data) {
                    if (data) return 1;
                    else return 0;
                });
                if (_response.COLLECTION) {
                    for (var index in _response.COLLECTION) {
                        _response.COLLECTION[index].DATA_MARK = 'FOLDER';
                    }
                    $('#file_item table tbody').html(Handlebars.compile(templet_file_list)(_response.COLLECTION));
                }
                bootstrap.bootstrap_call('file/list', { 'QUERY[COLLECTION]': file_id }, function (response) {
                    console.log(response);
                    if (response.RESULT.length) {
                        for (var index in response.RESULT) {
                            response.RESULT[index].DATA_MARK = 'FILE';
                        }
                        $('#file_item table tbody').append(Handlebars.compile(templet_file_list)(response.RESULT));
                    }
                    if (!_response.COLLECTION && !response.RESULT.length) $('#file_item table tbody').html('<tr class="empty"><td colspan="5">当前目录下没有文件夹和文件</td></tr>');
                });
                $('#file_item table tbody').delegate('tr', 'mouseover', function () {
                    if ($(this).attr('data-lock') == 0 || !$(this).attr('data-lock')) $(this).find('td:last a').show();
                }).delegate('tr', 'mouseout', function () {
                    $(this).find('td:last a').hide();
                });
            });
        });
    };
    exports.component_file_getId = function () {
        var url = window.location.href,
            array = url.split('/'),
            length = array.length,
            id = array[length - 1];
        return id;
    };
    exports.file_new = function () {
        var container = $('#file_item table tbody'),
            model = arguments[1].attr('data-model');

        if (container.find('tr.empty').length) container.find('tr.empty').remove();
        container.find('tr[data-mark=file_new]').remove();
        container.prepend(templet_file_new);
        container.find('.button-group button:first').attr('data-method', model + '.file_new_submit');
    };
    exports.file_new_submit = function () {
        var element = arguments[1],
            file_name = element.closest('td').find('input[name=file_name]').val();

        bootstrap.bootstrap_call('collection/new', { 'RELATION[COLLECTION]': exports.component_file_getId(), 'NAME': file_name }, function (_response) {
            console.log(_response);
            element.closest('tr').remove();
            Handlebars.registerHelper("size", function (number) {
                if (number < 1048576) {
                    return Math.round(number / 1024) + 'kB';
                } else {
                    return Math.round(number / (1024 * 1024)) + 'mB';
                }
            });
            $('#file_item table tbody').prepend(Handlebars.compile(templet_collection_item)(_response));
        });
    };
});