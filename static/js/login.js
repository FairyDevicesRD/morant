'use strict';

var MORANT = MORANT || {};
$(document).ready(function() {
  //initialize
  $.ajaxSetup({
    headers: {
      'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
    }
  });

  function logout() {
    $.ajax({
      type: 'POST',
      url: MORANT.COMMON.URL.USER.LOGOUT
    }).done(function() {
      set_html_to_login('ログアウトしました<br />');
    }).fail(function(j, t, e) {
      $('#login-box').text('Failed: ' + e);
    });
  }

  function login() {
    $.ajax({
      type: 'POST',
      url: MORANT.COMMON.URL.USER.LOGIN,
      data: {
        id: $('#id').val(),
        password: $('#password').val(),
      },
    }).done(function(data) {
      set_html_to_logout(data);
    }).fail(function(data) {
      var html = 'ログイン失敗<br />';
      html += data.responseText + '<br />';
      set_html_to_login(html);
    });
  }

  function register() {
    $.ajax({
      type: 'POST',
      url: MORANT.COMMON.URL.USER.REGISTER,
      data: {
        id: $('#id').val(),
        ScreenName: $('#ScreenName').val(),
        password: $('#password').val(),
      },
    }).done(function() {
      set_html_to_login('登録完了．ログインしてください');
    }).fail(function(data) {
      var html = '登録エラー: ';
      html += data.responseText + '<br />';
      set_html_to_login(html);
    });
  }


  function set_html_to_login(given_html) {
    var html = given_html;
    html += '<form action="#">';
    html += '<label for="id">ID</label> <input type="text" size="10" id="id" /><br />';
    html += '<label for="password">PW</label> <input type="password" size="10" id="password" /><br />';
    html += '<input type="button" value="ログイン" id="login-button"/><br />';
    html += '<input type="button" value="新規登録" id="goto-reg-button"/><br />';
    html += '</form>';
    $('#login-box').html(html);
    $('#login-button').on('click', login);
    $('#goto-reg-button').on('click', set_html_to_register);
  }

  function set_html_to_register() {
    var html = '<strong>新規登録</strong>';
    html += '<form action="#">';
    html += '<label for="ScreenName">お名前</label> <input type="text" size="10" id="ScreenName" /><br />';
    html += '<label for="id">ID</label> <input type="text" size="10" id="id" /><br />';
    html += '<label for="password">PW</label> <input type="password" size="10" id="password" /><br />';
    html += '<input type="button" value="登録" id="reg-button"/><br />';
    html += '<input type="button" value="戻る" id="goto-login-button"/><br />';
    html += '</form>';
    $('#login-box').html(html);
    $('#reg-button').on('click', register);
    $('#goto-login-button').on('click', function() {
      set_html_to_login('');
    });
  }



  function set_html_to_logout(data) {
    var html = 'こんにちは，' + MORANT.COMMON.escapeHTML(data.ScreenName) + 'さん' + '<br /><br />';
    html += '<form action="#">';
    html += '<input type="button" value="My クエリ アノテーション" id="my-qr-annotations-button"/><br />';
    html += '<input type="button" value="My 形態素 アノテーション" id="my-ma-annotations-button"/>';
    html += '<br />';
    html += '<input type="button" value="ログアウト" id="logout-button"/><br />';
    html += '</form>';
    $('#login-box').html(html);
    $('#my-qr-annotations-button').on('click', function() {
      window.open(MORANT.COMMON.URL.QR_ANNOTATION.SHOW_MINE, '_blank');
      return false;
    });
    $('#my-ma-annotations-button').on('click', function() {
      window.open(MORANT.COMMON.URL.MA_ANNOTATION.SHOW_MINE, '_blank');
      return false;
    });

    $('#logout-button').on('click', logout);
  }



  //first
  $.ajax({
    type: 'POST',
    url: MORANT.COMMON.URL.USER.INFO
  }).done(function(data) {
    if (data.id === null) {
      set_html_to_login('');
    } else {
      set_html_to_logout(data);
    }
  }).fail(function(j, t, e) {
    $('#login-box').text('Failed: ' + e);
  }).always(function() {
    //
  });

});
