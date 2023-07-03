var music_json = '';

function ajax_music() {
    $('#music-list-number').html('0');

    //获取sessionStorage的search-id
    if (sessionStorage.getItem('search-id') == null) {
        return
    }
    const search_id = sessionStorage.getItem('search-id');
    if (search_id.length === 10) {
        $.ajax({
            url: 'https://api.i-meto.com/meting/api?server=tencent&type=playlist',
            data: {
                id: search_id
            },
            type: 'get',
            dataType: 'json',
            success: function (data) {
                console.log(data);
                //存储json
                music_json = data;

                if (data.length == "") {
                    mdui.snackbar({
                        message: '没有音乐',
                        position: 'left-bottom'
                    });
                    return
                }

                for (let i = 0; i < data.length; i++) {
                    var music_json_title = data[i].title;
                    var music_json_author = data[i].author;
                    var music_json_url = data[i].url;
                    var music_json_pic = data[i].pic;
                    var music_json_lrc = data[i].lrc;

                    var music_html = `<li class="mdui-list-item">
                        <div class="mdui-list-item-avatar">
                            <img src="`+ music_json_pic + `" />
                        </div>
                        <div class="mdui-list-item-content">
                            <span>`+ music_json_title + `</span>
                            <div class="mdui-card-header-subtitle">`+ music_json_author + `</div>
                        </div>
                        <a class="mdui-btn mdui-btn-icon mdui-ripple" href="`+ music_json_url + `" target="_blank">
                            <i class="mdui-icon material-icons">file_download</i>
                        </a>
                        </li>`

                    $('#music-list').append(music_html);

                    //添加数量
                    $('#music-list-number').html(i + 1);
                }

            },
            error: function (err) {
                console.log(err);
                mdui.snackbar({
                    message: '未知错误',
                    position: 'left-bottom',
                });
            }
        });
    } else {
        mdui.snackbar({
            message: '请检查链接是否正确',
            position: 'left-bottom',
        });
    }
}

function switch_page(page) {
    $('footer a[href="./#/' + page + '"]').click();
    $('footer a').removeClass('mdui-bottom-nav-active');
    $('footer a[href="./#/' + page + '"]').addClass('mdui-bottom-nav-active');
    window.location.href = './#/' + page;
}

