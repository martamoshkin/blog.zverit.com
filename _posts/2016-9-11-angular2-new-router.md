---
layout: post
title:  "Миграция Angular2 на новый Router 3.0"
date:   2016-09-11 04:53:10 +0300
image: "/assets/angular2-router.png"
author: "Artamoshkin Maxim"
category: Frontend
tags: [Angular2, TypeScript, Router]
---
<img class="post-logo" src="https://blog.zverit.com/assets/angular2-router.png" alt="Angular2 router" />


Во время альфа и бета версий Angular2 router-deprecated вполне справлялся со своими задачами. С появлением RC1 вышел и переработанный 
router 2.0, затем в вериси RC2 снова выходит новая версия роутера — 3.0. Полная его переработка была связана с тем, что возникли серьезные
проблемы, такие как глубокая линковка в lazy-loaded секциях. 
Итак, рассмотрим основные изменения.
<!-- more -->

<br>

<h3>Импортирование</h3>
Раньше было так:

```ts
//old
import { RouteConfig, ROUTER_DIRECTIVES } from '@angular/router-deprected';
```

Теперь так:

```ts
//new
import { Routes, RouterModule }   from '@angular/router';
```

Также в ``boot.ts`` заменяем определение ``ROUTER_PROVIDERS``

С ``router-deprecated`` выглядело так:

```ts
// old boot.ts
import { ROUTER_PROVIDERS } from '@angular/router-deprecated';
import { AppComponent } from './components/app/app.component';

bootstrap(AppComponent, [
  ROUTER_PROVIDERS
]);
```

Теперь должно выглядить следующим образом

```ts
// new boot.ts
import { APP_ROUTER_PROVIDER } from './routes';
import { AppComponent } from './components/app/app.component';

bootstrap(AppComponent, [
  APP_ROUTER_PROVIDER
]);
```

<h3>Конфигурация</h3>

```ts
//old
import { Component } from '@angular/core';
import { RouteConfig, ROUTER_DIRECTIVES } from '@angular/router-deprected';

import { ActionsComponent } from './components/actions.component';
import { BooActionComponent } from '../actions/boo-actions.component';

@RouteConfig([
  {
    path: '/',
    name: 'Actions',
    component: ActionsComponent,
    useAsDefault: true
  },
  {
    path: '/boo/:id',
    name: 'BooAction',
    component: HeroDetailComponent
  }
])
@Component({
  selector: 'action-app',
  template: '<router-outlet></router-outlet>',
  directives: [ROUTER_DIRECTIVES]
})
export class AppComponent {}
```

Новый роутер теперь не привязан к какому либо компоненту, и теперь выступает в роли провайдера. 

```ts
//new routes.ts
import { provideRouter, RouterConfig } from '@angular/router';

import { ActionsComponent } from './components/actions.component';
import { HeroDetailComponent } from './components/actions/boo-actions.component';

export const appRoutes: RouterConfig = [
  { path: '', component: BooComponent, terminal: true },
  { path: 'boo/:id', component: BooActionComponent }
];

export const APP_ROUTER_PROVIDER = provideRouter(appRoutes);
```

Роутер все также биндится к ``<router-outlet></router-outlet>``, но необходимость в декораторе ``@RouteConfig`` отпала.
При определении пути теперь не нужно писать его имя, и сам путь пишется без слеша в начале. 

<h3> Привязка к маршрутам </h3>

```html
<a [routerLink]="['/Home']">Home</a>
<a [routerLink]="['/Boo', { id: 1 }]">Boo</a>
```

Мы видим, что каждый путь устанавливался по его имени и передаваемым в него параметрам, в виде объекта.
В новом же роутере идентифицируется по пути, без начального слеша, и параметр передается без объекта.

```html
<a [routerLink]="['']">Home</a>
<a [routerLink]="['boo', 1]">Boo</a>
```

Те же самые изменения потерпел вызов ``navigate``.

```ts
//old
this._router.navigate(['Error',{ error: 404 }]);
```

```ts
//new
this.router.navigate(['error', 404]);
```

<h3>Доступ к параметрам пути</h3>

```ts
//old components/actions/boo-action.component.ts
import { Component, OnInit } from '@angular/core';
import { RouteParams } from '@angular/router-deprected';

import { BooService } from '../../services/boo.service'

@Component({ ... })
export class BooActionComponent implements OnInit {
  constructor(private params: RouteParams, private booService: BooService) {}

  ngOnInit() {
    this.booService.getBoo(
      this.params.get('id')
    ).subscribe(boo => this.boo = boo);
  }
}
```

Во-первых, ``RouteParams`` был заменен на ``ActivatedRoute``.
Во-вторых, свойство ``params`` теперь выступает как ``observable``, и получить значения можно только через коллбэк.

```ts
//new components/actions/boo-action.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { BooService } from '../../services/boo.service'

@Component({ ... })
export class BooActionComponent implements OnInit, OnDestroy {
  public boo: string
  private booSubscription: Subscription
  
  constructor(private route: ActivatedRoute, private booService: BooService) {}

  ngOnInit() {
    this.booSubscription = this.route.params
      .map(params => params.id)
      .flatMap(id => this.booService.getBoo(id))
      .subscribe(boo => this.boo = boo);
  }
  
  ngOnDestroy() {
    this.booSubscription.unsubscribe();
  }
}
```

Желательно подписываться в ``ngOnInit`` методе и отписываться в ``ngOnDestroy`` 

<h3>Защита путей</h3>

Проверки аутидентификации на старом роутере можно было добиться при помощи ``@CanActivate, @CanDeactivate`` декораторов.

```ts
// components/actions/boo-aciton.component.ts
import { Component } from '@angular/core';

import { CanActivate, ComponentInstruction } from '@angular/router-deprecated';

@Component({ ... })
@CanActivate((next: ComponentInstruction, prev: ComponentInstruction) => {
  return isAuthTokenValid();
})
export class BooActionComponent { ... }
```

В новом роутере это определено внутри конфигурации и доступно через DI. 

```ts
// auth-guard.ts
import { Injectable } from '@angular/core';
import {
  CanActivate,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot
} from '@angular/router';

import { AuthService } from './services/auth/auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    if (this.authService.isLoggedIn()) {
      return true;
    }

    this.router.navigate(['login']);
    return false;
  }
}
```

Можно просто сделать инъекцию ``AuthService`` и маршрутизатор сам направит пользователя на страницу входа.

```ts
// routes.ts
import { provideRouter, RouterConfig } from '@angular/router';

import { ActionsComponent } from './components/actions.component';
import { BooActionComponent } from './components/actions/boo-action.component';
import { LoginComponent } from './components/login/login.component';
import { AuthGuard } from './auth-guard';

export const appRoutes: RouterConfig = [
  { path: '', component: ActionsComponent, terminal: true },
  { path: 'boo/:id', component: BooActionComponent, canActivate: [AuthGuard] },
  { path: 'login', component: LoginComponent },
];

export const APP_ROUTER_PROVIDER = provideRouter(appRoutes);
```
