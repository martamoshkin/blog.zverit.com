---
layout: post
title:  "Настройка Autoprefixer под Webpack"
date:   2017-09-15 22:13:29 +0300
category: Frontend
author: "Artamoshkin Maxim"
redirect_from:
    - /frontend/2017/09/15/autoprefixer-webpack-config/frontend
image: "/assets/autoprefixer.png"
image_alt: "Autoprefixer PostCSS plugin and Webpack"
tags: [Autoprefixer, PostCSS, Loaders, Webpack]
image_height: "auto"
description: "Autoprefixer - это плагин PostCSS для добавления вендорных префиксов на основе данных сервиса Can I Use. Благодаря этому плагину, создание кроссбраузерного CSS стало проще. Не нужно добавлять 'мусорный' код, так как `PostCSS` является постобработчиком и добавляет уже, непосредственно, при сборке web-приложения."
---

[`Autoprefixer`](https://github.com/postcss/autoprefixer){:target="_blank"} - это плагин  [`PostCSS`](https://github.com/postcss/postcss){:target="_blank"} для добавления вендорных префиксов на основе данных сервиса [*Can I Use*](https://caniuse.com/){:target="_blank"}. Благодаря этому плагину, создание кроссбраузерного CSS стало проще. Не нужно добавлять 'мусорный' код, так как `PostCSS` является постобработчиком и добавляет уже, непосредственно, при сборке web-приложения.
<!-- more -->
Это будет небольшой заметкой как быстро настроить `Autoprefixer` для `Webpack 2`.

### 1. Установка ###
Для начала необходимо установить `postcss-loader`, который позволяет использовать `PostCSS` в экосистеме Webpack, без лишних "телодвижений" :

```sh
npm install postcss-loader
```

Также устанавливаем сам плагин:

```sh
npm install autoprefixer
```

### 2. Конфигурация ###
Импортируем в файл webpack-конфигурации:
`const autoprefixer = require('autoprefixer');`

И правим в разделе `module.rules`. 
Добавляем правило для `.scss` или `.css` типов:

```js
{
    loader: 'postcss-loader',
    options: {
        plugins: [
            autoprefixer({
                browsers:['ie >= 8', 'last 4 version']
            })
        ],
        sourceMap: true
    }
},
```
**Важно** чтобы оно было расположено после `style-loader`, `css-loader` и до `sass-loader` (если таковой имеется).
В опции `postcss-loader` добавляем плагин, у него же в конструктор передаются опции. Опции можно посмотреть в [официальном мануале](https://github.com/postcss/autoprefixer#options){:target="_blank"}. Большинство из них включены по умолчанию, можно их опционально отключить.
Мы передадим массив браузеров, которые мы хотим использовать. `Autoprefixer` поддерживает выражения `Browserlist`, такие как: `'ie >= 8'`, `'last 4 version'`.

В конечном счете, для `.scss` были добавлены следующие правила:
```js
module: {
    rules: [
        {
            test: /\.scss$/,
            use: [
                {
                    loader: 'style-loader'
                },
                {
                    loader: 'css-loader',
                    options: {
                        sourceMap: true
                    }
                },
                {
                    loader: 'postcss-loader',
                    options: {
                        plugins: [
                            autoprefixer({
                                browsers:['ie >= 8', 'last 4 version']
                            })
                        ],
                        sourceMap: true
                    }
                },
                {
                    loader: 'sass-loader',
                    options: {
                        includePaths: [
                            helpers.root('src', 'styles', 'global'),
                        ],
                        sourceMap: true
                    }
                }
            ],
        },
    ]
},
```

Плюсом такого подхода является скорость настройки и отсутствие необходимости создавать специальные файлы конфигурации для `PostCSS`.
