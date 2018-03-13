---
layout: post
title:  "Разработка на React. Установка"
date:   2018-03-11 10:22:29 +0300
category: Frontend
author: "Artamoshkin Maxim"
image: "/assets/react-functional-programming.png"
image_alt: ""
tags: [React, ReactJS, Lessons, JavaScript, JS]
description: "Продолжая серию статей о React, поговорим о функциональной парадигме программирования, так как React и Flux основаны на функциональных методах.Функциональное программирование одна из “горячих” тем из мира JavaScript. Но как раздел дискретной математики и парадигма программирования существует еще с давних пор.Функциональному, как правило, противопоставляется императивный подход к программированию."
---

Человека связанного с современным фронтендом, чаще всего, отпугивает не сложность фреймворка, а сложность его конфигурации. К счастью, с React все намного проще, чем кажется. 
В этой части рассмотрим несколько путей быстрой инициализации минимального React-приложения. 

<!-- more -->

### React-зависимости ###

React – является обычной js-библиотекой которую возможно подключить через тег `<script>`. 
Для старта react-приложения на html-странице необходимо скачать два файла react и react-dom. Еще есть вариант использовать CDN, либо установить через пакетный менеджер NPM или Yarn.

```html
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

#### React-dom.js ####
Для рендеринга компонентов в HTML (т.е. в DOM) требуется `react-dom.js`. Он также зависит от файла `react.js`.
Чтобы не перегружать статью по установке React, описание работы виртуального DOM будут представлены в отдельной статье. А пока перейдем к созданию минимального HTML шаблона React-приложения.

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
    <script src="="./scripts/react-dom.development.js"></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
```

Необходимо создать div с идентификатором, по которому будет происходить биндинг всего приложения, обычно это идентификатор ‘root’.
Далее создадим файл `app.js` и добавим следующий код, который, при помощи React выведет сообщение «First React App».

```js
ReactDOM.render(
	React.createElement('h1', null, 'React App'),
	document.getElementById('root')
);
```
`ReactDOM.reander` принимает два параметра, первый принимает React-компонент, во второй передается корневой элемент для рендеринга.


Таким образом мы можем внедрить React в приложение, написанное на любом другом фреймворке.


### Создание одностраничного React-приложения ###

#### Create React App ####
[Create React App](https://github.com/facebook/create-react-app "Create React App") - это один из лучших способов быстро создать минимальное одностраничное приложение на React. Он позволяет создавать уже сконфигурированные и готовые к разработке React-приложения. И лишь в дальнейшем корректировать конфигурации (Webpack, Babel, TSLint и т.д.) по мере необходимости, а не писать их с "нуля".
Этим инструментом пользуются как новички, так и профессионалы.

Для того, чтобы начать использовать `create-react-app` его необходимо установить.
```sh
npm install -g create-react-app
```
После установки перейти в нужную директорию для инициализации нового проекта приложения и выполнить следующие команды:

```sh
create-react-app hello-world
cd hello-world
npm start
```
#### Starter kits ###
На официальном сайте имеется список всевозможных бойлерплейтов с React. Требующие лишь клонирование репозитория и установки пакетов.
[reactjs.org/community/starter-kits](https://reactjs.org/community/starter-kits.html "Starter Kits")

### Онлайн сервисы ###

####  CodePen ####
[CodePen](https://codepen.io/ "CodePen")

<p data-height="265" data-theme-id="light" data-slug-hash="RMPgKy" data-default-tab="js,result" data-user="Zverit" data-embed-version="2" data-pen-title="RMPgKy" class="codepen">See the Pen <a href="https://codepen.io/Zverit/pen/RMPgKy/">RMPgKy</a> by Zverit (<a href="https://codepen.io/Zverit">@Zverit</a>) on <a href="https://codepen.io">CodePen</a>.</p>
<script async src="https://static.codepen.io/assets/embed/ei.js"></script>

#### JSFiddle ####
[JSFiddle](https://jsfiddle.net/ "JSFiddle")

<script async src="//jsfiddle.net/reactjs/69z2wepo/embed/"></script>

#### CodeSandbox ####
[CodeSandbox](https://codesandbox.io/s/new "CodeSandbox") - онлайн редактор кода с упором на React. Редактор который умеет автоматизировать такие вещи как транспайлинг, пакетирование 

<iframe src="https://codesandbox.io/embed/new" style="width:100%; height:500px; border:0; border-radius: 4px; overflow:hidden;" sandbox="allow-modals allow-forms allow-popups allow-scripts allow-same-origin"></iframe>


### Резюме ###
Были рассмотрены основные способы для создания React-приложения "на горячую". 
Наличие широкого выбора способов и инструментов для старта, позволяет преодолеть психологический барьер страха конфигурации приложения и приступить к разработке здесь и сейчас.

Приложения с более сложной конфигурацией будут представлены в следующих публикациях. 
Удачного старта!

### Оглавление ###
1. [Введение](/frontend/2018/02/04/react-lessons-introduction/ "Введение")
2. [Функциональное программирование](/frontend/2018/02/18/functional-programming-js/ "Функциональное программирование")
2. [Установка](/frontend/2018/03/11/installing-react-js/ "Установка")