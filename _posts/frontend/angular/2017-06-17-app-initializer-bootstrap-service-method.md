---
title: Выполнение кода до старта приложения через APP_INITIALIZER
layout: post
date: '2017-06-17 15:05:11 +0300'
category: Frontend
author: "Artamoshkin Maxim"
redirect_from:
    - /frontend/2017/06/17/app-initializer-bootstrap-service-method/frontend
image: "/assets/before-start-rocket.png"
image_alt: "Выполнение кода до рендеринга приложения"
image_height: "auto"
tags:
- Angular
- APP_INITIALIZER
- SPA
- JavaScript
- TypeScript
description: "Зачастую в Single Page Application необходимо запускать код перед запуском всего приложения. К примеру, для начала нам нужно отправить HTTP запрос для получения конфигурации, применить ее и только потом запускать бизнес логику. К счастью, в Angular нам предоставили такую возможность..APP_INITIALIZER" 
---

Зачастую в Single Page Application необходимо запускать код перед запуском всего приложения. К примеру, для начала нам нужно отправить HTTP запрос для получения конфигурации, применить ее и только потом запускать бизнес логику. К счастью, в Angular нам предоставили такую возможность...

<!-- more -->

Angular предоставляет доступ к токену `APP_INITIALIZER`. Его определение находится в [https://github.com/angular/angular/blob/master/packages/core/src/application_init.ts](https://github.com/angular/angular/blob/master/packages/core/src/application_init.ts "https://github.com/angular/angular/blob/master/packages/core/src/application_init.ts"){:target="_blank"} 

```ts
export const APP_INITIALIZER = new InjectionToken<Array<() => void>>('Application Initializer');
```
Да, эта возможность, пока, экспериментальная, но пугаться не стоит - работает стабильно.

В этом же файле, ниже, определен класс `ApplicationInitStatus` который следит за выполнением `APP_INITIALIZER`. Заметим, в конструктор внедряется массив функций, которые в свою очередь могут выполняться как синхронно, так и асинхронно. Эти функции возвращают объект `Promise`, за которыми и следит этот класс, пока они не будут успешно выполнены, приложение не получит статус, что оно инициализировано. Так что можно быть уверенным, что данные будут вовремя и приложение не упадет с крахом. Но стоит помнить, что нагружать времязатратными операциями не стоит, ведь от этого хука зависит время выполнения первого старта.

И так, все предельно ясно. Как на счет практики?..

Да и тут все просто.

Определяется провайдер в коренном модуле (`app.module.ts`) и только тут.
```ts
{provide: APP_INITIALIZER, useValue: () => promise, multi: true}]}
```
где `promise` это любая наша функция.

На "живом примере" это будет выглядеть следующим образом.

```ts
// app.module.ts

export function loadConfig(config: AppConfig) => () => config.load()

@NgModule({
    declarations: [AppComponent],
    imports: [BrowserModule,
        appRoutes,
        FormsModule,
        HttpModule],
    providers: [AuthService,
        appRoutingProviders,
        AppConfig,
        { provide: APP_INITIALIZER,
          useFactory: loadConfig,
          deps: [AppConfig], 
          multi: true }
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
```

Не забывайте параметр `multi`. Так как `APP_INITIALIZER` является массивом функций, и этот параметр является обязательным для возможности добавления нового значения в этот массив.

Далее определить сервис `AppConfig` и функцию `load`, которую мы хотели бы вызвать при инициализации приложения.

```ts
// app.config.ts

@Injectable()
export class AppConfig {

    private _config: any;

    constructor(private http: Http) { }

    load(): Promise<any> {

        this._config = null;

        return this.http
            .get('REST_API_URL_FOR_LOAD_CONFIG')
            .map((res: Response) => res.json())
            .toPromise()
            .then((data: any) => this._config = data)
            .catch((err: any) => Promise.resolve());
    }

    get config(): any {
        return this._config;
    }
}
```
**Важно**, чтобы функция `load` возвращала `Promise`.
