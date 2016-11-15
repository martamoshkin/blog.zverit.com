---
layout: post
title:  "Webpack и lazy load модули Angular2"
date:   2016-11-15 21:25:43 +0300
category: Frontend
tags: [Angular2, TypeScript, Webpack]
description: ""
---

<img class="post-logo" src="https://blog.zverit.com/assets/webpack-failed-to-load.png" alt=""/>

После выхода на свет версии Angular RC5 у роутера появилась возможность lazy подгрузки. Что позволяет загружать части приложения по востребованию, тоесть модули подгружаются после перехода по определенным маршрутам. Что существенно сокращает время загрузки и распределяет время отклика. 

<!-- more -->

Нужно просто задать поле ``loadChildren`` у роута, и дальше Angular будет сам извлекать модуль по этому пути и загружать в конфигурацию роутера.

```ts

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

Не забывайте указывать после хештега название импортируемого модуля. 

И все это конечно хорошо, до тех пор пока мы не начнем собирать webpack'ом. При попытке загрузить страничку будут бесконечные ошибки, что не удалось загрузить модуль. 

Для того, чтобы webpack инжектил модули установим модуль ``angular2-router-loader`` и добавим в webpack конфиг

```ts

webpack.common.js

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

Который заменит наш путь до модуля на следующий код:

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

При помощи ``require.ensure`` webpack кладет эти модули в отдельные файлы называемые chunk'ами. 

Если же и после этих действий ошибки не пропали, то обратите внимание на пути к модулям, они должны быть относительными. 
 
Также стоит обратить еще на одну важную вещь. Например, если компилируем gulp'ом и собираем при помощи SystmJs на dev, а на продакшен собираем webpack'ом, то велика вероятность получить неправлиьно собранный код и получать те же самые ошибки.
А дело в том, что webpack может использовать уже собранные .js файлы (которые могут быть не адаптированны для него).
Выход из этой ситуации прост - почистить директорию с .ts исходниками от .js. 


К примеру gulp таской:

```js

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

Ошибки об отсутствующих файлах могут быть не только для модулей, а для темплейтов и стилей. Для их загрузки также нужно указывать относительные пути и добавить в поле loaders 'awesome-typescript-loader' и 'angular2-template-loader' (соответственно, прежде эти пактеы должны быть установлены)
