<!DOCTYPE html>
<html lang="ja">
<head>
	<meta charset="UTF-8">
	<title>morant</title>

        <script type="text/javascript" src="/static/js/jquery-3.2.1.min.js"></script>
        <script type="text/javascript" src="/static/js/w2ui.min.js"></script>
        <link rel="stylesheet" type="text/css" href="/static/css/w2ui.min.css" />

        <script type="text/javascript" src="/static/js/common.js"></script>
        <script type="text/javascript" src="/static/js/search.js"></script>
        <script type="text/javascript" src="/static/js/login.js"></script>
        <meta name="csrf-token" content="{{ csrfToken }}">
        <link rel="stylesheet" href="/static/css/style.css" media="all">
</head>
<body>

    <div id='login-box'>
    </div>


    <div id="content">
        <h1 class="title"><a href='/' style='text-decoration: none;'>morant</a></h1>
        日本語Wikipediaから抽出した{{ totalHumanize }}文から検索します．<br />
        1クエリ(最低2文字, Case Sensitive)最大で{{ maxResult }}文を表示します．<br />
        (例:
        <a href='/スマホ'>スマホ</a>，
        <a href='/トマト'>トマト</a>，
        <a href='/京都大学'>京都大学</a>，
        <a href='/ねねね'>ねねね</a>
        )<br />


        <div id="queryForm">
            <form action='#' style='margin-top:0.5em;'>
                <input type="text" size="30" id="query" value="{{ query }}"/>
            </form>
            <span id="resultView"></span>
        </div>

            <div id="grid" style="width: 100%; height: 700px; font-size:16pt;"></div>

            <h3>Tips</h3>
                <ul>
                    <li>ダブルクリックでセル内の文字列を選択できます</li>
                    <li>右クリックでコンテキストメニューが出てきます</li>
                    <li>キーボードショートカット
                        <ul>
                        <li>Ctrl+数字: Typeを変更する</li>
                        <li>Ctrl+s: 送信</li>
                        <li>Ctrl+e: アノテーションの編集</li>
                        <li>Ctrl+m: 形態素解析比較</li>
                        <li>Ctrl+j, Ctrl+←: マッチ表層を1つ前にする</li>
                        <li>Ctrl+k, Ctrl+→: マッチ表層を1つ後にする</li>
                        </ul>
                    </li>
                </ul>


        <h2>API</h2>
            <ul>
                <li>
                    /api/v1/text/{docid}
                    <br /><a href="/api/v1/text/12345">sample</a>
                </li>
                <li>
                    /api/v1/search/{query}
                    <br /><a href="/api/v1/search/%E8%A8%80%E8%AA%9E%E5%87%A6%E7%90%86%E5%AD%A6">sample</a>
                </li>
            </ul>
    </div>
</body>
</html>
