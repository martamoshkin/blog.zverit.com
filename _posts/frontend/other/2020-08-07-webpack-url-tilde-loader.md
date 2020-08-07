---
layout: post
title:  "Замена tilda(~) в стилях через webpack"
date: 2020-08-06 20:10:10 +0300
category: Frontend
image: "/assets/nature-1.jpg"
image_alt: "Artamoshkin Maxim Nature Photo"
author: "Artamoshkin Maxim"
tags: [Webpack, Scss, Frontend, Development, React]
description: "Трансформация scss с тильда в относительные пути. Обзор плагина url-tilde-webpack"
---

#### Проблема ####
При использовании в React или Storybook сторонних стилей или дизайн систем, в особенности адаптированных под Angular может возникнуть ошибка наподобие этой: 
```
Module not found: Error: Can't resolve './assets/favicon.ico'
```
Вероятнее всего, в стилях используются относительные пути через тильду (`~`).

#### Решение ####
Ошибка не очевидна, так как отображается уже без `~`. Были попытки создания своих реплейсеров, но оптимальным решением оказалось использование плагина:
`url-tilde-loader`
https://www.npmjs.com/package/url-tilde-loader
[url-tilde-loader](https://www.npmjs.com/package/url-tilde-loader "url-tilde-loader"){:target="_blank"}{:rel="noopener"}
Был изначально отброшен из вариантов, так как последние обновление было 3 года назад. А зря, вполне рабочий вариант. Даже в случае обновлении Webpack можно взять в поддержку, в виду того, что кода не так много [https://github.com/P0lip/url-tilde-loader/tree/master/src](https://github.com/P0lip/url-tilde-loader/tree/master/src "url-tilde-loader"){:target="_blank"}{:rel="noopener"} 

Пример конфигурации:
```js
// webpack.config.js
{
  test: /\.s?css$/,
  use: [
    'style-loader',
    {
      loader: "css-loader",
      options: {
        modules: true,
      },
    },
    {
      loader: 'url-tilde-loader'
      options: {
        replacement: process.env.NODE_ENV === 'production' ? '/base-url/app/ : ''
      }
    },
    'sass-loader'
  ]
}
```
