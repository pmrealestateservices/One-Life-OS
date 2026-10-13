import pathlib
root = pathlib.Path(__file__).parent
src = root / 'src'
order = ['core','seed','planner','ui','today','goals','journal','more','sync','progress','boot']
js = '\n'.join((src/f'{n}.js').read_text() for n in order)
css = (src/'styles.css').read_text()
html = f'''<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>ONE LIFE OS</title>
<meta name="description" content="Personal growth, performance and life management.">
<meta name="theme-color" content="#16233F" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0E1424" media="(prefers-color-scheme: dark)">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="One Life">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" type="image/png" sizes="192x192" href="icons/icon-192.png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<style>
{css}
</style>
</head>
<body>
<noscript>ONE LIFE OS needs JavaScript.</noscript>
<script>
{js}
</script>
</body>
</html>
'''
(root/'public'/'index.html').write_text(html)
print('built', len(html)//1024, 'KB')
