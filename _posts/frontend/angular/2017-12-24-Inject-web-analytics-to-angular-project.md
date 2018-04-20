---
layout: post
title:  "Внедрение веб-аналитики в крупный Angular 2+ проект"
date:   2017-12-24 11:15:29 +0300
category: Frontend
author: "Artamoshkin Maxim"
redirect_from:
    - /frontend/2017/12/24/Inject-web-analytics-to-angular-project/frontend
image: "/assets/analytics.png"
image_alt: ""
tags: [Angular, Google Analytics, Tracking Events]
description: "В статье рассматривается проблема внедрения веб-аналитики в SPA приложения. Описывается простой способ для внедрения и сопровождения."
---

Казалось бы, ну что такое веб-аналитика, даже для SPA, - слушаем событие, событие сработало, описали трекинг-событие, отправили провайдеру аналитики. А что, если:
- в приложении сотни слабосвязных компонента;
- несколько провайдеров аналитики;
- SEO отдел часто запрашивает новые метрики или корректирует старые;
<!-- more -->


Столкнувшись с подобной ситуацией, попросил *Best Practice* у поисковика, и к большому удивлению, как такового не обнаружил. Было предложено два основных решения:
- Использовать ``Angularitics2``;
- Отправлять после непосредственного описания и привязки событий.  

Причем оба способа похожи друг на друга, отличается лишь тем, что ``Anugularitics`` для описания события использует директивы. По моему мнению, подобный подход сильно засоряет код, связывает руки SEO отделу и очень подвержен ошибкам в описании категорий, меток и действий.


Далее постараюсь описать более универсальный и гибкий подход.

### Хранение событий ###
Описание событий будет храниться отдельно от кода приложения, в директории ``assets`` в формате *.json*. Это позволит "развязать руки" разработчику и предоставить их персоналу ответственного за аналитику. Также, никто не мешает положить этот список в базу данных и редактировать посредством админ-инструментов.

События описываются как объекты, со всеми необходимыми, для провайдеров аналитики, полями.

```ts
"LOGIN": {
    "label": "Login",
    "category": "Navigation",
    "action": "Click"
  },
  "LOGOUT": {
    "label": "Logout",
    "category": "Navigation",
    "action": "Click"
  }
```

Под который может быть написан следующий интерфейс.

```ts
export interface ITrackingEvent {
    label?: string;
    category: string;
    action: string;
    value?: string;
    page?: string;
    noninteraction?: string;
}
```

Имеют место быть и другие поля, кроме ``category`` и ``action``, они обязательно должны содержать значение.

### Загрузка списка событий ###
Загрузка событий выполняется до старта приложения, через токен ``APP_INITIALIZER``, про который я уже писал *[здесь](https://blog.zverit.com/frontend/2017/06/17/app-initializer-bootstrap-service-method/ "Выполнение кода до старта приложения через APP_INITIALIZER"){:target="_blank"}*. 

```ts
    providers: [
        ...,
        {
            provide: APP_INITIALIZER,
            useFactory: appTrackingInitializer,
            deps: [EventsService],
            multi: true
        }
    ]

export function appTrackingInitializer(eventsService: EventsService) {
    return () => eventsService.load();
}
```

В ``EventsService`` опишем фукнцию, которая загружает список событий для трекинга. Хочу заметить, что при неудачном запросе лучше вызвать ``resolve(this);`` так как это не столько важный функционал, но от выполнения этого *Promise* зависит запуск всего приложения. А загрузка может потерпеть неудачу, как минимум от плагина *AdBlock*, с включенным режимом анонимности. 

```ts
@Injectable()
export class EventsService {
    private _events: any;

    constructor(private _http: Http) {
    }

    public getItem(key: any): ITrackingEvent {
        return this._events[key];
    }

    public load(): Promise<any> {
        return new Promise((resolve, reject) => {
            this._http.get(PATH_TO_ASSETS + 'events.json')
                .map((res) => res.json())
                .catch((error: any) => {
                    resolve(this);
                    return Observable.throw(error);
                })
                .subscribe(
                    (responseData) => {
                        this._events = responseData;
                        resolve(this);
                    },
                    (err) => resolve(this)
                );
        });
    }
}
```

### Подключение трекинг провайдеров ###
``TrackingService`` центральный сервис трекинга событий. Его задачей является прием события и оповещение о нем всем провайдерам аналитики.

```ts
@Injectable()
export class TrackingService {
    constructor(private _router: Router,
                private _googleAnalyticsService: GoogleAnalyticsService,
                private _googleTagManagerService: GoogleTagManagerService,
                private _eventsService: EventsService) {
    }

    public eventTrack(eventName: string): void {
        let event: ITrackingEvent = this._eventsService.getItem(eventName);
        if (!event) {
            return;
        }

        this._googleAnalyticsService.eventTrack(event);
        this._googleTagManagerService.eventTrack(event);
    }

    public startLocationTracking(): void {
        this._router.events
            .filter((event) => event instanceof NavigationEnd)
            .subscribe((event: NavigationEnd) => {
                let url = event.urlAfterRedirects;
                this._googleAnalyticsService.pageTrack(url);
                this._googleTagManagerService.pageTrack(url);
            });
    }
}
```

К примеру, сервис для *Google Analytics* формирует событие под свой формат, затем отправляет на сервер аналитики. 

```ts
declare let ga: any;

@Injectable()
export class GoogleAnalyticsService {
    public isInit = typeof ga !== 'undefined';

    constructor(private _router: Router) {
    }

    public eventTrack(event: ITrackingEvent): void {
        if (this.isInit) {
            let eventOptions = {
                eventCategory: event.category || 'Event',
                eventAction: event.action,
                eventLabel: event.label,
                eventValue: event.value,
                nonInteraction: event.noninteraction,
                page: event.page || location.hash.substring(1) || location.pathname,
            };
            ga('send', 'event', eventOptions);
        }
    }

    public pageTrack(path: string): void {
        if (this.isInit) {
            ga('send', 'pageview', path);
        }
    }
}
```

### Трекинг-директива ###
Директива создана для удобства отправки событий, без внедрения трекинг-сервиса в компоненты. Директива всего лишь слушает события от управляющего элемента и по его возникновению обращается к трекинг сервису с названием события, которое указано в качестве атрибута.

```ts
@Directive({
    selector: '[appEventTrack]'
})
export class EventTrackingDirective {
    @Input() public appEventTrack: string | string[];

    constructor(private _trackingService: TrackingService) {
    }

    @HostListener('click', ['$event'])
    public onClick($event): void {
        let sendEventFn = (e) => this._trackingService.eventTrack(e);

        if (Array.isArray(this.appEventTrack)) {
            this.appEventTrack.map((e) => sendEventFn(e));
            return;
        }

        sendEventFn(this.appEventTrack);
    }
}
```

Директиву также можно расширить для большего числа пользовательских событий.

### Использование ###

Описание через директиву атрибут. Подходит для простых событий от управляющих элементов, такие как клики по кнопкам, навигация, практически все, что связано с пользовательским интерфейсом.

```html
<button [appEventTrack]=”’LOGOUT’”> Logout </button>
```


Непосредственное обращение к ``TrackingService``.  Этот способ подходит для более сложных событий, к примеру пользователь пытался зайти на свой профиль не авторизованным и сервер ответил *401* статус-кодом.

```ts
this._trackingService.eventTrack('UNAUTHORIZED');
```