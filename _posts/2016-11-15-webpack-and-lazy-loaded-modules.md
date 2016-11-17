---
layout: post
title:  "Webpack и LazyLoad модули Angular2"
date:   2016-11-15 21:25:43 +0300
category: Frontend
tags: [Angular2, TypeScript, Webpack]
description: ""
---

<img class="post-logo" style="max-width: 100%" src="https://blog.zverit.com/assets/webpack-failed-to-load.png" alt="Chrome console"/>

После выхода на свет версии Angular RC5 у роутера появилась возможность lazy подгрузки. Что позволяет загружать части приложения по востребованию, тоесть модули подгружаются после перехода по определенным маршрутам. Что существенно сокращает время загрузки и более равномерно распределяет время отклика. 

<!-- more -->

Для этого нужно, всего лишь, задать поле ``loadChildren`` у роута, и далее Angular будет сам извлекать модуль, по этому пути, и загружать в конфигурацию роутера. 

```ts
//app.routing.ts

@NgModule({
  declarations: [ AppComponent, HomeComponent ],
  bootstrap: [ AppComponent ],
  imports: [
    RouterModule.forRoot([
      { path: 'home', component: HomeComponent },
      { path: 'lazy', loadChildren: './my-lazy-module#LazyModule' }
    ])
})

export class RoutingModule {}
```

Не забывайте указывать название импортируемого модуля, после хештега. 

И все это конечно хорошо до тех пор, пока мы не начнем собирать webpack'ом. После попытки загрузить страничку появятся бесконечные ошибки о том, что не удалось загрузить тот или иной модуль. 

Для того, чтобы webpack инжектил модули установим пакет ``angular2-router-loader`` и добавим в webpack конфиг

```ts
//webpack.common.js

var webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var helpers = require('./helpers');

module.exports = {
    module: {
        loaders: [
          {
              test: /\.ts$/,
              loaders: ['angular2-router-loader?loader=require']
          }
         ....
    }
```
Параметр loader указывает на то, какой загрузчик будет использоваться для разделения кода (system/require). В нашем случае это require.

Он заменит наш путь до модуля на следующий код:

```ts
{
  path: 'lazy',
  loadChildren: () => new Promise(function (resolve) {
    (require as any).ensure([], function (require: any) {
      resolve(require('./lazy/lazy.module')['LazyModule']);
    });
  })
}
```

При помощи ``require.ensure`` webpack собирает эти модули по отдельным файлам называемые chunk'ами.

Если же и после этих действий ошибки не пропали, то обратите внимание на пути к модулям, они должны быть относительными. 
 
Также стоит обратить еще на одну важную вещь. К примеру, если компилируем gulp'ом и собираем при помощи SystmJs для dev, а на продакшн собираем webpack'ом, то велика вероятность получить некорректно собранный код и получать те же самые ошибки.
Дело в том, что webpack может использовать уже собранные .js файлы (которые могут быть не трансформированы для его целей).
Выход из этой ситуации прост - почистить директорию с .ts исходниками от .js. 

К примеру gulp таской:

```js
//gulpfile.js

gulp.task('clean-src', function() {
    return del([
    paths.tsOutput + '/**/*.js',
    paths.tsOutput + '/**/*.js.map',
    'app.js',
    'vendor.js',
    'polyfills.js',
    '*.chunk.js']);
});
```
<h3> P.S. </h3>

Кроме того, ошибки об отсутствующих файлах могут быть не только для модулей, а также для темплейтов и стилей. Для их загрузки, опять же, необходимо указывать относительные пути, и, в конфигурации webpack, добавить в поле loaders 'awesome-typescript-loader' и 'angular2-template-loader' (перед этим следует установить пакеты)
