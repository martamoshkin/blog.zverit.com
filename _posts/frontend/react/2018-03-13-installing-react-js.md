---
layout: post
title:  "Разработка на React. Установка"
date:   2018-03-13 23:17:13 +0300
category: Frontend
author: "Artamoshkin Maxim"
redirect_from:
  - /frontend/2018/03/11/installing-react-js/
image: "/assets/react-install.png"
image_alt: ""
image_height: "auto"
tags: [React, ReactJS, Lessons, JavaScript, JS]
description: "В данной статье рассмотрены основные способы для создания React-приложения на горячую. Способы инициализировать приложения как локально, так и в облачных сервисах. Реакт что это?"
---

Человека связанного с современным фронтендом, чаще всего, отпугивает не сложность фреймворка, а сложность его конфигурации. К счастью, в мире React все не так страшно, как кажется. 
В этой части рассмотрим несколько путей быстрой инициализации минимального React-приложения. 

<!-- more -->

### React-зависимости ###

React – является обычной js-библиотекой, которую возможно подключить через тег `<script>`. 
Для старта react-приложения на html-странице необходимо скачать два файла `react` и `react-dom`. Еще есть вариант использовать CDN, либо установить через пакетный менеджер NPM или Yarn.

```html
<!-- использование CDN -->

<script src="https://unpkg.com/react@{версия react}/dist/react.js"></script>
<script src="https://unpkg.com/react-dom@{версия react}/dist/react-dom.js"></script>
```

Заменить `{версия react}` на нужную (либо новейшую) версию React. Нужно учесть, что библиотека была разбита на два файла после выхода 14 версии.

```sh
npm install --save react react-dom
```

```sh
yarn add react react-dom
```

#### React.js ####

Файл `react.js` является ядром React, он необходим для создания React-элементов и компонентов.
При импорте через тег `<script>` API `React` будет доступен глобально. Средствами ES5 и ES6 можно импортировать иным способом:

```js
// ES5
var ReactDOM = require('react')
```

```js
// ES6
import ReactDOM from 'react'
```

#### React-dom.js ####
Для рендеринга компонентов в HTML (т.е. в DOM) требуется `react-dom.js`. Он также зависит от файла `react.js`.
Чтобы не перегружать статью по установке React, описание работы виртуального DOM будут представлены в отдельной статье. А пока перейдем к созданию минимального HTML шаблона React-приложения.

Также как и файл `react.js` импортируя через тег `<script>` доступен глобально и имеются другие способы импортирования:

```js
// ES5
var ReactDOM = require('react-dom')
```

```js
// ES6
import ReactDOM from 'react-dom'
```

### Минимальный HTML шаблон ###

Быстрый способ познакомиться с данной библиотекой – это подключить ее к пустому HTML файлу.
Подключим эти файлы в html одним из вышеуказанных способов. 

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>React App</title>
    <script src="./scripts/react.development.js"></script>
    <script src="./scripts/react-dom.development.js"></script>
    <script src="./scripts/app.js"></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
```

Необходимо создать div с идентификатором, по которому будет происходить биндинг всего приложения, обычно это идентификатор ‘root’.
Далее создадим файл `app.js` и добавим следующий код, который, при помощи React выведет сообщение «First React App».

```js
// app.js

ReactDOM.render(
	React.createElement('h1', null, 'First React App'),
	document.getElementById('root')
);
```

`ReactDOM.reander` принимает два параметра, первый принимает React-компонент, во второй передается корневой элемент для рендеринга.


Таким образом мы можем внедрить React в приложение, написанное на любом другом фреймворке.


### Создание одностраничного React-приложения ###

#### Create React App ####

[Create React App](https://github.com/facebook/create-react-app "Create React App"){:target="_blank"}{:rel="noopener"} - это один из лучших способов быстро создать минимальное одностраничное приложение на React. Он позволяет создавать уже сконфигурированные и готовые к разработке React-приложения. И лишь в дальнейшем корректировать конфигурации (Webpack, Babel, TSLint и т.д.) по мере необходимости, а не писать их с "нуля".
Этим инструментом пользуются как новички, так и профессионалы.

Для того, чтобы начать использовать `create-react-app` его необходимо установить.

```sh
npm install -g create-react-app
```

После установки перейдите в нужную директорию для инициализации нового проекта приложения и выполните следующие команды:


```sh
create-react-app hello-world
cd hello-world
npm start
```

#### Starter kits ###

На официальном сайте имеется список всевозможных бойлерплейтов с React. Требующие лишь клонирование репозитория и установки пакетов.
[reactjs.org/community/starter-kits](https://reactjs.org/community/starter-kits.html "Starter Kits"){:target="_blank"}{:rel="noopener"}


### Онлайн сервисы ###
Несомненно, онлайн среды разработки очень удобны, так как можно работать с кодом имея под рукой лишь браузер. Также, можно с легкостью делиться или одновременно работать с этим кодом.


####  CodePen ####
[CodePen](https://codepen.io/ "CodePen"){:target="_blank"}{:rel="noopener"}

<p data-height="265" data-theme-id="light" data-slug-hash="RMPgKy" data-default-tab="js,result" data-user="Zverit" data-embed-version="2" data-pen-title="RMPgKy" class="codepen">See the Pen <a href="https://codepen.io/Zverit/pen/RMPgKy/">RMPgKy</a> by Zverit (<a href="https://codepen.io/Zverit">@Zverit</a>) on <a href="https://codepen.io">CodePen</a>.</p>
<script async src="https://static.codepen.io/assets/embed/ei.js"></script>

#### JSFiddle ####
[JSFiddle](https://jsfiddle.net/ "JSFiddle"){:target="_blank"}{:rel="noopener"}

<script async src="//jsfiddle.net/reactjs/69z2wepo/embed/"></script>

#### CodeSandbox ####
[CodeSandbox](https://codesandbox.io/s/new "CodeSandbox"){:target="_blank"}{:rel="noopener"} - онлайн редактор кода с упором на React. Редактор который умеет автоматизировать такие вещи как транспайлинг, пакетирование и управление зависимостями.

<iframe src="https://codesandbox.io/embed/new" style="width:100%; height:500px; border:0; border-radius: 4px; overflow:hidden;" sandbox="allow-modals allow-forms allow-popups allow-scripts allow-same-origin"></iframe>


### Резюме ###
Были рассмотрены основные способы для создания React-приложения "на горячую". 
Наличие широкого выбора способов и инструментов для старта, позволяет преодолеть психологический барьер страха конфигурации приложения и приступить к разработке здесь и сейчас.

Приложения с более сложной конфигурацией будут представлены в следующих публикациях. 

Удачного старта!


### Оглавление ###
1. [Введение](/frontend/2018/02/04/react-lessons-introduction/ "Введение")
2. [Функциональное программирование](/frontend/2018/02/18/functional-programming-js/ "Функциональное программирование")
3. [Установка](/frontend/2018/03/11/installing-react-js/ "Установка")
4. [JSX](/frontend/2018/04/17/introduction-jsx/ "JSX")
