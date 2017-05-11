<!DOCTYPE html>
<html lang="ja">
<head>
	<meta charset="UTF-8">
	<title>{{ title }}</title>


        <script type="text/javascript" src="/static/js/jquery-3.2.1.min.js"></script>
        <script type="text/javascript" src="/static/js/w2ui.min.js"></script>
        <link rel="stylesheet" type="text/css" href="/static/css/w2ui.min.css" />

        <script type="text/javascript" src="/static/js/common.js"></script>
        <script type="text/javascript" src="/static/js/show-ma-annotations.js"></script>
        <meta name="csrf-token" content="{{ csrfToken }}">
        <link rel="stylesheet" href="/static/css/style.css" media="all">
</head>
<body>

    <h1>{{ title }}</h1>

        <div id="resultView"></div>
        <div id="grid" style="width: 100%; height: 700px; font-size:16pt;"></div>


</body>
</html>
