---
title: Героический отлов OAuth callback в Angular
layout: post
date: '2017-07-24 21:47:11 +0300'
category: Frontend
image: "/assets/superhero-catching.png"
image_alt: "Callback catching"
image_height: "auto"
author: "Artamoshkin Maxim"
redirect_from:
    - /frontend/2017/07/24/angular-popup-oauth/frontend
tags:
- Angular
- OAuth
- SPA
- JavaScript
- TypeScript
description: "Сегодня расскажу о небольшом лайфхаке в плане OAuth авторизации в SPA, а конкретно в Angular приложении. Многие, наверняка, сталкивались с авторизацией через социальные сети, и все ясно представляют этот процесс, делаем GET запрос и делаем редирект к OAuth серверу с нужными параметрами (id приложения, скопами, и главное с URL редиректа) => в случае не авторизованного пользователя сервер отвечает html’ем с вводом креденшалов пользователя => после успешной авторизации OAuth сервер переходит на наше приложение, т.е. на заданный нами URL =>  и все, далее пользователь погнал юзать наше, невиданной полезности, приложение. Как бы тут все просто. Но… Бывают случаи, когда очень нежелательно уходить с приложения:" 
---

Сегодня расскажу о небольшом лайфхаке OAuth авторизации в SPA, а именно в Angular приложении. Многие, наверняка, сталкивались с авторизацией через социальные сети, и все хорошо представляют этот процесс<!-- more -->: отправляем GET запрос и делаем редирект к OAuth серверу с необходимыми параметрами (id приложения, скопами, и главное с URL редиректа); в случае не авторизованного пользователя сервер отвечает html’ем с вводом креденшалов пользователя; после успешной авторизации OAuth сервер переходит на наше приложение, т.е. на заданный нами URL;  и все, далее пользователь, будучи авторизованным, начинает пользовать наше приложение. Как бы тут все просто. Но… 

Бывают случаи, когда очень нежелательно уходить с приложения:

- Пользователь не захочет вводить логин\пароль и просто уйдет, закрыв вкладку
- Пользователь, вместо ввода авторизации в социальной сети, нажмет назад и его вернет, допустим, на начальный шаг какой-то процедуры, т.к. это может находиться на одном пути (route), SPA же.
- Обновление токена в один клик, без перезагрузки приложения
И тд…

Очевидно, что без всплывающих окон тут не обойтись. Но вопрос, куда же направлять редирект. «Может быть прописать отдельный путь для редиректа, добавить компонент, который обработает коллбек и синхронизирует с основным.» Но нет, это  драгоценные секунды загрузки и уж очень костыльно. Но не надо отчаиваться, сейчас расскажу свой менее болезненный и уже проверенный временем способ.
Нужно всего лишь создать html-файл в корне приложения, например, oauth-callback.html. И делать редирект именно на этот файл
`https://{my-domain}/oauth-callback.html`

Вы можете сказать, мол «как бы ok, и что, а как в родительском окне получить токен?». Здесь тоже все просто, из родительского окна мы имеем доступ к объекту `window` дочернего окна.
«То есть мы можем сделать `setInterval` и проверять какие данные, пользователь вводит данные или уже ввел, и мы имеем callback, а потом по `window.location` получить токен?» 
Ну... Нет.  Добавим в `oauth-callback.html` следующие строки: 

```ts  
<!DOCTYPE html>
<html>
<head>  
    <script>
        var oAuthCallbackEvent = new CustomEvent("OAuthCallback");
        window.opener.dispatchEvent(oAuthCallbackEvent);
        window.close();
    </script>
</head>
<body>
</body>
</html>
```

Создадим пользовательское событие, которое будем слушать в родительском окне, и которое будет означать успешную авторизацию в социальной сети и то, что был возвращен callback.

Кстати, создается всплывающим окном, примерно, следующим способом: 

```ts
let width = 860;
let height = 500;
let left = (screen.width / 2) - (width / 2);
let top = (screen.height / 2) - (height / 2);
let windowOptions = `menubar=no,location=no,resizable=no,scrollbars=no,status=no, width=${width}, height=${height}, top=${top}, left=${left}`;
let type = 'auth';

window.open(url, type, windowOptions);
```

А в компонент, где создается окно авторизации, добавим слушатель через Renderer2:

```ts
this._renderer.listen('window', 'OAuthCallback',
    (evt) => {
        this._globalOAuthCallbackListenFn();
	// тут сохраняем наш токен или производим другие действия после успешной авторизации
    });
```

Добавим в событие деталей, для передачи токена.
```ts 
var oAuthCallbackEvent = new CustomEvent("OAuthCallback", {'detail': window.location.search});
```

Теперь мы можем получить данные через эвент: `evt.detail`.

В результате мы получаем абсолютно спокойное приложение, которое без нервных движений реагирует на действия пользователя. 


### Update ###

Были изменения в сторону поддержки старых браузеров. [CustomEvent](https://developer.mozilla.org/ru/docs/Web/API/CustomEvent){:target="_blank"} поддерживается с 9ой версии IE, но наблюдались проблемы и с Edge. Можно было бы использовать простой Event, но в нашем случае необходимо передать данные. Поэтому было решено использовать `postMessage`.

```html
<!DOCTYPE html>
<html>
<head>
    <script>
        (function () {
            window.opener.postMessage(window.location.search, window.opener.location.origin);
            window.close();
        })();
    </script>
</head>
<body>
</body>
</html>
```

Соответственно, изменяем наш компонент.

```ts
this._globalOAuthCallbackListenFn = this._renderer.listen('window', 'message',
    (evt) => {
        this._globalOAuthCallbackListenFn();
});
```

Важно, для поддержки IE10, новое окно необходимо создавать с начальным url равному домену от которого оно создается.
