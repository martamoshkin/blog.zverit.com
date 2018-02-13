---
layout: post
title:  "Отладка на локальных устройствах приложений под webpack-dev-server"
date: 2018-02-12 22:37:32 +0300
category: Frontend
author: "Artamoshkin Maxim"
image: "/assets/webpack-dev-server-share.png"
image_alt: ""
tags: [Webpack, Dev Server, Debugging, Development]
description: "Почти каждый разработчик использовавший webpack-dev-server сталкивался с проблемой отладки локального приложения на мобильных или прочих устройствах находящимися под NAT."
---

Почти каждый разработчик использовавший *[webpack-dev-server](https://github.com/webpack/webpack-dev-server "webpack-dev-server"){:target="_blank"}* сталкивался с проблемой отладки локального приложения на мобильных или прочих устройствах находящимися под [NAT](https://ru.wikipedia.org/wiki/NAT "NAT"){:target="_blank"}. 
На гугл-просторах каждый вторит о дополнительном параметре ``--host 0.0.0.0`` или ``localhost`` для запуска ``webpack-dev-server`` и то, что после этого приложение будет доступно по локалной сети. <!-- more -->
Но увы, лично у меня данный метод не работает, причем отказывается работать даже на простейших тестовых проектах, приложеных к решениям.

Сработал следующий метод, который нигде не был описан и наткнулся на это решение чисто случайно:



#### 1. Узнаем текущий IP ####

Узнать IP машины можно следующими командами ``ipconfig`` (Windows) или ``ifconfig`` (Linux).

{:.center}
![IP4 Address](https://blog.zverit.com/assets/console-ip-address.png)

#### 2. Запускаем *webpack-dev-server* ####

Запускаем *webpack-dev-server* на этот IP. К примеру, если имеем конфигурацию следующего вида:


```js
 devServer: {
    hot: true,
    contentBase: resolve(__dirname, 'dist'),
    publicPath: '/',
    host: 'localhost',
    port: 7373,
    proxy: {
      '/api/**': {
        target: 'localhost:8000',
        secure: false,
        changeOrigin: true,
      }
    },
  },
```

То заменяем на:

```js
 devServer: {
    hot: true,
    contentBase: resolve(__dirname, 'dist'),
    publicPath: '/',
    host: '192.168.3.186'
    port: 7373,
    proxy: {
      '/api/**': {
        target: '192.168.3.186:8000',
        secure: false,
        changeOrigin: true,
      }
    },
  },
```

#### 3. Отключаем Firewall ####

Отключаем *Public Firewall* в *Windows Defender* или лю другой, если используется сторонний.

{:.center}
![Disabled Windows Defender Firewall](https://blog.zverit.com/assets/windows-defender-firewall.png)

#### 4. Готово. ####
Можно использовать на других устройствах, обращаясь по адресу машины на котором запущен *dev-server*, не забывая указывать нужный порт. В данном случае ``192.168.3.186:7373``.

{:.center}
![local address iphone](https://blog.zverit.com/assets/local-address-iphone.jpg)

Очень надеюсь, что мой метод кому-то сохранит время. Удачного дебага!


Ах да, чуть ниже можно подписаться на новости блога.
