'use strict';

var MORANT = MORANT || {};
$(document).ready(function() {
  //initialize
  $.ajaxSetup({
    headers: {
      'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
    }
  });

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
        size: '1.5em',
        sortable: true,
      },
        {
          caption: 'TextID',
          field: 'Docid',
          size: '1.5em',
          sortable: true,
        },
        {
          caption: 'アノテーション',
          field: 'Annotation',
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
          if (event.menuIndex == 0) {
            var docid = w2ui.mygrid.get(event.recid).Docid;
            MORANT.COMMON.FUNC.ma_annotation_popup(docid);
          } else if (event.menuIndex == 1) {
            var text = w2ui.mygrid.get(event.recid).Annotation;
            window.open(MORANT.COMMON.URL.REDIRECT.MA + '/' + encodeURIComponent(text));
          }
        }
      },
    });
  }


  function set_table(data) {
    w2ui.mygrid.clear();
    w2ui.mygrid.add(data);
    w2ui.mygrid.searchReset();
  }


  initialize_table();
  $.ajax({
    type: 'POST',
    url: MORANT.COMMON.URL.MA_ANNOTATION.SHOW_MINE + '/' + 'all' + '.json',
  }).done(function(data) {
    set_table(data);
  }).fail(function(data) {
    $('#resultView').html(data.responseText).css('color', 'red');
  });
});
