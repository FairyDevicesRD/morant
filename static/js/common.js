'use strict';

var MORANT = MORANT || {};
MORANT.COMMON = {};

MORANT.COMMON.annotation_types = {};
MORANT.COMMON.annotation_types.list = [
  {
    id: 0,
    text: '  '
  },
  {
    id: 1,
    text: 'OK'
  },
  {
    id: 2,
    text: 'NG_SEG'
  },
  {
    id: 6,
    text: 'NG_POS'
  },
  {
    id: 3,
    text: 'Bug'
  },
  {
    id: 4,
    text: 'Compound'
  },
  {
    id: 5,
    text: 'Subtle'
  },
];
MORANT.COMMON.annotation_types.id2obj = {};
for (var i = 0, len = MORANT.COMMON.annotation_types.list.length; i < len; i++) {
  var d = MORANT.COMMON.annotation_types.list[i];
  MORANT.COMMON.annotation_types.id2obj[d.id] = d;
}


MORANT.COMMON.escapeHTML = function(val) {
  return $('<div>').text(val).html();
};


MORANT.COMMON.URL = {};


MORANT.COMMON.URL.USER = {};
MORANT.COMMON.URL.USER.LOGIN = '/user/login';
MORANT.COMMON.URL.USER.LOGOUT = '/user/logout';
MORANT.COMMON.URL.USER.REGISTER = '/user/register';
MORANT.COMMON.URL.USER.INFO = '/user/information';

MORANT.COMMON.URL.API = {};
MORANT.COMMON.URL.API.TEXT = '/api/v1/text';

MORANT.COMMON.URL.QR_ANNOTATION = {};
MORANT.COMMON.URL.QR_ANNOTATION.REG = '/annotation/qr/register';
MORANT.COMMON.URL.QR_ANNOTATION.SHOW_MINE = '/annotation/qr/show/mine';

MORANT.COMMON.URL.MA_ANNOTATION = {};
MORANT.COMMON.URL.MA_ANNOTATION.REG = '/annotation/ma/register';
MORANT.COMMON.URL.MA_ANNOTATION.SHOW_MINE = '/annotation/ma/show/mine';

MORANT.COMMON.URL.REDIRECT = {};
MORANT.COMMON.URL.REDIRECT.MA = '/redirect/ma';
MORANT.COMMON.FUNC = {};

MORANT.COMMON.FUNC.ma_form_set = function(docid, org_text, data) {
  if (!w2ui.ma_form) {
    $().w2form({
      name: 'ma_form',
      formHTML: '<div class="w2ui-page page-0">' +
        '   <textarea id="annotation" name="annotation" type="text" rows="6" wrap="soft" style="width: 100%; font-size:initial;" onkeypress="if(event.keyCode==13){return false;}" />' +
        '   <input id="docid" name="docid" type="hidden" />' +
        '<br /><span id="ma-annotation-info"></span><br />' +
        '確実な形態素境界には「|」を，微妙な境界には「?」を挿入してください．<br />' +
        '「|」も「?」も挿入されていない文字の間（最初の「|」と最後の「|」の間にあるものに限ります）は形態素境界では確実に無いものとみなされます．' +
        '</div>' +
        '<div class="w2ui-buttons">' +
        '    <button class="w2ui-btn" name="save">登録</button>' +
        '    <button class="w2ui-btn" name="delete">削除</button>' +
        '    <button class="w2ui-btn" name="macomp">MA比較</button>' +
        '</div>',
      fields: [
        {
          field: 'annotation',
          type: 'text',
        },
        {
          field: 'docid',
        },
      ],
      actions: {
        'save': function() {
          if ((!/[\|\?][\|\?]/.test(this.record.annotation)) &&
            this.record.annotation.replace(/\|/g, '').replace(/\?/g, '') == w2ui.ma_form.org_text) {
            $.ajax({
              type: 'POST',
              url: MORANT.COMMON.URL.MA_ANNOTATION.REG,
              data: this.record,
            }).done(function() {
              var msg = '送信完了';
              $('#ma-annotation-info').html(msg).css('color', '');
              $('#ma-annotation-info').delay(2000).queue(function() {
                $(this).html('');
              });
            }).fail(function(data) {
              alert('エラー: ' + data.status + ' ' + data.responseText);
            });
          } else {
            $('#ma-annotation-info').html('アノテーションが不正です').css('color', 'red');
            $('#ma-annotation-info').delay(2000).queue(function() {
              $(this).html('');
            });
          }
        },
        'delete': function() {
          if (window.confirm('アノテーション情報を削除しますか?')) {
            $.ajax({
              type: 'POST',
              url: MORANT.COMMON.URL.MA_ANNOTATION.REG,
              data: {
                'annotation': '',
                docid: this.record.docid
              },
            }).done(function() {
              $('#ma-annotation-info').html('削除しました').css('color', '');
              $('#ma-annotation-info').delay(2000).queue(function() {
                $(this).html('');
              });
              w2ui.ma_form.record.annotation = w2ui.ma_form.org_text;
              w2ui.ma_form.refresh();
            }).fail(function(data) {
              alert('エラー: ' + data.status + ' ' + data.responseText);
            });
          }
        },
        'macomp': function() {
          window.open(MORANT.COMMON.URL.REDIRECT.MA + '/' + encodeURIComponent(this.record.annotation));
        }
      },
    });
  }

  w2ui.ma_form.record['docid'] = docid;
  w2ui.ma_form.org_text = org_text;
  if (data.length == 0) {
    w2ui.ma_form.record['annotation'] = org_text;
  } else {
    w2ui.ma_form.record['annotation'] = data[0].Annotation;
  }
};

MORANT.COMMON.FUNC._ma_annotation_popup_main = function(docid, org_text) {
  var body = '';
  $.ajax({
    type: 'POST',
    url: MORANT.COMMON.URL.MA_ANNOTATION.SHOW_MINE + '/' + docid + '.json',
  }).done(function() {
    body = '<div id="maform" style="width: 100%; height: 100%;"></div>';
  }).fail(function(data) {
    body = 'failed: ' + MORANT.COMMON.escapeHTML(data.responseText);
    body += '<br />' + MORANT.COMMON.escapeHTML(org_text);
  }).always(function(data) {
    $().w2popup({
      title: 'アノテーション登録 (' + docid + ')',
      body: body,
      width: 800,
      onOpen: function(event) {
        event.onComplete = function() {
          MORANT.COMMON.FUNC.ma_form_set(docid, org_text, data);
          $('#w2ui-popup #maform').w2render('ma_form');
        };
      },
    //        onClose: function(data) {
    //          console.log(data);
    //        },
    });
  });
};

MORANT.COMMON.FUNC.ma_annotation_popup = function(docid, org_text) {
  if (org_text === undefined) {
    $.ajax({
      type: 'POST',
      url: MORANT.COMMON.URL.API.TEXT + '/' + docid,
    }).done(function(data) {
      org_text = data.Text;
      MORANT.COMMON.FUNC._ma_annotation_popup_main(docid, org_text);
    }).fail(function(data, status) {
      console.log('エラー: テキストの取得に失敗' + status);
      return;
    });
  } else {
    MORANT.COMMON.FUNC._ma_annotation_popup_main(docid, org_text);
  }
};
