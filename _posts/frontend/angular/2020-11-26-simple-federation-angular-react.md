---
layout: post
title:  "Простое подключение federation-модулей в Angular, или нечестная федерализация."
date:   2020-11-26 22:20:39 +0300
category: Frontend
author: "Artamoshkin Maxim"
image: "/assets/simple-federation.jpg"
image_alt: "Artamoshkin Maxim Architecture Photo"
tags: [Angular, React, WebpackFederation, Microfrontend, Webpack]
description: "В статье описан простой способ использовать федерализацию в Angular, без использования плагина Webpack Federation"
---

Мир фронтенда пополнился еще одним термином — федерализация. Что же это значит? Федерализация (от лат. foederatio -"объединение", "союз" )  — объеденение ранее обособленных единиц, термин из политической сферы. В нашем же случае это архитектура, позволяющая на лету объединять код различных приложений.

<!-- more -->

### Коротко про микрофронтенд

Микросервисами на бэкенде уже никого не удивишь, но в последнее время, с ростом и развитием frontend появилась все большая необходимость в разделении кода для разработки и объединение в крупные комплексные приложения, особенно в enterprise-приложениях, когда разными модулями занимаются отдельные команды, или даже отделы. В силу некоторых обстоятельств, у некоторых команд может не совпадать технический стек, либо был запланирован переход с одной технологии на другую, при этом придется поддерживать старую кодовую базу и дублировать в новую. Тут и приходит на помощь микрофронтенд. Когда можно совместить множество модулей написанных на разных технологиях в одно целое, разбить старую код и переводить на новый частями и т.д.

### Основные подходы в микрофронтенде

1. Наверное, самым первым и самым известным способом является дробление по iframe. Крайне неповоротливое решение. Проседает производительность, сложности в поддержке. 
2. Внедрение через компоненты — подходит только для родственных инструментов. Внедрение, к примеру, react-angular уже не выйдет.
3. WebComponents — пока слабая поддержка, масса особенностей и ограничений.
4. Monorepo - очень сложно масштабироваться, работать с большим колличеством команд.
5. Несколько приложений размещеных по разным url. С общей библиотекой компонентов.
6. И, как я считаю, будет одним из главных и базовых инструментов в микрофронтенде - Webpack Federation Plugin. Далее чуть подробнее.

### Module Federation

Основная идея этого плагина в том, чтобы объединить несколько независимых модулей в одно единое приложение. Плагин позволяет экспортировать модули без лишних зависимостей в приложении доноре. Приложение приемник также может использовать этот плагин, для импорта модулей из донора и решения зависимостей. Есть одно важное отличие от уже имеющихся решений, получение модулей и разрешение зависимостей происходит во время выполнения, т.е. приложение host и consumer могут размещениы по разным адресам. При этом нет жесткой зависимости между модулями, так и командами разработки этих модулей, разве что должны быть data-контракты для общения между компонентами, если таковые требуются.  

### Почему это не может быть применено на Angular

На текущий момент Angular в версии `11.0.0`. Поддержки `webpack 5` в этой версии все еще нет.

Обойти это ограничение можно через подмену зависимости в yarn:

```json
"resolutions": {
  "webpack": "^5.0.0"
},
```

В инструментах сборки Angular используется 4 версия Webpack, по этому последствия могут быть неожиданными. Поддержка 5ой версии пока эксперементальная и production пока думать рано.

Можно пойти на компромисс и использовать следущее решение:

### Решение:

#### Загрузка удаленного модуля

Загрузка будет происходить в два этапа:

1. `loadRemoteEntry` — это загрузка удаленного модуля, все равно что если добавить `<script src="http://localhost:8090/remoteEntry.js" />` в `index.html`. Но сделано это для того, чтобы мы могли строить более гибкие решения и подгружать модули "на ходу".
2. `lookupExposedModule`— в этом методе мы примитивно эмулируем работу `WebpackFederationPlugin`. Создаем контейнер и решаем зависимости.

