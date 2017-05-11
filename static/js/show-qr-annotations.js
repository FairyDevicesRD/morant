'use strict';

var MORANT = MORANT || {};
$(document).ready(function() {
  //initialize
  $.ajaxSetup({
    headers: {
      'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
    }
  });

  $('input').on('keydown', function(e) {
    if ((e.which && e.which === 13) || (e.keyCode && e.keyCode === 13)) {
      return false;
    } else {
      return true;
    }
  });

  function do_query(query) {
    $.ajax({
      type: 'POST',
      url: MORANT.COMMON.URL.QR_ANNOTATION.SHOW_MINE + '/' + query + '.json',
    }).done(function(data) {
      set_table(data);
    }).fail(function(data) {
      $('#resultView').html(data.responseText).css('color', 'red');
    });
  }


  function initialize_table() {
    // See  http://w2ui.com/web/docs/1.5/grid
    $('#grid').w2grid({
      name: 'mygrid',
      recordHeight: 30,
      recid: 'ID',
      multiSearch: true,
      columns: [{
        caption: 'ID',
        field: 'ID',
        size: '1em',
        sortable: true,
      },
        {
          caption: 'クエリ',
          field: 'Query',
          size: '4em',
          sortable: true,
          render: function(record) {
            return '<a href="/' + record.Query + '" target="_blank" rel="noopener noreferrer" style="text-decoration: none;">' + record.Query + '</a>';
          },
        },
        {
          caption: 'TextID',
          field: 'Docid',
          size: '2em',
          sortable: true,
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
          field: 'Type',
          caption: 'タイプ',
          size: '3em',
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
          caption: 'コメント',
          field: 'Comment',
          size: '10em',
          sortable: true,
          editable: {
            type: 'text'
          },
        },
        {
          caption: 'Created',
          field: 'CreatedAt',
          size: '4em',
          sortable: true,
        },
        {
          caption: 'Updated',
          field: 'UpdatedAt',
          size: '4em',
          sortable: true,
        },
      ],

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
          var docid = w2ui.mygrid.get(event.recid).Docid;
          if (event.menuIndex == 0) {
            MORANT.COMMON.FUNC.ma_annotation_popup(docid);
          } else if (event.menuIndex == 1) {
            $.ajax({
              type: 'POST',
              url: MORANT.COMMON.URL.API.TEXT + '/' + docid,
            }).done(function(data) {
              window.open(MORANT.COMMON.URL.REDIRECT.MA + '/' + data.Text);
            }).fail(function(data) {
              alert('Error: ' + data.responseText);
            });
          }
        }
      },
    });
  }


  function set_table(data) {

    //Modify
    for (var i = 0, len = data.length; i < len; i++) {
      data[i].Type = MORANT.COMMON.annotation_types.id2obj[data[i].Type];
    }

    w2ui.mygrid.clear();
    w2ui.mygrid.add(data);
    w2ui.mygrid.sort('CreatedAt', 'asc');
    w2ui.mygrid.searchReset();
  }



  initialize_table();
  do_query('all');
  $('#get-button').on('click', function() {
    var query = $('#query').val();
    if (query.length == 0) {
      query = 'all';
    }
    do_query(query);
  });

});
