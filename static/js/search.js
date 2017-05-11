'use strict';

var MORANT = MORANT || {};
$(document).ready(function() {

  {
    $('input').on('keydown', function(e) {
      if ((e.which && e.which === 13) || (e.keyCode && e.keyCode === 13)) {
        return false;
      } else {
        return true;
      }
    });

    $(window).on('beforeunload', function() {
      if (getSubmitData().length != 0) {
        return '未送信データがありますが，移動しますか?';
      }
    });

    $(window).on('keydown', function(event) {
      var keyname = String.fromCharCode(event.which).toLowerCase();
      switch (keyname) {
        case 's':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            submit_annotation(event);
          }
          break;
        case 'e':
          var sels = w2ui.mygrid.getSelection();
          if (sels.length >= 1) {
            var recid = sels[0];
            MORANT.COMMON.FUNC.ma_annotation_popup(recid, w2ui.mygrid.get(recid).Text);
          }
          break;

        case 'm':
          var sels2 = w2ui.mygrid.getSelection();
          if (sels2.length >= 1) {
            event.preventDefault();
            var recid2 = sels2[0];
            var text = w2ui.mygrid.get(recid2).Text;
            window.open(MORANT.COMMON.URL.REDIRECT.MA + '/' + text);
          }
          break;

        case '%': //left arrow
        case 'j': //next match seg surf
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            setNextSegSurf(-1);
            updateSearch();
          }
          setFirstSelection();
          break;

        case '\'': //right arrow
        case 'k':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            setNextSegSurf(1);
            updateSearch();
          }
          setFirstSelection();
          break;

        default:
          if (event.ctrlKey || event.metaKey) {
            modify_selection(event, keyname);
          }
          break;
      }
    });
  }

  function setFirstSelection() {
    if (w2ui.mygrid.last.searchIds.length != 0) {
      w2ui.mygrid.selectNone();
      w2ui.mygrid.select(w2ui.mygrid.records[w2ui.mygrid.last.searchIds[0]].recid);
    }
  }

  function modify_selection(event, keyname) {
    var v = parseInt(keyname);
    if (isNaN(v)) {
      return false;
    } else if (v < 0 || v >= MORANT.COMMON.annotation_types.list.length) {
      return false;
    } else if (w2ui.mygrid === undefined) {
      return false;
    }

    var sels = w2ui.mygrid.getSelection();
    if (sels.length == 0) {
      return false;
    }

    event.preventDefault();
    w2ui.mygrid.editField(sels[0], 5, MORANT.COMMON.annotation_types.list[v].id); //FIXME change all cells
  }

  function get_toolbar_radio_button(id, label, all_count) {
    return {
      type: 'menu-radio',
      id: 'FilterOf' + id,
      text: function(item) {
        var el = this.get('FilterOf' + id + ':' + item.selected);
        if (el === null) {
          return label + ': ';
        }
        return label + ': ' + el.text;
      },
      selected: 'all',
      items: [{
        id: 'all',
        text: 'All',
        count: all_count,
      },],
      onRefresh: function(e) {
        e.onComplete = function(e) {
          if (w2ui.mygrid !== undefined) {
            if (e.item.selected != e.item.oldSelected) { //only updated
              e.item.oldSelected = e.item.selected;
              updateSearch();
            }
          }
        };
      }
    };
  }

  function updateSearch() {
    var reset = true;
    var targets = ['MatchSegmentSurf', 'MatchSegmentPos'];
    var searchers = [];
    for (var i = 0, len = targets.length; i < len; i++) {
      var es = w2ui.mygrid.toolbar.get('FilterOf' + targets[i]).selected;
      if (es != 'all') {
        reset = false;
        searchers.push({
          field: targets[i],
          value: es,
          operator: 'is'
        });
      }
    }

    if (reset) {
      w2ui.mygrid.searchReset();
    } else {
      w2ui.mygrid.search(searchers, 'AND');
    }
  }

  function setNextSegSurf(delta) {
    var items = w2ui.mygrid.toolbar.get('FilterOfMatchSegmentSurf').items;
    var len = items.length;
    var j = 0;
    var not_found = true;
    for (var i = 0; i < len; i++) {
      if ('checked' in items[i] && items[i].checked) {
        j = Math.max(0, Math.min(i + delta, len - 1));
        not_found = false;
        break;
      }
    }
    if (not_found) {
      j = Math.max(0, Math.min(delta, len - 1));
    }

    for (var k = 0; k < len; k++) {
      items[k].checked = (k == j);
    }
    var next = items[j].text;
    if (j == 0) {
      next = 'all';
    }
    w2ui.mygrid.toolbar.get('FilterOfMatchSegmentSurf').selected = next;
    w2ui.mygrid.toolbar.get('FilterOfMatchSegmentSurf').oldSelected = next;
  }

  function set_toolbar_radio_button(id, key, data) {
    w2ui.mygrid.toolbar.get(id).items[0].count = data.length;

    var d1 = {};
    for (var i = 0, len = data.length; i < len; i++) {
      var val = data[i][key];
      if (val in d1) {
        d1[val]++;
      } else {
        d1[val] = 1;
      }
    }

    var d2 = [];
    for (var k in d1) {
      d2.push({
        k: k,
        c: d1[k]
      });
    }
    d2.sort(function(a, b) {
      if (a.k < b.k) return -1;
      if (a.k > b.k) return 1;
      return 0;
    });


    //reset 
    w2ui.mygrid.toolbar.get(id).items = w2ui.mygrid.toolbar.get(id).items.slice(0, 1);
    w2ui.mygrid.toolbar.get(id).selected = 'all';
    for (var j = 0, len2 = d2.length; j < len2; j++) {
      w2ui.mygrid.toolbar.get(id).items.push({
        text: d2[j].k,
        count: d2[j].c,
      });
    }
  }

  function getSubmitData() {
    var query = $('#query').val();
    var submitData = [];

    var cdata = w2ui.mygrid.getChanges();
    for (var i = 0, len = cdata.length; i < len; i++) {
      var d = cdata[i];
      var od = w2ui.mygrid.get(d.recid);
      if (d.AnnotationType !== undefined || d.AnnotationComment !== undefined) {
        submitData.push({
          Query: query,
          Docid: d.recid,
          Type: (d.AnnotationType == undefined) ? od.AnnotationType.id : d.AnnotationType.id,
          Comment: (d.AnnotationComment == undefined) ? od.AnnotationComment : d.AnnotationComment,
          MatchSegmentSurf: od.MatchSegmentSurf,
          MatchSegmentPos: od.MatchSegmentPos,
        });
      }
    }
    return submitData;
  }

  function submit_annotation() {
    var submitData = getSubmitData();
    if (submitData.length == 0) {
      //            $("#annotation-info").html("エラー: 送信するデータがありませんdatacss('color', 'red');
      return;
    }
    $('#annotation-info').html('送信処理中...').css('color', '');

    $.ajax({
      type: 'POST',
      url: MORANT.COMMON.URL.QR_ANNOTATION.REG,
      dataType: 'json',
      contentType: 'application/json',
      data: JSON.stringify(submitData),
    }).done(function() {
      w2ui.mygrid.save();
      var msg = '送信完了 (' + submitData.length + '件)';
      $('#annotation-info').html(msg).css('color', '');
      $('#annotation-info').delay(2000).queue(function() {
        $(this).html('');
      });
    }).fail(function(data) {
      if (data.status === 401) {
        $('#annotation-info').html('アノテーションするにはログインしてください');
      } else {
        $('#annotation-info').html('エラー: ' + data.responseText);
      }
    });
  }

  function toggleMA() {
    var visible = $('[class^=toggle-item]').is(':visible');
    if (visible) {
      w2ui.mygrid.recordHeight = 30;
    } else {
      w2ui.mygrid.recordHeight = 70;
    }
    w2ui.mygrid.refresh();
    if (visible) {
      $('[class^=toggle-item]').hide();
    } else {
      $('[class^=toggle-item]').show();
    }
  }

  function initialize_table() {
    // See  http://w2ui.com/web/docs/1.5/grid
    $('#grid').w2grid({
      name: 'mygrid',
      show: {
        toolbar: true,
        toolbarInput: false,
        footer: true
      },
      recordHeight: 30,
      recid: 'Docid',
      multiSearch: true,
      searches: [{
        caption: 'テキスト',
        field: 'Text',
        operator: 'contains',
        type: 'text',
      },
        {
          caption: 'マッチ表層',
          field: 'MatchSegmentSurf',
          operator: 'contains',
          type: 'text',
        },
        {
          caption: 'マッチ品詞',
          field: 'MatchSegmentPos',
          operator: 'contains',
          type: 'text',
        },
      ],
      columns: [{
        caption: 'ID',
        field: 'Docid',
        size: '5em',
        sortable: true,
      },
        {
          caption: '記事',
          field: 'Curid',
          render: function(record) {
            return '<a href="https://ja.wikipedia.org/w/index.php?curid=' + record.Curid + '" target="_blank" rel="noopener noreferrer" style="text-decoration: none;">' + record.Curid + '</a>';
          },
          size: '8em',
          sortable: true,
        },
        {
          caption: 'テキスト',
          field: 'Text',
          render: function(record) {
            var query = $('#query').val();
            var left = record.Text.slice(0, record.Positions[record.MatchStart]);
            var right = record.Text.slice(record.Positions[record.MatchEnd]);
            var middle = record.Text.slice(record.Positions[record.MatchStart], record.Positions[record.MatchEnd]);
            middle = middle.replace(query, '<span style=\'font-weight:bold;\'>' + query + '</span>');

            var ret = left + '<span style="text-decoration:underline;">' + middle + '</span>' + right;
            ret += '<div style="font-size:80%; display:none; white-space:normal;" class="toggle-item-malink' + '"><br />' + record.MaWords + '</div>';
            return ret;
          },
          size: '80%',
          sortable: true,
          editable: {
            type: 'text'
          },
        },
        {
          caption: 'マッチ表層',
          field: 'MatchSegmentSurf',
          size: '10em',
          sortable: true,
          editable: {
            type: 'text'
          },
        },
        {
          caption: 'マッチ品詞',
          field: 'MatchSegmentPos',
          size: '10em',
          sortable: true,
          editable: {
            type: 'text'
          },
        },
        {
          field: 'AnnotationType',
          caption: 'Type',
          size: '5em',
          sortable: true,
          resizable: true,
          editable: {
            type: 'list',
            items: MORANT.COMMON.annotation_types.list,
            showAll: true
          },
          render: function(record, index, col_index) {
            var html = this.getCellValue(index, col_index);
            return html || '';
          }
        },
        {
          caption: 'CMT',
          field: 'AnnotationComment',
          size: '10em',
          sortable: true,
          editable: {
            type: 'text'
          },
        },
      ],

      toolbar: {
        items: [{
          type: 'break'
        },
          {
            type: 'button',
            id: 'toggleMA',
            caption: 'toggleMA',
            onClick: toggleMA,
          },

          {
            type: 'break'
          },
          get_toolbar_radio_button('MatchSegmentSurf', 'マッチ表層', 0),
          {
            type: 'break'
          },
          get_toolbar_radio_button('MatchSegmentPos', 'マッチ品詞', 0),
          {
            type: 'break'
          },
          {
            type: 'button',
            id: 'AnnotationSubmit',
            caption: 'submit',
            onClick: submit_annotation,
          },
          {
            type: 'break'
          },
          {
            type: 'html',
            html: function() {
              var html = '<span id="annotation-info" onclick="alert($(this).text())"></span>';
              return html;
            }
          },
        ],

      },

      menu: [
        {
          id: 1,
          text: 'アノテーションを編集',
        },
        {
          id: 2,
          text: '形態素解析器比較',
        },
      ],
      onMenuClick: function(event) {
        if (event.type == 'menuClick') {
          switch (event.menuIndex) {
            case 0:
              MORANT.COMMON.FUNC.ma_annotation_popup(event.recid, w2ui.mygrid.get(event.recid).Text);
              break;
            default:
              var text = w2ui.mygrid.get(event.recid).Text;
              window.open(MORANT.COMMON.URL.REDIRECT.MA + '/' + text);

              break;
          }
        }
      }
    });
  }

  function _add_annotation_data(data, query, docid2type, docid2comment) {
    for (var i = 0, len = data.length; i < len; i++) {
      var d = data[i];
      d.MatchSegmentSurf = d.Words.slice(d.MatchStart, d.MatchEnd).join('--');
      d.MatchSegmentPos = d.Poss.slice(d.MatchStart, d.MatchEnd).join('--');
      if (d.Docid in docid2type) {
        d.AnnotationType = MORANT.COMMON.annotation_types.id2obj[docid2type[d.Docid]];
        d.AnnotationComment = docid2comment[d.Docid];
      } else {
        d.AnnotationType = MORANT.COMMON.annotation_types.id2obj[0];
        d.AnnotationComment = '';
      }
    }
  }

  function trim_annotation_data(data, query, callback) {
    $.ajax({
      type: 'POST',
      url: MORANT.COMMON.URL.QR_ANNOTATION.SHOW_MINE + '/' + query + '.json',
    }).done(function(adata) {
      var docid2type = {};
      var docid2comment = {};
      for (var i = 0, len = adata.length; i < len; i++) {
        var d = adata[i];
        docid2type[d.Docid] = d.Type;
        docid2comment[d.Docid] = d.Comment;
      }
      _add_annotation_data(data, query, docid2type, docid2comment);
    }).fail(function(adata) {
      if (adata.status === 401) {
        $('#annotation-info').html('アノテーションするにはログインしてください').css('color', 'red');
      } else {
        $('#annotation-info').html('エラー: ' + data.responseText).css('color', 'red');
      }
      _add_annotation_data(data, query, {}, {});
    }).always(function() {
      if (callback) {
        callback(data);
      }
    });
  }

  function set_table(data) {
    w2ui.mygrid.clear();
    w2ui.mygrid.add(data);
    w2ui.mygrid.sort('MatchSegmentSurf', 'asc');
    set_toolbar_radio_button('FilterOfMatchSegmentSurf', 'MatchSegmentSurf', data);
    set_toolbar_radio_button('FilterOfMatchSegmentPos', 'MatchSegmentPos', data);
    w2ui.mygrid.searchReset();
  }

  function search_texts(query) {
    $('#resultView').html('loading...');
    query = query.replace(/\//g, '／');

    var deferred = new $.Deferred();
    var startTime = new Date().getTime();
    $.ajax({
      type: 'GET',
      url: '/api/v1/search/' + query
    }).done(function(data) {
      if (query != $('#query').val().replace(/\//g, '／')) {
        return;
      }
      var totalTime = (new Date().getTime() - startTime) / 1000.0;
      var msg = '"' + MORANT.COMMON.escapeHTML(query) + '" (' + data.length + '件, ' + totalTime + '秒)';

      $('#resultView').html(msg);
      trim_annotation_data(data, query, set_table);
    }).fail(function(j, t, e) {
      $('#resultView').text('Failed: ' + e);
    }).always(function() {
      history.replaceState(null, null, '/' + query);
      document.title = 'morant: ' + MORANT.COMMON.escapeHTML(query);
      deferred.resolve();
    });

    return deferred;
  }

  var old_query = '';
  $('#query').keyup(function() {
    var query = $('#query').val();
    if (old_query == query) {
      return;
    }
    setTimeout(function() {
      if (query != $('#query').val()) {
        return;
      }
      old_query = query;
      var deferred = search_texts(query);
      deferred.done(function() {
        //
      });
    }, 100); //prevent needless access
  });

  {
    var query = $('#query').val();
    if (query.length != 0) {
      search_texts(query);
    }
  }
  initialize_table();

});