const url_page = location.hash.replace(/^#\//, '');
if (url_page === '') {
    $('.mdui-container section')[0].style.display = 'block';
    $('footer a').eq(0).addClass('mdui-bottom-nav-active');
} else {
    document.getElementById(url_page).style.display = 'block';
    $('footer a').removeClass('mdui-bottom-nav-active');
    $('footer a[href="./#/' + url_page + '"]').addClass('mdui-bottom-nav-active');

    if (url_page === 'music') {
        $('#music-list').html('');
        ajax_music();
    }
}

$(window).on('hashchange', function() {
    var url_hash = window.location.hash;
    var url_page = url_hash.replace(/^#\//, '');
    switch_page(url_page);

    if (url_page === 'music') {
        $('#music-list').html('');
        ajax_music();
    }
  });
  

$('footer a').on('click', function () {
    const a_href = $(this).attr('href');
    const href_page = a_href.substr(a_href.indexOf('#/') + 2);
    $('section').fadeOut(80);
    setTimeout(function () {
        $('#' + href_page).show();
    }, 100);
});

$('.textfield-border-blue').on('keyup', function () {
    let textarea = $('.textfield-border-blue textarea').val();

    if (textarea !== '' && textarea.indexOf('http://') === 0 || textarea.indexOf('https://') === 0) {
        $(this).children('.mdui-textfield-error').css('visibility', 'hidden');
        $('#searchButton').removeAttr('disabled');
    } else {
        $(this).children('.mdui-textfield-error').css('visibility', 'visible');
        if (textarea === '') {
            $('#searchButton').attr('disabled', 'disabled');
            $(this).children('.mdui-textfield-error').html('请输入链接');
            return
        }
        if (textarea.indexOf('http://') === -1 || textarea.indexOf('https://') === -1) {
            $('#searchButton').attr('disabled', 'disabled');
            $(this).children('.mdui-textfield-error').html('请输入正确的链接');
            return
        }
    }
});

$('#searchButton').on('click', function () {
    let textarea = $('.textfield-border-blue textarea').val();
    if (textarea.indexOf('http') === 0) {
        //解析链接id值
        try {
            var url = new URL(textarea);
            var searchParams = new URLSearchParams(url.search);
            var id = searchParams.get("id");
            console.log(id);
        } catch (err) {
            $('.mdui-textfield-error').css('visibility', 'visible');
            $(this).children('.mdui-textfield-error').html('请输入正确的链接');
            return
        }

        if (id == null || id.length !== 10) {
            //解析失败
            $('.mdui-textfield-error').css('visibility', 'visible');
            $('.mdui-textfield-error').html('链接id解析失败，请检查链接是否正确');
            return
        } else if (id.length === 10) {
            //解析成功
            //存储id
            sessionStorage.setItem('search-id', id);
            //跳转页面
            switch_page('music');
        }
    } else {
        mdui.snackbar({
            message: '非法请求',
            position: 'left-bottom',
        });
    }
});

//下载全部
$('#music-download-all').on('click', function () {
    switch_page('download');

    $('#download-200-number').html('0');
    $('#download-err-number').html('0');
    $('#download-show-id').html('');
    $('#download-show-zip-name').html('');
    $('#download-surplus-show').html('0');

    $('#download-progress-show').addClass('mdui-progress-indeterminate');
    $('#download-progress-show').removeAttr('style');

    $('#download-200-list').html('');
    $('#download-err-list').html('');

    //任务id
    $('#download-show-id').html(sessionStorage.getItem('search-id'));

    if (music_json.length == "0") {
        mdui.snackbar({
            message: '没有音乐',
            position: 'left-bottom'
        });
        return
    }

    //下载链接的文件，并打包成.zip
    //创建zip
    var zip = new JSZip();
    var count = 0;
    var all_count = music_json.length;

    var time = new Date();
    var year = time.getFullYear();
    var month = time.getMonth() + 1;
    var day = time.getDate();
    var hour = time.getHours();
    if (hour < 10) {
        hour = '0' + hour;
    }
    var minute = time.getMinutes();
    if (minute < 10) {
        minute = '0' + minute;
    }
    var second = time.getSeconds();
    if (second < 10) {
        second = '0' + second;
    }
    var zipFilename = hour + '' + minute + '' + second + ' ' + year + '-' + month + '-' + day + '.zip';

    $('#download-show-zip-name').html(zipFilename);
    console.log(zipFilename);


    //添加文件
    function addFile(url, i, filename) {
        JSZipUtils.getBinaryContent(url, function (err, music_file) {
            $('#download-progress-show').removeClass('mdui-progress-indeterminate');
            $('#download-progress-show').addClass('mdui-progress-determinate');
            $('#download-progress-show').css('width', ((count + 1) / all_count) * 100 + '%');

            if (err) {
                //处理err
                err = err.toString();
                err = err.substring(0, 5);

                if (err == 'Error') {
                    console.log('URL not found:', url);

                    var download_err_list_html = `<li class="mdui-list-item">
                    <div class="mdui-list-item-avatar">
                        <img src="`+ music_json[i].pic + `" />
                    </div>
                    <div class="mdui-list-item-content">
                        <span>`+ music_json[i].title + `</span>
                        <div class="mdui-card-header-subtitle">`+ music_json[i].author + `</div>
                    </div>
                    <a class="mdui-btn mdui-btn-icon mdui-ripple" href="`+ music_json[i].url + `" target="_blank">
                        <i class="mdui-icon material-icons">file_download</i>
                    </a>
                    </li>`

                    $('#download-err-list').append(download_err_list_html);
                    all_count--;
                    console.log('%c' + '成功数目：' + all_count, 'background-color: green;color: white;');
                    console.log('%c' + '失败数目：' + (music_json.length - all_count), 'background-color: red;color: white;');

                    $('#download-err-number').html(music_json.length - all_count);

                    $('#download-surplus-show').html(all_count);

                    return;
                } else {
                    mdui.snackbar({
                        message: err,
                        position: 'left-bottom'
                    });
                }
            }

            var download_200_list_html = `<li class="mdui-list-item">
            <div class="mdui-list-item-avatar">
                <img src="`+ music_json[i].pic + `" />
            </div>
            <div class="mdui-list-item-content">
                <span>`+ music_json[i].title + `</span>
                <div class="mdui-card-header-subtitle">`+ music_json[i].author + `</div>
            </div>
            <a class="mdui-btn mdui-btn-icon mdui-ripple" href="`+ music_json[i].url + `" target="_blank">
                <i class="mdui-icon material-icons">file_download</i>
            </a>
            </li>`

            $('#download-200-number').html(count + 1);
            $('#download-200-list').append(download_200_list_html);

            zip.file(filename, music_file, {
                binary: true
            });

            count++;
            console.log('正在压缩成zip，还剩下：' + (all_count - count));
            $('#download-surplus-show').html(all_count - count);

            if (all_count - count == 0) {
                console.log('%c' + '任务完毕，正在弹出下载窗口', 'background-color: green;color: white;');
                mdui.snackbar({
                    message: '任务完毕，正在弹出下载窗口',
                    position: 'left-bottom'
                });
            }
            if (count == all_count) {
                //下载zip
                zip.generateAsync({
                    type: "blob"
                }).then(function (content) {
                    saveAs(content, zipFilename);
                });
            }
        });
    }

    for (let i = 0; i < music_json.length; i++) {
        //处理music_json[i].author，将/替换成&
        music_json[i].author = music_json[i].author.replace(/\//g, '&');
        //去除music_json[i].title中的空格
        music_json[i].title = music_json[i].title.replace(/\s+/g, "");

        addFile(music_json[i].url, i, music_json[i].author + ' - ' + music_json[i].title + '.mp3');
    }
});

var inst = new mdui.Tab('#music-list-tab');