---
layout: post
title:  "Markdown в Angular"
date:   2018-09-29 00:20:39 +0300
category: Frontend
author: "Artamoshkin Maxim"
image: "/assets/markdown-angular.png"
image_alt: ""
image_height: "auto"
tags: [Angular, Markdown]
description: "В статье описан простой путь использования markdown верстки в angular приложении"
---
[Markdown](https://ru.wikipedia.org/wiki/Markdown) давно вошел в нашу жизнь и показал себя со стороны простого и логичного языка разметки документов, в сравнении с тяжеловесным [BBcode](https://ru.wikipedia.org/wiki/BBCode). 

Markdown активно используется в кругах разработчиков для составления различного рода документаций, к примеру, популярная практика,  для разметки [README](https://en.wikipedia.org/wiki/README) который распознают все сервисы git. К слову, этот блог также написан c использованием markdown, где 95%  markdown кода преобразуется в HTML. 
<!-- more -->


В моей практике, не так давно была задача создания корпоративной библиотеки компонентов для Angular, которая будет использоваться в нескольких командах. Соответственно появилась необходимость в качественном описании, которое отображается и в самом demo приложении, так и на страницах репозиториев. Дублировать информацию не было желания и принято решение использовать markdown файлы. 

Наиболее завершенной и конечной библиотекой для работы с md показалась [ngx-markdown](https://github.com/jfcere/ngx-markdown) (на момент написания статьи). 

### Установка #

Установка пакета:
```bash
npm install ngx-markdown --save
```

Указываем на парсер markdown в файле `angular.json`.
```js
"scripts": [
	"node_modules/marked/lib/marked.js"
]
```
### Использование

Ниже опишу один из самых простых путей его использования.
```ts
@NgModule({
	imports: [
 		...
		MarkdownModule.forRoot({ loader: HttpClient })
  	 ]
...
})
```

Загружаем данные из `md` файла при помощи [`raw-loader`](https://github.com/webpack-contrib/raw-loader).

```ts
public readonly MARKDOWN_DATA = '!!raw-loader!../../../README.md';
```
Для отображения используем тег `markdown` с  атрибутом `data`
```html
<markdown [data]='MARKDOWN_DATA'> </markdown>
```
Готово. Теперь markdown файлы конвертируются в HTML. 
В данном примере мы упростили вывод `README.md` файла и на страницах репозитория и на публичной странице.

Есть множество других путей использования этой библиотеки, которые описаны в официальной документации на [странице Github](https://github.com/jfcere/ngx-markdown).


<iframe src="https://codesandbox.io/embed/0ml75o71yp" style="width:100%; height:500px; border:0; border-radius: 4px; overflow:hidden;" sandbox="allow-modals allow-forms allow-popups allow-scripts allow-same-origin"></iframe>
