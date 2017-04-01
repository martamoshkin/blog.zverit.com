---
layout: post
title:  "Подключение сторонних библиотек при помощи Webpack"
date:   2017-02-25 20:19:29 +0300
category: Frontend
tags: [Webpack, TypeScript, Loaders, CommonJS, AMD]
description: "Существует огромное множество способов подключения сторонних js/css библиотек при помощи средств Webpack. Не все js модули совместимы и могут напрямую использоваться с Webpack. На этот случай Webpack имеет несколько загрузчиков, для работы с такими модулями."
---
<img class="post-logo" src="https://blog.zverit.com/assets/webpack-loaders.png" alt="Webpack loaders"/>

Существует несколько путей подключения сторонних *js/css* библиотек при помощи средств *Webpack*.
Не все *js* модули совместимы и могут напрямую использоваться с Webpack. На этот случай Webpack имеет несколько загрузчиков, для работы с такими модулями. Далее рассмотрим большинство из них. 
<!-- more -->

#### 1. ProvidePlugin для введения неявных глобальных переменных ####

Пожалуй один из самых простых и популярных методов - это ProvidePlugin. ProviderPlugin встроен в Webpack и не требует устновки. 
Множество библиотек, такие как *jQuery*, имеют специфические глобалы: **$** или **jQuery**. И в каждом современном проекте мы используем портянку из импортов. Для решения этой пробемы мы настроить *Webpack* таким образом, чтобы он автоматически анализировал код и автоматически включал необходимые модуи. К примеру при появлении идентификатора **$** он подставлял бы следующую строку: 

```ts
var $ = require("jquery");
``` 

```js

var webpack = require('webpack');
......
plugins:[
new webpack.ProvidePlugin({
 $: "jquery/dist/jquery.min.js",
 jQuery: "jquery/dist/jquery.min.js",
 "window.jQuery": "jquery/dist/jquery.min.js",
})]
```

При этом нужно убедиться правильно ли заданы пути до `node_modules`.

#### 2. Webpack Aliases ####

В зависимости от того, как структурирован проект, вы можете импортировать объявления примерно так:

```ts
import SomeComponent from 'app/lib/javascriptLib/dist/SomeComponent.min.js';
```

или 

```ts
import SomeComponent from '../dist/SomeComponent.min.js';
```

но каждый раз писать длинный путь это весьма некрасиво и в один момент, при изменении структуры проекта, все может поломаться. Выходом из этой ситуации является *Webpack* псевдонимы или *alias*.

```js
// webpack.config.js
resolve: {
  alias: {
    dist: "app/lib/javascriptLib/dist",
  },
}
```

после этого уже можно импортировать компоненты более коротко и надежно:

```ts
import SomeComponent from 'dist/SomeComponent.min.js';
```

#### 3. Использование *imports-loader* для конфигурации *this* ####

Устаревшие библиотеки полагаются на `this` будучи `window` объектом. Это доставляет проблемы когда она запускается в контексте *CommonJS*, где `this` равносильно `module.exports`. И как раз в этом случае вам поможет `imports-loader`.

Сначала установите пакет: 
```powershell
 npm install --save-dev imports-loader
```

затем добавте в *Webpack* конфиг: 

```js
module: {
    loaders: [
        {
            test: /[\/\\]node_modules[\/\\]some-module[\/\\]index\.js$/,
            loader: "imports?this=>window"
        }
    ]
} 
```


#### 4. Использование *imports-loader* для отключения *AMD* ####

Импорт следующим образом поддерживает различные стили модулей, такие как *AMD*, *CommonJS*. 

```js
module: {
    loaders: [
        {
            test: /[\/\\]node_modules[\/\\]some-module[\/\\]index\.js$/,
            loader: "imports?define=>false"
        }
    ]
}
```

#### 5. *script-loader* для глобального импорта библиотек ####

Этот прием загрузки равносилен тому, если бы вы загружали через тег ```<script>```. Этот код будет также доступен в глобальном контексте.

Но у этого метода загрузки есть существенный недостаток - файл скрипта добавляется в бандл как строка, по этому он не минимизируется *Webpack*'ом.

Для начала нужно установить сам loader: 

```powershell
npm install --save-dev script-loader
```

Для загрузки данным методом рекомендуется прописать в *Webpack* конфиг:

```js
//webpack.config.js

module.exports = {
  module: {
    rules: [
      {
        test: /\.exec.js$/,
        use: [ 'script-loader' ]
      }
    ]
  }
}
```

а затем импортировать в модуль

```ts 
import exec from 'script.exec.js';
```

А еще есть альтернативный способ, inline'ом и без добавления в конфиг:

```ts
import exec from 'script-loader!./script.js';
```

#### 6. *noParse* для импорта крупных дистрибутивов ####

Это способ отключает парсинг *Webpack*'ом, что может значительно улучшить время сборки.

```js
module: {
    noParse: [
        /[\/\\]node_modules[\/\\]angular[\/\\]angular\.js$/
    ]
}
```

Этот способ будет полезен для упакованных библиотек.
