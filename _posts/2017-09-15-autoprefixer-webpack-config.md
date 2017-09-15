---
layout: post
title:  "Настройка Autoprefixer для Webpack"
date:   2017-09-15 20:19:29 +0300
category: Frontend
author: "Artamoshkin Maxim"
image: "/assets/webpack-loaders.png"
image_alt: "Autoprefixer PostCSS plugin"
tags: [Autoprefixer, PostCSS, Loaders, Webpack]
description: "Autoprefixer - это плагин PostCSS для добавления вендорных префиксов на основе данных сервиса Can I Use. Благодаря этому плагину, создание кросс-браузерного CSS стало проще, без лишнего мусора в коде, так как PostCSS это постобработчик."
---

Настройка Autoprefixer для Webpack

[`Autoprefixer`](https://github.com/postcss/autoprefixer) - это плагин  [`PostCSS`](https://github.com/postcss/postcss) для добавления вендорных префиксов на основе данных сервиса [*Can I Use*](https://caniuse.com/). Благодаря этому плагину, создание кроссбраузерного CSS стало проще. Не нужно добавлять 'мусорный' код, так как `PostCSS` является постобработчиком и добавляет уже, непосредственно, при сборке web-приложения.

Это будет небольшой заметкой как быстро настроить `Autoprefixer` для `Webpack 2`.

### 1. Установка ###
Для начала необходимо установить `postcss-loader`, который позволяет использовать `PostCSS` в экосистеме Webpack, без лишних "телодвижений" :
```
npm install postcss-loader
```
Также устанавливаем сам плагин:
```
npm install autoprefixer
```

###2. Конфигурация ###
Импортируем в файл webpack-конфигурации:
`const autoprefixer = require('autoprefixer');`

И правим в разделе `module.rules`. 
Добавляем правило для `.scss` или `.css` типов:
```
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
В опции `postcss-loader` добавляем плагин, у него же в конструктор передаются опции. Опции можно посмотреть в [официальном мануале](https://github.com/postcss/autoprefixer#options). Большинство из них включены по умолчанию, можно их опционально отключить.
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