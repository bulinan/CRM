define(function (require, exports, module) {
    var bootstrap = require('application/bootstrap'),
        templet_file = require('lib/text!application/templet/file.html'),
        templet_file_list = require('lib/text!application/templet/file_list.html'),
        templet_file_new = require('lib/text!application/templet/file_new.html'),
        templet_collection_item = require('lib/text!application/templet/collection_item.html');

    exports.bootstrap_init = function () {
        exports.init();
    }
    exports.init = function () {
        bootstrap.component_menu_active('file');
        bootstrap.bootstrap_initWorkspace();
        bootstrap.bootstrap_showLoading();
        bootstrap.bootstrap_initMain(function () {
            bootstrap.bootstrap_push('文件管理', '/file');
            $('#workspace').html(templet_file);

            bootstrap.bootstrap_call('collection/load', {}, function (_response) {
                console.log(_response);
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
                    $('#file table tbody').html(Handlebars.compile(templet_file_list)(_response.COLLECTION));
                }
                bootstrap.bootstrap_call('file/list', { 'QUERY[COLLECTION]': _response.ID }, function (response) {
                    if (response.RESULT.length) {
                        for (var index in response.RESULT) {
                            response.RESULT[index].DATA_MARK = 'FILE';
                        }
                        $('#file table tbody').append(Handlebars.compile(templet_file_list)(response.RESULT));
                    }

                    if (!_response.COLLECTION && !response.RESULT.length) $('#file table tbody').append('<tr class="empty"><td colspan="5">当前目录下没有文件夹和文件</td></tr>');

                });
            });
            $('#file table tbody').delegate('tr', 'mouseover', function () {
                if ($(this).attr('data-lock') == 0 || !$(this).attr('data-lock')) $(this).find('td:last a').show();
            }).delegate('tr', 'mouseout', function () {
                $(this).find('td:last a').hide();
            });
        });
    };
    exports.file_new = function () {
        var container = $('#file table tbody'),
            model = arguments[1].attr('data-model');

        if (container.find('tr.empty').length) container.find('tr.empty').remove();
        container.find('tr[data-mark=file_new]').remove();
        container.prepend(templet_file_new);
        container.find('.button-group button:first').attr('data-method', model + '.file_new_submit');
    };
    exports.file_new_submit = function () {
        var element = arguments[1],
            file_name = element.closest('td').find('input[name=file_name]').val();

        bootstrap.bootstrap_call('collection/load', {}, function (_response) {
            bootstrap.bootstrap_call('collection/new', { 'RELATION[COLLECTION]': _response.ID, 'NAME': file_name }, function (_response) {
                console.log(_response);
                element.closest('tr').remove();
                $('#file table tbody').prepend(Handlebars.compile(templet_collection_item)(_response));
            });
        });
    };
    exports.file_delete = function () {
        var element = arguments[1];
        if (confirm('确定删除此文件吗')) {
            bootstrap.bootstrap_call('file/delete', { 'ID': element.closest('tr').attr('data-id') }, function (_response) {
                console.log(_response);
                if (element.closest('tbody').find('tr').length == 1) element.closest('tbody').append('<tr class="empty"><td colspan="5">当前目录下没有文件夹和文件</td></tr>');
                element.closest('tr').remove();
            });
        }
    };
    exports.collection_delete = function () {
        var element = arguments[1];
        if (confirm('确定删除文件夹吗')) {
            bootstrap.bootstrap_call('collection/remove', { 'ID': element.closest('tr').attr('data-id') }, function (_response) {
                console.log(_response);
                if (element.closest('tbody').find('tr').length == 1) element.closest('tbody').append('<tr class="empty"><td colspan="5">当前目录下没有文件夹和文件</td></tr>');
                element.closest('tr').remove();
            });
        }
    }
});