```ts
type Factory = () => any;

interface Container {
  init(shareScope: string): void;
  get(module: string): Factory;
}

export interface LoadRemoteModuleOptions {
  remoteEntry: string;
  remoteName: string;
  exposedModule: string;
  scopes: any;
}

const moduleMap = {};

function loadRemoteEntry(remoteEntry: string): Promise<void> {
  return new Promise<any>((resolve, reject) => {
    if (moduleMap[remoteEntry]) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = remoteEntry;
    script.onerror = reject;
    script.onload = (): void => {
      moduleMap[remoteEntry] = true;
      resolve();
    };

    document.body.append(script);
  });

  async function lookupExposedModule<T>(
  remoteName: string,
   exposedModule: string,
   scopes: any
  ): Promise<T> {
    const container = window[remoteName] as Container;
    await container.init(scopes as any);
    const factory = await container.get(exposedModule);
    const Module = factory();
    return Module as T;
  }
}

export async function loadRemoteModule<T = any>(
options: LoadRemoteModuleOptions
): Promise<T> {
  await loadRemoteEntry(options.remoteEntry);
  return await lookupExposedModule<T>(
    options.remoteName,
    options.exposedModule,
    options.scopes
  );
}
```

#### Пример компонента для рендеринга React

После того как модуль загрузился через `loadRemoteModule`, уже можно приступать к рендерингу. По факту мы имеем полноценный React-комопонент. И работать с ним мы можем в React. По этому создадим контейнер и императивно подготовим минимальную среду для этого компонента. 

```ts
import { AfterViewInit, Component, Input } from '@angular/core';
import { loadRemoteModule, LoadRemoteModuleOptions } from './plugins/federation-utils';

import React, { Suspense } from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';

@Component({
  selector: 'app-remote-component-wrapper',
  template: '<div [attr.id]="id"></div>'
})
export class AppRemoteComponentWrapper implements AfterViewInit {
  @Input() options: LoadRemoteModuleOptions;
  @Input() id: string;
  
  public async ngAfterViewInit(): Promise<void> {
    const component = await loadRemoteModule(this.options);
    const children = React.createElement(BrowserRouter, null, 
                                        React.createElement(Suspense, {fallback: React.createElement('div', null, 'Loading')},
                                                           React.createElement(component.default)));
    ReactDOM.render(children, document.getElementById(this.id))
  }
}

```

` React.createElement(component.default)` — создание элемента React с удаленным модулем.

#### Пример конфигурации

Необходимо установить зависимости, которые были указаны в приложении поставщике как общие.

```json
"dependencies": {
  "react": "16.13.1",
  "react-dom": "16.13.1",
  "react-router-dom": "5.2.0"
}
```

Конфигурация каждого модуля состоит из 4 пунктов:

1. `remoteEntry` — путь до удаленного модуля, модуля приложения-поставщика
2. `remoteName` — имя модуля, которое было указано при экспорте
3. `exposedModule` — название модуля, или название компонента
4. `scopes` — это общие модули. Обычно они указывают на один и тот же модуль в каждой сборке, например, на одну и ту же библиотеку.

```ts

import * as react from "react";
import * as reactDom from "react-dom";
import * as reactRouterDom from "react-router-dom";

...

optionsRemoteButton = {
  remoteEntry: 'http://localhost:3001/remoteEntry.js',
  remoteName: 'RemoteModule',
  exposedModule: './AnyComponent',
  scopes: this.scopes
}

public readonly scopes = {
  react: {
    "16.13.1": {
      from: "react-remote-app",
      get: (): any => (): any => react
    }
  },
  "react-dom": {
    "16.13.1": {
      from: "react-remote-app",
      get: (): any => (): any => reactDom
    }
  },
  "react-router-dom": {
    "5.2.0": {
      from: "react-remote-app",
      get: (): any => (): any => reactRouterDom
    }
  }
};
```

Важно, инициализировать get с двойной вложенностью функций, где последняя возвращает зависимость. Так под капотом `Webpack Federation` инициализирует контейнер с заисимостями.

#### Пример конфигурации приложения поставщика

Ниже представленн webpack-конфиг Federation Plugin'а для удаленного React-приложения которое динамически подгружается в Angular. 

```js
...
plugins: [
  new ModuleFederationPlugin({
    name: "consumer",
    library: {type: "var", name: "RemoteModule"},
    filename: "remoteEntry.js",
    exposes: {
      "./AnyComponent": "./src/AnyComponent"
    },
    shared: {
      react: {
        eager: true
      },
      'react-dom': {
        eager: true
      },
      'react-dom-router': {
        eager: true
      }
    }
  })
]
```

### Заключение

Таким нехитрым способом можем отрендерить React модули в Angular приложении, без подмены webpack-зависимостей и его конфигурации. Данный пример можно доработать, например, добавить общение с компонентом через  `ref` или  пробросить `props`.

Этим методом мы также можем подругзить и модули других типов приложений, в том числе и Angular. Можем делиться целыми страницами и загружать в `Router` через `loadChildren`.

Будем надеяться, что скоро `webpack 5` официально будет добавлен в Angular c нативной конфигурацией в`angular.json`, без лишних движений.

